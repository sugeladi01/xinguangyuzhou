const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/auth');
const { sendCode, verifyCode } = require('../utils/email');

const JWT_SECRET = process.env.JWT_SECRET || 'xinguang-jwt-secret-2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const router = express.Router();

// -------------------------------------------
// POST /api/auth/register - 用户注册
// -------------------------------------------
router.post('/register', async (req, res) => {
  try {
    // 检查是否允许注册
    const [settings] = await db.query(
      "SELECT value FROM settings WHERE `key` = 'register_enabled'"
    );
    if (settings.length > 0 && settings[0].value === '0') {
      return res.status(403).json({
        code: 403,
        message: '管理员已关闭注册功能'
      });
    }

    const { username, password, nickname } = req.body;

    // 参数校验
    if (!username || !password) {
      return res.status(400).json({
        code: 400,
        message: '用户名和密码不能为空'
      });
    }

    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({
        code: 400,
        message: '用户名长度应在3-50个字符之间'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        code: 400,
        message: '密码长度不能少于6个字符'
      });
    }

    // 检查用户名是否已存在
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        code: 409,
        message: '用户名已存在'
      });
    }

    // 加密密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 插入用户后查询完整信息
    const [result] = await db.query(
      'INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)',
      [username, hashedPassword, nickname || username]
    );

    // 查询新注册用户的完整信息（包含is_admin）
    const [newUsers] = await db.query(
      'SELECT id, username, nickname, avatar, is_admin, is_blocked, created_at FROM users WHERE id = ?',
      [result.insertId]
    );
    const newUser = newUsers[0];

    // 生成 JWT（包含 is_admin）
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, is_admin: newUser.is_admin },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      code: 201,
      message: '注册成功',
      data: {
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          nickname: newUser.nickname,
          avatar: newUser.avatar,
          is_admin: newUser.is_admin,
          created_at: newUser.created_at
        }
      }
    });
  } catch (err) {
    console.error('[注册错误]', err);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// -------------------------------------------
// POST /api/auth/login - 用户登录
// -------------------------------------------
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 参数校验
    if (!username || !password) {
      return res.status(400).json({
        code: 400,
        message: '用户名和密码不能为空'
      });
    }

    // 查找用户
    const [users] = await db.query(
      'SELECT id, username, password, nickname, avatar, is_admin, is_blocked, created_at FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误'
      });
    }

    const user = users[0];

    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误'
      });
    }

    // 检查是否被拉黑
    if (user.is_blocked) {
      return res.status(403).json({
        code: 403,
        message: '您的账号已被管理员拉黑，请联系管理员解封'
      });
    }

    // 生成 JWT（包含 is_admin）
    const token = jwt.sign(
      { id: user.id, username: user.username, is_admin: user.is_admin },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar,
          is_admin: user.is_admin,
          created_at: user.created_at
        }
      }
    });
  } catch (err) {
    console.error('[登录错误]', err);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// -------------------------------------------
// GET /api/auth/profile - 获取用户信息（需认证）
// -------------------------------------------
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, username, nickname, avatar, is_admin, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    res.json({
      code: 200,
      message: 'success',
      data: users[0]
    });
  } catch (err) {
    console.error('[获取用户信息错误]', err);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// -------------------------------------------
// PUT /api/auth/profile - 更新用户信息（需认证）
// -------------------------------------------
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { nickname, avatar } = req.body;
    const updates = [];
    const values = [];

    if (nickname !== undefined) {
      updates.push('nickname = ?');
      values.push(nickname);
    }
    if (avatar !== undefined) {
      updates.push('avatar = ?');
      values.push(avatar);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '没有需要更新的字段'
      });
    }

    values.push(req.user.id);
    await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [users] = await db.query(
      'SELECT id, username, nickname, avatar, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({
      code: 200,
      message: '更新成功',
      data: users[0]
    });
  } catch (err) {
    console.error('[更新用户信息错误]', err);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// -------------------------------------------
// POST /api/auth/send-code - 发送邮箱验证码
// -------------------------------------------
router.post('/send-code', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ code: 400, message: '请输入邮箱' });
        }
        // 检查该邮箱是否为新用户 + 注册是否已关闭，避免浪费验证码
        const [existingUsers] = await db.query('SELECT id FROM users WHERE username = ?', [email]);
        if (existingUsers.length === 0) {
            const [settings] = await db.query("SELECT value FROM settings WHERE `key` = 'register_enabled'");
            if (settings.length > 0 && settings[0].value === '0') {
                return res.status(403).json({ code: 403, message: '管理员已关闭注册功能' });
            }
        }
        const result = await sendCode(email);
        if (result.success) {
            res.json({ code: 200, message: result.message });
        } else {
            res.status(429).json({ code: 429, message: result.message });
        }
    } catch (err) {
        console.error('[发送验证码错误]', err);
        res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
});

