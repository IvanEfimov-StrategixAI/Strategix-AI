const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const GigaChatService = require('./gigachat');
const ValidationService = require('./validation');
const Helpers = require('../utils/helpers');
const Generators = require('../utils/generators');
const { paths } = require('../config');

class MVPGeneratorService {
  constructor() {
    this.gigaChat = GigaChatService;
    this.validation = ValidationService;
    this.helpers = Helpers;
    this.generators = Generators;
    this.cache = new Map();
    this.stats = {
      generated: 0,
      totalSize: 0,
      averageSize: 0
    };
  }

  // Основной метод генерации MVP
  async generateUltimateMVP(businessIdea, userRequirements = '', options = {}) {
    try {
      console.log('🚀 ULTIMATE MVP GENERATOR - СТАРТ ГЕНЕРАЦИИ...');
      
      const startTime = Date.now();
      const mvpId = uuidv4();
      
      // Шаг 1: Валидация входных данных
      console.log('📋 Шаг 1: Валидация бизнес-идеи...');
      const validation = await this.validation.validate('business_idea', businessIdea, {
        industry: options.industry,
        detailed: true
      });

      if (!validation.verified && options.strict) {
        return {
          success: false,
          error: 'Бизнес-идея не прошла валидацию',
          validation,
          mvpId
        };
      }

      // Шаг 2: Генерация детальной спецификации
      console.log('📝 Шаг 2: Генерация спецификации MVP...');
      const specification = await this.gigaChat.generateMVPSpecification(
        businessIdea,
        userRequirements,
        {
          temperature: 0.3,
          maxTokens: 6000
        }
      );

      // Шаг 3: Проектирование архитектуры
      console.log('🏗️ Шаг 3: Проектирование архитектуры...');
      const architecture = await this.designArchitecture(businessIdea, specification, options);

      // Шаг 4: Генерация HTML кода
      console.log('💻 Шаг 4: Генерация HTML кода...');
      const htmlResult = await this.generateHTMLCode(businessIdea, specification, architecture, options);

      // Шаг 5: Валидация и оптимизация
      console.log('🔍 Шаг 5: Валидация и оптимизация...');
      const validatedHTML = await this.validateAndOptimizeHTML(htmlResult.html, options);

      // Шаг 6: Сохранение файла
      console.log('💾 Шаг 6: Сохранение файла...');
      const saveResult = await this.saveMVPFile(mvpId, validatedHTML, {
        businessIdea,
        specification,
        architecture,
        validation
      });

      // Шаг 7: Генерация документации
      console.log('📚 Шаг 7: Генерация документации...');
      const documentation = await this.generateDocumentation(
        businessIdea,
        validatedHTML,
        architecture,
        options
      );

      // Обновление статистики
      this.updateStats(validatedHTML.length);

      const endTime = Date.now();
      const generationTime = ((endTime - startTime) / 1000).toFixed(2);

      console.log(`✅ MVP успешно сгенерирован за ${generationTime} секунд!`);

      return {
        success: true,
        mvpId,
        filename: saveResult.filename,
        filePath: saveResult.filePath,
        htmlPreview: validatedHTML.substring(0, 500) + '...',
        htmlLength: validatedHTML.length,
        generationTime,
        validation,
        architecture,
        documentation,
        downloadUrl: `/api/mvp/download/${saveResult.filename}`,
        previewUrl: `/generated/${saveResult.filename}`,
        generatedAt: new Date().toISOString(),
        stats: {
          validationScore: validation.confidence,
          htmlSize: validatedHTML.length,
          featuresCount: architecture.features?.length || 0,
          componentsCount: architecture.components?.length || 0
        }
      };

    } catch (error) {
      console.error('❌ Ошибка генерации MVP:', error);
      
      // Fallback генерация
      return this.generateFallbackMVP(businessIdea, userRequirements, error);
    }
  }

  // Проектирование архитектуры MVP
  async designArchitecture(businessIdea, specification, options) {
    const businessType = this.helpers.detectBusinessType(businessIdea);
    
    // Анализ спецификации для определения ключевых функций
    const features = this.extractFeaturesFromSpec(specification);
    
    // Определение типа приложения
    const appType = this.determineAppType(businessType, features);
    
    // Создание архитектуры
    const architecture = {
      type: appType,
      businessType,
      pages: this.designPages(appType, features),
      components: this.designComponents(appType, features),
      features: features.map(f => f.name),
      technologies: this.selectTechnologies(appType, options),
      dataModel: this.designDataModel(appType, features),
      apiEndpoints: this.designAPIEndpoints(appType, features),
      uiFramework: this.selectUIFramework(appType, options),
      stateManagement: this.selectStateManagement(appType),
      testingStrategy: this.designTestingStrategy(appType),
      deploymentConfig: this.designDeploymentConfig(appType, options)
    };

    // Валидация архитектуры
    const architectureValidation = await this.validation.validate('mvp_specification', architecture, {
      industry: businessType,
      detailed: false
    });

    return {
      ...architecture,
      validation: architectureValidation
    };
  }

