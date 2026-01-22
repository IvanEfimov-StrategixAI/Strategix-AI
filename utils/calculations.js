class FinancialCalculations {
  // Расчет юнит-экономики
  calculateUnitEconomics(params) {
    const {
      arpu, // Average Revenue Per User
      cac,  // Customer Acquisition Cost
      churn, // Monthly churn rate
      cogs,  // Cost of Goods Sold (percentage)
      operatingExpenses
    } = params;

    // Базовые расчеты
    const grossMargin = 1 - (cogs || 0.3);
    const customerLifetime = churn > 0 ? 1 / churn : 12;
    
    // LTV (Lifetime Value)
    const ltv = arpu * customerLifetime * grossMargin;
    
    // LTV:CAC Ratio
    const ltvCacRatio = cac > 0 ? ltv / cac : 0;
    
    // Payback Period
    const paybackPeriod = cac > 0 ? cac / (arpu * grossMargin) : 0;
    
    // MRR (Monthly Recurring Revenue)
    const mrr = arpu * (params.activeCustomers || 100);
    
    // ARR (Annual Recurring Revenue)
    const arr = mrr * 12;
    
    // Gross Profit
    const grossProfit = mrr * grossMargin;
    
    // Net Profit
    const netProfit = grossProfit - (operatingExpenses || 0);
    
    // Profit Margin
    const profitMargin = mrr > 0 ? (netProfit / mrr) * 100 : 0;
    
    // ROI (Return on Investment)
    const roi = cac > 0 ? ((ltv - cac) / cac) * 100 : 0;
    
    return {
      ltv: Math.round(ltv),
      cac: Math.round(cac),
      ltvCacRatio: ltvCacRatio.toFixed(2),
      churnRate: (churn * 100).toFixed(2) + '%',
      retentionRate: ((1 - churn) * 100).toFixed(2) + '%',
      paybackPeriod: paybackPeriod.toFixed(1) + ' months',
      grossMargin: (grossMargin * 100).toFixed(1) + '%',
      mrr: Math.round(mrr),
      arr: Math.round(arr),
      grossProfit: Math.round(grossProfit),
      netProfit: Math.round(netProfit),
      profitMargin: profitMargin.toFixed(1) + '%',
      roi: roi.toFixed(1) + '%',
      customerLifetime: customerLifetime.toFixed(1) + ' months'
    };
  }

  // Финансовые прогнозы
  calculateFinancialForecast(params) {
    const {
      initialRevenue,
      growthRate,
      expenses,
      months = 12
    } = params;

    const forecast = [];
    let cumulativeRevenue = 0;
    let cumulativeProfit = 0;
    let revenue = initialRevenue;

    for (let month = 1; month <= months; month++) {
      // Корректируем темп роста (замедление со временем)
      const adjustedGrowthRate = growthRate * Math.pow(0.98, month - 1);
      revenue = month === 1 ? initialRevenue : revenue * (1 + adjustedGrowthRate);
      
      // Расходы растут медленнее доходов
      const monthlyExpenses = expenses * (1 + (adjustedGrowthRate * 0.7));
      
      const profit = revenue - monthlyExpenses;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
      
      cumulativeRevenue += revenue;
      cumulativeProfit += profit;

      forecast.push({
        month,
        revenue: Math.round(revenue),
        expenses: Math.round(monthlyExpenses),
        profit: Math.round(profit),
        margin: margin.toFixed(1) + '%',
        cumulativeRevenue: Math.round(cumulativeRevenue),
        cumulativeProfit: Math.round(cumulativeProfit),
        growthRate: (adjustedGrowthRate * 100).toFixed(1) + '%'
      });
    }

    const summary = {
      totalRevenue: Math.round(cumulativeRevenue),
      totalExpenses: Math.round(expenses * months * 1.2), // Примерный расчет
      totalProfit: Math.round(cumulativeProfit),
      averageMonthlyRevenue: Math.round(cumulativeRevenue / months),
      averageMonthlyProfit: Math.round(cumulativeProfit / months),
      averageMargin: ((cumulativeProfit / cumulativeRevenue) * 100).toFixed(1) + '%',
      breakEvenMonth: forecast.findIndex(f => f.cumulativeProfit > 0) + 1 || '>12'
    };

    return { forecast, summary };
  }

  // Расчет точки безубыточности
  calculateBreakEvenPoint(params) {
    const { fixedCosts, variableCostPerUnit, pricePerUnit } = params;
    
    if (pricePerUnit <= variableCostPerUnit) {
      return {
        success: false,
        error: 'Цена не покрывает переменные затраты'
      };
    }
    
    const contributionMargin = pricePerUnit - variableCostPerUnit;
    const breakEvenUnits = Math.ceil(fixedCosts / contributionMargin);
    const breakEvenRevenue = breakEvenUnits * pricePerUnit;
    
    return {
      success: true,
      breakEvenUnits,
      breakEvenRevenue: Math.round(breakEvenRevenue),
      contributionMargin: Math.round(contributionMargin),
      contributionMarginRatio: ((contributionMargin / pricePerUnit) * 100).toFixed(1) + '%',
      safetyMargin: (pricePerUnit - variableCostPerUnit).toFixed(2)
    };
  }

  // Расчет ROI
  calculateROI(investment, returns, periodMonths = 12) {
    const totalReturns = returns.reduce((sum, ret) => sum + ret, 0);
    const totalInvestment = investment.reduce((sum, inv) => sum + inv, 0);
    
    if (totalInvestment === 0) {
      return { success: false, error: 'Инвестиции не могут быть нулевыми' };
    }
    
    const roi = ((totalReturns - totalInvestment) / totalInvestment) * 100;
    const annualizedROI = (Math.pow(1 + roi/100, 12/periodMonths) - 1) * 100;
    const paybackPeriod = totalInvestment / (totalReturns / periodMonths);
    
    return {
      success: true,
      roi: roi.toFixed(2) + '%',
      annualizedROI: annualizedROI.toFixed(2) + '%',
      paybackPeriod: paybackPeriod.toFixed(1) + ' months',
      netProfit: Math.round(totalReturns - totalInvestment),
      totalInvestment: Math.round(totalInvestment),
      totalReturns: Math.round(totalReturns)
    };
  }

  // Расчет дисконтированного денежного потока (DCF)
  calculateDCF(cashFlows, discountRate = 0.1, terminalGrowthRate = 0.02) {
    let pvCashFlows = 0;
    
    // Приведенная стоимость денежных потоков по годам
    cashFlows.forEach((cashFlow, year) => {
      const discountFactor = Math.pow(1 + discountRate, year + 1);
      pvCashFlows += cashFlow / discountFactor;
    });
    
    // Терминальная стоимость
    const lastCashFlow = cashFlows[cashFlows.length - 1] || 0;
    const terminalValue = lastCashFlow * (1 + terminalGrowthRate) / (discountRate - terminalGrowthRate);
    const pvTerminalValue = terminalValue / Math.pow(1 + discountRate, cashFlows.length);
    
    const totalValue = pvCashFlows + pvTerminalValue;
    
    return {
      presentValueCashFlows: Math.round(pvCashFlows),
      presentValueTerminalValue: Math.round(pvTerminalValue),
      totalPresentValue: Math.round(totalValue),
      terminalValue: Math.round(terminalValue),
      npv: Math.round(totalValue),
      internalRateOfReturn: this.calculateIRR(cashFlows)
    };
  }

  // Расчет внутренней нормы доходности (IRR)
  calculateIRR(cashFlows, maxIterations = 1000, precision = 0.00001) {
    let guess = 0.1; // Начальное предположение
    let irr = guess;
    
    for (let i = 0; i < maxIterations; i++) {
      let npv = 0;
      let dNpv = 0;
      
      cashFlows.forEach((cashFlow, t) => {
        const discountFactor = Math.pow(1 + irr, t + 1);
        npv += cashFlow / discountFactor;
        dNpv += -t * cashFlow / Math.pow(1 + irr, t + 2);
      });
      
      const newIrr = irr - npv / dNpv;
      
      if (Math.abs(newIrr - irr) < precision) {
        return (newIrr * 100).toFixed(2) + '%';
      }
      
      irr = newIrr;
    }
    
    return 'Не удалось рассчитать';
  }

  // Расчет мультипликаторов оценки
  calculateValuationMultiples(params) {
    const { revenue, ebitda, netIncome, industry } = params;
    
    const industryMultiples = {
      saas: { revenue: 8, ebitda: 20, netIncome: 25 },
      ecommerce: { revenue: 2, ebitda: 12, netIncome: 15 },
      marketplace: { revenue: 5, ebitda: 15, netIncome: 18 },
      fintech: { revenue: 6, ebitda: 18, netIncome: 22 },
      healthtech: { revenue: 7, ebitda: 22, netIncome: 28 }
    };
    
    const multiples = industryMultiples[industry] || industryMultiples.saas;
    
    const revenueBased = revenue ? revenue * multiples.revenue : null;
    const ebitdaBased = ebitda ? ebitda * multiples.ebitda : null;
    const incomeBased = netIncome ? netIncome * multiples.netIncome : null;
    
    const valuations = [revenueBased, ebitdaBased, incomeBased].filter(v => v !== null);
    const averageValuation = valuations.length > 0 
      ? valuations.reduce((sum, val) => sum + val, 0) / valuations.length 
      : 0;
    
    return {
      revenueBasedValuation: revenueBased ? Math.round(revenueBased) : null,
      ebitdaBasedValuation: ebitdaBased ? Math.round(ebitdaBased) : null,
      incomeBasedValuation: incomeBased ? Math.round(incomeBased) : null,
      averageValuation: Math.round(averageValuation),
      multiplesUsed: multiples,
      industry
    };
  }

  // Расчет бюджета маркетинга
  calculateMarketingBudget(params) {
    const { revenue, industry, growthTarget } = params;
    
    const industryPercentages = {
      saas: { min: 0.2, max: 0.4, typical: 0.3 },
      ecommerce: { min: 0.1, max: 0.3, typical: 0.2 },
      marketplace: { min: 0.15, max: 0.35, typical: 0.25 },
      fintech: { min: 0.25, max: 0.45, typical: 0.35 },
      healthtech: { min: 0.2, max: 0.4, typical: 0.3 }
    };
    
    const percentages = industryPercentages[industry] || industryPercentages.saas;
    
    // Корректировка на целевой рост
    const growthMultiplier = 1 + (growthTarget || 0.3);
    const adjustedPercentage = percentages.typical * growthMultiplier;
    
    const budget = revenue * adjustedPercentage;
    const monthlyBudget = budget / 12;
    
    // Распределение по каналам
    const channelAllocation = {
      digital: Math.round(budget * 0.6),
      content: Math.round(budget * 0.2),
      events: Math.round(budget * 0.1),
      pr: Math.round(budget * 0.1)
    };
    
    return {
      annualBudget: Math.round(budget),
      monthlyBudget: Math.round(monthlyBudget),
      percentageOfRevenue: (adjustedPercentage * 100).toFixed(1) + '%',
      channelAllocation,
      industryBenchmark: {
        min: (percentages.min * 100).toFixed(1) + '%',
        typical: (percentages.typical * 100).toFixed(1) + '%',
        max: (percentages.max * 100).toFixed(1) + '%'
      }
    };
  }

  // Расчет стоимости команды
  calculateTeamCost(team) {
    const totalAnnualCost = team.reduce((sum, member) => {
      const monthlySalary = member.salary || 0;
      const benefits = member.benefits || 0.3; // 30% benefits
      const annualCost = monthlySalary * 12 * (1 + benefits);
      return sum + annualCost;
    }, 0);
    
    const monthlyCost = totalAnnualCost / 12;
    const costPerEmployee = team.length > 0 ? totalAnnualCost / team.length : 0;
    
    // Расчет нагрузки (burn rate)
    const burnRate = monthlyCost;
    const runway = (params.cashBalance || 0) / burnRate;
    
    return {
      totalAnnualCost: Math.round(totalAnnualCost),
      monthlyCost: Math.round(monthlyCost),
      costPerEmployee: Math.round(costPerEmployee),
      teamSize: team.length,
      burnRate: Math.round(burnRate),
      runway: runway.toFixed(1) + ' months',
      criticalRunway: runway < 6 ? '⚠️ Низкий' : runway < 12 ? '⚠️ Средний' : '✅ Хороший'
    };
  }

  // Анализ чувствительности
  performSensitivityAnalysis(baseScenario, variables) {
    const scenarios = [];
    
    variables.forEach(variable => {
      // Позитивный сценарий (+20%)
      const positiveScenario = {
        name: `${variable.name} +20%`,
        value: variable.value * 1.2,
        impact: this.calculateImpact(baseScenario, variable, 1.2)
      };
      
      // Негативный сценарий (-20%)
      const negativeScenario = {
        name: `${variable.name} -20%`,
        value: variable.value * 0.8,
        impact: this.calculateImpact(baseScenario, variable, 0.8)
      };
      
      scenarios.push(positiveScenario, negativeScenario);
    });
    
    // Анализ чувствительности
    const sensitivity = scenarios.map(scenario => ({
      variable: scenario.name,
      change: ((scenario.value / variables.find(v => v.name === scenario.name.split(' ')[0])?.value - 1) * 100).toFixed(1) + '%',
      impactOnRevenue: scenario.impact.revenueChange + '%',
      impactOnProfit: scenario.impact.profitChange + '%',
      severity: Math.abs(scenario.impact.profitChange) > 30 ? 'Высокая' : 
                Math.abs(scenario.impact.profitChange) > 15 ? 'Средняя' : 'Низкая'
    }));
    
    return {
      scenarios,
      sensitivity,
      mostSensitiveVariable: sensitivity.reduce((most, current) => 
        Math.abs(parseFloat(current.impactOnProfit)) > Math.abs(parseFloat(most.impactOnProfit)) ? current : most
      ),
      recommendations: this.generateSensitivityRecommendations(sensitivity)
    };
  }

  calculateImpact(baseScenario, variable, multiplier) {
    // Упрощенный расчет воздействия
    const newValue = variable.value * multiplier;
    const changePercentage = (multiplier - 1) * 100;
    
    // Примерный расчет влияния на выручку и прибыль
    const revenueImpact = variable.weight * changePercentage * 0.8;
    const profitImpact = variable.weight * changePercentage;
    
    return {
      revenueChange: revenueImpact.toFixed(1),
      profitChange: profitImpact.toFixed(1),
      newValue
    };
  }

  generateSensitivityRecommendations(sensitivity) {
    const highImpact = sensitivity.filter(s => s.severity === 'Высокая');
    
    if (highImpact.length === 0) {
      return ['Модель устойчива к изменениям ключевых переменных'];
    }
    
    const recommendations = [
      'Рекомендуется уделить особое внимание следующим переменным:'
    ];
    
    highImpact.forEach(variable => {
      recommendations.push(`- ${variable.variable}: ${variable.impactOnProfit} воздействие на прибыль`);
    });
    
    recommendations.push('Разработайте стратегии митигации для этих рисков');
    
    return recommendations;
  }

  // Расчет CAC по каналам
  calculateCACByChannel(marketingSpend, acquisitions) {
    const totalSpend = Object.values(marketingSpend).reduce((sum, spend) => sum + spend, 0);
    const totalAcquisitions = Object.values(acquisitions).reduce((sum, acq) => sum + acq, 0);
    
    const cacByChannel = {};
    Object.keys(marketingSpend).forEach(channel => {
      const spend = marketingSpend[channel];
      const acq = acquisitions[channel] || 0;
      cacByChannel[channel] = acq > 0 ? Math.round(spend / acq) : Infinity;
    });
    
    const averageCAC = totalAcquisitions > 0 ? Math.round(totalSpend / totalAcquisitions) : Infinity;
    
    // Ранжирование каналов по эффективности
    const rankedChannels = Object.entries(cacByChannel)
      .sort(([, cacA], [, cacB]) => cacA - cacB)
      .map(([channel, cac]) => ({
        channel,
        cac: cac === Infinity ? '∞' : cac,
        efficiency: cac === Infinity ? 'Низкая' : cac < averageCAC * 0.7 ? 'Высокая' : 
                   cac < averageCAC * 1.3 ? 'Средняя' : 'Низкая'
      }));
    
    return {
      totalSpend: Math.round(totalSpend),
      totalAcquisitions,
      averageCAC: averageCAC === Infinity ? '∞' : averageCAC,
      cacByChannel,
      rankedChannels,
      recommendations: this.generateCACRecommendations(rankedChannels, averageCAC)
    };
  }

  generateCACRecommendations(rankedChannels, averageCAC) {
    const recommendations = [];
    const efficientChannels = rankedChannels.filter(c => c.efficiency === 'Высокая');
    const inefficientChannels = rankedChannels.filter(c => c.efficiency === 'Низкая');
    
    if (efficientChannels.length > 0) {
      recommendations.push(
        `Увеличьте бюджет для эффективных каналов: ${efficientChannels.map(c => c.channel).join(', ')}`
      );
    }
    
    if (inefficientChannels.length > 0) {
      recommendations.push(
        `Оптимизируйте или сократите затраты на неэффективные каналы: ${inefficientChannels.map(c => c.channel).join(', ')}`
      );
    }
    
    if (averageCAC > 100) {
      recommendations.push('CAC слишком высокий. Исследуйте более эффективные каналы привлечения.');
    }
    
    return recommendations;
  }
}

// Экспорт синглтона
module.exports = new FinancialCalculations();