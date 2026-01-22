const { callGigaChatAPI } = require('../services/gigachat');
const { EnhancedOllamaValidator, EnhancedHeuristicValidator } = require('../utils/validators');

class EnhancedUnitMasterProCalculator {
    constructor() {
        this.metrics = {
            ltv: {
                name: "Customer Lifetime Value",
                description: "Общая прибыль от клиента за все время взаимоотношений",
                formula: "ARPU * (1 / Churn Rate) * Gross Margin",
                unit: "руб/клиент",
                importance: "high"
            },
            cac: {
                name: "Customer Acquisition Cost",
                description: "Стоимость привлечения одного клиента",
                formula: "Маркетинговые расходы / Новые клиенты",
                unit: "руб/клиент",
                importance: "high"
            },
            ltv_cac_ratio: {
                name: "LTV:CAC Ratio",
                description: "Соотношение стоимости клиента к стоимости привлечения",
                formula: "LTV / CAC",
                unit: "коэффициент",
                importance: "critical"
            },
            churn_rate: {
                name: "Churn Rate",
                description: "Процент клиентов, которые перестают пользоваться услугой за период",
                formula: "Потерянные клиенты / Всего клиентов",
                unit: "%/месяц",
                importance: "high"
            },
            arpu: {
                name: "Average Revenue Per User",
                description: "Средний доход с одного пользователя за период",
                formula: "Общая выручка / Активные пользователи",
                unit: "руб/месяц",
                importance: "high"
            }
        };

        this.industryBenchmarks = {
            saas: {
                ltv_cac_ratio: { min: 3.0, target: 4.0, good: 5.0, excellent: 6.0 },
                churn_rate: { min: 0.10, target: 0.07, good: 0.05, excellent: 0.03 },
                gross_margin: { min: 0.70, target: 0.80, good: 0.85, excellent: 0.90 },
                payback_period: { min: 12, target: 9, good: 6, excellent: 3 }
            },
            ecommerce: {
                ltv_cac_ratio: { min: 2.5, target: 3.0, good: 4.0, excellent: 5.0 },
                churn_rate: { min: 0.15, target: 0.12, good: 0.10, excellent: 0.08 },
                gross_margin: { min: 0.40, target: 0.50, good: 0.60, excellent: 0.65 },
                payback_period: { min: 6, target: 4, good: 3, excellent: 2 }
            },
            marketplace: {
                ltv_cac_ratio: { min: 2.0, target: 2.5, good: 3.0, excellent: 4.0 },
                churn_rate: { min: 0.20, target: 0.15, good: 0.10, excellent: 0.08 },
                gross_margin: { min: 0.60, target: 0.70, good: 0.75, excellent: 0.80 },
                payback_period: { min: 9, target: 7, good: 5, excellent: 4 }
            }
        };

        this.ollamaValidator = new EnhancedOllamaValidator();
        this.heuristicValidator = new EnhancedHeuristicValidator();
    }

