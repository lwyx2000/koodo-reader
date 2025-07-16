const fs = require('fs');
const path = require('path');

// 定义nan.h文件路径
const nanFilePath = path.join(__dirname, '../node_modules/nan/nan.h');

try {
  // 读取原始文件内容
  let content = fs.readFileSync(nanFilePath, 'utf8');
  
  // 替换内容 - 将 #include "nan_scriptorigin.h" 替换为 // #include nan_scriptorigin.h
  content = content.replace(/#include\s+["<]nan_scriptorigin\.h[">]/g, '// #include nan_scriptorigin.h');
  
  // 写回文件
  fs.writeFileSync(nanFilePath, content, 'utf8');
  
  console.log('成功修改 nan.h 文件');
} catch (err) {
  console.error('修改 nan.h 文件时出错:', err);
  process.exit(1);
} 