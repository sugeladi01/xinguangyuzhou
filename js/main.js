/* ============================================
   main.js — 全屏翻页逻辑 + 全局导航
   ============================================ */

let currentPage = 1;
const totalPages = 7;
let isAnimating = false;

function goToPage(targetPage) {
    if (targetPage < 1 || targetPage > totalPages) return;
    if (targetPage === currentPage) return;

    isAnimating = true;

    const currentEl = document.getElementById(`page-${currentPage}`);
    const targetEl = document.getElementById(`page-${targetPage}`);
    if (!currentEl || !targetEl) { isAnimating = false; return; }

    const direction = targetPage > currentPage ? 1 : -1;

    // Safety timeout to prevent stuck state
    const safetyTimer = setTimeout(() => { isAnimating = false; }, 1000);

    const tl = gsap.timeline({
        onComplete: () => {
            clearTimeout(safetyTimer);
            isAnimating = false;
            currentPage = targetPage;
            updatePageButtons();
            updateNavHighlight();
            updatePageIndicator();
        }
    });

    // Switch active class for pointer-events & visibility
    currentEl.classList.remove('active');
    targetEl.classList.add('active');
    // Force pointer-events via inline style for iframe pages
    document.querySelectorAll('.full-page').forEach(p => {
        if (p.classList.contains('active')) {
            p.style.visibility = 'visible';
            p.style.pointerEvents = 'auto';
        } else {
            p.style.visibility = 'hidden';
            p.style.pointerEvents = 'none';
        }
    });

    tl.to(currentEl, { opacity: 0, x: -100 * direction, duration: 0.3, ease: 'power2.in' });
    gsap.set(targetEl, { opacity: 0, x: 100 * direction });
    tl.to(targetEl, { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' });
    tl.set(currentEl, { x: 0 });
}

function nextPage() { goToPage(currentPage + 1); }
function prevPage() { goToPage(currentPage - 1); }

function updatePageIndicator() {
    document.querySelectorAll('.page-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i + 1 === currentPage);
    });
}

function updatePageButtons() {
    const prev = document.getElementById('btn-prev');
    const next = document.getElementById('btn-next');
    if (prev) prev.disabled = (currentPage === 1);
    if (next) next.disabled = (currentPage === totalPages);
    // Update label & progress
    const label = document.getElementById('page-label');
    const bar = document.getElementById('progress-bar');
    if (label) label.textContent = currentPage + ' / ' + totalPages;
    if (bar) bar.style.width = (currentPage / totalPages * 100) + '%';
}

function updateNavHighlight() {
    const navLinks = document.querySelectorAll('#global-nav .nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    // Map page numbers to nav text
    const pageNavMap = { 1: '首页', 2: '心学', 3: '科学', 4: '分享', 5: '工具', 6: '研讨', 7: '留言' };
    const targetText = pageNavMap[currentPage];
    if (targetText) {
        navLinks.forEach(link => {
            if (link.textContent.trim() === targetText) link.classList.add('active');
        });
    }
}

// Keyboard
document.addEventListener('keydown', (e) => {
    // Don't flip pages when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextPage();
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prevPage();
});

// Mouse wheel
let wheelTimeout = null;
document.addEventListener('wheel', (e) => {
    // Prevent page flip when scrolling inside scrollable content
    const scrollable = e.target.closest('.science-cards-stack, .science-visual, .science-card, .sharing-cards-container, .content-card, textarea, [style*="overflow"]');
    if (scrollable) return;
    if (wheelTimeout) return;
    wheelTimeout = setTimeout(() => { wheelTimeout = null; }, 800);
    if (e.deltaY > 0) nextPage(); else prevPage();
}, { passive: true });

// Touch support
let touchStartY = 0;
document.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; }, { passive: true });
document.addEventListener('touchend', (e) => {
    const diff = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 50) { diff > 0 ? nextPage() : prevPage(); }
}, { passive: true });

// Page dots
document.querySelectorAll('.page-dot').forEach(dot => {
    dot.addEventListener('click', () => goToPage(parseInt(dot.dataset.page)));
});

