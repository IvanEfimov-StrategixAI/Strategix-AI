// fix-exact.js
const fs = require('fs');
const readline = require('readline');

async function fixExact() {
    const content = fs.readFileSync('server.js', 'utf8');
    const lines = content.split('\n');
    
    console.log('🔍 Анализируем проблемные места...');
    
    // Создаем карту скобок по строкам
    const braceMap = [];
    let inString = false;
    let stringChar = '';
    let inComment = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let open = 0;
        let close = 0;
        let charIndex = 0;
        
        while (charIndex < line.length) {
            const char = line[charIndex];
            const nextChar = charIndex + 1 < line.length ? line[charIndex + 1] : '';
            
            // Обработка комментариев
            if (!inString) {
                if (char === '/' && nextChar === '/') break;
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
            
            // Обработка escape символов
            if (char === '\\' && inString) {
                charIndex += 2;
                continue;
            }
            
            // Обработка строк
            if (char === '"' || char === "'" || char === '`') {
                if (!inString) {
                    inString = true;
                    stringChar = char;
                } else if (char === stringChar) {
                    inString = false;
                }
            }
            
            // Считаем скобки только вне строк
            if (!inString) {
                if (char === '{') open++;
                if (char === '}') close++;
            }
            
            charIndex++;
        }
        
        braceMap.push({ line: i + 1, open, close, text: line.substring(0, 80) });
    }
    
    // Вычисляем кумулятивный баланс
    let balance = 0;
    const balances = [];
    
    for (const item of braceMap) {
        balance += item.open - item.close;
        balances.push({ ...item, balance });
    }
    
    // Находим проблемные зоны
    console.log('\n📊 Проблемные зоны:');
    let lastGoodBalance = 0;
    let problemZones = [];
    
    for (let i = 0; i < balances.length; i++) {
        const item = balances[i];
        
        // Если баланс меняется резко или возвращается к 0 после долгого дисбаланса
        if (i > 0) {
            const prev = balances[i-1];
            if (Math.abs(item.balance - prev.balance) > 1) {
                console.log(`⚠️ Строка ${item.line}: Резкое изменение баланса с ${prev.balance} на ${item.balance}`);
                console.log(`   Текст: ${item.text}`);
            }
        }
        
        // Отмечаем зоны с дисбалансом
        if (item.balance !== 0 && Math.abs(item.balance) > 3) {
            if (problemZones.length === 0 || i - problemZones[problemZones.length-1].end > 10) {
                problemZones.push({ start: i, end: i, balance: item.balance });
            } else {
                problemZones[problemZones.length-1].end = i;
            }
        }
    }
    
    // Показываем итоговый баланс
    console.log(`\n🎯 Итоговый баланс: ${balance}`);
    
    if (balance === 0) {
        console.log('✅ Скобки сбалансированы!');
        return;
    }
    
    console.log(`\n🔧 Начинаем исправление...`);
    
    // Создаем копию для редактирования
    const fixedLines = [...lines];
    let changesMade = 0;
    
    // Исправляем конкретные проблемные блоки из отчета check-brackets.js
    const problems = [
        // Блок 1: Строки 158-173
        {
            name: 'testResponse axios блок',
            start: 157,
            end: 172,
            lines: [
                '                const testResponse = await axios({',
                '                    method: \'POST\',',
                '                    url: \'https://gigachat.devices.sberbank.ru/api/v1/chat/completions\',',
                '                    headers: {',
                '                        \'Content-Type\': \'application/json\',',
                '                        \'Accept\': \'application/json\',',
                '                        \'Authorization\': `Bearer ${token}`',
                '                    },',
                '                    data: {',
                '                        model: \'GigaChat\',',
                '                        messages: [{ role: \'user\', content: \'Тест\' }],',
                '                        temperature: 0.5,',
                '                        max_tokens: 10',
                '                    },',
                '                    httpsAgent: httpsAgent,',
                '                    timeout: 10000',
                '                });'
            ]
        },
        
        // Блок 2: Строки 448-463  
        {
            name: 'altResponse axios блок',
            start: 447,
            end: 462,
            lines: [
                '                const altResponse = await axios({',
                '                    method: \'post\',',
                '                    url: url,',
                '                    data: \'scope=GIGACHAT_API_CORP\', // Альтернативный scope',
                '                    headers: {',
                '                        \'Content-Type\': \'application/x-www-form-urlencoded\',',
                '                        \'Accept\': \'application/json\',',
                '                        \'Authorization\': `Basic ${GIGACHAT_CREDENTIALS}\',',
                '                        \'RqUID\': uuidv4()',
                '                    },',
                '                    httpsAgent: new https.Agent({',
                '                        rejectUnauthorized: false,',
                '                        keepAlive: true',
                '                    }),',
                '                    timeout: 30000,',
                '                    validateStatus: () => true',
                '                });'
            ]
        },
        
        // Блок 3: Строки 709-731 (parseValue функция)
        {
            name: 'parseValue функция',
            start: 708,
            end: 730,
            lines: [
                '                if (value) {',
                '                    value = value.replace(\',\', \'.\');',
                '',
                '                    const suffixMultipliers = {',
                '                        \'К\': 1000, \'k\': 1000, \'тыс\': 1000,',
                '                        \'М\': 1000000, \'млн\': 1000000,',
                '                        \'млрд\': 1000000000, \'b\': 1000000000',
                '                    };',
                '',
                '                    for (const [suffix, multiplier] of Object.entries(suffixMultipliers)) {',
                '                        if (value.toLowerCase().includes(suffix.toLowerCase())) {',
                '                            const num = parseFloat(value.replace(/[^0-9.]/g, \'\'));',
                '                            return !isNaN(num) ? num * multiplier : null;',
                '                        }',
                '                    }',
                '',
                '                    if (value.includes(\'%\')) {',
                '                        const num = parseFloat(value.replace(\'%\', \'\'));',
                '                        return !isNaN(num) ? num : null;',
                '                    }',
                '',
                '                    const num = parseFloat(value);',
                '                    return !isNaN(num) ? num : null;',
                '                }'
            ]
        }
    ];
    
    // Заменяем проблемные блоки
    for (const problem of problems) {
        console.log(`\n🔄 Исправляем: ${problem.name}`);
        
        // Проверяем, что блок существует
        if (problem.start < fixedLines.length && problem.end < fixedLines.length) {
            // Удаляем старые строки
            fixedLines.splice(problem.start, problem.end - problem.start + 1);
            
            // Вставляем исправленные строки
            fixedLines.splice(problem.start, 0, ...problem.lines);
            
            changesMade++;
            console.log(`✅ Заменено ${problem.end - problem.start + 1} строк`);
        } else {
            console.log(`❌ Блок выходит за границы файла`);
        }
    }
    
    // Также исправляем последнюю проблемную строку 9661
    console.log('\n🔄 Исправляем строку 9661...');
    const line9660 = 9659; // Индекс (9661 - 1)
    if (line9660 < fixedLines.length) {
        console.log(`Текст строки: ${fixedLines[line9660]}`);
        // Просто удаляем лишнюю строку если она пустая или содержит только continue;
        if (fixedLines[line9660].trim() === 'continue;' || fixedLines[line9660].trim() === '') {
            fixedLines.splice(line9660, 1);
            changesMade++;
            console.log('✅ Удалена проблемная строка');
        }
    }
    
    // Сохраняем исправленный файл
    if (changesMade > 0) {
        fs.writeFileSync('server-fixed-exact.js', fixedLines.join('\n'), 'utf8');
        console.log(`\n✅ Создан исправленный файл: server-fixed-exact.js`);
        console.log(`Внесено изменений: ${changesMade}`);
        
        // Проверяем баланс
        const fixedContent = fixedLines.join('\n');
        let finalBalance = 0;
        inString = false;
        stringChar = '';
        
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
                if (char === '{') finalBalance++;
                if (char === '}') finalBalance--;
            }
        }
        
        console.log(`📊 Итоговый баланс скобок: ${finalBalance}`);
        
        if (finalBalance === 0) {
            console.log('🎉 Все скобки сбалансированы!');
            console.log('\n🚀 Заменяйте оригинальный файл:');
            console.log('copy server-fixed-exact.js server.js');
            console.log('node check-brackets.js');
        } else if (Math.abs(finalBalance) <= 2) {
            console.log(`\n⚠️ Небольшой дисбаланс: ${finalBalance}`);
            console.log('Попробуйте ручную корректировку:');
            
            if (finalBalance > 0) {
                console.log(`Добавьте ${finalBalance} закрывающих скобок в конце файла`);
                // Добавляем недостающие скобки
                for (let i = 0; i < finalBalance; i++) {
                    fixedLines.push('}');
                }
                fs.writeFileSync('server-fixed-exact.js', fixedLines.join('\n'), 'utf8');
                console.log('✅ Добавлены недостающие скобки');
            } else {
                console.log(`Удалите ${-finalBalance} лишних закрывающих скобок`);
            }
        }
    } else {
        console.log('❌ Изменений не внесено');
    }
}

// Запускаем
fixExact().catch(console.error);