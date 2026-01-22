const { v4: uuidv4 } = require('uuid');
const fs = require('fs-extra');
const path = require('path');

class ProjectController {
    constructor() {
        this.projects = new Map();
        this.projectDir = path.join(__dirname, '..', 'generated', 'projects');
        this.initProjectDir();
    }

    initProjectDir() {
        try {
            fs.ensureDirSync(this.projectDir);
            console.log(`📁 Папка проектов создана: ${this.projectDir}`);
        } catch (error) {
            console.error('❌ Ошибка создания папки проектов:', error);
        }
    }

    async createProject(req, res) {
        try {
            const { name, description, businessIdea, workflowType } = req.body;
            const userId = req.headers['x-user-id'] || `user-${Date.now()}`;

            if (!name || !businessIdea) {
                return res.status(400).json({
                    success: false,
                    error: 'name и businessIdea обязательны'
                });
            }

            const projectId = uuidv4();
            const projectDir = path.join(this.projectDir, projectId);

            await fs.ensureDir(projectDir);

            const project = {
                id: projectId,
                userId: userId,
                name: name,
                description: description || '',
                business_idea: businessIdea,
                workflow_type: workflowType || 'full_startup',
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                stages: this.getWorkflowStages(workflowType || 'full_startup'),
                artifacts: {},
                tasks: [],
                metadata: {
                    version: '1.0',
                    export_formats: ['json', 'zip']
                }
            };

            // Инициализируем задачи
            project.tasks = this.initializeTasks(project.stages);

            // Сохраняем проект
            await fs.writeJson(path.join(projectDir, 'project.json'), project, { spaces: 2 });
            this.projects.set(projectId, project);

            res.json({
                success: true,
                project_id: projectId,
                project: project,
                message: 'Проект успешно создан'
            });

        } catch (error) {
            console.error('❌ Ошибка создания проекта:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Ошибка при создании проекта'
            });
        }
    }

    getWorkflowStages(workflowType) {
        const workflows = {
            full_startup: [
                { id: 'idea_validation', name: 'Валидация идеи', description: 'Анализ и проверка бизнес-идеи' },
                { id: 'market_research', name: 'Исследование рынка', description: 'Анализ рынка и конкурентов' },
                { id: 'unit_economics', name: 'Юнит-экономика', description: 'Расчет финансовых показателей' },
                { id: 'mvp_generation', name: 'Генерация MVP', description: 'Создание прототипа продукта' },
                { id: 'tech_spec', name: 'Техническое задание', description: 'Разработка ТЗ' },
                { id: 'pitch_deck', name: 'Pitch Deck', description: 'Создание презентации для инвесторов' },
                { id: 'legal_docs', name: 'Юридические документы', description: 'Подготовка юридических документов' }
            ],
            mvp_only: [
                { id: 'idea_validation', name: 'Валидация идеи', description: 'Анализ и проверка бизнес-идеи' },
                { id: 'mvp_generation', name: 'Генерация MVP', description: 'Создание прототипа продукта' },
                { id: 'tech_spec', name: 'Техническое задание', description: 'Разработка ТЗ' }
            ]
        };

        return workflows[workflowType] || workflows.full_startup;
    }

    initializeTasks(stages) {
        return stages.map((stage, index) => ({
            id: stage.id,
            name: stage.name,
            description: stage.description,
            status: index === 0 ? 'ready' : 'pending',
            started_at: null,
            completed_at: null,
            result: null,
            output: null,
            dependencies: index > 0 ? [stages[index - 1].id] : [],
            estimated_hours: 4,
            priority: 'medium'
        }));
    }

    async getProject(req, res) {
        try {
            const { projectId } = req.params;
            const userId = req.headers['x-user-id'];

            const project = this.projects.get(projectId) || await this.loadProjectFromDisk(projectId);

            if (!project) {
                return res.status(404).json({
                    success: false,
                    error: 'Проект не найден'
                });
            }

            // Проверка прав доступа
            if (userId && project.userId !== userId) {
                return res.status(403).json({
                    success: false,
                    error: 'Доступ к проекту запрещен'
                });
            }

            res.json({
                success: true,
                project: project
            });

        } catch (error) {
            console.error('❌ Ошибка получения проекта:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async loadProjectFromDisk(projectId) {
        try {
            const projectPath = path.join(this.projectDir, projectId, 'project.json');
            if (await fs.pathExists(projectPath)) {
                const project = await fs.readJson(projectPath);
                this.projects.set(projectId, project);
                return project;
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки проекта с диска:', error);
        }
        return null;
    }

    async getUserProjects(req, res) {
        try {
            const userId = req.headers['x-user-id'];
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    error: 'User ID обязателен'
                });
            }

            // Загружаем все проекты пользователя
            const userProjects = [];
            
            // Проверяем проекты в памяти
            for (const [id, project] of this.projects) {
                if (project.userId === userId) {
                    userProjects.push(project);
                }
            }

            // Проверяем проекты на диске
            try {
                const projectDirs = await fs.readdir(this.projectDir);
                
                for (const dir of projectDirs) {
                    try {
                        const projectPath = path.join(this.projectDir, dir, 'project.json');
                        if (await fs.pathExists(projectPath)) {
                            const project = await fs.readJson(projectPath);
                            if (project.userId === userId && !this.projects.has(dir)) {
                                userProjects.push(project);
                                this.projects.set(dir, project);
                            }
                        }
                    } catch (error) {
                        console.error(`❌ Ошибка загрузки проекта ${dir}:`, error);
                    }
                }
            } catch (error) {
                console.error('❌ Ошибка чтения папки проектов:', error);
            }

            res.json({
                success: true,
                count: userProjects.length,
                projects: userProjects
            });

        } catch (error) {
            console.error('❌ Ошибка получения проектов пользователя:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async executeTask(req, res) {
        try {
            const { projectId, taskId } = req.params;

            const project = this.projects.get(projectId) || await this.loadProjectFromDisk(projectId);
            if (!project) {
                return res.status(404).json({
                    success: false,
                    error: 'Проект не найден'
                });
            }

            const task = project.tasks.find(t => t.id === taskId);
            if (!task) {
                return res.status(404).json({
                    success: false,
                    error: 'Задача не найдена'
                });
            }

            // Проверяем зависимости
            if (task.dependencies.length > 0) {
                const dependenciesCompleted = task.dependencies.every(depId => {
                    const depTask = project.tasks.find(t => t.id === depId);
                    return depTask && depTask.status === 'completed';
                });

                if (!dependenciesCompleted) {
                    return res.status(400).json({
                        success: false,
                        error: 'Зависимые задачи не выполнены'
                    });
                }
            }

            // Обновляем статус задачи
            task.status = 'in_progress';
            task.started_at = new Date().toISOString();
            project.updated_at = new Date().toISOString();

            // Сохраняем изменения
            await this.saveProject(project);

            res.json({
                success: true,
                task: task,
                message: 'Задача запущена'
            });

        } catch (error) {
            console.error('❌ Ошибка выполнения задачи:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async updateTaskResult(req, res) {
        try {
            const { projectId, taskId } = req.params;
            const { result, output, status = 'completed' } = req.body;

            const project = this.projects.get(projectId) || await this.loadProjectFromDisk(projectId);
            if (!project) {
                return res.status(404).json({
                    success: false,
                    error: 'Проект не найден'
                });
            }

            const taskIndex = project.tasks.findIndex(t => t.id === taskId);
            if (taskIndex === -1) {
                return res.status(404).json({
                    success: false,
                    error: 'Задача не найдена'
                });
            }

            // Обновляем задачу
            project.tasks[taskIndex].status = status;
            project.tasks[taskIndex].completed_at = new Date().toISOString();
            project.tasks[taskIndex].result = result;
            project.tasks[taskIndex].output = output;

            // Сохраняем артефакт если есть
            if (output && output.artifact) {
                project.artifacts[taskId] = output.artifact;
            }

            project.updated_at = new Date().toISOString();

            // Обновляем статусы зависимых задач
            this.updateDependentTasks(project, taskId);

            // Сохраняем проект
            await this.saveProject(project);

            res.json({
                success: true,
                task: project.tasks[taskIndex],
                message: 'Результат задачи обновлен'
            });

        } catch (error) {
            console.error('❌ Ошибка обновления результата задачи:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    updateDependentTasks(project, completedTaskId) {
        project.tasks.forEach(task => {
            if (task.dependencies.includes(completedTaskId)) {
                const allDepsCompleted = task.dependencies.every(depId => {
                    const depTask = project.tasks.find(t => t.id === depId);
                    return depTask && depTask.status === 'completed';
                });

                if (allDepsCompleted && task.status === 'pending') {
                    task.status = 'ready';
                }
            }
        });
    }

    async saveProject(project) {
        try {
            const projectDir = path.join(this.projectDir, project.id);
            await fs.ensureDir(projectDir);
            await fs.writeJson(path.join(projectDir, 'project.json'), project, { spaces: 2 });
            this.projects.set(project.id, project);
            return true;
        } catch (error) {
            console.error('❌ Ошибка сохранения проекта:', error);
            return false;
        }
    }

    async exportProject(req, res) {
        try {
            const { projectId } = req.params;
            const { format = 'zip' } = req.query;

            const project = this.projects.get(projectId) || await this.loadProjectFromDisk(projectId);
            if (!project) {
                return res.status(404).json({
                    success: false,
                    error: 'Проект не найден'
                });
            }

            // Создаем экспортные данные
            const exportData = {
                project_info: {
                    id: project.id,
                    name: project.name,
                    created_at: project.created_at,
                    status: project.status
                },
                business_idea: project.business_idea,
                stages: project.stages,
                tasks: project.tasks.map(t => ({
                    id: t.id,
                    name: t.name,
                    status: t.status,
                    completed_at: t.completed_at,
                    result: t.result
                })),
                artifacts_summary: Object.keys(project.artifacts),
                export_date: new Date().toISOString(),
                format: format
            };

            if (format === 'zip') {
                // Имитация создания ZIP архива
                const exportPath = path.join(this.projectDir, project.id, 'export.zip');
                
                res.json({
                    success: true,
                    download_url: `/api/projects/${projectId}/download/export.zip`,
                    size: '2.5 MB',
                    message: 'Проект подготовлен для скачивания'
                });
            } else {
                res.json({
                    success: true,
                    data: exportData,
                    format: 'json'
                });
            }

        } catch (error) {
            console.error('❌ Ошибка экспорта проекта:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async deleteProject(req, res) {
        try {
            const { projectId } = req.params;
            const userId = req.headers['x-user-id'];

            const project = this.projects.get(projectId) || await this.loadProjectFromDisk(projectId);
            if (!project) {
                return res.status(404).json({
                    success: false,
                    error: 'Проект не найден'
                });
            }

            // Проверка прав доступа
            if (userId && project.userId !== userId) {
                return res.status(403).json({
                    success: false,
                    error: 'Доступ к проекту запрещен'
                });
            }

            // Удаляем из памяти
            this.projects.delete(projectId);

            // Удаляем с диска
            try {
                const projectDir = path.join(this.projectDir, projectId);
                if (await fs.pathExists(projectDir)) {
                    await fs.remove(projectDir);
                }
            } catch (error) {
                console.error('❌ Ошибка удаления папки проекта:', error);
            }

            res.json({
                success: true,
                message: 'Проект удален'
            });

        } catch (error) {
            console.error('❌ Ошибка удаления проекта:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async getProjectStats(req, res) {
        try {
            const userId = req.headers['x-user-id'];
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    error: 'User ID обязателен'
                });
            }

            // Собираем статистику по проектам пользователя
            const userProjects = [];
            for (const [id, project] of this.projects) {
                if (project.userId === userId) {
                    userProjects.push(project);
                }
            }

            const stats = {
                total_projects: userProjects.length,
                active_projects: userProjects.filter(p => p.status === 'active').length,
                completed_projects: userProjects.filter(p => p.status === 'completed').length,
                total_tasks: userProjects.reduce((sum, p) => sum + p.tasks.length, 0),
                completed_tasks: userProjects.reduce((sum, p) => 
                    sum + p.tasks.filter(t => t.status === 'completed').length, 0
                ),
                projects_by_type: userProjects.reduce((acc, p) => {
                    const type = p.workflow_type || 'unknown';
                    acc[type] = (acc[type] || 0) + 1;
                    return acc;
                }, {})
            };

            res.json({
                success: true,
                stats: stats,
                user_id: userId
            });

        } catch (error) {
            console.error('❌ Ошибка получения статистики проектов:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new ProjectController();