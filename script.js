/* ═══════════════════════════════════════════════════════════
   YOSRI HAMDOUNI — CYBERSECURITY PORTFOLIO
   script.js — Scroll-Driven Background Video & Command Center
═══════════════════════════════════════════════════════════ */

gsap.registerPlugin(ScrollTrigger, TextPlugin);

/* ═══════════════════════════════════════════════════════════
   1. ULTRA-SMOOTH VIDEO BACKGROUND ENGINE (ZERO GLITCH)
   - SCROLL-SYNC: Strictly paused when stationary (0 seeks = 0 glitch).
     Lerp-interpolated seeks only when user actively scrolls.
   - AMBIENT-LOOP: Native 60fps continuous playback.
═══════════════════════════════════════════════════════════ */
const bgVideo = document.getElementById('bgVideo');
const videoModeToggle = document.getElementById('videoModeToggle');
const videoModeTxt = document.getElementById('videoModeTxt');

// Respect mobile and prefers-reduced-motion: disable scroll-sync and ambient loop
const isMobileDevice = window.innerWidth <= 768;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let isScrollSync = !prefersReducedMotion && !isMobileDevice;
let targetTime = 0;
let currentTime = 0;

if (bgVideo && !isMobileDevice && !prefersReducedMotion) {
  bgVideo.muted = true;
  bgVideo.playsInline = true;

  // Strictly pause in scroll-sync so video never auto-advances
  bgVideo.pause();

  function onMetadata() {
    bgVideo.pause();
    currentTime = 0;
    targetTime = 0;
    calculateScrollTarget();
  }

  bgVideo.addEventListener('loadedmetadata', onMetadata);
  if (bgVideo.readyState >= 1) onMetadata();

  function calculateScrollTarget() {
    if (!isScrollSync || !bgVideo.duration || isNaN(bgVideo.duration)) return;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll > 0) {
      const ratio = Math.max(0, Math.min(1, window.scrollY / maxScroll));
      targetTime = ratio * bgVideo.duration;
    }
  }
  

  window.addEventListener('scroll', calculateScrollTarget, { passive: true });
  window.addEventListener('resize', calculateScrollTarget);

  // Perform seek ONLY when target has changed and difference is significant
  function performSeek() {
    if (!isScrollSync || !bgVideo.duration || isNaN(bgVideo.duration)) return;

    // Ensure video is never accidentally playing in scroll-sync mode
    if (!bgVideo.paused) {
      bgVideo.pause();
    }

    const diff = targetTime - currentTime;
    // When stationary, diff is 0 -> NOTHING executes (zero glitch, zero jitter)
    if (Math.abs(diff) > 0.008) {
      currentTime += diff * 0.16;
      if (!bgVideo.seeking) {
        try {
          if (typeof bgVideo.fastSeek === 'function') {
            bgVideo.fastSeek(currentTime);
          } else {
            bgVideo.currentTime = currentTime;
          }
        } catch (e) {
          bgVideo.currentTime = currentTime;
        }
      }
    }
  }
  

  // 60fps render loop
  function videoLoop() {
    if (isScrollSync) {
      performSeek();
    }
    requestAnimationFrame(videoLoop);
  }
  requestAnimationFrame(videoLoop);

  // Toggle between Scroll-Sync Mode and Ambient Loop Mode
  if (videoModeToggle) {
    videoModeToggle.addEventListener('click', () => {
      isScrollSync = !isScrollSync;
      playTone(850, 'sine', 0.06);

      if (isScrollSync) {
        bgVideo.pause();
        calculateScrollTarget();
        currentTime = targetTime;
        try { bgVideo.currentTime = currentTime; } catch(e) {}
        if (videoModeTxt) videoModeTxt.textContent = 'SCROLL-SYNC';
        videoModeToggle.classList.remove('active');
      } else {
        bgVideo.play().catch(() => {});
        if (videoModeTxt) videoModeTxt.textContent = 'AMBIENT-LOOP';
        videoModeToggle.classList.add('active');
      }
    });
  }
}

/* ═══════════════════════════════════════════════════════════
   2. CYBER AUDIO SYNTHESIZER (Web Audio API — Zero Dependencies)
═══════════════════════════════════════════════════════════ */
let audioCtx = null;
let sfxActive = false;

function getAudioContext() {
  if (!audioCtx) {
    const AudioClass = window.AudioContext || window.webkitAudioContext;
    if (AudioClass) audioCtx = new AudioClass();
  }
  return audioCtx;
}

function playTone(freq, type = 'sine', duration = 0.08, gainPeak = 0.08) {
  if (!sfxActive) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(freq * 0.4, 20), ctx.currentTime + duration);
    gain.gain.setValueAtTime(gainPeak, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
}

const sfxToggle = document.getElementById('sfxToggle');
if (sfxToggle) {
  sfxToggle.addEventListener('click', () => {
    sfxActive = !sfxActive;
    sfxToggle.classList.toggle('active', sfxActive);
    const txt = sfxToggle.querySelector('.ctrl-txt');
    if (txt) txt.textContent = sfxActive ? 'SFX: ON' : 'SFX: OFF';
    if (sfxActive) playTone(980, 'triangle', 0.12, 0.12);
  });
}

const themeToggle = document.getElementById('themeToggle');
// Theme Management with data-theme="dark" and data-theme="light"
function initTheme() {
  const urlSearch = new URLSearchParams(window.location.search);
  const hashSearch = new URLSearchParams(window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '');
  const urlParam = urlSearch.get('theme') || hashSearch.get('theme');
  const savedTheme = urlParam || localStorage.getItem('secops-theme') || 'dark';
  applyTheme(savedTheme);
}

function applyTheme(theme) {
  const isLight = theme === 'light';
  document.documentElement.setAttribute('data-theme', theme);
  document.body.setAttribute('data-theme', theme);
  if (themeToggle) {
    themeToggle.classList.toggle('active', isLight);
    themeToggle.setAttribute('aria-pressed', isLight ? 'true' : 'false');
  }
  localStorage.setItem('secops-theme', theme);
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    playTone(nextTheme === 'light' ? 880 : 660, 'sine', 0.08);
  });
}
initTheme();

/* ═══════════════════════════════════════════════════════════
   3. NAVBAR, SETTINGS DROPDOWN & MOBILE MENU
═══════════════════════════════════════════════════════════ */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
});

// Settings Dropdown Toggle
const settingsToggle = document.getElementById('settingsToggle');
const settingsDropdown = document.getElementById('settingsDropdown');
const settingsWrap = document.getElementById('settingsWrap');

if (settingsToggle && settingsDropdown) {
  settingsToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = settingsDropdown.classList.toggle('open');
    settingsToggle.classList.toggle('active', isOpen);
    settingsToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    playTone(isOpen ? 850 : 700, 'sine', 0.04);
  });

  document.addEventListener('click', (e) => {
    if (settingsWrap && !settingsWrap.contains(e.target)) {
      if (settingsDropdown.classList.contains('open')) {
        settingsDropdown.classList.remove('open');
        settingsToggle.classList.remove('active');
        settingsToggle.setAttribute('aria-expanded', 'false');
      }
    }
  }
  );
}

const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
if (burger && mobileMenu) {
  burger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    burger.classList.toggle('open', isOpen);
    burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    playTone(650, 'sine', 0.05);
  });
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });
}

// Global Escape key listener
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (mobileMenu && mobileMenu.classList.contains('open')) {
      mobileMenu.classList.remove('open');
      if (burger) {
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    }
    if (settingsDropdown && settingsDropdown.classList.contains('open')) {
      settingsDropdown.classList.remove('open');
      if (settingsToggle) {
        settingsToggle.classList.remove('active');
        settingsToggle.setAttribute('aria-expanded', 'false');
      }
    }
  }
  
});

/* ═══════════════════════════════════════════════════════════
   4. HEXAGONAL OPERATIONAL RADAR CHART
═══════════════════════════════════════════════════════════ */
let currentRadarProgress = 1;
window.renderRadarChart = function() {
  if (window._renderRadar) window._renderRadar(currentRadarProgress);
};

