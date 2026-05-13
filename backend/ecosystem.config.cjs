module.exports = {
  apps: [{
    name: 'command-executor',
    script: './server.js',
    env: {
      NODE_ENV: 'production',
      PORT: '5000',
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_NAME: 'command_executor',
      DB_USER: 'cmd_user',
      DB_PASSWORD: 'BfKXLQQoEOfQCEIHBHWz3HjMT',
      JWT_SECRET: '2mavj3uDCH79c63uhKImvkEwi3Ec6qcbkMxgLrO9AVAA0qfaAwmd3GTEtEoyN7oh7WaqGEyGJoCpUMrq1rw',
      JWT_EXPIRES_IN: '7d',
      ADMIN_EMAIL: 'admin@example.com',
      ADMIN_PASSWORD: 'admin123',
      CLIENT_URL: 'http://connect.gsmcanbox.ru'
    }
  }]
};
