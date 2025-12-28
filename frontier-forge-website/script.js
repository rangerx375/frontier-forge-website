// FRONTIER FORGE - PARTICLE ENGINE (SUBTLE EMBERS)

class ParticleSystem {
    constructor() {
        this.canvas = document.getElementById('particles');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.sparks = [];
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.init();
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    init() {
        // Floating embers - reduced count for subtlety
        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: -Math.random() * 0.5 - 0.3,
                opacity: Math.random() * 0.3 + 0.1,
                color: ['#ff6b00', '#b87333', '#cd7f32', '#ffa500'][Math.floor(Math.random() * 4)]
            });
        }
    }

    createSpark(x, y) {
        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 / 15) * i;
            const speed = Math.random() * 4 + 2;
            this.sparks.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 2 + 1,
                life: 1,
                decay: Math.random() * 0.03 + 0.02,
                color: ['#ff6b00', '#ffaa00', '#ff4400'][Math.floor(Math.random() * 3)]
            });
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw floating particles
        this.particles.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY;
            p.opacity += (Math.random() - 0.5) * 0.01;
            p.opacity = Math.max(0.05, Math.min(0.4, p.opacity));

            if (p.y < -10) p.y = this.canvas.height + 10;
            if (p.x < -10) p.x = this.canvas.width + 10;
            if (p.x > this.canvas.width + 10) p.x = -10;

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.opacity;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = p.color;
            this.ctx.fill();
        });

        // Draw sparks
        this.sparks = this.sparks.filter(s => {
            s.x += s.vx;
            s.y += s.vy;
            s.vy += 0.15;
            s.vx *= 0.98;
            s.life -= s.decay;

            if (s.life <= 0) return false;

            this.ctx.beginPath();
            this.ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
            this.ctx.fillStyle = s.color;
            this.ctx.globalAlpha = s.life * 0.8;
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = s.color;
            this.ctx.fill();

            return true;
        });

        this.ctx.globalAlpha = 1;
        this.ctx.shadowBlur = 0;
        requestAnimationFrame(() => this.animate());
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const ps = new ParticleSystem();

    // Mobile Menu
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
        });
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
            });
        });
    }

    // Smooth Scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Nav glow on scroll
    const nav = document.querySelector('.main-nav');
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 100) {
            nav.style.boxShadow = '0 4px 30px rgba(184, 115, 51, 0.3)';
        } else {
            nav.style.boxShadow = 'none';
        }
    });

    // Section reveal with sparks
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                if (ps && ps.createSpark) {
                    const rect = entry.target.getBoundingClientRect();
                    ps.createSpark(rect.left + rect.width/2, rect.top + 50);
                }
            }
        });
    }, { threshold: 0.1, rootMargin: '-50px' });

    document.querySelectorAll('section:not(.hero)').forEach(s => observer.observe(s));

    // Hero parallax
    const hero = document.querySelector('.hero');
    const heroContent = document.querySelector('.hero-content');
    window.addEventListener('scroll', () => {
        const scroll = window.pageYOffset;
        if (scroll < window.innerHeight && hero) {
            hero.style.backgroundPositionY = `${scroll * 0.5}px`;
            if (heroContent) {
                heroContent.style.opacity = 1 - scroll / 700;
                heroContent.style.transform = `translateY(${scroll * 0.3}px)`;
            }
        }
    });

    // Magnetic buttons
    document.querySelectorAll('.btn-primary').forEach(btn => {
        btn.addEventListener('mousemove', e => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width/2;
            const y = e.clientY - rect.top - rect.height/2;
            btn.style.transform = `translate(${x*0.2}px, ${y*0.2}px) scale(1.05)`;
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
        });
        btn.addEventListener('click', (e) => {
            if (ps && ps.createSpark) ps.createSpark(e.clientX, e.clientY);
        });
    });

    // 3D tilt cards
    document.querySelectorAll('.price-card, .schedule-item, .focus-item').forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            card.style.transform = `perspective(1000px) rotateY(${x*10}deg) rotateX(${-y*10}deg) scale(1.02)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });

    // Text scramble on section headers
    document.querySelectorAll('.section-header h2').forEach(h => {
        const orig = h.textContent;
        h.addEventListener('mouseenter', () => {
            let i = 0;
            const int = setInterval(() => {
                h.textContent = orig.split('').map((c, idx) =>
                    idx < i ? orig[idx] : (c === ' ' ? ' ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random()*26)])
                ).join('');
                if (i++ >= orig.length) clearInterval(int);
            }, 30);
        });
    });

    // Scroll progress bar
    const bar = document.createElement('div');
    bar.style.cssText = 'position:fixed;top:0;left:0;height:3px;background:linear-gradient(90deg,#ff4400,#ff6b00,#ffaa00);z-index:10001;box-shadow:0 0 10px #ff6b00;transition:width 0.1s';
    document.body.appendChild(bar);
    window.addEventListener('scroll', () => {
        bar.style.width = (window.pageYOffset / (document.body.scrollHeight - window.innerHeight)) * 100 + '%';
    });
});
