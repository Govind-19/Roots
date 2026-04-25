import { useExpenses } from '../context/ExpenseContext';
import { Trash2, ArrowUpCircle, ArrowDownCircle, HandCoins, Search, X, Repeat, Pause, Play, Pencil, Landmark, Zap } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { useState, useMemo } from 'react';
import ConfirmationDialog from '../components/ConfirmationDialog';
import AddTransactionForm from '../components/AddTransactionForm';
import { useUndoToast } from '../context/UndoToastContext';
import { useLongPress } from '../hooks/useLongPress';

function LongPressArea({ onLongPress, className, children }) {
    const bindings = useLongPress(onLongPress, () => {});
    return <div {...bindings} className={className}>{children}</div>;
}

export default function History() {
    const { transactions, deleteTransaction, restoreTransaction, recurringItems, deleteRecurringItem, restoreRecurringItem, toggleRecurringPause, runRecurringNow } = useExpenses();
    const undoToast = useUndoToast();
    const [transactionToDelete, setTransactionToDelete] = useState(null);
    const [transactionToEdit, setTransactionToEdit] = useState(null);
    const [transactionToDuplicate, setTransactionToDuplicate] = useState(null);
    const [showRecurring, setShowRecurring] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterMonth, setFilterMonth] = useState('all');
    const [filterPaymentMode, setFilterPaymentMode] = useState('all');

    // Available categories and months from data
    const categories = useMemo(() => {
        const cats = new Set();
        transactions.forEach(t => {
            if (t.category && t.category !== 'Lent') cats.add(t.category);
        });
        return Array.from(cats).sort();
    }, [transactions]);

    const months = useMemo(() => {
        const m = new Set();
        transactions.forEach(t => {
            const date = new Date(t.date);
            m.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
        });
        return Array.from(m).sort().reverse();
    }, [transactions]);

    const formatMonthKey = (key) => {
        const [year, month] = key.split('-').map(Number);
        return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    // Filter and search
    const filteredTransactions = useMemo(() => {
        let result = transactions;

        if (filterType !== 'all') {
            result = result.filter(t => t.type === filterType);
        }

        if (filterCategory !== 'all') {
            result = result.filter(t => t.category === filterCategory);
        }

        if (filterMonth !== 'all') {
            result = result.filter(t => {
                const date = new Date(t.date);
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                return key === filterMonth;
            });
        }

        if (filterPaymentMode !== 'all') {
            result = result.filter(t => (t.paymentMode || 'upi') === filterPaymentMode);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            result = result.filter(t =>
                (t.name || '').toLowerCase().includes(q) ||
                (t.category || '').toLowerCase().includes(q) ||
                (t.personName || '').toLowerCase().includes(q) ||
                (t.note || '').toLowerCase().includes(q)
            );
        }

        return result;
    }, [transactions, filterType, filterCategory, filterMonth, filterPaymentMode, searchQuery]);

    const activeFilterCount = [filterType !== 'all', filterCategory !== 'all', filterMonth !== 'all', filterPaymentMode !== 'all'].filter(Boolean).length;

    const clearFilters = () => {
        setFilterType('all');
        setFilterCategory('all');
        setFilterMonth('all');
        setFilterPaymentMode('all');
        setSearchQuery('');
    };

    return (
        <div className="p-6 pb-24 space-y-4">
            <header>
                <h1 className="text-xl font-bold text-nature-900 mb-0.5">History</h1>
                <p className="text-nature-700 text-xs">Your past trails</p>
            </header>

            {/* Search Bar */}
            <div className="sticky top-0 z-20 pt-1 pb-2 -mx-6 px-6 bg-cream/80 backdrop-blur-md">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-nature-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-10 py-3 bg-white/80 border-2 border-sand rounded-2xl text-sm font-medium text-nature-900 placeholder:text-nature-300 focus:ring-4 focus:ring-nature-100 focus:border-nature-800 transition-all"
                        placeholder="Search tracks..."
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-nature-100 rounded-full">
                            <X className="w-4 h-4 text-nature-400" />
                        </button>
                    )}
                </div>

                {/* Filter Chips */}
                <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
                    {/* Type filters */}
                    {['all', 'expense', 'income', 'lent', 'borrowed'].map(t => (
                        <button
                            key={t}
                            onClick={() => setFilterType(t)}
                            className={cn(
                                "px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all",
                                filterType === t
                                    ? 'bg-nature-800 text-cream shadow-md'
                                    : 'bg-white/70 text-nature-700 border border-sand hover:bg-nature-100/50'
                            )}
                        >
                            {t === 'all' ? 'All' : t}
                        </button>
                    ))}

                    {/* Category filter */}
                    {categories.length > 0 && (
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className={cn(
                                "px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all appearance-none cursor-pointer",
                                filterCategory !== 'all'
                                    ? 'bg-nature-800 text-cream shadow-md'
                                    : 'bg-white/70 text-nature-700 border border-sand'
                            )}
                        >
                            <option value="all">Category</option>
                            {categories.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    )}

                    {/* Month filter */}
                    {months.length > 0 && (
                        <select
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                            className={cn(
                                "px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all appearance-none cursor-pointer",
                                filterMonth !== 'all'
                                    ? 'bg-nature-800 text-cream shadow-md'
                                    : 'bg-white/70 text-nature-700 border border-sand'
                            )}
                        >
                            <option value="all">Month</option>
                            {months.map(m => (
                                <option key={m} value={m}>{formatMonthKey(m)}</option>
                            ))}
                        </select>
                    )}

                    {/* Payment mode filter */}
                    <select
                        value={filterPaymentMode}
                        onChange={(e) => setFilterPaymentMode(e.target.value)}
                        className={cn(
                            "px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all appearance-none cursor-pointer",
                            filterPaymentMode !== 'all'
                                ? 'bg-nature-800 text-cream shadow-md'
                                : 'bg-white/70 text-nature-700 border border-sand'
                        )}
                    >
                        <option value="all">Mode</option>
                        <option value="upi">UPI</option>
                        <option value="card">Card</option>
                        <option value="cash">Cash</option>
                        <option value="wallet">Wallet</option>
                    </select>
                </div>

                {/* Active filters */}
                {activeFilterCount > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-nature-500 font-bold">{filteredTransactions.length} results</span>
                        <button onClick={clearFilters} className="text-[10px] font-bold text-red-600 hover:underline">
                            Clear filters
                        </button>
                    </div>
                )}
            </div>

            {/* Recurring Transactions Section */}
            {recurringItems.length > 0 && (
                <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-sand overflow-hidden">
                    <button
                        onClick={() => setShowRecurring(!showRecurring)}
                        className="w-full p-4 flex justify-between items-center"
                    >
                        <div className="flex items-center gap-2.5">
                            <Repeat className="w-4 h-4 text-nature-700" />
                            <span className="text-sm font-bold text-nature-900">Recurring ({recurringItems.length})</span>
                        </div>
                        <div className={`transition-transform duration-300 ${showRecurring ? 'rotate-180' : ''}`}>
                            <ArrowDownCircle className="w-4 h-4 text-nature-400" />
                        </div>
                    </button>
                    {showRecurring && (
                        <div className="px-4 pb-4 space-y-2 border-t border-nature-100/50 pt-3">
                            {recurringItems.map(item => {
                                const lastRunLabel = item.lastRun
                                    ? new Date(item.lastRun).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                    : 'never';
                                return (
                                <div key={item.id} className="flex justify-between items-center bg-nature-50/50 p-3 rounded-xl">
                                    <div>
                                        <div className="font-bold text-sm text-nature-900 flex items-center gap-1.5">
                                            {item.name}
                                            {item.paused && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">PAUSED</span>}
                                        </div>
                                        <div className="text-[10px] text-nature-500">
                                            {formatCurrency(item.amount)} &middot; {item.frequency} &middot; {item.type}
                                        </div>
                                        <div className="text-[9px] text-nature-400 uppercase tracking-wider mt-0.5">
                                            Last run: {lastRunLabel}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => runRecurringNow(item.id)}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Run now"
                                        >
                                            <Zap className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => toggleRecurringPause(item.id)}
                                            className={cn("p-1.5 rounded-lg transition-colors", item.paused ? "text-green-600 hover:bg-green-50" : "text-amber-600 hover:bg-amber-50")}
                                            title={item.paused ? 'Resume' : 'Pause'}
                                        >
                                            {item.paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                                        </button>
                                        <button
                                            onClick={() => { deleteRecurringItem(item.id); undoToast.show({ message: `${item.name} deleted`, onUndo: () => restoreRecurringItem(item) }); }}
                                            className="p-1.5 text-nature-300 hover:text-red-500 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-6">
                {filteredTransactions.length === 0 ? (
                    <div className="text-center py-12 text-nature-700 bg-white/40 backdrop-blur-sm rounded-3xl border-2 border-dashed border-nature-200">
                        <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <span className="text-sm font-medium">
                            {searchQuery || activeFilterCount > 0 ? 'No tracks found for your search' : 'No trails left behind'}
                        </span>
                        <p className="text-xs text-nature-500 mt-1">
                            {searchQuery || activeFilterCount > 0 ? 'Try adjusting your filters' : 'The den is quiet. No hunts recorded.'}
                        </p>
                    </div>
                ) : (
                    Object.entries(
                        filteredTransactions.reduce((groups, t) => {
                            const date = new Date(t.date);
                            const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                            if (!groups[monthYear]) groups[monthYear] = [];
                            groups[monthYear].push(t);
                            return groups;
                        }, {})
                    ).map(([month, monthTransactions]) => (
                        <div key={month} className="space-y-3">
                            <h2 className="text-nature-500 text-xs font-bold uppercase tracking-widest pl-2">{month}</h2>
                            {monthTransactions.map((t, i) => (
                                <div
                                    key={t.id}
                                    className={cn(
                                        "flex justify-between items-center bg-white/60 backdrop-blur-md p-3.5 rounded-2xl shadow-sm hover:shadow-md transition-all group animate-item-in",
                                        t.type === 'expense' ? 'border-l-4 border-l-red-400 border border-white/50' :
                                        t.type === 'income' ? 'border-l-4 border-l-green-400 border border-white/50' :
                                        t.type === 'borrowed' ? 'border-l-4 border-l-blue-400 border border-white/50' :
                                        'border-l-4 border-l-amber-400 border border-white/50'
                                    )}
                                    style={{ animationDelay: `${i * 0.03}s`, animationFillMode: 'both' }}
                                >
                                    <LongPressArea
                                        onLongPress={() => setTransactionToDuplicate(t)}
                                        className="flex items-center gap-3 cursor-pointer select-none flex-1 min-w-0"
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-110",
                                            t.type === 'income' ? "bg-green-100/80 text-green-800" :
                                            t.type === 'lent' ? "bg-amber-100/80 text-amber-800" :
                                            t.type === 'borrowed' ? "bg-blue-100/80 text-blue-800" :
                                            "bg-red-100/80 text-red-800"
                                        )}>
                                            {t.type === 'income' ? <ArrowDownCircle className="w-4 h-4" /> :
                                             t.type === 'lent' ? <HandCoins className="w-4 h-4" /> :
                                             t.type === 'borrowed' ? <Landmark className="w-4 h-4" /> :
                                             <ArrowUpCircle className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <div className="font-bold text-nature-900 text-sm font-serif flex items-center gap-1.5">
                                                {t.name || t.category}
                                                {t.recurring && <Repeat className="w-3 h-3 text-nature-500" />}
                                            </div>
                                            <div className="text-[10px] text-nature-700 flex items-center gap-1 flex-wrap mt-0.5">
                                                <span className={cn(
                                                    "px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider border",
                                                    t.type === 'lent' ? "bg-amber-50/80 text-amber-700 border-amber-200" :
                                                    t.type === 'borrowed' ? "bg-blue-50/80 text-blue-700 border-blue-200" :
                                                    "bg-nature-50/80 text-nature-800 border-nature-200"
                                                )}>
                                                    {t.type === 'lent' ? `Lent \u2192 ${t.personName}` :
                                                     t.type === 'borrowed' ? `Borrowed \u2190 ${t.personName}` :
                                                     t.category}
                                                </span>
                                                <span className="uppercase bg-white/50 text-nature-800 px-1.5 py-0.5 rounded-md font-bold tracking-wider border border-nature-200">{t.paymentMode || 'UPI'}</span>
                                                <span className="font-medium">{' \u2022 '}{new Date(t.date).toLocaleDateString('en-US', { day: 'numeric' })} {' \u2022 '}{new Date(t.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            {t.note && <div className="text-[10px] text-nature-600 mt-0.5 italic">"{t.note}"</div>}
                                        </div>
                                    </LongPressArea>
                                    <div className="flex flex-col items-end gap-1">
                                        <div className={cn(
                                            "font-bold text-sm font-serif",
                                            t.type === 'income' ? "text-green-700" :
                                            t.type === 'lent' ? "text-amber-700" :
                                            t.type === 'borrowed' ? "text-blue-700" :
                                            "text-red-800"
                                        )}>
                                            {t.type === 'income' ? '+' : t.type === 'borrowed' ? '' : '-'}{formatCurrency(t.amount)}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => setTransactionToEdit(t)}
                                                className="p-2 text-nature-400 hover:text-nature-700 hover:bg-nature-100 rounded-full transition-colors"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setTransactionToDelete(t)}
                                                className="p-2 text-nature-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))
                )}
            </div>

            <ConfirmationDialog
                isOpen={!!transactionToDelete}
                onClose={() => setTransactionToDelete(null)}
                onConfirm={() => { const item = transactionToDelete; deleteTransaction(item.id); undoToast.show({ message: `${item.name || 'Transaction'} deleted`, onUndo: () => restoreTransaction(item) }); }}
                title="Delete Record"
                message={`Are you sure you want to delete this ${transactionToDelete?.type === 'lent' ? 'lending' : transactionToDelete?.type === 'income' ? 'income' : 'expense'} of ${formatCurrency(transactionToDelete?.amount ?? 0)}?`}
                confirmText="Delete"
                isDestructive={true}
            />

            {transactionToEdit && (
                <AddTransactionForm
                    transaction={transactionToEdit}
                    onClose={() => setTransactionToEdit(null)}
                />
            )}

            {transactionToDuplicate && (
                <AddTransactionForm
                    duplicateFrom={transactionToDuplicate}
                    onClose={() => setTransactionToDuplicate(null)}
                />
            )}
        </div>
    );
}
