const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/index');

/**
 * Валидация схем для разных типов запросов
 */
const validationSchemas = {
    // MVP генерация
    mvpGeneration: Joi.object({
        businessIdea: Joi.string()
            .min(10)
            .max(5000)
            .required()
            .label('Бизнес-идея')
            .messages({
                'string.min': 'Бизнес-идея должна содержать минимум 10 символов',
                'string.max': 'Бизнес-идея не должна превышать 5000 символов',
                'any.required': 'Бизнес-идея обязательна'
            }),
        requirements: Joi.string()
            .max(10000)
            .optional()
            .label('Требования'),
        options: Joi.object({
            businessType: Joi.string()
                .valid('saas', 'ecommerce', 'marketplace', 'mobile_app', 'fintech', 'healthtech', 'general')
                .optional(),
            detailed: Joi.boolean().optional(),
            includeAlgorithms: Joi.boolean().optional(),
            designStyle: Joi.string()
                .valid('modern', 'corporate', 'creative', 'minimal', 'luxury')
                .optional(),
            colorScheme: Joi.string()
                .pattern(/^#[0-9A-F]{6}$/i)
                .optional()
        }).optional()
    }),

    // Чат сообщение
    chatMessage: Joi.object({
        message: Joi.string()
            .min(1)
            .max(2000)
            .required()
            .label('Сообщение'),
        mode: Joi.string()
            .valid('hard_grill', 'investor_prep', 'pitch_practice', 'consultant')
            .optional(),
        businessType: Joi.string()
            .valid('saas', 'ecommerce', 'marketplace', 'service', 'mobile_app', 'physical_product')
            .optional(),
        context: Joi.string().max(1000).optional()
    }),

    // Анализ юнит-экономики
    unitEconomicsAnalysis: Joi.object({
        businessDescription: Joi.string()
            .min(20)
            .max(10000)
            .required()
            .label('Описание бизнеса'),
        businessType: Joi.string()
            .valid('saas', 'ecommerce', 'marketplace', 'service', 'mobile_app', 'physical_product')
            .optional(),
        customMetrics: Joi.array().items(
            Joi.object({
                name: Joi.string().required(),
                value: Joi.number().required(),
                unit: Joi.string().required()
            })
        ).optional(),
        assumptions: Joi.object().optional()
    }),

    // Создание проекта
    projectCreation: Joi.object({
        projectName: Joi.string()
            .min(3)
            .max(100)
            .required()
            .label('Название проекта'),
        workflowType: Joi.string()
            .valid('full_startup', 'mvp_only', 'investor_prep', 'market_research')
            .optional(),
        idea: Joi.string().max(5000).optional(),
        teamSize: Joi.number().integer().min(1).max(20).optional(),
        budget: Joi.number().min(0).optional()
    }),

    // Техническое задание
    techSpecGeneration: Joi.object({
        businessIdea: Joi.string()
            .min(20)
            .max(5000)
            .required()
            .label('Бизнес-идея'),
        scope: Joi.string()
            .valid('mvp', 'full', 'enterprise')
            .optional(),
        technologies: Joi.array().items(Joi.string()).optional(),
        teamSize: Joi.number().integer().min(1).optional(),
        timelineWeeks: Joi.number().integer().min(1).max(104).optional()
    }),

    // Юридические документы
    legalDocuments: Joi.object({
        businessIdea: Joi.string()
            .min(20)
            .max(5000)
            .required()
            .label('Бизнес-идея'),
        countries: Joi.array()
            .items(Joi.string().valid('russia', 'usa', 'uk', 'eu', 'singapore'))
            .min(1)
            .required()
            .label('Страны'),
        documentTypes: Joi.array()
            .items(Joi.string().valid('nda', 'incorporation', 'employment', 'terms', 'privacy'))
            .min(1)
            .required(),
        companyName: Joi.string().max(100).optional(),
        founders: Joi.array().items(Joi.string()).optional()
    }),

    // Pitch Deck
    pitchDeck: Joi.object({
        businessIdea: Joi.string()
            .min(20)
            .max(5000)
            .required()
            .label('Бизнес-идея'),
        templateType: Joi.string()
            .valid('pitch_deck_10', 'pitch_deck_15', 'invest_deck_full')
            .optional(),
        includeFinancials: Joi.boolean().optional(),
        targetAudience: Joi.string().max(200).optional(),
        investmentAsk: Joi.number().min(0).optional()
    }),

    // Идеи
    ideas: Joi.object({
        skills: Joi.string().max(500).optional(),
        interests: Joi.array().items(Joi.string()).optional(),
        investment: Joi.string()
            .valid('low', 'medium', 'high', 'very_high', 'enterprise')
            .optional(),
        time: Joi.string()
            .valid('part_time', 'half_time', 'full_time', 'intensive')
            .optional(),
        risk: Joi.string()
            .valid('low', 'medium', 'high')
            .optional(),
        market: Joi.string()
            .valid('b2b', 'b2c', 'b2b2c', 'c2c')
            .optional(),
        location: Joi.string()
            .valid('local', 'national', 'international')
            .optional()
    })
};

/**
 * Middleware для валидации запросов
 */
exports.validateRequest = (schemaName) => {
    return (req, res, next) => {
        const schema = validationSchemas[schemaName];
        
        if (!schema) {
            return res.status(500).json({
                success: false,
                error: `Схема валидации ${schemaName} не найдена`
            });
        }

        // Объединяем body, query и params для валидации
        const dataToValidate = {
            ...req.body,
            ...req.query,
            ...req.params
        };

        const { error, value } = schema.validate(dataToValidate, {
            abortEarly: false,
            stripUnknown: true,
            allowUnknown: false
        });

        if (error) {
            const validationErrors = error.details.map(detail => ({
                field: detail.context.label || detail.path.join('.'),
                message: detail.message.replace(/"/g, ''),
                type: detail.type
            }));

            return res.status(400).json({
                success: false,
                error: 'Ошибка валидации',
                validationErrors: validationErrors,
                details: validationErrors.map(e => e.message)
            });
        }

        // Заменяем исходные данные валидированными
        req.validatedData = value;
        next();
    };
};

/**
 * Валидация файлов
 */
exports.validateFile = (options = {}) => {
    const {
        allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
        maxSize = 10 * 1024 * 1024, // 10MB
        maxFiles = 5
    } = options;

    return (req, res, next) => {
        if (!req.files || Object.keys(req.files).length === 0) {
            return next();
        }

        const files = Array.isArray(req.files) 
            ? req.files 
            : Object.values(req.files).flat();

        if (files.length > maxFiles) {
            return res.status(400).json({
                success: false,
                error: `Превышено максимальное количество файлов: ${maxFiles}`,
                maxFiles: maxFiles,
                received: files.length
            });
        }

        const invalidFiles = [];

        for (const file of files) {
            // Проверка типа файла
            if (!allowedTypes.includes(file.mimetype)) {
                invalidFiles.push({
                    name: file.name,
                    error: `Недопустимый тип файла: ${file.mimetype}`,
                    allowedTypes: allowedTypes
                });
                continue;
            }

            // Проверка размера файла
            if (file.size > maxSize) {
                invalidFiles.push({
                    name: file.name,
                    error: `Размер файла превышает ${maxSize / (1024 * 1024)}MB`,
                    maxSize: maxSize,
                    actualSize: file.size
                });
                continue;
            }

            // Проверка на вирусы (базовая)
            const dangerousExtensions = ['.exe', '.bat', '.sh', '.js', '.vbs'];
            const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
            
            if (dangerousExtensions.includes(fileExtension)) {
                invalidFiles.push({
                    name: file.name,
                    error: 'Файл имеет потенциально опасное расширение',
                    extension: fileExtension
                });
            }
        }

        if (invalidFiles.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Обнаружены невалидные файлы',
                invalidFiles: invalidFiles
            });
        }

        req.validatedFiles = files;
        next();
    };
};

