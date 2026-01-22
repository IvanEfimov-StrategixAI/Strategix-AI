-- enable-rls-with-policies.sql
-- Включаем RLS с политиками для разработки

-- Для таблицы users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users" ON users
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Allow public read for some columns" ON users
    FOR SELECT USING (true);

-- Для таблицы user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own settings" ON user_settings
    FOR ALL USING (auth.uid() = user_id);

-- Для таблицы chat_history
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own chat history" ON chat_history
    FOR ALL USING (auth.uid() = user_id);

-- Для таблицы generated_documents
ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own documents" ON generated_documents
    FOR ALL USING (auth.uid() = user_id);