const express = require('express');
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 所有目标路由都需要认证
router.use(authMiddleware);

// -------------------------------------------
// GET /api/goals - 获取用户目标列表（需认证）
// -------------------------------------------
router.get('/', async (req, res) => {
  try {
    const category = req.query.category || '';
    const done = req.query.done; // '0' 未完成, '1' 已完成, 不传则全部

    let whereClause = 'WHERE g.user_id = ?';
    const params = [req.user.id];

    if (category) {
      whereClause += ' AND g.category = ?';
      params.push(category);
    }

    if (done === '0' || done === '1') {
      whereClause += ' AND g.done = ?';
      params.push(parseInt(done, 10));
    }

    // 查询目标列表
    const [goals] = await db.query(
      `SELECT g.id, g.user_id, g.text, g.category, g.priority, g.done,
              g.created_at, g.updated_at
       FROM goals g
       ${whereClause}
       ORDER BY g.done ASC, g.priority DESC, g.created_at DESC`,
      params
    );

    // 统计完成情况
    const [stats] = await db.query(
      `SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN done = 1 THEN 1 ELSE 0 END) AS completed
       FROM goals
       WHERE user_id = ?`,
      [req.user.id]
    );

    res.json({
      code: 200,
      message: 'success',
      data: {
        list: goals,
        stats: {
          total: stats[0].total || 0,
          completed: stats[0].completed || 0,
          uncompleted: (stats[0].total || 0) - (stats[0].completed || 0)
        }
      }
    });
  } catch (err) {
    console.error('[获取目标列表错误]', err);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// -------------------------------------------
// POST /api/goals - 添加目标（需认证）
// -------------------------------------------
router.post('/', async (req, res) => {
  try {
    const { text, category, priority } = req.body;

    // 参数校验
    if (!text || text.trim() === '') {
      return res.status(400).json({
        code: 400,
        message: '目标内容不能为空'
      });
    }

    if (text.length > 500) {
      return res.status(400).json({
        code: 400,
        message: '目标内容不能超过500个字符'
      });
    }

    // 优先级校验
    const validPriority = [1, 2, 3];
    const goalPriority = validPriority.includes(priority) ? priority : 1;

    // 插入目标
    const [result] = await db.query(
      'INSERT INTO goals (user_id, text, category, priority) VALUES (?, ?, ?, ?)',
      [
        req.user.id,
        text.trim(),
        category || '其他',
        goalPriority
      ]
    );

    // 查询新插入的目标
    const [newGoal] = await db.query(
      'SELECT id, user_id, text, category, priority, done, created_at, updated_at FROM goals WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      code: 201,
      message: '目标添加成功',
      data: newGoal[0]
    });
  } catch (err) {
    console.error('[添加目标错误]', err);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// -------------------------------------------
// PUT /api/goals/:id - 更新目标（需认证）
// -------------------------------------------
router.put('/:id', async (req, res) => {
  try {
    const goalId = parseInt(req.params.id, 10);
    const { text, category, priority, done } = req.body;

    if (isNaN(goalId)) {
      return res.status(400).json({
        code: 400,
        message: '无效的目标ID'
      });
    }

    // 检查目标是否存在且属于当前用户
    const [goals] = await db.query(
      'SELECT id, user_id FROM goals WHERE id = ?',
      [goalId]
    );

    if (goals.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '目标不存在'
      });
    }

    if (goals[0].user_id !== req.user.id) {
      return res.status(403).json({
        code: 403,
        message: '无权修改他人的目标'
      });
    }

    // 构建更新字段
    const updateFields = [];
    const updateParams = [];

    if (text !== undefined) {
      if (text.trim() === '') {
        return res.status(400).json({
          code: 400,
          message: '目标内容不能为空'
        });
      }
      if (text.trim().length > 500) {
        return res.status(400).json({
          code: 400,
          message: '目标内容不能超过500个字符'
        });
      }
      updateFields.push('text = ?');
      updateParams.push(text.trim());
    }

    if (category !== undefined) {
      updateFields.push('category = ?');
      updateParams.push(category);
    }

    if (priority !== undefined) {
      const validPriority = [1, 2, 3];
      if (!validPriority.includes(priority)) {
        return res.status(400).json({
          code: 400,
          message: '优先级必须是1、2或3'
        });
      }
      updateFields.push('priority = ?');
      updateParams.push(priority);
    }

    if (done !== undefined) {
      updateFields.push('done = ?');
      updateParams.push(done ? 1 : 0);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '没有需要更新的字段'
      });
    }

    // 执行更新
    updateParams.push(goalId);
    await db.query(
      `UPDATE goals SET ${updateFields.join(', ')} WHERE id = ?`,
      updateParams
    );

    // 查询更新后的目标
    const [updatedGoal] = await db.query(
      'SELECT id, user_id, text, category, priority, done, created_at, updated_at FROM goals WHERE id = ?',
      [goalId]
    );

    res.json({
      code: 200,
      message: '目标更新成功',
      data: updatedGoal[0]
    });
  } catch (err) {
    console.error('[更新目标错误]', err);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// -------------------------------------------
// DELETE /api/goals/:id - 删除目标（需认证）
// -------------------------------------------
router.delete('/:id', async (req, res) => {
  try {
    const goalId = parseInt(req.params.id, 10);

    if (isNaN(goalId)) {
      return res.status(400).json({
        code: 400,
        message: '无效的目标ID'
      });
    }

    // 检查目标是否存在且属于当前用户
    const [goals] = await db.query(
      'SELECT id, user_id FROM goals WHERE id = ?',
      [goalId]
    );

    if (goals.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '目标不存在'
      });
    }

    if (goals[0].user_id !== req.user.id) {
      return res.status(403).json({
        code: 403,
        message: '无权删除他人的目标'
      });
    }

    // 删除目标
    await db.query('DELETE FROM goals WHERE id = ?', [goalId]);

    res.json({
      code: 200,
      message: '目标删除成功'
    });
  } catch (err) {
    console.error('[删除目标错误]', err);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

module.exports = router;
