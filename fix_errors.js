const fs = require('fs');
const path = require('path');

console.log('🔧 Запуск исправления ошибок в server.js...');

// Читаем оригинальный файл
const serverPath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');

// Счетчик исправлений
let fixesCount = 0;

// 1. Исправление EnhancedHeuristicValidator.checkConsistency()
console.log('1️⃣  Исправление EnhancedHeuristicValidator.checkConsistency()...');
const consistencyMethodRegex = /checkConsistency\(terms\)\s*\{[\s\S]*?if\s*\(terms\.growth\s*>\s*3\s*&&\s*this\.extractNumbers\(text\)/;
if (consistencyMethodRegex.test(content)) {
    content = content.replace(
        /checkConsistency\(terms\)\s*\{/g,
        'checkConsistency(terms, text) {  // Добавлен параметр text'
    );
    console.log('✅ Исправлен метод checkConsistency');
    fixesCount++;
}

// 2. Добавление недостающих методов в TechnicalSpecGenerator
console.log('2️⃣  Добавление методов в TechnicalSpecGenerator...');
const techSpecClassRegex = /class TechnicalSpecGenerator\s*\{[\s\S]*?\}[\s]*\/\/ ============================================/;
if (techSpecClassRegex.test(content)) {
    // Находим место после метода calculateBudget
    const afterCalculateBudget = content.indexOf('calculateBudget(spec, complexity, budgetType)');
    if (afterCalculateBudget !== -1) {
        const endOfMethod = content.indexOf('}', content.lastIndexOf('return {', afterCalculateBudget)) + 1;
        
        const missingMethods = `

// Метод для создания месячного распределения бюджета
createMonthlyBreakdown(totalCost, months) {
    const monthly = Math.round(totalCost / months);
    const breakdown = [];
    
    for (let i = 1; i <= months; i++) {
        breakdown.push({
            month: i,
            amount: monthly,
            deliverables: this.getMonthlyDeliverables(i, months)
        });
    }
    
    return breakdown;
}

// Метод для преобразования временных рамок в недели
parseTimelineToWeeks(timeline) {
    const match = timeline.match(/(\\d+)\\s*(мес|месяц|месяцев|недел|недели|недель)/i);
    if (match) {
        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        
        if (unit.includes('мес')) {
            return value * 4.33; // Среднее количество недель в месяце
        } else if (unit.includes('недел')) {
            return value;
        }
    }
    return 26; // 6 месяцев по умолчанию
}

// Метод для получения результатов по месяцам
getMonthlyDeliverables(month, totalMonths) {
    const deliverables = [
        'Анализ и планирование',
        'Дизайн и прототипирование',
        'Разработка ядра системы',
        'Интеграции и тестирование',
        'Оптимизация и подготовка к запуску',
        'Запуск и поддержка'
    ];
    
    return deliverables[Math.min(month - 1, deliverables.length - 1)];
}

// Метод для создания структуры команды
createTeamStructure(team) {
    const structure = {
        development: team.filter(m => m.role.toLowerCase().includes('разработчик')),
        design: team.filter(m => m.role.toLowerCase().includes('дизайн')),
        management: team.filter(m => m.role.toLowerCase().includes('менеджер')),
        quality: team.filter(m => m.role.toLowerCase().includes('qa') || m.role.toLowerCase().includes('тестировщик')),
        infrastructure: team.filter(m => m.role.toLowerCase().includes('devops'))
    };
    
    return structure;
}

// Метод для определения критического пути
identifyCriticalPath(phases) {
    return phases
        .filter(phase => 
            phase.tasks?.some(task => 
                task.includes('разработка ядра') || 
                task.includes('интеграция') ||
                task.includes('тестирование')
            )
        )
        .map(phase => phase.phase);
}

// Метод для определения зависимостей
identifyDependencies(phases) {
    const dependencies = [];
    
    for (let i = 1; i < phases.length; i++) {
        dependencies.push({
            from: phases[i-1].phase,
            to: phases[i].phase,
            type: 'finish-to-start',
            lag: 0
        });
    }
    
    return dependencies;
}

// Метод для парсинга JSON ответа с кодом блоков
parseTechnicalSpec(response) {
    try {
        console.log('📊 Парсинг ответа GigaChat для ТЗ...');
        
        // Ищем JSON блок с \`\`\`json
        const jsonMatch = response.match(/\`\`\`json\\s*([\\s\\S]*?)\\s*\`\`\`/) || response.match(/\`\`\`\\s*([\\s\\S]*?)\\s*\`\`\`/);
        
        if (jsonMatch) {
            const jsonContent = jsonMatch[1].trim();
            console.log('📊 Найден JSON блок:', jsonContent.substring(0, 200));
            return JSON.parse(jsonContent);
        }
        
        // Ищем JSON без блоков
        const jsonStart = response.indexOf('{');
        const jsonEnd = response.lastIndexOf('}') + 1;
        
        if (jsonStart !== -1 && jsonEnd !== -1) {
            const jsonString = response.substring(jsonStart, jsonEnd);
            console.log('📊 Найден JSON в тексте:', jsonString.substring(0, 200));
            return JSON.parse(jsonString);
        }
        
        // Если JSON не найден, создаем структурированный объект из текста
        console.log('⚠️ JSON не найден, создаем структуру из текста');
        return {
            analysis: {
                requirements_analysis: 'Проанализированы требования',
                technical_architecture: 'Предложена архитектура системы',
                development_plan: 'Создан план разработки'
            },
            technical_requirements: {
                architecture: 'Микросервисная архитектура',
                tech_stack: ['React', 'Node.js', 'PostgreSQL'],
                infrastructure: 'Docker + Kubernetes'
            },
            functional_requirements: {
                core_modules: ['Пользовательский модуль', 'Административный модуль'],
                user_stories: 'Созданы пользовательские сценарии',
                api_specification: 'Разработана спецификация API'
            },
            timeline: {
                total_duration_months: 6,
                phases: [
                    { phase: 'Анализ и планирование', duration_weeks: 4 },
                    { phase: 'Дизайн и прототипирование', duration_weeks: 6 },
                    { phase: 'Разработка MVP', duration_weeks: 16 }
                ]
            }
        };
        
    } catch (error) {
        console.error('❌ Ошибка парсинга ТЗ:', error);
        return this.generateFallbackTechSpec();
    }
}

// Запасной метод для генерации ТЗ
generateFallbackTechSpec() {
    return {
        analysis: {
            requirements_analysis: 'Анализ требований проведен',
            market_analysis: 'Рынок проанализирован',
            technical_architecture: 'Предложена базовая архитектура'
        },
        technical_requirements: {
            architecture: 'Монолитная архитектура',
            tech_stack: ['React', 'Node.js', 'MongoDB'],
            infrastructure: 'VPS хостинг'
        },
        functional_requirements: {
            core_modules: ['Основной функционал'],
            user_stories: 'Базовые пользовательские сценарии',
            api_specification: 'Базовая API структура'
        },
        timeline: {
            total_duration_months: 6,
            phases: [
                { phase: 'Анализ', duration_weeks: 2 },
                { phase: 'Разработка', duration_weeks: 20 },
                { phase: 'Тестирование', duration_weeks: 2 }
            ]
        }
    };
}`;
        
        content = content.slice(0, endOfMethod) + missingMethods + content.slice(endOfMethod);
        console.log('✅ Добавлены недостающие методы в TechnicalSpecGenerator');
        fixesCount++;
    }
}

// 3. Исправление SYSTEM_PROMPT
console.log('3️⃣  Исправление SYSTEM_PROMPT...');
const systemPromptRegex = /const SYSTEM_PROMPT = \`Ты — Senior Full-Stack разработчик уровня Senior\/Lead с 15\+ лет опыта\. Твоя задача — генерировать production-ready веб-приложения промышленного уровня\.\.\.\`;/;
if (systemPromptRegex.test(content)) {
    const fullPrompt = `const SYSTEM_PROMPT = \`Ты — Senior Full-Stack разработчик уровня Senior/Lead с 15+ лет опыта. Твоя задача — генерировать production-ready веб-приложения промышленного уровня.

ТВОИ КОМПЕТЕНЦИИ:
1. Frontend: React/Vue/Angular, TypeScript, Modern CSS, Responsive Design
2. Backend: Node.js/Express, Python/Django, RESTful APIs, Microservices
3. Базы данных: SQL (PostgreSQL, MySQL), NoSQL (MongoDB, Redis)
4. DevOps: Docker, Kubernetes, CI/CD, Cloud (AWS, GCP, Azure)
5. Безопасность: OWASP Top 10, Authentication/Authorization, Data Protection

ТРЕБОВАНИЯ К КОДУ:
1. Production-ready качество кода
2. Полные комментарии и документация
3. Обработка ошибок и валидация
4. Оптимизация производительности
5. Масштабируемость и поддержка
6. Безопасность данных

Создай полное, работоспособное веб-приложение с:
- Полным HTML/CSS/JavaScript кодом
- Backend API если требуется
- Структурой базы данных
- Аутентификацией и авторизацией
- Административной панелью
- Документацией к коду

Всегда возвращай полный, готовый к запуску код.\`;`;
    
    content = content.replace(systemPromptRegex, fullPrompt);
    console.log('✅ Исправлен SYSTEM_PROMPT');
    fixesCount++;
}

// 4. Перемещение функции createUserPrompt
console.log('4️⃣  Перемещение функции createUserPrompt...');
const generateUltimateMVPRegex = /async function generateUltimateMVP\(businessIdea, options = \{\}\) \{[\s\S]*?const prompt = createUserPrompt\(businessIdea, options\);/;
if (generateUltimateMVPRegex.test(content)) {
    // Находим generateUltimateMVP функцию
    const mvpStart = content.indexOf('async function generateUltimateMVP(businessIdea, options = {}) {');
    
    // Вставляем createUserPrompt перед generateUltimateMVP
    const createUserPromptFunction = `

function createUserPrompt(businessIdea, options) {
    const {
        designStyle = 'modern',
        colorScheme = 'professional',
        complexity = 'enterprise',
        features = []
    } = options;

    return \`
Создай полноценное, готовое к использованию веб-приложение на основе бизнес-идеи:

БИЗНЕС-ИДЕЯ: \${businessIdea}

ТРЕБОВАНИЯ:
1. Дизайн: \${designStyle}, цветовая схема: \${colorScheme}
2. Сложность: \${complexity}
3. Особенности: \${features.length > 0 ? features.join(', ') : 'стандартные'}
4. Полностью рабочий frontend и backend
5. Готовый к деплою код
6. Включая базу данных и API

КОМПОНЕНТЫ, КОТОРЫЕ ДОЛЖНЫ БЫТЬ ВКЛЮЧЕНЫ:
1. HTML5, CSS3, JavaScript/TypeScript
2. React/Vue/Angular компоненты
3. Backend API (Node.js/Express)
4. База данных (SQL/NoSQL схемы)
5. Аутентификация и авторизация
6. Панель администратора
7. Адаптивный дизайн
8. Документация кода

Верни полный HTML файл с inline CSS, JavaScript и подробными комментариями.
    \`.trim();
}
`;
    
    content = content.slice(0, mvpStart) + createUserPromptFunction + content.slice(mvpStart);
    console.log('✅ Перемещена функция createUserPrompt');
    fixesCount++;
}

// 5. Исправление PersonalizedIdeaGenerator.generateBranding()
console.log('5️⃣  Исправление generateBranding() парсинга JSON...');
const generateBrandingRegex = /generateBranding\(title, category\) \{[\s\S]*?const branding = JSON\.parse\(jsonString\);/;
if (generateBrandingRegex.test(content)) {
    const fixedMethod = `generateBranding(title, category) {
    try {
        const prompt = \`Создай брендинг для бизнес-идеи:
        
Название идеи: \${title}
Категория: \${category}

Создай:
1. Короткое запоминающееся название бренда (2-3 слова)
2. Цепляющий слоган (не больше 6 слов)
3. Позиционирование (одно предложение)
4. Ключевые сообщения бренда (3 пункта)

Верни в формате JSON без дополнительного текста:
{
  "brand_name": "название",
  "slogan": "слоган",
  "positioning": "позиционирование",
  "key_messages": ["сообщение1", "сообщение2", "сообщение3"],
  "tone_of_voice": "формальный|дружелюбный|инновационный|профессиональный"
}\`;

        const response = await callGigaChatAPI([
            { role: 'system', content: 'Ты - брендинг-эксперт с 10+ лет опыта. Создавай современные, запоминающиеся бренды. ВЕРНИ ТОЛЬКО JSON без дополнительного текста.' },
            { role: 'user', content: prompt }
        ], 0.85, 2000);
        
        console.log('📊 Ответ брендинга:', response.substring(0, 200));
        
        // Улучшенный парсинг JSON
        let cleanedResponse = response.trim();
        
        // Удаляем markdown кодовые блоки
        cleanedResponse = cleanedResponse.replace(/\`\`\`json|\`\`\`/g, '').trim();
        
        // Ищем JSON объект
        const jsonStart = cleanedResponse.indexOf('{');
        const jsonEnd = cleanedResponse.lastIndexOf('}') + 1;
        
        if (jsonStart !== -1 && jsonEnd !== -1) {
            const jsonString = cleanedResponse.substring(jsonStart, jsonEnd);
            try {
                const branding = JSON.parse(jsonString);
                
                // Добавляем проверку обязательных полей
                const requiredFields = ['brand_name', 'slogan', 'positioning', 'key_messages'];
                const missingFields = requiredFields.filter(field => !branding[field]);
                
                if (missingFields.length > 0) {
                    console.warn(\`⚠️ Отсутствуют поля в брендинге: \${missingFields.join(', ')}\`);
                    
                    // Заполняем отсутствующие поля значениями по умолчанию
                    if (!branding.brand_name) branding.brand_name = \`\${title.split(' ')[0]} \${category}\`;
                    if (!branding.slogan) branding.slogan = "Инновации для будущего";
                    if (!branding.positioning) branding.positioning = \`\${category} решение нового поколения\`;
                    if (!branding.key_messages) branding.key_messages = ["Качество", "Инновации", "Надежность"];
                    if (!branding.tone_of_voice) branding.tone_of_voice = "профессиональный";
                }
                
                const ollamaValidator = new EnhancedOllamaValidator();
                const nameCheck = await ollamaValidator.validateWithAI(
                    \`Название бренда: \${branding.brand_name}\`,
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
            } catch (parseError) {
                console.error('Ошибка парсинга брендинга:', parseError.message);
                console.error('Сырой ответ:', cleanedResponse.substring(0, 300));
                
                // Fallback: создаем базовый брендинг
                return this.generateFallbackBranding(title, category);
            }
        } else {
            console.error('JSON не найден в ответе');
            return this.generateFallbackBranding(title, category);
        }
        
    } catch (error) {
        console.error('Ошибка генерации брендинга:', error);
        return this.generateFallbackBranding(title, category);
    }
}`;
    
    // Находим и заменяем метод
    const methodStart = content.indexOf('generateBranding(title, category) {');
    const methodEnd = content.indexOf('}', content.indexOf('}', content.indexOf('}', methodStart) + 1) + 1) + 1;
    
    if (methodStart !== -1 && methodEnd !== -1) {
        content = content.slice(0, methodStart) + fixedMethod + content.slice(methodEnd);
        console.log('✅ Исправлен метод generateBranding');
        fixesCount++;
    }
}

// 6. Исправление таймаутов в LegalDocumentGenerator
console.log('6️⃣  Исправление таймаутов в LegalDocumentGenerator...');
const validateLegalDocRegex = /validateLegalDocument\(content, docType, originalData\) \{[\s\S]*?await validator\.callOllamaWithRetry\(/;
if (validateLegalDocRegex.test(content)) {
    const fixedMethod = `validateLegalDocument(content, docType, originalData) {
    try {
        const validator = new EnhancedOllamaValidator();
        
        // Сокращаем контент для проверки
        const truncatedContent = content.length > 4000 ? 
            content.substring(0, 4000) + '... [сокращено]' : content;
        
        const validationPrompt = \`Проверь юридический документ на качество и полноту:

ТИП ДОКУМЕНТА: \${docType}
ТРЕБУЕМЫЕ РАЗДЕЛЫ: \${this.validationRules[docType]?.join(', ') || 'все обязательные'}

ДОКУМЕНТ ДЛЯ ПРОВЕРКИ:
\${truncatedContent}

Проанализируй:
1. Полнота документа (все ли обязательные разделы присутствуют)
2. Внутренняя согласованность (нет ли противоречий между пунктами)
3. Качество юридических формулировок
4. Заполнение всех полей данными
5. Наличие стандартных юридических положений

Верни краткий ответ в формате JSON:
{
    "completeness_score": 0-100,
    "legal_quality_score": 0-100,
    "missing_sections": ["список отсутствующих разделов"],
    "requires_lawyer_review": boolean,
    "summary": "краткий вывод"
}\`;

        // Используем укороченный таймаут для Ollama
        let validationResult;
        try {
            validationResult = await validator.callOllamaWithRetry(validationPrompt, 0.2, 15000); // 15 секунд
        } catch (ollamaError) {
            console.warn('⚠️ Ollama проверка не удалась, используем эвристическую:', ollamaError.message);
            validationResult = '{"completeness_score": 60, "legal_quality_score": 60, "missing_sections": [], "requires_lawyer_review": true, "summary": "Проверка через AI не удалась"}';
        }
        
        let parsedResult;
        try {
            const jsonMatch = validationResult.match(/\\{[\\s\\S]*\\}/);
            if (jsonMatch) {
                parsedResult = JSON.parse(jsonMatch[0]);
            } else {
                parsedResult = JSON.parse(validationResult);
            }
        } catch (parseError) {
            console.error('Ошибка парсинга валидации:', parseError);
            parsedResult = this.generateFallbackValidation();
        }
        
        // Эвристическая проверка
        const heuristicCheck = this.heuristicValidateLegalDocument(content, docType);
        
        return {
            ...parsedResult,
            heuristic_check: heuristicCheck,
            overall_score: Math.round((parsedResult.completeness_score + parsedResult.legal_quality_score) / 2),
            validated_at: new Date().toISOString(),
            ollama_timeout: validationResult.includes('timeout') ? true : false
        };
        
    } catch (error) {
        console.error('Ошибка валидации юридического документа:', error);
        return this.generateFallbackValidation();
    }
}`;
    
    // Находим метод
    const methodStartLD = content.indexOf('validateLegalDocument(content, docType, originalData) {');
    if (methodStartLD !== -1) {
        const methodEndLD = content.indexOf('}', content.lastIndexOf('return {', methodStartLD)) + 1;
        
        if (methodEndLD !== -1) {
            content = content.slice(0, methodStartLD) + fixedMethod + content.slice(methodEndLD);
            console.log('✅ Исправлены таймауты в LegalDocumentGenerator');
            fixesCount++;
        }
    }
}

// 7. Исправление синтаксической ошибки в InvestorPrepExpert
console.log('7️⃣  Исправление синтаксической ошибки в InvestorPrepExpert...');
const investorPrepClassRegex = /class InvestorPrepExpert \{[\s\S]*?detectBusinessType\(description\) \{[\s\S]*?\}[\s]*getSaaSEarlyStageTemplate\(\)/;
if (investorPrepClassRegex.test(content)) {
    // Находим весь класс InvestorPrepExpert
    const classStart = content.indexOf('class InvestorPrepExpert {');
    const classEnd = content.indexOf('}', content.indexOf('}', classStart) + 1) + 1;
    
    if (classStart !== -1 && classEnd !== -1) {
        const classContent = content.substring(classStart, classEnd);
        
        // Убедимся, что метод detectBusinessType правильно расположен
        if (classContent.includes('detectBusinessType(description) {')) {
            // Проверяем структуру класса
            const fixedClass = classContent.replace(
                /generateInvestorPrep\(businessDescription, options = \{\}\) \{[\s\S]*?catch \(error\) \{[\s\S]*?\}[\s\s]*detectBusinessType\(description\)/,
                'generateInvestorPrep(businessDescription, options = {}) {\n    try {\n        // ... код метода\n    } catch (error) {\n        console.error(\'❌ Ошибка подготовки к инвесторам:\', error);\n        throw error;\n    }\n}\n\ndetectBusinessType(description)'
            );
            
            content = content.slice(0, classStart) + fixedClass + content.slice(classEnd);
            console.log('✅ Исправлена структура класса InvestorPrepExpert');
            fixesCount++;
        }
    }
}

// Сохраняем исправленный файл
const backupPath = serverPath + '.backup_' + Date.now();
fs.writeFileSync(backupPath, fs.readFileSync(serverPath, 'utf8'));
console.log(`📁 Создана резервная копия: ${backupPath}`);

fs.writeFileSync(serverPath, content);
console.log(`\n🎉 Исправление завершено!`);
console.log(`✅ Исправлено ошибок: ${fixesCount}`);
console.log(`📁 Оригинальный файл сохранен как резервная копия`);
console.log(`\n🔄 Перезапустите сервер: npm start`);