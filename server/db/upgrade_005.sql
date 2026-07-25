-- ============================================
-- 心光宇宙 升级脚本 005
-- 给 seminars 表添加 category 分类字段
-- 支持：热门研讨 / 学习交流 / 合作社交
-- ============================================

SET @dbname = DATABASE();
SET @tablename = 'seminars';
SET @columnname = 'category';

-- 安全添加 category 列（如果不存在）
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE (table_schema = @dbname) AND (table_name = @tablename) AND (column_name = @columnname)) > 0,
  'SELECT 1',
  'ALTER TABLE `seminars` ADD COLUMN `category` VARCHAR(50) NOT NULL DEFAULT ''热门研讨'' COMMENT ''分类：热门研讨/学习交流/合作社交'' AFTER `description`'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 为已有数据设置默认分类（根据 tags 推测，不确定的归为热门研讨）
UPDATE seminars SET category = '热门研讨' WHERE category = '' OR category IS NULL;