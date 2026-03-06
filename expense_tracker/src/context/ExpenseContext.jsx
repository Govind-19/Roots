import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

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
    const [transactions, setTransactions] = useState(() => {
        const saved = localStorage.getItem('transactions');
        return saved ? JSON.parse(saved) : [];
    });

    const [repayments, setRepayments] = useState(() => {
        const saved = localStorage.getItem('repayments');
        return saved ? JSON.parse(saved) : [];
    });

    const [budgetLimits, setBudgetLimits] = useState(() => {
        const saved = localStorage.getItem('budgetLimits');
        return saved ? JSON.parse(saved) : {};
    });

    const [recurringItems, setRecurringItems] = useState(() => {
        const saved = localStorage.getItem('recurringItems');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }, [transactions]);

    useEffect(() => {
        localStorage.setItem('repayments', JSON.stringify(repayments));
    }, [repayments]);

    useEffect(() => {
        localStorage.setItem('budgetLimits', JSON.stringify(budgetLimits));
    }, [budgetLimits]);

    useEffect(() => {
        localStorage.setItem('recurringItems', JSON.stringify(recurringItems));
    }, [recurringItems]);

    // Process recurring transactions on load
    useEffect(() => {
        const lastProcessed = localStorage.getItem('recurringLastProcessed');
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
            setTransactions(prev => [...newTransactions, ...prev]);
            setRecurringItems(prev => prev.map(item => {
                const wasAdded = newTransactions.some(t => t.recurringId === item.id);
                return wasAdded ? { ...item, lastRun: getTodayKey() } : item;
            }));
        }

        localStorage.setItem('recurringLastProcessed', today);
    }, []);

    const addTransaction = useCallback((transaction) => {
        setTransactions(prev => [{ id: crypto.randomUUID(), ...transaction }, ...prev]);
    }, []);

    const deleteTransaction = useCallback((id) => {
        setTransactions(prev => prev.filter(t => t.id !== id));
    }, []);

    const addRepayment = useCallback((repayment) => {
        setRepayments(prev => [{ id: crypto.randomUUID(), date: new Date().toISOString(), ...repayment }, ...prev]);
    }, []);

    const deleteRepayment = useCallback((id) => {
        setRepayments(prev => prev.filter(r => r.id !== id));
    }, []);

    const setBudgetLimit = useCallback((category, limit) => {
        setBudgetLimits(prev => {
            if (limit <= 0) {
                const next = { ...prev };
                delete next[category];
                return next;
            }
            return { ...prev, [category]: limit };
        });
    }, []);

    const addRecurringItem = useCallback((item) => {
        setRecurringItems(prev => [{ id: crypto.randomUUID(), createdDate: getTodayKey(), paused: false, ...item }, ...prev]);
    }, []);

    const deleteRecurringItem = useCallback((id) => {
        setRecurringItems(prev => prev.filter(r => r.id !== id));
    }, []);

    const toggleRecurringPause = useCallback((id) => {
        setRecurringItems(prev => prev.map(r => r.id === id ? { ...r, paused: !r.paused } : r));
    }, []);

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

    // Health check: expenses > income = warning
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

    // Category spending for current month (for budget tracking)
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
        }}>
            {children}
        </ExpenseContext.Provider>
    );
}

export function useExpenses() {
    return useContext(ExpenseContext);
}
