(function () {
    const introEl = document.getElementById('hello-intro');
    const canvas  = document.getElementById('hello-canvas');
    const progressBar = document.getElementById('hello-progress-bar');
    const progressTrack = document.querySelector('.hello-progress');
    const loadButton = document.getElementById('load-website');
    const consoleDock = document.querySelector('.welcome-console-dock');
    const loaderStatus = document.getElementById('loader-status');
    const loaderPercent = document.getElementById('loader-percent');
    if (!introEl || !canvas) return;

    const ctx = canvas.getContext('2d');
    document.body.style.overflow = 'hidden';
    const isMobile = window.innerWidth < 640;

    let W, H, dpr;
    let pointerX = -1000;
    let pointerY = -1000;
    let smoothPointerX = -1000;
    let smoothPointerY = -1000;
    let isPointerActive = false;
    let touchStartY = null;

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
        W = window.innerWidth;
        H = window.innerHeight;
        document.documentElement.style.setProperty('--viewport-height', `${H}px`);
        canvas.width  = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width  = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const FORM_MS        = 1200;
    const SETTLE_MS      = 300;
    const HOLD_MS        = 500;
    const TOTAL_DURATION = FORM_MS + SETTLE_MS + HOLD_MS;

    let start = null;
    let introFinished = false;

    function finishIntro() {
        if (introFinished) return;
        introFinished = true;
        if (progressBar) progressBar.style.width = '100%';
        if (progressTrack) progressTrack.setAttribute('aria-valuenow', '100');
        if (loaderPercent) loaderPercent.textContent = '100%';
        introEl.classList.add('fade-out');
        document.body.style.overflow = '';
        setTimeout(() => {
            if (introEl.parentNode) introEl.remove();
        }, 900);
    }

    function updateTelemetry(progress) {
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (progressTrack) progressTrack.setAttribute('aria-valuenow', String(Math.round(progress)));
        if (loaderPercent) {
            loaderPercent.textContent = String(Math.min(100, Math.round(progress))).padStart(2, '0') + '%';
        }
        if (loaderStatus) {
            if (progress < 28) {
                loaderStatus.textContent = 'INITIALIZING SYSTEM';
            } else if (progress < 60) {
                loaderStatus.textContent = 'PREPARING EXPERIENCE';
            } else if (progress < 90) {
                loaderStatus.textContent = 'CONFIGURING SHADERS';
            } else if (progress < 100) {
                loaderStatus.textContent = 'CALIBRATING ENVIRONMENT';
            } else {
                loaderStatus.textContent = 'SYSTEM READY';
            }
        }
    }

    function drawAmbientLighting(elapsed) {
        ctx.clearRect(0, 0, W, H);
        const cx = W / 2;
        const cy = H / 2;

        // Smooth subtle cursor tracking spotlight
        if (isPointerActive) {
            const spotGrad = ctx.createRadialGradient(smoothPointerX, smoothPointerY, 0, smoothPointerX, smoothPointerY, Math.max(W, H) * 0.45);
            spotGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
            spotGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.03)');
            spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = spotGrad;
            ctx.fillRect(0, 0, W, H);
        }

        // Center ambient luxury pulse behind the title
        const pulse = Math.sin(elapsed * 0.0018) * 0.03 + 0.10;
        const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.42);
        centerGrad.addColorStop(0, `rgba(255, 255, 255, ${pulse})`);
        centerGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.02)');
        centerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = centerGrad;
        ctx.fillRect(0, 0, W, H);
    }

    function animate(ts) {
        if (introFinished) return;
        if (!start) start = ts;
        const elapsed = ts - start;
        const rawProgress = (elapsed / TOTAL_DURATION) * 100;
        const progress = Math.min(100, rawProgress);

        updateTelemetry(progress);

        // Smooth pointer tracking
        if (!isPointerActive) {
            smoothPointerX += (W / 2 - smoothPointerX) * 0.05;
            smoothPointerY += (H / 2 - smoothPointerY) * 0.05;
        } else {
            smoothPointerX += (pointerX - smoothPointerX) * 0.08;
            smoothPointerY += (pointerY - smoothPointerY) * 0.08;
        }

        const isReady = progress >= 100;
        if (consoleDock) {
            consoleDock.classList.toggle('is-ready', isReady);
        }
        if (loadButton) {
            loadButton.disabled = !isReady;
        }

        drawAmbientLighting(elapsed);
        requestAnimationFrame(animate);
    }

    function startIntro() {
        resize();
        smoothPointerX = W / 2;
        smoothPointerY = H / 2;

        window.addEventListener('resize', resize);
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', resize, { passive: true });
        }

        window.addEventListener('pointermove', event => {
            pointerX = event.clientX;
            pointerY = event.clientY;
            isPointerActive = true;
        });

        window.addEventListener('pointerleave', () => {
            isPointerActive = false;
        });

        // Click / Tap on Enter button
        if (loadButton) {
    loadButton.addEventListener('click', (e) => {
        e.stopPropagation();
        finishIntro();
        const cubeSection = document.getElementById('portfolio-cube-section');
        if (cubeSection) {
            cubeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
}

        // Click anywhere when loaded
        introEl.addEventListener('click', () => {
            if (consoleDock && consoleDock.classList.contains('is-ready')) {
                finishIntro();
            }
        });

        // Mouse wheel scroll down
        window.addEventListener('wheel', event => {
            if (event.deltaY > 0 && consoleDock && consoleDock.classList.contains('is-ready')) {
                finishIntro();
            }
        }, { passive: true });

        // Touch swipe down / up
        window.addEventListener('touchstart', event => {
            touchStartY = event.touches[0]?.clientY ?? null;
        }, { passive: true });

        window.addEventListener('touchend', event => {
            const touchEndY = event.changedTouches[0]?.clientY;
            if (touchStartY !== null && touchEndY !== undefined && consoleDock && consoleDock.classList.contains('is-ready')) {
                if (Math.abs(touchEndY - touchStartY) > 30) {
                    finishIntro();
                }
            }
            touchStartY = null;
        }, { passive: true });

        // Keyboard Space / Enter
        window.addEventListener('keydown', event => {
            if ((event.key === ' ' || event.key === 'Enter') && consoleDock && consoleDock.classList.contains('is-ready')) {
                finishIntro();
            }
        });

        requestAnimationFrame(animate);
    }

    startIntro();
})();
VANTA.BIRDS({
    el: "#vanta-birds",
    THREE: THREE,
    mouseControls: false,
    touchControls: false,
    gyroControls: false,
    backgroundColor: 0x111111,
    backgroundAlpha: 1.0,
    color1: 0x00FF7F,
    color2: 0xFFEC00,
    colorMode: "variance",
    birdSize: 0.9,
    wingSpan: 18,
    speedLimit: 3.0,
    speedMultiplier: 0.8,
    separation: 80,
    alignment: 20,
    cohesion: 10,
    quantity: 3,
});

