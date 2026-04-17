/* ============================================
   starfield.js — 星空探索 + 分享板块交互
   ============================================ */

const starData = [
    { id: 1, title: '知行合一', x: 30, y: 32, content: '王阳明心学的核心命题。知是行之始，行是知之成。真正的知识不是书本上的文字，而是在实践中体悟的智慧。每一次行动都是对知识的验证，每一次思考都是对行动的指导。', category: '心学感悟' },
    { id: 2, title: '致良知', x: 60, y: 28, content: '每个人心中都有与生俱来的道德判断力。致良知，就是将这种内在的判断力唤醒，并在日常生活中践行。它不需要外界的权威来确认，只需要你安静下来，倾听内心的声音。', category: '心学感悟' },
    { id: 3, title: '格物致知', x: 48, y: 52, content: '探究事物的本质，从而获得真知。在现代语境下，格物就是用科学的方法观察世界，用批判性思维审视信息。当你真正理解了一个事物的本质，知识就变成了智慧。', category: '科学探索' },
    { id: 4, title: '批判性思维', x: 25, y: 58, content: '心灵的免疫系统。它帮助我们识别认知偏差，审视隐藏假设，从多角度分析问题。如同量子力学的互补原理，真理往往存在于多重视角的叠加之中。', category: '科学探索' },
    { id: 5, title: '熵与秩序', x: 68, y: 56, content: '宇宙趋向无序，但生命是逆熵而行的奇迹。当我们主动管理思维，建立规律习惯，就是在创造内心的秩序。知行合一，就是最优雅的反熵增策略。', category: '科学探索' },
    { id: 6, title: '习惯的力量', x: 40, y: 40, content: '习惯是大脑的自动化程序。每一次重复都在强化神经通路。21天不是魔法数字，而是神经可塑性开始显现的起点。好的习惯是通往自由的阶梯，坏的习惯是通向奴役的锁链。', category: '项目复盘' },
    { id: 7, title: '光的启示', x: 55, y: 68, content: '光是宇宙中速度最快的存在，也是信息传递的载体。意识如同光，照亮认知的每一个角落。当你真正看见自己，你就看见了整个宇宙。心即理也，天下又有心外之事、心外之理乎？', category: '心学感悟' },
    { id: 8, title: '思辨与立场', x: 52, y: 34, content: '批判性思维不是否定一切，而是在理解的基础上做出理性判断。它要求我们审视自己的思维过程，识别偏见，追求认知的清晰与准确。这是通往智慧的道路。', category: '心学感悟' },
    { id: 9, title: '心理韧性', x: 72, y: 42, content: '面对挫折时的恢复能力。心理学研究表明，心理韧性不是天生的特质，而是可以通过练习培养的技能。正念冥想、积极重构、社会支持都是增强韧性的有效方法。', category: '科学探索' },
];

// API: Load shares from backend
async function loadSharesFromAPI() {
    try {
        const res = await SharesAPI.getList(1, 50);
        if (res.code === 200 && res.data && res.data.list) {
            const apiShares = res.data.list;
            // Merge API data into starData (keep existing hardcoded as fallback)
            apiShares.forEach((share, i) => {
                const existing = starData.find(s => s.id === share.id);
                if (!existing) {
                    starData.push({
                        id: share.id,
                        title: share.title,
                        x: 20 + Math.random() * 60,
                        y: 20 + Math.random() * 60,
                        content: share.content,
                        category: share.category || '分享'
                    });
                }
            });
            // Re-render if starfield exists
            const container = document.querySelector('.starfield-container');
            if (container) initStarfield();
        }
    } catch (err) {
        console.log('Using fallback star data');
    }
}

let currentMode = 'explore'; // 'explore' or 'grid'
let currentFilter = 'all';

function initStarfield() {
    const container = document.querySelector('.starfield-container');
    if (!container) return;
    // Only remove star nodes and connections, keep the explore hint
    container.querySelectorAll('.star-node, .star-connection').forEach(el => el.remove());
    starData.forEach(star => {
        const node = document.createElement('div');
        node.className = 'star-node';
        node.style.left = star.x + '%';
        node.style.top = star.y + '%';
        node.style.animationDelay = (Math.random() * 4) + 's';
        node.innerHTML = `<span class="star-label">${star.title}</span>`;
        node.addEventListener('click', () => openDeepView(star));
        container.appendChild(node);
    });

    // Draw connection lines between nearby stars
    setTimeout(() => drawStarConnections(container), 100);
}

