const EnhancedOllamaValidator = require('../classes/EnhancedOllamaValidator');
const EnhancedHeuristicValidator = require('../classes/EnhancedHeuristicValidator');

class ValidationService {
  constructor() {
    this.ollamaValidator = new EnhancedOllamaValidator();
    this.heuristicValidator = new EnhancedHeuristicValidator();
    this.validators = new Map();
    this.cache = new Map();
    
    // Инициализация валидаторов
    this.initValidators();
  }

  initValidators() {
    // Бизнес-валидаторы
    this.validators.set('business_idea', {
      validate: async (text) => await this.validateBusinessIdea(text),
      description: 'Валидация бизнес-идеи на реалистичность'
    });
    
    this.validators.set('financial_data', {
      validate: async (data) => await this.validateFinancialData(data),
      description: 'Валидация финансовых данных'
    });
    
    this.validators.set('market_analysis', {
      validate: async (analysis) => await this.validateMarketAnalysis(analysis),
      description: 'Валидация анализа рынка'
    });
    
    this.validators.set('mvp_specification', {
      validate: async (spec) => await this.validateMVPSpecification(spec),
      description: 'Валидация спецификации MVP'
    });
    
    this.validators.set('pitch_deck', {
      validate: async (deck) => await this.validatePitchDeck(deck),
      description: 'Валидация pitch deck'
    });
    
    // Технические валидаторы
    this.validators.set('html_code', {
      validate: async (html) => await this.validateHTMLCode(html),
      description: 'Валидация HTML кода'
    });
    
    this.validators.set('css_code', {
      validate: async (css) => await this.validateCSSCode(css),
      description: 'Валидация CSS кода'
    });
    
    this.validators.set('javascript_code', {
      validate: async (js) => await this.validateJSCode(js),
      description: 'Валидация JavaScript кода'
    });
  }

  // Основной метод валидации
  async validate(type, data, options = {}) {
    const {
      useCache = true,
      cacheKey = null,
      detailed = false,
      validateWithAI = true,
      validateWithHeuristics = true
    } = options;

    // Проверяем кэш
    if (useCache && cacheKey) {
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        console.log(`🔄 Использован кэшированный результат валидации для ${type}`);
        return cachedResult;
      }
    }

    const validator = this.validators.get(type);
    if (!validator) {
      return {
        success: false,
        error: `Валидатор для типа "${type}" не найден`,
        availableValidators: Array.from(this.validators.keys())
      };
    }

