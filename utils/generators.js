const { v4: uuidv4 } = require('uuid');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

class Generators {
  constructor() {
    this.cache = new Map();
  }

  // Генерация уникального ID
  generateId(type = 'default', length = 16) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2);
    const prefix = type.substring(0, 3).toLowerCase();
    
    return `${prefix}_${timestamp}_${random}`.substr(0, length);
  }

  // Генерация токена
  generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Генерация кода подтверждения
  generateVerificationCode(length = 6) {
    const digits = '0123456789';
    let code = '';
    
    for (let i = 0; i < length; i++) {
      code += digits[Math.floor(Math.random() * digits.length)];
    }
    
    return code;
  }

  // Генерация пароля
  generatePassword(length = 12) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    // Гарантируем хотя бы по одному символу каждого типа
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
    
    // Заполняем остальное
    for (let i = 4; i < length; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    
    // Перемешиваем
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  // Генерация цвета
  generateColor(type = 'hex') {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    
    switch (type) {
      case 'hex':
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      case 'rgb':
        return `rgb(${r}, ${g}, ${b})`;
      case 'rgba':
        return `rgba(${r}, ${g}, ${b}, 1)`;
      default:
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
  }

  // Генерация цветовой палитры
  generateColorPalette(count = 5) {
    const palette = [];
    
    // Основной цвет
    const baseHue = Math.floor(Math.random() * 360);
    palette.push(this.hslToHex(baseHue, 70, 50));
    
    // Дополнительные цвета
    for (let i = 1; i < count; i++) {
      const hue = (baseHue + (i * 72)) % 360; // Равномерное распределение
      const saturation = 40 + Math.random() * 30;
      const lightness = 40 + Math.random() * 30;
      palette.push(this.hslToHex(hue, saturation, lightness));
    }
    
    return palette;
  }

  // Конвертация HSL в HEX
  hslToHex(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    const toHex = x => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  // Генерация имени бренда
  generateBrandName(keywords = []) {
    const prefixes = ['Tech', 'Smart', 'Alpha', 'Nova', 'Prime', 'Meta', 'Cyber', 'Quantum'];
    const suffixes = ['Solutions', 'Labs', 'Systems', 'Hub', 'Works', 'Studio', 'Group', 'Co'];
    const connectors = ['', '', '&', ' ', '-'];
    
    let keyword = '';
    if (keywords.length > 0) {
      keyword = keywords[Math.floor(Math.random() * keywords.length)];
      keyword = keyword.charAt(0).toUpperCase() + keyword.slice(1);
    }
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const connector = connectors[Math.floor(Math.random() * connectors.length)];
    
    const patterns = [
      `${prefix}${keyword}${suffix}`,
      `${keyword}${connector}${suffix}`,
      `${prefix}${connector}${keyword}`,
      `${keyword}${suffix}`,
      `${prefix}${keyword}`
    ];
    
    return patterns[Math.floor(Math.random() * patterns.length)];
  }

  // Генерация слогана
  generateSlogan(industry = 'tech') {
    const slogans = {
      tech: [
        'Инновации для будущего',
        'Технологии, которые меняют мир',
        'Простое решение сложных задач',
        'Цифровая трансформация сегодня',
        'Будущее в ваших руках'
      ],
      finance: [
        'Умные инвестиции для умных людей',
        'Финансовая свобода начинается здесь',
        'Безопасность ваших средств',
        'Инвестируйте с уверенностью',
        'Ваш финансовый партнер'
      ],
      education: [
        'Обучение без границ',
        'Знания для успеха',
        'Образование нового поколения',
        'Учитесь в любое время',
        'Откройте мир знаний'
      ],
      health: [
        'Здоровье в первую очередь',
        'Забота о вашем благополучии',
        'Медицина будущего сегодня',
        'Ваше здоровье - наша забота',
        'Технологии для здоровья'
      ],
      ecommerce: [
        'Покупки с удовольствием',
        'Лучшие товары для вас',
        'Шопинг без границ',
        'Ваш идеальный магазин',
        'Качество и удобство'
      ]
    };
    
    const industrySlogans = slogans[industry] || slogans.tech;
    return industrySlogans[Math.floor(Math.random() * industrySlogans.length)];
  }

  // Генерация логотипа (SVG)
  generateLogoSVG(name, colors = null) {
    const palette = colors || this.generateColorPalette(3);
    const initials = name.split(' ').map(word => word[0]).join('').toUpperCase();
    const size = 200;
    
    return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${palette[0]};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${palette[1]};stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 10}" fill="url(#gradient)" />
  
  <text 
    x="50%" 
    y="50%" 
    text-anchor="middle" 
    dy=".3em" 
    font-family="Arial, sans-serif" 
    font-size="${size/3}" 
    font-weight="bold" 
    fill="white"
  >
    ${initials}
  </text>
</svg>`.trim();
  }

  // Генерация иконки (Font Awesome класс)
  generateIcon(category = 'general') {
    const icons = {
      general: ['fas fa-rocket', 'fas fa-lightbulb', 'fas fa-star', 'fas fa-bolt', 'fas fa-gem'],
      tech: ['fas fa-microchip', 'fas fa-server', 'fas fa-code', 'fas fa-robot', 'fas fa-brain'],
      finance: ['fas fa-chart-line', 'fas fa-money-bill-wave', 'fas fa-piggy-bank', 'fas fa-wallet', 'fas fa-coins'],
      education: ['fas fa-graduation-cap', 'fas fa-book', 'fas fa-university', 'fas fa-chalkboard-teacher', 'fas fa-certificate'],
      health: ['fas fa-heartbeat', 'fas fa-heart', 'fas fa-hospital', 'fas fa-pills', 'fas fa-stethoscope'],
      ecommerce: ['fas fa-shopping-cart', 'fas fa-store', 'fas fa-tags', 'fas fa-box', 'fas fa-shipping-fast']
    };
    
    const categoryIcons = icons[category] || icons.general;
    return categoryIcons[Math.floor(Math.random() * categoryIcons.length)];
  }

  // Генерация аватара
  generateAvatar(name, size = 100) {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', 
      '#118AB2', '#073B4C', '#EF476F', '#7209B7'
    ];
    
    const initials = name.split(' ').map(word => word[0]).join('').toUpperCase();
    const color = colors[initials.charCodeAt(0) % colors.length];
    
    return `
<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="50" fill="${color}"/>
  <text x="50" y="50" text-anchor="middle" dy=".3em" 
        font-family="Arial, sans-serif" font-size="40" fill="white">
    ${initials}
  </text>
</svg>`.trim();
  }

  // Генерация данных для тестирования
  generateTestData(type, count = 10) {
    const generators = {
      user: (index) => ({
        id: uuidv4(),
        name: `Пользователь ${index + 1}`,
        email: `user${index + 1}@example.com`,
        role: index === 0 ? 'admin' : 'user',
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      }),
      
      project: (index) => ({
        id: uuidv4(),
        name: `Проект ${index + 1}`,
        description: `Описание проекта ${index + 1}`,
        status: ['active', 'completed', 'pending'][Math.floor(Math.random() * 3)],
        progress: Math.floor(Math.random() * 101),
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      }),
      
      mvp: (index) => ({
        id: uuidv4(),
        name: `MVP ${index + 1}`,
        businessIdea: `Бизнес-идея для MVP ${index + 1}`,
        htmlContent: `<html>Тестовый HTML для MVP ${index + 1}</html>`,
        size: Math.floor(Math.random() * 10000) + 1000,
        createdAt: new Date()
      }),
      
      analytics: (index) => ({
        date: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
        visitors: Math.floor(Math.random() * 1000) + 100,
        conversions: Math.floor(Math.random() * 100) + 10,
        revenue: Math.floor(Math.random() * 10000) + 1000
      })
    };
    
    const generator = generators[type] || generators.project;
    return Array.from({ length: count }, (_, i) => generator(i));
  }

  // Генерация документации
  generateDocumentation(apiEndpoints) {
    let docs = '# API Documentation\n\n';
    
    docs += '## Endpoints\n\n';
    
    apiEndpoints.forEach(endpoint => {
      docs += `### ${endpoint.method} ${endpoint.path}\n\n`;
      docs += `${endpoint.description}\n\n`;
      
      if (endpoint.parameters) {
        docs += '**Parameters:**\n\n';
        docs += '| Name | Type | Required | Description |\n';
        docs += '|------|------|----------|-------------|\n';
        
        endpoint.parameters.forEach(param => {
          docs += `| ${param.name} | ${param.type} | ${param.required ? 'Yes' : 'No'} | ${param.description} |\n`;
        });
        
        docs += '\n';
      }
      
      if (endpoint.response) {
        docs += '**Response:**\n\n```json\n';
        docs += JSON.stringify(endpoint.response, null, 2);
        docs += '\n```\n\n';
      }
      
      docs += '---\n\n';
    });
    
    return docs;
  }

  // Генерация CSV
  generateCSV(data, headers = null) {
    if (!Array.isArray(data) || data.length === 0) {
      return '';
    }
    
    const actualHeaders = headers || Object.keys(data[0]);
    let csv = actualHeaders.join(',') + '\n';
    
    data.forEach(row => {
      const values = actualHeaders.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        
        const stringValue = String(value);
        // Экранируем запятые и кавычки
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        
        return stringValue;
      });
      
      csv += values.join(',') + '\n';
    });
    
    return csv;
  }

  // Генерация имени файла
  generateFilename(prefix, extension) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substr(2, 8);
    
    return `${prefix}_${timestamp}_${random}.${extension}`;
  }
}

module.exports = new Generators();