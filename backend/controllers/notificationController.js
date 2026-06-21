import { readFile } from 'fs/promises';
import { GoogleAuth } from 'google-auth-library';
import pool from '../config/database.js';

let _auth = null;

async function getAccessToken() {
  if (!_auth) {
    const keyFile = new URL('../firebase-service-account.json', import.meta.url).pathname;
    _auth = new GoogleAuth({
      keyFile,
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    });
  }
  const client = await _auth.getClient();
  const token = await client.getAccessToken();
  return token.token;
}

// POST /api/notifications/register-token
export const registerToken = async (req, res) => {
  const { fcm_token } = req.body;
  const userId = req.user.id;

  if (!fcm_token) {
    return res.status(400).json({ error: 'fcm_token is required' });
  }

  try {
    await pool.query(
      `INSERT INTO fcm_tokens (user_id, token, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (token) DO UPDATE SET user_id = $1, updated_at = NOW()`,
      [userId, fcm_token]
    );
    res.json({ message: 'Token registered' });
  } catch (error) {
    console.error('registerToken error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/notifications/send  (admin only)
// Body: { title, body, user_id? }
export const sendNotification = async (req, res) => {
  const { title, body, user_id } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: 'title and body are required' });
  }

  try {
    let rows;
    if (user_id) {
      const result = await pool.query(
        'SELECT token FROM fcm_tokens WHERE user_id = $1',
        [user_id]
      );
      rows = result.rows;
    } else {
      const result = await pool.query('SELECT token FROM fcm_tokens');
      rows = result.rows;
    }

    if (rows.length === 0) {
      return res.json({ message: 'No registered devices', sent: 0 });
    }

    const tokens = rows.map((r) => r.token);
    const sent = await _sendFcmV1(tokens, title, body);

    res.json({ message: 'Notifications sent', sent });
  } catch (error) {
    console.error('sendNotification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/notifications/tokens  (admin only)
export const getTokens = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ft.id, ft.token, ft.updated_at, u.email
       FROM fcm_tokens ft
       JOIN users u ON u.id = ft.user_id
       ORDER BY ft.updated_at DESC`
    );
    res.json({ tokens: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// FCM HTTP V1 API — отправка через OAuth2 сервисный аккаунт
async function _sendFcmV1(tokens, title, body) {
  const projectId = 'gcbox-connect-34d9c';
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  let accessToken;
  try {
    accessToken = await getAccessToken();
  } catch (e) {
    console.error('FCM auth error:', e);
    return 0;
  }

  let sent = 0;
  for (const token of tokens) {
    const payload = {
      message: {
        token,
        notification: { title, body },
        android: { priority: 'high' },
      },
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) sent++;
      else {
        const err = await response.json();
        console.warn('FCM send failed for token:', token, err);
      }
    } catch (e) {
      console.error('FCM fetch error:', e);
    }
  }

  return sent;
}