// Science: exhibit data
const exhibitData = [
    {
        title: '量子思维', formula: 'ψ = α|0⟩ + β|1⟩ — 叠加态',
        sections: [
            { title: '核心概念', text: '量子力学告诉我们，微观粒子在被观察之前处于「叠加态」——同时存在于多种可能性的叠加之中。只有当观察发生时，波函数坍缩，粒子才「选择」一个确定的状态。' },
            { title: '与心学的联系', text: '王阳明的「心即理」与量子观察者效应有惊人的相似：观察者（意识）不是被动的旁观者，而是现实构建的参与者。你关注什么，什么就成为你的现实。' },
            { title: '科学应用', text: '量子纠缠表明两个粒子可以超越时空距离瞬间关联。这暗示宇宙在深层可能是不可分割的整体——正如心学所说「万物一体」。' }
        ],
        think: '💭 你的思维目前处于什么「叠加态」？有哪些可能性你还没有去「观察」和「坍缩」？'
    },
    {
        title: '神经可塑性', formula: 'ΔSynapse = Experience × Repetition × Attention',
        sections: [
            { title: '核心概念', text: '神经可塑性是大脑在整个生命过程中重新组织自身神经连接的能力。每一次学习、每一次经历，都在物理层面改变着你的大脑结构。' },
            { title: '习惯与神经回路', text: '重复的行为会强化特定的神经通路，使其越来越自动化。这就是为什么「知行合一」如此重要——只有通过反复实践，知识才能真正「刻入」大脑。' },
            { title: '冥想的神经科学', text: 'fMRI 研究显示，持续 8 周的正念冥想可以增厚前额叶皮层（负责决策和专注），同时缩小杏仁核（负责恐惧和焦虑）。这是神经可塑性的直接证据。' }
        ],
        think: '💭 你想强化哪些神经通路？你每天在重复什么「回路」？'
    },
    {
        title: '心理熵', formula: 'ΔS_mind = Wasted_Energy / Clarity',
        sections: [
            { title: '核心概念', text: '借用热力学的「熵」概念：心理熵衡量的是思维系统的混乱程度。目标模糊、信息过载、情绪波动都会增加心理熵，消耗认知能量。' },
            { title: '减熵策略', text: '冥想（专注呼吸）= 减少信息噪声；写日记（外化思维）= 降低工作记忆负荷；制定计划（明确目标）= 减少不确定性。这些行为都是心理世界的「麦克斯韦妖」。' },
            { title: '心学的减熵', text: '王阳明说「破山中贼易，破心中贼难」。心中的「贼」就是高熵状态——杂念、执念、偏见。致良知的过程，就是将心理熵降到最低的过程。' }
        ],
        think: '💭 你现在的心理熵是多少？列出三件让你「混乱」的事，给每件写一个最小可行行动。'
    },
    {
        title: '意识之光', formula: 'E = hν → 意识的频率决定其能量',
        sections: [
            { title: '核心概念', text: '爱因斯坦的 E=mc² 揭示了质量与能量的等价性。普朗克的 E=hν 将能量与频率联系起来。如果意识也是一种能量形式，那么它的「频率」可能决定了它的「亮度」。' },
            { title: '脑波与意识状态', text: '不同意识状态对应不同脑波频率：δ波(0.5-4Hz)深度睡眠、θ波(4-8Hz)冥想直觉、α波(8-13Hz)放松创造、β波(13-30Hz)专注思考、γ波(40-100Hz)顿悟整合。' },
            { title: '光与心学', text: '王阳明晚年提出「四句教」：「无善无恶心之体」——心的本体如同纯净的光，不染一物。「知善知恶是良知」——意识之光照亮善恶，便是良知觉醒。' }
        ],
        think: '💭 你目前的意识处于什么「频率」？如何让自己进入更高频的「心流」状态？'
    },
    {
        title: '多巴胺与动机', formula: 'Motivation = Dopamine × Expectation × Effort',
        sections: [
            { title: '核心概念', text: '多巴胺不是「快乐分子」，而是「动机分子」。它在你预期获得奖励时释放，驱动你采取行动。研究表明，多巴胺在「渴望」阶段的分泌远高于「满足」阶段。' },
            { title: '奖励回路', text: '大脑的奖励回路：预期奖励→多巴胺释放→采取行动→获得奖励→多巴胺回落。社交媒体、短视频正是通过不断制造「预期」来劫持这个回路。' },
            { title: '与心学的联系', text: '王阳明说「去私欲，存天理」。私欲往往是对短期多巴胺刺激的追逐——刷手机、吃甜食、拖延。致良知就是重新训练奖励回路，让长期价值成为真正的动力源。' }
        ],
        think: '💭 你今天被什么「多巴胺陷阱」消耗了时间？试着设计一个更有意义的奖励机制。'
    },
    {
        title: '心流状态', formula: 'Flow = |Skill − Challenge| → 0',
        sections: [
            { title: '核心概念', text: '心理学家契克森米哈赖发现：当技能水平与挑战难度完美匹配时，人会进入「心流」状态——完全沉浸、时间感消失、自我意识消退、表现达到巅峰。' },
            { title: '心流条件', text: '进入心流需要：明确的目标、即时的反馈、挑战与技能的平衡。太简单会无聊，太难会焦虑。心流存在于无聊与焦虑之间的狭窄通道中。' },
            { title: '与心学的联系', text: '王阳明描述的「知行合一」状态，本质上就是一种心流——行动与意识完全融合，没有犹豫、没有内耗。「事上练」就是在日常中寻找心流入口。' }
        ],
        think: '💭 回忆你最近一次「忘记时间」的经历。那件事的挑战和你的技能是否匹配？'
    },
    {
        title: '睡眠科学', formula: 'Memory Consolidation ∝ Deep Sleep × REM',
        sections: [
            { title: '核心概念', text: '睡眠不是「关机」，而是大脑最活跃的维护时段。深度睡眠负责清除代谢废物（通过类淋巴系统），REM 睡眠负责巩固记忆和整合情绪。' },
            { title: '睡眠与认知', text: '睡眠不足 24 小时，认知能力下降程度相当于醉酒。长期睡眠不足与阿尔茨海默病风险增加直接相关。每晚 7-9 小时是大脑维护的最佳窗口。' },
            { title: '与心学的联系', text: '王阳明重视「静坐」功夫，这与现代睡眠科学不谋而合——安静不是浪费时间，而是让大脑进行自我修复和整合。「知是行之始」始于一个清醒的头脑。' }
        ],
        think: '💭 你昨晚睡了多久？如果每天多睡 30 分钟，一个月后你的认知能力会有什么变化？'
    },
    {
        title: '情绪化学', formula: 'Emotion = Serotonin + Cortisol + Oxytocin',
        sections: [
            { title: '核心概念', text: '情绪是神经递质的交响乐：血清素（5-HT）调节幸福感，皮质醇管理压力反应，催产素构建信任与连接，多巴胺驱动动机，内啡肽缓解疼痛。' },
            { title: '情绪调节', text: '运动释放内啡肽和血清素，是天然的抗抑郁药。社交接触促进催产素分泌。冥想降低皮质醇水平。拥抱 20 秒以上可以显著提升催产素。' },
            { title: '与心学的联系', text: '王阳明说「此心不动，随机而动」——情绪管理的最高境界不是压抑情绪，而是让心保持清澈，情绪来去自如。这与调节神经递质平衡的思路完全一致。' }
        ],
        think: '💭 你现在的主导情绪是什么？它可能是由哪种神经递质主导的？你可以做什么来平衡它？'
    }
];

