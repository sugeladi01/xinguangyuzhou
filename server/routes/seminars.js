const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'xinguang-jwt-secret-2026';

const router = express.Router();

// 缓存 is_hidden 列是否存在（首次请求时检测，之后复用）
let hasHiddenColumn = null;
// 缓存 category 列是否存在
let hasCategoryColumn = null;

async function checkHiddenColumn() {
  if (hasHiddenColumn !== null) return hasHiddenColumn;
  try {
    await db.query('SELECT is_hidden FROM seminars LIMIT 1');
    hasHiddenColumn = true;
  } catch (e) {
    hasHiddenColumn = false;
  }
  return hasHiddenColumn;
}

async function checkCategoryColumn() {
  if (hasCategoryColumn !== null) return hasCategoryColumn;
  try {
    await db.query('SELECT category FROM seminars LIMIT 1');
    hasCategoryColumn = true;
  } catch (e) {
    hasCategoryColumn = false;
  }
  return hasCategoryColumn;
}

// 可选的 admin 检测（不强制要求登录，仅判断当前用户是否为管理员）
async function optionalAdminCheck(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    const [users] = await db.query('SELECT is_admin FROM users WHERE id = ?', [decoded.id]);
    return users.length > 0 && users[0].is_admin;
  } catch (e) {
    return false;
  }
}

// 查询设置值
async function getSetting(key) {
  const [rows] = await db.query("SELECT value FROM settings WHERE `key` = ?", [key]);
  return rows.length > 0 ? rows[0].value : '1'; // 默认开启
}

// -------------------------------------------
// GET /api/seminars - 获取研讨话题列表（支持tab筛选）
// 管理员可看到被屏蔽的话题，普通用户只能看到正常话题
// -------------------------------------------
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize, 10) || 20));
    const offset = (page - 1) * pageSize;
    const tab = req.query.tab || ''; // 分类：热门研讨/学习交流/合作社交 或 排序：热门/最新

    const isAdmin = await optionalAdminCheck(req);
    const canFilterHidden = await checkHiddenColumn();
    const canFilterCategory = await checkCategoryColumn();

    const knownCategories = ['热门研讨', '学习交流', '合作社交'];
    const isCategoryTab = knownCategories.includes(tab);

    let whereClause = '';
    // 仅当列存在 且 非管理员 时，过滤被屏蔽的话题
    if (canFilterHidden && !isAdmin) {
      whereClause = 'WHERE s.is_hidden = 0';
    }
    let orderBy = 's.created_at DESC';
    const params = [];

    if (isCategoryTab && canFilterCategory) {
      // 按 category 字段筛选
      whereClause = whereClause
        ? `${whereClause} AND s.category = ?`
        : 'WHERE s.category = ?';
      params.push(tab);
      orderBy = 's.created_at DESC';
    } else if (tab === '热门') {
      orderBy = 's.like_count DESC, s.join_count DESC';
    } else if (tab === '最新') {
      orderBy = 's.created_at DESC';
    } else if (tab === '线上') {
      whereClause = whereClause
        ? `${whereClause} AND s.mode = ?`
        : 'WHERE s.mode = ?';
      params.push('线上');
    } else if (tab === '线下') {
      whereClause = whereClause
        ? `${whereClause} AND s.mode = ?`
        : 'WHERE s.mode = ?';
      params.push('线下');
    }

    // 查询总数
    const [countResult] = await db.query(
      `SELECT COUNT(*) AS total FROM seminars s ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 查询话题列表（列不存在时跳过）
    const hiddenField = canFilterHidden ? 's.is_hidden,' : '0 as is_hidden,';
    const categoryField = canFilterCategory ? 's.category,' : "'热门研讨' as category,";
    const [seminars] = await db.query(
      `SELECT s.id, s.user_id, s.title, s.description, s.mode, s.time_display,
              s.tags, s.like_count, s.join_count, ${hiddenField} ${categoryField} s.created_at,
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
// 检查 seminar_creation_enabled 设置
// -------------------------------------------
router.post('/', authMiddleware, async (req, res) => {
  try {
    // 检查是否允许发起研讨
    const creationEnabled = await getSetting('seminar_creation_enabled');
    if (creationEnabled === '0' && !req.user.is_admin) {
      return res.status(403).json({
        code: 403,
        message: '管理员已关闭发起研讨功能'
      });
    }
    const { title, description, mode, time_display, tags, category } = req.body;

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

    const canCategory = await checkCategoryColumn();
    // 插入话题
    const [result] = await db.query(
      canCategory
        ? 'INSERT INTO seminars (user_id, title, description, category, mode, time_display, tags) VALUES (?, ?, ?, ?, ?, ?, ?)'
        : 'INSERT INTO seminars (user_id, title, description, mode, time_display, tags) VALUES (?, ?, ?, ?, ?, ?)',
      canCategory
        ? [req.user.id, title.trim(), description.trim(), category || '热门研讨', mode || '线上', time_display || '', tagsJson]
        : [req.user.id, title.trim(), description.trim(), mode || '线上', time_display || '', tagsJson]
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

// -------------------------------------------
// DELETE /api/seminars/:id - 管理员删除研讨话题
// -------------------------------------------
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const seminarId = parseInt(req.params.id, 10);

    if (isNaN(seminarId)) {
      return res.status(400).json({ code: 400, message: '无效的话题ID' });
    }

    const [seminars] = await db.query('SELECT id FROM seminars WHERE id = ?', [seminarId]);
    if (seminars.length === 0) {
      return res.status(404).json({ code: 404, message: '话题不存在' });
    }

    // 级联删除评论
    await db.query('DELETE FROM seminar_comments WHERE seminar_id = ?', [seminarId]);
    await db.query('DELETE FROM seminars WHERE id = ?', [seminarId]);

    res.json({ code: 200, message: '研讨话题已删除' });
  } catch (err) {
    console.error('[删除研讨话题错误]', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// -------------------------------------------
// PUT /api/seminars/:id/hide - 管理员切换研讨屏蔽状态
// -------------------------------------------
router.put('/:id/hide', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const seminarId = parseInt(req.params.id, 10);
    const { hidden } = req.body;

    if (isNaN(seminarId)) {
      return res.status(400).json({ code: 400, message: '无效的话题ID' });
    }
    if (hidden === undefined) {
      return res.status(400).json({ code: 400, message: '缺少hidden参数' });
    }

    const canHide = await checkHiddenColumn();
    if (!canHide) {
      return res.status(400).json({ code: 400, message: '请先执行数据库迁移（upgrade_004.sql）' });
    }

    const [seminars] = await db.query('SELECT id, title FROM seminars WHERE id = ?', [seminarId]);
    if (seminars.length === 0) {
      return res.status(404).json({ code: 404, message: '话题不存在' });
    }

    await db.query('UPDATE seminars SET is_hidden = ? WHERE id = ?', [hidden ? 1 : 0, seminarId]);

    res.json({
      code: 200,
      message: hidden ? '研讨已屏蔽' : '研讨已恢复显示'
    });
  } catch (err) {
    console.error('[切换研讨屏蔽状态错误]', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;