function drawStarConnections(container) {
    // Remove existing connections
    container.querySelectorAll('.star-connection').forEach(l => l.remove());
    container.querySelectorAll('.star-canvas').forEach(c => c.remove());

    const canvas = document.createElement('canvas');
    canvas.className = 'star-canvas';
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;';
    container.appendChild(canvas);

    // Use requestAnimationFrame to ensure layout is computed
    requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            // Fallback: use window dimensions
            const w = window.innerWidth;
            const h = window.innerHeight;
            canvas.width = w * window.devicePixelRatio;
            canvas.height = h * window.devicePixelRatio;
            const ctx = canvas.getContext('2d');
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            drawLines(ctx, w, h, container);
            return;
        }

        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        const ctx = canvas.getContext('2d');
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        drawLines(ctx, rect.width, rect.height, container);
    });
}

function drawLines(ctx, w, h, container) {
    const nodes = container.querySelectorAll('.star-node');
    const positions = [];

    nodes.forEach(node => {
        const x = parseFloat(node.style.left) / 100 * w;
        const y = parseFloat(node.style.top) / 100 * h;
        positions.push({ x, y });
    });

    const maxDist = 500;
    for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
            const dx = positions[j].x - positions[i].x;
            const dy = positions[j].y - positions[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < maxDist) {
                const opacity = Math.max(0.1, 0.4 * (1 - dist / maxDist));
                const gradient = ctx.createLinearGradient(
                    positions[i].x, positions[i].y,
                    positions[j].x, positions[j].y
                );
                gradient.addColorStop(0, `rgba(240, 208, 96, ${opacity})`);
                gradient.addColorStop(0.5, `rgba(201, 168, 76, ${opacity * 0.7})`);
                gradient.addColorStop(1, `rgba(201, 168, 76, ${opacity * 0.3})`);

                ctx.beginPath();
                ctx.moveTo(positions[i].x, positions[i].y);
                ctx.lineTo(positions[j].x, positions[j].y);
                ctx.strokeStyle = gradient;
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
        }
    }
}

function openDeepView(star) {
    const view = document.getElementById('deep-view');
    if (!view) return;
    view.classList.add('active');
    const content = view.querySelector('.deep-view-content');

    const catLabel = star.category ? `<div class="dv-en">${star.category.toUpperCase()}</div>` : '';
    content.innerHTML = `<h2>${star.title}</h2>${catLabel}`;

    const sentences = star.content.split('。').filter(s => s.trim());
    sentences.forEach((sentence, i) => {
        const p = document.createElement('p');
        p.textContent = sentence + '。';
        content.appendChild(p);
        gsap.set(p, { opacity: 0, y: 10 });
        gsap.to(p, { opacity: 1, y: 0, duration: 0.8, delay: 0.3 + i * 0.6, ease: 'power2.out' });
    });
}

function closeDeepView() {
    const view = document.getElementById('deep-view');
    if (view) view.classList.remove('active');
}

function toggleShareMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    const starfield = document.querySelector('.starfield-container');
    const grid = document.querySelector('.grid-container');
    const filters = document.getElementById('sharing-filters');
    const stats = document.querySelector('.sharing-stats');

    if (mode === 'explore') {
        if (starfield) starfield.style.display = 'flex';
        if (grid) grid.classList.remove('active');
        if (filters) filters.style.display = 'none';
        if (stats) stats.style.display = 'none';
    } else {
        if (starfield) starfield.style.display = 'none';
        if (grid) grid.classList.add('active');
        if (filters) filters.style.display = 'flex';
        if (stats) stats.style.display = 'flex';
    }
}

// Category filter for grid mode
function filterCards(category) {
    currentFilter = category;
    document.querySelectorAll('.sharing-filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.cat === category);
    });
    document.querySelectorAll('.content-card').forEach(card => {
        if (category === 'all' || card.dataset.cat === category) {
            card.style.display = '';
            gsap.fromTo(card, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, delay: Math.random() * 0.2 });
        } else {
            card.style.display = 'none';
        }
    });
}

