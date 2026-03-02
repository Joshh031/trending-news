import { loadSourceArticles, saveSourceArticles, addArticleToSource, evictStale } from '../../lib/articleStore.js';

const USER_AGENT = 'TrendingNewsAggregator/1.0 (vercel serverless)';
const SUBREDDITS = {
  tech: ['technology', 'programming', 'netsec', 'MachineLearning', 'startups'],
  finance: ['finance', 'economics', 'StockMarket', 'business', 'investing'],
  general: ['worldnews', 'science', 'news', 'UpliftingNews', 'Futurology'],
};

async function fetchSubreddit(subreddit, existing) {
  const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=25`;
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (res.status === 429 || !res.ok) return 0;

  const data = await res.json();
  const posts = data?.data?.children || [];
  let added = 0;

  for (const { data: post } of posts) {
    if (post.is_self || post.stickied) continue;
    if (!post.url || post.url.includes('reddit.com') || post.url.includes('redd.it')) continue;

    const result = addArticleToSource(existing, post.url, post.title, 'reddit', {
      score: post.score,
      subreddit: post.subreddit,
      sourceHint: post.subreddit,
    });
    if (result) added++;
  }
  return added;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${process.env.POLL_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const existing = await loadSourceArticles('reddit');
    const allSubs = [...SUBREDDITS.tech, ...SUBREDDITS.finance, ...SUBREDDITS.general];

    let totalAdded = 0;
    for (let i = 0; i < allSubs.length; i++) {
      totalAdded += await fetchSubreddit(allSubs[i], existing);
      if (i < allSubs.length - 1) {
        await new Promise(r => setTimeout(r, 4000));
      }
    }

    evictStale(existing);
    await saveSourceArticles('reddit', existing);

    res.status(200).json({ source: 'reddit', subreddits: allSubs.length, added: totalAdded });
  } catch (err) {
    console.error('[Reddit Poll] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
