const { callGigaChatAPI } = require('../services/gigachat');
const { v4: uuidv4 } = require('uuid');
const { EnhancedOllamaValidator, EnhancedHeuristicValidator } = require('../utils/validators');

class EnhancedDocumentGenerator {
    constructor() {
        this.documentTypes = {
            business_plan: {
                name: 'Бизнес-план',
                description: 'Полный бизнес-план с финансовой моделью'
            },
            pitch_deck: {
                name: 'Pitch Deck',
                description: 'Презентация для инвесторов'
            },
            marketing_strategy: {
                name: 'Маркетинговая стратегия',
                description: 'Детальный план маркетинга'
            }
        };

        this.ollamaValidator = new EnhancedOllamaValidator();
        this.heuristicValidator = new EnhancedHeuristicValidator();
    }

    async generateDocument(type, subtype, data, options = {}) {
        try {
            console.log(`📄 Генерация документа: ${type}...`);

            const rawDocument = await this.generateWithGigaChat(type, subtype, data, options);

            const ollamaCheck = await this.validateWithOllama(type, rawDocument, data);
            const heuristicCheck = this.validateWithHeuristics(type, rawDocument);

            let finalDocument = rawDocument;
            let corrections = [];

            if (!ollamaCheck.verified || ollamaCheck.confidence_score < 70) {
                console.log('⚠️ Проблемы при проверке, генерируем исправленную версию...');
                finalDocument = await this.generateCorrectedVersion(type, rawDocument, ollamaCheck, data, options);
                corrections.push(...(ollamaCheck.issues || []));
            }

            if (!heuristicCheck.verified) {
                corrections.push(...(heuristicCheck.issues || []));
            }

            if (this.isDocumentTooShort(finalDocument.content)) {
                finalDocument = await this.addDetailsToDocument(type, finalDocument, data, options);
            }

            return {
                id: uuidv4(),
                type: type,
                subtype: subtype,
                title: `${this.documentTypes[type].name}${subtype ? ` - ${subtype}` : ''}`,
                content: finalDocument.content,
                validation: {
                    ollama_check: ollamaCheck,
                    heuristic_check: heuristicCheck,
                    overall_confidence: Math.round(
                        (ollamaCheck.confidence_score + heuristicCheck.confidence_score) / 2
                    ),
                    verified: ollamaCheck.verified && heuristicCheck.verified,
                    issues: corrections
                },
                metadata: {
                    generated_at: new Date().toISOString(),
                    corrected: corrections.length > 0,
                    enhanced: this.isDocumentTooShort(rawDocument.content),
                    version: '3.0'
                }
            };

        } catch (error) {
            console.error(`❌ Ошибка генерации документа ${type}:`, error);
            throw error;
        }
    }

    isDocumentTooShort(content) {
        const wordCount = content.split(/\s+/).length;
        return wordCount < 800;
    }

    async generateWithGigaChat(type, subtype, data, options) {
        let prompt = '';
        let systemPrompt = '';

        switch (type) {
            case 'business_plan':
                systemPrompt = `Ты - профессиональный бизнес-консультант. Создай ДЕТАЛЬНЫЙ бизнес-план с КОНКРЕТНЫМИ цифрами.`;
                prompt = this.generateDetailedBusinessPlanPrompt(data, options);
                break;

            case 'pitch_deck':
                systemPrompt = `Ты - эксперт по созданию pitch deck. Используй ТОЛЬКО проверенные факты.`;
                prompt = this.generateDetailedPitchDeckPrompt(data, subtype, options);
                break;

            case 'marketing_strategy':
                systemPrompt = `Ты - директор по маркетингу. Создай измеримую стратегию с конкретными KPI.`;
                prompt = this.generateDetailedMarketingStrategyPrompt(data, options);
                break;

            default:
                throw new Error(`Неизвестный тип документа: ${type}`);
        }

        const response = await callGigaChatAPI([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ], 0.4, 6000);

        return {
            content: response,
            generated_at: new Date().toISOString(),
            prompt_used: prompt.substring(0, 500) + '...'
        };
    }

