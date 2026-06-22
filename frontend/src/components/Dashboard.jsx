import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { commandsAPI } from '../api/api';
import { onEvent, offEvent, emitEvent } from '../api/socket';
import './Dashboard.css';

// Map command names to icons
const getCommandIcon = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('запуск') || n.includes('старт') || n.includes('start')) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 8v4l3 3"/>
      <path d="M8 12h1"/>
    </svg>
  );
  if (n.includes('остановк') || n.includes('стоп') || n.includes('stop')) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" stroke="none"/>
    </svg>
  );
  if (n.includes('открыт') || n.includes('unlock') || n.includes('open')) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
    </svg>
  );
  if (n.includes('закрыт') || n.includes('lock') || n.includes('запир')) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
  if (n.includes('поднят') || n.includes('вверх') || n.includes('up')) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5"/>
      <path d="M5 12l7-7 7 7"/>
      <path d="M4 19h16" strokeWidth="1"/>
    </svg>
  );
  if (n.includes('опуст') || n.includes('вниз') || n.includes('down')) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14"/>
      <path d="M19 12l-7 7-7-7"/>
      <path d="M4 5h16" strokeWidth="1"/>
    </svg>
  );
  if (n.includes('двойн') || n.includes('double')) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      <circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none"/>
      <path d="M10 16h-.5M14 16h.5"/>
    </svg>
  );
  if (n.includes('стекл') || n.includes('window')) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2"/>
      <path d="M4 9h16M9 4v16"/>
    </svg>
  );
  // Default
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
    </svg>
  );
};