VANTA.RINGS({
    el: "#vanta-rings",
    THREE: THREE,
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    backgroundColor: 0x111111,
    backgroundAlpha: 0.0,
    color: 0x1da9c0,
});
(function () {
    const canvas = document.getElementById('code-canvas');
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d');
    const glyphs = ['</>', '{ }', '=>', '01', 'const', 'npm run', 'git push', '[ ]'];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles = [];

    function resize() {
        const rect = canvas.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const count = width < 600 ? 15 : 30;
        particles = Array.from({ length: count }, (_, index) => ({
            x: Math.random() * width,
            band: Math.random() < 0.5 ? 'top' : 'bottom',
            y: 0,
            speed: Math.random() * 0.12 + 0.04,
            drift: Math.random() * 0.5 - 0.25,
            phase: Math.random() * Math.PI * 2,
            size: Math.random() * 4 + 11,
            weight: Math.random() > 0.55 ? 700 : 600,
            text: glyphs[index % glyphs.length]
        }));
        particles.forEach(particle => {
            particle.y = particle.band === 'top'
                ? Math.random() * height * 0.12 + height * 0.06
                : Math.random() * height * 0.12 + height * 0.82;
        });
    }

    function draw(timestamp) {
        ctx.clearRect(0, 0, width, height);
        const nodes = particles.filter(particle => particle.size > 11);

        nodes.forEach((particle, index) => {
            const wave = Math.sin(timestamp * 0.0007 + particle.phase);
            const x = particle.x + wave * 14;
            const lift = Math.sin(timestamp * 0.00045 + particle.phase) * 9;
            const y = particle.y - (timestamp * particle.speed * 0.01) % 18 + lift;
            const alpha = 0.34 + (wave + 1) * 0.12;

            ctx.fillStyle = `rgba(159, 232, 220, ${alpha})`;
            ctx.font = `${particle.weight} ${particle.size}px Rajdhani, sans-serif`;
            ctx.shadowColor = 'rgba(159, 232, 220, 0.65)';
            ctx.shadowBlur = 9;
            ctx.letterSpacing = '0.08em';
            ctx.fillText(particle.text, x, y);
            ctx.shadowBlur = 0;

            if (index > 0 && particle.band === nodes[index - 1].band && Math.abs(x - nodes[index - 1].x) < width * 0.22) {
                ctx.strokeStyle = `rgba(159, 232, 220, ${alpha * 0.6})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x, y - 4);
                ctx.lineTo(nodes[index - 1].x, nodes[index - 1].y - 4);
                ctx.stroke();

                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.beginPath();
                ctx.arc(x, y - 4, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(draw);
})();
(function () {
    const canvas = document.getElementById('orbit-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const wrapper = canvas.parentElement;

    const TECHS = [
        { name: 'C++',        ring: 0, color: '#1da9c0', img: 'logos/c++.png' },
        { name: 'C',          ring: 0, color: '#1da9c0', img: 'logos/C.png' },
        { name: 'Java',       ring: 0, color: '#1da9c0', img: 'logos/java.png' },
        { name: 'Python',     ring: 0, color: '#1da9c0', img: 'logos/Python.png' },
        { name: 'MySQL',      ring: 1, color: '#a78bfa', img: 'logos/mysql.png' },
        { name: 'RENDER',     ring: 1, color: '#a78bfa', img: 'logos/render.png' },
        { name: 'HTML',       ring: 1, color: '#a78bfa', img: 'logos/HTML.png' },
        { name: 'CSS',        ring: 1, color: '#a78bfa', img: 'logos/CSS.png' },
        { name: 'JavaScript', ring: 1, color: '#a78bfa', img: 'logos/Javascript.png' },
        { name: 'React',      ring: 1, color: '#a78bfa', img: 'logos/Reactjs.png' },
        { name: 'Node.js',    ring: 2, color: '#f97316', img: 'logos/Nodejs.png' },
        { name: 'EmailJS',    ring: 2, color: '#f97316', img: 'logos/emailjs.png' },
        { name: 'Canva',      ring: 2, color: '#f97316', img: 'logos/canva.png' },
        { name: 'Figma',      ring: 2, color: '#f97316', img: 'logos/figma.png' },
        { name: 'VS Code',    ring: 2, color: '#f97316', img: 'logos/VSCode.png' },
        { name: 'GitHub',     ring: 2, color: '#f97316', img: 'logos/github.png' },
        { name: 'Postman',    ring: 2, color: '#f97316', img: 'logos/Postman.png' }
    ];

    const RING_FRACS = [0.20, 0.34, 0.48];
    const RING_SPEED = [0.00044, 0.00032, 0.00024];
    const RING_DIR   = [1, -1, 1];
    const ICON_FRAC  = 0.085;

    const groups = [[], [], []];
    TECHS.forEach(t => groups[t.ring].push(t));
    groups.forEach(g => g.forEach((t, i) => { t.angle = (2 * Math.PI / g.length) * i; }));

    TECHS.forEach(t => {
        const img = new Image();
        img.src = t.img;
        img.onload  = () => { t._img = img; };
        img.onerror = () => { t._img = null; };
    });

    let W, H, CX, CY, dpr, minSide;
    let hovered = null;
    let lastTs = null;

    function resize() {
        const rect = wrapper.getBoundingClientRect();
        W = rect.width  || window.innerWidth * 0.65;
        H = rect.height || window.innerHeight * 0.7;
        dpr = window.devicePixelRatio || 1;
        canvas.width  = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        canvas.style.width  = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        CX = W / 2; CY = H / 2;
        const iconPad = Math.min(W, H) * ICON_FRAC * 2.2;
        minSide = Math.min(W, H) - iconPad * 2;
    }

    function drawIcon(tech, x, y, scaleMul, isHovered) {
        const iconR = Math.min(minSide * ICON_FRAC * scaleMul, 46);
        ctx.save();
        ctx.translate(x, y);
        if (isHovered) { ctx.shadowColor = tech.color; ctx.shadowBlur = iconR; }
        if (tech._img) {
            ctx.drawImage(tech._img, -iconR, -iconR, iconR * 2, iconR * 2);
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, iconR, 0, Math.PI * 2);
            ctx.fillStyle = tech.color + '28';
            ctx.fill();
            ctx.strokeStyle = tech.color;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.font = `700 ${Math.round(iconR * 0.48)}px 'Poppins'`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(tech.name.slice(0, 3), 0, 0);
        }
        ctx.restore();
    }

    function drawTooltip(tech, x, y) {
        const pad = 10;
        const fSize = Math.max(12, minSide * 0.022);
        ctx.font = `600 ${fSize}px 'Poppins'`;
        const tw = ctx.measureText(tech.name).width;
        const bw = tw + pad * 2, bh = fSize + pad * 1.4;
        let bx = Math.max(6, Math.min(W - bw - 6, x - bw / 2));
        let by = y - 70;
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 8);
        ctx.fillStyle = 'rgba(17,17,17,0.92)';
        ctx.fill();
        ctx.strokeStyle = tech.color;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tech.name, bx + bw / 2, by + bh / 2);
        ctx.restore();
    }

    function frame(ts) {
        if (!lastTs) lastTs = ts;
        const dt = Math.min(ts - lastTs, 50);
        lastTs = ts;
        ctx.clearRect(0, 0, W, H);

        groups.forEach((g, ri) => {
            const rad = minSide * RING_FRACS[ri];
            g.forEach(t => {
                t.angle += RING_SPEED[ri] * RING_DIR[ri] * dt;
                t.x = CX + rad * Math.cos(t.angle);
                t.y = CY + rad * Math.sin(t.angle);
            });
        });

        TECHS.forEach(t => {
            if (t === hovered) return;
            ctx.globalAlpha = 0.88;
            drawIcon(t, t.x, t.y, 1.0, false);
            ctx.globalAlpha = 1;
        });

        if (hovered && hovered.x != null) {
            drawIcon(hovered, hovered.x, hovered.y, 1.25, true);
            drawTooltip(hovered, hovered.x, hovered.y);
        }

        requestAnimationFrame(frame);
    }

    canvas.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;
        const threshold = minSide * ICON_FRAC * 1.6;
        let found = null;
        for (const t of TECHS) {
            if (t.x == null) continue;
            const dx = t.x - mx, dy = t.y - my;
            if (dx * dx + dy * dy < threshold * threshold) { found = t; break; }
        }
        hovered = found;
        canvas.style.cursor = found ? 'pointer' : 'default';
    });

    canvas.addEventListener('mouseleave', () => { hovered = null; });

    window.addEventListener('resize', () => {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        resize();
    });

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            resize();
            requestAnimationFrame(frame);
        });
    });
})();


const words = [
    "Creative", "Full Stack", "Frontend", "Backend",
    "Web", "UI/UX", "Visual", "Artistic", "Application", "Innovation"
];
let current = 0;
const changingWord = document.getElementById("changing-word");

setInterval(() => {
    current = (current + 1) % words.length;
    changingWord.style.opacity = 0;
    setTimeout(() => {
        changingWord.textContent = words[current];
        changingWord.style.opacity = 1;
    }, 200);
}, 1000);


(function () {

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            } else {
                entry.target.classList.remove('visible');
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    const RESUME_TEXT =
         "Explore my technical journey, development experience, projects, and problem-solving expertise in software engineering.";
    const typewriterEl = document.querySelector('.typewriter-text');
    const resumeCard   = document.querySelector('.resume-card');

    if (!typewriterEl || !resumeCard) return;

    let typingTimer   = null;
    let isTyping      = false;

    function startTyping() {
        if (isTyping) return;
        isTyping = true;
        typewriterEl.textContent = '';
        let i = 0;

        function typeChar() {
            if (!isTyping) return;
            if (i < RESUME_TEXT.length) {
                typewriterEl.textContent += RESUME_TEXT[i++];
                typingTimer = setTimeout(typeChar, 28);
            } else {
                typingTimer = setTimeout(() => {
                    typewriterEl.textContent = '';
                    i = 0;
                    typeChar();
                }, 1200);
            }
        }

        typeChar();
    }

    function resetTyping() {
        clearTimeout(typingTimer);
        isTyping = false;
        typewriterEl.textContent = '';
    }

    const typeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                startTyping();
            } else {
                resetTyping();
            }
        });
    }, { threshold: 0.3 });

    typeObserver.observe(resumeCard);

})();




const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('show');
    }
  });
});

document.querySelectorAll('.hidden').forEach(el => {
  observer.observe(el);
});

(function () {
  emailjs.init("RmnauhFBq3Gxd7Ujo");
})();

window.addEventListener("load", () => {
  const form = document.getElementById("contact-form");

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const message = document.getElementById("message").value.trim();

    const nameRegex = /^[A-Za-z ]{5,}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!nameRegex.test(name)) {
      alert("Name must be at least 5 letters and contain only alphabets.");
      return;
    }

    if (!emailRegex.test(email)) {
      alert("Enter a valid email address.");
      return;
    }

    if (message.length < 5) {
      alert("Question must be at least 5 characters.");
      return;
    }

    emailjs.send("service_jphufyv", "template_yfjshtq", {
      name: name,
      email: email,
      message: message
    })
    .then(() => {
      return emailjs.send("service_jphufyv", "template_768155o", {
        to_email: email,
        to_name: name
      });
    })
    .then(() => {
    alert("Message sent successfully! Please check your inbox for a confirmation email.");
    form.reset();
})
    .catch((error) => {
      console.error(error);
      alert("Failed to send message.");
    });
  });
});

const connectForm = document.getElementById("connect-form");

if (connectForm) {
  connectForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = document
      .getElementById("connect-name")
      .value
      .trim();

    const email = document
      .getElementById("connect-email")
      .value
      .trim();

    const message = document
      .getElementById("connect-message")
      .value
      .trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (/\d/.test(name)) {
      alert("Name should not contain digits.");
      return;
    }

    if (!/^[A-Za-z ]+$/.test(name)) {
      alert("Name should only contain alphabets and spaces.");
      return;
    }

    if (name.length < 5) {
      alert("Name must be at least 5 characters long.");
      return;
    }
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address.");
      return;
    }
    if (message.length < 5) {
      alert("Description must be at least 5 characters long.");
      return;
    }
    emailjs.send("service_jphufyv", "template_yfjshtq", {
      name: name,
      email: email,
      message: message
    })
    .then(() => {
      return emailjs.send(
        "service_jphufyv",
        "template_768155o",
        {
          to_email: email,
          to_name: name
        }
      );
    })
    .then(() => {
      alert(
        "Message sent successfully! Please check your inbox for a confirmation email."
      );

      connectForm.reset();
    })
    .catch((error) => {
      console.error("EmailJS Error:", error);

      alert(
        "Failed to send message. Please try again."
      );
    });
  });
}

function copyEmail(event) {
    event.preventDefault();

    const email = "rupayanchattaraj@gmail.com";

    navigator.clipboard.writeText(email)
        .then(() => {
            alert("Mail copied to clipboard!");
        })
        .catch(err => {
            console.error("Failed to copy email:", err);
        });
}

(function () {
    const container = document.querySelector('.testimonials-container');
    if (!container) return;

    const cards = container.querySelectorAll('.testimonial-card');
    if (cards.length <= 1) return; 

    let currentIndex = 0;
    const totalCards = cards.length;
    const displayDuration = 5500;

    function advanceAutomatedSlide() {
        cards[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % totalCards;
        cards[currentIndex].classList.add('active');
    }
    setInterval(advanceAutomatedSlide, displayDuration);
})();

document.addEventListener("DOMContentLoaded", () => {
    const aboutTexts = document.querySelectorAll(".about-carousel .about-text");
    const prevBtn = document.querySelector(".carousel-nav.prev");
    const nextBtn = document.querySelector(".carousel-nav.next");
    let currentIndex = 0;
    function updateCarousel(newIndex) {
        if (newIndex === currentIndex) return;
        aboutTexts[currentIndex].classList.remove("active");
        currentIndex = newIndex;
        aboutTexts[currentIndex].classList.add("active");
    }

    if (aboutTexts.length > 1 && prevBtn && nextBtn) {
        nextBtn.addEventListener("click", () => {
            const nextIndex = (currentIndex + 1) % aboutTexts.length;
            updateCarousel(nextIndex);
        });

        prevBtn.addEventListener("click", () => {
            const prevIndex = (currentIndex - 1 + aboutTexts.length) % aboutTexts.length;
            updateCarousel(prevIndex);
        });
    }
});

(function () {
    const canvas = document.getElementById('bubble-canvas');
    const stage = document.querySelector('.magnetic-art-stage');
    if (!canvas || !stage) return;

    const ctx = canvas.getContext('2d');
    const mirrorCanvas = document.getElementById('bubble-canvas-right');
    const mirrorCard = document.querySelector('.about-card');
    const mirrorCtx = mirrorCanvas ? mirrorCanvas.getContext('2d') : null;
    const offscreen = document.createElement('canvas');
    const offscreenCtx = offscreen.getContext('2d', { willReadFrequently: true });
    const palette = ['#f5f7ff', '#b9fff1', '#8cdcff', '#d4b7ff', '#ffb8c4', '#ffd88a'];
    const sequence = ['RC', 'AI', 'JS', 'PY'];
    let particles = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let animationFrame;
    let lastTime = 0;
    let sequenceIndex = 0;
    const pointer = { x: 0, y: 0, active: false };

    function buildTargets(text) {
        offscreen.width = Math.round(width);
        offscreen.height = Math.round(height);
        offscreenCtx.clearRect(0, 0, width, height);
        offscreenCtx.fillStyle = '#fff';
        const maxFontSize = Math.min(width * 0.52, height * 0.82);
        offscreenCtx.font = `700 ${maxFontSize}px Orbitron, sans-serif`;
        const measuredWidth = offscreenCtx.measureText(text).width;
        const fontSize = measuredWidth > width * 0.84
            ? maxFontSize * (width * 0.84 / measuredWidth)
            : maxFontSize;
        offscreenCtx.font = `700 ${fontSize}px Orbitron, sans-serif`;
        offscreenCtx.textAlign = 'center';
        offscreenCtx.textBaseline = 'middle';
        offscreenCtx.fillText(text, width / 2, height / 2);

        const pixels = offscreenCtx.getImageData(0, 0, Math.round(width), Math.round(height)).data;
        const targets = [];
        const step = width < 600 ? 3 : 4;
        for (let y = 0; y < height; y += step) {
            for (let x = 0; x < width; x += step) {
            if (pixels[(y * Math.round(width) + x) * 4 + 3] > 100 && Math.random() < 0.9) {
                    targets.push({ x, y });
                }
            }
        }
        return targets;
    }

    function resize() {
        const rect = stage.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        if (mirrorCanvas && mirrorCard) {
            const mirrorRect = mirrorCard.getBoundingClientRect();
            mirrorCanvas.width = Math.round(mirrorRect.width * dpr);
            mirrorCanvas.height = Math.round(mirrorRect.height * dpr);
            mirrorCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        particles = buildTargets(sequence[sequenceIndex]).map((target, index) => {
    const corner = index % 4;
    const originX = (corner % 2 === 0 ? -rect.left : window.innerWidth - rect.left) + (Math.random() - 0.5) * 60;
    const originY = (corner < 2 ? -rect.top : window.innerHeight - rect.top) + (Math.random() - 0.5) * 60;
    return {
        x: originX,
        y: originY,
        tx: target.x,
        ty: target.y,
        vx: 0,
        vy: 0,
        size: Math.random() * 1.7 + 0.65,
        color: palette[index % palette.length],
        phase: Math.random() * Math.PI * 2
    };
});
    }

  function startNextShape() {
    sequenceIndex = (sequenceIndex + 1) % sequence.length;
    const targets = buildTargets(sequence[sequenceIndex]);
    const rect = stage.getBoundingClientRect();
    particles.forEach((particle, index) => {
        const corner = index % 4;
        particle.x = (corner % 2 === 0 ? -rect.left : window.innerWidth - rect.left) + (Math.random() - 0.5) * 60;
        particle.y = (corner < 2 ? -rect.top : window.innerHeight - rect.top) + (Math.random() - 0.5) * 60;
        const target = targets[index % targets.length];
        particle.tx = target.x;
        particle.ty = target.y;
        particle.vx = 0;
        particle.vy = 0;
    });
}

    function draw(time) {
        const delta = Math.min((time - lastTime) / 16.67 || 1, 2);
        lastTime = time;
        ctx.clearRect(0, 0, width, height);

        particles.forEach(particle => {
            const dx = particle.tx - particle.x;
            const dy = particle.ty - particle.y;
            const distance = Math.max(16, Math.hypot(dx, dy));
            const pointerDx = pointer.x - particle.x;
            const pointerDy = pointer.y - particle.y;
            const pointerDistance = Math.max(20, Math.hypot(pointerDx, pointerDy));
            const pointerForce = pointer.active ? Math.max(0, 1 - pointerDistance / 150) * 1.8 : 0;

            particle.vx += dx * 0.008 * delta - pointerDx / pointerDistance * pointerForce * delta;
            particle.vy += dy * 0.008 * delta - pointerDy / pointerDistance * pointerForce * delta;
            particle.vx += Math.sin(time * 0.0012 + particle.phase) * 0.018 * delta;
            particle.vy += Math.cos(time * 0.001 + particle.phase) * 0.018 * delta;
            particle.vx *= 0.9;
            particle.vy *= 0.9;
            particle.x += particle.vx * delta;
            particle.y += particle.vy * delta;

            ctx.globalAlpha = Math.min(0.92, 0.3 + 18 / distance);
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        if (mirrorCanvas && mirrorCtx && mirrorCard) {
            const mirrorRect = mirrorCard.getBoundingClientRect();
            mirrorCtx.clearRect(0, 0, mirrorRect.width, mirrorRect.height);
            mirrorCtx.globalAlpha = 0.8;
            mirrorCtx.drawImage(canvas, 0, 0, width, height, 0, 0, mirrorRect.width, mirrorRect.height);
            mirrorCtx.globalAlpha = 1;
        }
        animationFrame = requestAnimationFrame(draw);
    }

    stage.addEventListener('pointermove', event => {
        const rect = stage.getBoundingClientRect();
        pointer.x = event.clientX - rect.left;
        pointer.y = event.clientY - rect.top;
        pointer.active = true;
    });
    stage.addEventListener('pointerleave', () => { pointer.active = false; });
    window.addEventListener('resize', resize);
    resize();
    setInterval(startNextShape, 4200);
    animationFrame = requestAnimationFrame(draw);
    window.addEventListener('pagehide', () => cancelAnimationFrame(animationFrame), { once: true });
})();


document.addEventListener("DOMContentLoaded", () => {
    const skillsSection = document.querySelector('.ProfessionalSkills');
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target); 
            }
        });
    }, observerOptions);

    if (skillsSection) {
        observer.observe(skillsSection);
    }
});

const toggleBtn = document.getElementById("toggleSkills");
const skillsContent = document.getElementById("skillsContent");

toggleBtn.addEventListener("click", () => {

    skillsContent.classList.toggle("active");

    if(skillsContent.classList.contains("active")){
        toggleBtn.innerHTML = "Hide My Tech Stack ▲";

        skillsContent.scrollIntoView({
            behavior:"smooth",
            block:"start"
        });

    }else{
        toggleBtn.innerHTML = "View My Tech Stack ▼";
    }

});
const toggle = document.getElementById("bot-toggle");
const windowBox = document.getElementById("bot-window");
const closeBtn = document.getElementById("bot-close");
const minimizeBtn = document.getElementById("bot-minimize");
const userInput = document.getElementById("user-input");
const suggestionChips = document.querySelectorAll(".suggestion-chip");

function openBot() {
    windowBox.style.display = "flex";
    windowBox.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => windowBox.classList.add("open"));
}
function closeBot() {
    windowBox.classList.remove("open");
    windowBox.setAttribute("aria-hidden", "true");
    setTimeout(() => { windowBox.style.display = "none"; }, 200);
}
function minimizeBot() {
    if (!windowBox.classList.contains("open")) return;
    windowBox.classList.remove("open");
    windowBox.setAttribute("aria-hidden", "true");
    setTimeout(() => { windowBox.style.display = "none"; }, 200);
}

toggle.onclick = () => {
    windowBox.classList.contains("open") ? closeBot() : openBot();
};
closeBtn.onclick = closeBot;
minimizeBtn.onclick = minimizeBot;

suggestionChips.forEach(chip => {
    chip.addEventListener("click", () => {
        userInput.value = chip.textContent.trim();
        userInput.dispatchEvent(new Event("input", { bubbles: true }));
        userInput.focus();
    });
});

userInput.addEventListener("input", () => {
    userInput.style.height = "auto";
    userInput.style.height = Math.min(userInput.scrollHeight, 100) + "px";
});


userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        document.getElementById("send-btn").click();
    }
});
function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatBotText(text) {
    const escaped = escapeHtml(text);
    const withCode = escaped.replace(/`([^`]+)`/g, '<code>$1</code>');
    const withBold = withCode.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    const withItalic = withBold.replace(/\*(.+?)\*/g, '<em>$1</em>');
    return makeLinksClickable(withItalic);
}

function makeLinksClickable(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    return text.replace(urlRegex, (url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
}

function appendMessage(text, sender = "bot") {
    const chatBox = document.getElementById("chat-box");
    const msg = document.createElement("div");

    msg.className = `msg ${sender}`;

    const content = sender === "bot" ? formatBotText(text) : escapeHtml(text);

    const bubble = document.createElement("div");
    bubble.className = "msg-bubble";
    bubble.innerHTML = `<span class="message-copy">${content}</span>`;

    if (sender === "bot") {
        const canvas = document.createElement("canvas");
        canvas.className = "msg-canvas";
        bubble.prepend(canvas);

        const ctx = canvas.getContext("2d");
        const renderBubbleCanvas = () => {
            const rect = bubble.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            canvas.width = Math.max(160, rect.width) * dpr;
            canvas.height = 92 * dpr;
            canvas.style.width = `${Math.max(160, rect.width)}px`;
            canvas.style.height = "92px";
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const w = rect.width;
            const h = 92;
            const t = performance.now() * 0.001;

            for (let i = 0; i < 18; i++) {
                const x = ((i * 31 + (t * 24)) % (w + 40)) - 20;
                const y = 18 + (i % 5) * 14 + Math.sin(t * 1.6 + i) * 12;
                const radius = 2 + ((i % 3) * 1.2);
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fillStyle = i % 2 === 0 ? "rgba(255, 214, 102, 0.9)" : "rgba(111, 183, 255, 0.9)";
                ctx.fill();
            }

            ctx.beginPath();
            ctx.moveTo(0, h * 0.8);
            for (let x = 0; x <= w; x += 20) {
                const y = h * 0.72 + Math.sin(x * 0.07 + t * 2.2) * 12;
                ctx.lineTo(x, y);
            }
            ctx.strokeStyle = "rgba(127, 214, 255, 0.42)";
            ctx.lineWidth = 1.1;
            ctx.stroke();
        };

        renderBubbleCanvas();
        window.addEventListener("resize", renderBubbleCanvas, { passive: true });
        bubble._bubbleCanvasRender = renderBubbleCanvas;
    }

    const avatar = document.createElement("span");
    avatar.className = "msg-avatar";
    avatar.textContent = sender === "bot" ? "AI" : "🧑";

    msg.appendChild(avatar);
    msg.appendChild(bubble);
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;

    if (bubble._bubbleCanvasRender) {
        requestAnimationFrame(() => {
            const animate = () => {
                if (!document.body.contains(bubble)) return;
                bubble._bubbleCanvasRender();
                requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
        });
    }
}
const sendBtn = document.getElementById("send-btn");

function updateSendButtonState() {
    const hasText = userInput.value.trim().length > 0;
    sendBtn.disabled = !hasText;
}


userInput.addEventListener("input", () => {
    userInput.style.height = "auto";
    userInput.style.height = Math.min(userInput.scrollHeight, 100) + "px";
    updateSendButtonState();
});


updateSendButtonState();


function resetInputAfterSend() {
    userInput.value = "";
    userInput.style.height = "auto";
    updateSendButtonState();
    userInput.focus();
}

async function sendMessage() {
    const message = userInput.value.trim();

    if (!message) return;

    appendMessage(message, "user");
    resetInputAfterSend();

    try {

        const response = await fetch("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: message,
                model: document.getElementById("ai-model").value
            })
        });

        const data = await response.json();

        appendMessage(data.reply || "No response", "bot");

    } catch (err) {

        console.error(err);

        appendMessage(
            "⚠ Unable to connect to Rusho.Bot.",
            "bot"
        );

    }
}

sendBtn.addEventListener("click", sendMessage);
(function () {
    const canvas = document.getElementById('footer-bubble-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const wrapper = canvas.parentElement;

    let W, H, dpr;
    let particles = [];
    const mouse = { x: -9999, y: -9999, targetX: -9999, targetY: -9999 };
    const REPEL_RADIUS = 160;
    const COLORS = ['rgba(29,169,192,', 'rgba(127,92,255,', 'rgba(255,255,255,'];

    function resize() {
        const rect = wrapper.getBoundingClientRect();
        W = rect.width;
        H = rect.height;
        dpr = window.devicePixelRatio || 1;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        initParticles();
    }

   function initParticles() {
    particles = [];
    const spacing = 34;
    const pad = 20;
    const cols = Math.ceil((W - pad * 2) / spacing) + 1;    
    const rows = Math.ceil((H - pad * 2) / spacing) + 1;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = pad + col * spacing + (row % 2 === 0 ? 0 : spacing / 2);
            const y = pad + row * spacing;

            const sizeRoll = Math.random();
            const r = sizeRoll > 0.94
                ? Math.random() * 5 + 6
                : sizeRoll > 0.75
                    ? Math.random() * 2.5 + 3
                    : Math.random() * 1.5 + 1.5;

            particles.push({
                x, y,
                homeX: x, homeY: y,
                dispX: 0, dispY: 0,
                r: r,
                vx: 0,
                vy: 0,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                alpha: Math.random() * 0.25 + 0.12
            });
        }
    }
}

    function frame() {
        ctx.clearRect(0, 0, W, H);

        mouse.x += (mouse.targetX - mouse.x) * 0.35; 
mouse.y += (mouse.targetY - mouse.y) * 0.35;

        particles.forEach(p => {
    const dx = p.homeX - mouse.x;
            const dy = p.homeY - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            let targetDispX = 0;
            let targetDispY = 0;

            if (dist < REPEL_RADIUS) {
                const force = Math.pow(1 - dist / REPEL_RADIUS, 2);
                const angle = Math.atan2(dy, dx);
                const push = force * (REPEL_RADIUS * 0.55 + p.r * 1.5);
                targetDispX = Math.cos(angle) * push;
                targetDispY = Math.sin(angle) * push;
            }

            p.dispX += (targetDispX - p.dispX) * 0.35; 
p.dispY += (targetDispY - p.dispY) * 0.35; 

            const drawX = p.homeX + p.dispX;
            const drawY = p.homeY + p.dispY;

            ctx.beginPath();
            ctx.arc(drawX, drawY, p.r, 0, Math.PI * 2);
            ctx.fillStyle = p.color + p.alpha + ')';
            ctx.fill();
        });

        requestAnimationFrame(frame);
    }

    wrapper.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        mouse.targetX = e.clientX - rect.left;
        mouse.targetY = e.clientY - rect.top;
    });

    wrapper.addEventListener('mouseleave', () => {
        mouse.targetX = -9999;
        mouse.targetY = -9999;
    });

    window.addEventListener('resize', resize);

    resize();
    requestAnimationFrame(frame);
})();
(function () {
    const canvas = document.getElementById('projects-bubble-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const wrapper = canvas.parentElement;

    const BUFFER = 80;
    let W, H, dpr;
    let particles = [];
    const mouse = { x: -9999, y: -9999, targetX: -9999, targetY: -9999 };
    const REPEL_RADIUS = 170;

    function resize() {
        const rect = wrapper.getBoundingClientRect();
        W = rect.width + BUFFER * 2;
        H = rect.height + BUFFER * 2;
        dpr = window.devicePixelRatio || 1;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        initParticles(rect.width, rect.height);
    }

    function initParticles(baseW, baseH) {
        particles = [];
        const spacing = 34;
        const cols = Math.ceil(baseW / spacing) + 1;
        const rows = Math.ceil(baseH / spacing) + 1;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = BUFFER + col * spacing + (row % 2 === 0 ? 0 : spacing / 2);
                const y = BUFFER + row * spacing;

                const sizeRoll = Math.random();
                const r = sizeRoll > 0.9
                    ? Math.random() * 2 + 3
                    : Math.random() * 1.3 + 1.3;

                particles.push({
                    x, y,
                    homeX: x, homeY: y,
                    dispX: 0, dispY: 0,
                    r: r,
                    alpha: Math.random() * 0.3 + 0.15
                });
            }
        }
    }

    function frame() {
        ctx.clearRect(0, 0, W, H);
        mouse.x += (mouse.targetX - mouse.x) * 0.35;
        mouse.y += (mouse.targetY - mouse.y) * 0.35;

        particles.forEach(p => {
            const dx = p.homeX - mouse.x;
            const dy = p.homeY - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            let tx = 0, ty = 0;

            if (dist < REPEL_RADIUS) {
                const force = Math.pow(1 - dist / REPEL_RADIUS, 2);
                const angle = Math.atan2(dy, dx);
                const push = force * (REPEL_RADIUS * 0.6 + p.r * 2);
                tx = Math.cos(angle) * push;
                ty = Math.sin(angle) * push;
            }

            p.dispX += (tx - p.dispX) * 0.35;
            p.dispY += (ty - p.dispY) * 0.35;

            ctx.beginPath();
            ctx.arc(p.homeX + p.dispX, p.homeY + p.dispY, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
            ctx.fill();
        });

        requestAnimationFrame(frame);
    }

    wrapper.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        mouse.targetX = e.clientX - rect.left;
        mouse.targetY = e.clientY - rect.top;
    });
    wrapper.addEventListener('mouseleave', () => {
        mouse.targetX = -9999;
        mouse.targetY = -9999;
    });

    window.addEventListener('resize', resize);
    resize();
    requestAnimationFrame(frame);
})();

(function () {
    const scrollSection = document.getElementById('carousel3dScroll');
    const stage = document.getElementById('carousel3d');
    if (!scrollSection || !stage) return;

    const cards = Array.from(stage.querySelectorAll('.carousel-3d-card'));
    const prevBtn = document.getElementById('carousel3dPrev');
    const nextBtn = document.getElementById('carousel3dNext');
    const dotsWrap = document.getElementById('carousel3dDots');
    const projectLinks = Array.from(document.querySelectorAll('[data-project-link]'));
    const carouselWrapper = stage.parentElement;
    const total = cards.length;
    const mobileCarousel = window.matchMedia('(max-width: 700px)');

    cards.forEach((_, i) => {
        const dot = document.createElement('span');
        dot.addEventListener('click', () => scrollToIndex(i));
        dotsWrap.appendChild(dot);
    });
    const dots = Array.from(dotsWrap.children);

    let activeFloat = 0;
    let ticking = false;

    function layout(pos) {
        cards.forEach((card, i) => {
            const offset = i - pos;
            const abs = Math.min(Math.abs(offset), 3.2);
            const dir = offset === 0 ? 0 : (offset > 0 ? 1 : -1);

            const translateX = offset * 300;
            const translateZ = -abs * 150;
            const rotateY = -dir * Math.min(abs * 40, 50);
            const scale = Math.max(0.5, 1 - abs * 0.18);
            const opacity = Math.max(0, 1 - abs * 0.38);
            const blur = Math.min(abs * 1.6, 4.5);
            const brightness = Math.max(0.4, 1 - abs * 0.22);

            card.style.transform =
                `translate(-50%, 0) translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`;
            card.style.opacity = opacity;
            card.style.zIndex = Math.round(100 - abs * 10);
            card.style.filter = `blur(${blur}px) brightness(${brightness})`;
            card.classList.toggle('is-active', abs < 0.5);
        });

        const nearest = Math.round(pos + total) % total;
        dots.forEach((d, i) => d.classList.toggle('active', i === nearest));
        projectLinks.forEach(link => {
            link.classList.toggle('active', Number(link.dataset.projectLink) === nearest);
        });
    }

    function updateFromScroll() {
        const rect = scrollSection.getBoundingClientRect();
        const scrollableDist = scrollSection.offsetHeight - window.innerHeight;
        const scrolled = -rect.top;
        let progress = scrollableDist > 0 ? scrolled / scrollableDist : 0;
        progress = Math.max(0, Math.min(1, progress));

        activeFloat = progress * (total - 1);
        layout(activeFloat);

        if (mobileCarousel.matches) {
            if (rect.top <= 0 && rect.bottom >= window.innerHeight) {
                carouselWrapper.style.position = 'fixed';
                carouselWrapper.style.top = '0';
                carouselWrapper.style.left = `${scrollSection.getBoundingClientRect().left}px`;
                carouselWrapper.style.width = `${scrollSection.getBoundingClientRect().width}px`;
                carouselWrapper.style.zIndex = '10';
            } else if (rect.top > 0) {
                carouselWrapper.style.position = 'relative';
                carouselWrapper.style.top = '';
                carouselWrapper.style.left = '';
                carouselWrapper.style.width = '';
                carouselWrapper.style.zIndex = '';
            } else {
                carouselWrapper.style.position = 'absolute';
                carouselWrapper.style.top = 'auto';
                carouselWrapper.style.left = '0';
                carouselWrapper.style.bottom = '0';
                carouselWrapper.style.width = '100%';
                carouselWrapper.style.zIndex = '10';
            }
        }

        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateFromScroll);
            ticking = true;
        }
    }, { passive: true });

    window.addEventListener('resize', updateFromScroll);
    mobileCarousel.addEventListener('change', updateFromScroll);

    function scrollToIndex(index) {
        const scrollableDist = scrollSection.offsetHeight - window.innerHeight;
        const targetProgress = index / (total - 1);
        const sectionTop = scrollSection.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
            top: sectionTop + targetProgress * scrollableDist,
            behavior: 'smooth'
        });
    }

    cards.forEach((card, i) => {
        card.addEventListener('click', () => {
            const nearest = Math.round(activeFloat);
            if (i !== nearest) scrollToIndex(i);
        });
    });

    prevBtn.addEventListener('click', () => scrollToIndex(Math.max(0, Math.round(activeFloat) - 1)));
    nextBtn.addEventListener('click', () => scrollToIndex(Math.min(total - 1, Math.round(activeFloat) + 1)));

    window.addEventListener('keydown', (e) => {
        const rect = scrollSection.getBoundingClientRect();
        const inView = rect.top < window.innerHeight && rect.bottom > 0;
        if (!inView) return;
        if (e.key === 'ArrowLeft') scrollToIndex(Math.max(0, Math.round(activeFloat) - 1));
        if (e.key === 'ArrowRight') scrollToIndex(Math.min(total - 1, Math.round(activeFloat) + 1));
    });

    updateFromScroll();
})();

