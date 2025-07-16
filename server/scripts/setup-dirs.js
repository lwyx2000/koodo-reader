/**
 * 设置Koodo Reader服务器所需的目录结构
 */

const fs = require('fs');
const path = require('path');

// 加载环境变量
require('dotenv').config();

// 定义目录结构
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');
const directories = [
  UPLOADS_DIR,                    // 上传根目录
  path.join(UPLOADS_DIR, 'ebook'), // 电子书目录
  path.join(UPLOADS_DIR, 'cover'), // 封面图片目录
  path.join(UPLOADS_DIR, 'cache')  // 缓存目录
];

// 创建目录
console.log('Setting up directory structure...');
directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    } catch (error) {
      console.error(`Failed to create directory ${dir}:`, error);
    }
  } else {
    console.log(`Directory already exists: ${dir}`);
  }
});

// 检查权限
directories.forEach(dir => {
  try {
    const testFile = path.join(dir, '.permission-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    console.log(`Directory ${dir} is writable`);
  } catch (error) {
    console.error(`Directory ${dir} is not writable:`, error);
  }
});

console.log('Directory setup complete!'); 