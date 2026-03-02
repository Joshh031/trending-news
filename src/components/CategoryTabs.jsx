const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'tech', label: 'Tech' },
  { value: 'finance', label: 'Finance' },
  { value: 'general', label: 'General' },
];

export default function CategoryTabs({ value, onChange }) {
  return (
    <div className="category-tabs">
      {CATEGORIES.map(c => (
        <button
          key={c.value}
          className={`tab-btn ${value === c.value ? 'active' : ''}`}
          onClick={() => onChange(c.value)}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
