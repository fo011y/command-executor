import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { deviceSettingsAPI } from '../api/api';
import './UserCard.css';

const UserCard = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('info');

  // Устройство
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [deviceMsg, setDeviceMsg] = useState('');
  const [deviceErr, setDeviceErr] = useState('');
  const [deviceSaving, setDeviceSaving] = useState(false);

  useEffect(() => {
    loadUserData();
    loadBrands();
  }, [userId]);

  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiBase}/api/user-card/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data);
        if (data.device) {
          setSelectedBrand(data.device.brand_id ? String(data.device.brand_id) : '');
          setSelectedModel(data.device.model_id ? String(data.device.model_id) : '');
          if (data.device.brand_id) loadModels(data.device.brand_id);
        }
      }
    } catch (error) {
      console.error('Load user data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBrands = async () => {
    try {
      const r = await deviceSettingsAPI.getBrands();
      setBrands(r.data.brands || []);
    } catch {}
  };

  const loadModels = async (brandId) => {
    try {
      const r = await deviceSettingsAPI.getModels(brandId);
      setModels(r.data.models || []);
    } catch {}
  };

  const handleBrandChange = (e) => {
    const val = e.target.value;
    setSelectedBrand(val);
    setSelectedModel('');
    setModels([]);
    if (val) loadModels(val);
  };

  const handleDeviceSave = async () => {
    setDeviceMsg(''); setDeviceErr(''); setDeviceSaving(true);
    try {
      const token = localStorage.getItem('token');
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiBase}/api/user-card/${userId}/device`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: selectedModel ? Number(selectedModel) : null
        })
      });
      if (res.ok) {
        setDeviceMsg('Настройки устройства сохранены');
        loadUserData();
      } else {
        const d = await res.json();
        setDeviceErr(d.error || 'Ошибка сохранения');
      }
    } catch {
      setDeviceErr('Ошибка соединения');
    }
    setDeviceSaving(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="user-card-container">
        <div className="loading">Загрузка...</div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="user-card-container">
        <div className="error">Пользователь не найден</div>
      </div>
    );
  }

  return (
    <div className="user-card-container">
      <header className="user-card-header">
        <div className="header-content">
          <h1>Карточка клиента</h1>
          <div className="header-actions">
            <button onClick={() => navigate('/admin')} className="btn btn-back">
              ← Назад к админке
            </button>
          </div>
        </div>
      </header>

      <main className="user-card-main">
        {/* Основная информация */}
        <div className="user-info-card">
          <h2>Информация о пользователе</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Email:</span>
              <span className="info-value">{userData.user.email}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Серийный номер:</span>
              {userData.user.module_serial ? (
                <span
                  className="info-value serial-link"
                  onClick={() => navigate('/admin', { state: { tab: 'devices', search: userData.user.module_serial } })}
                  title="Открыть в устройствах"
                >
                  {userData.user.module_serial}
                </span>
              ) : (
                <span className="info-value">-</span>
              )}
            </div>
            <div className="info-item">
              <span className="info-label">Дата регистрации:</span>
              <span className="info-value">{formatDate(userData.user.created_at)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Статус:</span>
              <span className={`status-badge ${userData.user.is_active ? 'active' : 'inactive'}`}>
                {userData.user.is_active ? 'Активен' : 'Неактивен'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Телефон 1:</span>
              <span className="info-value">{userData.user.phone || '-'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Телефон 2:</span>
              <span className="info-value">{userData.user.phone2 || '-'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Телефон 3:</span>
              <span className="info-value">{userData.user.phone3 || '-'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Роль:</span>
              <span className={`role-badge ${userData.user.role}`}>
                {userData.user.role === 'admin' ? 'Администратор' : 'Пользователь'}
              </span>
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div className="stats-card">
          <h2>Статистика</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{userData.stats.successful_commands || 0}</div>
              <div className="stat-label">Успешных команд</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{userData.stats.failed_commands || 0}</div>
              <div className="stat-label">Ошибок команд</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{userData.stats.successful_logins || 0}</div>
              <div className="stat-label">Успешных входов</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{userData.stats.failed_logins || 0}</div>
              <div className="stat-label">Неудачных входов</div>
            </div>
          </div>
        </div>

        {/* Вкладки */}
        <div className="logs-section">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'device' ? 'active' : ''}`}
              onClick={() => setActiveTab('device')}
            >
              Устройство
            </button>
            <button
              className={`tab ${activeTab === 'commands' ? 'active' : ''}`}
              onClick={() => setActiveTab('commands')}
            >
              Логи команд ({userData.commandLogs.length})
            </button>
            <button
              className={`tab ${activeTab === 'logins' ? 'active' : ''}`}
              onClick={() => setActiveTab('logins')}
            >
              Логи авторизации ({userData.loginLogs.length})
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'device' && (
              <div style={{padding:'16px 0'}}>
                {userData.device ? (
                  <>
                    <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:20}}>
                      {[
                        {label:'Серийный номер', val: userData.device.serial_number},
                        {label:'Статус', val: userData.device.is_active ? '● Активно' : '● Неактивно',
                         color: userData.device.is_active ? '#10b981' : '#ef4444'},
                        {label:'Последний выход', val: userData.device.last_seen
                          ? new Date(userData.device.last_seen).toLocaleString('ru-RU') : '—'},
                        {label:'Версия ПО', val: userData.device.fw_version || '—'},
                      ].map(item => (
                        <div key={item.label} style={{flex:1,minWidth:160,background:'#f9fafb',borderRadius:10,padding:'10px 14px',border:'1px solid #e5e7eb'}}>
                          <div style={{fontSize:11,color:'#6b7280',marginBottom:3}}>{item.label}</div>
                          <div style={{fontWeight:600,fontSize:13,color:item.color||'inherit'}}>{item.val}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap'}}>
                      <div style={{flex:1,minWidth:160}}>
                        <label style={{display:'block',marginBottom:6,fontSize:14,fontWeight:500}}>Марка автомобиля</label>
                        <select value={selectedBrand} onChange={handleBrandChange}
                          style={{width:'100%',padding:'8px 12px',border:'1px solid #d1d5db',borderRadius:8,fontSize:14}}>
                          <option value="">— Не указана —</option>
                          {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                      <div style={{flex:1,minWidth:160}}>
                        <label style={{display:'block',marginBottom:6,fontSize:14,fontWeight:500}}>Модель автомобиля</label>
                        <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)}
                          disabled={!selectedBrand || models.length === 0}
                          style={{width:'100%',padding:'8px 12px',border:'1px solid #d1d5db',borderRadius:8,fontSize:14,opacity:(!selectedBrand||models.length===0)?0.5:1}}>
                          <option value="">— Не указана —</option>
                          {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                      </div>
                    </div>

                    {userData.allCommands.length > 0 && (
                      <div style={{marginBottom:16}}>
                        <label style={{display:'block',marginBottom:8,fontSize:14,fontWeight:500}}>
                          Доступные команды <span style={{fontWeight:400,color:'#6b7280',fontSize:12}}>(определяются маркой/моделью)</span>
                        </label>
                        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                          {userData.allCommands.map(cmd => (
                            <div key={cmd.id} style={{
                              padding:'7px 14px',
                              border:'2px solid #667eea',
                              borderRadius:8,fontSize:13,fontWeight:500,
                              background:'#eef2ff',color:'#3730a3'
                            }}>
                              {cmd.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {deviceMsg && <div className="success-message" style={{marginBottom:10}}>{deviceMsg}</div>}
                    {deviceErr && <div className="error-message" style={{marginBottom:10}}>{deviceErr}</div>}

                    <button onClick={handleDeviceSave} disabled={deviceSaving}
                      className="btn btn-primary">
                      {deviceSaving ? 'Сохранение...' : 'Сохранить настройки устройства'}
                    </button>
                  </>
                ) : (
                  <p style={{color:'#6b7280'}}>Устройство не привязано к этому аккаунту.</p>
                )}
              </div>
            )}

            {activeTab === 'commands' && (
              <div className="logs-table-container">
                <table className="logs-table">
                  <thead>
                    <tr>
                      <th>Дата</th>
                      <th>Категория</th>
                      <th>Команда</th>
                      <th>Статус</th>
                      <th>Результат</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userData.commandLogs.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="no-data">Нет данных</td>
                      </tr>
                    ) : (
                      userData.commandLogs.map((log) => (
                        <tr key={log.id}>
                          <td>{formatDate(log.executed_at)}</td>
                          <td>
                            <div className="log-category">
                              {log.parent_category_name && (
                                <span className="log-category-parent">{log.parent_category_name}</span>
                              )}
                              {log.parent_category_name && log.category_name && (
                                <span className="log-category-sep"> — </span>
                              )}
                              {log.category_name && (
                                <span className="log-category-sub">{log.category_name}</span>
                              )}
                              {!log.category_name && <span className="log-category-none">—</span>}
                            </div>
                          </td>
                          <td>
                            <div className="command-info">
                              <div className="command-name">{log.command_name}</div>
                              <div className="command-desc">{log.command_description}</div>
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge ${log.status}`}>
                              {log.status === 'success' ? 'Успешно' : 'Ошибка'}
                            </span>
                          </td>
                          <td>
                            <div className="log-output">
                              {log.error ? (
                                <span className="error-text">{log.error}</span>
                              ) : (
                                <span className="output-text">{log.output || '-'}</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'logins' && (
              <div className="logs-table-container">
                <table className="logs-table">
                  <thead>
                    <tr>
                      <th>Дата</th>
                      <th>IP адрес</th>
                      <th>User Agent</th>
                      <th>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userData.loginLogs.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="no-data">Нет данных</td>
                      </tr>
                    ) : (
                      userData.loginLogs.map((log) => (
                        <tr key={log.id}>
                          <td>{formatDate(log.created_at)}</td>
                          <td>{log.ip_address || '-'}</td>
                          <td className="user-agent">{log.user_agent || '-'}</td>
                          <td>
                            <span className={`status-badge ${log.status}`}>
                              {log.status === 'success' ? 'Успешно' : 'Неудачно'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserCard;