/**
 * Валидация URL
 */
exports.validateUrl = (url) => {
    try {
        const urlObj = new URL(url);
        
        // Проверяем разрешенные протоколы
        const allowedProtocols = ['http:', 'https:'];
        if (!allowedProtocols.includes(urlObj.protocol)) {
            return {
                valid: false,
                error: 'Недопустимый протокол'
            };
        }

        // Проверяем домен
        const domain = urlObj.hostname;
        const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
        
        if (!domainRegex.test(domain)) {
            return {
                valid: false,
                error: 'Недопустимый домен'
            };
        }

        // Проверяем на фишинговые домены
        const phishingKeywords = ['login', 'secure', 'account', 'bank', 'paypal'];
        const lowerDomain = domain.toLowerCase();
        
        for (const keyword of phishingKeywords) {
            if (lowerDomain.includes(keyword) && domain.includes('-')) {
                return {
                    valid: false,
                    error: 'Подозрительный домен'
                };
            }
        }

        return {
            valid: true,
            url: urlObj.toString(),
            domain: domain,
            protocol: urlObj.protocol
        };
    } catch (error) {
        return {
            valid: false,
            error: 'Некорректный URL'
        };
    }
};

/**
 * Санитизация ввода пользователя
 */
exports.sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;

    // Удаляем опасные HTML теги
    let sanitized = input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
        .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');

    // Заменяем HTML теги на безопасные аналоги
    sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');

    // Удаляем опасные JavaScript события
    sanitized = sanitized.replace(/\bon\w+\s*=/gi, 'data-on=');

    return sanitized;
};

/**
 * Валидация бизнес-метрик
 */
exports.validateBusinessMetrics = (metrics) => {
    const errors = [];
    const warnings = [];

    // Проверка финансовых метрик
    if (metrics.revenue) {
        if (metrics.revenue < 0) {
            errors.push('Выручка не может быть отрицательной');
        }
        if (metrics.revenue > 1000000000000) { // 1 триллион
            warnings.push('Выручка выглядит нереалистично высокой');
        }
    }

    if (metrics.cac) {
        if (metrics.cac <= 0) {
            errors.push('CAC должен быть положительным числом');
        }
        if (metrics.cac > 10000) {
            warnings.push('CAC слишком высокий для большинства бизнесов');
        }
    }

    if (metrics.ltv) {
        if (metrics.ltv <= 0) {
            errors.push('LTV должен быть положительным числом');
        }
    }

    if (metrics.cac && metrics.ltv) {
        const ratio = metrics.ltv / metrics.cac;
        
        if (ratio < 1) {
            errors.push('LTV:CAC ratio < 1 означает потерю денег на каждом клиенте');
        } else if (ratio < 3) {
            warnings.push('LTV:CAC ratio < 3 считается низким для SaaS бизнеса');
        }
    }

    if (metrics.churnRate) {
        if (metrics.churnRate < 0 || metrics.churnRate > 100) {
            errors.push('Churn rate должен быть в диапазоне 0-100%');
        }
        if (metrics.churnRate > 30) {
            warnings.push('Churn rate > 30% считается очень высоким');
        }
    }

    if (metrics.growthRate) {
        if (metrics.growthRate > 500) {
            warnings.push('Рост > 500% в месяц выглядит нереалистично');
        }
    }

    return {
        valid: errors.length === 0,
        errors: errors,
        warnings: warnings
    };
};

/**
 * Генерация уникального ID для валидации
 */
exports.generateValidationId = () => {
    return `val_${uuidv4()}_${Date.now()}`;
};