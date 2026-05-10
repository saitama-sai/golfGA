import type { PopulationStats } from '../ga';

interface StatsOverlayProps {
  stats: PopulationStats;
  fitnessHistory: { gen: number; fitness: number; reached: number }[];
}

export function StatsOverlay({ stats, fitnessHistory }: StatsOverlayProps) {
  const successRate = stats.totalVehicles > 0
    ? ((stats.reachedTarget / stats.totalVehicles) * 100).toFixed(1)
    : '0.0';

  const crashRate = stats.totalVehicles > 0
    ? ((stats.crashed / stats.totalVehicles) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="stats-overlay">
      {/* Ana Metrikler */}
      <div className="stats-grid">
        <div className="stat-card stat-generation">
          <div className="stat-icon">🧬</div>
          <div className="stat-content">
            <div className="stat-value">{stats.generation}</div>
            <div className="stat-label">Jenerasyon</div>
          </div>
        </div>

        <div className="stat-card stat-fitness">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <div className="stat-value">{stats.bestFitness.toFixed(3)}</div>
            <div className="stat-label">En İyi Fitness</div>
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon">🏳️</div>
          <div className="stat-content">
            <div className="stat-value">
              {stats.reachedTarget}
              <span className="stat-pct"> ({successRate}%)</span>
            </div>
            <div className="stat-label">Deliğe Giren</div>
          </div>
        </div>

        <div className="stat-card stat-crash">
          <div className="stat-icon">⛳</div>
          <div className="stat-content">
            <div className="stat-value">
              {stats.crashed}
              <span className="stat-pct"> ({crashRate}%)</span>
            </div>
            <div className="stat-label">Engele Düşen</div>
          </div>
        </div>
      </div>

      {/* Mini Fitness Grafiği */}
      {fitnessHistory.length > 1 && (
        <div className="fitness-chart">
          <div className="chart-header">
            <span className="chart-title">📈 Fitness Evrimi</span>
            <span className="chart-gen">Son {Math.min(fitnessHistory.length, 50)} jenerasyon</span>
          </div>
          <FitnessChart data={fitnessHistory.slice(-50)} />
        </div>
      )}
    </div>
  );
}

function FitnessChart({ data }: { data: { gen: number; fitness: number; reached: number }[] }) {
  if (data.length < 2) return null;

  const chartWidth = 280;
  const chartHeight = 60;
  const padding = 4;

  const maxFitness = Math.max(...data.map(d => d.fitness), 0.001);
  const maxReached = Math.max(...data.map(d => d.reached), 1);

  // Fitness çizgisi
  const fitnessPoints = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (chartWidth - padding * 2);
    const y = chartHeight - padding - (d.fitness / maxFitness) * (chartHeight - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  // Reached bar
  const reachedPoints = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (chartWidth - padding * 2);
    const y = chartHeight - padding - (d.reached / maxReached) * (chartHeight - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  // Gradient fill path
  const firstX = padding;
  const lastX = padding + ((data.length - 1) / (data.length - 1)) * (chartWidth - padding * 2);
  const fillPath = `M ${firstX},${chartHeight - padding} L ${fitnessPoints} L ${lastX},${chartHeight - padding} Z`;

  return (
    <svg width={chartWidth} height={chartHeight} className="chart-svg">
      <defs>
        <linearGradient id="fitnessGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(0, 212, 255, 0.3)" />
          <stop offset="100%" stopColor="rgba(0, 212, 255, 0)" />
        </linearGradient>
        <linearGradient id="reachedGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(0, 255, 136, 0.15)" />
          <stop offset="100%" stopColor="rgba(0, 255, 136, 0)" />
        </linearGradient>
      </defs>

      {/* Reached fill */}
      <path
        d={`M ${firstX},${chartHeight - padding} L ${reachedPoints} L ${lastX},${chartHeight - padding} Z`}
        fill="url(#reachedGrad)"
      />
      <polyline
        points={reachedPoints}
        fill="none"
        stroke="rgba(0, 255, 136, 0.4)"
        strokeWidth="1"
      />

      {/* Fitness fill & line */}
      <path d={fillPath} fill="url(#fitnessGrad)" />
      <polyline
        points={fitnessPoints}
        fill="none"
        stroke="#00d4ff"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
