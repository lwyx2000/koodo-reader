# Koodo Reader Web版本部署指南

## 修改内容总结

我们已经对Koodo Reader进行了以下修改，使其能够作为Web服务运行：

1. **服务器端修改**:
   - 添加了dotenv支持，用于配置环境变量
   - 使用新的目录结构：`uploads/ebook`存储电子书文件
   - 添加了文件大小限制配置（通过MAX_FILE_SIZE环境变量）
   - 添加了静态文件服务，用于提供前端文件

2. **前端修改**:
   - 修改了服务器URL配置，默认使用当前域名（window.location.origin）
   - 改进了上传错误处理，提供更详细的错误信息
   - 添加了上传进度显示
   - 添加了回收站中单本书籍永久删除功能
   - 添加了回收站中多选永久删除功能

## 部署步骤

### 1. 构建前端

```bash
# 在项目根目录执行
npm run build
```

这将在项目根目录下创建一个`build`文件夹，包含前端代码。

### 2. 配置服务器

在`server`目录下创建`.env`文件：

```
# 服务器端口
PORT=3001

# 上传文件根目录 (绝对路径)
UPLOADS_DIR=/path/to/your/uploads

# 上传文件大小限制 (MB)
MAX_FILE_SIZE=200
```

电子书文件将存储在 `UPLOADS_DIR/ebook` 目录中。

### 3. 安装服务器依赖

```bash
cd server
npm install
```

### 4. 启动服务器

#### 开发环境

```bash
npm run dev
```

#### 生产环境

使用PM2或其他进程管理器：

```bash
npm install -g pm2
pm2 start index.js --name koodo-reader
```

或者使用Docker:

```bash
docker build -t koodo-reader .
docker run -p 3001:3001 -v /path/to/uploads:/app/uploads -e MAX_FILE_SIZE=200 koodo-reader
```

### 5. 访问应用

打开浏览器访问 `http://your-server-ip:3001`

## 环境变量说明

| 变量名 | 说明 | 默认值 |
|-------|------|--------|
| PORT | 服务器端口 | 3001 |
| UPLOADS_DIR | 上传文件根目录 | server/uploads |
| MAX_FILE_SIZE | 上传文件大小限制(MB) | 100 |
| REACT_APP_SERVER_URL | 前端构建时指定API服务器URL | window.location.origin |

## 目录结构

```
uploads/
  ├── ebook/      # 存储电子书文件
  └── ...         # 其他上传文件（如封面图等）
```

## 故障排除

### 上传失败

1. **检查服务器日志**:
   ```bash
   pm2 logs koodo-reader
   ```

2. **检查存储目录权限**:
   ```bash
   ls -la $UPLOADS_DIR/ebook
   ```
   确保运行服务器的用户对该目录有写入权限。

3. **检查文件大小限制**:
   - 浏览器控制台会显示上传的文件大小
   - 服务器日志会显示配置的最大文件大小

4. **检查网络连接**:
   - 确保服务器可以从客户端访问
   - 检查防火墙设置

### 跨域问题

如果前端和API部署在不同域名下，需要在构建前端时设置API URL:

```bash
REACT_APP_SERVER_URL=http://api.example.com npm run build
``` 