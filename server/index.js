// 加载环境变量
require('dotenv').config();

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// 显示当前工作目录
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);

// 日志中间件
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// 中间件
app.use(cors());
app.use(express.json());

// 书籍存储目录配置 - 可通过环境变量设置
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads');
const BOOKS_DIR = path.join(UPLOADS_DIR, 'ebook');
console.log(`Books will be stored in: ${BOOKS_DIR}`);

// 确保uploads和ebook目录存在
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log(`Created uploads directory: ${UPLOADS_DIR}`);
}
if (!fs.existsSync(BOOKS_DIR)) {
  fs.mkdirSync(BOOKS_DIR, { recursive: true });
  console.log(`Created ebook directory: ${BOOKS_DIR}`);
}

// 检查目录权限
try {
  const testFile = path.join(BOOKS_DIR, '.permission-test');
  fs.writeFileSync(testFile, 'test');
  fs.unlinkSync(testFile);
  console.log(`Directory ${BOOKS_DIR} is writable`);
} catch (error) {
  console.error(`WARNING: Directory ${BOOKS_DIR} is not writable:`, error);
}

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    console.log(`Setting destination to: ${BOOKS_DIR}`);
    
    // 确保目录存在
    if (!fs.existsSync(BOOKS_DIR)) {
      console.log(`Directory ${BOOKS_DIR} does not exist, creating it...`);
      fs.mkdirSync(BOOKS_DIR, { recursive: true });
    }
    
    // 检查目录权限
    try {
      const testFile = path.join(BOOKS_DIR, '.multer-test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      console.log(`Confirmed directory ${BOOKS_DIR} is writable for multer`);
    } catch (error) {
      console.error(`ERROR: Directory ${BOOKS_DIR} is not writable for multer:`, error);
    }
    
    cb(null, BOOKS_DIR);
  },
  filename: function(req, file, cb) {
    // 使用原始文件名
    console.log(`Setting filename to: ${file.originalname}`);
    cb(null, file.originalname);
  }
});

// 设置文件大小限制 (默认100MB，可通过环境变量配置)
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || 100) * 1024 * 1024; // MB to bytes
const upload = multer({ 
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  }
});

// 打印multer配置
console.log('Multer configuration:');
console.log('- Storage type:', storage.getFilename ? 'diskStorage' : 'unknown');
console.log('- Max file size:', `${MAX_FILE_SIZE / (1024 * 1024)}MB`);

// 书籍上传接口
app.post('/api/books/upload', function(req, res) {
  console.log('Received upload request');
  console.log('Request body:', req.body);
  console.log('Request files:', req.files);
  
  upload.single('file')(req, res, function(err) {
    if (err) {
      console.error('Multer error:', err);
      return res.status(500).json({ error: 'Upload failed', details: err.message });
    }
    
    try {
      if (!req.file) {
        console.error('Upload error: No file uploaded');
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { key, format } = req.body;
      const filePath = path.join(BOOKS_DIR, req.file.filename);
      
      console.log(`Book uploaded: ${key}.${format} (${Math.round(req.file.size / 1024 / 1024 * 100) / 100}MB)`);
      console.log(`File saved to: ${filePath}`);
      console.log(`File exists: ${fs.existsSync(filePath)}`);
      
      // 检查文件是否确实被保存
      if (!fs.existsSync(filePath)) {
        console.error(`ERROR: File was not saved to ${filePath}`);
        
        // 检查multer的临时文件
        console.log('Multer file object:', req.file);
        
        // 尝试手动复制文件
        if (req.file.path && fs.existsSync(req.file.path)) {
          console.log(`Trying to manually copy file from ${req.file.path} to ${filePath}`);
          fs.copyFileSync(req.file.path, filePath);
          console.log(`Manual copy successful: ${fs.existsSync(filePath)}`);
        }
      } else {
        const stats = fs.statSync(filePath);
        console.log(`File size on disk: ${Math.round(stats.size / 1024 / 1024 * 100) / 100}MB`);
      }
      
      res.json({ 
        message: 'Book uploaded successfully',
        filename: req.file.filename,
        key,
        format,
        path: filePath
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Upload failed', details: error.message });
    }
  });
});

// 书籍下载接口
app.get('/api/books/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(BOOKS_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
      console.error(`Download error: Book not found - ${filename}`);
      return res.status(404).json({ error: 'Book not found' });
    }
    
    const stats = fs.statSync(filePath);
    console.log(`Book downloaded: ${filename} (${Math.round(stats.size / 1024 / 1024 * 100) / 100}MB)`);
    
    res.sendFile(filePath);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

// 检查书籍是否存在
app.head('/api/books/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(BOOKS_DIR, filename);
    
    if (fs.existsSync(filePath)) {
      res.status(200).end();
    } else {
      res.status(404).end();
    }
  } catch (error) {
    console.error('Check existence error:', error);
    res.status(500).end();
  }
});

// 删除书籍接口
app.delete('/api/books/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(BOOKS_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
      // 即使文件不存在也返回成功，因为客户端需要继续执行后续逻辑
      console.log(`Delete requested for non-existent file: ${filename} - treating as success`);
      return res.json({ message: 'Book deleted successfully (file not found)' });
    }
    
    fs.unlinkSync(filePath);
    console.log(`Book deleted: ${filename}`);
    
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// 获取所有书籍列表
app.get('/api/books', (req, res) => {
  try {
    const files = fs.readdirSync(BOOKS_DIR);
    const books = files.map(file => {
      const filePath = path.join(BOOKS_DIR, file);
      const stats = fs.statSync(filePath);
      return {
        filename: file,
        size: stats.size,
        modified: stats.mtime
      };
    });
    
    console.log(`Listed ${books.length} books`);
    res.json(books);
  } catch (error) {
    console.error('List books error:', error);
    res.status(500).json({ error: 'Failed to list books' });
  }
});

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Koodo Reader Server is running',
    config: {
      booksDir: BOOKS_DIR,
      maxFileSize: `${MAX_FILE_SIZE / (1024 * 1024)}MB`
    }
  });
});

// 静态文件服务 - 用于提供web版本的前端文件
app.use(express.static(path.join(__dirname, '../build')));

// 所有其他GET请求返回React应用
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`Koodo Reader Server is running on port ${PORT}`);
  console.log(`Books directory: ${BOOKS_DIR}`);
  console.log(`Max file size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  console.log(`Server started at: ${new Date().toLocaleString()}`);
  console.log('='.repeat(50));
});

module.exports = app;