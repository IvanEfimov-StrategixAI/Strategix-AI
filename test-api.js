// test-api.js
const axios = require('axios');

async function testAllAPIs() {
    console.log('🧪 Тестирование всех API эндпоинтов...\n');
    
    const baseURL = 'http://localhost:5000/api';
    
    // 1. Health check
    console.log('1. 📊 Проверка статуса...');
    try {
        const health = await axios.get(`${baseURL}/health`);
        console.log(`✅ Health: ${health.data.message}`);
    } catch (error) {
        console.log(`❌ Health error: ${error.message}`);
    }
    
    // 2. Тест GigaChat
    console.log('\n2. 🤖 Тест GigaChat...');
    try {
        const gigaTest = await axios.get(`${baseURL}/test-gigachat-simple`);
        console.log(`✅ GigaChat: ${gigaTest.data.response.substring(0, 100)}...`);
    } catch (error) {
        console.log(`❌ GigaChat error: ${error.message}`);
    }
    
    // 3. Вход в систему
    console.log('\n3. 🔐 Тест аутентификации...');
    try {
        const login = await axios.post(`${baseURL}/auth/login`, {
            email: 'test@strategix.ai',
            password: 'password123'
        });
        console.log(`✅ Login успешен! Токен получен`);
        const token = login.data.token;
        
        // 4. Тест AI Chat с токеном
        console.log('\n4. 💬 Тест AI Chat...');
        const chat = await axios.post(`${baseURL}/ai-chat/expert`, {
            message: 'Привет, протестируй работу системы',
            mode: 'consultant',
            business_type: 'saas'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ AI Chat работает!`);
        console.log(`📝 Ответ: ${chat.data.response.substring(0, 150)}...`);
        
    } catch (error) {
        console.log(`❌ Auth error: ${error.message}`);
    }
    
    console.log('\n🎉 Тестирование завершено!');
}

testAllAPIs();