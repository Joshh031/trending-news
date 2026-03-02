const SOURCE_CONFIG = {
  hackerNews: { label: 'HN', className: 'source-hn' },
  reddit: { label: 'Reddit', className: 'source-reddit' },
  bluesky: { label: 'Bluesky', className: 'source-bluesky' },
};

export default function SourceBadge({ source, count }) {
  const config = SOURCE_CONFIG[source];
  if (!config || count === 0) return null;
  return (
    <span className={`source-badge ${config.className}`}>
      {config.label} {count > 1 ? `x${count}` : ''}
    </span>
  );
}
