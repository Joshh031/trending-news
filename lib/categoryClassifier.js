const TECH_KEYWORDS = [
  'software', 'programming', 'ai ', 'artificial intelligence', 'machine learning',
  'startup', 'silicon valley', 'open source', 'github', 'developer',
  'javascript', 'python', 'rust', 'cloud', 'aws', 'google cloud',
  'cybersecurity', 'hack', 'data breach', 'api', 'blockchain',
  'gpu', 'chip', 'semiconductor', 'neural', 'llm', 'chatgpt', 'openai',
  'apple', 'google', 'microsoft', 'meta', 'nvidia',
  'saas', 'devops', 'kubernetes', 'docker', 'linux', 'android', 'ios',
  'robotics', 'quantum', 'spacex', 'tesla',
];

const FINANCE_KEYWORDS = [
  'stock', 'market', 'invest', 'ipo', 'earnings', 'revenue', 'profit',
  'fed ', 'federal reserve', 'interest rate', 'inflation', 'gdp',
  'wall street', 'nasdaq', 'dow jones', 's&p 500', 'bond', 'yield',
  'banking', 'fintech', 'cryptocurrency', 'bitcoin', 'ethereum',
  'hedge fund', 'venture capital', 'acquisition', 'merger',
  'economic', 'recession', 'unemployment', 'trade deficit',
  'sec ', 'valuation',
];

// Map subreddit/source names to categories
const SOURCE_CATEGORIES = {
  technology: 'tech', programming: 'tech', netsec: 'tech',
  machinelearning: 'tech', startups: 'tech', hackernews: 'tech',
  finance: 'finance', economics: 'finance', stockmarket: 'finance',
  business: 'finance', investing: 'finance',
};

export function classifyCategory(title, sourceHint) {
  // Check source hint first
  if (sourceHint) {
    const src = sourceHint.toLowerCase();
    if (SOURCE_CATEGORIES[src]) return SOURCE_CATEGORIES[src];
  }

  const lower = (title || '').toLowerCase();
  const techScore = TECH_KEYWORDS.filter(kw => lower.includes(kw)).length;
  const finScore = FINANCE_KEYWORDS.filter(kw => lower.includes(kw)).length;

  if (techScore > finScore && techScore > 0) return 'tech';
  if (finScore > techScore && finScore > 0) return 'finance';
  return 'general';
}