function initRadarChart() {
  const canvas = document.getElementById('radarCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r = 115;
  const categoriesFr = ['Audit & SMSI', 'SOC & DFIR', 'Sécurité Off.', 'Linux RHEL', 'Cloud Azure', 'Gouvernance'];
  const categoriesEn = ['Audit & ISMS', 'SOC & DFIR', 'Offensive Sec.', 'Linux RHEL', 'Cloud Azure', 'Governance'];
  const values = [0.95, 0.90, 0.88, 0.94, 0.85, 0.92];
  const n = categoriesFr.length;
  const angle = i => (Math.PI * 2 * i) / n - Math.PI / 2;

  function renderRadar(progress = 1) {
    window._renderRadar = renderRadar;
    currentRadarProgress = progress;
    const categories = currentLang === 'en' ? categoriesEn : categoriesFr;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Concentric web rings
    for (let ring = 1; ring <= 4; ring++) {
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const rad = (r * ring) / 4;
        const x = cx + rad * Math.cos(angle(i));
        const y = cy + rad * Math.sin(angle(i));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Radial spokes
    for (let i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i)));
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.16)';
      ctx.stroke();
    }

    // Polygon Shape
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const d = r * values[i] * progress;
      const x = cx + d * Math.cos(angle(i));
      const y = cy + d * Math.sin(angle(i));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 140, 255, 0.22)';
    ctx.strokeStyle = '#00D9FF';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    // Vertex dots & Labels
    for (let i = 0; i < n; i++) {
      const d = r * values[i] * progress;
      const x = cx + d * Math.cos(angle(i));
      const y = cy + d * Math.sin(angle(i));
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#008CFF';
      ctx.fill();

      const lx = cx + (r + 24) * Math.cos(angle(i));
      const ly = cy + (r + 20) * Math.sin(angle(i));
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#C9D3E3';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(categories[i], lx, ly);
    }
  }
  

  ScrollTrigger.create({
    trigger: canvas,
    start: 'top 82%',
    once: true,
    onEnter: () => {
      gsap.to({ p: 0 }, {
        p: 1,
        duration: 1.5,
        ease: 'power2.out',
        onUpdate() { renderRadar(this.targets()[0].p); },
      });
    },
  });
}
initRadarChart();

/* ═══════════════════════════════════════════════════════════
   5. 3D CARD PERSPECTIVE TILT
═══════════════════════════════════════════════════════════ */
document.querySelectorAll('.cert-card, .project-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotX = ((y - rect.height / 2) / rect.height) * -12;
    const rotY = ((x - rect.width / 2) / rect.width) * 12;
    gsap.to(card, {
      rotateX: rotX,
      rotateY: rotY,
      duration: 0.25,
      ease: 'power1.out',
      transformPerspective: 800,
    });
  });
  card.addEventListener('mouseleave', () => {
    gsap.to(card, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.5,
      ease: 'elastic.out(1, 0.5)',
    });
  });
});

/* ═══════════════════════════════════════════════════════════
   6. PROJECT FILTER SYSTEM
═══════════════════════════════════════════════════════════ */
const filterButtons = document.querySelectorAll('.filter-tab');
const projectCards = document.querySelectorAll('.project-card');

filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    playTone(800, 'sine', 0.05);
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;

    projectCards.forEach(card => {
      const cat = card.dataset.category;
      if (filter === 'all' || cat === filter) {
        gsap.to(card, { opacity: 1, scale: 1, duration: 0.35, display: 'flex' });
      } else {
        gsap.to(card, { opacity: 0, scale: 0.95, duration: 0.25, display: 'none' });
      }
    });
  });
});

/* ═══════════════════════════════════════════════════════════
   7. SCROLLTRIGGER REVEALS
═══════════════════════════════════════════════════════════ */
if (!prefersReducedMotion) {
  document.querySelectorAll('.section-title').forEach(el => {
    gsap.from(el, {
      y: 15,
      duration: 0.5,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 95%', once: true },
    });
  });

  document.querySelectorAll('.timeline-item').forEach(item => {
    const content = item.querySelector('.timeline-content');
    if (content) {
      gsap.from(content, {
        y: 20,
        duration: 0.5,
        ease: 'power2.out',
        scrollTrigger: { trigger: item, start: 'top 92%', once: true },
      });
    }
  }
  );
}

/* ═══════════════════════════════════════════════════════════
   8. INTERACTIVE BASH TERMINAL EMULATOR
═══════════════════════════════════════════════════════════ */
const termInput = document.getElementById('termInput');
const termLogs = document.getElementById('termLogs');
const termScreen = document.getElementById('terminalScreen');

const terminalData = {
  whoami: `> HAMDOUNI YOSRI — Cybersecurity Engineer in the Making & Consultant
> Élève-ingénieur 3A à TEK-UP, certifié ISO 27001 Lead Auditor, eCPPT v2, SC-200, Splunk & RHCE.
> Concepteur de CyberScore TN (ANCS) & de l'architecture Smart SOC Wazuh/Sentinel (<10s).
> Objectif : Stage PFE conventionné de 6 mois début 2027 (Pré-embauche CDI)
> Mobilité : France & International | Langues : FR (C1), EN (B2/C1), AR (Bilingue)`,

  projects: `[+] PROJETS CYBERSÉCURITÉ MAJEURS :
1. CyberScore TN (ANCS) — Audit autonome multi-agents & LLM local (Ollama Qwen2.5-Coder:7B). Scellement SHA-256. Score en ~35s.
   Repo : github.com/YosriSecOps/cyberscore-probe-agent
2. Smart SOC & SOAR — Corrélation Wazuh XDR + Sentinel + Suricata. Playbooks actifs en <10s. Fatigue divisée par 20.
   Repo : github.com/YosriSecOps/Smart_SOC
3. Active Directory Offensive Lab — Kerberoasting, AS-REP, Golden Ticket, BloodHound, Tiering Model & LAPS.
4. Analyse des Risques EBIOS RM & NIS 2 — Cartographie et matrice de risques pour opérateur critique (OIV).`,

  certs: `[+] ACCRÉDITATIONS OFFICIELLES (8 CERTIFICATIONS) :
• ISO/IEC 27001 Lead Auditor — Audit SMSI, ISO 27002/27005, NIS 2 & DORA
• eCPPT v2 (Certified Professional Penetration Tester — INE)
• Microsoft SC-200 — Microsoft Security Operations Analyst (Sentinel & Defender XDR)
• Splunk Core Certified Power User — SPL, Dashboards, Corrélation SOC
• Red Hat RHCE & RHCSA — Linux durci RHEL 9 (SELinux Enforcing, Firewalld)
• Red Hat EX188 — Spécialiste Conteneurs & Micro-services
• eJPT — Junior Penetration Tester (INE)
• PCAP — Certified Associate in Python Programming (Python Institute)`,

  parcours: `[+] MISSIONS D'INGÉNIERIE & EXPÉRIENCES :
• 07/2026 – 09/2026 : ANCS (Agence Nationale de la Cybersécurité) — Concepteur CyberScore TN, R&D Offensive
• 06/2025 – 07/2025 : OTD (Office des Terres Domaniales) — Audit SI Cisco/Windows/RHEL, Active Directory, SOC Wazuh
• 2025 – Présent    : Consultant Cyber Indépendant — 4 missions d'audit PME (ISO 27001, Azure Cloud, Pentest Web)
• 2025 – Présent    : Fondateur Python Express — Formation & mentorat cyber de +100 apprenants
• 2026 – Présent    : Formateur GOMYCODE — Cloud Microsoft Azure & Automatisation Entra ID`,

  skills: `[+] ARSENAL TECHNIQUE :
• Audit & Risques : ISO 27001, ISO 27005, NIS 2, DORA, EBIOS RM v2, CIS Benchmarks, ANSSI, PingCastle
• SOC & DFIR      : Sentinel, Splunk, Wazuh, Suricata IDS, Zeek, MITRE ATT&CK, KQL, SPL, SOAR (<10s)
• Offensive       : Metasploit, Burp Suite, Nmap, BloodHound, Mimikatz, Kerberoasting, Pass-the-Hash
• Systèmes & Dev  : RHEL 9 durci, SELinux, Docker, Azure, Python, Bash, FastAPI, Next.js, Ollama`,

  contact: `[+] CONTACT & RÉSEAUX :
• Email    : yosri.hamdouni.cyber@gmail.com
• Téléphone: (+216) 92 791 769
• LinkedIn : linkedin.com/in/yosri-hamdouni
• GitHub   : github.com/YosriSecOps`,

  help: `COMMANDES DISPONIBLES :
  whoami      Afficher le profil complet et l'objectif PFE 2027
  projects    Lister les projets stratégiques et repositories
  certs       Consulter les 8 certifications vérifiées
  parcours    Détailler les missions d'audit (ANCS, OTD, Freelance)
  skills      Afficher l'arsenal technique et méthodologique
  cat cv      Afficher la synthèse textuelle du Curriculum Vitæ
  audit       Lancer une simulation de scan d'audit CyberScore TN
  matrix      Activer la pluie numérique dans la console
  contact     Afficher les coordonnées de communication
  clear       Effacer l'écran de la console`,
};

