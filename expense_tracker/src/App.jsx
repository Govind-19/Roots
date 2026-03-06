import { useState, useEffect, useRef } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { ExpenseProvider, useExpenses } from './context/ExpenseContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Analytics from './pages/Analytics';
import History from './pages/History';
import People from './pages/People';
import AddTransactionForm from './components/AddTransactionForm';

function AppContent() {
    const [activeTab, setActiveTab] = useState('home');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [initialType, setInitialType] = useState('expense');
    const [tabKey, setTabKey] = useState(0);
    const { addTransaction, isWarning } = useExpenses();

    const [processedIds, setProcessedIds] = useState(new Set());

    // Dynamic theme system
    useEffect(() => {
        const root = document.documentElement;
        if (isWarning) {
            root.classList.add('theme-warning');
        } else {
            root.classList.remove('theme-warning');
        }
    }, [isWarning]);

    const handleTabChange = (tab) => {
        if (tab !== activeTab) {
            setTabKey(prev => prev + 1);
            setActiveTab(tab);
        }
    };

    const handleOpenModal = (type = 'expense') => {
        setInitialType(type);
        setIsAddModalOpen(true);
    };

    const handleDeepLink = (url) => {
        if (!url) return;
        try {
            const urlObj = new URL(url);

            if (url.includes('add-expense')) {
                setIsAddModalOpen(true);
            }

            if (url.includes('save-transaction')) {
                const params = new URLSearchParams(urlObj.search);
                const name = params.get('name');
                const amount = parseFloat(params.get('amount'));
                const category = params.get('category');

                const key = `${name}-${amount}-${category}-${new Date().getMinutes()}`;

                if (processedIds.has(key)) return;

                if (name && amount && category) {
                    const now = new Date();
                    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                    const localDate = now.toISOString().slice(0, 16);

                    addTransaction({
                        name,
                        amount,
                        category,
                        type: 'expense',
                        paymentMode: 'upi',
                        date: localDate,
                        note: 'Quick Add'
                    });

                    setProcessedIds(prev => new Set(prev).add(key));

                    setTimeout(() => {
                        setProcessedIds(prev => {
                            const next = new Set(prev);
                            next.delete(key);
                            return next;
                        });
                    }, 60000);
                }
            }
        } catch (e) {
            console.error('Deep link error:', e);
        }
    };

    useEffect(() => {
        let isMounted = true;

        CapacitorApp.addListener('appUrlOpen', (data) => {
            if (isMounted) handleDeepLink(data.url);
        });

        CapacitorApp.getLaunchUrl().then((data) => {
            if (isMounted && data && data.url) {
                handleDeepLink(data.url);
            }
        });

        return () => { isMounted = false; };
    }, [addTransaction]);

    const renderContent = () => {
        const content = (() => {
            switch (activeTab) {
                case 'home': return <Home setActiveTab={handleTabChange} />;
                case 'analytics': return <Analytics />;
                case 'history': return <History />;
                case 'people': return <People />;
                default: return <Home setActiveTab={handleTabChange} />;
            }
        })();

        return (
            <div key={tabKey} className="animate-tab-in">
                {content}
            </div>
        );
    };

    return (
        <>
            <Layout
                activeTab={activeTab}
                setActiveTab={handleTabChange}
                onAddTransaction={handleOpenModal}
                isWarning={isWarning}
            >
                {renderContent()}
            </Layout>

            {isAddModalOpen && (
                <AddTransactionForm
                    onClose={() => setIsAddModalOpen(false)}
                    initialType={initialType}
                />
            )}
        </>
    );
}

function App() {
    return (
        <ExpenseProvider>
            <AppContent />
        </ExpenseProvider>
    );
}

export default App;
