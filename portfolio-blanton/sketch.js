/**
 * LSD-inspired P5.js background
 * Morphing blobs, particles, waves, rainbow palette, mouse-reactive
 */

let particles = [];
let blobs = [];
let satellites = []; // now used as orbiting planets
let time = 0;
let smoothMouseX = 0, smoothMouseY = 0;

const PALETTE = [
  [255, 0, 110],   // #ff006e
  [131, 56, 236],  // #8338ec
  [58, 134, 255],  // #3a86ff
  [6, 214, 160],   // #06d6a0
  [255, 190, 11],  // #ffbe0b
  [251, 86, 7],    // #fb5607
];

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('p5-canvas');
  colorMode(HSB, 360, 100, 100, 1);
  noStroke();
  smoothMouseX = width / 2;
  smoothMouseY = height / 2;

  // Particles
  for (let i = 0; i < 80; i++) {
    particles.push({
      x: random(width),
      y: random(height),
      r: random(1, 4),
      speed: random(0.2, 1.2),
      hue: random(360),
      drift: random(-0.5, 0.5),
    });
  }

  // Morphing blobs (soft organic shapes)
  for (let i = 0; i < 5; i++) {
    blobs.push({
      baseX: random(width),
      baseY: random(height),
      radius: random(120, 280),
      points: 12 + floor(random(8)),
      phase: random(TWO_PI),
      hueOffset: (i / 5) * 60,
      alpha: random(0.03, 0.08),
    });
  }

  // Planets orbiting like a miniature solar system
  for (let i = 0; i < 5; i++) {
    satellites.push({
      cx: width / 2 + random(-220, 220),
      cy: height / 2 + random(-140, 120),
      radius: random(90, 220),
      angle: random(TWO_PI),
      speed: random(0.004, 0.012),
      planetRadius: random(22, 48),
      rotation: random(TWO_PI),
      rotationSpeed: random(0.01, 0.03),
      hueOffset: random(360),
    });
  }
}

function draw() {
  time += 0.008;
  smoothMouseX += (mouseX - smoothMouseX) * 0.03;
  smoothMouseY += (mouseY - smoothMouseY) * 0.03;

  const audio = window.audioReactive || { level: 0, bands: [] };
  const level = audio.level || 0;

  // Dark base with slight fade for trails (reacts to audio)
  background(10, 10, 18, 0.10 + level * 0.08);

  const t = time;
  const mx = smoothMouseX;
  const my = smoothMouseY;

  // 0) Sci‑fi horizon grid and Earth limb
  drawHorizonGrid(t);
  drawEarthLimb(t);

  // 1) Large morphing blobs
  for (const b of blobs) {
    const hue = ((t * 20 + b.hueOffset) % 360 + 360) % 360;
    fill(hue, 70, 95, b.alpha);
    drawMorphBlob(
      b.baseX + sin(t + b.phase) * 80 + (mx - width / 2) * 0.03,
      b.baseY + cos(t * 0.7 + b.phase) * 60 + (my - height / 2) * 0.03,
      b.radius + sin(t * 2 + b.phase) * 40,
      b.points,
      t + b.phase
    );
  }

  // 1.5) Orbits and satellites (aerospace feel)
  drawOrbits(t);

  // 2) Flowing wave ribbons (sine waves)
  drawWaveRibbons(t);

  // 3) Particle field
  for (const p of particles) {
    p.hue = (p.hue + 0.5) % 360;
    fill(p.hue, 80, 100, 0.6);
    const nx = p.x + sin(t + p.x * 0.01) * 2 + p.drift;
    const ny = p.y - p.speed + cos(t * 0.5 + p.y * 0.01) * 2;
    circle(nx, ny, p.r * 2);
    p.x = nx;
    p.y = ny;
    if (p.y < -10) p.y = height + 10;
    if (p.y > height + 10) p.y = -10;
    if (p.x < -10) p.x = width + 10;
    if (p.x > width + 10) p.x = -10;
  }

  // 4) Central radial glow (breathing, follows mouse)
  const breath = 0.5 + 0.5 * sin(t * 2);
  const cx = width / 2 + (mx - width / 2) * 0.15;
  const cy = height / 2 + (my - height / 2) * 0.15;
  for (let i = 3; i >= 0; i--) {
    const r = 150 + breath * 120 + i * 80;
    fill(280, 50, 30, 0.03 - i * 0.006);
    circle(cx, cy, r * 2);
  }
}

function drawMorphBlob(cx, cy, baseR, n, t) {
  const audio = window.audioReactive || { level: 0 };
  const level = audio.level || 0;
  const jitterScale = 1 + level * 0.4;

  beginShape();
  for (let i = 0; i <= n; i++) {
    const angle = (i / n) * TWO_PI;
    const r =
      baseR +
      (sin(t * 3 + angle * 2) * 30 + cos(t * 2 + angle) * 20) * jitterScale;
    vertex(cx + cos(angle) * r, cy + sin(angle) * r);
  }
  endShape(CLOSE);
}

