/* ============================================
   tools.js — 互动工具逻辑
   ============================================ */

// Tab switching for tools page
document.addEventListener('DOMContentLoaded', () => {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.tab;
            const parent = btn.closest('.tool-page') || document;
            parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            parent.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            const panel = parent.querySelector(`#${target}`);
            if (panel) panel.classList.add('active');
        });
    });

    // Pomodoro Timer
    let pomodoroTime = 25 * 60;
    let pomodoroRunning = false;
    let pomodoroInterval = null;
    const pomodoroDisplay = document.getElementById('pomodoro-display');
    const pomodoroStart = document.getElementById('pomodoro-start');
    const pomodoroReset = document.getElementById('pomodoro-reset');

    function updatePomodoroDisplay() {
        if (pomodoroDisplay) {
            const m = Math.floor(pomodoroTime / 60).toString().padStart(2, '0');
            const s = (pomodoroTime % 60).toString().padStart(2, '0');
            pomodoroDisplay.textContent = `${m}:${s}`;
        }
    }

    if (pomodoroStart) {
        pomodoroStart.addEventListener('click', () => {
            if (pomodoroRunning) {
                clearInterval(pomodoroInterval);
                pomodoroRunning = false;
                pomodoroStart.textContent = '开始专注';
            } else {
                pomodoroRunning = true;
                pomodoroStart.textContent = '暂停';
                pomodoroInterval = setInterval(() => {
                    pomodoroTime--;
                    updatePomodoroDisplay();
                    if (pomodoroTime <= 0) {
                        clearInterval(pomodoroInterval);
                        pomodoroRunning = false;
                        pomodoroStart.textContent = '开始专注';
                        pomodoroTime = 25 * 60;
                        updatePomodoroDisplay();
                        alert('专注时间结束！休息一下吧 🎉');
                    }
                }, 1000);
            }
        });
    }

    if (pomodoroReset) {
        pomodoroReset.addEventListener('click', () => {
            clearInterval(pomodoroInterval);
            pomodoroRunning = false;
            pomodoroTime = 25 * 60;
            updatePomodoroDisplay();
            if (pomodoroStart) pomodoroStart.textContent = '开始专注';
        });
    }

    updatePomodoroDisplay();

    // Goal planner - add goal
    const goalInput = document.getElementById('goal-input');
    const goalAdd = document.getElementById('goal-add');
    const goalList = document.getElementById('goal-list');

    if (goalAdd && goalInput && goalList) {
        goalAdd.addEventListener('click', () => {
            const text = goalInput.value.trim();
            if (!text) return;
            const item = document.createElement('div');
            item.className = 'tool-card';
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.justifyContent = 'space-between';
            item.innerHTML = `
                <div>
                    <input type="checkbox" style="margin-right:10px;accent-color:var(--color-accent);">
                    <span style="color:var(--color-text);font-size:0.9rem;">${text}</span>
                </div>
                <span style="color:var(--color-muted);font-size:0.75rem;cursor:pointer;" onclick="this.parentElement.remove()">删除</span>
            `;
            goalList.appendChild(item);
            goalInput.value = '';
        });
    }

    // Value exploration - simple interaction
    const valueBtns = document.querySelectorAll('.value-option');
    valueBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            valueBtns.forEach(b => b.style.borderColor = 'rgba(201, 168, 76, 0.08)');
            btn.style.borderColor = 'var(--color-accent)';
            const result = document.getElementById('value-result');
            if (result) {
                result.textContent = `你选择了「${btn.textContent}」作为核心价值观。这是一个值得深入思考的方向。`;
                result.style.opacity = '0';
                gsap.to(result, { opacity: 1, duration: 0.5 });
            }
        });
    });
});
