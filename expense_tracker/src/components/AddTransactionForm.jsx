import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowUpCircle, ArrowDownCircle, HandCoins, Repeat, Landmark } from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';

export default function AddTransactionForm({ onClose, initialType = 'expense', transaction = null }) {
    const { addTransaction, updateTransaction, addRecurringItem, isWarning } = useExpenses();
    const isEditing = !!transaction;

    const [type, setType] = useState(transaction?.type ?? initialType);
    const [name, setName] = useState(transaction?.name ?? '');
    const [amount, setAmount] = useState(transaction?.amount?.toString() ?? '');
    const [category, setCategory] = useState(transaction?.category ?? (initialType === 'income' ? 'Salary' : 'Bills'));
    const [paymentMode, setPaymentMode] = useState(transaction?.paymentMode ?? 'upi');
    const [personName, setPersonName] = useState(transaction?.personName ?? '');
    const [isClosing, setIsClosing] = useState(false);
    const [isRecurring, setIsRecurring] = useState(false);
    const [frequency, setFrequency] = useState('monthly');

    const [date, setDate] = useState(() => {
        if (transaction?.date) {
            const d = new Date(transaction.date);
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            return d.toISOString().slice(0, 16);
        }
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    });

    const [note, setNote] = useState(transaction?.note ?? '');

    const handleClose = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => onClose(), 250);
    }, [onClose]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!amount) return;
        if ((type === 'lent' || type === 'borrowed') && !personName.trim()) return;
        if (type !== 'lent' && type !== 'borrowed' && !category) return;

        const fields = {
            name: type === 'lent' ? (name || `Lent to ${personName.trim()}`) :
                  type === 'borrowed' ? (name || `Borrowed from ${personName.trim()}`) :
                  (name || category),
            amount: parseFloat(amount),
            type,
            category: type === 'lent' ? 'Lent' : type === 'borrowed' ? 'Borrowed' : category,
            paymentMode,
            date,
            note,
            ...((type === 'lent' || type === 'borrowed') ? { personName: personName.trim() } : {}),
        };

        if (isEditing) {
            updateTransaction(transaction.id, fields);
        } else {
            addTransaction({ ...fields, ...(isRecurring ? { recurring: true, frequency } : {}) });

            if (isRecurring) {
                addRecurringItem({
                    name: fields.name,
                    amount: fields.amount,
                    type: fields.type,
                    category: fields.category,
                    paymentMode: fields.paymentMode,
                    frequency,
                    ...(fields.personName ? { personName: fields.personName } : {}),
                });
            }
        }

        handleClose();
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

    const accentBg = isWarning ? 'bg-[var(--theme-accent-800)]' : 'bg-nature-800';
    const accentHover = isWarning ? 'hover:bg-[var(--theme-accent-900)]' : 'hover:bg-nature-900';

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-nature-900/60 backdrop-blur-sm ${isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
                onPointerDown={handleClose}
            />

            {/* Modal Content */}
            <div
                className={`relative z-10 bg-cream w-full max-w-sm rounded-[1.5rem] p-5 shadow-2xl border border-sand max-h-[90vh] overflow-y-auto ${isClosing ? 'animate-modal-down' : 'animate-modal-up'}`}
                onPointerDown={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-serif font-bold text-nature-900">{isEditing ? 'Edit Track' : 'New Track'}</h2>
                    <button onClick={handleClose} className="p-2 hover:bg-nature-100 rounded-full transition-colors">
                        <X className="w-6 h-6 text-nature-800" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Type Toggle */}
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
                        <button
                            type="button"
                            onClick={() => setType('borrowed')}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${type === 'borrowed'
                                ? 'bg-white text-blue-700 shadow-md ring-1 ring-black/5'
                                : 'text-nature-700 hover:bg-nature-200/50'
                                }`}
                        >
                            <Landmark className="w-3.5 h-3.5" /> Borrowed
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
                                required
                            />
                        </div>
                    </div>

                    {(type === 'lent' || type === 'borrowed') && (
                        <div>
                            <label className="block text-xs font-bold text-nature-800 uppercase tracking-wider mb-2 ml-1">Person Name</label>
                            <input
                                type="text"
                                value={personName}
                                onChange={(e) => setPersonName(e.target.value)}
                                className="w-full px-5 py-3 bg-white border-2 border-sand rounded-xl focus:ring-4 focus:ring-nature-100 focus:border-nature-800 transition-all font-medium text-nature-900 placeholder:text-nature-300"
                                placeholder={type === 'lent' ? 'Who are you lending to?' : 'Who are you borrowing from?'}
                                required
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-nature-800 uppercase tracking-wider mb-2 ml-1">
                            {(type === 'lent' || type === 'borrowed') ? 'Description' : 'Name'}
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-5 py-3 bg-white border-2 border-sand rounded-xl focus:ring-4 focus:ring-nature-100 focus:border-nature-800 transition-all font-medium text-nature-900 placeholder:text-nature-300"
                            placeholder={type === 'lent' ? 'e.g. For dinner, Emergency...' : 'e.g. Berries, Honey, Cave Rent'}
                        />
                    </div>

                    {type !== 'lent' && type !== 'borrowed' && (
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

                    {(type === 'lent' || type === 'borrowed') && (
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

                    {/* Recurring Toggle */}
                    {!isEditing && (
                        <>
                            <div className="flex items-center justify-between bg-nature-100/30 p-3.5 rounded-2xl border border-nature-100/50">
                                <div className="flex items-center gap-2.5">
                                    <Repeat className="w-4 h-4 text-nature-700" />
                                    <span className="text-sm font-bold text-nature-800">Recurring</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsRecurring(!isRecurring)}
                                    className={`relative w-11 h-6 rounded-full transition-colors ${isRecurring ? 'bg-nature-800' : 'bg-sand'}`}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isRecurring ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {isRecurring && (
                                <div className="flex gap-2">
                                    {['daily', 'weekly', 'monthly'].map(f => (
                                        <button
                                            key={f}
                                            type="button"
                                            onClick={() => setFrequency(f)}
                                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold capitalize transition-all ${frequency === f
                                                ? 'bg-nature-800 text-cream shadow-md'
                                                : 'bg-white text-nature-700 border border-sand hover:bg-nature-100/50'
                                                }`}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    <button
                        type="submit"
                        className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all mt-4 theme-transition ${
                            type === 'lent' ? 'bg-amber-700 text-cream shadow-amber-700/20 hover:bg-amber-800' :
                            type === 'borrowed' ? 'bg-blue-700 text-cream shadow-blue-700/20 hover:bg-blue-800' :
                            `${accentBg} text-cream shadow-nature-800/20 ${accentHover}`
                        }`}
                    >
                        {isEditing ? 'Save Changes' :
                         type === 'lent' ? 'Add to Ledger' :
                         type === 'borrowed' ? 'Record Debt' :
                         'Add to Stash'}
                    </button>
                </form>
            </div>
        </div>,
        document.body
    );
}