const cmdHistory = [];
let historyIndex = -1;

function executeTermCommand(rawCmd) {
  const cmd = rawCmd.trim().toLowerCase();
  playTone(950, 'triangle', 0.04);

  const entry = document.createElement('div');
  entry.className = 'term-history-entry';

  const cmdLine = document.createElement('div');
  cmdLine.className = 'term-history-cmd';
  cmdLine.innerHTML = `<span class="prompt">yosri@secops ~ $</span> ${rawCmd}`;
  entry.appendChild(cmdLine);

  const out = document.createElement('div');
  out.className = 'term-history-output';

  if (!cmd) {
    // empty
  } else if (cmd === 'clear') {
    termLogs.innerHTML = '';
    return;
  } else if (cmd === 'cat cv' || cmd === 'cv') {
    out.innerHTML = `<span class="term-cyan">══════════════════════════════════════════════════════════
HAMDOUNI YOSRI · Consultant Cybersécurité
Audit des Risques, Sécurité Offensive & Cyberdéfense (SOC)
Recherche Stage PFE (6 mois conventionné) — Début 2027 • Pré-embauche CDI
Tunis, Tunisie (Mobilité complète : France & International)
Email : yosri.hamdouni.cyber@gmail.com | Tél : (+216) 92 791 769
══════════════════════════════════════════════════════════</span>
[+] TÉLÉCHARGEMENT DU CURRICULUM VITÆ :
➔ <a href="cv-yosri-hamdouni.pdf" download class="term-link" style="color:var(--accent); text-decoration:underline; font-weight:700;">Télécharger le CV officiel (cv-yosri-hamdouni.pdf)</a>

${terminalData.whoami}

<span class="term-success">[✓] Empreinte d'intégrité : SHA-256 (Scellé avec succès).</span>`;
  } else if (cmd === 'contact') {
    out.innerHTML = `<span class="term-cyan">[+] COORDONNÉES DE COMMUNICATION DIRECTES :</span>
• Email : <a href="mailto:yosri.hamdouni.cyber@gmail.com" class="term-link" style="color:var(--cyan);">yosri.hamdouni.cyber@gmail.com</a>
• Téléphone : <a href="tel:+21692791769" class="term-link" style="color:#ffffff;">+216 92 791 769</a>
• WhatsApp : <a href="https://wa.me/21692791769" target="_blank" rel="noopener" class="term-link" style="color:var(--accent);">wa.me/21692791769 ↗</a>
• LinkedIn : <a href="https://linkedin.com/in/yosri-hamdouni" target="_blank" rel="noopener" class="term-link" style="color:var(--cyan);">linkedin.com/in/yosri-hamdouni ↗</a>
• GitHub : <a href="https://github.com/YosriSecOps" target="_blank" rel="noopener" class="term-link" style="color:var(--cyan);">github.com/YosriSecOps ↗</a>
• Disponibilité : <span class="term-success">Réponse garantie sous 48 h</span>`;
  } else if (cmd === 'help') {
    out.innerHTML = `<span class="term-cyan">[+] COMMANDES DISPONIBLES :</span>
  <span class="term-success">whoami</span>       Présentation du profil & objectifs PFE 2027
  <span class="term-success">projects</span>     Frameworks & architectures de sécurité
  <span class="term-success">certs</span>        8 certifications (ISO 27001, eCPPT, SC-200...)
  <span class="term-success">parcours</span>     Missions ANCS, OTD & audit indépendant
  <span class="term-success">skills</span>       Arsenal méthodologique & technique
  <span class="term-success">cv</span>           Lien direct de téléchargement du CV (PDF)
  <span class="term-success">contact</span>      Coordonnées directes (Email, Tel, WhatsApp)
  <span class="term-success">audit</span>        Simulation de scan CyberScore TN (ANCS)
  <span class="term-success">clear</span>        Effacer l'écran`;
  } else if (cmd === 'audit') {
    out.innerHTML = `<span class="term-warning">[*] Initialisation de CyberScore TN Probe Agent...</span>
[*] Cible : OIV-CRITICAL-INFRA (150 threads)
[>] Scan TCP/UDP & OS Fingerprinting... [OK]
[>] Corrélation CVE & CVSS v3 via Ollama (Qwen2.5-Coder:7B local)... [OK]
[>] Évaluation conformité ISO 27001 / NIS 2... [OK]
<span class="term-success">[✓] Score de maturité calculé en 34.6s (Gain productivité >90%)</span>
<span class="term-success">[✓] Rapport scellé SHA-256 généré avec succès.</span>`;
  } else if (cmd === 'matrix') {
    let matrixStream = '';
    for (let i = 0; i < 5; i++) {
      matrixStream += `01001001 01010011 01001111 00110010 00110111 00110000 00110001\n`;
    }
    out.innerHTML = `<span class="term-success">${matrixStream}</span><span class="term-cyan">SecOps Cyber Matrix stream actif.</span>`;
  } else if (terminalData[cmd]) {
    out.textContent = terminalData[cmd];
  } else {
    out.innerHTML = `<span class="term-error">bash: commande inconnue: "${rawCmd}".</span>\nTapez <span class="cmd-pill">help</span> pour afficher la liste des commandes disponibles :\n  whoami, projects, certs, parcours, skills, cv, contact, audit, clear.`;
  }

  entry.appendChild(out);
  termLogs.appendChild(entry);
  termScreen.scrollTop = termScreen.scrollHeight;
}

if (termInput) {
  termInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const val = termInput.value;
      if (val.trim()) {
        cmdHistory.push(val);
        historyIndex = cmdHistory.length;
      }
      executeTermCommand(val);
      termInput.value = '';
    } else if (e.key === 'ArrowUp') {
      if (historyIndex > 0) {
        historyIndex--;
        termInput.value = cmdHistory[historyIndex] || '';
      }
    } else if (e.key === 'ArrowDown') {
      if (historyIndex < cmdHistory.length - 1) {
        historyIndex++;
        termInput.value = cmdHistory[historyIndex] || '';
      } else {
        historyIndex = cmdHistory.length;
        termInput.value = '';
      }
    }
  }
  );

  document.querySelectorAll('.quick-cmd-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cmd = btn.dataset.cmd;
      executeTermCommand(cmd);
      termInput.value = '';
      // Only focus on desktop to avoid intrusive keyboard pop on mobile
      if (window.innerWidth > 768) {
        termInput.focus();
      }
    });
  });
}

/* ═══════════════════════════════════════════════════════════
   9. PRINT / DOWNLOAD CV HANDLER
═══════════════════════════════════════════════════════════ */
const btnPrintCv = document.getElementById('btnPrintCv');
if (btnPrintCv) {
  btnPrintCv.addEventListener('click', () => {
    playTone(1200, 'sine', 0.1);
    window.print();
  });
}

