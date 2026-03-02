import redis from './redis.js';
import { normalizeUrl, extractDomain } from './urlNormalizer.js';
import { isPolitical } from './politicsFilter.js';
import { classifyCategory } from './categoryClassifier.js';

const SOURCE_KEYS = {
  hackerNews: 'articles:hn',
  reddit: 'articles:reddit',
  bluesky: 'articles:bluesky',
  rss: 'articles:rss',
};

const TTL_SECONDS = 48 * 60 * 60;

function decodeHtmlEntities(str) {
  if (!str) return str;
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, '/');
}

// ─── Per-source operations (used by poll endpoints) ───

export async function loadSourceArticles(source) {
  const key = SOURCE_KEYS[source];
  const data = await redis.get(key);
  if (!data) return {};
  return typeof data === 'string' ? JSON.parse(data) : data;
}

export async function saveSourceArticles(source, articles) {
  const key = SOURCE_KEYS[source];
  await redis.set(key, JSON.stringify(articles), { ex: TTL_SECONDS });
}

export function addArticleToSource(existing, rawUrl, title, source, metadata = {}) {
  title = decodeHtmlEntities(title);
  const url = normalizeUrl(rawUrl);
  const domain = extractDomain(url);

  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) return null;
  if (isPolitical(title, url)) return null;

  const now = Date.now();
  let article = existing[url];

  if (!article) {
    article = {
      url,
      title: title || '',
      domain,
      firstSeen: now,
      lastSeen: now,
      sourceData: getEmptySourceData(source),
      category: classifyCategory(title, metadata.sourceHint),
    };
  }

  if (title && title.length > (article.title || '').length) {
    article.title = title;
    article.category = classifyCategory(title, metadata.sourceHint);
  }

  article.lastSeen = now;

  if (source === 'hackerNews') {
    article.sourceData.count = (article.sourceData.count || 0) + 1;
    if (metadata.score) {
      article.sourceData.score = Math.max(article.sourceData.score || 0, metadata.score);
    }
    if (metadata.itemId) {
      article.sourceData.itemIds = article.sourceData.itemIds || [];
      if (!article.sourceData.itemIds.includes(metadata.itemId)) {
        article.sourceData.itemIds.push(metadata.itemId);
      }
    }
  } else if (source === 'reddit') {
    article.sourceData.count = (article.sourceData.count || 0) + 1;
    if (metadata.score) {
      article.sourceData.score = Math.max(article.sourceData.score || 0, metadata.score);
    }
    if (metadata.subreddit) {
      article.sourceData.subreddits = article.sourceData.subreddits || [];
      if (!article.sourceData.subreddits.includes(metadata.subreddit)) {
        article.sourceData.subreddits.push(metadata.subreddit);
      }
    }
  } else if (source === 'bluesky') {
    article.sourceData.count = (article.sourceData.count || 0) + 1;
    if (metadata.postUri) {
      article.sourceData.postUris = article.sourceData.postUris || [];
      if (!article.sourceData.postUris.includes(metadata.postUri)) {
        article.sourceData.postUris.push(metadata.postUri);
      }
    }
  } else if (source === 'rss') {
    article.sourceData.count = (article.sourceData.count || 0) + 1;
    if (metadata.score) {
      article.sourceData.score = Math.max(article.sourceData.score || 0, metadata.score);
    }
    if (metadata.outlet) {
      article.sourceData.outlets = article.sourceData.outlets || [];
      if (!article.sourceData.outlets.includes(metadata.outlet)) {
        article.sourceData.outlets.push(metadata.outlet);
      }
    }
  }

  existing[url] = article;
  return article;
}

function getEmptySourceData(source) {
  if (source === 'hackerNews') return { count: 0, score: 0, itemIds: [] };
  if (source === 'reddit') return { count: 0, score: 0, subreddits: [] };
  if (source === 'bluesky') return { count: 0, postUris: [] };
  if (source === 'rss') return { count: 0, score: 0, outlets: [] };
  return { count: 0 };
}

export function evictStale(existing) {
  const cutoff = Date.now() - (48 * 60 * 60 * 1000);
  for (const url of Object.keys(existing)) {
    if (existing[url].lastSeen < cutoff) {
      delete existing[url];
    }
  }
}

// ─── Merge-on-read (used by GET endpoint) ───

export async function getMergedArticles({ window = '24h', category = 'all', limit = 50 } = {}) {
  const [hnData, redditData, blueskyData, rssData] = await redis.mget(
    'articles:hn', 'articles:reddit', 'articles:bluesky', 'articles:rss'
  );

  const hnArticles = parseSource(hnData);
  const redditArticles = parseSource(redditData);
  const blueskyArticles = parseSource(blueskyData);
  const rssArticles = parseSource(rssData);

  const merged = {};

  function mergeInto(url, article, sourceKey, sourceData) {
    if (merged[url]) {
      merged[url].sources[sourceKey] = sourceData;
      if ((article.title || '').length > (merged[url].title || '').length) {
        merged[url].title = article.title;
        merged[url].category = article.category;
      }
      merged[url].firstSeen = Math.min(merged[url].firstSeen, article.firstSeen);
      merged[url].lastSeen = Math.max(merged[url].lastSeen, article.lastSeen);
    } else {
      merged[url] = {
        url: article.url, title: article.title, domain: article.domain,
        firstSeen: article.firstSeen, lastSeen: article.lastSeen, category: article.category,
        sources: {
          hackerNews: { count: 0, score: 0, itemIds: [] },
          reddit: { count: 0, score: 0, subreddits: [] },
          bluesky: { count: 0, postUris: [] },
          rss: { count: 0, score: 0, outlets: [] },
        },
      };
      merged[url].sources[sourceKey] = sourceData;
    }
  }

  for (const [url, article] of Object.entries(hnArticles)) {
    mergeInto(url, article, 'hackerNews', article.sourceData || { count: 0, score: 0, itemIds: [] });
  }
  for (const [url, article] of Object.entries(redditArticles)) {
    mergeInto(url, article, 'reddit', article.sourceData || { count: 0, score: 0, subreddits: [] });
  }
  for (const [url, article] of Object.entries(blueskyArticles)) {
    mergeInto(url, article, 'bluesky', article.sourceData || { count: 0, postUris: [] });
  }
  for (const [url, article] of Object.entries(rssArticles)) {
    mergeInto(url, article, 'rss', article.sourceData || { count: 0, score: 0, outlets: [] });
  }

  // Filter and sort
  const now = Date.now();
  const windowMs = { '1h': 3600000, '6h': 21600000, '24h': 86400000 }[window] || 86400000;
  const cutoff = now - windowMs;

  let articles = Object.values(merged)
    .map(a => ({
      ...a,
      totalMentions:
        (a.sources.hackerNews.count || 0) +
        (a.sources.reddit.count || 0) +
        (a.sources.bluesky.count || 0) +
        (a.sources.rss.count || 0),
    }))
    .filter(a => a.lastSeen >= cutoff)
    .filter(a => category === 'all' || a.category === category);

  articles.sort((a, b) => {
    if (b.totalMentions !== a.totalMentions) return b.totalMentions - a.totalMentions;
    const scoreA = (a.sources.hackerNews.score || 0) + (a.sources.reddit.score || 0) + (a.sources.rss.score || 0);
    const scoreB = (b.sources.hackerNews.score || 0) + (b.sources.reddit.score || 0) + (b.sources.rss.score || 0);
    return scoreB - scoreA;
  });

  return articles.slice(0, limit);
}

function parseSource(data) {
  if (!data) return {};
  return typeof data === 'string' ? JSON.parse(data) : data;
}
