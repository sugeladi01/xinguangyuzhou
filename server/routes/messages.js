const express = require('express');
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 查询设置值
async function getSetting(key) {
  const [rows] = await db.query("SELECT value FROM settings WHERE `key` = ?", [key]);
  return rows.length > 0 ? rows[0].value : '1'; // 默认开启
}

// -------------------------------------------
// GET /api/messages - 获取留言列表（分页，最新在前）
// -------------------------------------------
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize, 10) || 20));
    const offset = (page - 1) * pageSize;

    // 查询总数
    const [countResult] = await db.query('SELECT COUNT(*) AS total FROM messages');
    const total = countResult[0].total;

    // 查询留言列表
    const [messages] = await db.query(
      `SELECT m.id, m.user_id, m.nickname, m.content, m.created_at,
              u.avatar, u.is_admin as author_is_admin, u.is_blocked as author_is_blocked
       FROM messages m
       LEFT JOIN users u ON m.user_id = u.id
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`,
      [pageSize, offset]
    );

    res.json({
      code: 200,
      message: 'success',
      data: {
        list: messages,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    });
  } catch (err) {
    console.error('[获取留言列表错误]', err);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// -------------------------------------------
// POST /api/messages - 发布留言（需认证）
// 检查 message_board_enabled 设置
// -------------------------------------------
router.post('/', authMiddleware, async (req, res) => {
  try {
    // 检查留言功能是否开启（管理员不受限制）
    const boardEnabled = await getSetting('message_board_enabled');
    if (boardEnabled === '0' && !req.user.is_admin) {
      return res.status(403).json({
        code: 403,
        message: '管理员已关闭留言功能'
      });
    }
    const { content } = req.body;

    // 参数校验
    if (!content || content.trim() === '') {
      return res.status(400).json({
        code: 400,
        message: '留言内容不能为空'
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({
        code: 400,
        message: '留言内容不能超过1000个字符'
      });
    }

    // 获取用户昵称
    const [users] = await db.query(
      'SELECT nickname FROM users WHERE id = ?',
      [req.user.id]
    );

    const nickname = users.length > 0 ? (users[0].nickname || req.user.username) : req.user.username;

    // 插入留言
    const [result] = await db.query(
      'INSERT INTO messages (user_id, nickname, content) VALUES (?, ?, ?)',
      [req.user.id, nickname, content.trim()]
    );

    // 查询新插入的留言（包含头像）
    const [newMessage] = await db.query(
      `SELECT m.id, m.user_id, m.nickname, m.content, m.created_at,
              u.avatar, u.is_admin as author_is_admin, u.is_blocked as author_is_blocked
       FROM messages m
       LEFT JOIN users u ON m.user_id = u.id
       WHERE m.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      code: 201,
      message: '留言发布成功',
      data: newMessage[0]
    });
  } catch (err) {
    console.error('[发布留言错误]', err);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// -------------------------------------------
// DELETE /api/messages/:id - 删除留言（需认证）
// 管理员可删除任意留言，普通用户只能删除自己的
// -------------------------------------------
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const messageId = parseInt(req.params.id, 10);

    if (isNaN(messageId)) {
      return res.status(400).json({
        code: 400,
        message: '无效的留言ID'
      });
    }

    // 查询留言是否存在
    const [messages] = await db.query(
      'SELECT id, user_id FROM messages WHERE id = ?',
      [messageId]
    );

    if (messages.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '留言不存在'
      });
    }

    // 检查权限：管理员可删除任意留言，普通用户只能删除自己的
    if (messages[0].user_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({
        code: 403,
        message: '无权删除他人的留言'
      });
    }

    // 删除留言
    await db.query('DELETE FROM messages WHERE id = ?', [messageId]);

    res.json({
      code: 200,
      message: '留言删除成功'
    });
  } catch (err) {
    console.error('[删除留言错误]', err);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

module.exports = router;
