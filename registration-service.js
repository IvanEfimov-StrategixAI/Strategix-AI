// registration-service.js
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class RegistrationService {
    constructor() {
        this.supabaseUrl = process.env.SUPABASE_URL;
        this.supabaseKey = process.env.SUPABASE_ANON_KEY;
        this.supabase = createClient(this.supabaseUrl, this.supabaseKey, {
            auth: { persistSession: false }
        });
    }
    
    async registerUserDirect(userData) {
        try {
            console.log(`🛠 DIRECT регистрация: ${userData.email}`);
            
            const userId = uuidv4();
            const { email, password, name } = userData;
            
            // Хешируем пароль
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);
            
            const { data, error } = await this.supabase
                .from('users')
                .insert([{
                    id: userId,
                    email: email.toLowerCase().trim(),
                    name: name.trim(),
                    password_hash: passwordHash,
                    is_verified: false,
                    is_admin: false,
                    subscription: 'free',
                    email_verification_token: uuidv4(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();
            
            if (error) {
                console.error('❌ Ошибка Supabase:', error);
                
                if (error.code === '23505') {
                    throw new Error('User already registered');
                }
                throw error;
            }
            
            // Создаем настройки
            await this.supabase
                .from('user_settings')
                .insert([{
                    user_id: userId,
                    preferences: {
                        language: 'ru',
                        theme: 'light',
                        notifications: true
                    }
                }]);
            
            console.log(`✅ DIRECT пользователь создан: ${email}`);
            
            return {
                id: userId,
                email: email,
                name: name,
                is_verified: false,
                subscription: 'free'
            };
            
        } catch (error) {
            console.error('❌ DIRECT ошибка:', error);
            throw error;
        }
    }
}

module.exports = new RegistrationService();