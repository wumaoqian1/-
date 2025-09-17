# 问卷调查网站部署指南

本指南将帮助您将问卷调查网站部署到生产环境。项目采用前后端分离架构：
- **前端**：部署到 Vercel
- **后端**：部署到 Railway
- **数据库**：使用 Supabase

## 📋 部署前准备

### 1. 确保项目构建成功
```bash
# 测试前端构建
npm run build

# 测试后端构建
npm run server:build
```

### 2. 准备必要的账号
- [Vercel](https://vercel.com) 账号（前端部署）
- [Railway](https://railway.app) 账号（后端部署）
- [Supabase](https://supabase.com) 项目（数据库）

## 🚀 部署步骤

### 第一步：部署后端到 Railway

1. **创建 Railway 项目**
   - 登录 [Railway Dashboard](https://railway.app/dashboard)
   - 点击 "New Project" → "Deploy from GitHub repo"
   - 选择你的项目仓库

2. **配置环境变量**
   在 Railway 项目设置中添加以下环境变量：
   ```bash
   NODE_ENV=production
   PORT=$PORT
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   JWT_SECRET=your_jwt_secret_key
   CORS_ORIGIN=https://your-vercel-frontend.vercel.app
   ```

3. **配置构建设置**
   - Build Command: `npm run server:build`
   - Start Command: `npm run server:start`
   - Root Directory: `/` (项目根目录)

4. **部署并获取后端URL**
   - Railway 会自动部署并提供一个 URL
   - 记录这个 URL，格式类似：`https://your-app-name.railway.app`

### 第二步：部署前端到 Vercel

1. **创建 Vercel 项目**
   - 登录 [Vercel Dashboard](https://vercel.com/dashboard)
   - 点击 "New Project" → "Import Git Repository"
   - 选择你的项目仓库

2. **配置构建设置**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **配置环境变量**
   在 Vercel 项目设置中添加以下环境变量：
   ```bash
   VITE_API_URL=https://your-railway-backend.railway.app
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **更新 vercel.json 配置**
   修改 `vercel.json` 中的后端 URL：
   ```json
   {
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "https://your-actual-railway-url.railway.app/api/$1"
       }
     ]
   }
   ```

### 第三步：更新 CORS 配置

1. **获取前端域名**
   - Vercel 部署完成后会提供一个域名
   - 格式类似：`https://your-project-name.vercel.app`

2. **更新后端 CORS 配置**
   - 在 Railway 项目中更新 `CORS_ORIGIN` 环境变量
   - 设置为你的 Vercel 前端域名

## 🔧 配置详解

### Supabase 配置获取

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 Settings → API
4. 获取以下信息：
   - `Project URL` → `SUPABASE_URL`
   - `anon public` → `SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

### JWT Secret 生成

```bash
# 使用 OpenSSL 生成强密码
openssl rand -base64 32

# 或使用在线工具生成 32 位随机字符串
```

## 📝 部署后检查清单

- [ ] 后端服务正常运行（访问健康检查端点）
- [ ] 前端页面正常加载
- [ ] 用户注册/登录功能正常
- [ ] 问卷创建/编辑功能正常
- [ ] 问卷填写功能正常
- [ ] 数据统计功能正常
- [ ] API 请求正常（检查网络面板）

## 🐛 常见问题排查

### 1. CORS 错误
**症状**：前端无法访问后端 API
**解决**：
- 检查 Railway 中的 `CORS_ORIGIN` 环境变量
- 确保设置为正确的前端域名
- 重新部署后端服务

### 2. 环境变量未生效
**症状**：配置相关功能异常
**解决**：
- 检查环境变量名称是否正确
- 确保在正确的平台设置环境变量
- 重新部署服务使环境变量生效

### 3. 数据库连接失败
**症状**：后端无法连接 Supabase
**解决**：
- 检查 Supabase URL 和密钥是否正确
- 确保 Supabase 项目状态正常
- 检查网络连接和防火墙设置

### 4. 构建失败
**症状**：部署时构建过程失败
**解决**：
- 检查 package.json 中的构建脚本
- 确保所有依赖都已正确安装
- 查看构建日志定位具体错误

## 🔄 更新部署

### 自动部署
- 推送代码到 main 分支会自动触发部署
- Vercel 和 Railway 都支持 Git 集成

### 手动部署
- Vercel：在项目面板点击 "Redeploy"
- Railway：在项目面板点击 "Deploy"

## 📊 监控和日志

### Vercel
- 访问项目面板查看部署状态
- 查看 Functions 日志（如果使用）
- 监控网站性能和访问量

### Railway
- 查看应用日志和性能指标
- 监控资源使用情况
- 设置告警通知

### Supabase
- 监控数据库性能
- 查看 API 使用统计
- 检查存储使用情况

## 🎯 性能优化建议

1. **启用 CDN**：Vercel 自动提供全球 CDN
2. **图片优化**：使用 Vercel 的图片优化功能
3. **缓存策略**：配置适当的缓存头
4. **代码分割**：已在 vite.config.ts 中配置
5. **监控性能**：使用 Vercel Analytics

---

🎉 **恭喜！** 你的问卷调查网站现在已经成功部署到生产环境了！

如果遇到问题，请检查各平台的日志和文档，或参考本指南的故障排除部分。