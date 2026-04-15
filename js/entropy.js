/* ============================================
   entropy.js — 熵增/熵减粒子交互（金色加强版）
   大粒子 + 强光晕 + 运动拖尾 + 连线 + 中心光效
   ============================================ */

let entropyState = 'chaos'; // 'chaos' or 'order'
let entropyParticles = [];
const entropyCanvas = document.createElement('canvas');
entropyCanvas.id = 'entropy-canvas';
entropyCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;';
document.querySelector('.page-home')?.appendChild(entropyCanvas);
const eCtx = entropyCanvas.getContext('2d');

function resizeEntropyCanvas() {
    entropyCanvas.width = window.innerWidth;
    entropyCanvas.height = window.innerHeight;
}
resizeEntropyCanvas();
window.addEventListener('resize', resizeEntropyCanvas);

class EntropyParticle {
    constructor() {
        this.x = Math.random() * entropyCanvas.width;
        this.y = Math.random() * entropyCanvas.height;
        this.size = Math.random() * 4 + 2;
        this.originX = this.x;
        this.originY = this.y;
        this.vx = (Math.random() - 0.5) * 3;
        this.vy = (Math.random() - 0.5) * 3;
        // Golden yellow — rich, warm, bright
        this.hue = 36 + Math.random() * 18; // 36-54 golden range
        this.sat = 88 + Math.random() * 12;
        this.lightness = 58 + Math.random() * 22;
        this.opacity = Math.random() * 0.5 + 0.25;
        this.pulse = Math.random() * Math.PI * 2;
        this.pulseSpeed = Math.random() * 0.025 + 0.01;
        // Trail
        this.trail = [];
        this.maxTrail = Math.floor(Math.random() * 6) + 4;
        // Orbit params for ordered state
        this.orbitR = 60 + Math.random() * 200;
        this.orbitSpeed = 0.002 + Math.random() * 0.008;
        this.orbitAngle = Math.random() * Math.PI * 2;
        this.orbitTilt = (Math.random() - 0.5) * 0.6; // elliptical tilt
    }
    update() {
        this.pulse += this.pulseSpeed;
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrail) this.trail.shift();

        if (entropyState === 'chaos') {
            this.x += this.vx;
            this.y += this.vy;
            // Bounce
            if (this.x < 0 || this.x > entropyCanvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > entropyCanvas.height) this.vy *= -1;
            this.x = Math.max(0, Math.min(entropyCanvas.width, this.x));
            this.y = Math.max(0, Math.min(entropyCanvas.height, this.y));
        } else {
            // Ordered: elliptical orbit around center
            const cx = entropyCanvas.width / 2, cy = entropyCanvas.height / 2;
            this.orbitAngle += this.orbitSpeed;
            const rx = this.orbitR;
            const ry = this.orbitR * (0.6 + this.orbitTilt);
            const targetX = cx + Math.cos(this.orbitAngle) * rx;
            const targetY = cy + Math.sin(this.orbitAngle) * ry;
            this.x += (targetX - this.x) * 0.04;
            this.y += (targetY - this.y) * 0.04;
        }
    }
    draw() {
        const alpha = this.opacity * (0.6 + 0.4 * Math.sin(this.pulse));
        const h = this.hue, s = this.sat, l = this.lightness;

        // Trail with gradient fade
        if (this.trail.length > 1) {
            for (let i = 1; i < this.trail.length; i++) {
                const t = i / this.trail.length;
                eCtx.beginPath();
                eCtx.moveTo(this.trail[i - 1].x, this.trail[i - 1].y);
                eCtx.lineTo(this.trail[i].x, this.trail[i].y);
                eCtx.strokeStyle = `hsla(${h}, ${s}%, ${l}%, ${alpha * t * 0.25})`;
                eCtx.lineWidth = this.size * t * 0.6;
                eCtx.stroke();
            }
            // Last segment to current pos
            eCtx.beginPath();
            eCtx.moveTo(this.trail[this.trail.length - 1].x, this.trail[this.trail.length - 1].y);
            eCtx.lineTo(this.x, this.y);
            eCtx.strokeStyle = `hsla(${h}, ${s}%, ${l}%, ${alpha * 0.25})`;
            eCtx.lineWidth = this.size * 0.6;
            eCtx.stroke();
        }

        // Outer glow (large, soft)
        const glowR = this.size * 5;
        const g1 = eCtx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowR);
        g1.addColorStop(0, `hsla(${h}, ${s}%, ${l}%, ${alpha * 0.15})`);
        g1.addColorStop(0.5, `hsla(${h}, ${s}%, ${l}%, ${alpha * 0.05})`);
        g1.addColorStop(1, `hsla(${h}, ${s}%, ${l}%, 0)`);
        eCtx.beginPath();
        eCtx.arc(this.x, this.y, glowR, 0, Math.PI * 2);
        eCtx.fillStyle = g1;
        eCtx.fill();

        // Inner glow
        const g2 = eCtx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 2);
        g2.addColorStop(0, `hsla(${h}, ${s}%, ${Math.min(90, l + 20)}%, ${alpha * 0.6})`);
        g2.addColorStop(0.5, `hsla(${h}, ${s}%, ${l}%, ${alpha * 0.2})`);
        g2.addColorStop(1, `hsla(${h}, ${s}%, ${l}%, 0)`);
        eCtx.beginPath();
        eCtx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
        eCtx.fillStyle = g2;
        eCtx.fill();

        // Bright core
        eCtx.beginPath();
        eCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        eCtx.fillStyle = `hsla(${h}, ${s}%, ${Math.min(95, l + 25)}%, ${alpha})`;
        eCtx.fill();

        // White-hot center
        eCtx.beginPath();
        eCtx.arc(this.x, this.y, this.size * 0.3, 0, Math.PI * 2);
        eCtx.fillStyle = `rgba(255, 255, 240, ${alpha * 0.6})`;
        eCtx.fill();
    }
}