class CardAurora {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.running = false;
        this.blobs = [
            { x: 0.25, y: 0.3, r: 0.55, dx: 0.00018, dy: 0.00013, hue: 'rgba(0,247,255,' },
            { x: 0.75, y: 0.65, r: 0.5,  dx: -0.00015, dy: 0.0002,  hue: 'rgba(138,43,226,' },
            { x: 0.5,  y: 0.85, r: 0.4,  dx: 0.0001,   dy: -0.00016, hue: 'rgba(255,255,255,' }
        ];
        this.t = 0;
        this.resize();
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.W = rect.width;
        this.H = rect.height;
        this.canvas.width = this.W * dpr;
        this.canvas.height = this.H * dpr;
        this.canvas.style.width = this.W + 'px';
        this.canvas.style.height = this.H + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.W, this.H);
        ctx.fillStyle = '#0d0d0d';
        ctx.fillRect(0, 0, this.W, this.H);

        this.blobs.forEach(b => {
            b.x += Math.sin(this.t * b.dx * 500) * 0.0006;
            b.y += Math.cos(this.t * b.dy * 500) * 0.0006;
            const cx = b.x * this.W;
            const cy = b.y * this.H;
            const r = b.r * Math.max(this.W, this.H);

            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            grad.addColorStop(0, b.hue + '0.22)');
            grad.addColorStop(1, b.hue + '0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
        });


        ctx.globalAlpha = 0.035;
        for (let i = 0; i < 60; i++) {
            const x = Math.random() * this.W;
            const y = Math.random() * this.H;
            ctx.fillStyle = '#fff';
            ctx.fillRect(x, y, 1, 1);
        }
        ctx.globalAlpha = 1;

        this.t++;
    }

    loop() {
        if (!this.running) return;
        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.resize();
        this.loop();
    }

    stop() {
        this.running = false;
    }
}
(function () {
    const cards = document.querySelectorAll('.carousel-3d-card');
    const auroraMap = new WeakMap();

    cards.forEach(card => {
        const canvas = card.querySelector('.card-aurora');
        if (canvas) auroraMap.set(card, new CardAurora(canvas));
    });

    window.addEventListener('resize', () => {
        cards.forEach(card => {
            const aurora = auroraMap.get(card);
            if (aurora) aurora.resize();
        });
    });

    const auroraObserver = new MutationObserver(() => {
        cards.forEach(card => {
            const aurora = auroraMap.get(card);
            if (!aurora) return;
            card.classList.contains('is-active') ? aurora.start() : aurora.stop();
        });
    });
    cards.forEach(card => auroraObserver.observe(card, { attributes: true, attributeFilter: ['class'] }));
})();

