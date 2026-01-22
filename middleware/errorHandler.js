const config = require('../config/index');

/**
 * Централизованный обработчик ошибок
 */
class ErrorHandler {
    constructor() {
        this.errors = new Map();
        this.initializeErrors();
    }

    initializeErrors() {
        // Системные ошибки
        this.errors.set('VALIDATION_ERROR', {
            statusCode: 400,
            code: 'VALIDATION_ERROR',
            message: 'Ошибка валидации данных'
        });

        this.errors.set('UNAUTHORIZED', {
            statusCode: 401,
            code: 'UNAUTHORIZED',
            message: 'Требуется авторизация'
        });

        this.errors.set('FORBIDDEN', {
            statusCode: 403,
            code: 'FORBIDDEN',
            message: 'Доступ запрещен'
        });

        this.errors.set('NOT_FOUND', {
            statusCode: 404,
            code: 'NOT_FOUND',
            message: 'Ресурс не найден'
        });

        this.errors.set('RATE_LIMIT_EXCEEDED', {
            statusCode: 429,
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Превышен лимит запросов'
        });

        this.errors.set('INTERNAL_ERROR', {
            statusCode: 500,
            code: 'INTERNAL_ERROR',
            message: 'Внутренняя ошибка сервера'
        });

        this.errors.set('SERVICE_UNAVAILABLE', {
            statusCode: 503,
            code: 'SERVICE_UNAVAILABLE',
            message: 'Сервис временно недоступен'
        });

        // Бизнес-ошибки
        this.errors.set('GIGACHAT_UNAVAILABLE', {
            statusCode: 503,
            code: 'GIGACHAT_UNAVAILABLE',
            message: 'GigaChat API временно недоступен'
        });

        this.errors.set('MVP_GENERATION_FAILED', {
            statusCode: 500,
            code: 'MVP_GENERATION_FAILED',
            message: 'Ошибка генерации MVP'
        });

        this.errors.set('INSUFFICIENT_CREDITS', {
            statusCode: 402,
            code: 'INSUFFICIENT_CREDITS',
            message: 'Недостаточно кредитов'
        });

        this.errors.set('FILE_TOO_LARGE', {
            statusCode: 413,
            code: 'FILE_TOO_LARGE',
            message: 'Файл слишком большой'
        });

        this.errors.set('INVALID_FILE_TYPE', {
            statusCode: 415,
            code: 'INVALID_FILE_TYPE',
            message: 'Недопустимый тип файла'
        });
    }

    /**
     * Middleware для обработки ошибок
     */
    handleError(err, req, res, next) {
        console.error('🔥 Ошибка:', {
            message: err.message,
            stack: err.stack,
            url: req.url,
            method: req.method,
            ip: req.ip,
            timestamp: new Date().toISOString()
        });

        let statusCode = err.statusCode || 500;
        let errorResponse = {
            success: false,
            error: err.message || 'Внутренняя ошибка сервера',
            code: err.code || 'INTERNAL_ERROR',
            timestamp: new Date().toISOString(),
            path: req.path
        };

        // Обработка известных ошибок
        if (this.errors.has(err.code)) {
            const knownError = this.errors.get(err.code);
            statusCode = knownError.statusCode;
            errorResponse.code = knownError.code;
            errorResponse.error = knownError.message;
        }

        // Обработка JWT ошибок
        if (err.name === 'JsonWebTokenError') {
            statusCode = 401;
            errorResponse.code = 'INVALID_TOKEN';
            errorResponse.error = 'Неверный токен';
        }

        if (err.name === 'TokenExpiredError') {
            statusCode = 401;
            errorResponse.code = 'TOKEN_EXPIRED';
            errorResponse.error = 'Токен истек';
        }

        // Обработка валидационных ошибок
        if (err.name === 'ValidationError') {
            statusCode = 400;
            errorResponse.code = 'VALIDATION_ERROR';
            errorResponse.error = 'Ошибка валидации';
            errorResponse.details = err.details || [];
        }

        // Обработка ошибок базы данных
        if (err.code === '23505') { // PostgreSQL unique violation
            statusCode = 409;
            errorResponse.code = 'DUPLICATE_ENTRY';
            errorResponse.error = 'Запись уже существует';
        }

        if (err.code === '23503') { // PostgreSQL foreign key violation
            statusCode = 409;
            errorResponse.code = 'FOREIGN_KEY_VIOLATION';
            errorResponse.error = 'Нарушение ограничения внешнего ключа';
        }

        // Включаем стектрейс в режиме разработки
        if (config.server.env === 'development') {
            errorResponse.stack = err.stack;
            errorResponse.debug = {
                originalError: err.message,
                name: err.name,
                code: err.code
            };
        }

        // Логирование критических ошибок
        if (statusCode >= 500) {
            this.logCriticalError(err, req, errorResponse);
        }

        res.status(statusCode).json(errorResponse);
    }

    /**
     * Middleware для обработки 404 ошибок
     */
    handleNotFound(req, res, next) {
        const error = new Error(`Ресурс ${req.originalUrl} не найден`);
        error.statusCode = 404;
        error.code = 'NOT_FOUND';
        next(error);
    }

    /**
     * Генерация кастомных ошибок
     */
    createError(code, message, details = {}) {
        const error = new Error(message);
        error.code = code;
        error.details = details;
        
        if (this.errors.has(code)) {
            error.statusCode = this.errors.get(code).statusCode;
        } else {
            error.statusCode = 500;
        }

        return error;
    }

