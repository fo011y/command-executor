-- Миграция: настройки устройства, справочник авто, команды
-- Выполнить: psql -U postgres -d command_executor -f migrate_device_settings.sql

-- 1. Справочник марок авто
CREATE TABLE IF NOT EXISTS car_brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Справочник моделей авто
CREATE TABLE IF NOT EXISTS car_models (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER NOT NULL REFERENCES car_brands(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    can1_enabled BOOLEAN DEFAULT true,
    can2_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(brand_id, name)
);

-- 3. Преднастроенные CAN-команды (заполняет admin)
CREATE TABLE IF NOT EXISTS device_commands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,   -- engine_start, engine_stop, ...
    label VARCHAR(200) NOT NULL,          -- "Запуск двигателя" — для UI
    description TEXT,
    can_bus SMALLINT NOT NULL DEFAULT 1,  -- 1 = CAN1, 2 = CAN2
    can_id INTEGER NOT NULL,              -- 0x726
    can_ide SMALLINT NOT NULL DEFAULT 0,  -- 0 = std, 1 = ext
    can_data VARCHAR(16) NOT NULL,        -- "04310102000000" hex 8 байт
    can_dlc SMALLINT NOT NULL DEFAULT 8,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Команды, назначенные конкретному устройству (admin назначает)
CREATE TABLE IF NOT EXISTS device_allowed_commands (
    device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    command_id INTEGER NOT NULL REFERENCES device_commands(id) ON DELETE CASCADE,
    PRIMARY KEY (device_id, command_id)
);

-- 5. Очередь команд на выполнение (пользователь/сервер → устройство)
CREATE TABLE IF NOT EXISTS device_command_queue (
    id SERIAL PRIMARY KEY,
    device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    command_id INTEGER NOT NULL REFERENCES device_commands(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending, sent, done, error
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    done_at TIMESTAMP
);

-- 6. Расширяем таблицу devices
ALTER TABLE devices
    ADD COLUMN IF NOT EXISTS device_token UUID UNIQUE DEFAULT gen_random_uuid(),
    ADD COLUMN IF NOT EXISTS car_brand_id INTEGER REFERENCES car_brands(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS car_model_id INTEGER REFERENCES car_models(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP;

-- Индексы
CREATE INDEX IF NOT EXISTS idx_devices_token ON devices(device_token);
CREATE INDEX IF NOT EXISTS idx_devices_serial ON devices(serial_number);
CREATE INDEX IF NOT EXISTS idx_car_models_brand ON car_models(brand_id);
CREATE INDEX IF NOT EXISTS idx_cmd_queue_device ON device_command_queue(device_id, status);

-- Заполняем device_token для существующих устройств (если NULL)
UPDATE devices SET device_token = gen_random_uuid() WHERE device_token IS NULL;

-- Демо-данные: марки и модели
INSERT INTO car_brands (name) VALUES
    ('Ford'), ('Hyundai'), ('Kia'), ('Toyota'), ('Lada')
ON CONFLICT DO NOTHING;

INSERT INTO car_models (brand_id, name, can1_enabled, can2_enabled) VALUES
    ((SELECT id FROM car_brands WHERE name='Ford'), 'Focus 3', true, false),
    ((SELECT id FROM car_brands WHERE name='Ford'), 'Kuga 2', true, true),
    ((SELECT id FROM car_brands WHERE name='Hyundai'), 'Solaris 2', true, false),
    ((SELECT id FROM car_brands WHERE name='Hyundai'), 'Creta', true, false),
    ((SELECT id FROM car_brands WHERE name='Kia'), 'Rio X', true, false),
    ((SELECT id FROM car_brands WHERE name='Toyota'), 'Camry V70', true, true),
    ((SELECT id FROM car_brands WHERE name='Lada'), 'Vesta', true, false)
ON CONFLICT DO NOTHING;

-- Демо-данные: команды
INSERT INTO device_commands (name, label, description, can_bus, can_id, can_ide, can_data, can_dlc) VALUES
    ('engine_start',  'Запуск двигателя',   'Запустить двигатель удалённо', 1, 0x726, 0, '0431010200000000', 8),
    ('engine_stop',   'Остановка двигателя','Остановить двигатель',         1, 0x726, 0, '0431010300000000', 8),
    ('lock_doors',    'Закрыть двери',       'Заблокировать двери',          1, 0x750, 0, '0260030000000000', 8),
    ('unlock_doors',  'Открыть двери',       'Разблокировать двери',         1, 0x750, 0, '0260040000000000', 8)
ON CONFLICT DO NOTHING;
