const path = require('path');
const fs = require('fs-extra');
const dotenv = require('dotenv');
// ============================================
// ЗАГРУЗКА ПЕРЕМЕННЫХ ОКРУЖЕНИЯ
// ============================================

function loadEnvVariables() {
    const possiblePaths = [
        path.join(__dirname, '.env'),
        path.join(process.cwd(), '.env'),
        path.join(__dirname, '..', '.env'),
        path.join(__dirname, '..', '..', '.env')
    ];
    
    let envLoaded = false;
    let loadedPath = '';
    
    for (const envPath of possiblePaths) {
        console.log(`🔍 Проверяю .env по пути: ${envPath}`);
        
        if (fs.existsSync(envPath)) {
            try {
                const envConfig = dotenv.config({ path: envPath });
                
                if (envConfig.error) {
                    console.error(`❌ Ошибка загрузки .env из ${envPath}:`, envConfig.error);
                } else {
                    console.log(`✅ .env файл загружен из: ${envPath}`);
                    envLoaded = true;
                    loadedPath = envPath;
                    checkRequiredEnvVars();
                    break;
                }
            } catch (error) {
                console.error(`❌ Ошибка чтения .env файла по пути ${envPath}:`, error.message);
            }
        }
    }
    
    if (!envLoaded) {
        console.warn('⚠️  Файл .env не найден. Используются значения по умолчанию или переменные окружения системы.');
    }
    
    return { envLoaded, loadedPath };
}

function checkRequiredEnvVars() {
    const requiredVars = [
        'GIGACHAT_API_KEY',
        'SUPABASE_URL', 
        'SUPABASE_ANON_KEY',
        'JWT_SECRET'
    ];
    
    const missingVars = [];
    
    console.log('🔑 Проверка переменных окружения:');
    
    requiredVars.forEach(varName => {
        const value = process.env[varName];
        
        if (!value) {
            missingVars.push(varName);
            console.log(`   ❌ ${varName}: НЕ НАЙДЕН`);
        } else {
            const maskedValue = varName.includes('KEY') || varName.includes('SECRET')
                ? '***' + value.slice(-8)
                : value.substring(0, 50) + (value.length > 50 ? '...' : '');
            console.log(`   ✅ ${varName}: ${maskedValue}`);
        }
    });
    
    if (missingVars.length > 0) {
        console.warn(`\n⚠️  ВНИМАНИЕ: Некоторые обязательные переменные не найдены: ${missingVars.join(', ')}`);
    }
    
    return { missingVars };
}

const { envLoaded, loadedPath } = loadEnvVariables();

// ============================================
// ПОДКЛЮЧЕНИЕ БИБЛИОТЕК
// ============================================

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const https = require('https');
const { v4: uuidv4 } = require('uuid');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const PptxGenJS = require('pptxgenjs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// ИНИЦИАЛИЗАЦИЯ SUPABASE SERVICE
// ============================================

const supabaseService = require('./supabase-service');

async function initializeSupabase() {
    try {
        const connected = await supabaseService.initialize();
        if (connected) {
            console.log('✅ SupabaseService успешно инициализирован');
        } else {
            console.warn('⚠️  SupabaseService не подключен. Сервер будет работать в режиме "только AI"');
        }
        return connected;
    } catch (error) {
        console.error('❌ Критическая ошибка при инициализации SupabaseService:', error);
        return false;
    }
}

async function getSupabaseStatus() {
    return supabaseService.connected;
}

const supabaseInitPromise = initializeSupabase();

// ============================================
// ULTIMATE MVP GENERATOR (ИЗ SERVER 1)
// ============================================

const UltimateMVPGenerator = require('./ultimate-mvp-generator');
const ultimateMVPGenerator = new UltimateMVPGenerator();

// Проверка доступности GigaChat API
async function testGigaChatAvailability() {

// Проверка доступности GigaChat API
async function testGigaChatAvailability() {
    try {
        console.log('\n🔍 Проверка подключения к GigaChat API...');
        const token = await getGigaChatTokenReal();
        
        if (token === 'dummy-gigachat-token-for-testing-only') {
            console.log('⚠️  GigaChat API: Используется тестовый режим');
            console.log('   Для реального использования проверьте:');
            console.log('   1. Правильность GIGACHAT_API_KEY в .env файле');
            console.log('   2. Формат ключа: ClientID:ClientSecret в base64');
            console.log('   3. Доступность https://ngw.devices.sberbank.ru:9443');
        } else {
            console.log('✅ GigaChat API: Доступен и работает');
            
            // Тестовый вызов API
            try {
                const testResponse = await axios({
                    method: 'POST',
                    url: 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    data: {
                        model: 'GigaChat',
                        messages: [{ role: 'user', content: 'Тест' }],
                        temperature: 0.5,
                        max_tokens: 10
                    },
                    httpsAgent: httpsAgent,
timeout: 10000, // Timeout в миллисекундах
                });
                
                console.log('✅ GigaChat API вызов: Успешно');
            } catch (apiError) {
                console.warn('⚠️  GigaChat API вызов: Ошибка, но токен получен', apiError.message);
            }
        }
    } catch (error) {
        console.error('❌ GigaChat API проверка: Ошибка', error.message);
    }
}

// Вызываем проверку при запуске
setTimeout(() => {
    testGigaChatAvailability();
}, 2000);

// ============================================
// ПРАВИЛЬНАЯ ПРОВЕРКА ПЕРЕМЕННЫХ ОКРУЖЕНИЯ
// ============================================

console.log('\n🔧 ПРОВЕРКА РЕАЛЬНЫХ ПЕРЕМЕННЫХ ОКРУЖЕНИЯ:');

// Получаем реальные значения из .env
const realGigaChatKey = process.env.GIGACHAT_API_KEY;
const realSupabaseUrl = process.env.SUPABASE_URL;
const realSupabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const realSupabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('GIGACHAT_API_KEY присутствует:', !!realGigaChatKey);
if (realGigaChatKey) {
    console.log('Длина реального ключа:', realGigaChatKey.length);
    console.log('Первые 20 символов:', realGigaChatKey.substring(0, 20) + '...');
    
    // Проверяем формат base64
    const isBase64 = /^[A-Za-z0-9+/]+=*$/.test(realGigaChatKey);
    console.log('Формат Base64:', isBase64 ? '✅' : '❌');
    
    // Декодируем для проверки структуры (ClientID:ClientSecret)
    try {
        const decoded = Buffer.from(realGigaChatKey, 'base64').toString('utf-8');
        console.log('Декодированный ключ:', decoded.substring(0, 50) + '...');
        
        if (decoded.includes(':')) {
            const parts = decoded.split(':');
            console.log(`✅ Формат правильный: ClientID:${parts[0].substring(0, 8)}...:ClientSecret:${parts[1].substring(0, 8)}...`);
        } else {
            console.log('❌ В декодированном ключе нет двоеточия!');
        }
    } catch (e) {
        console.log('❌ Не удалось декодировать base64:', e.message);
    }
}

console.log('\n🔗 ПРОВЕРКА SUPABASE:');
console.log('SUPABASE_URL:', realSupabaseUrl ? '✅ Найден' : '❌ Не найден');
console.log('SUPABASE_ANON_KEY:', realSupabaseAnonKey ? '✅ Найден' : '❌ Не найден');
console.log('SUPABASE_SERVICE_ROLE_KEY:', realSupabaseServiceKey ? '✅ Найден' : '❌ Не найден');

// КРИТИЧЕСКАЯ ПРОВЕРКА - не перезаписываем!
if (!realGigaChatKey) {
    console.error('❌❌❌ КРИТИЧЕСКАЯ ОШИБКА: GIGACHAT_API_KEY не найден в .env файле!');
    console.error('Убедитесь, что в .env файле есть строка:');
    console.error('GIGACHAT_API_KEY=ваш_реальный_ключ_base64');
    process.exit(1);
}

if (!realSupabaseUrl || !realSupabaseAnonKey) {
    console.warn('⚠️  Supabase ключи не найдены. Функции базы данных будут недоступны.');
}

// ============================================
// КОНФИГУРАЦИЯ СЕРВЕРА
// ============================================

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:5000', 
             'http://localhost:5500', 'http://localhost:8080', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 100, // 100 запросов с одного IP
    message: { success: false, error: 'Слишком много запросов с этого IP, попробуйте позже.' }
});
app.use('/api/', apiLimiter);

// Создаем папки
const folders = ['public', 'generated', 'data', 'exports', 'uploads', 'temp'];
folders.forEach(folder => {
    const folderPath = path.join(__dirname, folder);
    if (!fs.existsSync(folderPath)) {
        fs.ensureDirSync(folderPath);
        console.log(`📁 Создана папка: ${folder}`);
    }
});

app.use(express.static('public'));
app.use('/generated', express.static('generated'));

// Middleware для логирования
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path} - IP: ${req.ip}`);
    next();
});

// HTTPS агент для GigaChat
const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
    keepAlive: true
});

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const JWT_SECRET = process.env.JWT_SECRET || 'strategix-ai-secret-key-pro-version-2025';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'strategix-ai-refresh-secret-2025';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';


// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

function getFeaturesBySubscription(subscription) {
    const baseFeatures = {
        ai_chat: true,
        idea_generator: true,
        unit_master: true,
        document_generator: true,
        export: true,
        validation: true
    };
    
    const features = {
        free: {
            ...baseFeatures,
            ai_chat_limits: { monthly: 50, daily: 10 },
            document_limits: { monthly: 10 },
            export_formats: ['txt', 'json'],
            team_members: 1,
            storage_mb: 100,
            priority_support: false,
            api_access: false,
            legal_documents: false,
            advanced_analytics: false
        },
        pro: {
            ...baseFeatures,
            ai_chat_limits: { monthly: 1000, daily: 100 },
            document_limits: { monthly: 100 },
            export_formats: ['txt', 'json', 'pdf', 'excel'],
            team_members: 3,
            storage_mb: 1000,
            priority_support: true,
            api_access: true,
            legal_documents: true,
            advanced_analytics: true
        },
        enterprise: {
            ...baseFeatures,
            ai_chat_limits: { monthly: 10000, daily: 500 },
            document_limits: { monthly: 1000 },
            export_formats: ['txt', 'json', 'pdf', 'excel', 'pptx', 'html'],
            team_members: 50,
            storage_mb: 10000,
            priority_support: true,
            api_access: true,
            legal_documents: true,
            advanced_analytics: true,
            custom_branding: true,
            sso: true,
            dedicated_support: true
        }
    };
    
    return features[subscription] || features.free;
}

// ============================================
// GIGACHAT API СЕРВИС - РЕАЛЬНЫЕ ВЫЗОВЫ
// ============================================

async function getGigaChatTokenReal() {
    try {
        // БЕРЁМ РЕАЛЬНЫЙ ключ из переменных окружения
        const GIGACHAT_CREDENTIALS = process.env.GIGACHAT_API_KEY;
        
        if (!GIGACHAT_CREDENTIALS) {
            console.error('❌ GIGACHAT_API_KEY не найден в переменных окружения!');
            throw new Error('GIGACHAT_API_KEY не найден');
        }
        
        console.log('🔑 Получение токена GigaChat...');
        console.log(`📊 Длина ключа: ${GIGACHAT_CREDENTIALS.length}`);
        console.log(`🔑 Base64 ключ: ${GIGACHAT_CREDENTIALS.substring(0, 50)}...`);
        
        // Декодируем для проверки
        try {
            const decoded = Buffer.from(GIGACHAT_CREDENTIALS, 'base64').toString('utf-8');
            console.log(`📊 Декодированный ключ: ${decoded.substring(0, 50)}...`);
        } catch (e) {
            console.log('❌ Не удалось декодировать base64');
        }
        
        const RqUID = uuidv4();
        const url = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
        
        console.log(`🔄 Подключение к: ${url}`);
        console.log(`📊 RqUID: ${RqUID}`);
        
        // 🔴 ВАЖНО: Попробуем разные форматы запроса
        const response = await axios({
            method: 'post',
            url: url,
            data: 'scope=GIGACHAT_API_PERS',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'Authorization': `Basic ${GIGACHAT_CREDENTIALS}`,
                'RqUID': RqUID
            },
            httpsAgent: new https.Agent({
                rejectUnauthorized: false,
                keepAlive: true,
                timeout: 30000
            }),
            timeout: 40000,
            validateStatus: (status) => {
                console.log(`📊 Статус получения токена: ${status}`);
                return true; // Принимаем все статусы для диагностики
            }
        });
        
        console.log(`📊 Статус ответа: ${response.status}`);
        console.log(`📊 Ответ сервера: ${JSON.stringify(response.data, null, 2)}`);
        
        if (response.status === 200 && response.data?.access_token) {
            console.log('✅ Токен GigaChat успешно получен!');
            console.log(`📏 Длина токена: ${response.data.access_token.length} символов`);
            console.log(`⏱ Истекает: ${new Date(response.data.expires_at).toLocaleString()}`);
            return response.data.access_token;
        } else if (response.status === 401) {
            console.error('❌ Ошибка 401: Неверные учетные данные GigaChat API');
            console.error('Проверьте Client ID и Client Secret в .env файле');
            throw new Error('Неверные учетные данные GigaChat API (401)');
        } else if (response.status === 402) {
            console.error('❌ Ошибка 402: Требуется оплата/активация подписки');
            console.error('Проверьте в кабинете Sber:');
            console.error('1. Scope должен быть GIGACHAT_API_PERS');
            console.error('2. Продукт должен быть активен (не архивный)');
            console.error('3. Проверьте баланс токенов');
            
            // 🔴 ПРОБУЕМ АЛЬТЕРНАТИВНЫЙ SCOPE
            console.log('🔄 Пробуем с альтернативным scope...');
            
            try {
                const altResponse = await axios({
                    method: 'post',
                    url: url,
                    data: 'scope=GIGACHAT_API_CORP', // Альтернативный scope
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json',
                        'Authorization': `Basic ${GIGACHAT_CREDENTIALS}`,
                        'RqUID': uuidv4()
                    },
                    httpsAgent: new https.Agent({
                        rejectUnauthorized: false,
                        keepAlive: true
                    }),
timeout: 30000,
                });
                    validateStatus: () => true
                });
                
                if (altResponse.status === 200 && altResponse.data?.access_token) {
                    console.log('✅ Токен получен с scope=GIGACHAT_API_CORP');
                    return altResponse.data.access_token;
                }
            } catch (altError) {
                console.log('Альтернативный scope тоже не сработал');
            }
            
            throw new Error('Требуется активация подписки GigaChat (402)');
        } else {
            console.error('❌ Неожиданный ответ от GigaChat API:', response.status);
            console.error('Ответ:', response.data);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
    } catch (error) {
        console.error('❌ Критическая ошибка при получении токена GigaChat:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            throw new Error('Не удалось подключиться к серверу GigaChat. Проверьте интернет.');
        }
        
        if (error.code === 'ETIMEDOUT') {
            throw new Error('Таймаут подключения к GigaChat. Сервер не отвечает.');
        }
        
        // 🔴 ВОЗВРАЩАЕМ ТЕСТОВЫЙ ТОКЕН ДЛЯ РАЗРАБОТКИ
        console.log('⚠️  Использую тестовый токен для разработки');
        return 'dummy-gigachat-token-for-testing-only-' + uuidv4();
    }
}

async function callGigaChatAPI(messages, temperature = 0.7, max_tokens = 2000) {
    try {
        console.log('🤖 Вызов GigaChat API с реальным ключом...');
        
        const token = await getGigaChatTokenReal();
        
        console.log(`📊 Используется реальный токен, первые 20 символов: ${token.substring(0, 20)}...`);
        
        // 🔴 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Правильные параметры для GigaChat API
        const response = await axios({
            method: 'POST',
            url: 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                'X-Request-ID': uuidv4() // 🔴 ДОБАВЛЕНО: Обязательный заголовок
            },
            data: {
                model: 'GigaChat', // 🔴 ТОЧНО ТАК как в документации
                messages: messages,
                temperature: Math.max(0.1, Math.min(temperature, 1.0)), // 🔴 Ограничение 0.1-1.0
                max_tokens: Math.min(max_tokens, 4000), // 🔴 Ограничение 4000 токенов
                stream: false,
                repetition_penalty: 1.0, // 🔴 ОБЯЗАТЕЛЬНЫЙ параметр для GigaChat
                update_interval: 0 // 🔴 ДОБАВЛЕНО
            },
            httpsAgent: new https.Agent({
                rejectUnauthorized: false,
                keepAlive: true,
                timeout: 45000
            }),
            timeout: 50000, // 🔴 УВЕЛИЧЕНО
            validateStatus: function (status) {
                return status < 500; // 🔴 Принимаем все статусы кроме 5xx
            }
        });
        
        console.log(`📊 Статус GigaChat API: ${response.status}`);
        
        // 🔴 ПРАВИЛЬНАЯ проверка ответа
        if (response.status === 200 && response.data?.choices?.[0]?.message?.content) {
            console.log('✅ GigaChat ответ получен успешно!');
            console.log(`📏 Длина ответа: ${response.data.choices[0].message.content.length} символов`);
            return response.data.choices[0].message.content;
        } 
        // 🔴 Обработка ошибки 402 с ДЕТАЛЯМИ
        else if (response.status === 402) {
            console.error('❌ ОШИБКА 402 ДЕТАЛИ:', JSON.stringify(response.data, null, 2));
            console.error('🔴 Заголовки ответа:', JSON.stringify(response.headers, null, 2));
            
            // 🔴 Анализируем ошибку
            let errorMsg = 'Ошибка доступа GigaChat (402 Payment Required)';
            if (response.data?.error) {
                errorMsg += `: ${response.data.error}`;
            }
            if (response.data?.message) {
                errorMsg += ` - ${response.data.message}`;
            }
            
            throw new Error(errorMsg);
        }
        else {
            console.error('❌ Неожиданный ответ от GigaChat API:');
            console.error('Статус:', response.status);
            console.error('Данные:', JSON.stringify(response.data, null, 2));
            console.error('Заголовки:', JSON.stringify(response.headers, null, 2));
            
            throw new Error(`GigaChat API вернул статус ${response.status}: ${JSON.stringify(response.data)}`);
        }
        
    } catch (error) {
        console.error('❌ Ошибка вызова GigaChat API:');
        
        // 🔴 ДЕТАЛЬНАЯ ОБРАБОТКА ОШИБОК
        if (error.response) {
            console.error('📊 Статус ошибки:', error.response.status);
            console.error('📊 Данные ошибки:', JSON.stringify(error.response.data, null, 2));
            console.error('📊 Заголовки ошибки:', JSON.stringify(error.response.headers, null, 2));
            
            if (error.response.status === 402) {
                const errorDetail = error.response.data || {};
                console.error('🔥 КРИТИЧЕСКАЯ ОШИБКА 402 - Проверьте:');
                console.error('1. Scope в кабинете Sber: должен быть GIGACHAT_API_PERS');
                console.error('2. Модель в запросе: должна быть "GigaChat"');
                console.error('3. Лимит токенов: у вас есть 1M токенов до 2027');
                console.error('4. Активация продукта: проверьте что продукт АКТИВЕН');
                
                throw new Error(`GigaChat API 402: ${JSON.stringify(errorDetail)}`);
            }
        } else if (error.request) {
            console.error('❌ Нет ответа от сервера GigaChat');
            console.error('Проверьте подключение к интернету');
            throw new Error('Нет ответа от сервера GigaChat. Проверьте интернет.');
        } else {
            console.error('❌ Ошибка настройки запроса:', error.message);
            throw error;
        }
        
        throw new Error(`GigaChat API ошибка: ${error.message}`);
    }
}

// ============================================
// РАСШИРЕННЫЙ КЛАСС SMART HEURISTIC VALIDATOR
// ============================================

class EnhancedHeuristicValidator {
    constructor() {
        this.industryBenchmarks = {
            'saas': {
                min_mrr_growth: 0.05,
                max_churn: 0.10,
                ltv_cac_ratio: 3.0,
                cac_payback: 12,
                gross_margin_min: 0.70,
                typical_cac_range: [100, 5000],
                typical_ltv_range: [300, 50000]
            },
            'ecommerce': {
                min_mrr_growth: 0.10,
                max_churn: 0.15,
                ltv_cac_ratio: 2.5,
                cac_payback: 6,
                gross_margin_min: 0.40,
                typical_cac_range: [10, 200],
                typical_ltv_range: [50, 500]
            },
            'marketplace': {
                min_mrr_growth: 0.15,
                max_churn: 0.20,
                ltv_cac_ratio: 2.0,
                cac_payback: 9,
                gross_margin_min: 0.60,
                typical_cac_range: [50, 500],
                typical_ltv_range: [100, 2000]
            },
            'service': {
                min_mrr_growth: 0.08,
                max_churn: 0.25,
                ltv_cac_ratio: 2.0,
                cac_payback: 8,
                gross_margin_min: 0.50,
                typical_cac_range: [100, 1000],
                typical_ltv_range: [500, 10000]
            },
            'mobile_app': {
                min_mrr_growth: 0.20,
                max_churn: 0.30,
                ltv_cac_ratio: 2.0,
                cac_payback: 10,
                gross_margin_min: 0.80,
                typical_cac_range: [1, 50],
                typical_ltv_range: [10, 200]
            },
            'physical_product': {
                min_mrr_growth: 0.12,
                max_churn: 0.20,
                ltv_cac_ratio: 2.5,
                cac_payback: 7,
                gross_margin_min: 0.40,
                typical_cac_range: [50, 500],
                typical_ltv_range: [100, 5000]
            }
        };
        
        this.financialPatterns = {
            revenue: /(?:выручк|доход|revenue).*?(\d+[\.,]?\d*(?:[КМ]|тыс|млн|млрд)?)/gi,
            expenses: /(?:расход|затрат|expense).*?(\d+[\.,]?\d*(?:[КМ]|тыс|млн|млрд)?)/gi,
            profit: /(?:прибыл|profit).*?(\d+[\.,]?\d*(?:[КМ]|тыс|млн|млрд)?)/gi,
            growth: /(?:рост|growth|увеличен).*?(\d+[\.,]?\d*%?)/gi,
            margin: /(?:маржа|margin).*?(\d+[\.,]?\d*%?)/gi,
            investment: /(?:инвестиц|investment).*?(\d+[\.,]?\d*(?:[КМ]|тыс|млн|млрд)?)/gi,
            roi: /(?:roi|окупаемость|return).*?(\d+[\.,]?\d*%?)/gi,
            cac: /(?:cac|стоимость привлечени).*?(\d+[\.,]?\d*(?:[КМ]|тыс|млн|млрд)?)/gi,
            ltv: /(?:ltv|lifetime value).*?(\d+[\.,]?\d*(?:[КМ]|тыс|млн|млрд)?)/gi,
            churn: /(?:churn|отток).*?(\d+[\.,]?\d*%?)/gi
        };

        this.impossibilityPatterns = {
            growth: /рост.*?(\d{3,})%/gi,
            margin: /маржа.*?(\d{3,})%/gi,
            roi: /roi.*?(\d{3,})%/gi,
            market_share: /доля рынка.*?(\d{3,})%/gi
        };
        
        this.referencePatterns = {
            sources: /(источник|source|ссылк|reference|отчет|report|research|исследовани)/gi,
            citations: /\[[\d]+\]|\([A-Za-z]+\s*\d{4}\)|https?:\/\/[^\s]+/gi
        };
    }

    extractMetrics(text) {
        const metrics = {
            revenue: [],
            expenses: [],
            profit: [],
            growth: [],
            margin: [],
            investment: [],
            roi: [],
            cac: [],
            ltv: [],
            churn: []
        };

        for (const [key, pattern] of Object.entries(this.financialPatterns)) {
            const matches = [...text.matchAll(pattern)];
            metrics[key] = matches.map(match => {
                let value = match[1];
                
                if (value) {
                    value = value.replace(',', '.');
                    
                    const suffixMultipliers = {
                        'К': 1000, 'k': 1000, 'тыс': 1000,
                        'М': 1000000, 'млн': 1000000,
                        'млрд': 1000000000, 'b': 1000000000
                    };
                    
                    for (const [suffix, multiplier] of Object.entries(suffixMultipliers)) {
                        if (value.toLowerCase().includes(suffix.toLowerCase())) {
                            const num = parseFloat(value.replace(/[^0-9.]/g, ''));
                            return !isNaN(num) ? num * multiplier : null;
                        }
                    }
                    
                    if (value.includes('%')) {
                        const num = parseFloat(value.replace('%', ''));
                        return !isNaN(num) ? num : null;
                    }
                    }
                    }
                    
                    const num = parseFloat(value);
                    return !isNaN(num) ? num : null;
                }
                return null;
            }).filter(val => val !== null);
        }

        return metrics;
    }

    parseFinancialNumber(text) {
        if (!text) return null;
        
        text = text.replace(',', '.');
        
        if (text.includes('%')) {
            const num = parseFloat(text.replace('%', ''));
            return !isNaN(num) ? num / 100 : null;
        }
        
        const multipliers = {
            'k': 1000, 'K': 1000, 'тыс': 1000,
            'м': 1000000, 'M': 1000000, 'млн': 1000000,
            'b': 1000000000, 'B': 1000000000, 'млрд': 1000000000
        };
        
        for (const [suffix, multiplier] of Object.entries(multipliers)) {
            if (text.toLowerCase().includes(suffix.toLowerCase())) {
                const num = parseFloat(text.replace(/[^0-9.]/g, ''));
                return !isNaN(num) ? num * multiplier : null;
            }
        }
        
        const num = parseFloat(text);
        return !isNaN(num) ? num : null;
    }

    validate(text, context = 'document', industry = 'general') {
        console.log(`🧠 Эвристическая проверка (${context}, ${industry})...`);
        
        const metrics = this.extractMetrics(text);
        const issues = [];
        const warnings = [];
        const recommendations = [];
        
        let confidenceScore = 100;
        const benchmarks = this.industryBenchmarks[industry] || this.industryBenchmarks['general'] || this.industryBenchmarks['saas'];
        
        const hasFinancialData = Object.values(metrics).some(arr => arr.length > 0);
        if (!hasFinancialData && context.includes('финанс')) {
            warnings.push('Не обнаружено явных финансовых показателей');
            confidenceScore -= 10;
        }
        
        if (metrics.cac.length > 0) {
            const cacValues = metrics.cac;
            const typicalRange = benchmarks.typical_cac_range;
            
            cacValues.forEach((cac, index) => {
                if (cac < typicalRange[0]) {
                    issues.push(`CAC (${cac}) слишком низкий для ${industry} бизнеса`);
                    confidenceScore -= 15;
                    recommendations.push(`Рекомендуемый CAC для ${industry}: ${typicalRange[0]}-${typicalRange[1]}`);
                } else if (cac > typicalRange[1]) {
                    warnings.push(`CAC (${cac}) высокий, проверьте расчеты`);
                    confidenceScore -= 5;
                }
            });
        }
        
        if (metrics.ltv.length > 0) {
            const ltvValues = metrics.ltv;
            const typicalRange = benchmarks.typical_ltv_range;
            
            ltvValues.forEach((ltv, index) => {
                if (ltv < typicalRange[0]) {
                    warnings.push(`LTV (${ltv}) низкий для ${industry}`);
                    confidenceScore -= 10;
                } else if (ltv > typicalRange[1]) {
                    warnings.push(`LTV (${ltv}) очень высокий, проверьте обоснование`);
                    confidenceScore -= 10;
                }
            });
        }
        
        if (metrics.growth.length > 0) {
            metrics.growth.forEach(growth => {
                if (growth > 200) {
                    issues.push(`Нереалистичный прогноз роста: ${growth}%`);
                    confidenceScore -= 25;
                    recommendations.push('Пересмотрите прогнозы роста, сделайте их более консервативными');
                } else if (growth > 100) {
                    warnings.push(`Агрессивный прогноз роста: ${growth}%`);
                    confidenceScore -= 15;
                } else if (growth < 5) {
                    warnings.push(`Консервативный прогноз роста: ${growth}%`);
                    confidenceScore -= 5;
                }
            });
        }
        
        if (metrics.margin.length > 0) {
            metrics.margin.forEach(margin => {
                if (margin > 90) {
                    issues.push(`Слишком высокая маржа: ${margin}% (проверьте расчеты)`);
                    confidenceScore -= 20;
                } else if (margin < 10) {
                    warnings.push(`Низкая маржа: ${margin}% (возможны проблемы с рентабельностью)`);
                    confidenceScore -= 15;
                }
            });
        }
        
        if (metrics.revenue.length > 0 && metrics.expenses.length > 0 && metrics.profit.length > 0) {
            for (let i = 0; i < Math.min(metrics.revenue.length, metrics.expenses.length, metrics.profit.length); i++) {
                const revenue = metrics.revenue[i];
                const expenses = metrics.expenses[i];
                const profit = metrics.profit[i];
                
                if (revenue && expenses && profit) {
                    const calculatedProfit = revenue - expenses;
                    const difference = Math.abs(calculatedProfit - profit);
                    const tolerance = revenue * 0.05;
                    
                    if (difference > tolerance) {
                        issues.push(`Несоответствие в расчетах прибыли (ожидалось: ${calculatedProfit}, указано: ${profit})`);
                        confidenceScore -= 20;
                        recommendations.push('Проверьте математические расчеты в финансовой модели');
                    }
                }
            }
        }
        
        if (metrics.roi.length > 0) {
            metrics.roi.forEach(roi => {
                if (roi > 500) {
                    issues.push(`Нереалистичный ROI: ${roi}%`);
                    confidenceScore -= 25;
                } else if (roi > 100) {
                    warnings.push(`Высокий ROI: ${roi}% (требует тщательного обоснования)`);
                    confidenceScore -= 10;
                }
            });
        }
        
        if (metrics.churn.length > 0) {
            metrics.churn.forEach(churn => {
                if (churn > 50) {
                    issues.push(`Критически высокий churn rate: ${churn}% (бизнес нежизнеспособен)`);
                    confidenceScore -= 30;
                } else if (churn > benchmarks.max_churn * 100) {
                    warnings.push(`Высокий churn rate: ${churn}% (максимум для ${industry}: ${benchmarks.max_churn * 100}%)`);
                    confidenceScore -= 15;
                }
            });
        }
        
        const lowerText = text.toLowerCase();
        const requiredElements = {
            'финансовые показатели': ['выручк', 'прибыл', 'расход', 'доход'],
            'анализ рынка': ['рынок', 'аудитор', 'конкурен', 'тренд'],
            'бизнес-модель': ['модель', 'монетизац', 'цена', 'стоимость'],
            'план развития': ['план', 'этап', 'шаг', 'роста', 'развити']
        };
        
        Object.entries(requiredElements).forEach(([element, keywords]) => {
            const hasElement = keywords.some(keyword => lowerText.includes(keyword));
            if (!hasElement) {
                warnings.push(`Возможно отсутствует раздел: ${element}`);
                confidenceScore -= 5;
            }
        });
        
        const hypeWords = ['уникальн', 'революцион', 'инновацион', 'прорыв', 'лучш', 'единствен'];
        const hypeCount = hypeWords.filter(word => lowerText.includes(word)).length;
        if (hypeCount > 5) {
            warnings.push('Слишком много маркетинговых утверждений без конкретных данных');
            confidenceScore -= 10;
            recommendations.push('Подтвердите утверждения конкретными цифрами и фактами');
        }
        
        confidenceScore = Math.max(0, confidenceScore);
        
        if (recommendations.length === 0) {
            if (confidenceScore < 70) {
                recommendations.push('Проверьте все числовые данные на реалистичность');
                recommendations.push('Убедитесь в логической связности документа');
                recommendations.push('Предоставьте обоснование для агрессивных прогнозов');
            } else {
                recommendations.push('Документ соответствует базовым требованиям');
                recommendations.push('Продолжайте мониторить ключевые метрики');
            }
        }
        
        return {
            verified: issues.length === 0,
            issues: issues,
            warnings: warnings,
            recommendations: recommendations,
            confidence_score: Math.round(confidenceScore),
            summary: issues.length === 0 ? 
                (warnings.length === 0 ? '✅ Документ соответствует базовым требованиям' : `⚠️ ${warnings.length} предупреждений`) : 
                `❌ ${issues.length} проблем, ${warnings.length} предупреждений`,
            metrics_found: Object.fromEntries(
                Object.entries(metrics)
                    .filter(([_, arr]) => arr.length > 0)
                    .map(([key, arr]) => [key, arr.slice(0, 3)])
            ),
            validation_type: 'heuristic',
            heuristic_version: '3.0',
            industry: industry
        };
    }
    
    advancedValidate(text, context, industry = 'general') {
        const basicResult = this.validate(text, context, industry);
        
        const advancedChecks = this.performAdvancedChecks(text, industry);
        const referenceCheck = this.checkReferences(text);
        const plausibilityCheck = this.checkPlausibility(text, industry);
        
        return {
            ...basicResult,
            advanced_checks: advancedChecks,
            reference_analysis: referenceCheck,
            plausibility_analysis: plausibilityCheck,
            overall_score: this.calculateOverallScore(basicResult, advancedChecks, referenceCheck, plausibilityCheck),
            validation_depth: 'advanced'
        };
    }
    
    performAdvancedChecks(text, industry) {
        const checks = [];
        
        for (const [patternName, pattern] of Object.entries(this.impossibilityPatterns)) {
            const matches = [...text.matchAll(pattern)];
            matches.forEach(match => {
                const value = parseFloat(match[1]);
                if (value > 100 && patternName !== 'growth') {
                    checks.push({
                        type: 'impossibility',
                        pattern: patternName,
                        value: value,
                        issue: `Невозможное значение ${patternName}: ${value}%`,
                        severity: 'critical'
                    });
                } else if (value > 1000) {
                    checks.push({
                        type: 'impossibility',
                        pattern: patternName,
                        value: value,
                        issue: `Нереалистичное значение ${patternName}: ${value}%`,
                        severity: 'high'
                    });
                }
            });
        }
        
        const financialTerms = this.extractFinancialTerms(text);
        const consistencyIssues = this.checkConsistency(financialTerms);
        checks.push(...consistencyIssues);
        
        const timelineCheck = this.checkTimelineConsistency(text);
        if (timelineCheck.issues.length > 0) {
            checks.push({
                type: 'timeline',
                issues: timelineCheck.issues,
                severity: timelineCheck.severity
            });
        }
        
        return checks;
    }
    
    checkReferences(text) {
        const hasSources = this.referencePatterns.sources.test(text);
        const hasCitations = this.referencePatterns.citations.test(text);
        const urls = (text.match(/https?:\/\/[^\s]+/g) || []).length;
        
        return {
            has_sources: hasSources,
            has_citations: hasCitations,
            url_count: urls,
            reference_score: (hasSources ? 30 : 0) + (hasCitations ? 30 : 0) + Math.min(urls * 10, 40),
            issues: !hasSources && !hasCitations ? ['Документ не содержит ссылок на источники'] : [],
            recommendations: urls < 3 ? ['Добавьте ссылки на проверенные источники данных'] : []
        };
    }
    
    checkPlausibility(text, industry) {
        const plausibilityChecks = [];
        
        const metricsSequence = this.extractMetricsSequence(text);
        if (metricsSequence.length > 1) {
            const sequenceCheck = this.validateMetricsSequence(metricsSequence);
            if (!sequenceCheck.valid) {
                plausibilityChecks.push({
                    type: 'sequence',
                    issue: 'Несогласованная последовательность метрик',
                    details: sequenceCheck.issues,
                    severity: 'medium'
                });
            }
        }
        
        const industryPatternMatch = this.checkIndustryPatterns(text, industry);
        if (!industryPatternMatch.matches) {
            plausibilityChecks.push({
                type: 'industry_pattern',
                issue: 'Документ не соответствует типичным паттернам отрасли',
                details: industryPatternMatch.missing_elements,
                severity: 'low'
            });
        }
        
        return {
            checks: plausibilityChecks,
            overall_plausible: plausibilityChecks.length === 0,
            plausibility_score: 100 - (plausibilityChecks.length * 20)
        };
    }
    
    extractFinancialTerms(text) {
        const terms = {};
        
        const patterns = {
            revenue: /(?:выручк|доход|revenue|income)/gi,
            expenses: /(?:расход|затрат|expense|cost)/gi,
            profit: /(?:прибыл|profit|net income)/gi,
            growth: /(?:рост|growth|увеличен)/gi,
            customers: /(?:клиент|customer|пользователь|user)/gi,
            market: /(?:рынок|market|индустр|industry)/gi
        };
        
        Object.entries(patterns).forEach(([term, pattern]) => {
            terms[term] = (text.match(pattern) || []).length;
        });
        
        return terms;
    }
    
    checkConsistency(terms) {
        const issues = [];
        
        if (terms.revenue > 0 && terms.expenses === 0 && terms.profit === 0) {
            issues.push({
                type: 'consistency',
                issue: 'Упоминается выручка, но не указаны расходы или прибыль',
                severity: 'medium'
            });
        }
        
        if (terms.growth > 3 && this.extractNumbers(text).length < 5) {
            issues.push({
                type: 'consistency',
                issue: 'Много упоминаний роста, но мало конкретных цифр',
                severity: 'medium'
            });
        }
        
        return issues;
    }
    
    extractNumbers(text) {
        return text.match(/\d+(?:,\d{3})*(?:\.\d+)?/g) || [];
    }
    
    checkTimelineConsistency(text) {
        const timelinePatterns = [
            /(\d+)\s*(мес|месяц|месяцев)/gi,
            /(\d+)\s*(квартал|кварталов)/gi,
            /(\d+)\s*(год|лет)/gi,
            /(\d{4})\s*год/gi
        ];
        
        const timelines = [];
        timelinePatterns.forEach(pattern => {
            const matches = [...text.matchAll(pattern)];
            matches.forEach(match => {
                timelines.push({
                    value: parseInt(match[1]),
                    unit: match[2],
                    context: match[0]
                });
            });
        });
        
        const issues = [];
        let severity = 'low';
        
        if (timelines.length > 1) {
            const sortedTimelines = [...timelines].sort((a, b) => {
                const aMonths = this.convertToMonths(a);
                const bMonths = this.convertToMonths(b);
                return aMonths - bMonths;
            });
            
            for (let i = 1; i < sortedTimelines.length; i++) {
                const prev = this.convertToMonths(sortedTimelines[i-1]);
                const current = this.convertToMonths(sortedTimelines[i]);
                
                if (current < prev) {
                    issues.push(`Нелогичная последовательность времени: ${sortedTimelines[i-1].context} → ${sortedTimelines[i].context}`);
                    severity = 'medium';
                }
            }
        }
        
        return { issues, severity, timeline_count: timelines.length };
    }
    
    convertToMonths(timeline) {
        const value = timeline.value;
        const unit = timeline.unit.toLowerCase();
        
        if (unit.includes('мес')) return value;
        if (unit.includes('кварт')) return value * 3;
        if (unit.includes('год') || unit.includes('лет')) return value * 12;
        return value;
    }
    
    extractMetricsSequence(text) {
        const sequences = [];
        const numberPattern = /\d+(?:,\d{3})*(?:\.\d+)?/g;
        let match;
        
        while ((match = numberPattern.exec(text)) !== null) {
            sequences.push({
                value: parseFloat(match[0].replace(',', '')),
                position: match.index,
                context: text.substring(Math.max(0, match.index - 30), Math.min(text.length, match.index + 30))
            });
        }
        
        return sequences;
    }
    
    validateMetricsSequence(sequence) {
        const issues = [];
        
        for (let i = 2; i < sequence.length; i++) {
            const growthRate = sequence[i].value / sequence[i-1].value;
            if (growthRate > 2.0 && growthRate < 0.5) {
                issues.push(`Резкое изменение между позициями ${i-1} и ${i}: ${sequence[i-1].value} → ${sequence[i].value}`);
            }
        }
        
        return {
            valid: issues.length === 0,
            issues: issues,
            sequence_length: sequence.length
        };
    }
    
    checkIndustryPatterns(text, industry) {
        const industryPatterns = {
            saas: ['mrr', 'arr', 'churn', 'ltv', 'cac', 'arpa'],
            ecommerce: ['aov', 'conversion rate', 'cac', 'ltv', 'cart abandonment'],
            marketplace: ['gmv', 'take rate', 'buyer/seller ratio', 'network effects']
        };
        
        const patterns = industryPatterns[industry] || industryPatterns.saas;
        const lowerText = text.toLowerCase();
        
        const matches = patterns.filter(pattern => 
            lowerText.includes(pattern.toLowerCase())
        );
        
        const missing = patterns.filter(pattern => 
            !lowerText.includes(pattern.toLowerCase())
        );
        
        const matchPercentage = (matches.length / patterns.length) * 100;
        
        return {
            matches: matches,
            missing: missing,
            match_percentage: matchPercentage,
            matches_well: matchPercentage >= 70
        };
    }
    
    calculateOverallScore(basicResult, advancedChecks, referenceCheck, plausibilityCheck) {
        let score = basicResult.confidence_score;
        
        const criticalIssues = advancedChecks.filter(c => c.severity === 'critical').length;
        const highIssues = advancedChecks.filter(c => c.severity === 'high').length;
        score -= criticalIssues * 25;
        score -= highIssues * 15;
        
        score += Math.min(referenceCheck.reference_score / 3, 20);
        
        score = (score + plausibilityCheck.plausibility_score) / 2;
        
        return Math.max(0, Math.min(100, Math.round(score)));
    }
    
    performAdditionalChecks(text, industry) {
        const checks = [];
        const lowerText = text.toLowerCase();
        
        const numbers = (text.match(/\d+/g) || []).length;
        checks.push({
            check: 'Количество числовых данных',
            passed: numbers >= 5,
            value: numbers,
            recommendation: numbers < 5 ? 'Добавьте больше конкретных цифр' : 'Достаточно числовых данных'
        });
        
        const hasTimeline = lowerText.includes('месяц') || lowerText.includes('год') || 
                          lowerText.includes('квартал') || /\d+\s*(мес|год|недел)/i.test(text);
        checks.push({
            check: 'Наличие временных рамок',
            passed: hasTimeline,
            recommendation: hasTimeline ? 'Временные рамки указаны' : 'Добавьте временные рамки для планов'
        });
        
        const hasRisks = lowerText.includes('риск') || lowerText.includes('угроза') || 
                        lowerText.includes('проблем') || lowerText.includes('сложность');
        checks.push({
            check: 'Анализ рисков',
            passed: hasRisks,
            recommendation: hasRisks ? 'Риски проанализированы' : 'Добавьте анализ рисков'
        });
        
        return checks;
    }
}

// ============================================
// УЛУЧШЕННЫЙ BUSINESSCHATEXPERT ДЛЯ ПОДГОТОВКИ К ИНВЕСТОРАМ
// ============================================

class InvestorPrepExpert {
    constructor() {
        this.investorQuestions = {
            standard_18: [
                "Что нового в том, что вы делаете? (Что делает ваш подход инновационным?)",
                "Чего больше всего хотят ваши пользователи? (Какая настоящая боль?)",
                "Как сейчас поступают ваши пользователи? (Какое текущее решение?)",
                "Что отличает вас от существующих вариантов? (Уникальное преимущество)",
                "Что заставит пользователя попробовать вами воспользоваться? (Момент активации)",
                "Что может отложить желание пользователя попробовать ваш сервис? (Барьеры)",
                "Сколько людей на вашем целевом рынке? (TAM/SAM/SOM)",
                "Кто ваши конкуренты? Кто может ими стать?",
                "Кого из конкурентов вы боитесь больше всего?",
                "Сколько пользователей у ваших конкурентов? Какая у них выручка?",
                "Сколько времени и денег потратят ваши пользователи, прежде чем переключатся на вас?",
                "Что вы сделали такого, чем вы можете нас впечатлить? (Тяга)",
                "Расскажите что-нибудь удивительное, что случилось в вашем стартапе? (Инсайты)",
                "Какую самую большую ошибку вы совершили? (Обучение)",
                "Какие у вас есть уникальные способности к тому, чем вы занимаетесь? (Суперсилы команды)",
                "Кто станет вашим следующим наемным сотрудником? (План роста)",
                "Что станет вашей самой большой проблемой через полгода? (Предвидение)",
                "Как вы станете миллиардной компанией? (Стратегия масштабирования)"
            ],
            hard: [
                "Почему именно сейчас? Почему не 2 года назад или 2 года спустя?",
                "Что случится, если мы вам не дадим денег?",
                "Какие 3 допущения в вашей модели самые рискованные?",
                "Какой самый быстрый способ убить ваш бизнес?",
                "Кто ваш идеальный инвестор и почему мы должны быть им?",
                "Что вы знаете о своем рынке, чего не знают другие?",
                "Как вы будете использовать наши деньги? По-доллару.",
                "Какой ваш план B, если это не сработает?",
                "Кого вы боитесь больше: существующих конкурентов или еще не появившихся?",
                "Что в вашей команде самое слабое место и как вы это исправите?"
            ]
        };
        
        this.pitchStructure = {
            classic_10: [
                "Title Slide (Название, команда, контакты)",
                "The Problem (Боль, размер, эмоции)",
                "The Solution (Как решаете, просто и понятно)",
                "Why Now? (Почему именно сейчас время)",
                "Market Size (TAM/SAM/SOM с источниками)",
                "Product (Демо, скриншоты, фичи)",
                "Business Model (Как зарабатываете, цены)",
                "Competition (Конкурентная карта, преимущества)",
                "Team (Опыт, почему именно вы)",
                "Traction (Метрики, рост, клиенты)",
                "Financials (Выручка, расходы, прогнозы)",
                "The Ask (Сколько, на что, оценка)"
            ],
            detailed_15: [
                "Vision (Куда движемся)",
                "Problem (Глубокая боль)",
                "Solution (Наше решение)",
                "Why Now (Тренды, изменения)",
                "Market Opportunity (TAM/SAM/SOM)",
                "Product Demo (Живая демонстрация)",
                "Technology (Технологическое преимущество)",
                "Business Model & Pricing",
                "Go-to-Market Strategy",
                "Competitive Landscape",
                "Team & Advisors",
                "Traction & Milestones",
                "Financial Projections",
                "Funding Needs & Use of Funds",
                "The Ask & Next Steps"
            ]
        };
    }
    
    async generateInvestorPrep(businessDescription, options = {}) {
        try {
            const { mode = 'comprehensive', includeValidation = true } = options;
            
            const prompt = `На основе описания бизнеса создай полную подготовку к встрече с инвесторами:

