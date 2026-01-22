const { validation } = require('../config');

class Validators {
  // Валидация текста
  validateText(text, options = {}) {
    const {
      required = true,
      minLength = 1,
      maxLength = validation.maxTextLength,
      allowEmpty = false
    } = options;

    if (required && !text) {
      return { valid: false, error: 'Текст обязателен' };
    }

    if (!text && !allowEmpty) {
      return { valid: false, error: 'Текст не может быть пустым' };
    }

    if (text && text.length < minLength) {
      return { 
        valid: false, 
        error: `Текст должен содержать минимум ${minLength} символов` 
      };
    }

    if (text && text.length > maxLength) {
      return { 
        valid: false, 
        error: `Текст не должен превышать ${maxLength} символов` 
      };
    }

    return { valid: true };
  }

  // Валидация email
  validateEmail(email) {
    if (!email) {
      return { valid: false, error: 'Email обязателен' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Неверный формат email' };
    }

    return { valid: true };
  }

  // Валидация пароля
  validatePassword(password) {
    if (!password) {
      return { valid: false, error: 'Пароль обязателен' };
    }

    if (password.length < 8) {
      return { valid: false, error: 'Пароль должен содержать минимум 8 символов' };
    }

    if (!/[A-Z]/.test(password)) {
      return { valid: false, error: 'Пароль должен содержать заглавную букву' };
    }

    if (!/[a-z]/.test(password)) {
      return { valid: false, error: 'Пароль должен содержать строчную букву' };
    }

    if (!/\d/.test(password)) {
      return { valid: false, error: 'Пароль должен содержать цифру' };
    }

    return { valid: true };
  }

  // Валидация бизнес-идеи
  validateBusinessIdea(idea) {
    const textValidation = this.validateText(idea, { minLength: 20, maxLength: 5000 });
    if (!textValidation.valid) return textValidation;

    // Проверка на спам
    const spamWords = ['купить', 'продать', 'дешево', 'дорого', 'скидка', 'акция'];
    const lowerIdea = idea.toLowerCase();
    const spamCount = spamWords.filter(word => lowerIdea.includes(word)).length;
    
    if (spamCount > 3) {
      return { valid: false, error: 'Слишком много спам-слов в описании' };
    }

    // Проверка на рекламу
    const adPatterns = [
      /http[s]?:\/\/[^\s]+/g,
      /www\.[^\s]+/g,
      /[@#][^\s]+/g
    ];

    for (const pattern of adPatterns) {
      if (pattern.test(idea)) {
        return { valid: false, error: 'Описание содержит ссылки или рекламу' };
      }
    }

    return { valid: true };
  }

  // Валидация MVP параметров
  validateMVPParams(params) {
    const { businessIdea, options = {} } = params;

    // Валидация бизнес-идеи
    const ideaValidation = this.validateBusinessIdea(businessIdea);
    if (!ideaValidation.valid) return ideaValidation;

    // Валидация опций
    if (options) {
      const validOptions = [
        'template', 'theme', 'features', 'complexity',
        'includeAnalytics', 'responsive', 'interactive'
      ];

      const invalidOptions = Object.keys(options).filter(
        key => !validOptions.includes(key)
      );

      if (invalidOptions.length > 0) {
        return { 
          valid: false, 
          error: `Недопустимые опции: ${invalidOptions.join(', ')}` 
        };
      }

      // Валидация сложности
      if (options.complexity && !['low', 'medium', 'high'].includes(options.complexity)) {
        return { valid: false, error: 'Сложность должна быть low, medium или high' };
      }

      // Валидация шаблона
      if (options.template && typeof options.template !== 'string') {
        return { valid: false, error: 'Шаблон должен быть строкой' };
      }
    }

    return { valid: true };
  }

  // Валидация файла
  validateFile(file, options = {}) {
    const {
      maxSize = validation.maxFileSize,
      allowedTypes = validation.allowedImageTypes,
      required = true
    } = options;

    if (required && !file) {
      return { valid: false, error: 'Файл обязателен' };
    }

    if (!file) {
      return { valid: true };
    }

    // Проверка размера
    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: `Размер файла не должен превышать ${maxSize / 1024 / 1024}MB` 
      };
    }

    // Проверка типа
    if (allowedTypes && !allowedTypes.includes(file.mimetype)) {
      return { 
        valid: false, 
        error: `Недопустимый тип файла. Разрешены: ${allowedTypes.join(', ')}` 
      };
    }

    return { valid: true };
  }

