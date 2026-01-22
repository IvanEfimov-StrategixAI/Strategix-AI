const { createClient } = require('@supabase/supabase-js');
const { supabase: config } = require('../config');
const SecurityService = require('../config/security');

class SupabaseService {
  constructor() {
    this.client = createClient(config.url, config.anonKey);
    this.security = new SecurityService();
    this.connected = false;
    this.init();
  }

  async init() {
    try {
      // Простая проверка подключения
      const { data, error } = await this.client.from('users').select('count').limit(1);
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = relation doesn't exist
        console.warn('⚠️ Supabase: возможны проблемы с подключением', error.message);
      } else {
        this.connected = true;
        console.log('✅ Supabase подключен');
      }
    } catch (error) {
      console.error('❌ Ошибка подключения к Supabase:', error.message);
      this.connected = false;
    }
  }

  // USERS
  async createUser(userData) {
    try {
      const { email, password, name } = userData;
      
      // Хешируем пароль
      const passwordHash = await this.security.hashPassword(password);
      
      const { data, error } = await this.client
        .from('users')
        .insert([{
          email,
          name,
          password_hash: passwordHash,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Генерируем JWT токены
      const accessToken = this.security.generateAccessToken({ 
        userId: data.id, 
        email: data.email 
      });
      
      const refreshToken = this.security.generateRefreshToken({ 
        userId: data.id 
      });

      return {
        success: true,
        user: {
          id: data.id,
          email: data.email,
          name: data.name
        },
        tokens: {
          accessToken,
          refreshToken
        }
      };
    } catch (error) {
      console.error('❌ Ошибка создания пользователя:', error);
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  async getUserByEmail(email) {
    try {
      const { data, error } = await this.client
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) throw error;
      
      return { success: true, user: data };
    } catch (error) {
      console.error('❌ Ошибка получения пользователя:', error);
      return { success: false, error: error.message };
    }
  }

  async verifyUserCredentials(email, password) {
    try {
      const { data: user, error } = await this.client
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) throw error;
      
      if (!user.password_hash) {
        return { success: false, error: 'Пользователь не найден' };
      }

      const isValid = await this.security.verifyPassword(password, user.password_hash);
      
      if (!isValid) {
        return { success: false, error: 'Неверный пароль' };
      }

      // Генерируем токены
      const accessToken = this.security.generateAccessToken({ 
        userId: user.id, 
        email: user.email 
      });
      
      const refreshToken = this.security.generateRefreshToken({ 
        userId: user.id 
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        tokens: {
          accessToken,
          refreshToken
        }
      };
    } catch (error) {
      console.error('❌ Ошибка проверки учетных данных:', error);
      return { success: false, error: error.message };
    }
  }

  async updateUser(userId, updateData) {
    try {
      const updateFields = {
        ...updateData,
        updated_at: new Date().toISOString()
      };

      // Если обновляется пароль - хешируем его
      if (updateData.password) {
        updateFields.password_hash = await this.security.hashPassword(updateData.password);
        delete updateFields.password;
      }

      const { data, error } = await this.client
        .from('users')
        .update(updateFields)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      
      return {
        success: true,
        user: {
          id: data.id,
          email: data.email,
          name: data.name,
          updated_at: data.updated_at
        }
      };
    } catch (error) {
      console.error('❌ Ошибка обновления пользователя:', error);
      return { success: false, error: error.message };
    }
  }

  // PROJECTS
  async createProject(projectData) {
    try {
      const { userId, name, description = '', data = {} } = projectData;
      
      const { data: project, error } = await this.client
        .from('projects')
        .insert([{
          user_id: userId,
          name,
          description,
          data,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      return {
        success: true,
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          status: project.status,
          data: project.data,
          created_at: project.created_at,
          updated_at: project.updated_at
        }
      };
    } catch (error) {
      console.error('❌ Ошибка создания проекта:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserProjects(userId, options = {}) {
    try {
      let query = this.client
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data: projects, error } = await query;

      if (error) throw error;
      
      return {
        success: true,
        projects: projects || [],
        count: projects?.length || 0
      };
    } catch (error) {
      console.error('❌ Ошибка получения проектов:', error);
      return { success: false, error: error.message };
    }
  }

  async getProjectById(projectId) {
    try {
      const { data: project, error } = await this.client
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      
      return { success: true, project };
    } catch (error) {
      console.error('❌ Ошибка получения проекта:', error);
      return { success: false, error: error.message };
    }
  }

  async updateProject(projectId, updateData) {
    try {
      const updateFields = {
        ...updateData,
        updated_at: new Date().toISOString()
      };

      const { data: project, error } = await this.client
        .from('projects')
        .update(updateFields)
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;
      
      return { success: true, project };
    } catch (error) {
      console.error('❌ Ошибка обновления проекта:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteProject(projectId) {
    try {
      const { error } = await this.client
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('❌ Ошибка удаления проекта:', error);
      return { success: false, error: error.message };
    }
  }

  // MVP GENERATIONS
  async saveMVPGeneration(generationData) {
    try {
      const { projectId, businessIdea, htmlContent, filePath, stats = {} } = generationData;
      
      const { data: generation, error } = await this.client
        .from('mvp_generations')
        .insert([{
          project_id: projectId,
          business_idea: businessIdea,
          html_content: htmlContent?.substring(0, 10000), // Ограничиваем размер
          file_path: filePath,
          stats,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      return { success: true, generation };
    } catch (error) {
      console.error('❌ Ошибка сохранения MVP:', error);
      return { success: false, error: error.message };
    }
  }

  async getProjectMVPGenerations(projectId, options = {}) {
    try {
      let query = this.client
        .from('mvp_generations')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data: generations, error } = await query;

      if (error) throw error;
      
      return {
        success: true,
        generations: generations || [],
        count: generations?.length || 0
      };
    } catch (error) {
      console.error('❌ Ошибка получения MVP генераций:', error);
      return { success: false, error: error.message };
    }
  }

  // CHAT SESSIONS
  async createChatSession(sessionData) {
    try {
      const { userId, messages = [], mode = null, businessType = null } = sessionData;
      
      const { data: session, error } = await this.client
        .from('chat_sessions')
        .insert([{
          user_id: userId,
          messages,
          mode,
          business_type: businessType,
          created_at: new Date().toISOString(),
          last_activity: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      return { success: true, session };
    } catch (error) {
      console.error('❌ Ошибка создания чат-сессии:', error);
      return { success: false, error: error.message };
    }
  }

  async updateChatSession(sessionId, updateData) {
    try {
      const updateFields = {
        ...updateData,
        last_activity: new Date().toISOString()
      };

      const { data: session, error } = await this.client
        .from('chat_sessions')
        .update(updateFields)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      
      return { success: true, session };
    } catch (error) {
      console.error('❌ Ошибка обновления чат-сессии:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserChatSessions(userId, options = {}) {
    try {
      let query = this.client
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('last_activity', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data: sessions, error } = await query;

      if (error) throw error;
      
      return {
        success: true,
        sessions: sessions || [],
        count: sessions?.length || 0
      };
    } catch (error) {
      console.error('❌ Ошибка получения чат-сессий:', error);
      return { success: false, error: error.message };
    }
  }

  // ANALYTICS
  async getProjectAnalytics(projectId, period = '30d') {
    try {
      // Рассчитываем дату начала периода
      const startDate = new Date();
      if (period === '7d') startDate.setDate(startDate.getDate() - 7);
      else if (period === '30d') startDate.setDate(startDate.getDate() - 30);
      else if (period === '90d') startDate.setDate(startDate.getDate() - 90);

      // Получаем статистику по проекту
      const { data: mvpStats, error: mvpError } = await this.client
        .from('mvp_generations')
        .select('created_at, stats')
        .eq('project_id', projectId)
        .gte('created_at', startDate.toISOString());

      if (mvpError) throw mvpError;

      // Агрегируем статистику
      const analytics = {
        mvpGenerations: mvpStats?.length || 0,
        totalSize: mvpStats?.reduce((sum, stat) => sum + (stat.stats?.size || 0), 0) || 0,
        averageSize: mvpStats?.length ? 
          Math.round(mvpStats.reduce((sum, stat) => sum + (stat.stats?.size || 0), 0) / mvpStats.length) : 0,
        byDate: this.aggregateByDate(mvpStats),
        recentActivity: mvpStats?.slice(0, 10) || []
      };

      return { success: true, analytics };
    } catch (error) {
      console.error('❌ Ошибка получения аналитики:', error);
      return { success: false, error: error.message };
    }
  }

  aggregateByDate(stats) {
    const aggregation = {};
    
    stats?.forEach(stat => {
      const date = new Date(stat.created_at).toLocaleDateString('ru-RU');
      if (!aggregation[date]) {
        aggregation[date] = {
          count: 0,
          totalSize: 0
        };
      }
      aggregation[date].count++;
      aggregation[date].totalSize += stat.stats?.size || 0;
    });
    
    return aggregation;
  }

  // BACKUP & EXPORT
  async exportUserData(userId, format = 'json') {
    try {
      // Получаем все данные пользователя
      const [projectsResult, mvpResult, chatResult] = await Promise.all([
        this.getUserProjects(userId, { limit: 1000 }),
        this.getProjectMVPGenerations(userId, { limit: 1000 }),
        this.getUserChatSessions(userId, { limit: 1000 })
      ]);

      const exportData = {
        metadata: {
          userId,
          exportedAt: new Date().toISOString(),
          format
        },
        projects: projectsResult.success ? projectsResult.projects : [],
        mvpGenerations: mvpResult.success ? mvpResult.generations : [],
        chatSessions: chatResult.success ? chatResult.sessions : []
      };

      return {
        success: true,
        data: exportData,
        stats: {
          projects: exportData.projects.length,
          mvpGenerations: exportData.mvpGenerations.length,
          chatSessions: exportData.chatSessions.length
        }
      };
    } catch (error) {
      console.error('❌ Ошибка экспорта данных:', error);
      return { success: false, error: error.message };
    }
  }

  // Проверка подключения
  async checkConnection() {
    try {
      const { data, error } = await this.client.from('users').select('count').limit(1);
      
      if (error && error.code !== 'PGRST116') {
        return { 
          connected: false, 
          error: error.message,
          code: error.code 
        };
      }
      
      return { connected: true };
    } catch (error) {
      return { 
        connected: false, 
        error: error.message 
      };
    }
  }
}

// Экспорт синглтона
module.exports = new SupabaseService();