/* ═══════════════════════════════════════════════════════════
   10. BILINGUAL SUPPORT (FR / EN) — FULL SITE
═══════════════════════════════════════════════════════════ */
const translations = {
  fr: {
    'nav.home':'Accueil','nav.profile':'Profil','nav.certs':'Certifications','nav.projects':'Projets',
    'nav.timeline':'Parcours','nav.skills':'Arsenal','nav.terminal':'Terminal','nav.contact':'Me contacter',
    'settings.title':'CONFIGURATION',
    'hero.badge':'Cyber Security Engineer',
    'hero.tagline':'Comprendre l\u2019<span class="hl-cyan">attaque</span>. Construire la <span class="hl-blue">défense</span>.',
    'hero.sub':'Audit des risques · Sécurité offensive · Cyberdéfense.<br>Une approche de terrain, du signal à l\u2019action.',
    'hero.explore':'Explorer mes projets \u2192','hero.contact':'\u003e_ Me contacter','hero.cv':'CV (PDF)',
    'hero.term.res':'> CYBERSECURITY ENGINEER IN THE MAKING',
    'hero.term.audit':'[ OK ] Audit & Gouvernance (ISO 27001 Lead Auditor, RHCSA)',
    'hero.term.offensive':'[ OK ] Sécurité Offensive (eCPPT v2, AD Pentest, Root Access)',
    'hero.term.defense':'[ OK ] Défense SOC & DFIR (Wazuh, Sentinel, SOAR <10s)',
    'hero.term.pfe':'> Stage PFE 6 mois · Tunisie & International',
    'hero.term.mobility':'> Mobilité active · Opérationnel immédiatement',
    'stat.audit':'Missions d\u2019audit indépendant','stat.learners':'Apprenants formés & mentorés',
    'stat.soar':'Réponse active SOAR à incident','stat.score':'Calcul score maturité (CyberScore TN)',
    'certs.preview.title':'Compétences certifiées',
    'certs.preview.sub':'Des certifications reconnues pour une expertise solide',
    'certs.preview.link':'Voir toutes','scroll.hint':'DÉFILEZ POUR AVANCER LA VIDÉO',
    'profil.tag':'01 / 07 · PROFIL',
    'profil.title':'La curiosité comme <span class="accent">première ligne de défense</span>.',
    'profil.radar.title':'MATRICE DES COMPÉTENCES OPÉRATIONNELLES',
    'profil.radar.legend1':'Couverture Opérationnelle','profil.radar.legend2':'R&D Offensive & SOC',
    'profil.role':'YOSRI HAMDOUNI · CONSULTANT CYBERSÉCURITÉ',
    'profil.quote':'Comprendre un système. Challenger ses défenses. Transformer les vulnérabilités en actions concrètes.',
    'profil.bio1':'Élève-ingénieur en 3ᵉ année à <strong>TEK-UP</strong>, certifié <strong>ISO 27001 Lead Auditor, eCPPT v2, SC-200, Splunk et Red Hat RHCE/RHCSA</strong>. Je relie la gouvernance des risques (SMSI, NIS 2, DORA, revues CIS & Active Directory) à la réalité opérationnelle : tests d\u2019intrusion, détection et réponse aux incidents.',
    'profil.bio2':'À l\u2019<strong>ANCS (Agence Nationale de la Cybersécurité)</strong>, j\u2019ai conçu <strong>CyberScore TN</strong> pour évaluer automatiquement les Opérateurs d\u2019Importance Vitale (OIV) avec validation assistée par LLM local souverain. Avec <strong>Smart SOC</strong>, j\u2019ai automatisé la réponse active à incident en <strong>&lt;10 secondes</strong>. Et auprès de plus de <strong>100 apprenants</strong> (Python Express & GOMYCODE), je transmets cette même exigence méthodologique.',
    'profil.pfe.chip':'PROCHAIN CHAPITRE','profil.pfe.period':'DÉBUT 2027 · 6 MOIS',
    'profil.pfe.title':'Stage de Fin d\u2019Études (PFE conventionné) — Pré-embauche CDI',
    'profil.pfe.desc':'Périmètre ciblé : <strong>Consultant Cybersécurité / Ingénieur Sécurité</strong> (Audit des Risques, SOC & Détection, ou Sécurité Offensive / Pentest).<br/>Mobilité géographique complète : <strong>Tunisie & International</strong>.',
    'profil.badge.mobility':'Mobilité : Tunisie & International',
    'profil.badge.fr':'<strong>FR</strong> Français · C1 (Courant)',
    'profil.badge.en':'<strong>EN</strong> Anglais · B2/C1 (Professionnel)',
    'profil.badge.ar':'<strong>AR</strong> Arabe · Bilingue',
    'certs.tag':'02 / 07 · CERTIFICATIONS',
    'certs.title':'Compétences <span class="accent">certifiées</span>.',
    'certs.sub':'Accréditations reconnues par l\u2019industrie en gouvernance, analyse SOC, systèmes et pentest.',
    'cert.verified':'VÉRIFIÉ',
    'cert.iso.desc':'Audit SMSI, gouvernance ISO 27002 / 27005, exigences de conformité NIS 2 et DORA, restitution managériale C-Level.',
    'cert.iso.meta':'GOUVERNANCE & SMSI',
    'cert.ecppt.desc':'Pentest réseau & web avancé, pivoting complexe, exploitation Active Directory, buffer overflow et rapport professionnel.',
    'cert.ecppt.meta':'SÉCURITÉ OFFENSIVE',
    'cert.sc200.desc':'Microsoft Sentinel SIEM/SOAR, Microsoft Defender XDR, requêtes de Threat Hunting KQL et réponse aux incidents cloud.',
    'cert.sc200.meta':'SOC & CLOUD SECURITY',
    'cert.splunk.desc':'Recherche avancée SPL, création de tableaux de bord, modélisation de données, règles de corrélation et alertes de production.',
    'cert.splunk.meta':'SIEM & ANALYTICS',
    'cert.rhce.desc':'Administration système avancée RHEL 9, automatisation Ansible, durcissement SELinux Enforcing, Firewalld DROP et stockage.',
    'cert.rhce.meta':'LINUX HARDENING',
    'cert.ex188.desc':'Déploiement et sécurisation de conteneurs Podman/Docker, gestion d\u2019images durcies, volumes et architectures micro-services.',
    'cert.ex188.meta':'CONTAINERS & DEVOPS',
    'cert.ejpt.desc':'Fondamentaux du test d\u2019intrusion, cartographie réseau Nmap, analyse de vulnérabilités et exploitation pratique.',
    'cert.ejpt.meta':'ASSESSMENT PRATIQUE',
    'cert.pcap.desc':'Développement d\u2019outils de sécurité en Python, scripts réseau Scapy, multi-threading, intégration d\u2019API et agents d\u2019audit.',
    'cert.pcap.meta':'CYBERSCRIPTING & AUTOMATION',
    'projects.tag':'03 / 07 · PROJETS',
    'projects.title':'Du code. <span class="accent">De l\u2019impact</span>.',
    'projects.sub':'Frameworks autonomes, pipelines SOC réactifs et environnements de tests offensifs.',
    'projects.filter.all':'Tous (05)','projects.filter.audit':'Audit & Risques',
    'projects.filter.defense':'Cyberdéfense & SOC','projects.filter.offensive':'Sécurité Offensive',
    'p1.status':'OPÉRATIONNEL (ANCS)','p1.bench':'~35s par cible auditée',
    'p1.num':'PROJET 01/05 · AUDIT & RISQUES',
    'p1.tagline':'De la surface d\u2019attaque à la décision.',
    'p1.desc':'Framework autonome d\u2019audit d\u2019infrastructures critiques pour <strong>OIV</strong>. Reconnaissance multi-threads (150 threads, TCP/UDP), corrélation CVE via <strong>LLM souverain local (Qwen2.5)</strong> et rapports de conformité ISO 27001 / NIS 2 scellés SHA-256.',
    'p1.pill.label':'Gain de productivité :','p1.pill.val':'>90% vs méthode manuelle',
    'p1.link':'Voir le repo GitHub \u2192',
    'p2.status':'ARCHITECTURE SOC','p2.bench':'<10s réponse active',
    'p2.num':'PROJET 02/05 · CYBERDÉFENSE',
    'p2.tagline':'Détecter. Corréler. Neutraliser.',
    'p2.desc':'Architecture SOC hybride alignée sur le framework <strong>MITRE ATT&CK</strong>. Corrélation multi-sources (Wazuh SIEM/XDR, Sentinel, Suricata IDS), réduction de la fatigue d\u2019alerte (20:1) et remédiation active automatisée en moins de 10 secondes.',
    'p2.pill.label':'Fatigue d\u2019alerte :','p2.pill.val':'Divisée par 20',
    'p2.link':'Voir le repo GitHub \u2192',
    'p3.status':'LAB D\u2019INTRUSION','p3.bench':'Simulation Tiering Model',
    'p3.num':'PROJET 03/05 · SÉCURITÉ OFFENSIVE',
    'p3.tagline':'Cartographier les chemins d\u2019attaque.',
    'p3.desc':'Simulation d\u2019audit d\u2019intrusion sur domaines Windows Server : <strong>Kerberoasting, AS-REP Roasting, Pass-the-Hash, Golden Ticket</strong>. Cartographie des chemins critiques via BloodHound et guide de durcissement (<strong>Tiering Model, LAPS, GPO</strong>).',
    'p3.pill.label':'Durcissement :','p3.pill.val':'Tiering Model & LAPS',
    'p3.link.disabled':'Simulation d\u2019audit d\u2019intrusion · Guide de durcissement rédigé',
    'p4.status':'CAS D\u2019USAGE','p4.bench':'Conformité NIS 2 & DORA',
    'p4.num':'PROJET 04/05 · GOUVERNANCE & RISQUES',
    'p4.tagline':'Traduire les menaces en priorités.',
    'p4.desc':'Cas d\u2019usage d\u2019audit de conformité selon la méthode ANSSI <strong>EBIOS RM v2</strong> : identification des événements redoutés, scénarios de menace stratégiques et opérationnels, et alignement réglementaire <strong>ISO 27005, NIS 2 et DORA</strong>.',
    'p4.pill.label':'Méthodologie :','p4.pill.val':'ANSSI EBIOS RM v2',
    'p4.link.disabled':'Cas d\u2019usage d\u2019audit de conformité · Matrice de traitement des risques',
    'p5.status':'PROJET PERSONNEL','p5.num':'PROJET 05/05 · SURVEILLANCE & FORENSIQUE',
    'p5.tagline':'Détecter. Alerter. Prouver.',
    'p5.desc':'Plateforme de vidéosurveillance multi-caméras en Python : détection (<strong>Haar Cascade</strong>) et reconnaissance faciale (<strong>LBPH</strong>) par flux, alertes <strong>Telegram</strong> avec anti-spam (cooldown 15 s) et tatouage numérique <strong>DCT</strong> des captures pour la traçabilité des preuves.',
    'p5.pill.label':'Traçabilité des preuves :','p5.pill.val':'Watermark DCT',
    'p5.link':'Voir le repo GitHub \u2192',
    'timeline.tag':'04 / 07 · PARCOURS',
    'timeline.title':'Missions d\u2019ingénierie & <span class="accent">expérience</span>.',
    'timeline.sub':'Du terrain opérationnel en agence nationale aux audits d\u2019infrastructures d\u2019entreprises.',
    'tl1.tag':'AGENCE NATIONALE',
    'tl1.title':'ANCS — Agence Nationale de la Cybersécurité',
    'tl1.role':'Ingénieur Consultant Stagiaire — Audit Cybersécurité, SOC & R&D Offensive',
    'tl1.b1':'<strong>Audit automatisé & résilience des OIV (CyberScore TN) :</strong> Framework autonome d\u2019évaluation de conformité (ISO 27001 / NIS 2) pour les Opérateurs d\u2019Importance Vitale.',
    'tl1.b2':'<strong>Validation PoC dynamique & corrélation CVE :</strong> Détection des failles d\u2019élévation et vérification assistée par LLM local souverain (Qwen2.5-Coder:7B via Ollama).',
    'tl1.b3':'<strong>Déploiement durci & scellement d\u2019intégrité :</strong> Bastion conteneurisé durci sur RHEL 9.5 (SELinux Enforcing) et restitution de matrices de risques EBIOS RM.',
    'tl1.kpi1.val':'~35 s / cible','tl1.kpi1.lbl':'Vitesse d\u2019évaluation',
    'tl1.kpi2.lbl':'Cartographie parallèle','tl1.stack':'Stack :',
    'tl2.tag':'ENTREPRISE PUBLIQUE',
    'tl2.title':'OTD — Office des Terres Domaniales',
    'tl2.role':'Consultant Stagiaire — Audit Sécurité des SI, Active Directory & SOC',
    'tl2.b1':'<strong>Audit technique & conformité CIS Benchmarks :</strong> Audit de configuration sur plus de 30 équipements réseau Cisco et serveurs d\u2019entreprise (Windows Server, RHEL) selon les benchmarks CIS/ANSSI ; réduction des surfaces d\u2019attaque critiques.',
    'tl2.b2':'<strong>Audit Active Directory & chemins d\u2019attaque :</strong> Cartographie approfondie des privilèges via PingCastle et BloodHound (détection de délégations abusives, comptes orphelins, faiblesses Kerberos) et préconisation du Tiering Model / LAPS.',
    'tl2.b3':'<strong>Socle de surveillance SOC :</strong> Déploiement d\u2019une sonde pilote SIEM Wazuh, corrélation des événements d\u2019authentification suspects (Pass-the-Hash / brute-force) et présentation du rapport avec plan d\u2019action à la DSI.',
    'tl3.date':'2025 – Présent','tl3.tag':'CONSEIL INDÉPENDANT',
    'tl3.title':'Missions d\u2019Audit & Conseil Cyber Indépendant',
    'tl3.role':'Consultant Auditeur Cybersécurité Indépendant / Projets PME',
    'tl3.b1':'Réalisation de <strong>4 missions d\u2019audit de sécurité et de conformité</strong> pour PME et startups : pré-audits ISO 27001, revues de configuration Cloud Azure, tests d\u2019intrusion Web (OWASP Top 10).',
    'tl3.b2':'Animation d\u2019ateliers de restitution managériale auprès des dirigeants d\u2019entreprise et RSSI.',
    'tl4.date':'2025 – Présent','tl4.tag':'PÉDAGOGIE & MENTORAT',
    'tl4.title':'Transmission Technique & Leadership Pédagogique',
    'tl4.role':'Fondateur Python Express & Formateur GOMYCODE',
    'tl4.b1':'<strong>Python Express (Fondateur & Formateur) :</strong> Direction d\u2019une communauté technique de plus de <strong>100 apprenants</strong> ; élaboration de parcours pratiques en automatisation d\u2019outils de sécurité, conception de labs cyber et mentorat personnalisé.',
    'tl4.b2':'<strong>GOMYCODE (Formateur Microsoft Azure Cloud & Automatisation) :</strong> Animation de modules sur l\u2019architecture Cloud Azure, la gouvernance des identités (Entra ID) et l\u2019automatisation d\u2019administration sécurisée.',
    'tl5.date':'2021 – Présent','tl5.tag':'CURSUS D\u2019INGÉNIEUR',
    'tl5.title':'Formation Académique d\u2019Excellence',
    'tl5.b1':'<strong>TEK-UP School of Engineering (2024 – Présent) :</strong> Diplôme d\u2019Ingénieur en Cybersécurité & Systèmes (3ᵉ année en cours).',
    'tl5.b2':'<strong>IPEIN Nabeul (2022 – 2024) :</strong> Classes Préparatoires aux Concours Nationaux d\u2019Ingénieurs (Filière Maths & Physique - MP).',
    'tl5.b3':'<strong>Lycée Secondaire de Bizerte (2021 – 2022) :</strong> Baccalauréat Scientifique (Section Mathématiques, Mention Très Bien).',
    'skills.tag':'05 / 07 · ARSENAL',
    'skills.title':'Arsenal technique & <span class="accent">méthodologique</span>.',
    'skills.sub':'De la conformité réglementaire de haut niveau aux outils de détection et d\u2019exploitation de bas niveau.',
    'skills.legend.cert':'Certifié','skills.legend.proj':'Pratiqué en projet','skills.legend.notion':'Notions',
    'skills.col1.title':'Audit, Risques & Réglementation','skills.col1.sub':'De la conformité à la résilience.',
    'skills.col2.title':'SOC, Détection & Réponse','skills.col2.sub':'Du signal à la réponse active.',
    'skills.col3.title':'Sécurité Offensive & Pentest','skills.col3.sub':'Penser comme l\u2019adversaire.',
    'skills.col4.title':'Systèmes, Réseaux & Cloud','skills.col4.sub':'Infrastructures durcies & code.',
    'skills.seeMore1':'Voir plus (+4)','skills.seeMore2':'Voir plus (+4)',
    'skills.seeMore3':'Voir plus (+4)','skills.seeMore4':'Voir plus (+3)',
    'skills.deliverables':'Livrables :',
    'skills.d1.1':'Restitution C-Level','skills.d1.2':'Matrices EBIOS RM','skills.d1.3':'Rapports d\u2019audit SMSI',
    'skills.d2.1':'Playbooks d\u2019incident','skills.d2.2':'Tableaux de bord SIEM','skills.d2.3':'Règles de détection',
    'skills.d3.1':'Rapports de pentest','skills.d3.2':'PoC d\u2019exploitation','skills.d3.3':'Plans de remédiation',
    'skills.d4.1':'Blueprints durcissement','skills.d4.2':'Scripts d\u2019automatisation','skills.d4.3':'Conteneurs durcis',
    'terminal.tag':'06 / 07 · TERMINAL',
    'terminal.title':'Explorez mon profil en <span class="accent">ligne de commande</span>.',
    'terminal.sub':'Pas de scan intrusif. Pas de magie. Juste mon profil, version terminal interactive.',
    'terminal.welcome':'Bienvenue sur le shell interactif de <strong>Yosri Hamdouni</strong>.',
    'terminal.hint':'Tapez <span class="cmd-pill">help</span> pour afficher la liste des commandes ou cliquez sur les suggestions ci-dessous :',
    'contact.tag':'07 / 07 · CONTACT',
    'contact.title':'Une mission. <span class="accent">Un nouveau défi</span>.',
    'contact.sub':'À la recherche d\u2019un stage PFE de 6 mois à partir de début 2027 en tant que Consultant / Ingénieur Cybersécurité. Mobilité complète en Tunisie et à l\u2019international.',
    'contact.phone.label':'TÉLÉPHONE & WHATSAPP',
    'contact.response':'Réponse sous 48 h',
    'contact.form.name':'Votre nom & entreprise',
    'contact.form.email':'Votre adresse email',
    'contact.form.subject':'Objet de l\u2019opportunité',
    'contact.form.message':'Détails de la mission',
    'contact.form.submit':'Envoyer le message \u2192',
    'contact.cv.title':'MON CV',
    'contact.cv.sub':'PDF · [N] page(s) · mis à jour en novembre 2026',
    'contact.cv.btn':'Télécharger mon CV (PDF)',
    'footer.copy':'· Cybersecurity Engineer & Consultant © 2026',
    'footer.top':'RETOUR EN HAUT',
  },
  en: {
    'nav.home':'Home','nav.profile':'Profile','nav.certs':'Certifications','nav.projects':'Projects',
    'nav.timeline':'Experience','nav.skills':'Arsenal','nav.terminal':'Terminal','nav.contact':'Contact Me',
    'settings.title':'SETTINGS',
    'hero.badge':'Cyber Security Engineer',
    'hero.tagline':'Understand the <span class="hl-cyan">attack</span>. Build the <span class="hl-blue">defense</span>.',
    'hero.sub':'Risk audit · Offensive security · Cyber defense.<br>A hands-on approach, from signal to action.',
    'hero.explore':'Explore my projects \u2192','hero.contact':'\u003e_ Contact Me','hero.cv':'CV (PDF)',
    'hero.term.res':'> CYBERSECURITY ENGINEER IN THE MAKING',
    'hero.term.audit':'[ OK ] Audit & Governance (ISO 27001 Lead Auditor, RHCSA)',
    'hero.term.offensive':'[ OK ] Offensive Security (eCPPT v2, AD Pentest, Root Access)',
    'hero.term.defense':'[ OK ] SOC Defense & DFIR (Wazuh, Sentinel, SOAR <10s)',
    'hero.term.pfe':'> 6-month internship · Tunisia & International',
    'hero.term.mobility':'> Active mobility · Available immediately',
    'stat.audit':'Independent audit missions','stat.learners':'Learners trained & mentored',
    'stat.soar':'Active SOAR incident response','stat.score':'Maturity score computation (CyberScore TN)',
    'certs.preview.title':'Certified Skills',
    'certs.preview.sub':'Industry-recognized certifications for proven expertise',
    'certs.preview.link':'View all','scroll.hint':'SCROLL TO ADVANCE THE VIDEO',
    'profil.tag':'01 / 07 · PROFILE',
    'profil.title':'Curiosity as the <span class="accent">first line of defense</span>.',
    'profil.radar.title':'OPERATIONAL SKILLS MATRIX',
    'profil.radar.legend1':'Operational Coverage','profil.radar.legend2':'Offensive R&D & SOC',
    'profil.role':'YOSRI HAMDOUNI · CYBERSECURITY CONSULTANT',
    'profil.quote':'Understand a system. Challenge its defenses. Turn vulnerabilities into concrete actions.',
    'profil.bio1':'3rd-year engineering student at <strong>TEK-UP</strong>, certified <strong>ISO 27001 Lead Auditor, eCPPT v2, SC-200, Splunk and Red Hat RHCE/RHCSA</strong>. I bridge risk governance (ISMS, NIS 2, DORA, CIS & Active Directory reviews) with operational reality: penetration testing, detection and incident response.',
    'profil.bio2':'At the <strong>ANCS (National Cybersecurity Agency)</strong>, I designed <strong>CyberScore TN</strong> to automatically assess Critical Infrastructure Operators (CIOs) with sovereign local LLM-assisted validation. With <strong>Smart SOC</strong>, I automated active incident response in <strong>&lt;10 seconds</strong>. And with over <strong>100 learners</strong> (Python Express & GOMYCODE), I pass on that same methodological rigor.',
    'profil.pfe.chip':'NEXT CHAPTER','profil.pfe.period':'EARLY 2027 · 6 MONTHS',
    'profil.pfe.title':'Final Year Internship (PFE) — Pre-hire permanent contract',
    'profil.pfe.desc':'Target scope: <strong>Cybersecurity Consultant / Security Engineer</strong> (Risk Audit, SOC & Detection, or Offensive Security / Pentest).<br/>Full geographic mobility: <strong>Tunisia & International</strong>.',
    'profil.badge.mobility':'Mobility: Tunisia & International',
    'profil.badge.fr':'<strong>FR</strong> French · C1 (Fluent)',
    'profil.badge.en':'<strong>EN</strong> English · B2/C1 (Professional)',
    'profil.badge.ar':'<strong>AR</strong> Arabic · Bilingual',
    'certs.tag':'02 / 07 · CERTIFICATIONS',
    'certs.title':'Certified <span class="accent">skills</span>.',
    'certs.sub':'Industry-recognized accreditations in governance, SOC analysis, systems and pentesting.',
    'cert.verified':'VERIFIED',
    'cert.iso.desc':'ISMS audit, ISO 27002 / 27005 governance, NIS 2 and DORA compliance requirements, C-Level executive reporting.',
    'cert.iso.meta':'GOVERNANCE & ISMS',
    'cert.ecppt.desc':'Advanced network & web pentesting, complex pivoting, Active Directory exploitation, buffer overflow and professional reporting.',
    'cert.ecppt.meta':'OFFENSIVE SECURITY',
    'cert.sc200.desc':'Microsoft Sentinel SIEM/SOAR, Microsoft Defender XDR, KQL Threat Hunting queries and cloud incident response.',
    'cert.sc200.meta':'SOC & CLOUD SECURITY',
    'cert.splunk.desc':'Advanced SPL search, dashboard creation, data modeling, correlation rules and production alerts.',
    'cert.splunk.meta':'SIEM & ANALYTICS',
    'cert.rhce.desc':'Advanced RHEL 9 system administration, Ansible automation, SELinux Enforcing hardening, Firewalld DROP and storage.',
    'cert.rhce.meta':'LINUX HARDENING',
    'cert.ex188.desc':'Deployment and security of Podman/Docker containers, hardened image management, volumes and microservice architectures.',
    'cert.ex188.meta':'CONTAINERS & DEVOPS',
    'cert.ejpt.desc':'Penetration testing fundamentals, Nmap network mapping, vulnerability analysis and hands-on exploitation.',
    'cert.ejpt.meta':'HANDS-ON ASSESSMENT',
    'cert.pcap.desc':'Security tool development in Python, Scapy network scripts, multi-threading, API integration and audit agents.',
    'cert.pcap.meta':'CYBERSCRIPTING & AUTOMATION',
    'projects.tag':'03 / 07 · PROJECTS',
    'projects.title':'Code. <span class="accent">Impact</span>.',
    'projects.sub':'Autonomous frameworks, reactive SOC pipelines and offensive testing environments.',
    'projects.filter.all':'All (05)','projects.filter.audit':'Audit & Risk',
    'projects.filter.defense':'Cyber Defense & SOC','projects.filter.offensive':'Offensive Security',
    'p1.status':'OPERATIONAL (ANCS)','p1.bench':'~35s per audited target',
    'p1.num':'PROJECT 01/05 · AUDIT & RISK',
    'p1.tagline':'From attack surface to decision.',
    'p1.desc':'Autonomous critical infrastructure audit framework for <strong>CIOs</strong>. Multi-threaded reconnaissance (150 threads, TCP/UDP), CVE correlation via <strong>sovereign local LLM (Qwen2.5)</strong> and SHA-256 sealed ISO 27001 / NIS 2 compliance reports.',
    'p1.pill.label':'Productivity gain:','p1.pill.val':'>90% vs manual method',
    'p1.link':'View GitHub repo \u2192',
    'p2.status':'SOC ARCHITECTURE','p2.bench':'<10s active response',
    'p2.num':'PROJECT 02/05 · CYBER DEFENSE',
    'p2.tagline':'Detect. Correlate. Neutralize.',
    'p2.desc':'Hybrid SOC architecture aligned with the <strong>MITRE ATT&CK</strong> framework. Multi-source correlation (Wazuh SIEM/XDR, Sentinel, Suricata IDS), alert fatigue reduction (20:1) and automated active remediation in under 10 seconds.',
    'p2.pill.label':'Alert fatigue:','p2.pill.val':'Reduced by 20x',
    'p2.link':'View GitHub repo \u2192',
    'p3.status':'INTRUSION LAB','p3.bench':'Tiering Model Simulation',
    'p3.num':'PROJECT 03/05 · OFFENSIVE SECURITY',
    'p3.tagline':'Map the attack paths.',
    'p3.desc':'Intrusion audit simulation on Windows Server domains: <strong>Kerberoasting, AS-REP Roasting, Pass-the-Hash, Golden Ticket</strong>. Critical path mapping via BloodHound and hardening guide (<strong>Tiering Model, LAPS, GPO</strong>).',
    'p3.pill.label':'Hardening:','p3.pill.val':'Tiering Model & LAPS',
    'p3.link.disabled':'Intrusion audit simulation · Hardening guide written',
    'p4.status':'USE CASE','p4.bench':'NIS 2 & DORA Compliance',
    'p4.num':'PROJECT 04/05 · GOVERNANCE & RISK',
    'p4.tagline':'Translate threats into priorities.',
    'p4.desc':'Compliance audit use case following the ANSSI <strong>EBIOS RM v2</strong> method: identification of feared events, strategic and operational threat scenarios, and regulatory alignment with <strong>ISO 27005, NIS 2 and DORA</strong>.',
    'p4.pill.label':'Methodology:','p4.pill.val':'ANSSI EBIOS RM v2',
    'p4.link.disabled':'Compliance audit use case · Risk treatment matrix',
    'p5.status':'PERSONAL PROJECT','p5.num':'PROJECT 05/05 · SURVEILLANCE & FORENSICS',
    'p5.tagline':'Detect. Alert. Prove.',
    'p5.desc':'Multi-camera video surveillance platform in Python: detection (<strong>Haar Cascade</strong>) and facial recognition (<strong>LBPH</strong>) per stream, <strong>Telegram</strong> alerts with anti-spam (15s cooldown) and <strong>DCT</strong> digital watermarking of captures for evidence traceability.',
    'p5.pill.label':'Evidence traceability:','p5.pill.val':'DCT Watermark',
    'p5.link':'View GitHub repo \u2192',
    'timeline.tag':'04 / 07 · EXPERIENCE',
    'timeline.title':'Engineering missions & <span class="accent">experience</span>.',
    'timeline.sub':'From operational fieldwork at a national agency to enterprise infrastructure audits.',
    'tl1.tag':'NATIONAL AGENCY',
    'tl1.title':'ANCS — National Cybersecurity Agency',
    'tl1.role':'Intern Consultant Engineer — Cybersecurity Audit, SOC & Offensive R&D',
    'tl1.b1':'<strong>Automated audit & CIO resilience (CyberScore TN):</strong> Autonomous compliance assessment framework (ISO 27001 / NIS 2) for Critical Infrastructure Operators.',
    'tl1.b2':'<strong>Dynamic PoC validation & CVE correlation:</strong> Privilege escalation flaw detection and verification assisted by sovereign local LLM (Qwen2.5-Coder:7B via Ollama).',
    'tl1.b3':'<strong>Hardened deployment & integrity sealing:</strong> Hardened containerized bastion on RHEL 9.5 (SELinux Enforcing) and EBIOS RM risk matrix reporting.',
    'tl1.kpi1.val':'~35 s / target','tl1.kpi1.lbl':'Assessment speed',
    'tl1.kpi2.lbl':'Parallel mapping','tl1.stack':'Stack:',
    'tl2.tag':'PUBLIC ENTERPRISE',
    'tl2.title':'OTD — Office of State Lands',
    'tl2.role':'Intern Consultant — IS Security Audit, Active Directory & SOC',
    'tl2.b1':'<strong>Technical audit & CIS Benchmark compliance:</strong> Configuration audit on 30+ Cisco network devices and enterprise servers (Windows Server, RHEL) per CIS/ANSSI benchmarks; critical attack surface reduction.',
    'tl2.b2':'<strong>Active Directory audit & attack paths:</strong> Deep privilege mapping via PingCastle and BloodHound (abusive delegations, orphan accounts, Kerberos weaknesses) and Tiering Model / LAPS recommendations.',
    'tl2.b3':'<strong>SOC monitoring foundation:</strong> Pilot SIEM Wazuh probe deployment, suspicious authentication event correlation (Pass-the-Hash / brute-force) and report presentation with action plan to IT management.',
    'tl3.date':'2025 – Present','tl3.tag':'INDEPENDENT CONSULTING',
    'tl3.title':'Independent Cyber Audit & Advisory Missions',
    'tl3.role':'Independent Cybersecurity Audit Consultant / SME Projects',
    'tl3.b1':'Completed <strong>4 security and compliance audit missions</strong> for SMEs and startups: ISO 27001 pre-audits, Azure Cloud configuration reviews, Web penetration testing (OWASP Top 10).',
    'tl3.b2':'Facilitated executive-level reporting workshops for business leaders and CISOs.',
    'tl4.date':'2025 – Present','tl4.tag':'TEACHING & MENTORING',
    'tl4.title':'Technical Transmission & Pedagogical Leadership',
    'tl4.role':'Founder Python Express & GOMYCODE Instructor',
    'tl4.b1':'<strong>Python Express (Founder & Instructor):</strong> Leading a technical community of over <strong>100 learners</strong>; designing hands-on curricula in security tool automation, cyber lab design and personalized mentoring.',
    'tl4.b2':'<strong>GOMYCODE (Microsoft Azure Cloud & Automation Instructor):</strong> Teaching modules on Azure Cloud architecture, identity governance (Entra ID) and secure administration automation.',
    'tl5.date':'2021 – Present','tl5.tag':'ENGINEERING PROGRAM',
    'tl5.title':'Academic Education of Excellence',
    'tl5.b1':'<strong>TEK-UP School of Engineering (2024 – Present):</strong> Cybersecurity & Systems Engineering Degree (3rd year in progress).',
    'tl5.b2':'<strong>IPEIN Nabeul (2022 – 2024):</strong> Preparatory Classes for National Engineering Entrance Exams (Math & Physics - MP track).',
    'tl5.b3':'<strong>Bizerte High School (2021 – 2022):</strong> Scientific Baccalaureate (Mathematics Section, Highest Honors).',
    'skills.tag':'05 / 07 · ARSENAL',
    'skills.title':'Technical & <span class="accent">methodological</span> arsenal.',
    'skills.sub':'From high-level regulatory compliance to low-level detection and exploitation tools.',
    'skills.legend.cert':'Certified','skills.legend.proj':'Used in projects','skills.legend.notion':'Familiar',
    'skills.col1.title':'Audit, Risk & Regulation','skills.col1.sub':'From compliance to resilience.',
    'skills.col2.title':'SOC, Detection & Response','skills.col2.sub':'From signal to active response.',
    'skills.col3.title':'Offensive Security & Pentest','skills.col3.sub':'Think like the adversary.',
    'skills.col4.title':'Systems, Networks & Cloud','skills.col4.sub':'Hardened infrastructure & code.',
    'skills.seeMore1':'See more (+4)','skills.seeMore2':'See more (+4)',
    'skills.seeMore3':'See more (+4)','skills.seeMore4':'See more (+3)',
    'skills.deliverables':'Deliverables:',
    'skills.d1.1':'C-Level reporting','skills.d1.2':'EBIOS RM matrices','skills.d1.3':'ISMS audit reports',
    'skills.d2.1':'Incident playbooks','skills.d2.2':'SIEM dashboards','skills.d2.3':'Detection rules',
    'skills.d3.1':'Pentest reports','skills.d3.2':'Exploitation PoCs','skills.d3.3':'Remediation plans',
    'skills.d4.1':'Hardening blueprints','skills.d4.2':'Automation scripts','skills.d4.3':'Hardened containers',
    'terminal.tag':'06 / 07 · TERMINAL',
    'terminal.title':'Explore my profile via <span class="accent">command line</span>.',
    'terminal.sub':'No intrusive scan. No magic. Just my profile, interactive terminal edition.',
    'terminal.welcome':'Welcome to <strong>Yosri Hamdouni</strong>\u2019s interactive shell.',
    'terminal.hint':'Type <span class="cmd-pill">help</span> to display the command list or click the suggestions below:',
    'contact.tag':'07 / 07 · CONTACT',
    'contact.title':'A mission. <span class="accent">A new challenge</span>.',
    'contact.sub':'Looking for a 6-month PFE internship starting early 2027 as a Cybersecurity Consultant / Engineer. Full mobility in Tunisia and internationally.',
    'contact.phone.label':'PHONE & WHATSAPP',
    'contact.response':'Response within 48 h',
    'contact.form.name':'Your name & company',
    'contact.form.email':'Your email address',
    'contact.form.subject':'Opportunity subject',
    'contact.form.message':'Mission details',
    'contact.form.submit':'Send message \u2192',
    'contact.cv.title':'MY CV',
    'contact.cv.sub':'PDF · [N] page(s) · updated November 2026',
    'contact.cv.btn':'Download my CV (PDF)',
    'footer.copy':'· Cybersecurity Engineer & Consultant © 2026',
    'footer.top':'BACK TO TOP',
  },
};

