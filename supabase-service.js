// supabase-service.js
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');

class SupabaseService {
    constructor() {
        this.supabase = null;
        this.serviceRoleClient = null;
        this.mailTransporter = null;
        this.connected = false;
    }
    
    async initialize() {
        try {
            const supabaseUrl = process.env.SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_ANON_KEY;
            const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            
            if (!supabaseUrl || !supabaseKey) {
                console.error('❌ Supabase URL и ANON KEY обязательны');
                return false;
            }
            
            console.log('🔗 Инициализация Supabase...');
            
            // Клиент для анонимных операций
            this.supabase = createClient(supabaseUrl, supabaseKey, {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true
                }
            });
            
            // Клиент для административных операций
            if (serviceRoleKey) {
                this.serviceRoleClient = createClient(supabaseUrl, serviceRoleKey, {
                    auth: {
                        autoRefreshToken: true,
                        persistSession: true
                    }
                });
            }
            
            // Инициализация email транспорта
            this.initializeEmailTransport();
            
            // Тестируем подключение
            const { data, error } = await this.supabase
                .from('users')
                .select('count')
                .limit(1);
            
            if (error && error.code !== 'PGRST116') {
                console.error('❌ Ошибка подключения к Supabase:', error);
                return false;
            }
            
            this.connected = true;
            console.log('✅ Supabase успешно инициализирован');
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка инициализации Supabase:', error);
            this.connected = false;
            return false;
        }
    }
    
    initializeEmailTransport() {
        try {
            const host = process.env.EMAIL_HOST;
            const port = process.env.EMAIL_PORT;
            const user = process.env.EMAIL_USER;
            const password = process.env.EMAIL_PASSWORD;
            
            if (host && port && user && password) {
                this.mailTransporter = nodemailer.createTransport({
                    host: host,
                    port: parseInt(port),
                    secure: parseInt(port) === 465, // true для 465, false для других портов
                    auth: {
                        user: user,
                        pass: password
                    }
                });
                
                console.log('📧 Email транспорт инициализирован');
            } else {
                console.warn('⚠️  Email транспорт не настроен. Проверьте EMAIL_* переменные в .env');
            }
        } catch (error) {
            console.error('❌ Ошибка инициализации email транспорта:', error);
        }
    }
    
    // ============================================
    // АУТЕНТИФИКАЦИЯ И ПОЛЬЗОВАТЕЛИ
    // ============================================
    
    // В файле supabase-service.js, метод createUser, исправляем отправку email:
