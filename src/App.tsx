import { useState, useCallback } from 'react';
import { SimulationCanvas } from './components/SimulationCanvas';
import { ControlPanel } from './components/ControlPanel';
import { StatsOverlay } from './components/StatsOverlay';
import { Vector2D, Obstacle } from './ga';
import type { PopulationStats } from './ga';

function createDefaultObstacles(): Obstacle[] {
  const obs: Obstacle[] = [];
  
  // ==========================================
  // DIŞ ÇERÇEVE (DIŞ DUVARLAR)
  // ==========================================
  // Alt Zemin
  for (let x = 200; x <= 1040; x += 35) {
    obs.push(new Obstacle({ position: new Vector2D(x, 590), radius: 22, type: 'wall' }));
  }
  // Üst Tavan
  for (let x = 200; x <= 1040; x += 35) {
    obs.push(new Obstacle({ position: new Vector2D(x, 100), radius: 22, type: 'wall' }));
  }
  // En Sağ Duvar
  for (let y = 100; y <= 590; y += 35) {
    obs.push(new Obstacle({ position: new Vector2D(1040, y), radius: 22, type: 'wall' }));
  }
  // En Sol Duvar (Alt başlangıç ve Üst hedef kısımları)
  for (let y = 100; y <= 240; y += 35) {
    obs.push(new Obstacle({ position: new Vector2D(200, y), radius: 22, type: 'wall' }));
  }
  for (let y = 450; y <= 590; y += 35) {
    obs.push(new Obstacle({ position: new Vector2D(200, y), radius: 22, type: 'wall' }));
  }
  // Ortadaki Sol Boşluğu Kapatan Duvar (X=200, Y=240 ile Y=450 arası)
  for (let y = 275; y <= 415; y += 35) {
    obs.push(new Obstacle({ position: new Vector2D(200, y), radius: 22, type: 'wall' }));
  }

  // ==========================================
  // İÇ BLOK (TÜPÜN İÇ ÇEPERİ VE KISA YOLLAR)
  // ==========================================
  // Alt Koridorun Tavanı (Kırmızı ile işaretlenen kestirme yollar açıldı)
  const bottomCeilingGaps = [270, 445]; // Başlangıcın hemen üstü ve orta kısım
  for (let x = 200; x <= 900; x += 35) {
    if (!bottomCeilingGaps.includes(x)) {
      obs.push(new Obstacle({ position: new Vector2D(x, 450), radius: 22, type: 'wall' }));
    }
  }
  // Sağ Koridorun Sol Duvarı
  for (let y = 240; y <= 450; y += 35) {
    obs.push(new Obstacle({ position: new Vector2D(900, y), radius: 22, type: 'wall' }));
  }
  // Üst Koridorun Tabanı (Kırmızı ile işaretlenen 4 adet geçiş kapısı açıldı)
  const topFloorGaps = [340, 480, 620, 795];
  for (let x = 200; x <= 900; x += 35) {
    if (!topFloorGaps.includes(x)) {
      obs.push(new Obstacle({ position: new Vector2D(x, 240), radius: 22, type: 'wall' }));
    }
  }

  // ==========================================
  // TUZAKLAR
  // ==========================================
  // (Slalom engelleri kullanıcının isteği üzerine tamamen kaldırıldı)

  // Üst Koridorda Su ve Kum Tuzakları
  obs.push(new Obstacle({ position: new Vector2D(700, 170), radius: 35, type: 'water' }));
  obs.push(new Obstacle({ position: new Vector2D(500, 170), radius: 30, type: 'sand' }));

  // Hedefin Koruyucuları (Hedefe girmeden hemen önce dar bir kapı/köprü)
  obs.push(new Obstacle({ position: new Vector2D(350, 130), radius: 18, type: 'tree' }));
  obs.push(new Obstacle({ position: new Vector2D(350, 210), radius: 18, type: 'tree' }));

  return obs;
}

