import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { usersAPI, commandsAPI, categoriesAPI, devicesAPI, firmwareAPI, emailSettingsAPI } from '../api/api';
import { onEvent, offEvent } from '../api/socket';
import './AdminPanel.css';

const AdminPanel = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'users');
  const [deviceSearchInit, setDeviceSearchInit] = useState(location.state?.search || '');
  const [users, setUsers] = useState([]);
  const [commands, setCommands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [logs, setLogs] = useState([]);
  const [devices, setDevices] = useState([]);
  const [firmware, setFirmware] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [deviceForm, setDeviceForm] = useState({ serial_number: 'GCB-', owner_id: '', fw_version: '0.1', category_ids: [], is_active: true });

  // Модальные окна
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCommandModal, setShowCommandModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingCommand, setEditingCommand] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingUserPermissions, setEditingUserPermissions] = useState(null);

  // Формы
  const [userForm, setUserForm] = useState({ email: '', password: '', role: 'user', is_active: true });
  const [commandForm, setCommandForm] = useState({
    name: '',
    description: '',
    category_id: '',
    can_bus: 1,
    can_id: '',
    d0: '',
    d1: '',
    d2: '',
    d3: '',
    d4: '',
    d5: '',
    d6: '',
    d7: '',
    is_active: true
  });
  const [categoryForm, setCategoryForm] = useState({ name: '', parent_id: null, description: '' });
  const [userPermissions, setUserPermissions] = useState([]);

  useEffect(() => {
    loadData();
    loadCategories();

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
      } else if (activeTab === 'categories') {
        const response = await categoriesAPI.getAll();
        setCategories(response.data.categories);
      } else if (activeTab === 'logs') {
        const response = await commandsAPI.getAllLogs();
        setLogs(response.data.logs);
      } else if (activeTab === 'devices') {
        const response = await devicesAPI.getAll();
        setDevices(response.data.devices);
      } else if (activeTab === 'firmware') {
        const response = await firmwareAPI.getAll();
        setFirmware(response.data.firmware);
      }
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Load categories error:', error);
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

  // Управление правами доступа
  const handleManagePermissions = async (user) => {
    setEditingUserPermissions(user);
    try {
      const response = await usersAPI.getPermissions(user.id);
      const categoryIds = response.data.permissions ? response.data.permissions.map(p => p.id) : [];
      setUserPermissions(categoryIds);
      setShowPermissionsModal(true);
    } catch (error) {
      alert(error.response?.data?.error || 'Ошибка загрузки прав доступа');
    }
  };

  const handlePermissionsSubmit = async (e) => {
    e.preventDefault();
    try {
      await usersAPI.updatePermissions(editingUserPermissions.id, { category_ids: userPermissions });
      setShowPermissionsModal(false);
      setEditingUserPermissions(null);
      setUserPermissions([]);
      alert('Права доступа обновлены');
    } catch (error) {
      alert(error.response?.data?.error || 'Ошибка сохранения прав доступа');
    }
  };

  const togglePermission = (categoryId) => {
    setUserPermissions((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
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
      setCommandForm({
        name: '',
        description: '',
        category_id: '',
        can_bus: 1,
        can_id: '',
        d0: '',
        d1: '',
        d2: '',
        d3: '',
        d4: '',
        d5: '',
        d6: '',
        d7: '',
        is_active: true
      });
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
      category_id: command.category_id || '',
      can_bus: command.can_bus || 1,
      can_id: command.can_id || '',
      d0: command.d0 || '',
      d1: command.d1 || '',
      d2: command.d2 || '',
      d3: command.d3 || '',
      d4: command.d4 || '',
      d5: command.d5 || '',
      d6: command.d6 || '',
      d7: command.d7 || '',
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

  // Управление категориями
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await categoriesAPI.update(editingCategory.id, categoryForm);
      } else {
        await categoriesAPI.create(categoryForm);
      }
      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', parent_id: null, description: '' });
      loadData();
      loadCategories();
    } catch (error) {
      alert(error.response?.data?.error || 'Ошибка сохранения категории');
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      parent_id: category.parent_id || null,
      description: category.description || ''
    });
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('Удалить категорию?')) return;
    try {
      await categoriesAPI.delete(id);
      loadData();
      loadCategories();
    } catch (error) {
      alert(error.response?.data?.error || 'Ошибка удаления категории');
    }
  };

  const handleHexInput = (field, value) => {
    const hex = value.toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 2);
    setCommandForm({ ...commandForm, [field]: hex });
  };

  // Сортировка команд
  const moveCommand = async (index, direction) => {
    const newCommands = [...commands];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newCommands.length) return;

    [newCommands[index], newCommands[targetIndex]] = [newCommands[targetIndex], newCommands[index]];
    setCommands(newCommands);

    try {
      await commandsAPI.updateOrder(newCommands.map((cmd, idx) => ({ id: cmd.id, sort_order: idx })));
    } catch (error) {
      console.error('Update order error:', error);
      loadData(); // Reload on error
    }
  };

  const handleDeviceSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDevice) {
        await devicesAPI.update(editingDevice.id, deviceForm);
      } else {
        await devicesAPI.create(deviceForm);
      }
      setShowDeviceModal(false);
      setEditingDevice(null);
      setDeviceForm({ serial_number: 'GCB-', owner_id: '', fw_version: '0.1', category_ids: [], is_active: true });
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Ошибка сохранения устройства');
    }
  };

  const handleEditDevice = (device) => {
    setEditingDevice(device);
    setDeviceForm({
      serial_number: device.serial_number,
      owner_id: device.owner_id || '',
      fw_version: device.fw_version || '',
      category_ids: Array.isArray(device.categories) ? device.categories.map(c => c.id) : [],
      is_active: device.is_active
    });
    setShowDeviceModal(true);
  };

  const handleDeleteDevice = async (id) => {
    if (!confirm('Удалить устройство?')) return;
    try {
      await devicesAPI.delete(id);
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Ошибка удаления');
    }
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="header-content">
          <h1>GCBox connect - Админ-панель</h1>
          <div className="user-info">
            <span className="user-email">{user?.email}</span>
            <button onClick={() => navigate('/dashboard')} className="btn btn-back">
              ← Дашборд
            </button>
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
            className={`tab ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            Категории
          </button>
          <button
            className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            Логи
          </button>
          <button
            className={`tab ${activeTab === 'devices' ? 'active' : ''}`}
            onClick={() => { setActiveTab('devices'); setDeviceSearchInit(''); }}
          >
            Устройства
          </button>
          <button
            className={`tab ${activeTab === 'firmware' ? 'active' : ''}`}
            onClick={() => setActiveTab('firmware')}
          >
            ПО
          </button>
          <button
            className={`tab ${activeTab === 'email' ? 'active' : ''}`}
            onClick={() => setActiveTab('email')}
          >
            Почта
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
                  onManagePermissions={handleManagePermissions}
                  onOpenCard={(id) => navigate(`/user-card/${id}`)}
                />
              )}

              {activeTab === 'commands' && (
                <CommandsTab
                  commands={commands}
                  categories={categories}
                  onEdit={handleEditCommand}
                  onDelete={handleDeleteCommand}
                  onCreate={() => setShowCommandModal(true)}
                  onMove={moveCommand}
                />
              )}

              {activeTab === 'categories' && (
                <CategoriesTab
                  categories={categories}
                  onEdit={handleEditCategory}
                  onDelete={handleDeleteCategory}
                  onCreate={() => setShowCategoryModal(true)}
                />
              )}

              {activeTab === 'logs' && <LogsTab logs={logs} />}

              {activeTab === 'devices' && (
                <DevicesTab
                  devices={devices}
                  users={users.length ? users : []}
                  onEdit={handleEditDevice}
                  onDelete={handleDeleteDevice}
                  onCreate={() => { setEditingDevice(null); setDeviceForm({ serial_number: 'GCB-', owner_id: '', fw_version: '0.1', category_ids: [], is_active: true }); setShowDeviceModal(true); }}
                  searchInit={deviceSearchInit}
                />
              )}

              {activeTab === 'firmware' && (
                <FirmwareTab
                  firmware={firmware}
                  devices={devices}
                  onRefresh={() => { firmwareAPI.getAll().then(r => setFirmware(r.data.firmware)); devicesAPI.getAll().then(r => setDevices(r.data.devices)); }}
                />
              )}

              {activeTab === 'email' && (
                <EmailTab />
              )}
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
              <label>Категория</label>
              <select
                value={commandForm.category_id}
                onChange={(e) => setCommandForm({ ...commandForm, category_id: e.target.value })}
              >
                <option value="">Без категории</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.parent_id ? `└─ ${cat.name}` : cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>CAN шина</label>
              <select
                value={commandForm.can_bus}
                onChange={(e) => setCommandForm({ ...commandForm, can_bus: parseInt(e.target.value) })}
              >
                <option value={1}>CAN 1</option>
                <option value={2}>CAN 2</option>
              </select>
            </div>
            <div className="form-group">
              <label>CAN ID</label>
              <input
                type="text"
                value={commandForm.can_id}
                onChange={(e) => setCommandForm({ ...commandForm, can_id: e.target.value })}
                placeholder="120"
                required
              />
            </div>
            <div className="form-group">
              <label>Данные (HEX, по 2 символа)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {['d0', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7'].map((field) => (
                  <div key={field}>
                    <label style={{ fontSize: '12px', marginBottom: '4px' }}>{field.toUpperCase()}</label>
                    <input
                      type="text"
                      value={commandForm[field]}
                      onChange={(e) => handleHexInput(field, e.target.value)}
                      placeholder="00"
                      maxLength={2}
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>
                ))}
              </div>
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

      {/* Модальное окно категории */}
      {showCategoryModal && (
        <Modal onClose={() => { setShowCategoryModal(false); setEditingCategory(null); }}>
          <h2>{editingCategory ? 'Редактировать категорию' : 'Новая категория'}</h2>
          <form onSubmit={handleCategorySubmit} className="modal-form">
            <div className="form-group">
              <label>Название</label>
              <input
                type="text"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Родительская категория</label>
              <select
                value={categoryForm.parent_id || ''}
                onChange={(e) => setCategoryForm({ ...categoryForm, parent_id: e.target.value || null })}
              >
                <option value="">Нет (корневая категория)</option>
                {categories.filter(c => !c.parent_id).map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Описание</label>
              <textarea
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Сохранить
            </button>
          </form>
        </Modal>
      )}

      {/* Модальное окно прав доступа */}
      {showPermissionsModal && (
        <Modal onClose={() => { setShowPermissionsModal(false); setEditingUserPermissions(null); }}>
          <h2>Права доступа: {editingUserPermissions?.email}</h2>
          <form onSubmit={handlePermissionsSubmit} className="modal-form">
            <div className="form-group">
              <label>Доступные категории</label>
              <div className="permissions-list">
                {categories.filter(c => !c.parent_id).map((parent) => (
                  <div key={parent.id}>
                    <label className="permission-item">
                      <input
                        type="checkbox"
                        checked={userPermissions.includes(parent.id)}
                        onChange={() => togglePermission(parent.id)}
                      />
                      <span className="parent-category">
                        {parent.name}
                      </span>
                    </label>
                    {categories.filter(c => c.parent_id === parent.id).map((child) => (
                      <label key={child.id} className="permission-item" style={{ paddingLeft: '30px' }}>
                        <input
                          type="checkbox"
                          checked={userPermissions.includes(child.id)}
                          onChange={() => togglePermission(child.id)}
                        />
                        <span className="subcategory">
                          └─ {child.name}
                        </span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <button type="submit" className="btn btn-primary">
              Сохранить
            </button>
          </form>
        </Modal>
      )}

      {/* Модальное окно устройства */}
      {showDeviceModal && (
        <Modal onClose={() => { setShowDeviceModal(false); setEditingDevice(null); }}>
          <h2>{editingDevice ? 'Редактировать устройство' : 'Новое устройство'}</h2>
          <form onSubmit={handleDeviceSubmit} className="modal-form">
            <div className="form-group">
              <label>Серийный номер</label>
              <div className="input-with-prefix">
                <span className="input-prefix">GCB-</span>
                <input
                  type="text"
                  value={deviceForm.serial_number.startsWith('GCB-') ? deviceForm.serial_number.slice(4) : deviceForm.serial_number}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                    setDeviceForm({ ...deviceForm, serial_number: 'GCB-' + val });
                  }}
                  required
                  placeholder="123456789"
                  maxLength={9}
                  inputMode="numeric"
                  disabled={!!editingDevice}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Категории команд</label>
              <div className="permissions-list">
                {categories.filter(c => !c.parent_id).map(parent => {
                  const subs = categories.filter(c => c.parent_id === parent.id);
                  const parentChecked = deviceForm.category_ids.includes(parent.id);
                  return (
                    <div key={parent.id}>
                      <label className="permission-item">
                        <input
                          type="checkbox"
                          checked={parentChecked}
                          onChange={(e) => {
                            const ids = e.target.checked
                              ? [...deviceForm.category_ids, parent.id]
                              : deviceForm.category_ids.filter(id => id !== parent.id);
                            setDeviceForm({ ...deviceForm, category_ids: ids });
                          }}
                        />
                        <span className="parent-category">{parent.name}</span>
                      </label>
                      {subs.map(sub => (
                        <label key={sub.id} className="permission-item">
                          <input
                            type="checkbox"
                            checked={deviceForm.category_ids.includes(sub.id)}
                            onChange={(e) => {
                              const ids = e.target.checked
                                ? [...deviceForm.category_ids, sub.id]
                                : deviceForm.category_ids.filter(id => id !== sub.id);
                              setDeviceForm({ ...deviceForm, category_ids: ids });
                            }}
                          />
                          <span className="subcategory">{sub.name}</span>
                        </label>
                      ))}
                    </div>
                  );
                })}
              </div>
              <small style={{ color: '#6b7280', marginTop: 4, display: 'block' }}>
                При привязке к аккаунту пользователь получит права на выбранные категории
              </small>
            </div>
            <div className="form-group">
              <label>Версия ПО</label>
              <input
                type="text"
                value={deviceForm.fw_version}
                onChange={(e) => setDeviceForm({ ...deviceForm, fw_version: e.target.value })}
                placeholder="1.0.0"
              />
            </div>
            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={deviceForm.is_active}
                  onChange={(e) => setDeviceForm({ ...deviceForm, is_active: e.target.checked })}
                />
                Активен
              </label>
            </div>
            <button type="submit" className="btn btn-primary">Сохранить</button>
          </form>
        </Modal>
      )}
    </div>
  );
};

// Компонент вкладки пользователей
const UsersTab = ({ users, onEdit, onDelete, onToggleStatus, onManagePermissions, onOpenCard }) => (
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
                <button onClick={() => onOpenCard(user.id)} className="btn-icon" title="Карточка клиента">
                  👤
                </button>
                <button onClick={() => onEdit(user)} className="btn-icon" title="Редактировать">
                  ✏️
                </button>
                <button onClick={() => onToggleStatus(user.id)} className="btn-icon" title="Изменить статус">
                  {user.is_active ? '🔒' : '🔓'}
                </button>
                <button onClick={() => onManagePermissions(user)} className="btn-icon" title="Права доступа">
                  🔑
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
const CommandsTab = ({ commands, categories, onEdit, onDelete, onCreate, onMove }) => {
  const [openGroups, setOpenGroups] = useState({});

  const toggle = (key) => setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));

  // Группируем: parent → subcategory → commands
  const parentCats = categories.filter(c => !c.parent_id);
  const getChildren = (parentId) => categories.filter(c => c.parent_id === parentId);
  const getCmds = (catId) => commands.filter(c => c.category_id === catId);
  const uncategorized = commands.filter(c => !c.category_id);

  return (
    <div className="commands-tab">
      <div className="tab-header">
        <h2>Управление командами</h2>
        <button onClick={onCreate} className="btn btn-primary">+ Добавить команду</button>
      </div>

      <div className="cmd-accordion">
        {parentCats.map((parent) => {
          const children = getChildren(parent.id);
          const directCmds = getCmds(parent.id);
          const allCmds = directCmds.length + children.reduce((s, ch) => s + getCmds(ch.id).length, 0);
          if (allCmds === 0) return null;
          const isOpen = !!openGroups[`p_${parent.id}`];
          return (
            <div key={parent.id} className="cmd-acc-parent">
              <button className={`cmd-acc-parent-btn ${isOpen ? 'open' : ''}`} onClick={() => toggle(`p_${parent.id}`)}>
                <span>{parent.name}</span>
                <span className="cmd-acc-meta">{allCmds} команд <span className="cmd-acc-arrow">{isOpen ? '▲' : '▼'}</span></span>
              </button>

              {isOpen && (
                <div className="cmd-acc-body">
                  {/* Подкатегории */}
                  {children.map((child) => {
                    const cmds = getCmds(child.id);
                    if (cmds.length === 0) return null;
                    const isChildOpen = !!openGroups[`c_${child.id}`];
                    return (
                      <div key={child.id} className="cmd-acc-sub">
                        <button className={`cmd-acc-sub-btn ${isChildOpen ? 'open' : ''}`} onClick={() => toggle(`c_${child.id}`)}>
                          <span>{child.name}</span>
                          <span className="cmd-acc-meta">{cmds.length} команд <span className="cmd-acc-arrow">{isChildOpen ? '▲' : '▼'}</span></span>
                        </button>
                        {isChildOpen && <CmdTable cmds={cmds} commands={commands} onEdit={onEdit} onDelete={onDelete} onMove={onMove} />}
                      </div>
                    );
                  })}
                  {/* Прямые команды категории (без подкатегории) */}
                  {directCmds.length > 0 && <CmdTable cmds={directCmds} commands={commands} onEdit={onEdit} onDelete={onDelete} onMove={onMove} />}
                </div>
              )}
            </div>
          );
        })}

        {/* Без категории */}
        {uncategorized.length > 0 && (() => {
          const isOpen = !!openGroups['uncategorized'];
          return (
            <div className="cmd-acc-parent">
              <button className={`cmd-acc-parent-btn ${isOpen ? 'open' : ''}`} onClick={() => toggle('uncategorized')}>
                <span>Без категории</span>
                <span className="cmd-acc-meta">{uncategorized.length} команд <span className="cmd-acc-arrow">{isOpen ? '▲' : '▼'}</span></span>
              </button>
              {isOpen && <div className="cmd-acc-body"><CmdTable cmds={uncategorized} commands={commands} onEdit={onEdit} onDelete={onDelete} onMove={onMove} /></div>}
            </div>
          );
        })()}
      </div>
    </div>
  );
};

const CmdTable = ({ cmds, commands, onEdit, onDelete, onMove }) => (
  <div className="table-container" style={{ margin: '0', borderRadius: '0 0 8px 8px' }}>
    <table>
      <thead>
        <tr>
          <th>↕</th>
          <th>ID</th>
          <th>Название</th>
          <th>CAN</th>
          <th>CAN ID</th>
          <th>Данные</th>
          <th>Статус</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        {cmds.map((command) => {
          const index = commands.findIndex(c => c.id === command.id);
          return (
            <tr key={command.id}>
              <td>
                <button onClick={() => onMove(index, 'up')} disabled={index === 0} className="btn-sort">↑</button>
                <button onClick={() => onMove(index, 'down')} disabled={index === commands.length - 1} className="btn-sort">↓</button>
              </td>
              <td>{command.id}</td>
              <td>{command.name}</td>
              <td>CAN {command.can_bus}</td>
              <td><code>{command.can_id}</code></td>
              <td>
                <code style={{ fontSize: '11px' }}>
                  {[command.d0, command.d1, command.d2, command.d3, command.d4, command.d5, command.d6, command.d7].map(d => d || '00').join(' ')}
                </code>
              </td>
              <td>
                <span className={`badge ${command.is_active ? 'active' : 'inactive'}`}>
                  {command.is_active ? 'Активна' : 'Неактивна'}
                </span>
              </td>
              <td className="actions">
                <button onClick={() => onEdit(command)} className="btn-icon" title="Редактировать">✏️</button>
                <button onClick={() => onDelete(command.id)} className="btn-icon" title="Удалить">🗑️</button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

// Компонент вкладки категорий
const CategoriesTab = ({ categories, onEdit, onDelete, onCreate }) => {
  // Группируем категории: сначала родительские, затем их дочерние
  const parentCategories = categories.filter(c => !c.parent_id);
  const getChildren = (parentId) => categories.filter(c => c.parent_id === parentId);

  return (
    <div className="categories-tab">
      <div className="tab-header">
        <h2>Управление категориями</h2>
        <button onClick={onCreate} className="btn btn-primary">
          + Добавить категорию
        </button>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Родитель</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {parentCategories.map((parent) => (
              <>
                <tr key={parent.id} style={{ backgroundColor: '#e0e7ff' }}>
                  <td>{parent.id}</td>
                  <td><strong style={{ color: '#4338ca' }}>{parent.name}</strong></td>
                  <td>—</td>
                  <td>
                    <span className={`badge ${parent.is_active ? 'active' : 'inactive'}`}>
                      {parent.is_active ? 'Активна' : 'Неактивна'}
                    </span>
                  </td>
                  <td className="actions">
                    <button onClick={() => onEdit(parent)} className="btn-icon" title="Редактировать">
                      ✏️
                    </button>
                    <button onClick={() => onDelete(parent.id)} className="btn-icon" title="Удалить">
                      🗑️
                    </button>
                  </td>
                </tr>
                {getChildren(parent.id).map((child) => (
                  <tr key={child.id} style={{ backgroundColor: '#f5f3ff' }}>
                    <td>{child.id}</td>
                    <td>
                      <span className="subcategory" style={{ color: '#7c3aed' }}>{child.name}</span>
                    </td>
                    <td style={{ color: '#6b7280', fontSize: '13px' }}>{parent.name}</td>
                    <td>
                      <span className={`badge ${child.is_active ? 'active' : 'inactive'}`}>
                        {child.is_active ? 'Активна' : 'Неактивна'}
                      </span>
                    </td>
                    <td className="actions">
                      <button onClick={() => onEdit(child)} className="btn-icon" title="Редактировать">
                        ✏️
                      </button>
                      <button onClick={() => onDelete(child.id)} className="btn-icon" title="Удалить">
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

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

// Компонент вкладки ПО
const FirmwareTab = ({ firmware, devices, onRefresh }) => {
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ version: '', notes: '' });
  const [file, setFile] = useState(null);
  const [actionMsg, setActionMsg] = useState({});

  const showMsg = (key, msg, isError = false) => {
    setActionMsg(prev => ({ ...prev, [key]: { msg, error: isError } }));
    setTimeout(() => setActionMsg(prev => { const n = { ...prev }; delete n[key]; return n; }), 4000);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('version', form.version);
      fd.append('notes', form.notes);
      await firmwareAPI.upload(fd);
      setForm({ version: '', notes: '' });
      setFile(null);
      e.target.reset();
      onRefresh();
      showMsg('upload', 'Файл загружен успешно');
    } catch (err) {
      showMsg('upload', err.response?.data?.error || 'Ошибка загрузки', true);
    } finally {
      setUploading(false);
    }
  };

  const handlePush = async (fw, device_id = null) => {
    const key = device_id ? `push_${fw.id}_${device_id}` : `push_${fw.id}`;
    const target = device_id ? 'устройство' : 'все устройства';
    if (!confirm(`Принудительно отправить v${fw.version} на ${target}?`)) return;
    try {
      const res = await firmwareAPI.push(fw.id, device_id);
      showMsg(key, res.data.message);
      onRefresh();
    } catch (err) {
      showMsg(key, err.response?.data?.error || 'Ошибка', true);
    }
  };

  const handleSchedule = async (fw, device_id = null) => {
    const key = device_id ? `sched_${fw.id}_${device_id}` : `sched_${fw.id}`;
    try {
      const res = await firmwareAPI.schedule(fw.id, device_id);
      showMsg(key, res.data.message);
      onRefresh();
    } catch (err) {
      showMsg(key, err.response?.data?.error || 'Ошибка', true);
    }
  };

  const handleDelete = async (fw) => {
    if (!confirm(`Удалить версию ${fw.version}?`)) return;
    try {
      await firmwareAPI.delete(fw.id);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка удаления');
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
    return `${(bytes / 1024 / 1024).toFixed(2)} МБ`;
  };

  const activeDevices = devices.filter(d => d.is_active);

  return (
    <div className="firmware-tab">
      <div className="tab-header">
        <h2>Управление прошивками</h2>
      </div>

      {/* Форма загрузки */}
      <div className="firmware-upload-card">
        <h3>Загрузить новую версию</h3>
        <form onSubmit={handleUpload} className="firmware-upload-form">
          <div className="fw-form-row">
            <div className="form-group">
              <label>Версия *</label>
              <input
                type="text"
                placeholder="например 1.2.3"
                value={form.version}
                onChange={e => setForm({ ...form, version: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Файл *</label>
              <input
                type="file"
                onChange={e => setFile(e.target.files[0])}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Примечания</label>
            <textarea
              placeholder="Описание изменений..."
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={2}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={uploading}>
            {uploading ? 'Загрузка...' : '↑ Загрузить'}
          </button>
          {actionMsg['upload'] && (
            <div className={`fw-msg ${actionMsg['upload'].error ? 'fw-msg-error' : 'fw-msg-ok'}`}>
              {actionMsg['upload'].msg}
            </div>
          )}
        </form>
      </div>

      {/* Список версий */}
      {firmware.length === 0 ? (
        <div className="fw-empty">Нет загруженных версий ПО</div>
      ) : (
        <div className="firmware-list">
          {firmware.map(fw => (
            <div key={fw.id} className="firmware-card">
              <div className="fw-card-header">
                <div className="fw-version-info">
                  <span className="fw-version">v{fw.version}</span>
                  <span className="fw-filename">{fw.filename}</span>
                  <span className="fw-size">{formatSize(fw.size)}</span>
                  <span className="fw-date">{new Date(fw.created_at).toLocaleString('ru-RU')}</span>
                  {fw.uploaded_by_email && <span className="fw-author">загрузил: {fw.uploaded_by_email}</span>}
                </div>
                <div className="fw-card-actions">
                  <button
                    className="btn btn-fw-push"
                    onClick={() => handlePush(fw)}
                    title="Отправить принудительно на все устройства"
                  >
                    ⚡ Отправить всем
                  </button>
                  <button
                    className="btn btn-fw-schedule"
                    onClick={() => handleSchedule(fw)}
                    title="Запланировать на 03:00 для всех устройств"
                  >
                    🕒 Запланировать всем в 03:00
                  </button>
                  <a
                    href={firmwareAPI.downloadUrl(fw.id)}
                    className="btn btn-fw-download"
                    download
                  >
                    ↓ Скачать
                  </a>
                  <button className="btn-icon" onClick={() => handleDelete(fw)} title="Удалить">🗑️</button>
                </div>
              </div>

              {fw.notes && <div className="fw-notes">{fw.notes}</div>}

              {(actionMsg[`push_${fw.id}`] || actionMsg[`sched_${fw.id}`]) && (
                <div className={`fw-msg ${(actionMsg[`push_${fw.id}`] || actionMsg[`sched_${fw.id}`]).error ? 'fw-msg-error' : 'fw-msg-ok'}`}>
                  {(actionMsg[`push_${fw.id}`] || actionMsg[`sched_${fw.id}`]).msg}
                </div>
              )}

              {/* Список устройств с кнопками на каждое */}
              {activeDevices.length > 0 && (
                <div className="fw-devices">
                  <div className="fw-devices-title">Активные устройства ({activeDevices.length})</div>
                  <div className="fw-devices-list">
                    {activeDevices.map(dev => (
                      <div key={dev.id} className="fw-device-row">
                        <span className="fw-device-serial">{dev.serial_number}</span>
                        {dev.owner_email && <span className="fw-device-owner">{dev.owner_email}</span>}
                        {dev.fw_version && <span className="fw-device-ver">текущая: v{dev.fw_version}</span>}
                        {dev.fw_update_available && <span className="badge fw-pending-badge">нужно обновить</span>}
                        <div className="fw-device-btns">
                          <button
                            className="btn btn-fw-push-sm"
                            onClick={() => handlePush(fw, dev.id)}
                            title="Отправить принудительно"
                          >⚡</button>
                          <button
                            className="btn btn-fw-schedule-sm"
                            onClick={() => handleSchedule(fw, dev.id)}
                            title="Запланировать на 03:00"
                          >🕒</button>
                        </div>
                        {(actionMsg[`push_${fw.id}_${dev.id}`] || actionMsg[`sched_${fw.id}_${dev.id}`]) && (
                          <span className={`fw-msg-inline ${(actionMsg[`push_${fw.id}_${dev.id}`] || actionMsg[`sched_${fw.id}_${dev.id}`]).error ? 'fw-msg-error' : 'fw-msg-ok'}`}>
                            {(actionMsg[`push_${fw.id}_${dev.id}`] || actionMsg[`sched_${fw.id}_${dev.id}`]).msg}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Компонент вкладки устройств
const DevicesTab = ({ devices, users, onEdit, onDelete, onCreate, searchInit = '' }) => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState(searchInit);

  useEffect(() => {
    setSearch(searchInit);
  }, [searchInit]);
  const [openPhones, setOpenPhones] = useState({});
  const navigate = useNavigate();

  const filtered = devices
    .filter(d => filter === 'all' ? true : d.is_active === (filter === 'active'))
    .filter(d => search.trim() === '' ? true : d.serial_number.toLowerCase().includes(search.trim().toLowerCase()));

  const togglePhones = (id) => setOpenPhones(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="devices-tab">
      <div className="tab-header">
        <h2>Управление устройствами</h2>
        <button onClick={onCreate} className="btn btn-primary">+ Добавить устройство</button>
      </div>

      <div className="devices-toolbar">
        <div className="devices-filter">
          <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            Все ({devices.length})
          </button>
          <button className={`filter-btn ${filter === 'active' ? 'active' : ''}`} onClick={() => setFilter('active')}>
            Активные ({devices.filter(d => d.is_active).length})
          </button>
          <button className={`filter-btn ${filter === 'inactive' ? 'active' : ''}`} onClick={() => setFilter('inactive')}>
            Неактивные ({devices.filter(d => !d.is_active).length})
          </button>
        </div>
        <input
          className="devices-search"
          type="text"
          placeholder="Поиск по серийному номеру..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Статус</th>
              <th>Серийный номер</th>
              <th>Категория</th>
              <th>Владелец</th>
              <th>Телефоны</th>
              <th>Геопозиция</th>
              <th>Версия ПО</th>
              <th>Обновление</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontStyle: 'italic' }}>Нет устройств</td></tr>
            ) : filtered.map((device) => (
              <tr key={device.id}>
                <td>
                  <span className={`badge ${device.is_active ? 'active' : 'inactive'}`}>
                    {device.is_active ? 'Активен' : 'Неактивен'}
                  </span>
                </td>
                <td><code>{device.serial_number}</code></td>
                <td>
                  {device.categories && device.categories.length > 0
                    ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {device.categories.map(c => (
                          <span key={c.id} className="badge category">{c.name}</span>
                        ))}
                      </div>
                    : <span style={{ color: '#9ca3af' }}>—</span>}
                </td>
                <td>
                  {device.owner_email
                    ? <span className="owner-link" onClick={() => navigate(`/user-card/${device.owner_id}`)}>{device.owner_email}</span>
                    : <span style={{ color: '#9ca3af' }}>—</span>}
                </td>
                <td>
                  {(device.phone || device.phone2 || device.phone3) ? (
                    <div className="phones-dropdown">
                      <button className="phones-toggle" onClick={() => togglePhones(device.id)}>
                        📞 {openPhones[device.id] ? '▲' : '▼'}
                      </button>
                      {openPhones[device.id] && (
                        <div className="phones-list">
                          {device.phone && <div>{device.phone}</div>}
                          {device.phone2 && <div>{device.phone2}</div>}
                          {device.phone3 && <div>{device.phone3}</div>}
                        </div>
                      )}
                    </div>
                  ) : <span style={{ color: '#9ca3af' }}>—</span>}
                </td>
                <td>
                  {device.last_lat && device.last_lng ? (
                    <a
                      href={`https://maps.google.com/?q=${device.last_lat},${device.last_lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="geo-link"
                    >
                      {parseFloat(device.last_lat).toFixed(4)}, {parseFloat(device.last_lng).toFixed(4)}
                    </a>
                  ) : <span style={{ color: '#9ca3af' }}>—</span>}
                </td>
                <td>{device.fw_version || <span style={{ color: '#9ca3af' }}>—</span>}</td>
                <td>
                  {device.fw_update_available
                    ? <span className="badge" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white' }} title={`Доступна v${device.latest_fw_version}`}>
                        ↑ v{device.latest_fw_version}
                      </span>
                    : <span style={{ color: '#10b981', fontWeight: 600, fontSize: 13 }}>✓ Актуально</span>}
                </td>
                <td className="actions">
                  <button onClick={() => onEdit(device)} className="btn-icon" title="Редактировать">✏️</button>
                  <button onClick={() => onDelete(device.id)} className="btn-icon" title="Удалить">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

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