function openExhibit(idx) {
    const data = exhibitData[idx];
    if (!data) return;
    const container = document.getElementById('sed-content');
    if (!container) return;
    let html = `<h2>${data.title}</h2><div class="sed-formula">${data.formula}</div>`;
    data.sections.forEach(s => {
        html += `<div class="sed-section"><h4>${s.title}</h4><p>${s.text}</p></div>`;
    });
    html += `<div class="sed-think">${data.think}</div>`;
    container.innerHTML = html;
    document.getElementById('exhibit-detail').classList.add('open');
}

function closeExhibit() {
    document.getElementById('exhibit-detail').classList.remove('open');
}

// Science: toggle card (compatibility)
function toggleSciCard(card) { card.classList.toggle('expanded'); }
function toggleScienceCard(card) { toggleSciCard(card); }
function switchMetric(el) {}

// Concept card expand
function toggleCard(card) {
    document.querySelectorAll('.concept-card.expanded').forEach(c => {
        if (c !== card) c.classList.remove('expanded');
    });
    card.classList.toggle('expanded');
}

// Philosophy: switch tab
function switchPhilTab(tab, btn) {
    document.querySelectorAll('.phil-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.phil-tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('phil-' + tab).classList.add('active');
}

// Philosophy: quote rotation
const philQuotes = [
    { text: '知是行之始，行是知之成。', source: '— 王阳明《传习录》' },
    { text: '破山中贼易，破心中贼难。', source: '— 王阳明《王文成公全书》' },
    { text: '心即理也。天下又有心外之事、心外之理乎？', source: '— 王阳明《传习录》' },
    { text: '致良知，是谓知行合一。', source: '— 王阳明《传习录》' },
    { text: '无善无恶心之体，有善有恶意之动。', source: '— 王阳明《四句教》' },
    { text: '知善知恶是良知，为善去恶是格物。', source: '— 王阳明《四句教》' },
    { text: '事上磨练，方有得力处。', source: '— 王阳明《传习录》' },
    { text: '人胸中各有个圣人，只自信不及，都自埋倒了。', source: '— 王阳明《传习录》' },
];
let philQuoteIdx = 0;
function refreshPhilQuote() {
    philQuoteIdx = (philQuoteIdx + 1) % philQuotes.length;
    const q = philQuotes[philQuoteIdx];
    const textEl = document.getElementById('phil-main-quote');
    const sourceEl = document.getElementById('phil-main-source');
    if (textEl && sourceEl) {
        textEl.style.opacity = 0; sourceEl.style.opacity = 0;
        setTimeout(() => { textEl.textContent = q.text; sourceEl.textContent = q.source; textEl.style.opacity = 1; sourceEl.style.opacity = 1; }, 200);
    }
}

// Critical thinking quotes
const criticalQuotes = [
    { text: '批判性思维是心灵的免疫系统。', source: '— 《思辨与立场》' },
    { text: '未经审视的人生不值得过。', source: '— 苏格拉底' },
    { text: '我们看到的不是事物本身，而是我们自己。', source: '— 阿娜伊斯·宁' },
    { text: '认知偏差是思维的盲点，批判性思维是照亮盲点的光。', source: '— 丹尼尔·卡尼曼' },
    { text: '真正有智慧的人，是知道自己无知的人。', source: '— 苏格拉底' },
    { text: '思维的质量决定了生活的质量。', source: '— 《思辨与立场》' },
    { text: '当你改变看世界的方式，你看到的世界也会改变。', source: '— 韦恩·戴尔' },
    { text: '最危险的思维陷阱，是不知道自己正陷入思维陷阱。', source: '— 查理·芒格' },
];
let criticalQuoteIdx = 0;
function refreshCriticalQuote() {
    criticalQuoteIdx = (criticalQuoteIdx + 1) % criticalQuotes.length;
    const q = criticalQuotes[criticalQuoteIdx];
    const textEl = document.getElementById('phil-critical-quote');
    const sourceEl = document.getElementById('phil-critical-source');
    if (textEl && sourceEl) {
        textEl.style.opacity = 0; sourceEl.style.opacity = 0;
        setTimeout(() => { textEl.textContent = q.text; sourceEl.textContent = q.source; textEl.style.opacity = 1; sourceEl.style.opacity = 1; }, 200);
    }
}

// Philosophy: detail data
const philDetailData = [
    { title: '知行合一', sections: [
        { title: '心学原义', text: '王阳明认为，知与行是一个功夫的两面。真知必行，不行非知。知而不行，只是未知。这不是理论，而是实践的真理。' },
        { title: '现代解读', text: '心理学中的「具身认知」理论证实：知识必须通过身体实践来巩固。刻意练习理论告诉我们，真正的能力来自反复的、有目的的练习。' },
        { title: '实践方法', text: '每天选择一件「知道应该做」的事，立即去做。不需要完美，只需要开始。记录你的「知行合一」时刻，逐渐建立行动的习惯。' }
    ], think: '💭 列出三件你「知道」但「没做」的事，今天选一件开始行动。' },
    { title: '致良知', sections: [
        { title: '心学原义', text: '良知是每个人心中与生俱来的道德判断力。不需要向外求索，只需要安静下来，倾听内心的声音。致良知，就是将这种内在的判断力唤醒并践行。' },
        { title: '现代解读', text: '认知科学中的「元认知」概念与之相似：对自己的思维过程进行观察和调节。正念冥想训练的核心，就是培养这种对内在状态的觉察能力。' },
        { title: '实践方法', text: '每天花5分钟安静独处，不做任何事，只是观察自己的念头。不评判、不跟随，只是看见。这就是「致良知」的入门功夫。' }
    ], think: '💭 闭上眼睛30秒，观察你脑海中浮现的第一个念头。它是什么？它从哪里来？' },
    { title: '心即理', sections: [
        { title: '心学原义', text: '王阳明认为，天理不在心外，而在心中。心外无物，心外无理。这不是唯心主义的极端主张，而是说我们对世界的认知和理解，都取决于心的状态。' },
        { title: '现代解读', text: '康德的「人为自然立法」与心即理异曲同工：我们认识的世界，是经过心灵加工的世界。建构主义心理学也认为，知识不是客观存在的，而是主体建构的。' },
        { title: '实践方法', text: '注意你对同一件事的不同反应。为什么有时平静，有时愤怒？外在事件没变，变的是你的心。观察这种变化，就是理解「心即理」的开始。' }
    ], think: '💭 回忆一件最近让你情绪波动的事。是事件本身让你如此，还是你对事件的解读让你如此？' },
    { title: '事上练', sections: [
        { title: '心学原义', text: '王阳明晚年特别强调「事上磨练」：真正的修行不在深山古寺，而在日常的每一件事中。面对困难、处理关系、完成工作——每一件事都是修行的道场。' },
        { title: '现代解读', text: '积极心理学的研究证实：成长发生在挑战的边缘（最近发展区）。只有在真实情境中面对真实困难，才能获得真正的心理成长。' },
        { title: '实践方法', text: '选择一件你正在回避的困难事，今天迈出最小的一步。不需要解决全部，只需要开始。「事上练」的关键是在行动中觉察，在觉察中成长。' }
    ], think: '💭 你最近在回避什么困难？最小的一步是什么？今天能做吗？' },
    { title: '批判性思维', sections: [
        { title: '核心定义', text: '批判性思维不是「批判别人」，而是「审视自己的思维」。它包括：识别假设、评估证据、发现逻辑谬误、考虑多个视角、做出理性判断。' },
        { title: '与心学的关系', text: '王阳明的「致良知」本身就是一种批判性思维——审视自己内心的真实声音，不被外界权威、社会舆论、个人偏见所遮蔽。' },
        { title: '实践方法', text: '下次当你形成一个强烈的观点时，问自己三个问题：1. 我的证据是什么？2. 有没有反例？3. 如果我是错的，我愿意改变吗？' }
    ], think: '💭 选择一个你坚信的观点，试着找出一个反对它的有力论据。' },
    { title: '认知偏差', sections: [
        { title: '常见偏差', text: '确认偏差：只关注支持自己观点的信息。锚定效应：被第一个接收的信息过度影响。可得性启发：根据容易想到的例子判断概率。沉没成本谬误：因为已经投入而继续错误的决定。' },
        { title: '与心学的关系', text: '王阳明说「破心中贼难」，认知偏差就是现代版的「心中贼」。它们悄无声息地影响我们的判断，而我们往往浑然不觉。' },
        { title: '实践方法', text: '做重大决定前，写下你的理由。然后问自己：如果我的朋友做同样的决定，我会给他什么建议？这个「朋友视角」可以帮助你跳出自我中心。' }
    ], think: '💭 回忆一个最近的重大决定。你当时考虑了哪些因素？有没有被某个认知偏差影响？' },
    { title: '思维标准', sections: [
        { title: '七大标准', text: '《思辨与立场》提出思维的通用标准：清晰性、准确性、精确性、相关性、深度、广度、逻辑性。加上公正性，共八个维度构成批判性思维的完整框架。' },
        { title: '与心学的关系', text: '「致良知」要求思维达到清晰和准确——不被杂念遮蔽。「知行合一」要求逻辑一致性——言行一致。「事上练」要求思维的深度和广度——在实践中不断深化理解。' },
        { title: '实践方法', text: '写一段话表达你的观点，然后用八个标准逐一检验。你会发现，大多数时候我们的思维都达不到这些标准。这正是成长的空间。' }
    ], think: '💭 用「清晰性」和「准确性」标准，重新审视你最近说的一句话。它能通过检验吗？' },
    { title: '自我反思', sections: [
        { title: '反思的力量', text: '苏格拉底说「未经审视的人生不值得过」。自我反思是批判性思维的最高形式——将批判的矛头指向自己的思维过程本身。' },
        { title: '与心学的关系', text: '王阳明的「静坐」功夫就是一种自我反思。通过安静地观察自己的念头，识别哪些是良知的声音，哪些是私欲的干扰。' },
        { title: '实践方法', text: '每天睡前花3分钟回顾今天：1. 什么时候我情绪最激动？为什么？2. 我做了什么决定？理由充分吗？3. 如果重来一次，我会怎么做？' }
    ], think: '💭 今天你做过最不理性的决定是什么？如果当时多想5分钟，结果会不同吗？' },
];

function openPhilDetail(idx) {
    const data = philDetailData[idx];
    if (!data) return;
    const container = document.getElementById('phil-detail-content');
    if (!container) return;
    let html = `<h2>${data.title}</h2>`;
    data.sections.forEach(s => {
        html += `<div class="sed-section"><h4>${s.title}</h4><p>${s.text}</p></div>`;
    });
    html += `<div class="sed-think">${data.think}</div>`;
    container.innerHTML = html;
    document.getElementById('phil-detail').classList.add('open');
}

function closePhilDetail() {
    document.getElementById('phil-detail').classList.remove('open');
}

// Philosophy: toggle card (compatibility)
function togglePhilCard(card) { openPhilDetail(0); }
function expandQuote(card) {}

// Philosophy: refresh daily wisdom
const wisdomList = [
    { text: '知是行之始，行是知之成。', source: '— 王阳明《传习录》' },
    { text: '破山中贼易，破心中贼难。', source: '— 王阳明《王文成公全书》' },
    { text: '心即理也。天下又有心外之事、心外之理乎？', source: '— 王阳明《传习录》' },
    { text: '致良知，是谓知行合一。', source: '— 王阳明《传习录》' },
    { text: '无善无恶心之体，有善有恶意之动。', source: '— 王阳明《四句教》' },
    { text: '知善知恶是良知，为善去恶是格物。', source: '— 王阳明《四句教》' },
    { text: '事上磨练，方有得力处。', source: '— 王阳明《传习录》' },
    { text: '人胸中各有个圣人，只自信不及，都自埋倒了。', source: '— 王阳明《传习录》' },
];
let currentWisdomIdx = 0;
function refreshDailyWisdom() {
    currentWisdomIdx = (currentWisdomIdx + 1) % wisdomList.length;
    const w = wisdomList[currentWisdomIdx];
    const textEl = document.getElementById('dw-text');
    const sourceEl = document.getElementById('dw-source');
    if (textEl && sourceEl) {
        textEl.style.opacity = 0;
        sourceEl.style.opacity = 0;
        setTimeout(() => {
            textEl.textContent = w.text;
            sourceEl.textContent = w.source;
            textEl.style.opacity = 1;
            sourceEl.style.opacity = 1;
        }, 200);
    }
}

// Hero: update time display
function updateHeroTime() {
    const clockEl = document.getElementById('ht-clock');
    const greetingEl = document.getElementById('ht-greeting');
    if (!clockEl || !greetingEl) return;
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    clockEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes}`;
    let greeting = '晚安';
    if (hours >= 5 && hours < 12) greeting = '早安';
    else if (hours >= 12 && hours < 18) greeting = '午安';
    else if (hours >= 18 && hours < 22) greeting = '晚上好';
    greetingEl.textContent = greeting;
}

// Init
window.addEventListener('DOMContentLoaded', () => {
    const firstPage = document.getElementById('page-1');
    if (firstPage) gsap.set(firstPage, { opacity: 1, visibility: 'visible' });
    // Force pointer-events on all pages via inline style
    document.querySelectorAll('.full-page').forEach(p => {
        if (p.classList.contains('active')) {
            p.style.visibility = 'visible';
            p.style.pointerEvents = 'auto';
        } else {
            p.style.visibility = 'hidden';
            p.style.pointerEvents = 'none';
        }
    });
    updatePageButtons();
    updateNavHighlight();
    // Update hero time
    updateHeroTime();
    setInterval(updateHeroTime, 60000);

    // Page flip buttons
    const prevBtn = document.getElementById('btn-prev');
    const nextBtn = document.getElementById('btn-next');
    if (prevBtn) prevBtn.addEventListener('click', prevPage);
    if (nextBtn) nextBtn.addEventListener('click', nextPage);

    // Loading screen
    setTimeout(() => {
        const loading = document.getElementById('loading-screen');
        if (loading) loading.classList.add('hidden');
    }, 1500);

    // Entry animation for page 1
    setTimeout(() => {
        const elements = document.querySelectorAll('.page-home .hero-title, .page-home .hero-subtitle, .page-home .hero-quote, .page-home .entropy-toggle');
        gsap.from(elements, {
            opacity: 0, y: 30, duration: 0.8, stagger: 0.15, ease: 'power2.out'
        });
    }, 1600);
});
