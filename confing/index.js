// config/index.js
require('dotenv').config();

module.exports = {
  server: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',
    corsOrigins: ['http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:5000']
  },
  
  ai: {
    gigachat: {
      apiKey: process.env.GIGACHAT_API_KEY || 'MDE5YjNkOTUtOTk2Ny03YWUyLTkxNDctMzg0ZmFjZjU0M2RjOjA4YzMwN2JkLTAwZTEtNDE1NS05ZTU1LTBkYjU4YzE3ZDQ0OQ==',
      authUrl: 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
      apiUrl: 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions'
    }
  },
  
  security: {
    jwtSecret: process.env.JWT_SECRET || 'strategix-ai-secret-key-pro-version-2025',
    rateLimitWindowMs: 15 * 60 * 1000,
    rateLimitMax: 100
  }
};