// Publish modal
function openPublishModal() {
    const modal = document.getElementById('publish-modal');
    if (modal) {
        modal.classList.add('active');
        gsap.fromTo(modal.querySelector('.publish-modal'), { opacity: 0, scale: 0.95, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'back.out(1.5)' });
    }
}

function closePublishModal() {
    const modal = document.getElementById('publish-modal');
    if (modal) modal.classList.remove('active');
}

function submitPublish() {
    const title = document.getElementById('pm-title').value.trim();
    const category = document.getElementById('pm-category').value;
    const content = document.getElementById('pm-content').value.trim();

    if (!title || !content) {
        gsap.to('.publish-modal', { x: [-8, 8, -6, 6, -3, 3, 0], duration: 0.5 });
        return;
    }

    if (!TokenManager.isLoggedIn()) {
        alert('请先登录后再发布分享');
        return;
    }

    // Call API
    SharesAPI.create(title, category, content).then(res => {
        if (res.code === 201) {
            // Clear form and close
            document.getElementById('pm-title').value = '';
            document.getElementById('pm-content').value = '';
            closePublishModal();

            // Reload shares from API
            loadSharesFromAPI();

            // Show success feedback
            const btn = document.getElementById('pm-submit-btn');
            if (btn) {
                const original = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check"></i>&nbsp; 已发布';
                btn.style.background = 'linear-gradient(135deg, #60c060, #40a040)';
                setTimeout(() => {
                    btn.innerHTML = original;
                    btn.style.background = '';
                }, 1500);
            }
        } else {
            alert(res.message || '发布失败');
        }
    });
}

// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initStarfield();

    // Load shares from backend API
    if (typeof SharesAPI !== 'undefined') {
        loadSharesFromAPI();
    }

    // Mode toggle buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => toggleShareMode(btn.dataset.mode));
    });

    // Close deep view
    const closeBtn = document.querySelector('.close-deep');
    if (closeBtn) closeBtn.addEventListener('click', closeDeepView);

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeDeepView();
            closePublishModal();
        }
    });

    // Category filter buttons
    document.querySelectorAll('.sharing-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => filterCards(btn.dataset.cat));
    });

    // Card click to open deep view
    document.querySelectorAll('.content-card').forEach(card => {
        card.addEventListener('click', () => {
            const title = card.querySelector('.card-title')?.textContent || '';
            const category = card.dataset.cat || '';
            const excerpt = card.querySelector('.card-excerpt')?.textContent || '';
            const fullContent = card.dataset.fullContent || excerpt;

            openDeepView({
                title,
                category,
                content: fullContent + '\n\n' + excerpt + '。这是一篇关于' + category + '的深度分享，记录了作者在学习与思考过程中的真实感悟。每一个观点都经过反复推敲，每一段文字都承载着对知识的敬畏与对真理的追求。'
            });
        });
    });

    // Publish modal
    const openBtn = document.getElementById('open-publish-btn');
    if (openBtn) openBtn.addEventListener('click', openPublishModal);

    const closePmBtn = document.getElementById('close-publish-modal');
    if (closePmBtn) closePmBtn.addEventListener('click', closePublishModal);

    const cancelPmBtn = document.getElementById('pm-cancel-btn');
    if (cancelPmBtn) cancelPmBtn.addEventListener('click', closePublishModal);

    const submitPmBtn = document.getElementById('pm-submit-btn');
    if (submitPmBtn) submitPmBtn.addEventListener('click', submitPublish);

    // Click overlay to close modal
    const modalOverlay = document.getElementById('publish-modal');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closePublishModal();
        });
    }

    // Initially hide filters and stats (explore mode is default)
    const filters = document.getElementById('sharing-filters');
    const stats = document.querySelector('.sharing-stats');
    if (filters) filters.style.display = 'none';
    if (stats) stats.style.display = 'none';

    // Redraw connections on resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const container = document.querySelector('.starfield-container');
            if (container && currentMode === 'explore') {
                container.querySelectorAll('.star-connection').forEach(l => l.remove());
                drawStarConnections(container);
            }
        }, 300);
    });
});
