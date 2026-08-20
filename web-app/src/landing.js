// ═════════════════════════════════════════════════════════════════════════
// 🌌 VITALTRACK THREE.JS 3D SCENE & INTERACTIVE SHOWCASE CONTROLLER
// ═════════════════════════════════════════════════════════════════════════

import * as THREE from 'three';

// ═════════════════════════════════════════════════════════════════════════
// 1. THREE.JS 3D BIO-ELECTRIC HELIX & VITAL PARTICLES SPHERE
// ═════════════════════════════════════════════════════════════════════════

let scene, camera, renderer, particles, particleGeometry, particleMaterial;
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;
const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

function initThreeScene() {
  const canvas = document.getElementById('bg3dCanvas');
  if (!canvas) return;

  // Scene & Camera
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
  camera.position.z = 700;

  // Renderer with antialias & transparent background
  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Generate 1800 Bio-Electric Luminous Particles
  const particleCount = 1800;
  particleGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  const colorPalette = [
    new THREE.Color('#34d399'), // Emerald Vitality
    new THREE.Color('#10b981'), // Chlorophyll Green
    new THREE.Color('#059669'), // Deep Vitalist
    new THREE.Color('#38bdf8'), // Soft Hydration Cyan
    new THREE.Color('#f8fafc')  // Pure Photon White
  ];

  for (let i = 0; i < particleCount; i++) {
    // Spherical Fibonacci & Double Helix distribution
    const phi = Math.acos(-1 + (2 * i) / particleCount);
    const theta = Math.sqrt(particleCount * Math.PI) * phi;
    const radius = 280 + (Math.sin(i * 0.2) * 50) + (Math.random() * 40);

    const x = radius * Math.cos(theta) * Math.sin(phi);
    const y = radius * Math.sin(theta) * Math.sin(phi);
    const z = radius * Math.cos(phi);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // Harmonious Color Gradient
    const col = colorPalette[i % colorPalette.length];
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  // Custom Glowing Point Texture via Canvas 2D
  const pointTexture = createPointGlowTexture();

  particleMaterial = new THREE.PointsMaterial({
    size: 6.5,
    map: pointTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  // Mouse Interactivity
  window.addEventListener('mousemove', onMouseMove, { passive: true });
  window.addEventListener('resize', onWindowResize, { passive: true });

  animateThree();
}

function createPointGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.25, 'rgba(52, 211, 153, 0.8)');
  gradient.addColorStop(0.6, 'rgba(56, 189, 248, 0.25)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  return new THREE.CanvasTexture(canvas);
}

function onMouseMove(event) {
  mouseX = (event.clientX - windowHalfX) * 0.4;
  mouseY = (event.clientY - windowHalfY) * 0.4;
}

function onWindowResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

let clock = new THREE.Clock();

function animateThree() {
  requestAnimationFrame(animateThree);

  const elapsedTime = clock.getElapsedTime();

  // Smooth mouse inertia
  targetX += (mouseX - targetX) * 0.05;
  targetY += (mouseY - targetY) * 0.05;

  if (particles) {
    // Orbital rotation
    particles.rotation.y = elapsedTime * 0.08 + targetX * 0.0008;
    particles.rotation.x = Math.sin(elapsedTime * 0.05) * 0.15 + targetY * 0.0008;

    // Pranic Breathing pulse wave
    const scale = 1 + Math.sin(elapsedTime * 0.8) * 0.06;
    particles.scale.set(scale, scale, scale);

    // Scroll parallax
    const scrollY = window.scrollY || 0;
    particles.position.y = -scrollY * 0.25;
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// ═════════════════════════════════════════════════════════════════════════
// 2. INTERACTIVE FEATURE VIDEO SHOWCASE SWITCHER
// ═════════════════════════════════════════════════════════════════════════

const FEATURE_DATA = {
  presentation: {
    tag: "Présentation Officielle • Voix Ariane",
    badgeSub: "Démo Complète 1080p Full HD",
    title: "Présentation Complète de VitalTrack de Bout en Bout",
    desc: "Découvrez en 1 minute comment VitalTrack révolutionne votre santé cellulaire : du tableau de bord au coach vocal IA sans quota, en passant par le calendrier cockpit 14 jours et le scanner biochimique PRAL.",
    bullets: [
      "<strong>Vue Panoramique :</strong> Démonstration fluide et commentée de toutes les fonctionnalités majeures de l'application.",
      "<strong>Voix Studio Ariane :</strong> Explication claire, humaine et posée des concepts vitalistes et de l'équilibre cellulaire.",
      "<strong>Expérience 100% Réelle :</strong> Zéro artifice, capture directe des composants de l'application en conditions réelles."
    ],
    videoMp4: "/videos/vitaltrack_presentation.mp4",
    videoWebm: "/videos/vitaltrack_presentation.mp4"
  },
  voice: {
    tag: "Intelligence Artificielle & Voix",
    badgeSub: "Gemini 3.7 Flash + Web Speech",
    title: "Coach IA Vitaliste & Dictée Vocale Streaming",
    desc: "Parlez naturellement à votre coach. Le texte est transcrit en direct dans le champ de saisie sans temps d'attente et sans consommer votre quota d'API. L'IA analyse votre terrain et génère automatiquement des protocoles complets avec des cartes d'action interactives.",
    bullets: [
      "<strong>Zero-Quota Voice :</strong> Dictée vocale native avec indicateur d'ondes sonores en temps réel.",
      "<strong>RAG Vitaliste :</strong> Réponses fondées sur les écrits authentiques des docteurs Sebi, Ehret et Morse.",
      "<strong>Cartes d'Action 1-Clic :</strong> Application immédiate du protocole généré dans votre calendrier de repas."
    ],
    videoMp4: "/videos/features/feature_voice_ai_chat.mp4",
    videoWebm: "/videos/features/feature_voice_ai_chat.webm"
  },
  scan: {
    tag: "Vision Multimodale & Bio-Chimie",
    badgeSub: "PRAL Rénal + NOVA + Ehret",
    title: "Scanner Visuel & Radiographie d'Assiette IA",
    desc: "Prenez en photo votre repas : l'IA identifie les ingrédients vivants ou transformés, calcule instantanément la charge rénale PRAL (+/- mEq/100g) et vous donne les clés pour 'électriser' votre assiette.",
    bullets: [
      "<strong>Classification NOVA & Mucogène :</strong> Détection des colles intestinales et des aliments sans résidus.",
      "<strong>Indice PRAL Visuel :</strong> Jauge colorimétrique temps réel (Alcalinisant vs Acidifiant).",
      "<strong>Substituts Vivants :</strong> Suggestions d'ingrédients sauvages pour booster la vitalité photonique."
    ],
    videoMp4: "/videos/features/feature_scanner_diagnostic.mp4",
    videoWebm: "/videos/features/feature_scanner_diagnostic.webm"
  },
  calendar: {
    tag: "Cockpit Quotidien & Nutrition",
    badgeSub: "Bandeau 14 Jours + Fusion",
    title: "Calendrier Cockpit & Validation Tactile des Repas",
    desc: "Suivez votre programme nutritionnel sur 14 jours glissants. Validez chaque repas au fil de la journée pour voir votre jauge de progression s'illuminer en vert émeraude.",
    bullets: [
      "<strong>Bandeau 14 Jours :</strong> Vue panoramique de vos repas complétés (ex: 5/5 ✓).",
      "<strong>Fusion Intelligente :</strong> Combinez sans friction un nouveau protocole IA avec vos repas déjà enregistrés.",
      "<strong>Progression Circulaire :</strong> Anneau de complétion dynamique pour rester motivé."
    ],
    videoMp4: "/videos/features/feature_calendar_cockpit.mp4",
    videoWebm: "/videos/features/feature_calendar_cockpit.webm"
  },
  fasting: {
    tag: "Physiologie & Régénération",
    badgeSub: "16:8 • 20:4 • 24h • Ramadan",
    title: "Traqueur de Jeûne & Paliers d'Autophagie Cellulaire",
    desc: "Chronométrez vos fenêtres de jeûne intermittent et suivez en direct la bascule métabolique de votre corps : de la digestion à la cétose puis au recyclage autophagique des cellules sénescentes.",
    bullets: [
      "<strong>6 Paliers Physiologiques :</strong> Digestion, Chute d'Insuline, Cétose, Autophagie, Pic d'Hormone de Croissance.",
      "<strong>Anneau de Progression Pulsant :</strong> Visualisation immédiate du temps restant.",
      "<strong>Historique & Statistiques :</strong> Suivi de vos records de jeûne au fil des semaines."
    ],
    videoMp4: "/videos/features/feature_fasting_autophagy.mp4",
    videoWebm: "/videos/features/feature_fasting_autophagy.webm"
  },
  breathing: {
    tag: "Biohacking & Prānāyāma",
    badgeSub: "Wim Hof • Box • 4-7-8",
    title: "Studio de Respiration Prānique & Rétention",
    desc: "Bénéficiez de sessions guidées immersives inspirées de la méthode Wim Hof pour alcaliniser instantanément votre sang, apaiser le système nerveux et stimuler l'oxygénation cellulaire.",
    bullets: [
      "<strong>Cycle 3 à 5 Tours :</strong> 30 respirations profondes rythmées, rétention poumons vides, inspiration de récupération.",
      "<strong>Guidage Visuel & Audio :</strong> Sphère de souffle interactive et chronomètre de rétention.",
      "<strong>Modes Spécialisés :</strong> Cohérence cardiaque 5.5s et Box Breathing 4-4-4-4."
    ],
    videoMp4: "/videos/features/feature_breathing_studio.mp4",
    videoWebm: "/videos/features/feature_breathing_studio.webm"
  }
};

function initVideoShowcase() {
  const tabs = document.querySelectorAll('.video-tab-btn');
  const videoPlayer = document.getElementById('showcaseVideoPlayer');
  const playPauseBtn = document.getElementById('videoPlayPauseBtn');
  const muteBtn = document.getElementById('videoMuteBtn');
  const infoCard = document.getElementById('featureInfoCard');

  if (!tabs.length || !videoPlayer || !infoCard) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const featureKey = tab.getAttribute('data-feature');
      const data = FEATURE_DATA[featureKey];
      if (!data) return;

      // Update Video Player Source
      videoPlayer.pause();
      videoPlayer.innerHTML = `
        <source src="${data.videoMp4}" type="video/mp4">
        <source src="${data.videoWebm}" type="video/webm">
      `;
      videoPlayer.load();
      videoPlayer.play().catch(() => {});

      if (playPauseBtn) {
        playPauseBtn.innerHTML = '<i class="ri-pause-line"></i>';
      }

      // Update Info Content with Smooth Transition
      infoCard.style.opacity = '0';
      infoCard.style.transform = 'translateY(10px)';
      infoCard.style.transition = 'all 0.2s ease';

      setTimeout(() => {
        infoCard.innerHTML = `
          <div class="feature-meta">
            <span class="feature-tag">${data.tag}</span>
            <span class="feature-badge-sub">${data.badgeSub}</span>
          </div>
          <h3 class="feature-title">${data.title}</h3>
          <p class="feature-desc">${data.desc}</p>
          <ul class="feature-bullet-list">
            ${data.bullets.map(b => `<li><i class="ri-checkbox-circle-fill"></i> <div>${b}</div></li>`).join('')}
          </ul>
          <div class="feature-action-row">
            <a href="/" class="btn-feature-try">
              <span>Tester dans l'App</span>
              <i class="ri-arrow-right-line"></i>
            </a>
          </div>
        `;
        infoCard.style.opacity = '1';
        infoCard.style.transform = 'translateY(0)';
      }, 200);
    });
  });

  // Play/Pause button
  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', () => {
      if (videoPlayer.paused) {
        videoPlayer.play();
        playPauseBtn.innerHTML = '<i class="ri-pause-line"></i>';
      } else {
        videoPlayer.pause();
        playPauseBtn.innerHTML = '<i class="ri-play-line"></i>';
      }
    });
  }

  // Mute/Unmute button
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      videoPlayer.muted = !videoPlayer.muted;
      if (videoPlayer.muted) {
        muteBtn.innerHTML = '<i class="ri-volume-mute-line"></i>';
        muteBtn.title = "Activer le son (Voix Ariane)";
      } else {
        muteBtn.innerHTML = '<i class="ri-volume-up-line"></i>';
        muteBtn.title = "Couper le son";
      }
    });
  }
}

