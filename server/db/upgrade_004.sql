-- ============================================
-- 心光宇宙 - 数据库升级脚本 004
-- 新增：研讨屏蔽、留言开关、研讨开关
-- 在宝塔面板的 phpMyAdmin 中执行此 SQL
-- ============================================

USE xinguang;

-- 1. 给 seminars 表添加 is_hidden 字段
SET @dbname = DATABASE();
SET @tablename = 'seminars';
SET @columnname = 'is_hidden';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE (table_schema = @dbname)
      AND (table_name = @tablename)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  'ALTER TABLE `seminars` ADD COLUMN `is_hidden` TINYINT(1) NOT NULL DEFAULT 0 COMMENT ''是否被屏蔽（0-正常 1-已屏蔽）'' AFTER `join_count`'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 2. 初始化新配置项
INSERT IGNORE INTO `settings` (`key`, `value`, `description`) VALUES
('message_board_enabled', '1', '是否允许留言功能（0-关闭 1-开启）'),
('seminar_creation_enabled', '1', '是否允许发起研讨（0-关闭 1-开启）');

-- 完成提示
SELECT '数据库升级 004 完成！' as message;
SELECT `key`, `value`, `description` FROM settings;