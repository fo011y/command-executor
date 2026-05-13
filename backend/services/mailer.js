import nodemailer from 'nodemailer';
import pool from '../config/database.js';

const getSettings = async () => {
  const result = await pool.query('SELECT * FROM email_settings WHERE id = 1');
  return result.rows[0];
};

const createTransport = (settings) => nodemailer.createTransport({
  host: settings.smtp_host,
  port: settings.smtp_port,
  secure: settings.smtp_secure,
  auth: {
    user: settings.smtp_user,
    pass: settings.smtp_password
  }
});

export const sendMail = async ({ to, subject, html }) => {
  try {
    const s = await getSettings();
    if (!s || !s.enabled || !s.smtp_user || !s.smtp_password) return;
    const transporter = createTransport(s);
    await transporter.sendMail({
      from: `"${s.from_name}" <${s.smtp_user}>`,
      to,
      subject,
      html
    });
  } catch (err) {
    console.error('Mail send error:', err.message);
  }
};

export const getAdminEmail = async () => {
  const s = await getSettings();
  return s?.admin_email || null;
};

// Уведомление администратору о новой регистрации
export const mailNewRegistration = async ({ email, serial }) => {
  const adminEmail = await getAdminEmail();
  if (!adminEmail) return;
  await sendMail({
    to: adminEmail,
    subject: 'GCBox Connect — новая регистрация',
    html: `
      <h2>Новый пользователь ожидает подтверждения</h2>
      <p><b>Email:</b> ${email}</p>
      <p><b>Серийный номер:</b> ${serial}</p>
      <p>Войдите в <a href="http://connect.gsmcanbox.ru">панель администратора</a> для подтверждения аккаунта.</p>
    `
  });
};

// Уведомление пользователю — аккаунт на рассмотрении
export const mailRegistrationPending = async ({ email }) => {
  await sendMail({
    to: email,
    subject: 'GCBox Connect — аккаунт на рассмотрении',
    html: `
      <h2>Ваш аккаунт зарегистрирован</h2>
      <p>Спасибо за регистрацию в GCBox Connect.</p>
      <p>Ваш аккаунт находится на рассмотрении у администратора. Вы получите уведомление, как только он будет активирован.</p>
    `
  });
};

// Уведомление пользователю — статус изменён
export const mailStatusChanged = async ({ email, is_active }) => {
  const subject = is_active
    ? 'GCBox Connect — аккаунт активирован'
    : 'GCBox Connect — аккаунт деактивирован';
  const text = is_active
    ? '<p>Ваш аккаунт <b>активирован</b>. Теперь вы можете войти в систему.</p><p><a href="http://connect.gsmcanbox.ru">Войти</a></p>'
    : '<p>Ваш аккаунт <b>деактивирован</b> администратором. По вопросам обращайтесь в поддержку.</p>';
  await sendMail({
    to: email,
    subject,
    html: `<h2>${subject}</h2>${text}`
  });
};
