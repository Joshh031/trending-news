const WINDOWS = [
  { value: '1h', label: '1 Hour' },
  { value: '6h', label: '6 Hours' },
  { value: '24h', label: '24 Hours' },
];

export default function TimeWindowSelector({ value, onChange }) {
  return (
    <div className="time-window-selector">
      {WINDOWS.map(w => (
        <button
          key={w.value}
          className={`toggle-btn ${value === w.value ? 'active' : ''}`}
          onClick={() => onChange(w.value)}
        >
          {w.label}
        </button>
      ))}
    </div>
  );
}
