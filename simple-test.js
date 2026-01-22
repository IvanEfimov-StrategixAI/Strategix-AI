// simple-test.js
const http = require('http');

console.log('🧪 Простой тест доступности сервера...\n');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET',
    timeout: 3000
};

const req = http.request(options, (res) => {
    console.log(`✅ Сервер отвечает! Статус: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('\n📊 Ответ сервера:');
            console.log(`   Платформа: ${json.platform}`);
            console.log(`   Статус: ${json.status}`);
            console.log(`   Порт: ${json.port}`);
            console.log(`   Время: ${json.timestamp}`);
            
            console.log('\n🎉 ВСЕ РАБОТАЕТ!');
            console.log('\n🌐 Откройте в браузере:');
            console.log('   http://localhost:5000 - Веб-интерфейс');
            console.log('   http://localhost:5000/api/health - API статус');
            console.log('\n🔐 Тестовые данные:');
            console.log('   Email: test@strategix.ai');
            console.log('   Password: password123');
        } catch (e) {
            console.log('   Ответ (текст):', data);
        }
    });
});

req.on('error', (error) => {
    console.log(`❌ Ошибка подключения: ${error.message}`);
    console.log('\n🔧 Проверьте:');
    console.log('   1. Сервер запущен? (команда: node start-now.js)');
    console.log('   2. Порт 5000 свободен?');
    console.log('   3. Нет блокировки брандмауэром');
});

req.on('timeout', () => {
    console.log('❌ Таймаут подключения');
    req.destroy();
});

req.end();