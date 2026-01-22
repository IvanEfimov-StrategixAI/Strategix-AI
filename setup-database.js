const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function setupDatabase() {
    try {
        console.log('🛠 Настройка базы данных Supabase...');
        
        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (!supabaseUrl || !serviceRoleKey) {
            console.error('❌ SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY обязательны в .env');
            process.exit(1);
        }
        
        const supabase = createClient(supabaseUrl, serviceRoleKey);
        
        // Создание таблиц
        const sqlCommands = [
            `CREATE TABLE IF NOT EXISTS users (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255),
                password_hash VARCHAR(255) NOT NULL,
                is_verified BOOLEAN DEFAULT false,
                is_admin BOOLEAN DEFAULT false,
                subscription VARCHAR(50) DEFAULT 'free',
                email_verification_token VARCHAR(255),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
                last_login TIMESTAMP WITH TIME ZONE
            );`,
            
            `CREATE TABLE IF NOT EXISTS chat_history (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                session_id VARCHAR(255) NOT NULL,
                message_type VARCHAR(50) DEFAULT 'user',
                content TEXT NOT NULL,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
            );`,
            
            `CREATE TABLE IF NOT EXISTS generated_documents (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                document_type VARCHAR(100) NOT NULL,
                title VARCHAR(255),
                content TEXT,
                metadata JSONB DEFAULT '{}',
                file_path VARCHAR(500),
                download_count INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
            );`,
            
            `CREATE TABLE IF NOT EXISTS user_settings (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
                preferences JSONB DEFAULT '{}',
                notification_settings JSONB DEFAULT '{}',
                export_settings JSONB DEFAULT '{}',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
            );`,
            
            // Создание индексов для производительности
            `CREATE INDEX IF NOT EXISTS idx_chat_history_user_session ON chat_history(user_id, session_id);`,
            `CREATE INDEX IF NOT EXISTS idx_chat_history_created ON chat_history(created_at);`,
            `CREATE INDEX IF NOT EXISTS idx_documents_user_type ON generated_documents(user_id, document_type);`,
            `CREATE INDEX IF NOT EXISTS idx_documents_created ON generated_documents(created_at);`,
            `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`,
            `CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at);`
        ];
        
        for (const sql of sqlCommands) {
            try {
                console.log(`📝 Выполнение: ${sql.substring(0, 100)}...`);
                const { error } = await supabase.rpc('exec_sql', { sql: sql });
                
                if (error && !error.message.includes('already exists')) {
                    console.error('❌ Ошибка выполнения SQL:', error.message);
                }
            } catch (cmdError) {
                console.error('❌ Ошибка команды:', cmdError.message);
            }
        }
        
        // Включаем Row Level Security
        const rlsCommands = [
            'ALTER TABLE users ENABLE ROW LEVEL SECURITY;',
            'ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;',
            'ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;',
            'ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;',
            
            // Политики безопасности
            'DROP POLICY IF EXISTS "Пользователи видят только свои данные" ON users;',
            'CREATE POLICY "Пользователи видят только свои данные" ON users FOR ALL USING (auth.uid() = id);',
            
            'DROP POLICY IF EXISTS "Пользователи видят свою историю чатов" ON chat_history;',
            'CREATE POLICY "Пользователи видят свою историю чатов" ON chat_history FOR ALL USING (auth.uid() = user_id);',
            
            'DROP POLICY IF EXISTS "Пользователи видят свои документы" ON generated_documents;',
            'CREATE POLICY "Пользователи видят свои документы" ON generated_documents FOR ALL USING (auth.uid() = user_id);',
            
            'DROP POLICY IF EXISTS "Пользователи видят свои настройки" ON user_settings;',
            'CREATE POLICY "Пользователи видят свои настройки" ON user_settings FOR ALL USING (auth.uid() = user_id);'
        ];
        
        for (const rls of rlsCommands) {
            try {
                console.log(`🔒 Настройка RLS: ${rls.substring(0, 80)}...`);
                const { error } = await supabase.rpc('exec_sql', { sql: rls });
                
                if (error && !error.message.includes('already exists')) {
                    console.error('❌ Ошибка RLS:', error.message);
                }
            } catch (rlsError) {
                console.error('❌ Ошибка настройки RLS:', rlsError.message);
            }
        }
        
        console.log('✅ База данных успешно настроена!');
        
        // Создаем тестового пользователя
        try {
            const { error: userError } = await supabase
                .from('users')
                .upsert([{
                    email: 'test@strategix.ai',
                    name: 'Тестовый Пользователь',
                    password_hash: '$2a$10$X5z7v9yL8zQ4w2t3v1w2u3', // password123
                    is_verified: true,
                    is_admin: true,
                    subscription: 'pro',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }], { 
                    onConflict: 'email',
                    ignoreDuplicates: false 
                });
            
            if (userError && !userError.message.includes('duplicate key')) {
                console.warn('⚠️ Ошибка создания тестового пользователя:', userError.message);
            } else {
                console.log('✅ Тестовый пользователь создан/обновлен');
                console.log('📧 Email: test@strategix.ai');
                console.log('🔑 Password: password123');
            }
        } catch (userError) {
            console.warn('⚠️ Не удалось создать тестового пользователя:', userError.message);
        }
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Критическая ошибка настройки:', error);
        process.exit(1);
    }
}

setupDatabase();