import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowUpCircle, ArrowDownCircle, HandCoins } from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';

export default function AddTransactionForm({ onClose }) {
    const { addTransaction } = useExpenses();
    const [type, setType] = useState('expense');
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Bills');
    const [paymentMode, setPaymentMode] = useState('upi');
    const [personName, setPersonName] = useState('');

    // Initialize with local time (correctly formatted for datetime-local)
    const [date, setDate] = useState(() => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    });

    const [note, setNote] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!amount) return;
        if (type === 'lent' && !personName.trim()) return;
        if (type !== 'lent' && !category) return;

        const transaction = {
            name: type === 'lent' ? (name || `Lent to ${personName.trim()}`) : (name || category),
            amount: parseFloat(amount),
            type,
            category: type === 'lent' ? 'Lent' : category,
            paymentMode,
            date,
            note,
        };

        if (type === 'lent') {
            transaction.personName = personName.trim();
        }

        addTransaction(transaction);
        onClose();
    };

    const categories = type === 'expense'
        ? ['Bills', 'Food', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Other']
        : ['Salary', 'Freelance', 'Gift', 'Investment', 'Other'];

    const paymentModes = [
        { id: 'upi', label: 'UPI' },
        { id: 'card', label: 'Card' },
        { id: 'cash', label: 'Cash' },
        { id: 'wallet', label: 'Wallet' }
    ];

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-nature-900/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal Content */}
            <div className="relative z-10 bg-cream w-full max-w-sm rounded-[1.5rem] p-5 shadow-2xl border border-sand animate-in slide-in-from-bottom-10 fade-in duration-200 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-serif font-bold text-nature-900">New Track</h2>
                    <button onClick={onClose} className="p-2 hover:bg-nature-100 rounded-full transition-colors">
                        <X className="w-6 h-6 text-nature-800" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Type Toggle: Expense | Income | Lent */}
                    <div className="flex p-1.5 bg-nature-100/50 rounded-2xl gap-1.5 border border-nature-100">
                        <button
                            type="button"
                            onClick={() => { setType('expense'); setCategory('Bills'); }}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${type === 'expense'
                                ? 'bg-white text-red-700 shadow-md ring-1 ring-black/5'
                                : 'text-nature-700 hover:bg-nature-200/50'
                                }`}
                        >
                            <ArrowUpCircle className="w-3.5 h-3.5" /> Expense
                        </button>
                        <button
                            type="button"
                            onClick={() => { setType('income'); setCategory('Salary'); }}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${type === 'income'
                                ? 'bg-white text-green-700 shadow-md ring-1 ring-black/5'
                                : 'text-nature-700 hover:bg-nature-200/50'
                                }`}
                        >
                            <ArrowDownCircle className="w-3.5 h-3.5" /> Income
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('lent')}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${type === 'lent'
                                ? 'bg-white text-amber-700 shadow-md ring-1 ring-black/5'
                                : 'text-nature-700 hover:bg-nature-200/50'
                                }`}
                        >
                            <HandCoins className="w-3.5 h-3.5" /> Lent
                        </button>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-nature-800 uppercase tracking-wider mb-2 ml-1">Amount</label>
                        <div className="relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-nature-400 font-serif font-bold text-lg">{'\u20B9'}</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full pl-10 pr-5 py-3 bg-white border-2 border-sand rounded-xl focus:ring-4 focus:ring-nature-100 focus:border-nature-800 transition-all text-xl font-serif font-bold text-nature-900 placeholder:text-nature-200"
                                placeholder="0.00"
                                autoFocus
                                required
                            />
                        </div>
                    </div>

                    {/* Person Name (only for Lent type) */}
                    {type === 'lent' ? (
                        <div>
                            <label className="block text-xs font-bold text-nature-800 uppercase tracking-wider mb-2 ml-1">Person Name</label>
                            <input
                                type="text"
                                value={personName}
                                onChange={(e) => setPersonName(e.target.value)}
                                className="w-full px-5 py-3 bg-white border-2 border-sand rounded-xl focus:ring-4 focus:ring-nature-100 focus:border-nature-800 transition-all font-medium text-nature-900 placeholder:text-nature-300"
                                placeholder="Who are you lending to?"
                                required
                            />
                        </div>
                    ) : null}

                    <div>
                        <label className="block text-xs font-bold text-nature-800 uppercase tracking-wider mb-2 ml-1">
                            {type === 'lent' ? 'Description' : 'Name'}
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-5 py-3 bg-white border-2 border-sand rounded-xl focus:ring-4 focus:ring-nature-100 focus:border-nature-800 transition-all font-medium text-nature-900 placeholder:text-nature-300"
                            placeholder={type === 'lent' ? 'e.g. For dinner, Emergency...' : 'e.g. Berries, Honey, Cave Rent'}
                        />
                    </div>

                    {type !== 'lent' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-nature-800 uppercase tracking-wider mb-2 ml-1">Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border-2 border-sand rounded-2xl focus:ring-4 focus:ring-nature-100 focus:border-nature-800 transition-all font-medium text-nature-900 appearance-none"
                                >
                                    {categories.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-nature-800 uppercase tracking-wider mb-2 ml-1">Mode</label>
                                <select
                                    value={paymentMode}
                                    onChange={(e) => setPaymentMode(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border-2 border-sand rounded-2xl focus:ring-4 focus:ring-nature-100 focus:border-nature-800 transition-all font-medium text-nature-900 appearance-none"
                                >
                                    {paymentModes.map(m => (
                                        <option key={m.id} value={m.id}>{m.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {type === 'lent' && (
                        <div>
                            <label className="block text-xs font-bold text-nature-800 uppercase tracking-wider mb-2 ml-1">Mode</label>
                            <select
                                value={paymentMode}
                                onChange={(e) => setPaymentMode(e.target.value)}
                                className="w-full px-4 py-3 bg-white border-2 border-sand rounded-2xl focus:ring-4 focus:ring-nature-100 focus:border-nature-800 transition-all font-medium text-nature-900 appearance-none"
                            >
                                {paymentModes.map(m => (
                                    <option key={m.id} value={m.id}>{m.label}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-nature-800 uppercase tracking-wider mb-2 ml-1">Date</label>
                            <input
                                type="datetime-local"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-4 py-3 bg-white border-2 border-sand rounded-2xl focus:ring-4 focus:ring-nature-100 focus:border-nature-800 transition-all font-medium text-nature-900 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-nature-800 uppercase tracking-wider mb-2 ml-1">Note</label>
                            <input
                                type="text"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full px-4 py-3 bg-white border-2 border-sand rounded-2xl focus:ring-4 focus:ring-nature-100 focus:border-nature-800 transition-all font-medium text-nature-900 text-sm"
                                placeholder="Optional..."
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all mt-4 ${
                            type === 'lent'
                                ? 'bg-amber-700 text-cream shadow-amber-700/20 hover:bg-amber-800'
                                : 'bg-nature-800 text-cream shadow-nature-800/20 hover:bg-nature-900'
                        }`}
                    >
                        {type === 'lent' ? 'Add to Ledger' : 'Add to Stash'}
                    </button>
                </form>
            </div>
        </div>,
        document.body
    );
}
