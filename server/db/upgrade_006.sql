-- ============================================
-- 心光宇宙 升级脚本 006
-- 心学 & 科学板块内容管理系统
-- ============================================

-- 心学模块表
CREATE TABLE IF NOT EXISTS `xinxue_modules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL COMMENT '模块名称（王阳明心学/四辩立场）',
  `slug` VARCHAR(50) NOT NULL UNIQUE COMMENT 'URL标识',
  `description` TEXT COMMENT '模块描述',
  `icon` VARCHAR(20) DEFAULT '📖' COMMENT '图标emoji',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 心学主题表（三级子模块）
CREATE TABLE IF NOT EXISTS `xinxue_topics` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `module_id` INT NOT NULL COMMENT '所属模块ID',
  `name` VARCHAR(100) NOT NULL COMMENT '主题名称',
  `slug` VARCHAR(50) NOT NULL COMMENT 'URL标识',
  `subtitle` VARCHAR(200) COMMENT '副标题',
  `description` TEXT COMMENT '主题简介',
  `icon` VARCHAR(20) DEFAULT '📝' COMMENT '图标emoji',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`module_id`) REFERENCES `xinxue_modules`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 心学内容块表（每个主题下的内容段落）
CREATE TABLE IF NOT EXISTS `xinxue_sections` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `topic_id` INT NOT NULL COMMENT '所属主题ID',
  `type` ENUM('text','quote','reflection','checklist','concept') DEFAULT 'text' COMMENT '内容类型',
  `title` VARCHAR(200) COMMENT '段落标题',
  `content` TEXT COMMENT '内容',
  `source` VARCHAR(200) COMMENT '出处/引用来源',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`topic_id`) REFERENCES `xinxue_topics`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 每日检验记录表
CREATE TABLE IF NOT EXISTS `daily_checkins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT '用户ID',
  `module_type` ENUM('xinxue','science') NOT NULL COMMENT '板块类型',
  `module_id` INT NOT NULL COMMENT '模块ID',
  `content` TEXT COMMENT '检验内容/反思',
  `mood` TINYINT DEFAULT 3 COMMENT '心情评分1-5',
  `checkin_date` DATE NOT NULL COMMENT '检验日期',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_daily` (`user_id`, `module_type`, `module_id`, `checkin_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 科学模块表
