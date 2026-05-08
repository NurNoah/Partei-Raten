export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const ids = Array.isArray(request.query?.ids)
    ? request.query.ids.join('|')
    : request.query?.ids || '';

  const targetUrl = new URL('https://www.wikidata.org/w/api.php');
  targetUrl.searchParams.set('action', 'wbgetentities');
  targetUrl.searchParams.set('ids', ids);
  targetUrl.searchParams.set('props', 'claims');
  targetUrl.searchParams.set('format', 'json');

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
    console.error('Wikidata proxy failed:', error);
    response.status(502).json({ error: 'API request failed' });
  } finally {
    clearTimeout(timeout);
  }
}
