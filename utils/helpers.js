const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { paths } = require('../config');

class Helpers {
  constructor() {
    this.initDirectories();
  }

  // Инициализация директорий
  initDirectories() {
    const directories = [
      paths.generated,
      paths.public,
      paths.temp,
      paths.exports,
      paths.uploads
    ];

    directories.forEach(dir => {
      const dirPath = path.join(__dirname, '..', dir);
      if (!fs.existsSync(dirPath)) {
        fs.ensureDirSync(dirPath);
        console.log(`📁 Создана папка: ${dir}`);
      }
    });
  }

  // Генерация уникального имени файла
  generateFilename(prefix = 'file', extension = 'html') {
    const timestamp = Date.now();
    const random = uuidv4().slice(0, 8);
    return `${prefix}_${timestamp}_${random}.${extension}`;
  }

  // Сохранение файла
  async saveFile(content, filename, directory = 'generated') {
    try {
      const dirPath = path.join(__dirname, '..', directory);
      await fs.ensureDir(dirPath);
      
      const filePath = path.join(dirPath, filename);
      await fs.writeFile(filePath, content, 'utf8');
      
      return {
        success: true,
        filePath,
        relativePath: `/${directory}/${filename}`,
        size: Buffer.from(content).length
      };
    } catch (error) {
      console.error('❌ Ошибка сохранения файла:', error);
      throw error;
    }
  }

  // Чтение файла
  async readFile(filename, directory = 'generated') {
    try {
      const filePath = path.join(__dirname, '..', directory, filename);
      
      if (!fs.existsSync(filePath)) {
        throw new Error('Файл не найден');
      }
      
      const content = await fs.readFile(filePath, 'utf8');
      return { success: true, content };
    } catch (error) {
      console.error('❌ Ошибка чтения файла:', error);
      throw error;
    }
  }

  // Удаление файла
  async deleteFile(filename, directory = 'generated') {
    try {
      const filePath = path.join(__dirname, '..', directory, filename);
      
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'Файл не найден' };
      }
      
      await fs.unlink(filePath);
      return { success: true };
    } catch (error) {
      console.error('❌ Ошибка удаления файла:', error);
      throw error;
    }
  }

  // Очистка временных файлов
  async cleanupTempFiles(maxAgeHours = 24) {
    try {
      const tempPath = path.join(__dirname, '..', paths.temp);
      const files = await fs.readdir(tempPath);
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000;
      
      let deletedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(tempPath, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtimeMs > maxAge) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }
      
      return { success: true, deletedCount };
    } catch (error) {
      console.error('❌ Ошибка очистки временных файлов:', error);
      return { success: false, error: error.message };
    }
  }

  // Форматирование даты
  formatDate(date = new Date(), format = 'ru-RU') {
    return date.toLocaleDateString(format, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Обрезка текста
  truncateText(text, maxLength = 200) {
    if (!text || text.length <= maxLength) return text;
    
    const truncated = text.substring(0, maxLength);
    return truncated.substring(0, truncated.lastIndexOf(' ')) + '...';
  }

  // Проверка типа файла
  getFileType(filename) {
    const extension = path.extname(filename).toLowerCase();
    
    const types = {
      '.html': 'html',
      '.css': 'css',
      '.js': 'javascript',
      '.json': 'json',
      '.md': 'markdown',
      '.txt': 'text',
      '.pdf': 'pdf',
      '.jpg': 'image',
      '.jpeg': 'image',
      '.png': 'image',
      '.gif': 'image',
      '.svg': 'image'
    };
    
    return types[extension] || 'unknown';
  }

  // Кэширование результатов
  createCache(ttlSeconds = 300) {
    const cache = new Map();
    
    return {
      set: (key, value) => {
        cache.set(key, {
          value,
          expiry: Date.now() + (ttlSeconds * 1000)
        });
      },
      
      get: (key) => {
        const item = cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expiry) {
          cache.delete(key);
          return null;
        }
        
        return item.value;
      },
      
      delete: (key) => cache.delete(key),
      clear: () => cache.clear(),
      has: (key) => {
        const item = cache.get(key);
        return item && Date.now() <= item.expiry;
      }
    };
  }

  // Генерация прогресса выполнения
  createProgressTracker(totalSteps) {
    let currentStep = 0;
    let startTime = Date.now();
    
    return {
      start: () => {
        startTime = Date.now();
        currentStep = 0;
      },
      
      next: (message = '') => {
        currentStep++;
        const progress = (currentStep / totalSteps) * 100;
        const elapsed = (Date.now() - startTime) / 1000;
        
        return {
          step: currentStep,
          total: totalSteps,
          progress: Math.round(progress),
          elapsed: elapsed.toFixed(1),
          message
        };
      },
      
      getProgress: () => ({
        step: currentStep,
        total: totalSteps,
        progress: Math.round((currentStep / totalSteps) * 100),
        elapsed: ((Date.now() - startTime) / 1000).toFixed(1)
      })
    };
  }

  // Детекция типа бизнеса
  detectBusinessType(text) {
    if (!text || typeof text !== 'string') return 'general';
    
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('saas') || lowerText.includes('подпис') || 
        lowerText.includes('облач') || lowerText.includes('программ')) return 'saas';
    if (lowerText.includes('ecommerce') || lowerText.includes('магазин') || 
        lowerText.includes('товар') || lowerText.includes('продаж')) return 'ecommerce';
    if (lowerText.includes('marketplace') || lowerText.includes('площадк') || 
        lowerText.includes('агрегатор')) return 'marketplace';
    if (lowerText.includes('мобильн') || lowerText.includes('приложен') || 
        lowerText.includes('app') || lowerText.includes('ios') || lowerText.includes('android')) return 'mobile_app';
    if (lowerText.includes('сервис') || lowerText.includes('услуг') || 
        lowerText.includes('консалт')) return 'service';
    if (lowerText.includes('финанс') || lowerText.includes('банк') || 
        lowerText.includes('платеж') || lowerText.includes('инвест')) return 'fintech';
    if (lowerText.includes('образован') || lowerText.includes('курс') || 
        lowerText.includes('обучен') || lowerText.includes('edtech')) return 'edtech';
    if (lowerText.includes('здоров') || lowerText.includes('медицин') || 
        lowerText.includes('врач') || lowerText.includes('health')) return 'healthtech';
    
    return 'general';
  }

  // Валидация URL
  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  // Форматирование размера файла
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = new Helpers();