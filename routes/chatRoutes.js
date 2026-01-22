const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { validateChatRequest } = require('../middleware/validation');

// Обработка сообщения в чате
router.post('/message', validateChatRequest, chatController.processChat);

// Обработка с валидацией
router.post('/message/validated', validateChatRequest, chatController.processChatWithValidation);

// Получение режимов эксперта
router.get('/modes', chatController.getExpertModes);

// Очистка истории
router.delete('/history', chatController.clearChatHistory);

// Получение статистики
router.get('/stats', chatController.getChatStats);

// Экспорт истории
router.get('/export', chatController.exportChatHistory);

module.exports = router;