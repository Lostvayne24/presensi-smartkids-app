import React from 'react';
import Dashboard from '../components/Dashboard';
import logo from '../assets/logo-smartkids.jpeg';

const AdminPage = ({ user, onLogout }) => {
  return (
    <div className="admin-page">
      <header className="header">
        <div className="header-content">
          <div className="logo-header">
            <img src={logo} alt="Smart Kids Logo" className="logo" />
            <div className="header-text">
              <h1>Sistem Presensi Digital</h1>
              <p className="subtitle">Smart Kids Global Institute</p>
            </div>
          </div>
          <div className="user-info">
            <span>Halo, {user.name} (Admin)</span>
            <button onClick={onLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>
      <main>
        <Dashboard user={user} />
      </main>
    </div>
  );
};

export default AdminPage;