CREATE TABLE IF NOT EXISTS `science_modules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL COMMENT '模块名称',
  `slug` VARCHAR(50) NOT NULL UNIQUE COMMENT 'URL标识',
  `subtitle` VARCHAR(200) COMMENT '副标题',
  `description` TEXT COMMENT '模块简介',
  `icon` VARCHAR(20) DEFAULT '🔬' COMMENT '图标emoji',
  `color` VARCHAR(20) DEFAULT '#38bdf8' COMMENT '主题色',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 科学内容块表
CREATE TABLE IF NOT EXISTS `science_sections` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `module_id` INT NOT NULL COMMENT '所属模块ID',
  `type` ENUM('text','concept','experiment','data','quote','interactive') DEFAULT 'text' COMMENT '内容类型',
  `title` VARCHAR(200) COMMENT '段落标题',
  `content` TEXT COMMENT '内容',
  `source` VARCHAR(200) COMMENT '出处/引用来源',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`module_id`) REFERENCES `science_modules`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 预设数据：心学模块
-- ============================================
INSERT INTO `xinxue_modules` (`name`, `slug`, `description`, `icon`, `sort_order`) VALUES
('王阳明心学', 'wangyangming', '王阳明心学是中国哲学史上的重要流派，强调"心即理"、"知行合一"、"致良知"等核心思想，注重内在修养与实践的统一。', '🧘', 1),
('四辩立场', 'sibian', '四辩立场是批判性思维的核心框架，通过分析思维标准、认知偏差、自我反思，培养清晰、理性、客观的思考能力。', '⚖️', 2);

-- 预设数据：王阳明心学 → 4个主题
INSERT INTO `xinxue_topics` (`module_id`, `name`, `slug`, `subtitle`, `description`, `icon`, `sort_order`) VALUES
(1, '心即理', 'xin-ji-li', '心外无物，心外无理', '王阳明提出"心即理"的思想，认为天理不在外部世界，而在每个人的内心之中。宇宙万物之理，皆由心所发。', '💫', 1),
(1, '知行合一', 'zhi-xing-he-yi', '知是行之始，行是知之成', '真知必然付诸行动，行动方能成就真知。知与行如硬币两面，不可分割。', '🔄', 2),
(1, '致良知', 'zhi-liang-zhi', '致吾心之良知于事事物物', '良知是人心本有的道德判断力，致良知即是将内心的良知推广到一切事物上，使行为符合天理。', '✨', 3),
(1, '事上练', 'shi-shang-lian', '人须在事上磨，方立得住', '真正的修行不在静坐冥想，而在日常事务中磨练心性。每件事都是修炼的机会。', '⚒️', 4);

-- 预设数据：四辩立场 → 4个主题
INSERT INTO `xinxue_topics` (`module_id`, `name`, `slug`, `subtitle`, `description`, `icon`, `sort_order`) VALUES
(2, '批判性思维', 'pi-pan-xing-si-wei', '学会提问，理性分析', '批判性思维不是批评，而是对信息进行理性、清晰、有逻辑的分析与评估的能力。', '🔍', 1),
(2, '认知偏差', 'ren-zhi-pian-cha', '认识你的思维陷阱', '了解常见的认知偏差，如确认偏误、锚定效应等，帮助我们识别和纠正思维中的系统性错误。', '🎯', 2),
(2, '思维标准', 'si-wei-biao-zhun', '清晰、准确、逻辑、公正', '掌握批判性思维的九大标准：清晰性、准确性、精确性、相关性、深度、广度、逻辑性、重要性、公正性。', '📐', 3),
(2, '自我反思', 'zi-wo-fan-si', '认识自己是智慧的开端', '定期进行自我反思，审视自己的思维模式、情绪反应和行为习惯，实现持续的自我成长。', '🪞', 4);

-- 预设数据：科学模块（8个）
INSERT INTO `science_modules` (`name`, `slug`, `subtitle`, `description`, `icon`, `color`, `sort_order`) VALUES
('量子思维', 'quantum-thinking', '从量子世界看思维方式', '量子力学不仅改变了物理学，更启发了一种全新的思维方式——拥抱不确定性、叠加态与可能性。', '⚛️', '#38bdf8', 1),
('神经可塑性', 'neuroplasticity', '你的大脑可以重塑', '神经可塑性揭示了大脑终生可变的特性，意味着我们可以通过刻意练习改变思维习惯和认知模式。', '🧠', '#a78bfa', 2),
('意识之光', 'consciousness', '探索意识的奥秘', '意识是科学最大的未解之谜之一。从神经科学到哲学，探索自我意识的本质与起源。', '💡', '#f0d060', 3),
('多巴胺与动机', 'dopamine', '驱动力背后的化学', '多巴胺不仅是快乐分子，更是动机和驱动力背后的关键神经递质。理解它，掌控你的行动力。', '🔥', '#f59e0b', 4),
('心流状态', 'flow-state', '抵达最优体验', '心流是完全沉浸于活动的状态，是创造力与幸福感的高峰体验。学会在日常中触发心流。', '🌊', '#34d399', 5),
('睡眠科学', 'sleep-science', '修复身心的秘密', '睡眠是大脑清理代谢废物、巩固记忆、调节情绪的关键过程。科学睡眠提升认知表现。', '🌙', '#818cf8', 6),
('情绪化学', 'emotion-chemistry', '情绪的分子密码', '情绪不是虚无缥缈的，而是由神经递质和激素调控的生化过程。理解情绪的化学基础。', '🧪', '#f472b6', 7),
('系统思维', 'systems-thinking', '看见世界的连接', '系统思维帮助我们理解事物之间的复杂关联，从整体而非局部视角看待问题。', '🕸️', '#38bdf8', 8);

-- 预设内容：心学内容块
INSERT INTO `xinxue_sections` (`topic_id`, `type`, `title`, `content`, `source`, `sort_order`) VALUES
-- 心即理
(1, 'concept', '核心概念', '<p>王阳明继承并发展了陆九渊"心即理"的思想，认为<strong>天理不在外部世界，而在每个人的内心之中</strong>。宇宙万物之理，皆由心所发。心外无物，心外无理。</p>', NULL, 1),
(1, 'quote', '经典语录', '心即理也。天下又有心外之事，心外之理乎？', '《传习录》', 2),
(1, 'text', '现代解读', '<p>在日常生活中，<strong>心即理</strong>意味着：我们不需要向外寻求答案，真正的智慧和判断力就在我们内心。当我们面对选择时，内心的直觉往往比外在的规则更可靠。</p><p>这并非鼓励主观臆断，而是强调<strong>向内求索</strong>——通过静心反思，我们能听到内心真实的声音。现代心理学中的"内在智慧"概念与此不谋而合。</p>', NULL, 3),
(1, 'reflection', '每日反思', '今天，你是否在某个决定中，感受到了内心真实的声音？请记录下那个瞬间。', NULL, 4),
-- 知行合一
(2, 'concept', '核心概念', '<p><strong>知是行之始，行是知之成。</strong>真知必然付诸行动，行动方能成就真知。知与行如硬币两面，不可分割。没有行动的"知"只是空想，没有认知的"行"只是盲动。</p>', NULL, 1),
(2, 'quote', '经典语录', '知是行的主意，行是知的功夫；知是行之始，行是知之成。', '《传习录》', 2),
(2, 'text', '现代解读', '<p>在信息爆炸的时代，我们常常陷入"知道很多道理，却依然过不好这一生"的困境。<strong>知行合一</strong>告诉我们：真正的"知道"必须包含"做到"的能力。</p><p>如果一个人声称自己知道"早起有益健康"，却每天赖床，那么他其实并不真正"知道"——他只是在<strong>认知层面听说</strong>而已。真正的知，是刻入骨髓、化为行动的。</p>', NULL, 3),
(2, 'reflection', '每日反思', '你今天有没有"知道却做不到"的事？如果再来一次，你会如何把"知道"变成"做到"？', NULL, 4),
-- 致良知
(3, 'concept', '核心概念', '<p><strong>致良知</strong>是王阳明心学的核心方法论。良知是人心本有的道德判断力，是"不虑而知"的本能。致良知即是将内心的良知推广到一切事物上，使行为符合天理。</p>', NULL, 1),
(3, 'quote', '经典语录', '致吾心之良知于事事物物也。吾心之良知，即所谓天理也。', '《传习录》', 2),
(3, 'text', '现代解读', '<p>良知不是外在的道德教条，而是<strong>每个人内心本有的道德直觉</strong>。当你看到不公义的事情感到愤怒，看到需要帮助的人感到怜悯——这就是良知在起作用。</p><p>致良知的"致"是动词，意味着<strong>主动去实践</strong>。仅仅知道什么是善是不够的，还要在具体情境中把善实现出来。这需要勇气和毅力。</p>', NULL, 3),
(3, 'reflection', '每日反思', '今天有没有一个时刻，你的良知告诉你要做什么，但你没有去做？是什么阻碍了你？', NULL, 4),
-- 事上练
(4, 'concept', '核心概念', '<p><strong>人须在事上磨，方立得住。</strong>真正的修行不在静坐冥想，而在日常事务中磨练心性。每件事都是修炼的机会，每个困难都是成长的阶梯。</p>', NULL, 1),
(4, 'quote', '经典语录', '人须在事上磨，方立得住，方能静亦定，动亦定。', '《传习录》', 2),
(4, 'text', '现代解读', '<p>很多人在冥想时感到平静，但一回到生活中就烦躁不安。王阳明指出：<strong>真正的定力不是在安静中保持的，而是在纷扰中保持的。</strong></p><p>工作压力、人际关系、学习困难——这些不是修行的障碍，而是<strong>修行的道场</strong>。每一次面对困难时的冷静，每一次处理冲突时的智慧，都是"事上练"的成果。</p>', NULL, 3),
(4, 'reflection', '每日反思', '今天遇到的最让你心烦的事情是什么？如果重新面对，你会用什么样的心态去处理？', NULL, 4),
-- 批判性思维
(5, 'concept', '核心概念', '<p><strong>批判性思维</strong>是对信息进行理性、清晰、有逻辑的分析与评估的能力。它不是"批评"，而是"审辨"——不轻信、不盲从，用证据和逻辑检验每一个观点。</p>', NULL, 1),
(5, 'text', '思维框架', '<p>批判性思维的三个层次：</p><ol><li><strong>描述层</strong>：发生了什么？信息是什么？</li><li><strong>分析层</strong>：为什么？证据是什么？逻辑是否成立？</li><li><strong>评估层</strong>：这意味着什么？还有哪些可能性？我应该怎么做？</li></ol>', NULL, 2),
(5, 'reflection', '每日反思', '今天你接收到的信息中，有没有哪一条让你产生了怀疑？你是怎么验证它的？', NULL, 3),
-- 认知偏差
(6, 'concept', '核心概念', '<p><strong>认知偏差</strong>是大脑在处理信息时产生的系统性错误。了解这些偏差，是提升思维质量的第一步。</p>', NULL, 1),
(6, 'text', '常见认知偏差', '<ul><li><strong>确认偏误</strong>：倾向于寻找支持自己已有观点的信息</li><li><strong>锚定效应</strong>：过度依赖最先获得的信息</li><li><strong>可得性启发</strong>：根据容易想到的例子来判断概率</li><li><strong>从众效应</strong>：因为大家都这么做而跟随</li><li><strong>幸存者偏差</strong>：只看到成功者而忽略失败者</li></ul>', NULL, 2),
(6, 'reflection', '每日反思', '回顾今天的一个决定，你是否受到了某个认知偏差的影响？', NULL, 3),
-- 思维标准
(7, 'concept', '核心概念', '<p><strong>批判性思维的九大标准</strong>提供了一个框架，帮助我们评估思维的质量。每一个标准都是思维精进的维度。</p>', NULL, 1),
(7, 'text', '九大标准', '<ol><li><strong>清晰性</strong>：能被理解吗？</li><li><strong>准确性</strong>：真实吗？</li><li><strong>精确性</strong>：足够具体吗？</li><li><strong>相关性</strong>：和问题有关吗？</li><li><strong>深度</strong>：考虑了复杂性吗？</li><li><strong>广度</strong>：考虑了其他视角吗？</li><li><strong>逻辑性</strong>：前后一致吗？</li><li><strong>重要性</strong>：聚焦核心问题了吗？</li><li><strong>公正性</strong>：没有偏见吗？</li></ol>', NULL, 2),
(7, 'reflection', '每日反思', '选一个你今天思考过的问题，用九大标准逐一检验它。', NULL, 3),
-- 自我反思
(8, 'concept', '核心概念', '<p><strong>自我反思</strong>是认识自己的起点。定期审视自己的思维模式、情绪反应和行为习惯，是持续成长的关键。</p>', NULL, 1),
(8, 'text', '反思方法', '<p><strong>ORID反思法</strong>：</p><ul><li><strong>O</strong>bjective：发生了什么事实？</li><li><strong>R</strong>eflective：我的感受是什么？</li><li><strong>I</strong>nterpretive：这意味着什么？</li><li><strong>D</strong>ecisional：我接下来要做什么？</li></ul>', NULL, 2),
(8, 'reflection', '每日反思', '今天最有价值的一个收获是什么？你是如何获得它的？', NULL, 3);

-- 预设内容：科学模块内容
INSERT INTO `science_sections` (`module_id`, `type`, `title`, `content`, `sort_order`) VALUES
(1, 'concept', '量子思维概述', '<p><strong>量子思维</strong>是从量子力学中提炼出的思维方式，核心理念包括：</p><ul><li><strong>不确定性</strong>：未来不是确定的，而是多种可能性的叠加</li><li><strong>观察者效应</strong>：观察本身会改变被观察的对象</li><li><strong>量子纠缠</strong>：事物之间存在深层的非局域关联</li><li><strong>波粒二象性</strong>：事物可以同时具有两种看似矛盾的性质</li></ul>', 1),
(1, 'text', '量子思维在生活中的应用', '<p>量子思维不是玄学，而是一种<strong>实用的认知框架</strong>：</p><p>面对不确定性时，不再焦虑地寻求"唯一正确答案"，而是<strong>拥抱多种可能性</strong>；在决策时，意识到自己的观察和判断本身就在塑造结果——这就是"观察者效应"的日常版本。</p>', 2),
(2, 'concept', '什么是神经可塑性', '<p><strong>神经可塑性</strong>是指大脑在整个生命过程中，都能根据经验和学习改变其结构和功能的能力。</p><p>这意味着：<strong>你并不是你的习惯的囚徒。</strong>通过刻意练习，你可以重塑大脑的神经连接，改变思维模式和行为习惯。</p>', 1),
(2, 'text', '如何利用神经可塑性', '<p>利用神经可塑性的三个原则：</p><ol><li><strong>重复</strong>：新行为需要反复练习才能形成神经通路</li><li><strong>专注</strong>：注意力集中时，大脑的可塑性最强</li><li><strong>情绪</strong>：强烈的情绪体验加速神经连接的建立</li></ol>', 2),
(3, 'concept', '意识之谜', '<p><strong>意识</strong>是科学最大的未解之谜之一。为什么我们有主观体验？为什么"我"感觉"我"存在？</p><p>现代神经科学将意识分为两个维度：<strong>觉醒水平</strong>（清醒程度）和<strong>意识内容</strong>（意识到的具体事物）。</p>', 1),
(3, 'text', '提升意识品质', '<p>提升意识品质的日常练习：</p><ul><li><strong>正念冥想</strong>：训练对当下体验的觉察</li><li><strong>感官觉醒</strong>：有意识地使用五感</li><li><strong>元认知</strong>：思考你的思考过程</li><li><strong>心流体验</strong>：在专注中获得意识的深度沉浸</li></ul>', 2),
(4, 'concept', '多巴胺的真实角色', '<p><strong>多巴胺</strong>常被误称为"快乐分子"，但它的真正角色是<strong>动机和驱动力</strong>。多巴胺推动我们追求目标，期待奖励，而不是奖励本身带来的满足感。</p>', 1),
(4, 'text', '驾驭你的多巴胺系统', '<p>合理利用多巴胺机制：</p><ul><li><strong>设定阶段性目标</strong>：每个小目标的达成都能释放多巴胺</li><li><strong>避免过度刺激</strong>：频繁的高强度刺激会导致多巴胺受体下调</li><li><strong>延迟满足</strong>：训练延迟满足能力，增强前额叶对多巴胺系统的调控</li></ul>', 2),
(5, 'concept', '心流：最优体验', '<p><strong>心流</strong>是由心理学家米哈里·契克森米哈赖提出的概念，描述了一种完全沉浸于活动中的状态。在心流中，时间感消失，自我意识减弱，行动与意识融为一体。</p>', 1),
(5, 'text', '触发心流的条件', '<p>进入心流的三个条件：</p><ol><li><strong>明确的目标</strong>：知道每一步要做什么</li><li><strong>即时反馈</strong>：能立即知道自己的表现</li><li><strong>挑战与技能的平衡</strong>：任务难度略高于当前能力</li></ol>', 2),
(6, 'concept', '睡眠的科学', '<p><strong>睡眠</strong>不是大脑的"关机"，而是高度活跃的生理过程。睡眠期间，大脑清理代谢废物、巩固记忆、调节情绪、修复身体。</p>', 1),
(6, 'text', '优化睡眠质量', '<p>科学睡眠的建议：</p><ul><li><strong>保持规律</strong>：每天同一时间入睡和起床</li><li><strong>光照管理</strong>：早晨接触自然光，晚上减少蓝光</li><li><strong>温度</strong>：凉爽的环境有助于入睡</li><li><strong>睡前仪式</strong>：建立一致的睡前放松程序</li></ul>', 2),
(7, 'concept', '情绪的化学基础', '<p><strong>情绪</strong>不是虚无缥缈的，而是由神经递质和激素调控的生化过程。理解情绪的化学基础，能帮助我们更好地管理情绪。</p>', 1),
(7, 'text', '四大情绪化学物质', '<ul><li><strong>多巴胺</strong>：驱动力与期待</li><li><strong>血清素</strong>：平静与满足感</li><li><strong>催产素</strong>：信任与亲密感</li><li><strong>内啡肽</strong>：缓解疼痛与欣快感</li></ul><p>通过运动、社交、目标达成等方式，我们可以主动调节这些化学物质。</p>', 2),
(8, 'concept', '系统思维概述', '<p><strong>系统思维</strong>是一种看待世界的方式，强调事物之间的相互关联和整体性。不同于线性思维，系统思维关注反馈循环、延迟效应和涌现属性。</p>', 1),
(8, 'text', '系统思维的核心原则', '<ul><li><strong>整体性</strong>：系统大于部分之和</li><li><strong>反馈循环</strong>：正反馈放大变化，负反馈维持稳定</li><li><strong>延迟效应</strong>：原因和结果之间可能有时间延迟</li><li><strong>杠杆点</strong>：小改变可以产生大影响</li></ul>', 2);