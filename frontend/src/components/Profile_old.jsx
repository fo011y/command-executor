import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { usersAPI } from '../api/api';
import './Profile.css';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [profileData, setProfileData] = useState({
    email: '',
    full_name: '',
    module_serial: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await usersAPI.getById('me');
      setProfileData({
        email: response.data.user.email,
        full_name: response.data.user.full_name || '',
        module_serial: response.data.user.module_serial || '',
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      console.error('Load profile error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Проверка паролей
    if (profileData.new_password) {
      if (profileData.new_password !== profileData.confirm_password) {
        setError('Новые пароли не совпадают');
        return;
      }
      if (profileData.new_password.length < 6) {
        setError('Пароль должен содержать минимум 6 символов');
        return;
      }
      if (!profileData.current_password) {
        setError('Введите текущий пароль для смены пароля');
        return;
      }
    }

    setLoading(true);

    try {
      const updateData = {
        full_name: profileData.full_name,
        module_serial: profileData.module_serial
      };

      if (profileData.new_password) {
        updateData.current_password = profileData.current_password;
        updateData.password = profileData.new_password;
      }

      await usersAPI.update('me', updateData);

      setMessage('Профиль успешно обновлен');
      setProfileData({
        ...profileData,
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      setError(error.response?.data?.error || 'Ошибка обновления профиля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <header className="profile-header">
        <div className="header-content">
          <h1>GCBox connect - Личный кабинет</h1>
          <div className="user-info">
            <button onClick={() => navigate('/dashboard')} className="btn btn-back">
              ← Назад
            </button>
            <button onClick={logout} className="btn btn-logout">
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="profile-main">
        <div className="profile-card">
          <h2>Мой профиль</h2>

          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-section">
              <h3>Основная информация</h3>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="input-disabled"
                />
              </div>

              <div className="form-group">
                <label>ФИО</label>
                <input
                  type="text"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                  placeholder="Введите ваше ФИО"
                />
              </div>

              <div className="form-group">
                <label>Серийный номер модуля</label>
                <input
                  type="text"
                  value={profileData.module_serial}
                  onChange={(e) => setProfileData({ ...profileData, module_serial: e.target.value })}
                  placeholder="Введите серийный номер"
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Смена пароля</h3>

              <div className="form-group">
                <label>Текущий пароль</label>
                <input
                  type="password"
                  value={profileData.current_password}
                  onChange={(e) => setProfileData({ ...profileData, current_password: e.target.value })}
                  placeholder="Введите текущий пароль"
                />
              </div>

              <div className="form-group">
                <label>Новый пароль</label>
                <input
                  type="password"
                  value={profileData.new_password}
                  onChange={(e) => setProfileData({ ...profileData, new_password: e.target.value })}
                  placeholder="Введите новый пароль"
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label>Подтвердите новый пароль</label>
                <input
                  type="password"
                  value={profileData.confirm_password}
                  onChange={(e) => setProfileData({ ...profileData, confirm_password: e.target.value })}
                  placeholder="Повторите новый пароль"
                  minLength={6}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Profile;
