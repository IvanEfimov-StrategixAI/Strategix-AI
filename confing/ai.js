module.exports = {
  gigachat: {
    apiKey: process.env.GIGACHAT_API_KEY,
    baseUrl: 'https://gigachat.devices.sberbank.ru/api/v1',
    models: {
      creative: 'GigaChat:latest',
      analytical: 'GigaChat-Pro',
      code: 'GigaChat-Code'
    },
    temperature: 0.7,
    maxTokens: 4000,
    timeout: 30000
  },
  
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    models: {
      code: 'codellama:13b',
      business: 'llama3:8b',
      creative: 'mistral:7b'
    }
  },
  
  businessTypes: {
    saas: {
      name: 'SaaS (Software as a Service)',
      features: ['подписки', 'multi-tenant', 'API', 'аналитика'],
      colorScheme: { primary: '#059669', secondary: '#0891B2', accent: '#7C3AED' }
    },
    ecommerce: {
      name: 'E-commerce',
      features: ['корзина', 'платежи', 'каталог', 'доставка'],
      colorScheme: { primary: '#DC2626', secondary: '#EA580C', accent: '#D97706' }
    },
    marketplace: {
      name: 'Маркетплейс',
      features: ['продавцы', 'комиссии', 'рейтинги', 'модерация'],
      colorScheme: { primary: '#8B5CF6', secondary: '#EC4899', accent: '#3B82F6' }
    },
    fintech: {
      name: 'FinTech',
      features: ['платежи', 'безопасность', 'отчетность', 'комплаенс'],
      colorScheme: { primary: '#1E40AF', secondary: '#1D4ED8', accent: '#3B82F6' }
    },
    healthtech: {
      name: 'HealthTech',
      features: ['записи', 'назначения', 'телемедицина', 'аналитика'],
      colorScheme: { primary: '#10B981', secondary: '#059669', accent: '#3B82F6' }
    }
  }
};