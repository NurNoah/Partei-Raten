const PARTY_NAME_BY_QID = new Map([
  ['Q49762', 'CDU'],
  ['Q6721203', 'AfD'],
  ['Q49768', 'SPD'],
  ['Q49766', 'GRÜNE'],
  ['Q49764', 'Die Linke'],
  ['Q1023134', 'CSU'],
  ['Q124353681', 'BSW'],
  ['Q13124', 'FDP'],
]);

const PARTY_VALUES = [...PARTY_NAME_BY_QID.keys()].map(qid => `wd:${qid}`).join(' ');

function getQidFromWikidataUrl(url) {
  return typeof url === 'string' ? url.split('/').pop() || '' : '';
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const query = `
    SELECT ?person ?personLabel ?image ?party WHERE {
      VALUES ?party { ${PARTY_VALUES} }
      ?person wdt:P31 wd:Q5;
              wdt:P102 ?party;
              wdt:P18 ?image.
      { ?person wdt:P106 wd:Q82955. }
      UNION
      { ?person wdt:P39 ?office. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "de,en". }
    }
    GROUP BY ?person ?personLabel ?image ?party
    ORDER BY RAND()
    LIMIT 320
  `;

  const targetUrl = new URL('https://query.wikidata.org/sparql');
  targetUrl.searchParams.set('query', query);
  targetUrl.searchParams.set('format', 'json');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);

  try {
    const apiResponse = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'application/sparql-results+json',
        'User-Agent': 'Partei Raten/1.0 (https://partei-raten.vercel.app; https://github.com/NurNoah/Partei-Raten)',
      },
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      response.status(apiResponse.status).json({
        error: 'Wikidata SPARQL request failed',
        detail: errorText.slice(0, 500),
      });
      return;
    }

    const data = await apiResponse.json();
    const politiciansById = new Map();

    for (const binding of data?.results?.bindings || []) {
      const personWikidataId = getQidFromWikidataUrl(binding.person?.value);
      const partyWikidataId = getQidFromWikidataUrl(binding.party?.value);
      const partyName = PARTY_NAME_BY_QID.get(partyWikidataId);
      const name = binding.personLabel?.value;
      const imageUrl = binding.image?.value;

      if (!personWikidataId || !partyName || !name || !imageUrl) continue;

      politiciansById.set(personWikidataId, {
        name,
        imageUrl,
        partyName,
        partyWikidataId,
        personWikidataId,
      });
    }

    const politicians = [...politiciansById.values()];
    response.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    response.status(200).json({
      source: 'wikidata-sparql',
      count: politicians.length,
      politicians,
    });
  } catch (error) {
    console.error('Politician SPARQL proxy failed:', error);
    response.status(502).json({ error: 'Politician API request failed' });
  } finally {
    clearTimeout(timeout);
  }
}
