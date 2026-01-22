const fs = require('fs');
const path = require('path');

console.log('🔨 Полное перестроение класса InvestorPrepExpert...');

const serverPath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');

// Находим и заменяем весь класс InvestorPrepExpert
const newInvestorClass = `class InvestorPrepExpert {
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
            const businessType = this.detectBusinessType(businessDescription);
            
            console.log(\`💼 Подготовка к инвесторам для \${businessType}...\`);
            
            const prompt = \`На основе описания бизнеса создай полную подготовку к встрече с инвесторами:

ОПИСАНИЕ БИЗНЕСА:
\${businessDescription}

ТИП БИЗНЕСА: \${businessType}

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

Используй конкретные цифры и реалистичные предположения на основе описания бизнеса.\`;

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
                mode: mode,
                business_type: businessType
            };
            
            if (includeValidation) {
                const heuristicValidator = new EnhancedHeuristicValidator();
                
                try {
                    const heuristicCheck = heuristicValidator.advancedValidate(response, 'investor_document', businessType);
                    
                    result.validation = {
                        heuristic_check: heuristicCheck,
                        overall_confidence: heuristicCheck.overall_score || heuristicCheck.confidence_score || 70,
                        critical_issues: heuristicCheck.advanced_checks?.filter(c => c.severity === 'critical').map(c => c.issue) || [],
                        recommendations: heuristicCheck.recommendations || []
                    };
                } catch (validationError) {
                    console.error('❌ Ошибка валидации инвесторской подготовки:', validationError);
                    result.validation = {
                        heuristic_check: { verified: false, error: validationError.message },
                        overall_confidence: 60,
                        critical_issues: ['Ошибка при проверке документа'],
                        recommendations: ['Рекомендуется ручная проверка']
                    };
                }
            }
            
            result.structured_questions = this.investorQuestions;
            result.pitch_structures = this.pitchStructure;
            
            return result;
            
        } catch (error) {
            console.error('❌ Ошибка подготовки к инвесторам:', error);
            
            // Fallback результат
            const result = {
                error: error.message,
                generated_at: new Date().toISOString(),
                fallback: true,
                structured_questions: this.investorQuestions,
                pitch_structures: this.pitchStructure
            };
            
            return result;
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
}`;

// Находим и заменяем старый класс
const oldClassStart = 'class InvestorPrepExpert {';
const oldClassEnd = '} // конец класса InvestorPrepExpert или следующий class';

// Простой поиск и замена
if (content.includes(oldClassStart)) {
    const nextClassIndex = content.indexOf('class', content.indexOf(oldClassStart) + 1);
    const endIndex = nextClassIndex > 0 ? nextClassIndex : content.length;
    
    const beforeClass = content.substring(0, content.indexOf(oldClassStart));
    const afterClass = content.substring(endIndex);
    
    content = beforeClass + newInvestorClass + '\n\n' + afterClass;
    console.log('✅ Класс полностью перестроен');
} else {
    console.log('⚠️  Старый класс не найден, вставляю новый в конец файла');
    content = content + '\n\n' + newInvestorClass;
}

// Сохраняем
const backupPath = serverPath + '.rebuilt_backup';
fs.writeFileSync(backupPath, fs.readFileSync(serverPath, 'utf8'), 'utf8');
fs.writeFileSync(serverPath, content, 'utf8');

console.log('✅ Файл сохранен');
console.log('📁 Резервная копия: ' + backupPath);
console.log('\n🚀 Теперь попробуйте: npm start');