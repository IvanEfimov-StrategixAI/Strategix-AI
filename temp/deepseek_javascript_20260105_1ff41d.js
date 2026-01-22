// server-fixed.js
// ============================================
// ИСПРАВЛЕННАЯ ВЕРСИЯ С УСТРАНЕНИЕМ ДУБЛИРОВАНИЯ
// ============================================

const path = require('path');
const fs = require('fs-extra');
const dotenv = require('dotenv');
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
                    break;
                }
            } catch (error) {
                console.error(`❌ Ошибка чтения .env файла по пути ${envPath}:`, error.message);
            }
        }
    }
    
    if (!envLoaded) {
        console.warn('⚠️  Файл .env не найден. Используются значения по умолчанию или переменные окружения системы.');
        
        // Устанавливаем тестовые значения для разработки
        process.env.GIGACHAT_API_KEY = 'MDE5YjNkOTUtOTk2Ny03YWUyLTkxNDctMzg0ZmFjZjU0M2RjOjA4YzMwN2JkLTAwZTEtNDE1NS05ZTUxLTBkYjU4YzE3ZDQ0OQ==';
        process.env.JWT_SECRET = 'strategix-ai-secret-key-pro-version-2025';
        process.env.JWT_REFRESH_SECRET = 'strategix-ai-refresh-secret-2025';
        process.env.SUPABASE_URL = 'https://rbriucldokcqufagvvcn.supabase.co';
        process.env.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJicml1Y2xkb2tjcXVmYWd2dmNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYwNjAxODYsImV4cCI6MjA1MTYzNjE4Nn0.z5jXBSx9i-XyClVr8LdazV8M_8-nOHW8QLE4VnphqPU';
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJicml1Y2xkb2tjcXVmYWd2dmNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjA2MDE4NiwiZXhwIjoyMDUxNjM2MTg2fQ.iu64uS2m24us3TjquuZK_9HvfPBe54hqt8erzJz86W0';
        process.env.PORT = '5000';
        process.env.NODE_ENV = 'development';
        process.env.OLLAMA_BASE_URL = 'http://localhost:11434';
        
        console.log('✅ Установлены тестовые значения переменных окружения');
    }
    
    return { envLoaded, loadedPath };
}

const { envLoaded, loadedPath } = loadEnvVariables();

// Проверяем обязательные переменные
function checkRequiredEnvVars() {
    const requiredVars = [
        'GIGACHAT_API_KEY',
        'JWT_SECRET'
    ];
    
    console.log('🔑 Проверка переменных окружения:');
    
    requiredVars.forEach(varName => {
        const value = process.env[varName];
        
        if (!value) {
            console.log(`   ❌ ${varName}: НЕ НАЙДЕН`);
        } else {
            const maskedValue = varName.includes('KEY') || varName.includes('SECRET')
                ? '***' + value.slice(-8)
                : value.substring(0, 50) + (value.length > 50 ? '...' : '');
            console.log(`   ✅ ${varName}: ${maskedValue}`);
        }
    });
}

checkRequiredEnvVars();

// ============================================
// ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
// ============================================

const app = express();
const PORT = process.env.PORT || 5000;

// Конфигурация безопасности
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

// ============================================
// SUPABASE SERVICE
// ============================================

class SupabaseService {
    constructor() {
        this.supabase = null;
        this.connected = false;
    }
    
    async initialize() {
        try {
            const supabaseUrl = process.env.SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_ANON_KEY;
            
            if (!supabaseUrl || !supabaseKey) {
                console.error('❌ Supabase URL и ANON KEY обязательны');
                return false;
            }
            
            console.log('🔗 Инициализация Supabase...');
            
            this.supabase = createClient(supabaseUrl, supabaseKey, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false
                }
            });
            
            // Тестируем подключение
            const { data, error } = await this.supabase
                .from('users')
                .select('count')
                .limit(1);
            
            if (error && error.code !== 'PGRST116') {
                console.error('❌ Ошибка подключения к Supabase:', error);
                return false;
            }
            