(function () {
    const frame    = document.getElementById('portrait-frame');
    const robotImg = document.getElementById('portraitRobot');
    if (!frame || !robotImg) return;

    if (window.matchMedia('(max-width: 900px)').matches) return;

    const TORCH_RADIUS = 60; 

    let autoRafId = null;
    let isHovering = false;
    let resumeTimeout = null;

    function setSpot(x, y) {
        robotImg.style.clipPath = `circle(${TORCH_RADIUS}px at ${x}px ${y}px)`;
    }


    function startAutoAnimation() {
        if (autoRafId) return;

        const rect = frame.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        const pad = TORCH_RADIUS * 0.6;

        const rows = 3;             
        const rowHeight = (h - pad * 2) / (rows - 1 || 1);
        const cycleMs = 5200;       

        const start = performance.now();

        function frameLoop(now) {
            if (!autoRafId) return; 
            const elapsed = (now - start) % cycleMs;
            const t = elapsed / cycleMs;

            const rowProgress = t * rows;
            const row = Math.floor(rowProgress);
            const rowT = rowProgress - row;


            const goingRight = row % 2 === 0;
            const xT = goingRight ? rowT : 1 - rowT;

            const x = pad + xT * (w - pad * 2);
            const y = pad + Math.min(row, rows - 1) * rowHeight;

            setSpot(x, y);
            autoRafId = requestAnimationFrame(frameLoop);
        }

        autoRafId = requestAnimationFrame(frameLoop);
    }

    function stopAutoAnimation() {
        if (autoRafId) {
            cancelAnimationFrame(autoRafId);
            autoRafId = null;
        }
    }


    frame.addEventListener('mouseenter', () => {
        isHovering = true;
        clearTimeout(resumeTimeout);
        stopAutoAnimation();
    });

    frame.addEventListener('mousemove', (e) => {
        const rect = frame.getBoundingClientRect();
        setSpot(e.clientX - rect.left, e.clientY - rect.top);
    });

    frame.addEventListener('mouseleave', () => {
        isHovering = false;
        setSpot(-999, -999);
       
        resumeTimeout = setTimeout(() => {
            if (!isHovering) startAutoAnimation();
        }, 1200);
    });

  
    startAutoAnimation();
})();(function () {
    const canvas = document.getElementById('leetcode-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const wrapper = canvas.parentElement;

    const BUFFER = 80;
    let W, H, dpr;
    let particles = [];
    const mouse = { x: -9999, y: -9999, targetX: -9999, targetY: -9999 };
    const REPEL_RADIUS = 140;

    function resize() {
        const rect = wrapper.getBoundingClientRect();
        W = rect.width + BUFFER * 2;
        H = rect.height + BUFFER * 2;
        dpr = window.devicePixelRatio || 1;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        initParticles(rect.width, rect.height);
    }

    function initParticles(baseW, baseH) {
        particles = [];
        const spacing = 32;
        const cols = Math.ceil(baseW / spacing) + 1;
        const rows = Math.ceil(baseH / spacing) + 1;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = BUFFER + col * spacing + (row % 2 === 0 ? 0 : spacing / 2);
                const y = BUFFER + row * spacing;

                const sizeRoll = Math.random();
                let r;
                if (sizeRoll > 0.96)      r = Math.random() * 4 + 7;
                else if (sizeRoll > 0.82) r = Math.random() * 2 + 4;
                else if (sizeRoll > 0.5)  r = Math.random() * 1.5 + 2.4;
                else                      r = Math.random() * 1.2 + 1.3;

                particles.push({
                    x, y, homeX: x, homeY: y,
                    dispX: 0, dispY: 0,
                    r: r,
                    alpha: Math.random() * 0.25 + 0.15
                });
            }
        }
    }

    function frame() {
        ctx.clearRect(0, 0, W, H);
        mouse.x += (mouse.targetX - mouse.x) * 0.35;
        mouse.y += (mouse.targetY - mouse.y) * 0.35;

        particles.forEach(p => {
            const dx = p.homeX - mouse.x;
            const dy = p.homeY - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            let tx = 0, ty = 0;

            if (dist < REPEL_RADIUS) {
                const force = Math.pow(1 - dist / REPEL_RADIUS, 2);
                const angle = Math.atan2(dy, dx);
                const push = force * (REPEL_RADIUS * 0.75 + p.r * 2.2);
                tx = Math.cos(angle) * push;
                ty = Math.sin(angle) * push;
            }

            p.dispX += (tx - p.dispX) * 0.35;
            p.dispY += (ty - p.dispY) * 0.35;

            ctx.beginPath();
            ctx.arc(p.homeX + p.dispX, p.homeY + p.dispY, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
            ctx.fill();
        });

        requestAnimationFrame(frame);
    }

    wrapper.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        mouse.targetX = e.clientX - rect.left;
        mouse.targetY = e.clientY - rect.top;
    });
    wrapper.addEventListener('mouseleave', () => {
        mouse.targetX = -9999;
        mouse.targetY = -9999;
    });

    window.addEventListener('resize', resize);
    resize();
    requestAnimationFrame(frame);
})();

