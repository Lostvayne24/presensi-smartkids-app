import React, { useState, useEffect } from 'react';
import { 
  getAllUsers, 
  addUser, 
  updateUser, 
  deleteUser, 
  enableUser,
  checkEmailExists,
  // updateUserPassword,
  resetPassword
} from '../services/firebaseAuth';

const UserManagement = ({ onUserUpdate }) => {
  const [users, setUsers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const userList = await getAllUsers();
      setUsers(Array.isArray(userList) ? userList : []);
    } catch (error) {
      console.error('Error loading users:', error);
      setMessage({ type: 'error', text: 'Gagal memuat data user' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // const handlePasswordChange = (e) => {
  //   setPasswordData({
  //     ...passwordData,
  //     [e.target.name]: e.target.value
  //   });
  // };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setMessage({ type: 'error', text: 'Email harus diisi' });
      return false;
    }
    if (!formData.email.includes('@')) {
      setMessage({ type: 'error', text: 'Format email tidak valid' });
      return false;
    }
    if (!formData.password.trim() && !editingUser) {
      setMessage({ type: 'error', text: 'Password harus diisi' });
      return false;
    }
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Nama harus diisi' });
      return false;
    }
    if (formData.password.length < 6 && !editingUser) {
      setMessage({ type: 'error', text: 'Password minimal 6 karakter' });
      return false;
    }
    return true;
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!validateForm()) return;
    try {
      setLoading(true);
      
      const emailExists = await checkEmailExists(formData.email);
      if (emailExists) {
        setMessage({ type: 'error', text: 'Email sudah digunakan' });
        return;
      }

      const result = await addUser(formData);
      if (result.success) {
        setMessage({ type: 'success', text: 'User berhasil ditambahkan' });
        setFormData({ email: '', password: '', name: '' });
        setShowAddForm(false);
        await loadUsers();
        if (onUserUpdate) onUserUpdate();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan sistem' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '', // Kosongkan password
      name: user.name
    });
    setShowAddForm(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!validateForm()) return;

    try {
      setLoading(true);

      const updates = {
        name: formData.name,
        email: formData.email
      };

      // Only include password if provided
      if (formData.password.trim()) {
        // Note: Password update handled separately by user themselves
        setMessage({ 
          type: 'warning', 
          text: 'Password tidak dapat diubah disini. Gunakan menu "Ubah Password" atau "Reset Password".' 
        });
        return;
      }

      const result = await updateUser(editingUser.id, updates);
      if (result.success) {
        setMessage({ type: 'success', text: 'User berhasil diupdate' });
        setFormData({ email: '', password: '', name: '' });
        setEditingUser(null);
        setShowAddForm(false);
        await loadUsers();
        if (onUserUpdate) onUserUpdate();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan sistem' });
    } finally {
      setLoading(false);
    }
  };

  // const openChangePassword = (user) => {
  //   setEditingUser(user);
  //   setPasswordData({
  //     newPassword: '',
  //     confirmPassword: ''
  //   });
  //   setShowChangePassword(true);
  // };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!passwordData.newPassword.trim()) {
      setMessage({ type: 'error', text: 'Password baru harus diisi' });
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password minimal 6 karakter' });
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Konfirmasi password tidak cocok' });
      return;
    }

    try {
      setLoading(true);
      
      // For admin changing user password, send reset email instead
      const result = await resetPassword(editingUser.email);
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: 'Email reset password telah dikirim ke ' + editingUser.email 
        });
        setShowChangePassword(false);
        setEditingUser(null);
        setPasswordData({ newPassword: '', confirmPassword: '' });
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan sistem: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const openResetPassword = (user) => {
    setEditingUser(user);
    setShowResetPassword(true);
  };

  const handleResetPassword = async () => {
    try {
      setLoading(true);
      
      const result = await resetPassword(editingUser.email);
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: 'Email reset password telah dikirim ke ' + editingUser.email 
        });
        setShowResetPassword(false);
        setEditingUser(null);
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan sistem' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, email) => {
    const user = users.find(u => u.id === userId);
    const isDisabled = user?.disabled === true;
    
    // const action = isDisabled ? 'mengaktifkan kembali' : 'menonaktifkan';
    const confirmMessage = isDisabled 
      ? `Apakah Anda yakin ingin mengaktifkan kembali user ${email}?`
      : `Apakah Anda yakin ingin menonaktifkan user ${email}?\n\nUser tidak akan bisa login setelah dinonaktifkan.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        setLoading(true);
        
        const result = isDisabled 
          ? await enableUser(userId)
          : await deleteUser(userId);
        
        if (result.success) {
          setMessage({ 
            type: 'success', 
            text: `User ${email} berhasil ${isDisabled ? 'diaktifkan' : 'dinonaktifkan'}` 
          });
          await loadUsers();
          if (onUserUpdate) onUserUpdate();
        } else {
          setMessage({ type: 'error', text: result.error });
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Terjadi kesalahan sistem' });
      } finally {
        setLoading(false);
      }
    }
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingUser(null);
    setFormData({ email: '', password: '', name: '' });
    setMessage({ type: '', text: '' });
  };

  return (
    <div className="user-management">
      <div className="section-header">
        <h3>Manajemen User Tutor</h3>
        <button 
          className="add-user-btn"
          onClick={() => setShowAddForm(true)}
          disabled={showAddForm || loading}
        >
          + Tambah User Baru
        </button>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Modal Change Password */}
      {showChangePassword && editingUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h4>Ubah Password untuk {editingUser.name}</h4>
            <p className="modal-info">
              Anda akan mengirim email reset password ke <strong>{editingUser.email}</strong>
            </p>
            <p className="modal-info">
              User akan menerima email untuk membuat password baru.
            </p>
            <div className="form-actions">
              <button 
                type="button" 
                className="submit-btn"
                onClick={handleChangePasswordSubmit}
                disabled={loading}
              >
                {loading ? 'Mengirim...' : 'Kirim Email Reset Password'}
              </button>
              <button 
                type="button" 
                className="cancel-btn" 
                onClick={() => {
                  setShowChangePassword(false);
                  setEditingUser(null);
                }}
                disabled={loading}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reset Password Confirmation */}
      {showResetPassword && editingUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h4>Reset Password untuk {editingUser.name}</h4>
            <div className="warning-box">
              <p><strong>⚠️ Perhatian:</strong></p>
              <p>Anda akan mengirim email reset password ke:</p>
              <p className="user-email">{editingUser.email}</p>
              <p>User akan menerima email untuk membuat password baru.</p>
            </div>
            <div className="form-actions">
              <button 
                type="button" 
                className="submit-btn"
                onClick={handleResetPassword}
                disabled={loading}
              >
                {loading ? 'Mengirim...' : 'Ya, Kirim Email Reset'}
              </button>
              <button 
                type="button" 
                className="cancel-btn" 
                onClick={() => {
                  setShowResetPassword(false);
                  setEditingUser(null);
                }}
                disabled={loading}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="user-form">
          <h4>{editingUser ? 'Edit User' : 'Tambah User Baru'}</h4>
          <form onSubmit={editingUser ? handleUpdateUser : handleAddUser}>
            <div className="form-row">
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={editingUser}
                  required
                />
                {editingUser && (
                  <small className="form-hint">Email tidak dapat diubah</small>
                )}
              </div>
              
              <div className="form-group">
                <label>Password:</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={editingUser ? 'Kosongkan jika tidak ingin mengubah' : ''}
                  required={!editingUser}
                  minLength="6"
                />
                {editingUser ? (
                  <small className="form-hint">Gunakan menu "Reset Password" untuk mengubah password user</small>
                ) : (
                  <small className="form-hint">Minimal 6 karakter</small>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Nama Lengkap:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Loading...' : (editingUser ? 'Update User' : 'Tambah User')}
              </button>
              <button type="button" className="cancel-btn" onClick={cancelForm} disabled={loading}>
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="users-table">
        <h4>Daftar User Tutor ({users.length} user)</h4>
        {loading && <div className="loading">Memuat data user...</div>}
        {users.length === 0 && !loading ? (
          <div className="no-data">Belum ada user tutor</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Email</th>
                  <th>Nama Lengkap</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Tanggal Dibuat</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={user.id}>
                    <td>{index + 1}</td>
                    <td>{user.email}</td>
                    <td>{user.name}</td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      {user.disabled ? (
                        <span className="status-badge disabled">Dinonaktifkan</span>
                      ) : (
                        <span className="status-badge active">Aktif</span>
                      )}
                    </td>
                    <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID') : '-'}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="edit-btn"
                          onClick={() => handleEditUser(user)}
                          disabled={loading}
                        >
                          Edit
                        </button>
                        <button 
                          className="reset-password-btn"
                          onClick={() => openResetPassword(user)}
                          disabled={loading || user.disabled}
                          title="Reset password"
                        >
                          🔑
                        </button>
                        <button 
                          className={user.disabled ? "enable-btn" : "delete-btn"}
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          disabled={loading || user.role === 'admin'}
                        >
                          {user.disabled ? 'Aktifkan' : 'Nonaktifkan'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .user-management {
          position: relative;
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-content {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .modal-content h4 {
          margin-top: 0;
          margin-bottom: 1.5rem;
          color: #333;
        }
        
        .modal-info {
          margin: 1rem 0;
          color: #555;
        }
        
        .warning-box {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 6px;
          padding: 1rem;
          margin: 1rem 0;
        }
        
        .warning-box p {
          margin: 0.5rem 0;
        }
        
        .user-email {
          font-weight: bold;
          color: #d32f2f;
          margin: 0.5rem 0;
        }
        
        .reset-password-btn {
          background: #ff9800;
          color: white;
          border: none;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
        }
        
        .reset-password-btn:hover:not(:disabled) {
          background: #f57c00;
        }
        
        .reset-password-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: bold;
        }
        
        .status-badge.active {
          background: #d4edda;
          color: #155724;
        }
        
        .status-badge.disabled {
          background: #f8d7da;
          color: #721c24;
        }
        
        .action-buttons {
          display: flex;
          gap: 0.5rem;
        }
        
        .enable-btn {
          background: #28a745;
          color: white;
          border: none;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8rem;
        }
        
        .enable-btn:hover:not(:disabled) {
          background: #218838;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        
        .section-header h3 {
          margin: 0;
        }
        
        .add-user-btn {
          background: #4CAF50;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .add-user-btn:hover:not(:disabled) {
          background: #45a049;
        }
        
        .add-user-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .message {
          padding: 0.75rem;
          border-radius: 4px;
          margin-bottom: 1rem;
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
        
        .message.warning {
          background: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
        }
        
        .user-form {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid #ddd;
          margin-bottom: 1.5rem;
        }
        
        .user-form h4 {
          margin-top: 0;
          margin-bottom: 1.5rem;
        }
        
        .form-row {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .form-group {
          flex: 1;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 0.25rem;
          font-weight: 500;
        }
        
        .form-group input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
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
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
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
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          flex: 1;
        }
        
        .cancel-btn:hover:not(:disabled) {
          background: #e9e9e9;
        }
        
        .users-table {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid #ddd;
        }
        
        .users-table h4 {
          margin-top: 0;
          margin-bottom: 1rem;
        }
        
        .table-container {
          overflow-x: auto;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
        }
        
        th, td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        
        th {
          background: #f8f9fa;
          font-weight: 600;
        }
        
        .role-badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: bold;
        }
        
        .role-badge.admin {
          background: #dc3545;
          color: white;
        }
        
        .role-badge.user {
          background: #6c757d;
          color: white;
        }
        
        .loading {
          text-align: center;
          padding: 1rem;
          color: #666;
        }
        
        .no-data {
          text-align: center;
          padding: 2rem;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default UserManagement;