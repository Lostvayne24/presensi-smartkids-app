// App.js
import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import AdminPage from './pages/AdminPage';
import UserPage from './pages/UserPage';
import { getCurrentUser, logout as firebaseLogout, initializeDefaultAdmin } from './services/firebaseAuth';
import './styles/App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize default admin user
        await initializeDefaultAdmin();
        
        // Check if user is logged in
        const currentUser = getCurrentUser();
        console.log('🔄 Current user from localStorage:', currentUser);
        
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('❌ Error initializing app:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleLogin = (userData) => {
    console.log('✅ User logged in:', userData);
    setUser(userData);
  };

  const handleLogout = async () => {
    console.log('👋 Logging out user');
    await firebaseLogout();
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#2c3e50'
      }}>
        Loading Sistem Presensi...
      </div>
    );
  }

  // Debug: Log user data untuk memastikan role terbaca
  console.log('👤 Current user in App:', user);
  console.log('🎭 User role:', user?.role);
  console.log('🏠 Should show admin page:', user?.role === 'admin');

  return (
    <div className="App">
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : user.role === 'admin' ? (
        <AdminPage user={user} onLogout={handleLogout} />
      ) : (
        <UserPage user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;