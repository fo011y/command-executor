import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { commandsAPI } from '../api/api';
import { onEvent, offEvent, emitEvent } from '../api/socket';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState({});
  const [results, setResults] = useState({});

  useEffect(() => {
    loadCommands();

    // Подписка на события WebSocket
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
      setCommands(response.data.commands);
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

    // Убрать результат через 10 секунд
    setTimeout(() => {
      setResults((prev) => {
        const newResults = { ...prev };
        delete newResults[data.commandId];
        return newResults;
      });
    }, 10000);
  };

  const executeCommand = async (commandId) => {
    try {
      setExecuting((prev) => ({ ...prev, [commandId]: true }));
      emitEvent('command:execute', { commandId });

      const response = await commandsAPI.execute(commandId);

      setResults((prev) => ({
        ...prev,
        [commandId]: response.data
      }));

      // Убрать результат через 10 секунд
      setTimeout(() => {
        setResults((prev) => {
          const newResults = { ...prev };
          delete newResults[commandId];
          return newResults;
        });
      }, 10000);
    } catch (error) {
      console.error('Execute command error:', error);
      setResults((prev) => ({
        ...prev,
        [commandId]: {
          status: 'error',
          error: error.response?.data?.error || 'Ошибка выполнения команды'
        }
      }));
    } finally {
      setExecuting((prev) => ({ ...prev, [commandId]: false }));
    }
  };

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
          <h1>Command Executor</h1>
          <div className="user-info">
            <span className="user-email">{user?.email}</span>
            <button onClick={logout} className="btn btn-logout">
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="commands-section">
          <h2>Доступные команды</h2>

          {commands.length === 0 ? (
            <div className="no-commands">
              <p>Нет доступных команд</p>
            </div>
          ) : (
            <div className="commands-grid">
              {commands.map((command) => (
                <div key={command.id} className="command-card">
                  <h3>{command.name}</h3>
                  {command.description && (
                    <p className="command-description">{command.description}</p>
                  )}

                  <button
                    onClick={() => executeCommand(command.id)}
                    disabled={executing[command.id]}
                    className="btn btn-execute"
                  >
                    {executing[command.id] ? 'Выполняется...' : 'Выполнить'}
                  </button>

                  {results[command.id] && (
                    <div
                      className={`command-result ${
                        results[command.id].status === 'success'
                          ? 'success'
                          : 'error'
                      }`}
                    >
                      <strong>
                        {results[command.id].status === 'success'
                          ? 'Успешно'
                          : 'Ошибка'}
                        :
                      </strong>
                      {results[command.id].output && (
                        <pre>{results[command.id].output}</pre>
                      )}
                      {results[command.id].error && (
                        <pre className="error-text">
                          {results[command.id].error}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
