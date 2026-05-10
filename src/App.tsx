import { useState, useCallback } from 'react';
import { SimulationCanvas } from './components/SimulationCanvas';
import { ControlPanel } from './components/ControlPanel';
import { StatsOverlay } from './components/StatsOverlay';
import { Vector2D, Obstacle } from './ga';
import type { PopulationStats } from './ga';

function createDefaultObstacles(): Obstacle[] {
  const obs: Obstacle[] = [];
  
  // 1. Sol Dış Duvar
  for (let y = 150; y <= 580; y += 35) {
    obs.push(new Obstacle({ position: new Vector2D(200, y), radius: 22, type: 'wall' }));
  }

  // 2. Üst Dış Duvar (Tavan)
  for (let x = 200; x <= 1000; x += 35) {
    obs.push(new Obstacle({ position: new Vector2D(x, 150), radius: 22, type: 'wall' }));
  }

  // 3. Sağ Dış Duvar (Başlangıç alanının sağı)
  for (let y = 350; y <= 580; y += 35) {
    obs.push(new Obstacle({ position: new Vector2D(700, y), radius: 22, type: 'wall' }));
  }

  // 4. Alt Dış Duvar (Başlangıç alanının tabanı)
  for (let x = 200; x <= 700; x += 35) {
    obs.push(new Obstacle({ position: new Vector2D(x, 580), radius: 22, type: 'wall' }));
  }

  // 5. İç Duvar Sol (Kullanıcının yeşil çizdiği duvar - Aşılması gereken ilk engel)
  for (let x = 200; x <= 500; x += 35) {
    obs.push(new Obstacle({ position: new Vector2D(x, 350), radius: 22, type: 'wall' }));
  }

  // 6. Koridor Alt Duvarı (Sağa giden yolun tabanı)
  for (let x = 700; x <= 1000; x += 35) {
    obs.push(new Obstacle({ position: new Vector2D(x, 350), radius: 22, type: 'wall' }));
  }

  // 7. Koridor Bitiş Duvarı (Sağ kapak)
  for (let y = 150; y <= 350; y += 35) {
    obs.push(new Obstacle({ position: new Vector2D(1000, y), radius: 22, type: 'wall' }));
  }

  // Golf Royale tarzı tehlikeler
  obs.push(new Obstacle({ position: new Vector2D(600, 480), radius: 35, type: 'sand' }));   // İlk çıkıştaki kum
  obs.push(new Obstacle({ position: new Vector2D(500, 250), radius: 30, type: 'water' }));  // Dönüşteki su
  
  // Hedefin (deliğin) koruyucuları (Koridorun sonunda)
  obs.push(new Obstacle({ position: new Vector2D(880, 200), radius: 18, type: 'tree' }));
  obs.push(new Obstacle({ position: new Vector2D(880, 300), radius: 18, type: 'tree' }));

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
