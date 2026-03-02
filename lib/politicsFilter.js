const POLITICAL_KEYWORDS = [
  'trump', 'biden', 'democrat', 'republican', 'gop', 'dnc', 'rnc',
  'maga', 'liberal', 'conservative', 'congress votes', 'senate vote',
  'impeach', 'abortion', 'gun control', 'gun rights', 'second amendment',
  'immigration ban', 'border wall', 'woke', 'anti-woke',
  'left-wing', 'right-wing', 'marxis', 'fascis',
  'partisan', 'gerrymandering',
  'political party', 'caucus', 'primary election',
  'fox news', 'msnbc', 'breitbart', 'infowars',
  'desantis', 'pelosi', 'mcconnell', 'aoc',
  'musk twitter', 'culture war',
];

const POLITICAL_DOMAINS = [
  'politico.com', 'thehill.com', 'breitbart.com', 'dailywire.com',
  'huffpost.com', 'foxnews.com', 'msnbc.com', 'dailykos.com',
  'townhall.com', 'motherjones.com', 'jacobin.com',
  'infowars.com', 'newsmax.com', 'oann.com',
];

export function isPolitical(title, url) {
  const lowerTitle = (title || '').toLowerCase();

  // Check domain blocklist
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (POLITICAL_DOMAINS.some(d => hostname.includes(d))) return true;
  } catch {}

  // Check keyword blocklist
  return POLITICAL_KEYWORDS.some(kw => lowerTitle.includes(kw));
}
