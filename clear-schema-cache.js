const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function clearSchemaCache() {
    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (!supabaseUrl || !serviceRoleKey) {
            console.error('❌ SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY обязательны');
            return;
        }
        
        const supabase = createClient(supabaseUrl, serviceRoleKey);
        
        // Переименуем старую таблицу если существует
        const queries = [
            `ALTER TABLE IF EXISTS users RENAME TO users_old;`,
            `ALTER TABLE IF EXISTS user_settings RENAME TO user_settings_old;`,
            `ALTER TABLE IF EXISTS chat_history RENAME TO chat_history_old;`,
            `ALTER TABLE IF EXISTS generated_documents RENAME TO generated_documents_old;`
        ];
        
        for (const sql of queries) {
            try {
                const { error } = await supabase.rpc('exec_sql', { sql });
                if (error && !error.message.includes('does not exist')) {
                    console.error('Ошибка:', error.message);
                } else {
                    console.log('✅ Успешно:', sql.split(' ')[2]);
                }
            } catch (e) {
                console.log('SQL не выполнен:', e.message);
            }
        }
        
        console.log('🎉 Кеш схемы очищен! Перезапустите сервер.');
        
    } catch (error) {
        console.error('❌ Ошибка очистки кеша:', error);
    }
}

clearSchemaCache();