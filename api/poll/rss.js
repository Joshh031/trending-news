import { loadSourceArticles, saveSourceArticles, addArticleToSource, evictStale } from '../../lib/articleStore.js';

const RSS_FEEDS = [
  { name: 'nyt', url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', label: 'NYT' },
  { name: 'bbc', url: 'https://feeds.bbci.co.uk/news/rss.xml', label: 'BBC' },
  { name: 'guardian', url: 'https://www.theguardian.com/world/rss', label: 'Guardian' },
  { name: 'ap', url: 'https://feeds.apnews.com/rss/apf-topnews', label: 'AP' },
  { name: 'wsj', url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml', label: 'WSJ' },
  { name: 'npr', url: 'https://feeds.npr.org/1001/rss.xml', label: 'NPR' },
];

function extractTag(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>\\s*(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?\\s*<\\/${tag}>`, 'i');
  const match = xml.match(re);
  return match ? match[1].trim() : null;
}

function extractLink(itemXml) {
  let match = itemXml.match(/<link[^>]*>([^<\s][^<]*)<\/link>/i);
  if (match) return match[1].trim();
  match = itemXml.match(/<link[^>]+href=["']([^"']+)["']/i);
  if (match) return match[1].trim();
  match = itemXml.match(/<guid[^>]*isPermaLink=["']true["'][^>]*>([^<]+)<\/guid>/i);
  if (match) return match[1].trim();
  match = itemXml.match(/<guid[^>]*>(https?:\/\/[^<]+)<\/guid>/i);
  if (match) return match[1].trim();
  return null;
}

function parseRSS(xml) {
  const items = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/g;
  let match;
  let rank = 0;
  while ((match = itemRegex.exec(xml)) !== null) {
    const title = extractTag(match[1], 'title');
    const link = extractLink(match[1]);
    if (title && link && link.startsWith('http')) {
      items.push({ title, link, rank: rank++ });
    }
  }
  return items;
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
    const existing = await loadSourceArticles('rss');
    let totalAdded = 0;
    const results = [];

    for (const feed of RSS_FEEDS) {
      try {
        const res2 = await fetch(feed.url, {
          headers: { 'User-Agent': 'TrendingNewsAggregator/1.0' },
          signal: AbortSignal.timeout(10000),
        });

        if (!res2.ok) {
          results.push({ feed: feed.label, status: res2.status });
          continue;
        }

        const xml = await res2.text();
        const items = parseRSS(xml);
        let added = 0;

        for (const { title, link, rank } of items) {
          const score = Math.max(100 - rank * 3, 10);
          const result = addArticleToSource(existing, link, title, 'rss', {
            score,
            outlet: feed.label,
            sourceHint: feed.name,
          });
          if (result) added++;
        }

        results.push({ feed: feed.label, items: items.length, added });
        totalAdded += added;
      } catch (err) {
        results.push({ feed: feed.label, error: err.message });
      }
    }

    evictStale(existing);
    await saveSourceArticles('rss', existing);

    res.status(200).json({ source: 'rss', feeds: results, totalAdded });
  } catch (err) {
    console.error('[RSS Poll] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
