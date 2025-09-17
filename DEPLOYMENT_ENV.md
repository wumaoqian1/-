# 部署环境变量配置指南

## Vercel 前端部署环境变量

在 Vercel 项目设置中配置以下环境变量：

```bash
# API服务器地址
VITE_API_URL=https://your-railway-backend.railway.app

# Supabase配置
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Railway 后端部署环境变量

在 Railway 项目设置中配置以下环境变量：

```bash
# 服务端口 (Railway自动设置)
PORT=$PORT

# 运行环境
NODE_ENV=production

# Supabase配置
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT密钥 (用于用户认证)
JWT_SECRET=your_jwt_secret_key_here

# CORS配置 (允许前端域名访问)
CORS_ORIGIN=https://your-vercel-frontend.vercel.app
```

## 获取配置值的方法

### 1. Supabase 配置
- 登录 [Supabase Dashboard](https://supabase.com/dashboard)
- 选择你的项目
- 在 Settings > API 中找到：
  - `Project URL` → `SUPABASE_URL`
  - `anon public` → `SUPABASE_ANON_KEY`
  - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

### 2. JWT Secret
- 生成一个强密码作为JWT密钥
- 可以使用在线工具生成：`openssl rand -base64 32`

### 3. CORS Origin
- 部署到Vercel后获得的前端域名
- 格式：`https://your-project-name.vercel.app`

## 注意事项

1. **安全性**：
   - 不要在代码中硬编码敏感信息
   - 使用环境变量管理所有配置
   - `SERVICE_ROLE_KEY` 只在后端使用

2. **域名配置**：
   - 部署完成后需要更新 `VITE_API_URL` 和 `CORS_ORIGIN`
   - 确保前后端域名配置正确

3. **数据库**：
   - 确保Supabase数据库已正确配置
   - 检查RLS策略和权限设置