ОПИСАНИЕ БИЗНЕСА:
${businessDescription}

Создай следующие разделы:

1. ОТВЕТЫ НА 18 СТАНДАРТНЫХ ВОПРОСОВ ИНВЕСТОРОВ:
   - Для каждого вопроса дай 2-3 варианта ответа (короткий, подробный, с данными)
   - Укажи какие метрики и данные нужно подготовить
   - Добавь советы по подаче

2. СТРУКТУРА PITCH DECK (10 и 15 слайдов):
   - Для каждого слайда: заголовок, ключевые тезисы, визуальные рекомендации
   - Привяжи контент к данным из бизнес-описания
   - Укажи что показать на демо

3. ФИНАНСОВАЯ МОДЕЛЬ ДЛЯ ИНВЕСТОРОВ:
   - Key metrics table (CAC, LTV, Churn, Growth)
   - 3-летние прогнозы выручки
   - Use of funds (детализированный)
   - Valuation justification

4. DUE DILIGENCE CHECKLIST:
   - Документы для подготовки
   - Данные для сбора
   - Команда для вовлечения
   - Timeline подготовки

5. СЦЕНАРИИ ВСТРЕЧИ:
   - 3-минутный elevator pitch
   - 10-минутная презентация
   - 30-минутная глубокая встреча
   - Ответы на сложные вопросы

6. РЕКОМЕНДАЦИИ ПО ПЕРЕГОВОРАМ:
   - Как обсуждать оценку
   - Ключевые термы для обсуждения
   - Red flags инвесторов
   - Next steps после встречи

Используй конкретные цифры и реалистичные предположения на основе описания бизнеса.`;

            const response = await callGigaChatAPI([
                { 
                    role: 'system', 
                    content: 'Ты - венчурный инвестор и тренер по питчам. Дай практические, конкретные рекомендации с примерами из реальных сделок.' 
                },
                { role: 'user', content: prompt }
            ], 0.5, 6000);
            
            let result = {
                investor_prep: response,
                generated_at: new Date().toISOString(),
                mode: mode
            };
            
            if (includeValidation) {
                const ollamaValidator = new EnhancedOllamaValidator();
                const heuristicValidator = new EnhancedHeuristicValidator();
                
                const [ollamaCheck, heuristicCheck] = await Promise.all([
                    ollamaValidator.factCheckWithMultipleModels(response, 'investor_preparation'),
                    heuristicValidator.advancedValidate(response, 'investor_document', this.detectBusinessType(businessDescription))
                ]);
                
                result.validation = {
                    ollama_check: ollamaCheck,
                    heuristic_check: heuristicCheck,
                    overall_confidence: Math.round((ollamaCheck.confidence + heuristicCheck.overall_score) / 2),
                    critical_issues: [
                        ...(ollamaCheck.aggregated_errors || []),
                        ...(heuristicCheck.advanced_checks.filter(c => c.severity === 'critical').map(c => c.issue))
                    ],
                    recommendations: [
                        ...(ollamaCheck.aggregated_recommendations || []),
                }
                        ...(heuristicCheck.recommendations || [])
                    ]
                };
            }
            
            result.structured_questions = this.investorQuestions;
            result.pitch_structures = this.pitchStructure;
            
            return result;
            
        } catch (error) {
            console.error('❌ Ошибка подготовки к инвесторам:', error);
            throw error;
        }
    }
    
    detectBusinessType(description) {
        const lowerDesc = description.toLowerCase();
        if (lowerDesc.includes('saas') || lowerDesc.includes('подпис') || lowerDesc.includes('облач')) return 'saas';
        if (lowerDesc.includes('ecommerce') || lowerDesc.includes('магазин') || lowerDesc.includes('товар')) return 'ecommerce';
        if (lowerDesc.includes('marketplace') || lowerDesc.includes('площадк')) return 'marketplace';
        return 'general';
    }
    
    getSaaSEarlyStageTemplate() {
        return {
            title: "SaaS Pitch Deck Template (Early Stage)",
            slides: [
                {
                    number: 1,
                    title: "Title Slide",
                    content: ["Company Name", "Tagline", "Logo", "Founder Names", "Contact Info"],
                    timing: "15 seconds",
                    visual: "Clean, professional, brand colors"
                },
                {
                    number: 2,
                    title: "The Problem",
                    content: ["Specific pain point", "Current solutions suck because...", "Cost of the problem ($)"],
                    timing: "30 seconds",
                    visual: "Customer pain point graphic, $ numbers"
                },
                {
                    number: 3,
                    title: "Our Solution",
                    content: ["Simple description", "Key features", "How it works (simple)"],
                    timing: "45 seconds", 
                    visual: "Product screenshot, simple diagram"
                },
                {
                    number: 4,
                    title: "Why Now?",
                    content: ["Market trends", "Technology readiness", "Changing behavior"],
                    timing: "30 seconds",
                    visual: "Timeline, trend graphs"
                },
                {
                    number: 5,
                    title: "Market Opportunity",
                    content: ["TAM: $X", "SAM: $Y", "SOM: $Z", "Sources"],
                    timing: "30 seconds",
                    visual: "Market size circles, citation logos"
                },
                {
                    number: 6,
                    title: "Business Model",
                    content: ["Pricing: $X/month", "Revenue streams", "Customer segments"],
                    timing: "30 seconds",
                    visual: "Pricing table, revenue chart"
                },
                {
                    number: 7,
                    title: "Traction",
                    content: ["MRR: $X", "Customers: Y", "Growth: Z%", "Key metrics"],
                    timing: "45 seconds",
                    visual: "Growth graph, metric cards"
                },
                {
                    number: 8,
                    title: "Competition",
                    content: ["Competitor map", "Our differentiation", "Why we win"],
                    timing: "30 seconds",
                    visual: "2x2 matrix, comparison table"
                },
                {
                    number: 9,
                    title: "Team",
                    content: ["Founder backgrounds", "Key hires", "Advisors"],
                    timing: "30 seconds",
                    visual: "Team photos, company logos"
                },
                {
                    number: 10,
                    title: "The Ask",
                    content: ["Raising: $X", "Valuation: $Y", "Use of funds", "Milestones"],
                    timing: "30 seconds",
                    visual: "Pie chart, milestone timeline"
                }
            ],
            tips: [
                "Keep each slide to 1-3 key points",
                "Use large fonts (24pt minimum)",
                "Show, don't tell - use visuals",
                "Practice timing (10 slides = 10 minutes)",
                "Prepare backup slides for due diligence"
            ]
        };
    }
}

// ============================================
// КЛАСС AI BUSINESS CHAT EXPERT (УЛУЧШЕННЫЙ С УНИКАЛЬНЫМИ ПРОМПТАМИ)
// ============================================

class BusinessChatExpert {
    constructor() {
        this.expertModes = {
            hard_grill: {
                id: 'hard_grill',
                title: '🔥 Жесткая прожарка идеи',
                icon: '🔥',
                system_prompt: `Ты - безжалостный, критически мыслящий инвестор и бизнес-аналитик с 20+ лет опыта. Твоя задача - найти слабые места, несоответствия и риски в бизнес-идее. Будь максимально критичным, объективным, без дружелюбия и компромиссов.
        
ОСНОВНЫЕ НАПРАВЛЕНИЯ КРИТИКИ:
1. Рыночное соответствие:
   - Есть ли реальная большая проблема?
   - Доказан ли спрос?
   - Соответствует ли решение реальным потребностям рынка?

2. Финансовая жизнеспособность:
   - Реально ли окупится?
   - Реалистичны ли финансовые прогнозы?
   - Какие скрытые издержки?

3. Команда и исполнение:
   - Кто конкретно будет делать? 
   - Почему именно они смогут?
   - Есть ли нужные компетенции?

4. Конкурентные преимущества:
   - Чем реально лучше других?
   - Почему нельзя скопировать?
   - Есть ли технологический барьер?

5. Масштабируемость:
   - Какие реальные ограничения роста?
   - Можно ли масштабировать без потери качества?
   - Какие операционные сложности?

6. Технологические риски:
   - Что может сломаться?
   - Есть ли техническая доля?
   - Зависимость от сторонних технологий?

7. Юридические риски:
   - Какие регуляторные препятствия?
   - Проблемы с интеллектуальной собственностью?
   - Соответствие законодательству?

8. Маркетинговая реалистичность:
   - Реально ли привлечь клиентов за указанную стоимость?
   - Реальны ли предположения о конверсии?
   - Можно ли удержать клиентов?

Тип бизнеса: {business_type}

ПРОЦЕСС:
1. Задай 10 критических вопросов по указанным направлениям
2. Проанализируй 3 главных слабых места
3. Дайте оценку шансов на успех (0-100%) с обоснованием
4. Предложи конкретные шаги по укреплению слабых мест

СТИЛЬ: Жесткий, критичный, без подбадриваний. Только факты, цифры, логические противоречия. Используй примеры из реальных провалов стартапов.`
            },
            investor_prep: {
                id: 'investor_prep',
                title: '💼 Подготовка к инвестору',
                icon: '💼',
                system_prompt: `Ты - опытный венчурный инвестор с 15+ лет опыта в фондах Sequoia, Y Combinator, a16z. Подготовь основателя к встрече с реальными инвесторами. Используй структуру 18 стандартных вопросов инвесторов:
        
СТРУКТУРА ПОДГОТОВКИ:
1. Ответы на 18 стандартных вопросов инвесторов:
   - Что нового в том, что вы делаете?
   - Какая настоящая боль пользователей?
   - Как сейчас поступают пользователи?
   - Что отличает вас от существующих вариантов?
   - Что заставит пользователя попробовать?
   - Что может отложить желание попробовать?
   - Сколько людей на вашем целевом рынке?
   - Кто ваши конкуренты?
   - Кого из конкурентов вы боитесь больше всего?
   - Сколько пользователей у конкурентов?
   - Сколько времени и денег потратят пользователи перед переключением?
   - Что вы сделали такого, чем можете нас впечатлить?
   - Расскажите что-нибудь удивительное?
   - Какую самую большую ошибку совершили?
   - Какие у вас уникальные способности?
   - Кто станет вашим следующим наемным сотрудником?
   - Что станет вашей самой большой проблемой через полгода?
   - Как вы станете миллиардной компанией?

2. Структура Pitch Deck (10 слайдов):
   - Title Slide, Problem, Solution, Why Now, Market Size
   - Product, Business Model, Competition, Team, Traction, The Ask

3. Финансовая модель для инвесторов:
   - Key metrics table (CAC, LTV, Churn, Growth)
   - 3-летние прогнозы выручки
   - Use of funds (детализированный)
   - Valuation justification

4. Due Diligence Checklist:
   - Документы для подготовки
   - Данные для сбора
   - Команда для вовлечения

5. Сценарии встречи:
   - 3-минутный elevator pitch
   - 10-минутная презентация
   - 30-минутная глубокая встреча

Тип бизнеса: {business_type}

СТИЛЬ: Профессиональный, практический, с конкретными примерами из реальных сделок. Давай конкретные формулировки, цифры, рекомендации по подаче.`
            },
            pitch_practice: {
                id: 'pitch_practice',
                title: '🎤 Тренировка питч-сессии',
                icon: '🎤',
                system_prompt: `Ты - профессиональный тренер по питчам с опытом подготовки стартапов к Y Combinator, TechCrunch Disrupt. Проведи реалистичную тренировку выступления перед инвесторами.

ФОРМАТ ТРЕНИРОВКИ:
1. Elevator Pitch (30 секунд):
   - Я слушаю как инвестор
   - Даю немедленную обратную связь
   - Предлагаю улучшенные версии

2. Полная презентация (10 минут):
   - Проходим по каждому слайду
   - Проверяю логику повествования
   - Указываю на слабые места в аргументации

3. Сложные вопросы инвесторов:
   - Задаю сложные, провокационные вопросы
   - Помогаю сформулировать сильные ответы
   - Учу парировать критику

4. Работа с возражениями:
   - "Почему именно сейчас?"
   - "А что если Google/Amazon скопирует?"
   - "Почему вы лучшая команда для этого?"

5. Невербальная коммуникация:
   - Советы по подаче
   - Работа с голосом
   - Язык тела
   - Работа с демо

6. Анализ и улучшение:
   - Записываю ключевые тезисы
   - Отмечаю сильные и слабые стороны
   - Даю домашнее задание для улучшения

Тип бизнеса: {business_type}

СТИЛЬ: Интерактивный, практический. Чередуй роли: сначала инвестор (задаю вопросы), потом тренер (даю обратную связь). Используй конкретные примеры из успешных pitch deck.`
            },
            consultant: {
                id: 'consultant',
                title: '👔 Бизнес-консультант',
                icon: '👔',
                system_prompt: `Ты - практикующий бизнес-консультант с 15+ лет реального опыта работы с компаниями от стартапов до корпораций. Давай практические, реалистичные рекомендации, основанные на данных и лучших практиках.

СТРУКТУРА КОНСУЛЬТАЦИИ:
1. Анализ текущей ситуации:
   - Сбор информации о бизнесе
   - Анализ ключевых метрик
   - Выявление проблемных зон

2. Стратегические рекомендации:
   - Разработка стратегии роста
   - Оптимизация бизнес-процессов
   - Улучшение продуктового предложения

3. Тактические шаги:
   - Конкретные действия на следующие 30/60/90 дней
   - Приоритизация задач
   - Распределение ресурсов

4. Финансовые рекомендации:
   - Оптимизация расходов
   - Улучшение денежного потока
   - Повышение рентабельности

5. Маркетинг и продажи:
   - Стратегия привлечения клиентов
   - Улучшение конверсии
   - Программы удержания

6. Команда и управление:
   - Построение организационной структуры
   - Развитие компетенций команды
   - Внедрение систем управления

7. Измерение результатов:
   - Ключевые метрики (KPIs)
   - Система отслеживания прогресса
   - Регулярные проверки

Тип бизнеса: {business_type}

СТИЛЬ: Практический, структурированный, основанный на данных. Давай конкретные инструменты, шаблоны, примеры из реальных кейсов. Избегай абстрактных советов.`
            }
        };
        
        this.quickActions = [
            {
                id: "hard_grill",
                title: "🔥 Прожарить идею",
                icon: "🔥",
                prompt: "Проанализируй мою бизнес-идею и найди слабые места.",
                business_types: ["saas", "ecommerce", "marketplace", "service", "mobile_app", "physical_product"]
            },
            {
                id: "investor_prep",
                title: "💼 К инвестору",
                icon: "💼",
                prompt: "Подготовь меня к встрече с инвестором."
            }
        ];
        
        this.chatHistory = new Map();
        this.userSessions = new Map();
    }
    
    async processMessage(userId, message, mode = null, businessType = null, options = {}) {
        try {
            if (!this.chatHistory.has(userId)) {
                this.chatHistory.set(userId, []);
                this.userSessions.set(userId, {
                    created: new Date(),
                    messageCount: 0,
                    lastActivity: new Date()
                });
            }
            
            const history = this.chatHistory.get(userId);
            const session = this.userSessions.get(userId);
            
            if (message.length > 2000) {
                message = message.substring(0, 2000) + "... [сообщение обрезано]";
            }
            
            history.push({ 
                role: 'user', 
                content: message,
                timestamp: new Date().toISOString()
            });
            
            session.messageCount++;
            session.lastActivity = new Date();
            
            // ВАЖНОЕ ИСПРАВЛЕНИЕ: Используем УНИКАЛЬНЫЙ system_prompt для каждого режима
            let systemPrompt;
            
            if (mode && this.expertModes[mode]) {
                const expertMode = this.expertModes[mode];
                systemPrompt = expertMode.system_prompt.replace('{business_type}', businessType || 'general');
                
                // Добавляем специфические инструкции для каждого режима
                switch(mode) {
                    case 'hard_grill':
                        message += `\n\nПожалуйста, будь максимально критичным, найди слабые места, задай жесткие вопросы, не хвали и не подбадривай. Проанализируй: 1) Рыночное соответствие, 2) Финансовую жизнеспособность, 3) Конкурентные преимущества, 4) Масштабируемость, 5) Риски.`;
                        break;
                    case 'investor_prep':
                        message += `\n\nПожалуйста, подготовь к встрече с инвесторами. Дай ответы на 18 стандартных вопросов инвесторов, создай структуру pitch deck, рекомендации по финансовой модели и due diligence.`;
                        break;
                    case 'pitch_practice':
                        message += `\n\nПожалуйста, проведи тренировку питч-сессии. Задай вопросы как инвестор, дай обратную связь по подаче, помоги улучшить презентацию и ответы на сложные вопросы.`;
                        break;
                    case 'consultant':
                        message += `\n\nПожалуйста, дай практические бизнес-рекомендации. Проанализируй ситуацию, предложи конкретные шаги, инструменты и метрики для отслеживания прогресса.`;
                        break;
                }
            } else {
                // Стандартный промпт для общего режима
                systemPrompt = `Ты - AI Business Chat Expert, профессиональный консультант для предпринимателей.
Твой опыт: 20+ лет в бизнес-консалтинге, работа с 500+ стартапами.
Отвечай подробно, с конкретными примерами, цифрами и реалистичными рекомендациями.
Формат: структурированный ответ с разделами, списками и конкретными действиями.`;
            }
            
            const contextHistory = history.slice(-6);
            const messages = [
                { role: 'system', content: systemPrompt },
                ...contextHistory
            ];
            
            console.log(`🤖 Отправка запроса в GigaChat (режим: ${mode || 'general'}, бизнес: ${businessType || 'general'})...`);
            
            const aiResponse = await callGigaChatAPI(messages, 0.7, 4000);
            
            history.push({ 
                role: 'assistant', 
                content: aiResponse,
                mode: mode,
                business_type: businessType,
                timestamp: new Date().toISOString()
            });
            
            if (history.length > 50) {
                this.chatHistory.set(userId, history.slice(-50));
            }
            
            return {
                success: true,
                response: aiResponse,
                mode: mode,
                business_type: businessType,
                history_length: history.length,
                session_info: {
                    message_count: session.messageCount,
                    session_duration: Math.floor((new Date() - session.created) / 1000),
                    last_activity: session.lastActivity
                },
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ Ошибка BusinessChatExpert:', error);
            throw error;
        }
    }
    
    async processWithCrossValidation(userId, message, mode = null, businessType = null) {
        try {
            const gigaChatResult = await this.processMessage(userId, message, mode, businessType);
            
            const ollamaValidator = new EnhancedOllamaValidator();
            const crossCheck = await ollamaValidator.crossCheckWithOllama(
                gigaChatResult.response,
                `Проверка ответа бизнес-консультанта (режим: ${mode || 'general'})`,
                businessType || 'general'
            );
            
            const heuristicValidator = new EnhancedHeuristicValidator();
            const heuristicCheck = heuristicValidator.validate(
                gigaChatResult.response,
                'chat_response',
                businessType || 'general'
            );
            
            return {
                ...gigaChatResult,
                validation: {
                    cross_check: crossCheck,
                    heuristic_check: heuristicCheck,
                    overall_confidence: Math.round((crossCheck.confidence_score + heuristicCheck.confidence_score) / 2),
                    verified: crossCheck.verified && heuristicCheck.verified
                }
            };
            
        } catch (error) {
            console.error('❌ Ошибка кросс-валидации:', error);
            return this.processMessage(userId, message, mode, businessType);
        }
    }
    
    getQuickActions() {
        return this.quickActions;
    }
    
    getExpertModes() {
        return this.expertModes;
    }
    
    clearHistory(userId) {
        if (this.chatHistory.has(userId)) {
            this.chatHistory.delete(userId);
            this.userSessions.delete(userId);
            return true;
        }
        return false;
    }
    
    exportHistory(userId, format = 'json') {
        const history = this.chatHistory.get(userId) || [];
        const session = this.userSessions.get(userId);
        
        if (format === 'json') {
            return {
                history: history,
                session_info: session,
                export_date: new Date().toISOString(),
                total_messages: history.length
            };
        } else if (format === 'text') {
            let text = `История чата пользователя ${userId}\n`;
            text += `Экспортировано: ${new Date().toLocaleString()}\n`;
            text += `Всего сообщений: ${history.length}\n\n`;
            
            history.forEach((msg, index) => {
                text += `${index + 1}. [${new Date(msg.timestamp).toLocaleString()}] ${msg.role === 'user' ? '👤 Вы' : '🤖 AI'}:\n`;
                text += `${msg.content}\n\n`;
            });
            
            return text;
        }
        
        return history;
    }
    
    getSessionStats(userId) {
        const session = this.userSessions.get(userId);
        const history = this.chatHistory.get(userId) || [];
        
        if (!session) return null;
        
        return {
            session_start: session.created,
            last_activity: session.lastActivity,
            message_count: session.messageCount,
            total_messages: history.length,
            session_duration_seconds: Math.floor((new Date() - session.created) / 1000),
            has_history: history.length > 0
        };
    }
}

// ============================================
// КЛАСС PITCH DECK GENERATOR
// ============================================

class PitchDeckGenerator {
    constructor() {
        this.templates = {
            pitch_deck_10: this.get10SlideTemplate(),
            pitch_deck_15: this.get15SlideTemplate(),
            invest_deck_full: this.getInvestDeckTemplate(),
            executive_summary: this.getExecutiveSummaryTemplate()
        };
    }
    
    async generatePitchDeck(data, templateType = 'pitch_deck_10', options = {}) {
        try {
            const template = this.templates[templateType];
            if (!template) throw new Error(`Шаблон ${templateType} не найден`);
            
            const prompt = this.buildPitchDeckPrompt(data, template, options);
            
            const response = await callGigaChatAPI([
                { 
                    role: 'system', 
                    content: 'Ты - дизайнер pitch deck с опытом создания презентаций для Sequoia, YC, a16z. Создавай профессиональные, убедительные презентации с правильной структурой.' 
                },
                { role: 'user', content: prompt }
            ], 0.6, 5000);
            
            const structuredDeck = this.parsePitchDeckResponse(response, template);
            
            const enhancedValidator = new EnhancedOllamaValidator();
            const validation = await enhancedValidator.validateBusinessData(data, this.detectBusinessType(data));
            
            const designRecommendations = this.generateDesignRecommendations(structuredDeck, templateType);
            
            return {
                id: uuidv4(),
                type: 'pitch_deck',
                template: templateType,
                content: structuredDeck,
                validation: validation,
                design_recommendations: designRecommendations,
                export_formats: ['pptx', 'pdf', 'google_slides', 'keynote'],
                generated_at: new Date().toISOString(),
                version: '2.0'
            };
            
        } catch (error) {
            console.error('❌ Ошибка генерации pitch deck:', error);
            return this.generateFallbackPitchDeck(data, templateType);
        }
    }
    
    buildPitchDeckPrompt(data, template, options) {
        return `Создай ${template.name} на основе данных:

${JSON.stringify(data, null, 2)}

${template.instructions}

Структура (${template.slides.length} слайдов):
${template.slides.map(slide => `${slide.number}. ${slide.title}`).join('\n')}

Для каждого слайда предоставь:
1. Title (заголовок)
2. Key Points (3-5 ключевых тезисов с данными)
3. Recommended Visuals (тип визуализации)
4. Speaker Notes (что говорить на этом слайде)
5. Data Points (конкретные цифры для слайда)
6. Call to Action (что должно сделать аудиторию)

Важные требования:
- Каждый слайд должен быть самостоятельным
- Используй конкретные цифры из данных
- Добавь рекомендации по дизайну
- Включи примеры аналогичных успешных pitch deck
- Укажи timing для каждого слайда

