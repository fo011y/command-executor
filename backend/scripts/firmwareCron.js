import cron from 'node-cron';
import pool from '../config/database.js';

export const startFirmwareCron = (io) => {
  // Каждую минуту проверяем pending-задачи с прошедшим scheduled_at
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const tasks = await pool.query(`
        SELECT fut.id, fut.firmware_id, fut.device_id,
               f.version, f.filename, f.size, f.id as fw_id,
               d.serial_number
        FROM firmware_update_tasks fut
        JOIN firmware f ON fut.firmware_id = f.id
        JOIN devices d ON fut.device_id = d.id
        WHERE fut.status = 'pending' AND fut.scheduled_at <= $1
      `, [now]);

      if (tasks.rows.length === 0) return;

      console.log(`[FW Cron] Отправляем обновления для ${tasks.rows.length} устройств`);

      for (const task of tasks.rows) {
        io.emit(`fw:update:${task.serial_number}`, {
          version: task.version,
          filename: task.filename,
          size: task.size,
          download_url: `/api/firmware/${task.fw_id}/download`
        });

        await pool.query(
          `UPDATE firmware_update_tasks SET status = 'sent', sent_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [task.id]
        );

        await pool.query(
          `UPDATE devices SET fw_update_available = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [task.device_id]
        );
      }
    } catch (error) {
      console.error('[FW Cron] Error:', error);
    }
  });

  console.log('[FW Cron] Планировщик обновлений запущен');
};
