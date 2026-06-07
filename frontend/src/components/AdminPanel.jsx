import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI, commandsAPI } from '../api/api';
import { onEvent, offEvent } from '../api/socket';
import './AdminPanel.css';

const AdminPanel = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [commands, setCommands] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Модальные окна
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCommandModal, setShowCommandModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingCommand, setEditingCommand] = useState(null);

  // Формы
  const [userForm, setUserForm] = useState({ email: '', password: '', role: 'user', is_active: true });
  const [commandForm, setCommandForm] = useState({ name: '', description: '', command: '', is_active: true });

  useEffect(() => {
    loadData();

    // Подписка на события
    onEvent('command:log', handleNewLog);

    return () => {
      offEvent('command:log', handleNewLog);
    };
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const response = await usersAPI.getAll();
        setUsers(response.data.users);
      } else if (activeTab === 'commands') {
        const response = await commandsAPI.getAll();
        setCommands(response.data.commands);
      } else if (activeTab === 'logs') {
        const response = await commandsAPI.getAllLogs();
        setLogs(response.data.logs);
      }
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewLog = (data) => {
    if (activeTab === 'logs') {
      setLogs((prev) => [data, ...prev]);
    }
  };

  // Управление пользователями
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await usersAPI.update(editingUser.id, userForm);
      }
      setShowUserModal(false);
      setEditingUser(null);
      setUserForm({ email: '', password: '', role: 'user', is_active: true });
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Ошибка сохранения пользователя');
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      email: user.email,
      password: '',
      role: user.role,
      is_active: user.is_active
    });
    setShowUserModal(true);
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Удалить пользователя?')) return;
    try {
      await usersAPI.delete(id);
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Ошибка удаления пользователя');
    }
  };

  const handleToggleUserStatus = async (id) => {
    try {
      await usersAPI.toggleStatus(id);
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Ошибка изменения статуса');
    }
  };

  // Управление командами
  const handleCommandSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCommand) {
        await commandsAPI.update(editingCommand.id, commandForm);
      } else {
        await commandsAPI.create(commandForm);
      }
      setShowCommandModal(false);
      setEditingCommand(null);
      setCommandForm({ name: '', description: '', command: '', is_active: true });
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Ошибка сохранения команды');
    }
  };

  const handleEditCommand = (command) => {
    setEditingCommand(command);
    setCommandForm({
      name: command.name,
      description: command.description || '',
      command: command.command,
      is_active: command.is_active
    });
    setShowCommandModal(true);
  };

  const handleDeleteCommand = async (id) => {
    if (!confirm('Удалить команду?')) return;
    try {
      await commandsAPI.delete(id);
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Ошибка удаления команды');
    }
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="header-content">
          <h1>Админ-панель</h1>
          <div className="user-info">
            <span className="user-email">{user?.email}</span>
            <button onClick={logout} className="btn btn-logout">
              Выйти
            </button>
          </div>
        </div>
      </header>

      <div className="admin-main">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Пользователи
          </button>
          <button
            className={`tab ${activeTab === 'commands' ? 'active' : ''}`}
            onClick={() => setActiveTab('commands')}
          >
            Команды
          </button>
          <button
            className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            Логи
          </button>
        </div>

        <div className="tab-content">
          {loading ? (
            <div className="loading">Загрузка...</div>
          ) : (
            <>
              {activeTab === 'users' && (
                <UsersTab
                  users={users}
                  onEdit={handleEditUser}
                  onDelete={handleDeleteUser}
                  onToggleStatus={handleToggleUserStatus}
                />
              )}

              {activeTab === 'commands' && (
                <CommandsTab
                  commands={commands}
                  onEdit={handleEditCommand}
                  onDelete={handleDeleteCommand}
                  onCreate={() => setShowCommandModal(true)}
                />
              )}

              {activeTab === 'logs' && <LogsTab logs={logs} />}
            </>
          )}
        </div>
      </div>

      {/* Модальное окно пользователя */}
      {showUserModal && (
        <Modal onClose={() => { setShowUserModal(false); setEditingUser(null); }}>
          <h2>{editingUser ? 'Редактировать пользователя' : 'Новый пользователь'}</h2>
          <form onSubmit={handleUserSubmit} className="modal-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Пароль {editingUser && '(оставьте пустым, чтобы не менять)'}</label>
              <input
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label>Роль</label>
              <select
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
              >
                <option value="user">Пользователь</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={userForm.is_active}
                  onChange={(e) => setUserForm({ ...userForm, is_active: e.target.checked })}
                />
                Активен
              </label>
            </div>
            <button type="submit" className="btn btn-primary">
              Сохранить
            </button>
          </form>
        </Modal>
      )}

      {/* Модальное окно команды */}
      {showCommandModal && (
        <Modal onClose={() => { setShowCommandModal(false); setEditingCommand(null); }}>
          <h2>{editingCommand ? 'Редактировать команду' : 'Новая команда'}</h2>
          <form onSubmit={handleCommandSubmit} className="modal-form">
            <div className="form-group">
              <label>Название</label>
              <input
                type="text"
                value={commandForm.name}
                onChange={(e) => setCommandForm({ ...commandForm, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Описание</label>
              <textarea
                value={commandForm.description}
                onChange={(e) => setCommandForm({ ...commandForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>Команда</label>
              <textarea
                value={commandForm.command}
                onChange={(e) => setCommandForm({ ...commandForm, command: e.target.value })}
                rows={4}
                required
                placeholder="df -h"
              />
            </div>
            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={commandForm.is_active}
                  onChange={(e) => setCommandForm({ ...commandForm, is_active: e.target.checked })}
                />
                Активна
              </label>
            </div>
            <button type="submit" className="btn btn-primary">
              Сохранить
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};

// Компонент вкладки пользователей
const UsersTab = ({ users, onEdit, onDelete, onToggleStatus }) => (
  <div className="users-tab">
    <h2>Управление пользователями</h2>
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Email</th>
            <th>Роль</th>
            <th>Статус</th>
            <th>Дата создания</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.email}</td>
              <td>
                <span className={`badge ${user.role}`}>{user.role === 'admin' ? 'Админ' : 'Пользователь'}</span>
              </td>
              <td>
                <span className={`badge ${user.is_active ? 'active' : 'inactive'}`}>
                  {user.is_active ? 'Активен' : 'Неактивен'}
                </span>
              </td>
              <td>{new Date(user.created_at).toLocaleString('ru-RU')}</td>
              <td className="actions">
                <button onClick={() => onEdit(user)} className="btn-icon" title="Редактировать">
                  ✏️
                </button>
                <button onClick={() => onToggleStatus(user.id)} className="btn-icon" title="Изменить статус">
                  {user.is_active ? '🔒' : '🔓'}
                </button>
                <button onClick={() => onDelete(user.id)} className="btn-icon" title="Удалить">
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Компонент вкладки команд
const CommandsTab = ({ commands, onEdit, onDelete, onCreate }) => (
  <div className="commands-tab">
    <div className="tab-header">
      <h2>Управление командами</h2>
      <button onClick={onCreate} className="btn btn-primary">
        + Добавить команду
      </button>
    </div>
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Название</th>
            <th>Описание</th>
            <th>Команда</th>
            <th>Статус</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {commands.map((command) => (
            <tr key={command.id}>
              <td>{command.id}</td>
              <td>{command.name}</td>
              <td>{command.description}</td>
              <td><code>{command.command}</code></td>
              <td>
                <span className={`badge ${command.is_active ? 'active' : 'inactive'}`}>
                  {command.is_active ? 'Активна' : 'Неактивна'}
                </span>
              </td>
              <td className="actions">
                <button onClick={() => onEdit(command)} className="btn-icon" title="Редактировать">
                  ✏️
                </button>
                <button onClick={() => onDelete(command.id)} className="btn-icon" title="Удалить">
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Компонент вкладки логов
const LogsTab = ({ logs }) => (
  <div className="logs-tab">
    <h2>Логи выполнения команд</h2>
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Команда</th>
            <th>Пользователь</th>
            <th>Статус</th>
            <th>Вывод</th>
            <th>Дата</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{log.id}</td>
              <td>{log.command_name}</td>
              <td>{log.user_email}</td>
              <td>
                <span className={`badge ${log.status}`}>
                  {log.status === 'success' ? 'Успешно' : 'Ошибка'}
                </span>
              </td>
              <td>
                <details>
                  <summary>Показать</summary>
                  <pre>{log.output || log.error}</pre>
                </details>
              </td>
              <td>{new Date(log.executed_at).toLocaleString('ru-RU')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Компонент модального окна
const Modal = ({ children, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <button className="modal-close" onClick={onClose}>
        ×
      </button>
      {children}
    </div>
  </div>
);

export default AdminPanel;
