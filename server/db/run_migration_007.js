/**
 * 一键执行数据库迁移：添加 is_hidden 字段
 * 用法: node server/db/run_migration_007.js
 * 在服务器上执行: cd /www/wwwroot/xinguang-web && node server/db/run_migration_007.js
 */
require('dotenv').config();
const db = require('../config/db');

async function runMigration() {
  console.log('========================================');
  console.log('  数据库迁移：添加 is_hidden 字段');
  console.log('========================================\n');

  // 1. seminars 表添加 is_hidden
  try {
    const [seminarCols] = await db.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'seminars' AND COLUMN_NAME = 'is_hidden'`
    );
    if (seminarCols.length > 0) {
      console.log('[OK] seminars.is_hidden 已存在，跳过');
    } else {
      await db.query("ALTER TABLE `seminars` ADD COLUMN `is_hidden` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否被屏蔽（0-正常 1-已屏蔽）' AFTER `join_count`");
      console.log('[成功] seminars 表已添加 is_hidden 字段');
    }
  } catch (e) {
    console.error('[失败] seminars 添加 is_hidden:', e.message);
  }

  // 2. messages 表添加 is_hidden
  try {
    const [msgCols] = await db.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'messages' AND COLUMN_NAME = 'is_hidden'`
    );
    if (msgCols.length > 0) {
      console.log('[OK] messages.is_hidden 已存在，跳过');
    } else {
      await db.query("ALTER TABLE `messages` ADD COLUMN `is_hidden` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否被屏蔽（0-正常 1-已屏蔽）' AFTER `content`");
      console.log('[成功] messages 表已添加 is_hidden 字段');
    }
  } catch (e) {
    console.error('[失败] messages 添加 is_hidden:', e.message);
  }

  // 3. 验证结果
  console.log('\n--- 验证结果 ---');
  try {
    const [seminarCheck] = await db.query("SHOW COLUMNS FROM seminars LIKE 'is_hidden'");
    console.log(`seminars.is_hidden: ${seminarCheck.length > 0 ? '存在 ✓' : '不存在 ✗'}`);
    
    const [msgCheck] = await db.query("SHOW COLUMNS FROM messages LIKE 'is_hidden'");
    console.log(`messages.is_hidden: ${msgCheck.length > 0 ? '存在 ✓' : '不存在 ✗'}`);
  } catch (e) {
    console.error('验证失败:', e.message);
  }

  console.log('\n迁移完成！请重启服务: pm2 restart xinguang-api');
  process.exit(0);
}

runMigration().catch(err => {
  console.error('迁移脚本错误:', err);
  process.exit(1);
});