require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// 中间件配置
// ============================================

// CORS 跨域配置
app.use(cors({
  origin: [
    'https://liuxuan.netlify.app',
    'https://a1b2.tech',
    'http://a1b2.tech',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8080',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:8080'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// 解析 JSON 请求体
app.use(express.json({ limit: '10mb' }));

// 解析 URL 编码请求体
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// 路由挂载
// ============================================

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    code: 200,
    message: '心光宇宙服务运行中',
    data: {
      name: '心光宇宙 - 校园正能量成长平台',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    }
  });
});

// 用户认证路由
app.use('/api/auth', require('./routes/auth'));

// 留言路由
app.use('/api/messages', require('./routes/messages'));

// 分享路由
app.use('/api/shares', require('./routes/shares'));

// 研讨路由
app.use('/api/seminars', require('./routes/seminars'));

// 目标路由
app.use('/api/goals', require('./routes/goals'));

// ============================================
// 静态文件服务
// ============================================
app.use(express.static(path.join(__dirname, '..'), {
  index: false,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// ============================================
// 404 处理
// ============================================
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: `接口不存在: ${req.method} ${req.originalUrl}`
  });
});

// ============================================
// 全局错误处理
// ============================================
app.use((err, req, res, next) => {
  console.error('[服务器错误]', err);

  // 处理 JSON 解析错误
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      code: 400,
      message: '请求数据格式错误'
    });
  }

  // 处理请求体过大
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      code: 413,
      message: '请求数据过大'
    });
  }

  res.status(500).json({
    code: 500,
    message: '服务器内部错误'
  });
});

// ============================================
// 启动服务器
// ============================================
app.listen(PORT, '0.0.0.0', () => {
  console.log('========================================');
  console.log('  心光宇宙 - 校园正能量成长平台');
  console.log(`  服务器已启动: http://0.0.0.0:${PORT}`);
  console.log(`  环境: ${process.env.NODE_ENV || 'development'}`);
  console.log('========================================');
});