// Компонент вкладки Почта
const EmailTab = () => {
  const [form, setForm] = useState({
    smtp_host: 'smtp.mail.ru',
    smtp_port: 465,
    smtp_secure: true,
    smtp_user: '',
    smtp_password: '',
    from_name: 'GCBox Connect',
    admin_email: '',
    enabled: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    emailSettingsAPI.get().then(r => {
      setForm(f => ({ ...f, ...r.data.settings }));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await emailSettingsAPI.save(form);
      setMsg({ ok: true, text: 'Настройки сохранены' });
    } catch (err) {
      setMsg({ ok: false, text: err.response?.data?.error || 'Ошибка сохранения' });
    }
    setSaving(false);
  };

  const handleTest = async () => {
    if (!testEmail) return;
    setTesting(true);
    setMsg(null);
    try {
      await emailSettingsAPI.test(testEmail);
      setMsg({ ok: true, text: `Тестовое письмо отправлено на ${testEmail}` });
    } catch (err) {
      setMsg({ ok: false, text: err.response?.data?.error || 'Ошибка отправки' });
    }
    setTesting(false);
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div>
      <div className="tab-header">
        <h2>Настройки почты</h2>
      </div>
      <div className="firmware-upload-card">
        <form onSubmit={handleSave} className="firmware-upload-form">
          <div className="form-group checkbox" style={{ marginBottom: 20 }}>
            <label>
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={e => setForm({ ...form, enabled: e.target.checked })}
              />
              Включить отправку писем
            </label>
          </div>

          <div className="fw-form-row">
            <div className="form-group">
              <label>SMTP хост</label>
              <input type="text" value={form.smtp_host} onChange={e => setForm({ ...form, smtp_host: e.target.value })} />
            </div>
            <div className="form-group">
              <label>SMTP порт</label>
              <input type="number" value={form.smtp_port} onChange={e => setForm({ ...form, smtp_port: Number(e.target.value) })} />
            </div>
          </div>

          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                checked={form.smtp_secure}
                onChange={e => setForm({ ...form, smtp_secure: e.target.checked })}
              />
              SSL/TLS (порт 465)
            </label>
          </div>

          <div className="fw-form-row">
            <div className="form-group">
              <label>Логин (email отправителя)</label>
              <input type="email" value={form.smtp_user} onChange={e => setForm({ ...form, smtp_user: e.target.value })} placeholder="bot@mail.ru" />
            </div>
            <div className="form-group">
              <label>Пароль</label>
              <input type="password" value={form.smtp_password} onChange={e => setForm({ ...form, smtp_password: e.target.value })} placeholder="Пароль приложения" />
            </div>
          </div>

          <div className="fw-form-row">
            <div className="form-group">
              <label>Имя отправителя</label>
              <input type="text" value={form.from_name} onChange={e => setForm({ ...form, from_name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Email администратора (для уведомлений)</label>
              <input type="email" value={form.admin_email} onChange={e => setForm({ ...form, admin_email: e.target.value })} placeholder="admin@example.com" />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить настройки'}
          </button>
        </form>

        <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#374151' }}>Тестовая отправка</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label>Отправить тест на email</label>
              <input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="test@example.com" />
            </div>
            <button type="button" className="btn btn-primary" onClick={handleTest} disabled={testing || !testEmail}>
              {testing ? 'Отправка...' : 'Отправить тест'}
            </button>
          </div>
        </div>

        {msg && (
          <div className={`fw-msg ${msg.ok ? 'fw-msg-ok' : 'fw-msg-error'}`} style={{ marginTop: 16 }}>
            {msg.text}
          </div>
        )}

        <div style={{ marginTop: 24, padding: 16, background: '#f9fafb', borderRadius: 10, fontSize: 13, color: '#6b7280' }}>
          <b>Когда отправляются письма:</b>
          <ul style={{ margin: '8px 0 0', paddingLeft: 20, lineHeight: 1.8 }}>
            <li>Пользователю — при регистрации (аккаунт на рассмотрении)</li>
            <li>Администратору — при регистрации нового пользователя</li>
            <li>Пользователю — при активации или деактивации аккаунта</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
