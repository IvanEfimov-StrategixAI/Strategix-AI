const { callGigaChatAPI } = require('../services/gigachat');
const { v4: uuidv4 } = require('uuid');

class PitchDeckGenerator {
    constructor() {
        this.templates = {
            pitch_deck_10: this.get10SlideTemplate(),
            pitch_deck_15: this.get15SlideTemplate(),
            executive_summary: this.getExecutiveSummaryTemplate()
        };
    }

    async generatePitchDeck(data, templateType = 'pitch_deck_10', options = {}) {
        try {
            const template = this.templates[templateType];
            if (!template) throw new Error(`Шаблон ${templateType} не найден`);

            const prompt = this.buildPitchDeckPrompt(data, template, options);

            const response = await callGigaChatAPI([
                {
                    role: 'system',
                    content: 'Ты - дизайнер pitch deck с опытом создания презентаций для Sequoia, YC. Создавай профессиональные презентации.'
                },
                { role: 'user', content: prompt }
            ], 0.6, 5000);

            const structuredDeck = this.parsePitchDeckResponse(response, template);

            return {
                id: uuidv4(),
                type: 'pitch_deck',
                template: templateType,
                content: structuredDeck,
                design_recommendations: this.generateDesignRecommendations(structuredDeck, templateType),
                generated_at: new Date().toISOString(),
                version: '2.0'
            };

        } catch (error) {
            console.error('❌ Ошибка генерации pitch deck:', error);
            return this.generateFallbackPitchDeck(data, templateType);
        }
    }

    buildPitchDeckPrompt(data, template, options) {
        return `Создай ${template.name} на основе данных:
${JSON.stringify(data, null, 2)}
${template.instructions}
Структура (${template.slides.length} слайдов):
${template.slides.map(slide => `${slide.number}. ${slide.title}`).join('\n')}
Для каждого слайда предоставь:
1. Title (заголовок)
2. Key Points (3-5 ключевых тезисов с данными)
3. Recommended Visuals (тип визуализации)
4. Speaker Notes (что говорить на этом слайде)
Формат ответа: JSON с полной структурой презентации.`;
    }

    parsePitchDeckResponse(response, template) {
        try {
            const jsonMatch = response.match(/\[\s*\{[\s\S]*?\}\s*\]/) || response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return this.parseStructuredText(response, template);
        } catch (error) {
            console.error('Ошибка парсинга pitch deck:', error);
            return this.generateStructuredDeckFromTemplate(template);
        }
    }

    parseStructuredText(response, template) {
        const slides = [];
        const lines = response.split('\n');
        let currentSlide = null;

        for (const line of lines) {
            if (line.match(/Слайд \d+:|Slide \d+:/i)) {
                if (currentSlide) slides.push(currentSlide);
                currentSlide = {
                    number: parseInt(line.match(/\d+/)[0]),
                    title: line.split(':')[1]?.trim() || '',
                    key_points: [],
                    visuals: [],
                    notes: ''
                };
            } else if (currentSlide && line.trim()) {
                currentSlide.notes += line + '\n';
            }
        }

        if (currentSlide) slides.push(currentSlide);

        return {
            slides: slides,
            template_name: template.name,
            total_slides: slides.length
        };
    }

    generateStructuredDeckFromTemplate(template) {
        return {
            slides: template.slides.map(slide => ({
                number: slide.number,
                title: slide.title,
                key_points: [`Ключевая информация для ${slide.title}`],
                visuals: ['Рекомендуемая визуализация'],
                notes: `Комментарии к слайду ${slide.number}`,
                data_points: ['Конкретные цифры'],
                call_to_action: 'Призыв к действию'
            })),
            template_name: template.name,
            total_slides: template.slides.length
        };
    }