  // Валидация JSON
  validateJSON(jsonString, schema = null) {
    try {
      const parsed = JSON.parse(jsonString);
      
      if (schema) {
        // Простая валидация схемы
        for (const [key, type] of Object.entries(schema)) {
          if (parsed[key] === undefined) {
            return { 
              valid: false, 
              error: `Отсутствует обязательное поле: ${key}` 
            };
          }
          
          const actualType = typeof parsed[key];
          if (actualType !== type) {
            return { 
              valid: false, 
              error: `Поле ${key} должно быть типа ${type}, получен ${actualType}` 
            };
          }
        }
      }
      
      return { valid: true, data: parsed };
    } catch (error) {
      return { valid: false, error: 'Неверный формат JSON' };
    }
  }

  // Валидация числового диапазона
  validateNumber(value, options = {}) {
    const {
      min = -Infinity,
      max = Infinity,
      integer = false,
      required = true
    } = options;

    if (required && value === undefined) {
      return { valid: false, error: 'Значение обязательно' };
    }

    if (value === undefined || value === null) {
      return { valid: true };
    }

    const num = Number(value);
    
    if (isNaN(num)) {
      return { valid: false, error: 'Должно быть числом' };
    }

    if (integer && !Number.isInteger(num)) {
      return { valid: false, error: 'Должно быть целым числом' };
    }

    if (num < min) {
      return { valid: false, error: `Минимальное значение: ${min}` };
    }

    if (num > max) {
      return { valid: false, error: `Максимальное значение: ${max}` };
    }

    return { valid: true, value: num };
  }

  // Валидация массива
  validateArray(array, options = {}) {
    const {
      minLength = 0,
      maxLength = Infinity,
      itemValidator = null,
      required = true
    } = options;

    if (required && !array) {
      return { valid: false, error: 'Массив обязателен' };
    }

    if (!array) {
      return { valid: true };
    }

    if (!Array.isArray(array)) {
      return { valid: false, error: 'Должно быть массивом' };
    }

    if (array.length < minLength) {
      return { valid: false, error: `Минимальная длина: ${minLength}` };
    }

    if (array.length > maxLength) {
      return { valid: false, error: `Максимальная длина: ${maxLength}` };
    }

    if (itemValidator) {
      for (let i = 0; i < array.length; i++) {
        const validation = itemValidator(array[i], i);
        if (!validation.valid) {
          return { 
            valid: false, 
            error: `Элемент ${i}: ${validation.error}` 
          };
        }
      }
    }

    return { valid: true };
  }

  // Санация HTML
  sanitizeHTML(html) {
    if (!html) return '';
    
    // Базовые замены для безопасности
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/data:/gi, '')
      .replace(/<iframe/gi, '&lt;iframe')
      .replace(/<object/gi, '&lt;object')
      .replace(/<embed/gi, '&lt;embed');
  }

  // Проверка XSS
  checkForXSS(input) {
    if (typeof input !== 'string') return false;
    
    const xssPatterns = [
      /<script\b[^>]*>/gi,
      /<\/script>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /onload=/gi,
      /onerror=/gi,
      /onclick=/gi,
      /expression\s*\(/gi
    ];
    
    return xssPatterns.some(pattern => pattern.test(input));
  }

  // Валидация проекта
  validateProject(project) {
    const requiredFields = ['name', 'userId'];
    const missingFields = requiredFields.filter(field => !project[field]);
    
    if (missingFields.length > 0) {
      return { 
        valid: false, 
        error: `Отсутствуют обязательные поля: ${missingFields.join(', ')}` 
      };
    }

    const nameValidation = this.validateText(project.name, { minLength: 3, maxLength: 100 });
    if (!nameValidation.valid) return nameValidation;

    if (project.description) {
      const descValidation = this.validateText(project.description, { maxLength: 1000 });
      if (!descValidation.valid) return descValidation;
    }

    return { valid: true };
  }
}

module.exports = new Validators();