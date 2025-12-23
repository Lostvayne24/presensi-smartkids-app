import React, { useState } from 'react';
import { login } from '../services/firebaseAuth';
import logo from '../assets/logo-smartkids.jpeg';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData.username, formData.password); // GANTI INI

      if (result.success) {
        onLogin(result.user);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Terjadi kesalahan saat login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <div className="login-header">
          <img src={logo} alt="Smart Kids Logo" className="login-logo" />
          <h2>Smart Kids Global Institute</h2>
          <p className="login-subtitle">Sistem Presensi Digital</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username:</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder='Masukkan Username'
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder='Masukkan Password'
                required
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? "👁️" : "🔒"}
              </button>
            </div>
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;