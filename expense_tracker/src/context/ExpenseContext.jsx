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

function getPreviousMonthKey(monthKey) {
    const [year, month] = monthKey.split('-').map(Number);
    const d = new Date(year, month - 2, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
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

    useEffect(() => {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }, [transactions]);

    useEffect(() => {
        localStorage.setItem('repayments', JSON.stringify(repayments));
    }, [repayments]);

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

    // Get monthly data for a specific month, with carry-over from all previous months
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

        // Carry-over: sum of all income - expenses from all months BEFORE this one
        const carryOver = transactions
            .filter(t => getMonthKey(t.date) < monthKey)
            .reduce((acc, t) => {
                if (t.type === 'income') return acc + t.amount;
                if (t.type === 'expense') return acc - t.amount;
                if (t.type === 'lent') return acc - t.amount;
                return acc;
            }, 0)
            // Add repayments received before this month
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

    // Current month data
    const currentMonthKey = getCurrentMonthKey();
    const currentMonth = useMemo(() => getMonthlyData(currentMonthKey), [getMonthlyData, currentMonthKey]);

    // Overall balance (all time)
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

    // People / Lending data
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
        }}>
            {children}
        </ExpenseContext.Provider>
    );
}

export function useExpenses() {
    return useContext(ExpenseContext);
}
