import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { commandsAPI } from '../api/api';
import { onEvent, offEvent, emitEvent } from '../api/socket';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState({});
  const [results, setResults] = useState({});

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
      // Фильтруем команды без категории для обычных пользователей
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
      setResults((prev) => {
        const newResults = { ...prev };
        delete newResults[data.commandId];
        return newResults;
      });
    }, 5000);
  };

  const executeCommand = async (commandId) => {
    try {
      setExecuting((prev) => ({ ...prev, [commandId]: true }));
      setResults((prev) => ({
        ...prev,
        [commandId]: { status: 'sending', message: 'Команда отправлена' }
      }));

      emitEvent('command:execute', { commandId });

      const response = await commandsAPI.execute(commandId);

      setResults((prev) => ({
        ...prev,
        [commandId]: {
          status: 'success',
          message: 'Команда выполнена'
        }
      }));

      setTimeout(() => {
        setResults((prev) => {
          const newResults = { ...prev };
          delete newResults[commandId];
          return newResults;
        });
      }, 5000);
    } catch (error) {
      console.error('Execute command error:', error);
      setResults((prev) => ({
        ...prev,
        [commandId]: {
          status: 'error',
          message: 'Ошибка выполнения команды'
        }
      }));
    } finally {
      setExecuting((prev) => ({ ...prev, [commandId]: false }));
    }
  };

  // Группировка команд по родительским категориям и подкатегориям
  const groupedCommands = commands.reduce((acc, command) => {
    // Пропускаем команды без категории для обычных пользователей
    if (!command.category_id && user?.role !== 'admin') {
      return acc;
    }

    // Если есть родительская категория - используем её, иначе сама категория является родительской
    const parentCategory = command.parent_category_name || command.category_name || (user?.role === 'admin' ? 'Без категории' : null);
    // Если есть родительская категория - текущая категория это подкатегория, иначе используем саму категорию
    const subCategory = command.parent_category_name ? command.category_name : command.category_name;

    if (!parentCategory) return acc;

    if (!acc[parentCategory]) {
      acc[parentCategory] = {};
    }

    if (!acc[parentCategory][subCategory]) {
      acc[parentCategory][subCategory] = [];
    }

    acc[parentCategory][subCategory].push(command);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>GCBox connect</h1>
          <div className="user-info">
            <span className="user-email">{user?.email}</span>
            <button onClick={() => navigate('/profile')} className="btn btn-profile">
              Личный кабинет
            </button>
            {user?.role === 'admin' && (
              <button onClick={() => navigate('/admin')} className="btn btn-admin">
                Админ-панель
              </button>
            )}
            <button onClick={logout} className="btn btn-logout">
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {commands.length === 0 ? (
          <div className="no-commands">
            <p>Нет доступных команд</p>
          </div>
        ) : (
          <div className="categories-container">
            {Object.entries(groupedCommands).map(([parentCategory, subCategories]) => (
              <div key={parentCategory} className="parent-category-section">
                <h2 className="parent-category-title">{parentCategory}</h2>

                {Object.entries(subCategories).map(([subCategory, categoryCommands]) => (
                  <div key={subCategory} className="subcategory-section">
                    <h3 className="subcategory-title">{subCategory}</h3>
                    <div className="commands-grid">
                      {categoryCommands.map((command) => (
                        <div key={command.id} className="command-card">
                          <div>
                            <div className="command-title-wrapper">
                              <h4>
                                {command.name}
                                {command.description && (
                                  <span className="command-description-label">
                                    ОПИСАНИЕ
                                  </span>
                                )}
                              </h4>
                              {command.description && (
                                <div className="command-description-tooltip">
                                  {command.description}
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <button
                              onClick={() => executeCommand(command.id)}
                              disabled={executing[command.id]}
                              className="btn btn-execute"
                            >
                              {executing[command.id] ? 'Выполняется...' : 'Выполнить'}
                            </button>

                            {results[command.id] && (
                              <div
                                className={`command-result ${results[command.id].status}`}
                              >
                                <strong>{results[command.id].message}</strong>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
