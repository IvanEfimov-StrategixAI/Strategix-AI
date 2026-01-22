// setup-tables.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function setupTables() {
    console.log('🛠 Настройка таблиц Supabase...\n');
    
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
        console.error('❌ Требуются SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY');
        process.exit(1);
    }
    
    // Используем service role для обхода RLS
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { persistSession: false }
    });
    
    try {
        // 1. Создаем таблицу users если не существует
        console.log('1. 📋 Создаю таблицу users...');
        const { error: usersError } = await supabase.rpc('exec_sql', {
            sql: `
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255),
                password_hash TEXT NOT NULL,
                is_verified BOOLEAN DEFAULT FALSE,
                is_admin BOOLEAN DEFAULT FALSE,
                subscription VARCHAR(50) DEFAULT 'free',
                email_verification_token VARCHAR(255),
                last_login TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            `
        });
        
        if (usersError && !usersError.message.includes('already exists')) {
            console.log('⚠️  Ошибка создания users:', usersError.message);
        } else {
            console.log('✅ Таблица users готова');
        }
        
        // 2. Создаем тестового пользователя
        console.log('\n2. 👤 Создаю тестового пользователя...');
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('password123', salt);
        
        const { error: insertError } = await supabase
            .from('users')
            .upsert([{
                id: 'test-user-id-123456',
                email: 'test@strategix.ai',
                name: 'Тестовый Пользователь',
                password_hash: passwordHash,
                is_verified: true,
                is_admin: true,
                subscription: 'pro',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }], { 
                onConflict: 'email',
                ignoreDuplicates: false 
            });
        
        if (insertError) {
            console.log('❌ Ошибка создания пользователя:', insertError.message);
            
            // Пробуем другой подход
            const { error: directError } = await supabase
                .from('users')
                .insert({
                    email: 'test@strategix.ai',
                    name: 'Тестовый Пользователь',
                    password_hash: passwordHash,
                    is_verified: true,
                    is_admin: true,
                    subscription: 'pro'
                });
            
            if (directError) {
                console.log('⚠️  Ошибка прямого вставления:', directError.message);
            } else {
                console.log('✅ Тестовый пользователь создан');
            }
        } else {
            console.log('✅ Тестовый пользователь создан/обновлен');
        }
        
        // 3. Проверяем что пользователь существует
        console.log('\n3. 🔍 Проверяю созданного пользователя...');
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('email', 'test@strategix.ai')
            .single();
        
        if (fetchError) {
            console.log('❌ Ошибка проверки:', fetchError.message);
        } else {
            console.log('✅ Пользователь найден:');
            console.log(`   Email: ${user.email}`);
            console.log(`   Имя: ${user.name}`);
            console.log(`   Подписка: ${user.subscription}`);
            console.log(`   Админ: ${user.is_admin ? 'Да' : 'Нет'}`);
        }
        
        console.log('\n🎉 Настройка завершена!');
        console.log('\n🔐 Тестовые данные:');
        console.log('   Email: test@strategix.ai');
        console.log('   Password: password123');
        
    } catch (error) {
        console.error('❌ Критическая ошибка:', error);
    }
}

setupTables();