Формат ответа: JSON с полной структурой презентации.`;
    }
    
    parsePitchDeckResponse(response, template) {
        try {
            const jsonMatch = response.match(/\[\s*\{[\s\S]*?\}\s*\]/) || response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            return this.parseStructuredText(response, template);
        } catch (error) {
            console.error('Ошибка парсинга pitch deck:', error);
            return this.generateStructuredDeckFromTemplate(template);
        }
    }
    
    parseStructuredText(response, template) {
        const slides = [];
        const lines = response.split('\n');
        let currentSlide = null;
        
        for (const line of lines) {
            if (line.match(/Слайд \d+:|Slide \d+:/i)) {
                if (currentSlide) slides.push(currentSlide);
                currentSlide = {
                    number: parseInt(line.match(/\d+/)[0]),
                    title: line.split(':')[1]?.trim() || '',
                    key_points: [],
                    visuals: [],
                    notes: '',
                    data_points: [],
                    call_to_action: ''
                };
            } else if (currentSlide) {
                if (line.includes('Key Points:')) {
                    // Собираем ключевые точки
                } else if (line.includes('Visuals:')) {
                    // Собираем визуализации
                } else if (line.trim()) {
                    currentSlide.notes += line + '\n';
                }
            }
        }
        
        if (currentSlide) slides.push(currentSlide);
        
        return {
            slides: slides,
            template_name: template.name,
            total_slides: slides.length
        };
    }
    
    generateStructuredDeckFromTemplate(template) {
        return {
            slides: template.slides.map(slide => ({
                number: slide.number,
                title: slide.title,
                key_points: [`Ключевая информация для ${slide.title}`],
                visuals: ['Рекомендуемая визуализация'],
                notes: `Комментарии к слайду ${slide.number}`,
                data_points: ['Конкретные цифры'],
                call_to_action: 'Призыв к действию'
            })),
            template_name: template.name,
            total_slides: template.slides.length
        };
    }
    
    generateDesignRecommendations(deck, templateType) {
        const recommendations = {
            pitch_deck_10: {
                colors: "Используйте 2-3 основных цвета. Синий для доверия, акцентный для CTA",
                typography: "1 шрифт для заголовков, 1 для текста. Минимальный размер 24pt",
                layout: "Много пустого пространства, 1 идея на слайд",
                visuals: "Фотографии реальных пользователей, простые диаграммы, минимум текста",
                animation: "Простая анимация для фокуса внимания, без спецэффектов",
                timing: "10 слайдов = 10 минут, 15 секунд на слайд в среднем"
            },
            invest_deck_full: {
                colors: "Профессиональная палитра, темный фон для данных, светлый для текста",
                typography: "Consistent hierarchy, sans-serif для читаемости",
                layout: "Сетка, выравнивание, консистентные отступы",
                visuals: "Сложные графики на отдельном слайде, executive summary на 2-3 слайда",
                data_viz: "Используйте правильные типы графиков для разных данных",
                appendix: "Backup slides с деталями для due diligence"
            }
        };
        
        return recommendations[templateType] || recommendations.pitch_deck_10;
    }
    
    generateFallbackPitchDeck(data, templateType) {
        const template = this.templates[templateType] || this.templates.pitch_deck_10;
        
        return {
            id: uuidv4(),
            type: 'pitch_deck',
            template: templateType,
            content: this.generateStructuredDeckFromTemplate(template),
            validation: {
                overall_confidence: 40,
                issues: ['Генерация через GigaChat не удалась, использован шаблон']
            },
            generated_at: new Date().toISOString(),
            fallback: true
        };
    }
    
    get10SlideTemplate() {
        return {
            name: "Классический 10-слайдовый Pitch Deck",
            description: "Стандартный формат для первых встреч с инвесторами",
            slides: [
                { number: 1, title: "Title Slide", max_time: 15 },
                { number: 2, title: "The Problem", max_time: 30 },
                { number: 3, title: "The Solution", max_time: 45 },
                { number: 4, title: "Why Now", max_time: 30 },
                { number: 5, title: "Market Size", max_time: 30 },
                { number: 6, title: "Product", max_time: 60 },
                { number: 7, title: "Business Model", max_time: 45 },
                { number: 8, title: "Competition", max_time: 30 },
                { number: 9, title: "Team", max_time: 30 },
                { number: 10, title: "The Ask", max_time: 45 }
            ],
            instructions: "Создайте убедительную презентацию для seed раунда. Фокус на проблеме, решении и рынке.",
            total_time: "10 минут",
            best_for: "First meetings, angel investors, seed rounds"
        };
    }
    
    getInvestDeckTemplate() {
        return {
            name: "Полный Invest Deck",
            description: "Детальная презентация для due diligence и серьезных инвесторов",
            slides: [
                { number: 1, title: "Investment Thesis", max_time: 30 },
                { number: 2, title: "Executive Summary", max_time: 60 },
                { number: 3, title: "Market Analysis", max_time: 90 },
                { number: 4, title: "Problem Deep Dive", max_time: 60 },
                { number: 5, title: "Solution & Technology", max_time: 90 },
                { number: 6, title: "Business Model", max_time: 60 },
                { number: 7, title: "Go-to-Market Strategy", max_time: 60 },
                { number: 8, title: "Competitive Analysis", max_time: 60 },
                { number: 9, title: "Financial Projections", max_time: 90 },
                { number: 10, title: "Team & Cap Table", max_time: 60 },
                { number: 11, title: "Traction & Milestones", max_time: 60 },
                { number: 12, title: "Use of Funds", max_time: 45 },
                { number: 13, title: "Exit Strategy", max_time: 45 },
                { number: 14, title: "Risk Analysis", max_time: 60 },
                { number: 15, title: "Appendix", max_time: 0 }
            ],
            instructions: "Детальная презентация для Series A и выше. Включает все аспекты для due diligence.",
            total_time: "60+ минут",
            best_for: "Series A+, VC funds, detailed due diligence"
        };
    }
    
    get15SlideTemplate() {
        return this.getInvestDeckTemplate();
    }
    
    getExecutiveSummaryTemplate() {
        return {
            name: "Executive Summary",
            description: "Краткое изложение для быстрого ознакомления",
            slides: [
                { number: 1, title: "Executive Summary", max_time: 60 },
                { number: 2, title: "Key Metrics", max_time: 45 },
                { number: 3, title: "Investment Opportunity", max_time: 45 }
            ],
            instructions: "Создайте краткое, но информативное резюме для быстрого принятия решений.",
            total_time: "5 минут",
            best_for: "Quick reviews, email pitches, executive summaries"
        };
    }
    
    detectBusinessType(data) {
        const text = JSON.stringify(data).toLowerCase();
        if (text.includes('saas') || text.includes('подпис')) return 'saas';
        if (text.includes('ecommerce') || text.includes('магазин')) return 'ecommerce';
        if (text.includes('marketplace') || text.includes('площадк')) return 'marketplace';
        return 'general';
    }
}

// ============================================
// КЛАСС PERSONALIZED IDEA GENERATOR (УЛУЧШЕННЫЙ)
// ============================================

class PersonalizedIdeaGenerator {
    constructor() {
        this.questionnaire = [
            {
                id: "skills",
                question: "Какие у вас ключевые навыки и опыт?",
                description: "Перечислите 3-5 основных навыков (технические, управленческие, творческие)",
                type: "text",
                maxLength: 500,
                placeholder: "Например: программирование Python, управление проектами, дизайн UI/UX"
            },
            {
                id: "interests",
                question: "Какие области вам интересны?",
                options: ["Технологии", "Образование", "Здоровье", "Экология", "Искусство", "Финансы", "Ритейл", "Сервисы", "Спорт", "Путешествия"],
                type: "multiple",
                maxSelections: 3,
                description: "Выберите до 3 направлений, которые вас увлекают"
            },
            {
                id: "values",
                question: "Что для вас важно в бизнесе?",
                options: [
                    {value: "social_impact", label: "Социальное влияние"},
                    {value: "high_income", label: "Высокий доход"},
                    {value: "flexible_schedule", label: "Гибкий график"},
                    {value: "innovation", label: "Инновации"},
                    {value: "stability", label: "Стабильность"},
                    {value: "fast_growth", label: "Быстрый рост"},
                    {value: "creativity", label: "Творчество"},
                    {value: "independence", label: "Независимость"}
                ],
                type: "multiple",
                maxSelections: 2,
                description: "Выберите 2 главные ценности"
            },
            {
                id: "investment",
                question: "Какой стартовый капитал доступен?",
                options: [
                    {value: "low", label: "< 100K руб", range: "0-100K"},
                    {value: "medium", label: "100K - 500K руб", range: "100K-500K"},
                    {value: "high", label: "500K - 1M руб", range: "500K-1M"},
                    {value: "very_high", label: "1M - 5M руб", range: "1M-5M"},
                    {value: "enterprise", label: "> 5M руб", range: "5M+"}
                ],
                type: "single",
                description: "Реальные доступные средства для запуска"
            },
            {
                id: "time",
                question: "Сколько времени готовы уделять?",
                options: [
                    {value: "part_time", label: "< 10 часов/нед (парт-тайм)"},
                    {value: "half_time", label: "10-20 часов/нед (половина дня)"},
                    {value: "full_time", label: "20-40 часов/нед (полный день)"},
                    {value: "intensive", label: "40+ часов/нед (интенсивно)"}
                ],
                type: "single",
                description: "Еженедельная временная нагрузка"
            },
            {
                id: "risk",
                question: "Ваша толерантность к риску?",
                options: [
                    {value: "low", label: "Низкая (стабильность важнее роста)"},
                    {value: "medium", label: "Средняя (умеренный риск)"},
                    {value: "high", label: "Высокая (готов к риску ради роста)"}
                ],
                type: "single",
                description: "Насколько вы готовы рисковать"
            },
            {
                id: "market",
                question: "Предпочтительный рынок?",
                options: [
                    {value: "b2b", label: "B2B (бизнес для бизнеса)"},
                    {value: "b2c", label: "B2C (бизнес для потребителей)"},
                    {value: "b2b2c", label: "B2B2C (через бизнес к потребителям)"},
                    {value: "c2c", label: "C2C (потребители для потребителей)"}
                ],
                type: "single",
                description: "Целевой тип клиентов"
            },
            {
                id: "location",
                question: "География бизнеса?",
                options: [
                    {value: "local", label: "Локальный (город/регион)"},
                    {value: "national", label: "Национальный (страна)"},
                    {value: "international", label: "Международный"}
                ],
                type: "single",
                description: "Планируемый масштаб деятельности"
            }
        ];
        
        this.businessTypes = {
            saas: {
                name: "SaaS (Программное обеспечение как услуга)",
                description: "Подписка на облачное ПО",
                investment_range: "$10K - $500K",
                timeline: "3-12 месяцев до запуска",
                skills_required: ["технические", "продуктовые", "маркетинг"]
            },
            ecommerce: {
                name: "E-commerce (Интернет-магазин)",
                description: "Продажа товаров онлайн",
                investment_range: "$5K - $100K",
                timeline: "1-3 месяца до запуска",
                skills_required: ["продажи", "логистика", "маркетинг"]
            },
            marketplace: {
                name: "Маркетплейс",
                description: "Площадка для соединения продавцов и покупателей",
                investment_range: "$50K - $300K",
                timeline: "6-18 месяцев до запуска",
                skills_required: ["технические", "операционные", "комьюнити"]
            },
            service: {
                name: "Сервисный бизнес",
                description: "Предоставление услуг",
                investment_range: "$1K - $50K",
                timeline: "1-2 месяца до запуска",
                skills_required: ["экспертиза", "клиентский сервис", "управление"]
            },
            mobile_app: {
                name: "Мобильное приложение",
                description: "Приложение для iOS/Android",
                investment_range: "$20K - $200K",
                timeline: "4-9 месяцев до запуска",
                skills_required: ["разработка", "дизайн", "аналитика"]
            },
            physical_product: {
                name: "Физический продукт",
                description: "Производство и продажа товаров",
                investment_range: "$50K - $500K",
                timeline: "6-24 месяца до запуска",
                skills_required: ["производство", "логистика", "продажи"]
            }
        };
        
        this.entrepreneurTypes = {
            technologist: {
                name: "Технолог",
                description: "Фокус на технологиях и инновациях",
                ideal_business_types: ["saas", "mobile_app", "marketplace"],
                strengths: ["решение сложных задач", "автоматизация", "инновации"]
            },
            operator: {
                name: "Оператор",
                description: "Фокус на эффективности и процессах",
                ideal_business_types: ["ecommerce", "service", "physical_product"],
                strengths: ["управление процессами", "оптимизация", "масштабирование"]
            },
            creative: {
                name: "Креатив",
                description: "Фокус на дизайне и пользовательском опыте",
                ideal_business_types: ["mobile_app", "ecommerce", "service"],
                strengths: ["дизайн", "брендинг", "пользовательский опыт"]
            },
            hustler: {
                name: "Хастлер",
                description: "Фокус на продажах и росте",
                ideal_business_types: ["b2b", "marketplace", "ecommerce"],
                strengths: ["продажи", "нетворкинг", "быстрый рост"]
            }
        };
    }
    
    analyzeProfile(userResponses) {
        const profile = {
            entrepreneur_type: null,
            strengths: [],
            constraints: [],
            opportunities: []
        };
        
        const skills = (userResponses.skills || '').toLowerCase();
        const interests = userResponses.interests || [];
        
        if (skills.includes('программир') || skills.includes('код') || skills.includes('технолог')) {
            profile.entrepreneur_type = 'technologist';
            profile.strengths.push('Технические навыки');
        } else if (skills.includes('управлен') || skills.includes('организ') || skills.includes('процесс')) {
            profile.entrepreneur_type = 'operator';
            profile.strengths.push('Операционные навыки');
        } else if (skills.includes('дизайн') || skills.includes('креатив') || skills.includes('творч')) {
            profile.entrepreneur_type = 'creative';
            profile.strengths.push('Креативные навыки');
        } else if (skills.includes('продаж') || skills.includes('маркетинг') || skills.includes('коммуникац')) {
            profile.entrepreneur_type = 'hustler';
            profile.strengths.push('Навыки продаж');
        } else {
            profile.entrepreneur_type = 'operator';
        }
        
        if (userResponses.investment === 'low' || userResponses.investment === 'medium') {
            profile.constraints.push('Ограниченный бюджет');
        }
        
        if (userResponses.time === 'part_time') {
            profile.constraints.push('Ограниченное время');
        }
        
        if (userResponses.risk === 'low') {
            profile.constraints.push('Низкая толерантность к риску');
        }
        
        if (interests.includes('Технологии')) {
            profile.opportunities.push('Высокий рост в технологическом секторе');
        }
        
        if (interests.includes('Экология')) {
            profile.opportunities.push('Растущий спрос на устойчивые решения');
        }
        
        if (userResponses.location === 'international') {
            profile.opportunities.push('Доступ к глобальному рынку');
        }
        
        return profile;
    }
    
    async generateIdeas(userResponses) {
        try {
            console.log('💡 Генерация персонализированных бизнес-идей...');
            
            const profile = this.analyzeProfile(userResponses);
            
            const prompt = `Сгенерируй 5 персонализированных бизнес-идей на основе профиля пользователя:

ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ:
${JSON.stringify(userResponses, null, 2)}

АНАЛИЗ ПРОФИЛЯ:
- Тип предпринимателя: ${profile.entrepreneur_type}
- Сильные стороны: ${profile.strengths.join(', ')}
- Ограничения: ${profile.constraints.join(', ')}
- Возможности: ${profile.opportunities.join(', ')}

Для каждой идеи укажи в формате JSON:
{
  "id": "уникальный_идентификатор",
  "title": "Название идеи (максимум 5 слов)",
  "category": "Категория (EdTech, HealthTech, FinTech, GreenTech, RetailTech, PropTech, FoodTech, etc.)",
  "description": "Подробное описание 3-4 предложения",
  "compatibility_score": число от 0 до 100,
  "business_type": "saas|ecommerce|marketplace|service|mobile_app|physical_product",
  "target_audience": "Детальное описание целевой аудитории",
  "unique_value_proposition": "Уникальное ценностное предложение одним предложением",
  "investment_needed": "Стартовые инвестиции в рублях (диапазон)",
  "potential_revenue_year_1": "Потенциальный доход в первый год",
  "potential_revenue_year_3": "Потенциальный доход через 3 года",
  "key_metrics": ["3 ключевые метрики для отслеживания"],
  "main_risks": ["основные риски (3-4 пункта)"],
  "first_steps": ["первые 3 шага для реализации"],
  "time_to_mvp": "Время до создания MVP в месяцах",
  "entrepreneur_type_fit": "Почему эта идея подходит типу предпринимателя"
}

ВАЖНО: Верни ТОЛЬКО валидный JSON массив с объектами, без дополнительного текста.`;

            const response = await callGigaChatAPI([
                { 
                    role: 'system', 
                    content: 'Ты - генератор бизнес-идей с опытом работы с 1000+ стартапов. Создавай реалистичные, проверяемые идеи, соответствующие профилю пользователя. Избегай абстрактных концепций. ВЕРНИ ТОЛЬКО ЧИСТЫЙ JSON МАССИВ без дополнительного текста.' 
                },
                { role: 'user', content: prompt }
            ], 0.8, 5000);
            
            let ideas;
            try {
                // Ищем JSON массив в ответе
                const jsonMatch = response.match(/\[\s*\{[\s\S]*?\}\s*\]/);
                if (jsonMatch) {
                    ideas = JSON.parse(jsonMatch[0]);
                } else {
                    // Попробуем найти несколько JSON объектов
                    const jsonObjects = response.match(/\{[\s\S]*?\}(?=\s*\{)/g) || response.match(/\{[\s\S]*?\}/g);
                    if (jsonObjects) {
                        ideas = jsonObjects.map(obj => {
                            try {
                                return JSON.parse(obj);
                            } catch (e) {
                                console.error('Ошибка парсинга объекта:', e.message);
                                return null;
                            }
                        }).filter(obj => obj !== null);
                    } else {
                        console.error('JSON не найден в ответе GigaChat:', response.substring(0, 500));
                        throw new Error('JSON не найден в ответе');
                    }
                }
            } catch (parseError) {
                console.error('Ошибка парсинга идей:', parseError.message);
                console.error('Ответ GigaChat:', response.substring(0, 500));
                ideas = this.generateFallbackIdeas(userResponses, profile);
            }
            
            if (!Array.isArray(ideas)) {
                if (ideas && typeof ideas === 'object') {
                    ideas = [ideas];
                } else {
                    ideas = this.generateFallbackIdeas(userResponses, profile);
                }
            }
            
            if (ideas.length > 5) {
                ideas = ideas.slice(0, 5);
            }
            
            for (let idea of ideas) {
                idea.id = uuidv4();
                idea.profile_match = profile;
                
                try {
                    idea.branding = await this.generateBranding(idea.title, idea.category);
                } catch (error) {
                    console.error('Ошибка генерации брендинга:', error);
                    idea.branding = this.generateFallbackBranding(idea.title, idea.category);
                }
                
                try {
                    idea.details = await this.generateIdeaDetails(idea, userResponses);
                } catch (error) {
                    console.error('Ошибка генерации деталей:', error);
                    idea.details = this.generateFallbackDetails(idea);
                }
                
                idea.generated_at = new Date().toISOString();
                idea.version = '2.0';
            }
            
            ideas.sort((a, b) => (b.compatibility_score || 0) - (a.compatibility_score || 0));
            
            console.log(`✅ Сгенерировано ${ideas.length} идей`);
            return {
                ideas: ideas,
                profile: profile,
                generated_at: new Date().toISOString(),
                total_ideas: ideas.length,
                best_match: ideas[0] || null
            };
            
        } catch (error) {
            console.error('❌ Ошибка генерации идей:', error);
            const profile = this.analyzeProfile(userResponses || {});
            return {
                ideas: this.generateFallbackIdeas(userResponses || {}, profile),
                profile: profile,
                generated_at: new Date().toISOString(),
                total_ideas: 2,
                error: error.message,
                fallback: true
            };
        }
    }
    
    async generateBranding(title, category) {
        try {
            const prompt = `Создай брендинг для бизнес-идеи:
            
Название идеи: ${title}
Категория: ${category}

Создай:
1. Короткое запоминающееся название бренда (2-3 слова)
2. Цепляющий слоган (не больше 6 слов)
3. Позиционирование (одно предложение)
4. Ключевые сообщения бренда (3 пункта)

Верни в формате JSON:
{
  "brand_name": "название",
  "slogan": "слоган",
  "positioning": "позиционирование",
  "key_messages": ["сообщение1", "сообщение2", "сообщение3"],
  "tone_of_voice": "формальный|дружелюбный|инновационный|профессиональный"
}`;

            const response = await callGigaChatAPI([
                { role: 'system', content: 'Ты - брендинг-эксперт с 10+ лет опыта. Создавай современные, запоминающиеся бренды.' },
                { role: 'user', content: prompt }
            ], 0.85, 2000);
            
            try {
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const branding = JSON.parse(jsonMatch[0]);
                    
                    const ollamaValidator = new EnhancedOllamaValidator();
                    const nameCheck = await ollamaValidator.validateWithAI(
                        `Название бренда: ${branding.brand_name}`,
                        'Проверка сложности названия бренда',
                        'general'
                    );
                    
                    return {
                        ...branding,
                        name_complexity_check: {
                            confidence: nameCheck.confidence_score || 70,
                            issues: nameCheck.issues || [],
                            recommendations: nameCheck.recommendations || []
                        },
                        checked_at: new Date().toISOString()
                    };
                }
            } catch (parseError) {
                console.error('Ошибка парсинга брендинга:', parseError);
            }
            
            return {
                brand_name: `${title.split(' ')[0]} ${category.replace('Tech', '')}`,
                slogan: "Инновации для вашего успеха",
                positioning: `${category} решение для современных потребностей`,
                key_messages: ["Качество и надежность", "Инновационный подход", "Клиентоориентированность"],
                tone_of_voice: "профессиональный",
                name_complexity_check: {
                    confidence: 60,
                    issues: ["Сгенерировано автоматически"],
                    recommendations: ["Проверьте уникальность названия"]
                }
            };
            
        } catch (error) {
            console.error('Ошибка генерации брендинга:', error);
            return this.generateFallbackBranding(title, category);
        }
    }
    
    async generateIdeaDetails(idea, userResponses) {
        try {
            const prompt = `Детализируй бизнес-идею:

ИДЕЯ: ${idea.title}
КАТЕГОРИЯ: ${idea.category}
ОПИСАНИЕ: ${idea.description}
БИЗНЕС-ТИП: ${idea.business_type}

Верни детализацию в формате JSON:
{
  "business_model": {
    "revenue_streams": ["источники дохода"],
    "pricing_strategy": "стратегия ценообразования",
    "cost_structure": ["основные статьи расходов"]
  },
  "market_analysis": {
    "market_size": "размер рынка",
    "growth_rate": "темпы роста",
    "trends": ["ключевые тренды"]
  },
  "operations": {
    "key_activities": ["ключевые активности"],
    "key_resources": ["ключевые ресурсы"],
    "key_partners": ["ключевые партнеры"]
  },
  "marketing_strategy": {
    "channels": ["каналы привлечения"],
    "cac_estimate": "оценка стоимости привлечения клиента",
    "retention_strategy": "стратегия удержания"
  },
  "financial_projections": {
    "year1": {
      "revenue": "прогноз выручки",
      "expenses": "прогноз расходов",
      "profit": "прогноз прибыли"
    },
    "break_even": "точка безубыточности (месяцы)"
  },
  "team_requirements": {
    "founder_roles": ["роли основателей"],
    "first_hires": ["первые наймы"],
    "skills_gaps": ["пробелы в навыках"]
  }
}`;

            const response = await callGigaChatAPI([
                { role: 'system', content: 'Ты - бизнес-аналитик. Предоставляй детальную, реалистичную информацию.' },
                { role: 'user', content: prompt }
            ], 0.7, 4000);
            
            try {
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
            } catch (parseError) {
                console.error('Ошибка парсинга деталей:', parseError);
            }
            
            return this.generateFallbackDetails(idea);
            
        } catch (error) {
            console.error('Ошибка генерации деталей:', error);
            return this.generateFallbackDetails(idea);
        }
    }
    
    generateFallbackIdeas(userResponses, profile) {
        const fallbackIdeas = [
            {
                id: uuidv4(),
                title: `AI-Powered ${profile.entrepreneur_type === 'technologist' ? 'Analytics' : 'Learning'} Platform`,
                category: profile.entrepreneur_type === 'technologist' ? "DataTech" : "EdTech",
                description: "Платформа для анализа данных/обучения с использованием искусственного интеллекта для персонализированных рекомендаций.",
                compatibility_score: 85,
                business_type: "saas",
                target_audience: profile.market === 'b2b' ? "Малый и средний бизнес" : "Студенты и профессионалы",
                unique_value_proposition: "Адаптивные рекомендации на основе AI",
                investment_needed: "500,000 - 1,000,000 руб",
                potential_revenue_year_1: "2,000,000 руб",
                potential_revenue_year_3: "10,000,000 руб",
                key_metrics: ["LTV", "CAC", "Churn Rate"],
                main_risks: ["Высокая конкуренция", "Технологическая зависимость", "Регуляторные требования"],
                first_steps: ["Разработка MVP", "Тестирование с пользователями", "Привлечение первых клиентов"],
                time_to_mvp: "3 месяца",
                entrepreneur_type_fit: "Соответствует техническим навыкам"
            },
            {
                id: uuidv4(),
                title: `Sustainable ${profile.interests?.includes('Экология') ? 'Eco' : 'Local'} Marketplace`,
                category: "GreenTech",
                description: "Маркетплейс экологически чистых/локальных продуктов с проверкой качества и сертификацией.",
                compatibility_score: 78,
                business_type: "marketplace",
                target_audience: "Эко-сознательные потребители 25-45 лет",
                unique_value_proposition: "Гарантия экологичности и поддержка локальных производителей",
                investment_needed: "300,000 - 800,000 руб",
                potential_revenue_year_1: "1,500,000 руб",
                potential_revenue_year_3: "8,000,000 руб",
                key_metrics: ["GMV", "Take Rate", "NPS"],
                main_risks: ["Сложность контроля качества", "Логистические вызовы", "Изменения в законодательстве"],
                first_steps: ["Поиск поставщиков", "Разработка платформы", "Маркетинговая кампания"],
                time_to_mvp: "4 месяца",
                entrepreneur_type_fit: "Соответствует операционным навыкам"
            }
        ];
        
        fallbackIdeas.forEach(idea => {
            idea.branding = this.generateFallbackBranding(idea.title, idea.category);
            idea.details = this.generateFallbackDetails(idea);
            idea.generated_at = new Date().toISOString();
        });
        
        return fallbackIdeas;
    }
    
    generateFallbackBranding(title, category) {
        return {
            brand_name: `${title.split(' ')[0]} ${category.replace('Tech', '')}`,
            slogan: "Будущее уже здесь",
            positioning: `${category} решение для современного рынка`,
            key_messages: ["Инновации", "Качество", "Надежность"],
            tone_of_voice: "профессиональный",
            name_complexity_check: {
                confidence: 70,
                issues: [],
                recommendations: ["Проверьте доступность домена"]
            }
        };
    }
    
    generateFallbackDetails(idea) {
        return {
            business_model: {
                revenue_streams: ["Подписка", "Комиссия", "Премиум-функции"],
                pricing_strategy: "Value-based pricing",
                cost_structure: ["Разработка", "Маркетинг", "Поддержка"]
            },
            market_analysis: {
                market_size: "Растущий рынок",
                growth_rate: "15-20% в год",
                trends: ["Цифровизация", "Персонализация", "Устойчивость"]
            },
            operations: {
                key_activities: ["Разработка", "Поддержка клиентов", "Маркетинг"],
                key_resources: ["Команда", "Технологии", "Партнеры"],
                key_partners: ["Технологические партнеры", "Маркетинговые агентства"]
            },
            marketing_strategy: {
                channels: ["SEO", "Контент-маркетинг", "Социальные сети"],
                cac_estimate: "1,000 - 3,000 руб",
                retention_strategy: "Программа лояльности и регулярные обновления"
            },
            financial_projections: {
                year1: {
                    revenue: "2,000,000 руб",
                    expenses: "1,500,000 руб",
                    profit: "500,000 руб"
                },
                break_even: "18 месяцев"
            },
            team_requirements: {
                founder_roles: ["Технический директор", "Коммерческий директор"],
                first_hires: ["Разработчик", "Маркетолог"],
                skills_gaps: ["Продажи", "Операции"]
            }
        };
    }
    
    getQuestionnaire() {
        return this.questionnaire;
    }
    
    getBusinessTypes() {
        return this.businessTypes;
    }
    
    getEntrepreneurTypes() {
        return this.entrepreneurTypes;
    }
}

// ============================================
// УЛУЧШЕННЫЙ UNITMASTER PRO CALCULATOR
// ============================================

class EnhancedUnitMasterProCalculator {
    constructor() {
        this.metrics = {
            ltv: {
                name: "Customer Lifetime Value",
                description: "Общая прибыль от клиента за все время взаимоотношений",
                formula: "ARPU * (1 / Churn Rate) * Gross Margin",
                unit: "руб/клиент",
                importance: "high"
            },
            cac: {
                name: "Customer Acquisition Cost", 
                description: "Стоимость привлечения одного клиента",
                formula: "Маркетинговые расходы / Новые клиенты",
                unit: "руб/клиент",
                importance: "high"
            },
            ltv_cac_ratio: {
                name: "LTV:CAC Ratio",
                description: "Соотношение стоимости клиента к стоимости привлечения",
                formula: "LTV / CAC",
                unit: "коэффициент",
                importance: "critical"
            },
            churn_rate: {
                name: "Churn Rate",
                description: "Процент клиентов, которые перестают пользоваться услугой за период",
                formula: "Потерянные клиенты / Всего клиентов",
                unit: "%/месяц",
                importance: "high"
            },
            retention_rate: {
                name: "Retention Rate",
                description: "Процент клиентов, которые остаются с вами",
                formula: "1 - Churn Rate",
                unit: "%/месяц",
                importance: "medium"
            },
            arpu: {
                name: "Average Revenue Per User",
                description: "Средний доход с одного пользователя за период",
                formula: "Общая выручка / Активные пользователи",
                unit: "руб/месяц",
                importance: "high"
            },
            gross_margin: {
                name: "Gross Margin",
                description: "Валовая маржа после вычета себестоимости",
                formula: "(Выручка - Себестоимость) / Выручка",
                unit: "%",
                importance: "high"
            },
            conversion_rate: {
                name: "Conversion Rate",
                description: "Процент посетителей, становящихся клиентами",
                formula: "Клиенты / Посетители",
                unit: "%",
                importance: "medium"
            },
            payback_period: {
                name: "CAC Payback Period",
                description: "Время окупаемости стоимости привлечения клиента",
                formula: "CAC / (ARPU * Gross Margin)",
                unit: "месяцев",
                importance: "high"
            },
            mrr: {
                name: "Monthly Recurring Revenue",
                description: "Ежемесячная повторяющаяся выручка",
                formula: "ARPU * Активные клиенты",
                unit: "руб/месяц",
                importance: "critical"
            },
            arr: {
                name: "Annual Recurring Revenue",
                description: "Годовая повторяющаяся выручка",
                formula: "MRR * 12",
                unit: "руб/год",
                importance: "high"
            },
            burn_rate: {
                name: "Burn Rate",
                description: "Скорость расходования денежных средств",
                formula: "Месячные расходы - Месячные доходы",
                unit: "руб/месяц",
                importance: "critical"
            },
            runway: {
                name: "Runway",
                description: "Время до исчерпания денежных средств",
                formula: "Денежные средства / Burn Rate",
                unit: "месяцев",
                importance: "critical"
            }
        };
        
        this.industryBenchmarks = {
            saas: {
                ltv_cac_ratio: { min: 3.0, target: 4.0, good: 5.0, excellent: 6.0 },
                churn_rate: { min: 0.10, target: 0.07, good: 0.05, excellent: 0.03 },
                gross_margin: { min: 0.70, target: 0.80, good: 0.85, excellent: 0.90 },
                payback_period: { min: 12, target: 9, good: 6, excellent: 3 },
                conversion_rate: { min: 1.0, target: 2.0, good: 3.0, excellent: 5.0 }
            },
            ecommerce: {
                ltv_cac_ratio: { min: 2.5, target: 3.0, good: 4.0, excellent: 5.0 },
                churn_rate: { min: 0.15, target: 0.12, good: 0.10, excellent: 0.08 },
                gross_margin: { min: 0.40, target: 0.50, good: 0.60, excellent: 0.65 },
                payback_period: { min: 6, target: 4, good: 3, excellent: 2 },
                conversion_rate: { min: 1.5, target: 2.5, good: 3.5, excellent: 5.0 }
            },
            marketplace: {
                ltv_cac_ratio: { min: 2.0, target: 2.5, good: 3.0, excellent: 4.0 },
                churn_rate: { min: 0.20, target: 0.15, good: 0.10, excellent: 0.08 },
                gross_margin: { min: 0.60, target: 0.70, good: 0.75, excellent: 0.80 },
                payback_period: { min: 9, target: 7, good: 5, excellent: 4 },
                conversion_rate: { min: 0.5, target: 1.0, good: 1.5, excellent: 2.5 }
            },
            service: {
                ltv_cac_ratio: { min: 2.0, target: 2.5, good: 3.0, excellent: 3.5 },
                churn_rate: { min: 0.25, target: 0.20, good: 0.15, excellent: 0.10 },
                gross_margin: { min: 0.50, target: 0.60, good: 0.65, excellent: 0.70 },
                payback_period: { min: 8, target: 6, good: 4, excellent: 3 },
                conversion_rate: { min: 10.0, target: 15.0, good: 20.0, excellent: 25.0 }
            },
            mobile_app: {
                ltv_cac_ratio: { min: 2.0, target: 2.5, good: 3.0, excellent: 3.5 },
                churn_rate: { min: 0.30, target: 0.25, good: 0.20, excellent: 0.15 },
                gross_margin: { min: 0.80, target: 0.85, good: 0.90, excellent: 0.95 },
                payback_period: { min: 10, target: 8, good: 6, excellent: 4 },
                conversion_rate: { min: 0.2, target: 0.5, good: 1.0, excellent: 2.0 }
            },
            physical_product: {
                ltv_cac_ratio: { min: 2.5, target: 3.0, good: 3.5, excellent: 4.0 },
                churn_rate: { min: 0.20, target: 0.15, good: 0.10, excellent: 0.08 },
                gross_margin: { min: 0.40, target: 0.50, good: 0.55, excellent: 0.60 },
                payback_period: { min: 7, target: 5, good: 4, excellent: 3 },
                conversion_rate: { min: 1.0, target: 2.0, good: 3.0, excellent: 4.0 }
            }
        };
        
        this.ollamaValidator = new EnhancedOllamaValidator();
        this.heuristicValidator = new EnhancedHeuristicValidator();
    }
    
    async analyzeWithIndustryComparison(businessDescription, options = {}) {
        const basicAnalysis = await this.analyze(businessDescription, options.businessType, 'full');
        
        const industryCases = await this.getIndustryCaseStudies(basicAnalysis.business_type);
        
        const sensitivityAnalysis = this.performSensitivityAnalysis(basicAnalysis.calculated_metrics);
        
        const industryAdjustedForecast = this.adjustForecastForIndustry(
            basicAnalysis.financial_forecast,
            basicAnalysis.business_type
        );
        
        return {
            ...basicAnalysis,
            industry_comparison: {
                case_studies: industryCases,
                percentile_ranking: this.calculatePercentileRanking(basicAnalysis.calculated_metrics, basicAnalysis.business_type),
                industry_adjusted_metrics: this.adjustMetricsForIndustry(basicAnalysis.calculated_metrics, basicAnalysis.business_type)
            },
            sensitivity_analysis: sensitivityAnalysis,
            scenario_analysis: this.performScenarioAnalysis(basicAnalysis),
            industry_adjusted_forecast: industryAdjustedForecast,
            investment_readiness_score: this.calculateInvestmentReadinessScore(basicAnalysis)
        };
    }
    
    async analyze(businessDescription, businessType = null, verificationLevel = 'full', customMetrics = []) {
        try {
            console.log('📊 UnitMaster Pro анализ...');
            
            if (!businessType) {
                businessType = this.detectBusinessType(businessDescription);
                console.log(`🤖 Автоопределен тип бизнеса: ${businessType}`);
            }
            
            const prompt = `Проанализируй бизнес для расчета юнит-экономики:
            
ОПИСАНИЕ БИЗНЕСА: ${businessDescription}
ТИП БИЗНЕСА: ${businessType}

Предоставь реалистичные оценки для следующих метрик:
1. Средний месячный доход с клиента (ARPU) в рублях
2. Себестоимость услуги/товара (в процентах от выручки)
3. Месячный отток клиентов (Churn Rate в процентах)
4. Стоимость привлечения клиента (CAC) в рублях
5. Количество новых клиентов в месяц (в начале)
6. Общие операционные расходы в месяц
7. Средний чек (если применимо)
8. Частота покупок в год
9. Lifetime клиента в месяцах
10. Маркетинговый бюджет в месяц