    generateDesignRecommendations(deck, templateType) {
        const recommendations = {
            pitch_deck_10: {
                colors: "Используйте 2-3 основных цвета. Синий для доверия, акцентный для CTA",
                typography: "1 шрифт для заголовков, 1 для текста. Минимальный размер 24pt",
                layout: "Много пустого пространства, 1 идея на слайд",
                visuals: "Фотографии реальных пользователей, простые диаграммы, минимум текста",
                timing: "10 слайдов = 10 минут, 15 секунд на слайд в среднем"
            },
            pitch_deck_15: {
                colors: "Профессиональная палитра, темный фон для данных, светлый для текста",
                typography: "Consistent hierarchy, sans-serif для читаемости",
                layout: "Сетка, выравнивание, консистентные отступы",
                visuals: "Сложные графики на отдельном слайде, executive summary на 2-3 слайда",
                data_viz: "Используйте правильные типы графиков для разных данных"
            }
        };

        return recommendations[templateType] || recommendations.pitch_deck_10;
    }

    generateFallbackPitchDeck(data, templateType) {
        const template = this.templates[templateType] || this.templates.pitch_deck_10;

        return {
            id: uuidv4(),
            type: 'pitch_deck',
            template: templateType,
            content: this.generateStructuredDeckFromTemplate(template),
            generated_at: new Date().toISOString(),
            fallback: true
        };
    }

    get10SlideTemplate() {
        return {
            name: "Классический 10-слайдовый Pitch Deck",
            description: "Стандартный формат для первых встреч с инвесторами",
            slides: [
                { number: 1, title: "Title Slide", max_time: 15 },
                { number: 2, title: "The Problem", max_time: 30 },
                { number: 3, title: "The Solution", max_time: 45 },
                { number: 4, title: "Why Now", max_time: 30 },
                { number: 5, title: "Market Size", max_time: 30 },
                { number: 6, title: "Product", max_time: 60 },
                { number: 7, title: "Business Model", max_time: 45 },
                { number: 8, title: "Competition", max_time: 30 },
                { number: 9, title: "Team", max_time: 30 },
                { number: 10, title: "The Ask", max_time: 45 }
            ],
            instructions: "Создайте убедительную презентацию для seed раунда.",
            total_time: "10 минут",
            best_for: "First meetings, angel investors"
        };
    }

    get15SlideTemplate() {
        return {
            name: "Детальный 15-слайдовый Pitch Deck",
            description: "Полная презентация для due diligence",
            slides: [
                { number: 1, title: "Investment Thesis", max_time: 30 },
                { number: 2, title: "Executive Summary", max_time: 60 },
                { number: 3, title: "Market Analysis", max_time: 90 },
                { number: 4, title: "Problem Deep Dive", max_time: 60 },
                { number: 5, title: "Solution & Technology", max_time: 90 },
                { number: 6, title: "Business Model", max_time: 60 },
                { number: 7, title: "Go-to-Market Strategy", max_time: 60 },
                { number: 8, title: "Competitive Analysis", max_time: 60 },
                { number: 9, title: "Financial Projections", max_time: 90 },
                { number: 10, title: "Team & Cap Table", max_time: 60 },
                { number: 11, title: "Traction & Milestones", max_time: 60 },
                { number: 12, title: "Use of Funds", max_time: 45 },
                { number: 13, title: "Exit Strategy", max_time: 45 },
                { number: 14, title: "Risk Analysis", max_time: 60 },
                { number: 15, title: "Appendix", max_time: 0 }
            ],
            instructions: "Детальная презентация для Series A и выше.",
            total_time: "60+ минут",
            best_for: "Series A+, VC funds, detailed due diligence"
        };
    }

    getExecutiveSummaryTemplate() {
        return {
            name: "Executive Summary",
            description: "Краткое изложение для быстрого ознакомления",
            slides: [
                { number: 1, title: "Executive Summary", max_time: 60 },
                { number: 2, title: "Key Metrics", max_time: 45 },
                { number: 3, title: "Investment Opportunity", max_time: 45 }
            ],
            instructions: "Создайте краткое, но информативное резюме.",
            total_time: "5 минут",
            best_for: "Quick reviews, email pitches"
        };
    }
}

module.exports = PitchDeckGenerator;