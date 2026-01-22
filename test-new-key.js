// test-new-key.js
require('dotenv').config();
const axios = require('axios');

async function testNewKey() {
  console.log('🔍 Тестирование НОВОГО ключа GigaChat...\n');
  
  const apiKey = process.env.GIGACHAT_API_KEY;
  
  // Проверяем формат
  try {
    const decoded = Buffer.from(apiKey, 'base64').toString('utf-8');
    console.log('✅ Ключ декодирован:');
    console.log('   Client ID:', decoded.split(':')[0]);
    console.log('   Client Secret:', decoded.split(':')[1]);
  } catch (e) {
    console.error('❌ Ошибка декодирования:', e.message);
    return;
  }
  
  // Получаем токен
  console.log('\n🔄 Получение Access Token...');
  try {
    const response = await axios.post(
      'https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
      new URLSearchParams({ scope: 'GIGACHAT_API_PERS' }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'RqUID': 'test-' + Date.now(),
          'Authorization': `Basic ${apiKey}`
        },
        // Важно для самоподписанных сертификатов Сбера
        httpsAgent: new (require('https').Agent)({ 
          rejectUnauthorized: false 
        }),
        timeout: 10000
      }
    );
    
    console.log('✅ Токен получен! Статус:', response.status);
    console.log('📅 Истекает:', new Date(response.data.expires_at).toLocaleString());
    console.log('🔑 Токен (первые 50 симв.):', response.data.access_token.substring(0, 50) + '...');
    
    return response.data.access_token;
    
  } catch (error) {
    console.error('❌ Ошибка при получении токена:');
    console.error('   Код:', error.response?.status);
    console.error('   Сообщение:', error.response?.data || error.message);
    return null;
  }
}

testNewKey();