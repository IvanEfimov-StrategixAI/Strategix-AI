const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server.js');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('📋 Строки 1570-1630 из server.js:\n');
console.log('=' .repeat(80));

for (let i = 1569; i < 1630; i++) {
    const lineNum = i + 1;
    const line = lines[i] || '';
    
    if (lineNum === 1608) {
        console.log(`>>> ${lineNum}: ${line} <<< ПРОБЛЕМА ЗДЕСЬ`);
    } else {
        console.log(`${lineNum}: ${line}`);
    }
}

console.log('=' .repeat(80));
console.log('\n🔍 Анализ проблемы:');
console.log('Строка 1608: detailed_15: [');
console.log('Это свойство объекта, но перед ним должно быть что-то вроде:');
console.log('pitch_structures: {');
console.log('  classic_10: [...],');
console.log('  detailed_15: [...]');
console.log('}');