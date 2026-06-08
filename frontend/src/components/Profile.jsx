import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { usersAPI, telegramAPI, deviceSettingsAPI } from '../api/api';
import './Profile.css';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Устройство
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [deviceCommands, setDeviceCommands] = useState([]);
  const [deviceMsg, setDeviceMsg] = useState('');
  const [deviceErr, setDeviceErr] = useState('');
  const [cmdLoading, setCmdLoading] = useState(null);

  const [tgStatus, setTgStatus] = useState(null);
  const [tgCode, setTgCode] = useState(null);
  const [tgLoading, setTgLoading] = useState(false);
  const [tgMsg, setTgMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const [profileData, setProfileData] = useState({
    email: '',
    phone: '',
    phone2: '',
    phone3: '',
    module_serial: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    loadProfile();
    loadTgStatus();
    loadDeviceSettings();
  }, []);

  const loadDeviceSettings = async () => {
    try {
      const r = await deviceSettingsAPI.getMyDevice();
      setDeviceInfo(r.data.device);
      setDeviceCommands(r.data.commands || []);
    } catch {}
  };

  const handleExecuteCommand = async (commandId, label) => {
    if (!confirm(`Выполнить команду "${label}"?`)) return;
    setCmdLoading(commandId);
    try {
      await deviceSettingsAPI.executeCommand(commandId);
      setDeviceMsg(`Команда "${label}" поставлена в очередь`);
    } catch (e) {
      setDeviceErr(e.response?.data?.error || 'Ошибка отправки команды');
    }
    setCmdLoading(null);
  };

  const loadTgStatus = async () => {
    try {
      const r = await telegramAPI.getStatus();
      setTgStatus(r.data);
    } catch {}
  };

  const handleTgGenerate = async () => {
    setTgLoading(true); setTgMsg('');
    try {
      const r = await telegramAPI.generateCode();
      setTgCode(r.data);
    } catch (e) { setTgMsg('Ошибка генерации кода'); }
    setTgLoading(false);
  };

  const handleTgUnlink = async () => {
    if (!confirm('Отвязать Telegram?')) return;
    setTgLoading(true);
    try {
      await telegramAPI.unlink();
      setTgStatus({ linked: false });
      setTgCode(null);
      setTgMsg('Telegram отвязан');
    } catch { setTgMsg('Ошибка'); }
    setTgLoading(false);
  };

  const loadProfile = async () => {
    try {
      const response = await usersAPI.getById('me');
      setProfileData({
        email: response.data.user.email,
        phone: response.data.user.phone || '',
        phone2: response.data.user.phone2 || '',
        phone3: response.data.user.phone3 || '',
        module_serial: response.data.user.module_serial || '',
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      console.error('Load profile error:', error);
    }
  };

  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, '');
    let formatted = digits.startsWith('8') ? '7' + digits.slice(1) : digits;
    formatted = formatted.slice(0, 11);

    if (formatted.length > 0) {
      let result = '+7';
      if (formatted.length > 1) result += ' ' + formatted.slice(1, 4);
      if (formatted.length > 4) result += ' ' + formatted.slice(4, 7);
      if (formatted.length > 7) result += ' ' + formatted.slice(7, 9);
      if (formatted.length > 9) result += ' ' + formatted.slice(9, 11);
      return result;
    }
    return '+7 ';
  };

  const formatPhone3 = (value) => {
    const digits = value.replace(/\D/g, '');
    let formatted = digits.startsWith('375') ? digits : '375' + digits;
    formatted = formatted.slice(0, 12);

    if (formatted.length > 0) {
      let result = '+375';
      if (formatted.length > 3) result += ' ' + formatted.slice(3, 5);
      if (formatted.length > 5) result += ' ' + formatted.slice(5, 8);
      if (formatted.length > 8) result += ' ' + formatted.slice(8, 10);
      if (formatted.length > 10) result += ' ' + formatted.slice(10, 12);
      return result;
    }
    return '+375 ';
  };

  const formatSerial = (value) => {
    const cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    let formatted = cleaned.startsWith('GCB') ? cleaned : 'GCB' + cleaned;
    formatted = formatted.replace(/^(GCB)+/, 'GCB');
    const gcbPart = 'GCB';
    const numberPart = formatted.slice(3).replace(/\D/g, '').slice(0, 9);
    return numberPart.length > 0 ? `${gcbPart}-${numberPart}` : gcbPart;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value);
    setProfileData({ ...profileData, phone: formatted });
    setError('');
  };

  const handlePhone2Change = (e) => {
    const formatted = formatPhone(e.target.value);
    setProfileData({ ...profileData, phone2: formatted });
    setError('');
  };

  const handlePhone3Change = (e) => {
    const formatted = formatPhone3(e.target.value);
    setProfileData({ ...profileData, phone3: formatted });
    setError('');
  };

  const handleSerialChange = (e) => {
    const formatted = formatSerial(e.target.value);
    setProfileData({ ...profileData, module_serial: formatted });
    setError('');
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^\+7 \d{3} \d{3} \d{2} \d{2}$/;
    return phoneRegex.test(phone);
  };

  const validatePhone3 = (phone) => {
    const phoneRegex = /^\+375 \d{2} \d{3} \d{2} \d{2}$/;
    return phoneRegex.test(phone);
  };

  const validateSerial = (serial) => {
    const serialRegex = /^GCB-\d{9}$/;
    return serialRegex.test(serial);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!validatePhone(profileData.phone)) {
      setError('Неверный формат первого номера телефона. Используйте формат: +7 123 456 78 90');
      return;
    }

    if (profileData.phone2 && profileData.phone2.trim() !== '' && !validatePhone(profileData.phone2)) {
      setError('Неверный формат второго номера телефона. Используйте формат: +7 123 456 78 90');
      return;
    }

    if (profileData.phone3 && profileData.phone3.trim() !== '' && !validatePhone3(profileData.phone3)) {
      setError('Неверный формат третьего номера телефона. Используйте формат: +375 11 222 33 44');
      return;
    }

    if (!validateSerial(profileData.module_serial)) {
      setError('Неверный формат серийного номера. Используйте формат: GCB-123456789');
      return;
    }

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
        phone: profileData.phone,
        phone2: profileData.phone2,
        phone3: profileData.phone3,
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
                  value={profileData.email || user?.email || ''}
                  disabled
                  className="input-disabled"
                />
              </div>

              <div className="form-group">
                <label>
                  Номер телефона <span style={{color: '#e74c3c'}}>*</span>
                </label>
                <input
                  type="text"
                  value={profileData.phone}
                  onChange={handlePhoneChange}
                  placeholder="+7 123 456 78 90"
                  required
                />
                <small style={{color: '#999', fontSize: '12px'}}>Формат: +7 123 456 78 90</small>
              </div>

              <div className="form-group">
                <label>Номер телефона 2</label>
                <input
                  type="text"
                  value={profileData.phone2}
                  onChange={handlePhone2Change}
                  placeholder="+7 123 456 78 90"
                />
                <small style={{color: '#999', fontSize: '12px'}}>Формат: +7 123 456 78 90</small>
              </div>

              <div className="form-group">
                <label>Номер телефона 3</label>
                <input
                  type="text"
                  value={profileData.phone3}
                  onChange={handlePhone3Change}
                  placeholder="+375 11 222 33 44"
                />
                <small style={{color: '#999', fontSize: '12px'}}>Формат: +375 11 222 33 44</small>
              </div>

              <div className="form-group">
                <label>
                  Серийный номер <span style={{color: '#e74c3c'}}>*</span>
                </label>
                <input
                  type="text"
                  value={profileData.module_serial}
                  onChange={handleSerialChange}
                  placeholder="GCB-123456789"
                  required
                  title="Серийный номер начинается с GCB-123456789"
                />
                <small style={{color: '#999', fontSize: '12px'}}>Формат: GCB-123456789</small>
              </div>
            </div>

            <div className="form-section">
              <h3>Смена пароля</h3>
              <p style={{color: '#666', fontSize: '14px', marginBottom: '15px'}}>
                Оставьте поля пустыми, если не хотите менять пароль
              </p>

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


            <div className="form-section">
              <h3>Моё устройство</h3>

              {deviceInfo ? (
                <>
                  <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:16}}>
                    <div style={{flex:1,minWidth:180,background:'#f9fafb',borderRadius:10,padding:'12px 16px',border:'1px solid #e5e7eb'}}>
                      <div style={{fontSize:12,color:'#6b7280',marginBottom:4}}>Серийный номер</div>
                      <div style={{fontWeight:700,fontSize:15}}>{deviceInfo.serial_number}</div>
                    </div>
                    <div style={{flex:1,minWidth:140,background:'#f9fafb',borderRadius:10,padding:'12px 16px',border:'1px solid #e5e7eb'}}>
                      <div style={{fontSize:12,color:'#6b7280',marginBottom:4}}>Статус</div>
                      <div style={{fontWeight:700,fontSize:15,color: deviceInfo.is_active ? '#10b981' : '#ef4444'}}>
                        {deviceInfo.is_active ? '● Активно' : '● Неактивно'}
                      </div>
                    </div>
                    <div style={{flex:1,minWidth:180,background:'#f9fafb',borderRadius:10,padding:'12px 16px',border:'1px solid #e5e7eb'}}>
                      <div style={{fontSize:12,color:'#6b7280',marginBottom:4}}>Последний выход на связь</div>
                      <div style={{fontWeight:600,fontSize:13}}>
                        {deviceInfo.last_seen
                          ? new Date(deviceInfo.last_seen).toLocaleString('ru-RU')
                          : '—'}
                      </div>
                    </div>
                    {deviceInfo.fw_version && (
                      <div style={{flex:1,minWidth:120,background:'#f9fafb',borderRadius:10,padding:'12px 16px',border:'1px solid #e5e7eb'}}>
                        <div style={{fontSize:12,color:'#6b7280',marginBottom:4}}>Версия ПО</div>
                        <div style={{fontWeight:600,fontSize:13}}>{deviceInfo.fw_version}</div>
                      </div>
                    )}
                    {(deviceInfo.car_brand || deviceInfo.car_model) && (
                      <div style={{flex:1,minWidth:180,background:'#f9fafb',borderRadius:10,padding:'12px 16px',border:'1px solid #e5e7eb'}}>
                        <div style={{fontSize:12,color:'#6b7280',marginBottom:4}}>Автомобиль</div>
                        <div style={{fontWeight:600,fontSize:13}}>
                          {[deviceInfo.car_brand, deviceInfo.car_model].filter(Boolean).join(' ')}
                        </div>
                      </div>
                    )}
                  </div>

                  {deviceMsg && <div className="success-message" style={{marginBottom:12}}>{deviceMsg}</div>}
                  {deviceErr && <div className="error-message" style={{marginBottom:12}}>{deviceErr}</div>}

                  {deviceCommands.length > 0 && (
                    <>
                      <h4 style={{marginBottom:12,color:'#374151'}}>Доступные команды</h4>
                      <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                        {deviceCommands.map(cmd => (
                          <button
                            key={cmd.id}
                            type="button"
                            onClick={() => handleExecuteCommand(cmd.id, cmd.label)}
                            disabled={cmdLoading === cmd.id || !deviceInfo.is_active}
                            style={{
                              padding:'10px 18px',
                              background: cmdLoading === cmd.id ? '#9ca3af' : '#667eea',
                              color:'white',border:'none',borderRadius:10,
                              cursor: deviceInfo.is_active ? 'pointer' : 'not-allowed',
                              fontWeight:600,fontSize:14,
                              opacity: !deviceInfo.is_active ? 0.5 : 1
                            }}
                            title={cmd.description || cmd.label}
                          >
                            {cmdLoading === cmd.id ? '...' : cmd.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <p style={{color:'#6b7280',fontSize:14}}>
                  Устройство не найдено. Убедитесь что серийный номер в профиле указан верно.
                </p>
              )}
            </div>

            <div className="form-section">
              <h3>Telegram</h3>
              {tgStatus?.linked ? (
                <div>
                  <p style={{color:'#10b981',fontWeight:600,marginBottom:8}}>
                    ✅ Привязан{tgStatus.telegram_username ? ': @' + tgStatus.telegram_username : ''}
                  </p>
                  <p style={{color:'#6b7280',fontSize:13,marginBottom:12}}>
                    Вы можете управлять устройством через Telegram-бота
                  </p>
                  <button type="button" className="btn" style={{background:'#ef4444',color:'white'}} onClick={handleTgUnlink} disabled={tgLoading}>
                    Отвязать Telegram
                  </button>
                </div>
              ) : (
                <div>
                  <p style={{color:'#6b7280',fontSize:14,marginBottom:12}}>
                    Привяжите Telegram-аккаунт для управления устройством через бота
                  </p>
                  {!tgCode ? (
                    <button type="button" className="btn btn-primary" onClick={handleTgGenerate} disabled={tgLoading}>
                      {tgLoading ? 'Генерация...' : 'Получить код привязки'}
                    </button>
                  ) : (
                    <div style={{background:'#f9fafb',border:'2px solid #667eea',borderRadius:12,padding:16}}>
                      <p style={{fontWeight:600,marginBottom:8}}>Шаги для привязки:</p>
                      <p style={{marginBottom:8}}>1. Откройте бота: <a href={tgCode.bot_url} target="_blank" rel="noreferrer" style={{color:'#667eea',fontWeight:600}}>@{tgCode.bot_url.split('/')[3].split('?')[0]}</a></p>
                      <p style={{marginBottom:8}}>2. Отправьте боту команду:</p>
                      <div style={{position:'relative'}}>
                        <code style={{display:'block',padding:'8px 12px',background:'#e8eaf6',borderRadius:8,fontSize:14,marginBottom:8,wordBreak:'break-all',paddingRight:48}}>{tgCode.command}</code>
                        <button
                          type="button"
                          onClick={() => { navigator.clipboard.writeText(tgCode.command); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                          style={{position:'absolute',top:4,right:4,background:copied?'var(--primary)':'var(--canvas-soft)',border:'none',borderRadius:'var(--r-sm)',padding:'4px 8px',cursor:'pointer',fontSize:13,fontWeight:600,color:copied?'var(--on-primary)':'var(--body)',transition:'all 0.2s'}}
                          title="Скопировать команду"
                        >
                          {copied ? '✓' : '⎘'}
                        </button>
                      </div>
                      <a
                        href={tgCode.bot_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{display:'inline-block',marginBottom:8,background:'var(--primary)',color:'var(--on-primary)',padding:'8px 16px',borderRadius:'var(--r-xl)',fontWeight:700,fontSize:14,textDecoration:'none'}}
                        onClick={() => navigator.clipboard.writeText(tgCode.command)}
                      >
                        Открыть бота и скопировать команду
                      </a>
                      <p style={{color:'#ef4444',fontSize:12}}>⏱ Код действителен 15 минут</p>
                      <button type="button" className="btn" style={{marginTop:8,background:'#6b7280',color:'white',fontSize:13,padding:'6px 14px'}} onClick={handleTgGenerate}>
                        Обновить код
                      </button>
                    </div>
                  )}
                </div>
              )}
              {tgMsg && <p style={{marginTop:8,color:'#10b981',fontSize:13}}>{tgMsg}</p>}
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
