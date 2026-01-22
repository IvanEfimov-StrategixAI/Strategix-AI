const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'server.js');

// Читаем файл
let content = fs.readFileSync(serverFile, 'utf8');

// Находим последнюю строку с module.exports
const lines = content.split('\n');
let lastModuleExportsIndex = -1;

for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes('module.exports')) {
        lastModuleExportsIndex = i;
        break;
    }
}

// Если нашли, удаляем все после этой строки и добавляем правильный конец
if (lastModuleExportsIndex !== -1) {
    const newLines = lines.slice(0, lastModuleExportsIndex + 1);
    
    // Проверяем, есть ли module.exports в правильном месте
    if (!newLines[lastModuleExportsIndex].trim().endsWith(';')) {
        newLines[lastModuleExportsIndex] = 'module.exports = app;';
    }
    
    // Записываем обратно
    fs.writeFileSync(serverFile, newLines.join('\n'), 'utf8');
    console.log('✅ Файл исправлен');
} else {
    // Если не нашли, добавляем правильный конец
    content = content.trim();
    
    // Удаляем возможные незакрытые скобки в конце
    content = content.replace(/\{+$/, '');
    content = content.replace(/\(+$/, '');
    
    // Добавляем правильный конец
    content += '\n\n// ============================================\n';
    content += '// ЗАПУСК СЕРВЕРА\n';
    content += '// ============================================\n\n';
    content += '// Главная страница\n';
    content += 'app.get(\'/\', (req, res) => {\n';
    content += '    res.send(\'🚀 Strategix AI Pro работает!\');\n';
    content += '});\n\n';
    content += 'app.listen(PORT, \'0.0.0.0\', () => {\n';
    content += '    console.log(`🚀 STRATEGIX AI PRO запущен на порту ${PORT}`);\n';
    content += '    console.log(`📍 http://localhost:${PORT}`);\n';
    content += '});\n\n';
    content += 'module.exports = app;';
    
    fs.writeFileSync(serverFile, content, 'utf8');
    console.log('✅ Файл исправлен с добавлением недостающих частей');
}