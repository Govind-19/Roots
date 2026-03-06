import { useState, useMemo } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { AlertTriangle } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export default function Analytics() {
    const { transactions } = useExpenses();
    const [timeView, setTimeView] = useState('daily'); // 'daily', 'weekly', 'monthly'

    const expenseTransactions = useMemo(() =>
        transactions.filter(t => t.type === 'expense'),
        [transactions]);

    // --- High Expense Detection ---
    const highExpenses = useMemo(() => {
        if (expenseTransactions.length < 5) return [];
        const total = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
        const avg = total / expenseTransactions.length;
        // Flag transactions > 2x average
        return expenseTransactions
            .filter(t => t.amount > avg * 2)
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 3);
    }, [expenseTransactions]);

    // --- Chart Data Aggregation ---
    const chartData = useMemo(() => {
        const now = new Date();
        const data = [];

        if (timeView === 'daily') {
            // Last 7 days
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

                const total = expenseTransactions
                    .filter(t => t.date.startsWith(dateStr))
                    .reduce((sum, t) => sum + t.amount, 0);

                data.push({ name: dayName, fullDate: dateStr, value: total });
            }
        } else if (timeView === 'weekly') {
            // Last 4 weeks (simplified as buckets)
            // This is a bit complex to implement perfectly without a library like date-fns
            // Let's do a simpler "Last 4 Weeks" aggregation
            for (let i = 3; i >= 0; i--) {
                const start = new Date(now);
                start.setDate(start.getDate() - (i * 7) - now.getDay()); // Start of week (Sunday)
                const end = new Date(start);
                end.setDate(end.getDate() + 6);

                const total = expenseTransactions.filter(t => {
                    const tDate = new Date(t.date);
                    return tDate >= start && tDate <= end;
                }).reduce((sum, t) => sum + t.amount, 0);

                data.push({ name: `W${4 - i}`, value: total, range: `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}` });
            }
        } else {
            // Last 6 months
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthStr = d.toISOString().slice(0, 7); // YYYY-MM
                const monthName = d.toLocaleDateString('en-US', { month: 'short' });

                const total = expenseTransactions
                    .filter(t => t.date.startsWith(monthStr))
                    .reduce((sum, t) => sum + t.amount, 0);

                data.push({ name: monthName, value: total });
            }
        }
        return data;
    }, [expenseTransactions, timeView]);

    // --- Category Data (Pie Chart) ---
    const categoryData = useMemo(() => {
        return expenseTransactions.reduce((acc, curr) => {
            const existing = acc.find(item => item.name === curr.category);
            if (existing) {
                existing.value += curr.amount;
            } else {
                acc.push({ name: curr.category, value: curr.amount });
            }
            return acc;
        }, []);
    }, [expenseTransactions]);

    return (
        <div className="p-6 space-y-8 pb-24">
            <header>
                <h1 className="text-3xl font-bold text-nature-900 mb-1">Insights</h1>
                <p className="text-earth-600">Analyze your territory</p>
            </header>

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
                <div className="bg-orange-50 border-2 border-orange-100 rounded-[2rem] p-6">
                    <div className="flex items-center gap-3 mb-4 text-orange-800">
                        <div className="p-2 bg-orange-100 rounded-full">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-lg">Wild Spending!</span>
                    </div>
                    <div className="space-y-3">
                        {highExpenses.map(t => (
                            <div key={t.id} className="flex justify-between items-center text-sm text-orange-900 bg-white p-3 rounded-xl shadow-sm border border-orange-100">
                                <span className="font-medium">{t.name || t.category}</span>
                                <span className="font-bold text-lg">₹{t.amount.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Bar Chart */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-sand">
                <h2 className="text-lg font-bold text-nature-900 mb-6 font-serif capitalize">{timeView} Spending</h2>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6e2d3" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#8d6e63', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(val) => `₹${val}`} />
                            <Tooltip
                                formatter={(val) => `₹${val}`}
                                cursor={{ fill: '#f4f1ea' }}
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="value" fill="#2d4a3e" radius={[8, 8, 8, 8]} barSize={32} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Pie Chart */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-sand">
                <h2 className="text-lg font-bold text-nature-900 mb-4 font-serif">Prey Breakdown</h2>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                            <Legend iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