    generateDetailedBusinessPlanPrompt(data, options = {}) {
        const language = options.language || 'ru';

        return `Создай ДЕТАЛЬНЫЙ бизнес-план:
ДАННЫЕ: ${JSON.stringify(data, null, 2)}
Структура бизнес-плана:
1. РЕЗЮМЕ ПРОЕКТА
2. ОПИСАНИЕ КОМПАНИИ
3. АНАЛИЗ РЫНКА
4. ОПИСАНИЕ ПРОДУКТА/УСЛУГИ
5. МАРКЕТИНГОВАЯ СТРАТЕГИЯ
6. ФИНАНСОВЫЙ ПЛАН
7. АНАЛИЗ РИСКОВ
ВАЖНО: Включи конкретные цифры, сроки, бюджеты, метрики.
Язык: ${language}`;
    }

    generateDetailedPitchDeckPrompt(data, subtype = 'standard', options = {}) {
        const slideTypes = {
            standard: [
                'Title Slide',
                'The Problem',
                'The Solution',
                'Why Now?',
                'Market Size',
                'Product',
                'Business Model',
                'Competition',
                'Team',
                'Traction',
                'Financials',
                'The Ask'
            ]
        };

        const slides = slideTypes[subtype] || slideTypes.standard;

        return `Создай ДЕТАЛЬНЫЙ pitch deck:
ДАННЫЕ: ${JSON.stringify(data, null, 2)}
Структура презентации (${slides.length} слайдов):
${slides.map((slide, i) => `${i + 1}. ${slide}`).join('\n')}
Для каждого слайда предоставь:
1. Заголовок
2. Основные тезисы (с конкретными цифрами)
3. Визуальные рекомендации
4. Speaker notes
Сделай презентацию УБЕДИТЕЛЬНОЙ и КОНКРЕТНОЙ.`;
    }

    generateDetailedMarketingStrategyPrompt(data, options = {}) {
        const timeline = options.timeline_months || 12;

        return `Создай ДЕТАЛЬНУЮ маркетинговую стратегию на ${timeline} месяцев:
ДАННЫЕ: ${JSON.stringify(data, null, 2)}
СТРУКТУРА:
1. SITUATION ANALYSIS
2. MARKETING OBJECTIVES
3. TARGET AUDIENCE
4. MARKETING MIX
5. BUDGET & RESOURCES
6. IMPLEMENTATION PLAN
7. MEASUREMENT & OPTIMIZATION
ВАЖНО: Включи КОНКРЕТНЫЕ цифры, бюджеты, сроки, KPI.`;
    }

