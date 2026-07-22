const jwt = require('jsonwebtoken');
const db = require('../config/db');

// JWT认证中间件（增强版：每次请求查询数据库确认用户状态）
async function authMiddleware(req, res, next) {
  // 从请求头获取 token
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      code: 401,
      message: '未提供认证令牌，请先登录'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 验证 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 查询数据库确认用户状态（是否被拉黑、是否管理员）
    const [users] = await db.query(
      'SELECT id, username, is_admin, is_blocked FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({
        code: 401,
        message: '用户不存在'
      });
    }

    const user = users[0];

    // 检查是否被拉黑
    if (user.is_blocked) {
      return res.status(403).json({
        code: 403,
        message: '您的账号已被管理员拉黑，请联系管理员解封'
      });
    }

    // 将最新的用户信息挂载到请求对象上
    req.user = {
      id: user.id,
      username: user.username,
      is_admin: user.is_admin
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: '登录已过期，请重新登录'
      });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        code: 401,
        message: '无效的认证令牌'
      });
    }
    return res.status(401).json({
      code: 401,
      message: '认证失败'
    });
  }
}

// 管理员权限中间件（需先通过 authMiddleware）
async function adminMiddleware(req, res, next) {
  try {
    // 检查是否是管理员（authMiddleware已查询数据库，直接使用req.user.is_admin）
    if (!req.user.is_admin) {
      return res.status(403).json({
        code: 403,
        message: '无权限，需要管理员身份'
      });
    }

    next();
  } catch (err) {
    console.error('[管理员权限校验错误]', err);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
}

module.exports = authMiddleware;
module.exports.adminMiddleware = adminMiddleware;
module.exports.authMiddleware = authMiddleware;
