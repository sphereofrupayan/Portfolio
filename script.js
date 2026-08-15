(function () {
    const introEl = document.getElementById('hello-intro');
    const canvas  = document.getElementById('hello-canvas');
    const loaderEl = document.getElementById('hello-loader');
    if (!introEl || !canvas) return;

    const ctx = canvas.getContext('2d');
    document.body.style.overflow = 'hidden';
    const isMobile = window.innerWidth < 600;

    let W, H, dpr, particles = [];

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width  = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width  = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function getTextPoints(text, fontSize, gap) {
        const off = document.createElement('canvas');
        off.width = W; off.height = H;
        const octx = off.getContext('2d');
        octx.fillStyle = '#fff';
        octx.font = `700 ${fontSize}px Orbitron, sans-serif`;
        octx.textAlign = 'center';
        octx.textBaseline = 'middle';
        octx.fillText(text, W / 2, H / 2);
        const data = octx.getImageData(0, 0, W, H).data;
        const points = [];
        for (let y = 0; y < H; y += gap) {
            for (let x = 0; x < W; x += gap) {
                if (data[(y * W + x) * 4 + 3] > 128) points.push({ x, y });
            }
        }
        return points;
    }

    const FORM_MS         = 1200;
    const SETTLE_MS       = 300;
    const HOLD_MS         = 750;  
    const BASE_DELAY      = 60;
    const DIST_FACTOR     = isMobile ? 0.28 : 0.30;   
const MAX_RAND_DELAY  = isMobile ? 100 : 120;


    function initParticles() {
        const fontSize = Math.min(W * 0.16, 190);
        const gap = Math.max(isMobile ? 4 : 4, Math.round(fontSize / (isMobile ? 38 : 42)));
        const points = getTextPoints('Welcome', fontSize, gap);
        const cx = W / 2, cy = H / 2;

        particles = points.map(p => {
            const angle = Math.random() * Math.PI * 2;
            const dist  = Math.max(W, H) * (0.5 + Math.random() * 0.35);
            const distFromCenter = Math.hypot(p.x - cx, p.y - cy);
            return {
                x: cx + Math.cos(angle) * dist,
                y: cy + Math.sin(angle) * dist,
                tx: p.x, ty: p.y,
                r: Math.random() * 1.1 + 0.8,
                delay: BASE_DELAY + distFromCenter * DIST_FACTOR + Math.random() * MAX_RAND_DELAY
            };
        });
    }

    function easeOutQuint(t) { return 1 - Math.pow(1 - t, 5); }

    let start = null;
    let maxDelay = 0;

    function animate(ts) {
        if (!start) start = ts;
        const elapsed = ts - start;
        ctx.clearRect(0, 0, W, H);

        particles.forEach(p => {
            const localT = (elapsed - p.delay) / FORM_MS;
            const t = Math.max(0, Math.min(1, localT));
            const eased = easeOutQuint(t);
            const settleT = Math.max(0, Math.min(1, (elapsed - p.delay - FORM_MS) / SETTLE_MS));
            const overshoot = t >= 1 ? Math.sin(settleT * Math.PI) * (1 - settleT) * 3 : 0;
            const x = p.x + (p.tx - p.x) * eased;
            const y = p.y + (p.ty - p.y) * eased - overshoot;
            const glowStrength = 0.35 + eased * 0.65;

            ctx.beginPath();
            ctx.arc(x, y, p.r * 1.8, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${glowStrength * 0.15})`;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(x, y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${glowStrength})`;
            ctx.fill();
        });

        if (elapsed < maxDelay + FORM_MS + SETTLE_MS + HOLD_MS) {
            requestAnimationFrame(animate);
        } else {
            introEl.classList.add('fade-out');
            document.body.style.overflow = '';
            setTimeout(() => introEl.remove(), 1100);
        }
    }

    function startIntro() {
        resize();
        initParticles();

        const maxDistFromCenter = Math.hypot(W / 2, H / 2);
        maxDelay = BASE_DELAY + maxDistFromCenter * DIST_FACTOR + MAX_RAND_DELAY;
        const revealDelay = Math.max(0, maxDelay + FORM_MS - 300);
        setTimeout(() => { if (loaderEl) loaderEl.classList.add('show'); }, revealDelay);

        window.addEventListener('resize', () => { resize(); initParticles(); });
        requestAnimationFrame(animate);
    }
    if (document.fonts && document.fonts.ready) {
        let started = false;
        const begin = () => { if (!started) { started = true; startIntro(); } };
        document.fonts.load('700 190px Orbitron').then(begin).catch(begin);
        setTimeout(begin, 400);
    } else {
        startIntro();
    }
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
    dpr = Math.min(window.devicePixelRatio || 1, 2); // same sharpness on all devices
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
const userInput = document.getElementById("user-input");

function openBot() {
    windowBox.style.display = "flex";
    requestAnimationFrame(() => windowBox.classList.add("open"));
}
function closeBot() {
    windowBox.classList.remove("open");
    setTimeout(() => { windowBox.style.display = "none"; }, 200);
}

toggle.onclick = () => {
    windowBox.classList.contains("open") ? closeBot() : openBot();
};
closeBtn.onclick = closeBot;


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

    const content =
        sender === "bot"
            ? makeLinksClickable(text)
            : text;

    msg.innerHTML = `
        <span class="msg-avatar">${sender === "bot" ? "AI" : "🧑"}</span>
        <div class="msg-bubble">${content}</div>
    `;

    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
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

        mouse.x += (mouse.targetX - mouse.x) * 0.15;
        mouse.y += (mouse.targetY - mouse.y) * 0.15;

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

            p.dispX += (targetDispX - p.dispX) * 0.08;
            p.dispY += (targetDispY - p.dispY) * 0.08;

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

    let W, H, dpr;
    let particles = [];
    const mouse = { x: -9999, y: -9999, targetX: -9999, targetY: -9999 };
    const REPEL_RADIUS = 170;

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

        mouse.x += (mouse.targetX - mouse.x) * 0.15;
        mouse.y += (mouse.targetY - mouse.y) * 0.15;

        particles.forEach(p => {
            const dx = p.homeX - mouse.x;
            const dy = p.homeY - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            let targetDispX = 0;
            let targetDispY = 0;

            if (dist < REPEL_RADIUS) {
                const force = Math.pow(1 - dist / REPEL_RADIUS, 2);
                const angle = Math.atan2(dy, dx);
                const push = force * (REPEL_RADIUS * 0.6 + p.r * 2);
                targetDispX = Math.cos(angle) * push;
                targetDispY = Math.sin(angle) * push;
            }

            p.dispX += (targetDispX - p.dispX) * 0.09;
p.dispY += (targetDispY - p.dispY) * 0.09;

let drawX = p.homeX + p.dispX;
let drawY = p.homeY + p.dispY;

drawX = Math.max(p.r, Math.min(W - p.r, drawX));
drawY = Math.max(p.r, Math.min(H - p.r, drawY));

ctx.beginPath();
ctx.arc(drawX, drawY, p.r, 0, Math.PI * 2);
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
    const canvas = document.getElementById('cursor-spotlight');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W, H, dpr;
    function resize() {
        dpr = window.devicePixelRatio || 1;
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    const TRAIL_LIFE = 380; 
    let points = []; 

    window.addEventListener('mousemove', (e) => {
        const now = performance.now();
        const last = points[points.length - 1];

        if (!last || Math.hypot(e.clientX - last.x, e.clientY - last.y) > 2) {
            points.push({ x: e.clientX, y: e.clientY, t: now });
        }
    });

    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

    function drawStroke(pts, widthMul, colorStops, blur, alphaMul) {
        if (pts.length < 2) return;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 1; i < pts.length - 1; i++) {
            const p0 = pts[i - 1];
            const p1 = pts[i];
            const p2 = pts[i + 1];

            // midpoints for smooth quadratic curve segments
            const mid1 = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
            const mid2 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

            const now = performance.now();
            const age = (now - p1.t) / TRAIL_LIFE;
            const life = Math.max(0, 1 - age);
            const eased = easeOutCubic(life);

            if (eased <= 0) continue;

            const grad = ctx.createLinearGradient(mid1.x, mid1.y, mid2.x, mid2.y);
            grad.addColorStop(0, colorStops[0](eased * alphaMul));
            grad.addColorStop(1, colorStops[1](eased * alphaMul));

            ctx.beginPath();
            ctx.moveTo(mid1.x, mid1.y);
            ctx.quadraticCurveTo(p1.x, p1.y, mid2.x, mid2.y);
            ctx.strokeStyle = grad;
            ctx.lineWidth = Math.max(0.4, widthMul * eased);
            ctx.shadowColor = colorStops[1](eased * 0.9);
            ctx.shadowBlur = blur;
            ctx.stroke();
        }
    }

    function draw() {
        const now = performance.now();
        ctx.clearRect(0, 0, W, H);
        points = points.filter(p => now - p.t < TRAIL_LIFE);
        if (points.length > 2) {
            drawStroke(
                points, 11, 
                [
                    a => `rgba(255, 40, 90, ${a * 0.28})`,
                    a => `rgba(255, 110, 180, ${a * 0.28})`
                ],
                22, 1
            );
            drawStroke(
                points, 5.5,
                [
                    a => `rgba(255, 55, 100, ${a * 0.55})`,
                    a => `rgba(255, 130, 190, ${a * 0.55})`
                ],
                12, 1
            );
            drawStroke(
                points, 1.8,
                [
                    a => `rgba(255, 180, 210, ${a * 0.85})`,
                    a => `rgba(255, 220, 235, ${a * 0.85})`
                ],
                6, 1
            );
        }

        requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);
})();
(function () {
    const scrollSection = document.getElementById('carousel3dScroll');
    const stage = document.getElementById('carousel3d');
    if (!scrollSection || !stage) return;

    const cards = Array.from(stage.querySelectorAll('.carousel-3d-card'));
    const prevBtn = document.getElementById('carousel3dPrev');
    const nextBtn = document.getElementById('carousel3dNext');
    const dotsWrap = document.getElementById('carousel3dDots');
    const total = cards.length;

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
    }

    function updateFromScroll() {
        const rect = scrollSection.getBoundingClientRect();
        const scrollableDist = scrollSection.offsetHeight - window.innerHeight;
        const scrolled = -rect.top;
        let progress = scrollableDist > 0 ? scrolled / scrollableDist : 0;
        progress = Math.max(0, Math.min(1, progress));

        activeFloat = progress * (total - 1);
        layout(activeFloat);
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateFromScroll);
            ticking = true;
        }
    }, { passive: true });

    window.addEventListener('resize', updateFromScroll);

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
