// fix-final.js
const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'server.js');

// Читаем файл
let content = fs.readFileSync(serverFile, 'utf8');

// Удаляем дублирующиеся секции
// Ищем строку с комментарием "ГЛАВНАЯ СТРАНИЦА" во второй раз
const lines = content.split('\n');
let firstMainPage = -1;
let secondMainPage = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('ГЛАВНАЯ СТРАНИЦА') || lines[i].includes('Главная страница')) {
        if (firstMainPage === -1) {
            firstMainPage = i;
        } else if (secondMainPage === -1) {
            secondMainPage = i;
            break;
        }
    }
}

console.log(`Первая главная страница на строке: ${firstMainPage + 1}`);
console.log(`Вторая главная страница на строке: ${secondMainPage + 1}`);

if (secondMainPage !== -1) {
    // Удаляем дубликат главной страницы и второй app.listen
    // Сохраняем все до второй главной страницы
    const newContent = lines.slice(0, secondMainPage).join('\n').trim();
    
    // Добавляем правильный конец
    const fixedContent = newContent + '\n\n' + 
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
    console.log('✅ Удален дубликат главной страницы');
} else {
    // Если не нашли дубликат, просто убедимся что файл заканчивается правильно
    content = content.trim();
    
    // Проверяем, что заканчивается на module.exports
    if (!content.endsWith('module.exports = app;')) {
        // Удаляем все после последнего module.exports
        const lastExport = content.lastIndexOf('module.exports = app;');
        if (lastExport !== -1) {
            content = content.substring(0, lastExport + 'module.exports = app;'.length);
        } else {
            // Добавляем правильный конец
            content += '\n\nmodule.exports = app;';
        }
    }
    
    fs.writeFileSync(serverFile, content, 'utf8');
    console.log('✅ Файл исправлен');
}