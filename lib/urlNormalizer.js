export function normalizeUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);

    // Remove tracking parameters
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'ref', 'fbclid', 'gclid', 'source', 'ref_src', 'ref_url',
    ];
    trackingParams.forEach(p => url.searchParams.delete(p));

    // Normalize hostname
    url.hostname = url.hostname.replace(/^www\./, '').toLowerCase();
    url.hash = '';

    // Remove trailing slashes
    let path = url.pathname.replace(/\/+$/, '') || '/';

    return `${url.protocol}//${url.hostname}${path}${url.search}`;
  } catch {
    return rawUrl;
  }
}

export function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}
