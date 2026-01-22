// fix-supabase.js
const { createClient } = require('@supabase/supabase-js');

async function setupSupabase() {
    console.log('🔧 Настройка Supabase для новых ключей...\n');
    
    const SUPABASE_URL = 'https://rbriucldokcqufagvvcn.supabase.co';
    
    // Пробуем разные форматы ключей
    const testKeys = [
        {
            name: 'NEW Publishable Key',
            key: 'sb_publishable_ybReXOAcputCQVxlophprA_59KEq7r_',
            type: 'new'
        },
        {
            name: 'NEW Secret Key',
            key: 'sb_secret_OTPytlBCdTijugYkDSVcbg_rsTOMJTE',
            type: 'new'
        },
        {
            name: 'OLD Format (legacy)',
            key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJicml1Y2xkb2tjcXVmYWd2dmNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYwNjAxODYsImV4cCI6MjA1MTYzNjE4Nn0.z5jXBSx9i-XyClVr8LdazV8M_8-nOHW8QLE4VnphqPU',
            type: 'old'
        }
    ];
    
    for (const testKey of testKeys) {
        console.log(`\n🧪 Тестирую: ${testKey.name}`);
        console.log(`Key: ${testKey.key.substring(0, 30)}...`);
        
        try {
            const options = {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false
                }
            };
            
            // Для новых ключей добавляем специальные заголовки
            if (testKey.type === 'new') {
                options.global = {
                    headers: {
                        'apikey': testKey.key,
                        'Authorization': `Bearer ${testKey.key}`
                    }
                };
            }
            
            const supabase = createClient(SUPABASE_URL, testKey.key, options);
            
            // Простой тест - попробуем получить информацию
            const { data, error } = await supabase.auth.getSession();
            
            if (error) {
                console.log(`❌ Ошибка аутентификации: ${error.message}`);
                
                // Попробуем другой запрос
                const { data: healthData, error: healthError } = await supabase
                    .from('users')
                    .select('count')
                    .limit(1);
                
                if (healthError) {
                    console.log(`❌ Ошибка таблицы: ${healthError.message}`);
                    console.log(`ℹ️  Это может быть нормально, если таблицы не созданы`);
                } else {
                    console.log(`✅ Подключение работает!`);
                    console.log(`📊 Данные:`, healthData);
                    return { success: true, key: testKey };
                }
            } else {
                console.log(`✅ Подключение успешно!`);
                console.log(`📊 Сессия:`, data);
                return { success: true, key: testKey };
            }
            
        } catch (error) {
            console.log(`❌ Ошибка подключения: ${error.message}`);
        }
    }
    
    console.log('\n⚠️  Ни один ключ не сработал');
    console.log('\n📋 Возможные причины:');
    console.log('1. Data API не включен в настройках проекта');
    console.log('2. Неправильный формат ключа');
    console.log('3. Ограничения CORS');
    console.log('\n🔧 Решение:');
    console.log('1. Зайдите в Project Settings > API');
    console.log('2. Включите "Enable Data API"');
    console.log('3. Проверьте "Exposed schemas" (должны быть public, extensions)');
    
    return { success: false };
}

setupSupabase();