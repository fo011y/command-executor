import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [serialNumber, setSerialNumber] = useState('GCB-');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    const serialDigits = serialNumber.replace('GCB-', '');
    if (!serialDigits || serialDigits.length !== 9) {
      setError('Серийный номер должен содержать 9 цифр');
      return;
    }

    setLoading(true);

    const result = await register(email, password, serialNumber.trim());

    if (result.success) {
      setSuccess(result.message);
      setTimeout(() => navigate('/login'), 3000);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Регистрация</h1>
        <p className="auth-subtitle">GCBox connect</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="serialNumber">Серийный номер устройства</label>
            <div className="input-with-prefix">
              <span className="input-prefix">GCB-</span>
              <input
                type="text"
                id="serialNumber"
                value={serialNumber.startsWith('GCB-') ? serialNumber.slice(4) : serialNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                  setSerialNumber('GCB-' + val);
                }}
                required
                placeholder="123456789"
                maxLength={9}
                inputMode="numeric"
                disabled={loading || !!success}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              disabled={loading || !!success}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Минимум 6 символов"
              minLength={6}
              disabled={loading || !!success}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Подтвердите пароль</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Повторите пароль"
              minLength={6}
              disabled={loading || !!success}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !!success}
          >
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
        </form>

        <div className="auth-footer">
          <p>
            Уже есть аккаунт? <Link to="/login">Войти</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
