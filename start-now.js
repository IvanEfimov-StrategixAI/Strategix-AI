// start-now.js
console.log('🚀 Быстрый запуск Strategix AI Pro...');

// Создаем правильный .env файл
const fs = require('fs');

const envContent = `
# GigaChat API
GIGACHAT_API_KEY=MDE5YjNkOTUtOTk2Ny03YWUyLTkxNDctMzg0ZmFjZjU0M2RjOjA4YzMwN2JkLTAwZTEtNDE1NS05ZTUxLTBkYjU4YzE3ZDQ0OQ==

# Supabase Configuration (NEW KEYS)
SUPABASE_URL=https://rbriucldokcqufagvvcn.supabase.co
SUPABASE_ANON_KEY=sb_publishable_ybReXOAcputCQVxlophprA_59KEq7r_
SUPABASE_SERVICE_ROLE_KEY=sb_secret_OTPytlBCdTijugYkDSVcbg_rsTOMJTE

# JWT Configuration
JWT_SECRET=strategix-ai-secret-key-pro-version-2025
JWT_REFRESH_SECRET=strategix-ai-refresh-secret-2025
JWT_EXPIRES_IN=12h
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development
OLLAMA_BASE_URL=http://localhost:11434
`;

fs.writeFileSync('.env.fixed', envContent);
console.log('✅ Создан .env.fixed файл с правильными ключами');

// Копируем в .env
if (!fs.existsSync('.env') || process.argv.includes('--force')) {
    fs.copyFileSync('.env.fixed', '.env');
    console.log('✅ .env файл обновлен');
}

console.log('\n🎯 Запускаю сервер...\n');

// Запускаем сервер
require('./server.js');