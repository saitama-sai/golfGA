import type { Vehicle } from '../ga/Vehicle';
import type { Obstacle } from '../ga/Obstacle';
import { Vector2D } from '../ga/Vector2D';

/**
 * Golf Sahası Canvas Render Motoru
 * Top-down golf sahası görünümü: çim zemin, kum bunkerleri, su tehlikeleri, ağaçlar
 */

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  vehicles: Vehicle[],
  obstacles: Obstacle[],
  target: Vector2D,
  startPos: Vector2D,
  _generation: number,
  showSonar: boolean,
  showTrails: boolean,
  bestVehicleIndex: number,
  frameCount: number
): void {
  const w = canvas.width;
  const h = canvas.height;

  // --- Çim zemin ---
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, '#1a5c2a');
  bgGrad.addColorStop(0.5, '#1b6b30');
  bgGrad.addColorStop(1, '#175224');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Çim çizgileri (fairway şeritleri)
  ctx.globalAlpha = 0.06;
  for (let y = 0; y < h; y += 30) {
    ctx.fillStyle = (Math.floor(y / 30) % 2 === 0) ? '#2d8a45' : '#1a5c2a';
    ctx.fillRect(0, y, w, 30);
  }
  ctx.globalAlpha = 1;

  // Çim doku noktaları
  ctx.fillStyle = 'rgba(100, 200, 100, 0.04)';
  for (let i = 0; i < 80; i++) {
    const gx = (i * 137.5 + frameCount * 0.01) % w;
    const gy = (i * 97.3) % h;
    ctx.fillRect(gx, gy, 1, 2);
  }

  // --- Fairway yolu (başlangıçtan hedefe) ---
  ctx.fillStyle = 'rgba(40, 160, 70, 0.12)';
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2, 120, h * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  // --- Tee (başlangıç) bölgesi ---
  ctx.fillStyle = 'rgba(180, 140, 100, 0.25)';
  ctx.beginPath();
  ctx.ellipse(startPos.x, startPos.y, 30, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '600 9px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('TEE', startPos.x, startPos.y + 4);

  // --- Engeller ---
  for (const obs of obstacles) {
    if (obs.type === 'bunker') drawBunker(ctx, obs.position, obs.radius);
    else if (obs.type === 'water') drawWater(ctx, obs.position, obs.radius, frameCount);
    else if (obs.type === 'tree') drawTree(ctx, obs.position, obs.radius);
    else if (obs.type === 'wall') drawWall(ctx, obs.position, obs.radius);
    else drawCustomObs(ctx, obs.position, obs.radius);
  }

  // --- Rota izleri ---
  if (showTrails) {
    for (let i = 0; i < vehicles.length; i++) {
      const v = vehicles[i];
      if (v.trail.length < 2) continue;
      const isBest = i === bestVehicleIndex;
      ctx.strokeStyle = isBest ? 'rgba(255, 215, 0, 0.35)' : 'rgba(255,255,255,0.06)';
      ctx.lineWidth = isBest ? 2 : 0.8;
      ctx.beginPath();
      ctx.moveTo(v.trail[0].x, v.trail[0].y);
      for (let j = 1; j < v.trail.length; j++) ctx.lineTo(v.trail[j].x, v.trail[j].y);
      ctx.stroke();
    }
  }

  // --- Sonar (en iyi top) ---
  if (showSonar && bestVehicleIndex >= 0 && bestVehicleIndex < vehicles.length) {
    const best = vehicles[bestVehicleIndex];
    if (!best.crashed && !best.reachedTarget && best.sonarReadings.length > 0) {
      const dirs = best.sonarReadings.length;
      for (let i = 0; i < dirs; i++) {
        const angle = (i / dirs) * Math.PI * 2 + best.velocity.angle();
        const range = best.sonarReadings[i] * 80;
        const ex = best.position.x + Math.cos(angle) * range;
        const ey = best.position.y + Math.sin(angle) * range;
        const grad = ctx.createLinearGradient(best.position.x, best.position.y, ex, ey);
        grad.addColorStop(0, 'rgba(255,255,255,0.25)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(best.position.x, best.position.y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      }
    }
  }

  // --- Golf topları ---
  for (let i = 0; i < vehicles.length; i++) {
    drawBall(ctx, vehicles[i], i === bestVehicleIndex, frameCount);
  }

  // --- Hedef (golf deliği + bayrak) ---
  drawHole(ctx, target, frameCount);

  // --- HUD ---
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '600 11px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`JEN: ${_generation}`, 12, 20);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillText(`ADIM: ${vehicles[0]?.step ?? 0}`, 12, 36);
}

/* ========== GOLF BALL ========== */
function drawBall(ctx: CanvasRenderingContext2D, v: Vehicle, isBest: boolean, fc: number): void {
  const x = v.position.x, y = v.position.y;

  if (v.crashed) {
    // Bunker'a düşen top
    ctx.fillStyle = 'rgba(200,180,150,0.4)';
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    return;
  }

  if (v.reachedTarget) {
    // Deliğe giren top — yeşil parıltı
    ctx.globalAlpha = 0.5 + Math.sin(fc * 0.1) * 0.2;
    ctx.fillStyle = '#4ade80';
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    return;
  }

  const r = isBest ? 5 : 3;

  if (isBest) {
    // Altın glow
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 10;
  }

  // Top gövdesi (beyaz gradient)
  const grad = ctx.createRadialGradient(x - r * 0.25, y - r * 0.25, 0, x, y, r);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.7, '#e8e8e8');
  grad.addColorStop(1, '#c0c0c0');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();

  // Dimple efekti (en iyi top)
  if (isBest) {
    ctx.fillStyle = 'rgba(180,180,180,0.3)';
    ctx.beginPath(); ctx.arc(x + 1, y + 1, 1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x - 1, y - 0.5, 0.8, 0, Math.PI * 2); ctx.fill();
  }

  ctx.shadowBlur = 0;
}

/* ========== GOLF HOLE + FLAG ========== */
function drawHole(ctx: CanvasRenderingContext2D, t: Vector2D, fc: number): void {
  // Green (putting yüzeyi)
  const greenGrad = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, 40);
  greenGrad.addColorStop(0, 'rgba(60, 200, 80, 0.25)');
  greenGrad.addColorStop(1, 'rgba(60, 200, 80, 0)');
  ctx.fillStyle = greenGrad;
  ctx.beginPath(); ctx.arc(t.x, t.y, 40, 0, Math.PI * 2); ctx.fill();

  // Sonar ping dalgası
  const wave = (fc % 90) * 1.2;
  ctx.strokeStyle = `rgba(255,255,255,${0.2 - wave / 400})`;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(t.x, t.y, wave, 0, Math.PI * 2); ctx.stroke();

  // Delik (siyah daire)
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath(); ctx.arc(t.x, t.y, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.arc(t.x, t.y, 6, 0, Math.PI * 2); ctx.fill();

  // Bayrak direği
  ctx.strokeStyle = '#d1d5db';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(t.x, t.y);
  ctx.lineTo(t.x, t.y - 35);
  ctx.stroke();

  // Bayrak (kırmızı üçgen — rüzgarda dalgalanma)
  const flagWave = Math.sin(fc * 0.08) * 2;
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(t.x, t.y - 35);
  ctx.lineTo(t.x + 18 + flagWave, t.y - 28);
  ctx.lineTo(t.x, t.y - 21);
  ctx.closePath();
  ctx.fill();

  // Bayrak üstü nokta
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(t.x, t.y - 35, 2, 0, Math.PI * 2); ctx.fill();
}

/* ========== BUNKER (Kum Çukuru) ========== */
function drawBunker(ctx: CanvasRenderingContext2D, pos: Vector2D, radius: number): void {
  // Dış gölge
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath(); ctx.ellipse(pos.x + 2, pos.y + 2, radius + 2, radius * 0.7 + 2, 0, 0, Math.PI * 2); ctx.fill();

  // Kum gövdesi
  const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius);
  grad.addColorStop(0, '#f5deb3');
  grad.addColorStop(0.5, '#deb887');
  grad.addColorStop(1, '#c4a265');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.ellipse(pos.x, pos.y, radius, radius * 0.7, 0, 0, Math.PI * 2); ctx.fill();

  // Kum tanecikleri
  ctx.fillStyle = 'rgba(160,130,80,0.3)';
  for (let i = 0; i < 6; i++) {
    const ax = pos.x + (Math.sin(i * 4.3) * radius * 0.6);
    const ay = pos.y + (Math.cos(i * 3.7) * radius * 0.4);
    ctx.beginPath(); ctx.arc(ax, ay, 1, 0, Math.PI * 2); ctx.fill();
  }

  // Kenar çizgisi
  ctx.strokeStyle = 'rgba(180,150,100,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(pos.x, pos.y, radius, radius * 0.7, 0, 0, Math.PI * 2); ctx.stroke();
}

