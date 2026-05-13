# Интеграция с STM32 и SIM868E

Руководство по интеграции Command Executor с модулем STM32 и GSM модемом SIM868E.

## Архитектура

```
[STM32 + SIM868E] <--GPRS--> [Internet] <--HTTP/WS--> [Command Executor Server]
```

## Вариант 1: HTTP API (Рекомендуется для начала)

### Преимущества
- Простая реализация
- Надежность
- Меньше потребление памяти

### Шаги интеграции

#### 1. Подключение к GPRS

```c
// AT команды для SIM868E
AT+CGATT=1              // Подключиться к GPRS
AT+SAPBR=3,1,"APN","internet"  // Настроить APN
AT+SAPBR=1,1            // Открыть GPRS
AT+SAPBR=2,1            // Проверить IP адрес
```

#### 2. Аутентификация

```c
// HTTP POST запрос для получения токена
AT+HTTPINIT
AT+HTTPPARA="CID",1
AT+HTTPPARA="URL","http://your-server.com/api/auth/login"
AT+HTTPPARA="CONTENT","application/json"
AT+HTTPDATA=60,10000

// Отправить JSON:
{"email":"device@example.com","password":"device_password"}

AT+HTTPACTION=1  // POST запрос
AT+HTTPREAD      // Прочитать ответ

// Ответ содержит JWT токен:
{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
```

#### 3. Сохранение токена

```c
// Сохранить токен в EEPROM или Flash STM32
char jwt_token[512];
strcpy(jwt_token, "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...");
```

#### 4. Выполнение команды

```c
// HTTP POST с токеном
AT+HTTPINIT
AT+HTTPPARA="CID",1
AT+HTTPPARA="URL","http://your-server.com/api/commands/1/execute"
AT+HTTPPARA="CONTENT","application/json"
AT+HTTPPARA="USERDATA","Authorization: Bearer YOUR_TOKEN"
AT+HTTPACTION=1

// Ответ:
{
  "status": "success",
  "output": "результат команды",
  "error": ""
}
```

### Пример кода для STM32

```c
#include "stm32f4xx_hal.h"
#include <string.h>
#include <stdio.h>

// UART для SIM868E
extern UART_HandleTypeDef huart1;

char jwt_token[512] = "";
char response_buffer[2048];

// Отправка AT команды
void send_at_command(const char* cmd) {
    HAL_UART_Transmit(&huart1, (uint8_t*)cmd, strlen(cmd), 1000);
    HAL_UART_Transmit(&huart1, (uint8_t*)"\r\n", 2, 1000);
}

// Чтение ответа
void read_response(char* buffer, uint16_t size) {
    HAL_UART_Receive(&huart1, (uint8_t*)buffer, size, 5000);
}

// Инициализация GPRS
int init_gprs() {
    send_at_command("AT+CGATT=1");
    HAL_Delay(1000);
    
    send_at_command("AT+SAPBR=3,1,\"APN\",\"internet\"");
    HAL_Delay(500);
    
    send_at_command("AT+SAPBR=1,1");
    HAL_Delay(2000);
    
    return 1;
}

// Аутентификация
int authenticate(const char* email, const char* password) {
    char json[256];
    sprintf(json, "{\"email\":\"%s\",\"password\":\"%s\"}", email, password);
    
    send_at_command("AT+HTTPINIT");
    HAL_Delay(500);
    
    send_at_command("AT+HTTPPARA=\"CID\",1");
    send_at_command("AT+HTTPPARA=\"URL\",\"http://your-server.com/api/auth/login\"");
    send_at_command("AT+HTTPPARA=\"CONTENT\",\"application/json\"");
    
    char data_cmd[64];
    sprintf(data_cmd, "AT+HTTPDATA=%d,10000", strlen(json));
    send_at_command(data_cmd);
    HAL_Delay(500);
    
    HAL_UART_Transmit(&huart1, (uint8_t*)json, strlen(json), 1000);
    HAL_Delay(1000);
    
    send_at_command("AT+HTTPACTION=1");
    HAL_Delay(3000);
    
    send_at_command("AT+HTTPREAD");
    read_response(response_buffer, sizeof(response_buffer));
    
    // Парсинг токена из JSON
    char* token_start = strstr(response_buffer, "\"token\":\"");
    if (token_start) {
        token_start += 9;
        char* token_end = strchr(token_start, '"');
        if (token_end) {
            strncpy(jwt_token, token_start, token_end - token_start);
            return 1;
        }
    }
    
    return 0;
}

// Выполнение команды
int execute_command(int command_id) {
    char url[128];
    sprintf(url, "http://your-server.com/api/commands/%d/execute", command_id);
    
    send_at_command("AT+HTTPINIT");
    HAL_Delay(500);
    
    send_at_command("AT+HTTPPARA=\"CID\",1");
    
    char url_cmd[256];
    sprintf(url_cmd, "AT+HTTPPARA=\"URL\",\"%s\"", url);
    send_at_command(url_cmd);
    
    char auth_header[600];
    sprintf(auth_header, "AT+HTTPPARA=\"USERDATA\",\"Authorization: Bearer %s\"", jwt_token);
    send_at_command(auth_header);
    
    send_at_command("AT+HTTPACTION=1");
    HAL_Delay(5000);
    
    send_at_command("AT+HTTPREAD");
    read_response(response_buffer, sizeof(response_buffer));
    
    send_at_command("AT+HTTPTERM");
    
    return 1;
}

// Главный цикл
int main(void) {
    HAL_Init();
    SystemClock_Config();
    MX_USART1_UART_Init();
    
    // Инициализация GPRS
    if (init_gprs()) {
        // Аутентификация
        if (authenticate("device@example.com", "device_password")) {
            // Выполнение команды каждые 60 секунд
            while (1) {
                execute_command(1);
                HAL_Delay(60000);
            }
        }
    }
    
    while (1) {
        HAL_Delay(1000);
    }
}
```