export default function App() {
  // GA Parametreleri
  const [populationSize, setPopulationSize] = useState(200);
  const [mutationRate, setMutationRate] = useState(0.01);
  const [lifespan, setLifespan] = useState(300);
  const [speed, setSpeed] = useState(1);

  // Görsel Ayarlar
  const [showSonar, setShowSonar] = useState(true);
  const [showTrails, setShowTrails] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Engel Editörü
  const [drawMode, setDrawMode] = useState(false);
  const [drawRadius, setDrawRadius] = useState(25);
  const [obstacles, setObstacles] = useState<Obstacle[]>(createDefaultObstacles);

  // İstatistikler
  const [stats, setStats] = useState<PopulationStats>({
    generation: 1,
    bestFitness: 0,
    avgFitness: 0,
    reachedTarget: 0,
    crashed: 0,
    alive: 0,
    totalVehicles: 0,
    bestDna: null,
  });
  const [fitnessHistory, setFitnessHistory] = useState<{ gen: number; fitness: number; reached: number }[]>([]);
  const [resetKey, setResetKey] = useState(0);

  const handleStatsUpdate = useCallback((newStats: PopulationStats) => {
    setStats(newStats);
  }, []);

  const handleGenerationHistory = useCallback((gen: number, fitness: number, reached: number) => {
    setFitnessHistory(prev => [...prev.slice(-200), { gen, fitness, reached }]);
  }, []);

  const handleReset = useCallback(() => {
    setResetKey(k => k + 1);
    setFitnessHistory([]);
    setStats({
      generation: 1,
      bestFitness: 0,
      avgFitness: 0,
      reachedTarget: 0,
      crashed: 0,
      alive: 0,
      totalVehicles: 0,
      bestDna: null,
    });
  }, []);

  const handleClearObstacles = useCallback(() => {
    setObstacles(createDefaultObstacles());
  }, []);

  return (
    <div className="app-container">
      {/* Başlık */}
      <header className="app-header">
        <div className="header-left">
          <div className="header-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#headerGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="headerGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#86efac" />
                </linearGradient>
              </defs>
              <circle cx="12" cy="12" r="4" />
              <line x1="12" y1="8" x2="12" y2="2" />
              <polygon points="12,2 18,6 12,5" fill="url(#headerGrad)" />
            </svg>
          </div>
          <div>
            <h1 className="header-title">GA Golf Simülasyonu</h1>
            <p className="header-subtitle">Genetik Algoritma ile Otonom Rota Optimizasyonu — Golf Sahası</p>
          </div>
        </div>
        <div className="header-right">
          <div className="header-badge">
            <span className="badge-dot" />
            <span>{isPaused ? 'DURAKLATILDI' : 'SİMÜLASYON AKTİF'}</span>
          </div>
        </div>
      </header>

      {/* Ana içerik */}
      <main className="app-main">
        {/* Sol — Canvas */}
        <div className="canvas-wrapper">
          <SimulationCanvas
            populationSize={populationSize}
            mutationRate={mutationRate}
            lifespan={lifespan}
            showSonar={showSonar}
            showTrails={showTrails}
            isPaused={isPaused}
            speed={speed}
            onStatsUpdate={handleStatsUpdate}
            onGenerationHistory={handleGenerationHistory}
            obstacles={obstacles}
            onObstaclesChange={setObstacles}
            drawMode={drawMode}
            drawRadius={drawRadius}
            resetKey={resetKey}
          />
          {/* İstatistik overlay — canvas altında */}
          <StatsOverlay stats={stats} fitnessHistory={fitnessHistory} />
        </div>

        {/* Sağ — Kontrol Paneli */}
        <ControlPanel
          populationSize={populationSize}
          setPopulationSize={setPopulationSize}
          mutationRate={mutationRate}
          setMutationRate={setMutationRate}
          lifespan={lifespan}
          setLifespan={setLifespan}
          speed={speed}
          setSpeed={setSpeed}
          showSonar={showSonar}
          setShowSonar={setShowSonar}
          showTrails={showTrails}
          setShowTrails={setShowTrails}
          isPaused={isPaused}
          setIsPaused={setIsPaused}
          drawMode={drawMode}
          setDrawMode={setDrawMode}
          drawRadius={drawRadius}
          setDrawRadius={setDrawRadius}
          onReset={handleReset}
          onClearObstacles={handleClearObstacles}
        />
      </main>
    </div>
  );
}
