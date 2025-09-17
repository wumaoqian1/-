# 使用官方Node.js运行时作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建后端应用
RUN npm run server:build

# 暴露端口
EXPOSE $PORT

# 设置环境变量
ENV NODE_ENV=production

# 启动应用
CMD ["npm", "run", "server:start"]