## Вариант 2: WebSocket (Для real-time)

### Преимущества
- Мгновенные уведомления
- Двусторонняя связь
- Меньше трафика

### Недостатки
- Сложнее реализация
- Больше потребление памяти
- Требует постоянное соединение

### Библиотеки для STM32

Используйте одну из библиотек:
- **lwIP** + **WebSocket client**
- **Mongoose OS** (если поддерживается)
- Собственная реализация WebSocket

### Пример подключения

```c
// Подключение к WebSocket
ws_connect("ws://your-server.com", jwt_token);

// Отправка команды
ws_emit("command:execute", "{\"commandId\":1}");

// Получение результата
ws_on("command:result", handle_result);
```

## Вариант 3: MQTT (Альтернатива)

Если хотите использовать MQTT вместо HTTP/WebSocket:

### Добавьте MQTT брокер

```bash
sudo apt install mosquitto mosquitto-clients
```

### Модифицируйте backend

Добавьте MQTT клиент в `server.js`:

```javascript
import mqtt from 'mqtt';

const mqttClient = mqtt.connect('mqtt://localhost:1883');

mqttClient.on('connect', () => {
  mqttClient.subscribe('commands/execute');
});

mqttClient.on('message', (topic, message) => {
  // Обработка команд от устройств
});
```

### STM32 код

Используйте библиотеку **Paho MQTT** для STM32.

## Рекомендации

### Безопасность

1. **HTTPS/WSS** - используйте шифрование в продакшене
2. **Токены** - обновляйте JWT токены периодически
3. **Отдельный пользователь** - создайте специального пользователя для устройств

### Надежность

1. **Переподключение** - реализуйте автоматическое переподключение
2. **Таймауты** - устанавливайте разумные таймауты
3. **Очередь** - сохраняйте команды в очередь при отсутствии связи

### Оптимизация

1. **Сжатие** - используйте gzip для HTTP
2. **Батчинг** - отправляйте несколько команд за раз
3. **Кеширование** - кешируйте токены и настройки

## Пример сценария использования

### Удаленное управление реле

```c
// Команда на сервере: "gpio_set 1"
// STM32 получает команду и выполняет:
HAL_GPIO_WritePin(RELAY_GPIO_Port, RELAY_Pin, GPIO_PIN_SET);

// Отправляет результат обратно
send_result("Relay 1 ON");
```

### Мониторинг датчиков

```c
// Каждые 5 минут отправлять данные
float temperature = read_temperature();
float humidity = read_humidity();

char data[128];
sprintf(data, "{\"temp\":%.2f,\"hum\":%.2f}", temperature, humidity);

// Отправить на сервер через API
send_sensor_data(data);
```

## Тестирование

### 1. Тест без STM32

Используйте curl для проверки API:

```bash
# Аутентификация
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"device@example.com","password":"device_password"}'

# Выполнение команды
curl -X POST http://localhost:5000/api/commands/1/execute \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Тест с эмулятором

Используйте AT Command Tester для проверки SIM868E команд.

### 3. Тест на реальном устройстве

Подключите STM32 к SIM868E и проверьте связь.

## Troubleshooting

### SIM868E не подключается к GPRS

- Проверьте SIM карту и баланс
- Проверьте APN оператора
- Проверьте уровень сигнала: `AT+CSQ`

### HTTP запросы не работают

- Проверьте URL сервера
- Проверьте firewall
- Используйте HTTP (не HTTPS) для тестов

### Токен истекает

- Увеличьте `JWT_EXPIRES_IN` в `.env`
- Реализуйте обновление токена

## Дополнительные ресурсы

- [SIM868E AT Commands Manual](https://simcom.ee/documents/SIM868/SIM868_AT_Command_Manual_V1.01.pdf)
- [STM32 HAL Documentation](https://www.st.com/resource/en/user_manual/dm00105879.pdf)
- [Socket.io Protocol](https://socket.io/docs/v4/socket-io-protocol/)

## Поддержка

Если возникли вопросы по интеграции, создайте issue в репозитории.
