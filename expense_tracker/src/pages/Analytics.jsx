import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { AlertTriangle, TrendingUp, TrendingDown, HandCoins, ArrowRight, Download, Settings, X, PieChart as PieChartIcon } from 'lucide-react';
import Toast from '../components/Toast';
import { formatCurrency } from '../lib/utils';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const ALL_CATEGORIES = ['Bills', 'Food', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Other'];

function getMonthKeyLocal(dateStr) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function Analytics() {
    const { transactions, currentMonth, currentMonthKey, getMonthlyData, budgetLimits, setBudgetLimit, categorySpending, isWarning, repayments, peopleData } = useExpenses();
    const [timeView, setTimeView] = useState('daily');
    const [showBudgetSettings, setShowBudgetSettings] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const [editingBudget, setEditingBudget] = useState({});
    const [toast, setToast] = useState(null);
    const [shakenCategories, setShakenCategories] = useState(new Set());
    const prevSpendingRef = useRef({});

    // Budget alert check
    useEffect(() => {
        Object.entries(budgetLimits).forEach(([cat, limit]) => {
            const spent = categorySpending[cat] || 0;
            const pct = (spent / limit) * 100;
            const prevSpent = prevSpendingRef.current[cat] || 0;
            const prevPct = limit > 0 ? (prevSpent / limit) * 100 : 0;

            if (pct >= 80 && prevPct < 80 && pct < 100) {
                setToast({ message: `\u26A0\uFE0F ${cat} is at ${Math.round(pct)}% of your budget`, type: 'warning' });
                setShakenCategories(prev => new Set(prev).add(cat));
                setTimeout(() => setShakenCategories(prev => { const n = new Set(prev); n.delete(cat); return n; }), 600);
            }
        });
        prevSpendingRef.current = { ...categorySpending };
    }, [categorySpending, budgetLimits]);

    const currentMonthExpenses = useMemo(() =>
        transactions.filter(t => t.type === 'expense' && getMonthKeyLocal(t.date) === currentMonthKey),
        [transactions, currentMonthKey]);

    const prevMonthKey = useMemo(() => {
        const [year, month] = currentMonthKey.split('-').map(Number);
        const d = new Date(year, month - 2, 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }, [currentMonthKey]);
    const prevMonth = useMemo(() => getMonthlyData(prevMonthKey), [getMonthlyData, prevMonthKey]);

    const prevMonthName = useMemo(() => {
        const [year, month] = prevMonthKey.split('-').map(Number);
        return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short' });
    }, [prevMonthKey]);

    const currentMonthName = useMemo(() => {
        const [year, month] = currentMonthKey.split('-').map(Number);
        return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short' });
    }, [currentMonthKey]);

    const currentMonthFullName = useMemo(() => {
        const [year, month] = currentMonthKey.split('-').map(Number);
        return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }, [currentMonthKey]);

    const highExpenses = useMemo(() => {
        if (currentMonthExpenses.length < 5) return [];
        const total = currentMonthExpenses.reduce((sum, t) => sum + t.amount, 0);
        const avg = total / currentMonthExpenses.length;
        return currentMonthExpenses
            .filter(t => t.amount > avg * 2)
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 3);
    }, [currentMonthExpenses]);

    const chartData = useMemo(() => {
        const now = new Date();
        const data = [];

        if (timeView === 'daily') {
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                const total = currentMonthExpenses
                    .filter(t => t.date.startsWith(dateStr))
                    .reduce((sum, t) => sum + t.amount, 0);
                data.push({ name: dayName, fullDate: dateStr, value: total });
            }
        } else if (timeView === 'weekly') {
            for (let i = 3; i >= 0; i--) {
                const start = new Date(now);
                start.setDate(start.getDate() - (i * 7) - now.getDay());
                const end = new Date(start);
                end.setDate(end.getDate() + 6);

                const total = currentMonthExpenses.filter(t => {
                    const tDate = new Date(t.date);
                    return tDate >= start && tDate <= end;
                }).reduce((sum, t) => sum + t.amount, 0);

                data.push({ name: `W${4 - i}`, value: total, range: `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}` });
            }
        } else {
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthStr = d.toISOString().slice(0, 7);
                const monthName = d.toLocaleDateString('en-US', { month: 'short' });
                const total = transactions
                    .filter(t => t.type === 'expense' && t.date.startsWith(monthStr))
                    .reduce((sum, t) => sum + t.amount, 0);
                data.push({ name: monthName, value: total });
            }
        }
        return data;
    }, [currentMonthExpenses, transactions, timeView]);

    const categoryData = useMemo(() => {
        return currentMonthExpenses.reduce((acc, curr) => {
            const existing = acc.find(item => item.name === curr.category);
            if (existing) {
                existing.value += curr.amount;
            } else {
                acc.push({ name: curr.category, value: curr.amount });
            }
            return acc;
        }, []);
    }, [currentMonthExpenses]);

    const spendingDiff = currentMonth.expenses - prevMonth.expenses;
    const spendingUp = spendingDiff > 0;

    const handleSaveBudgets = () => {
        Object.entries(editingBudget).forEach(([cat, val]) => {
            const num = parseFloat(val);
            setBudgetLimit(cat, isNaN(num) ? 0 : num);
        });
        setShowBudgetSettings(false);
        setEditingBudget({});
    };

    const handleExportCSV = useCallback(() => {
        const headers = ['Date', 'Name', 'Type', 'Amount', 'Category', 'Mode', 'Note', 'Person'];
        const rows = transactions.map(t => [
            new Date(t.date).toLocaleDateString(),
            t.name || '',
            t.type,
            t.amount.toFixed(2),
            t.category || '',
            t.paymentMode || '',
            t.note || '',
            t.personName || ''
        ]);

        const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `my-den-transactions-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        setShowExport(false);
    }, [transactions]);

    const handleExportMonthlyPDF = useCallback(async () => {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text(`My Den - ${currentMonthFullName} Summary`, 20, 25);

        doc.setFontSize(12);
        let y = 45;

        doc.text(`Opening Balance (Carry-over): Rs.${currentMonth.carryOver.toFixed(2)}`, 20, y); y += 10;
        doc.text(`Income: Rs.${currentMonth.income.toFixed(2)}`, 20, y); y += 10;
        doc.text(`Expenses: Rs.${currentMonth.expenses.toFixed(2)}`, 20, y); y += 10;
        doc.text(`Lent Out: Rs.${currentMonth.lent.toFixed(2)}`, 20, y); y += 10;
        doc.text(`Repayments Received: Rs.${currentMonth.repayments.toFixed(2)}`, 20, y); y += 10;
        doc.text(`Closing Balance: Rs.${currentMonth.balance.toFixed(2)}`, 20, y); y += 15;

        doc.setFontSize(14);
        doc.text('Expenses by Category:', 20, y); y += 10;
        doc.setFontSize(11);

        categoryData.forEach(cat => {
            doc.text(`  ${cat.name}: Rs.${cat.value.toFixed(2)}`, 20, y); y += 8;
        });

        doc.save(`my-den-${currentMonthKey}-summary.pdf`);
        setShowExport(false);
    }, [currentMonth, currentMonthKey, currentMonthFullName, categoryData]);

    const handleExportLendingPDF = useCallback(async () => {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text('My Den - Lending Report', 20, 25);

        let y = 45;
        doc.setFontSize(12);

        if (peopleData.length === 0) {
            doc.text('No lending records found.', 20, y);
        } else {
            peopleData.forEach(person => {
                doc.setFontSize(13);
                doc.text(`${person.name} ${person.isSettled ? '(Settled)' : ''}`, 20, y); y += 8;
                doc.setFontSize(11);
                doc.text(`  Total Lent: Rs.${person.totalLent.toFixed(2)}`, 20, y); y += 7;
                doc.text(`  Total Repaid: Rs.${person.totalRepaid.toFixed(2)}`, 20, y); y += 7;
                doc.text(`  Outstanding: Rs.${Math.max(0, person.outstanding).toFixed(2)}`, 20, y); y += 12;

                if (y > 270) { doc.addPage(); y = 20; }
            });
        }

        doc.save('my-den-lending-report.pdf');
        setShowExport(false);
    }, [peopleData]);

    const handleExportCategoryPDF = useCallback(async () => {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text(`My Den - Category Breakdown (${currentMonthFullName})`, 20, 25);

        let y = 45;
        doc.setFontSize(12);

        const total = categoryData.reduce((s, c) => s + c.value, 0);

        categoryData.sort((a, b) => b.value - a.value).forEach(cat => {
            const pct = total > 0 ? ((cat.value / total) * 100).toFixed(1) : 0;
            doc.text(`${cat.name}: Rs.${cat.value.toFixed(2)} (${pct}%)`, 20, y); y += 10;
        });

        y += 5;
        doc.text(`Total: Rs.${total.toFixed(2)}`, 20, y);

        doc.save(`my-den-category-${currentMonthKey}.pdf`);
        setShowExport(false);
    }, [categoryData, currentMonthKey, currentMonthFullName]);

    const getBudgetColor = (pct) => {
        if (pct >= 100) return 'bg-red-500';
        if (pct >= 80) return 'bg-amber-500';
        return 'bg-green-500';
    };

    return (
        <div className="p-6 space-y-6 pb-24">
            {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}

            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-nature-900 mb-0.5">Insights</h1>
                    <p className="text-nature-700 text-xs">Analyze your territory</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setEditingBudget({ ...budgetLimits });
                            setShowBudgetSettings(true);
                        }}
                        className="p-2.5 bg-white/60 backdrop-blur rounded-xl border border-sand hover:bg-nature-100/50 transition-all"
                        title="Budget Settings"
                    >
                        <Settings className="w-4 h-4 text-nature-700" />
                    </button>
                    <button
                        onClick={() => setShowExport(true)}
                        className="p-2.5 bg-white/60 backdrop-blur rounded-xl border border-sand hover:bg-nature-100/50 transition-all"
                        title="Export"
                    >
                        <Download className="w-4 h-4 text-nature-700" />
                    </button>
                </div>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/60 backdrop-blur-md rounded-2xl p-3.5 border-l-4 border-l-red-400 border border-white/50">
                    <div className="text-[9px] text-nature-600 uppercase tracking-wider font-bold mb-1">Spent this month</div>
                    <div className="font-bold text-lg font-serif text-nature-900">{formatCurrency(currentMonth.expenses)}</div>
                    <div className={`flex items-center gap-1 mt-1 text-[10px] font-bold ${spendingUp ? 'text-red-600' : 'text-green-600'}`}>
                        {spendingUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {formatCurrency(Math.abs(spendingDiff))} vs {prevMonthName}
                    </div>
                </div>

                <div className="bg-white/60 backdrop-blur-md rounded-2xl p-3.5 border-l-4 border-l-green-400 border border-white/50">
                    <div className="text-[9px] text-nature-600 uppercase tracking-wider font-bold mb-1">Income vs Spent</div>
                    <div className="font-bold text-lg font-serif text-green-700">{formatCurrency(currentMonth.income)}</div>
                    <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-nature-500">
                        <ArrowRight className="w-3 h-3" />
                        {formatCurrency(currentMonth.expenses)} spent
                    </div>
                </div>

                <div className="bg-white/60 backdrop-blur-md rounded-2xl p-3.5 border-l-4 border-l-blue-400 border border-white/50">
                    <div className="text-[9px] text-nature-600 uppercase tracking-wider font-bold mb-1">Carry-over</div>
                    <div className={`font-bold text-lg font-serif ${currentMonth.carryOver >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {formatCurrency(currentMonth.carryOver)}
                    </div>
                    <div className="text-[10px] text-nature-400 mt-1">From previous months</div>
                </div>

                <div className="bg-amber-50/60 backdrop-blur-md rounded-2xl p-3.5 border-l-4 border-l-amber-400 border border-amber-200/30">
                    <div className="text-[9px] text-amber-700 uppercase tracking-wider font-bold mb-1 flex items-center gap-1">
                        <HandCoins className="w-3 h-3" /> Lent
                    </div>
                    <div className="font-bold text-lg font-serif text-amber-800">{formatCurrency(currentMonth.lent)}</div>
                    <div className="text-[10px] text-amber-500 mt-1">Not counted as expense</div>
                </div>
            </div>

            {/* Time Range Selector */}
            <div className="flex bg-nature-100/50 p-1.5 rounded-2xl border border-nature-100">
                {['daily', 'weekly', 'monthly'].map((v) => (
                    <button
                        key={v}
                        onClick={() => setTimeView(v)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${timeView === v
                            ? 'bg-nature-800 text-cream shadow-md'
                            : 'text-nature-700 hover:bg-nature-200/50'
                        }`}
                    >
                        {v}
                    </button>
                ))}
            </div>

            {/* Unusual Spending Alert */}
            {highExpenses.length > 0 && (
                <div className="bg-orange-50 border-2 border-orange-100 rounded-[2rem] p-5">
                    <div className="flex items-center gap-3 mb-3 text-orange-800">
                        <div className="p-2 bg-orange-100 rounded-full">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-base">Wild Spending!</span>
                    </div>
                    <div className="space-y-2">
                        {highExpenses.map(t => (
                            <div key={t.id} className="flex justify-between items-center text-sm text-orange-900 bg-white p-3 rounded-xl shadow-sm border border-orange-100">
                                <span className="font-medium">{t.name || t.category}</span>
                                <span className="font-bold">{formatCurrency(t.amount)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Bar Chart */}
            <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-sand">
                <h2 className="text-base font-bold text-nature-900 mb-4 font-serif capitalize">
                    {timeView} Spending {timeView !== 'monthly' ? `(${currentMonthName})` : ''}
                </h2>
                <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6e2d3" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#8d6e63', fontSize: 11 }}
                                dy={10}
                            />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={(val) => formatCurrency(val)} />
                            <Tooltip
                                formatter={(val) => formatCurrency(val)}
                                cursor={{ fill: '#f4f1ea' }}
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="value" fill={isWarning ? 'var(--theme-accent-800)' : '#2d4a3e'} radius={[8, 8, 8, 8]} barSize={28} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Pie Chart with Budget Progress */}
            {categoryData.length > 0 && (
                <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-sand">
                    <h2 className="text-base font-bold text-nature-900 mb-3 font-serif">Prey Breakdown ({currentMonthName})</h2>
                    <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={75}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `${formatCurrency(value)}`} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                <Legend iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Budget Progress Bars */}
                    {Object.keys(budgetLimits).length > 0 && (
                        <div className="mt-5 space-y-3">
                            <h3 className="text-xs font-bold text-nature-600 uppercase tracking-wider">Budget Tracking</h3>
                            {categoryData.map(cat => {
                                const limit = budgetLimits[cat.name];
                                if (!limit) return null;
                                const pct = Math.min((cat.value / limit) * 100, 120);
                                const exceeded = pct >= 100;

                                return (
                                    <div
                                        key={cat.name}
                                        className={`${shakenCategories.has(cat.name) ? 'animate-shake' : ''}`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold text-nature-800 flex items-center gap-1.5">
                                                {cat.name}
                                                {exceeded && (
                                                    <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold">OVER</span>
                                                )}
                                            </span>
                                            <span className="text-[10px] text-nature-500 font-medium">
                                                {formatCurrency(cat.value)} / {formatCurrency(limit)}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-nature-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${getBudgetColor(pct)}`}
                                                style={{ width: `${Math.min(pct, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Budget Settings Modal */}
            {showBudgetSettings && (
                <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4">
                    <div className="absolute inset-0 bg-nature-900/60 backdrop-blur-sm animate-backdrop-in" onClick={() => setShowBudgetSettings(false)} />
                    <div className="relative z-10 bg-cream w-full max-w-sm rounded-[1.5rem] p-5 shadow-2xl border border-sand animate-modal-up max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-xl font-serif font-bold text-nature-900">Budget Limits</h2>
                            <button onClick={() => setShowBudgetSettings(false)} className="p-2 hover:bg-nature-100 rounded-full">
                                <X className="w-5 h-5 text-nature-800" />
                            </button>
                        </div>
                        <p className="text-xs text-nature-600 mb-4">Set monthly spending limits per category. Leave empty or 0 to remove.</p>
                        <div className="space-y-3">
                            {ALL_CATEGORIES.map(cat => (
                                <div key={cat} className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-nature-800 w-28">{cat}</span>
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-nature-400 text-sm font-bold">{'\u20B9'}</span>
                                        <input
                                            type="number"
                                            value={editingBudget[cat] ?? budgetLimits[cat] ?? ''}
                                            onChange={(e) => setEditingBudget(prev => ({ ...prev, [cat]: e.target.value }))}
                                            className="w-full pl-7 pr-3 py-2.5 bg-white border-2 border-sand rounded-xl text-sm font-bold text-nature-900 placeholder:text-nature-300 focus:ring-2 focus:ring-nature-100 focus:border-nature-800"
                                            placeholder="No limit"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={handleSaveBudgets}
                            className="w-full mt-5 py-3 bg-nature-800 text-cream rounded-2xl font-bold hover:bg-nature-900 active:scale-[0.98] transition-all"
                        >
                            Save Budgets
                        </button>
                    </div>
                </div>
            )}

            {/* Export Sheet */}
            {showExport && (
                <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4">
                    <div className="absolute inset-0 bg-nature-900/60 backdrop-blur-sm animate-backdrop-in" onClick={() => setShowExport(false)} />
                    <div className="relative z-10 bg-cream w-full max-w-sm rounded-[1.5rem] p-5 shadow-2xl border border-sand animate-modal-up">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-xl font-serif font-bold text-nature-900">Export Data</h2>
                            <button onClick={() => setShowExport(false)} className="p-2 hover:bg-nature-100 rounded-full">
                                <X className="w-5 h-5 text-nature-800" />
                            </button>
                        </div>
                        <div className="space-y-2.5">
                            <button onClick={handleExportCSV} className="w-full p-4 bg-white/70 rounded-2xl border border-sand text-left hover:bg-nature-100/50 transition-all group">
                                <div className="font-bold text-sm text-nature-900">CSV - All Transactions</div>
                                <div className="text-[11px] text-nature-500 mt-0.5">Download complete transaction history</div>
                            </button>
                            <button onClick={handleExportMonthlyPDF} className="w-full p-4 bg-white/70 rounded-2xl border border-sand text-left hover:bg-nature-100/50 transition-all group">
                                <div className="font-bold text-sm text-nature-900">Monthly PDF Summary</div>
                                <div className="text-[11px] text-nature-500 mt-0.5">{currentMonthFullName} financial statement</div>
                            </button>
                            <button onClick={handleExportLendingPDF} className="w-full p-4 bg-white/70 rounded-2xl border border-sand text-left hover:bg-nature-100/50 transition-all group">
                                <div className="font-bold text-sm text-nature-900">Lending Report (PDF)</div>
                                <div className="text-[11px] text-nature-500 mt-0.5">Per-person lending & repayment breakdown</div>
                            </button>
                            <button onClick={handleExportCategoryPDF} className="w-full p-4 bg-white/70 rounded-2xl border border-sand text-left hover:bg-nature-100/50 transition-all group">
                                <div className="font-bold text-sm text-nature-900">Category Breakdown (PDF)</div>
                                <div className="text-[11px] text-nature-500 mt-0.5">Category-wise expense totals for {currentMonthFullName}</div>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
