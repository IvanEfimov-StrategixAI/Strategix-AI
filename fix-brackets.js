// fix-brackets.js
const fs = require('fs');
const path = require('path');

function fixBrackets(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    let lines = content.split('\n');
    let braceCount = 0;
    let inString = false;
    let inTemplate = false;
    let stringChar = '';
    let inComment = false;
    
    console.log('🔍 Начинаем анализ файла...');
    
    // Сначала пройдемся и посчитаем реальный баланс скобок
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let charIndex = 0;
        
        while (charIndex < line.length) {
            const char = line[charIndex];
            const nextChar = charIndex + 1 < line.length ? line[charIndex + 1] : '';
            
            // Обработка комментариев
            if (!inString && !inTemplate) {
                if (char === '/' && nextChar === '/') {
                    break; // Строковый комментарий
                }
                if (char === '/' && nextChar === '*') {
                    inComment = true;
                    charIndex += 2;
                    continue;
                }
                if (inComment && char === '*' && nextChar === '/') {
                    inComment = false;
                    charIndex += 2;
                    continue;
                }
                if (inComment) {
                    charIndex++;
                    continue;
                }
            }
            
            // Обработка строк
            if (char === '\\') {
                charIndex += 2; // Пропускаем escape символ
                continue;
            }
            
            if (char === '"' || char === "'" || char === '`') {
                if (!inString && !inTemplate) {
                    inString = true;
                    stringChar = char;
                    if (char === '`') inTemplate = true;
                } else if ((inString && char === stringChar) || (inTemplate && char === '`')) {
                    inString = false;
                    inTemplate = false;
                    stringChar = '';
                }
            }
            
            // Считаем скобки только вне строк
            if (!inString && !inTemplate && !inComment) {
                if (char === '{') braceCount++;
                if (char === '}') braceCount--;
            }
            
            charIndex++;
        }
        
        // Отладочный вывод для проблемных строк
        if (i >= 157 && i <= 180) {
            console.log(`Строка ${i+1}: ${braceCount} | ${line.substring(0, 60)}...`);
        }
    }
    
    console.log(`📊 Итоговый баланс скобок: ${braceCount}`);
    
    if (braceCount === 0) {
        console.log('✅ Скобки сбалансированы!');
        return;
    }
    
    // Если скобок больше, найдем и исправим конкретные проблемные места
    console.log('\n🔧 Исправляем проблемные места...');
    
    // Список проблемных строк из отчета
    const problematicLines = [
        { line: 158, type: 'axios', expected: 6 }, // Блок testResponse
        { line: 448, type: 'axios', expected: 6 }, // Блок altResponse
        { line: 709, type: 'if', expected: 7 }, // Блок parseValue
        { line: 1405, type: 'object', expected: 7 }, // validation object
        { line: 1754, type: 'object', expected: 6 }, // userSessions
        { line: 2489, type: 'if-else', expected: 9 }, // JSON parsing
        { line: 2835, type: 'object', expected: 12 }, // metrics objects
        { line: 3085, type: 'axios', expected: 6 } // ollama check
    ];
    
    let fixedCount = 0;
    
    // Исправляем каждую проблемную зону
    problematicLines.forEach(problem => {
        const lineIndex = problem.line - 1;
        if (lineIndex < 0 || lineIndex >= lines.length) return;
        
        console.log(`\nПроверяем строку ${problem.line}: ${lines[lineIndex].substring(0, 60)}...`);
        
        // Для axios блоков проверяем закрывающие скобки
        if (problem.type === 'axios') {
            let startLine = lineIndex;
            let endLine = Math.min(lineIndex + 20, lines.length - 1);
            
            // Находим начало блока
            while (startLine > 0 && !lines[startLine].includes('axios({')) {
                startLine--;
            }
            
            if (startLine < 0) {
                console.log(`❌ Не найден axios блок на строке ${problem.line}`);
                return;
            }
            
            // Проверяем закрытие блока
            let braces = 0;
            for (let i = startLine; i <= endLine; i++) {
                const line = lines[i];
                braces += (line.match(/{/g) || []).length;
                braces -= (line.match(/}/g) || []).length;
                
                // Ищем закрывающую скобку с запятой после нее
                if (braces === 0 && i > startLine && line.includes('})') || line.includes('},') || line.includes('}))')) {
                    console.log(`✅ axios блок правильно закрыт на строке ${i+1}`);
                    return;
                }
            }
            
            // Если не нашли закрытие, добавляем
            console.log(`⚠️ Не найдено закрытие axios блока, добавляем...`);
            
            // Ищем последнюю строку с данными
            let lastDataLine = endLine;
            while (lastDataLine > startLine && lines[lastDataLine].trim() === '') {
                lastDataLine--;
            }
            
            // Добавляем закрывающую скобку если нужно
            if (!lines[lastDataLine].includes('})')) {
                lines[lastDataLine] = lines[lastDataLine].replace(/$/, ',');
                lines.splice(lastDataLine + 1, 0, '                })');
                fixedCount++;
                console.log(`✅ Добавлено закрытие axios блока`);
            }
        }
        
        // Для if блоков проверяем баланс
        else if (problem.type === 'if') {
            let startLine = lineIndex;
            let endLine = Math.min(lineIndex + 30, lines.length - 1);
            let braces = 0;
            let hasClosing = false;
            
            for (let i = startLine; i <= endLine; i++) {
                const line = lines[i];
                // Игнорируем скобки в строках
                const cleanLine = line.replace(/"[^"]*"/g, '""').replace(/'[^']*'/g, "''").replace(/`[^`]*`/g, '``');
                braces += (cleanLine.match(/{/g) || []).length;
                braces -= (cleanLine.match(/}/g) || []).length;
                
                if (braces === 0 && i > startLine) {
                    hasClosing = true;
                    break;
                }
            }
            
            if (!hasClosing && braces > 0) {
                console.log(`⚠️ Добавляем закрывающую скобку для if блока`);
                lines.splice(endLine + 1, 0, '            }');
                fixedCount++;
            }
        }
    });
    
    // Глобальная проверка и фикс
    if (braceCount > 0) {
        console.log(`\n➕ Добавляем ${braceCount} закрывающих скобок в конец файла...`);
        for (let i = 0; i < braceCount; i++) {
            lines.push('}');
        }
        fixedCount += braceCount;
    } else if (braceCount < 0) {
        console.log(`\n➖ Убираем ${-braceCount} лишних закрывающих скобок...`);
        // Более сложная логика для удаления лишних скобок
    }
    
    if (fixedCount > 0) {
        // Сохраняем исправленный файл
        const backupPath = filePath.replace('.js', '.backup.js');
        fs.writeFileSync(backupPath, content, 'utf8');
        console.log(`📁 Создан бэкап: ${backupPath}`);
        
        fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
        console.log(`✅ Исправлено ${fixedCount} проблем. Файл сохранен.`);
        
        // Проверяем исправления
        console.log('\n🔍 Проверяем исправления...');
        const newContent = fs.readFileSync(filePath, 'utf8');
        const newLines = newContent.split('\n');
        
        // Быстрая проверка проблемных строк
        problematicLines.forEach(problem => {
            const lineIndex = problem.line - 1;
            if (lineIndex < newLines.length) {
                console.log(`Строка ${problem.line}: ${newLines[lineIndex].substring(0, 60)}...`);
            }
        });
    } else {
        console.log('✅ Файл уже исправлен!');
    }
}

