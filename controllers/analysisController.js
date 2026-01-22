const EnhancedUnitMasterProCalculator = require('../classes/UnitMasterProCalculator');
const PitchDeckGenerator = require('../classes/PitchDeckGenerator');
const EnhancedDocumentGenerator = require('../classes/EnhancedDocumentGenerator');
const PersonalizedIdeaGenerator = require('../classes/PersonalizedIdeaGenerator');

class AnalysisController {
    constructor() {
        this.unitCalculator = new EnhancedUnitMasterProCalculator();
        this.pitchDeckGenerator = new PitchDeckGenerator();
        this.docGenerator = new EnhancedDocumentGenerator();
        this.ideaGenerator = new PersonalizedIdeaGenerator();
    }

    async analyzeUnitEconomics(req, res) {
        try {
            const { businessDescription, businessType, verificationLevel } = req.body;

            if (!businessDescription) {
                return res.status(400).json({
                    success: false,
                    error: 'businessDescription обязателен'
                });
            }

            console.log('📊 Анализ юнит-экономики...');

            const result = await this.unitCalculator.analyze(
                businessDescription,
                businessType,
                verificationLevel || 'full'
            );

            res.json({
                success: true,
                ...result
            });

        } catch (error) {
            console.error('❌ Ошибка анализа юнит-экономики:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Ошибка при анализе юнит-экономики'
            });
        }
    }

    async generatePitchDeck(req, res) {
        try {
            const { businessIdea, templateType, data } = req.body;

            if (!businessIdea && !data) {
                return res.status(400).json({
                    success: false,
                    error: 'businessIdea или data обязательны'
                });
            }

            console.log('🎤 Генерация Pitch Deck...');

            const deckData = data || { description: businessIdea };
            const result = await this.pitchDeckGenerator.generatePitchDeck(
                deckData,
                templateType || 'pitch_deck_10',
                { detailed: true }
            );

            res.json({
                success: true,
                ...result
            });

        } catch (error) {
            console.error('❌ Ошибка генерации Pitch Deck:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Ошибка при генерации презентации'
            });
        }
    }

    async generateBusinessPlan(req, res) {
        try {
            const { businessIdea, options } = req.body;

            if (!businessIdea) {
                return res.status(400).json({
                    success: false,
                    error: 'businessIdea обязателен'
                });
            }

            console.log('📄 Генерация бизнес-плана...');

            const result = await this.docGenerator.generateDocument(
                'business_plan',
                'detailed',
                { description: businessIdea },
                options || {}
            );

            res.json({
                success: true,
                ...result
            });

        } catch (error) {
            console.error('❌ Ошибка генерации бизнес-плана:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Ошибка при генерации бизнес-плана'
            });
        }
    }

    async generateMarketingStrategy(req, res) {
        try {
            const { businessIdea, timelineMonths } = req.body;

            if (!businessIdea) {
                return res.status(400).json({
                    success: false,
                    error: 'businessIdea обязателен'
                });
            }

            console.log('📢 Генерация маркетинговой стратегии...');

            const result = await this.docGenerator.generateDocument(
                'marketing_strategy',
                'detailed',
                { description: businessIdea },
                { timeline_months: timelineMonths || 12 }
            );

            res.json({
                success: true,
                ...result
            });

        } catch (error) {
            console.error('❌ Ошибка генерации маркетинговой стратегии:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Ошибка при генерации стратегии'
            });
        }
    }

    async generateIdeas(req, res) {
        try {
            const { skills, interests, investment, time, risk, market, location } = req.body;

            const userResponses = {
                skills: skills || '',
                interests: interests || [],
                investment: investment || 'low',
                time: time || 'part_time',
                risk: risk || 'medium',
                market: market || 'b2c',
                location: location || 'local'
            };

            console.log('💡 Генерация персонализированных бизнес-идей...');

            const result = await this.ideaGenerator.generateIdeas(userResponses);

            res.json({
                success: true,
                ...result
            });

        } catch (error) {
            console.error('❌ Ошибка генерации идей:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Ошибка при генерации бизнес-идей'
            });
        }
    }

    async getIdeaQuestionnaire(req, res) {
        try {
            const questionnaire = this.ideaGenerator.getQuestionnaire();
            const businessTypes = this.ideaGenerator.getBusinessTypes();

            res.json({
                success: true,
                questionnaire: questionnaire,
                business_types: businessTypes,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Ошибка получения анкеты:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async getUnitEconomicsBenchmarks(req, res) {
        try {
            const { businessType } = req.query;

            const metrics = this.unitCalculator.getMetrics();
            const benchmarks = this.unitCalculator.getIndustryBenchmarks();

            let specificBenchmarks = null;
            if (businessType && benchmarks[businessType]) {
                specificBenchmarks = benchmarks[businessType];
            }

            res.json({
                success: true,
                metrics: metrics,
                benchmarks: specificBenchmarks || benchmarks,
                business_type: businessType || 'all',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Ошибка получения бенчмарков:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async analyzeBusinessFeasibility(req, res) {
        try {
            const { businessIdea, marketSize, competition, teamExperience, funding } = req.body;

            if (!businessIdea) {
                return res.status(400).json({
                    success: false,
                    error: 'businessIdea обязателен'
                });
            }

            console.log('🔍 Анализ жизнеспособности бизнеса...');

            // Анализ через несколько источников
            const analyses = await Promise.all([
                this.unitCalculator.analyze(businessIdea, null, 'full'),
                this.generateQuickPitchDeck(businessIdea)
            ]);

            const unitAnalysis = analyses[0];
            const pitchDeck = analyses[1];

            // Оценка жизнеспособности
            const feasibilityScore = this.calculateFeasibilityScore(unitAnalysis, {
                marketSize,
                competition,
                teamExperience,
                funding
            });

            res.json({
                success: true,
                business_idea: businessIdea.substring(0, 200),
                unit_economics: unitAnalysis,
                pitch_deck_preview: pitchDeck,
                feasibility_score: feasibilityScore.score,
                feasibility_level: feasibilityScore.level,
                recommendations: feasibilityScore.recommendations,
                risks: feasibilityScore.risks,
                generated_at: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Ошибка анализа жизнеспособности:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Ошибка при анализе жизнеспособности'
            });
        }
    }

    async generateQuickPitchDeck(businessIdea) {
        try {
            const deckData = { description: businessIdea };
            const result = await this.pitchDeckGenerator.generatePitchDeck(deckData, 'executive_summary');
            return result.content;
        } catch (error) {
            return 'Быстрая презентация не сгенерирована';
        }
    }

    calculateFeasibilityScore(unitAnalysis, additionalFactors) {
        let score = 0;

        // Оценка юнит-экономики
        if (unitAnalysis.calculated_metrics) {
            const ltvCac = parseFloat(unitAnalysis.calculated_metrics.ltv_cac_ratio?.value || 0);
            if (ltvCac >= 3.0) score += 30;
            else if (ltvCac >= 2.0) score += 20;
            else if (ltvCac >= 1.0) score += 10;

            const churn = parseFloat(unitAnalysis.calculated_metrics.churn_rate?.value || 0);
            if (churn < 5) score += 20;
            else if (churn < 10) score += 15;
            else if (churn < 20) score += 10;
        }

        // Дополнительные факторы
        if (additionalFactors.marketSize === 'large') score += 15;
        if (additionalFactors.competition === 'low') score += 10;
        if (additionalFactors.teamExperience === 'high') score += 15;
        if (additionalFactors.funding === 'secured') score += 10;

        const level = score >= 70 ? 'high' : score >= 50 ? 'medium' : 'low';

        const recommendations = [];
        if (score < 50) {
            recommendations.push('Требуется серьезная доработка бизнес-модели');
            recommendations.push('Рассмотрите возможность пивоттинга');
        } else if (score < 70) {
            recommendations.push('Улучшите юнит-экономику');
            recommendations.push('Проведите дополнительные исследования рынка');
        } else {
            recommendations.push('Бизнес-идея выглядит перспективной');
            recommendations.push('Начинайте подготовку к запуску');
        }

        const risks = score < 50 ? [
            'Высокий риск неудачи',
            'Требуются значительные инвестиции',
            'Сложный рынок с высокой конкуренцией'
        ] : score < 70 ? [
            'Умеренный риск',
            'Требуется оптимизация процессов',
            'Возможны проблемы с масштабированием'
        ] : [
            'Низкий риск',
            'Стабильная бизнес-модель',
            'Хорошие перспективы роста'
        ];

        return {
            score: Math.min(100, score),
            level: level,
            recommendations: recommendations,
            risks: risks
        };
    }

    async generateComprehensiveAnalysis(req, res) {
        try {
            const { businessIdea, userId } = req.body;

            if (!businessIdea) {
                return res.status(400).json({
                    success: false,
                    error: 'businessIdea обязателен'
                });
            }

            console.log('📈 Комплексный анализ бизнес-идеи...');

            // Выполняем все анализы параллельно
            const analyses = await Promise.all([
                this.unitCalculator.analyze(businessIdea, null, 'full'),
                this.pitchDeckGenerator.generatePitchDeck({ description: businessIdea }, 'pitch_deck_10'),
                this.docGenerator.generateDocument('business_plan', 'summary', { description: businessIdea }),
                this.ideaGenerator.generateIdeas({ skills: '', interests: [] }) // Для сравнения
            ]);

            const [unitAnalysis, pitchDeck, businessPlan, alternativeIdeas] = analyses;

            // Формируем сводный отчет
            const summaryReport = {
                business_idea: businessIdea.substring(0, 300),
                executive_summary: this.generateExecutiveSummary(unitAnalysis, pitchDeck),
                key_findings: this.extractKeyFindings(unitAnalysis, pitchDeck, businessPlan),
                recommendations: this.generateComprehensiveRecommendations(unitAnalysis),
                risk_assessment: this.assessRisks(unitAnalysis),
                next_steps: this.generateNextSteps(),
                alternative_ideas: alternativeIdeas.ideas?.slice(0, 3) || [],
                generated_at: new Date().toISOString(),
                user_id: userId || 'anonymous',
                report_id: `report_${Date.now()}`
            };

            res.json({
                success: true,
                report: summaryReport,
                analyses: {
                    unit_economics: unitAnalysis,
                    pitch_deck: pitchDeck,
                    business_plan: businessPlan
                },
                export_formats: ['json', 'pdf', 'html']
            });

        } catch (error) {
            console.error('❌ Ошибка комплексного анализа:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Ошибка при проведении комплексного анализа'
            });
        }
    }

    generateExecutiveSummary(unitAnalysis, pitchDeck) {
        return {
            business_potential: unitAnalysis.confidence_score >= 70 ? 'high' : 'medium',
            investment_readiness: 'ready_for_seed',
            time_to_market: '3-6 месяцев',
            key_strengths: [
                'Хорошая юнит-экономика',
                'Убедительное ценностное предложение',
                'Перспективный рынок'
            ],
            main_challenges: [
                'Требуется оптимизация CAC',
                'Конкуренция на рынке'
            ]
        };
    }

    extractKeyFindings(unitAnalysis, pitchDeck, businessPlan) {
        return {
            financial_viability: unitAnalysis.calculated_metrics ? '✅ Достаточная' : '⚠️ Требует улучшения',
            market_opportunity: '📈 Растущий рынок',
            competitive_advantage: '⚡ Уникальное ценностное предложение',
            team_readiness: '👥 Требуется дополнение команды',
            technical_feasibility: '💻 Реализуемо с текущими технологиями'
        };
    }

    generateComprehensiveRecommendations(unitAnalysis) {
        const recommendations = [];

        if (unitAnalysis.calculated_metrics?.ltv_cac_ratio?.status === 'critical') {
            recommendations.push({
                priority: 'high',
                area: 'Финансы',
                action: 'Немедленно оптимизировать соотношение LTV:CAC',
                timeline: '1-2 месяца',
                impact: 'Критическое для жизнеспособности'
            });
        }

        recommendations.push({
            priority: 'medium',
            area: 'Маркетинг',
            action: 'Разработать детальную маркетинговую стратегию',
            timeline: '2-3 месяца',
            impact: 'Увеличение узнаваемости'
        });

        return recommendations;
    }

    assessRisks(unitAnalysis) {
        return {
            financial_risks: [
                'Недостаточное финансирование',
                'Нереалистичные финансовые прогнозы'
            ],
            market_risks: [
                'Высокая конкуренция',
                'Изменение рыночных условий'
            ],
            operational_risks: [
                'Зависимость от ключевых сотрудников',
                'Технологические сложности'
            ],
            mitigation_strategies: [
                'Диверсификация источников дохода',
                'Построение сильного бренда',
                'Инвестиции в команду'
            ]
        };
    }

    generateNextSteps() {
        return [
            { step: 1, action: 'Разработать детальный бизнес-план', timeline: '1 месяц' },
            { step: 2, action: 'Создать MVP продукта', timeline: '2-3 месяца' },
            { step: 3, action: 'Провести пилотное тестирование', timeline: '1 месяц' },
            { step: 4, action: 'Привлечь seed инвестиции', timeline: '3-6 месяцев' }
        ];
    }
}

module.exports = new AnalysisController();