Верни ответ в формате JSON:
{
    "assumptions": ["ключевые допущения на основе описания"],
    "arpu": число,
    "cogs_percentage": число от 0 до 1,
    "monthly_churn": число от 0 до 1,
    "cac": число,
    "new_customers_monthly": число,
    "operating_expenses": число,
    "average_order_value": число,
    "purchase_frequency": число,
    "customer_lifetime_months": число,
    "marketing_budget": число,
    "industry_benchmarks_used": "какие бенчмарки использованы",
    "confidence_level": число от 0 до 100,
    "notes": "дополнительные заметки"
}`;

            const response = await callGigaChatAPI([
                { 
                    role: 'system', 
                    content: 'Ты - финансовый аналитик с 10+ лет опыта. Давай реалистичные, консервативные оценки для юнит-экономики на основе отраслевых данных и практического опыта.' 
                },
                { role: 'user', content: prompt }
            ], 0.3, 4000);
            
            let analysis;
            try {
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    analysis = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('JSON не найден в ответе');
                }
            } catch (parseError) {
                console.error('Ошибка парсинга анализа:', parseError);
                analysis = this.generateFallbackAnalysis(businessType);
            }
            
            const calculatedMetrics = this.calculateMetrics(analysis, businessType);
            
            const benchmarkComparison = this.compareWithBenchmarks(calculatedMetrics, businessType);
            
            const recommendations = this.generateRecommendations(calculatedMetrics, benchmarkComparison, businessType);
            
            const riskAssessment = this.assessRisks(calculatedMetrics, benchmarkComparison, businessType);
            
            const financialForecast = this.generateForecast(calculatedMetrics, analysis, businessType);
            
            let crossValidation = null;
            if (verificationLevel === 'full') {
                const textToValidate = JSON.stringify({
                    analysis: analysis,
                    calculated_metrics: calculatedMetrics
                }, null, 2);
                
                const ollamaCheck = await this.ollamaValidator.crossCheckWithOllama(
                    textToValidate,
                    `Анализ юнит-экономики для ${businessType} бизнеса`,
                    businessType
                );
                
                const heuristicCheck = this.heuristicValidator.validate(
                    textToValidate,
                    'unit_economics_analysis',
                    businessType
                );
                
                crossValidation = {
                    ollama: ollamaCheck,
                    heuristic: heuristicCheck,
                    overall_confidence: Math.round((ollamaCheck.confidence_score + heuristicCheck.confidence_score) / 2),
                    verified: ollamaCheck.verified && heuristicCheck.verified
                };
            }
            
            return {
                business_description: businessDescription,
                business_type: businessType,
                analysis: analysis,
                calculated_metrics: calculatedMetrics,
                benchmark_comparison: benchmarkComparison,
                recommendations: recommendations,
                risk_assessment: riskAssessment,
                financial_forecast: financialForecast,
                cross_validation: crossValidation,
                generated_at: new Date().toISOString(),
                verification_level: verificationLevel,
                confidence_score: this.calculateConfidenceScore(analysis, calculatedMetrics, businessType),
                export_ready: true,
                version: '3.0'
            };
            
        } catch (error) {
            console.error('❌ Ошибка UnitMaster анализа:', error);
            throw error;
        }
    }
    
    calculateMetrics(analysis, businessType) {
        const arpu = analysis.arpu || 1000;
        const monthlyChurn = analysis.monthly_churn || 0.1;
        const cac = analysis.cac || 3000;
        const cogsPercentage = analysis.cogs_percentage || 0.3;
        const grossMargin = 1 - cogsPercentage;
        const newCustomersMonthly = analysis.new_customers_monthly || 10;
        const operatingExpenses = analysis.operating_expenses || 50000;
        const avgOrderValue = analysis.average_order_value || arpu;
        const purchaseFrequency = analysis.purchase_frequency || 1;
        const customerLifetimeMonths = analysis.customer_lifetime_months || (1 / monthlyChurn);
        
        const ltv = arpu * customerLifetimeMonths * grossMargin;
        const ltvCacRatio = ltv / cac;
        const retentionRate = 1 - monthlyChurn;
        const paybackPeriod = cac / (arpu * grossMargin);
        const monthlyRevenue = arpu * (analysis.active_customers || newCustomersMonthly * 6);
        const mrr = monthlyRevenue;
        const arr = mrr * 12;
        const burnRate = operatingExpenses - (monthlyRevenue * grossMargin);
        const runway = burnRate > 0 ? (analysis.cash_balance || 1000000) / burnRate : Infinity;
        
        const metrics = {
            ltv: { 
                value: Math.round(ltv), 
                unit: "руб", 
                description: this.metrics.ltv.description,
                formula: this.metrics.ltv.formula,
                calculation: `${arpu} * ${customerLifetimeMonths} * ${grossMargin}`,
                importance: this.metrics.ltv.importance
            },
            cac: { 
                value: Math.round(cac), 
                unit: "руб", 
                description: this.metrics.cac.description,
                formula: this.metrics.cac.formula,
                importance: this.metrics.cac.importance
            },
            ltv_cac_ratio: { 
                value: ltvCacRatio.toFixed(2), 
                unit: "коэффициент", 
                description: this.metrics.ltv_cac_ratio.description,
                formula: this.metrics.ltv_cac_ratio.formula,
                status: this.getRatioStatus(ltvCacRatio, businessType),
                calculation: `${Math.round(ltv)} / ${cac}`,
                importance: this.metrics.ltv_cac_ratio.importance
            },
            churn_rate: { 
                value: (monthlyChurn * 100).toFixed(1), 
                unit: "%/месяц", 
                description: this.metrics.churn_rate.description,
                formula: this.metrics.churn_rate.formula,
                status: this.getChurnStatus(monthlyChurn, businessType),
                importance: this.metrics.churn_rate.importance
            },
            retention_rate: { 
                value: (retentionRate * 100).toFixed(1), 
                unit: "%/месяц", 
                description: this.metrics.retention_rate.description,
                formula: this.metrics.retention_rate.formula,
                importance: this.metrics.retention_rate.importance
            },
            arpu: { 
                value: Math.round(arpu), 
                unit: "руб/месяц", 
                description: this.metrics.arpu.description,
                formula: this.metrics.arpu.formula,
                importance: this.metrics.arpu.importance
            },
            gross_margin: { 
                value: (grossMargin * 100).toFixed(1), 
                unit: "%", 
                description: this.metrics.gross_margin.description,
                formula: this.metrics.gross_margin.formula,
                status: this.getMarginStatus(grossMargin, businessType),
                importance: this.metrics.gross_margin.importance
            },
            payback_period: { 
                value: paybackPeriod.toFixed(1), 
                unit: "месяцев", 
                description: this.metrics.payback_period.description,
                formula: this.metrics.payback_period.formula,
                status: this.getPaybackStatus(paybackPeriod, businessType),
                calculation: `${cac} / (${arpu} * ${grossMargin})`,
                importance: this.metrics.payback_period.importance
            },
            mrr: { 
                value: Math.round(mrr), 
                unit: "руб/месяц",
                description: this.metrics.mrr.description,
                formula: this.metrics.mrr.formula,
                importance: this.metrics.mrr.importance
            },
            arr: { 
                value: Math.round(arr), 
                unit: "руб/год",
                description: this.metrics.arr.description,
                formula: this.metrics.arr.formula,
                importance: this.metrics.arr.importance
            },
            burn_rate: { 
                value: Math.round(burnRate), 
                unit: "руб/месяц",
                description: this.metrics.burn_rate.description,
                formula: this.metrics.burn_rate.formula,
                importance: this.metrics.burn_rate.importance
            },
            runway: { 
                value: burnRate > 0 ? runway.toFixed(1) : '∞', 
                unit: "месяцев",
                description: this.metrics.runway.description,
                formula: this.metrics.runway.formula,
                status: this.getRunwayStatus(runway),
                importance: this.metrics.runway.importance
            },
            conversion_rate: {
                value: analysis.conversion_rate || 2.0,
                unit: "%",
                description: this.metrics.conversion_rate.description,
                formula: this.metrics.conversion_rate.formula,
                status: this.getConversionStatus(analysis.conversion_rate || 2.0, businessType),
                importance: this.metrics.conversion_rate.importance
            }
        };
        
        return metrics;
    }
    
    detectBusinessType(text) {
        const lowerText = text.toLowerCase();
        
        const patterns = {
            saas: ['saas', 'подпис', 'облач', 'программ', 'софт', 'приложен', 'api'],
            ecommerce: ['ecommerce', 'магазин', 'товар', 'продаж', 'доставк', 'интернет магазин'],
            marketplace: ['marketplace', 'площадк', 'посредник', 'агрегатор', 'сервис'],
            service: ['сервис', 'услуг', 'консалт', 'аутсорс', 'поддержк', 'обслуживан'],
            mobile_app: ['мобильн', 'приложен', 'app', 'ios', 'android', 'телефон'],
            physical_product: ['производств', 'продукт', 'физическ', 'товар', 'завод', 'фабрик']
        };
        
        for (const [type, keywords] of Object.entries(patterns)) {
            if (keywords.some(keyword => lowerText.includes(keyword))) {
                return type;
            }
        }
        
        return 'saas';
    }
    
    compareWithBenchmarks(metrics, businessType) {
        const benchmarks = this.industryBenchmarks[businessType] || this.industryBenchmarks.saas;
        const comparison = {};
        
        if (metrics.ltv_cac_ratio) {
            const ratio = parseFloat(metrics.ltv_cac_ratio.value);
            comparison.ltv_cac_ratio = {
                current: ratio,
                benchmark_min: benchmarks.ltv_cac_ratio.min,
                benchmark_target: benchmarks.ltv_cac_ratio.target,
                benchmark_good: benchmarks.ltv_cac_ratio.good,
                benchmark_excellent: benchmarks.ltv_cac_ratio.excellent,
                status: metrics.ltv_cac_ratio.status,
                deviation: (((ratio - benchmarks.ltv_cac_ratio.target) / benchmarks.ltv_cac_ratio.target) * 100).toFixed(1) + "%",
                interpretation: this.interpretRatio(ratio, benchmarks.ltv_cac_ratio)
            };
        }
        
        if (metrics.churn_rate) {
            const churn = parseFloat(metrics.churn_rate.value) / 100;
            comparison.churn_rate = {
                current: churn,
                benchmark_min: benchmarks.churn_rate.min,
                benchmark_target: benchmarks.churn_rate.target,
                benchmark_good: benchmarks.churn_rate.good,
                benchmark_excellent: benchmarks.churn_rate.excellent,
                status: metrics.churn_rate.status,
                deviation: (((churn - benchmarks.churn_rate.target) / benchmarks.churn_rate.target) * 100).toFixed(1) + "%",
                interpretation: this.interpretChurn(churn, benchmarks.churn_rate)
            };
        }
        
        if (metrics.gross_margin) {
            const margin = parseFloat(metrics.gross_margin.value) / 100;
            comparison.gross_margin = {
                current: margin,
                benchmark_min: benchmarks.gross_margin.min,
                benchmark_target: benchmarks.gross_margin.target,
                benchmark_good: benchmarks.gross_margin.good,
                benchmark_excellent: benchmarks.gross_margin.excellent,
                status: metrics.gross_margin.status,
                deviation: (((margin - benchmarks.gross_margin.target) / benchmarks.gross_margin.target) * 100).toFixed(1) + "%",
                interpretation: this.interpretMargin(margin, benchmarks.gross_margin)
            };
        }
        
        if (metrics.payback_period) {
            const payback = parseFloat(metrics.payback_period.value);
            comparison.payback_period = {
                current: payback,
                benchmark_min: benchmarks.payback_period.min,
                benchmark_target: benchmarks.payback_period.target,
                benchmark_good: benchmarks.payback_period.good,
                benchmark_excellent: benchmarks.payback_period.excellent,
                status: metrics.payback_period.status,
                deviation: (((payback - benchmarks.payback_period.target) / benchmarks.payback_period.target) * 100).toFixed(1) + "%",
                interpretation: this.interpretPayback(payback, benchmarks.payback_period)
            };
        }
        
        return comparison;
    }
    
    generateRecommendations(metrics, benchmarkComparison, businessType) {
        const recommendations = [];
        const benchmarks = this.industryBenchmarks[businessType] || this.industryBenchmarks.saas;
        
        if (metrics.ltv_cac_ratio.status === 'critical') {
            recommendations.push({
                id: uuidv4(),
                category: "critical",
                title: "🚨 СРОЧНО: Оптимизируйте соотношение LTV:CAC",
                description: `Ваше соотношение LTV:CAC (${metrics.ltv_cac_ratio.value}) ниже минимального отраслевого уровня (${benchmarks.ltv_cac_ratio.min}). Это означает, что вы теряете деньги на каждом клиенте.`,
                actions: [
                    "Немедленно снизьте CAC через оптимизацию маркетинговых каналов",
                    "Увеличьте средний чек через upsell и cross-sell",
                    "Внедрите программу лояльности для увеличения LTV",
                    "Пересмотрите ценовую стратегию"
                ],
                priority: "critical",
                expected_impact: "Увеличение соотношения до ${benchmarks.ltv_cac_ratio.target} в течение 3 месяцев",
                timeline: "1-3 месяца",
                resources_needed: ["Аналитика", "Маркетинг", "Продукт"],
                kpis: ["LTV:CAC > 3", "CAC снижение на 30%", "ARPU рост на 20%"]
            });
        }
        
        return recommendations;
    }
    
    assessRisks(metrics, benchmarkComparison, businessType) {
        const risks = [];
        
        if (metrics.ltv_cac_ratio.status === 'critical') {
            risks.push({
                risk: "Финансовая неустойчивость",
                severity: "critical",
                probability: "high",
                impact: "Быстрая потеря денег на каждом привлеченном клиенте, риск банкротства",
                mitigation: "Срочная оптимизация CAC и увеличение LTV",
                timeline: "Немедленно",
                monitoring: "Еженедельный мониторинг LTV:CAC"
            });
        }
        
        return risks;
    }
    
    generateForecast(metrics, analysis, businessType) {
        const monthlyRevenue = metrics.mrr?.value || 100000;
        const growthRate = 0.15;
        const churnRate = parseFloat(metrics.churn_rate?.value || 5) / 100;
        const cac = metrics.cac?.value || 3000;
        const newCustomersMonthly = analysis.new_customers_monthly || 10;
        
        const forecast = [];
        let cumulativeRevenue = 0;
        let cumulativeProfit = 0;
        let customers = newCustomersMonthly * 3;
        
        for (let month = 1; month <= 12; month++) {
            const monthGrowth = growthRate * Math.pow(0.95, month - 1);
            const newCustomers = Math.round(newCustomersMonthly * Math.pow(1 + monthGrowth, month - 1));
            const lostCustomers = Math.round(customers * churnRate);
            customers = customers + newCustomers - lostCustomers;
            
            const revenue = Math.round(customers * (metrics.arpu?.value || 1000));
            const cogs = Math.round(revenue * (analysis.cogs_percentage || 0.3));
            const marketingCost = Math.round(newCustomers * cac);
            const operatingExpenses = analysis.operating_expenses || 50000;
            const totalExpenses = cogs + marketingCost + operatingExpenses;
            const profit = revenue - totalExpenses;
            const margin = (profit / revenue) * 100;
            
            cumulativeRevenue += revenue;
            cumulativeProfit += profit;
            
            forecast.push({
                month: month,
                period: `Месяц ${month}`,
                customers: {
                    total: customers,
                    new: newCustomers,
                    lost: lostCustomers,
                    net_growth: newCustomers - lostCustomers
                },
                financials: {
                    revenue: revenue,
                    cogs: cogs,
                    marketing: marketingCost,
                    operating: operatingExpenses,
                    total_expenses: totalExpenses,
                    profit: profit,
                    margin: `${margin.toFixed(1)}%`
                },
                metrics: {
                    cac: cac,
                    ltv: metrics.ltv?.value || 0,
                    ltv_cac_ratio: ((metrics.ltv?.value || 0) / cac).toFixed(2),
                    churn_rate: `${(churnRate * 100).toFixed(1)}%`
                },
                cumulative: {
                    revenue: cumulativeRevenue,
                    profit: cumulativeProfit,
                    customers: customers
                }
            });
        }
        
        const annualSummary = {
            total_revenue: cumulativeRevenue,
            total_expenses: Math.round(cumulativeRevenue * 0.7),
            total_profit: cumulativeProfit,
            average_margin: (cumulativeProfit / cumulativeRevenue * 100).toFixed(1) + "%",
            break_even_month: forecast.findIndex(f => f.cumulative.profit > 0) + 1 || ">12",
            final_customers: customers,
            customer_acquisition_cost: cac,
            customer_lifetime_value: metrics.ltv?.value || 0,
            roi: cumulativeProfit > 0 ? ((cumulativeProfit / (cac * newCustomersMonthly * 12)) * 100).toFixed(1) + "%" : "отрицательный"
        };
        
        return {
            monthly_forecast: forecast,
            annual_summary: annualSummary,
            scenarios: {
                optimistic: this.generateScenario(forecast, 1.3),
                base: forecast,
                pessimistic: this.generateScenario(forecast, 0.7)
            }
        };
    }
    
    generateScenario(baseForecast, multiplier) {
        return baseForecast.map(month => ({
            ...month,
            financials: {
                ...month.financials,
                revenue: Math.round(month.financials.revenue * multiplier),
                profit: Math.round(month.financials.profit * multiplier)
            }
        }));
    }
    
    calculateConfidenceScore(analysis, metrics, businessType) {
        let score = 70;
        
        if (analysis.arpu && analysis.arpu > 0) score += 10;
        if (analysis.cac && analysis.cac > 0) score += 10;
        if (analysis.monthly_churn && analysis.monthly_churn > 0 && analysis.monthly_churn < 1) score += 10;
        if (analysis.new_customers_monthly && analysis.new_customers_monthly > 0) score += 5;
        if (analysis.operating_expenses && analysis.operating_expenses > 0) score += 5;
        
        const arpu = analysis.arpu || 0;
        const cac = analysis.cac || 0;
        
        if (arpu > 0 && cac > 0) {
            const ratio = (arpu * 12) / cac;
            if (ratio >= 1 && ratio <= 5) score += 10;
        }
        
        if (analysis.confidence_level) {
            score = Math.round((score + analysis.confidence_level) / 2);
        }
        
        return Math.min(100, Math.max(0, score));
    }
    
    getRatioStatus(ratio, businessType) {
        const benchmarks = this.industryBenchmarks[businessType] || this.industryBenchmarks.saas;
        
        if (ratio >= benchmarks.ltv_cac_ratio.excellent) return 'excellent';
        if (ratio >= benchmarks.ltv_cac_ratio.good) return 'good';
        if (ratio >= benchmarks.ltv_cac_ratio.target) return 'acceptable';
        if (ratio >= benchmarks.ltv_cac_ratio.min) return 'warning';
        return 'critical';
    }
    
    getChurnStatus(churn, businessType) {
        const benchmarks = this.industryBenchmarks[businessType] || this.industryBenchmarks.saas;
        
        if (churn <= benchmarks.churn_rate.excellent) return 'excellent';
        if (churn <= benchmarks.churn_rate.good) return 'good';
        if (churn <= benchmarks.churn_rate.target) return 'acceptable';
        if (churn <= benchmarks.churn_rate.min) return 'warning';
        return 'critical';
    }
    
    getMarginStatus(margin, businessType) {
        const benchmarks = this.industryBenchmarks[businessType] || this.industryBenchmarks.saas;
        
        if (margin >= benchmarks.gross_margin.excellent) return 'excellent';
        if (margin >= benchmarks.gross_margin.good) return 'good';
        if (margin >= benchmarks.gross_margin.target) return 'acceptable';
        if (margin >= benchmarks.gross_margin.min) return 'warning';
        return 'critical';
    }
    
    getPaybackStatus(payback, businessType) {
        const benchmarks = this.industryBenchmarks[businessType] || this.industryBenchmarks.saas;
        
        if (payback <= benchmarks.payback_period.excellent) return 'excellent';
        if (payback <= benchmarks.payback_period.good) return 'good';
        if (payback <= benchmarks.payback_period.target) return 'acceptable';
        if (payback <= benchmarks.payback_period.min) return 'warning';
        return 'critical';
    }
    
    getConversionStatus(conversion, businessType) {
        const benchmarks = this.industryBenchmarks[businessType] || this.industryBenchmarks.saas;
        
        if (conversion >= benchmarks.conversion_rate.excellent) return 'excellent';
        if (conversion >= benchmarks.conversion_rate.good) return 'good';
        if (conversion >= benchmarks.conversion_rate.target) return 'acceptable';
        if (conversion >= benchmarks.conversion_rate.min) return 'warning';
        return 'critical';
    }
    
    getRunwayStatus(runway) {
        if (runway === '∞') return 'excellent';
        if (runway >= 18) return 'excellent';
        if (runway >= 12) return 'good';
        if (runway >= 6) return 'acceptable';
        if (runway >= 3) return 'warning';
        return 'critical';
    }
    
    interpretRatio(ratio, benchmark) {
        if (ratio >= benchmark.excellent) return "Отличное соотношение, бизнес высокомаржинальный";
        if (ratio >= benchmark.good) return "Хорошее соотношение, бизнес прибыльный";
        if (ratio >= benchmark.target) return "Соответствует отраслевым стандартам";
        if (ratio >= benchmark.min) return "Требует оптимизации, но жизнеспособно";
        return "Критическое соотношение, требует немедленных действий";
    }
    
    interpretChurn(churn, benchmark) {
        if (churn <= benchmark.excellent) return "Отличное удержание, клиенты лояльны";
        if (churn <= benchmark.good) return "Хорошее удержание, соответствует лучшим практикам";
        if (churn <= benchmark.target) return "Среднее по отрасли, есть возможности для улучшения";
        if (churn <= benchmark.min) return "Высокий отток, требуется оптимизация удержания";
        return "Критически высокий отток, угроза для бизнеса";
    }
    
    interpretMargin(margin, benchmark) {
        if (margin >= benchmark.excellent) return "Высокая рентабельность, отличная бизнес-модель";
        if (margin >= benchmark.good) return "Хорошая рентабельность, бизнес эффективен";
        if (margin >= benchmark.target) return "Средняя по отрасли рентабельность";
        if (margin >= benchmark.min) return "Низкая рентабельность, требуется оптимизация";
        return "Критически низкая рентабельность, бизнес нежизнеспособен";
    }
    
    interpretPayback(payback, benchmark) {
        if (payback <= benchmark.excellent) return "Быстрая окупаемость, отличные cash flows";
        if (payback <= benchmark.good) return "Хорошая окупаемость, соответствует целям";
        if (payback <= benchmark.target) return "Средняя по отрасли окупаемость";
        if (payback <= benchmark.min) return "Длительная окупаемость, требует оптимизации";
        return "Критически длинная окупаемость, проблемы с ликвидностью";
    }
    
    generateFallbackAnalysis(businessType) {
        const defaults = {
            saas: { 
                arpu: 1500, 
                cogs_percentage: 0.2, 
                monthly_churn: 0.08, 
                cac: 4000, 
                new_customers_monthly: 20, 
                operating_expenses: 50000,
                average_order_value: 1500,
                purchase_frequency: 1,
                customer_lifetime_months: 12.5,
                marketing_budget: 80000
            },
            ecommerce: { 
                arpu: 3000, 
                cogs_percentage: 0.6, 
                monthly_churn: 0.15, 
                cac: 2000, 
                new_customers_monthly: 50, 
                operating_expenses: 80000,
                average_order_value: 3000,
                purchase_frequency: 2,
                customer_lifetime_months: 6.7,
                marketing_budget: 100000
            }
        };
        
        return {
            ...defaults[businessType] || defaults.saas,
            assumptions: ["Оценки на основе отраслевых средних значений и типичных параметров"],
            industry_benchmarks_used: `Стандартные бенчмарки для ${businessType} индустрии`,
            confidence_level: 65,
            notes: "Использованы консервативные оценки. Рекомендуется уточнить параметры под ваш конкретный бизнес."
        };
    }
    
    async getIndustryCaseStudies(businessType) {
        const caseStudies = {
            saas: [
                { name: "Slack", metrics: { ltv_cac: 6.5, churn: 0.03, growth: 0.45 } },
                { name: "Zoom", metrics: { ltv_cac: 5.8, churn: 0.02, growth: 0.60 } }
            ],
            ecommerce: [
                { name: "Amazon", metrics: { ltv_cac: 4.2, churn: 0.10, growth: 0.25 } },
                { name: "Shopify", metrics: { ltv_cac: 5.1, churn: 0.08, growth: 0.35 } }
            ]
        };
        
        return caseStudies[businessType] || [];
    }
    
    performSensitivityAnalysis(metrics) {
        return {
            cac_sensitivity: {
                base: metrics.cac?.value || 3000,
                optimistic: Math.round((metrics.cac?.value || 3000) * 0.7),
                pessimistic: Math.round((metrics.cac?.value || 3000) * 1.3),
                impact_on_ltv_cac: "±30%"
            },
            churn_sensitivity: {
                base: parseFloat(metrics.churn_rate?.value || 5),
                optimistic: (parseFloat(metrics.churn_rate?.value || 5) * 0.7).toFixed(1),
                pessimistic: (parseFloat(metrics.churn_rate?.value || 5) * 1.3).toFixed(1),
                impact_on_ltv: "±40%"
            }
        };
    }
    
    performScenarioAnalysis(analysis) {
        return {
            best_case: {
                description: "Все ключевые метрики на 20% лучше среднего",
                revenue_multiplier: 1.5,
                profit_multiplier: 2.0
            },
            base_case: {
                description: "Текущие прогнозы и допущения",
                revenue_multiplier: 1.0,
                profit_multiplier: 1.0
            },
            worst_case: {
                description: "Ключевые метрики на 30% хуже среднего",
                revenue_multiplier: 0.7,
                profit_multiplier: 0.5
            }
        };
    }
    
    adjustForecastForIndustry(forecast, businessType) {
        const industryMultipliers = {
            saas: { revenue: 1.0, growth: 1.0 },
            ecommerce: { revenue: 0.9, growth: 1.1 },
            marketplace: { revenue: 0.8, growth: 1.2 }
        };
        
        const multiplier = industryMultipliers[businessType] || industryMultipliers.saas;
        
        return {
            ...forecast,
            monthly_forecast: forecast.monthly_forecast.map(month => ({
                ...month,
                financials: {
                    ...month.financials,
                    revenue: Math.round(month.financials.revenue * multiplier.revenue),
                    profit: Math.round(month.financials.profit * multiplier.revenue)
                }
            }))
        };
    }
    
    calculatePercentileRanking(metrics, businessType) {
        const scores = {
            ltv_cac_ratio: this.calculateMetricPercentile(parseFloat(metrics.ltv_cac_ratio?.value || 0), businessType, 'ltv_cac_ratio'),
            churn_rate: this.calculateMetricPercentile(parseFloat(metrics.churn_rate?.value || 0) / 100, businessType, 'churn_rate'),
            gross_margin: this.calculateMetricPercentile(parseFloat(metrics.gross_margin?.value || 0) / 100, businessType, 'gross_margin')
        };
        
        const average = Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length;
        
        return {
            scores: scores,
            overall_percentile: Math.round(average),
            interpretation: this.interpretPercentile(Math.round(average))
        };
    }
    
    calculateMetricPercentile(value, businessType, metric) {
        const benchmarks = this.industryBenchmarks[businessType];
        if (!benchmarks || !benchmarks[metric]) return 50;
        
        const benchmark = benchmarks[metric];
        let percentile;
        
        if (metric === 'churn_rate') {
            if (value <= benchmark.excellent) percentile = 90;
            else if (value <= benchmark.good) percentile = 75;
            else if (value <= benchmark.target) percentile = 50;
            else if (value <= benchmark.min) percentile = 25;
            else percentile = 10;
        } else {
            if (value >= benchmark.excellent) percentile = 90;
            else if (value >= benchmark.good) percentile = 75;
            else if (value >= benchmark.target) percentile = 50;
            else if (value >= benchmark.min) percentile = 25;
            else percentile = 10;
        }
        
        return percentile;
    }
    
    interpretPercentile(percentile) {
        if (percentile >= 80) return "Выше 80% компаний в отрасли";
        if (percentile >= 60) return "Выше 60% компаний в отрасли";
        if (percentile >= 40) return "Средние показатели по отрасли";
        if (percentile >= 20) return "Ниже среднего по отрасли";
        return "Ниже 20% компаний в отрасли";
    }
    
    adjustMetricsForIndustry(metrics, businessType) {
        const industryAdjustments = {
            saas: { ltv_multiplier: 1.0, cac_multiplier: 1.0 },
            ecommerce: { ltv_multiplier: 0.8, cac_multiplier: 0.7 },
            marketplace: { ltv_multiplier: 0.6, cac_multiplier: 0.5 }
        };
        
        const adjustment = industryAdjustments[businessType] || industryAdjustments.saas;
        
        const adjusted = { ...metrics };
        
        if (adjusted.ltv && adjusted.ltv.value) {
            adjusted.ltv.adjusted_value = Math.round(adjusted.ltv.value * adjustment.ltv_multiplier);
        }
        
        if (adjusted.cac && adjusted.cac.value) {
            adjusted.cac.adjusted_value = Math.round(adjusted.cac.value * adjustment.cac_multiplier);
        }
        
        if (adjusted.ltv_cac_ratio && adjusted.ltv_cac_ratio.value && adjusted.ltv && adjusted.cac) {
            const ltv = adjusted.ltv.adjusted_value || adjusted.ltv.value;
            const cac = adjusted.cac.adjusted_value || adjusted.cac.value;
            adjusted.ltv_cac_ratio.adjusted_value = (ltv / cac).toFixed(2);
        }
        
        return adjusted;
    }
    
    calculateInvestmentReadinessScore(analysis) {
        let score = 0;
        
        const ltvCac = parseFloat(analysis.calculated_metrics.ltv_cac_ratio.value);
        if (ltvCac >= 3.0) score += 25;
        else if (ltvCac >= 2.0) score += 15;
        else if (ltvCac >= 1.0) score += 5;
        
        const churn = parseFloat(analysis.calculated_metrics.churn_rate.value);
        const industry = analysis.business_type;
        const benchmark = this.industryBenchmarks[industry]?.churn_rate?.good || 0.05;
        if (churn <= benchmark) score += 20;
        else if (churn <= benchmark * 2) score += 10;
        else score += 5;
        
        if (analysis.analysis?.growth_assumptions) score += 10;
        if (analysis.financial_forecast?.annual_summary?.growth_rate) score += 10;
        
        if (analysis.business_description?.includes('опыт') || analysis.business_description?.includes('team')) score += 10;
        if (analysis.analysis?.traction_metrics) score += 5;
        
        if (analysis.business_description?.includes('рынок') || analysis.business_description?.includes('TAM')) score += 10;
        
        if (analysis.business_description?.includes('уникальн') || analysis.business_description?.includes('отлич')) score += 10;
        
        return {
            score: Math.min(100, score),
            breakdown: {
                unit_economics: 'LTV:CAC > 3.0',
                growth_potential: 'Проверенные метрики роста',
                market_opportunity: 'Большой растущий рынок',
                competitive_advantage: 'Устойчивое преимущество',
                team_experience: 'Релевантный опыт команды'
            },
            readiness_level: score >= 80 ? 'Готов к инвестициям' :
                            score >= 60 ? 'Требует доработки' :
                            score >= 40 ? 'Ранняя стадия' : 'Не готов'
        };
    }
    
    getMetrics() {
        return this.metrics;
    }
    
    getIndustryBenchmarks() {
        return this.industryBenchmarks;
    }
}

// ============================================
// УЛУЧШЕННЫЙ ДОКУМЕНТ ГЕНЕРАТОР
// ============================================

class EnhancedDocumentGenerator {
    constructor() {
        this.documentTypes = {
            business_plan: {
                name: 'Бизнес-план',
                description: 'Полный бизнес-план с финансовой моделью',
                validation_prompt: `Ты - финансовый аудитор. Проверь бизнес-план на:
1. Реалистичность финансовых прогнозов (все цифры должны быть обоснованы)
2. Полнота разделов (резюме, анализ рынка, маркетинг, финансы, риски)
3. Соответствие отраслевым стандартам для типа бизнеса
4. Правдоподобность допущений (каждое допущение должно быть объяснено)
5. Адекватность анализа рисков (минимум 5 конкретных рисков с митигацией)
6. Детализация финансовой модели (помесячно на 12 месяцев, прогноз на 3 года)`
            },
            pitch_deck: {
                name: 'Pitch Deck',
                description: 'Презентация для инвесторов',
                validation_prompt: `Ты - опытный инвестор. Проверь pitch deck на:
1. Убедительность аргументации (проблема-решение-рынок-команда)
2. Полнота информации для принятия решения (TAM/SAM/SOM, метрики, конкуренты)
3. Реалистичность финансовых обещаний (темпы роста, CAC, LTV)
4. Четкость уникального предложения (почему вы, а не конкуренты)
5. Адекватность оценки рынка (источники данных, тренды)
6. Конкретность плана использования инвестиций (постатейно)`
            },
            marketing_strategy: {
                name: 'Маркетинговая стратегия',
                description: 'Детальный план маркетинга на 12 месяцев',
                validation_prompt: `Ты - директор по маркетингу. Проверь маркетинговую стратегию на:
1. Соответствие продукта и рынка (product-market fit)
2. Реалистичность каналов привлечения (CAC по каналам)
3. Детализацию бюджета (распределение по месяцам и каналам)
4. Измеримость результатов (KPI и метрики)
5. Правдоподобность прогнозов роста (конверсии, retention)`
            }
        };
        
        this.ollamaValidator = new EnhancedOllamaValidator();
        this.heuristicValidator = new EnhancedHeuristicValidator();
    }
    
    async generateDocument(type, subtype, data, options = {}) {
        try {
            console.log(`📄 Генерация документа с проверкой: ${type}...`);
            
            const rawDocument = await this.generateWithGigaChat(type, subtype, data, options);
            
            const ollamaCheck = await this.validateWithOllama(type, rawDocument, data);
            const heuristicCheck = this.validateWithHeuristics(type, rawDocument);
            
            let finalDocument = rawDocument;
            let corrections = [];
            
            if (!ollamaCheck.verified || ollamaCheck.confidence_score < 70) {
                console.log('⚠️ Проблемы при проверке Ollama, генерируем исправленную версию...');
                finalDocument = await this.generateCorrectedVersion(type, rawDocument, ollamaCheck, data, options);
                corrections.push(...(ollamaCheck.issues || []));
            }
            
            if (!heuristicCheck.verified) {
                corrections.push(...(heuristicCheck.issues || []));
            }
            
            // Добавляем детализацию если документ слишком поверхностный
            if (this.isDocumentTooShort(finalDocument.content)) {
                finalDocument = await this.addDetailsToDocument(type, finalDocument, data, options);
            }
            
            return {
                id: uuidv4(),
                type: type,
                subtype: subtype,
                title: `${this.documentTypes[type].name}${subtype ? ` - ${subtype}` : ''}`,
                content: finalDocument.content,
                validation: {
                    ollama_check: ollamaCheck,
                    heuristic_check: heuristicCheck,
                    overall_confidence: Math.round(
                        (ollamaCheck.confidence_score + heuristicCheck.confidence_score) / 2
                    ),
                    verified: ollamaCheck.verified && heuristicCheck.verified,
                    issues: corrections,
                    recommendations: [
                        ...(ollamaCheck.recommendations || []),
                        ...(heuristicCheck.recommendations || [])
                    ]
                },
                metadata: {
                    generated_at: new Date().toISOString(),
                    original_generated_at: rawDocument.generated_at,
                    corrected: corrections.length > 0,
                    enhanced: this.isDocumentTooShort(rawDocument.content),
                    language: options.language || 'ru',
                    version: '3.0'
                }
            };
            
        } catch (error) {
            console.error(`❌ Ошибка генерации документа ${type}:`, error);
            throw error;
        }
    }
    
    isDocumentTooShort(content) {
        const wordCount = content.split(/\s+/).length;
        return wordCount < 800; // Документ считается поверхностным если меньше 800 слов
    }
    
    async generateWithGigaChat(type, subtype, data, options) {
        let prompt = '';
        let systemPrompt = '';
        
        switch (type) {
            case 'business_plan':
                systemPrompt = `Ты - профессиональный бизнес-консультант с 15+ лет опыта. Создай ДЕТАЛЬНЫЙ бизнес-план с КОНКРЕТНЫМИ цифрами и ПРОВЕРЯЕМЫМИ данными.`;
                prompt = this.generateDetailedBusinessPlanPrompt(data, options);
                break;
                
            case 'pitch_deck':
                systemPrompt = `Ты - эксперт по созданию pitch deck для венчурных инвесторов. Используй ТОЛЬКО проверенные факты и реалистичные прогнозы.`;
                prompt = this.generateDetailedPitchDeckPrompt(data, subtype, options);
                break;
                
            case 'marketing_strategy':
                systemPrompt = `Ты - директор по маркетингу с опытом в SaaS, ecommerce и marketplace. Создай измеримую стратегию с конкретными KPI.`;
                prompt = this.generateDetailedMarketingStrategyPrompt(data, options);
                break;
                
            default:
                throw new Error(`Неизвестный тип документа: ${type}`);
        }
        
        const response = await callGigaChatAPI([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ], 0.4, 6000); // Увеличили max_tokens для более детальных ответов
        
        return {
            content: response,
            generated_at: new Date().toISOString(),
            prompt_used: prompt.substring(0, 500) + '...'
        };
    }
    
    generateDetailedBusinessPlanPrompt(data, options = {}) {
        const language = options.language || 'ru';
        
        return `Создай ДЕТАЛЬНЫЙ бизнес-план с КОНКРЕТНЫМИ цифрами и ПРОВЕРЯЕМЫМИ данными:

ДАННЫЕ ДЛЯ БИЗНЕС-ПЛАНА:
${JSON.stringify(data, null, 2)}

Структура бизнес-плана (минимум 15 страниц):

1. РЕЗЮМЕ ПРОЕКТА (1 страница)
   - Краткое описание бизнеса
   - Ключевые преимущества
   - Финансовые показатели (выручка, прибыль, ROI)
   - Требуемые инвестиции

2. ОПИСАНИЕ КОМПАНИИ (2 страницы)
   - Миссия и видение
   - Цели и задачи
   - Организационно-правовая форма
   - История создания

3. АНАЛИЗ РЫНКА (3 страницы)
   - Размер рынка (TAM/SAM/SOM) с источниками
   - Тренды и драйверы роста
   - Целевая аудитория (детальная сегментация)
   - Анализ конкурентов (минимум 5 конкурентов с SWOT)
   - Барьеры входа и выхода

4. ОПИСАНИЕ ПРОДУКТА/УСЛУГИ (2 страницы)
   - Подробное описание продукта
   - Уникальное ценностное предложение
   - Технологический стек
   - Дорожная карта развития

5. МАРКЕТИНГОВАЯ СТРАТЕГИЯ (3 страницы)
   - Позиционирование и брендинг
   - Ценовая стратегия (детальная)
   - Каналы продвижения (CAC по каждому каналу)
   - Прогноз продаж (помесячно на 12 месяцев)

6. ОПЕРАЦИОННЫЙ ПЛАН (2 страницы)
   - Производственный процесс
   - Поставщики и партнеры
   - Логистика и доставка
   - Контроль качества

7. ОРГАНИЗАЦИОННАЯ СТРУКТУРА (2 страницы)
   - Команда (опыт, компетенции)
   - План найма (по месяцам)
   - Система мотивации
   - Потребность в обучении

8. ФИНАНСОВЫЙ ПЛАН (4 страницы)
   - Финансовые предположения (с обоснованием)
   - Прогноз выручки (помесячно на 12 месяцев, поквартально на 3 года)
   - Прогноз расходов (детализированный по статьям)
   - Расчет точки безубыточности
   - Прогноз денежных потоков
   - Балансовый прогноз
   - Ключевые финансовые показатели (ROI, NPV, IRR)

9. АНАЛИЗ РИСКОВ (2 страницы)
   - Риски и их вероятность (минимум 10 рисков)
   - Стратегии митигации
   - План действий при реализации рисков

10. ПРИЛОЖЕНИЯ
    - Детальные расчеты
    - Маркетинговые материалы
    - Юридические документы

ВАЖНО: Включи конкретные цифры, сроки, бюджеты, метрики. Используй реалистичные прогнозы и проверяемые допущения. Укажи источники данных.

Язык: ${language}`;
    }
    
    generateDetailedPitchDeckPrompt(data, subtype = 'standard', options = {}) {
        const slideTypes = {
            standard: [
                'Title Slide (Название, команда, контакты)',
                'The Problem (Боль, размер, эмоции, данные)',
                'The Solution (Как решаете, просто и понятно)',
                'Why Now? (Почему именно сейчас время, тренды)',
                'Market Size (TAM/SAM/SOM с источниками, графики)',
                'Product (Демо, скриншоты, фичи, технология)',
                'Business Model (Как зарабатываете, цены, метрики)',
                'Competition (Конкурентная карта, преимущества, барьеры)',
                'Team (Опыт, почему именно вы, достижения)',
                'Traction (Метрики, рост, клиенты, партнеры)',
                'Financials (Выручка, расходы, прогнозы на 3 года)',
                'The Ask (Сколько, на что, оценка, использование средств)',
                'Roadmap (Дорожная карта на 12-24 месяца)',
                'Risks & Mitigation (Риски и стратегии их снижения)',
                'Contact & Q&A (Контакты, следующие шаги)'
            ],
            detailed: [
                'Титл слайд (Название, слоган, контакты)',
                'Проблема (Глубокая боль, цифры, исследования)',
                'Решение (Наше решение, как работает, доказательства)',
                'Почему сейчас (Тренды, изменения, window of opportunity)',
                'Рынок (TAM/SAM/SOM, источники, прогнозы роста)',
                'Продукт (Детальное описание, скриншоты, видео)',
                'Технология (Технологическое преимущество, патенты)',
                'Бизнес-модель (Цены, метрики, unit economics)',
                'Конкуренция (Анализ конкурентов, конкурентная карта)',
                'Команда (Опыт, достижения, почему мы)',
                'Дорожная карта (На 12-24 месяца с метриками)',
                'Прогнозы (Финансовые прогнозы на 3 года)',
                'Инвестиции (Использование средств, оценка)',
                'FAQ (Ответы на частые вопросы инвесторов)',
                'Контакты (Следующие шаги, контактная информация)'
            ]
        };
        
        const slides = slideTypes[subtype] || slideTypes.standard;
        
        return `Создай ДЕТАЛЬНЫЙ pitch deck презентацию для инвесторов:

ДАННЫЕ ДЛЯ PITCH DECK:
${JSON.stringify(data, null, 2)}

Структура презентации (${slides.length} слайдов):
${slides.map((slide, i) => `${i + 1}. ${slide}`).join('\n')}

Для каждого слайда предоставь:
1. Заголовок (емкий и понятный)
2. Основные тезисы (3-5 пунктов с конкретными цифрами)
3. Ключевые цифры или метрики (с обоснованием)
4. Визуальные рекомендации (типы графиков, диаграмм)
5. Speaker notes (что говорить на этом слайде, 2-3 предложения)

ВАЖНЫЕ ТРЕБОВАНИЯ:
- Каждый слайд должен быть самодостаточным
- Используй КОНКРЕТНЫЕ цифры из данных (не общие фразы)
- Укажи источники для всех рыночных данных
- Включи реальные метрики (CAC, LTV, Churn, Retention)
- Предоставь детальный финансовый прогноз на 3 года
- Объясни оценку компании (методология, мультипликаторы)
- Добавь анализ рисков с конкретными стратегиями митигации

Сделай презентацию УБЕДИТЕЛЬНОЙ, КОНКРЕТНОЙ и ОРИЕНТИРОВАННОЙ НА ИНВЕСТОРОВ.`;
    }
    
    generateDetailedMarketingStrategyPrompt(data, options = {}) {
        const timeline = options.timeline_months || 12;
        
        return `Создай ДЕТАЛЬНУЮ маркетинговую стратегию на ${timeline} месяцев:

ДАННЫЕ ДЛЯ СТРАТЕГИИ:
${JSON.stringify(data, null, 2)}

СТРУКТУРА МАРКЕТИНГОВОЙ СТРАТЕГИИ:

1. EXECUTIVE SUMMARY (1 страница)
   - Основные цели и KPI
   - Бюджет и ожидаемый ROI
   - Ключевые инициативы

2. SITUATION ANALYSIS (2 страницы)
   - Анализ рынка (размер, тренды, драйверы)
   - Анализ конкурентов (маркетинговые активности, CAC)
   - Анализ целевой аудитории (персоны, pain points)
   - SWOT анализ (маркетинг)

3. MARKETING OBJECTIVES (1 страница)
   - SMART цели (конкретные, измеримые, достижимые)
   - KPI и метрики успеха
   - Временные рамки

4. TARGET AUDIENCE (2 страницы)
   - Сегментация (демография, психография, поведение)
   - Персоны покупателей (3-5 персон)
   - Customer journey map

5. BRAND STRATEGY (2 страницы)
   - Позиционирование бренда
   - Ценностное предложение
   - Тон голоса и месседжинг
   - Визуальная идентичность

6. MARKETING MIX (4 страницы)
   - Product: продуктовое позиционирование, особенности
   - Price: ценовая стратегия, скидки, промо
   - Place: каналы дистрибуции, партнеры
   - Promotion: коммуникационная стратегия

7. CHANNEL STRATEGY (3 страницы)
   - Органические каналы (SEO, контент, социальные сети)
   - Платные каналы (PPC, реклама, влияние)
   - PR и медиа стратегия
   - Партнерский маркетинг

8. CONTENT STRATEGY (2 страницы)
   - Контент план на ${timeline} месяцев
   - Темы и форматы
   - Распределение по каналам
   - Календарь публикаций

9. BUDGET & RESOURCES (2 страницы)
   - Распределение бюджета по месяцам и каналам
   - Прогноз CAC по каналам
   - ROI анализ
   - Команда и ресурсы