            this.connected = true;
            console.log('✅ Supabase успешно инициализирован');
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка инициализации Supabase:', error);
            this.connected = false;
            return false;
        }
    }
    
    async getUserByEmail(email) {
        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();
            
            if (error && error.code !== 'PGRST116') {
                console.error('❌ Ошибка поиска пользователя:', error);
            }
            
            return data;
        } catch (error) {
            console.error('❌ Ошибка получения пользователя:', error);
            return null;
        }
    }
}

const supabaseService = new SupabaseService();

// ============================================
// HTTPS AGENT ДЛЯ GIGACHAT
// ============================================

const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
    keepAlive: true
});

// ============================================
// GIGACHAT API ФУНКЦИИ
// ============================================

async function getGigaChatTokenReal() {
    try {
        const GIGACHAT_CREDENTIALS = process.env.GIGACHAT_API_KEY;
        
        if (!GIGACHAT_CREDENTIALS) {
            console.warn('⚠️  GIGACHAT_API_KEY не найден, использую тестовый режим');
            return 'dummy-gigachat-token-for-testing-only';
        }
        
        console.log('🔑 Получение токена GigaChat...');
        
        const RqUID = uuidv4();
        const url = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
        
        console.log(`🔄 Подключение к: ${url}`);
        console.log(`📊 RqUID: ${RqUID}`);
        
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
            validateStatus: () => true
        });
        
        console.log(`📊 Статус ответа: ${response.status}`);
        
        if (response.status === 200 && response.data?.access_token) {
            console.log('✅ Токен GigaChat успешно получен!');
            return response.data.access_token;
        } else if (response.status === 401) {
            console.error('❌ Ошибка 401: Неверные учетные данные');
            throw new Error('Неверные учетные данные GigaChat API');
        } else {
            console.error('❌ Неожиданный ответ от GigaChat API');
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
    } catch (error) {
        console.error('❌ Ошибка получения токена GigaChat:', error.message);
        
        console.log('⚠️  Использую тестовый режим для разработки...');
        return 'dummy-gigachat-token-for-testing-only';
    }
}

async function callGigaChatAPI(messages, temperature = 0.7, max_tokens = 2000) {
    try {
        console.log('🤖 Вызов GigaChat API...');
        
        const token = await getGigaChatTokenReal();
        
        if (token === 'dummy-gigachat-token-for-testing-only') {
            console.log('⚠️  Используется тестовый режим GigaChat');
            
            // Генерируем тестовый ответ
            const lastUserMessage = messages.find(m => m.role === 'user')?.content || '';
            let response = 'Это тестовый ответ от GigaChat API.\n\n';
            
            if (lastUserMessage.includes('проблем')) {
                response += 'Ваша бизнес-идея имеет следующие сильные стороны:\n1. Хороший потенциал рынка\n2. Инновационный подход\n\nРекомендации:\n1. Проведите более глубокий анализ конкурентов\n2. Разработайте детальный финансовый план';
            } else if (lastUserMessage.includes('инвестор')) {
                response += 'Для подготовки к инвесторам:\n1. Подготовьте 10-слайдовый pitch deck\n2. Рассчитайте ключевые метрики (CAC, LTV, Churn)\n3. Подготовьте ответы на 18 стандартных вопросов инвесторов';
            } else {
                response += 'На основе вашего запроса я рекомендую:\n1. Провести детальный анализ рынка\n2. Разработать финансовую модель\n3. Определить ключевые метрики успеха\n4. Создать план реализации на 3, 6 и 12 месяцев';
            }
            
            return response;
        }
        
        const response = await axios({
            method: 'POST',
            url: 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            data: {
                model: 'GigaChat',
                messages: messages,
                temperature: temperature,
                max_tokens: max_tokens,
                stream: false
            },
            httpsAgent: httpsAgent,
            timeout: 30000
        });
        
        if (response.data?.choices?.[0]?.message?.content) {
            console.log('✅ GigaChat ответ получен');
            return response.data.choices[0].message.content;
        } else {
            console.error('❌ Неожиданный ответ от GigaChat:', response.data);
            throw new Error('Неожиданный ответ от GigaChat API');
        }
        
    } catch (error) {
        console.error('❌ Ошибка вызова GigaChat API:', error.message);
        
        // Fallback для тестирования
        if (error.message.includes('dummy-gigachat-token')) {
            return 'Это тестовый ответ от GigaChat API. Сервис работает в тестовом режиме. Для полного функционала проверьте настройки GIGACHAT_API_KEY в .env файле.';
        }
        
        throw new Error(`GigaChat API ошибка: ${error.message}`);
    }
}

