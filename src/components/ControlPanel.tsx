interface ControlPanelProps {
  populationSize: number;
  setPopulationSize: (v: number) => void;
  mutationRate: number;
  setMutationRate: (v: number) => void;
  lifespan: number;
  setLifespan: (v: number) => void;
  speed: number;
  setSpeed: (v: number) => void;
  showSonar: boolean;
  setShowSonar: (v: boolean) => void;
  showTrails: boolean;
  setShowTrails: (v: boolean) => void;
  isPaused: boolean;
  setIsPaused: (v: boolean) => void;
  drawMode: boolean;
  setDrawMode: (v: boolean) => void;
  drawRadius: number;
  setDrawRadius: (v: number) => void;
  onReset: () => void;
  onClearObstacles: () => void;
}

export function ControlPanel({
  populationSize,
  setPopulationSize,
  mutationRate,
  setMutationRate,
  lifespan,
  setLifespan,
  speed,
  setSpeed,
  showSonar,
  setShowSonar,
  showTrails,
  setShowTrails,
  isPaused,
  setIsPaused,
  drawMode,
  setDrawMode,
  drawRadius,
  setDrawRadius,
  onReset,
  onClearObstacles,
}: ControlPanelProps) {
  return (
    <div className="control-panel">
      {/* Başlık */}
      <div className="panel-header">
        <div className="panel-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="16" r="4" />
            <line x1="12" y1="12" x2="12" y2="4" />
            <polygon points="12,4 18,8 12,7" fill="currentColor" opacity="0.5" />
          </svg>
          <span>Kontrol Paneli</span>
        </div>
      </div>

      {/* Genetik Parametreler */}
      <div className="panel-section">
        <h3 className="section-title">
          <span className="section-icon">🧬</span>
          Genetik Parametreler
        </h3>

        <div className="control-group">
          <div className="control-label">
            <span>Popülasyon</span>
            <span className="control-value">{populationSize}</span>
          </div>
          <input
            type="range"
            min="20"
            max="500"
            step="10"
            value={populationSize}
            onChange={(e) => setPopulationSize(Number(e.target.value))}
            className="slider"
            id="population-slider"
          />
          <div className="slider-range">
            <span>20</span>
            <span>500</span>
          </div>
        </div>

        <div className="control-group">
          <div className="control-label">
            <span>Mutasyon Oranı</span>
            <span className="control-value">{(mutationRate * 100).toFixed(1)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="0.5"
            step="0.005"
            value={mutationRate}
            onChange={(e) => setMutationRate(Number(e.target.value))}
            className="slider slider-mutation"
            id="mutation-slider"
          />
          <div className="slider-range">
            <span>0%</span>
            <span>50%</span>
          </div>
        </div>

        <div className="control-group">
          <div className="control-label">
            <span>Vuruş Sayısı</span>
            <span className="control-value">{lifespan} vuruş</span>
          </div>
          <input
            type="range"
            min="100"
            max="600"
            step="10"
            value={lifespan}
            onChange={(e) => setLifespan(Number(e.target.value))}
            className="slider"
            id="lifespan-slider"
          />
          <div className="slider-range">
            <span>100</span>
            <span>600</span>
          </div>
        </div>
      </div>

      {/* Simülasyon Kontrolleri */}
      <div className="panel-section">
        <h3 className="section-title">
          <span className="section-icon">⚡</span>
          Simülasyon
        </h3>

        <div className="control-group">
          <div className="control-label">
            <span>Hız</span>
            <span className="control-value">×{speed}</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="slider slider-speed"
            id="speed-slider"
          />
          <div className="slider-range">
            <span>×1</span>
            <span>×10</span>
          </div>
        </div>

        <div className="button-row">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`btn ${isPaused ? 'btn-play' : 'btn-pause'}`}
            id="pause-button"
          >
            {isPaused ? '▶ Devam' : '⏸ Durdur'}
          </button>
          <button
            onClick={onReset}
            className="btn btn-reset"
            id="reset-button"
          >
            🔄 Sıfırla
          </button>
        </div>
      </div>

      {/* Engel Editörü */}
      <div className="panel-section">
        <h3 className="section-title">
          <span className="section-icon">⛳</span>
          Saha Editörü
        </h3>

        <div className="button-row">
          <button
            onClick={() => setDrawMode(!drawMode)}
            className={`btn ${drawMode ? 'btn-active' : 'btn-draw'}`}
            id="draw-mode-button"
          >
            {drawMode ? '✓ Çizim Aktif' : '✏️ Engel Ekle'}
          </button>
          <button
            onClick={onClearObstacles}
            className="btn btn-clear"
            id="clear-obstacles-button"
          >
            🗑️ Temizle
          </button>
        </div>

        {drawMode && (
          <div className="control-group" style={{ marginTop: 8 }}>
            <div className="control-label">
              <span>Engel Boyutu</span>
              <span className="control-value">{drawRadius}px</span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              step="5"
              value={drawRadius}
              onChange={(e) => setDrawRadius(Number(e.target.value))}
              className="slider"
              id="draw-radius-slider"
            />
          </div>
        )}
      </div>

      {/* Görsel Ayarlar */}
      <div className="panel-section">
        <h3 className="section-title">
          <span className="section-icon">👁️</span>
          Görselleştirme
        </h3>

        <label className="toggle-label" htmlFor="sonar-toggle">
          <span>Algılama Işınları</span>
          <div className={`toggle ${showSonar ? 'toggle-on' : ''}`} onClick={() => setShowSonar(!showSonar)}>
            <div className="toggle-thumb" />
          </div>
        </label>

        <label className="toggle-label" htmlFor="trails-toggle">
          <span>Top İzleri</span>
          <div className={`toggle ${showTrails ? 'toggle-on' : ''}`} onClick={() => setShowTrails(!showTrails)}>
            <div className="toggle-thumb" />
          </div>
        </label>
      </div>

      {/* Bilgi */}
      <div className="panel-info">
        <p>
          <strong>Genetik Algoritma</strong> ile golf topları bunker, su ve 
          ağaç engellerini aşarak deliğe ulaşmayı <em>evrimsel olarak</em> öğrenir.
        </p>
      </div>
    </div>
  );
}
