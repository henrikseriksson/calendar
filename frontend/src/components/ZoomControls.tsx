type ZoomControlsProps = {
  pxPerDay: number;
  onZoomChange: (px: number) => void;
  min?: number;
  max?: number;
};

const PRESETS = [
  { label: 'Month', px: 30 },
  { label: 'Week', px: 100 },
  { label: 'Day', px: 200 },
];

export function ZoomControls({
  pxPerDay,
  onZoomChange,
  min = 30,
  max = 250,
}: ZoomControlsProps) {
  return (
    <div className="zoom-controls">
      <div className="zoom-presets">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            className={`zoom-preset ${pxPerDay === preset.px ? 'active' : ''}`}
            onClick={() => onZoomChange(preset.px)}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="zoom-slider-container">
        <span className="zoom-icon">−</span>
        <input
          type="range"
          className="zoom-slider"
          min={min}
          max={max}
          value={pxPerDay}
          onChange={(e) => onZoomChange(Number(e.target.value))}
        />
        <span className="zoom-icon">+</span>
      </div>
    </div>
  );
}

