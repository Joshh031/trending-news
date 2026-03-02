const URL_REGEX = /https?:\/\/[^\s<>"')\]]+/gi;

const SOCIAL_DOMAINS = [
  'reddit.com', 'redd.it', 'twitter.com', 'x.com',
  'bsky.app', 'bsky.social', 'youtube.com', 'youtu.be',
  'instagram.com', 'facebook.com', 'tiktok.com',
];

export function extractUrlsFromText(text) {
  if (!text) return [];
  const matches = text.match(URL_REGEX) || [];
  return matches.filter(url => !isSocialMediaUrl(url));
}

function isSocialMediaUrl(url) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    return SOCIAL_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d));
  } catch {
    return false;
  }
}