/* ========== WATER (Su Tehlikesi) ========== */
function drawWater(ctx: CanvasRenderingContext2D, pos: Vector2D, radius: number, fc: number): void {
  // Su gövdesi
  const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius);
  grad.addColorStop(0, 'rgba(59, 130, 246, 0.7)');
  grad.addColorStop(0.6, 'rgba(37, 99, 235, 0.6)');
  grad.addColorStop(1, 'rgba(30, 64, 175, 0.4)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  // Organik gölet şekli
  const pts = 10;
  for (let i = 0; i <= pts; i++) {
    const a = (i / pts) * Math.PI * 2;
    const v = 0.85 + Math.sin(i * 2.7 + fc * 0.01) * 0.15;
    const rx = pos.x + Math.cos(a) * radius * v;
    const ry = pos.y + Math.sin(a) * radius * v * 0.75;
    if (i === 0) ctx.moveTo(rx, ry); else ctx.lineTo(rx, ry);
  }
  ctx.closePath();
  ctx.fill();

  // Su dalgacıkları
  ctx.strokeStyle = 'rgba(147, 197, 253, 0.3)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    const ox = pos.x - radius * 0.4 + i * radius * 0.3;
    const oy = pos.y - radius * 0.1 + i * 6;
    ctx.moveTo(ox, oy);
    ctx.quadraticCurveTo(ox + 8, oy - 3 + Math.sin(fc * 0.05 + i) * 2, ox + 16, oy);
    ctx.stroke();
  }
}