    async validateWithOllama(type, document, originalData) {
        try {
            const validationPrompt = `Проверь документ на реалистичность:
ТИП ДОКУМЕНТА: ${type}
ДОКУМЕНТ: ${document.content.substring(0, 3000)}
ИСХОДНЫЕ ДАННЫЕ: ${JSON.stringify(originalData, null, 2)}
Проанализируй и верни JSON с оценкой.`;

            const validation = await this.ollamaValidator.validateWithAI(
                validationPrompt,
                `Проверка документа: ${type}`,
                'general'
            );

            return {
                ...validation,
                validated_at: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Ошибка проверки Ollama:', error);
            return {
                verified: false,
                confidence_score: 30,
                issues: ['Не удалось выполнить проверку'],
                summary: 'Проверка не выполнена'
            };
        }
    }

    validateWithHeuristics(type, document) {
        const heuristics = {
            business_plan: this.validateBusinessPlanHeuristics.bind(this),
            pitch_deck: this.validatePitchDeckHeuristics.bind(this),
            marketing_strategy: this.validateMarketingStrategyHeuristics.bind(this)
        };

        const validator = heuristics[type] || this.validateGenericHeuristics.bind(this);
        return validator(document.content);
    }

    validateBusinessPlanHeuristics(content) {
        const requiredSections = ['резюме', 'рынок', 'финанс', 'риск'];
        const missingSections = requiredSections.filter(section =>
            !content.toLowerCase().includes(section)
        );

        const issues = missingSections.length > 0 ?
            [`Отсутствуют разделы: ${missingSections.join(', ')}`] : [];

        const hasNumbers = (content.match(/\d+/g) || []).length >= 20;
        if (!hasNumbers) {
            issues.push('Недостаточно конкретных цифр');
        }

        const wordCount = content.split(/\s+/).length;
        if (wordCount < 1000) {
            issues.push(`Документ слишком короткий (${wordCount} слов)`);
        }

        return {
            verified: issues.length === 0 && hasNumbers && wordCount >= 1000,
            issues: issues,
            confidence_score: Math.max(0, 100 - (issues.length * 10)),
            recommendations: issues.length > 0 ? [
                'Добавьте недостающие разделы',
                'Включите больше конкретных цифр'
            ] : ['Документ соответствует требованиям'],
            summary: issues.length === 0 ?
                '✅ Бизнес-план содержит все необходимые разделы' :
                `⚠️ Требуется доработка: ${issues.length} проблем`
        };
    }

    validatePitchDeckHeuristics(content) {
        const issues = [];
        const slideKeywords = ['слайд', 'проблема', 'решение', 'рынок', 'команда', 'финанс'];
        const missingKeywords = slideKeywords.filter(keyword =>
            !content.toLowerCase().includes(keyword)
        );

        if (missingKeywords.length > 3) {
            issues.push(`Возможно отсутствуют ключевые слайды`);
        }

        const hasNumbers = (content.match(/\d+/g) || []).length >= 15;
        if (!hasNumbers) {
            issues.push('Недостаточно конкретных цифр для инвесторов');
        }

        return {
            verified: issues.length === 0 && hasNumbers,
            issues: issues,
            confidence_score: Math.max(0, 100 - (issues.length * 15)),
            recommendations: issues.length > 0 ? [
                'Проверьте структуру презентации',
                'Добавьте конкретные цифры и метрики'
            ] : ['Pitch deck структурирован правильно'],
            summary: issues.length === 0 ?
                '✅ Структура pitch deck соответствует стандартам' :
                `⚠️ Проверьте структуру презентации`
        };
    }

    validateGenericHeuristics(content) {
        const wordCount = content.split(/\s+/).length;
        const hasNumbers = (content.match(/\d+/g) || []).length >= 5;

        return {
            verified: wordCount >= 500 && hasNumbers,
            issues: wordCount < 500 ? ['Документ слишком короткий'] :
                   !hasNumbers ? ['Недостаточно конкретных цифр'] : [],
            confidence_score: Math.min(100, Math.round((wordCount / 10) + (hasNumbers ? 30 : 0))),
            summary: '✅ Документ сгенерирован, требуется дополнительная проверка'
        };
    }

    async generateCorrectedVersion(type, originalDocument, validation, originalData, options) {
        try {
            const prompt = `Сгенерируй УЛУЧШЕННУЮ версию документа:
ИСХОДНЫЙ ДОКУМЕНТ: ${originalDocument.content.substring(0, 2000)}
ЗАМЕЧАНИЯ: ${JSON.stringify(validation.issues || [], null, 2)}
ДАННЫЕ: ${JSON.stringify(originalData, null, 2)}
ТИП ДОКУМЕНТА: ${type}
Устрани все указанные проблемы, добавь недостающее.
Верни ПОЛНЫЙ улучшенный документ.`;

            const corrected = await callGigaChatAPI([
                {
                    role: 'system',
                    content: 'Ты - редактор и бизнес-аналитик. Исправляй ошибки, добавляй недостающее.'
                },
                { role: 'user', content: prompt }
            ], 0.5, 7000);

            return {
                content: corrected,
                generated_at: new Date().toISOString(),
                is_corrected: true,
                original_issues: validation.issues || [],
                enhancements: ['Добавлены конкретные цифры', 'Расширены разделы']
            };

        } catch (error) {
            console.error('❌ Ошибка генерации исправленной версии:', error);
            return originalDocument;
        }
    }

    async addDetailsToDocument(type, document, originalData, options) {
        try {
            const prompt = `ДОБАВЬ ДЕТАЛИ и КОНКРЕТИКУ в документ:
ТИП ДОКУМЕНТА: ${type}
ТЕКУЩИЙ ДОКУМЕНТ: ${document.content.substring(0, 1500)}
ДАННЫЕ: ${JSON.stringify(originalData, null, 2)}
Сделай этот документ БОЛЕЕ ДЕТАЛЬНЫМ и КОНКРЕТНЫМ.
ДОБАВЬ: Конкретные цифры, примеры, обоснования.
Верни ПОЛНЫЙ улучшенный документ.`;

            const enhanced = await callGigaChatAPI([
                {
                    role: 'system',
                    content: 'Делай документы более детальными, конкретными и полезными.'
                },
                { role: 'user', content: prompt }
            ], 0.5, 6000);

            return {
                content: enhanced,
                generated_at: new Date().toISOString(),
                is_enhanced: true,
                enhancement_notes: 'Добавлены детали, конкретные цифры'
            };

        } catch (error) {
            console.error('❌ Ошибка добавления деталей:', error);
            return document;
        }
    }
}

module.exports = EnhancedDocumentGenerator;