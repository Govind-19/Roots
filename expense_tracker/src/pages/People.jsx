import { useState, useRef, useEffect } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { Users, ChevronDown, ChevronUp, CheckCircle2, Plus, Trash2 } from 'lucide-react';
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
            style={{
                maxHeight: isExpanded ? `${height}px` : '0px',
                opacity: isExpanded ? 1 : 0,
            }}
        >
            <div ref={contentRef}>
                {children}
            </div>
        </div>
    );
}

export default function People() {
    const { peopleData, totalOutstanding, addRepayment, deleteTransaction, deleteRepayment, isWarning } = useExpenses();
    const [expandedPerson, setExpandedPerson] = useState(null);
    const [repaymentAmount, setRepaymentAmount] = useState('');
    const [repaymentPerson, setRepaymentPerson] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);

    const handleAddRepayment = (personName) => {
        const amt = parseFloat(repaymentAmount);
        if (!amt || amt <= 0) return;
        addRepayment({ personName, amount: amt });
        setRepaymentAmount('');
        setRepaymentPerson(null);
    };

    const cardBg = isWarning ? 'bg-[var(--theme-accent-900)]/90' : 'bg-nature-900/90';
    const cardBorder = isWarning ? 'border-[var(--theme-accent-700)]/50' : 'border-nature-700/50';

    return (
        <div className="p-6 pb-24 space-y-6">
            <header>
                <h1 className="text-xl font-bold text-nature-900 mb-0.5">Pack Ledger</h1>
                <p className="text-nature-700 text-xs">Track what your pack owes</p>
            </header>

            {/* Outstanding Summary */}
            <div className={cn("backdrop-blur-md rounded-[2rem] p-5 text-cream relative overflow-hidden theme-transition border", cardBg, cardBorder)}>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1 text-white/60">
                        <Users className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-medium tracking-wider uppercase">Total Owed to You</span>
                    </div>
                    <div className="text-3xl font-serif font-bold">
                        {totalOutstanding.toFixed(2)}
                    </div>
                    <div className="text-xs text-white/40 mt-1">
                        {peopleData.filter(p => !p.isSettled).length} active {peopleData.filter(p => !p.isSettled).length === 1 ? 'trail' : 'trails'}
                    </div>
                </div>
            </div>

            {/* People List */}
            <div className="space-y-3">
                {peopleData.length === 0 ? (
                    <div className="text-center py-12 text-nature-700 bg-white/40 backdrop-blur-sm rounded-3xl border-2 border-dashed border-nature-200">
                        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <span className="text-sm font-medium">Your pack is empty</span>
                        <p className="text-xs text-nature-500 mt-1">No lending trails yet. Use "Lent" in New Track to start.</p>
                    </div>
                ) : (
                    peopleData.map((person, i) => {
                        const isExpanded = expandedPerson === person.name;
                        return (
                            <div
                                key={person.name}
                                className={cn(
                                    "bg-white/60 backdrop-blur-md rounded-2xl border transition-all animate-item-in",
                                    person.isSettled ? "border-green-200/50" : "border-amber-200/50"
                                )}
                                style={{ animationDelay: `${i * 0.05}s`, animationFillMode: 'both' }}
                            >
                                {/* Person Header */}
                                <button
                                    onClick={() => setExpandedPerson(isExpanded ? null : person.name)}
                                    className="w-full p-4 flex justify-between items-center"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-inner",
                                            person.isSettled
                                                ? "bg-green-100/80 text-green-700"
                                                : "bg-amber-100/80 text-amber-700"
                                        )}>
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
                                            <div className={cn(
                                                "font-bold text-sm font-serif",
                                                person.isSettled ? "text-green-700" : "text-amber-700"
                                            )}>
                                                {person.isSettled ? 'Settled' : `${Math.max(0, person.outstanding).toFixed(2)}`}
                                            </div>
                                            {!person.isSettled && (
                                                <div className="text-[10px] text-nature-500">
                                                    of {person.totalLent.toFixed(2)}
                                                </div>
                                            )}
                                        </div>
                                        <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                            <ChevronDown className="w-4 h-4 text-nature-400" />
                                        </div>
                                    </div>
                                </button>

                                {/* Expanded Details */}
                                <ExpandableSection isExpanded={isExpanded}>
                                    <div className="px-4 pb-4 space-y-3 border-t border-nature-100/50 pt-3">
                                        {/* Stats Row */}
                                        <div className="flex gap-2">
                                            <div className="flex-1 bg-amber-50/80 p-2.5 rounded-xl text-center">
                                                <div className="text-[9px] text-amber-600 uppercase tracking-wide font-bold">Lent</div>
                                                <div className="font-bold text-sm text-amber-800">{person.totalLent.toFixed(2)}</div>
                                            </div>
                                            <div className="flex-1 bg-green-50/80 p-2.5 rounded-xl text-center">
                                                <div className="text-[9px] text-green-600 uppercase tracking-wide font-bold">Repaid</div>
                                                <div className="font-bold text-sm text-green-800">{person.totalRepaid.toFixed(2)}</div>
                                            </div>
                                            <div className="flex-1 bg-nature-50/80 p-2.5 rounded-xl text-center">
                                                <div className="text-[9px] text-nature-600 uppercase tracking-wide font-bold">Pending</div>
                                                <div className="font-bold text-sm text-nature-800">{Math.max(0, person.outstanding).toFixed(2)}</div>
                                            </div>
                                        </div>

                                        {/* Transaction History */}
                                        <div className="space-y-1.5">
                                            <div className="text-[10px] font-bold text-nature-500 uppercase tracking-wider">Lending History</div>
                                            {person.transactions.map(t => (
                                                <div key={t.id} className="flex justify-between items-center bg-amber-50/50 p-2.5 rounded-xl text-sm">
                                                    <div>
                                                        <span className="font-medium text-nature-800">{t.name || 'Lent'}</span>
                                                        <span className="text-[10px] text-nature-500 ml-2">
                                                            {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-amber-700">{t.amount.toFixed(2)}</span>
                                                        <button onClick={() => setItemToDelete({ type: 'lent', id: t.id, amount: t.amount })} className="p-1 text-nature-300 hover:text-red-500 rounded-full transition-colors">
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Repayment History */}
                                        {person.repayments.length > 0 && (
                                            <div className="space-y-1.5">
                                                <div className="text-[10px] font-bold text-nature-500 uppercase tracking-wider">Repayments</div>
                                                {person.repayments.map(r => (
                                                    <div key={r.id} className="flex justify-between items-center bg-green-50/50 p-2.5 rounded-xl text-sm">
                                                        <span className="text-[10px] text-nature-500">
                                                            {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-green-700">+{r.amount.toFixed(2)}</span>
                                                            <button onClick={() => setItemToDelete({ type: 'repayment', id: r.id, amount: r.amount })} className="p-1 text-nature-300 hover:text-red-500 rounded-full transition-colors">
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Add Repayment */}
                                        {!person.isSettled && (
                                            <div className="flex gap-2">
                                                {repaymentPerson === person.name ? (
                                                    <>
                                                        <div className="relative flex-1">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-nature-400 text-sm font-bold">{'\u20B9'}</span>
                                                            <input
                                                                type="number"
                                                                value={repaymentAmount}
                                                                onChange={(e) => setRepaymentAmount(e.target.value)}
                                                                className="w-full pl-7 pr-3 py-2.5 bg-white border-2 border-sand rounded-xl text-sm font-bold text-nature-900 placeholder:text-nature-300 focus:ring-2 focus:ring-nature-100 focus:border-nature-800"
                                                                placeholder="0.00"
                                                                autoFocus
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => handleAddRepayment(person.name)}
                                                            className="px-4 py-2.5 bg-green-700 text-white rounded-xl font-bold text-sm hover:bg-green-800 active:scale-95 transition-all"
                                                        >
                                                            Add
                                                        </button>
                                                        <button
                                                            onClick={() => { setRepaymentPerson(null); setRepaymentAmount(''); }}
                                                            className="px-3 py-2.5 bg-nature-100 text-nature-700 rounded-xl font-bold text-sm hover:bg-nature-200 transition-all"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => setRepaymentPerson(person.name)}
                                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-50 text-green-700 rounded-xl font-bold text-sm border border-green-200/50 hover:bg-green-100 transition-all"
                                                    >
                                                        <Plus className="w-4 h-4" /> Record Repayment
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </ExpandableSection>
                            </div>
                        );
                    })
                )}
            </div>

            <ConfirmationDialog
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={() => {
                    if (itemToDelete.type === 'lent') deleteTransaction(itemToDelete.id);
                    else deleteRepayment(itemToDelete.id);
                }}
                title="Delete Record"
                message={`Delete this ${itemToDelete?.type === 'lent' ? 'lending' : 'repayment'} of ${'\u20B9'}${itemToDelete?.amount?.toFixed(2)}?`}
                confirmText="Delete"
                isDestructive={true}
            />
        </div>
    );
}