// Placeholder translations for form inputs
const placeholders = {
  fr: {
    'contact.form.name.ph':'Ex: Jean Dupont (RSSI / Talent Partner)',
    'contact.form.email.ph':'nom@entreprise.com',
    'contact.form.subject.ph':'Stage PFE 2027 / Mission d\u2019Audit',
    'contact.form.message.ph':'Bonjour Yosri, votre profil a retenu notre attention concernant un rôle en...',
  },
  en: {
    'contact.form.name.ph':'E.g.: John Smith (CISO / Talent Partner)',
    'contact.form.email.ph':'name@company.com',
    'contact.form.subject.ph':'PFE Internship 2027 / Audit Mission',
    'contact.form.message.ph':'Hello Yosri, your profile caught our attention regarding a role in...',
  },
};

let currentLang = 'fr';
const langToggle = document.getElementById('langToggle');

function applyTranslations() {
  const dict = translations[currentLang];
  if (!dict) return;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (dict[key] != null) {
      // Use innerHTML for keys that contain HTML tags
      if (dict[key].includes('<') || dict[key].includes('&')) {
        el.innerHTML = dict[key];
      } else {
        el.textContent = dict[key];
      }
    }
  });

  // Handle placeholders
  const ph = placeholders[currentLang];
  if (ph) {
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const key = el.dataset.i18nPh;
      if (ph[key] != null) el.placeholder = ph[key];
    });
  }

  // Update radar canvas labels if initialized
  if (window.renderRadarChart) {
    window.renderRadarChart();
  }
}

