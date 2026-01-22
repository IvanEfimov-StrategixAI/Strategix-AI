// test-supabase-new.js
const { createClient } = require('@supabase/supabase-js');

async function testNewSupabase() {
    // Новые ключи из вашего Supabase
    const supabaseUrl = 'https://rbriucldokcqufagvvcn.supabase.co';
    const supabaseKey = 'sb_publishable_ybReXOAcputCQVxlophprA_59KEq7r_';
    
    console.log('🔗 Тестирование новых Supabase ключей...');
    console.log('URL:', supabaseUrl);
    console.log('New Key:', supabaseKey);
    
    try {
        const supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false
            },
            global: {
                headers: {
                    'apikey': supabaseKey
                }
            }
        });
        
        // Тест подключения - простой запрос
        const { data, error } = await supabase
            .from('_test')
            .select('*')
            .limit(1);
        
        if (error) {
            console.log('❌ Ошибка:', error.message);
            
            // Если таблицы нет, это нормально - значит подключение работает
            if (error.message.includes('relation "_test" does not exist')) {
                console.log('✅ Supabase подключен! (ошибка таблицы - ожидаемо)');
                
                // Попробуем получить информацию о проекте
                const { data: projectInfo, error: projectError } = await supabase
                    .rpc('get_project_info');
                
                if (projectError) {
                    console.log('ℹ️  RPC ошибка (нормально):', projectError.message);
                }
                
                return true;
            }
        } else {
            console.log('✅ Supabase подключен успешно!');
            return true;
        }
    } catch (error) {
        console.log('❌ Ошибка подключения:', error.message);
        return false;
    }
}

testNewSupabase();