(function () {
    const canvas = document.getElementById('internship-canvas');
    const section = document.getElementById('internship');
    if (!canvas || !section) return;

    const ctx = canvas.getContext('2d');
    const isMobile = window.innerWidth < 600;
    let W, H, dpr, particles = [];
    let rafId = null;
    let start = null;
    let hasPlayed = false;
    let fontReady = false;
    let pendingPlay = false;

    function resize() {
        const rect = section.getBoundingClientRect();
        W = rect.width;
        H = rect.height;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }


    function getTextPoints(text, gap) {
        const off = document.createElement('canvas');
        off.width = Math.max(1, Math.round(W));
        off.height = Math.max(1, Math.round(H));
        const octx = off.getContext('2d');

        let fontSize = Math.min(W / 5.5, H * 0.55);
        const maxWidth = W * 0.92;

        for (let i = 0; i < 20; i++) {
            octx.font = `700 ${fontSize}px Orbitron, sans-serif`;
            const w = octx.measureText(text).width;
            if (w <= maxWidth || fontSize < 10) break;
            fontSize *= (maxWidth / w) * 0.98;
        }

        octx.clearRect(0, 0, off.width, off.height);
        octx.fillStyle = '#fff';
        octx.font = `700 ${fontSize}px Orbitron, sans-serif`;
        octx.textAlign = 'center';
        octx.textBaseline = 'middle';
        octx.fillText(text, off.width / 2, off.height / 2);

        const data = octx.getImageData(0, 0, off.width, off.height).data;
        const points = [];
        for (let y = 0; y < off.height; y += gap) {
            for (let x = 0; x < off.width; x += gap) {
                if (data[(y * off.width + x) * 4 + 3] > 128) points.push({ x, y });
            }
        }
        return points;
    }

    const FORM_MS        = 1000;
    const BASE_DELAY     = 30;
    const DIST_FACTOR    = isMobile ? 0.35 : 0.45;
    const MAX_RAND_DELAY = isMobile ? 80 : 130;

    function initParticles() {
        const gap = isMobile ? 4 : 3;
        const points = getTextPoints('EXPERIENCE', gap);

        const cx = W / 2, cy = H / 2;
        particles = points.map(p => {
            const angle = Math.random() * Math.PI * 2;
            const dist  = Math.max(W, H) * (0.4 + Math.random() * 0.3);
            const distFromCenter = Math.hypot(p.x - cx, p.y - cy);
            return {
                x: cx + Math.cos(angle) * dist,
                y: cy + Math.sin(angle) * dist,
                tx: p.x, ty: p.y,
                r: Math.random() * 1.2 + 0.9,
                delay: BASE_DELAY + distFromCenter * DIST_FACTOR + Math.random() * MAX_RAND_DELAY
            };
        });
    }

    function easeOutQuint(t) { return 1 - Math.pow(1 - t, 5); }

    function drawParticleAt(x, y, r, glow) {
        ctx.beginPath();
        ctx.arc(x, y, r * 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(29,169,192,${glow * 0.22})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(230,245,255,${glow})`;
        ctx.fill();
    }

    function drawStatic() {
        ctx.clearRect(0, 0, W, H);
        particles.forEach(p => drawParticleAt(p.tx, p.ty, p.r, 1));
    }

    function animate(ts) {
        if (!start) start = ts;
        const elapsed = ts - start;
        ctx.clearRect(0, 0, W, H);

        let allDone = true;
        particles.forEach(p => {
            const localT = (elapsed - p.delay) / FORM_MS;
            const t = Math.max(0, Math.min(1, localT));
            if (t < 1) allDone = false;
            const eased = easeOutQuint(t);
            const x = p.x + (p.tx - p.x) * eased;
            const y = p.y + (p.ty - p.y) * eased;
            const glow = 0.4 + eased * 0.6;
            drawParticleAt(x, y, p.r, glow);
        });

        if (!allDone) {
            rafId = requestAnimationFrame(animate);
        } else {
            rafId = null;
            hasPlayed = true;
        }
    }

    function playIntro() {
        if (hasPlayed || rafId) return;
        resize();
        initParticles();
        if (!particles.length) return;
        start = null;
        rafId = requestAnimationFrame(animate);
    }

    function tryPlay() {
        if (fontReady) playIntro();
        else pendingPlay = true;
    }

    function isInView() {
        const rect = section.getBoundingClientRect();
        return rect.top < window.innerHeight * 0.9 && rect.bottom > window.innerHeight * 0.1;
    }

    if (document.fonts && document.fonts.ready) {
        document.fonts.load('700 100px Orbitron').then(() => {
            fontReady = true;
            if (pendingPlay) playIntro();
        }).catch(() => {
            fontReady = true;
            if (pendingPlay) playIntro();
        });
        setTimeout(() => {
            if (!fontReady) { fontReady = true; if (pendingPlay) playIntro(); }
        }, 800);
    } else {
        fontReady = true;
    }

    window.addEventListener('resize', () => {
        if (hasPlayed) {
            resize();
            initParticles();
            drawStatic();
        } else if (rafId) {
            resize();
        }
    });

    
    let ticking = false;
    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            if (!hasPlayed && isInView()) tryPlay();
            ticking = false;
        });
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) tryPlay();
        });
    }, { threshold: 0.05 });
    io.observe(section);

    
    onScroll();
})();
(function initPortfolioCube(){
    const section = document.getElementById('portfolio-cube-section');
    const cube = document.getElementById('portfolio-cube');
    const stage = document.getElementById('cube-stage');

    if (!section || !cube || !stage) return;

    const faces = [...section.querySelectorAll('.cube-face')];
    const rotations = [
        { x: 0, y: 0 },
        { x: 0, y: -90 },
        { x: 0, y: -180 },
        { x: 0, y: 90 },
        { x: -90, y: 0 },
        { x: 90, y: 0 }
    ];
    let rotationX = 0;
    let rotationY = 0;
    let pointer = null;
    let moved = false;

    function render() {
        cube.style.setProperty('--cube-rotate-x', `${rotationX}deg`);
        cube.style.setProperty('--cube-rotate-y', `${rotationY}deg`);
    }

    function angularDistance(a, b) {
        return Math.abs((((a - b) % 360) + 540) % 360 - 180);
    }

    function nearestFaceIndex() {
        let bestIndex = 0;
        let bestDistance = Infinity;
        rotations.forEach((candidate, index) => {
            const distance = angularDistance(rotationX, candidate.x) + angularDistance(rotationY, candidate.y);
            if (distance < bestDistance) {
                bestDistance = distance;
                bestIndex = index;
            }
        });
        return bestIndex;
    }

    function snapToFace() {
        const index = nearestFaceIndex();
        rotationX = rotations[index].x;
        rotationY = rotations[index].y;
        render();
        return index;
    }

    function navigateToFace(face) {
        if (!face) return;
        const targetSelector = face.getAttribute('href');
        const targetEl = targetSelector ? document.querySelector(targetSelector) : null;
        if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    stage.addEventListener('dragstart', event => event.preventDefault());

    stage.addEventListener('pointerdown', event => {
        pointer = {
            x: event.clientX,
            y: event.clientY,
            rotationX,
            rotationY
        };
        moved = false;
        stage.classList.add('is-dragging');
        cube.classList.add('is-dragging');

        if (stage.setPointerCapture) {
            stage.setPointerCapture(event.pointerId);
        }
    });

    stage.addEventListener('pointermove', event => {
        if (!pointer) return;

        const dx = event.clientX - pointer.x;
        const dy = event.clientY - pointer.y;

        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
            moved = true;
        }

        rotationY = pointer.rotationY + dx * .32;
        rotationX = Math.max(-115, Math.min(115, pointer.rotationX - dy * .32));
        render();
    });

    function finishDrag() {
        if (!pointer) return;
        const wasMoved = moved;
        pointer = null;
        stage.classList.remove('is-dragging');
        cube.classList.remove('is-dragging');
        const index = snapToFace();
        if (!wasMoved) {
            navigateToFace(faces[index]);
        }
    }

    stage.addEventListener('pointerup', finishDrag);
    stage.addEventListener('pointercancel', finishDrag);
    faces.forEach(face => {
        face.addEventListener('click', event => {
            if (event.detail === 0) return;
            event.preventDefault();
        });
    });

    requestAnimationFrame(() => {
        section.classList.add('cube-ready');
    });
})();