function setLanguage(lang) {
  currentLang = lang === 'en' ? 'en' : 'fr';
  document.body.dataset.lang = currentLang;
  document.documentElement.lang = currentLang;
  try { localStorage.setItem('user_lang', currentLang); } catch(e) {}
  const ind = langToggle?.querySelector('.lang-indicator');
  if (ind) ind.textContent = currentLang === 'fr' ? 'EN' : 'FR';
  applyTranslations();
}

if (langToggle) {
  langToggle.addEventListener('click', () => {
    const nextLang = currentLang === 'fr' ? 'en' : 'fr';
    playTone(900, 'sine', 0.08);
    setLanguage(nextLang);
  });
}

// Restore saved language on load
try {
  const urlParamLang = new URLSearchParams(window.location.search).get('lang');
  const savedLang = urlParamLang || localStorage.getItem('user_lang');
  if (savedLang === 'en') {
    setLanguage('en');
  }
} catch(e) {}

/* ═══════════════════════════════════════════════════════════
   11. FLOATING SCROLL PROGRESS & ACTIVE NAV
═══════════════════════════════════════════════════════════ */
const progressBar = document.createElement('div');
progressBar.id = 'scroll-progress';
document.body.appendChild(progressBar);

window.addEventListener('scroll', () => {
  const totalH = document.documentElement.scrollHeight - window.innerHeight;
  const scrolled = totalH > 0 ? (window.scrollY / totalH) * 100 : 0;
  progressBar.style.height = `${scrolled}%`;
});