    /**
     * Логирование критических ошибок
     */
    logCriticalError(err, req, errorResponse) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: 'CRITICAL',
            error: {
                message: err.message,
                code: err.code,
                name: err.name,
                stack: err.stack
            },
            request: {
                url: req.url,
                method: req.method,
                ip: req.ip,
                userAgent: req.get('user-agent'),
                params: req.params,
                query: req.query,
                body: req.body
            },
            response: errorResponse,
            server: {
                nodeVersion: process.version,
                memory: process.memoryUsage(),
                uptime: process.uptime()
            }
        };

        console.error('🚨 КРИТИЧЕСКАЯ ОШИБКА:', JSON.stringify(logEntry, null, 2));

        // Отправка уведомления (можно интегрировать с Slack, Telegram и т.д.)
        this.sendAlert(logEntry);
    }

    /**
     * Отправка алертов
     */
    sendAlert(logEntry) {
        try {
            // Пример интеграции с Telegram
            if (config.notifications?.telegram?.botToken) {
                const telegramMessage = `
🚨 КРИТИЧЕСКАЯ ОШИБКА
Время: ${logEntry.timestamp}
Ошибка: ${logEntry.error.message}
Код: ${logEntry.error.code}
URL: ${logEntry.request.method} ${logEntry.request.url}
IP: ${logEntry.request.ip}
                `;

                // Отправка в Telegram
                // fetch(`https://api.telegram.org/bot${config.notifications.telegram.botToken}/sendMessage`, {
                //     method: 'POST',
                //     headers: { 'Content-Type': 'application/json' },
                //     body: JSON.stringify({
                //         chat_id: config.notifications.telegram.chatId,
                //         text: telegramMessage,
                //         parse_mode: 'HTML'
                //     })
                // });
            }
        } catch (alertError) {
            console.error('Ошибка отправки алерта:', alertError);
        }
    }

    /**
     * Graceful shutdown обработчик
     */
    setupGracefulShutdown(server) {
        const shutdown = (signal) => {
            console.log(`\n${signal} получен. Начинаю graceful shutdown...`);
            
            server.close(() => {
                console.log('HTTP сервер закрыт');
                
                // Закрытие соединений с базой данных
                if (global.supabaseClient) {
                    // Закрытие соединения Supabase
                    console.log('База данных соединения закрыты');
                }
                
                // Закрытие других соединений
                process.exit(0);
            });

            // Форсированный shutdown через 10 секунд
            setTimeout(() => {
                console.error('Принудительное завершение работы');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

        // Обработка необработанных исключений
        process.on('uncaughtException', (err) => {
            console.error('НЕОБРАБОТАННОЕ ИСКЛЮЧЕНИЕ:', err);
            this.handleError(err, { url: '', method: '' }, { status: () => ({ json: () => {} }) }, () => {});
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('НЕОБРАБОТАННЫЙ ПРОМИС:', reason);
            console.error('ПРОМИС:', promise);
        });
    }

    /**
     * Мониторинг производительности
     */
    setupPerformanceMonitoring() {
        const monitoring = {
            requests: [],
            errors: [],
            responseTimes: []
        };

        return (req, res, next) => {
            const startTime = Date.now();
            
            // Логирование завершения запроса
            res.on('finish', () => {
                const duration = Date.now() - startTime;
                const logEntry = {
                    timestamp: new Date().toISOString(),
                    method: req.method,
                    url: req.url,
                    statusCode: res.statusCode,
                    duration: duration,
                    ip: req.ip,
                    userAgent: req.get('user-agent')
                };

                monitoring.requests.push(logEntry);
                monitoring.responseTimes.push(duration);

                // Сохраняем только последние 1000 записей
                if (monitoring.requests.length > 1000) {
                    monitoring.requests.shift();
                }
                if (monitoring.responseTimes.length > 1000) {
                    monitoring.responseTimes.shift();
                }

                // Логирование медленных запросов
                if (duration > 5000) { // Более 5 секунд
                    console.warn(`МЕДЛЕННЫЙ ЗАПРОС: ${duration}ms ${req.method} ${req.url}`);
                }
            });

            next();
        };
    }

    /**
     * Получение статистики ошибок
     */
    getErrorStats() {
        const stats = {
            totalRequests: this.monitoring?.requests?.length || 0,
            totalErrors: this.monitoring?.errors?.length || 0,
            errorRate: 0,
            averageResponseTime: 0,
            errorCodes: {},
            recentErrors: []
        };

        if (stats.totalRequests > 0) {
            stats.errorRate = (stats.totalErrors / stats.totalRequests) * 100;
        }

        if (this.monitoring?.responseTimes?.length > 0) {
            const sum = this.monitoring.responseTimes.reduce((a, b) => a + b, 0);
            stats.averageResponseTime = sum / this.monitoring.responseTimes.length;
        }

        // Группировка ошибок по кодам
        if (this.monitoring?.errors) {
            this.monitoring.errors.forEach(error => {
                stats.errorCodes[error.code] = (stats.errorCodes[error.code] || 0) + 1;
            });

            stats.recentErrors = this.monitoring.errors.slice(-10);
        }

        return stats;
    }
}

// Экспортируем синглтон
const errorHandler = new ErrorHandler();
module.exports = errorHandler;

// Экспортируем middleware функции
module.exports.handleError = errorHandler.handleError.bind(errorHandler);
module.exports.handleNotFound = errorHandler.handleNotFound.bind(errorHandler);
module.exports.createError = errorHandler.createError.bind(errorHandler);
module.exports.setupGracefulShutdown = errorHandler.setupGracefulShutdown.bind(errorHandler);
module.exports.setupPerformanceMonitoring = errorHandler.setupPerformanceMonitoring.bind(errorHandler);
module.exports.getErrorStats = errorHandler.getErrorStats.bind(errorHandler);