// Создаем простой валидатор для проверки
function createSimpleValidator() {
    const validator = `
// check-brackets-simple.js
const fs = require('fs');

function checkBrackets(content) {
    let braceCount = 0;
    let inString = false;
    let stringChar = '';
    let inComment = false;
    
    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const nextChar = i + 1 < content.length ? content[i + 1] : '';
        
        // Обработка комментариев
        if (!inString) {
            if (char === '/' && nextChar === '/') {
                // Пропускаем до конца строки
                while (i < content.length && content[i] !== '\\n') i++;
                continue;
            }
            if (char === '/' && nextChar === '*') {
                inComment = true;
                i++;
                continue;
            }
            if (inComment && char === '*' && nextChar === '/') {
                inComment = false;
                i++;
                continue;
            }
            if (inComment) continue;
        }
        
        // Обработка строк
        if (char === '\\\\' && inString) {
            i++; // Пропускаем escape символ
            continue;
        }
        
        if (char === '"' || char === "'" || char === '\`') {
            if (!inString) {
                inString = true;
                stringChar = char;
            } else if (char === stringChar) {
                inString = false;
            }
        }
        
        // Считаем скобки только вне строк
        if (!inString) {
            if (char === '{') braceCount++;
            if (char === '}') braceCount--;
        }
    }
    
    return braceCount;
}

const content = fs.readFileSync('server.js', 'utf8');
const balance = checkBrackets(content);
console.log(\`Баланс скобок: \${balance}\`);
console.log(\`Открывающих скобок \${balance > 0 ? 'больше на' : 'меньше на'}: \${Math.abs(balance)}\`);

if (balance === 0) {
    console.log('✅ Все скобки сбалансированы!');
    process.exit(0);
} else {
    console.log('❌ Найдены несбалансированные скобки!');
    process.exit(1);
}
`;
    
    fs.writeFileSync('check-brackets-simple.js', validator);
    console.log('\n📝 Создан простой валидатор: check-brackets-simple.js');
    console.log('Запустите: node check-brackets-simple.js');
}

// Основная функция
async function main() {
    const filePath = 'server.js';
    
    if (!fs.existsSync(filePath)) {
        console.error('❌ Файл server.js не найден!');
        process.exit(1);
    }
    
    console.log('🚀 Начинаем исправление файла server.js...\n');
    
    // Создаем бэкап
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `server-backup-${timestamp}.js`;
    fs.copyFileSync(filePath, backupFile);
    console.log(`📁 Создан бэкап: ${backupFile}`);
    
    // Запускаем исправление
    fixBrackets(filePath);
    
    // Создаем простой валидатор
    createSimpleValidator();
    
    console.log('\n🎯 Что дальше:');
    console.log('1. Запустите проверку: node check-brackets-simple.js');
    console.log('2. Если есть ошибки, проверьте конкретные проблемные блоки:');
    console.log('   - Строки 158-173: axios testResponse блок');
    console.log('   - Строки 448-463: axios altResponse блок');
    console.log('   - Строка 1405: validation object');
    console.log('3. Запустите сервер: npm start');
}

// Запускаем
main().catch(console.error);