// Robust Scroll-Spy using IntersectionObserver with rootMargin "-40% 0px -55% 0px"
const allNavLinks = document.querySelectorAll('.nav-links a, .mobile-menu a');
const spySectionIds = ['hero', 'profil', 'certs', 'projets', 'parcours', 'arsenal', 'terminal', 'contact'];
const spySections = spySectionIds
  .map(id => document.getElementById(id))
  .filter(Boolean);

let activeSectionId = null;

function setActiveNav(id) {
  if (activeSectionId === id) return;
  activeSectionId = id;

  allNavLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    const isMatch = href === `#${id}`;
    link.classList.toggle('active', isMatch);
    if (isMatch) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  }
  );
}

// Highlight Accueil when scrolled to top
window.addEventListener('scroll', () => {
  if (window.scrollY < 200) {
    setActiveNav('hero');
  }
}, { passive: true });

const spyObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      setActiveNav(entry.target.id);
    }
  }
  );
}, {
  root: null,
  rootMargin: '-40% 0px -55% 0px',
  threshold: 0
});

spySections.forEach(sec => spyObserver.observe(sec));

/* ═══════════════════════════════════════════════════════════
   12. CONTACT FORM DISPATCHER & SPAM PROTECTION
═══════════════════════════════════════════════════════════ */
const contactForm = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');

