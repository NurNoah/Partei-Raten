const ALLOWED_QUERY_PARAMS = new Set([
  'page',
  'pager_limit',
  'qid_wikidata[ne]',
]);

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const targetUrl = new URL('https://www.abgeordnetenwatch.de/api/v2/politicians');
  for (const [key, value] of Object.entries(request.query || {})) {
    if (!ALLOWED_QUERY_PARAMS.has(key)) continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        targetUrl.searchParams.append(key, item);
      }
    } else if (typeof value === 'string') {
      targetUrl.searchParams.set(key, value);
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const apiResponse = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Partei Raten/1.0 (https://partei-raten.vercel.app)',
      },
    });

    const body = await apiResponse.text();
    response.status(apiResponse.status);
    response.setHeader('Content-Type', apiResponse.headers.get('content-type') || 'application/json');
    response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    response.send(body);
  } catch (error) {
    console.error('Abgeordnetenwatch proxy failed:', error);
    response.status(502).json({ error: 'API request failed' });
  } finally {
    clearTimeout(timeout);
  }
}