const MapPlaceholder = () => (
  <div className="map-panel">
    <div className="map-header">
      <div className="map-status">
        <span className="map-dot" />
        <span className="map-label">GPS ТРЕКИНГ</span>
        <span className="map-divider">•</span>
        <span className="map-waiting">Ожидание данных с модуля</span>
      </div>
      <div className="map-coords">
        <span>ш. <em>—</em></span>
        <span>д. <em>—</em></span>
      </div>
    </div>

    <div className="map-body">
      <svg className="map-grid" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid-small" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(88,166,255,0.07)" strokeWidth="0.5"/>
          </pattern>
          <pattern id="grid-large" width="200" height="200" patternUnits="userSpaceOnUse">
            <rect width="200" height="200" fill="url(#grid-small)"/>
            <path d="M 200 0 L 0 0 0 200" fill="none" stroke="rgba(88,166,255,0.13)" strokeWidth="1"/>
          </pattern>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(88,166,255,0.15)"/>
            <stop offset="100%" stopColor="transparent"/>
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-large)"/>
        <ellipse cx="50%" cy="50%" rx="180" ry="120" fill="url(#glow)"/>
        {/* Horizontal scan line */}
        <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(88,166,255,0.08)" strokeWidth="1" strokeDasharray="4 8"/>
        <line x1="50%" y1="0" x2="50%" y2="100%" stroke="rgba(88,166,255,0.08)" strokeWidth="1" strokeDasharray="4 8"/>
      </svg>

      {/* Corner markers */}
      <div className="map-corner map-corner--tl"/>
      <div className="map-corner map-corner--tr"/>
      <div className="map-corner map-corner--bl"/>
      <div className="map-corner map-corner--br"/>

      {/* Center crosshair */}
      <div className="map-crosshair">
        <div className="map-crosshair-ring"/>
        <div className="map-crosshair-dot"/>
        <div className="map-crosshair-line map-crosshair-line--h"/>
        <div className="map-crosshair-line map-crosshair-line--v"/>
      </div>

      <div className="map-no-signal">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        <span>Нет сигнала</span>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState({});
  const [results, setResults] = useState({});
  const [activeTab, setActiveTab] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('gcb-theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gcb-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    loadCommands();
    onEvent('command:started', handleCommandStarted);
    onEvent('command:result', handleCommandResult);
    return () => {
      offEvent('command:started', handleCommandStarted);
      offEvent('command:result', handleCommandResult);
    };
  }, []);

  const loadCommands = async () => {
    try {
      const response = await commandsAPI.getActive();
      const filteredCommands = user?.role === 'admin'
        ? response.data.commands
        : response.data.commands.filter(cmd => cmd.category_id);
      setCommands(filteredCommands);
    } catch (error) {
      console.error('Load commands error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCommandStarted = (data) => {
    setExecuting((prev) => ({ ...prev, [data.commandId]: true }));
  };

  const handleCommandResult = (data) => {
    setExecuting((prev) => ({ ...prev, [data.commandId]: false }));
    setResults((prev) => ({ ...prev, [data.commandId]: data }));
    setTimeout(() => {
      setResults((prev) => { const n = { ...prev }; delete n[data.commandId]; return n; });
    }, 4000);
  };

  const executeCommand = async (commandId) => {
    try {
      setExecuting((prev) => ({ ...prev, [commandId]: true }));
      setResults((prev) => ({ ...prev, [commandId]: { status: 'sending', message: 'Отправлено' } }));
      emitEvent('command:execute', { commandId });
      await commandsAPI.execute(commandId);
      setResults((prev) => ({ ...prev, [commandId]: { status: 'success', message: 'Выполнено' } }));
      setTimeout(() => {
        setResults((prev) => { const n = { ...prev }; delete n[commandId]; return n; });
      }, 4000);
    } catch (error) {
      setResults((prev) => ({ ...prev, [commandId]: { status: 'error', message: 'Ошибка' } }));
    } finally {
      setExecuting((prev) => ({ ...prev, [commandId]: false }));
    }
  };

  const groupedCommands = commands.reduce((acc, command) => {
    if (!command.category_id && user?.role !== 'admin') return acc;
    const parent = command.parent_category_name || command.category_name || (user?.role === 'admin' ? 'Общие' : null);
    const sub = command.parent_category_name ? command.category_name : command.category_name;
    if (!parent) return acc;
    if (!acc[parent]) acc[parent] = {};
    if (!acc[parent][sub]) acc[parent][sub] = [];
    acc[parent][sub].push(command);
    return acc;
  }, {});

  const brands = Object.keys(groupedCommands);

  useEffect(() => {
    if (brands.length > 0 && !activeTab) setActiveTab(brands[0]);
  }, [brands.length]);

  if (loading) {
    return (
      <div className="db-root">
        <div className="db-loader">
          <div className="db-loader-ring"/>
          <span>Загрузка системы</span>
        </div>
      </div>
    );
  }

  const currentBrandCmds = activeTab ? groupedCommands[activeTab] || {} : {};

  return (
    <div className="db-root">
      {/* Header */}
      <header className="db-header">
        <div className="db-header-logo">
          <svg viewBox="0 0 32 32" fill="none">
            <rect x="2" y="2" width="28" height="28" rx="8" fill="#58a6ff" fillOpacity=".15"/>
            <path d="M8 20l4-8 4 4 4-6 4 10" stroke="#58a6ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>GCBox<em>connect</em></span>
        </div>
        <nav className="db-header-nav">
          <span className="db-user-email">{user?.email}</span>
          <button onClick={() => navigate('/profile')} className="db-btn db-btn--ghost">Профиль</button>
          {user?.role === 'admin' && (
            <button onClick={() => navigate('/admin')} className="db-btn db-btn--ghost">Админ</button>
          )}
          <span className="db-theme-label">{theme === 'dark' ? '☀️' : '🌙'}</span>
          <button className="db-theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'} />
          <button onClick={logout} className="db-btn db-btn--danger">Выйти</button>
        </nav>
      </header>

      <main className="db-main">
        {/* ── TOP: Command Panel ── */}
        <section className="db-commands-panel">
          {commands.length === 0 ? (
            <div className="db-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="9"/><path d="M9 9h.01M15 9h.01M9.5 14.5a3.5 3.5 0 0 0 5 0"/>
              </svg>
              <p>Нет доступных команд</p>
            </div>
          ) : (
            <>
              {/* Brand tabs */}
              {brands.length > 1 && (
                <div className="db-tabs">
                  {brands.map(brand => (
                    <button
                      key={brand}
                      className={`db-tab ${activeTab === brand ? 'db-tab--active' : ''}`}
                      onClick={() => setActiveTab(brand)}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              )}

              {/* Sub-categories and commands */}
              <div className="db-subcats">
                {Object.entries(currentBrandCmds).map(([sub, cmds]) => (
                  <div key={sub} className="db-subcat">
                    <div className="db-subcat-label">{sub}</div>
                    <div className="db-cmd-grid">
                      {cmds.map(cmd => {
                        const res = results[cmd.id];
                        const busy = executing[cmd.id];
                        return (
                          <button
                            key={cmd.id}
                            className={`db-cmd-btn ${busy ? 'db-cmd-btn--busy' : ''} ${res?.status === 'success' ? 'db-cmd-btn--ok' : ''} ${res?.status === 'error' ? 'db-cmd-btn--err' : ''}`}
                            onClick={() => executeCommand(cmd.id)}
                            disabled={busy}
                            title={cmd.description || cmd.name}
                          >
                            <span className="db-cmd-icon">
                              {busy ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                                </svg>
                              ) : res?.status === 'success' ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M20 6L9 17l-5-5"/>
                                </svg>
                              ) : res?.status === 'error' ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M18 6L6 18M6 6l12 12"/>
                                </svg>
                              ) : getCommandIcon(cmd.name)}
                            </span>
                            <span className="db-cmd-name">{cmd.name}</span>
                            {res && (
                              <span className={`db-cmd-badge db-cmd-badge--${res.status}`}>
                                {res.message}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* ── BOTTOM: Map Panel ── */}
        <section className="db-map-section">
          <MapPlaceholder />
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
