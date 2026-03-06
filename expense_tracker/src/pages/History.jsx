import { useExpenses } from '../context/ExpenseContext';
import { Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState } from 'react';
import ConfirmationDialog from '../components/ConfirmationDialog';

export default function History() {
    const { transactions, deleteTransaction } = useExpenses();
    const [transactionToDelete, setTransactionToDelete] = useState(null);

    return (
        <div className="p-6 pb-24 space-y-5">
            <header>
                <h1 className="text-xl font-bold text-nature-900 mb-0.5">History</h1>
                <p className="text-nature-700 text-xs">Your past trails</p>
            </header>

            <div className="space-y-6">
                {transactions.length === 0 ? (
                    <div className="text-center py-10 text-nature-700 bg-white/40 backdrop-blur-sm rounded-3xl border-2 border-dashed border-nature-200">
                        <div className="text-3xl mb-2 opacity-50">🍃</div>
                        <span className="text-sm">No trails left behind</span>
                    </div>
                ) : (
                    Object.entries(
                        transactions.reduce((groups, t) => {
                            const date = new Date(t.date);
                            const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                            if (!groups[monthYear]) groups[monthYear] = [];
                            groups[monthYear].push(t);
                            return groups;
                        }, {})
                    ).map(([month, monthTransactions]) => (
                        <div key={month} className="space-y-3">
                            <h2 className="text-nature-500 text-xs font-bold uppercase tracking-widest pl-2">{month}</h2>
                            {monthTransactions.map(t => (
                                <div key={t.id} className="flex justify-between items-center bg-white/60 backdrop-blur-md p-3.5 rounded-2xl shadow-sm border border-white/50 hover:shadow-md transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-110",
                                            t.type === 'income' ? "bg-green-100/80 text-green-800" : "bg-red-100/80 text-red-800"
                                        )}>
                                            {t.type === 'income' ? <ArrowDownCircle className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <div className="font-bold text-nature-900 text-sm font-serif">{t.name || t.category}</div>
                                            <div className="text-[10px] text-nature-700 flex items-center gap-1 flex-wrap mt-0.5">
                                                <span className="bg-nature-50/80 text-nature-800 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider border border-nature-200">{t.category}</span>
                                                <span className="uppercase bg-white/50 text-nature-800 px-1.5 py-0.5 rounded-md font-bold tracking-wider border border-nature-200">{t.paymentMode || 'UPI'}</span>
                                                <span className="font-medium">• {new Date(t.date).toLocaleDateString('en-US', { day: 'numeric' })} • {new Date(t.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            {t.note && <div className="text-[10px] text-nature-600 mt-0.5 italic">"{t.note}"</div>}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <div className={cn(
                                            "font-bold text-sm font-serif",
                                            t.type === 'income' ? "text-green-700" : "text-red-800"
                                        )}>
                                            {t.type === 'income' ? '+' : '-'}₹{t.amount.toFixed(2)}
                                        </div>
                                        <button
                                            onClick={() => setTransactionToDelete(t)}
                                            className="p-2 text-nature-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
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
                onConfirm={() => deleteTransaction(transactionToDelete.id)}
                title="Delete Record"
                message={`Are you sure you want to delete this ${transactionToDelete?.type === 'income' ? 'income' : 'expense'} of ₹${transactionToDelete?.amount?.toFixed(2)}?`}
                confirmText="Delete"
                isDestructive={true}
            />
        </div>
    );
}