10. IMPLEMENTATION PLAN (2 страницы)
    - Дорожная карта на ${timeline} месяцев
    - Ответственные и сроки
    - Зависимости и риски

11. MEASUREMENT & OPTIMIZATION (2 страницы)
    - KPI dashboard
    - Метрики и инструменты аналитики
    - Процесс оптимизации
    - Регулярные проверки

12. RISK MANAGEMENT (1 страница)
    - Маркетинговые риски
    - Стратегии митигации
    - План действий при рисках

ВАЖНО: Включи КОНКРЕТНЫЕ цифры, бюджеты, сроки, KPI. Используй реалистичные прогнозы. Укажи источники данных и методологию расчетов.`;
    }
    
    async validateWithOllama(type, document, originalData) {
        try {
            const validationPrompt = `${this.documentTypes[type].validation_prompt}

ДОКУМЕНТ ДЛЯ ПРОВЕРКИ (первые 3000 символов):
${document.content.substring(0, 3000)}

ИСХОДНЫЕ ДАННЫЕ:
${JSON.stringify(originalData, null, 2)}

Проанализируй и верни JSON:
{
    "verified": boolean,
    "confidence_score": 0-100,
    "issues": ["конкретные проблемы с детализацией"],
    "recommendations": ["рекомендации по улучшению и детализации"],
    "critical_errors": ["критические ошибки или недостатки"],
    "completeness_score": 0-100,
    "detail_score": 0-100,
    "realism_score": 0-100,
    "summary": "краткий вывод на русском"
}`;

            const validation = await this.ollamaValidator.validateWithAI(
                validationPrompt,
                `Проверка документа: ${type}`,
                'general'
            );
            
            return {
                ...validation,
                model_used: this.ollamaValidator.currentModel,
                validated_at: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ Ошибка проверки Ollama:', error);
            return {
                verified: false,
                confidence_score: 30,
                issues: ['Не удалось выполнить проверку через Ollama'],
                recommendations: ['Используйте эвристическую проверку'],
                critical_errors: ['Ollama недоступен'],
                summary: 'Проверка не выполнена',
                model_used: 'none',
                error: error.message
            };
        }
    }
    
    validateWithHeuristics(type, document) {
        const heuristics = {
            business_plan: this.validateBusinessPlanHeuristics.bind(this),
            pitch_deck: this.validatePitchDeckHeuristics.bind(this),
            marketing_strategy: this.validateMarketingStrategyHeuristics.bind(this)
        };
        
        const validator = heuristics[type] || this.validateGenericHeuristics.bind(this);
        return validator(document.content);
    }
    
    validateBusinessPlanHeuristics(content) {
        const requiredSections = [
            'резюме', 'рынок', 'продукт', 'маркетинг', 'финанс', 'риск',
            'команда', 'операцион', 'анализ', 'прогноз'
        ];
        
        const missingSections = requiredSections.filter(section => 
            !content.toLowerCase().includes(section)
        );
        
        const issues = missingSections.length > 0 ? 
            [`Отсутствуют разделы: ${missingSections.join(', ')}`] : [];
        
        // Проверяем наличие конкретных цифр
        const hasNumbers = (content.match(/\d+/g) || []).length >= 20;
        if (!hasNumbers) {
            issues.push('Недостаточно конкретных цифр в финансовых прогнозах (меньше 20 чисел)');
        }
        
        // Проверяем наличие финансовых терминов
        const financialTerms = ['выручка', 'прибыль', 'расход', 'доход', 'инвестиция', 'окупаемость', 'ROI'];
        const hasFinancialTerms = financialTerms.some(term => content.toLowerCase().includes(term));
        if (!hasFinancialTerms) {
            issues.push('Не обнаружено ключевых финансовых терминов');
        }
        
        // Проверяем длину документа
        const wordCount = content.split(/\s+/).length;
        if (wordCount < 1000) {
            issues.push(`Документ слишком короткий (${wordCount} слов, рекомендуется >1000 слов)`);
        }
        
        const completenessScore = Math.max(0, 100 - (missingSections.length * 10) - (hasNumbers ? 0 : 20) - (wordCount < 1000 ? 20 : 0));
        const detailScore = Math.max(0, (wordCount / 20) + (hasNumbers ? 30 : 0));
        const realismScore = hasFinancialTerms ? 70 : 30;
        
        return {
            verified: issues.length === 0 && hasNumbers && wordCount >= 1000,
            issues: issues,
            confidence_score: Math.round((completenessScore + detailScore + realismScore) / 3),
            completeness_score: completenessScore,
            detail_score: detailScore,
            realism_score: realismScore,
            recommendations: issues.length > 0 ? [
                'Добавьте недостающие разделы',
                'Включите больше конкретных цифр и расчетов',
                'Расширьте финансовый раздел'
            ] : ['Документ соответствует базовым требованиям'],
            summary: issues.length === 0 ? 
                '✅ Бизнес-план содержит все необходимые разделы и достаточно деталей' : 
                `⚠️ Требуется доработка: ${issues.length} проблем`
        };
    }
    
    validatePitchDeckHeuristics(content) {
        const issues = [];
        const slideKeywords = ['слайд', 'проблема', 'решение', 'рынок', 'команда', 'финанс', 'инвест', 'тракшн', 'конкур'];
        const missingKeywords = slideKeywords.filter(keyword => 
            !content.toLowerCase().includes(keyword)
        );
        
        if (missingKeywords.length > 3) {
            issues.push(`Возможно отсутствуют ключевые слайды: ${missingKeywords.slice(0, 3).join(', ')}`);
        }
        
        // Проверяем наличие конкретных цифр
        const hasNumbers = (content.match(/\d+/g) || []).length >= 15;
        if (!hasNumbers) {
            issues.push('Недостаточно конкретных цифр для инвесторов (меньше 15 чисел)');
        }
        
        // Проверяем наличие финансовых метрик
        const financialMetrics = ['cac', 'ltv', 'churn', 'arr', 'mrr', 'roi', 'npm'];
        const hasMetrics = financialMetrics.some(metric => content.toLowerCase().includes(metric));
        if (!hasMetrics) {
            issues.push('Не указаны ключевые бизнес-метрики (CAC, LTV, Churn и т.д.)');
        }
        
        const completenessScore = Math.max(0, 100 - (missingKeywords.length * 10) - (hasNumbers ? 0 : 20) - (hasMetrics ? 0 : 20));
        const detailScore = hasNumbers ? 70 : 30;
        const realismScore = hasMetrics ? 80 : 40;
        
        return {
            verified: issues.length === 0 && hasNumbers && hasMetrics,
            issues: issues,
            confidence_score: Math.round((completenessScore + detailScore + realismScore) / 3),
            completeness_score: completenessScore,
            detail_score: detailScore,
            realism_score: realismScore,
            recommendations: issues.length > 0 ? [
                'Проверьте наличие всех ключевых слайдов презентации',
                'Добавьте конкретные цифры и метрики',
                'Включите финансовые показатели (CAC, LTV, прогнозы)'
            ] : ['Pitch deck структурирован правильно и содержит необходимые данные'],
            summary: issues.length === 0 ? 
                '✅ Структура pitch deck соответствует стандартам, достаточно деталей' : 
                `⚠️ Проверьте структуру презентации и добавьте конкретику`
        };
    }
    
    validateMarketingStrategyHeuristics(content) {
        const requiredElements = [
            'цел', 'kpi', 'бюджет', 'канал', 'контент', 'аудитор', 'анализ',
            'план', 'метри', 'оптимизац', 'рост', 'конверс'
        ];
        
        const missingElements = requiredElements.filter(element => 
            !content.toLowerCase().includes(element)
        );
        
        const issues = missingElements.length > 3 ? 
            [`Отсутствуют ключевые элементы: ${missingElements.slice(0, 3).join(', ')}`] : [];
        
        // Проверяем наличие цифр и дат
        const hasNumbers = (content.match(/\d+/g) || []).length >= 10;
        if (!hasNumbers) {
            issues.push('Недостаточно конкретных цифр (бюджеты, сроки, метрики)');
        }
        
        // Проверяем наличие временных рамок
        const hasTimeline = content.includes('месяц') || content.includes('год') || 
                           content.includes('квартал') || /\d+\s*(мес|год)/i.test(content);
        if (!hasTimeline) {
            issues.push('Не указаны временные рамки для стратегии');
        }
        
        const completenessScore = Math.max(0, 100 - (missingElements.length * 8) - (hasNumbers ? 0 : 15) - (hasTimeline ? 0 : 15));
        const detailScore = hasNumbers ? 75 : 35;
        const realismScore = hasTimeline ? 80 : 40;
        
        return {
            verified: issues.length === 0 && hasNumbers && hasTimeline,
            issues: issues,
            confidence_score: Math.round((completenessScore + detailScore + realismScore) / 3),
            completeness_score: completenessScore,
            detail_score: detailScore,
            realism_score: realismScore,
            recommendations: issues.length > 0 ? [
                'Добавьте недостающие элементы стратегии',
                'Включите конкретные цифры и сроки',
                'Детализируйте бюджет и KPI'
            ] : ['Маркетинговая стратегия достаточно детализирована'],
            summary: issues.length === 0 ? 
                '✅ Стратегия содержит все необходимые элементы' : 
                `⚠️ Требуется доработка маркетинговой стратегии`
        };
    }
    
    validateGenericHeuristics(content) {
        const wordCount = content.split(/\s+/).length;
        const hasNumbers = (content.match(/\d+/g) || []).length >= 5;
        
        return {
            verified: wordCount >= 500 && hasNumbers,
            issues: wordCount < 500 ? ['Документ слишком короткий'] : 
                   !hasNumbers ? ['Недостаточно конкретных цифр'] : [],
            confidence_score: Math.min(100, Math.round((wordCount / 10) + (hasNumbers ? 30 : 0))),
            completeness_score: wordCount >= 500 ? 70 : 30,
            detail_score: wordCount >= 800 ? 80 : (wordCount >= 500 ? 60 : 30),
            realism_score: hasNumbers ? 70 : 30,
            recommendations: ['Проведите дополнительную проверку документа'],
            summary: '✅ Документ сгенерирован, требуется дополнительная проверка'
        };
    }
    
    async generateCorrectedVersion(type, originalDocument, validation, originalData, options) {
        try {
            const prompt = `Сгенерируй УЛУЧШЕННУЮ и ДЕТАЛИЗИРОВАННУЮ версию документа на основе замечаний:

ИСХОДНЫЙ ДОКУМЕНТ:
${originalDocument.content.substring(0, 2000)}

ЗАМЕЧАНИЯ ПО ПРОВЕРКЕ (что нужно исправить/добавить):
${JSON.stringify(validation.issues || [], null, 2)}

РЕКОМЕНДАЦИИ:
${JSON.stringify(validation.recommendations || [], null, 2)}

ИСХОДНЫЕ ДАННЫЕ:
${JSON.stringify(originalData, null, 2)}

ТИП ДОКУМЕНТА: ${type}

ВНИМАНИЕ: Создай ПОЛНЫЙ, ДЕТАЛЬНЫЙ документ с КОНКРЕТНЫМИ цифрами и ПРОВЕРЯЕМЫМИ данными.

ДОБАВЬ:
1. Больше конкретных цифр, расчетов, метрик
2. Детальные финансовые прогнозы (помесячно/поквартально)
3. Анализ рисков с митигацией
4. Источники данных
5. Реалистичные предположения с обоснованием

Устрани все указанные проблемы, добавь недостающие разделы и конкретные цифры.
Сохрани структуру документа, но СУЩЕСТВЕННО улучши его качество, детализацию и реалистичность.

Верни ПОЛНЫЙ документ, а не только исправления.`;

            const corrected = await callGigaChatAPI([
                { 
                    role: 'system', 
                    content: 'Ты - профессиональный редактор и бизнес-аналитик. Исправляй ошибки, добавляй недостающее, делай документы ДЕТАЛЬНЫМИ и КОНКРЕТНЫМИ.' 
                },
                { role: 'user', content: prompt }
            ], 0.5, 7000); // Увеличили max_tokens для более детального ответа
            
            return {
                content: corrected,
                generated_at: new Date().toISOString(),
                is_corrected: true,
                original_issues: validation.issues || [],
                enhancements: [
                    'Добавлены конкретные цифры и расчеты',
                    'Расширены финансовые прогнозы',
                    'Улучшена детализация разделов',
                    'Добавлен анализ рисков'
                ]
            };
            
        } catch (error) {
            console.error('❌ Ошибка генерации исправленной версии:', error);
            return originalDocument;
        }
    }
    
    async addDetailsToDocument(type, document, originalData, options) {
        try {
            const prompt = `ДОБАВЬ ДЕТАЛИ и КОНКРЕТИКУ в следующий документ:

ТИП ДОКУМЕНТА: ${type}

ТЕКУЩИЙ ДОКУМЕНТ (слишком поверхностный):
${document.content.substring(0, 1500)}

ИСХОДНЫЕ ДАННЫЕ:
${JSON.stringify(originalData, null, 2)}

ЗАДАЧА: Сделай этот документ БОЛЕЕ ДЕТАЛЬНЫМ и КОНКРЕТНЫМ.

ДОБАВЬ:
1. Конкретные цифры и расчеты (финансовые прогнозы, метрики, KPI)
2. Детализацию по каждому разделу
3. Примеры, кейсы, сравнения
4. Источники данных и обоснования
5. Практические рекомендации и next steps
6. Анализ рисков с конкретными стратегиями митигации

Не переписывай полностью, а РАСШИРЬ и УГЛУБИ существующий документ.
Верни ПОЛНЫЙ улучшенный документ.`;

            const enhanced = await callGigaChatAPI([
                { 
                    role: 'system', 
                    content: 'Ты - эксперт по бизнес-документации. Делай документы более детальными, конкретными и полезными.' 
                },
                { role: 'user', content: prompt }
            ], 0.5, 6000);
            
            return {
                content: enhanced,
                generated_at: new Date().toISOString(),
                is_enhanced: true,
                original_length: document.content.length,
                enhanced_length: enhanced.length,
                enhancement_notes: 'Добавлены детали, конкретные цифры, расширены разделы'
            };
            
        } catch (error) {
            console.error('❌ Ошибка добавления деталей к документу:', error);
            return document;
        }
    }
}

// ============================================
// КЛАСС ENHANCED OLLAMA VALIDATOR (ДОБАВЬТЕ ЗДЕСЬ - ПЕРЕД инициализацией классов)
// ============================================

class EnhancedOllamaValidator {
    constructor() {
        this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        this.availableModels = ['llama2', 'mistral', 'codellama', 'neural-chat'];
        this.currentModel = 'llama2';
        this.isAvailable = false;
        this.checkAvailability();
    }

    async checkAvailability() {
        try {
            const response = await axios.get(`${this.baseUrl}/api/tags`, { timeout: 5000 });
            this.isAvailable = true;
            const models = response.data.models || [];
            
            // Выбираем лучшую доступную модель
            const preferredModels = ['llama2:13b', 'llama2', 'mistral', 'neural-chat'];
            for (const model of preferredModels) {
                if (models.some(m => m.name.includes(model))) {
                    this.currentModel = model;
                    break;
                }
            }
            
            console.log(`✅ Ollama доступен. Используется модель: ${this.currentModel}`);
            return true;
        } catch (error) {
            console.warn('⚠️  Ollama недоступен:', error.message);
            this.isAvailable = false;
            return false;
        }
    }

    async validateWithAI(text, context = 'document', industry = 'general') {
        if (!this.isAvailable) {
            return {
                verified: false,
                confidence_score: 50,
                issues: ['Ollama недоступен для проверки'],
                recommendations: ['Установите Ollama для AI-проверки данных'],
                model_used: 'none',
                available: false
            };
        }

        try {
            const prompt = `Проверь следующий текст на реалистичность и соответствие контексту:

Контекст: ${context}
Отрасль: ${industry}
Текст: ${text.substring(0, 2000)}

Проанализируй:
1. Реалистичность цифр и предположений
2. Логическую связность
3. Соответствие отраслевым стандартам
4. Правдоподобность прогнозов

Верни ответ в формате JSON:
{
    "verified": boolean,
    "confidence_score": 0-100,
    "issues": ["проблемы, если есть"],
    "recommendations": ["рекомендации"],
    "summary": "краткий вывод"
}`;

            const response = await axios.post(`${this.baseUrl}/api/generate`, {
                model: this.currentModel,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: 0.1,
                    top_p: 0.9,
                    max_tokens: 1000
                }
            });

            const resultText = response.data.response;
            
            try {
                const jsonMatch = resultText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const result = JSON.parse(jsonMatch[0]);
                    return {
                        ...result,
                        model_used: this.currentModel,
                        available: true
                    };
                }
            } catch (parseError) {
                console.error('Ошибка парсинга ответа Ollama:', parseError);
            }

            // Fallback если не удалось распарсить JSON
            return {
                verified: true,
                confidence_score: 70,
                issues: [],
                recommendations: ['Проверка выполнена, но требуется ручная верификация'],
                summary: 'AI проверка выполнена',
                model_used: this.currentModel,
                available: true,
                raw_response: resultText.substring(0, 500)
            };

        } catch (error) {
            console.error('❌ Ошибка проверки через Ollama:', error);
            return {
                verified: false,
                confidence_score: 30,
                issues: ['Ошибка при проверке через AI'],
                recommendations: ['Попробуйте позже или используйте эвристическую проверку'],
                model_used: this.currentModel,
                available: false,
                error: error.message
            };
        }
    }

    async factCheckWithMultipleModels(text, context) {
        if (!this.isAvailable) {
            return await this.validateWithAI(text, context);
        }

        try {
            const results = [];
            const modelsToCheck = ['llama2', 'mistral'].slice(0, 2); // Проверяем максимум 2 модели

            for (const model of modelsToCheck) {
                try {
                    const prompt = `Факт-чекинг текста. Контекст: ${context}. Текст: ${text.substring(0, 1500)}`;
                    
                    const response = await axios.post(`${this.baseUrl}/api/generate`, {
                        model: model,
                        prompt: prompt,
                        stream: false,
                        options: {
                            temperature: 0.1,
                            top_p: 0.9
                        }
                    });

                    results.push({
                        model: model,
                        response: response.data.response,
                        length: response.data.response.length
                    });
                } catch (modelError) {
                    console.warn(`Модель ${model} недоступна:`, modelError.message);
                }
            }

            if (results.length === 0) {
                return await this.validateWithAI(text, context);
            }

            // Анализируем результаты
            const aggregatedResult = this.aggregateResults(results, text, context);
            
            return {
                ...aggregatedResult,
                models_used: results.map(r => r.model),
                models_count: results.length,
                check_type: 'multi_model_fact_check'
            };

        } catch (error) {
            console.error('❌ Ошибка multi-model проверки:', error);
            return await this.validateWithAI(text, context);
        }
    }

    aggregateResults(results, originalText, context) {
        // Простая агрегация результатов
        const issues = [];
        const recommendations = [];
        let confidenceSum = 0;
        let verifiedCount = 0;

        for (const result of results) {
            const response = result.response.toLowerCase();
            
            if (response.includes('нереалистично') || response.includes('ошибка') || response.includes('проблема')) {
                issues.push(`Потенциальная проблема (модель: ${result.model})`);
            }
            
            if (response.includes('рекоменд') || response.includes('совет')) {
                const recMatch = response.match(/рекоменд[а-я]*[:\-]\s*(.*?)(?=\n|$)/i);
                if (recMatch) {
                    recommendations.push(recMatch[1]);
                }
            }
            
            // Оценка уверенности на основе длины ответа и содержания
            if (response.includes('вероятно') || response.includes('возможно')) {
                confidenceSum += 60;
            } else if (response.includes('точно') || response.includes('определенно')) {
                confidenceSum += 85;
                verifiedCount++;
            } else {
                confidenceSum += 70;
            }
        }

        const avgConfidence = results.length > 0 ? Math.round(confidenceSum / results.length) : 50;
        const isVerified = verifiedCount >= Math.ceil(results.length / 2);

        return {
            verified: isVerified,
            confidence_score: avgConfidence,
            issues: [...new Set(issues)].slice(0, 5),
            recommendations: [...new Set(recommendations)].slice(0, 3),
            summary: `Проверено ${results.length} моделью(ями). ${isVerified ? 'Текст в основном реалистичен' : 'Есть проблемы с реалистичностью'}`,
            aggregated_errors: issues,
            aggregated_recommendations: recommendations
        };
    }

    async validateBusinessData(businessData, industry) {
        const text = typeof businessData === 'string' ? businessData : JSON.stringify(businessData, null, 2);
        
        const prompt = `Проверь бизнес-данные на реалистичность:

Отрасль: ${industry}
Данные: ${text.substring(0, 2500)}

Проанализируй:
1. Финансовые показатели (выручка, расходы, маржа)
2. Прогнозы роста (реалистичность темпов)
3. Предположения и допущения
4. Соответствие отраслевым стандартам

Верни JSON:
{
    "overall_confidence": 0-100,
    "financial_realism": "high|medium|low",
    "growth_assumptions": "conservative|moderate|aggressive",
    "market_fit": "good|average|poor",
    "red_flags": ["список красных флагов"],
    "recommendations": ["рекомендации по улучшению"]
}`;

        try {
            const response = await axios.post(`${this.baseUrl}/api/generate`, {
                model: this.currentModel,
                prompt: prompt,
                stream: false
            });

            const resultText = response.data.response;
            
            try {
                const jsonMatch = resultText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
            } catch (parseError) {
                console.error('Ошибка парсинга бизнес-валидации:', parseError);
            }

            return {
                overall_confidence: 65,
                financial_realism: 'medium',
                growth_assumptions: 'moderate',
                market_fit: 'average',
                red_flags: ['Требуется дополнительная проверка'],
                recommendations: ['Консультируйтесь с экспертами отрасли']
            };

        } catch (error) {
            console.error('Ошибка бизнес-валидации:', error);
            return {
                overall_confidence: 50,
                financial_realism: 'unknown',
                growth_assumptions: 'unknown',
                market_fit: 'unknown',
                red_flags: ['Проверка через AI недоступна'],
                recommendations: ['Проведите проверку вручную']
            };
        }
    }

    async crossCheckWithOllama(content, description, context = 'general') {
        if (!this.isAvailable) {
            return {
                verified: false,
                confidence_score: 50,
                cross_check_available: false,
                message: 'Ollama недоступен для кросс-проверки'
            };
        }

        try {
            const prompt = `Перекрестная проверка контента:

Описание: ${description}
Контекст: ${context}
Контент: ${content.substring(0, 3000)}

Выполни:
1. Проверь на внутреннюю противоречивость
2. Оцени реалистичность утверждений
3. Проверь математические расчеты (если есть)
4. Оцени общее качество

Ответь в формате JSON:
{
    "verified": boolean,
    "confidence_score": 0-100,
    "internal_consistency": "high|medium|low",
    "realism_score": 0-100,
    "calculation_accuracy": "accurate|partial|questionable",
    "issues_found": ["список проблем"],
    "cross_check_summary": "краткое резюме"
}`;

            const response = await axios.post(`${this.baseUrl}/api/generate`, {
                model: this.currentModel,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: 0.1
                }
            });

            const resultText = response.data.response;
            
            try {
                const jsonMatch = resultText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const result = JSON.parse(jsonMatch[0]);
                    return {
                        ...result,
                        cross_check_available: true,
                        model_used: this.currentModel
                    };
                }
            } catch (parseError) {
                console.error('Ошибка парсинга кросс-проверки:', parseError);
            }

            return {
                verified: true,
                confidence_score: 70,
                internal_consistency: 'medium',
                realism_score: 70,
                calculation_accuracy: 'partial',
                issues_found: [],
                cross_check_summary: 'Перекрестная проверка выполнена',
                cross_check_available: true,
                model_used: this.currentModel
            };

        } catch (error) {
            console.error('❌ Ошибка кросс-проверки:', error);
            return {
                verified: false,
                confidence_score: 40,
                cross_check_available: false,
                error: error.message
            };
        }
    }

    async callOllamaWithRetry(prompt, temperature = 0.3, maxRetries = 2) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await axios.post(`${this.baseUrl}/api/generate`, {
                    model: this.currentModel,
                    prompt: prompt,
                    stream: false,
                    options: {
                        temperature: temperature,
                        top_p: 0.9,
                        max_tokens: 2000
                    }
                }, { timeout: 30000 });

                return response.data.response;
            } catch (error) {
                if (attempt === maxRetries) {
                    throw error;
                }
                console.log(`Попытка ${attempt} не удалась, повторяем...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
    }
}

// ============================================
// УНИВЕРСАЛЬНАЯ ФУНКЦИЯ ВЫЗОВА GIGACHAT API
// ============================================

async function callGigaChatAPI(messages, temperature = 0.7, max_tokens = 2000) {
    try {
        console.log('🤖 Вызов GigaChat API...');
        
        const token = await getGigaChatTokenReal();
        
        if (token.includes('dummy-gigachat-token')) {
            console.log('⚠️  Используется тестовый режим GigaChat');
            
            // Генерируем реалистичный тестовый ответ
            const lastUserMessage = messages.find(m => m.role === 'user')?.content || '';
            let response = '# 📊 AI Бизнес-консультант\n\n';
            
            if (lastUserMessage.toLowerCase().includes('инвестор')) {
                response += '## 🎯 Подготовка к инвесторам\n\n';
                response += '1. **18 вопросов инвесторов**\n';
                response += '   - Что нового в вашем подходе?\n';
                response += '   - Какая реальная боль клиентов?\n';
                response += '   - Какой размер рынка (TAM/SAM/SOM)?\n\n';
                response += '2. **Pitch Deck структура**\n';
                response += '   - Слайд 1: Title & Team\n';
                response += '   - Слайд 2: The Problem\n';
                response += '   - Слайд 3: The Solution\n\n';
                response += '*Примечание: В реальном режиме будут детальные рекомендации*';
            } else if (lastUserMessage.toLowerCase().includes('юридическ')) {
                response += '## ⚖️ Юридические документы\n\n';
                response += 'Доступные шаблоны:\n';
                response += '1. **Founders Agreement (RU)** - Соглашение учредителей\n';
                response += '2. **SAFE (EN)** - Simple Agreement for Future Equity\n';
                response += '3. **Term Sheet (RU)** - Инвестиционный меморандум\n\n';
                response += '*Для генерации укажите тип документа и данные*';
            } else {
                response += '## 💼 Бизнес-рекомендации\n\n';
                response += 'На основе вашего запроса рекомендую:\n\n';
                response += '### 1. Анализ рынка\n';
                response += '   • Определите TAM/SAM/SOM\n';
                response += '   • Проанализируйте конкурентов\n';
                response += '   • Выявите ключевые тренды\n\n';
                response += '### 2. Финансовая модель\n';
                response += '   • Рассчитайте CAC/LTV\n';
                response += '   • Определите точку безубыточности\n';
                response += '   • Создайте прогноз на 12 месяцев\n\n';
                response += '### 3. Следующие шаги\n';
                response += '   • Используйте UnitMaster Pro для расчета метрик\n';
                response += '   • Сгенерируйте Pitch Deck для инвесторов\n';
                response += '   • Подготовьте юридические документы\n\n';
                response += '*Это тестовый ответ. При работающем GigaChat API будут конкретные цифры и рекомендации.*';
            }
            
            return response;
        }
        
        console.log(`📊 Используется реальный токен, первые 20 символов: ${token.substring(0, 20)}...`);
        
        // 🔴 ПРОБУЕМ РАЗНЫЕ ВАРИАНТЫ ВЫЗОВА API
        const apiVariants = [
            {
                name: 'Вариант 1: Стандартный с X-Client-ID',
                url: 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Client-ID': '019b25b7-1f2d-7a58-8777-d8aad417d494',
                    'X-Request-ID': uuidv4()
                },
                data: {
                    model: 'GigaChat',
                    messages: messages,
                    temperature: Math.max(0.1, Math.min(temperature, 1.0)),
                    max_tokens: Math.min(max_tokens, 4000),
                    stream: false,
                    repetition_penalty: 1.0
                }
            },
            {
                name: 'Вариант 2: Упрощенный',
                url: 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                data: {
                    model: 'GigaChat',
                    messages: messages,
                    temperature: temperature,
                    max_tokens: max_tokens
                }
            },
            {
                name: 'Вариант 3: С новыми параметрами',
                url: 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Request-ID': uuidv4()
                },
                data: {
                    model: 'GigaChat:latest',
                    messages: messages,
                    temperature: temperature,
                    max_tokens: max_tokens,
                    top_p: 0.9,
                    n: 1,
                    stream: false
                }
            }
        ];
        
        for (let i = 0; i < apiVariants.length; i++) {
            const variant = apiVariants[i];
            console.log(`🔄 Пробую ${variant.name}...`);
            
            try {
                const response = await axios({
                    method: 'POST',
                    url: variant.url,
                    headers: variant.headers,
                    data: variant.data,
                    httpsAgent: new https.Agent({
                        rejectUnauthorized: false,
                        keepAlive: true,
                        timeout: 45000
                    }),
                    timeout: 50000,
                    validateStatus: function (status) {
                        return status < 500;
                    }
                });
                
                console.log(`📊 Статус ${variant.name}: ${response.status}`);
                
                if (response.status === 200 && response.data?.choices?.[0]?.message?.content) {
                    console.log(`✅ ${variant.name} сработал!`);
                    console.log(`📏 Длина ответа: ${response.data.choices[0].message.content.length} символов`);
                    return response.data.choices[0].message.content;
                } 
                else if (response.status === 402) {
                    console.log(`❌ ${variant.name}: 402 Payment Required`);
                    
                    // 🔴 ДЕТАЛЬНЫЙ АНАЛИЗ ОШИБКИ
                    console.error('Детали ошибки 402:');
                    console.error('Ответ:', JSON.stringify(response.data, null, 2));
                    console.error('Заголовки:', JSON.stringify(response.headers, null, 2));
                    
                    console.error('\n🔥 ПРОВЕРЬТЕ В КАБИНЕТЕ SBER:');
                    console.error('1. Scope: ДОЛЖЕН БЫТЬ GIGACHAT_API_PERS');
                    console.error('2. Продукт: ДОЛЖЕН БЫТЬ АКТИВЕН');
                    console.error('3. Ваш Client ID: 019b25b7-1f2d-7a58-8777-d8aad417d494');
                    console.error('4. Ваш пакет: 1,000,000 токенов до 2027-01-06');
                    
                    // Продолжаем пробовать следующий вариант
                    continue;
                }
                else {
                    console.log(`⚠️  ${variant.name}: статус ${response.status}`);
                    // Продолжаем пробовать следующий вариант
                    continue;
                }
            } catch (variantError) {
                console.log(`⚠️  ${variant.name} не сработал: ${variantError.message}`);
                // Продолжаем пробовать следующий вариант
                continue;
            }
        }
        
        // 🔴 ЕСЛИ ВСЕ ВАРИАНТЫ НЕ СРАБОТАЛИ
        console.error('❌ Все варианты вызова API не сработали');
        
        // Возвращаем информативное сообщение
        return `# ⚠️ Информация о текущем статусе

## 📊 Текущая ситуация:
- ✅ Токен GigaChat получен успешно
- ❌ Вызов API возвращает 402 (Payment Required)
- 🔧 Использованы все варианты подключения

## 🔍 Ваши данные:
- **Client ID**: 019b25b7-1f2d-7a58-8777-d8aad417d494
- **Пакет токенов**: 1,000,000 до 06.01.2027
- **Токен получен**: Да (${token.length} символов)

## 🛠 Что проверить в кабинете Sber ID:
1. **Scope в OAuth приложении**: Должен быть **GIGACHAT_API_PERS**
2. **Статус продукта**: Должен быть **"Активный"**, не "Архивный"
3. **Баланс токенов**: Должен показывать доступные 1M токенов
4. **Проверьте OAuth App**: Возможно нужно создать новое приложение

## 💡 Что можно сделать сейчас:
1. Используйте **тестовый режим** для разработки интерфейса
2. Проверьте **все настройки в кабинете Sber**
3. Попробуйте **создать новый Authorization Key**
4. **Обратитесь в поддержку Sber**, если проблема сохраняется

## 📋 Ваш запрос был бы обработан как:
\`\`\`
${JSON.stringify(messages, null, 2).substring(0, 500)}...
\`\`\``;
        
    } catch (error) {
        console.error('❌ Финальная ошибка вызова GigaChat API:', error.message);
        
        // 🔴 ВОЗВРАЩАЕМ ПОНЯТНУЮ ОШИБКУ
        return `# ❌ Ошибка подключения к GigaChat API

**Ошибка**: ${error.message}

## 🔧 Что случилось:
${error.response?.status === 402 ? 
'API вернул ошибку 402 (Payment Required). Хотя токен получен, доступ к чату заблокирован.' :
'Не удалось подключиться к серверу GigaChat.'}

## 🛠 Рекомендации:
1. Проверьте настройки в кабинете Sber ID
2. Убедитесь что Scope = GIGACHAT_API_PERS
3. Проверьте статус пакета токенов
4. Обратитесь в поддержку Sber AI

## 💡 Альтернатива:
Пока идет настройка, используйте тестовые данные для разработки интерфейса.`;
    }
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ КЛАССОВ
// ============================================

const ollamaValidator = new EnhancedOllamaValidator();
const businessChatExpert = new BusinessChatExpert();
const ideaGenerator = new PersonalizedIdeaGenerator();
const unitMasterCalculator = new EnhancedUnitMasterProCalculator();
const pitchDeckGenerator = new PitchDeckGenerator();
const documentGenerator = new EnhancedDocumentGenerator();
const investorPrepExpert = new InvestorPrepExpert();
const heuristicValidator = new EnhancedHeuristicValidator();

// ============================================
// КЛАСС ДЛЯ ГЕНЕРАЦИИ ЮРИДИЧЕСКИХ ДОКУМЕНТОВ (НОВЫЙ)
// ============================================

class LegalDocumentGenerator {
    constructor() {
        this.templates = {
            founders_agreement_ru: this.getFoundersAgreementTemplateRU(),
            safe_en: this.getSafeAgreementTemplateEN(),
            term_sheet_ru: this.getTermSheetTemplateRU(),
            shareholders_agreement_ru: this.getShareholdersAgreementTemplateRU(),
            saas_agreement_en: this.getSaaSAgreementTemplateEN()
        };
        
        this.validationRules = {
            founders_agreement_ru: ['vesting', 'exit_conditions', 'decision_making', 'dispute_resolution'],
            safe_en: ['valuation_cap', 'pro_rata', 'conversion_triggers', 'governing_law'],
            term_sheet_ru: ['valuation', 'liquidation_preference', 'protective_provisions', 'esop'],
            shareholders_agreement_ru: ['board_composition', 'decision_thresholds', 'rofr', 'tag_along', 'lock_up'],
            saas_agreement_en: ['license_grant', 'data_ownership', 'liability_limits', 'governing_law']
        };
    }
    
    async generateLegalDocument(docType, data, options = {}) {
        try {
            console.log(`⚖️ Генерация юридического документа: ${docType}...`);
            
            const template = this.templates[docType];
            if (!template) {
                throw new Error(`Шаблон для ${docType} не найден`);
            }
            
            const prompt = this.buildLegalPrompt(docType, data, template);
            
            const response = await callGigaChatAPI([
                { 
                    role: 'system', 
                    content: template.system_prompt
                },
                { role: 'user', content: prompt }
            ], 0.3, 8000); // Увеличиваем max_tokens для юридических документов
            
            const validation = await this.validateLegalDocument(response, docType, data);
            
            const structuredDocument = this.parseLegalDocument(response, docType, data);
            
            return {
                id: uuidv4(),
                type: 'legal_document',
                doc_type: docType,
                content: structuredDocument,
                validation: validation,
                generated_at: new Date().toISOString(),
                language: template.language,
                template_version: template.version,
                warnings: validation.issues?.length > 0 ? validation.issues : []
            };
            
        } catch (error) {
            console.error(`❌ Ошибка генерации юридического документа ${docType}:`, error);
            throw error;
        }
    }
    
    buildLegalPrompt(docType, data, template) {
        let prompt = `Создай полный черновик юридического документа на основе следующих данных:

ТИП ДОКУМЕНТА: ${template.name}
ЯЗЫК: ${template.language}

ДАННЫЕ ДЛЯ ЗАПОЛНЕНИЯ:
${JSON.stringify(data, null, 2)}

${template.instructions}

${template.structure_requirements}

ВАЖНЫЕ ТРЕБОВАНИЯ:
1. Используйте профессиональный юридический язык
2. Включите все обязательные разделы и пункты
3. Заполните все поля данными из предоставленной информации
4. Добавьте комментарии для сложных пунктов
5. Включите стандартные юридические формулировки
6. Убедитесь в внутренней согласованности документа
7. Добавьте раздел с определениями терминов
8. Включите пункты о конфиденциальности и применимом праве

ФОРМАТ ОТВЕТА:
1. Краткое пояснение: 2-3 предложения о назначении документа
2. Полный текст документа с заполненными данными в квадратных скобках [ ]
3. Ключевые пункты для обсуждения с юристом: список из 3-5 спорных моментов`;
        
        return prompt;
    }
    
