const fs = require('fs');
const path = require('path');

console.log('🔧 Исправление ошибок в InvestorPrepExpert...');

const filePath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(filePath, 'utf8');

// Создаем резервную копию
const backupPath = path.join(__dirname, 'server.js.backup_' + Date.now());
fs.writeFileSync(backupPath, content);
console.log('📁 Создана резервная копия:', backupPath);

// 1. Удаляем дубликат метода detectBusinessType на строке 1500
console.log('1️⃣  Удаляю дубликат detectBusinessType...');
const lines = content.split('\n');

// Находим начало метода detectBusinessType (строка 1500)
let startLine = -1;
let endLine = -1;
let braceCount = 0;
let inMethod = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;
    
    if (lineNumber === 1500 && line.includes('detectBusinessType(description) {')) {
        startLine = i;
        inMethod = true;
        braceCount = 1;
    } else if (inMethod) {
        if (line.includes('{')) braceCount++;
        if (line.includes('}')) braceCount--;
        
        if (braceCount === 0) {
            endLine = i;
            break;
        }
    }
}

if (startLine !== -1 && endLine !== -1) {
    // Удаляем метод с 1500 по endLine
    lines.splice(startLine, endLine - startLine + 1);
    console.log(`✅ Удален метод detectBusinessType (строки ${startLine+1}-${endLine+1})`);
}

// 2. Ищем и удаляем лишний текст после getSaaSEarlyStageTemplate()
console.log('2️⃣  Ищу и удаляю лишний текст после getSaaSEarlyStageTemplate()...');
content = lines.join('\n');

// Находим позицию после getSaaSEarlyStageTemplate()
const templateEndPos = content.indexOf('}classic_10:');
if (templateEndPos !== -1) {
    // Находим где заканчивается метод getSaaSEarlyStageTemplate
    const beforeTemplate = content.substring(0, templateEndPos);
    const lastBracePos = beforeTemplate.lastIndexOf('}');
    
    if (lastBracePos !== -1) {
        // Находим начало следующего неправильного блока
        const nextLineStart = content.indexOf('\n', templateEndPos);
        
        // Показываем проблемную область
        console.log('⚠️  Найден проблемный блок:');
        console.log(content.substring(templateEndPos - 50, templateEndPos + 200));
        
        // Удаляем от } до начала следующего валидного метода
        // Найдем где начинается следующий метод generateInvestorPrep
        const nextMethodPos = content.indexOf('async generateInvestorPrep', templateEndPos);
        
        if (nextMethodPos !== -1) {
            // Удаляем все от } до начала следующего метода
            content = content.substring(0, lastBracePos + 1) + '\n' + content.substring(nextMethodPos);
            console.log('✅ Удален лишний текст между методами');
        }
    }
}

// 3. Проверяем и исправляем лишние кавычки в JWT_SECRET
console.log('3️⃣  Проверяю ошибку с JWT_SECRET...');
content = content.replace(/'JWT_SECRET'''/g, "'JWT_SECRET'");

// 4. Сохраняем исправленный файл
const fixedPath = path.join(__dirname, 'server_fixed.js');
fs.writeFileSync(fixedPath, content);
console.log('✅ Исправленный файл сохранен как:', fixedPath);

console.log('\n📋 Резюме исправлений:');
console.log('1. ✅ Удален дубликат detectBusinessType');
console.log('2. ✅ Удален лишний текст после getSaaSEarlyStageTemplate');
console.log('3. ✅ Исправлены лишние кавычки в JWT_SECRET');
console.log('\n🚀 Запустите исправленный файл:');
console.log('   node server_fixed.js');