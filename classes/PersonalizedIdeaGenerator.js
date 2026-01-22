const { callGigaChatAPI } = require('../services/gigachat');
const { v4: uuidv4 } = require('uuid');

class PersonalizedIdeaGenerator {
    constructor() {
        this.questionnaire = [
            {
                id: "skills",
                question: "Какие у вас ключевые навыки и опыт?",
                type: "text",
                maxLength: 500
            },
            {
                id: "interests",
                question: "Какие области вам интересны?",
                options: ["Технологии", "Образование", "Здоровье", "Экология", "Финансы", "Сервисы"],
                type: "multiple",
                maxSelections: 3
            },
            {
                id: "investment",
                question: "Какой стартовый капитал доступен?",
                options: [
                    {value: "low", label: "< 100K руб"},
                    {value: "medium", label: "100K - 500K руб"},
                    {value: "high", label: "500K - 1M руб"}
                ],
                type: "single"
            },
            {
                id: "time",
                question: "Сколько времени готовы уделять?",
                options: [
                    {value: "part_time", label: "< 10 часов/нед"},
                    {value: "half_time", label: "10-20 часов/нед"},
                    {value: "full_time", label: "20-40 часов/нед"}
                ],
                type: "single"
            },
            {
                id: "market",
                question: "Предпочтительный рынок?",
                options: [
                    {value: "b2b", label: "B2B (бизнес для бизнеса)"},
                    {value: "b2c", label: "B2C (бизнес для потребителей)"}
                ],
                type: "single"
            }
        ];

        this.businessTypes = {
            saas: {
                name: "SaaS (Программное обеспечение как услуга)",
                description: "Подписка на облачное ПО",
                investment_range: "$10K - $500K",
                timeline: "3-12 месяцев"
            },
            ecommerce: {
                name: "E-commerce (Интернет-магазин)",
                description: "Продажа товаров онлайн",
                investment_range: "$5K - $100K",
                timeline: "1-3 месяца"
            },
            marketplace: {
                name: "Маркетплейс",
                description: "Площадка для продавцов и покупателей",
                investment_range: "$50K - $300K",
                timeline: "6-18 месяцев"
            }
        };
    }

    async generateIdeas(userResponses) {
        try {
            console.log('💡 Генерация персонализированных бизнес-идей...');

            const profile = this.analyzeProfile(userResponses);

            const prompt = `Сгенерируй 5 персонализированных бизнес-идей на основе профиля:
ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ: ${JSON.stringify(userResponses, null, 2)}
АНАЛИЗ ПРОФИЛЯ: Тип предпринимателя: ${profile.entrepreneur_type}
Для каждой идеи укажи в формате JSON:
{
  "title": "Название идеи",
  "category": "Категория",
  "description": "Подробное описание",
  "compatibility_score": число от 0 до 100,
  "business_type": "saas|ecommerce|marketplace|service",
  "target_audience": "Целевая аудитория",
  "unique_value_proposition": "Уникальное предложение",
  "investment_needed": "Стартовые инвестиции",
  "potential_revenue_year_1": "Потенциальный доход в первый год",
  "key_metrics": ["3 ключевые метрики"],
  "first_steps": ["первые 3 шага"]
}
Верни ТОЛЬКО валидный JSON массив с объектами.`;

            const response = await callGigaChatAPI([
                {
                    role: 'system',
                    content: 'Ты - генератор бизнес-идей с опытом работы со стартапами. Создавай реалистичные, проверяемые идеи.'
                },
                { role: 'user', content: prompt }
            ], 0.8, 5000);

            let ideas;
            try {
                const jsonMatch = response.match(/\[\s*\{[\s\S]*?\}\s*\]/);
                if (jsonMatch) {
                    ideas = JSON.parse(jsonMatch[0]);
                } else {
                    ideas = this.generateFallbackIdeas(userResponses, profile);
                }
            } catch (parseError) {
                console.error('Ошибка парсинга идей:', parseError);
                ideas = this.generateFallbackIdeas(userResponses, profile);
            }

            if (!Array.isArray(ideas)) {
                ideas = [ideas];
            }

            for (let idea of ideas) {
                idea.id = uuidv4();
                idea.profile_match = profile;
                idea.branding = await this.generateBranding(idea.title, idea.category);
                idea.generated_at = new Date().toISOString();
            }

            ideas.sort((a, b) => (b.compatibility_score || 0) - (a.compatibility_score || 0));

            return {
                ideas: ideas.slice(0, 5),
                profile: profile,
                generated_at: new Date().toISOString(),
                total_ideas: ideas.length,
                best_match: ideas[0] || null
            };

        } catch (error) {
            console.error('❌ Ошибка генерации идей:', error);
            const profile = this.analyzeProfile(userResponses || {});
            return {
                ideas: this.generateFallbackIdeas(userResponses || {}, profile),
                profile: profile,
                generated_at: new Date().toISOString(),
                error: error.message,
                fallback: true
            };
        }
    }

