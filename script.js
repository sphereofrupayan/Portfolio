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

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
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
