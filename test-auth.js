const axios = require('axios');

async function testAuth() {
    console.log('🧪 Тестирование аутентификации...\n');
    
    const BASE_URL = 'http://localhost:5000';
    
    try {
        // 1. Регистрация
        console.log('1. 📝 Тест регистрации...');
        const registerData = {
            email: `test${Date.now()}@example.com`,
            password: 'password123',
            name: 'Тестовый Пользователь'
        };
        
        const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, registerData);
        console.log('✅ Регистрация успешна:', registerResponse.data);
        
        // 2. Вход
        console.log('\n2. 🔐 Тест входа...');
        const loginData = {
            email: 'test@strategix.ai',
            password: 'password123'
        };
        
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, loginData);
        console.log('✅ Вход успешен:', loginResponse.data.user.email);
        
        const token = loginResponse.data.token;
        
        // 3. Проверка профиля
        console.log('\n3. 👤 Тест получения профиля...');
        const profileResponse = await axios.get(`${BASE_URL}/api/user/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Профиль получен:', profileResponse.data.user.name);
        
        // 4. Сохранение чата
        console.log('\n4. 💾 Тест сохранения чата...');
        const chatData = {
            session_id: 'test-session-123',
            messages: [
                { role: 'user', content: 'Привет!', timestamp: new Date().toISOString() },
                { role: 'assistant', content: 'Здравствуйте! Как могу помочь?', timestamp: new Date().toISOString() }
            ]
        };
        
        const chatResponse = await axios.post(`${BASE_URL}/api/chat/save`, chatData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Чат сохранен:', chatResponse.data.message);
        
        console.log('\n🎉 Все тесты пройдены успешно!');
        
    } catch (error) {
        console.error('❌ Ошибка тестирования:', error.response?.data || error.message);
    }
}

testAuth();