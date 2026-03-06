import { useState, useMemo } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { AlertTriangle, TrendingUp, TrendingDown, HandCoins, ArrowRight } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

function getMonthKeyLocal(dateStr) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function Analytics() {
    const { transactions, currentMonth, currentMonthKey, getMonthlyData } = useExpenses();
    const [timeView, setTimeView] = useState('daily');

    // Only personal expenses (not lent)
    const currentMonthExpenses = useMemo(() =>
        transactions.filter(t => t.type === 'expense' && getMonthKeyLocal(t.date) === currentMonthKey),
        [transactions, currentMonthKey]);

    // Previous month data for comparison
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

    // High expense detection (current month only)
    const highExpenses = useMemo(() => {
        if (currentMonthExpenses.length < 5) return [];
        const total = currentMonthExpenses.reduce((sum, t) => sum + t.amount, 0);
        const avg = total / currentMonthExpenses.length;
        return currentMonthExpenses
            .filter(t => t.amount > avg * 2)
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 3);
    }, [currentMonthExpenses]);

    // Chart Data (respects current month boundary)
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

    // Category Data (current month expenses only)
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

    return (
        <div className="p-6 space-y-6 pb-24">
            <header>
                <h1 className="text-xl font-bold text-nature-900 mb-0.5">Insights</h1>
                <p className="text-nature-700 text-xs">Analyze your territory</p>
            </header>

            {/* Monthly Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
                {/* This Month vs Last Month */}
                <div className="bg-white/60 backdrop-blur-md rounded-2xl p-3.5 border border-white/50">
                    <div className="text-[9px] text-nature-600 uppercase tracking-wider font-bold mb-1">Spent this month</div>
                    <div className="font-bold text-lg font-serif text-nature-900">{'\u20B9'}{currentMonth.expenses.toFixed(0)}</div>
                    <div className={`flex items-center gap-1 mt-1 text-[10px] font-bold ${spendingUp ? 'text-red-600' : 'text-green-600'}`}>
                        {spendingUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {'\u20B9'}{Math.abs(spendingDiff).toFixed(0)} vs {prevMonthName}
                    </div>
                </div>

                {/* Salary In vs Spent */}
                <div className="bg-white/60 backdrop-blur-md rounded-2xl p-3.5 border border-white/50">
                    <div className="text-[9px] text-nature-600 uppercase tracking-wider font-bold mb-1">Income vs Spent</div>
                    <div className="font-bold text-lg font-serif text-green-700">{'\u20B9'}{currentMonth.income.toFixed(0)}</div>
                    <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-nature-500">
                        <ArrowRight className="w-3 h-3" />
                        {'\u20B9'}{currentMonth.expenses.toFixed(0)} spent
                    </div>
                </div>

                {/* Carry-over */}
                <div className="bg-white/60 backdrop-blur-md rounded-2xl p-3.5 border border-white/50">
                    <div className="text-[9px] text-nature-600 uppercase tracking-wider font-bold mb-1">Carry-over</div>
                    <div className={`font-bold text-lg font-serif ${currentMonth.carryOver >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {'\u20B9'}{currentMonth.carryOver.toFixed(0)}
                    </div>
                    <div className="text-[10px] text-nature-400 mt-1">From previous months</div>
                </div>

                {/* Lent this month */}
                <div className="bg-amber-50/60 backdrop-blur-md rounded-2xl p-3.5 border border-amber-200/30">
                    <div className="text-[9px] text-amber-700 uppercase tracking-wider font-bold mb-1 flex items-center gap-1">
                        <HandCoins className="w-3 h-3" /> Lent
                    </div>
                    <div className="font-bold text-lg font-serif text-amber-800">{'\u20B9'}{currentMonth.lent.toFixed(0)}</div>
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
                                <span className="font-bold">{'\u20B9'}{t.amount.toFixed(2)}</span>
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
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={(val) => `${'\u20B9'}${val}`} />
                            <Tooltip
                                formatter={(val) => `${'\u20B9'}${val}`}
                                cursor={{ fill: '#f4f1ea' }}
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="value" fill="#2d4a3e" radius={[8, 8, 8, 8]} barSize={28} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Pie Chart */}
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
                                <Tooltip formatter={(value) => `${'\u20B9'}${value.toFixed(2)}`} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                <Legend iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}
