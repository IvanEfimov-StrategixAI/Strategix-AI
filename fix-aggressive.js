// fix-aggressive.js
const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'server.js');

// Читаем файл
let content = fs.readFileSync(serverFile, 'utf8');

// Находим позицию где заканчивается обработчик 404
const appUseIndex = content.lastIndexOf('app.use(\'/api/*\'');
console.log(`Найден обработчик 404 на позиции: ${appUseIndex}`);

if (appUseIndex !== -1) {
    // Находим закрывающую скобку этого обработчика
    let braceCount = 0;
    let endIndex = -1;
    
    for (let i = appUseIndex; i < content.length; i++) {
        if (content[i] === '{') braceCount++;
        if (content[i] === '}') braceCount--;
        if (braceCount === 0) {
            endIndex = i + 1;
            break;
        }
    }
    
    if (endIndex !== -1) {
        // Сохраняем все до конца обработчика 404
        const cleanContent = content.substring(0, endIndex).trim();
        
        // Добавляем правильный конец
        const fixedContent = cleanContent + '\n\n' + 
`// ============================================
// ЗАПУСК СЕРВЕРА
// ============================================

// Главная страница
app.get('/', (req, res) => {
    res.send('🚀 Strategix AI Pro работает!');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(\`🚀 STRATEGIX AI PRO запущен на порту \${PORT}\`);
    console.log(\`📍 http://localhost:\${PORT}\`);
});

module.exports = app;`;

        fs.writeFileSync(serverFile, fixedContent, 'utf8');
        console.log('✅ Файл исправлен (агрессивный режим)');
    } else {
        console.log('❌ Не удалось найти закрывающую скобку');
    }
} else {
    console.log('❌ Не найден обработчик 404');
}