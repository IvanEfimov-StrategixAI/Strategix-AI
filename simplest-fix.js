const fs = require('fs');
const path = require('path');

console.log('🔧 Самый простой способ исправления...');

const serverPath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');

// Просто находим строку с ошибкой и смотрим, что вокруг нее
const errorLine = 1487; // Из сообщения об ошибке
const lines = content.split('\n');

console.log(`🔍 Проверяю строку ${errorLine}:`);
console.log('Строка с ошибкой:', lines[errorLine - 1]);

// Выводим контекст вокруг ошибки
console.log('\n📄 Контекст вокруг ошибки:');
for (let i = Math.max(0, errorLine - 10); i < Math.min(lines.length, errorLine + 10); i++) {
    console.log(`${i + 1}: ${lines[i]}`);
}

// Простое исправление: ищем detectBusinessType и проверяем, что он на уровне класса
const detectBusinessTypeIndex = content.indexOf('detectBusinessType(description) {');
console.log('\n🔍 Найден detectBusinessType на позиции:', detectBusinessTypeIndex);

if (detectBusinessTypeIndex !== -1) {
    // Смотрим, что перед этим методом
    const beforeMethod = content.substring(Math.max(0, detectBusinessTypeIndex - 200), detectBusinessTypeIndex);
    
    if (beforeMethod.includes('async generateInvestorPrep')) {
        console.log('⚠️  detectBusinessType находится ВНУТРИ generateInvestorPrep!');
        
        // Находим начало generateInvestorPrep
        const generateStart = content.lastIndexOf('async generateInvestorPrep', detectBusinessTypeIndex);
        // Находим соответствующий конец метода
        let bracketCount = 0;
        let methodEnd = -1;
        
        for (let i = generateStart; i < content.length; i++) {
            if (content[i] === '{') bracketCount++;
            if (content[i] === '}') bracketCount--;
            if (bracketCount === 0) {
                methodEnd = i;
                break;
            }
        }
        
        if (methodEnd !== -1 && methodEnd < detectBusinessTypeIndex) {
            console.log('✅ detectBusinessType уже находится на уровне класса');
        } else {
            console.log('❌ Нужно вынести detectBusinessType из generateInvestorPrep');
            
            // Простое решение: добавляем закрывающую скобку перед detectBusinessType
            const beforeDetect = content.substring(0, detectBusinessTypeIndex);
            const afterDetect = content.substring(detectBusinessTypeIndex);
            
            // Ищем ближайшую закрывающую скобку перед методом
            const lastBraceIndex = beforeDetect.lastIndexOf('}');
            if (lastBraceIndex !== -1) {
                // Проверяем, есть ли уже закрывающая скобка
                const between = beforeDetect.substring(lastBraceIndex, beforeDetect.length);
                if (!between.includes('async generateInvestorPrep')) {
                    content = beforeDetect + '    }\n\n' + afterDetect;
                    console.log('✅ Добавлена закрывающая скобка');
                }
            }
        }
    }
}

// Сохраняем с новым именем для проверки
const testPath = serverPath.replace('.js', '_fixed.js');
fs.writeFileSync(testPath, content, 'utf8');
console.log(`\n✅ Файл сохранен как: ${testPath}`);
console.log('\n🚀 Попробуйте запустить:');
console.log(`   node ${testPath}`);