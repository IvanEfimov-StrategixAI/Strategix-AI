// controllers/mvpController.js
const UltimateMVPGenerator = require('../classes/UltimateMVPGenerator');
const path = require('path');
const fs = require('fs-extra');

class MVPController {
  constructor() {
    this.generator = new UltimateMVPGenerator();
  }

  async generateMVP(req, res) {
    try {
      const { businessIdea, requirements, options = {} } = req.body;
      
      if (!businessIdea) {
        return res.status(400).json({
          success: false,
          error: 'businessIdea is required'
        });
      }

      console.log('🚀 Generating ULTIMATE MVP for:', businessIdea.substring(0, 100));
      
      const result = await this.generator.generateUltimateMVP(
        businessIdea,
        requirements || '',
        options
      );

      res.json(result);

    } catch (error) {
      console.error('❌ MVP generation error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to generate MVP'
      });
    }
  }

  async downloadMVP(req, res) {
    try {
      const { filename } = req.params;
      const filepath = path.join(__dirname, '../generated', filename);
      
      if (!fs.existsSync(filepath)) {
        return res.status(404).json({
          success: false,
          error: 'File not found'
        });
      }

      res.download(filepath, filename);

    } catch (error) {
      console.error('❌ Download error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async viewMVP(req, res) {
    try {
      const { filename } = req.params;
      const filepath = path.join(__dirname, '../generated', filename);
      
      if (!fs.existsSync(filepath)) {
        return res.status(404).json({
          success: false,
          error: 'File not found'
        });
      }

      const html = await fs.readFile(filepath, 'utf8');
      res.send(html);

    } catch (error) {
      console.error('❌ View error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async listGeneratedFiles(req, res) {
    try {
      const generatedDir = path.join(__dirname, '../generated');
      
      if (!fs.existsSync(generatedDir)) {
        return res.json({
          success: true,
          files: [],
          count: 0
        });
      }

      const files = fs.readdirSync(generatedDir)
        .filter(file => file.endsWith('.html'))
        .map(file => ({
          name: file,
          path: `/generated/${file}`,
          fullPath: path.join(generatedDir, file),
          size: fs.statSync(path.join(generatedDir, file)).size,
          created: fs.statSync(path.join(generatedDir, file)).birthtime,
          url: `/api/mvp/view/${file}`,
          downloadUrl: `/api/mvp/download/${file}`
        }));

      res.json({
        success: true,
        files: files,
        count: files.length,
        directory: generatedDir
      });

    } catch (error) {
      console.error('❌ List files error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new MVPController();