function drawWaveRibbons(t) {
  const audio = window.audioReactive || { level: 0, bands: [] };
  const level = audio.level || 0;

  for (let band = 0; band < 4; band++) {
    const hue = ((t * 25 + band * 90) % 360 + 360) % 360;
    const yBase = (height / 5) * (band + 1) + sin(t + band) * 30;
    const amp = 40 + sin(t * 2 + band) * 20 + level * 45;
    const freq = 0.015 + band * 0.002;
    noFill();
    stroke(hue, 70, 90, 0.15);
    strokeWeight(2);
    beginShape();
    for (let x = -50; x < width + 50; x += 8) {
      const y = yBase + sin(x * freq + t * 2 + band) * amp + cos(x * freq * 0.7 + t) * (amp * 0.5);
      vertex(x, y);
    }
    endShape();
  }
  noStroke();
}

function drawOrbits(t) {
  const audio = window.audioReactive || { level: 0, bands: [] };
  const level = audio.level || 0;
  const speedFactor = 1 + level * 2;

  strokeWeight(1.5);
  for (const s of satellites) {
    const hue = ((t * 40 + s.hueOffset) % 360 + 360) % 360;

    // Orbit path
    stroke(hue, 40, 60, 0.22 + level * 0.2);
    noFill();
    const wobble = 1 + 0.06 * sin(t * 2 + s.hueOffset);
    ellipse(s.cx, s.cy, s.radius * 2 * wobble, s.radius * 2 / wobble);

    // Planet position along orbit
    s.angle += s.speed * speedFactor;
    const sx = s.cx + cos(s.angle) * s.radius;
    const sy = s.cy + sin(s.angle) * s.radius;

    // Update planet rotation
    s.rotation += s.rotationSpeed * speedFactor;

    // Connection line to orbit center (trajectory indicator)
    stroke(hue, 50, 70, 0.3);
    line(s.cx, s.cy, sx, sy);

    // 3D‑ish rotating planet: lit hemisphere + shadow and bands
    noStroke();
    push();
    translate(sx, sy);

    const rBase = s.planetRadius * (1 + level * 0.25);
    const lightHue = hue;
    const shadowHue = (hue + 210) % 360;

    // Core sphere glow
    for (let i = 0; i < 3; i++) {
      fill(lightHue, 70, 90 - i * 10, 0.12 - i * 0.03 + level * 0.05);
      circle(0, 0, (rBase + 18 + i * 10) * 2);
    }

    // Lit side
    fill(lightHue, 70, 95, 1);
    circle(0, 0, rBase * 2);

    // Shadow side (terminator) rotating around
    push();
    rotate(s.rotation + HALF_PI);
    fill(shadowHue, 40, 20, 0.7);
    arc(0, 0, rBase * 2, rBase * 2, 0, PI);
    pop();

    // Equatorial bands / rings for depth
    stroke(lightHue, 40, 100, 0.6);
    strokeWeight(1.2);
    noFill();
    push();
    rotate(s.rotation * 0.8);
    const bandCount = 3;
    for (let i = 0; i < bandCount; i++) {
      const offset = map(i, 0, bandCount - 1, -rBase * 0.35, rBase * 0.35);
      ellipse(0, offset, rBase * 1.9, rBase * 0.45);
    }
    pop();

    pop();
  }
  noStroke();
}

function drawHorizonGrid(t) {
  const audio = window.audioReactive || { level: 0, bands: [] };
  const level = audio.level || 0;
  const horizon = height * 0.7;
  stroke(210, 20 + level * 40, 35 + level * 40, 0.16 + level * 0.15);
  strokeWeight(1);

  // Horizontal grid lines (perspective)
  for (let i = 0; i < 10; i++) {
    const f = i / 10;
    const y = lerp(horizon, height + 120, f * f);
    line(0, y, width, y);
  }

  // Vertical converging lines toward bottom center
  const centerX = width / 2;
  const bottomY = height + 150;
  const speed = 60 + level * 140;
  for (let x = -width; x <= width * 2; x += 80) {
    const offset = (t * speed) % 80;
    const startX = x + offset;
    line(startX, horizon, centerX, bottomY);
  }

  noStroke();
}

function drawEarthLimb(t) {
  const audio = window.audioReactive || { level: 0, bands: [] };
  const level = audio.level || 0;

  noStroke();
  const radius = height * 1.4;
  const cx = width / 2 + sin(t * 0.2) * 40;
  const cy = height * 1.3;
  const baseHue = 210; // deep blue earth glow

  for (let i = 0; i < 4; i++) {
    fill(
      baseHue,
      80,
      50 - i * 8 + level * 20,
      0.20 - i * 0.03 + level * 0.08
    );
    circle(cx, cy, radius * 2 + i * 40);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
