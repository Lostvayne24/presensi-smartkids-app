// components/ChangePassword.js
import React, { useState } from 'react';
import { changeCurrentUserPassword } from '../services/firebaseAuth';

const ChangePassword = ({ user }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setMessage({ type: '', text: '' });
  };

  const validateForm = () => {
    if (!formData.currentPassword.trim()) {
      setMessage({ type: 'error', text: 'Password saat ini harus diisi' });
      return false;
    }
    
    if (!formData.newPassword.trim()) {
      setMessage({ type: 'error', text: 'Password baru harus diisi' });
      return false;
    }
    
    if (formData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password baru minimal 6 karakter' });
      return false;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Konfirmasi password tidak cocok' });
      return false;
    }
    
    if (formData.currentPassword === formData.newPassword) {
      setMessage({ type: 'error', text: 'Password baru harus berbeda dengan password saat ini' });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      
      const result = await changeCurrentUserPassword(
        formData.currentPassword,
        formData.newPassword
      );
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: 'Password berhasil diubah! Silakan login kembali dengan password baru Anda.' 
        });
        
        // Reset form
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        // Auto close form after 5 seconds
        setTimeout(() => {
          setShowForm(false);
        }, 5000);
        
      } else {
        setMessage({ type: 'error', text: result.error });
      }
      
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan sistem' });
    } finally {
      setLoading(false);
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setMessage({ type: '', text: '' });
  };

  if (!showForm) {
    return (
      <div className="change-password-section">
        <button 
          className="change-password-btn"
          onClick={() => setShowForm(true)}
        >
          🔐 Ubah Password Saya
        </button>
      </div>
    );
  }

  return (
    <div className="change-password-form">
      <h4>Ubah Password</h4>
      
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Password Saat Ini:</label>
          <input
            type="password"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            placeholder="Masukkan password saat ini"
            required
            disabled={loading}
            autoComplete="current-password"
          />
        </div>
        
        <div className="form-group">
          <label>Password Baru:</label>
          <input
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            placeholder="Password baru (min 6 karakter)"
            required
            disabled={loading}
            minLength="6"
            autoComplete="new-password"
          />
          <small className="form-hint">Minimal 6 karakter</small>
        </div>
        
        <div className="form-group">
          <label>Konfirmasi Password Baru:</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Konfirmasi password baru"
            required
            disabled={loading}
            autoComplete="new-password"
          />
        </div>
        
        <div className="password-strength">
          <p><strong>Tips password yang kuat:</strong></p>
          <ul>
            <li className={formData.newPassword.length >= 6 ? 'valid' : ''}>
              Minimal 6 karakter
            </li>
            <li className={/[A-Z]/.test(formData.newPassword) ? 'valid' : ''}>
              Mengandung huruf besar
            </li>
            <li className={/[a-z]/.test(formData.newPassword) ? 'valid' : ''}>
              Mengandung huruf kecil
            </li>
            <li className={/\d/.test(formData.newPassword) ? 'valid' : ''}>
              Mengandung angka
            </li>
            <li className={/[!@#$%^&*]/.test(formData.newPassword) ? 'valid' : ''}>
              Mengandung simbol
            </li>
          </ul>
        </div>
        
        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Mengubah...' : 'Ubah Password'}
          </button>
          <button 
            type="button" 
            className="cancel-btn"
            onClick={cancelForm}
            disabled={loading}
          >
            Batal
          </button>
        </div>
      </form>
      
      <style jsx>{`
        .change-password-form {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid #ddd;
          margin-bottom: 1.5rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .change-password-form h4 {
          margin-top: 0;
          margin-bottom: 1.5rem;
          color: #333;
          border-bottom: 2px solid #4CAF50;
          padding-bottom: 0.5rem;
        }
        
        .form-group {
          margin-bottom: 1rem;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 0.25rem;
          font-weight: 500;
          color: #555;
        }
        
        .form-group input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 0.9rem;
        }
        
        .form-group input:focus {
          outline: none;
          border-color: #4CAF50;
          box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
        }
        
        .form-hint {
          display: block;
          margin-top: 0.25rem;
          color: #666;
          font-size: 0.8rem;
        }
        
        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        
        .submit-btn {
          background: #4CAF50;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          flex: 1;
        }
        
        .submit-btn:hover:not(:disabled) {
          background: #45a049;
        }
        
        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .cancel-btn {
          background: #f5f5f5;
          color: #666;
          border: 1px solid #ddd;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          cursor: pointer;
          flex: 1;
        }
        
        .cancel-btn:hover:not(:disabled) {
          background: #e9e9e9;
        }
        
        .message {
          padding: 0.75rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }
        
        .message.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        
        .message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        
        .password-strength {
          margin-top: 1rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 4px;
          font-size: 0.85rem;
        }
        
        .password-strength p {
          margin-top: 0;
          margin-bottom: 0.5rem;
          color: #333;
        }
        
        .password-strength ul {
          margin: 0;
          padding-left: 1.5rem;
        }
        
        .password-strength li {
          margin-bottom: 0.25rem;
          color: #666;
        }
        
        .password-strength li.valid {
          color: #28a745;
        }
        
        .password-strength li.valid:before {
          content: "✓ ";
          color: #28a745;
        }
        
        .change-password-btn {
          background: #4CAF50;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .change-password-btn:hover {
          background: #45a049;
        }
        
        .change-password-section {
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
};

export default ChangePassword;