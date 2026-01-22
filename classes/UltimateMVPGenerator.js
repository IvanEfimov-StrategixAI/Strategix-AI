// classes/UltimateMVPGenerator.js - УЛЬТРА-ПРОКАЧАННЫЙ ГЕНЕРАТОР
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const gigachatService = require('../services/gigachat');

class UltimateMVPGenerator {
  constructor() {
    this.cache = new Map();
    this.professionalTemplates = this.buildProfessionalTemplates();
    this.componentLibrary = this.buildComponentLibrary();
  }

  async generateUltimateMVP(businessIdea, userRequirements = '', options = {}) {
    try {
      console.log('🚀 ULTIMATE MVP GENERATION STARTED...');
      console.log(`💡 Business Idea: ${businessIdea.substring(0, 200)}`);
      
      // Определяем тип проекта
      const projectType = this.analyzeProjectType(businessIdea);
      console.log(`📊 Project Type: ${projectType}`);
      
      // Шаг 1: Детальный анализ требований
      const requirementsAnalysis = await this.analyzeRequirements(
        businessIdea, 
        userRequirements, 
        projectType
      );
      
      // Шаг 2: Генерация через GigaChat с максимальным качеством
      const aiGeneratedHTML = await gigachatService.generateUltimateMVPContent(
        businessIdea,
        JSON.stringify({
          requirements: userRequirements,
          projectType: projectType,
          analysis: requirementsAnalysis,
          options: {
            professional: true,
            interactive: true,
            responsive: true,
            includeAlgorithms: true
          }
        })
      );
      
      // Шаг 3: Улучшение и оптимизация HTML
      const enhancedHTML = await this.enhanceAndOptimizeHTML(
        aiGeneratedHTML,
        businessIdea,
        requirementsAnalysis,
        projectType
      );
      
      // Шаг 4: Валидация и добавление недостающих компонентов
      const validatedHTML = await this.validateAndCompleteHTML(
        enhancedHTML,
        requirementsAnalysis,
        projectType
      );
      
      // Шаг 5: Создание файла
      const filename = `ultimate_mvp_${Date.now()}_${uuidv4().slice(0, 8)}.html`;
      const filepath = path.join(__dirname, '../generated', filename);
      
      await fs.ensureDir(path.join(__dirname, '../generated'));
      await fs.writeFile(filepath, validatedHTML, 'utf8');
      
      console.log(`✅ Ultimate MVP created: ${filename} (${validatedHTML.length} characters)`);
      
      // Шаг 6: Генерация документации
      const documentation = await this.generateProjectDocumentation(
        businessIdea,
        validatedHTML,
        requirementsAnalysis,
        projectType
      );
      
      return {
        success: true,
        filename: filename,
        filepath: `/generated/${filename}`,
        fullPath: filepath,
        htmlContent: validatedHTML.substring(0, 1000) + '...',
        htmlLength: validatedHTML.length,
        projectType: projectType,
        features: requirementsAnalysis.features,
        components: requirementsAnalysis.components,
        documentation: documentation,
        previewUrl: `/generated/${filename}`,
        downloadUrl: `/api/mvp/download/${filename}`,
        generatedAt: new Date().toISOString(),
        qualityScore: this.calculateQualityScore(validatedHTML, requirementsAnalysis),
        aiGenerated: true,
        enhancementLevel: 'ultimate'
      };
      
    } catch (error) {
      console.error('❌ Ultimate MVP generation failed:', error);
      
      // Fallback: Профессиональный шаблон
      return await this.generateProfessionalFallback(businessIdea, userRequirements);
    }
  }