    analyzeProfile(userResponses) {
        const profile = {
            entrepreneur_type: null,
            strengths: [],
            constraints: [],
            opportunities: []
        };

        const skills = (userResponses.skills || '').toLowerCase();
        if (skills.includes('программир') || skills.includes('технолог')) {
            profile.entrepreneur_type = 'technologist';
            profile.strengths.push('Технические навыки');
        } else if (skills.includes('продаж') || skills.includes('маркетинг')) {
            profile.entrepreneur_type = 'hustler';
            profile.strengths.push('Навыки продаж');
        } else {
            profile.entrepreneur_type = 'operator';
        }

        if (userResponses.investment === 'low') {
            profile.constraints.push('Ограниченный бюджет');
        }

        if (userResponses.time === 'part_time') {
            profile.constraints.push('Ограниченное время');
        }

        return profile;
    }

    async generateBranding(title, category) {
        try {
            const prompt = `Создай брендинг для бизнес-идеи:
Название идеи: ${title}
Категория: ${category}
Создай:
1. Короткое название бренда
2. Слоган
3. Позиционирование
Верни в формате JSON.`;

            const response = await callGigaChatAPI([
                { role: 'system', content: 'Ты - брендинг-эксперт. Создавай современные бренды.' },
                { role: 'user', content: prompt }
            ], 0.85, 2000);

            try {
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
            } catch (parseError) {
                console.error('Ошибка парсинга брендинга:', parseError);
            }

            return {
                brand_name: `${title.split(' ')[0]} ${category.replace('Tech', '')}`,
                slogan: "Инновации для вашего успеха",
                positioning: `${category} решение для современного рынка`
            };

        } catch (error) {
            console.error('Ошибка генерации брендинга:', error);
            return this.generateFallbackBranding(title, category);
        }
    }

    generateFallbackIdeas(userResponses, profile) {
        const fallbackIdeas = [
            {
                id: uuidv4(),
                title: `AI-Powered ${profile.entrepreneur_type === 'technologist' ? 'Analytics' : 'Learning'} Platform`,
                category: profile.entrepreneur_type === 'technologist' ? "DataTech" : "EdTech",
                description: "Платформа для анализа данных/обучения с использованием искусственного интеллекта.",
                compatibility_score: 85,
                business_type: "saas",
                target_audience: profile.market === 'b2b' ? "Малый и средний бизнес" : "Студенты",
                unique_value_proposition: "Адаптивные рекомендации на основе AI",
                investment_needed: "500,000 - 1,000,000 руб",
                potential_revenue_year_1: "2,000,000 руб",
                key_metrics: ["LTV", "CAC", "Churn Rate"],
                first_steps: ["Разработка MVP", "Тестирование с пользователями"]
            }
        ];

        fallbackIdeas.forEach(idea => {
            idea.branding = this.generateFallbackBranding(idea.title, idea.category);
            idea.generated_at = new Date().toISOString();
        });

        return fallbackIdeas;
    }

    generateFallbackBranding(title, category) {
        return {
            brand_name: `${title.split(' ')[0]} ${category.replace('Tech', '')}`,
            slogan: "Будущее уже здесь",
            positioning: `${category} решение для современного рынка`
        };
    }

    getQuestionnaire() {
        return this.questionnaire;
    }

    getBusinessTypes() {
        return this.businessTypes;
    }
}

module.exports = PersonalizedIdeaGenerator;