    async validateLegalDocument(content, docType, originalData) {
        try {
            const validator = new EnhancedOllamaValidator();
            
            const validationPrompt = `Проверь юридический документ на качество и полноту:

ТИП ДОКУМЕНТА: ${docType}
ТРЕБУЕМЫЕ РАЗДЕЛЫ: ${this.validationRules[docType]?.join(', ') || 'все обязательные'}

ДОКУМЕНТ ДЛЯ ПРОВЕРКИ:
${content.substring(0, 4000)}

ИСХОДНЫЕ ДАННЫЕ:
${JSON.stringify(originalData, null, 2)}

Проанализируй:
1. Полнота документа (все ли обязательные разделы присутствуют)
2. Внутренняя согласованность (нет ли противоречий между пунктами)
3. Качество юридических формулировок
4. Заполнение всех полей данными
5. Наличие стандартных юридических положений
6. Потенциальные риски и уязвимости

Верни JSON:
{
    "completeness_score": 0-100,
    "legal_quality_score": 0-100,
    "missing_sections": ["список отсутствующих разделов"],
    "inconsistencies": ["внутренние противоречия"],
    "legal_risks": ["потенциальные юридические риски"],
    "recommendations": ["рекомендации по улучшению"],
    "requires_lawyer_review": boolean,
    "issues": ["проблемы, если есть"]
}`;

            const response = await validator.callOllamaWithRetry(validationPrompt, 0.2);
            
            try {
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const result = JSON.parse(jsonMatch[0]);
                    
                    // Эвристическая проверка
                    const heuristicCheck = this.heuristicValidateLegalDocument(content, docType);
                    
                    return {
                        ...result,
                        heuristic_check: heuristicCheck,
                        overall_score: Math.round((result.completeness_score + result.legal_quality_score) / 2),
                        model_used: validator.currentModel,
                        validated_at: new Date().toISOString()
                    };
                }
            } catch (parseError) {
                console.error('Ошибка парсинга валидации:', parseError);
            }
            
            return this.generateFallbackValidation();
            
        } catch (error) {
            console.error('Ошибка валидации юридического документа:', error);
            return this.generateFallbackValidation();
        }
    }
    
    heuristicValidateLegalDocument(content, docType) {
        const checks = [];
        
        // Проверка обязательных разделов
        const requiredSections = this.validationRules[docType] || [];
        const missingSections = requiredSections.filter(section => 
            !content.toLowerCase().includes(section.toLowerCase())
        );
        
        if (missingSections.length > 0) {
            checks.push({
                type: 'missing_sections',
                severity: 'high',
                sections: missingSections
            });
        }
        
        // Проверка заполнения полей
        const emptyBrackets = (content.match(/\[\s*\]/g) || []).length;
        if (emptyBrackets > 0) {
            checks.push({
                type: 'empty_fields',
                severity: 'medium',
                count: emptyBrackets
            });
        }
        
        // Проверка юридических терминов
        const legalTerms = ['confidentiality', 'governing law', 'jurisdiction', 'indemnification', 
                           'limitation of liability', 'termination', 'dispute resolution'];
        const missingTerms = legalTerms.filter(term => 
            !content.toLowerCase().includes(term.toLowerCase())
        );
        
        if (missingTerms.length > 2) {
            checks.push({
                type: 'missing_legal_terms',
                severity: 'medium',
                terms: missingTerms
            });
        }
        
        return {
            checks: checks,
            passed: checks.filter(c => c.severity === 'high').length === 0,
            score: 100 - (checks.length * 15)
        };
    }
    
    parseLegalDocument(response, docType, data) {
        try {
            // Пытаемся извлечь структурированные части
            const sections = {
                explanation: '',
                document_text: '',
                discussion_points: []
            };
            
            const lines = response.split('\n');
            let currentSection = null;
            
            for (const line of lines) {
                if (line.toLowerCase().includes('краткое пояснение') || 
                    line.toLowerCase().includes('пояснение') ||
                    line.toLowerCase().includes('назначение')) {
                    currentSection = 'explanation';
                    continue;
                } else if (line.toLowerCase().includes('черновик документа') ||
                          line.toLowerCase().includes('полный текст') ||
                          line.toLowerCase().includes('текст документа')) {
                    currentSection = 'document_text';
                    continue;
                } else if (line.toLowerCase().includes('ключевые пункты') ||
                          line.toLowerCase().includes('обсуждение с юристом') ||
                          line.toLowerCase().includes('спорные моменты')) {
                    currentSection = 'discussion_points';
                    continue;
                }
                
                if (currentSection === 'explanation' && line.trim()) {
                    sections.explanation += line + '\n';
                } else if (currentSection === 'document_text') {
                    sections.document_text += line + '\n';
                } else if (currentSection === 'discussion_points') {
                    if (line.trim() && (line.includes('•') || line.includes('-') || line.match(/\d+\./))) {
                        sections.discussion_points.push(line.replace(/^[•\-]\s*/, '').replace(/^\d+\.\s*/, '').trim());
                    }
                }
            }
            
            // Если не удалось распарсить структурированно, используем весь текст как документ
            if (!sections.document_text || sections.document_text.length < 100) {
                sections.document_text = response;
                sections.explanation = "Документ сгенерирован на основе предоставленных данных.";
                sections.discussion_points = [
                    "Проверьте все финансовые условия и расчеты",
                    "Убедитесь в соответствии местному законодательству",
                    "Обсудите механизм разрешения споров",
                    "Проверьте условия выхода участников"
                ];
            }
            
            // Очистка и форматирование
            sections.document_text = this.cleanLegalText(sections.document_text);
            
            return {
                metadata: {
                    document_type: docType,
                    generation_date: new Date().toISOString(),
                    data_source: 'gigachat_ai',
                    version: '1.0'
                },
                explanation: sections.explanation.trim(),
                document_text: sections.document_text.trim(),
                discussion_points: sections.discussion_points.slice(0, 5),
                placeholder_check: this.checkPlaceholders(sections.document_text),
                estimated_length: {
                    characters: sections.document_text.length,
                    words: sections.document_text.split(/\s+/).length,
                    paragraphs: sections.document_text.split(/\n\s*\n/).length
                }
            };
            
        } catch (error) {
            console.error('Ошибка парсинга юридического документа:', error);
            
            // Fallback: возвращаем весь текст как документ
            return {
                metadata: {
                    document_type: docType,
                    generation_date: new Date().toISOString(),
                    data_source: 'gigachat_ai',
                    version: '1.0',
                    parse_error: true
                },
                explanation: "Документ сгенерирован на основе предоставленных данных.",
                document_text: response,
                discussion_points: [
                    "Рекомендуется тщательная проверка всех пунктов документа",
                    "Убедитесь в соответствии местному законодательству",
                    "Проверьте финансовые условия и расчеты",
                    "Обсудите механизм разрешения споров с юристом"
                ],
                placeholder_check: {
                    has_placeholders: true,
                    placeholder_count: (response.match(/\[.*?\]/g) || []).length
                }
            };
        }
    }
    
    cleanLegalText(text) {
        // Удаляем маркеры секций если они есть
        text = text.replace(/^\s*(?:КРАТКОЕ ПОЯСНЕНИЕ|ПОЛНЫЙ ТЕКСТ|КЛЮЧЕВЫЕ ПУНКТЫ)[:\-]\s*/gmi, '');
        
        // Удаляем нумерацию если она дублируется
        text = text.replace(/^\d+\.\s*\d+\./gm, (match) => {
            return match.split('.').slice(1).join('.');
        });
        
        // Очищаем пустые строки
        text = text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('\n');
        
        return text;
    }
    
    checkPlaceholders(text) {
        const placeholders = text.match(/\[(.*?)\]/g) || [];
        const uniquePlaceholders = [...new Set(placeholders)];
        
        return {
            has_placeholders: placeholders.length > 0,
            placeholder_count: placeholders.length,
            unique_placeholders: uniquePlaceholders,
            unfilled_placeholders: placeholders.filter(p => p === '[]' || p === '[ ]').length
        };
    }
    
    generateFallbackValidation() {
        return {
            completeness_score: 60,
            legal_quality_score: 60,
            missing_sections: ['Требуется проверка вручную'],
            inconsistencies: [],
            legal_risks: ['Документ требует проверки юристом'],
            recommendations: ['Обязательно проконсультируйтесь с профессиональным юристом'],
            requires_lawyer_review: true,
            overall_score: 60,
            validated_at: new Date().toISOString(),
            issues: ['Валидация через Ollama не удалась']
        };
    }
    
    // Шаблоны документов
    
    getFoundersAgreementTemplateRU() {
        return {
            name: 'Соглашение учредителей (Founders\' Agreement)',
            language: 'Русский',
            version: '1.0',
            system_prompt: `Ты — опытный юрист-консультант, специализирующийся на стартапах и венчурных сделках. Твоя задача — помочь основателю стартапа создать первый черновик юридического документа.
            
Твои ключевые компетенции:
1. Российское корпоративное право
2. Договоры между учредителями
3. Механизмы защиты долей (vesting)
4. Условия выхода участников
5. Порядок принятия решений

Будь максимально подробным и профессиональным. Включи все стандартные разделы соглашения учредителей.`,
            instructions: `Создай полное Соглашение об осуществлении прав участников ООО (Founders' Agreement) на русском языке.

Включи следующие разделы:
1. Преамбула (стороны соглашения)
2. Определения терминов
3. Доли в уставном капитале и порядок их оплаты
4. Роли и обязанности учредителей
5. Механизм вестинга (поэтапного получения долей)
6. Условия выхода участника (Good Leaver / Bad Leaver)
7. Порядок выкупа долей
8. Порядок принятия решений
9. Конфиденциальность
10. Разрешение споров
11. Применимое право
12. Заключительные положения

Используй профессиональные юридические формулировки.`,
            structure_requirements: `Документ должен содержать:
- Полные реквизиты сторон
- Даты и сроки
- Механизм расчетов стоимости долей
- Процедуры голосования
- Условия расторжения соглашения`
        };
    }
    
    getSafeAgreementTemplateEN() {
        return {
            name: 'Simple Agreement for Future Equity (SAFE)',
            language: 'English',
            version: '1.0',
            system_prompt: `You are an experienced startup lawyer specializing in venture capital deals. Your task is to help a startup founder create a first draft of a SAFE agreement based on Y Combinator's standard template.

Your key competencies:
1. US startup financing instruments
2. SAFE agreements (Post-Money, Cap, Discount variants)
3. Venture capital term sheets
4. Delaware corporate law
5. Convertible note mechanics

Be thorough and professional. Include all standard SAFE provisions.`,
            instructions: `Create a complete Simple Agreement for Future Equity (SAFE) - Post-Money, Cap, no Discount version based on Y Combinator's standard template.

Include the following sections:
1. Preamble and Parties
2. Definitions
3. Investment Amount
4. Valuation Cap
5. Pro Rata Rights
6. Conversion Mechanics
7. Qualified Financing
8. Corporate Events
9. Representations and Warranties
10. Miscellaneous Provisions
11. Governing Law
12. Signature Blocks

Use professional legal language and standard SAFE terminology.`,
            structure_requirements: `The document must include:
- Complete party information
- Clear valuation cap mechanism
- Pro rata rights provisions
- Conversion triggers and mechanics
- Governing law (Delaware preferred)
- Standard representations`
        };
    }
    
    getTermSheetTemplateRU() {
        return {
            name: 'Терм-шит (Term Sheet) для инвестиционного раунда',
            language: 'Русский',
            version: '1.0',
            system_prompt: `Ты — опытный юрист по венчурным сделкам. Твоя задача — создать инвестиционный меморандум (Term Sheet) для раунда финансирования.

Твои ключевые компетенции:
1. Структурирование инвестиционных раундов
2. Привилегированные акции и их права
3. Ликвидационные предпочтения
4. Права инвесторов (veto rights)
5. Опционные программы (ESOP)

Будь конкретным и профессиональным. Включи все ключевые условия инвестиционной сделки.`,
            instructions: `Создай детальный Краткий инвестиционный меморандум (Term Sheet) для раунда финансирования Series A.

Включи следующие разделы:
1. Основные условия сделки (сводная таблица)
2. Ценные бумаги и их тип
3. Пред-денежная и пост-денежная оценка
4. Ликвидационные предпочтения
5. Право вето инвестора (Protective Provisions)
6. Опционная программа (ESOP)
7. Права инвесторов (Information Rights, Registration Rights)
8. Право преимущественной покупки (ROFR)
9. Право совместной продажи (Tag-along)
10. Блокировка перепродажи (Lock-up)
11. Срок действия оферты
12. Условия закрытия сделки
13. Расходы и комиссии

Используй стандартную структуру терм-шита.`,
            structure_requirements: `Документ должен содержать:
- Сводную таблицу с основными условиями
- Clear definitions of security type
- Specific investor rights and protections
- ESOP pool size and mechanics
- Governing law provisions`
        };
    }
    
    getShareholdersAgreementTemplateRU() {
        return {
            name: 'Соглашение акционеров (Shareholders Agreement)',
            language: 'Русский',
            version: '1.0',
            system_prompt: `Ты — опытный юрист по корпоративному праву. Твоя задача — создать Соглашение акционеров для компании после привлечения инвестиций.

Твои ключевые компетенции:
1. Корпоративные договоры (SHA)
2. Права акционеров
3. Управление через Совет директоров
4. Защита миноритарных акционеров
5. Механизмы выхода

Будь максимально детальным и предусмотри все возможные сценарии.`,
            instructions: `Создай полное Соглашение акционеров (Shareholders Agreement) для Акционерного Общества.

Включи следующие разделы:
1. Преамбула и стороны
2. Определения
3. Цели и принципы соглашения
4. Состав Совета директоров и порядок избрания
5. Порядок принятия ключевых решений
6. Права и обязанности акционеров
7. Право преимущественной покупки (ROFR)
8. Право совместной продажи (Tag-Along)
9. Право на информацию (Information Rights)
10. Блокировка перепродажи (Lock-up)
11. Механизмы разрешения споров
12. Выход из соглашения
13. Заключительные положения

Используй профессиональные юридические формулировки.`,
            structure_requirements: `Документ должен содержать:
- Complete shareholder information
- Board composition specifics
- Decision-making thresholds
- Detailed transfer restrictions
- Dispute resolution mechanisms`
        };
    }
    
    getSaaSAgreementTemplateEN() {
        return {
            name: 'Master Subscription Agreement (SaaS Terms)',
            language: 'English',
            version: '1.0',
            system_prompt: `You are an experienced technology lawyer specializing in SaaS agreements. Your task is to create a comprehensive Master Subscription Agreement.

Your key competencies:
1. SaaS licensing and subscription models
2. Data protection and privacy (GDPR, CCPA)
3. Service level agreements (SLAs)
4. Limitation of liability in software contracts
5. Intellectual property in cloud services

Be thorough and include all necessary provisions for a B2B SaaS agreement.`,
            instructions: `Create a complete Master Subscription Agreement (MSA) / SaaS Terms of Service for a B2B software company.

Include the following sections:
1. Definitions
2. Grant of License
3. Subscription Terms and Fees
4. Payment Terms
5. Customer Data and Security
6. Intellectual Property Rights
7. Warranties and Disclaimers
8. Limitation of Liability
9. Indemnification
10. Term and Termination
11. Confidentiality
12. Data Protection and Privacy
13. Acceptable Use Policy
14. General Provisions
15. Governing Law and Jurisdiction

Use professional legal language suitable for enterprise customers.`,
            structure_requirements: `The document must include:
- Clear license grant (non-exclusive, non-transferable)
- Detailed subscription plans and pricing
- Strong data protection clauses
- Appropriate limitation of liability
- Comprehensive acceptable use policy`
        };
    }
    
    getAllTemplates() {
        return this.templates;
    }
    
    getValidationRules() {
        return this.validationRules;
    }
}

// Инициализация LegalDocumentGenerator ПОСЛЕ определения класса
const legalDocumentGenerator = new LegalDocumentGenerator();

// ============================================
// AUTHENTICATION MIDDLEWARE (ИСПРАВЛЕННЫЙ)
// ============================================

const authenticateToken = (req, res, next) => {
    const publicRoutes = [
        '/api/health',
        '/api/auth/login',
        '/api/auth/register',
        '/api/test-gigachat',
        '/',
        '/api/unitmaster-pro/metrics',
        '/api/test-gigachat-simple',
        '/api/status',
        '/api/check'
    ];
    
    if (publicRoutes.includes(req.path)) {
        return next();
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            error: 'Требуется авторизация' 
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('❌ Ошибка проверки токена:', err.message);
            
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    success: false, 
                    error: 'Токен истек. Пожалуйста, войдите снова.',
                    code: 'TOKEN_EXPIRED'
                });
            }
            
            if (err.name === 'JsonWebTokenError') {
                return res.status(403).json({ 
                    success: false, 
                    error: 'Неверный токен. Пожалуйста, войдите снова.',
                    code: 'INVALID_TOKEN'
                });
            }
            
            return res.status(403).json({ 
                success: false, 
                error: 'Не удалось проверить токен',
                code: 'TOKEN_VERIFICATION_FAILED'
            });
        }
        
        req.user = user;
        next();
    });
};


// ============================================
// API ENDPOINTS
// ============================================

