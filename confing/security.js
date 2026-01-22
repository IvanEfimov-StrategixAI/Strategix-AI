const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { security } = require('./index');

class SecurityService {
  constructor() {
    this.jwtSecret = security.jwtSecret;
    this.jwtRefreshSecret = security.jwtRefreshSecret;
    this.algorithm = 'aes-256-cbc';
  }

  // JWT методы
  generateAccessToken(payload, expiresIn = '24h') {
    return jwt.sign(payload, this.jwtSecret, { expiresIn });
  }

  generateRefreshToken(payload, expiresIn = '7d') {
    return jwt.sign(payload, this.jwtRefreshSecret, { expiresIn });
  }

  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.jwtRefreshSecret);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Хеширование паролей
  async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  // Шифрование данных
  encrypt(text, key = this.jwtSecret) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, 
      Buffer.from(key.substring(0, 32).padEnd(32, '0')), 
      iv
    );
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  decrypt(text, key = this.jwtSecret) {
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm,
      Buffer.from(key.substring(0, 32).padEnd(32, '0')),
      iv
    );
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }

  // Генерация безопасных ID
  generateSecureId(length = 16) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Валидация входных данных
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    // Удаляем опасные символы и теги
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/[&<>"']/g, '')
      .trim();
  }

  // Проверка XSS уязвимостей
  detectXSS(input) {
    const xssPatterns = [
      /<script\b[^>]*>([\s\S]*?)<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:/gi,
      /vbscript:/gi
    ];
    
    return xssPatterns.some(pattern => pattern.test(input));
  }

  // Rate limiting конфигурация
  getRateLimitConfig() {
    return {
      windowMs: security.rateLimitWindowMs,
      max: security.rateLimitMax,
      message: {
        success: false,
        error: 'Слишком много запросов с этого IP, попробуйте позже.'
      }
    };
  }

  // CORS конфигурация
  getCorsConfig() {
    const { server } = require('./index');
    return {
      origin: server.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    };
  }

  // Helmet конфигурация
  getHelmetConfig() {
    return {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"]
        }
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" }
    };
  }
}

module.exports = new SecurityService();