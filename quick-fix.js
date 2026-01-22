const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');

console.log('🔧 Применяю быстрое исправление...');

// Находим и исправляем проблемный участок
const problemArea = `    } catch (error) {
        console.error('❌ Ошибка подготовки к инвесторам:', error);
    
    detectBusinessType(description) {
        const lowerDesc = description.toLowerCase();
        if (lowerDesc.includes('saas') || lowerDesc.includes('подпис') || lowerDesc.includes('облач')) return 'saas';
        if (lowerDesc.includes('ecommerce') || lowerDesc.includes('магазин') || lowerDesc.includes('товар')) return 'ecommerce';
        if (lowerDesc.includes('marketplace') || lowerDesc.includes('площадк')) return 'marketplace';
        return 'general';
    }`;

const fixedArea = `    } catch (error) {
        console.error('❌ Ошибка подготовки к инвесторам:', error);
        
        // Восстановим метод detectBusinessType
        const result = {
            error: error.message,
            generated_at: new Date().toISOString(),
            fallback: true
        };
        
        // Добавим fallback методы
        result.structured_questions = this.investorQuestions;
        result.pitch_structures = this.pitchStructure;
        
        return result;
    }
}

detectBusinessType(description) {
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes('saas') || lowerDesc.includes('подпис') || lowerDesc.includes('облач')) return 'saas';
    if (lowerDesc.includes('ecommerce') || lowerDesc.includes('магазин') || lowerDesc.includes('товар')) return 'ecommerce';
    if (lowerDesc.includes('marketplace') || lowerDesc.includes('площадк')) return 'marketplace';
    return 'general';
}`;

if (content.includes(problemArea)) {
    content = content.replace(problemArea, fixedArea);
    console.log('✅ Основная ошибка исправлена');
} else {
    console.log('⚠️  Проблемный участок не найден в ожидаемом формате');
    
    // Попробуем другой подход - найдем метод generateInvestorPrep и исправим его
    const generateMethodRegex = /async generateInvestorPrep\(businessDescription, options = \{\}\) \{[\s\S]*?(\s*getSaaSEarlyStageTemplate\(\))/;
    const match = content.match(generateMethodRegex);
    
    if (match) {
        console.log('🔄 Найден метод generateInvestorPrep, применяю исправление...');
        
        // Просто вставляем закрывающую скобку перед detectBusinessType
        content = content.replace(
            /(\s*\} catch \(error\) \{[^}]*\})(\s*detectBusinessType\(description\))/,
            '$1    }\n\n$2'
        );
    }
}

// Сохраняем исправления
const backupPath = serverPath + '.quick_backup';
fs.writeFileSync(backupPath, fs.readFileSync(serverPath, 'utf8'), 'utf8');
fs.writeFileSync(serverPath, content, 'utf8');

console.log('✅ Исправления применены');
console.log('📁 Резервная копия: ' + backupPath);
console.log('\nПопробуйте запустить сервер: npm start');