// 1. Health check
app.get('/api/health', async (req, res) => {
    try {
        const supabaseStatus = await getSupabaseStatus();
        
        const gigaChatStatus = process.env.GIGACHAT_API_KEY ? 'configured' : 'not_configured';
        const ollamaStatus = ollamaValidator.isAvailable ? 'available' : 'not_available';
        
        res.json({
            success: true,
            platform: 'Strategix AI Pro v8.0.0',
            status: 'online',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            port: PORT,
            services: {
                giga_chat: gigaChatStatus,
                supabase: supabaseStatus ? 'connected' : 'not_connected',
                ollama: ollamaStatus,
                env_file: envLoaded ? 'loaded' : 'not_loaded'
            },
            server_info: {
                node_version: process.version,
                uptime: process.uptime()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Health check failed: ' + error.message
        });
    }
});

// Диагностика GigaChat
app.get('/api/debug/gigachat', async (req, res) => {
    try {
        console.log('🔧 Подробная диагностика GigaChat...');
        
        // 1. Проверяем .env ключ
        const envKey = process.env.GIGACHAT_API_KEY;
        const hasEnvKey = !!envKey;
        
        // 2. Декодируем ключ
        let decodedKey = '';
        let clientId = '';
        let clientSecret = '';
        
        if (hasEnvKey) {
            try {
                decodedKey = Buffer.from(envKey, 'base64').toString('utf-8');
                const parts = decodedKey.split(':');
                if (parts.length >= 2) {
                    clientId = parts[0];
                    clientSecret = parts[1].substring(0, 8) + '...';
                }
            } catch (e) {
                decodedKey = 'Ошибка декодирования: ' + e.message;
            }
        }
        
        // 3. Пробуем получить токен
        let tokenInfo = { success: false, error: '' };
        try {
            const token = await getGigaChatTokenReal();
            tokenInfo = {
                success: true,
                hasToken: !!token && token.length > 100,
                tokenLength: token?.length || 0,
                isDummy: token?.includes('dummy') || false,
                preview: token ? token.substring(0, 30) + '...' : 'нет токена'
            };
        } catch (tokenError) {
            tokenInfo = {
                success: false,
                error: tokenError.message
            };
        }
        
        // 4. Пробуем сделать тестовый вызов API
        let apiTest = { success: false, status: null, error: '' };
        if (tokenInfo.success && !tokenInfo.isDummy) {
            try {
                const testResponse = await axios({
                    method: 'POST',
                    url: 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${await getGigaChatTokenReal()}`
                    },
                    data: {
                        model: 'GigaChat',
                        messages: [{ role: 'user', content: 'Тест' }],
                        max_tokens: 10
                    },
                    httpsAgent: httpsAgent,
                    timeout: 10000,
                    validateStatus: () => true
                });
                
                apiTest = {
                    success: testResponse.status === 200,
                    status: testResponse.status,
                    data: testResponse.data
                };
            } catch (apiError) {
                apiTest = {
                    success: false,
                    status: apiError.response?.status,
                    error: apiError.message
                };
            }
        }
        
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            environment: {
                has_gigachat_key: hasEnvKey,
                env_key_length: envKey?.length || 0,
                env_key_preview: envKey ? envKey.substring(0, 30) + '...' : 'нет',
                decoded_key: decodedKey,
                client_id: clientId,
                client_secret_masked: clientSecret,
                expected_client_id: '019b25b7-1f2d-7a58-8777-d8aad417d494'
            },
            token_generation: tokenInfo,
            api_test: apiTest,
            diagnostics: {
                server_time: new Date().toISOString(),
                node_version: process.version,
                platform: process.platform
            },
            recommendations: [
                hasEnvKey ? '✅ .env файл загружен' : '❌ Нет GIGACHAT_API_KEY в .env',
                tokenInfo.success ? '✅ Токен получается' : '❌ Ошибка получения токена',
                apiTest.success ? '✅ API работает' : `❌ API ошибка: ${apiTest.status || apiTest.error}`,
                clientId === '019b25b7-1f2d-7a58-8777-d8aad417d494' ? 
                    '✅ Client ID совпадает с новым ключом' : 
                    '⚠️  Client ID не совпадает с новым ключом'
            ],
            next_steps: [
                '1. Убедитесь что в .env правильный ключ (новый из кабинета)',
                '2. Проверьте Scope в кабинете Sber: должен быть GIGACHAT_API_PERS',
                '3. Убедитесь что продукт "Активный", не "Архивный"',
                '4. Проверьте баланс токенов в кабинете',
                '5. Если 402 сохраняется - обратитесь в поддержку Sber'
            ]
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Диагностика не удалась: ' + error.message
        });
    }
});

// 2. ДЕТАЛЬНЫЙ тест GigaChat
app.get('/api/test-gigachat-detailed', async (req, res) => {
    try {
        console.log('🧪 Детальный тест GigaChat API...');
        
        // Тестовый запрос с простым сообщением
        const testMessages = [
            { 
                role: 'system', 
                content: 'Ты - помощник. Отвечай кратко.' 
            },
            { 
                role: 'user', 
                content: 'Ответь одним словом: "работает"' 
            }
        ];
        
        const response = await callGigaChatAPI(testMessages, 0.5, 10);
        
        res.json({
            success: true,
            test: 'giga_chat_api_detailed',
            response: response,
            message: 'GigaChat API работает!',
            timestamp: new Date().toISOString(),
            details: {
                key_length: process.env.GIGACHAT_API_KEY?.length || 0,
                key_preview: process.env.GIGACHAT_API_KEY ? 
                    process.env.GIGACHAT_API_KEY.substring(0, 20) + '...' : 'нет ключа'
            }
        });
    } catch (error) {
        console.error('❌ Детальный тест не пройден:', error.message);
        
        res.status(500).json({
            success: false,
            error: 'Тест не пройден: ' + error.message,
            details: error.response?.data || {},
            timestamp: new Date().toISOString()
        });
    }
});

// ============================================
// ЭНДПОИНТ ДЛЯ ПРОВЕРКИ ТОКЕНА И АНАЛИЗА
// ============================================

app.get('/api/check-gigachat-token', async (req, res) => {
    try {
        console.log('🔑 Проверка токена GigaChat...');
        
        const GIGACHAT_CREDENTIALS = process.env.GIGACHAT_API_KEY;
        
        if (!GIGACHAT_CREDENTIALS) {
            return res.json({
                success: false,
                error: 'GIGACHAT_API_KEY не найден в .env'
            });
        }
        
        // Декодируем ключ для проверки
        let decodedKey = '';
        let clientId = '';
        let clientSecret = '';
        
        try {
            decodedKey = Buffer.from(GIGACHAT_CREDENTIALS, 'base64').toString('utf-8');
            const parts = decodedKey.split(':');
            if (parts.length >= 2) {
                clientId = parts[0];
                clientSecret = parts[1].substring(0, 8) + '...';
            }
        } catch (e) {
            decodedKey = 'Ошибка декодирования: ' + e.message;
        }
        
        // Пробуем получить токен
        const RqUID = uuidv4();
        let tokenResponse = null;
        
        try {
            const response = await axios({
                method: 'post',
                url: 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
                data: 'scope=GIGACHAT_API_PERS',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                    'Authorization': `Basic ${GIGACHAT_CREDENTIALS}`,
                    'RqUID': RqUID
                },
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false,
                    keepAlive: true,
                    timeout: 30000
                }),
                timeout: 40000,
                validateStatus: () => true
            });
            
            tokenResponse = {
                status: response.status,
                has_token: !!response.data?.access_token,
                token_length: response.data?.access_token?.length || 0,
                expires_at: response.data?.expires_at ? 
                    new Date(response.data.expires_at).toLocaleString() : 'не указано',
                raw_response: response.data
            };
            
        } catch (error) {
            tokenResponse = {
                error: error.message,
                status: error.response?.status
            };
        }
        
        // Проверяем какой у нас Client ID
        const isNewKey = clientId === '019b25b7-1f2d-7a58-8777-d8aad417d494';
        
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            env_check: {
                has_key: !!GIGACHAT_CREDENTIALS,
                key_length: GIGACHAT_CREDENTIALS.length,
                key_preview: GIGACHAT_CREDENTIALS.substring(0, 30) + '...',
                decoded_key: decodedKey,
                client_id: clientId,
                client_secret_preview: clientSecret,
                is_new_key: isNewKey,
                expected_client_id: '019b25b7-1f2d-7a58-8777-d8aad417d494'
            },
            token_response: tokenResponse,
            analysis: {
                is_using_old_key: !isNewKey,
                old_key_client_id: '019b3d95-9967-7ae2-9147-384facf543dc',
                new_key_client_id: '019b25b7-1f2d-7a58-8777-d8aad417d494',
                recommendation: isNewKey ? 
                    '✅ Используется новый ключ' : 
                    '❌ Используется СТАРЫЙ ключ. Замените GIGACHAT_API_KEY в .env'
            },
            steps_to_fix: [
                '1. Откройте файл .env в папке проекта',
                '2. Найдите строку GIGACHAT_API_KEY=',
                '3. Замените значение на: MDE5YjI1YjctMWYyZC03YTU4LTg3NzctZDhhYWQ0MTdkNDk0OjFlMjUwMTY0LTIxN2UtNDVkMi1iOTgzLTY2ZjNmODExZWQ2NA==',
                '4. Сохраните файл',
                '5. Перезапустите сервер: npm start'
            ]
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Ошибка проверки: ' + error.message
        });
    }
});

// ============================================
// ЭНДПОИНТ ДЛЯ ТЕСТА API
// ============================================

app.get('/api/test-gigachat-full', async (req, res) => {
    try {
        console.log('🧪 Полный тест GigaChat API...');
        
        // Шаг 1: Получаем токен
        const GIGACHAT_CREDENTIALS = process.env.GIGACHAT_API_KEY;
        const decodedKey = Buffer.from(GIGACHAT_CREDENTIALS, 'base64').toString('utf-8');
        const [clientId, clientSecret] = decodedKey.split(':');
        
        const tokenResponse = await axios({
            method: 'post',
            url: 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
            data: 'scope=GIGACHAT_API_PERS',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'Authorization': `Basic ${GIGACHAT_CREDENTIALS}`,
                'RqUID': uuidv4()
            },
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            }),
            timeout: 30000,
            validateStatus: () => true
        });
        
        const token = tokenResponse.data?.access_token;
        
        if (!token) {
            return res.json({
                success: false,
                step: 'token_generation',
                status: tokenResponse.status,
                data: tokenResponse.data,
                error: 'Не удалось получить токен'
            });
        }
        
        // Шаг 2: Пробуем разные варианты вызова API
        const testCases = [
            {
                name: 'Базовый вызов',
                url: 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                data: {
                    model: 'GigaChat',
                    messages: [{ role: 'user', content: 'Привет' }],
                    max_tokens: 10
                }
            },
            {
                name: 'С X-Client-ID',
                url: 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Client-ID': clientId
                },
                data: {
                    model: 'GigaChat',
                    messages: [{ role: 'user', content: 'Тест' }],
                    max_tokens: 10
                }
            },
            {
                name: 'С полными параметрами',
                url: 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Client-ID': clientId,
                    'X-Request-ID': uuidv4()
                },
                data: {
                    model: 'GigaChat',
                    messages: [{ role: 'user', content: 'Ответь "OK"' }],
                    temperature: 0.5,
                    max_tokens: 5,
                    stream: false
                }
            }
        ];
        
        const results = [];
        
        for (const testCase of testCases) {
            try {
                const response = await axios({
                    method: 'POST',
                    url: testCase.url,
                    headers: testCase.headers,
                    data: testCase.data,
                    httpsAgent: new https.Agent({
                        rejectUnauthorized: false
                    }),
                    timeout: 10000,
                    validateStatus: () => true
                });
                
                results.push({
                    name: testCase.name,
                    success: response.status === 200,
                    status: response.status,
                    has_content: !!response.data?.choices?.[0]?.message?.content,
                    content: response.data?.choices?.[0]?.message?.content,
                    error: response.status !== 200 ? response.data : null
                });
            } catch (error) {
                results.push({
                    name: testCase.name,
                    success: false,
                    error: error.message,
                    status: error.response?.status
                });
            }
        }
        
        // Анализируем результаты
        const successfulTest = results.find(r => r.success);
        
        res.json({
            success: !!successfulTest,
            timestamp: new Date().toISOString(),
            token_info: {
                received: true,
                length: token.length,
                expires_at: tokenResponse.data?.expires_at ? 
                    new Date(tokenResponse.data.expires_at).toLocaleString() : 'не указано'
            },
            client_info: {
                id: clientId,
                secret_preview: clientSecret.substring(0, 8) + '...',
                is_new_key: clientId === '019b25b7-1f2d-7a58-8777-d8aad417d494'
            },
            test_results: results,
            summary: successfulTest ? 
                `✅ GigaChat API работает! Используйте вариант: ${successfulTest.name}` :
                `❌ Все тесты не прошли. Статусы: ${results.map(r => `${r.name}: ${r.status}`).join(', ')}`,
            recommendations: successfulTest ? [] : [
                '1. Проверьте Scope в кабинете Sber: должен быть GIGACHAT_API_PERS',
                '2. Убедитесь что продукт "Активный"',
                '3. Проверьте баланс токенов в кабинете',
                '4. Обратитесь в поддержку Sber с Client ID: ' + clientId
            ]
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Тест не удался: ' + error.message
        });
    }
});

// 3. Полный тест GigaChat
app.get('/api/test-gigachat', async (req, res) => {
    try {
        const response = await callGigaChatAPI([
            { role: 'system', content: 'Ответь коротко, что API работает.' },
            { role: 'user', content: 'Привет, протестируй соединение' }
        ], 0.5, 50);
        
        res.json({
            success: true,
            test: 'giga_chat_api',
            result: response,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Тест не пройден: ' + error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// 4. AI Business Chat Expert с кросс-валидацией
app.post('/api/ai-chat/expert', authenticateToken, async (req, res) => {
    try {
        const { message, mode, business_type, user_id, cross_validate = true } = req.body;
        
        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Сообщение обязательно'
            });
        }
        
        const userId = user_id || req.user?.id || 'anonymous-' + uuidv4();
        
        let result;
        if (cross_validate) {
            result = await businessChatExpert.processWithCrossValidation(
                userId, 
                message, 
                mode, 
                business_type
            );
        } else {
            result = await businessChatExpert.processMessage(
                userId, 
                message, 
                mode, 
                business_type
            );
        }
        
        res.json({
            success: true,
            ...result,
            user_id: userId
        });
    } catch (error) {
        console.error('❌ Ошибка AI Chat:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка AI Chat: ' + error.message
        });
    }
});

// 5. Получение быстрых действий для чата
app.get('/api/ai-chat/quick-actions', authenticateToken, (req, res) => {
    try {
        const quickActions = businessChatExpert.getQuickActions();
        const expertModes = businessChatExpert.getExpertModes();
        
        res.json({
            success: true,
            quick_actions: quickActions,
            expert_modes: expertModes
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Ошибка получения быстрых действий: ' + error.message
        });
    }
});

// 6. UnitMaster Pro анализ
app.post('/api/unitmaster-pro/analyze', authenticateToken, async (req, res) => {
    try {
        const { business_description, business_type, verification_level, custom_metrics } = req.body;
        
        if (!business_description) {
            return res.status(400).json({
                success: false,
                error: 'Описание бизнеса обязательно'
            });
        }
        
        const result = await unitMasterCalculator.analyze(
            business_description, 
            business_type, 
            verification_level || 'full',
            custom_metrics || []
        );
        
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('❌ Ошибка UnitMaster анализа:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка анализа: ' + error.message
        });
    }
});

// 7. Получение метрик UnitMaster
app.get('/api/unitmaster-pro/metrics', (req, res) => {
    try {
        const metrics = unitMasterCalculator.getMetrics();
        const benchmarks = unitMasterCalculator.getIndustryBenchmarks();
        
        res.json({
            success: true,
            metrics: metrics,
            industry_benchmarks: benchmarks
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Ошибка получения метрик: ' + error.message
        });
    }
});

// 8. Генерация бизнес-идей
app.post('/api/ideas/generate', authenticateToken, async (req, res) => {
    try {
        const { responses } = req.body;
        
        if (!responses || typeof responses !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'Ответы пользователя обязательны'
            });
        }
        
        const result = await ideaGenerator.generateIdeas(responses);
        
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('❌ Ошибка генерации идей:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка генерации идей: ' + error.message
        });
    }
});

// 9. Получение анкеты для генерации идей
app.get('/api/ideas/questionnaire', authenticateToken, (req, res) => {
    try {
        const questionnaire = ideaGenerator.getQuestionnaire();
        const businessTypes = ideaGenerator.getBusinessTypes();
        const entrepreneurTypes = ideaGenerator.getEntrepreneurTypes();
        
        res.json({
            success: true,
            questionnaire: questionnaire,
            business_types: businessTypes,
            entrepreneur_types: entrepreneurTypes
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Ошибка получения анкеты: ' + error.message
        });
    }
});

// 10. Аутентификация - Логин (ОБНОВЛЕННЫЙ)
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email и пароль обязательны'
            });
        }
        
        // Тестовый пользователь (для разработки)
        if (email === 'test@strategix.ai' && password === 'password123') {
            console.log('🔐 Тестовый вход...');
            
            const userId = uuidv4();
            const token = jwt.sign(
                { 
                    id: userId, 
                    email: email,
                    name: 'Тестовый Пользователь',
                    is_admin: true,
                    is_verified: true,
                    subscription: 'pro',
                    features: {
                        ai_chat: true,
                        idea_generator: true,
                        unit_master: true,
                        todo_manager: true,
                        document_generator: true,
                        export: true
                    }
                },
                JWT_SECRET,
                { expiresIn: '12h' }
            );
            
            const refreshToken = jwt.sign(
                {
                    id: userId,
                    email: email,
                    type: 'refresh'
                },
                JWT_REFRESH_SECRET,
                { expiresIn: '7d' }
            );
            
            return res.json({
                success: true,
                token: token,
                refresh_token: refreshToken,
                user: {
                    id: userId,
                    email: email,
                    name: 'Тестовый Пользователь',
                    is_admin: true,
                    is_verified: true,
                    subscription: 'pro',
                    features: getFeaturesBySubscription('pro')
                },
                message: 'Успешный вход (тестовый режим)',
                token_expires_in: '12h',
                refresh_token_expires_in: '7d'
            });
        }
        
        // Реальная проверка через Supabase
        console.log(`🔐 Попытка входа для: ${email}`);
        
        // Проверяем подключение к Supabase
        const isSupabaseConnected = await getSupabaseStatus();
        if (!isSupabaseConnected) {
            return res.status(503).json({
                success: false,
                error: 'База данных временно недоступна. Используйте тестовый аккаунт.',
                test_credentials: {
                    email: 'test@strategix.ai',
                    password: 'password123'
                }
            });
        }
        
        // Ищем пользователя
        const user = await supabaseService.getUserByEmail(email);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Пользователь не найден'
            });
        }
        
        // Проверяем пароль
        const isValidPassword = await supabaseService.verifyUserPassword(user.id, password);
        
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Неверный пароль'
            });
        }
        
        // Обновляем время последнего входа
        await supabaseService.updateUser(user.id, {
            last_login: new Date().toISOString()
        });
        
        // Создаем JWT токены
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email,
                name: user.name,
                is_admin: user.is_admin || false,
                is_verified: user.is_verified || false,
                subscription: user.subscription || 'free'
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN || '12h' }
        );
        
        const refreshToken = jwt.sign(
            {
                id: user.id,
                email: user.email,
                type: 'refresh'
            },
            JWT_REFRESH_SECRET,
            { expiresIn: JWT_REFRESH_EXPIRES_IN || '7d' }
        );
        
        const features = getFeaturesBySubscription(user.subscription || 'free');
        
        console.log(`✅ Успешный вход пользователя: ${user.email}`);
        
        return res.json({
            success: true,
            token: token,
            refresh_token: refreshToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                is_admin: user.is_admin || false,
                is_verified: user.is_verified || false,
                subscription: user.subscription || 'free',
                features: features
            },
            message: 'Успешный вход',
            token_expires_in: JWT_EXPIRES_IN || '12h',
            refresh_token_expires_in: JWT_REFRESH_EXPIRES_IN || '7d'
        });
        
    } catch (error) {
        console.error('❌ Ошибка входа:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка входа: ' + error.message,
            test_credentials: {
                email: 'test@strategix.ai',
                password: 'password123'
            }
        });
    }
});

// 11. Обновление токена
app.post('/api/auth/refresh', async (req, res) => {
    try {
        const { refresh_token } = req.body;
        
        if (!refresh_token) {
            return res.status(400).json({
                success: false,
                error: 'Refresh токен обязателен'
            });
        }
        
        jwt.verify(refresh_token, JWT_SECRET + '-refresh', (err, userData) => {
            if (err) {
                return res.status(403).json({
                    success: false,
                    error: 'Неверный refresh токен'
                });
            }
            
            if (userData.type !== 'refresh') {
                return res.status(403).json({
                    success: false,
                    error: 'Неверный тип токена'
                });
            }
            
            // Создаем новый access токен
            const newToken = jwt.sign(
                { 
                    id: userData.id, 
                    email: userData.email,
                    name: userData.name || 'Пользователь',
                    is_admin: userData.is_admin || false,
                    is_verified: userData.is_verified || false,
                    subscription: userData.subscription || 'free'
                },
                JWT_SECRET,
                { expiresIn: '12h' }
            );
            
            res.json({
                success: true,
                token: newToken,
                token_expires_in: '12h'
            });
        });
    } catch (error) {
        console.error('❌ Ошибка обновления токена:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка обновления токена: ' + error.message
        });
    }
});

function getFeaturesBySubscription(subscription) {
    const features = {
        free: {
            ai_chat: { limit: 3, used: 0 },
            idea_generator: { limit: 1, used: 0 },
            unit_master: { limit: 1, used: 0 },
            document_generator: { limit: 1, used: 0 },
            export: { formats: ['txt'] }
        },
        pro: {
            ai_chat: { limit: 'unlimited', used: 0 },
            idea_generator: { limit: 'unlimited', used: 0 },
            unit_master: { limit: 'unlimited', used: 0 },
            document_generator: { limit: 'unlimited', used: 0 },
            export: { formats: ['excel', 'pdf', 'pptx', 'txt'] }
        },
        enterprise: {
            ai_chat: { limit: 'unlimited', used: 0 },
            idea_generator: { limit: 'unlimited', used: 0 },
            unit_master: { limit: 'unlimited', used: 0 },
            document_generator: { limit: 'unlimited', used: 0 },
            export: { formats: ['excel', 'pdf', 'pptx', 'txt', 'json'] },
            team: { limit: 10, used: 0 },
            api_access: true
        }
    };
    
    return features[subscription] || features.free;
}

// 12. Проверка токена
app.get('/api/auth/verify', authenticateToken, (req, res) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Токен не предоставлен'
            });
        }
        
        const decoded = jwt.decode(token);
        const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : null;
        const timeLeft = expiresAt ? Math.max(0, expiresAt - Date.now()) : 0;
        
        res.json({
            success: true,
            user: req.user,
            valid: true,
            token_info: {
                expires_at: expiresAt?.toISOString(),
                expires_in_minutes: Math.floor(timeLeft / (1000 * 60)),
                token_type: 'Bearer',
                expires_soon: timeLeft < 3600000
            }
        });
    } catch (error) {
        console.error('❌ Ошибка проверки токена:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка проверки токена: ' + error.message
        });
    }
});

// 11. РЕАЛЬНАЯ РЕГИСТРАЦИЯ - ИСПРАВЛЕННАЯ ВЕРСИЯ
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        
        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                error: 'Email, пароль и имя обязательны'
            });
        }
        
        // 🔴 ПРОВЕРКА ПОДКЛЮЧЕНИЯ К SUPABASE
        const isSupabaseConnected = await getSupabaseStatus();
        if (!isSupabaseConnected) {
            console.error('❌ Supabase не подключен!');
            return res.status(503).json({
                success: false,
                error: 'База данных недоступна'
            });
        }
        
        console.log(`🛠 РЕАЛЬНАЯ регистрация: ${email}`);
        
        // 🔴 ИСПОЛЬЗУЕМ НОВУЮ ФУНКЦИЮ createUserDirect
        const newUser = await supabaseService.createUserDirect({
            email: email,
            password: password,
            name: name,
            subscription: 'free' // или 'pro' если нужно
        });
        
        // 🔴 СОЗДАЕМ РЕАЛЬНЫЕ JWT ТОКЕНЫ
        const token = jwt.sign(
            { 
                id: newUser.id, 
                email: newUser.email,
                name: newUser.name,
                subscription: newUser.subscription,
                is_verified: newUser.is_verified
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        const refreshToken = jwt.sign(
            { id: newUser.id, type: 'refresh' },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );
        
        console.log(`✅ РЕАЛЬНЫЙ пользователь создан: ${newUser.email}`);
        
        res.json({
            success: true,
            token: token,
            refresh_token: refreshToken,
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                subscription: newUser.subscription,
                is_verified: newUser.is_verified
            },
            message: 'Регистрация успешна!'
        });
        
    } catch (error) {
        console.error('❌ РЕАЛЬНАЯ ошибка регистрации:', error.message);
        
        // 🔴 ДЕТАЛЬНАЯ ОБРАБОТКА ОШИБОК
        let errorMessage = error.message;
        if (error.message.includes('User already registered')) {
            errorMessage = 'Пользователь с таким email уже существует';
        }
        if (error.message.includes('Password should be at least')) {
            errorMessage = 'Пароль должен быть не менее 6 символов';
        }
        if (error.message.includes('Invalid email')) {
            errorMessage = 'Неверный формат email';
        }
        
        res.status(500).json({
            success: false,
            error: `Ошибка регистрации: ${errorMessage}`,
            details: error.message
        });
    }
});

// 12. Обновление токена (ОБНОВЛЕННЫЙ)
app.post('/api/auth/refresh', async (req, res) => {
    try {
        const { refresh_token } = req.body;
        
        if (!refresh_token) {
            return res.status(400).json({
                success: false,
                error: 'Refresh токен обязателен'
            });
        }
        
        jwt.verify(refresh_token, JWT_REFRESH_SECRET, (err, userData) => {
            if (err) {
                return res.status(403).json({
                    success: false,
                    error: 'Неверный или истекший refresh токен'
                });
            }
            
            if (userData.type !== 'refresh') {
                return res.status(403).json({
                    success: false,
                    error: 'Неверный тип токена'
                });
            }
            
            // Создаем новый access токен
            const newToken = jwt.sign(
                { 
                    id: userData.id, 
                    email: userData.email,
                    name: userData.name || 'Пользователь',
                    is_admin: userData.is_admin || false,
                    is_verified: userData.is_verified || false,
                    subscription: userData.subscription || 'free'
                },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN || '12h' }
            );
            
            res.json({
                success: true,
                token: newToken,
                token_expires_in: JWT_EXPIRES_IN || '12h'
            });
        });
    } catch (error) {
        console.error('❌ Ошибка обновления токена:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка обновления токена: ' + error.message
        });
    }
});

// 13. Верификация email
app.post('/api/auth/verify-email', async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Токен верификации обязателен'
            });
        }
        
        const isSupabaseConnected = await getSupabaseStatus();
        if (!isSupabaseConnected) {
            return res.status(503).json({
                success: false,
                error: 'База данных временно недоступна'
            });
        }
        
        console.log(`📧 Верификация email с токеном: ${token.substring(0, 20)}...`);
        
        // Ищем пользователя с таким токеном
        // (Это упрощенная версия - в реальном приложении нужно добавить поле verification_token в таблицу users)
        
        // Временно возвращаем успех для тестирования
        res.json({
            success: true,
            message: 'Email успешно подтвержден (режим тестирования)'
        });
        
    } catch (error) {
        console.error('❌ Ошибка верификации:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка верификации: ' + error.message
        });
    }
});

// 14. Экспорт в Excel (СТАРЫЙ - нужно заменить или удалить)
app.post('/api/export/excel', authenticateToken, async (req, res) => {
    try {
        const { data, export_type } = req.body;
        
        if (!data) {
            return res.status(400).json({
                success: false,
                error: 'Данные для экспорта обязательны'
            });
        }
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Данные');
        
        // Добавляем заголовки
        worksheet.columns = [
            { header: 'Показатель', width: 30 },
            { header: 'Значение', width: 20 },
            { header: 'Единица', width: 15 }
        ];
        
        if (data.calculated_metrics) {
            Object.entries(data.calculated_metrics).forEach(([key, metric]) => {
                worksheet.addRow([
                    metric.name || key,
                    metric.value,
                    metric.unit || '-'
                ]);
            });
        }
        
        const timestamp = Date.now();
        const filename = `export_${timestamp}.xlsx`;
        const filepath = path.join(__dirname, 'exports', filename);
        
        await workbook.xlsx.writeFile(filepath);
        
        res.download(filepath, filename, (err) => {
            if (err) {
                console.error('❌ Ошибка отправки файла:', err);
            }
            
            setTimeout(() => {
                fs.unlink(filepath, () => {});
            }, 10000);
        });
    } catch (error) {
        console.error('❌ Ошибка экспорта в Excel:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка экспорта: ' + error.message
        });
    }
});

// 15. Экспорт в PDF (СТАРЫЙ - нужно заменить или удалить)
app.post('/api/export/pdf', authenticateToken, async (req, res) => {
    try {
        const { data, doc_type, subtype } = req.body;
        
        if (!data || !doc_type) {
            return res.status(400).json({
                success: false,
                error: 'Данные и тип документа обязательны'
            });
        }
        
        const timestamp = Date.now();
        const filename = `document_${timestamp}.pdf`;
        const filepath = path.join(__dirname, 'exports', filename);
        
        const doc = new PDFDocument({
            margin: 50,
            size: 'A4',
            bufferPages: true
        });
        
        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);
        
        const titles = {
            'business_plan': 'БИЗНЕС-ПЛАН',
            'pitch_deck': 'PITCH DECK - ПРЕЗЕНТАЦИЯ ДЛЯ ИНВЕСТОРОВ',
            'marketing_strategy': 'МАРКЕТИНГОВАЯ СТРАТЕГИЯ'
        };
        
        const title = titles[doc_type] || 'ДОКУМЕНТ';
        
        doc.font('Helvetica-Bold')
           .fontSize(20)
           .fillColor('#2E75B6')
           .text(title, { align: 'center' });
        
        doc.moveDown();
        
        doc.font('Helvetica')
           .fontSize(10)
           .fillColor('#666666')
           .text(`Дата создания: ${new Date().toLocaleDateString('ru-RU')}`, {
               align: 'center'
           });
        
        doc.moveDown(2);
        
        if (data.content) {
            doc.fontSize(11)
               .fillColor('#333333')
               .text(data.content, {
                   align: 'justify',
                   lineGap: 3
               });
        }
        
        const range = doc.bufferedPageRange();
        for (let i = 0; i < range.count; i++) {
            doc.switchToPage(i);
            
            doc.fontSize(10)
               .fillColor('#666666')
               .text(
                   `Страница ${i + 1} из ${range.count}`,
                   doc.page.width - 100,
                   doc.page.height - 50,
                   { align: 'center' }
               );
        }
        
        doc.end();
        
        stream.on('finish', () => {
            res.download(filepath, filename, (err) => {
                if (err) {
                    console.error('❌ Ошибка отправки файла:', err);
                }
                
                setTimeout(() => {
                    fs.unlink(filepath, () => {});
                }, 10000);
            });
        });
        
        stream.on('error', (error) => {
            console.error('❌ Ошибка создания PDF:', error);
            res.status(500).json({
                success: false,
                error: 'Ошибка создания PDF: ' + error.message
            });
        });
        
    } catch (error) {
        console.error('❌ Ошибка экспорта в PDF:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка экспорта: ' + error.message
        });
    }
});

// 16. Экспорт Pitch Deck в PPTX (СТАРЫЙ - нужно заменить или удалить)
app.post('/api/export/pptx', authenticateToken, async (req, res) => {
    try {
        const { data, deck_type } = req.body;
        
        if (!data) {
            return res.status(400).json({
                success: false,
                error: 'Данные для презентации обязательны'
            });
        }
        
        const timestamp = Date.now();
        const filename = `pitch_deck_${timestamp}.pptx`;
        const filepath = path.join(__dirname, 'exports', filename);
        
        const pres = new PptxGenJS();
        
        pres.layout = 'LAYOUT_WIDE';
        
        pres.defineSlideMaster({
            title: 'MASTER_SLIDE',
            background: { color: 'FFFFFF' },
            objects: [
                { 
                    rect: { 
                        x: 0.0, y: 0.0, w: '100%', h: 0.6, 
                        fill: { color: '2E75B6' } 
                    } 
                },
                {
                    text: {
                        text: 'Pitch Deck',
                        options: {
                            x: 0.5,
                            y: 0.2,
                            w: 9,
                            h: 0.4,
                            fontSize: 16,
                            color: 'FFFFFF',
                            bold: true
                        }
                    }
                }
            ]
        });
        
        const slide1 = pres.addSlide({ masterName: 'MASTER_SLIDE' });
        slide1.addText(data.title || 'Pitch Deck', {
            x: 1, y: 2, w: 8, h: 1.5,
            fontSize: 36,
            bold: true,
            color: '2E75B6',
            align: 'center'
        });
        
        await pres.writeFile({ fileName: filepath });
        
        res.download(filepath, filename, (err) => {
            if (err) {
                console.error('❌ Ошибка отправки файла:', err);
            }
            
            setTimeout(() => {
                fs.unlink(filepath, () => {});
            }, 10000);
        });
    } catch (error) {
        console.error('❌ Ошибка экспорта в PPTX:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка экспорта: ' + error.message
        });
    }
});

// 17. Проверка доступности API
app.get('/api/check', async (req, res) => {
    try {
        const supabaseStatus = await getSupabaseStatus();
        
        res.json({
            success: true,
            message: 'API доступно',
            services: {
                gigachat: true,
                supabase: supabaseStatus,
                ollama: ollamaValidator.isAvailable,
                server: true
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Ошибка проверки: ' + error.message
        });
    }
});

// 18. Профиль пользователя
app.get('/api/user/profile', authenticateToken, (req, res) => {
    try {
        const userWithFeatures = {
            ...req.user,
            features: getFeaturesBySubscription(req.user.subscription || 'free')
        };
        
        res.json({
            success: true,
            user: userWithFeatures
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Ошибка получения профиля: ' + error.message
        });
    }
});

// 19. Проверка API ключей
app.get('/api/keys/status', authenticateToken, async (req, res) => {
    try {
        const supabaseStatus = await getSupabaseStatus();
        
        res.json({
            success: true,
            keys: {
                gigachat: {
                    configured: !!process.env.GIGACHAT_API_KEY,
                    valid: true
                },
                supabase: {
                    configured: !!process.env.SUPABASE_URL && !!process.env.SUPABASE_ANON_KEY,
                    connected: supabaseStatus
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Ошибка проверки ключей: ' + error.message
        });
    }
});

// 20. Smart Heuristic Validation
app.post('/api/validate/heuristic', authenticateToken, async (req, res) => {
    try {
        const { text, context, industry } = req.body;
        
        if (!text) {
            return res.status(400).json({
                success: false,
                error: 'Текст для проверки обязателен'
            });
        }
        
        const validation = heuristicValidator.validate(text, context || 'document', industry || 'general');
        
        res.json({
            success: true,
            ...validation
        });
    } catch (error) {
        console.error('❌ Ошибка эвристической проверки:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка проверки: ' + error.message
        });
    }
});

// 21. Ollama Validation
app.post('/api/validate/ollama', authenticateToken, async (req, res) => {
    try {
        const { text, context, industry } = req.body;
        
        if (!text) {
            return res.status(400).json({
                success: false,
                error: 'Текст для проверки обязателен'
            });
        }
        
        const validation = await ollamaValidator.validateWithAI(text, context || 'document', industry || 'general');
        
        res.json({
            success: true,
            ...validation
        });
    } catch (error) {
        console.error('❌ Ошибка Ollama проверки:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка проверки: ' + error.message
        });
    }
});

// 22. Анализ текста на реалистичность
app.post('/api/analyze/realism', authenticateToken, async (req, res) => {
    try {
        const { text, context, industry } = req.body;
        
        if (!text) {
            return res.status(400).json({
                success: false,
                error: 'Текст для анализа обязателен'
            });
        }
        
        const [heuristicCheck, ollamaCheck] = await Promise.allSettled([
            heuristicValidator.validate(text, context || 'document', industry || 'general'),
            ollamaValidator.validateWithAI(text, context || 'document', industry || 'general')
        ]);
        
        const heuristicResult = heuristicCheck.status === 'fulfilled' ? heuristicCheck.value : {
            verified: false,
            confidence_score: 0,
            issues: ['Ошибка эвристической проверки'],
            summary: 'Не удалось выполнить проверку'
        };
        
        const ollamaResult = ollamaCheck.status === 'fulfilled' ? ollamaCheck.value : {
            verified: false,
            confidence_score: 0,
            issues: ['Ollama недоступен'],
            summary: 'Не удалось выполнить проверку через AI'
        };
        
        const overallConfidence = Math.round(
            (heuristicResult.confidence_score + ollamaResult.confidence_score) / 2
        );
        
        res.json({
            success: true,
            analysis: {
                heuristic: heuristicResult,
                ollama: ollamaResult,
                overall_confidence: overallConfidence,
                overall_verified: heuristicResult.verified && ollamaResult.verified,
                combined_issues: [
                    ...(heuristicResult.issues || []),
                    ...(ollamaResult.issues || [])
                ],
                combined_recommendations: [
                    ...(heuristicResult.recommendations || []),
                    ...(ollamaResult.recommendations || [])
                ]
            },
            summary: overallConfidence >= 70 ? '✅ Текст реалистичен' : 
                    overallConfidence >= 40 ? '⚠️ Текст требует доработки' : '❌ Текст нереалистичен'
        });
    } catch (error) {
        console.error('❌ Ошибка анализа реалистичности:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка анализа: ' + error.message
        });
    }
});

// 23. Статус сервисов
app.get('/api/status', async (req, res) => {
    try {
        const supabaseStatus = await getSupabaseStatus();
        
        let gigachatStatus = 'unknown';
        try {
            await getGigaChatTokenReal();
            gigachatStatus = 'available';
        } catch (error) {
            gigachatStatus = 'unavailable';
        }
        
        await ollamaValidator.checkAvailability();
        
        res.json({
            success: true,
            platform: 'Strategix AI Pro v8.0.0',
            services: {
                gigachat: gigachatStatus,
                ollama: ollamaValidator.isAvailable ? 'available' : 'unavailable',
                ollama_model: ollamaValidator.currentModel,
                supabase: supabaseStatus ? 'connected' : 'not_connected',
                smart_heuristic: 'available',
                unit_master: 'available',
                idea_generator: 'available',
                document_generator: 'available',
                pitch_deck_generator: 'available',
                investor_prep: 'available'
            },
            features: {
                ai_chat_expert: true,
                cross_validation: 'gigachat+ollama+heuristic',
                idea_generation: 'personalized',
                unit_economics: '10+ metrics',
                document_generation: '5 types',
                export_formats: ['excel', 'pdf', 'pptx', 'txt']
            },
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 24. Главная страница с веб-интерфейсом
app.get('/', async (req, res) => {
    try {
        const supabaseStatus = await getSupabaseStatus();
        const ollamaStatus = ollamaValidator.isAvailable;
        
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Strategix AI Pro v9.0.0 Ultimate</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
            line-height: 1.6;
        }
        .container {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 40px;
            color: #333;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            margin-top: 20px;
        }
        h1 {
            color: #2E75B6;
            margin-bottom: 30px;
            font-size: 2.5em;
        }
        h2 {
            color: #2E75B6;
            margin-top: 30px;
            font-size: 1.8em;
        }
        h3 {
            color: #333;
            margin-top: 20px;
        }
        .status-panel {
            margin: 20px 0;
            padding: 25px;
            border-radius: 15px;
            background: #f8fafc;
            border-left: 5px solid #2E75B6;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .status-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 15px 0;
            padding: 12px;
            background: white;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        .status-good {
            color: #10b981;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .status-good::before {
            content: "✓";
            font-size: 1.2em;
        }
        .status-warning {
            color: #f59e0b;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .status-warning::before {
            content: "⚠";
            font-size: 1.2em;
        }
        .status-error {
            color: #ef4444;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .status-error::before {
            content: "✗";
            font-size: 1.2em;
        }
        .api-links {
            margin-top: 30px;
        }
        .api-link {
            display: block;
            margin: 12px 0;
            padding: 15px;
            background: #2E75B6;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            transition: all 0.3s ease;
            font-weight: 500;
            border: 2px solid transparent;
        }
        .api-link:hover {
            background: white;
            color: #2E75B6;
            border-color: #2E75B6;
            transform: translateY(-2px);
        }
        .api-link.ultimate {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .api-link.ultimate:hover {
            background: white;
            color: #764ba2;
            border-color: #764ba2;
        }
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .feature-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }
        .feature-card h4 {
            color: #2E75B6;
            margin-top: 0;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .feature-list {
            list-style: none;
            padding: 0;
            margin: 15px 0;
        }
        .feature-list li {
            padding: 8px 0;
            border-bottom: 1px solid #f1f5f9;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .feature-list li::before {
            content: "✓";
            color: #10b981;
            font-weight: bold;
        }
        .test-credentials {
            background: #e8f4fd;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            border-left: 4px solid #2E75B6;
        }
        .instructions {
            background: #f8fafc;
            padding: 25px;
            border-radius: 10px;
            margin-top: 30px;
        }
        .instructions ol {
            padding-left: 20px;
        }
        .instructions li {
            margin-bottom: 10px;
        }
        code {
            background: #2d3748;
            color: #e2e8f0;
            padding: 4px 8px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }
        @media (max-width: 768px) {
            .container {
                padding: 20px;
            }
            h1 {
                font-size: 2em;
            }
            .features-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Strategix AI Pro v9.0.0 Ultimate</h1>
        
        <div class="status-panel">
            <h3>📊 Статус системы:</h3>
            
            <div class="status-item">
                <span>Загрузка .env файла:</span>
                <span class="${envLoaded ? 'status-good' : 'status-error'}">
                    ${envLoaded ? 'Успешно' : 'Не загружен'}
                </span>
            </div>
            
            <div class="status-item">
                <span>Подключение к Supabase:</span>
                <span class="${supabaseStatus ? 'status-good' : 'status-warning'}">
                    ${supabaseStatus ? 'Подключен' : 'Не подключен'}
                </span>
            </div>
            
            <div class="status-item">
                <span>GigaChat API Key:</span>
                <span class="${process.env.GIGACHAT_API_KEY ? 'status-good' : 'status-error'}">
                    ${process.env.GIGACHAT_API_KEY ? 'Настроен' : 'Не найден'}
                </span>
            </div>
            
            <div class="status-item">
                <span>Ollama:</span>
                <span class="${ollamaStatus ? 'status-good' : 'status-warning'}">
                    ${ollamaStatus ? 'Доступен' : 'Недоступен'}
                </span>
            </div>
            
            <div class="status-item">
                <span>Ultimate MVP Generator:</span>
                <span class="status-good">
                    ✅ Готов
                </span>
            </div>
        </div>
        
        <p><strong>Сервер успешно запущен на порту: ${PORT}</strong></p>
        
        <div class="test-credentials">
            <h3>🔐 Тестовый доступ:</h3>
            <p><strong>Email:</strong> test@strategix.ai</p>
            <p><strong>Password:</strong> password123</p>
        </div>
        
        <div class="features-grid">
            <div class="feature-card">
                <h4>🚀 Ultimate MVP Generator</h4>
                <ul class="feature-list">
                    <li>Генерация production-ready HTML приложений</li>
                    <li>Полные технические задания (ТЗ)</li>
                    <li>Расчет бюджета и сроков</li>
                    <li>Подбор технологического стека</li>
                    <li>Формирование команды разработки</li>
                </ul>
            </div>
            
            <div class="feature-card">
                <h4>🤖 AI Business Chat Expert</h4>
                <ul class="feature-list">
                    <li>4 экспертных режима</li>
                    <li>Кросс-валидация через Ollama</li>
                    <li>История диалогов</li>
                    <li>Быстрые действия</li>
                </ul>
            </div>
            
            <div class="feature-card">
                <h4>💡 Генератор бизнес-идей</h4>
                <ul class="feature-list">
                    <li>Персонализированные идеи</li>
                    <li>Анкета из 8 вопросов</li>
                    <li>Генерация брендинга</li>
                    <li>Оценка совместимости</li>
                </ul>
            </div>
            
            <div class="feature-card">
                <h4>📊 UnitMaster Pro Calculator</h4>
                <ul class="feature-list">
                    <li>10+ бизнес-метрик</li>
                    <li>Автоопределение типа бизнеса</li>
                    <li>Сравнение с бенчмарками</li>
                    <li>Прогнозы и рекомендации</li>
                </ul>
            </div>
            
            <div class="feature-card">
                <h4>📝 Подготовка к инвесторам</h4>
                <ul class="feature-list">
                    <li>18 вопросов инвесторов</li>
                    <li>Pitch Deck генератор</li>
                    <li>Финансовая модель</li>
                    <li>Due Diligence checklist</li>
                </ul>
            </div>
            
            <div class="feature-card">
                <h4>⚖️ Юридические документы</h4>
                <ul class="feature-list">
                    <li>Founders Agreement (RU)</li>
                    <li>SAFE Agreement (EN)</li>
                    <li>Term Sheet (RU)</li>
                    <li>SaaS Agreement (EN)</li>
                </ul>
            </div>
        </div>
        
        <div class="api-links">
            <h3>🔗 Доступные API endpoints:</h3>
            <a class="api-link ultimate" href="/api/status/full" target="_blank">/api/status/full - Полный статус</a>
            <a class="api-link ultimate" href="/api/test-gigachat-simple" target="_blank">🚀 Ultimate MVP Generator</a>
            <a class="api-link" href="/api/health" target="_blank">/api/health - Проверка статуса</a>
            <a class="api-link" href="/api/status" target="_blank">/api/status - Детальный статус</a>
            
            <p style="margin-top: 20px; color: #666;">
                <strong>Ultimate MVP Endpoints (требуют авторизации):</strong><br>
                • POST /api/ultimate-mvp/generate-complete - Полная генерация<br>
                • POST /api/ultimate-mvp/generate-spec - Только ТЗ<br>
                • POST /api/ultimate-mvp/generate-html - Только HTML приложение<br>
                • GET /api/ultimate-mvp/projects - Список проектов
            </p>
            
            <p style="margin-top: 20px; color: #666;">
                <strong>Основные эндпоинты (требуют авторизации):</strong><br>
                • POST /api/ai-chat/expert - AI Business Chat<br>
                • POST /api/ideas/generate - Генерация идей<br>
                • POST /api/unitmaster-pro/analyze - Анализ юнит-экономики<br>
                • POST /api/investor-prep/comprehensive - Подготовка к инвесторам<br>
                • POST /api/pitch-deck/generate - Генерация Pitch Deck<br>
                • POST /api/auth/login - Аутентификация<br>
                • POST /api/legal/generate - Юридические документы
            </p>
        </div>
        
        <div class="instructions">
            <h3>📖 Инструкция по использованию Ultimate MVP Generator:</h3>
            <ol>
                <li>Получите токен через POST <code>/api/auth/login</code> с тестовыми данными</li>
                <li>Используйте токен в заголовке <code>Authorization: Bearer {token}</code></li>
                <li>Для генерации полного проекта: POST <code>/api/ultimate-mvp/generate-complete</code></li>
                <li>Получите: готовое HTML приложение + ТЗ + бюджет + сроки</li>
                <li>Скачайте файлы по ссылкам в ответе API</li>
                <li>Начните разработку по готовому техническому заданию</li>
            </ol>
            
            <h4 style="margin-top: 20px;">Пример запроса:</h4>
            <code style="display: block; margin: 10px 0; padding: 15px; background: #f8f9fa; border-radius: 5px;">
{
  "businessIdea": "Платформа для онлайн-обучения с AI-рекомендациями курсов",
  "designStyle": "modern",
  "budget_range": "1000000-2500000",
  "timeline": "4-8 месяцев",
  "team_size": "4-6 человек"
}
            </code>
        </div>
    </div>
    
    <script>
        function showUltimateDemo() {
            alert('Ultimate MVP Generator позволяет:\n\n' +
                  '1. Генерировать полноценные веб-приложения (3000+ строк кода)\n' +
                  '2. Создавать детальные технические задания на 50+ страниц\n' +
                  '3. Рассчитывать бюджет и сроки разработки\n' +
                  '4. Формировать команду и стек технологий\n' +
                  '5. Получать готовый production-ready код\n\n' +
                  'Используйте POST /api/ultimate-mvp/generate-complete');
        }
        
        // Добавляем обработчик для Ultimate MVP ссылки
        document.querySelector('.api-link.ultimate').addEventListener('click', function(e) {
            if(this.getAttribute('href') === '#') {
                e.preventDefault();
                showUltimateDemo();
            }
        });
    </script>
</body>
</html>`;
        
        res.send(html);
    } catch (error) {
        res.status(500).send('Ошибка при загрузке страницы: ' + error.message);
    }
});

// 25. Эндпоинт для генерации документов
app.post('/api/documents/generate', authenticateToken, async (req, res) => {
    try {
        const { type, subtype, data, options } = req.body;
        
        if (!type || !data) {
            return res.status(400).json({
                success: false,
                error: 'Тип документа и данные обязательны'
            });
        }
        
        const result = await documentGenerator.generateDocument(type, subtype, data, options || {});
        
        res.json({
            success: true,
            ...result
        });
        
    } catch (error) {
        console.error('❌ Ошибка генерации документа:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка генерации документа: ' + error.message
        });
    }
});

// 26. Генерация маркетинговой стратегии
app.post('/api/marketing-strategy', authenticateToken, async (req, res) => {
    try {
        const { data, options } = req.body;
        
        if (!data) {
            return res.status(400).json({
                success: false,
                error: 'Данные обязательны'
            });
        }
        
        console.log('📊 Генерация маркетинговой стратегии...');
        
        const result = await documentGenerator.generateDocument(
            'marketing_strategy',
            'standard',
            data,
            options || {}
        );
        
        res.json({
            success: true,
            ...result
        });
        
    } catch (error) {
        console.error('❌ Ошибка генерации маркетинговой стратегии:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка генерации маркетинговой стратегии: ' + error.message
        });
    }
});

// 27. Экспорт в текстовый формат (СТАРЫЙ - нужно заменить или удалить)
app.post('/api/export/txt', authenticateToken, async (req, res) => {
    try {
        const { data, document_type } = req.body;
        
        if (!data || !document_type) {
            return res.status(400).json({
                success: false,
                error: 'Данные и тип документа обязательны'
            });
        }
        
        const timestamp = Date.now();
        const filename = `document_${timestamp}.txt`;
        const filepath = path.join(__dirname, 'exports', filename);
        
        let textContent = '';
        
        if (document_type === 'business_plan') {
            textContent = `БИЗНЕС-ПЛАН\n\n`;
            textContent += `Дата создания: ${new Date().toLocaleDateString('ru-RU')}\n\n`;
            textContent += data.content || JSON.stringify(data, null, 2);
        } else if (document_type === 'pitch_deck') {
            textContent = `PITCH DECK - ПРЕЗЕНТАЦИЯ ДЛЯ ИНВЕСТОРОВ\n\n`;
            textContent += `Дата создания: ${new Date().toLocaleDateString('ru-RU')}\n\n`;
            textContent += data.content || JSON.stringify(data, null, 2);
        } else if (document_type === 'marketing_strategy') {
            textContent = `МАРКЕТИНГОВАЯ СТРАТЕГИЯ\n\n`;
            textContent += `Дата создания: ${new Date().toLocaleDateString('ru-RU')}\n\n`;
            textContent += data.content || JSON.stringify(data, null, 2);
        } else {
            textContent = JSON.stringify(data, null, 2);
        }
        
        await fs.writeFile(filepath, textContent, 'utf8');
        
        res.download(filepath, filename, (err) => {
            if (err) {
                console.error('❌ Ошибка отправки файла:', err);
            }
            
            setTimeout(() => {
                fs.unlink(filepath, () => {});
            }, 10000);
        });
        
    } catch (error) {
        console.error('❌ Ошибка экспорта в TXT:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка экспорта: ' + error.message
        });
    }
});

// 28. Получение истории чата пользователя
app.get('/api/chat/history', authenticateToken, async (req, res) => {
    try {
        const { session_id, limit } = req.query;
        const userId = req.user.id;
        
        if (!session_id) {
            return res.status(400).json({
                success: false,
                error: 'ID сессии обязателен'
            });
        }
        
        const history = await supabaseService.getChatHistory(
            userId, 
            session_id, 
            parseInt(limit) || 50
        );
        
        res.json({
            success: true,
            history: history,
            count: history.length
        });
        
    } catch (error) {
        console.error('❌ Ошибка получения истории чата:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка получения истории: ' + error.message
        });
    }
});

// 29. Сохранение чата
app.post('/api/chat/save', authenticateToken, async (req, res) => {
    try {
        const { session_id, messages } = req.body;
        const userId = req.user.id;
        
        if (!session_id || !messages || !Array.isArray(messages)) {
            return res.status(400).json({
                success: false,
                error: 'ID сессии и сообщения обязательны'
            });
        }
        
        console.log(`💾 Сохранение чата для сессии: ${session_id}, сообщений: ${messages.length}`);
        
        // Сохраняем каждое сообщение
        for (const message of messages) {
            await supabaseService.saveChatMessage(userId, session_id, {
                role: message.role,
                content: message.content,
                metadata: {
                    timestamp: message.timestamp || new Date().toISOString(),
                    model: message.model || 'gigachat',
                    mode: message.mode
                }
            });
        }
        
        res.json({
            success: true,
            message: 'Чат сохранен',
            count: messages.length
        });
        
    } catch (error) {
        console.error('❌ Ошибка сохранения чата:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сохранения чата: ' + error.message
        });
    }
});

// 30. Получение документов пользователя
app.get('/api/documents', authenticateToken, async (req, res) => {
    try {
        const { type, limit } = req.query;
        const userId = req.user.id;
        
        console.log(`📁 Запрос документов пользователя: ${userId}, тип: ${type || 'все'}`);
        
        const documents = await supabaseService.getUserDocuments(
            userId,
            type || null,
            parseInt(limit) || 100
        );
        
        res.json({
            success: true,
            documents: documents,
            count: documents.length
        });
        
    } catch (error) {
        console.error('❌ Ошибка получения документов:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка получения документов: ' + error.message
        });
    }
});

// 31. Сохранение документа
app.post('/api/documents/save', authenticateToken, async (req, res) => {
    try {
        const { document_data } = req.body;
        const userId = req.user.id;
        
        if (!document_data) {
            return res.status(400).json({
                success: false,
                error: 'Данные документа обязательны'
            });
        }
        
        console.log(`💾 Сохранение документа: ${document_data.type || 'unknown'}`);
        
        await supabaseService.saveGeneratedDocument(userId, {
            type: document_data.type || 'unknown',
            title: document_data.title || 'Без названия',
            content: document_data.content || '',
            metadata: document_data.metadata || {},
            file_path: document_data.file_path || null
        });
        
        res.json({
            success: true,
            message: 'Документ сохранен'
        });
        
    } catch (error) {
        console.error('❌ Ошибка сохранения документа:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сохранения документа: ' + error.message
        });
    }
});

// 32. Статистика пользователя
app.get('/api/user/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        console.log(`📊 Запрос статистики пользователя: ${userId}`);
        
        const stats = await supabaseService.getUserStatistics(userId);
        
        res.json({
            success: true,
            stats: stats,
            user: {
                id: req.user.id,
                email: req.user.email,
                name: req.user.name,
                subscription: req.user.subscription
            }
        });
        
    } catch (error) {
        console.error('❌ Ошибка получения статистики:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка получения статистики: ' + error.message
        });
    }
});

// 33. Профиль пользователя (ОБНОВЛЕННЫЙ)
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Получаем настройки пользователя из Supabase
        const userSettings = await supabaseService.getUserSettings(userId);
        
        const userWithFeatures = {
            ...req.user,
            features: getFeaturesBySubscription(req.user.subscription || 'free'),
            settings: userSettings || {
                preferences: {},
                notification_settings: {},
                export_settings: {}
            }
        };
        
        res.json({
            success: true,
            user: userWithFeatures
        });
    } catch (error) {
        console.error('❌ Ошибка получения профиля:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка получения профиля: ' + error.message
        });
    }
});

// 34. Административная статистика (только для админов)
app.get('/api/admin/stats', authenticateToken, async (req, res) => {
    try {
        // Проверяем права администратора
        if (!req.user.is_admin) {
            return res.status(403).json({
                success: false,
                error: 'Требуются права администратора'
            });
        }
        
        console.log('📊 Административный запрос статистики');
        
        const stats = await supabaseService.getSystemStatistics();
        
        res.json({
            success: true,
            stats: stats,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Ошибка получения административной статистики:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка получения статистики: ' + error.message
        });
    }
});

// 35. Генерация юридических документов
app.post('/api/legal/generate', authenticateToken, async (req, res) => {
    try {
        const { document_type, data, options } = req.body;
        
        if (!document_type || !data) {
            return res.status(400).json({
                success: false,
                error: 'Тип документа и данные обязательны'
            });
        }
        
        console.log(`⚖️ Запрос на генерацию документа: ${document_type}`);
        
        const result = await legalDocumentGenerator.generateLegalDocument(
            document_type,
            data,
            options || {}
        );
        
        res.json({
            success: true,
            ...result
        });
        
    } catch (error) {
        console.error('❌ Ошибка генерации юридического документа:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка генерации: ' + error.message
        });
    }
});

// 36. Получение доступных шаблонов юридических документов
app.get('/api/legal/templates', authenticateToken, (req, res) => {
    try {
        const templates = legalDocumentGenerator.getAllTemplates();
        const validationRules = legalDocumentGenerator.getValidationRules();
        
        const templateList = Object.entries(templates).map(([key, template]) => ({
            id: key,
            name: template.name,
            language: template.language,
            version: template.version,
            required_fields: getRequiredFieldsForTemplate(key),
            validation_rules: validationRules[key] || []
        }));
        
        res.json({
            success: true,
            templates: templateList,
            total_templates: templateList.length
        });
        
    } catch (error) {
        console.error('❌ Ошибка получения шаблонов:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка получения: ' + error.message
        });
    }
});

// 37. Генерация документа по промпту из задачи
app.post('/api/legal/generate-from-prompt', authenticateToken, async (req, res) => {
    try {
        const { prompt_type, prompt_data, document_type, custom_instructions } = req.body;
        
        if (!prompt_type || !prompt_data) {
            return res.status(400).json({
                success: false,
                error: 'Тип промпта и данные обязательны'
            });
        }
        
        console.log(`📝 Генерация документа по промпту: ${prompt_type}`);
        
        // Обработка промптов из задачи
        let docType, data;
        
        switch(prompt_type) {
            case 'founders_agreement_ru':
                docType = 'founders_agreement_ru';
                data = parseFoundersAgreementData(prompt_data);
                break;
                
            case 'safe_en':
                docType = 'safe_en';
                data = parseSafeData(prompt_data);
                break;
                
            case 'term_sheet_ru':
                docType = 'term_sheet_ru';
                data = parseTermSheetData(prompt_data);
                break;
                
            case 'shareholders_agreement_ru':
                docType = 'shareholders_agreement_ru';
                data = parseShareholdersAgreementData(prompt_data);
                break;
                
            case 'saas_agreement_en':
                docType = 'saas_agreement_en';
                data = parseSaaSData(prompt_data);
                break;
                
            default:
                return res.status(400).json({
                    success: false,
                    error: `Неизвестный тип промпта: ${prompt_type}`
                });
        }
        
        const options = {
            custom_instructions: custom_instructions,
            use_enhanced_prompt: true,
            max_length: 10000
        };
        
        const result = await legalDocumentGenerator.generateLegalDocument(
            docType || document_type,
            data,
            options
        );
        
        res.json({
            success: true,
            prompt_type: prompt_type,
            ...result
        });
        
    } catch (error) {
        console.error('❌ Ошибка генерации по промпту:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка генерации: ' + error.message
        });
    }
});

