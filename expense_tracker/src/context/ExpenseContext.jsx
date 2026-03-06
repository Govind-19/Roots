import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import {
    doc,
    getDoc,
    setDoc,
    onSnapshot,
} from 'firebase/firestore';

const ExpenseContext = createContext();

function getMonthKey(dateStr) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getCurrentMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getTodayKey() {
    return new Date().toISOString().split('T')[0];
}

export function ExpenseProvider({ children }) {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [repayments, setRepayments] = useState([]);
    const [budgetLimits, setBudgetLimits] = useState({});
    const [recurringItems, setRecurringItems] = useState([]);
    const [dataLoaded, setDataLoaded] = useState(false);

    // Helper to get Firestore doc ref for the user
    const getUserDocRef = useCallback(() => {
        if (!user) return null;
        return doc(db, 'users', user.uid);
    }, [user]);

    // Save all data to Firestore
    const saveToFirestore = useCallback(async (data) => {
        const ref = getUserDocRef();
        if (!ref) return;
        try {
            await setDoc(ref, {
                transactions: data.transactions ?? transactions,
                repayments: data.repayments ?? repayments,
                budgetLimits: data.budgetLimits ?? budgetLimits,
                recurringItems: data.recurringItems ?? recurringItems,
                updatedAt: new Date().toISOString(),
            }, { merge: true });
        } catch (err) {
            console.error('Error saving to Firestore:', err);
        }
    }, [getUserDocRef, transactions, repayments, budgetLimits, recurringItems]);

    // Load data from Firestore on login, migrate localStorage data if present
    useEffect(() => {
        if (!user) {
            setTransactions([]);
            setRepayments([]);
            setBudgetLimits({});
            setRecurringItems([]);
            setDataLoaded(false);
            return;
        }

        const ref = doc(db, 'users', user.uid);

        const unsubscribe = onSnapshot(ref, async (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                setTransactions(data.transactions || []);
                setRepayments(data.repayments || []);
                setBudgetLimits(data.budgetLimits || {});
                setRecurringItems(data.recurringItems || []);
            } else {
                // First login - migrate localStorage data if available
                const localTx = localStorage.getItem('transactions');
                const localRep = localStorage.getItem('repayments');
                const localBudget = localStorage.getItem('budgetLimits');
                const localRecurring = localStorage.getItem('recurringItems');

                const migrated = {
                    transactions: localTx ? JSON.parse(localTx) : [],
                    repayments: localRep ? JSON.parse(localRep) : [],
                    budgetLimits: localBudget ? JSON.parse(localBudget) : {},
                    recurringItems: localRecurring ? JSON.parse(localRecurring) : [],
                    updatedAt: new Date().toISOString(),
                };

                await setDoc(ref, migrated);
                setTransactions(migrated.transactions);
                setRepayments(migrated.repayments);
                setBudgetLimits(migrated.budgetLimits);
                setRecurringItems(migrated.recurringItems);

                // Clear localStorage after migration
                if (localTx || localRep || localBudget || localRecurring) {
                    localStorage.removeItem('transactions');
                    localStorage.removeItem('repayments');
                    localStorage.removeItem('budgetLimits');
                    localStorage.removeItem('recurringItems');
                    localStorage.removeItem('recurringLastProcessed');
                }
            }
            setDataLoaded(true);
        });

        return () => unsubscribe();
    }, [user]);

    // Process recurring transactions on load
    useEffect(() => {
        if (!dataLoaded || !user) return;

        const lastProcessed = localStorage.getItem(`recurringLastProcessed_${user.uid}`);
        const today = getTodayKey();
        if (lastProcessed === today) return;

        const now = new Date();
        const newTransactions = [];

        recurringItems.forEach(item => {
            if (item.paused) return;
            const lastRun = item.lastRun ? new Date(item.lastRun) : new Date(item.createdDate);
            let shouldAdd = false;

            if (item.frequency === 'daily') {
                shouldAdd = getTodayKey() > (item.lastRun || item.createdDate);
            } else if (item.frequency === 'weekly') {
                const daysSince = Math.floor((now - lastRun) / (1000 * 60 * 60 * 24));
                shouldAdd = daysSince >= 7;
            } else if (item.frequency === 'monthly') {
                const monthsSince = (now.getFullYear() - lastRun.getFullYear()) * 12 + (now.getMonth() - lastRun.getMonth());
                shouldAdd = monthsSince >= 1;
            }

            if (shouldAdd) {
                const localNow = new Date();
                localNow.setMinutes(localNow.getMinutes() - localNow.getTimezoneOffset());
                newTransactions.push({
                    id: crypto.randomUUID(),
                    name: item.name,
                    amount: item.amount,
                    type: item.type,
                    category: item.category,
                    paymentMode: item.paymentMode,
                    date: localNow.toISOString().slice(0, 16),
                    note: `Recurring (${item.frequency})`,
                    recurring: true,
                    recurringId: item.id,
                    ...(item.personName ? { personName: item.personName } : {}),
                });
            }
        });

        if (newTransactions.length > 0) {
            const updatedTransactions = [...newTransactions, ...transactions];
            const updatedRecurring = recurringItems.map(item => {
                const wasAdded = newTransactions.some(t => t.recurringId === item.id);
                return wasAdded ? { ...item, lastRun: getTodayKey() } : item;
            });
            setTransactions(updatedTransactions);
            setRecurringItems(updatedRecurring);
            saveToFirestore({ transactions: updatedTransactions, recurringItems: updatedRecurring });
        }

        localStorage.setItem(`recurringLastProcessed_${user.uid}`, today);
    }, [dataLoaded]);

    const addTransaction = useCallback((transaction) => {
        setTransactions(prev => {
            const updated = [{ id: crypto.randomUUID(), ...transaction }, ...prev];
            saveToFirestore({ transactions: updated });
            return updated;
        });
    }, [saveToFirestore]);

    const deleteTransaction = useCallback((id) => {
        setTransactions(prev => {
            const updated = prev.filter(t => t.id !== id);
            saveToFirestore({ transactions: updated });
            return updated;
        });
    }, [saveToFirestore]);

    const addRepayment = useCallback((repayment) => {
        setRepayments(prev => {
            const updated = [{ id: crypto.randomUUID(), date: new Date().toISOString(), ...repayment }, ...prev];
            saveToFirestore({ repayments: updated });
            return updated;
        });
    }, [saveToFirestore]);

    const deleteRepayment = useCallback((id) => {
        setRepayments(prev => {
            const updated = prev.filter(r => r.id !== id);
            saveToFirestore({ repayments: updated });
            return updated;
        });
    }, [saveToFirestore]);

    const setBudgetLimit = useCallback((category, limit) => {
        setBudgetLimits(prev => {
            let updated;
            if (limit <= 0) {
                updated = { ...prev };
                delete updated[category];
            } else {
                updated = { ...prev, [category]: limit };
            }
            saveToFirestore({ budgetLimits: updated });
            return updated;
        });
    }, [saveToFirestore]);

    const addRecurringItem = useCallback((item) => {
        setRecurringItems(prev => {
            const updated = [{ id: crypto.randomUUID(), createdDate: getTodayKey(), paused: false, ...item }, ...prev];
            saveToFirestore({ recurringItems: updated });
            return updated;
        });
    }, [saveToFirestore]);

    const deleteRecurringItem = useCallback((id) => {
        setRecurringItems(prev => {
            const updated = prev.filter(r => r.id !== id);
            saveToFirestore({ recurringItems: updated });
            return updated;
        });
    }, [saveToFirestore]);

    const toggleRecurringPause = useCallback((id) => {
        setRecurringItems(prev => {
            const updated = prev.map(r => r.id === id ? { ...r, paused: !r.paused } : r);
            saveToFirestore({ recurringItems: updated });
            return updated;
        });
    }, [saveToFirestore]);

    const getMonthlyData = useCallback((monthKey) => {
        const monthTransactions = transactions.filter(t => getMonthKey(t.date) === monthKey);
        const monthIncome = monthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        const monthExpenses = monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        const monthLent = monthTransactions
            .filter(t => t.type === 'lent')
            .reduce((sum, t) => sum + t.amount, 0);

        const carryOver = transactions
            .filter(t => getMonthKey(t.date) < monthKey)
            .reduce((acc, t) => {
                if (t.type === 'income') return acc + t.amount;
                if (t.type === 'expense') return acc - t.amount;
                if (t.type === 'lent') return acc - t.amount;
                return acc;
            }, 0)
            + repayments
                .filter(r => getMonthKey(r.date) < monthKey)
                .reduce((sum, r) => sum + r.amount, 0);

        const monthRepayments = repayments
            .filter(r => getMonthKey(r.date) === monthKey)
            .reduce((sum, r) => sum + r.amount, 0);

        return {
            income: monthIncome,
            expenses: monthExpenses,
            lent: monthLent,
            carryOver,
            repayments: monthRepayments,
            balance: carryOver + monthIncome - monthExpenses - monthLent + monthRepayments,
            transactions: monthTransactions,
        };
    }, [transactions, repayments]);

    const currentMonthKey = getCurrentMonthKey();
    const currentMonth = useMemo(() => getMonthlyData(currentMonthKey), [getMonthlyData, currentMonthKey]);

    const isWarning = useMemo(() => {
        return currentMonth.expenses > currentMonth.income && currentMonth.income > 0;
    }, [currentMonth.expenses, currentMonth.income]);

    const balance = useMemo(() => {
        const txBalance = transactions.reduce((acc, t) => {
            if (t.type === 'income') return acc + t.amount;
            if (t.type === 'expense') return acc - t.amount;
            if (t.type === 'lent') return acc - t.amount;
            return acc;
        }, 0);
        const repaymentBalance = repayments.reduce((sum, r) => sum + r.amount, 0);
        return txBalance + repaymentBalance;
    }, [transactions, repayments]);

    const income = useMemo(() =>
        transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0),
        [transactions]);

    const expense = useMemo(() =>
        transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0),
        [transactions]);

    const categorySpending = useMemo(() => {
        const spending = {};
        transactions
            .filter(t => t.type === 'expense' && getMonthKey(t.date) === currentMonthKey)
            .forEach(t => {
                spending[t.category] = (spending[t.category] || 0) + t.amount;
            });
        return spending;
    }, [transactions, currentMonthKey]);

    const peopleData = useMemo(() => {
        const lentTransactions = transactions.filter(t => t.type === 'lent');
        const peopleMap = {};

        lentTransactions.forEach(t => {
            const name = (t.personName || '').trim().toLowerCase();
            if (!name) return;
            if (!peopleMap[name]) {
                peopleMap[name] = {
                    name: t.personName.trim(),
                    transactions: [],
                    repayments: [],
                    totalLent: 0,
                    totalRepaid: 0,
                };
            }
            peopleMap[name].transactions.push(t);
            peopleMap[name].totalLent += t.amount;
        });

        repayments.forEach(r => {
            const name = (r.personName || '').trim().toLowerCase();
            if (!name || !peopleMap[name]) return;
            peopleMap[name].repayments.push(r);
            peopleMap[name].totalRepaid += r.amount;
        });

        return Object.values(peopleMap).map(p => ({
            ...p,
            outstanding: p.totalLent - p.totalRepaid,
            isSettled: p.totalRepaid >= p.totalLent,
        })).sort((a, b) => b.outstanding - a.outstanding);
    }, [transactions, repayments]);

    const totalOutstanding = useMemo(() =>
        peopleData.reduce((sum, p) => sum + Math.max(0, p.outstanding), 0),
        [peopleData]);

    return (
        <ExpenseContext.Provider value={{
            transactions,
            repayments,
            addTransaction,
            deleteTransaction,
            addRepayment,
            deleteRepayment,
            balance,
            income,
            expense,
            currentMonth,
            currentMonthKey,
            getMonthlyData,
            getMonthKey,
            peopleData,
            totalOutstanding,
            isWarning,
            budgetLimits,
            setBudgetLimit,
            categorySpending,
            recurringItems,
            addRecurringItem,
            deleteRecurringItem,
            toggleRecurringPause,
            dataLoaded,
        }}>
            {children}
        </ExpenseContext.Provider>
    );
}

export function useExpenses() {
    return useContext(ExpenseContext);
}