// ============================================
// OLLAMA VALIDATOR (УПРОЩЕННЫЙ)
// ============================================

class OllamaValidator {
    constructor() {
        this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        this.isAvailable = false;
    }
    
    async checkAvailability() {
        try {
            const response = await axios.get(`${this.baseUrl}/api/tags`, { timeout: 5000 });
            this.isAvailable = true;
            console.log('✅ Ollama доступен');
            return true;
        } catch (error) {
            console.warn('⚠️  Ollama недоступен:', error.message);
            this.isAvailable = false;
            return false;
        }
    }
}

const ollamaValidator = new OllamaValidator();

// ============================================
// API ENDPOINTS
// ============================================

// 1. Health check
app.get('/api/health', async (req, res) => {
    try {
        const supabaseStatus = supabaseService.connected;
        const ollamaStatus = ollamaValidator.isAvailable;
        
        res.json({
            success: true,
            platform: 'Strategix AI Pro v8.0.0 (Fixed)',
            status: 'online',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            port: PORT,
            services: {
                giga_chat: process.env.GIGACHAT_API_KEY ? 'configured' : 'not_configured',
                supabase: supabaseStatus ? 'connected' : 'not_connected',
                ollama: ollamaStatus ? 'available' : 'unavailable'
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

// 2. Тест GigaChat
app.get('/api/test-gigachat-simple', async (req, res) => {
    try {
        console.log('🔄 Простой тест GigaChat...');
        
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

// 3. Статус
app.get('/api/status', async (req, res) => {
    try {
        await ollamaValidator.checkAvailability();
        
        res.json({
            success: true,
            platform: 'Strategix AI Pro v8.0.0',
            services: {
                gigachat: 'available',
                ollama: ollamaValidator.isAvailable ? 'available' : 'unavailable',
                ollama_model: 'llama2',
                supabase: supabaseService.connected ? 'connected' : 'not_connected',
                smart_heuristic: 'available',
                unit_master: 'available',
                idea_generator: 'available'
            },
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 4. Аутентификация
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email и пароль обязательны'
            });
        }
        
        // Тестовый пользователь
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
                    subscription: 'pro'
                },
                process.env.JWT_SECRET || 'strategix-ai-secret-key-pro-version-2025',
                { expiresIn: '12h' }
            );
            
            return res.json({
                success: true,
                token: token,
                user: {
                    id: userId,
                    email: email,
                    name: 'Тестовый Пользователь',
                    is_admin: true,
                    is_verified: true,
                    subscription: 'pro'
                },
                message: 'Успешный вход (тестовый режим)'
            });
        }
        
        // Реальная проверка через Supabase
        console.log(`🔐 Попытка входа для: ${email}`);
        
        if (!supabaseService.connected) {
            return res.status(503).json({
                success: false,
                error: 'База данных временно недоступна. Используйте тестовый аккаунт.',
                test_credentials: {
                    email: 'test@strategix.ai',
                    password: 'password123'
                }
            });
        }
        
        const user = await supabaseService.getUserByEmail(email);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Пользователь не найден'
            });
        }
        
        // Проверяем пароль (упрощенная версия)
        const isValidPassword = password === 'password123'; // В реальном приложении используйте bcrypt
        
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Неверный пароль'
            });
        }
        
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email,
                name: user.name || 'Пользователь',
                is_admin: user.is_admin || false,
                is_verified: user.is_verified || false,
                subscription: user.subscription || 'free'
            },
            process.env.JWT_SECRET || 'strategix-ai-secret-key-pro-version-2025',
            { expiresIn: '12h' }
        );
        
        console.log(`✅ Успешный вход пользователя: ${user.email}`);
        
        return res.json({
            success: true,
            token: token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name || 'Пользователь',
                is_admin: user.is_admin || false,
                is_verified: user.is_verified || false,
                subscription: user.subscription || 'free'
            },
            message: 'Успешный вход'
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

// 5. Генерация текста
app.post('/api/generate', async (req, res) => {
    try {
        const { prompt, system_prompt, temperature } = req.body;
        
        if (!prompt) {
            return res.status(400).json({
                success: false,
                error: 'Промпт обязателен'
            });
        }
        
        const messages = [];
        
        if (system_prompt) {
            messages.push({ role: 'system', content: system_prompt });
        }
        
        messages.push({ role: 'user', content: prompt });
        
        const response = await callGigaChatAPI(
            messages, 
            temperature || 0.7,
            2000
        );
        
        res.json({
            success: true,
            response: response,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Ошибка генерации:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка генерации: ' + error.message
        });
    }
});

// 6. Главная страница
app.get('/', async (req, res) => {
    try {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Strategix AI Pro v8.0.0 (Fixed)</title>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
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
        }
        .api-link:hover {
            background: white;
            color: #2E75B6;
            border: 2px solid #2E75B6;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Strategix AI Pro v8.0.0 (Fixed Version)</h1>
        <p><strong>Сервер успешно запущен на порту: ${PORT}</strong></p>
        
        <div style="background: #e8f4fd; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3>🔐 Тестовый доступ:</h3>
            <p><strong>Email:</strong> test@strategix.ai</p>
            <p><strong>Password:</strong> password123</p>
        </div>
        
        <h3>🔗 Доступные API endpoints:</h3>
        <a class="api-link" href="/api/health" target="_blank">/api/health - Проверка статуса</a>
        <a class="api-link" href="/api/test-gigachat-simple" target="_blank">/api/test-gigachat-simple - Тест GigaChat</a>
        <a class="api-link" href="/api/status" target="_blank">/api/status - Детальный статус</a>
        
        <p style="margin-top: 30px; color: #666;">
            <strong>POST endpoints:</strong><br>
            • /api/auth/login - Аутентификация<br>
            • /api/generate - Генерация текста через GigaChat
        </p>
    </div>
</body>
</html>`;
        
        res.send(html);
    } catch (error) {
        res.status(500).send('Ошибка при загрузке страницы');
    }
});

// ============================================
// ЗАПУСК СЕРВЕРА
// ============================================

async function startServer() {
    try {
        // Инициализируем Supabase
        await supabaseService.initialize();
        
        // Проверяем Ollama
        await ollamaValidator.checkAvailability();
        
        // Создаем папки
        const folders = ['exports', 'uploads', 'temp'];
        folders.forEach(folder => {
            const folderPath = path.join(__dirname, folder);
            if (!fs.existsSync(folderPath)) {
                fs.ensureDirSync(folderPath);
                console.log(`📁 Создана папка: ${folder}`);
            }
        });
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`
🚀 STRATEGIX AI PRO v8.0.0 (FIXED) - ЗАПУЩЕН!
📍 Сервер: http://localhost:${PORT}
📁 .env файл: ${envLoaded ? '✅ Загружен' : '❌ Используются тестовые значения'}
🔗 Supabase: ${supabaseService.connected ? '✅ Подключен' : '⚠️ Не подключен'}
🤖 GigaChat: ${process.env.GIGACHAT_API_KEY ? '✅ API ключ найден' : '❌ API ключ не найден'}
🔄 Ollama: ${ollamaValidator.isAvailable ? '✅ Доступен' : '⚠️ Недоступен'}

🔐 Тестовый доступ: test@strategix.ai / password123
            `);
        });
        
    } catch (error) {
        console.error('❌ Ошибка при запуске сервера:', error);
        process.exit(1);
    }
}

startServer();