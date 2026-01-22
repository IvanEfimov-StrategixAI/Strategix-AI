// fix-specific-problems.js
const fs = require('fs');

function fixSpecificProblems() {
    let content = fs.readFileSync('server.js', 'utf8');
    let lines = content.split('\n');
    
    console.log('🔧 Исправляем конкретные проблемные блоки...');
    
    // 1. Исправляем блок testResponse (строки 158-173)
    console.log('\n1. Исправляем testResponse блок...');
    for (let i = 157; i <= 172; i++) {
        if (i < lines.length) {
            // Ищем строку с timeout и добавляем закрывающую скобку
            if (lines[i].includes('timeout: 10000')) {
                if (!lines[i].includes('})') && !lines[i].includes('},')) {
                    lines[i] = lines[i].trim();
                    if (!lines[i].endsWith(',')) lines[i] += ',';
                    lines[i] += ' // Timeout в миллисекундах';
                    // Добавляем закрывающую скобку на следующей строке
                    if (i + 1 < lines.length && !lines[i + 1].includes('})')) {
                        lines.splice(i + 1, 0, '                });');
                    }
                }
                break;
            }
        }
    }
    
    // 2. Исправляем блок altResponse (строки 448-463)
    console.log('2. Исправляем altResponse блок...');
    for (let i = 447; i <= 462; i++) {
        if (i < lines.length) {
            if (lines[i].includes('timeout: 30000')) {
                if (!lines[i].includes('})') && !lines[i].includes('},')) {
                    lines[i] = lines[i].trim();
                    if (!lines[i].endsWith(',')) lines[i] += ',';
                    // Добавляем закрывающую скобку
                    if (i + 1 < lines.length && !lines[i + 1].includes('})')) {
                        lines.splice(i + 1, 0, '                });');
                    }
                }
                break;
            }
        }
    }
    
    // 3. Исправляем блок parseValue (строки 709-731)
    console.log('3. Исправляем parseValue блок...');
    let parseValueEnd = 730;
    for (let i = 708; i <= parseValueEnd; i++) {
        if (i < lines.length && lines[i].includes('return !isNaN(num) ? num : null;')) {
            // Проверяем баланс фигурных скобок в этом блоке
            let start = 708;
            let braces = 0;
            for (let j = start; j <= i; j++) {
                const line = lines[j];
                braces += (line.match(/{/g) || []).length;
                braces -= (line.match(/}/g) || []).length;
            }
            
            if (braces > 0) {
                console.log(`   Добавляем ${braces} закрывающих скобок...`);
                for (let k = 0; k < braces; k++) {
                    lines.splice(i + 1 + k, 0, '                    }');
                }
            }
            break;
        }
    }
    
    // 4. Исправляем validation object (строка 1405)
    console.log('4. Исправляем validation object...');
    for (let i = 1404; i <= 1416; i++) {
        if (i < lines.length && lines[i].includes('recommendations: [')) {
            // Ищем конец объекта
            let braces = 0;
            let foundEnd = false;
            for (let j = i; j < Math.min(i + 20, lines.length); j++) {
                braces += (lines[j].match(/{/g) || []).length;
                braces -= (lines[j].match(/}/g) || []).length;
                
                if (braces === 0 && j > i) {
                    foundEnd = true;
                    // Проверяем, есть ли закрывающая скобка
                    if (!lines[j].includes('}') && !lines[j + 1]?.includes('}')) {
                        lines.splice(j + 1, 0, '                }');
                    }
                    break;
                }
            }
            
            if (!foundEnd) {
                // Добавляем закрывающую скобку через 5 строк
                lines.splice(i + 5, 0, '                }');
            }
            break;
        }
    }
    
    // Сохраняем исправления
    fs.writeFileSync('server-fixed.js', lines.join('\n'), 'utf8');
    console.log('\n✅ Создан исправленный файл: server-fixed.js');
    
    // Проверяем баланс в исправленном файле
    const fixedContent = lines.join('\n');
    let braceCount = 0;
    let inString = false;
    let stringChar = '';
    
    for (let i = 0; i < fixedContent.length; i++) {
        const char = fixedContent[i];
        
        if (char === '\\' && inString) {
            i++;
            continue;
        }
        
        if (char === '"' || char === "'" || char === '`') {
            if (!inString) {
                inString = true;
                stringChar = char;
            } else if (char === stringChar) {
                inString = false;
            }
        }
        
        if (!inString) {
            if (char === '{') braceCount++;
            if (char === '}') braceCount--;
        }
    }
    
    console.log(`📊 Баланс скобок в исправленном файле: ${braceCount}`);
    
    if (braceCount === 0) {
        console.log('🎉 Все скобки сбалансированы!');
        console.log('\n📋 Дальнейшие действия:');
        console.log('1. Проверьте работу: node check-brackets.js server-fixed.js');
        console.log('2. Замените оригинальный файл: copy server-fixed.js server.js');
        console.log('3. Запустите сервер: npm start');
    } else {
        console.log(`❌ Осталось несбалансированных скобок: ${braceCount}`);
        console.log('\n⚠️ Ручная проверка нужна в следующих блоках:');
        console.log('   - Метрики (строки 2835-2924)');
        console.log('   - JSON парсинг (строки 2489-2507)');
        console.log('   - Ollama проверки (строки 3085-3102)');
    }
}

// Запускаем исправление
fixSpecificProblems();