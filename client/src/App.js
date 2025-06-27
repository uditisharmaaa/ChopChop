import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import ReceiptUpload from './components/ReceiptUpload';
import Dashboard from './components/Dashboard';
import Login from './Login';

function App() {
  const [session, setSession] = useState(null);
  const [page, setPage] = useState('login');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) console.error('Error getting session:', error.message);

      const currentSession = data?.session;
      setSession(currentSession);

      if (currentSession) {
        const savedPage = localStorage.getItem('page');
        setPage(savedPage || 'dashboard');
      } else {
        setPage('login');
      }

      setLoading(false);
    };

    fetchSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state change:', _event, session);
      setSession(session);

      if (session) {
        const savedPage = localStorage.getItem('page');
        setPage(savedPage || 'dashboard');
      } else {
        setPage('login');
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      localStorage.setItem('page', page);
    }
  }, [page, session]);

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  if (!session) {
    return <Login onLogin={() => setPage('scan')} />;
  }

  switch (page) {
    case 'scan':
      return <ReceiptUpload onContinue={() => setPage('dashboard')} />;
    case 'dashboard':
      return <Dashboard onAddReceipt={() => setPage('scan')} onLogout={() => setPage('login')} />;
    default:
      return <Dashboard onAddReceipt={() => setPage('scan')} onLogout={() => setPage('login')} />;
  }
}

export default App;
