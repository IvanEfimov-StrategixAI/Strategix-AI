const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seedDatabase() {
    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            console.error('❌ SUPABASE_URL и SUPABASE_ANON_KEY обязательны');
            process.exit(1);
        }
        
        console.log('🌱 Заполнение базы тестовыми данными...');
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Тестовый пользователь
        const testPassword = 'password123';
        const hashedPassword = await bcrypt.hash(testPassword, 10);
        
        const testUser = {
            email: 'test@strategix.ai',
            name: 'Тестовый Пользователь',
            password_hash: hashedPassword,
            is_admin: true,
            is_verified: true,
            subscription: 'pro'
        };
        
        // Проверяем существование пользователя
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', testUser.email)
            .single();
        
        if (!existingUser) {
            const { data: user, error: userError } = await supabase
                .from('users')
                .insert(testUser)
                .select()
                .single();
            
            if (userError) {
                console.error('❌ Ошибка создания пользователя:', userError);
            } else {
                console.log('✅ Тестовый пользователь создан:');
                console.log(`   Email: ${testUser.email}`);
                console.log(`   Password: ${testPassword}`);
                console.log(`   ID: ${user.id}`);
            }
        } else {
            console.log('✅ Тестовый пользователь уже существует');
        }
        
        // Пример документа
        const sampleDocument = {
            user_id: existingUser?.id,
            title: 'Пример бизнес-плана',
            type: 'business_plan',
            subtype: 'standard',
            content: 'Это пример бизнес-плана, созданный системой...',
            validation_data: {
                confidence_score: 85,
                verified: true,
                issues: []
            }
        };
        
        const { data: doc, error: docError } = await supabase
            .from('documents')
            .insert(sampleDocument)
            .select();
        
        if (docError) {
            console.log('⚠️  Не удалось создать пример документа:', docError.message);
        } else {
            console.log('✅ Пример документа создан');
        }
        
        console.log('\n🎉 Заполнение базы завершено!');
        console.log('\n🔐 Тестовые учетные данные:');
        console.log('   Email: test@strategix.ai');
        console.log('   Password: password123');
        
    } catch (error) {
        console.error('❌ Ошибка заполнения базы:', error);
    }
}

seedDatabase();