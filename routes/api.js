// routes/api.js
const express = require('express');
const router = express.Router();

// Импорт всех маршрутов
const mvpRoutes = require('./mvpRoutes');
const chatRoutes = require('./chatRoutes');
const projectRoutes = require('./projectRoutes');

// Регистрация маршрутов
router.use('/mvp', mvpRoutes);
router.use('/chat', chatRoutes);
router.use('/projects', projectRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Strategix AI Pro API работает',
    timestamp: new Date().toISOString(),
    version: '8.0.0',
    status: 'operational'
  });
});

// API информация
router.get('/info', (req, res) => {
  res.json({
    name: 'Strategix AI Pro API',
    version: '8.0.0',
    description: 'Ultimate бизнес-инструменты с искусственным интеллектом',
    endpoints: [
      { path: '/api/mvp/generate', method: 'POST', description: 'Генерация MVP прототипа' },
      { path: '/api/chat/message', method: 'POST', description: 'AI бизнес-консультант' },
      { path: '/api/analysis/unit-economics', method: 'POST', description: 'Анализ юнит-экономики' },
      { path: '/api/projects', method: 'POST', description: 'Создание бизнес-проекта' },
      { path: '/api/health', method: 'GET', description: 'Проверка состояния сервиса' },
      { path: '/api/info', method: 'GET', description: 'Информация о API' }
    ],
    features: [
      'Ultimate MVP Generator - генерация профессиональных прототипов',
      'AI Business Chat Expert - бизнес-консультант с 20+ лет опыта',
      'Unit Economics Calculator - анализ юнит-экономики',
      'Project Orchestrator - управление бизнес-проектами',
      'Pitch Deck Generator - создание презентаций для инвесторов',
      'Enhanced Document Generator - генерация бизнес-документов'
    ],
    contact: 'support@strategix-ai.com',
    documentation: '/api/docs'
  });
});

// Status endpoint для мониторинга
router.get('/status', async (req, res) => {
  try {
    const status = {
      api: 'operational',
      database: 'unknown',
      ai_services: 'unknown',
      timestamp: new Date().toISOString()
    };

    // Проверка GigaChat (если есть ключ)
    const { ai } = require('../config/index');
    if (ai.gigachat.apiKey && ai.gigachat.apiKey.length > 10) {
      const gigachatService = require('../services/gigachat');
      const chatStatus = await gigachatService.checkAvailability();
      status.ai_services = chatStatus.available ? 'operational' : 'degraded';
    }

    // Проверка Supabase (если есть URL)
    const { database } = require('../config/index');
    if (database.supabase.url && database.supabase.url.includes('supabase.co')) {
      try {
        const supabaseService = require('../services/supabase');
        const dbStatus = await supabaseService.checkConnection();
        status.database = dbStatus.connected ? 'operational' : 'degraded';
      } catch (error) {
        status.database = 'offline';
      }
    }

    res.json({
      success: true,
      status: status,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      status: 'degraded'
    });
  }
});

module.exports = router;