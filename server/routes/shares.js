const express = require('express');
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// -------------------------------------------
// GET /api/shares - 获取分享列表（支持分类筛选）
// -------------------------------------------
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize, 10) || 20));
    const offset = (page - 1) * pageSize;
    const category = req.query.category || '';

    let whereClause = '';
    const params = [];

    if (category) {
      whereClause = 'WHERE s.category = ?';
      params.push(category);
    }

    // 查询总数
    const [countResult] = await db.query(
      `SELECT COUNT(*) AS total FROM shares s ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 查询分享列表
    const [shares] = await db.query(
      `SELECT s.id, s.user_id, s.title, s.category, s.content, s.cover,
              s.read_count, s.like_count, s.created_at,
              u.nickname, u.avatar
       FROM shares s
       LEFT JOIN users u ON s.user_id = u.id
       ${whereClause}
       ORDER BY s.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    res.json({
      code: 200,
      message: 'success',
      data: {
        list: shares,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    });
  } catch (err) {
    console.error('[获取分享列表错误]', err);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// -------------------------------------------
// GET /api/shares/:id - 获取分享详情
// -------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const shareId = parseInt(req.params.id, 10);

    if (isNaN(shareId)) {
      return res.status(400).json({
        code: 400,
        message: '无效的分享ID'
      });
    }

    // 查询分享详情
    const [shares] = await db.query(
      `SELECT s.id, s.user_id, s.title, s.category, s.content, s.cover,
              s.read_count, s.like_count, s.created_at,
              u.nickname, u.avatar
       FROM shares s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
      [shareId]
    );

    if (shares.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '分享不存在'
      });
    }

    // 增加阅读量
    await db.query(
      'UPDATE shares SET read_count = read_count + 1 WHERE id = ?',
      [shareId]
    );

    // 返回详情（阅读量 +1）
    const share = shares[0];
    share.read_count += 1;

    res.json({
      code: 200,
      message: 'success',
      data: share
    });
  } catch (err) {
    console.error('[获取分享详情错误]', err);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// -------------------------------------------
// POST /api/shares - 发布分享（需认证）
// -------------------------------------------
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, category, content, cover } = req.body;

    // 参数校验
    if (!title || title.trim() === '') {
      return res.status(400).json({
        code: 400,
        message: '分享标题不能为空'
      });
    }

    if (!content || content.trim() === '') {
      return res.status(400).json({
        code: 400,
        message: '分享内容不能为空'
      });
    }

    // 插入分享
    const [result] = await db.query(
      'INSERT INTO shares (user_id, title, category, content, cover) VALUES (?, ?, ?, ?, ?)',
      [
        req.user.id,
        title.trim(),
        category || '其他',
        content.trim(),
        cover || ''
      ]
    );

    // 查询新插入的分享
    const [newShare] = await db.query(
      `SELECT s.id, s.user_id, s.title, s.category, s.content, s.cover,
              s.read_count, s.like_count, s.created_at,
              u.nickname, u.avatar
       FROM shares s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      code: 201,
      message: '分享发布成功',
      data: newShare[0]
    });
  } catch (err) {
    console.error('[发布分享错误]', err);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// -------------------------------------------
// POST /api/shares/:id/like - 点赞分享
// -------------------------------------------
router.post('/:id/like', async (req, res) => {
  try {
    const shareId = parseInt(req.params.id, 10);

    if (isNaN(shareId)) {
      return res.status(400).json({
        code: 400,
        message: '无效的分享ID'
      });
    }

    // 检查分享是否存在
    const [shares] = await db.query(
      'SELECT id FROM shares WHERE id = ?',
      [shareId]
    );

    if (shares.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '分享不存在'
      });
    }

    // 增加点赞数
    const [result] = await db.query(
      'UPDATE shares SET like_count = like_count + 1 WHERE id = ?',
      [shareId]
    );

    // 查询更新后的点赞数
    const [updated] = await db.query(
      'SELECT like_count FROM shares WHERE id = ?',
      [shareId]
    );

    res.json({
      code: 200,
      message: '点赞成功',
      data: {
        like_count: updated[0].like_count
      }
    });
  } catch (err) {
    console.error('[点赞分享错误]', err);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// -------------------------------------------
// DELETE /api/shares/:id - 删除分享（需认证，仅作者）
// -------------------------------------------
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const shareId = parseInt(req.params.id);
    if (isNaN(shareId)) {
      return res.status(400).json({ code: 400, message: '无效的分享ID' });
    }

    const [rows] = await db.query('SELECT user_id FROM shares WHERE id = ?', [shareId]);
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, message: '分享不存在' });
    }
    if (rows[0].user_id !== req.user.id) {
      return res.status(403).json({ code: 403, message: '无权删除他人的分享' });
    }

    await db.query('DELETE FROM shares WHERE id = ?', [shareId]);
    res.json({ code: 200, message: '分享删除成功' });
  } catch (err) {
    console.error('[删除分享错误]', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;