  async analyzeRequirements(businessIdea, userRequirements, projectType) {
    try {
      const prompt = `Analyze business idea for MVP development:

IDEA: ${businessIdea}
PROJECT TYPE: ${projectType}
USER REQUIREMENTS: ${userRequirements}

Provide detailed analysis in JSON format:
{
  "core_value": "main value proposition",
  "target_users": ["user personas"],
  "key_features": [
    {
      "name": "feature name",
      "description": "detailed description",
      "complexity": "low|medium|high",
      "priority": 1-10,
      "requires_backend": boolean,
      "requires_algorithm": boolean,
      "algorithm_description": "if algorithm needed"
    }
  ],
  "user_flows": ["main user journeys"],
  "components_needed": ["list of UI components"],
  "technical_requirements": {
    "frontend": ["requirements"],
    "interactivity": ["required interactions"],
    "data_storage": ["storage needs"]
  },
  "success_metrics": ["key metrics for success"],
  "potential_challenges": ["challenges and solutions"]
}`;

      const response = await gigachatService.chat([
        {
          role: 'system',
          content: 'You are a product manager and business analyst. Provide detailed, actionable analysis.'
        },
        {
          role: 'user',
          content: prompt
        }
      ], { temperature: 0.3, maxTokens: 4000 });

      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error('JSON parse error:', e);
      }

      // Fallback analysis
      return {
        core_value: "Solve user problem efficiently",
        target_users: ["Business users", "Individuals"],
        key_features: [
          {
            name: "Core Functionality",
            description: "Main functionality of the application",
            complexity: "medium",
            priority: 10,
            requires_backend: false,
            requires_algorithm: true,
            algorithm_description: "Basic data processing"
          }
        ],
        components_needed: ["Dashboard", "Forms", "Navigation", "Data display"],
        technical_requirements: {
          frontend: ["Responsive design", "Interactive UI"],
          interactivity: ["Form validation", "Data filtering"]
        }
      };

    } catch (error) {
      console.error('Requirements analysis error:', error);
      return this.getBasicAnalysis(businessIdea, projectType);
    }
  }

  async enhanceAndOptimizeHTML(html, businessIdea, analysis, projectType) {
    console.log('✨ Enhancing and optimizing HTML...');
    
    let enhanced = html;
    
    // 1. Ensure DOCTYPE
    if (!enhanced.startsWith('<!DOCTYPE')) {
      enhanced = `<!DOCTYPE html>\n${enhanced}`;
    }
    
    // 2. Add meta tags if missing
    if (!enhanced.includes('viewport')) {
      const metaTags = `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>${businessIdea.substring(0, 60)} | Professional MVP</title>`;
      
      const headIndex = enhanced.indexOf('<head>');
      if (headIndex !== -1) {
        enhanced = enhanced.slice(0, headIndex + 6) + metaTags + enhanced.slice(headIndex + 6);
      }
    }
    
    // 3. Add professional CSS framework
    if (!enhanced.includes('font-awesome') && !enhanced.includes('fa-')) {
      const fontAwesome = `
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">`;
      
      const googleFonts = `
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">`;
      
      const headEndIndex = enhanced.indexOf('</head>');
      if (headEndIndex !== -1) {
        const additions = fontAwesome + googleFonts;
        enhanced = enhanced.slice(0, headEndIndex) + additions + enhanced.slice(headEndIndex);
      }
    }
    
    // 4. Add professional CSS if missing
    if (!enhanced.includes('<style>') || !enhanced.includes('</style>')) {
      const professionalCSS = this.generateProfessionalCSS(projectType, analysis);
      const styleTag = `
    <style>
${professionalCSS}
    </style>`;
      
      const headEndIndex = enhanced.indexOf('</head>');
      if (headEndIndex !== -1) {
        enhanced = enhanced.slice(0, headEndIndex) + styleTag + enhanced.slice(headEndIndex);
      }
    }
    
    // 5. Add interactive JavaScript
    const interactiveJS = this.generateInteractiveJavaScript(projectType, analysis);
    if (interactiveJS && !enhanced.includes(interactiveJS.substring(0, 100))) {
      const scriptTag = `
    <script>
${interactiveJS}
    </script>`;
      
      const bodyEndIndex = enhanced.indexOf('</body>');
      if (bodyEndIndex !== -1) {
        enhanced = enhanced.slice(0, bodyEndIndex) + scriptTag + enhanced.slice(bodyEndIndex);
      } else {
        enhanced += scriptTag;
      }
    }
    
    // 6. Add Chart.js for data visualization if needed
    if (analysis.key_features?.some(f => f.requires_algorithm) && !enhanced.includes('chart.js')) {
      const chartJS = `
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>`;
      
      const headEndIndex = enhanced.indexOf('</head>');
      if (headEndIndex !== -1) {
        enhanced = enhanced.slice(0, headEndIndex) + chartJS + enhanced.slice(headEndIndex);
      }
    }
    
    return enhanced;
  }

  generateProfessionalCSS(projectType, analysis) {
    const colorSchemes = {
      todo: {
        primary: '#4F46E5',
        secondary: '#10B981',
        accent: '#F59E0B',
        background: '#F9FAFB',
        text: '#1F2937'
      },
      habit: {
        primary: '#8B5CF6',
        secondary: '#EC4899',
        accent: '#3B82F6',
        background: '#FDF2F8',
        text: '#1F2937'
      },
      ecommerce: {
        primary: '#DC2626',
        secondary: '#EA580C',
        accent: '#D97706',
        background: '#FFF7ED',
        text: '#1F2937'
      },
      saas: {
        primary: '#059669',
        secondary: '#0891B2',
        accent: '#7C3AED',
        background: '#F0FDFA',
        text: '#0F172A'
      }
    };
    
    const colors = colorSchemes[projectType] || colorSchemes.todo;
    
    return `
/* ============================================
   ULTIMATE MVP GENERATOR - PROFESSIONAL CSS
   Project Type: ${projectType}
   Generated: ${new Date().toISOString()}
============================================ */

:root {
  /* Color System */
  --color-primary: ${colors.primary};
  --color-secondary: ${colors.secondary};
  --color-accent: ${colors.accent};
  --color-background: ${colors.background};
  --color-text: ${colors.text};
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-gray-50: #F9FAFB;
  --color-gray-100: #F3F4F6;
  --color-gray-200: #E5E7EB;
  --color-gray-300: #D1D5DB;
  --color-gray-400: #9CA3AF;
  --color-gray-500: #6B7280;
  --color-gray-600: #4B5563;
  --color-gray-700: #374151;
  --color-gray-800: #1F2937;
  --color-gray-900: #111827;
  
  /* Typography */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;
  
  /* Spacing */
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;
  --spacing-12: 3rem;
  --spacing-16: 4rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  
  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
  --radius-full: 9999px;
  
  /* Transitions */
  --transition-fast: 150ms ease;
  --transition: 250ms ease;
  --transition-slow: 350ms ease;
}

/* Reset & Base Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-family);
  line-height: 1.6;
  color: var(--color-text);
  background: var(--color-background);
  min-height: 100vh;
}

/* Container */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-4);
}

/* Typography */
h1, h2, h3, h4, h5, h6 {
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: var(--spacing-4);
}

h1 { font-size: var(--font-size-4xl); }
h2 { font-size: var(--font-size-3xl); }
h3 { font-size: var(--font-size-2xl); }
h4 { font-size: var(--font-size-xl); }

p {
  margin-bottom: var(--spacing-4);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3) var(--spacing-6);
  font-weight: 600;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  transition: all var(--transition);
  text-decoration: none;
  gap: var(--spacing-2);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background: color-mix(in srgb, var(--color-primary) 90%, black);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-secondary {
  background: var(--color-secondary);
  color: white;
}

.btn-outline {
  background: transparent;
  border: 2px solid var(--color-primary);
  color: var(--color-primary);
}

.btn-outline:hover {
  background: var(--color-primary);
  color: white;
}

/* Forms */
.form-group {
  margin-bottom: var(--spacing-4);
}

.form-label {
  display: block;
  margin-bottom: var(--spacing-2);
  font-weight: 500;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: var(--spacing-3);
  border: 2px solid var(--color-gray-300);
  border-radius: var(--radius);
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  transition: border-color var(--transition);
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 20%, transparent);
}

/* Cards */
.card {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-6);
  box-shadow: var(--shadow);
  transition: transform var(--transition), box-shadow var(--transition);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

/* Navigation */
.navbar {
  background: white;
  box-shadow: var(--shadow);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-4) 0;
}

.nav-logo {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-primary);
  text-decoration: none;
}

.nav-menu {
  display: flex;
  gap: var(--spacing-6);
  list-style: none;
}

.nav-link {
  color: var(--color-gray-700);
  text-decoration: none;
  font-weight: 500;
  transition: color var(--transition);
}

.nav-link:hover {
  color: var(--color-primary);
}

/* Hero Section */
.hero {
  padding: var(--spacing-16) 0;
  background: linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 10%, white), white);
}

.hero-content {
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: var(--font-size-4xl);
  margin-bottom: var(--spacing-6);
  color: var(--color-gray-900);
}

.hero-description {
  font-size: var(--font-size-xl);
  color: var(--color-gray-600);
  margin-bottom: var(--spacing-8);
}

/* Features Grid */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-8);
  padding: var(--spacing-16) 0;
}

.feature-card {
  text-align: center;
}

.feature-icon {
  width: 64px;
  height: 64px;
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--spacing-4);
  font-size: var(--font-size-2xl);
}

/* Dashboard */
.dashboard {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: var(--spacing-6);
  min-height: 600px;
}

.sidebar {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-6);
  box-shadow: var(--shadow);
}

.main-content {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-6);
  box-shadow: var(--shadow);
}

/* Data Tables */
.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background: var(--color-gray-50);
  padding: var(--spacing-3);
  text-align: left;
  font-weight: 600;
  color: var(--color-gray-700);
  border-bottom: 2px solid var(--color-gray-200);
}

.data-table td {
  padding: var(--spacing-3);
  border-bottom: 1px solid var(--color-gray-200);
}

.data-table tr:hover {
  background: var(--color-gray-50);
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    transform: translateX(-20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
}

.animate-slide-in {
  animation: slideIn 0.4s ease-out;
}

/* Responsive Design */
@media (max-width: 768px) {
  .dashboard {
    grid-template-columns: 1fr;
  }
  
  .nav-menu {
    display: none;
  }
  
  .hero-title {
    font-size: var(--font-size-3xl);
  }
  
  .container {
    padding: 0 var(--spacing-3);
  }
}

@media (max-width: 480px) {
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .hero-title {
    font-size: var(--font-size-2xl);
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}

/* Utility Classes */
.text-center { text-align: center; }
.mt-1 { margin-top: var(--spacing-1); }
.mt-2 { margin-top: var(--spacing-2); }
.mt-4 { margin-top: var(--spacing-4); }
.mt-8 { margin-top: var(--spacing-8); }
.mb-1 { margin-bottom: var(--spacing-1); }
.mb-2 { margin-bottom: var(--spacing-2); }
.mb-4 { margin-bottom: var(--spacing-4); }
.mb-8 { margin-bottom: var(--spacing-8); }
.p-4 { padding: var(--spacing-4); }
.p-8 { padding: var(--spacing-8); }
.rounded { border-radius: var(--radius); }
.rounded-lg { border-radius: var(--radius-lg); }
.shadow { box-shadow: var(--shadow); }
.shadow-lg { box-shadow: var(--shadow-lg); }
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.gap-2 { gap: var(--spacing-2); }
.gap-4 { gap: var(--spacing-4); }
.gap-8 { gap: var(--spacing-8); }
.w-full { width: 100%; }
.h-full { height: 100%; }`;
  }

  generateInteractiveJavaScript(projectType, analysis) {
    const baseJS = `
// ============================================
// ULTIMATE MVP GENERATOR - INTERACTIVE JAVASCRIPT
// Project Type: ${projectType}
// Generated: ${new Date().toISOString()}
// ============================================

class UltimateMVPApp {
  constructor() {
    this.state = {
      user: null,
      data: {},
      settings: {},
      notifications: []
    };
    
    this.init();
  }
  
  init() {
    console.log('🚀 Ultimate MVP App initialized');
    
    // Initialize components
    this.initEventListeners();
    this.loadData();
    this.setupRealTimeUpdates();
    this.initAnimations();
    
    // Show welcome message
    this.showNotification('🚀 App loaded successfully!', 'success');
  }
  
  initEventListeners() {
    // Form submissions
    document.querySelectorAll('form').forEach(form => {
      form.addEventListener('submit', this.handleFormSubmit.bind(this));
    });
    
    // Button clicks
    document.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('click', this.handleButtonClick.bind(this));
    });
    
    // Modal handling
    document.querySelectorAll('[data-modal]').forEach(trigger => {
      trigger.addEventListener('click', this.toggleModal.bind(this));
    });
    
    // Tab switching
    document.querySelectorAll('[data-tab]').forEach(tab => {
      tab.addEventListener('click', this.switchTab.bind(this));
    });
    
    // Dropdowns
    document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
      toggle.addEventListener('click', this.toggleDropdown.bind(this));
    });
  }
  
  handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Form validation
    if (this.validateForm(form, data)) {
      this.processFormData(form, data);
      this.showNotification('✅ Form submitted successfully!', 'success');
      form.reset();
    } else {
      this.showNotification('⚠️ Please check the form for errors', 'error');
    }
  }
  
  validateForm(form, data) {
    let isValid = true;
    
    // Check required fields
    form.querySelectorAll('[required]').forEach(field => {
      if (!field.value.trim()) {
        this.markFieldInvalid(field, 'This field is required');
        isValid = false;
      } else {
        this.markFieldValid(field);
      }
    });
    
    // Email validation
    form.querySelectorAll('input[type="email"]').forEach(field => {
      const email = field.value.trim();
      if (email && !this.isValidEmail(email)) {
        this.markFieldInvalid(field, 'Please enter a valid email');
        isValid = false;
      }
    });
    
    return isValid;
  }
  
  isValidEmail(email) {
    return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
  }
  
  markFieldInvalid(field, message) {
    field.style.borderColor = 'var(--color-error)';
    
    // Add error message
    let errorElement = field.nextElementSibling;
    if (!errorElement || !errorElement.classList.contains('error-message')) {
      errorElement = document.createElement('div');
      errorElement.className = 'error-message';
      errorElement.style.color = 'var(--color-error)';
      errorElement.style.fontSize = 'var(--font-size-sm)';
      errorElement.style.marginTop = 'var(--spacing-1)';
      field.parentNode.insertBefore(errorElement, field.nextSibling);
    }
    errorElement.textContent = message;
  }
  
  markFieldValid(field) {
    field.style.borderColor = 'var(--color-success)';
    
    // Remove error message
    const errorElement = field.nextElementSibling;
    if (errorElement && errorElement.classList.contains('error-message')) {
      errorElement.remove();
    }
  }
  
  processFormData(form, data) {
    console.log('Processing form data:', data);
    
    // Store in localStorage for persistence
    const forms = JSON.parse(localStorage.getItem('formSubmissions') || '[]');
    forms.push({
      formId: form.id || 'anonymous',
      data: data,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('formSubmissions', JSON.stringify(forms));
    
    // Trigger custom event
    const event = new CustomEvent('formSubmitted', { detail: data });
    document.dispatchEvent(event);
  }
  
  handleButtonClick(e) {
    const button = e.target.closest('.btn');
    if (!button) return;
    
    const action = button.dataset.action;
    
    switch(action) {
      case 'add-item':
        this.addItem();
        break;
      case 'remove-item':
        this.removeItem(button.dataset.id);
        break;
      case 'toggle-item':
        this.toggleItem(button.dataset.id);
        break;
      case 'filter':
        this.filterItems(button.dataset.filter);
        break;
      case 'sort':
        this.sortItems(button.dataset.sort);
        break;
      case 'export':
        this.exportData();
        break;
      case 'import':
        this.importData();
        break;
      default:
        // Default button behavior
        break;
    }
  }
  
  addItem() {
    // Implementation depends on project type
    console.log('Adding new item...');
    
    // Example for todo app
    const newItem = {
      id: Date.now(),
      title: 'New Task',
      description: 'Task description',
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    this.showNotification('➕ New item added', 'info');
  }
  
  toggleItem(id) {
    console.log(\`Toggling item \${id}\`);
    // Implementation for toggling item status
  }
  
  filterItems(filter) {
    console.log(\`Filtering by \${filter}\`);
    // Implementation for filtering items
  }
  
  sortItems(sortBy) {
    console.log(\`Sorting by \${sortBy}\`);
    // Implementation for sorting items
  }
  
  toggleModal(e) {
    const modalId = e.target.dataset.modal;
    const modal = document.getElementById(modalId);
    
    if (modal) {
      modal.classList.toggle('active');
      
      // Add backdrop
      if (modal.classList.contains('active')) {
        this.createModalBackdrop(modal);
      }
    }
  }
  
  createModalBackdrop(modal) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.style.cssText = \`
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999;
    \`;
    
    backdrop.addEventListener('click', () => {
      modal.classList.remove('active');
      backdrop.remove();
    });
    
    document.body.appendChild(backdrop);
  }
  
  switchTab(e) {
    const tabId = e.target.dataset.tab;
    const allTabs = document.querySelectorAll('[data-tab]');
    const allPanes = document.querySelectorAll('.tab-pane');
    
    // Update active tab
    allTabs.forEach(tab => tab.classList.remove('active'));
    e.target.classList.add('active');
    
    // Show corresponding pane
    allPanes.forEach(pane => pane.classList.remove('active'));
    const activePane = document.getElementById(tabId);
    if (activePane) {
      activePane.classList.add('active');
    }
  }
  
  toggleDropdown(e) {
    const dropdown = e.target.closest('.dropdown');
    dropdown.classList.toggle('open');
  }
  
  loadData() {
    // Load from localStorage
    const savedData = localStorage.getItem('appData');
    if (savedData) {
      try {
        this.state.data = JSON.parse(savedData);
        console.log('📊 Data loaded from localStorage');
      } catch (error) {
        console.error('Error loading data:', error);
      }
    }
  }
  
  saveData() {
    localStorage.setItem('appData', JSON.stringify(this.state.data));
    console.log('💾 Data saved to localStorage');
  }
  
  setupRealTimeUpdates() {
    // Simulate real-time updates
    setInterval(() => {
      this.updateLiveData();
    }, 30000); // Every 30 seconds
  }
  
  updateLiveData() {
    // Update counters, timestamps, etc.
    console.log('🔄 Updating live data...');
    
    // Trigger data update event
    const event = new CustomEvent('dataUpdated', { detail: this.state.data });
    document.dispatchEvent(event);
  }
  
  initAnimations() {
    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in');
        }
      });
    }, { threshold: 0.1 });
    
    // Observe elements for animation
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      observer.observe(el);
    });
  }
  
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = \`notification notification-\${type}\`;
    notification.innerHTML = \`
      <i class="fas \${this.getNotificationIcon(type)}"></i>
      <span>\${message}</span>
      <button class="notification-close">&times;</button>
    \`;
    
    notification.style.cssText = \`
      position: fixed;
      top: 20px;
      right: 20px;
      background: \${this.getNotificationColor(type)};
      color: white;
      padding: var(--spacing-3) var(--spacing-4);
      border-radius: var(--radius);
      box-shadow: var(--shadow-lg);
      display: flex;
      align-items: center;
      gap: var(--spacing-3);
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
      max-width: 400px;
    \`;
    
    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.style.animation = 'slideOut 0.3s ease-in forwards';
      setTimeout(() => notification.remove(), 300);
    });
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => notification.remove(), 300);
      }
    }, 5000);
  }
  
  getNotificationIcon(type) {
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };
    return icons[type] || 'fa-info-circle';
  }
  
  getNotificationColor(type) {
    const colors = {
      success: 'var(--color-success)',
      error: 'var(--color-error)',
      warning: 'var(--color-warning)',
      info: 'var(--color-primary)'
    };
    return colors[type] || 'var(--color-primary)';
  }
  
  exportData() {
    const dataStr = JSON.stringify(this.state.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = \`mvp-data-\${new Date().toISOString().slice(0, 10)}.json\`;
    link.click();
    
    URL.revokeObjectURL(url);
    this.showNotification('📥 Data exported successfully!', 'success');
  }
  
  importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            this.state.data = JSON.parse(event.target.result);
            this.saveData();
            this.showNotification('📤 Data imported successfully!', 'success');
            
            // Trigger refresh
            const refreshEvent = new CustomEvent('dataImported', { detail: this.state.data });
            document.dispatchEvent(refreshEvent);
          } catch (error) {
            this.showNotification('❌ Error importing data', 'error');
          }
        };
        reader.readAsText(file);
      }
    };
    
    input.click();
  }
  
  // Algorithm implementations based on project type
  ${this.generateProjectSpecificAlgorithms(projectType, analysis)}
}

// Additional CSS for animations
const animationStyles = document.createElement('style');
animationStyles.textContent = \`
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
  
  .modal {
    display: none;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: var(--spacing-8);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-xl);
    z-index: 1000;
    max-width: 500px;
    width: 90%;
  }
  
  .modal.active {
    display: block;
  }
  
  .dropdown {
    position: relative;
  }
  
  .dropdown-menu {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    background: white;
    box-shadow: var(--shadow-lg);
    border-radius: var(--radius);
    min-width: 200px;
    z-index: 100;
  }
  
  .dropdown.open .dropdown-menu {
    display: block;
  }
  
  .tab-pane {
    display: none;
  }
  
  .tab-pane.active {
    display: block;
  }
\`;
document.head.appendChild(animationStyles);

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new UltimateMVPApp();
});

// Global utility functions
window.Utils = {
  formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },
  
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  },
  
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};`;

    // Add project-specific algorithms
    return baseJS + this.generateProjectSpecificAlgorithms(projectType, analysis);
  }

  generateProjectSpecificAlgorithms(projectType, analysis) {
    const algorithms = {
      todo: `
  // Todo-specific algorithms
  calculateProductivityStats(tasks) {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    
    return {
      total,
      completed,
      pending,
      completionRate: completionRate.toFixed(1),
      streak: this.calculateStreak(tasks),
      productivityScore: this.calculateProductivityScore(tasks)
    };
  },
  
  calculateStreak(tasks) {
    // Calculate current streak of consecutive days with completed tasks
    const today = new Date().toDateString();
    const completedDates = tasks
      .filter(t => t.completed)
      .map(t => new Date(t.completedAt).toDateString())
      .filter(date => date <= today);
    
    let streak = 0;
    const uniqueDates = [...new Set(completedDates)].sort((a, b) => new Date(b) - new Date(a));
    
    for (let i = 0; i < uniqueDates.length; i++) {
      const currentDate = new Date(uniqueDates[i]);
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      
      if (currentDate.toDateString() === expectedDate.toDateString()) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  },
  
  calculateProductivityScore(tasks) {
    const weights = {
      completion: 0.4,
      timeliness: 0.3,
      consistency: 0.3
    };
    
    let score = 0;
    
    // Completion score
    const completionRate = tasks.filter(t => t.completed).length / tasks.length;
    score += completionRate * weights.completion;
    
    // Timeliness score (tasks completed before deadline)
    const timelyTasks = tasks.filter(t => {
      if (!t.dueDate || !t.completedAt) return false;
      return new Date(t.completedAt) <= new Date(t.dueDate);
    });
    const timelinessRate = timelyTasks.length / tasks.filter(t => t.dueDate).length || 0;
    score += timelinessRate * weights.timeliness;
    
    // Consistency score (based on streak)
    const streak = this.calculateStreak(tasks);
    const consistencyScore = Math.min(streak / 30, 1); // Max 30 days
    score += consistencyScore * weights.consistency;
    
    return Math.round(score * 100);
  }`,
      
      habit: `
  // Habit tracker algorithms
  calculateHabitStats(habits) {
    const stats = {
      totalHabits: habits.length,
      activeHabits: habits.filter(h => h.active).length,
      totalCompletions: habits.reduce((sum, h) => sum + (h.completions || 0), 0),
      successRate: 0,
      currentStreak: 0,
      bestStreak: 0
    };
    
    // Calculate success rate
    const today = new Date().toDateString();
    const completedToday = habits.filter(h => 
      h.lastCompleted && new Date(h.lastCompleted).toDateString() === today
    ).length;
    
    stats.successRate = habits.length > 0 ? 
      Math.round((completedToday / habits.length) * 100) : 0;
    
    // Calculate streaks
    habits.forEach(habit => {
      stats.currentStreak = Math.max(stats.currentStreak, habit.currentStreak || 0);
      stats.bestStreak = Math.max(stats.bestStreak, habit.bestStreak || 0);
    });
    
    return stats;
  },
  
  predictHabitSuccess(habit) {
    // Simple prediction algorithm based on historical data
    const completionRate = habit.completions / (habit.daysTracked || 1);
    const consistencyScore = habit.currentStreak / (habit.bestStreak || 1);
    
    let prediction = 'Beginner';
    let confidence = completionRate * consistencyScore * 100;
    
    if (confidence > 80) prediction = 'Expert';
    else if (confidence > 60) prediction = 'Advanced';
    else if (confidence > 40) prediction = 'Intermediate';
    else if (confidence > 20) prediction = 'Beginner';
    else prediction = 'New';
    
    return {
      level: prediction,
      confidence: Math.round(confidence),
      nextMilestone: this.calculateNextMilestone(habit)
    };
  },
  
  calculateNextMilestone(habit) {
    const milestones = [3, 7, 21, 30, 60, 90, 180, 365];
    const current = habit.currentStreak || 0;
    
    const next = milestones.find(m => m > current);
    return next ? {
      daysToGo: next - current,
      milestone: next,
      percentage: Math.round((current / next) * 100)
    } : null;
  }`,
      
      ecommerce: `
  // E-commerce algorithms
  calculateCartTotal(items) {
    return items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  },
  
  calculateShipping(cartTotal, address) {
    const baseRate = 5.99;
    const freeThreshold = 50;
    
    if (cartTotal >= freeThreshold) {
      return 0;
    }
    
    // Simple distance-based calculation
    let multiplier = 1;
    if (address?.country !== 'US') multiplier = 2;
    if (address?.express) multiplier *= 1.5;
    
    return baseRate * multiplier;
  },
  
  recommendProducts(cartItems, allProducts) {
    // Simple recommendation algorithm
    const categories = [...new Set(cartItems.map(item => item.category))];
    
    return allProducts
      .filter(product => 
        !cartItems.some(item => item.id === product.id) &&
        categories.includes(product.category)
      )
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 4);
  },
  
  calculateDiscount(cartTotal, promoCode) {
    const discounts = {
      'WELCOME10': 0.1,
      'SAVE20': 0.2,
      'FREESHIP': 'freeShipping'
    };
    
    const discount = discounts[promoCode];
    if (!discount) return 0;
    
    if (discount === 'freeShipping') {
      return 'freeShipping';
    }
    
    return cartTotal * discount;
  }`
    };
    
    return algorithms[projectType] || `
  // General business algorithms
  calculateKPIs(data) {
    return {
      users: data.users?.length || 0,
      activeUsers: data.users?.filter(u => u.active).length || 0,
      conversionRate: 0,
      revenue: 0,
      growth: 0
    };
  }`;
  }

  async validateAndCompleteHTML(html, analysis, projectType) {
    // Проверяем наличие ключевых элементов
    const checks = {
      hasDoctype: html.includes('<!DOCTYPE'),
      hasHtmlTag: html.includes('<html'),
      hasHead: html.includes('<head>'),
      hasBody: html.includes('<body>'),
      hasTitle: html.includes('<title>'),
      hasViewport: html.includes('viewport'),
      hasStyles: html.includes('<style>') || html.includes('</style>'),
      hasScripts: html.includes('<script>'),
      hasMainContent: (html.match(/<main>|<div.*class=.*container|<div.*id=.*app/gi) || []).length > 0,
      hasNavigation: html.includes('<nav>') || html.includes('navbar') || html.includes('navigation'),
      hasFooter: html.includes('<footer>'),
      isResponsive: html.includes('@media') || html.includes('max-width'),
      hasInteractivity: html.includes('addEventListener') || html.includes('onclick'),
      hasForms: html.includes('<form>'),
      hasButtons: (html.match(/<button|class=.*btn/gi) || []).length > 0
    };
    
    const missing = Object.entries(checks).filter(([_, value]) => !value).map(([key]) => key);
    
    if (missing.length > 0) {
      console.log(`⚠️ Missing elements: ${missing.join(', ')}`);
      
      // Добавляем недостающие элементы
      return await this.addMissingElements(html, missing, analysis, projectType);
    }
    
    return html;
  }

  async addMissingElements(html, missing, analysis, projectType) {
    let enhanced = html;
    
    for (const element of missing) {
      switch(element) {
        case 'hasNavigation':
          const nav = this.generateNavigation(analysis, projectType);
          const bodyStart = enhanced.indexOf('<body>');
          if (bodyStart !== -1) {
            enhanced = enhanced.slice(0, bodyStart + 6) + nav + enhanced.slice(bodyStart + 6);
          }
          break;
          
        case 'hasFooter':
          const footer = this.generateFooter(analysis, projectType);
          const bodyEnd = enhanced.lastIndexOf('</body>');
          if (bodyEnd !== -1) {
            enhanced = enhanced.slice(0, bodyEnd) + footer + enhanced.slice(bodyEnd);
          }
          break;
          
        case 'isResponsive':
          if (!enhanced.includes('@media')) {
            const responsiveCSS = this.generateResponsiveCSS();
            const styleEnd = enhanced.lastIndexOf('</style>');
            if (styleEnd !== -1) {
              enhanced = enhanced.slice(0, styleEnd) + responsiveCSS + enhanced.slice(styleEnd);
            }
          }
          break;
      }
    }
    
    return enhanced;
  }

  generateNavigation(analysis, projectType) {
    return `
    <!-- Professional Navigation -->
    <nav class="navbar">
      <div class="container nav-container">
        <a href="/" class="nav-logo">
          <i class="fas fa-rocket"></i>
          ${analysis.core_value?.substring(0, 20) || 'MVP Platform'}
        </a>
        
        <ul class="nav-menu">
          <li><a href="#features" class="nav-link">Features</a></li>
          <li><a href="#dashboard" class="nav-link">Dashboard</a></li>
          <li><a href="#analytics" class="nav-link">Analytics</a></li>
          <li><a href="#settings" class="nav-link">Settings</a></li>
          <li>
            <button class="btn btn-primary">
              <i class="fas fa-user"></i> Get Started
            </button>
          </li>
        </ul>
        
        <button class="mobile-menu-toggle" style="display: none;">
          <i class="fas fa-bars"></i>
        </button>
      </div>
    </nav>`;
  }

  generateFooter(analysis, projectType) {
    return `
    <!-- Professional Footer -->
    <footer class="footer" style="background: var(--color-gray-900); color: white; padding: var(--spacing-12) 0;">
      <div class="container">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--spacing-8);">
          <div>
            <h3 style="color: white; margin-bottom: var(--spacing-4);">
              <i class="fas fa-rocket"></i> ${analysis.core_value?.substring(0, 20) || 'MVP Platform'}
            </h3>
            <p style="color: var(--color-gray-400);">
              Professional MVP generated with Ultimate MVP Generator
            </p>
          </div>
          
          <div>
            <h4 style="color: white; margin-bottom: var(--spacing-4);">Features</h4>
            <ul style="list-style: none; color: var(--color-gray-400);">
              ${analysis.key_features?.slice(0, 3).map(f => 
                `<li style="margin-bottom: var(--spacing-2);">
                  <i class="fas fa-check" style="color: var(--color-success); margin-right: var(--spacing-2);"></i>
                  ${f.name}
                </li>`
              ).join('') || '<li>Professional Design</li><li>Interactive Features</li><li>Responsive Layout</li>'}
            </ul>
          </div>
          
          <div>
            <h4 style="color: white; margin-bottom: var(--spacing-4);">Contact</h4>
            <div style="color: var(--color-gray-400);">
              <p style="margin-bottom: var(--spacing-2);">
                <i class="fas fa-envelope" style="margin-right: var(--spacing-2);"></i>
                support@mvpplatform.com
              </p>
              <p>
                <i class="fas fa-globe" style="margin-right: var(--spacing-2);"></i>
                Generated with Ultimate MVP Generator
              </p>
            </div>
          </div>
        </div>
        
        <div style="border-top: 1px solid var(--color-gray-800); margin-top: var(--spacing-8); padding-top: var(--spacing-8); text-align: center; color: var(--color-gray-500);">
          <p>© ${new Date().getFullYear()} ${analysis.core_value?.substring(0, 20) || 'MVP Platform'}. All rights reserved.</p>
          <p style="font-size: var(--font-size-sm); margin-top: var(--spacing-2);">
            Generated on ${new Date().toLocaleDateString()} with Ultimate MVP Generator v8.0
          </p>
        </div>
      </div>
    </footer>`;
  }

  generateResponsiveCSS() {
    return `
/* Responsive Design */
@media (max-width: 1024px) {
  .container {
    max-width: 90%;
  }
  
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .nav-menu {
    display: none;
  }
  
  .mobile-menu-toggle {
    display: block !important;
    background: none;
    border: none;
    color: var(--color-gray-700);
    font-size: var(--font-size-2xl);
    cursor: pointer;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .dashboard {
    grid-template-columns: 1fr;
  }
  
  .hero-title {
    font-size: var(--font-size-2xl);
  }
  
  .hero-description {
    font-size: var(--font-size-base);
  }
}

@media (max-width: 480px) {
  .container {
    padding: 0 var(--spacing-2);
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
  
  .card {
    padding: var(--spacing-4);
  }
}`;
  }

  async generateProfessionalFallback(businessIdea, requirements) {
    console.log('🔄 Using professional fallback template...');
    
    const projectType = this.analyzeProjectType(businessIdea);
    const analysis = this.getBasicAnalysis(businessIdea, projectType);
    
    // Генерируем профессиональный HTML шаблон
    const html = this.generateProfessionalTemplate(businessIdea, projectType, analysis);
    
    const filename = `professional_mvp_${Date.now()}_${uuidv4().slice(0, 8)}.html`;
    const filepath = path.join(__dirname, '../generated', filename);
    
    await fs.ensureDir(path.join(__dirname, '../generated'));
    await fs.writeFile(filepath, html, 'utf8');
    
    return {
      success: true,
      filename: filename,
      filepath: `/generated/${filename}`,
      htmlLength: html.length,
      projectType: projectType,
      features: analysis.key_features,
      previewUrl: `/generated/${filename}`,
      downloadUrl: `/api/mvp/download/${filename}`,
      generatedAt: new Date().toISOString(),
      qualityScore: 85,
      fallback: true,
      message: 'Professional template generated (AI temporarily unavailable)'
    };
  }

  generateProfessionalTemplate(businessIdea, projectType, analysis) {
    // Полный профессиональный HTML шаблон
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>${businessIdea.substring(0, 60)} | Professional MVP</title>
    
    <!-- Fonts & Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <style>
        ${this.generateProfessionalCSS(projectType, analysis)}
    </style>
</head>
<body>
    ${this.generateNavigation(analysis, projectType)}
    
    <!-- Hero Section -->
    <section class="hero">
        <div class="container">
            <div class="hero-content animate-fade-in">
                <h1 class="hero-title">${businessIdea.substring(0, 100)}</h1>
                <p class="hero-description">
                    Professional MVP with interactive features, real algorithms, and responsive design.
                    Generated with Ultimate MVP Generator.
                </p>
                <div style="display: flex; gap: var(--spacing-4); justify-content: center; flex-wrap: wrap;">
                    <button class="btn btn-primary" data-action="get-started">
                        <i class="fas fa-play"></i> Get Started
                    </button>
                    <button class="btn btn-outline" data-action="learn-more">
                        <i class="fas fa-book"></i> Learn More
                    </button>
                </div>
            </div>
        </div>
    </section>
    
    <!-- Features -->
    <section id="features" class="features" style="padding: var(--spacing-16) 0; background: white;">
        <div class="container">
            <h2 style="text-align: center; margin-bottom: var(--spacing-12);">Core Features</h2>
            <div class="features-grid">
                ${analysis.key_features?.map((feature, index) => `
                <div class="card feature-card animate-on-scroll" style="animation-delay: ${index * 0.1}s;">
                    <div class="feature-icon">
                        <i class="fas ${this.getFeatureIcon(feature.name)}"></i>
                    </div>
                    <h3>${feature.name}</h3>
                    <p>${feature.description}</p>
                    <div style="margin-top: var(--spacing-4);">
                        <span class="tag" style="background: var(--color-gray-100); padding: var(--spacing-1) var(--spacing-3); border-radius: var(--radius-full); font-size: var(--font-size-sm);">
                            ${feature.complexity} complexity
                        </span>
                    </div>
                </div>
                `).join('') || `
                <div class="card feature-card">
                    <div class="feature-icon">
                        <i class="fas fa-bolt"></i>
                    </div>
                    <h3>Fast Performance</h3>
                    <p>Optimized for speed and efficiency</p>
                </div>
                <div class="card feature-card">
                    <div class="feature-icon">
                        <i class="fas fa-mobile-alt"></i>
                    </div>
                    <h3>Responsive Design</h3>
                    <p>Works perfectly on all devices</p>
                </div>
                <div class="card feature-card">
                    <div class="feature-icon">
                        <i class="fas fa-code"></i>
                    </div>
                    <h3>Clean Code</h3>
                    <p>Well-structured and maintainable</p>
                </div>
                `}
            </div>
        </div>
    </section>
    
    <!-- Dashboard -->
    <section id="dashboard" class="dashboard-section" style="padding: var(--spacing-16) 0; background: var(--color-gray-50);">
        <div class="container">
            <h2 style="text-align: center; margin-bottom: var(--spacing-12);">Interactive Dashboard</h2>
            <div class="dashboard">
                <div class="sidebar">
                    <h3 style="margin-bottom: var(--spacing-6);">Menu</h3>
                    <ul style="list-style: none;">
                        <li style="margin-bottom: var(--spacing-3);">
                            <a href="#" class="nav-link" style="display: flex; align-items: center; gap: var(--spacing-3);">
                                <i class="fas fa-home"></i> Dashboard
                            </a>
                        </li>
                        <li style="margin-bottom: var(--spacing-3);">
                            <a href="#" class="nav-link" style="display: flex; align-items: center; gap: var(--spacing-3);">
                                <i class="fas fa-chart-bar"></i> Analytics
                            </a>
                        </li>
                        <li style="margin-bottom: var(--spacing-3);">
                            <a href="#" class="nav-link" style="display: flex; align-items: center; gap: var(--spacing-3);">
                                <i class="fas fa-cog"></i> Settings
                            </a>
                        </li>
                    </ul>
                </div>
                
                <div class="main-content">
                    <h3 style="margin-bottom: var(--spacing-6);">Welcome to Your Dashboard</h3>
                    
                    <!-- Stats Cards -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-4); margin-bottom: var(--spacing-8);">
                        <div class="card" style="text-align: center;">
                            <div style="font-size: var(--font-size-3xl); font-weight: 700; color: var(--color-primary);">
                                0
                            </div>
                            <div style="color: var(--color-gray-600);">Total Items</div>
                        </div>
                        <div class="card" style="text-align: center;">
                            <div style="font-size: var(--font-size-3xl); font-weight: 700; color: var(--color-success);">
                                0
                            </div>
                            <div style="color: var(--color-gray-600);">Completed</div>
                        </div>
                        <div class="card" style="text-align: center;">
                            <div style="font-size: var(--font-size-3xl); font-weight: 700; color: var(--color-warning);">
                                0
                            </div>
                            <div style="color: var(--color-gray-600);">In Progress</div>
                        </div>
                    </div>
                    
                    <!-- Data Table -->
                    <div class="card">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-6);">
                            <h4>Recent Activity</h4>
                            <button class="btn btn-primary" data-action="add-item">
                                <i class="fas fa-plus"></i> Add New
                            </button>
                        </div>
                        
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="activity-table">
                                <tr>
                                    <td colspan="4" style="text-align: center; padding: var(--spacing-8); color: var(--color-gray-500);">
                                        No data yet. Add your first item!
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Form -->
                    <div class="card" style="margin-top: var(--spacing-8);">
                        <h4 style="margin-bottom: var(--spacing-6);">Add New Item</h4>
                        <form id="add-item-form">
                            <div class="form-group">
                                <label class="form-label" for="item-name">Item Name</label>
                                <input type="text" id="item-name" class="form-input" placeholder="Enter item name" required>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label" for="item-description">Description</label>
                                <textarea id="item-description" class="form-textarea" placeholder="Enter description" rows="3"></textarea>
                            </div>
                            
                            <div style="display: flex; gap: var(--spacing-4);">
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-save"></i> Save Item
                                </button>
                                <button type="reset" class="btn btn-outline">
                                    <i class="fas fa-times"></i> Clear
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </section>
    
    ${this.generateFooter(analysis, projectType)}
    
    <script>
        ${this.generateInteractiveJavaScript(projectType, analysis)}
    </script>
