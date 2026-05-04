interface StorageSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function StorageSlider({ value, onChange }: StorageSliderProps) {
  return (
    <div>
      <div className="text-[12px] font-medium mb-1.5 text-text-secondary">Stockage : {value} GB</div>
      <input
        type="range"
        min={10}
        max={500}
        step={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-cyan"
      />
      <div className="flex justify-between text-[10px] font-mono mt-1 text-text-muted">
        <span>10 GB</span>
        <span>500 GB</span>
      </div>
    </div>
  );
}