// Anti-scraping dynamic email assembly
const emailLink = document.getElementById('emailLink');
const emailVal = document.getElementById('emailVal');
if (emailLink && emailVal) {
  const u = emailLink.dataset.user || 'yosri.hamdouni.cyber';
  const d = emailLink.dataset.domain || 'gmail.com';
  const fullEmail = `${u}@${d}`;
  emailLink.href = `mailto:${fullEmail}`;
  emailVal.textContent = fullEmail;
}

if (contactForm) {
  contactForm.addEventListener('submit', async e => {
    e.preventDefault();

    // Check Honeypot
    const honeypot = contactForm.querySelector('input[name="_gotcha"]');
    if (honeypot && honeypot.value.trim() !== '') {
      // Spam bot detected - pretend success and exit silently
      if (formStatus) {
        formStatus.className = 'form-status success';
        formStatus.textContent = '[✓] Message envoyé avec succès.';
      }
      contactForm.reset();
      return;
    }

    const nameInput = document.getElementById('cName');
    const emailInput = document.getElementById('cEmail');
    const subjectInput = document.getElementById('cSubject');
    const messageInput = document.getElementById('cMessage');

    // Basic Validation
    if (!nameInput?.value.trim() || !emailInput?.value.trim() || !messageInput?.value.trim()) {
      if (formStatus) {
        formStatus.className = 'form-status error';
        formStatus.textContent = '[!] Erreur : veuillez renseigner tous les champs requis.';
      }
      playTone(450, 'sawtooth', 0.1);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value.trim())) {
      if (formStatus) {
        formStatus.className = 'form-status error';
        formStatus.textContent = '[!] Erreur : adresse email invalide.';
      }
      playTone(450, 'sawtooth', 0.1);
      return;
    }

    const btn = document.getElementById('btnSubmitForm');
    const originalText = btn.innerHTML;
    const txtLoading = currentLang === 'en' ? 'Sending in progress…' : 'Envoi en cours…';
    btn.innerHTML = `<span class="btn-text">${txtLoading}</span>`;
    btn.disabled = true;

    if (formStatus) {
      formStatus.className = 'form-status loading';
      formStatus.textContent = currentLang === 'en' ? '[*] Encrypting payload and dispatching...' : '[*] Chiffrement du paquet et acheminement vers le relais...';
    }

    try {
      if (contactForm.action.includes('YOUR_FORM_ID')) {
        // Mock simulated delay if formspree ID is demo
        await new Promise(resolve => setTimeout(resolve, 850));
      } else {
        const formData = new FormData(contactForm);
        await fetch(contactForm.action, {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        });
      }

      playTone(1200, 'sine', 0.15);
      const txtSuccess = currentLang === 'en' ? 'Message sent ✓' : 'Message envoyé ✓';
      btn.innerHTML = `<span class="btn-text" style="color: #020409;">${txtSuccess}</span>`;
      btn.style.background = '#00ff88';

      if (formStatus) {
        formStatus.className = 'form-status success';
        formStatus.textContent = currentLang === 'en' ? '[✓] Message sent. Response within 48 business hours.' : '[✓] Message expédié. Réponse garantie sous 48 h ouvrées.';
      }

      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
        btn.style.background = '';
        contactForm.reset();
        if (formStatus) formStatus.textContent = '';
      }, 4500);

    } catch (err) {
      playTone(350, 'sawtooth', 0.2);
      const txtError = currentLang === 'en' ? 'Sending failed, try again' : 'Échec de l\'envoi, réessayer';
      btn.innerHTML = `<span class="btn-text">${txtError}</span>`;
      btn.disabled = false;
      if (formStatus) {
        formStatus.className = 'form-status error';
        formStatus.textContent = currentLang === 'en' ? '[!] Transmission failed. Please use direct email.' : '[!] Échec de transmission. Veuillez utiliser l\'email direct.';
      }
    }
  }
  );
}
