import React from 'react';
import './styles/App.css';

function App() {
  return (
    <div className="App">
      <div style={{
        padding: '50px',
        textAlign: 'center',
        backgroundColor: '#2c3e50',
        color: 'white',
        minHeight: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h1 style={{ fontSize: '2.5em', marginBottom: '20px' }}>🏫 Smart Kids Global</h1>
        <p style={{ fontSize: '1.2em', marginBottom: '30px' }}>Sistem Presensi Digital</p>
        
        <div style={{
          backgroundColor: 'white',
          color: '#2c3e50',
          padding: '30px',
          borderRadius: '10px',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          <h2 style={{ color: '#27ae60' }}>✅ React Berhasil Load!</h2>
          <p>Aplikasi sedang dalam pengembangan.</p>
          
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            <h4>Login Info:</h4>
            <p><strong>Username:</strong> adminsmartkids</p>
            <p><strong>Password:</strong> @SmartKids123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;