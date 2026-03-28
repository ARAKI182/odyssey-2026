/* =========================================
   LIVE ARK ODYSSEY 2026 — Sand Dust Particles
   ========================================= */

(function () {
  'use strict';

  class SandParticles {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;

      this.ctx = this.canvas.getContext('2d');
      this.particles = [];
      this.running = false;
      this.isMobile = window.innerWidth < 768;
      this.particleCount = this.isMobile ? 30 : 60;

      this.resize();
      window.addEventListener('resize', () => this.resize());
      this.init();
    }

    resize() {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
      this.isMobile = window.innerWidth < 768;
    }

    init() {
      this.particles = [];
      for (let i = 0; i < this.particleCount; i++) {
        this.particles.push(this.createParticle());
      }
      this.start();
    }

    createParticle() {
      const w = this.canvas.width;
      const h = this.canvas.height;
      return {
        x: Math.random() * w,
        y: h * 0.7 + Math.random() * h * 0.3, // Bottom 30%
        vx: (Math.random() - 0.3) * 0.8, // Slight rightward drift
        vy: -Math.random() * 0.3 - 0.1,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.3 + 0.05,
        life: Math.random(),
        decay: Math.random() * 0.003 + 0.001,
      };
    }

    update() {
      const w = this.canvas.width;
      const h = this.canvas.height;

      this.particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;

        // Reset particle if faded or out of bounds
        if (p.life <= 0 || p.x < -10 || p.x > w + 10 || p.y < 0) {
          this.particles[i] = this.createParticle();
        }
      });
    }

    draw() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      this.particles.forEach((p) => {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(212, 197, 160, ${p.opacity * p.life})`;
        this.ctx.fill();
      });
    }

    loop() {
      if (!this.running) return;
      this.update();
      this.draw();
      requestAnimationFrame(() => this.loop());
    }

    start() {
      if (this.running) return;
      this.running = true;
      this.loop();
    }

    stop() {
      this.running = false;
    }
  }

  // Observe hero section visibility to start/stop particles
  document.addEventListener('DOMContentLoaded', () => {
    const particles = new SandParticles('hero-particles');

    const heroSection = document.getElementById('hero');
    if (!heroSection || !particles.canvas) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            particles.start();
          } else {
            particles.stop();
          }
        });
      },
      { threshold: 0 }
    );

    observer.observe(heroSection);
  });
})();
