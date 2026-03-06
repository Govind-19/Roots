import { useExpenses } from '../context/ExpenseContext';
import { ArrowUpCircle, ArrowDownCircle, Wallet, HandCoins, Repeat } from 'lucide-react';
import { cn } from '../lib/utils';
import { useCountUp } from '../hooks/useCountUp';

export default function Home({ setActiveTab }) {
    const { currentMonth, totalOutstanding, transactions, isWarning } = useExpenses();

    const recentTransactions = transactions.slice(0, 5);

    const animatedBalance = useCountUp(currentMonth.balance);
    const animatedIncome = useCountUp(currentMonth.income);
    const animatedExpense = useCountUp(currentMonth.expenses);

    const cardBg = isWarning
        ? 'bg-[var(--theme-accent-900)]/90'
        : 'bg-nature-900/90';
    const cardBorder = isWarning
        ? 'border-[var(--theme-accent-700)]/50'
        : 'border-nature-700/50';
    const cardShadow = isWarning
        ? 'shadow-[var(--theme-accent-900)]/20'
        : 'shadow-nature-900/20';

    return (
        <div className="p-6 space-y-8 pb-32">
            <header className="flex justify-between items-center pt-4">
                <div>
                    <h1 className="text-xl font-bold text-nature-900">My Den</h1>
                    <p className="text-nature-700 font-medium text-xs">Track your hunt</p>
                </div>
                <div className="w-8 h-8 bg-nature-100/50 rounded-full overflow-hidden border-2 border-nature-800 p-0.5 backdrop-blur-sm">
                    <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=b6e3f4" alt="Avatar" className="rounded-full" />
                </div>
            </header>

            {/* Balance Card */}
            <div className={cn(
                "backdrop-blur-md rounded-[2rem] p-5 text-cream shadow-2xl relative overflow-hidden theme-transition",
                cardBg, cardBorder, cardShadow, 'border',
                isWarning && 'animate-warning-pulse'
            )}>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1 text-white/60">
                        <Wallet className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-medium tracking-wider uppercase">Total Stash</span>
                    </div>
                    <div className="text-3xl font-serif font-bold mb-1 animate-count">
                        {'\u20B9'}{animatedBalance.toFixed(2)}
                    </div>
                    {currentMonth.carryOver !== 0 && (
                        <div className="text-[10px] text-white/40 mb-3">
                            Carry-over: {'\u20B9'}{currentMonth.carryOver.toFixed(2)}
                        </div>
                    )}
                    <div className="flex justify-between gap-3 mt-3">
                        <div className="flex-1 bg-white/10 p-2.5 rounded-xl backdrop-blur-sm border border-white/10">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <ArrowDownCircle className="w-3 h-3 text-green-300" />
                                <span className="text-[9px] text-white/50 uppercase tracking-wide">Income</span>
                            </div>
                            <div className="font-semibold text-sm">{'\u20B9'}{animatedIncome.toFixed(2)}</div>
                        </div>
                        <div className="flex-1 bg-white/10 p-2.5 rounded-xl backdrop-blur-sm border border-white/10">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <ArrowUpCircle className="w-3 h-3 text-red-300" />
                                <span className="text-[9px] text-white/50 uppercase tracking-wide">Expense</span>
                            </div>
                            <div className="font-semibold text-sm">{'\u20B9'}{animatedExpense.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Outstanding Loans Card */}
            {totalOutstanding > 0 && (
                <button
                    onClick={() => setActiveTab('people')}
                    className="w-full bg-amber-50/80 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between border border-amber-200/50 hover:shadow-md transition-all text-left"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100/80 flex items-center justify-center">
                            <HandCoins className="w-5 h-5 text-amber-700" />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">Outstanding Loans</div>
                            <div className="text-sm text-amber-600">Money owed to you</div>
                        </div>
                    </div>
                    <div className="font-bold text-lg font-serif text-amber-800">
                        {'\u20B9'}{totalOutstanding.toFixed(2)}
                    </div>
                </button>
            )}

            {/* Recent Transactions */}
            <div>
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-base font-bold text-nature-900">Recent Tracks</h2>
                    <button onClick={() => setActiveTab('history')} className="text-nature-800 text-[10px] font-bold hover:underline">View All</button>
                </div>

                <div className="space-y-2.5">
                    {recentTransactions.length === 0 ? (
                        <div className="text-center py-12 text-nature-700 bg-white/40 backdrop-blur-sm rounded-3xl border-2 border-dashed border-nature-200">
                            <div className="text-4xl mb-3 opacity-30">
                                <Wallet className="w-10 h-10 mx-auto" />
                            </div>
                            <span className="text-sm font-medium">Your den is quiet</span>
                            <p className="text-xs text-nature-500 mt-1">No hunts logged yet.</p>
                        </div>
                    ) : (
                        recentTransactions.map((t, i) => (
                            <div
                                key={t.id}
                                className={cn(
                                    "flex justify-between items-center bg-white/60 backdrop-blur-md p-3.5 rounded-2xl shadow-sm hover:shadow-md transition-shadow animate-item-in",
                                    t.type === 'expense' ? 'border-l-4 border-l-red-400 border border-white/50' :
                                    t.type === 'income' ? 'border-l-4 border-l-green-400 border border-white/50' :
                                    'border-l-4 border-l-amber-400 border border-white/50'
                                )}
                                style={{ animationDelay: `${i * 0.05}s`, animationFillMode: 'both' }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center shadow-inner",
                                        t.type === 'income' ? "bg-green-100/80 text-green-800" :
                                        t.type === 'lent' ? "bg-amber-100/80 text-amber-800" :
                                        "bg-red-100/80 text-red-800"
                                    )}>
                                        {t.type === 'income' ? <ArrowDownCircle className="w-4 h-4" /> :
                                         t.type === 'lent' ? <HandCoins className="w-4 h-4" /> :
                                         <ArrowUpCircle className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <div className="font-bold text-nature-900 text-sm font-serif flex items-center gap-1.5">
                                            {t.name || t.category}
                                            {t.recurring && <Repeat className="w-3 h-3 text-nature-500" />}
                                        </div>
                                        <div className="text-[10px] text-nature-700 font-medium">
                                            {t.type === 'lent' ? `Lent to ${t.personName}` : t.category} {' \u2022 '}
                                            {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} {' \u2022 '}
                                            {new Date(t.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                                <div className={cn(
                                    "font-bold text-sm",
                                    t.type === 'income' ? "text-green-700" :
                                    t.type === 'lent' ? "text-amber-700" :
                                    "text-red-800"
                                )}>
                                    {t.type === 'income' ? '+' : '-'}{'\u20B9'}{t.amount.toFixed(2)}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
