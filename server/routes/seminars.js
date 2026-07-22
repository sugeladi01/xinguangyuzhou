const express = require('express');
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// -------------------------------------------
// GET /api/seminars - 获取研讨话题列表（支持tab筛选）
// -------------------------------------------
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize, 10) || 20));
    const offset = (page - 1) * pageSize;
    const tab = req.query.tab || ''; // 热门/最新/线上/线下

    let whereClause = '';
    let orderBy = 's.created_at DESC';
    const params = [];

    if (tab === '热门') {
      orderBy = 's.like_count DESC, s.join_count DESC';
    } else if (tab === '最新') {
      orderBy = 's.created_at DESC';
    } else if (tab === '线上') {
      whereClause = 'WHERE s.mode = ?';
      params.push('线上');
    } else if (tab === '线下') {
      whereClause = 'WHERE s.mode = ?';
      params.push('线下');
    }

    // 查询总数
    const [countResult] = await db.query(
      `SELECT COUNT(*) AS total FROM seminars s ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 查询话题列表
    const [seminars] = await db.query(
      `SELECT s.id, s.user_id, s.title, s.description, s.mode, s.time_display,
              s.tags, s.like_count, s.join_count, s.created_at,
              u.nickname, u.avatar
       FROM seminars s
       LEFT JOIN users u ON s.user_id = u.id
       ${whereClause}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    res.json({
      code: 200,
      message: 'success',
      data: {
        list: seminars,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    });
  } catch (err) {
    console.error('[获取研讨话题列表错误]', err);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// -------------------------------------------
// GET /api/seminars/:id - 获取话题详情（含评论）
// -------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const seminarId = parseInt(req.params.id, 10);

    if (isNaN(seminarId)) {
      return res.status(400).json({
        code: 400,
        message: '无效的话题ID'
      });
    }

    // 查询话题详情
    const [seminars] = await db.query(
      `SELECT s.id, s.user_id, s.title, s.description, s.mode, s.time_display,
              s.tags, s.like_count, s.join_count, s.created_at,
              u.nickname, u.avatar
       FROM seminars s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
      [seminarId]
    );

    if (seminars.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '话题不存在'
      });
    }

    // 查询评论列表
    const [comments] = await db.query(
      `SELECT c.id, c.seminar_id, c.user_id, c.nickname, c.content, c.created_at,
              u.avatar
       FROM seminar_comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.seminar_id = ?
       ORDER BY c.created_at ASC`,
      [seminarId]
    );

    const seminar = seminars[0];
    seminar.comments = comments;

    res.json({
      code: 200,
      message: 'success',
      data: seminar
    });
  } catch (err) {
    console.error('[获取话题详情错误]', err);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// -------------------------------------------
// POST /api/seminars - 发布话题（需认证）
// -------------------------------------------
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, mode, time_display, tags } = req.body;

    // 参数校验
    if (!title || title.trim() === '') {
      return res.status(400).json({
        code: 400,
        message: '话题标题不能为空'
      });
    }

    if (!description || description.trim() === '') {
      return res.status(400).json({
        code: 400,
        message: '话题描述不能为空'
      });
    }

    // 处理 tags（确保是 JSON 数组）
    let tagsJson = null;
    if (tags) {
      if (Array.isArray(tags)) {
        tagsJson = JSON.stringify(tags);
      } else if (typeof tags === 'string') {
        // 尝试解析字符串
        try {
          const parsed = JSON.parse(tags);
          if (Array.isArray(parsed)) {
            tagsJson = JSON.stringify(parsed);
          } else {
            tagsJson = JSON.stringify([tags]);
          }
        } catch (e) {
          // 如果不是 JSON 字符串，当作单个标签
          tagsJson = JSON.stringify([tags]);
        }
      }
    }

    // 插入话题
    const [result] = await db.query(
      'INSERT INTO seminars (user_id, title, description, mode, time_display, tags) VALUES (?, ?, ?, ?, ?, ?)',
      [
        req.user.id,
        title.trim(),
        description.trim(),
        mode || '线上',
        time_display || '',
        tagsJson
      ]
    );

    // 查询新插入的话题
    const [newSeminar] = await db.query(
      `SELECT s.id, s.user_id, s.title, s.description, s.mode, s.time_display,
              s.tags, s.like_count, s.join_count, s.created_at,
              u.nickname, u.avatar
       FROM seminars s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      code: 201,
      message: '话题发布成功',
      data: newSeminar[0]
    });
  } catch (err) {
    console.error('[发布话题错误]', err);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// -------------------------------------------
// POST /api/seminars/:id/like - 点赞话题
// -------------------------------------------
router.post('/:id/like', async (req, res) => {
  try {
    const seminarId = parseInt(req.params.id, 10);

    if (isNaN(seminarId)) {
      return res.status(400).json({
        code: 400,
        message: '无效的话题ID'
      });
    }

    // 检查话题是否存在
    const [seminars] = await db.query(
      'SELECT id FROM seminars WHERE id = ?',
      [seminarId]
    );

    if (seminars.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '话题不存在'
      });
    }

    // 增加点赞数
    await db.query(
      'UPDATE seminars SET like_count = like_count + 1 WHERE id = ?',
      [seminarId]
    );

    // 查询更新后的点赞数
    const [updated] = await db.query(
      'SELECT like_count FROM seminars WHERE id = ?',
      [seminarId]
    );

    res.json({
      code: 200,
      message: '点赞成功',
      data: {
        like_count: updated[0].like_count
      }
    });
  } catch (err) {
    console.error('[点赞话题错误]', err);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// -------------------------------------------
// POST /api/seminars/:id/join - 参加话题
// -------------------------------------------
router.post('/:id/join', async (req, res) => {
  try {
    const seminarId = parseInt(req.params.id, 10);

    if (isNaN(seminarId)) {
      return res.status(400).json({
        code: 400,
        message: '无效的话题ID'
      });
    }

    // 检查话题是否存在
    const [seminars] = await db.query(
      'SELECT id FROM seminars WHERE id = ?',
      [seminarId]
    );

    if (seminars.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '话题不存在'
      });
    }

    // 增加参加人数
    await db.query(
      'UPDATE seminars SET join_count = join_count + 1 WHERE id = ?',
      [seminarId]
    );

    // 查询更新后的参加人数
    const [updated] = await db.query(
      'SELECT join_count FROM seminars WHERE id = ?',
      [seminarId]
    );

    res.json({
      code: 200,
      message: '参加成功',
      data: {
        join_count: updated[0].join_count
      }
    });
  } catch (err) {
    console.error('[参加话题错误]', err);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// -------------------------------------------
// POST /api/seminars/:id/comments - 发表评论（需认证）
// -------------------------------------------
router.post('/:id/comments', authMiddleware, async (req, res) => {
  try {
    const seminarId = parseInt(req.params.id, 10);
    const { content } = req.body;

    if (isNaN(seminarId)) {
      return res.status(400).json({
        code: 400,
        message: '无效的话题ID'
      });
    }

    // 参数校验
    if (!content || content.trim() === '') {
      return res.status(400).json({
        code: 400,
        message: '评论内容不能为空'
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({
        code: 400,
        message: '评论内容不能超过1000个字符'
      });
    }

    // 检查话题是否存在
    const [seminars] = await db.query(
      'SELECT id FROM seminars WHERE id = ?',
      [seminarId]
    );

    if (seminars.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '话题不存在'
      });
    }

    // 获取用户昵称
    const [users] = await db.query(
      'SELECT nickname FROM users WHERE id = ?',
      [req.user.id]
    );

    const nickname = users.length > 0 ? (users[0].nickname || req.user.username) : req.user.username;

    // 插入评论
    const [result] = await db.query(
      'INSERT INTO seminar_comments (seminar_id, user_id, nickname, content) VALUES (?, ?, ?, ?)',
      [seminarId, req.user.id, nickname, content.trim()]
    );

    // 查询新插入的评论
    const [newComment] = await db.query(
      `SELECT c.id, c.seminar_id, c.user_id, c.nickname, c.content, c.created_at,
              u.avatar
       FROM seminar_comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      code: 201,
      message: '评论发表成功',
      data: newComment[0]
    });
  } catch (err) {
    console.error('[发表评论错误]', err);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

module.exports = router;