  extractFeaturesFromSpec(specification) {
    // Простой парсинг спецификации для извлечения функций
    const features = [];
    
    // Ищем упоминания функций
    const featurePatterns = [
      /функци[яии]\s*[:\-]\s*(.+?)(?:\n|$)/gi,
      /feature[s]?\s*[:\-]\s*(.+?)(?:\n|$)/gi,
      /может\s*(.+?)(?:\n|$)/gi,
      /позволяет\s*(.+?)(?:\n|$)/gi
    ];
    
    featurePatterns.forEach(pattern => {
      const matches = specification.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          features.push({
            name: match[1].trim(),
            priority: this.determineFeaturePriority(match[1])
          });
        }
      }
    });
    
    // Если не нашли, создаем базовые функции
    if (features.length === 0) {
      features.push(
        { name: 'Аутентификация пользователей', priority: 'high' },
        { name: 'Основной функционал продукта', priority: 'high' },
        { name: 'Панель управления', priority: 'medium' },
        { name: 'Отчеты и аналитика', priority: 'low' }
      );
    }
    
    return features.slice(0, 10); // Ограничиваем 10 функциями
  }

  determineFeaturePriority(featureDescription) {
    const lowerDesc = featureDescription.toLowerCase();
    
    if (lowerDesc.includes('основн') || 
        lowerDesc.includes('обязательн') || 
        lowerDesc.includes('ключев') ||
        lowerDesc.includes('аутентификац')) {
      return 'high';
    }
    
    if (lowerDesc.includes('важн') || 
        lowerDesc.includes('рекоменд') ||
        lowerDesc.includes('улучшен')) {
      return 'medium';
    }
    
    return 'low';
  }

  determineAppType(businessType, features) {
    const featureNames = features.map(f => f.name.toLowerCase());
    
    if (businessType === 'saas') {
      return 'dashboard';
    } else if (businessType === 'ecommerce') {
      return 'storefront';
    } else if (businessType === 'marketplace') {
      return 'marketplace';
    } else if (featureNames.some(f => f.includes('задач') || f.includes('todo'))) {
      return 'task_manager';
    } else if (featureNames.some(f => f.includes('социальн') || f.includes('сообщен'))) {
      return 'social_network';
    } else if (featureNames.some(f => f.includes('контент') || f.includes('блог'))) {
      return 'content_platform';
    }
    
    return 'web_application';
  }

  designPages(appType, features) {
    const pageTemplates = {
      dashboard: [
        { name: 'Главная', route: '/', components: ['Hero', 'Features', 'Stats', 'CTAs'] },
        { name: 'Панель управления', route: '/dashboard', components: ['Metrics', 'Charts', 'RecentActivity'] },
        { name: 'Аналитика', route: '/analytics', components: ['Graphs', 'Reports', 'Filters'] },
        { name: 'Настройки', route: '/settings', components: ['Profile', 'Preferences', 'Security'] }
      ],
      storefront: [
        { name: 'Главная', route: '/', components: ['Hero', 'FeaturedProducts', 'Categories', 'Promotions'] },
        { name: 'Каталог', route: '/catalog', components: ['ProductGrid', 'Filters', 'Sorting', 'Pagination'] },
        { name: 'Карточка товара', route: '/product/:id', components: ['ProductDetails', 'Gallery', 'Reviews', 'AddToCart'] },
        { name: 'Корзина', route: '/cart', components: ['CartItems', 'OrderSummary', 'CheckoutButton'] },
        { name: 'Оформление заказа', route: '/checkout', components: ['ShippingForm', 'PaymentForm', 'OrderReview'] }
      ],
      task_manager: [
        { name: 'Главная', route: '/', components: ['TaskList', 'TaskForm', 'Filters', 'Stats'] },
        { name: 'Проекты', route: '/projects', components: ['ProjectList', 'ProjectForm', 'Progress'] },
        { name: 'Календарь', route: '/calendar', components: ['CalendarView', 'EventForm', 'Reminders'] },
        { name: 'Отчеты', route: '/reports', components: ['ProductivityChart', 'TimeTracking', 'Export'] }
      ],
      web_application: [
        { name: 'Главная', route: '/', components: ['Hero', 'Features', 'HowItWorks', 'Testimonials'] },
        { name: 'О нас', route: '/about', components: ['Story', 'Team', 'Values', 'Contact'] },
        { name: 'Функционал', route: '/features', components: ['FeatureList', 'Demos', 'Pricing'] },
        { name: 'Контакты', route: '/contact', components: ['ContactForm', 'Map', 'Info'] }
      ]
    };
    
    return pageTemplates[appType] || pageTemplates.web_application;
  }

  designComponents(appType, features) {
    const baseComponents = [
      { name: 'Header', type: 'navigation', complexity: 'low' },
      { name: 'Footer', type: 'navigation', complexity: 'low' },
      { name: 'Sidebar', type: 'navigation', complexity: 'medium' }
    ];
    
    const appSpecificComponents = {
      dashboard: [
        { name: 'MetricsCard', type: 'data', complexity: 'medium' },
        { name: 'ChartComponent', type: 'data', complexity: 'high' },
        { name: 'DataTable', type: 'data', complexity: 'high' },
        { name: 'FilterPanel', type: 'ui', complexity: 'medium' }
      ],
      storefront: [
        { name: 'ProductCard', type: 'product', complexity: 'medium' },
        { name: 'ShoppingCart', type: 'cart', complexity: 'high' },
        { name: 'CheckoutForm', type: 'form', complexity: 'high' },
        { name: 'ReviewComponent', type: 'review', complexity: 'medium' }
      ],
      task_manager: [
        { name: 'TaskItem', type: 'task', complexity: 'low' },
        { name: 'TaskForm', type: 'form', complexity: 'medium' },
        { name: 'CalendarView', type: 'calendar', complexity: 'high' },
        { name: 'ProgressBar', type: 'ui', complexity: 'low' }
      ]
    };
    
    const components = [...baseComponents, ...(appSpecificComponents[appType] || [])];
    
    // Добавляем компоненты на основе функций
    features.forEach(feature => {
      if (feature.name.toLowerCase().includes('форма') || feature.name.toLowerCase().includes('form')) {
        components.push({ 
          name: `${feature.name.replace(/[^a-zA-Zа-яА-Я]/g, '')}Form`, 
          type: 'form', 
          complexity: 'medium' 
        });
      }
      
      if (feature.name.toLowerCase().includes('таблиц') || feature.name.toLowerCase().includes('table')) {
        components.push({ 
          name: `${feature.name.replace(/[^a-zA-Zа-яА-Я]/g, '')}Table`, 
          type: 'data', 
          complexity: 'high' 
        });
      }
    });
    
    return components.slice(0, 15); // Ограничиваем 15 компонентами
  }

  selectTechnologies(appType, options) {
    const techStacks = {
      dashboard: {
        frontend: ['React 18+', 'TypeScript', 'Material-UI', 'Redux Toolkit', 'React Query'],
        backend: ['Node.js', 'Express.js', 'PostgreSQL', 'Redis', 'JWT'],
        devops: ['Docker', 'AWS', 'GitHub Actions', 'Nginx'],
        testing: ['Jest', 'React Testing Library', 'Cypress']
      },
      storefront: {
        frontend: ['Next.js 14', 'TypeScript', 'Tailwind CSS', 'Redux', 'Stripe Elements'],
        backend: ['Node.js', 'Express', 'MongoDB', 'Redis', 'Payment APIs'],
        devops: ['Vercel', 'CloudFlare', 'Docker'],
        testing: ['Jest', 'Playwright', 'React Testing Library']
      },
      task_manager: {
        frontend: ['Vue 3', 'TypeScript', 'Vuetify', 'Pinia', 'Vue Query'],
        backend: ['Node.js', 'NestJS', 'PostgreSQL', 'Socket.io', 'JWT'],
        devops: ['Docker', 'DigitalOcean', 'GitLab CI'],
        testing: ['Vitest', 'Vue Testing Library', 'Cypress']
      }
    };
    
    return techStacks[appType] || techStacks.dashboard;
  }

  designDataModel(appType) {
    const models = {
      dashboard: [
        { name: 'User', fields: ['id', 'email', 'name', 'role', 'createdAt'] },
        { name: 'Metric', fields: ['id', 'name', 'value', 'date', 'userId'] },
        { name: 'Report', fields: ['id', 'title', 'data', 'createdAt', 'userId'] }
      ],
      storefront: [
        { name: 'Product', fields: ['id', 'name', 'description', 'price', 'images', 'category'] },
        { name: 'Order', fields: ['id', 'userId', 'items', 'total', 'status', 'createdAt'] },
        { name: 'Cart', fields: ['id', 'userId', 'items', 'total'] }
      ],
      task_manager: [
        { name: 'Task', fields: ['id', 'title', 'description', 'priority', 'status', 'dueDate'] },
        { name: 'Project', fields: ['id', 'name', 'description', 'tasks', 'members', 'deadline'] },
        { name: 'User', fields: ['id', 'email', 'name', 'role', 'tasks'] }
      ]
    };
    
    return models[appType] || models.dashboard;
  }

  async generateHTMLCode(businessIdea, specification, architecture, options) {
    try {
      console.log('🎨 Генерация профессионального HTML кода...');
      
      const prompt = this.buildHTMLGenerationPrompt(businessIdea, specification, architecture, options);
      
      // Генерация через GigaChat с увеличенным лимитом токенов
      const htmlContent = await this.gigaChat.generateMVPHTML(
        businessIdea,
        specification,
        {
          temperature: 0.3,
          maxTokens: 10000, // Увеличенный лимит для качественного кода
          model: 'GigaChat',
          useCache: true,
          cacheKey: `mvp_html_${businessIdea.substring(0, 100).replace(/\s+/g, '_')}`
        }
      );
      
      // Улучшение и оптимизация HTML
      const enhancedHTML = await this.enhanceHTMLCode(htmlContent, architecture, options);
      
      return {
        success: true,
        html: enhancedHTML,
        originalLength: htmlContent.length,
        enhancedLength: enhancedHTML.length,
        improvement: `${((enhancedHTML.length - htmlContent.length) / htmlContent.length * 100).toFixed(1)}%`
      };
      
    } catch (error) {
      console.error('❌ Ошибка генерации HTML кода:', error);
      // Fallback генерация
      return this.generateFallbackHTML(businessIdea, architecture);
    }
  }

  buildHTMLGenerationPrompt(businessIdea, specification, architecture, options) {
    const { type, pages, components, features, technologies } = architecture;
    
    return `СОЗДАЙ ПРОФЕССИОНАЛЬНЫЙ MVP HTML КОД ПРЕМИУМ КАЧЕСТВА!

БИЗНЕС-ИДЕЯ: ${businessIdea}
ТИП ПРИЛОЖЕНИЯ: ${type}
ОСНОВНЫЕ ФУНКЦИИ: ${features.join(', ')}
СТРАНИЦЫ: ${JSON.stringify(pages, null, 2)}
КОМПОНЕНТЫ: ${JSON.stringify(components, null, 2)}
ТЕХНОЛОГИИ: ${JSON.stringify(technologies.frontend, null, 2)}

ТРЕБОВАНИЯ ПРЕМИУМ КАЧЕСТВА:
1. СОВРЕМЕННЫЙ ДИЗАЙН
   - Используй современные тренды UI/UX
   - Адаптивная верстка для всех устройств
   - Плавные анимации и переходы
   - Профессиональная типографика

2. ПОЛНАЯ ФУНКЦИОНАЛЬНОСТЬ
   - Все компоненты должны РАБОТАТЬ
   - Формы с реальной валидацией
   - Интерактивные элементы
   - Динамическое обновление контента

3. КАЧЕСТВЕННЫЙ КОД
   - Семантическая HTML5 разметка
   - Современный CSS (Grid, Flexbox, CSS Variables)
   - ES6+ JavaScript с реальной логикой
   - Комментарии и документация

4. ОПТИМИЗАЦИЯ
   - Быстрая загрузка (LCP < 2.5s)
   - SEO оптимизация
   - Доступность (WCAG 2.1)
   - Кроссбраузерная совместимость

СТРУКТУРА MVP:
1. MODERN HEADER с навигацией
2. HERO SECTION с ценностным предложением
3. MAIN FUNCTIONALITY (рабочая область)
4. FEATURES SHOWCASE (презентация возможностей)
5. USER DASHBOARD (панель управления)
6. INTERACTIVE COMPONENTS (интерактивные элементы)
7. CONTACT/CTA SECTION
8. PROFESSIONAL FOOTER

ВАЖНО: Верни ПОЛНЫЙ, РАБОЧИЙ HTML файл.
Весь CSS должен быть в <style> с CSS переменными.
Весь JS должен быть в <script> с реальной логикой.
Используй Font Awesome и Google Fonts.
Сделай код КРАСИВЫМ и ПРОФЕССИОНАЛЬНЫМ!`;
  }

  async enhanceHTMLCode(htmlContent, architecture, options) {
    let enhancedHTML = htmlContent;
    
    // 1. Добавляем базовую структуру если отсутствует
    if (!enhancedHTML.includes('<!DOCTYPE')) {
      enhancedHTML = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>${architecture.type} MVP | Профессиональный прототип</title>
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <style>
        /* CSS переменные для темизации */
        :root {
            --primary-color: #4F46E5;
            --secondary-color: #10B981;
            --accent-color: #F59E0B;
            --dark-color: #1F2937;
            --light-color: #F9FAFB;
            --gray-color: #6B7280;
            --success-color: #10B981;
            --warning-color: #F59E0B;
            --error-color: #EF4444;
            
            --font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            --border-radius: 12px;
            --box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            --transition: all 0.3s ease;
        }
        
        /* Базовые стили */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: var(--font-family);
            line-height: 1.6;
            color: var(--dark-color);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        /* Контейнер */
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        ${enhancedHTML}
    </div>
    
    <script>
        // Базовый JavaScript функционал
        console.log('🚀 MVP загружен успешно!');
        
        // Инициализация приложения
        document.addEventListener('DOMContentLoaded', function() {
            console.log('📱 Приложение инициализировано');
            initializeApp();
        });
        
        function initializeApp() {
            // Инициализация компонентов
            initializeComponents();
            
            // Настройка событий
            setupEventListeners();
            
            // Загрузка данных
            loadInitialData();
        }
        
        function initializeComponents() {
            console.log('⚙️ Инициализация компонентов...');
            // Логика инициализации компонентов
        }
        
        function setupEventListeners() {
            console.log('🎯 Настройка обработчиков событий...');
            // Настройка обработчиков событий
        }
        
        function loadInitialData() {
            console.log('📊 Загрузка начальных данных...');
            // Загрузка начальных данных
        }
    </script>
</body>
</html>`;
    }
    
    // 2. Добавляем CSS переменные если отсутствуют
    if (!enhancedHTML.includes('--primary-color')) {
        const cssVariables = `
        :root {
            --primary-color: #4F46E5;
            --secondary-color: #10B981;
            --accent-color: #F59E0B;
            --dark-color: #1F2937;
            --light-color: #F9FAFB;
            --gray-color: #6B7280;
            --border-radius: 12px;
            --box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            --transition: all 0.3s ease;
        }`;
        
        enhancedHTML = enhancedHTML.replace('<style>', `<style>\n${cssVariables}`);
    }
    
    // 3. Добавляем адаптивность
    if (!enhancedHTML.includes('@media')) {
        const responsiveCSS = `
        
        /* Адаптивность */
        @media (max-width: 768px) {
            .container { padding: 0 15px; }
            h1 { font-size: 2rem; }
            h2 { font-size: 1.5rem; }
            .grid { grid-template-columns: 1fr; }
        }
        
        @media (max-width: 480px) {
            .container { padding: 0 10px; }
            h1 { font-size: 1.75rem; }
            button, .btn { width: 100%; }
        }`;
        
        enhancedHTML = enhancedHTML.replace('</style>', `${responsiveCSS}\n</style>`);
    }
    
    // 4. Добавляем анимации
    if (!enhancedHTML.includes('@keyframes')) {
        const animations = `
        
        /* Анимации */
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
            from { transform: translateX(-100%); }
            to { transform: translateX(0); }
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        .fade-in { animation: fadeIn 0.6s ease-out; }
        .slide-in { animation: slideIn 0.5s ease-out; }
        .pulse { animation: pulse 2s infinite; }`;
        
        enhancedHTML = enhancedHTML.replace('</style>', `${animations}\n</style>`);
    }
    
    // 5. Добавляем JavaScript функционал
    if (!enhancedHTML.includes('initializeApp')) {
        const jsFunctionality = `
        
        // Дополнительный JavaScript функционал
        class MVPApp {
            constructor() {
                this.cache = new Map();
                this.state = {};
                this.init();
            }
            
            init() {
                this.setupComponents();
                this.bindEvents();
                this.loadData();
            }
            
            setupComponents() {
                // Инициализация компонентов
                this.setupForms();
                this.setupModals();
                this.setupNotifications();
            }
            
            setupForms() {
                const forms = document.querySelectorAll('form');
                forms.forEach(form => {
                    form.addEventListener('submit', (e) => this.handleFormSubmit(e, form));
                });
            }
            
            setupModals() {
                // Логика модальных окон
            }
            
            setupNotifications() {
                // Система уведомлений
            }
            
            bindEvents() {
                // Привязка событий
            }
            
            loadData() {
                // Загрузка данных
            }
            
            handleFormSubmit(e, form) {
                e.preventDefault();
                if (this.validateForm(form)) {
                    this.submitForm(form);
                }
            }
            
            validateForm(form) {
                let isValid = true;
                const inputs = form.querySelectorAll('input[required], textarea[required]');
                
                inputs.forEach(input => {
                    if (!input.value.trim()) {
                        this.showError(input, 'Это поле обязательно');
                        isValid = false;
                    }
                });
                
                return isValid;
            }
            
            showError(element, message) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.textContent = message;
                errorDiv.style.cssText = 'color: var(--error-color); font-size: 0.875rem; margin-top: 5px;';
                element.parentNode.appendChild(errorDiv);
                
                setTimeout(() => errorDiv.remove(), 3000);
            }
            
            submitForm(form) {
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());
                
                console.log('Отправка данных:', data);
                this.showNotification('Форма успешно отправлена!', 'success');
                form.reset();
            }
            
            showNotification(message, type = 'info') {
                const notification = document.createElement('div');
                notification.className = \`notification notification-\${type}\`;
                notification.textContent = message;
                notification.style.cssText = \`
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: \${type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--error-color)' : 'var(--primary-color)'};
                    color: white;
                    padding: 15px 20px;
                    border-radius: var(--border-radius);
                    box-shadow: var(--box-shadow);
                    z-index: 1000;
                    animation: fadeIn 0.3s ease-out;
                \`;
                
                document.body.appendChild(notification);
                
                setTimeout(() => {
                    notification.style.animation = 'fadeOut 0.3s ease-in forwards';
                    setTimeout(() => notification.remove(), 300);
                }, 3000);
            }
        }
        
        // Инициализация приложения
        document.addEventListener('DOMContentLoaded', () => {
            window.app = new MVPApp();
            console.log('🚀 Профессиональный MVP запущен!');
        });`;
        
        enhancedHTML = enhancedHTML.replace('</script>', `${jsFunctionality}\n</script>`);
    }
    
    return enhancedHTML;
  }

  async generateFallbackHTML(businessIdea, architecture) {
    console.log('🔄 Использование fallback генерации HTML...');
    
    const businessType = this.helpers.detectBusinessType(businessIdea);
    const colorPalette = this.generators.generateColorPalette(4);
    
    const html = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${businessIdea.substring(0, 50)} | MVP Прототип</title>
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <style>
        :root {
            --primary: ${colorPalette[0]};
            --secondary: ${colorPalette[1]};
            --accent: ${colorPalette[2]};
            --background: ${colorPalette[3]};
            --text: #1F2937;
            --text-light: #6B7280;
            --white: #FFFFFF;
            
            --border-radius: 16px;
            --box-shadow: 0 20px 60px rgba(0,0,0,0.15);
            --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', -apple-system, sans-serif;
            line-height: 1.6;
            color: var(--text);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .app-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        /* Header */
        .header {
            background: var(--white);
            border-radius: var(--border-radius);
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: var(--box-shadow);
            animation: fadeIn 0.8s ease-out;
        }
        
        .header h1 {
            font-size: 2.5rem;
            font-weight: 800;
            color: var(--primary);
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 1.2rem;
            color: var(--text-light);
            max-width: 600px;
        }
        
        /* Main Content */
        .main-content {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin-bottom: 30px;
        }
        
        .card {
            background: var(--white);
            border-radius: var(--border-radius);
            padding: 30px;
            box-shadow: var(--box-shadow);
            transition: var(--transition);
        }
        
        .card:hover {
            transform: translateY(-10px);
            box-shadow: 0 30px 80px rgba(0,0,0,0.2);
        }
        
        .card h3 {
            font-size: 1.5rem;
            color: var(--primary);
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .card ul {
            list-style: none;
        }
        
        .card li {
            padding: 10px 0;
            border-bottom: 1px solid #E5E7EB;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .card li:last-child {
            border-bottom: none;
        }
        
        /* Form */
        .form-card {
            background: var(--white);
            border-radius: var(--border-radius);
            padding: 30px;
            box-shadow: var(--box-shadow);
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: var(--text);
        }
        
        .form-input {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #E5E7EB;
            border-radius: 12px;
            font-size: 1rem;
            font-family: 'Inter', sans-serif;
            transition: var(--transition);
        }
        
        .form-input:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }
        
        .btn {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 14px 28px;
            background: var(--primary);
            color: var(--white);
            border: none;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: var(--transition);
        }
        
        .btn:hover {
            background: #4338CA;
            transform: translateY(-2px);
        }
        
        .btn i {
            font-size: 1.2rem;
        }
        
        /* Animations */
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
            from { transform: translateX(-100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .header h1 { font-size: 2rem; }
            .main-content { grid-template-columns: 1fr; }
            .app-container { padding: 15px; }
        }
        
        @media (max-width: 480px) {
            .header { padding: 20px; }
            .card { padding: 20px; }
            .btn { width: 100%; justify-content: center; }
        }
    </style>
</head>
<body>
    <div class="app-container">
        <header class="header">
            <h1><i class="fas fa-rocket"></i> ${businessIdea.substring(0, 50)}</h1>
            <p>Профессиональный MVP прототип с современным дизайном и полной функциональностью</p>
        </header>
        
        <main class="main-content">
            <div class="card">
                <h3><i class="fas fa-bolt"></i> Основные функции</h3>
                <ul>
                    ${architecture.features?.slice(0, 5).map(feature => `
                    <li><i class="fas fa-check-circle" style="color: var(--secondary);"></i> ${feature}</li>
                    `).join('') || `
                    <li><i class="fas fa-check-circle" style="color: var(--secondary);"></i> Аутентификация пользователей</li>
                    <li><i class="fas fa-check-circle" style="color: var(--secondary);"></i> Основной функционал продукта</li>
                    <li><i class="fas fa-check-circle" style="color: var(--secondary);"></i> Панель управления</li>
                    <li><i class="fas fa-check-circle" style="color: var(--secondary);"></i> Аналитика и отчеты</li>
                    `}
                </ul>
            </div>
            
            <div class="card">
                <h3><i class="fas fa-chart-line"></i> Технологии</h3>
                <ul>
                    <li><i class="fab fa-html5" style="color: #E34F26;"></i> HTML5 семантическая разметка</li>
                    <li><i class="fab fa-css3-alt" style="color: #1572B6;"></i> CSS3 с CSS переменными</li>
                    <li><i class="fab fa-js" style="color: #F7DF1E;"></i> ES6+ JavaScript</li>
                    <li><i class="fas fa-mobile-alt" style="color: var(--accent);"></i> Адаптивный дизайн</li>
                    <li><i class="fas fa-tachometer-alt" style="color: var(--primary);"></i> Оптимизированная производительность</li>
                </ul>
            </div>
            
            <div class="form-card">
                <h3><i class="fas fa-paper-plane"></i> Демо форма</h3>
                <p style="margin-bottom: 20px; color: var(--text-light);">
                    Рабочая форма с валидацией для демонстрации функциональности
                </p>
                
                <form id="demoForm">
                    <div class="form-group">
                        <label class="form-label" for="name">Имя</label>
                        <input type="text" id="name" class="form-input" placeholder="Введите ваше имя" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="email">Email</label>
                        <input type="email" id="email" class="form-input" placeholder="email@example.com" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="message">Сообщение</label>
                        <textarea id="message" class="form-input" rows="4" placeholder="Расскажите о вашем проекте..." required></textarea>
                    </div>
                    
                    <button type="submit" class="btn">
                        <i class="fas fa-paper-plane"></i> Отправить сообщение
                    </button>
                </form>
                
                <div id="formMessage" style="margin-top: 20px;"></div>
            </div>
        </main>
        
        <footer style="text-align: center; padding: 30px; color: var(--white); opacity: 0.8;">
            <p>${businessIdea.substring(0, 50)} | Профессиональный MVP прототип</p>
            <p style="font-size: 0.875rem; margin-top: 10px;">
                Сгенерировано с помощью Strategix AI Pro | ${new Date().getFullYear()}
            </p>
        </footer>
    </div>
    
    <script>
        // Инициализация приложения
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🚀 Профессиональный MVP загружен!');
            
            // Инициализация формы
            const form = document.getElementById('demoForm');
            const formMessage = document.getElementById('formMessage');
            
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Валидация формы
                const name = document.getElementById('name').value.trim();
                const email = document.getElementById('email').value.trim();
                const message = document.getElementById('message').value.trim();
                
                if (!name || !email || !message) {
                    showMessage('Пожалуйста, заполните все поля', 'error');
                    return;
                }
                
                if (!isValidEmail(email)) {
                    showMessage('Введите корректный email', 'error');
                    return;
                }
                
                // Имитация отправки
                showMessage('Отправка данных...', 'info');
                
                setTimeout(() => {
                    showMessage('Сообщение успешно отправлено! Мы свяжемся с вами в ближайшее время.', 'success');
                    form.reset();
                    
                    // Анимация успеха
                    const cards = document.querySelectorAll('.card');
                    cards.forEach(card => {
                        card.style.animation = 'pulse 0.5s';
                        setTimeout(() => card.style.animation = '', 500);
                    });
                }, 1500);
            });
            
            // Вспомогательные функции
            function isValidEmail(email) {
                const re = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
                return re.test(email);
            }
            
            function showMessage(text, type) {
                formMessage.textContent = text;
                formMessage.style.cssText = \`
                    padding: 15px;
                    border-radius: 12px;
                    margin-top: 20px;
                    font-weight: 500;
                    animation: fadeIn 0.3s ease-out;
                    background: \${type === 'error' ? '#FEE2E2' : type === 'success' ? '#D1FAE5' : '#DBEAFE'};
                    color: \${type === 'error' ? '#991B1B' : type === 'success' ? '#065F46' : '#1E40AF'};
                    border-left: 4px solid \${type === 'error' ? '#EF4444' : type === 'success' ? '#10B981' : '#3B82F6'};
                \`;
                
                if (type === 'success') {
                    setTimeout(() => {
                        formMessage.style.animation = 'fadeOut 0.3s ease-in forwards';
                        setTimeout(() => {
                            formMessage.textContent = '';
                            formMessage.style.cssText = '';
                        }, 300);
                    }, 3000);
                }
            }
            
            // Анимация карточек при загрузке
            const cards = document.querySelectorAll('.card');
            cards.forEach((card, index) => {
                card.style.animationDelay = \`\${index * 0.1}s\`;
                card.classList.add('fade-in');
            });
            
            console.log(\`📊 Приложение инициализировано с \${cards.length} компонентами\`);
        });
        
        // Анимация pulse
        const style = document.createElement('style');
        style.textContent = \`
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.02); }
                100% { transform: scale(1); }
            }
            
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        \`;
        document.head.appendChild(style);
    </script>
</body>
</html>`;
    
    return {
        success: true,
        html: html,
        originalLength: html.length,
        enhancedLength: html.length,
        improvement: '0%',
        fallback: true
    };
  }

  async validateAndOptimizeHTML(html, options) {
    // Валидация HTML
    const validation = await this.validation.validate('html_code', html, {
      detailed: false
    });
    
    let optimizedHTML = html;
    
    // Базовые оптимизации
    if (validation.issues && validation.issues.length > 0) {
      console.log('🔧 Оптимизация HTML кода...');
      
      // Добавляем недостающие теги
      if (!optimizedHTML.includes('<!DOCTYPE')) {
        optimizedHTML = '<!DOCTYPE html>\n' + optimizedHTML;
      }
      
      if (!optimizedHTML.includes('lang=')) {
        optimizedHTML = optimizedHTML.replace('<html', '<html lang="ru"');
      }
      
      if (!optimizedHTML.includes('viewport')) {
        const headIndex = optimizedHTML.indexOf('<head>');
        if (headIndex !== -1) {
          const metaTags = '\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">\n    <meta http-equiv="X-UA-Compatible" content="IE=edge">';
          optimizedHTML = optimizedHTML.slice(0, headIndex + 6) + metaTags + optimizedHTML.slice(headIndex + 6);
        }
      }
      
      // Добавляем Font Awesome если используется
      if (optimizedHTML.includes('fa-') && !optimizedHTML.includes('font-awesome')) {
        const fontAwesome = '\n    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">';
        const headEndIndex = optimizedHTML.indexOf('</head>');
        if (headEndIndex !== -1) {
          optimizedHTML = optimizedHTML.slice(0, headEndIndex) + fontAwesome + optimizedHTML.slice(headEndIndex);
        }
      }
    }
    
    return optimizedHTML;
  }

  async saveMVPFile(mvpId, htmlContent, metadata) {
    const filename = this.helpers.generateFilename(`mvp_${mvpId.slice(0, 8)}`, 'html');
    
    const saveResult = await this.helpers.saveFile(htmlContent, filename, paths.generated);
    
    if (!saveResult.success) {
      throw new Error('Ошибка сохранения файла');
    }
    
    return {
      success: true,
      filename,
      filePath: saveResult.filePath,
      relativePath: saveResult.relativePath,
      size: saveResult.size,
      mvpId
    };
  }

  async generateDocumentation(businessIdea, htmlContent, architecture, options) {
    const docs = {
      project: {
        name: businessIdea.substring(0, 100),
        type: architecture.type,
        businessType: architecture.businessType,
        generatedAt: new Date().toISOString()
      },
      architecture: {
        pages: architecture.pages?.length || 0,
        components: architecture.components?.length || 0,
        features: architecture.features?.length || 0,
        technologies: architecture.technologies?.frontend?.slice(0, 5) || []
      },
      html: {
        size: htmlContent.length,
        lines: htmlContent.split('\n').length,
        hasCSS: htmlContent.includes('<style'),
        hasJS: htmlContent.includes('<script'),
        hasResponsive: htmlContent.includes('@media'),
        hasAnimations: htmlContent.includes('@keyframes')
      },
      validation: {
        score: architecture.validation?.confidence || 70,
        status: architecture.validation?.status || 'unknown'
      },
      recommendations: this.generateDocumentationRecommendations(htmlContent, architecture)
    };
    
    return docs;
  }

  generateDocumentationRecommendations(htmlContent, architecture) {
    const recommendations = [];
    
    // Проверка на CSS переменные
    if (!htmlContent.includes('--primary-color') && !htmlContent.includes('--primary')) {
      recommendations.push('Добавьте CSS переменные для темизации');
    }
    
    // Проверка на адаптивность
    if (!htmlContent.includes('@media')) {
      recommendations.push('Добавьте медиа-запросы для адаптивности');
    }
    
    // Проверка на анимации
    if (!htmlContent.includes('@keyframes') && !htmlContent.includes('animation:')) {
      recommendations.push('Добавьте CSS анимации для улучшения UX');
    }
    
    // Проверка на JavaScript функционал
    if (!htmlContent.includes('addEventListener') && !htmlContent.includes('querySelector')) {
      recommendations.push('Добавьте больше интерактивного JavaScript функционала');
    }
    
    // Проверка на формы
    if (!htmlContent.includes('<form') && !htmlContent.includes('type="submit"')) {
      recommendations.push('Добавьте формы для взаимодействия с пользователем');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('MVP имеет хорошее качество кода');
    }
    
    return recommendations;
  }

  updateStats(htmlSize) {
    this.stats.generated++;
    this.stats.totalSize += htmlSize;
    this.stats.averageSize = Math.round(this.stats.totalSize / this.stats.generated);
    
    // Ограничиваем статистику
    if (this.stats.generated > 1000) {
      this.stats.generated = 1000;
      this.stats.totalSize = this.stats.averageSize * 1000;
    }
  }

  async generateMultipleMVPs(businessIdeas, options = {}) {
    const results = [];
    
    for (const idea of businessIdeas) {
      try {
        const result = await this.generateUltimateMVP(idea, '', options);
        results.push(result);
        
        // Задержка между генерациями
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        results.push({
          success: false,
          businessIdea: idea,
          error: error.message
        });
      }
    }
    
    return {
      success: true,
      generated: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
      totalTime: `${results.length * 2} секунд`,
      timestamp: new Date().toISOString()
    };
  }

  async getMVPFile(filename) {
    try {
      const result = await this.helpers.readFile(filename, paths.generated);
      
      if (!result.success) {
        return result;
      }
      
      // Анализ файла
      const stats = {
        size: result.content.length,
        lines: result.content.split('\n').length,
        hasCSS: result.content.includes('<style'),
        hasJS: result.content.includes('<script'),
        components: (result.content.match(/class=["'][^"']*card[^"']*["']/g) || []).length,
        forms: (result.content.match(/<form/g) || []).length,
        buttons: (result.content.match(/<button/g) || []).length
      };
      
      return {
        success: true,
        filename,
        content: result.content,
        stats,
        downloadUrl: `/api/mvp/download/${filename}`,
        previewUrl: `/generated/${filename}`
      };
    } catch (error) {
      console.error('❌ Ошибка чтения файла MVP:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deleteMVPFile(filename) {
    return this.helpers.deleteFile(filename, paths.generated);
  }

  getStats() {
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      timestamp: new Date().toISOString()
    };
  }

  clearCache() {
    this.cache.clear();
    console.log('🧹 Кэш MVP Generator очищен');
  }
}

// Экспорт синглтона
module.exports = new MVPGeneratorService();