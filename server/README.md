# Koodo Reader 服务器部署指南

这个目录包含了Koodo Reader的服务器端代码，用于支持Web版本的图书上传和管理功能。

## 环境要求

- Node.js 20.0.0 或更高版本
- npm 6.0.0 或更高版本

## 安装依赖

```bash
cd server
npm install
```

## 配置

服务器可以通过环境变量进行配置：

| 环境变量 | 说明 | 默认值 |
|---------|------|--------|
| PORT | 服务器监听端口 | 3001 |
| BOOKS_DIR | 书籍存储目录（绝对路径） | `{server目录}/books` |
| MAX_FILE_SIZE | 上传文件大小限制（MB） | 100 |

您可以通过创建 `.env` 文件或直接设置环境变量来配置这些选项：

```bash
# .env 文件示例
PORT=3001
BOOKS_DIR=/path/to/books
MAX_FILE_SIZE=200
```

## 运行服务器

### 开发模式

```bash
npm start
```

### 生产模式

推荐使用 PM2 来管理生产环境的 Node.js 应用：

```bash
npm install -g pm2
pm2 start index.js --name koodo-server
```

## 部署步骤

1. 构建前端应用：

```bash
# 在项目根目录执行
npm run build
```

2. 启动服务器：

```bash
cd server
npm install
npm start
```

3. 访问应用：

打开浏览器访问 `http://your-server-ip:3001`

## 常见问题

### 上传失败

- 检查 `BOOKS_DIR` 目录是否存在且有写入权限
- 检查上传的文件大小是否超过了 `MAX_FILE_SIZE` 限制
- 查看服务器日志以获取更多信息

### 跨域问题

如果您在不同的域名下访问前端和后端，可能会遇到跨域问题。服务器已配置CORS支持，但您可能需要调整前端的API URL：

在前端构建之前，设置环境变量：

```bash
REACT_APP_SERVER_URL=http://your-api-server:3001 npm run build
```

## 目录结构

- `index.js` - 主服务器文件
- `books/` - 默认的书籍存储目录 