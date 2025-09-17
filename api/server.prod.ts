/**
 * Production server entry file
 * 生产环境服务器入口文件
 */
import app from './app.js';

/**
 * 启动生产环境服务器
 * Start production server with enhanced configuration
 */
const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

// 生产环境服务器配置
const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Production server ready on ${HOST}:${PORT}`);
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});

// 设置服务器超时
server.timeout = 30000; // 30秒超时
server.keepAliveTimeout = 65000; // Keep-alive超时
server.headersTimeout = 66000; // Headers超时

/**
 * 优雅关闭服务器
 * Graceful shutdown handlers
 */
const gracefulShutdown = (signal: string) => {
  console.log(`\n${signal} signal received`);
  console.log('🔄 Starting graceful shutdown...');
  
  server.close((err) => {
    if (err) {
      console.error('❌ Error during server shutdown:', err);
      process.exit(1);
    }
    
    console.log('✅ Server closed successfully');
    console.log('👋 Goodbye!');
    process.exit(0);
  });
  
  // 强制关闭超时
  setTimeout(() => {
    console.error('⚠️  Forced shutdown due to timeout');
    process.exit(1);
  }, 10000);
};

// 监听关闭信号
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

export default app;