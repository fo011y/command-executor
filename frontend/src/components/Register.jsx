import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [serialNumber, setSerialNumber] = useState('GCB-');
  const [phone, setPhone] = useState('+7 ');
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

    const phoneRegex = /^\+7 \d{3} \d{3} \d{2} \d{2}$/;
    if (!phoneRegex.test(phone)) {
      setError('Неверный формат телефона. Используйте формат: +7 123 456 78 90');
      return;
    }

    setLoading(true);

    const result = await register(email, password, serialNumber.trim(), phone);

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
            <label htmlFor="phone">Номер телефона <span style={{color: '#e74c3c'}}>*</span></label>
            <input
              type="text"
              id="phone"
              value={phone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '');
                let f = digits.startsWith('8') ? '7' + digits.slice(1) : digits;
                f = f.slice(0, 11);
                let result = '+7';
                if (f.length > 1) result += ' ' + f.slice(1, 4);
                if (f.length > 4) result += ' ' + f.slice(4, 7);
                if (f.length > 7) result += ' ' + f.slice(7, 9);
                if (f.length > 9) result += ' ' + f.slice(9, 11);
                setPhone(result || '+7 ');
              }}
              required
              placeholder="+7 123 456 78 90"
              disabled={loading || !!success}
            />
            <small style={{color: '#999', fontSize: '12px'}}>Формат: +7 123 456 78 90</small>
            <div style={{marginTop: 8, padding: '8px 12px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, fontSize: 13, color: '#92400e'}}>
              ⚠️ Укажите номер телефона, который вы использовали при оформлении заказа на <strong>gsmcanbox.ru</strong>
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
