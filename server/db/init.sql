-- ============================================
-- 心光宇宙 - 校园正能量成长平台 数据库初始化
-- ============================================

CREATE DATABASE IF NOT EXISTS xinguang DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE xinguang;

-- -------------------------------------------
-- 1. 用户表
-- -------------------------------------------
DROP TABLE IF EXISTS `goals`;
DROP TABLE IF EXISTS `seminars`;
DROP TABLE IF EXISTS `shares`;
DROP TABLE IF EXISTS `messages`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL COMMENT '用户名（登录用，唯一）',
  `password` VARCHAR(255) NOT NULL COMMENT '密码（bcrypt加密）',
  `nickname` VARCHAR(50) DEFAULT '' COMMENT '昵称',
  `avatar` VARCHAR(500) DEFAULT '' COMMENT '头像URL',
  `is_admin` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否管理员（0-普通用户 1-管理员）',
  `is_blocked` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否被拉黑（0-正常 1-已拉黑）',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- -------------------------------------------
-- 2. 留言表
-- -------------------------------------------
CREATE TABLE `messages` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL COMMENT '发布者用户ID',
  `nickname` VARCHAR(50) NOT NULL DEFAULT '' COMMENT '发布时昵称',
  `content` TEXT NOT NULL COMMENT '留言内容',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='留言表';

-- -------------------------------------------
-- 3. 分享表
-- -------------------------------------------
CREATE TABLE `shares` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL COMMENT '发布者用户ID',
  `title` VARCHAR(200) NOT NULL COMMENT '分享标题',
  `category` VARCHAR(50) NOT NULL DEFAULT '其他' COMMENT '分类（学习/生活/成长/其他）',
  `content` TEXT NOT NULL COMMENT '分享内容',
  `cover` VARCHAR(500) DEFAULT '' COMMENT '封面图URL',
  `read_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '阅读量',
  `like_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '点赞数',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分享表';

-- -------------------------------------------
-- 4. 研讨话题表
-- -------------------------------------------
CREATE TABLE `seminars` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL COMMENT '发布者用户ID',
  `title` VARCHAR(200) NOT NULL COMMENT '话题标题',
  `description` TEXT NOT NULL COMMENT '话题描述',
  `mode` VARCHAR(50) NOT NULL DEFAULT '线上' COMMENT '研讨模式（线上/线下/混合）',
  `time_display` VARCHAR(100) DEFAULT '' COMMENT '时间展示文本',
  `tags` JSON DEFAULT NULL COMMENT '标签（JSON数组）',
  `like_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '点赞数',
  `join_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '参加人数',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='研讨话题表';

-- -------------------------------------------
-- 5. 研讨评论表（话题的子评论）
-- -------------------------------------------
CREATE TABLE `seminar_comments` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `seminar_id` INT UNSIGNED NOT NULL COMMENT '所属话题ID',
  `user_id` INT UNSIGNED NOT NULL COMMENT '评论者用户ID',
  `nickname` VARCHAR(50) NOT NULL DEFAULT '' COMMENT '评论时昵称',
  `content` TEXT NOT NULL COMMENT '评论内容',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_seminar_id` (`seminar_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='研讨评论表';

-- -------------------------------------------
-- 6. 目标表
-- -------------------------------------------
CREATE TABLE `goals` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL COMMENT '所属用户ID',
  `text` VARCHAR(500) NOT NULL COMMENT '目标内容',
  `category` VARCHAR(50) NOT NULL DEFAULT '其他' COMMENT '分类（学习/生活/健康/其他）',
  `priority` TINYINT NOT NULL DEFAULT 1 COMMENT '优先级（1-普通 2-重要 3-紧急）',
  `done` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否完成（0-未完成 1-已完成）',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_done` (`done`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='目标表';

-- -------------------------------------------
-- 7. 系统配置表（存储全局开关设置）
-- -------------------------------------------
CREATE TABLE `settings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key` VARCHAR(50) NOT NULL COMMENT '配置键名',
  `value` VARCHAR(255) NOT NULL DEFAULT '' COMMENT '配置值',
  `description` VARCHAR(255) DEFAULT '' COMMENT '配置说明',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- 初始化默认配置：允许注册
INSERT INTO `settings` (`key`, `value`, `description`) VALUES
('register_enabled', '1', '是否允许新用户注册（0-禁止 1-允许）');
