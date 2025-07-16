/**
 * 测试文件上传功能
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// 加载环境变量
require('dotenv').config();

// 服务器URL
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001';

// 创建一个测试文件
const createTestFile = () => {
  const testDir = path.join(__dirname, 'test');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  const testFilePath = path.join(testDir, 'test.txt');
  fs.writeFileSync(testFilePath, 'This is a test file for upload');
  
  return testFilePath;
};

// 上传测试文件
const uploadTestFile = async (filePath) => {
  try {
    const formData = new FormData();
    const fileStream = fs.createReadStream(filePath);
    
    formData.append('file', fileStream);
    formData.append('key', 'test-file');
    formData.append('format', 'txt');
    
    console.log(`Uploading test file to ${SERVER_URL}/api/books/upload`);
    
    const response = await axios.post(
      `${SERVER_URL}/api/books/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
    );
    
    console.log('Upload response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Upload error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
};

// 检查上传的文件
const checkUploadedFile = async (filename) => {
  try {
    // 获取上传目录
    const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');
    const BOOKS_DIR = path.join(UPLOADS_DIR, 'ebook');
    
    const uploadedFilePath = path.join(BOOKS_DIR, filename);
    
    console.log(`Checking if file exists at: ${uploadedFilePath}`);
    
    if (fs.existsSync(uploadedFilePath)) {
      const stats = fs.statSync(uploadedFilePath);
      console.log(`File exists! Size: ${stats.size} bytes`);
      return true;
    } else {
      console.log(`File does not exist at ${uploadedFilePath}`);
      
      // 检查上传目录是否存在
      console.log(`Checking if uploads directory exists: ${UPLOADS_DIR}`);
      console.log(`Directory exists: ${fs.existsSync(UPLOADS_DIR)}`);
      
      console.log(`Checking if ebook directory exists: ${BOOKS_DIR}`);
      console.log(`Directory exists: ${fs.existsSync(BOOKS_DIR)}`);
      
      // 列出上传目录中的文件
      if (fs.existsSync(UPLOADS_DIR)) {
        console.log(`Files in ${UPLOADS_DIR}:`);
        fs.readdirSync(UPLOADS_DIR).forEach(file => {
          console.log(`- ${file}`);
        });
      }
      
      // 列出ebook目录中的文件
      if (fs.existsSync(BOOKS_DIR)) {
        console.log(`Files in ${BOOKS_DIR}:`);
        fs.readdirSync(BOOKS_DIR).forEach(file => {
          console.log(`- ${file}`);
        });
      }
      
      return false;
    }
  } catch (error) {
    console.error('Error checking uploaded file:', error);
    return false;
  }
};

// 运行测试
const runTest = async () => {
  try {
    // 创建测试文件
    const testFilePath = createTestFile();
    console.log(`Created test file at: ${testFilePath}`);
    
    // 上传测试文件
    const response = await uploadTestFile(testFilePath);
    
    // 检查上传的文件
    await checkUploadedFile(response.filename);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// 运行测试
runTest(); 