// More particles for denser effect
const particleCount = Math.min(100, Math.floor(window.innerWidth * window.innerHeight / 12000));
for (let i = 0; i < particleCount; i++) entropyParticles.push(new EntropyParticle());

// Connection lines with golden glow
function drawEntropyConnections() {
    const maxDist = entropyState === 'order' ? 130 : 90;
    const lineAlpha = entropyState === 'order' ? 0.1 : 0.04;
    for (let i = 0; i < entropyParticles.length; i++) {
        for (let j = i + 1; j < entropyParticles.length; j++) {
            const dx = entropyParticles[i].x - entropyParticles[j].x;
            const dy = entropyParticles[i].y - entropyParticles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < maxDist) {
                const a = (1 - dist / maxDist) * lineAlpha;
                eCtx.beginPath();
                eCtx.moveTo(entropyParticles[i].x, entropyParticles[i].y);
                eCtx.lineTo(entropyParticles[j].x, entropyParticles[j].y);
                eCtx.strokeStyle = `rgba(240, 208, 96, ${a})`;
                eCtx.lineWidth = 0.6;
                eCtx.stroke();
            }
        }
    }
}

function animateEntropy() {
    eCtx.clearRect(0, 0, entropyCanvas.width, entropyCanvas.height);
    const W = entropyCanvas.width, H = entropyCanvas.height;

    // Center atmospheric glow
    const grd = eCtx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, W * 0.4);
    const glowAlpha = entropyState === 'order' ? 0.05 : 0.02;
    grd.addColorStop(0, `rgba(240, 208, 96, ${glowAlpha})`);
    grd.addColorStop(0.5, `rgba(201, 168, 76, ${glowAlpha * 0.4})`);
    grd.addColorStop(1, 'transparent');
    eCtx.fillStyle = grd;
    eCtx.fillRect(0, 0, W, H);

    // Ordered state: add orbital ring hint
    if (entropyState === 'order') {
        eCtx.beginPath();
        eCtx.arc(W * 0.5, H * 0.5, 140, 0, Math.PI * 2);
        eCtx.strokeStyle = 'rgba(240, 208, 96, 0.04)';
        eCtx.lineWidth = 1;
        eCtx.stroke();
        eCtx.beginPath();
        eCtx.arc(W * 0.5, H * 0.5, 200, 0, Math.PI * 2);
        eCtx.strokeStyle = 'rgba(240, 208, 96, 0.03)';
        eCtx.lineWidth = 0.8;
        eCtx.stroke();
    }

    drawEntropyConnections();
    entropyParticles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animateEntropy);
}
animateEntropy();

// Toggle button
const entropyBtn = document.getElementById('entropy-toggle');
if (entropyBtn) {
    entropyBtn.addEventListener('click', () => {
        if (entropyState === 'chaos') {
            entropyState = 'order';
            entropyBtn.textContent = '万物皆流（重置高熵）';
            entropyBtn.classList.add('ordered');
        } else {
            entropyState = 'chaos';
            entropyBtn.textContent = '知行合一（执行降熵）';
            entropyBtn.classList.remove('ordered');
            entropyParticles.forEach(p => {
                p.vx = (Math.random() - 0.5) * 3;
                p.vy = (Math.random() - 0.5) * 3;
            });
        }
    });
}
