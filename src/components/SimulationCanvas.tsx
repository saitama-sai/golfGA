import { useRef, useEffect, useCallback, useState } from 'react';
import { Vector2D, Population, Obstacle } from '../ga';
import type { PopulationStats } from '../ga';
import { renderFrame } from '../renderer/CanvasRenderer';

interface SimulationCanvasProps {
  populationSize: number;
  mutationRate: number;
  lifespan: number;
  showSonar: boolean;
  showTrails: boolean;
  isPaused: boolean;
  speed: number;
  onStatsUpdate: (stats: PopulationStats) => void;
  onGenerationHistory: (gen: number, fitness: number, reached: number) => void;
  obstacles: Obstacle[];
  onObstaclesChange: (obstacles: Obstacle[]) => void;
  drawMode: boolean;
  drawRadius: number;
  resetKey: number;
}

export function SimulationCanvas({
  populationSize,
  mutationRate,
  lifespan,
  showSonar,
  showTrails,
  isPaused,
  speed,
  onStatsUpdate,
  onGenerationHistory,
  obstacles,
  onObstaclesChange,
  drawMode,
  drawRadius,
  resetKey,
}: SimulationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const populationRef = useRef<Population | null>(null);
  const animFrameRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const isPausedRef = useRef(isPaused);
  const speedRef = useRef(speed);
  const mutationRateRef = useRef(mutationRate);
  const showSonarRef = useRef(showSonar);
  const showTrailsRef = useRef(showTrails);
  const obstaclesRef = useRef(obstacles);
  const [canvasSize, setCanvasSize] = useState({ width: 900, height: 600 });

  // Canvas boyutu
  const targetRef = useRef(new Vector2D(canvasSize.width / 2, 50));
  const startPosRef = useRef(new Vector2D(canvasSize.width / 2, canvasSize.height - 60));

  // Ref'leri güncelle
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { showSonarRef.current = showSonar; }, [showSonar]);
  useEffect(() => { showTrailsRef.current = showTrails; }, [showTrails]);
  useEffect(() => { obstaclesRef.current = obstacles; }, [obstacles]);
  useEffect(() => {
    mutationRateRef.current = mutationRate;
    if (populationRef.current) {
      populationRef.current.setMutationRate(mutationRate);
    }
  }, [mutationRate]);

  // Responsive canvas boyutu
  useEffect(() => {
    function handleResize() {
      const container = canvasRef.current?.parentElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        const w = Math.floor(rect.width);
        const h = Math.floor(Math.min(rect.height, window.innerHeight * 0.78));
        setCanvasSize({ width: w, height: h });
        targetRef.current = new Vector2D(w / 2, 50);
        startPosRef.current = new Vector2D(w / 2, h - 60);
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Popülasyonu oluştur / sıfırla
  useEffect(() => {
    const maxForce = 0.3;
    populationRef.current = new Population(
      populationSize,
      startPosRef.current,
      lifespan,
      maxForce,
      mutationRateRef.current
    );
    frameCountRef.current = 0;
  }, [populationSize, lifespan, resetKey, canvasSize]);

  // Fare ile engel çizme
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawMode) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newObstacle = new Obstacle({
      position: new Vector2D(x, y),
      radius: drawRadius,
      type: 'custom',
    });

    onObstaclesChange([...obstacles, newObstacle]);
  }, [drawMode, drawRadius, obstacles, onObstaclesChange]);

  // Ana simülasyon döngüsü
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    function loop() {
      if (!running) return;
      const pop = populationRef.current;
      if (!pop || !ctx || !canvas) {
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      frameCountRef.current++;

      if (!isPausedRef.current) {
        // Hız çarpanı kadar simülasyon adımı
        const stepsPerFrame = speedRef.current;
        for (let s = 0; s < stepsPerFrame; s++) {
          if (pop.isGenerationComplete()) {
            // Nesil bitti — değerlendir ve evrimleş
            pop.evaluate(targetRef.current);
            const stats = pop.getStats();
            onStatsUpdate(stats);
            onGenerationHistory(stats.generation, stats.bestFitness, stats.reachedTarget);
            pop.evolve();
          }

          pop.update(
            targetRef.current,
            obstaclesRef.current,
            canvas.width,
            canvas.height
          );
        }
      }

      // En iyi aracı bul (fitness veya mesafe bazlı)
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < pop.vehicles.length; i++) {
        const v = pop.vehicles[i];
        if (!v.crashed && !v.reachedTarget) {
          const d = v.position.distanceTo(targetRef.current);
          if (d < bestDist) {
            bestDist = d;
            bestIdx = i;
          }
        }
      }

      // Render
      renderFrame(
        ctx,
        canvas,
        pop.vehicles,
        obstaclesRef.current,
        targetRef.current,
        startPosRef.current,
        pop.generation,
        showSonarRef.current,
        showTrailsRef.current,
        bestIdx,
        frameCountRef.current
      );

      // Jenerasyon ve araç sayısı overlay
      ctx.fillStyle = 'rgba(0, 212, 255, 0.6)';
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`JEN: ${pop.generation}`, 12, 20);
      ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
      ctx.fillText(`ADIM: ${pop.vehicles[0]?.step ?? 0} / ${lifespan}`, 12, 36);

      animFrameRef.current = requestAnimationFrame(loop);
    }

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [canvasSize, lifespan, onStatsUpdate, onGenerationHistory, resetKey]);

  return (
    <div className="simulation-canvas-container">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onClick={handleCanvasClick}
        className={`simulation-canvas ${drawMode ? 'draw-mode' : ''}`}
      />
      {drawMode && (
        <div className="draw-mode-overlay">
          <span className="draw-mode-badge">
            🎯 Engel Çizim Modu — Tıklayarak engel ekleyin
          </span>
        </div>
      )}
    </div>
  );
}
