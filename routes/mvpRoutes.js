// routes/mvpRoutes.js
const express = require('express');
const router = express.Router();
const mvpController = require('../controllers/mvpController');

// Генерация MVP
router.post('/generate', mvpController.generateMVP);

// Скачивание MVP
router.get('/download/:filename', mvpController.downloadMVP);

// Просмотр MVP
router.get('/view/:filename', mvpController.viewMVP);

// Список сгенерированных файлов
router.get('/files', mvpController.listGeneratedFiles);

// Генерация на основе шаблона
router.post('/generate/template', async (req, res) => {
  try {
    const { template, data } = req.body;
    
    // Реализация генерации на основе шаблона
    res.json({
      success: true,
      message: 'Template generation endpoint',
      template: template,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;