async createUser(userData) {
    try {
        const userId = uuidv4();
        const { email, password, name } = userData;
        
        // Проверяем, существует ли пользователь
        const existingUser = await this.getUserByEmail(email);
        if (existingUser) {
            throw new Error('Пользователь с таким email уже существует');
        }
        
        // Хешируем пароль
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        
        // Генерируем токен верификации
        const verificationToken = uuidv4();
        
        const { data, error } = await this.supabase
            .from('users')
            .insert([{
                id: userId,
                email: email.trim().toLowerCase(),
                name: name,
                password_hash: passwordHash,
                is_verified: false,
                is_admin: false,
                subscription: 'free',
                email_verification_token: verificationToken,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (error) {
            console.error('Ошибка создания пользователя в Supabase:', error);
            throw error;
        }
        
        // Создаем настройки пользователя
        await this.createUserSettings(userId);
        
        // Отправляем email верификации (улучшенная версия)
        await this.sendVerificationEmail(email, verificationToken, name);
        
        return data;
        
    } catch (error) {
        console.error('❌ Ошибка создания пользователя:', error);
        throw error;
    }
}
    
    async getUserByEmail(email) {
        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('email', email.trim().toLowerCase())
                .single();
            
            if (error && error.code !== 'PGRST116') {
                console.error('Ошибка поиска пользователя:', error);
                return null;
            }
            
            return data;
        } catch (error) {
            console.error('Ошибка получения пользователя:', error);
            return null;
        }
    }
    
    async getUserById(userId) {
        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Ошибка получения пользователя по ID:', error);
            return null;
        }
    }
    
    // Добавьте этот метод в SupabaseService
async verifyEmail(verificationToken) {
    try {
        // Находим пользователя по токену верификации
        const { data: user, error } = await this.supabase
            .from('users')
            .select('*')
            .eq('email_verification_token', verificationToken)
            .single();
        
        if (error || !user) {
            throw new Error('Неверный токен верификации');
        }
        
        // Обновляем пользователя - подтверждаем email
        const { data: updatedUser, error: updateError } = await this.supabase
            .from('users')
            .update({
                is_verified: true,
                email_verification_token: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id)
            .select()
            .single();
        
        if (updateError) throw updateError;
        
        return updatedUser;
        
    } catch (error) {
        console.error('Ошибка верификации пользователя:', error);
        throw error;
    }
}

    async verifyUserPassword(userId, password) {
        try {
            const user = await this.getUserById(userId);
            
            if (!user) {
                throw new Error('Пользователь не найден');
            }
            
            return await bcrypt.compare(password, user.password_hash);
            
        } catch (error) {
            console.error('Ошибка проверки пароля:', error);
            return false;
        }
    }
    
    async verifyUserByToken(verificationToken) {
        try {
            // Находим пользователя по токену верификации
            const { data: user, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('email_verification_token', verificationToken)
                .single();
            
            if (error || !user) {
                throw new Error('Неверный токен верификации');
            }
            
            // Обновляем пользователя - подтверждаем email
            const { data: updatedUser, error: updateError } = await this.supabase
                .from('users')
                .update({
                    is_verified: true,
                    email_verification_token: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id)
                .select()
                .single();
            
            if (updateError) throw updateError;
            
            return updatedUser;
            
        } catch (error) {
            console.error('Ошибка верификации пользователя:', error);
            throw error;
        }
    }
    
    async updateUser(userId, updates) {
        try {
            updates.updated_at = new Date().toISOString();
            
            const { data, error } = await this.supabase
                .from('users')
                .update(updates)
                .eq('id', userId)
                .select()
                .single();
            
            if (error) throw error;
            return data;
            
        } catch (error) {
            console.error('Ошибка обновления пользователя:', error);
            throw error;
        }
    }
    
    async sendVerificationEmail(email, verificationToken, name) {
        try {
            if (!this.mailTransporter) {
                console.warn('Email транспорт не настроен, пропускаем отправку');
                return false;
            }
            
            const verificationLink = `http://localhost:${process.env.PORT || 5000}/api/auth/verify-email?token=${verificationToken}`;
            
            const mailOptions = {
                from: process.env.EMAIL_FROM || 'noreply@strategix.ai',
                to: email,
                subject: 'Подтверждение email - Strategix AI Pro',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1>Strategix AI Pro</h1>
                            <p>Подтверждение email адреса</p>
                        </div>
                        <div style="padding: 30px; background: white; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                            <h2>Здравствуйте, ${name}!</h2>
                            <p>Спасибо за регистрацию в Strategix AI Pro.</p>
                            <p>Для завершения регистрации подтвердите ваш email адрес:</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${verificationLink}" 
                                   style="background: #2E75B6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                                    Подтвердить Email
                                </a>
                            </div>
                            <p>Или скопируйте ссылку:</p>
                            <p style="background: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all;">
                                ${verificationLink}
                            </p>
                            <p>Если вы не регистрировались на Strategix AI Pro, просто проигнорируйте это письмо.</p>
                            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                            <p style="font-size: 12px; color: #666;">
                                Ссылка действительна 24 часа.<br>
                                © ${new Date().getFullYear()} Strategix AI Pro. Все права защищены.
                            </p>
                        </div>
                    </div>
                `,
                text: `
                    Strategix AI Pro - Подтверждение email
                    
                    Здравствуйте, ${name}!
                    
                    Спасибо за регистрацию в Strategix AI Pro.
                    Для завершения регистрации подтвердите ваш email адрес:
                    
                    ${verificationLink}
                    
                    Если вы не регистрировались на Strategix AI Pro, просто проигнорируйте это письмо.
                    
                    Ссылка действительна 24 часа.
                    © ${new Date().getFullYear()} Strategix AI Pro. Все права защищены.
                `
            };
            
            const info = await this.mailTransporter.sendMail(mailOptions);
            console.log(`✅ Email верификации отправлен: ${info.messageId}`);
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка отправки email верификации:', error);
            return false;
        }
    }
    
    async sendPasswordResetEmail(email, resetToken) {
        try {
            if (!this.mailTransporter) {
                console.warn('Email транспорт не настроен, пропускаем отправку');
                return false;
            }
            
            const resetLink = `http://localhost:${process.env.PORT || 5000}/reset-password?token=${resetToken}`;
            
            const mailOptions = {
                from: process.env.EMAIL_FROM || 'noreply@strategix.ai',
                to: email,
                subject: 'Сброс пароля - Strategix AI Pro',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1>Strategix AI Pro</h1>
                            <p>Сброс пароля</p>
                        </div>
                        <div style="padding: 30px; background: white; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                            <h2>Сброс пароля</h2>
                            <p>Мы получили запрос на сброс пароля для вашего аккаунта.</p>
                            <p>Для сброса пароля нажмите кнопку:</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${resetLink}" 
                                   style="background: #ef4444; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                                    Сбросить пароль
                                </a>
                            </div>
                            <p>Или скопируйте ссылку:</p>
                            <p style="background: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all;">
                                ${resetLink}
                            </p>
                            <p>Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.</p>
                            <p><strong>Ссылка действительна 1 час.</strong></p>
                            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                            <p style="font-size: 12px; color: #666;">
                                © ${new Date().getFullYear()} Strategix AI Pro. Все права защищены.
                            </p>
                        </div>
                    </div>
                `,
                text: `
                    Strategix AI Pro - Сброс пароля
                    
                    Мы получили запрос на сброс пароля для вашего аккаунта.
                    Для сброса пароля перейдите по ссылке:
                    
                    ${resetLink}
                    
                    Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.
                    
                    Ссылка действительна 1 час.
                    © ${new Date().getFullYear()} Strategix AI Pro. Все права защищены.
                `
            };
            
            const info = await this.mailTransporter.sendMail(mailOptions);
            console.log(`✅ Email сброса пароля отправлен: ${info.messageId}`);
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка отправки email сброса пароля:', error);
            return false;
        }
    }
    
    async initiatePasswordReset(email) {
        try {
            const user = await this.getUserByEmail(email);
            
            if (!user) {
                throw new Error('Пользователь не найден');
            }
            
            const resetToken = uuidv4();
            const resetExpires = new Date(Date.now() + 3600000); // 1 час
            
            await this.updateUser(user.id, {
                password_reset_token: resetToken,
                password_reset_expires: resetExpires.toISOString()
            });
            
            await this.sendPasswordResetEmail(email, resetToken);
            
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка инициации сброса пароля:', error);
            throw error;
        }
    }
    
    async resetPassword(resetToken, newPassword) {
        try {
            // Находим пользователя по токену сброса
            const { data: user, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('password_reset_token', resetToken)
                .single();
            
            if (error || !user) {
                throw new Error('Неверный токен сброса пароля');
            }
            
            // Проверяем срок действия токена
            const resetExpires = new Date(user.password_reset_expires);
            if (resetExpires < new Date()) {
                throw new Error('Срок действия токена истек');
            }
            
            // Хешируем новый пароль
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(newPassword, salt);
            
            // Обновляем пароль и очищаем токен
            const { data: updatedUser, error: updateError } = await this.supabase
                .from('users')
                .update({
                    password_hash: passwordHash,
                    password_reset_token: null,
                    password_reset_expires: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id)
                .select()
                .single();
            
            if (updateError) throw updateError;
            
            return updatedUser;
            
        } catch (error) {
            console.error('❌ Ошибка сброса пароля:', error);
            throw error;
        }
    }
    
    // ============================================
    // НАСТРОЙКИ ПОЛЬЗОВАТЕЛЯ
    // ============================================
    
    async createUserSettings(userId) {
        try {
            const { error } = await this.supabase
                .from('user_settings')
                .insert([{
                    user_id: userId,
                    preferences: {
                        language: 'ru',
                        theme: 'light',
                        notifications: true,
                        email_notifications: true
                    },
                    notification_settings: {
                        new_features: true,
                        marketing: false,
                        security_alerts: true
                    },
                    export_settings: {
                        default_format: 'pdf',
                        include_validation: true,
                        auto_save: false
                    }
                }]);
            
            if (error) throw error;
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка создания настроек пользователя:', error);
            throw error;
        }
    }
    
    async getUserSettings(userId) {
        try {
            const { data, error } = await this.supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', userId)
                .single();
            
            if (error) throw error;
            return data;
            
        } catch (error) {
            console.error('❌ Ошибка получения настроек пользователя:', error);
            return null;
        }
    }
    
    async updateUserSettings(userId, updates) {
        try {
            updates.updated_at = new Date().toISOString();
            
            const { data, error } = await this.supabase
                .from('user_settings')
                .update(updates)
                .eq('user_id', userId)
                .select()
                .single();
            
            if (error) throw error;
            return data;
            
        } catch (error) {
            console.error('❌ Ошибка обновления настроек пользователя:', error);
            throw error;
        }
    }
    
    // ============================================
    // ИСТОРИЯ ЧАТА
    // ============================================
    
    async saveChatMessage(userId, sessionId, messageData) {
        try {
            const { error } = await this.supabase
                .from('chat_history')
                .insert([{
                    user_id: userId,
                    session_id: sessionId,
                    message_type: messageData.role || 'user',
                    content: messageData.content || '',
                    metadata: messageData.metadata || {},
                    created_at: new Date().toISOString()
                }]);
            
            if (error) throw error;
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка сохранения сообщения чата:', error);
            throw error;
        }
    }
    
    async getChatHistory(userId, sessionId, limit = 50) {
        try {
            const { data, error } = await this.supabase
                .from('chat_history')
                .select('*')
                .eq('user_id', userId)
                .eq('session_id', sessionId)
                .order('created_at', { ascending: true })
                .limit(limit);
            
            if (error) throw error;
            return data;
            
        } catch (error) {
            console.error('❌ Ошибка получения истории чата:', error);
            return [];
        }
    }
    
    async deleteChatHistory(userId, sessionId) {
        try {
            const { error } = await this.supabase
                .from('chat_history')
                .delete()
                .eq('user_id', userId)
                .eq('session_id', sessionId);
            
            if (error) throw error;
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка удаления истории чата:', error);
            throw error;
        }
    }
    
    // ============================================
    // ДОКУМЕНТЫ
    // ============================================
    
    async saveGeneratedDocument(userId, documentData) {
        try {
            const { error } = await this.supabase
                .from('generated_documents')
                .insert([{
                    user_id: userId,
                    document_type: documentData.type,
                    title: documentData.title,
                    content: documentData.content,
                    metadata: documentData.metadata || {},
                    file_path: documentData.file_path,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }]);
            
            if (error) throw error;
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка сохранения документа:', error);
            throw error;
        }
    }
    
    async getUserDocuments(userId, documentType = null, limit = 100) {
        try {
            let query = this.supabase
                .from('generated_documents')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);
            
            if (documentType) {
                query = query.eq('document_type', documentType);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            return data;
            
        } catch (error) {
            console.error('❌ Ошибка получения документов:', error);
            return [];
        }
    }
    
    async getDocumentById(documentId) {
        try {
            const { data, error } = await this.supabase
                .from('generated_documents')
                .select('*')
                .eq('id', documentId)
                .single();
            
            if (error) throw error;
            return data;
            
        } catch (error) {
            console.error('❌ Ошибка получения документа по ID:', error);
            return null;
        }
    }
    
    async updateDocument(documentId, updates) {
        try {
            updates.updated_at = new Date().toISOString();
            
            const { data, error } = await this.supabase
                .from('generated_documents')
                .update(updates)
                .eq('id', documentId)
                .select()
                .single();
            
            if (error) throw error;
            return data;
            
        } catch (error) {
            console.error('❌ Ошибка обновления документа:', error);
            throw error;
        }
    }
    
    async deleteDocument(documentId) {
        try {
            const { error } = await this.supabase
                .from('generated_documents')
                .delete()
                .eq('id', documentId);
            
            if (error) throw error;
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка удаления документа:', error);
            throw error;
        }
    }
    
    async incrementDocumentDownloadCount(documentId) {
        try {
            const document = await this.getDocumentById(documentId);
            
            if (!document) {
                throw new Error('Документ не найден');
            }
            
            const { data, error } = await this.supabase
                .from('generated_documents')
                .update({
                    download_count: (document.download_count || 0) + 1,
                    updated_at: new Date().toISOString()
                })
                .eq('id', documentId)
                .select()
                .single();
            
            if (error) throw error;
            return data;
            
        } catch (error) {
            console.error('❌ Ошибка увеличения счетчика скачиваний:', error);
            throw error;
        }
    }
    
    // ============================================
    // СТАТИСТИКА
    // ============================================
    
    async getUserStatistics(userId) {
        try {
            const stats = {};
            
            // Количество чат-сообщений
            const { data: chatStats, error: chatError } = await this.supabase
                .from('chat_history')
                .select('user_id', { count: 'exact' })
                .eq('user_id', userId);
            
            if (!chatError) {
                stats.total_chat_messages = chatStats.length || 0;
            }
            
            // Количество документов
            const { data: docStats, error: docError } = await this.supabase
                .from('generated_documents')
                .select('document_type')
                .eq('user_id', userId);
            
            if (!docError) {
                stats.total_documents = docStats.length || 0;
                stats.document_types = {};
                docStats.forEach(doc => {
                    stats.document_types[doc.document_type] = 
                        (stats.document_types[doc.document_type] || 0) + 1;
                });
            }
            
            // Последняя активность
            const { data: lastActivity, error: activityError } = await this.supabase
                .from('users')
                .select('updated_at, last_login')
                .eq('id', userId)
                .single();
            
            if (!activityError) {
                stats.last_activity = lastActivity.updated_at;
                stats.last_login = lastActivity.last_login;
            }
            
            // Настройки пользователя
            const userSettings = await this.getUserSettings(userId);
            if (userSettings) {
                stats.settings = userSettings;
            }
            
            return stats;
            
        } catch (error) {
            console.error('❌ Ошибка получения статистики пользователя:', error);
            return {};
        }
    }
    
    async getSystemStatistics() {
        try {
            if (!this.serviceRoleClient) {
                throw new Error('Service role client не инициализирован');
            }
            
            const stats = {};
            
            // Общее количество пользователей
            const { count: totalUsers, error: usersError } = await this.serviceRoleClient
                .from('users')
                .select('*', { count: 'exact', head: true });
            
            if (!usersError) stats.total_users = totalUsers;
            
            // Пользователи по подпискам
            const { data: usersBySub, error: subError } = await this.serviceRoleClient
                .from('users')
                .select('subscription, is_verified');
            
            if (!subError) {
                stats.subscriptions = {};
                stats.verified_users = 0;
                
                usersBySub.forEach(user => {
                    const sub = user.subscription || 'free';
                    stats.subscriptions[sub] = (stats.subscriptions[sub] || 0) + 1;
                    
                    if (user.is_verified) {
                        stats.verified_users++;
                    }
                });
                
                stats.unverified_users = (totalUsers || 0) - stats.verified_users;
            }
            
            // Общее количество документов
            const { count: totalDocs, error: docsError } = await this.serviceRoleClient
                .from('generated_documents')
                .select('*', { count: 'exact', head: true });
            
            if (!docsError) stats.total_documents = totalDocs;
            
            // Общее количество сообщений чата
            const { count: totalMessages, error: messagesError } = await this.serviceRoleClient
                .from('chat_history')
                .select('*', { count: 'exact', head: true });
            
            if (!messagesError) stats.total_chat_messages = totalMessages;
            
            // Новые пользователи за последние 30 дней
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
            
            const { count: newUsers, error: newUsersError } = await this.serviceRoleClient
                .from('users')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', thirtyDaysAgo);
            
            if (!newUsersError) stats.new_users_last_30_days = newUsers;
            
            // Активность за последние 7 дней
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            
            // Активные пользователи (были активны за последние 7 дней)
            const { count: activeUsers, error: activeError } = await this.serviceRoleClient
                .from('users')
                .select('*', { count: 'exact', head: true })
                .gte('updated_at', sevenDaysAgo);
            
            if (!activeError) stats.active_users_last_7_days = activeUsers;
            
            // Новые документы за последние 7 дней
            const { count: newDocs, error: newDocsError } = await this.serviceRoleClient
                .from('generated_documents')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', sevenDaysAgo);
            
            if (!newDocsError) stats.new_documents_last_7_days = newDocs;
            
            // Распределение по типам документов
            const { data: docsByType, error: docsByTypeError } = await this.serviceRoleClient
                .from('generated_documents')
                .select('document_type');
            
            if (!docsByTypeError) {
                stats.document_types_distribution = {};
                docsByType.forEach(doc => {
                    const type = doc.document_type || 'unknown';
                    stats.document_types_distribution[type] = 
                        (stats.document_types_distribution[type] || 0) + 1;
                });
            }
            
            // Среднее количество документов на пользователя
            if (stats.total_users > 0 && stats.total_documents > 0) {
                stats.avg_documents_per_user = (stats.total_documents / stats.total_users).toFixed(2);
            }
            
            // Среднее количество сообщений на пользователя
            if (stats.total_users > 0 && stats.total_chat_messages > 0) {
                stats.avg_messages_per_user = (stats.total_chat_messages / stats.total_users).toFixed(2);
            }
            
            return stats;
            
        } catch (error) {
            console.error('❌ Ошибка получения системной статистики:', error);
            throw error;
        }
    }
    
    // ============================================
    // ПОИСК И ФИЛЬТРАЦИЯ
    // ============================================
    
    async searchUserDocuments(userId, query, filters = {}) {
        try {
            let queryBuilder = this.supabase
                .from('generated_documents')
                .select('*')
                .eq('user_id', userId)
                .or(`title.ilike.%${query}%,content.ilike.%${query}%`);
            
            // Применяем фильтры
            if (filters.documentType) {
                queryBuilder = queryBuilder.eq('document_type', filters.documentType);
            }
            
            if (filters.startDate) {
                queryBuilder = queryBuilder.gte('created_at', filters.startDate);
            }
            
            if (filters.endDate) {
                queryBuilder = queryBuilder.lte('created_at', filters.endDate);
            }
            
            if (filters.sortBy) {
                const order = filters.sortOrder === 'desc' ? false : true;
                queryBuilder = queryBuilder.order(filters.sortBy, { ascending: order });
            } else {
                queryBuilder = queryBuilder.order('created_at', { ascending: false });
            }
            
            const { data, error } = await queryBuilder;
            
            if (error) throw error;
            return data || [];
            
        } catch (error) {
            console.error('❌ Ошибка поиска документов:', error);
            return [];
        }
    }
    
    async searchChatHistory(userId, query, sessionId = null) {
        try {
            let queryBuilder = this.supabase
                .from('chat_history')
                .select('*')
                .eq('user_id', userId)
                .ilike('content', `%${query}%`);
            
            if (sessionId) {
                queryBuilder = queryBuilder.eq('session_id', sessionId);
            }
            
            queryBuilder = queryBuilder.order('created_at', { ascending: false });
            
            const { data, error } = await queryBuilder;
            
            if (error) throw error;
            return data || [];
            
        } catch (error) {
            console.error('❌ Ошибка поиска в истории чата:', error);
            return [];
        }
    }
}

module.exports = new SupabaseService();