/* ========== TREE (Ağaç) ========== */
function drawTree(ctx: CanvasRenderingContext2D, pos: Vector2D, radius: number): void {
  // Gövde gölgesi
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath(); ctx.ellipse(pos.x + 3, pos.y + radius * 0.7, radius * 0.6, radius * 0.25, 0, 0, Math.PI * 2); ctx.fill();

  // Ağaç gövdesi
  ctx.fillStyle = '#6b4423';
  ctx.fillRect(pos.x - 3, pos.y - 2, 6, radius * 0.6);

  // Yaprak kümesi (üst üste daireler)
  const leafColors = ['#166534', '#15803d', '#22c55e'];
  const offsets = [
    { x: 0, y: -radius * 0.5, r: radius * 0.8 },
    { x: -radius * 0.35, y: -radius * 0.2, r: radius * 0.6 },
    { x: radius * 0.35, y: -radius * 0.25, r: radius * 0.55 },
  ];
  offsets.forEach((o, i) => {
    ctx.fillStyle = leafColors[i % leafColors.length];
    ctx.beginPath(); ctx.arc(pos.x + o.x, pos.y + o.y, o.r, 0, Math.PI * 2); ctx.fill();
  });

  // Yaprak highlight
  ctx.fillStyle = 'rgba(74, 222, 128, 0.15)';
  ctx.beginPath(); ctx.arc(pos.x - 2, pos.y - radius * 0.6, radius * 0.35, 0, Math.PI * 2); ctx.fill();
}

/* ========== CUSTOM ========== */
function drawCustomObs(ctx: CanvasRenderingContext2D, pos: Vector2D, radius: number): void {
  const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius);
  grad.addColorStop(0, 'rgba(251, 191, 36, 0.5)');
  grad.addColorStop(1, 'rgba(251, 191, 36, 0.15)');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.setLineDash([]);
}

/* ========== WALL (Royale Bumper) ========== */
function drawWall(ctx: CanvasRenderingContext2D, pos: Vector2D, radius: number): void {
  // Bumper gövdesi
  ctx.fillStyle = '#1e293b'; // Koyu gri beton
  ctx.beginPath();
  // Kareleştirilmiş bir daire (hexagon/octagon benzeri)
  const pts = 6;
  for (let i = 0; i <= pts; i++) {
    const a = (i / pts) * Math.PI * 2 + Math.PI / 6;
    const rx = pos.x + Math.cos(a) * radius;
    const ry = pos.y + Math.sin(a) * radius;
    if (i === 0) ctx.moveTo(rx, ry); else ctx.lineTo(rx, ry);
  }
  ctx.closePath();
  ctx.fill();

  // Neon üst kenar
  ctx.strokeStyle = '#38bdf8'; // Parlak mavi neon
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // İç desen
  ctx.fillStyle = '#0ea5e9';
  ctx.beginPath(); ctx.arc(pos.x, pos.y, radius * 0.4, 0, Math.PI * 2); ctx.fill();
  
  // Glow
  ctx.shadowColor = '#0284c7';
  ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.arc(pos.x, pos.y, radius * 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
}
