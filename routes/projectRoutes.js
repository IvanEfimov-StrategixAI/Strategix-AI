const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { validateProjectRequest } = require('../middleware/validation');

// Создание проекта
router.post('/', validateProjectRequest, projectController.createProject);

// Получение проекта
router.get('/:projectId', projectController.getProject);

// Получение проектов пользователя
router.get('/', projectController.getUserProjects);

// Выполнение задачи
router.post('/:projectId/tasks/:taskId/execute', projectController.executeTask);

// Обновление результата задачи
router.put('/:projectId/tasks/:taskId/result', projectController.updateTaskResult);

// Экспорт проекта
router.get('/:projectId/export', projectController.exportProject);

// Удаление проекта
router.delete('/:projectId', projectController.deleteProject);

// Статистика проектов
router.get('/user/stats', projectController.getProjectStats);

module.exports = router;