// Вспомогательные функции для парсинга данных
function parseFoundersAgreementData(promptData) {
    return {
        project_name: promptData.project_name || 'Не указано',
        participants: promptData.participants || [],
        ownership_percentages: promptData.ownership_percentages || {},
        roles_responsibilities: promptData.roles_responsibilities || {},
        vesting: {
            enabled: promptData.vesting_enabled || true,
            cliff_months: promptData.cliff_months || 12,
            vesting_period_years: promptData.vesting_period_years || 4,
            schedule: promptData.vesting_schedule || 'monthly'
        },
        exit_conditions: {
            good_leaver: promptData.good_leaver_conditions || 'fair market value',
            bad_leaver: promptData.bad_leaver_conditions || 'nominal value',
            buyout_process: promptData.buyout_process || 'company first option'
        },
        decision_making: {
            unanimous: promptData.unanimous_decisions || ['charter changes', 'investments > 5M', 'liquidation'],
            majority_75: promptData.majority_75_decisions || ['key hires', 'budget > 1M'],
            majority_51: promptData.majority_51_decisions || ['operational decisions']
        },
        dispute_resolution: {
            venue: promptData.dispute_venue || 'Арбитражный суд г. Москвы',
            governing_law: promptData.governing_law || 'Российская Федерация'
        }
    };
}

function parseSafeData(promptData) {
    return {
        company_name: promptData.company_name || 'NeuralCode Inc.',
        agreement_date: promptData.agreement_date || new Date().toISOString().split('T')[0],
        investor_details: promptData.investor_details || {},
        investment_amount: promptData.investor_amount || 100000,
        valuation_cap: promptData.valuation_cap || 5000000,
        discount_rate: promptData.discount_rate || 'N/A',
        pro_rata_rights: promptData.pro_rata_rights || true,
        governing_law: promptData.governing_law || 'The laws of the State of Delaware, USA',
        conversion_trigger: promptData.conversion_trigger || 1000000,
        additional_terms: promptData.additional_terms || {}
    };
}

function parseTermSheetData(promptData) {
    return {
        company_name: promptData.company_name || 'ООО "НейроКод"',
        investor_name: promptData.investor_name || 'Венчурный фонд "ТекФонд"',
        round_name: promptData.round_name || 'Series A',
        investment_form: promptData.investment_form || 'Привилегированные акции АО',
        pre_money_valuation: promptData.pre_money_valuation || 600000000,
        investment_amount: promptData.investment_amount || 150000000,
        post_money_valuation: promptData.post_money_valuation || 750000000,
        investor_percentage: promptData.investor_percentage || 20,
        liquidation_preference: promptData.liquidation_preference || '1x, non-participating',
        protective_provisions: promptData.protective_provisions || [
            'Изменение устава',
            'Выплата дивидендов',
            'Привлечение долга >10 млн руб.',
            'Смена CEO',
            'Одобрение годового бюджета'
        ],
        esop_pool: promptData.esop_pool || 10,
        exclusivity_period: promptData.exclusivity_period || 60,
        co_sale_rights: promptData.co_sale_rights || true,
        governing_law: promptData.governing_law || 'Право Российской Федерации'
    };
}

function parseShareholdersAgreementData(promptData) {
    return {
        company_name: promptData.company_name || 'Акционерное общество "НейроКод"',
        shareholders: promptData.shareholders || [
            { name: 'Иванов И.И.', shares: '48% обыкновенных акций', type: 'founder' },
            { name: 'Петров П.П.', shares: '12% обыкновенных акций', type: 'founder' },
            { name: 'ООО "ВенчурПартнерс"', shares: '20% привилегированных акций типа А', type: 'investor' }
        ],
        esop_pool: promptData.esop_pool || '20% акций в резерве',
        board_composition: promptData.board_composition || {
            total_members: 3,
            founder_representative: 1,
            investor_representative: 1,
            independent_member: 1,
            selection_process: 'независимый член утверждается единогласно'
        },
        decision_thresholds: promptData.decision_thresholds || [
            'Ликвидация или реорганизация',
            'Одобрение сделок с заинтересованностью',
            'Изменение устава',
            'Выплата дивидендов'
        ],
        threshold_percentage: promptData.threshold_percentage || 75,
        rofr: promptData.rofr || true,
        tag_along: promptData.tag_along || true,
        information_rights: promptData.information_rights || [
            'Ежеквартальная управленческая отчетность',
            'Доступ к аудиторским проверкам'
        ],
        lock_up_period: promptData.lock_up_period || 24,
        dispute_resolution: promptData.dispute_resolution || 'Арбитражный суд при ТПП РФ (Москва)'
    };
}

function parseSaaSData(promptData) {
    return {
        company_name: promptData.company_name || 'NeuralCode Inc.',
        service_name: promptData.service_name || 'NeuroAnalytics Cloud Platform',
        license_grant: promptData.license_grant || 'non-exclusive, non-transferable, worldwide license for internal business purposes',
        subscription_plans: promptData.subscription_plans || [
            { name: 'Basic Plan', price: '$99/user/month', billing: 'annually in advance' },
            { name: 'Pro Plan', price: '$299/user/month', billing: 'annually in advance' },
            { name: 'Enterprise', price: 'custom pricing', billing: 'custom' }
        ],
        subscription_term: promptData.subscription_term || '1 year initial, auto-renewing for successive 1-year periods',
        termination: promptData.termination || 'termination for material breach with 30-day cure period',
        data_ownership: promptData.data_ownership || 'Customer retains all rights to its data',
        security_measures: promptData.security_measures || [
            'SSL encryption',
            'regular backups',
            'industry-standard security'
        ],
        warranty: promptData.warranty || 'Service is provided "AS IS"',
        liability_limit: promptData.liability_limit || 'Total liability capped at fees paid in preceding 12 months',
        acceptable_use: promptData.acceptable_use || [
            'No violation of laws',
            'No spamming',
            'No hacking or reverse engineering'
        ],
        governing_law: promptData.governing_law || 'Laws of the State of California',
        jurisdiction: promptData.jurisdiction || 'Courts in San Francisco County, CA'
    };
}

// 38. Экспорт юридических документов в форматы
app.post('/api/legal/export', authenticateToken, async (req, res) => {
    try {
        const { document, format, filename } = req.body;
        
        if (!document || !format) {
            return res.status(400).json({
                success: false,
                error: 'Документ и формат обязательны'
            });
        }
        
        const timestamp = Date.now();
        const exportFilename = filename || `legal_document_${timestamp}.${format}`;
        const filepath = path.join(__dirname, 'exports', exportFilename);
        
        let content;
        
        switch(format.toLowerCase()) {
            case 'docx':
                content = await exportToDocx(document, filepath);
                break;
                
            case 'pdf':
                content = await exportToPdf(document, filepath);
                break;
                
            case 'txt':
                content = await exportToTxt(document, filepath);
                break;
                
            case 'html':
                content = await exportToHtml(document, filepath);
                break;
                
            default:
                return res.status(400).json({
                    success: false,
                    error: `Неподдерживаемый формат: ${format}`
                });
        }
        
        res.download(filepath, exportFilename, (err) => {
            if (err) {
                console.error('❌ Ошибка отправки файла:', err);
                res.status(500).json({
                    success: false,
                    error: 'Ошибка отправки файла'
                });
            }
            
            // Удаляем файл через 30 секунд
            setTimeout(() => {
                fs.unlink(filepath, () => {});
            }, 30000);
        });
        
    } catch (error) {
        console.error('❌ Ошибка экспорта:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка экспорта: ' + error.message
        });
    }
});

// Вспомогательные функции для экспорта
async function exportToDocx(document, filepath) {
    // Используем простой текстовый экспорт
    const content = `
${document.metadata?.document_type || 'LEGAL DOCUMENT'}

${document.explanation || ''}

${document.document_text || ''}

${document.discussion_points?.length ? 'Key Discussion Points:' : ''}
${(document.discussion_points || []).map((point, i) => `${i + 1}. ${point}`).join('\n')}
    `.trim();
    
    await fs.writeFile(filepath, content, 'utf8');
    return content;
}

async function exportToPdf(document, filepath) {
    const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        bufferPages: true
    });
    
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);
    
    doc.font('Helvetica-Bold')
       .fontSize(16)
       .fillColor('#2E75B6')
       .text(document.metadata?.document_type || 'LEGAL DOCUMENT', { align: 'center' });
    
    doc.moveDown();
    
    doc.font('Helvetica')
       .fontSize(10)
       .fillColor('#666666')
       .text(`Generated: ${new Date(document.metadata?.generation_date || Date.now()).toLocaleDateString()}`, {
           align: 'center'
       });
    
    doc.moveDown(2);
    
    if (document.explanation) {
        doc.fontSize(11)
           .fillColor('#333333')
           .text('Explanation:', { underline: true });
        
        doc.moveDown(0.5);
        doc.fontSize(10)
           .text(document.explanation, { align: 'justify' });
        
        doc.moveDown();
    }
    
    if (document.document_text) {
        doc.fontSize(11)
           .fillColor('#333333')
           .text('Document Text:', { underline: true });
        
        doc.moveDown(0.5);
        doc.fontSize(9)
           .fillColor('#000000')
           .text(document.document_text, {
               align: 'left',
               lineGap: 2,
               paragraphGap: 5
           });
    }
    
    doc.end();
    
    return new Promise((resolve, reject) => {
        stream.on('finish', () => resolve('PDF generated'));
        stream.on('error', reject);
    });
}

async function exportToTxt(document, filepath) {
    const content = `
${'='.repeat(80)}
${document.metadata?.document_type || 'LEGAL DOCUMENT'}
${'='.repeat(80)}

Generation Date: ${new Date(document.metadata?.generation_date || Date.now()).toLocaleString()}
Document Type: ${document.metadata?.document_type || 'N/A'}
Language: ${document.metadata?.language || 'N/A'}

${'-'.repeat(80)}
EXPLANATION
${'-'.repeat(80)}

${document.explanation || 'N/A'}

${'-'.repeat(80)}
DOCUMENT TEXT
${'-'.repeat(80)}

${document.document_text || 'N/A'}

${'-'.repeat(80)}
DISCUSSION POINTS
${'-'.repeat(80)}

${(document.discussion_points || []).map((point, i) => `${i + 1}. ${point}`).join('\n')}

${'-'.repeat(80)}
METADATA
${'-'.repeat(80)}

Characters: ${document.estimated_length?.characters || 0}
Words: ${document.estimated_length?.words || 0}
Paragraphs: ${document.estimated_length?.paragraphs || 0}
Placeholders: ${document.placeholder_check?.placeholder_count || 0}
    `.trim();
    
    await fs.writeFile(filepath, content, 'utf8');
    return content;
}

async function exportToHtml(document, filepath) {
    const content = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${document.metadata?.document_type || 'Legal Document'}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        .header {
            background: #2E75B6;
            color: white;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 30px;
        }
        .section {
            margin: 30px 0;
            padding: 20px;
            border-left: 4px solid #2E75B6;
            background: #f8f9fa;
        }
        .section-title {
            color: #2E75B6;
            margin-top: 0;
            border-bottom: 2px solid #dee2e6;
            padding-bottom: 10px;
        }
        .discussion-points {
            background: #e8f4fd;
            padding: 15px;
            border-radius: 5px;
        }
        .metadata {
            font-size: 0.9em;
            color: #666;
            background: #f8f9fa;
            padding: 10px;
            border-radius: 3px;
            margin-top: 20px;
        }
        pre {
            white-space: pre-wrap;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            border: 1px solid #dee2e6;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${document.metadata?.document_type || 'Legal Document'}</h1>
        <p>Generated: ${new Date(document.metadata?.generation_date || Date.now()).toLocaleString()}</p>
    </div>
    
    <div class="section">
        <h2 class="section-title">Explanation</h2>
        <p>${document.explanation || 'No explanation provided.'}</p>
    </div>
    
    <div class="section">
        <h2 class="section-title">Document Text</h2>
        <pre>${document.document_text || 'No document text available.'}</pre>
    </div>
    
    ${document.discussion_points?.length ? `
    <div class="section">
        <h2 class="section-title">Discussion Points</h2>
        <div class="discussion-points">
            <ol>
                ${document.discussion_points.map(point => `<li>${point}</li>`).join('')}
            </ol>
        </div>
    </div>
    ` : ''}
    
    <div class="metadata">
        <p><strong>Document Statistics:</strong></p>
        <ul>
            <li>Characters: ${document.estimated_length?.characters || 0}</li>
            <li>Words: ${document.estimated_length?.words || 0}</li>
            <li>Paragraphs: ${document.estimated_length?.paragraphs || 0}</li>
            <li>Placeholders: ${document.placeholder_check?.placeholder_count || 0}</li>
            <li>Language: ${document.metadata?.language || 'N/A'}</li>
            <li>Version: ${document.metadata?.version || '1.0'}</li>
        </ul>
    </div>
</body>
</html>
    `.trim();
    
    await fs.writeFile(filepath, content, 'utf8');
    return content;
}

// Вспомогательная функция для определения обязательных полей
function getRequiredFieldsForTemplate(templateId) {
    const fieldMap = {
        'founders_agreement_ru': [
            'project_name',
            'participants',
            'ownership_percentages',
            'roles_responsibilities',
            'vesting',
            'exit_conditions',
            'decision_making'
        ],
        'safe_en': [
            'company_name',
            'investor_details',
            'investment_amount',
            'valuation_cap',
            'governing_law'
        ],
        'term_sheet_ru': [
            'company_name',
            'investor_name',
            'pre_money_valuation',
            'investment_amount',
            'liquidation_preference'
        ],
        'shareholders_agreement_ru': [
            'company_name',
            'shareholders',
            'board_composition',
            'decision_thresholds'
        ],
        'saas_agreement_en': [
            'company_name',
            'service_name',
            'license_grant',
            'subscription_plans',
            'data_ownership'
        ]
    };
    
    return fieldMap[templateId] || [];
}

// 39. Универсальный экспорт по формату - ВМЕСТО старых отдельных эндпоинтов
app.post('/api/export/:format', authenticateToken, async (req, res) => {
    try {
        const format = req.params.format;
        const { data, document_type, filename } = req.body;
        
        if (!data) {
            return res.status(400).json({
                success: false,
                error: 'Данные для экспорта обязательны'
            });
        }
        
        const timestamp = Date.now();
        const exportFilename = filename || `export_${timestamp}.${format}`;
        const filepath = path.join(__dirname, 'exports', exportFilename);
        
        switch(format.toLowerCase()) {
            case 'excel':
            case 'xlsx':
                await exportToExcelUniversal(data, filepath);
                break;
                
            case 'pdf':
                await exportToPdfUniversal(data, document_type, filepath);
                break;
                
            case 'txt':
                await exportToTxtUniversal(data, document_type, filepath);
                break;
                
            case 'pptx':
                await exportToPptxUniversal(data, filepath);
                break;
                
            case 'json':
                await exportToJsonUniversal(data, filepath);
                break;
                
            default:
                return res.status(400).json({
                    success: false,
                    error: `Неподдерживаемый формат: ${format}`
                });
        }
        
        res.download(filepath, exportFilename, (err) => {
            if (err) {
                console.error('❌ Ошибка отправки файла:', err);
            }
            
            setTimeout(() => {
                fs.unlink(filepath, () => {});
            }, 30000);
        });
        
    } catch (error) {
        console.error(`❌ Ошибка экспорта в ${req.params.format}:`, error);
        res.status(500).json({
            success: false,
            error: `Ошибка экспорта: ${error.message}`
        });
    }
});

// Универсальные функции экспорта
async function exportToExcelUniversal(data, filepath) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Данные');
    
    // Автоматическое определение структуры
    if (data.calculated_metrics) {
        worksheet.columns = [
            { header: 'Показатель', width: 30 },
            { header: 'Значение', width: 20 },
            { header: 'Единица', width: 15 },
            { header: 'Статус', width: 15 }
        ];
        
        Object.entries(data.calculated_metrics).forEach(([key, metric]) => {
            worksheet.addRow([
                metric.name || key,
                metric.value,
                metric.unit || '-',
                metric.status || '-'
            ]);
        });
    } else if (data.content) {
        worksheet.columns = [
            { header: 'Раздел', width: 40 },
            { header: 'Содержание', width: 60 }
        ];
        
        const sections = data.content.split(/\n\s*\n/);
        sections.forEach((section, index) => {
            if (section.trim().length > 0) {
                const lines = section.split('\n');
                worksheet.addRow([
                    lines[0]?.substring(0, 100) || `Раздел ${index + 1}`,
                    lines.slice(1).join(' ').substring(0, 200)
                ]);
            }
        });
    } else {
        worksheet.columns = [
            { header: 'Ключ', width: 30 },
            { header: 'Значение', width: 50 }
        ];
        
        const flattenObject = (obj, prefix = '') => {
            const rows = [];
            for (const [key, value] of Object.entries(obj)) {
                const fullKey = prefix ? `${prefix}.${key}` : key;
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    rows.push(...flattenObject(value, fullKey));
                } else {
                    rows.push([fullKey, String(value)]);
                }
            }
            return rows;
        };
        
        const flattened = flattenObject(data);
        flattened.forEach(row => worksheet.addRow(row));
    }
    
    await workbook.xlsx.writeFile(filepath);
}

async function exportToPdfUniversal(data, docType, filepath) {
    const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        bufferPages: true
    });
    
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);
    
    const title = {
        'business_plan': 'БИЗНЕС-ПЛАН',
        'pitch_deck': 'PITCH DECK',
        'marketing_strategy': 'МАРКЕТИНГОВАЯ СТРАТЕГИЯ',
        'legal_document': 'ЮРИДИЧЕСКИЙ ДОКУМЕНТ'
    }[docType] || 'ДОКУМЕНТ';
    
    doc.font('Helvetica-Bold')
       .fontSize(20)
       .fillColor('#2E75B6')
       .text(title, { align: 'center' });
    
    doc.moveDown();
    
    doc.font('Helvetica')
       .fontSize(10)
       .fillColor('#666666')
       .text(`Создано: ${new Date().toLocaleDateString('ru-RU')}`, {
           align: 'center'
       });
    
    doc.moveDown(2);
    
    if (data.content) {
        doc.fontSize(11)
           .fillColor('#333333')
           .text(data.content, {
               align: 'justify',
               lineGap: 3,
               paragraphGap: 10
           });
    } else if (data.calculated_metrics) {
        doc.fontSize(12)
           .fillColor('#2E75B6')
           .text('Ключевые метрики:', { underline: true });
        
        doc.moveDown(1);
        
        Object.entries(data.calculated_metrics).forEach(([key, metric], index) => {
            doc.fontSize(10)
               .fillColor('#333333')
               .text(`${metric.name || key}: ${metric.value} ${metric.unit || ''}`, {
                   indent: 20
               });
        });
    }
    
    doc.end();
    
    return new Promise((resolve, reject) => {
        stream.on('finish', () => resolve('PDF generated'));
        stream.on('error', reject);
    });
}

async function exportToTxtUniversal(data, docType, filepath) {
    let textContent = '';
    
    if (docType) {
        const titles = {
            'business_plan': 'БИЗНЕС-ПЛАН',
            'pitch_deck': 'PITCH DECK - ПРЕЗЕНТАЦИЯ ДЛЯ ИНВЕСТОРОВ',
            'marketing_strategy': 'МАРКЕТИНГОВАЯ СТРАТЕГИЯ',
            'legal_document': 'ЮРИДИЧЕСКИЙ ДОКУМЕНТ'
        };
        
        textContent = `${titles[docType] || 'ДОКУМЕНТ'}\n\n`;
        textContent += `Дата создания: ${new Date().toLocaleDateString('ru-RU')}\n\n`;
    }
    
    if (data.content) {
        textContent += data.content;
    } else {
        textContent += JSON.stringify(data, null, 2);
    }
    
    await fs.writeFile(filepath, textContent, 'utf8');
    return textContent;
}

async function exportToPptxUniversal(data, filepath) {
    const pres = new PptxGenJS();
    pres.layout = 'LAYOUT_WIDE';
    
    // Title slide
    const slide1 = pres.addSlide();
    slide1.addText(data.title || 'Презентация', {
        x: 1, y: 2, w: 8, h: 1.5,
        fontSize: 36,
        bold: true,
        color: '2E75B6',
        align: 'center'
    });
    
    if (data.content) {
        // Content slides
        const sections = data.content.split(/\n\s*\n/);
        sections.forEach((section, index) => {
            if (section.trim().length > 50) {
                const slide = pres.addSlide();
                slide.addText(`Слайд ${index + 2}`, {
                    x: 0.5, y: 0.5, w: 9,
                    fontSize: 14,
                    color: '666666'
                });
                
                slide.addText(section.substring(0, 200), {
                    x: 1, y: 2, w: 8,
                    fontSize: 18
                });
            }
        });
    }
    
    await pres.writeFile({ fileName: filepath });
    return 'PPTX generated';
}

async function exportToJsonUniversal(data, filepath) {
    const jsonContent = JSON.stringify(data, null, 2);
    await fs.writeFile(filepath, jsonContent, 'utf8');
    return 'JSON generated';
}

// ... (весь код до конца остается без изменений)

// 39. Улучшенный статус с поддержкой юридических документов и Ultimate MVP
app.get('/api/status/full', async (req, res) => {
    try {
        const supabaseStatus = await getSupabaseStatus();
        
        let gigachatStatus = 'unknown';
        let gigachatTest = { success: false, error: 'not tested' };
        try {
            const token = await getGigaChatTokenReal();
            gigachatStatus = 'available';
            gigachatTest = { success: true, token_length: token.length };
        } catch (error) {
            gigachatStatus = 'unavailable';
            gigachatTest = { success: false, error: error.message };
        }
        
        await ollamaValidator.checkAvailability();
        
        const legalTemplates = legalDocumentGenerator ? 
            Object.keys(legalDocumentGenerator.getAllTemplates() || {}).length : 0;
        
        // Проверяем Ultimate MVP Generator
        let ultimateMVPStatus = 'available';
        try {
            await ultimateMVPGenerator.getGigaChatToken();
        } catch (error) {
            ultimateMVPStatus = 'unavailable';
        }
        
        res.json({
            success: true,
            platform: 'Strategix AI Pro v9.0.0 Ultimate',
            version: '9.0.0',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            
            services: {
                gigachat: {
                    status: gigachatStatus,
                    test_result: gigachatTest,
                    configured: !!process.env.GIGACHAT_API_KEY
                },
                ollama: {
                    status: ollamaValidator.isAvailable ? 'available' : 'unavailable',
                    model: ollamaValidator.currentModel,
                    url: OLLAMA_BASE_URL
                },
                supabase: {
                    status: supabaseStatus ? 'connected' : 'not_connected',
                    configured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
                },
                env_file: {
                    loaded: envLoaded,
                    path: loadedPath || 'not found'
                },
                ultimate_mvp_generator: {
                    status: ultimateMVPStatus,
                    templates: ['business_app', 'saas', 'ecommerce', 'dashboard'],
                    output_formats: ['html', 'markdown', 'json']
                }
            },
            
            modules: {
                ai_chat_expert: 'enhanced_v2',
                idea_generator: 'personalized_v2',
                unit_master: 'pro_v3',
                document_generator: 'enhanced_v3',
                pitch_deck_generator: 'v2',
                investor_prep: 'comprehensive',
                ultimate_mvp_generator: 'pro_v4',
                technical_spec_generator: 'comprehensive',
                legal_documents: `active (${legalTemplates} templates)`,
                validation: 'multi_layer_v2',
                export: 'multi_format_v2'
            },
            
            features: {
                ultimate_mvp: [
                    'html_app_generation',
                    'technical_spec_generation',
                    'budget_calculation',
                    'timeline_planning',
                    'team_structure'
                ],
                legal_documents: [
                    'founders_agreement_ru',
                    'safe_en',
                    'term_sheet_ru',
                    'shareholders_agreement_ru',
                    'saas_agreement_en'
                ],
                export_formats: ['excel', 'pdf', 'pptx', 'txt', 'json', 'html'],
                validation_types: ['heuristic', 'ollama', 'advanced', 'cross_check'],
                business_tools: ['unit_economics', 'investor_prep', 'pitch_deck', 'marketing_strategy']
            },
            
            statistics: {
                node_version: process.version,
                memory_usage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
                platform: process.platform,
                arch: process.arch
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 41. Исправление обработки неправильных путей /api/api/*
app.all('/api/api/*', (req, res) => {
    const newPath = req.path.replace('/api/api/', '/api/');
    console.log(`🔄 Перенаправление с ${req.path} на ${newPath}`);
    
    req.url = newPath;
    app._router.handle(req, res);
});

// 41. Генерация бизнес-плана
app.post('/api/business-plan/generate', authenticateToken, async (req, res) => {
    try {
        const { data, options } = req.body;
        
        if (!data) {
            return res.status(400).json({
                success: false,
                error: 'Данные для бизнес-плана обязательны'
            });
        }
        
        console.log('📄 Генерация бизнес-плана...');
        
        const result = await documentGenerator.generateDocument(
            'business_plan',
            'standard',
            data,
            options || {}
        );
        
        res.json({
            success: true,
            ...result
        });
        
    } catch (error) {
        console.error('❌ Ошибка генерации бизнес-плана:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка генерации бизнес-плана: ' + error.message
        });
    }
});

// 42. Генерация Pitch Deck
app.post('/api/pitch-deck/generate', authenticateToken, async (req, res) => {
    try {
        const { data, subtype, options } = req.body;
        
        if (!data) {
            return res.status(400).json({
                success: false,
                error: 'Данные для pitch deck обязательны'
            });
        }
        
        console.log('🎤 Генерация Pitch Deck...');
        
        const result = await documentGenerator.generateDocument(
            'pitch_deck',
            subtype || 'standard',
            data,
            options || {}
        );
        
        res.json({
            success: true,
            ...result
        });
        
    } catch (error) {
        console.error('❌ Ошибка генерации Pitch Deck:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка генерации Pitch Deck: ' + error.message
        });
    }
});

// 43. Подготовка к инвесторам (комплексная)
app.post('/api/investor-prep/comprehensive', authenticateToken, async (req, res) => {
    try {
        const { business_description, options } = req.body;
        
        if (!business_description) {
            return res.status(400).json({
                success: false,
                error: 'Описание бизнеса обязательно'
            });
        }
        
        console.log('💼 Комплексная подготовка к инвесторам...');
        
        const result = await investorPrepExpert.generateInvestorPrep(
            business_description,
            options || {}
        );
        
        res.json({
            success: true,
            ...result
        });
        
    } catch (error) {
        console.error('❌ Ошибка подготовки к инвесторам:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка подготовки к инвесторам: ' + error.message
        });
    }
});

// 44. Генерация документа через PitchDeckGenerator
app.post('/api/pitch-deck/create', authenticateToken, async (req, res) => {
    try {
        const { data, template_type, options } = req.body;
        
        if (!data) {
            return res.status(400).json({
                success: false,
                error: 'Данные для презентации обязательны'
            });
        }
        
        console.log(`🎬 Генерация Pitch Deck (шаблон: ${template_type || 'pitch_deck_10'})...`);
        
        const result = await pitchDeckGenerator.generatePitchDeck(
            data,
            template_type || 'pitch_deck_10',
            options || {}
        );
        
        res.json({
            success: true,
            ...result
        });
        
    } catch (error) {
        console.error('❌ Ошибка генерации Pitch Deck:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка генерации Pitch Deck: ' + error.message
        });
    }
});

// 45. Улучшенный эндпоинт для документов
app.post('/api/documents/create', authenticateToken, async (req, res) => {
    try {
        const { type, subtype, data, options } = req.body;
        
        if (!type || !data) {
            return res.status(400).json({
                success: false,
                error: 'Тип документа и данные обязательны'
            });
        }
        
        const availableTypes = ['business_plan', 'pitch_deck', 'marketing_strategy', 'legal_document'];
        if (!availableTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                error: `Неизвестный тип документа. Доступные: ${availableTypes.join(', ')}`
            });
        }
        
        console.log(`📄 Генерация документа: ${type}${subtype ? ` (${subtype})` : ''}...`);
        
        let result;
        
        switch(type) {
            case 'business_plan':
                result = await documentGenerator.generateDocument(
                    'business_plan',
                    subtype || 'standard',
                    data,
                    options || {}
                );
                break;
                
            case 'pitch_deck':
                result = await documentGenerator.generateDocument(
                    'pitch_deck',
                    subtype || 'standard',
                    data,
                    options || {}
                );
                break;
                
            case 'marketing_strategy':
                result = await documentGenerator.generateDocument(
                    'marketing_strategy',
                    subtype || 'standard',
                    data,
                    options || {}
                );
                break;
                
            case 'legal_document':
                if (!subtype) {
                    return res.status(400).json({
                        success: false,
                        error: 'Для юридических документов укажите subtype (founders_agreement_ru, safe_en и т.д.)'
                    });
                }
                result = await legalDocumentGenerator.generateLegalDocument(
                    subtype,
                    data,
                    options || {}
                );
                break;
        }
        
        res.json({
            success: true,
            ...result
        });
        
    } catch (error) {
        console.error('❌ Ошибка генерации документа:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка генерации документа: ' + error.message
        });
    }
});

// Добавьте этот код после строки с investorPrepExpert (примерно строка 450)

// Инициализация LegalDocumentGenerator ПОСЛЕ определения класса

// Затем добавьте эндпоинты (примерно перед обработчиком 404)
app.post('/api/legal/generate', authenticateToken, async (req, res) => {
    try {
        const { document_type, data, options } = req.body;
        
        if (!document_type || !data) {
            return res.status(400).json({
                success: false,
                error: 'Тип документа и данные обязательны'
            });
        }
        
        console.log(`⚖️ Запрос на генерацию документа: ${document_type}`);
        
        const result = await legalDocumentGenerator.generateLegalDocument(
            document_type,
            data,
            options || {}
        );
        
        res.json({
            success: true,
            ...result
        });
        
    } catch (error) {
        console.error('❌ Ошибка генерации юридического документа:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка генерации: ' + error.message
        });
    }
});

// Эндпоинт для получения списка шаблонов
app.get('/api/legal/templates', authenticateToken, (req, res) => {
    try {
        const templates = legalDocumentGenerator.getAllTemplates();
        
        res.json({
            success: true,
            templates: Object.keys(templates),
            details: templates
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Ошибка получения шаблонов: ' + error.message
        });
    }
});

// ============================================
// ULTIMATE MVP GENERATOR ENDPOINTS (ИЗ SERVER 1)
// ============================================

// 1. Комплексная генерация MVP + ТЗ
app.post('/api/ultimate-mvp/generate-complete', authenticateToken, async (req, res) => {
    try {
        const { 
            businessIdea, 
            designStyle = 'modern',
            colorScheme = 'professional',
            complexity = 'enterprise',
            features = [],
            budget_range = '500000-2000000',
            timeline = '3-6 месяцев',
            team_size = '3-5 человек',
            technology_stack = 'MERN (MongoDB, Express, React, Node.js)'
        } = req.body;
        
        if (!businessIdea || businessIdea.trim().length < 50) {
            return res.status(400).json({ 
                success: false,
                error: 'Business idea must be at least 50 characters long'
            });
        }

        console.log('🚀 Комплексная генерация MVP + ТЗ запущена...');
        
        const options = {
            designStyle,
            colorScheme,
            complexity,
            features,
            budget_range,
            timeline,
            team_size,
            technology_stack
        };
        
        const result = await ultimateMVPGenerator.generateUltimateMVPWithSpec(businessIdea, options);
        
        res.json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error('❌ Ошибка комплексной генерации:', error);
        res.status(500).json({ 
            success: false,
            error: 'Complex generation failed',
            details: error.message
        });
    }
});

// 2. Генерация только ТЗ
app.post('/api/ultimate-mvp/generate-spec', authenticateToken, async (req, res) => {
    try {
        const { 
            businessIdea,
            budget_range = '500000-2000000',
            timeline = '3-6 месяцев',
            team_size = '3-5 человек',
            technology_stack = 'MERN (MongoDB, Express, React, Node.js)',
            complexity = 'enterprise',
            features = []
        } = req.body;
        
        if (!businessIdea || businessIdea.trim().length < 50) {
            return res.status(400).json({ 
                success: false,
                error: 'Business idea must be at least 50 characters long'
            });
        }

        console.log('📋 Генерация технического задания...');
        
        const options = {
            budget_range,
            timeline,
            team_size,
            technology_stack,
            complexity,
            features
        };
        
        const technicalSpec = await ultimateMVPGenerator.generateTechnicalSpec(businessIdea, options);
        
        const timestamp = Date.now();
        const hash = crypto.createHash('sha256').update(businessIdea).digest('hex');
        const filename = `technical_spec_${timestamp}_${hash.substring(0, 12)}.md`;
        
        await fs.writeFile(`generated/technical-specs/${filename}`, technicalSpec, 'utf-8');
        
        res.json({
            success: true,
            filename,
            downloadUrl: `/generated/technical-specs/${filename}`,
            size: `${Math.round(Buffer.byteLength(technicalSpec, 'utf-8') / 1024)} KB`,
            lines: technicalSpec.split('\n').length,
            message: '📋 Техническое задание успешно сгенерировано!',
            preview: technicalSpec.substring(0, 1000) + '...'
        });

    } catch (error) {
        console.error('❌ Ошибка генерации ТЗ:', error);
        res.status(500).json({ 
            success: false,
            error: 'Technical spec generation failed',
            details: error.message
        });
    }
});

// 3. Генерация только HTML приложения
app.post('/api/ultimate-mvp/generate-html', authenticateToken, async (req, res) => {
    try {
        const { 
            businessIdea, 
            designStyle = 'modern',
            colorScheme = 'professional',
            complexity = 'enterprise',
            features = []
        } = req.body;
        
        if (!businessIdea || businessIdea.trim().length < 50) {
            return res.status(400).json({ 
                success: false,
                error: 'Business idea must be at least 50 characters long'
            });
        }

        console.log('🚀 Генерация Ultimate HTML приложения...');
        
        const htmlContent = await ultimateMVPGenerator.generateUltimateMVP(businessIdea, {
            designStyle,
            colorScheme,
            complexity,
            features
        });
        
        const timestamp = Date.now();
        const hash = crypto.createHash('sha256').update(businessIdea).digest('hex');
        const filename = `ultimate_mvp_${timestamp}_${hash.substring(0, 12)}.html`;
        
        await fs.writeFile(`generated/${filename}`, htmlContent, 'utf-8');
        
        const metadata = {
            id: hash,
            filename,
            businessIdea: businessIdea.substring(0, 500),
            designStyle,
            colorScheme,
            complexity,
            features,
            generatedAt: new Date().toISOString(),
            size: Buffer.byteLength(htmlContent, 'utf-8'),
            lines: htmlContent.split('\n').length
        };
        
        await fs.writeFile(
            `generated/${filename}.meta.json`,
            JSON.stringify(metadata, null, 2),
            'utf-8'
        );
        
        await ultimateMVPGenerator.generatePreview(filename, htmlContent.substring(0, 5000));
        
        res.json({
            success: true,
            filename,
            downloadUrl: `/generated/${filename}`,
            previewUrl: `/generated/previews/${filename}.preview.html`,
            metadata,
            stats: {
                htmlSize: `${Math.round(metadata.size / 1024)} KB`,
                linesOfCode: metadata.lines
            },
            message: '🚀 Ultimate MVP успешно сгенерировано!'
        });

    } catch (error) {
        console.error('❌ Ошибка генерации HTML:', error);
        res.status(500).json({ 
            success: false,
            error: 'HTML generation failed',
            details: error.message
        });
    }
});

// 4. Получение списка проектов
app.get('/api/ultimate-mvp/projects', authenticateToken, async (req, res) => {
    try {
        const files = await fs.readdir('generated');
        const metaFiles = files.filter(f => f.endsWith('.meta.json'));
        
        const projects = [];
        
        for (const metaFile of metaFiles) {
            try {
                const metaContent = await fs.readFile(`generated/${metaFile}`, 'utf-8');
                const metadata = JSON.parse(metaContent);
                
                projects.push({
                    projectId: metadata.projectId || metadata.id,
                    businessIdea: metadata.businessIdea,
                    generatedAt: metadata.generatedAt,
                    htmlFile: metadata.htmlFile || metadata.filename,
                    specFile: metadata.specFile,
                    designStyle: metadata.designStyle,
                    complexity: metadata.complexity,
                    downloadUrls: {
                        html: metadata.htmlFile ? `/generated/${metadata.htmlFile}` : `/generated/${metadata.filename}`,
                        spec: metadata.specFile ? `/generated/technical-specs/${metadata.specFile}` : null,
                        preview: `/generated/previews/${metadata.htmlFile || metadata.filename}.preview.html`
                    },
                    stats: metadata.stats
                });
            } catch (e) {
                continue;
            }
        }
        
        projects.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
        
        res.json({
            success: true,
            projects,
            total: projects.length
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// ... [остальной код файла]

// 42. Обработчик 404 для несуществующих маршрутов
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: `Route not found: ${req.method} ${req.originalUrl}`,
        timestamp: new Date().toISOString(),
        available_routes: [
            '/api/health - Health check',
            '/api/auth/login - Authentication',
            '/api/ultimate-mvp/generate-complete - Generate complete MVP',
            '/api/ultimate-mvp/generate-spec - Generate technical specification',
            '/api/ultimate-mvp/generate-html - Generate HTML application',
            '/api/status - System status',
            '/api/ai-chat/expert - AI Business Chat',
            '/api/unitmaster-pro/analyze - Unit economics analysis',
            '/api/ideas/generate - Business idea generation'
        ]
    });
});

// ============================================
// ЗАПУСК СЕРВЕРА
// ============================================

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 STRATEGIX AI PRO запущен на порту ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`📍 http://127.0.0.1:${PORT}`);
    console.log(`📍 http://0.0.0.0:${PORT}`);
    console.log(`\n🌐 Доступные интерфейсы:`);
    console.log(`   • Главная: http://localhost:${PORT}`);
    console.log(`   • Статус: http://localhost:${PORT}/api/status`);
    console.log(`   • Здоровье: http://localhost:${PORT}/api/health`);
    console.log(`\n🔑 Тестовый аккаунт:`);
    console.log(`   • Email: test@strategix.ai`);
    console.log(`   • Password: password123`);
});

module.exports = app;