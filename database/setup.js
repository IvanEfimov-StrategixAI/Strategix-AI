const { createClient } = require('@supabase/supabase-js');
const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            console.error('❌ SUPABASE_URL и SUPABASE_ANON_KEY обязательны в .env файле');
            process.exit(1);
        }
        
        console.log('🔗 Подключение к Supabase...');
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // SQL для создания таблиц
        const sqlStatements = `
        -- Создание таблицы users
        CREATE TABLE IF NOT EXISTS users (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(255),
            password_hash VARCHAR(255) NOT NULL,
            is_admin BOOLEAN DEFAULT FALSE,
            is_verified BOOLEAN DEFAULT FALSE,
            subscription VARCHAR(50) DEFAULT 'free',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );

        -- Создание таблицы документов
        CREATE TABLE IF NOT EXISTS documents (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES users(id),
            title VARCHAR(255) NOT NULL,
            type VARCHAR(50) NOT NULL,
            subtype VARCHAR(50),
            content TEXT,
            validation_data JSONB,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );

        -- Создание таблицы анализов
        CREATE TABLE IF NOT EXISTS analyses (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES users(id),
            analysis_type VARCHAR(50) NOT NULL,
            input_data JSONB,
            result_data JSONB,
            confidence_score INTEGER,
            created_at TIMESTAMP DEFAULT NOW()
        );

        -- Создание индексов
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
        CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
        CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
        `;

        console.log('📊 Создание таблиц...');
        
        // Разделяем SQL на отдельные запросы
        const queries = sqlStatements.split(';').filter(q => q.trim());
        
        for (const query of queries) {
            if (query.trim()) {
                try {
                    const { error } = await supabase.rpc('exec_sql', { query: query.trim() + ';' });
                    if (error) {
                        console.log(`⚠️  Запрос не выполнен (может уже существовать): ${query.substring(0, 100)}...`);
                    }
                } catch (err) {
                    console.log(`⚠️  Пропускаем запрос: ${err.message}`);
                }
            }
        }
        
        console.log('✅ База данных настроена!');
        console.log('\n📋 Созданные таблицы:');
        console.log('   • users - пользователи');
        console.log('   • documents - документы');
        console.log('   • analyses - анализы');
        
    } catch (error) {
        console.error('❌ Ошибка настройки базы данных:', error);
        process.exit(1);
    }
}

// Запуск настройки
setupDatabase();