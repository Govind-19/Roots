import { useState, useRef, useEffect } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { Users, ChevronDown, CheckCircle2, Plus, Trash2, Landmark } from 'lucide-react';
import { cn } from '../lib/utils';
import ConfirmationDialog from '../components/ConfirmationDialog';

function ExpandableSection({ isExpanded, children }) {
    const contentRef = useRef(null);
    const [height, setHeight] = useState(0);

    useEffect(() => {
        if (contentRef.current) {
            setHeight(isExpanded ? contentRef.current.scrollHeight : 0);
        }
    }, [isExpanded, children]);

    return (
        <div
            className="expand-collapse"
            style={{ maxHeight: isExpanded ? `${height}px` : '0px', opacity: isExpanded ? 1 : 0 }}
        >
            <div ref={contentRef}>{children}</div>
        </div>
    );
}

function PersonCard({ person, isExpanded, onToggle, onAddRepayment, onDeleteItem, accentColor }) {
    const [repaymentAmount, setRepaymentAmount] = useState('');
    const [showInput, setShowInput] = useState(false);

    const colors = {
        amber: {
            border: person.isSettled ? 'border-green-200/50' : 'border-amber-200/50',
            avatar: person.isSettled ? 'bg-green-100/80 text-green-700' : 'bg-amber-100/80 text-amber-700',
            amount: person.isSettled ? 'text-green-700' : 'text-amber-700',
            statLent: 'bg-amber-50/80 text-amber-800',
            statLentLabel: 'text-amber-600',
            txBg: 'bg-amber-50/50',
            txAmount: 'text-amber-700',
            btn: 'bg-green-50 text-green-700 border-green-200/50 hover:bg-green-100',
            btnConfirm: 'bg-green-700 hover:bg-green-800',
        },
        blue: {
            border: person.isSettled ? 'border-green-200/50' : 'border-blue-200/50',
            avatar: person.isSettled ? 'bg-green-100/80 text-green-700' : 'bg-blue-100/80 text-blue-700',
            amount: person.isSettled ? 'text-green-700' : 'text-blue-700',
            statLent: 'bg-blue-50/80 text-blue-800',
            statLentLabel: 'text-blue-600',
            txBg: 'bg-blue-50/50',
            txAmount: 'text-blue-700',
            btn: 'bg-red-50 text-red-700 border-red-200/50 hover:bg-red-100',
            btnConfirm: 'bg-red-600 hover:bg-red-700',
        },
    }[accentColor];

    const lentLabel = accentColor === 'blue' ? 'Borrowed' : 'Lent';
    const repaidLabel = accentColor === 'blue' ? 'Repaid by me' : 'Repaid';
    const repaymentBtnLabel = accentColor === 'blue' ? 'Record My Repayment' : 'Record Repayment';

    const handleAdd = () => {
        const amt = parseFloat(repaymentAmount);
        if (!amt || amt <= 0) return;
        onAddRepayment(person.name, amt);
        setRepaymentAmount('');
        setShowInput(false);
    };

    return (
        <div className={cn("bg-white/60 backdrop-blur-md rounded-2xl border transition-all", colors.border)}>
            <button onClick={onToggle} className="w-full p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-inner", colors.avatar)}>
                        {person.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                        <div className="font-bold text-nature-900 text-sm font-serif flex items-center gap-1.5">
                            {person.name}
                            {person.isSettled && <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
                        </div>
                        <div className="text-[10px] text-nature-600">
                            {person.transactions.length} {person.transactions.length === 1 ? 'transaction' : 'transactions'}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="text-right">
                        <div className={cn("font-bold text-sm font-serif", colors.amount)}>
                            {person.isSettled ? 'Settled' : `₹${Math.max(0, person.outstanding).toFixed(2)}`}
                        </div>
                        {!person.isSettled && (
                            <div className="text-[10px] text-nature-500">of ₹{person.totalBorrowed?.toFixed(2) ?? person.totalLent?.toFixed(2)}</div>
                        )}
                    </div>
                    <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown className="w-4 h-4 text-nature-400" />
                    </div>
                </div>
            </button>

            <ExpandableSection isExpanded={isExpanded}>
                <div className="px-4 pb-4 space-y-3 border-t border-nature-100/50 pt-3">
                    <div className="flex gap-2">
                        <div className={cn("flex-1 p-2.5 rounded-xl text-center", colors.statLent)}>
                            <div className={cn("text-[9px] uppercase tracking-wide font-bold", colors.statLentLabel)}>{lentLabel}</div>
                            <div className="font-bold text-sm">₹{(person.totalBorrowed ?? person.totalLent ?? 0).toFixed(2)}</div>
                        </div>
                        <div className="flex-1 bg-green-50/80 p-2.5 rounded-xl text-center">
                            <div className="text-[9px] text-green-600 uppercase tracking-wide font-bold">{repaidLabel}</div>
                            <div className="font-bold text-sm text-green-800">₹{person.totalRepaid.toFixed(2)}</div>
                        </div>
                        <div className="flex-1 bg-nature-50/80 p-2.5 rounded-xl text-center">
                            <div className="text-[9px] text-nature-600 uppercase tracking-wide font-bold">Pending</div>
                            <div className="font-bold text-sm text-nature-800">₹{Math.max(0, person.outstanding).toFixed(2)}</div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="text-[10px] font-bold text-nature-500 uppercase tracking-wider">{lentLabel} History</div>
                        {person.transactions.map(t => (
                            <div key={t.id} className={cn("flex justify-between items-center p-2.5 rounded-xl text-sm", colors.txBg)}>
                                <div>
                                    <span className="font-medium text-nature-800">{t.name || lentLabel}</span>
                                    <span className="text-[10px] text-nature-500 ml-2">
                                        {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={cn("font-bold", colors.txAmount)}>₹{t.amount.toFixed(2)}</span>
                                    <button onClick={() => onDeleteItem({ type: 'tx', id: t.id, amount: t.amount })} className="p-1 text-nature-300 hover:text-red-500 rounded-full transition-colors">
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {person.repayments.length > 0 && (
                        <div className="space-y-1.5">
                            <div className="text-[10px] font-bold text-nature-500 uppercase tracking-wider">Repayments</div>
                            {person.repayments.map(r => (
                                <div key={r.id} className="flex justify-between items-center bg-green-50/50 p-2.5 rounded-xl text-sm">
                                    <span className="text-[10px] text-nature-500">
                                        {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-green-700">₹{r.amount.toFixed(2)}</span>
                                        <button onClick={() => onDeleteItem({ type: 'repayment', id: r.id, amount: r.amount })} className="p-1 text-nature-300 hover:text-red-500 rounded-full transition-colors">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!person.isSettled && (
                        <div className="flex gap-2">
                            {showInput ? (
                                <>
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-nature-400 text-sm font-bold">₹</span>
                                        <input
                                            type="number"
                                            value={repaymentAmount}
                                            onChange={(e) => setRepaymentAmount(e.target.value)}
                                            className="w-full pl-7 pr-3 py-2.5 bg-white border-2 border-sand rounded-xl text-sm font-bold text-nature-900 placeholder:text-nature-300 focus:ring-2 focus:ring-nature-100 focus:border-nature-800"
                                            placeholder="0.00"
                                            autoFocus
                                        />
                                    </div>
                                    <button onClick={handleAdd} className={cn("px-4 py-2.5 text-white rounded-xl font-bold text-sm active:scale-95 transition-all", colors.btnConfirm)}>Add</button>
                                    <button onClick={() => { setShowInput(false); setRepaymentAmount(''); }} className="px-3 py-2.5 bg-nature-100 text-nature-700 rounded-xl font-bold text-sm hover:bg-nature-200 transition-all">Cancel</button>
                                </>
                            ) : (
                                <button onClick={() => setShowInput(true)} className={cn("w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm border transition-all", colors.btn)}>
                                    <Plus className="w-4 h-4" /> {repaymentBtnLabel}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </ExpandableSection>
        </div>
    );
}

export default function People() {
    const {
        peopleData, totalOutstanding, addRepayment, deleteTransaction, deleteRepayment, isWarning,
        borrowedData, totalOwed, addBorrowedRepayment, deleteBorrowedRepayment,
    } = useExpenses();
    const [expandedPerson, setExpandedPerson] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [activeTab, setActiveTab] = useState('owed');

    const cardBg = isWarning ? 'bg-[var(--theme-accent-900)]/90' : 'bg-nature-900/90';
    const cardBorder = isWarning ? 'border-[var(--theme-accent-700)]/50' : 'border-nature-700/50';

    const handleDeleteLent = () => {
        if (itemToDelete.type === 'tx') deleteTransaction(itemToDelete.id);
        else deleteRepayment(itemToDelete.id);
    };

    const handleDeleteBorrowed = () => {
        if (itemToDelete.type === 'tx') deleteTransaction(itemToDelete.id);
        else deleteBorrowedRepayment(itemToDelete.id);
    };

    return (
        <div className="p-6 pb-24 space-y-6">
            <header>
                <h1 className="text-xl font-bold text-nature-900 mb-0.5">Pack Ledger</h1>
                <p className="text-nature-700 text-xs">Track what your pack owes and what you owe</p>
            </header>

            {/* Tab Toggle */}
            <div className="flex p-1 bg-nature-100/50 rounded-2xl gap-1 border border-nature-100">
                <button
                    onClick={() => setActiveTab('owed')}
                    className={cn("flex-1 py-2.5 rounded-xl text-xs font-bold transition-all", activeTab === 'owed' ? 'bg-white text-amber-700 shadow-md' : 'text-nature-600 hover:bg-nature-200/50')}
                >
                    They owe me {totalOutstanding > 0 && `· ₹${totalOutstanding.toFixed(0)}`}
                </button>
                <button
                    onClick={() => setActiveTab('iowe')}
                    className={cn("flex-1 py-2.5 rounded-xl text-xs font-bold transition-all", activeTab === 'iowe' ? 'bg-white text-blue-700 shadow-md' : 'text-nature-600 hover:bg-nature-200/50')}
                >
                    I owe {totalOwed > 0 && `· ₹${totalOwed.toFixed(0)}`}
                </button>
            </div>

            {/* Summary Card */}
            <div className={cn("backdrop-blur-md rounded-[2rem] p-5 text-cream relative overflow-hidden theme-transition border", cardBg, cardBorder)}>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1 text-white/60">
                        {activeTab === 'owed' ? <Users className="w-3.5 h-3.5" /> : <Landmark className="w-3.5 h-3.5" />}
                        <span className="text-[10px] font-medium tracking-wider uppercase">
                            {activeTab === 'owed' ? 'Total Owed to You' : 'Total You Owe'}
                        </span>
                    </div>
                    <div className="text-3xl font-serif font-bold">
                        ₹{(activeTab === 'owed' ? totalOutstanding : totalOwed).toFixed(2)}
                    </div>
                    <div className="text-xs text-white/40 mt-1">
                        {activeTab === 'owed'
                            ? `${peopleData.filter(p => !p.isSettled).length} active trails`
                            : `${borrowedData.filter(p => !p.isSettled).length} active debts`}
                    </div>
                </div>
            </div>

            {/* They owe me */}
            {activeTab === 'owed' && (
                <div className="space-y-3">
                    {peopleData.length === 0 ? (
                        <div className="text-center py-12 text-nature-700 bg-white/40 backdrop-blur-sm rounded-3xl border-2 border-dashed border-nature-200">
                            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <span className="text-sm font-medium">Your pack is empty</span>
                            <p className="text-xs text-nature-500 mt-1">No lending trails yet. Use "Lent" in New Track to start.</p>
                        </div>
                    ) : (
                        peopleData.map((person, i) => (
                            <div key={person.name} className="animate-item-in" style={{ animationDelay: `${i * 0.05}s`, animationFillMode: 'both' }}>
                                <PersonCard
                                    person={person}
                                    isExpanded={expandedPerson === `lent-${person.name}`}
                                    onToggle={() => setExpandedPerson(expandedPerson === `lent-${person.name}` ? null : `lent-${person.name}`)}
                                    onAddRepayment={(name, amt) => addRepayment({ personName: name, amount: amt })}
                                    onDeleteItem={setItemToDelete}
                                    accentColor="amber"
                                />
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* I owe */}
            {activeTab === 'iowe' && (
                <div className="space-y-3">
                    {borrowedData.length === 0 ? (
                        <div className="text-center py-12 text-nature-700 bg-white/40 backdrop-blur-sm rounded-3xl border-2 border-dashed border-nature-200">
                            <Landmark className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <span className="text-sm font-medium">No debts recorded</span>
                            <p className="text-xs text-nature-500 mt-1">Use "Borrowed" in New Track to log money you've taken.</p>
                        </div>
                    ) : (
                        borrowedData.map((person, i) => (
                            <div key={person.name} className="animate-item-in" style={{ animationDelay: `${i * 0.05}s`, animationFillMode: 'both' }}>
                                <PersonCard
                                    person={person}
                                    isExpanded={expandedPerson === `borrowed-${person.name}`}
                                    onToggle={() => setExpandedPerson(expandedPerson === `borrowed-${person.name}` ? null : `borrowed-${person.name}`)}
                                    onAddRepayment={(name, amt) => addBorrowedRepayment({ personName: name, amount: amt })}
                                    onDeleteItem={setItemToDelete}
                                    accentColor="blue"
                                />
                            </div>
                        ))
                    )}
                </div>
            )}

            <ConfirmationDialog
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={() => {
                    if (activeTab === 'owed') handleDeleteLent();
                    else handleDeleteBorrowed();
                    setItemToDelete(null);
                }}
                title="Delete Record"
                message={`Delete this ${itemToDelete?.type === 'tx' ? 'transaction' : 'repayment'} of ₹${itemToDelete?.amount?.toFixed(2)}?`}
                confirmText="Delete"
                isDestructive={true}
            />
        </div>
    );
}
