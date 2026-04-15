/* ============================================
   particles.js — 高级金色光斑背景系统
   加强版：更大光晕、更亮核心、脉冲呼吸、深度层次
   ============================================ */

const particleCanvas = document.getElementById('particle-canvas');
const pCtx = particleCanvas.getContext('2d');
let particles = [];
let mouseX = -1000, mouseY = -1000;

function resizeParticleCanvas() {
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
}
resizeParticleCanvas();
window.addEventListener('resize', resizeParticleCanvas);
document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });
document.addEventListener('mouseleave', () => { mouseX = -1000; mouseY = -1000; });

class LightOrb {
    constructor() { this.init(); }
    init() {
        this.x = Math.random() * particleCanvas.width;
        this.y = Math.random() * particleCanvas.height;
        this.vx = (Math.random() - 0.5) * 0.2;
        this.vy = (Math.random() - 0.5) * 0.2;
        // Size: very large atmospheric orbs
        this.radius = Math.random() * 350 + 150;
        this.baseOpacity = Math.random() * 0.08 + 0.02;
        this.pulse = Math.random() * Math.PI * 2;
        this.pulseSpeed = Math.random() * 0.012 + 0.003;
        this.pulseAmount = Math.random() * 0.04 + 0.015;
        // Golden yellow palette — warm, rich, no cyan/blue
        const palettes = [
            { r: 240, g: 200, b: 80 },   // bright gold
            { r: 220, g: 180, b: 60 },   // warm gold
            { r: 200, g: 170, b: 80 },   // antique gold
            { r: 180, g: 150, b: 60 },   // deep gold
            { r: 255, g: 220, b: 100 },  // light gold
            { r: 200, g: 160, b: 80 },   // amber
            { r: 180, g: 140, b: 70 },   // bronze gold
            { r: 230, g: 190, b: 90 },   // honey gold
        ];
        const c = palettes[Math.floor(Math.random() * palettes.length)];
        this.r = c.r; this.g = c.g; this.b = c.b;
        // Depth layers
        this.depth = Math.random();
        this.radius *= (0.3 + this.depth * 0.9);
        this.baseOpacity *= (0.2 + this.depth * 0.8);
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.pulse += this.pulseSpeed;
        // Mouse interaction: gentle push
        const dx = mouseX - this.x, dy = mouseY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 300) {
            const force = (300 - dist) / 300;
            this.x -= dx * 0.0015 * force;
            this.y -= dy * 0.0015 * force;
        }
        // Wrap
        const margin = this.radius;
        if (this.x < -margin) this.x = particleCanvas.width + margin;
        if (this.x > particleCanvas.width + margin) this.x = -margin;
        if (this.y < -margin) this.y = particleCanvas.height + margin;
        if (this.y > particleCanvas.height + margin) this.y = -margin;
    }
    draw() {
        const opacity = this.baseOpacity + Math.sin(this.pulse) * this.pulseAmount;
        const r = Math.max(1, this.radius);
        // Multi-layer glow for richer effect
        // Outer glow
        const g1 = pCtx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r * 1.5);
        g1.addColorStop(0, `rgba(${this.r},${this.g},${this.b},${opacity * 0.3})`);
        g1.addColorStop(0.5, `rgba(${this.r},${this.g},${this.b},${opacity * 0.1})`);
        g1.addColorStop(1, `rgba(${this.r},${this.g},${this.b},0)`);
        pCtx.beginPath();
        pCtx.arc(this.x, this.y, r * 1.5, 0, Math.PI * 2);
        pCtx.fillStyle = g1;
        pCtx.fill();
        // Core glow
        const g2 = pCtx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r);
        g2.addColorStop(0, `rgba(${Math.min(255, this.r + 30)},${Math.min(255, this.g + 30)},${Math.min(255, this.b + 20)},${opacity})`);
        g2.addColorStop(0.3, `rgba(${this.r},${this.g},${this.b},${opacity * 0.6})`);
        g2.addColorStop(0.7, `rgba(${this.r},${this.g},${this.b},${opacity * 0.2})`);
        g2.addColorStop(1, `rgba(${this.r},${this.g},${this.b},0)`);
        pCtx.beginPath();
        pCtx.arc(this.x, this.y, r, 0, Math.PI * 2);
        pCtx.fillStyle = g2;
        pCtx.fill();
        // Bright center point
        const g3 = pCtx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r * 0.15);
        g3.addColorStop(0, `rgba(255,255,240,${opacity * 0.8})`);
        g3.addColorStop(1, `rgba(${this.r},${this.g},${this.b},0)`);
        pCtx.beginPath();
        pCtx.arc(this.x, this.y, r * 0.15, 0, Math.PI * 2);
        pCtx.fillStyle = g3;
        pCtx.fill();
    }
}

// More orbs for richer atmosphere
const orbCount = Math.min(35, Math.floor(window.innerWidth * window.innerHeight / 60000));
for (let i = 0; i < orbCount; i++) particles.push(new LightOrb());

function animateParticles() {
    pCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    // Ambient golden atmosphere
    const W = particleCanvas.width, H = particleCanvas.height;
    const grd = pCtx.createRadialGradient(W * 0.5, H * 0.35, 0, W * 0.5, H * 0.35, W * 0.6);
    grd.addColorStop(0, 'rgba(240, 208, 96, 0.025)');
    grd.addColorStop(0.4, 'rgba(201, 168, 76, 0.012)');
    grd.addColorStop(1, 'transparent');
    pCtx.fillStyle = grd;
    pCtx.fillRect(0, 0, W, H);

    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animateParticles);
}
animateParticles();
