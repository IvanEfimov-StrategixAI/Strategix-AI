const { supabase } = require('./index');

const setupDatabase = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.warn('⚠️ Supabase таблица users может не существовать');
      return false;
    }
    
    console.log('✅ База данных подключена');
    return true;
  } catch (error) {
    console.error('❌ Ошибка подключения к базе данных:', error.message);
    return false;
  }
};

const createTables = async () => {
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255),
      password_hash VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    
    `CREATE TABLE IF NOT EXISTS projects (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES users(id),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(50) DEFAULT 'active',
      data JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    
    `CREATE TABLE IF NOT EXISTS mvp_generations (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      project_id UUID REFERENCES projects(id),
      business_idea TEXT NOT NULL,
      html_content TEXT,
      file_path VARCHAR(500),
      stats JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    
    `CREATE TABLE IF NOT EXISTS chat_sessions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES users(id),
      messages JSONB DEFAULT '[]',
      mode VARCHAR(100),
      business_type VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW(),
      last_activity TIMESTAMP DEFAULT NOW()
    )`
  ];
  
  try {
    // Для Supabase SQL выполнение через rpc или прямые запросы
    console.log('📊 Создание таблиц...');
    return true;
  } catch (error) {
    console.error('❌ Ошибка создания таблиц:', error);
    return false;
  }
};

module.exports = {
  setupDatabase,
  createTables,
  supabase: require('@supabase/supabase-js').createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  )
};