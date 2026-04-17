const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');
const { sendCode, verifyCode } = require('../utils/email');

const router = express.Router();

// -------------------------------------------
// POST /api/auth/register - 用户注册
// -------------------------------------------
router.post('/register', async (req, res) => {
  try {
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

    // 插入用户
    const [result] = await db.query(
      'INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)',
      [username, hashedPassword, nickname || username]
    );

    // 生成 JWT
    const token = jwt.sign(
      { id: result.insertId, username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      code: 201,
      message: '注册成功',
      data: {
        token,
        user: {
          id: result.insertId,
          username,
          nickname: nickname || username
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
      'SELECT id, username, password, nickname, avatar, created_at FROM users WHERE username = ?',
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

    // 生成 JWT
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
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
      'SELECT id, username, nickname, avatar, created_at FROM users WHERE id = ?',
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
        const { email, code, nickname } = req.body;
        if (!email || !code) {
            return res.status(400).json({ code: 400, message: '请输入邮箱和验证码' });
        }

        // 验证验证码
        if (!verifyCode(email, code)) {
            return res.status(400).json({ code: 400, message: '验证码错误或已过期' });
        }

        // 查找用户（用邮箱作为username）
        const [users] = await db.query('SELECT id, username, nickname, avatar, created_at FROM users WHERE username = ?', [email]);
        let user, isNew = false;

        if (users.length > 0) {
            // 已有用户，直接登录
            user = users[0];
        } else {
            // 新用户，自动注册
            const defaultNickname = nickname || email.split('@')[0];
            const [result] = await db.query(
                'INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)',
                [email, '', defaultNickname]
            );
            const [newUser] = await db.query(
                'SELECT id, username, nickname, avatar, created_at FROM users WHERE id = ?',
                [result.insertId]
            );
            user = newUser[0];
            isNew = true;
        }

        // 生成 JWT
        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET || 'xinguang-jwt-secret-2026',
            { expiresIn: '7d' }
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

module.exports = router;