    try {
      let result = {};

      // Валидация через AI (если доступно)
      if (validateWithAI && this.ollamaValidator.isAvailable) {
        const aiResult = await this.performAIValidation(type, data, options);
        result.aiValidation = aiResult;
      }

      // Эвристическая валидация
      if (validateWithHeuristics) {
        const heuristicResult = await this.performHeuristicValidation(type, data, options);
        result.heuristicValidation = heuristicResult;
      }

      // Валидация специфичная для типа
      if (validator.validate) {
        const specificResult = await validator.validate(data, options);
        result.specificValidation = specificResult;
      }

      // Агрегируем результаты
      const aggregatedResult = this.aggregateValidationResults(result);
      
      // Кэшируем результат
      if (useCache && cacheKey) {
        this.cache.set(cacheKey, aggregatedResult);
        // Очищаем старые записи
        if (this.cache.size > 100) {
          const firstKey = this.cache.keys().next().value;
          this.cache.delete(firstKey);
        }
      }

      return detailed ? { ...aggregatedResult, details: result } : aggregatedResult;

    } catch (error) {
      console.error(`❌ Ошибка валидации ${type}:`, error);
      return {
        success: false,
        error: error.message,
        type,
        timestamp: new Date().toISOString()
      };
    }
  }

  async performAIValidation(type, data, options) {
    try {
      const prompt = this.getValidationPrompt(type, data, options);
      
      const validation = await this.ollamaValidator.validateWithAI(
        JSON.stringify(data, null, 2),
        prompt,
        options.industry || 'general'
      );

      return {
        success: true,
        verified: validation.verified || false,
        confidence: validation.confidence_score || 50,
        issues: validation.issues || [],
        recommendations: validation.recommendations || [],
        summary: validation.summary || '',
        model_used: validation.model_used || 'unknown',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.warn(`⚠️ AI валидация недоступна для ${type}:`, error.message);
      return {
        success: false,
        verified: false,
        confidence: 30,
        issues: ['AI валидация недоступна'],
        recommendations: ['Используйте эвристическую проверку'],
        error: error.message
      };
    }
  }

  async performHeuristicValidation(type, data, options) {
    try {
      const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      
      const validation = this.heuristicValidator.advancedValidate(
        text,
        type,
        options.industry || 'general'
      );

      return {
        success: true,
        verified: validation.verified || false,
        confidence: validation.overall_score || 50,
        issues: validation.issues || [],
        warnings: validation.warnings || [],
        recommendations: validation.recommendations || [],
        summary: validation.summary || '',
        metrics_found: validation.metrics_found || {},
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ Ошибка эвристической валидации ${type}:`, error);
      return {
        success: false,
        verified: false,
        confidence: 30,
        issues: ['Ошибка эвристической проверки'],
        error: error.message
      };
    }
  }

  getValidationPrompt(type, data, options) {
    const prompts = {
      business_idea: `Проверь бизнес-идею на реалистичность:
                     - Есть ли реальная потребность?
                     - Реалистичны ли предположения?
                     - Конкурентные преимущества?
                     - Потенциал масштабирования?`,
      
      financial_data: `Проверь финансовые данные:
                      - Реалистичны ли прогнозы выручки?
                      - Корректны ли расчеты затрат?
                      - Обоснованы ли финансовые показатели?
                      - Соответствие отраслевым стандартам?`,
      
      market_analysis: `Проверь анализ рынка:
                       - Корректны ли оценки размера рынка?
                       - Полный ли анализ конкурентов?
                       - Реалистичны ли тренды?
                       - Корректны ли источники данных?`,
      
      mvp_specification: `Проверь спецификацию MVP:
                         - Полный ли список функций?
                         - Реалистичны ли сроки разработки?
                         - Корректны ли технические требования?
                         - Соответствие целям бизнеса?`,
      
      pitch_deck: `Проверь pitch deck:
                  - Убедительна ли аргументация?
                  - Полный ли набор слайдов?
                  - Корректны ли финансовые обещания?
                  - Четкое ли уникальное предложение?`,
      
      html_code: `Проверь HTML код:
                 - Корректная ли семантическая разметка?
                 - Есть ли ошибки валидации?
                 - Оптимизирован ли для производительности?
                 - Соответствие стандартам доступности?`
    };

    return prompts[type] || `Проверка данных типа: ${type}`;
  }

  aggregateValidationResults(results) {
    const validations = [];
    let totalConfidence = 0;
    let validationCount = 0;
    let allIssues = [];
    let allRecommendations = [];
    let allVerified = true;

    // Собираем результаты всех валидаций
    if (results.aiValidation) {
      validations.push({ type: 'ai', ...results.aiValidation });
      totalConfidence += results.aiValidation.confidence || 0;
      validationCount++;
      allIssues.push(...(results.aiValidation.issues || []));
      allRecommendations.push(...(results.aiValidation.recommendations || []));
      allVerified = allVerified && results.aiValidation.verified;
    }

    if (results.heuristicValidation) {
      validations.push({ type: 'heuristic', ...results.heuristicValidation });
      totalConfidence += results.heuristicValidation.confidence || 0;
      validationCount++;
      allIssues.push(...(results.heuristicValidation.issues || []));
      allRecommendations.push(...(results.heuristicValidation.recommendations || []));
      allVerified = allVerified && results.heuristicValidation.verified;
    }

    if (results.specificValidation) {
      validations.push({ type: 'specific', ...results.specificValidation });
      if (results.specificValidation.confidence !== undefined) {
        totalConfidence += results.specificValidation.confidence;
        validationCount++;
      }
      allIssues.push(...(results.specificValidation.issues || []));
      allRecommendations.push(...(results.specificValidation.recommendations || []));
      allVerified = allVerified && (results.specificValidation.verified !== false);
    }

    // Уникализируем списки
    const uniqueIssues = [...new Set(allIssues)];
    const uniqueRecommendations = [...new Set(allRecommendations)];

    // Рассчитываем общую уверенность
    const overallConfidence = validationCount > 0 
      ? Math.round(totalConfidence / validationCount) 
      : 50;

    // Определяем статус
    let status;
    if (overallConfidence >= 80 && uniqueIssues.length === 0) {
      status = 'excellent';
    } else if (overallConfidence >= 60 && uniqueIssues.length <= 2) {
      status = 'good';
    } else if (overallConfidence >= 40) {
      status = 'warning';
    } else {
      status = 'critical';
    }

    return {
      success: true,
      verified: allVerified && overallConfidence >= 60,
      confidence: overallConfidence,
      status,
      issues: uniqueIssues,
      recommendations: uniqueRecommendations,
      validations: validations,
      summary: this.generateValidationSummary(overallConfidence, uniqueIssues.length, status),
      timestamp: new Date().toISOString()
    };
  }

  generateValidationSummary(confidence, issueCount, status) {
    const summaries = {
      excellent: `✅ Отличное качество (${confidence}% уверенности, ${issueCount} проблем)`,
      good: `✅ Хорошее качество (${confidence}% уверенности, ${issueCount} проблем)`,
      warning: `⚠️ Требует доработки (${confidence}% уверенности, ${issueCount} проблем)`,
      critical: `❌ Критически низкое качество (${confidence}% уверенности, ${issueCount} проблем)`
    };

    return summaries[status] || `Оценка: ${confidence}% уверенности`;
  }

  // Специфичные валидаторы
  async validateBusinessIdea(idea, options = {}) {
    const text = typeof idea === 'string' ? idea : JSON.stringify(idea, null, 2);
    
    const aiValidation = await this.performAIValidation('business_idea', text, options);
    const heuristicValidation = await this.performHeuristicValidation('business_idea', text, options);

    // Дополнительные проверки
    const specificChecks = this.performBusinessIdeaChecks(text);

    return this.aggregateValidationResults({
      aiValidation,
      heuristicValidation,
      specificValidation: specificChecks
    });
  }

  performBusinessIdeaChecks(text) {
    const issues = [];
    const recommendations = [];
    let confidence = 70;

    // Проверка длины
    if (text.length < 50) {
      issues.push('Идея слишком короткая (меньше 50 символов)');
      confidence -= 20;
      recommendations.push('Добавьте больше деталей в описание идеи');
    }

    if (text.length > 5000) {
      issues.push('Идея слишком длинная (больше 5000 символов)');
      confidence -= 10;
      recommendations.push('Сократите описание до ключевых моментов');
    }

    // Проверка на конкретику
    const hasNumbers = (text.match(/\d+/g) || []).length;
    if (hasNumbers < 2) {
      issues.push('Недостаточно конкретных цифр в описании');
      confidence -= 15;
      recommendations.push('Добавьте конкретные цифры и оценки');
    }

    // Проверка бизнес-терминов
    const businessTerms = ['рынок', 'клиент', 'доход', 'прибыль', 'затраты', 'продукт', 'услуга'];
    const foundTerms = businessTerms.filter(term => text.toLowerCase().includes(term));
    if (foundTerms.length < 3) {
      issues.push('Недостаточно бизнес-терминов в описании');
      confidence -= 10;
      recommendations.push('Используйте больше бизнес-терминологии');
    }

    return {
      verified: issues.length === 0,
      confidence: Math.max(0, confidence),
      issues,
      recommendations,
      metrics: {
        length: text.length,
        hasNumbers,
        businessTermsCount: foundTerms.length
      }
    };
  }

  async validateFinancialData(data, options = {}) {
    const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    
    const aiValidation = await this.performAIValidation('financial_data', text, options);
    const heuristicValidation = await this.performHeuristicValidation('financial_data', text, options);

    // Дополнительные финансовые проверки
    const financialChecks = this.performFinancialChecks(data);

    return this.aggregateValidationResults({
      aiValidation,
      heuristicValidation,
      specificValidation: financialChecks
    });
  }

  performFinancialChecks(data) {
    const issues = [];
    const recommendations = [];
    let confidence = 80;

    try {
      const financialData = typeof data === 'string' ? JSON.parse(data) : data;

      // Проверка наличия ключевых полей
      const requiredFields = ['revenue', 'expenses', 'profit'];
      const missingFields = requiredFields.filter(field => 
        financialData[field] === undefined || financialData[field] === null
      );

      if (missingFields.length > 0) {
        issues.push(`Отсутствуют обязательные поля: ${missingFields.join(', ')}`);
        confidence -= 20;
        recommendations.push('Добавьте все необходимые финансовые показатели');
      }

      // Проверка математической корректности
      if (financialData.revenue && financialData.expenses && financialData.profit) {
        const calculatedProfit = financialData.revenue - financialData.expenses;
        const difference = Math.abs(calculatedProfit - financialData.profit);
        
        if (difference > financialData.revenue * 0.01) { // 1% допуск
          issues.push(`Расхождение в расчетах прибыли (ожидалось: ${calculatedProfit}, указано: ${financialData.profit})`);
          confidence -= 25;
          recommendations.push('Проверьте математические расчеты');
        }
      }

      // Проверка реалистичности
      if (financialData.revenue && financialData.expenses) {
        const margin = financialData.revenue > 0 
          ? (financialData.revenue - financialData.expenses) / financialData.revenue 
          : 0;
        
        if (margin > 0.9) {
          issues.push(`Нереалистично высокая маржа: ${(margin * 100).toFixed(1)}%`);
          confidence -= 15;
          recommendations.push('Проверьте расчеты расходов');
        }

        if (margin < 0) {
          issues.push('Отрицательная маржа (убыточность)');
          confidence -= 30;
          recommendations.push('Пересмотрите бизнес-модель');
        }
      }

      return {
        verified: issues.length === 0,
        confidence: Math.max(0, confidence),
        issues,
        recommendations,
        metrics: {
          fieldsPresent: requiredFields.length - missingFields.length,
          hasCalculations: financialData.revenue && financialData.expenses && financialData.profit,
          margin: financialData.revenue ? 
            ((financialData.revenue - financialData.expenses) / financialData.revenue).toFixed(3) : 
            null
        }
      };

    } catch (error) {
      return {
        verified: false,
        confidence: 30,
        issues: ['Ошибка парсинга финансовых данных', error.message],
        recommendations: ['Проверьте формат данных']
      };
    }
  }

  async validateHTMLCode(html, options = {}) {
    const aiValidation = await this.performAIValidation('html_code', html, options);
    
    // Технические проверки HTML
    const technicalChecks = this.performHTMLChecks(html);

    return this.aggregateValidationResults({
      aiValidation,
      specificValidation: technicalChecks
    });
  }

  performHTMLChecks(html) {
    const issues = [];
    const recommendations = [];
    let confidence = 70;

    // Проверка DOCTYPE
    if (!html.includes('<!DOCTYPE')) {
      issues.push('Отсутствует DOCTYPE');
      confidence -= 10;
      recommendations.push('Добавьте <!DOCTYPE html> в начало документа');
    }

    // Проверка lang атрибута
    if (!html.includes('lang=')) {
      issues.push('Отсутствует lang атрибут');
      confidence -= 5;
      recommendations.push('Добавьте lang="ru" в тег html');
    }

    // Проверка viewport
    if (!html.includes('viewport')) {
      issues.push('Отсутствует viewport meta тег');
      confidence -= 10;
      recommendations.push('Добавьте <meta name="viewport" content="width=device-width, initial-scale=1.0">');
    }

    // Проверка семантических тегов
    const semanticTags = ['header', 'nav', 'main', 'section', 'article', 'aside', 'footer'];
    const foundSemanticTags = semanticTags.filter(tag => html.includes(`<${tag}`));
    
    if (foundSemanticTags.length < 3) {
      issues.push('Недостаточно семантических тегов');
      confidence -= 15;
      recommendations.push('Используйте больше семантических тегов для улучшения SEO и доступности');
    }

    // Проверка на наличие CSS
    if (!html.includes('<style') && !html.includes('.css')) {
      issues.push('Отсутствует CSS');
      confidence -= 20;
      recommendations.push('Добавьте CSS стили для оформления');
    }

    // Проверка на наличие JS
    if (!html.includes('<script') && !html.includes('.js')) {
      issues.push('Отсутствует JavaScript');
      confidence -= 15;
      recommendations.push('Добавьте JavaScript для интерактивности');
    }

    // Проверка размера
    const size = Buffer.from(html).length;
    if (size < 1000) {
      issues.push('HTML слишком короткий (меньше 1KB)');
      confidence -= 20;
      recommendations.push('Добавьте больше контента и функционала');
    }

    if (size > 500000) {
      issues.push('HTML слишком большой (больше 500KB)');
      confidence -= 10;
      recommendations.push('Оптимизируйте код, возможно, вынесите CSS и JS в отдельные файлы');
    }

    return {
      verified: issues.length === 0,
      confidence: Math.max(0, confidence),
      issues,
      recommendations,
      metrics: {
        sizeKB: (size / 1024).toFixed(2),
        semanticTagsCount: foundSemanticTags.length,
        hasCSS: html.includes('<style') || html.includes('.css'),
        hasJS: html.includes('<script') || html.includes('.js'),
        hasDoctype: html.includes('<!DOCTYPE'),
        hasViewport: html.includes('viewport')
      }
    };
  }

  // Очистка кэша
  clearCache() {
    this.cache.clear();
    console.log('🧹 Кэш валидации очищен');
  }

  // Получение статистики
  getStats() {
    return {
      validatorsCount: this.validators.size,
      cacheSize: this.cache.size,
      ollamaAvailable: this.ollamaValidator.isAvailable,
      ollamaModel: this.ollamaValidator.currentModel,
      timestamp: new Date().toISOString()
    };
  }
}

// Экспорт синглтона
module.exports = new ValidationService();