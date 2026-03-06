import { useState, useEffect } from 'react';
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
  const { addTransaction } = useExpenses();

  const [processedIds, setProcessedIds] = useState(new Set());

  const handleDeepLink = (url) => {
    if (!url) return;
    try {
      const urlObj = new URL(url);

      if (url.includes('add-expense')) {
        setIsAddModalOpen(true);
      }

      if (url.includes('save-transaction')) {
        const params = new URLSearchParams(urlObj.search);

        // Generate a unique ID for this specific deep link event based on params + time
        // Since we don't have a unique ID from the intent, we'll use a simple check
        // to ensure we don't process the exact same transaction within a few seconds.
        const name = params.get('name');
        const amount = parseFloat(params.get('amount'));
        const category = params.get('category');

        // Create a temporary unique key for this transaction attempt
        const key = `${name}-${amount}-${category}-${new Date().getMinutes()}`;

        if (processedIds.has(key)) {
          console.log('Transaction already processed:', key);
          return;
        }

        if (name && amount && category) {
          // Calculate local time for correct storage
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
          // alert('Track Saved! 🍃'); // Removed to bypass confirmation

          // Clear the processed ID after a minute to allow similar transactions later
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
    switch (activeTab) {
      case 'home': return <Home setActiveTab={setActiveTab} />;
      case 'analytics': return <Analytics />;
      case 'history': return <History />;
      case 'people': return <People />;
      default: return <Home setActiveTab={setActiveTab} />;
    }
  };

  return (
    <>
      <Layout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onAddTransaction={() => setIsAddModalOpen(true)}
      >
        {renderContent()}
      </Layout>

      {isAddModalOpen && (
        <AddTransactionForm onClose={() => setIsAddModalOpen(false)} />
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