</body>
</html>`;
  }

  getFeatureIcon(featureName) {
    const icons = {
      dashboard: 'fa-tachometer-alt',
      analytics: 'fa-chart-bar',
      settings: 'fa-cog',
      forms: 'fa-edit',
      notifications: 'fa-bell',
      user: 'fa-user',
      security: 'fa-shield-alt',
      performance: 'fa-bolt',
      mobile: 'fa-mobile-alt',
      cloud: 'fa-cloud',
      database: 'fa-database',
      api: 'fa-code',
      payment: 'fa-credit-card',
      messaging: 'fa-comments',
      file: 'fa-file'
    };
    
    const lowerName = featureName.toLowerCase();
    for (const [key, icon] of Object.entries(icons)) {
      if (lowerName.includes(key)) return icon;
    }
    
    return 'fa-star';
  }

  analyzeProjectType(businessIdea) {
    const lower = businessIdea.toLowerCase();
    
    if (lower.includes('todo') || lower.includes('task') || lower.includes('to-do')) return 'todo';
    if (lower.includes('habit') || lower.includes('tracker') || lower.includes('routine')) return 'habit';
    if (lower.includes('shop') || lower.includes('store') || lower.includes('ecommerce') || lower.includes('product')) return 'ecommerce';
    if (lower.includes('social') || lower.includes('network') || lower.includes('community')) return 'social';
    if (lower.includes('saas') || lower.includes('software') || lower.includes('platform') || lower.includes('service')) return 'saas';
    if (lower.includes('finance') || lower.includes('money') || lower.includes('budget')) return 'finance';
    if (lower.includes('health') || lower.includes('fitness') || lower.includes('wellness')) return 'health';
    if (lower.includes('learning') || lower.includes('education') || lower.includes('course')) return 'learning';
    
    return 'business';
  }

  getBasicAnalysis(businessIdea, projectType) {
    return {
      core_value: businessIdea.substring(0, 100),
      target_users: ["Business Users", "Individuals"],
      key_features: [
        {
          name: "Interactive Dashboard",
          description: "Real-time data visualization and management",
          complexity: "medium",
          priority: 10,
          requires_backend: false,
          requires_algorithm: true
        },
        {
          name: "Form Management",
          description: "Create, edit, and manage forms with validation",
          complexity: "low",
          priority: 8,
          requires_backend: false,
          requires_algorithm: true
        },
        {
          name: "Data Analytics",
          description: "Track and analyze user data and metrics",
          complexity: "medium",
          priority: 7,
          requires_backend: false,
          requires_algorithm: true
        }
      ],
      components_needed: ["Dashboard", "Forms", "Charts", "Tables", "Navigation"],
      technical_requirements: {
        frontend: ["Responsive Design", "Interactive UI", "Data Visualization"],
        interactivity: ["Form Validation", "Real-time Updates", "Data Filtering"]
      }
    };
  }

  calculateQualityScore(html, analysis) {
    let score = 70; // Base score
    
    // Length bonus
    if (html.length > 5000) score += 10;
    if (html.length > 10000) score += 10;
    
    // Feature coverage
    const featureCount = analysis.key_features?.length || 0;
    score += Math.min(featureCount * 3, 15);
    
    // Technology usage
    if (html.includes('localStorage')) score += 5;
    if (html.includes('addEventListener')) score += 5;
    if (html.includes('@media')) score += 5;
    if (html.includes('chart.js') || html.includes('Chart')) score += 5;
    
    // Code quality
    if (html.includes('/*')) score += 5; // Has comments
    if (html.includes(':root')) score += 5; // Uses CSS variables
    
    return Math.min(score, 100);
  }

  async generateProjectDocumentation(businessIdea, html, analysis, projectType) {
    return {
      projectName: businessIdea.substring(0, 100),
      projectType: projectType,
      htmlSize: `${(html.length / 1024).toFixed(2)} KB`,
      featuresImplemented: analysis.key_features?.length || 0,
      hasResponsiveDesign: html.includes('@media'),
      hasJavaScript: html.includes('<script>'),
      hasCSS: html.includes('<style>'),
      hasForms: html.includes('<form>'),
      hasCharts: html.includes('chart') || html.includes('Chart'),
      technologies: this.extractTechnologies(html),
      generatedAt: new Date().toISOString(),
      generatorVersion: '8.0.0'
    };
  }

  extractTechnologies(html) {
    const tech = ['HTML5'];
    if (html.includes('flex') || html.includes('grid')) tech.push('CSS Flexbox/Grid');
    if (html.includes('var(')) tech.push('CSS Variables');
    if (html.includes('addEventListener')) tech.push('JavaScript ES6+');
    if (html.includes('localStorage')) tech.push('Web Storage API');
    if (html.includes('Chart')) tech.push('Chart.js');
    if (html.includes('fa-')) tech.push('Font Awesome');
    if (html.includes('googleapis.com/fonts')) tech.push('Google Fonts');
    if (html.includes('IntersectionObserver')) tech.push('Intersection Observer API');
    if (html.includes('FormData')) tech.push('FormData API');
    if (html.includes('CustomEvent')) tech.push('Custom Events');
    
    return tech;
  }

  buildProfessionalTemplates() {
    return {
      todo: this.getTodoTemplate(),
      habit: this.getHabitTemplate(),
      ecommerce: this.getEcommerceTemplate(),
      saas: this.getSaaSTemplate(),
      social: this.getSocialTemplate(),
      finance: this.getFinanceTemplate()
    };
  }

  buildComponentLibrary() {
    return {
      buttons: this.getButtonComponents(),
      forms: this.getFormComponents(),
      cards: this.getCardComponents(),
      tables: this.getTableComponents(),
      navigation: this.getNavigationComponents(),
      modals: this.getModalComponents(),
      charts: this.getChartComponents()
    };
  }

  getTodoTemplate() {
    return {
      name: "Professional Todo App",
      description: "Advanced task management with analytics",
      features: ["Task CRUD", "Categories & Tags", "Due Dates", "Priorities", "Search & Filter", "Statistics", "Progress Tracking", "Drag & Drop"],
      technologies: ["HTML5", "CSS3", "JavaScript ES6+", "localStorage", "Chart.js"],
      components: ["Task List", "Task Form", "Category Sidebar", "Statistics Dashboard", "Calendar View"]
    };
  }

  getHabitTemplate() {
    return {
      name: "Habit Tracker Pro",
      description: "Advanced habit formation and tracking",
      features: ["Daily Tracking", "Streak Counter", "Progress Charts", "Reminders", "Goal Setting", "Milestones", "Motivational Messages", "Data Export"],
      technologies: ["HTML5", "CSS3", "JavaScript ES6+", "localStorage", "Chart.js", "Date APIs"],
      components: ["Habit Grid", "Calendar View", "Statistics Dashboard", "Goal Setting", "Progress Charts"]
    };
  }

  getEcommerceTemplate() {
    return {
      name: "E-commerce MVP",
      description: "Complete online storefront",
      features: ["Product Catalog", "Shopping Cart", "Checkout Process", "Product Filters", "Reviews & Ratings", "Order Tracking", "Payment Simulation", "Admin Panel"],
      technologies: ["HTML5", "CSS3", "JavaScript ES6+", "localStorage", "Form Validation", "Mock API"],
      components: ["Product Grid", "Product Details", "Shopping Cart", "Checkout Form", "Order Summary"]
    };
  }

  // ... остальные методы для других шаблонов
}

module.exports = UltimateMVPGenerator;