// ═════════════════════════════════════════════════════════════════════════
// 3. INTERACTIVE BIO-VITALITY SIMULATOR
// ═════════════════════════════════════════════════════════════════════════

function initSimulator() {
  const steps = [
    document.getElementById('simStep1'),
    document.getElementById('simStep2'),
    document.getElementById('simStep3')
  ];
  const scoreVal = document.getElementById('simScoreVal');
  const resultTitle = document.getElementById('simResultTitle');
  const resultDesc = document.getElementById('simResultDesc');

  if (!scoreVal || !resultTitle || !resultDesc) return;

  function calculateScore() {
    let total = 0;
    steps.forEach(step => {
      if (!step) return;
      const activeBtn = step.querySelector('.sim-opt-btn.active');
      if (activeBtn) {
        total += parseInt(activeBtn.getAttribute('data-score') || '50', 10);
      }
    });

    const average = Math.round(total / 3);
    scoreVal.textContent = average;

    if (average >= 80) {
      resultTitle.textContent = "⚡ Terrain Électrique & Haute Vitalité !";
      resultDesc.textContent = "Votre niveau d'obstruction mucique est faible. Vous bénéficierez d'un protocole avancé d'aliments vivants et de jeûne rationalisé pour maintenir ce niveau photonique.";
    } else if (average >= 50) {
      resultTitle.textContent = "🌿 Phase de Transition Idéale";
      resultDesc.textContent = "Votre corps présente une charge digestive modérée. Le protocole de transition d'Arnold Ehret et l'électrisation progressive de vos repas vous permettront de décupler votre énergie.";
    } else {
      resultTitle.textContent = "🔥 Éteindre le Feu Digestif & Détox Douce";
      resultDesc.textContent = "Votre organisme est sollicité par des aliments mucogènes et des toxines acides. Le Coach IA VitalTrack vous guidera pas à pas pour amorcer un balai intestinal sans crise brutale.";
    }
  }

  document.querySelectorAll('.sim-opt-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const parent = btn.closest('.sim-options');
      if (parent) {
        parent.querySelectorAll('.sim-opt-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        calculateScore();
      }
    });
  });

  calculateScore();
}

// ═════════════════════════════════════════════════════════════════════════
// 4. INITIALIZATION ON DOM CONTENT LOADED
// ═════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  initThreeScene();
  initVideoShowcase();
  initSimulator();
});
