const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function migrate() {
    try {
        console.log('🔄 Запуск миграции...');
        
        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (!supabaseUrl || !serviceRoleKey) {
            console.error('❌ SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY обязательны');
            process.exit(1);
        }
        
        const supabase = createClient(supabaseUrl, serviceRoleKey);
        
        // Добавляем поле verification_token в таблицу users
        console.log('📝 Добавление поля verification_token...');
        
        const { error: alterError } = await supabase.rpc('exec_sql', {
            sql: `
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255),
                ADD COLUMN IF NOT EXISTS verification_expires TIMESTAMP WITH TIME ZONE;
            `
        });
        
        if (alterError && !alterError.message.includes('already exists')) {
            console.error('❌ Ошибка добавления полей:', alterError);
        } else {
            console.log('✅ Поля успешно добавлены');
        }
        
        console.log('✅ Миграция завершена');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Ошибка миграции:', error);
        process.exit(1);
    }
}

migrate();