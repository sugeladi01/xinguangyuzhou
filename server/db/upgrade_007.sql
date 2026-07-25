-- ============================================
-- 心光宇宙 - 数据库升级脚本 007
-- 新增：留言屏蔽功能（messages.is_hidden）
-- 在宝塔面板的 phpMyAdmin 中执行此 SQL
-- ============================================

USE xinguang;

-- 1. 给 messages 表添加 is_hidden 字段
SET @dbname = DATABASE();
SET @tablename = 'messages';
SET @columnname = 'is_hidden';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE (table_schema = @dbname)
      AND (table_name = @tablename)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  'ALTER TABLE `messages` ADD COLUMN `is_hidden` TINYINT(1) NOT NULL DEFAULT 0 COMMENT ''是否被屏蔽（0-正常 1-已屏蔽）'' AFTER `content`'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 完成提示
SELECT '数据库升级 007 完成！' as message;