    async analyze(businessDescription, businessType = null, verificationLevel = 'full') {
        try {
            console.log('📊 UnitMaster Pro анализ...');

            if (!businessType) {
                businessType = this.detectBusinessType(businessDescription);
                console.log(`🤖 Автоопределен тип бизнеса: ${businessType}`);
            }

            const prompt = `Проанализируй бизнес для расчета юнит-экономики:
ОПИСАНИЕ БИЗНЕСА: ${businessDescription}
ТИП БИЗНЕСА: ${businessType}
Предоставь реалистичные оценки для следующих метрик:
1. Средний месячный доход с клиента (ARPU) в рублях
2. Себестоимость услуги/товара (в процентах от выручки)
3. Месячный отток клиентов (Churn Rate в процентах)
4. Стоимость привлечения клиента (CAC) в рублях
5. Количество новых клиентов в месяц
6. Общие операционные расходы в месяц
Верни ответ в формате JSON.`;

            const response = await callGigaChatAPI([
                {
                    role: 'system',
                    content: 'Ты - финансовый аналитик с 10+ лет опыта. Давай реалистичные, консервативные оценки для юнит-экономики.'
                },
                { role: 'user', content: prompt }
            ], 0.3, 4000);

            let analysis;
            try {
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    analysis = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('JSON не найден в ответе');
                }
            } catch (parseError) {
                console.error('Ошибка парсинга анализа:', parseError);
                analysis = this.generateFallbackAnalysis(businessType);
            }

            const calculatedMetrics = this.calculateMetrics(analysis, businessType);
            const benchmarkComparison = this.compareWithBenchmarks(calculatedMetrics, businessType);
            const recommendations = this.generateRecommendations(calculatedMetrics, benchmarkComparison, businessType);
            const financialForecast = this.generateForecast(calculatedMetrics, analysis, businessType);

            let crossValidation = null;
            if (verificationLevel === 'full') {
                const textToValidate = JSON.stringify({
                    analysis: analysis,
                    calculated_metrics: calculatedMetrics
                }, null, 2);

                const ollamaCheck = await this.ollamaValidator.crossCheckWithOllama(
                    textToValidate,
                    `Анализ юнит-экономики для ${businessType} бизнеса`,
                    businessType
                );

                const heuristicCheck = this.heuristicValidator.validate(
                    textToValidate,
                    'unit_economics_analysis',
                    businessType
                );

                crossValidation = {
                    ollama: ollamaCheck,
                    heuristic: heuristicCheck,
                    overall_confidence: Math.round((ollamaCheck.confidence_score + heuristicCheck.confidence_score) / 2),
                    verified: ollamaCheck.verified && heuristicCheck.verified
                };
            }

            return {
                business_description: businessDescription,
                business_type: businessType,
                analysis: analysis,
                calculated_metrics: calculatedMetrics,
                benchmark_comparison: benchmarkComparison,
                recommendations: recommendations,
                financial_forecast: financialForecast,
                cross_validation: crossValidation,
                generated_at: new Date().toISOString(),
                confidence_score: this.calculateConfidenceScore(analysis, calculatedMetrics, businessType)
            };

        } catch (error) {
            console.error('❌ Ошибка UnitMaster анализа:', error);
            throw error;
        }
    }

    calculateMetrics(analysis, businessType) {
        const arpu = analysis.arpu || 1000;
        const monthlyChurn = analysis.monthly_churn || 0.1;
        const cac = analysis.cac || 3000;
        const cogsPercentage = analysis.cogs_percentage || 0.3;
        const grossMargin = 1 - cogsPercentage;
        const customerLifetimeMonths = analysis.customer_lifetime_months || (1 / monthlyChurn);

        const ltv = arpu * customerLifetimeMonths * grossMargin;
        const ltvCacRatio = ltv / cac;
        const retentionRate = 1 - monthlyChurn;
        const paybackPeriod = cac / (arpu * grossMargin);

        return {
            ltv: {
                value: Math.round(ltv),
                unit: "руб",
                description: this.metrics.ltv.description,
                formula: this.metrics.ltv.formula
            },
            cac: {
                value: Math.round(cac),
                unit: "руб",
                description: this.metrics.cac.description,
                formula: this.metrics.cac.formula
            },
            ltv_cac_ratio: {
                value: ltvCacRatio.toFixed(2),
                unit: "коэффициент",
                description: this.metrics.ltv_cac_ratio.description,
                formula: this.metrics.ltv_cac_ratio.formula,
                status: this.getRatioStatus(ltvCacRatio, businessType)
            },
            churn_rate: {
                value: (monthlyChurn * 100).toFixed(1),
                unit: "%/месяц",
                description: this.metrics.churn_rate.description,
                formula: this.metrics.churn_rate.formula,
                status: this.getChurnStatus(monthlyChurn, businessType)
            },
            retention_rate: {
                value: (retentionRate * 100).toFixed(1),
                unit: "%/месяц",
                description: "Процент клиентов, которые остаются с вами"
            },
            gross_margin: {
                value: (grossMargin * 100).toFixed(1),
                unit: "%",
                description: "Валовая маржа после вычета себестоимости",
                status: this.getMarginStatus(grossMargin, businessType)
            },
            payback_period: {
                value: paybackPeriod.toFixed(1),
                unit: "месяцев",
                description: "Время окупаемости стоимости привлечения клиента",
                status: this.getPaybackStatus(paybackPeriod, businessType)
            }
        };
    }

    detectBusinessType(text) {
        const lowerText = text.toLowerCase();
        if (lowerText.includes('saas') || lowerText.includes('подпис')) return 'saas';
        if (lowerText.includes('ecommerce') || lowerText.includes('магазин')) return 'ecommerce';
        if (lowerText.includes('marketplace') || lowerText.includes('площадк')) return 'marketplace';
        return 'saas';
    }

    compareWithBenchmarks(metrics, businessType) {
        const benchmarks = this.industryBenchmarks[businessType] || this.industryBenchmarks.saas;
        const comparison = {};

        if (metrics.ltv_cac_ratio) {
            const ratio = parseFloat(metrics.ltv_cac_ratio.value);
            comparison.ltv_cac_ratio = {
                current: ratio,
                benchmark_target: benchmarks.ltv_cac_ratio.target,
                status: metrics.ltv_cac_ratio.status,
                deviation: (((ratio - benchmarks.ltv_cac_ratio.target) / benchmarks.ltv_cac_ratio.target) * 100).toFixed(1) + "%"
            };
        }

        return comparison;
    }

    generateRecommendations(metrics, benchmarkComparison, businessType) {
        const recommendations = [];
        const benchmarks = this.industryBenchmarks[businessType] || this.industryBenchmarks.saas;

        if (metrics.ltv_cac_ratio.status === 'critical') {
            recommendations.push({
                category: "critical",
                title: "🚨 СРОЧНО: Оптимизируйте соотношение LTV:CAC",
                description: `Ваше соотношение LTV:CAC (${metrics.ltv_cac_ratio.value}) ниже минимального уровня (${benchmarks.ltv_cac_ratio.min}).`,
                actions: [
                    "Немедленно снизьте CAC через оптимизацию маркетинговых каналов",
                    "Увеличьте средний чек через upsell и cross-sell",
                    "Внедрите программу лояльности для увеличения LTV"
                ],
                priority: "critical",
                timeline: "1-3 месяца"
            });
        }

        return recommendations;
    }

    generateForecast(metrics, analysis, businessType) {
        const monthlyRevenue = metrics.arpu?.value || 1000;
        const growthRate = 0.15;
        const newCustomersMonthly = analysis.new_customers_monthly || 10;
        const forecast = [];
        let cumulativeRevenue = 0;

        for (let month = 1; month <= 12; month++) {
            const monthGrowth = growthRate * Math.pow(0.95, month - 1);
            const newCustomers = Math.round(newCustomersMonthly * Math.pow(1 + monthGrowth, month - 1));
            const customers = newCustomers * month;
            const revenue = Math.round(customers * monthlyRevenue);
            const profit = Math.round(revenue * 0.3); // 30% маржа

            cumulativeRevenue += revenue;

            forecast.push({
                month: month,
                customers: customers,
                revenue: revenue,
                profit: profit,
                cumulative_revenue: cumulativeRevenue
            });
        }

        return {
            monthly_forecast: forecast,
            annual_summary: {
                total_revenue: cumulativeRevenue,
                total_profit: forecast.reduce((sum, month) => sum + month.profit, 0),
                average_margin: "30%",
                break_even_month: forecast.findIndex(f => f.cumulative_revenue > 50000) + 1 || ">12"
            }
        };
    }

    calculateConfidenceScore(analysis, metrics, businessType) {
        let score = 70;
        if (analysis.arpu && analysis.arpu > 0) score += 10;
        if (analysis.cac && analysis.cac > 0) score += 10;
        return Math.min(100, Math.max(0, score));
    }

    getRatioStatus(ratio, businessType) {
        const benchmarks = this.industryBenchmarks[businessType] || this.industryBenchmarks.saas;
        if (ratio >= benchmarks.ltv_cac_ratio.excellent) return 'excellent';
        if (ratio >= benchmarks.ltv_cac_ratio.good) return 'good';
        if (ratio >= benchmarks.ltv_cac_ratio.target) return 'acceptable';
        if (ratio >= benchmarks.ltv_cac_ratio.min) return 'warning';
        return 'critical';
    }

    getChurnStatus(churn, businessType) {
        const benchmarks = this.industryBenchmarks[businessType] || this.industryBenchmarks.saas;
        if (churn <= benchmarks.churn_rate.excellent) return 'excellent';
        if (churn <= benchmarks.churn_rate.good) return 'good';
        if (churn <= benchmarks.churn_rate.target) return 'acceptable';
        if (churn <= benchmarks.churn_rate.min) return 'warning';
        return 'critical';
    }

    getMarginStatus(margin, businessType) {
        const benchmarks = this.industryBenchmarks[businessType] || this.industryBenchmarks.saas;
        if (margin >= benchmarks.gross_margin.excellent) return 'excellent';
        if (margin >= benchmarks.gross_margin.good) return 'good';
        if (margin >= benchmarks.gross_margin.target) return 'acceptable';
        if (margin >= benchmarks.gross_margin.min) return 'warning';
        return 'critical';
    }

    getPaybackStatus(payback, businessType) {
        const benchmarks = this.industryBenchmarks[businessType] || this.industryBenchmarks.saas;
        if (payback <= benchmarks.payback_period.excellent) return 'excellent';
        if (payback <= benchmarks.payback_period.good) return 'good';
        if (payback <= benchmarks.payback_period.target) return 'acceptable';
        if (payback <= benchmarks.payback_period.min) return 'warning';
        return 'critical';
    }

    generateFallbackAnalysis(businessType) {
        const defaults = {
            saas: {
                arpu: 1500,
                cogs_percentage: 0.2,
                monthly_churn: 0.08,
                cac: 4000,
                new_customers_monthly: 20,
                operating_expenses: 50000
            },
            ecommerce: {
                arpu: 3000,
                cogs_percentage: 0.6,
                monthly_churn: 0.15,
                cac: 2000,
                new_customers_monthly: 50,
                operating_expenses: 80000
            }
        };

        return {
            ...defaults[businessType] || defaults.saas,
            assumptions: ["Оценки на основе отраслевых средних значений"],
            confidence_level: 65
        };
    }

    getMetrics() {
        return this.metrics;
    }

    getIndustryBenchmarks() {
        return this.industryBenchmarks;
    }
}

module.exports = EnhancedUnitMasterProCalculator;