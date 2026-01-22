const { callGigaChatAPI } = require('../services/gigachat');
const { v4: uuidv4 } = require('uuid');

/**
 * УЛУЧШЕННЫЙ КЛАСС BUSINESS CHAT EXPERT
 * Профессиональный AI консультант для предпринимателей
 */
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
                system_prompt: `Ты - опытный венчурный инвестор с 15+ лет опыта в фондах Sequoia, Y Combinator, a16z. Подготовь основателя к встрече с реальными инвесторами.

СТРУКТУРА ПОДГОТОВКИ:
1. Ответы на 18 стандартных вопросов инвесторов
2. Структура Pitch Deck (10 слайдов)
3. Финансовая модель для инвесторов
4. Due Diligence Checklist
5. Сценарии встречи

Тип бизнеса: {business_type}

СТИЛЬ: Профессиональный, практический, с конкретными примерами из реальных сделок. Давай конкретные формулировки, цифры, рекомендации по подаче.`
            },
            pitch_practice: {
                id: 'pitch_practice',
                title: '🎤 Тренировка питч-сессии',
                icon: '🎤',
                system_prompt: `Ты - профессиональный тренер по питчам с опытом подготовки стартапов к Y Combinator, TechCrunch Disrupt. Проведи реалистичную тренировку выступления перед инвесторами.

ФОРМАТ ТРЕНИРОВКИ:
1. Elevator Pitch (30 секунд)
2. Полная презентация (10 минут)
3. Сложные вопросы инвесторов
4. Работа с возражениями
5. Невербальная коммуникация
6. Анализ и улучшение

Тип бизнеса: {business_type}

СТИЛЬ: Интерактивный, практический. Чередуй роли: сначала инвестор (задаю вопросы), потом тренер (даю обратную связь). Используй конкретные примеры из успешных pitch deck.`
            },
            consultant: {
                id: 'consultant',
                title: '👔 Бизнес-консультант',
                icon: '👔',
                system_prompt: `Ты - практикующий бизнес-консультант с 15+ лет реального опыта работы с компаниями от стартапов до корпораций. Давай практические, реалистичные рекомендации, основанные на данных и лучших практиках.

СТРУКТУРА КОНСУЛЬТАЦИИ:
1. Анализ текущей ситуации
2. Стратегические рекомендации
3. Тактические шаги
4. Финансовые рекомендации
5. Маркетинг и продажи
6. Команда и управление
7. Измерение результатов

Тип бизнеса: {business_type}

СТИЛЬ: Практический, структурированный, основанный на данных. Давай конкретные инструменты, шаблоны, примеры из реальных кейсов. Избегай абстрактных советов.`
            },
            growth_hacker: {
                id: 'growth_hacker',
                title: '🚀 Growth Hacking',
                icon: '🚀',
                system_prompt: `Ты - эксперт по growth hacking с опытом масштабирования стартапов от 0 до 1M+ пользователей. Предоставляй конкретные, измеримые, проверенные методы роста.

ФОКУСНЫЕ ОБЛАСТИ:
1. User Acquisition:
   - Каналы трафика с низким CAC
   - Viral loops и реферальные программы
   - Контент-маркетинг и SEO

2. Activation & Onboarding:
   - Оптимизация первого опыта
   - A/B тестирование
   - Уменьшение трения

3. Retention & Engagement:
   - Программы лояльности
   - Персонализация
   - Push-уведомления и email-маркетинг

4. Monetization:
   - Оптимизация цен
   - Upsell и cross-sell
   - Подписочные модели

5. Analytics & Optimization:
   - Ключевые метрики
   - Когортный анализ
   - Быстрые эксперименты

Тип бизнеса: {business_type}

СТИЛЬ: Конкретный, цифровой, экспериментальный. Предлагай готовые формулы, инструменты, case studies.`
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
            },
            {
                id: "growth_hacking",
                title: "🚀 Growth Hacking",
                icon: "🚀",
                prompt: "Как мне быстро вырастить мой бизнес?"
            },
            {
                id: "financial_plan",
                title: "📊 Финансовый план",
                icon: "📊",
                prompt: "Помоги составить финансовый план и прогнозы."
            }
        ];
      
        this.chatHistory = new Map();
        this.userSessions = new Map();
        this.analytics = {
            totalSessions: 0,
            totalMessages: 0,
            modesUsed: {},
            businessTypes: {}
        };
    }

    /**
     * Обработка сообщения пользователя
     */
    async processMessage(userId, message, mode = null, businessType = null, options = {}) {
        try {
            this.initializeUserSession(userId);
            
            const history = this.chatHistory.get(userId);
            const session = this.userSessions.get(userId);
            
            // Обрезка длинных сообщений
            const processedMessage = this.processInputMessage(message);
            
            // Добавление в историю
            this.addToHistory(userId, 'user', processedMessage, mode, businessType);
            
            // Обновление аналитики
            this.updateAnalytics(mode, businessType);
            
            // Получение промпта для выбранного режима
            const systemPrompt = this.getSystemPrompt(mode, businessType);
            
            // Подготовка контекста
            const contextHistory = this.getContextHistory(userId);
            const messages = [
                { role: 'system', content: systemPrompt },
                ...contextHistory
            ];
            
            console.log(`🤖 Отправка запроса в GigaChat (режим: ${mode || 'general'}, бизнес: ${businessType || 'general'})...`);
            
            // Вызов GigaChat API
            const aiResponse = await callGigaChatAPI(messages, 0.7, 4000);
            
            // Обработка ответа
            const processedResponse = this.processAIResponse(aiResponse, mode);
            
            // Сохранение ответа в историю
            this.addToHistory(userId, 'assistant', processedResponse, mode, businessType);
            
            // Обновление сессии
            this.updateUserSession(userId);
            
            // Подготовка результата
            return this.prepareResult(userId, session, processedResponse, mode, businessType);
            
        } catch (error) {
            console.error('❌ Ошибка BusinessChatExpert:', error);
            return this.handleError(userId, error, mode, businessType);
        }
    }

    /**
     * Инициализация сессии пользователя
     */
    initializeUserSession(userId) {
        if (!this.chatHistory.has(userId)) {
            this.chatHistory.set(userId, []);
            this.userSessions.set(userId, {
                id: userId,
                created: new Date(),
                messageCount: 0,
                lastActivity: new Date(),
                modesUsed: new Set(),
                businessTypes: new Set()
            });
        }
    }

    /**
     * Обработка входного сообщения
     */
    processInputMessage(message) {
        if (message.length > 2000) {
            return message.substring(0, 2000) + "... [сообщение обрезано]";
        }
        return message;
    }

    /**
     * Получение системного промпта
     */
    getSystemPrompt(mode, businessType) {
        if (mode && this.expertModes[mode]) {
            const expertMode = this.expertModes[mode];
            return expertMode.system_prompt.replace('{business_type}', businessType || 'general');
        }
        
        // Стандартный промпт для общего режима
        return `Ты - AI Business Chat Expert, профессиональный консультант для предпринимателей.
Твой опыт: 20+ лет в бизнес-консалтинге, работа с 500+ стартапами.
Отвечай подробно, с конкретными примерами, цифрами и реалистичными рекомендациями.
Формат: структурированный ответ с разделами, списками и конкретными действиями.

ДОПОЛНИТЕЛЬНЫЕ ИНСТРУКЦИИ:
1. Всегда предлагай конкретные следующие шаги
2. Используй реальные цифры и метрики
3. Приводи примеры из успешных кейсов
4. Структурируй ответ с помощью заголовков и списков
5. Давай практические рекомендации, а не общие советы`;
    }

    /**
     * Получение контекстной истории
     */
    getContextHistory(userId, maxMessages = 6) {
        const history = this.chatHistory.get(userId) || [];
        return history.slice(-maxMessages);
    }

    /**
     * Обработка ответа AI
     */
    processAIResponse(response, mode) {
        let processed = response;
        
        // Дополнительная обработка в зависимости от режима
        switch (mode) {
            case 'hard_grill':
                processed = this.enhanceHardGrillResponse(response);
                break;
            case 'investor_prep':
                processed = this.enhanceInvestorPrepResponse(response);
                break;
            case 'growth_hacker':
                processed = this.enhanceGrowthHackerResponse(response);
                break;
        }
        
        return processed;
    }

    /**
     * Улучшение ответа для режима "Hard Grill"
     */
    enhanceHardGrillResponse(response) {
        // Добавляем структуру для критического анализа
        const sections = [
            '🔍 КРИТИЧЕСКИЙ АНАЛИЗ',
            '⚠️ СЛАБЫЕ МЕСТА',
            '📊 ОЦЕНКА ШАНСОВ',
            '🚀 РЕКОМЕНДАЦИИ',
            '📝 СЛЕДУЮЩИЕ ШАГИ'
        ];
        
        let enhanced = response;
        
        // Проверяем наличие структуры
        const hasStructure = sections.some(section => response.includes(section));
        
        if (!hasStructure) {
            enhanced = `🔍 КРИТИЧЕСКИЙ АНАЛИЗ\n\n${response}\n\n`;
            enhanced += `⚠️ СЛАБЫЕ МЕСТА\n(анализ будет более конкретным при получении деталей)\n\n`;
            enhanced += `📊 ОЦЕНКА ШАНСОВ\nТребуются дополнительные данные для точной оценки\n\n`;
            enhanced += `🚀 РЕКОМЕНДАЦИИ\n1. Соберите больше данных о рынке\n2. Протестируйте гипотезы с реальными пользователями\n3. Разработайте MVP для проверки спроса\n\n`;
            enhanced += `📝 СЛЕДУЮЩИЕ ШАГИ\n1. Проведите customer development интервью (минимум 10)\n2. Проанализируйте 5 основных конкурентов\n3. Создайте финансовую модель с 3 сценариями`;
        }
        
        return enhanced;
    }

    /**
     * Улучшение ответа для подготовки к инвесторам
     */
    enhanceInvestorPrepResponse(response) {
        const templateStructure = `
🎯 ОТВЕТЫ НА КЛЮЧЕВЫЕ ВОПРОСЫ ИНВЕСТОРОВ

1. Что нового в том, что вы делаете?
2. Какую проблему решаете?
3. Почему именно сейчас?
4. Какой размер рынка?
5. В чем ваше уникальное преимущество?
6. Как будете зарабатывать?
7. Кто ваша команда?
8. Какие у вас метрики?
9. Как будете использовать инвестиции?
10. Какая ваша стратегия выхода?

📊 ФИНАНСОВЫЕ ПРОГНОЗЫ
• Год 1: Выручка $X, Расходы $Y
• Год 2: Рост Z%, Маржа W%
• Год 3: Достижение безубыточности

🎨 СТРУКТУРА PITCH DECK (10 слайдов)
1. Title Slide
2. The Problem
3. The Solution
4. Why Now?
5. Market Size
6. Product
7. Business Model
8. Competition
9. Team
10. The Ask

🚀 КЛЮЧЕВЫЕ МЕТРИКИ ДЛЯ ИНВЕСТОРОВ
• CAC: $A
• LTV: $B
• Churn: C%
• MoM Growth: D%

📋 DUE DILIGENCE CHECKLIST
1. Финансовые отчеты
2. Договоры с клиентами
3. Патенты и IP
4. Организационные документы

⏰ ТАЙМИНГ ВСТРЕЧИ
• 0-3 мин: Elevator Pitch
• 3-10 мин: Основная презентация
• 10-25 мин: Ответы на вопросы
• 25-30 мин: Next steps
`;
        
        if (!response.includes('ОТВЕТЫ НА КЛЮЧЕВЫЕ ВОПРОСЫ')) {
            return templateStructure + '\n\n' + response;
        }
        
        return response;
    }

    /**
     * Улучшение ответа для Growth Hacking
     */
    enhanceGrowthHackerResponse(response) {
        const growthFramework = `
🚀 GROWTH HACKING ФРЕЙМВОРК

📈 ПИРАМИДА РОСТА:
1. Acquisition (Привлечение)
2. Activation (Активация)
3. Retention (Удержание)
4. Revenue (Монетизация)
5. Referral (Рефералы)

🎯 БЫСТРЫЕ ПОБЕДЫ (Quick Wins):
• Оптимизация landing page
• A/B тестирование CTA
• Реферальная программа
• Контент-маркетинг

📊 КЛЮЧЕВЫЕ МЕТРИКИ:
• CAC (Customer Acquisition Cost)
• LTV (Lifetime Value)
• Conversion Rate
• Churn Rate
• Viral Coefficient

🛠️ ИНСТРУМЕНТЫ:
• Google Analytics
• Hotjar
• Mixpanel
• Optimizely
• Mailchimp

🧪 ЭКСПЕРИМЕНТЫ НА ЭТОЙ НЕДЕЛЕ:
1. Тест 2 вариантов заголовка
2. Добавление социального доказательства
3. Упрощение процесса регистрации
`;
        
        if (!response.includes('ПИРАМИДА РОСТА')) {
            return growthFramework + '\n\n' + response;
        }
        
        return response;
    }

    /**
     * Добавление сообщения в историю
     */
    addToHistory(userId, role, content, mode, businessType) {
        const history = this.chatHistory.get(userId);
        history.push({
            role: role,
            content: content,
            mode: mode,
            business_type: businessType,
            timestamp: new Date().toISOString(),
            tokens: this.estimateTokens(content)
        });
        
        // Ограничение истории 50 сообщениями
        if (history.length > 50) {
            this.chatHistory.set(userId, history.slice(-50));
        }
    }

    /**
     * Обновление аналитики
     */
    updateAnalytics(mode, businessType) {
        this.analytics.totalMessages++;
        
        if (mode) {
            this.analytics.modesUsed[mode] = (this.analytics.modesUsed[mode] || 0) + 1;
        }
        
        if (businessType) {
            this.analytics.businessTypes[businessType] = (this.analytics.businessTypes[businessType] || 0) + 1;
        }
    }

    /**
     * Обновление сессии пользователя
     */
    updateUserSession(userId) {
        const session = this.userSessions.get(userId);
        if (session) {
            session.messageCount++;
            session.lastActivity = new Date();
        }
    }

    /**
     * Подготовка результата
     */
    prepareResult(userId, session, response, mode, businessType) {
        const history = this.chatHistory.get(userId) || [];
        
        return {
            success: true,
            response: response,
            mode: mode,
            business_type: businessType,
            history_length: history.length,
            session_info: {
                message_count: session.messageCount,
                session_duration: Math.floor((new Date() - session.created) / 1000),
                last_activity: session.lastActivity,
                modes_used: Array.from(session.modesUsed || []),
                business_types: Array.from(session.businessTypes || [])
            },
            analytics: {
                estimated_tokens: this.estimateTokens(response),
                response_length: response.length,
                has_structure: this.checkResponseStructure(response)
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Обработка ошибок
     */
    handleError(userId, error, mode, businessType) {
        const fallbackResponse = this.getFallbackResponse(mode, businessType);
        
        this.addToHistory(userId, 'assistant', fallbackResponse, mode, businessType);
        
        return {
            success: false,
            response: fallbackResponse,
            mode: mode,
            business_type: businessType,
            error: error.message,
            fallback: true,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Получение запасного ответа
     */
    getFallbackResponse(mode, businessType) {
        const fallbacks = {
            hard_grill: `Анализ вашей бизнес-идеи требует детального рассмотрения. Основные моменты для проверки:
1. Проверьте product-market fit
2. Проанализируйте unit economics
3. Оцените конкурентные преимущества
4. Рассчитайте финансовые прогнозы

Рекомендуется провести более глубокий анализ с конкретными цифрами.`,
            
            investor_prep: `Для подготовки к инвесторам:
1. Подготовьте ответы на 10 ключевых вопросов
2. Создайте pitch deck из 10 слайдов
3. Разработайте финансовую модель на 3 года
4. Соберите due diligence документы

Конкретные рекомендации будут зависеть от деталей вашего бизнеса.`,
            
            growth_hacker: `Growth hacking стратегия включает:
1. Оптимизация каналов привлечения
2. Улучшение конверсии
3. Повышение удержания
4. Масштабирование работающих каналов

Для конкретных рекомендаций предоставьте больше данных о вашем продукте и метриках.`,
            
            default: `Благодарю за ваш запрос. Чтобы дать максимально точные и полезные рекомендации, уточните пожалуйста:
1. Конкретную проблему, которую вы решаете
2. Вашу целевую аудиторию
3. Текущую стадию развития бизнеса
4. Ключевые метрики (если есть)

С этой информацией я смогу дать более целевые и практические советы.`
        };
        
        return fallbacks[mode] || fallbacks.default;
    }

    /**
     * Оценка количества токенов
     */
    estimateTokens(text) {
        // Простая оценка: 1 токен ≈ 4 символа на английском, 2 символа на русском
        const russianChars = (text.match(/[а-яА-ЯёЁ]/g) || []).length;
        const otherChars = text.length - russianChars;
        return Math.ceil((russianChars / 2 + otherChars / 4) * 1.1); // 10% запас
    }

    /**
     * Проверка структуры ответа
     */
    checkResponseStructure(response) {
        const hasHeadings = /^#+ |^[\d•\-]+\s|^[А-Я][а-я]+:/m.test(response);
        const hasLists = /^[\d•\-]\s|\n[\d•\-]\s/.test(response);
        const hasSections = response.split('\n\n').length > 3;
        
        return hasHeadings && hasLists && hasSections;
    }

    /**
     * Публичные методы для внешнего использования
     */
    
    async processWithCrossValidation(userId, message, mode = null, businessType = null) {
        try {
            const gigaChatResult = await this.processMessage(userId, message, mode, businessType);
            
            // Здесь можно добавить кросс-валидацию через Ollama
            // const ollamaValidator = new EnhancedOllamaValidator();
            // const crossCheck = await ollamaValidator.crossCheckWithOllama(...);
            
            return {
                ...gigaChatResult,
                validation: {
                    // cross_check: crossCheck,
                    validated_at: new Date().toISOString(),
                    validation_method: 'basic'
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
                total_messages: history.length,
                total_tokens: history.reduce((sum, msg) => sum + (msg.tokens || 0), 0)
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
            session_id: session.id,
            session_start: session.created,
            last_activity: session.lastActivity,
            message_count: session.messageCount,
            total_messages: history.length,
            session_duration_seconds: Math.floor((new Date() - session.created) / 1000),
            modes_used: Array.from(session.modesUsed || []),
            business_types: Array.from(session.businessTypes || []),
            avg_response_length: history.length > 0 
                ? Math.round(history.reduce((sum, msg) => sum + msg.content.length, 0) / history.length)
                : 0
        };
    }

    getAnalytics() {
        return {
            ...this.analytics,
            unique_users: this.userSessions.size,
            active_sessions: Array.from(this.userSessions.values()).filter(s => 
                (new Date() - s.lastActivity) < 30 * 60 * 1000 // Активны в последние 30 минут
            ).length,
            average_session_duration: this.calculateAverageSessionDuration(),
            popular_modes: Object.entries(this.analytics.modesUsed || {})
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5),
            popular_business_types: Object.entries(this.analytics.businessTypes || {})
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
        };
    }

    calculateAverageSessionDuration() {
        const sessions = Array.from(this.userSessions.values());
        if (sessions.length === 0) return 0;
        
        const totalDuration = sessions.reduce((sum, session) => {
            return sum + (new Date() - session.created);
        }, 0);
        
        return Math.floor(totalDuration / sessions.length / 1000);
    }

    /**
     * Генерация отчета по сессии
     */
    generateSessionReport(userId) {
        const session = this.userSessions.get(userId);
        const history = this.chatHistory.get(userId) || [];
        
        if (!session || history.length === 0) {
            return null;
        }
        
        const userMessages = history.filter(msg => msg.role === 'user');
        const aiMessages = history.filter(msg => msg.role === 'assistant');
        
        // Анализ тем
        const topics = this.analyzeTopics(history);
        
        // Ключевые рекомендации
        const recommendations = this.extractRecommendations(aiMessages);
        
        return {
            session_id: session.id,
            date_range: `${session.created.toLocaleDateString()} - ${new Date().toLocaleDateString()}`,
            summary: {
                total_messages: history.length,
                user_messages: userMessages.length,
                ai_messages: aiMessages.length,
                total_tokens: history.reduce((sum, msg) => sum + (msg.tokens || 0), 0),
                avg_response_length: Math.round(aiMessages.reduce((sum, msg) => sum + msg.content.length, 0) / aiMessages.length)
            },
            topics: topics,
            key_recommendations: recommendations,
            business_insights: this.extractBusinessInsights(history),
            next_steps: this.suggestNextSteps(topics, recommendations),
            export_date: new Date().toISOString()
        };
    }

    analyzeTopics(history) {
        const topics = new Map();
        const topicKeywords = {
            финансы: ['доход', 'расход', 'прибыль', 'инвестиция', 'бюджет', 'цена', 'стоимость'],
            маркетинг: ['реклама', 'клиент', 'продажи', 'конверсия', 'трафик', 'SEO', 'соцсети'],
            продукт: ['функция', 'разработка', 'дизайн', 'UX', 'интерфейс', 'технология'],
            команда: ['сотрудник', 'найм', 'команда', 'роль', 'ответственность'],
            стратегия: ['план', 'цель', 'миссия', 'видение', 'конкурент', 'рынок']
        };
        
        history.forEach(msg => {
            const content = msg.content.toLowerCase();
            Object.entries(topicKeywords).forEach(([topic, keywords]) => {
                keywords.forEach(keyword => {
                    if (content.includes(keyword)) {
                        topics.set(topic, (topics.get(topic) || 0) + 1);
                    }
                });
            });
        });
        
        return Array.from(topics.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([topic, count]) => ({ topic, count }));
    }

    extractRecommendations(aiMessages) {
        const recommendations = [];
        const recommendationPatterns = [
            /рекомендую\s+([^.!?]+)/gi,
            /советую\s+([^.!?]+)/gi,
            /следует\s+([^.!?]+)/gi,
            /нужно\s+([^.!?]+)/gi,
            /важно\s+([^.!?]+)/gi
        ];
        
        aiMessages.forEach(msg => {
            const content = msg.content;
            recommendationPatterns.forEach(pattern => {
                const matches = content.matchAll(pattern);
                for (const match of matches) {
                    recommendations.push(match[1].trim());
                }
            });
        });
        
        return [...new Set(recommendations)].slice(0, 10); // Уникальные рекомендации, максимум 10
    }

    extractBusinessInsights(history) {
        const insights = [];
        const insightPatterns = [
            /ключевой\s+([^.!?]+)/gi,
            /главное\s+([^.!?]+)/gi,
            /основной\s+([^.!?]+)/gi,
            /важный\s+([^.!?]+)/gi,
            /критический\s+([^.!?]+)/gi
        ];
        
        history.forEach(msg => {
            const content = msg.content;
            insightPatterns.forEach(pattern => {
                const matches = content.matchAll(pattern);
                for (const match of matches) {
                    insights.push(match[1].trim());
                }
            });
        });
        
        return [...new Set(insights)].slice(0, 5);
    }

    suggestNextSteps(topics, recommendations) {
        const nextSteps = [];
        
        // На основе популярных тем
        const popularTopics = topics.slice(0, 3).map(t => t.topic);
        
        if (popularTopics.includes('финансы')) {
            nextSteps.push('Разработать детальную финансовую модель на 12 месяцев');
        }
        
        if (popularTopics.includes('маркетинг')) {
            nextSteps.push('Провести A/B тестирование ключевых маркетинговых активностей');
        }
        
        if (popularTopics.includes('продукт')) {
            nextSteps.push('Создать roadmap продукта на ближайший квартал');
        }
        
        // Добавляем общие рекомендации
        nextSteps.push('Провести customer development интервью с 10 потенциальными клиентами');
        nextSteps.push('Проанализировать 3 основных конкурента и их стратегии');
        
        return nextSteps.slice(0, 5);
    }
}

module.exports = BusinessChatExpert;