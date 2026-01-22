const jwt = require('jsonwebtoken');
const { supabase } = require('../config/database');
const config = require('../config/index');

/**
 * Middleware для проверки JWT токена
 */
exports.authenticateJWT = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                error: 'Требуется авторизация'
            });
        }

        const token = authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Токен не предоставлен'
            });
        }

        const decoded = jwt.verify(token, config.security.jwtSecret);
        req.user = decoded;
        
        // Проверяем существование пользователя в базе данных
        if (supabase) {
            const { data: user, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', decoded.userId)
                .single();

            if (error || !user) {
                return res.status(401).json({
                    success: false,
                    error: 'Пользователь не найден'
                });
            }

            req.user = { ...req.user, ...user };
        }

        next();
    } catch (error) {
        console.error('Ошибка аутентификации:', error.message);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Токен истек',
                code: 'TOKEN_EXPIRED'
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Неверный токен',
                code: 'INVALID_TOKEN'
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Ошибка аутентификации'
        });
    }
};

/**
 * Middleware для проверки ролей пользователя
 */
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Требуется авторизация'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'Недостаточно прав',
                requiredRoles: roles,
                userRole: req.user.role
            });
        }

        next();
    };
};

/**
 * Middleware для защиты API ключом
 */
exports.apiKeyAuth = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    
    if (!apiKey) {
        return res.status(401).json({
            success: false,
            error: 'API ключ не предоставлен'
        });
    }

    const validApiKeys = config.security.apiKeys || [];
    
    if (!validApiKeys.includes(apiKey)) {
        return res.status(403).json({
            success: false,
            error: 'Неверный API ключ'
        });
    }

    next();
};

/**
 * Middleware для проверки лимитов пользователя
 */
exports.checkUserLimits = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return next(); // Пропускаем для неавторизованных пользователей
        }

        // Получаем лимиты пользователя
        const userLimits = await getUserLimits(req.user.id);
        
        // Проверяем лимиты для текущего эндпоинта
        const endpoint = req.path;
        const method = req.method;
        
        const rateLimit = await checkRateLimit(req.user.id, endpoint, method);
        
        if (rateLimit.exceeded) {
            return res.status(429).json({
                success: false,
                error: 'Превышен лимит запросов',
                limit: rateLimit.limit,
                remaining: rateLimit.remaining,
                resetTime: rateLimit.resetTime
            });
        }

        req.userLimits = userLimits;
        next();
    } catch (error) {
        console.error('Ошибка проверки лимитов:', error);
        next(); // Пропускаем в случае ошибки
    }
};

/**
 * Генерация токена доступа
 */
exports.generateAccessToken = (user) => {
    return jwt.sign(
        {
            userId: user.id,
            email: user.email,
            role: user.role || 'user'
        },
        config.security.jwtSecret,
        { expiresIn: config.security.jwtExpiresIn || '24h' }
    );
};

/**
 * Генерация refresh токена
 */
exports.generateRefreshToken = (user) => {
    return jwt.sign(
        {
            userId: user.id,
            tokenVersion: user.tokenVersion || 0
        },
        config.security.jwtRefreshSecret,
        { expiresIn: config.security.jwtRefreshExpiresIn || '7d' }
    );
};

/**
 * Вспомогательные функции
 */
async function getUserLimits(userId) {
    try {
        if (supabase) {
            const { data, error } = await supabase
                .from('user_limits')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) {
                console.error('Ошибка получения лимитов:', error);
                return getDefaultLimits();
            }

            return data || getDefaultLimits();
        }
    } catch (error) {
        console.error('Ошибка получения лимитов:', error);
    }

    return getDefaultLimits();
}

function getDefaultLimits() {
    return {
        mvp_generations: 10,
        chat_messages: 100,
        document_generations: 5,
        api_requests: 1000
    };
}

const rateLimitStore = new Map();

async function checkRateLimit(userId, endpoint, method) {
    const key = `${userId}:${endpoint}:${method}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 минута
    const limit = 60; // 60 запросов в минуту

    if (!rateLimitStore.has(key)) {
        rateLimitStore.set(key, {
            count: 0,
            resetTime: now + windowMs
        });
    }

    const record = rateLimitStore.get(key);

    // Сбрасываем счетчик если время истекло
    if (now > record.resetTime) {
        record.count = 0;
        record.resetTime = now + windowMs;
    }

    record.count++;

    return {
        exceeded: record.count > limit,
        limit: limit,
        remaining: Math.max(0, limit - record.count),
        resetTime: record.resetTime
    };
}