// -------------------------------------------
// POST /api/auth/email-login - 邮箱验证码登录/注册
// -------------------------------------------
router.post('/email-login', async (req, res) => {
    try {
        const { email, code, nickname, password } = req.body;
        if (!email || !code) {
            return res.status(400).json({ code: 400, message: '请输入邮箱和验证码' });
        }

        // 验证验证码
        if (!verifyCode(email, code)) {
            return res.status(400).json({ code: 400, message: '验证码错误或已过期' });
        }

        // 查找用户（用邮箱作为username）
        const [users] = await db.query('SELECT id, username, nickname, avatar, is_admin, is_blocked, created_at FROM users WHERE username = ?', [email]);
        let user, isNew = false;

        if (users.length > 0) {
            // 已有用户，直接登录
            user = users[0];
            // 检查是否被拉黑
            if (user.is_blocked) {
                return res.status(403).json({ code: 403, message: '您的账号已被管理员拉黑，请联系管理员解封' });
            }
        } else {
            // 新用户，自动注册 — 先检查是否允许注册
            const [settings] = await db.query("SELECT value FROM settings WHERE `key` = 'register_enabled'");
            if (settings.length > 0 && settings[0].value === '0') {
                return res.status(403).json({ code: 403, message: '管理员已关闭注册功能' });
            }
            const defaultNickname = nickname || email.split('@')[0];
            let hashedPassword = '';
            if (password && password.length >= 6) {
                hashedPassword = await bcrypt.hash(password, 10);
            }
            const [result] = await db.query(
                'INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)',
                [email, hashedPassword, defaultNickname]
            );
            const [newUserRows] = await db.query(
                'SELECT id, username, nickname, avatar, is_admin, is_blocked, created_at FROM users WHERE id = ?',
                [result.insertId]
            );
            user = newUserRows[0];
            isNew = true;
        }

        // 生成 JWT（包含 is_admin）
        const token = jwt.sign(
            { id: user.id, username: user.username, is_admin: user.is_admin || 0 },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.json({
            code: 200,
            message: isNew ? '注册成功' : '登录成功',
            data: { token, user }
        });
    } catch (err) {
        console.error('[邮箱登录错误]', err);
        res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
});

// -------------------------------------------
// GET /api/auth/users - 管理员获取用户列表（需管理员权限）
// -------------------------------------------
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, username, nickname, avatar, is_admin, is_blocked, created_at FROM users ORDER BY created_at DESC'
    );

    res.json({
      code: 200,
      message: 'success',
      data: users
    });
  } catch (err) {
    console.error('[获取用户列表错误]', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// -------------------------------------------
// PUT /api/auth/users/:id/block - 管理员拉黑用户（需管理员权限）
// -------------------------------------------
router.put('/users/:id/block', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ code: 400, message: '无效的用户ID' });
    }

    // 不能拉黑自己
    if (userId === req.user.id) {
      return res.status(400).json({ code: 400, message: '不能拉黑自己' });
    }

    // 检查目标用户是否存在
    const [users] = await db.query('SELECT id, is_admin FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }

    // 不能拉黑其他管理员
    if (users[0].is_admin) {
      return res.status(400).json({ code: 400, message: '不能拉黑管理员' });
    }

    // 执行拉黑
    await db.query('UPDATE users SET is_blocked = 1 WHERE id = ?', [userId]);

    res.json({ code: 200, message: '用户已被拉黑' });
  } catch (err) {
    console.error('[拉黑用户错误]', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// -------------------------------------------
// PUT /api/auth/users/:id/unblock - 管理员解封用户（需管理员权限）
// -------------------------------------------
router.put('/users/:id/unblock', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ code: 400, message: '无效的用户ID' });
    }

    // 检查用户是否存在
    const [users] = await db.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }

    // 执行解封
    await db.query('UPDATE users SET is_blocked = 0 WHERE id = ?', [userId]);

    res.json({ code: 200, message: '用户已解封' });
  } catch (err) {
    console.error('[解封用户错误]', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// -------------------------------------------
// GET /api/auth/settings/register-status - 获取注册开关状态（公开接口）
// -------------------------------------------
router.get('/settings/register-status', async (req, res) => {
  try {
    const [settings] = await db.query(
      "SELECT value FROM settings WHERE `key` = 'register_enabled'"
    );
    const enabled = settings.length > 0 ? settings[0].value === '1' : true;

    res.json({
      code: 200,
      message: 'success',
      data: { register_enabled: enabled }
    });
  } catch (err) {
    console.error('[获取注册状态错误]', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// -------------------------------------------
// PUT /api/auth/settings/register-toggle - 管理员切换注册开关
// -------------------------------------------
router.put('/settings/register-toggle', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { enabled } = req.body;

    if (enabled === undefined) {
      return res.status(400).json({ code: 400, message: '缺少enabled参数' });
    }

    const value = enabled ? '1' : '0';
    await db.query(
      "UPDATE settings SET value = ? WHERE `key` = 'register_enabled'",
      [value]
    );

    res.json({
      code: 200,
      message: enabled ? '注册功能已开启' : '注册功能已关闭'
    });
  } catch (err) {
    console.error('[切换注册开关错误]', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// -------------------------------------------
// PUT /api/auth/change-password - 修改密码（需认证）
// -------------------------------------------
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        code: 400,
        message: '原密码和新密码不能为空'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        code: 400,
        message: '新密码长度不能少于6个字符'
      });
    }

    // 查询当前用户
    const [users] = await db.query(
      'SELECT password FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }

    // 验证原密码
    const isMatch = await bcrypt.compare(oldPassword, users[0].password);
    if (!isMatch) {
      return res.status(401).json({
        code: 401,
        message: '原密码错误'
      });
    }

    // 加密新密码并更新
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

    res.json({ code: 200, message: '密码修改成功' });
  } catch (err) {
    console.error('[修改密码错误]', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;