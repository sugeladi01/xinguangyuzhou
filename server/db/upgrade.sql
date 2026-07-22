-- ============================================
-- 心光宇宙 - 数据库升级脚本
-- 用于将现有数据库升级到支持管理员功能
-- 在宝塔面板的 phpMyAdmin 中执行此 SQL
-- ============================================

USE xinguang;

-- 1. 确保 users 表有 is_admin 和 is_blocked 字段（如果不存在则添加）
-- 注意：MySQL 5.7 不支持 ADD COLUMN IF NOT EXISTS，用存储过程方式安全添加
SET @dbname = DATABASE();
SET @tablename = 'users';

-- 添加 is_admin 字段
SET @columnname = 'is_admin';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE (table_schema = @dbname)
      AND (table_name = @tablename)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  'ALTER TABLE `users` ADD COLUMN `is_admin` TINYINT(1) NOT NULL DEFAULT 0 COMMENT ''是否管理员（0-普通用户 1-管理员）'' AFTER `avatar`'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 添加 is_blocked 字段
SET @columnname = 'is_blocked';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE (table_schema = @dbname)
      AND (table_name = @tablename)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  'ALTER TABLE `users` ADD COLUMN `is_blocked` TINYINT(1) NOT NULL DEFAULT 0 COMMENT ''是否被拉黑（0-正常 1-已拉黑）'' AFTER `is_admin`'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 2. 创建 settings 表（如果不存在）
CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key` VARCHAR(50) NOT NULL COMMENT '配置键名',
  `value` VARCHAR(255) NOT NULL DEFAULT '' COMMENT '配置值',
  `description` VARCHAR(255) DEFAULT '' COMMENT '配置说明',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- 3. 初始化注册开关设置（如果不存在）
INSERT IGNORE INTO `settings` (`key`, `value`, `description`) VALUES
('register_enabled', '1', '是否允许新用户注册（0-禁止 1-允许）');

-- 4. 将 sugeladi 用户设为管理员（如果存在）
UPDATE `users` SET `is_admin` = 1 WHERE `username` = 'sugeladi';

-- 5. 将 teacher 用户设为管理员（如果存在）
UPDATE `users` SET `is_admin` = 1 WHERE `username` = 'teacher';

-- 完成提示
SELECT '数据库升级完成！' as message;
SELECT id, username, nickname, is_admin, is_blocked FROM users;
