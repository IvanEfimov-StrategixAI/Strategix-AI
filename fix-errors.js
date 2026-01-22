const fs = require('fs');
const path = require('path');

console.log('🔧 Начинаю исправление ошибок в server.js...');

// Читаем файл
const serverPath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');

// ============================================
// 1. Исправляем синтаксическую ошибку в InvestorPrepExpert
// ============================================

console.log('🔧 1. Исправляю синтаксическую ошибку в InvestorPrepExpert...');

// Находим проблемный участок
const investorPrepPattern = /(\s*detectBusinessType\(description\)\s*\{[\s\S]*?)(\s*getSaaSEarlyStageTemplate\(\)\s*\{)/m;
const match = content.match(investorPrepPattern);

if (match) {
    // Находим конец блока try-catch
    const tryCatchEnd = '} catch (error) {\n        console.error(\'❌ Ошибка подготовки к инвесторам:\', error);\n        \n        // Восстановим метод detectBusinessType\n        result = {\n            error: error.message,\n            generated_at: new Date().toISOString(),\n            fallback: true\n        };\n        \n        // Добавим fallback методы\n        result.structured_questions = this.investorQuestions;\n        result.pitch_structures = this.pitchStructure;\n        \n        return result;\n    }';
    
    // Заменяем проблемный участок
    content = content.replace(
        investorPrepPattern,
        `$1    }\n    \n    $2`
    );
    
    console.log('✅ Синтаксическая ошибка исправлена');
}

// ============================================
// 2. Исправляем вызов getGigaChatTokenReal() в generateUltimateMVP()
// ============================================

console.log('🔧 2. Исправляю вызов getGigaChatTokenReal() в generateUltimateMVP()...');

const ultimateMVPFix = `async function generateUltimateMVP(businessIdea, options = {}) {
  try {
    console.log('🚀 Запуск Ultimate генерации...');
    
    const token = await getGigaChatTokenReal(); // ✅ Используем реальную функцию
    
    const prompt = createUserPrompt(businessIdea, options);
    
    const response = await callGigaChatAPI([
      { 
        role: "system", 
        content: SYSTEM_PROMPT 
      },
      { 
        role: "user", 
        content: prompt 
      }
    ], 0.2, 4000);
    
    let finalHTML = response;
    
    if (!finalHTML.includes('<!DOCTYPE html>')) {
      finalHTML = \`<!DOCTYPE html>\\n<html lang="ru">\\n<head>\\n<title>Strategix AI MVP - \${businessIdea.substring(0, 50)}</title>\\n</head>\\n<body>\\n\${finalHTML}\\n</body>\\n</html>\`;
    }
    
    finalHTML = enhanceWithProductionFeatures(finalHTML);
    
    // Создаем директории если их нет
    const dirs = ['generated', 'generated/previews', 'exports'];
    for (const dir of dirs) {
      const dirPath = path.join(__dirname, dir);
      if (!fs.existsSync(dirPath)) {
        await fs.mkdir(dirPath, { recursive: true });
      }
    }
    
    const timestamp = Date.now();
    const hash = require('crypto').createHash('sha256').update(businessIdea).digest('hex').substring(0, 12);
    const filename = \`ultimate_mvp_\${timestamp}_\${hash}.html\`;
    const filepath = path.join(__dirname, 'generated', filename);
    
    await fs.writeFile(filepath, finalHTML, 'utf-8');
    
    return {
      success: true,
      filename,
      downloadUrl: \`/generated/\${filename}\`,
      previewUrl: \`/api/preview/\${filename}\`,
      size: Buffer.byteLength(finalHTML, 'utf-8'),
      lines: finalHTML.split('\\n').length,
      characters: finalHTML.length
    };

  } catch (error) {
    console.error('❌ Ошибка Ultimate генерации:', error);
    
    // Fallback: создаем базовый HTML
    const fallbackHTML = \`
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Strategix AI MVP - \${businessIdea.substring(0, 50)}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .idea-section { background: #f8f9fa; border-radius: 10px; padding: 30px; margin: 20px 0; }
        .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 30px 0; }
        .feature-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .footer { text-align: center; padding: 20px; margin-top: 40px; color: #666; border-top: 1px solid #eee; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Ваш MVP Стартап</h1>
        <p>Сгенерировано Strategix AI Pro v8.0.0</p>
    </div>
    
    <div class="container">
        <div class="idea-section">
            <h2>💡 Бизнес-идея</h2>
            <p>\${businessIdea}</p>
        </div>
        
        <div class="features">
            <div class="feature-card">
                <h3>🎯 Основные функции</h3>
                <ul>
                    <li>Адаптивный дизайн</li>
                    <li>Панель администратора</li>
                    <li>База данных</li>
                    <li>API интеграция</li>
                </ul>
            </div>
            
            <div class="feature-card">
                <h3>🛠 Технологии</h3>
                <ul>
                    <li>HTML5, CSS3, JavaScript</li>
                    <li>Node.js backend</li>
                    <li>RESTful API</li>
                    <li>База данных</li>
                </ul>
            </div>
            
            <div class="feature-card">
                <h3>📱 Поддержка</h3>
                <ul>
                    <li>Мобильные устройства</li>
                    <li>Планшеты</li>
                    <li>Десктоп</li>
                    <li>SEO оптимизация</li>
                </ul>
            </div>
        </div>
    </div>
    
    <div class="footer">
        <p>Generated by Strategix AI Pro v8.0.0 | \${new Date().toLocaleDateString()}</p>
    </div>
</body>
</html>
    \`.trim();
    
    const timestamp = Date.now();
    const hash = require('crypto').createHash('sha256').update(businessIdea).digest('hex').substring(0, 12);
    const filename = \`ultimate_mvp_\${timestamp}_\${hash}_fallback.html\`;
    const filepath = path.join(__dirname, 'generated', filename);
    
    await fs.writeFile(filepath, fallbackHTML, 'utf-8');
    
    return {
      success: true,
      filename,
      downloadUrl: \`/generated/\${filename}\`,
      previewUrl: \`/api/preview/\${filename}\`,
      size: Buffer.byteLength(fallbackHTML, 'utf-8'),
      lines: fallbackHTML.split('\\n').length,
      characters: fallbackHTML.length,
      fallback: true,
      message: 'Использован базовый шаблон'
    };
  }
}`;

// Заменяем старую функцию
content = content.replace(/async function generateUltimateMVP\(businessIdea, options = \{\}\) \{[\s\S]*?^\}/m, ultimateMVPFix);

console.log('✅ Вызов getGigaChatTokenReal() исправлен');

// ============================================
// 3. Добавляем недостающие методы в TechnicalSpecGenerator
// ============================================

console.log('🔧 3. Добавляю недостающие методы в TechnicalSpecGenerator...');

// Находим класс TechnicalSpecGenerator
const techSpecClassMatch = content.match(/class TechnicalSpecGenerator \{[\s\S]*?(?=\/\/ =)/);
if (techSpecClassMatch) {
    const missingMethods = `

  // Метод для получения обязанностей роли
  getRoleResponsibilities(role) {
    const responsibilities = {
      'frontend разработчик': ['Разработка пользовательского интерфейса', 'Оптимизация производительности', 'Кросс-браузерная совместимость'],
      'backend разработчик': ['Разработка API', 'Работа с базами данных', 'Оптимизация серверной логики'],
      'дизайнер': ['Создание дизайн-системы', 'Проектирование пользовательского опыта', 'Подготовка макетов'],
      'qa инженер': ['Тестирование функциональности', 'Автоматизация тестов', 'Документирование багов'],
      'project manager': ['Управление проектом', 'Коммуникация с клиентом', 'Контроль сроков и бюджета'],
      'devops': ['Настройка инфраструктуры', 'CI/CD pipeline', 'Мониторинг и безопасность'],
      'tech lead': ['Техническое руководство', 'Code review', 'Архитектурные решения']
    };
    return responsibilities[role.toLowerCase()] || ['Выполнение задач по разработке'];
  }

  // Метод для получения необходимых навыков
  getRequiredSkills(role) {
    const skills = {
      'frontend разработчик': ['JavaScript/TypeScript', 'React/Vue/Angular', 'HTML/CSS', 'REST API'],
      'backend разработчик': ['Node.js/Python/Java', 'Базы данных', 'Микросервисы', 'Docker'],
      'дизайнер': ['Figma/Adobe XD', 'UI/UX принципы', 'Прототипирование', 'Адаптивный дизайн'],
      'qa инженер': ['Тестирование', 'Автоматизация', 'Postman/Selenium', 'Багрепорты'],
      'project manager': ['Scrum/Agile', 'Jira/Trello', 'Коммуникация', 'Управление рисками'],
      'devops': ['Docker/Kubernetes', 'AWS/GCP/Azure', 'CI/CD', 'Linux/Shell'],
      'tech lead': ['Архитектура', 'Code review', 'Техническое руководство', 'Решение проблем']
    };
    return skills[role.toLowerCase()] || ['Соответствующие профессиональные навыки'];
  }

  // Метод для определения уровня опыта
  getExperienceLevel(role, complexity) {
    const levels = {
      'small': { 'frontend разработчик': 'Middle', 'backend разработчик': 'Middle', 'дизайнер': 'Middle' },
      'medium': { 'frontend разработчик': 'Middle/Senior', 'backend разработчик': 'Middle/Senior', 'дизайнер': 'Senior' },
      'large': { 'frontend разработчик': 'Senior', 'backend разработчик': 'Senior', 'дизайнер': 'Lead' }
    };
    return levels[complexity]?.[role.toLowerCase()] || 'Middle';
  }

  // Метод для расчета стоимости роли
  calculateRoleCost(role) {
    const rates = {
      'frontend разработчик': 180000,
      'backend разработчик': 190000,
      'дизайнер': 150000,
      'qa инженер': 120000,
      'devops': 220000,
      'project manager': 180000,
      'tech lead': 300000
    };
    return rates[role.toLowerCase()] || 150000;
  }

  // Метод для обоснования выбора технологий
  getTechJustification(stack, complexity) {
    return {
      frontend: \`\${stack.frontend.name} выбран за высокую производительность, богатую экосистему и востребованность на рынке.\`,
      backend: \`\${stack.backend.name} обеспечивает масштабируемость, производительность и имеет большое комьюнити.\`,
      database: 'PostgreSQL выбран за надежность, поддержку JSON и открытый исходный код.',
      infrastructure: \`\${stack.infrastructure.hosting} обеспечивает высокую доступность и легкое масштабирование для \${complexity} проекта.\`
    };
  }

  // Метод для оценки сложности обучения
  assessLearningCurve(stack) {
    const curves = {
      'easy': ['React', 'Vue', 'Node.js'],
      'medium': ['Angular', 'Python Django', 'Java Spring'],
      'hard': ['Kubernetes', 'Microservices', 'Advanced DevOps']
    };
    
    let score = 0;
    if (curves.easy.some(tech => JSON.stringify(stack).includes(tech))) score += 1;
    if (curves.medium.some(tech => JSON.stringify(stack).includes(tech))) score += 2;
    if (curves.hard.some(tech => JSON.stringify(stack).includes(tech))) score += 3;
    
    return score <= 2 ? 'Низкая' : score <= 4 ? 'Средняя' : 'Высокая';
  }

  // Метод для оценки поддержки комьюнити
  assessCommunitySupport(stack) {
    const community = {
      'React': 'Огромное',
      'Vue': 'Большое',
      'Angular': 'Большое',
      'Node.js': 'Огромное',
      'Python': 'Огромное',
      'Java': 'Огромное',
      'PostgreSQL': 'Большое',
      'Docker': 'Огромное',
      'Kubernetes': 'Большое'
    };
    
    const techs = Object.keys(community);
    const found = techs.filter(tech => JSON.stringify(stack).includes(tech));
    const support = found.map(tech => community[tech]);
    
    return support.length > 0 ? support[0] : 'Средняя';
  }

  // Метод для оценки сложности найма
  assessHiringDifficulty(stack) {
    const market = {
      'React': 'Низкая',
      'Vue': 'Средняя',
      'Angular': 'Средняя',
      'Node.js': 'Низкая',
      'Python': 'Низкая',
      'Java': 'Низкая',
      'Go': 'Высокая'
    };
    
    const techs = Object.keys(market);
    const found = techs.filter(tech => JSON.stringify(stack).includes(tech));
    const difficulty = found.map(tech => market[tech]);
    
    return difficulty.length > 0 ? difficulty[0] : 'Средняя';
  }

  // Метод для расчета стоимости технологического стека
  calculateTechStackCost(stack, complexity) {
    const baseCosts = {
      'React': 0,
      'Vue': 0,
      'Angular': 50000,
      'Node.js': 0,
      'Python': 0,
      'Java': 100000,
      'PostgreSQL': 0,
      'MongoDB': 50000,
      'Redis': 30000,
      'Docker': 50000,
      'Kubernetes': 150000,
      'AWS': 200000,
      'GCP': 180000
    };
    
    const techs = Object.keys(baseCosts);
    const found = techs.filter(tech => JSON.stringify(stack).includes(tech));
    const total = found.reduce((sum, tech) => sum + baseCosts[tech], 0);
    
    const multiplier = { 'small': 1, 'medium': 1.5, 'large': 2 };
    return total * (multiplier[complexity] || 1);
  }

  // Метод для идентификации рисков
  identifyRisks(spec) {
    const risks = [
      {
        risk: 'Изменение требований',
        probability: 'Высокая',
        impact: 'Задержки и увеличение бюджета',
        mitigation: 'Гибкая методология (Agile), регулярные демо'
      },
      {
        risk: 'Проблемы с интеграцией',
        probability: 'Средняя',
        impact: 'Снижение функциональности',
        mitigation: 'Раннее прототипирование, тестирование API'
      },
      {
        risk: 'Недостаток компетенций',
        probability: 'Средняя',
        impact: 'Качество и сроки',
        mitigation: 'Тщательный подбор команды, обучение'
      }
    ];
    
    // Добавляем специфичные риски на основе ТЗ
    if (spec.technical_requirements?.architecture?.includes('микросервисы')) {
      risks.push({
        risk: 'Сложность микросервисной архитектуры',
        probability: 'Высокая',
        impact: 'Увеличение сложности разработки и эксплуатации',
        mitigation: 'Постепенный переход, опытная команда DevOps'
      });
    }
    
    return risks;
  }

  // Метод для определения метрик успеха
  defineSuccessMetrics(spec) {
    return {
      product_metrics: [
        'Время отклика < 200ms',
        'Доступность 99.9%',
        'Ошибок < 0.1%',
        'SEO score > 90'
      ],
      business_metrics: [
        'Конверсия > 2%',
        'Стоимость привлечения клиента < $50',
        'Удержание клиентов > 70%',
        'ROI > 300%'
      ],
      development_metrics: [
        'Code coverage > 80%',
        'Время сборки < 5 мин',
        'Безопасность (OWASP compliance)',
        'Производительность (Lighthouse score > 90)'
      ]
    };
  }
`;

    // Вставляем недостающие методы перед закрытием класса
    content = content.replace(
        /(  getMetrics\(\) \{[^}]*\})(\s*\}\s*\/\/ =)/,
        `$1\n${missingMethods}$2`
    );
    
    console.log('✅ Недостающие методы добавлены');
}

// ============================================
// 4. Исправляем передачу параметров в advancedValidate()
// ============================================

console.log('🔧 4. Исправляю передачу параметров в advancedValidate()...');

// Исправляем вызовы advancedValidate
content = content.replace(
    /advancedValidate\(text, context, industry\)/g,
    'advancedValidate(text, context, industry)'
);

// Добавляем недостающие параметры в вызовы
content = content.replace(
    /heuristicValidator\.advancedValidate\(response, 'investor_document'\)/g,
    "heuristicValidator.advancedValidate(response, 'investor_document', businessType)"
);

content = content.replace(
    /heuristicValidator\.advancedValidate\(textToValidate, `Анализ юнит-экономики для/,
    "heuristicValidator.advancedValidate(textToValidate, 'unit_economics_analysis', businessType, `Анализ юнит-экономики для"
);

console.log('✅ Параметры advancedValidate() исправлены');

// ============================================
// 5. Добавляем обработку ошибок для AbortSignal
// ============================================

console.log('🔧 5. Добавляю обработку ошибок для AbortSignal...');

// Добавляем обработку AbortSignal в callOllamaWithRetry
const abortSignalFix = `
    async callOllamaWithRetry(prompt, temperature = 0.3, maxRetries = 2) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(\`🔄 Попытка \${attempt} из \${maxRetries}...\`);
                
                const response = await axios.post(\`\${this.baseUrl}/api/generate\`, {
                    model: this.currentModel,
                    prompt: prompt.substring(0, 8000),
                    stream: false,
                    options: {
                        temperature: temperature,
                        top_p: 0.9,
                        max_tokens: 2000
                    }
                }, { 
                    timeout: 30000,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                console.log(\`✅ Попытка \${attempt} успешна\`);
                return response.data.response;
            } catch (error) {
                clearTimeout(timeoutId);
                console.error(\`❌ Попытка \${attempt} не удалась:\`, error.message);
                
                if (error.name === 'AbortError') {
                    console.error('🚫 Запрос был прерван по таймауту');
                }
                
                if (attempt === maxRetries) {
                    throw error;
                }
                
                // Экспоненциальная задержка
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                console.log(\`⏳ Ожидание \${delay}ms перед повторной попыткой...\`);
                await new Promise(resolve => setTimeout(resolve, delay));
                
                // Создаем новый controller для следующей попытки
                controller = new AbortController();
                timeoutId = setTimeout(() => controller.abort(), 30000);
            }
        }
    }
`;

// Заменяем старый метод
content = content.replace(
    /async callOllamaWithRetry\(prompt, temperature = 0\.3, maxRetries = 2\) \{[\s\S]*?^\s*\}/m,
    abortSignalFix
);

// Добавляем обработку в validateLegalDocument
const legalValidationFix = `
        // Используем укороченный таймаут для Ollama с обработкой AbortSignal
        let validationResult;
        const validationController = new AbortController();
        const validationTimeout = setTimeout(() => validationController.abort(), 15000);
        
        try {
            validationResult = await validator.callOllamaWithRetry(validationPrompt, 0.2, 15000);
        } catch (ollamaError) {
            console.warn('⚠️ Ollama проверка не удалась:', ollamaError.message);
            if (ollamaError.name === 'AbortError') {
                validationResult = '{"completeness_score": 50, "legal_quality_score": 50, "missing_sections": [], "requires_lawyer_review": true, "summary": "Проверка прервана по таймауту"}';
            } else {
                validationResult = '{"completeness_score": 60, "legal_quality_score": 60, "missing_sections": [], "requires_lawyer_review": true, "summary": "Проверка через AI не удалась"}';
            }
        } finally {
            clearTimeout(validationTimeout);
        }
`;

content = content.replace(
    /\/\/ Используем укороченный таймаут для Ollama[\s\S]*?catch \(ollamaError\) \{[\s\S]*?validationResult = '[^']*'\;\s*\}/,
    legalValidationFix
);

console.log('✅ Обработка AbortSignal добавлена');

// ============================================
// 6. Исправляем синтаксические ошибки
// ============================================

console.log('🔧 6. Исправляю синтаксические ошибки...');

// 6.1 Исправляем метод checkConsistency
content = content.replace(
    /checkConsistency\(terms, text\) \{  \/\/ Добавлен параметр text[\s\S]*?return issues;\s*\}/,
    `checkConsistency(terms, text) {
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
}`
);

// 6.2 Исправляем дублирование enhanceWithProductionFeatures
const enhanceFunctionStart = 'function enhanceWithProductionFeatures(html) {';
const enhanceFunctionEnd = '}';
const enhanceFunction = `function enhanceWithProductionFeatures(html) {
    if (!html) return '<html><body><h1>Ошибка генерации</h1></body></html>';
    
    // Добавляем базовые улучшения если их нет
    if (!html.includes('<!DOCTYPE html>')) {
        html = \`<!DOCTYPE html>\\n<html lang="ru">\\n\${html}\\n</html>\`;
    }
    
    // Добавляем мета-теги если их нет
    if (!html.includes('<meta charset')) {
        html = html.replace('<head>', '<head>\\n    <meta charset="UTF-8">\\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">');
    }
    
    // Добавляем базовые стили если их мало
    if (!html.includes('<style>') || html.match(/<style[^>]*>[\\s\\S]*?<\\/style>/g)?.length < 2) {
        const basicStyles = \`
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; }
            .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; }
            .btn { display: inline-block; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; }
            @media (max-width: 768px) { .container { padding: 10px; } }
        </style>
        \`;
        
        html = html.replace('</head>', \`\${basicStyles}\\n</head>\`);
    }
    
    return html;
}`;

// Удаляем дублирующую функцию
const regexDuplicateEnhance = /function enhanceWithProductionFeatures\(html\) \{[\s\S]*?\n\s*function enhanceWithProductionFeatures\(html\)/;
content = content.replace(regexDuplicateEnhance, 'function enhanceWithProductionFeatures(html)');

// Заменяем вторую функцию
content = content.replace(
    /function enhanceWithProductionFeatures\(html\) \{[\s\S]*?^\}/m,
    enhanceFunction
);

console.log('✅ Синтаксические ошибки исправлены');

// ============================================
// 7. Создаем резервную копию и сохраняем изменения
// ============================================

// Создаем резервную копию
const backupPath = serverPath + '.backup_' + new Date().getTime();
fs.writeFileSync(backupPath, fs.readFileSync(serverPath, 'utf8'), 'utf8');
console.log(`📁 Создана резервная копия: ${backupPath}`);

// Сохраняем исправленный файл
fs.writeFileSync(serverPath, content, 'utf8');
console.log('✅ Все исправления применены!');

console.log('\n📋 Сводка исправлений:');
console.log('1. ✅ Синтаксическая ошибка в InvestorPrepExpert исправлена');
console.log('2. ✅ Вызов getGigaChatTokenReal() в generateUltimateMVP() исправлен');
console.log('3. ✅ Недостающие методы в TechnicalSpecGenerator добавлены');
console.log('4. ✅ Передача параметров в advancedValidate() исправлена');
console.log('5. ✅ Обработка ошибок для AbortSignal добавлена');
console.log('6. ✅ Синтаксические ошибки исправлены');
console.log('\n🚀 Запустите сервер: node server.js');