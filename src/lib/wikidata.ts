/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Politician = {
  name: string;
  imageUrl: string;
  partyName: string;
  partyWikidataId: string;
  personWikidataId: string;
};

export const PARTIES = [
  "CDU",
  "AfD",
  "SPD",
  "GRÜNE",
  "Die Linke",
  "CSU",
  "BSW",
  "FDP",
];

type AbgeordnetenwatchPolitician = {
  id: number;
  label: string;
  qid_wikidata: string | null;
  party?: {
    label?: string;
  } | null;
};

type AbgeordnetenwatchResponse = {
  meta?: {
    result?: {
      total?: number;
    };
  };
  data?: AbgeordnetenwatchPolitician[];
};

type WikidataClaim = {
  mainsnak?: {
    datavalue?: {
      value?: unknown;
    };
  };
};

type WikidataEntityResponse = {
  entities?: Record<string, {
    claims?: Record<string, WikidataClaim[]>;
  }>;
};

export function normalizePartyName(partyName: string): string | null {
  const name = partyName
    .replace(/\u00ad/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const upperName = name.toUpperCase();
  
  if (name.includes("Sozialdemokratische Partei Deutschlands") || upperName === "SPD") return "SPD";
  if (name.includes("Christlich Demokratische Union") || upperName === "CDU") return "CDU";
  if (name.includes("Christlich-Soziale Union") || upperName === "CSU") return "CSU";
  if (name.includes("Bündnis 90") || upperName.includes("DIE GRÜNEN") || upperName === "GRÜNE") return "GRÜNE";
  if (name.includes("Freie Demokratische Partei") || upperName === "FDP") return "FDP";
  if (name.includes("Alternative für Deutschland") || upperName === "AFD") return "AfD";
  if (name.includes("Die Linke") || upperName === "LINKE") return "Die Linke";
  if (name.includes("Bündnis Sahra Wagenknecht") || upperName === "BSW") return "BSW";

  if (PARTIES.includes(name)) return name;

  return null;
}

const ABGEORDNETENWATCH_PAGE_SIZE = 80;
const ABGEORDNETENWATCH_TOTAL_WITH_WIKIDATA = 2724;
const CACHE_KEY = 'party-rate-politician-pool-v4';
const CACHE_TTL = 1000 * 60 * 60 * 12;
const LIVE_REFRESH_COOLDOWN = 1000 * 60 * 5;

function commonsFileUrl(fileName: string): string {
  return `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(fileName)}`;
}

const FALLBACK_POLITICIANS: Politician[] = [
  {
    name: "Olaf Scholz",
    imageUrl: commonsFileUrl("Olaf Scholz 2024.jpg"),
    partyName: "SPD",
    partyWikidataId: "Q49768",
    personWikidataId: "Q61053",
  },
  {
    name: "Friedrich Merz",
    imageUrl: commonsFileUrl("2024-08-21 Friedrich Merz in Erfurt 2024 STP 3041 by Stepro (3x4 cropped).jpg"),
    partyName: "CDU",
    partyWikidataId: "Q49762",
    personWikidataId: "Q566257",
  },
  {
    name: "Markus Söder",
    imageUrl: commonsFileUrl("2023-10-08 Wahlabend Bayern by Sandro Halank–052.jpg"),
    partyName: "CSU",
    partyWikidataId: "Q1023134",
    personWikidataId: "Q50664",
  },
  {
    name: "Annalena Baerbock",
    imageUrl: commonsFileUrl("Annalena Baerbock.jpg"),
    partyName: "GRÜNE",
    partyWikidataId: "Q49766",
    personWikidataId: "Q2514",
  },
  {
    name: "Robert Habeck",
    imageUrl: commonsFileUrl("Robert Habeck 2021 in Kiel 20.jpg"),
    partyName: "GRÜNE",
    partyWikidataId: "Q49766",
    personWikidataId: "Q109943",
  },
  {
    name: "Christian Lindner",
    imageUrl: commonsFileUrl("2020-02-14 Christian Lindner (Bundestagsprojekt 2020) by Sandro Halank–2.jpg"),
    partyName: "FDP",
    partyWikidataId: "Q13124",
    personWikidataId: "Q85806",
  },
  {
    name: "Alice Weidel",
    imageUrl: commonsFileUrl("Alice Weidel.jpg"),
    partyName: "AfD",
    partyWikidataId: "Q6721203",
    personWikidataId: "Q27975838",
  },
  {
    name: "Sahra Wagenknecht",
    imageUrl: commonsFileUrl("2014-09-11 - Sahra Wagenknecht MdB - 8301.jpg"),
    partyName: "BSW",
    partyWikidataId: "Q124353681",
    personWikidataId: "Q77193",
  },
  {
    name: "Heidi Reichinnek",
    imageUrl: commonsFileUrl("Official Portrait of Heidi Reichinnek.png"),
    partyName: "Die Linke",
    partyWikidataId: "Q49764",
    personWikidataId: "Q108163585",
  },
  {
    name: "Cem Özdemir",
    imageUrl: commonsFileUrl("16-09-02-Cem Özdemir-RalfR-RR2 4940.jpg"),
    partyName: "GRÜNE",
    partyWikidataId: "Q49766",
    personWikidataId: "Q12839",
  },
  {
    name: "Lars Klingbeil",
    imageUrl: commonsFileUrl("2021-08-21 Lars Klingbeil 0219.JPG"),
    partyName: "SPD",
    partyWikidataId: "Q49768",
    personWikidataId: "Q1806261",
  },
];

function shuffledPoliticians(politicians: Politician[]): Politician[] {
  return [...politicians].sort(() => 0.5 - Math.random());
}

function getAbgeordnetenwatchUrl(page: number): string {
  const localUrl = new URL('/api/abgeordnetenwatch/politicians', window.location.origin);
  localUrl.searchParams.set('qid_wikidata[ne]', '');
  localUrl.searchParams.set('page', page.toString());
  localUrl.searchParams.set('pager_limit', ABGEORDNETENWATCH_PAGE_SIZE.toString());

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return localUrl.toString();
  }

  const remoteUrl = new URL('https://www.abgeordnetenwatch.de/api/v2/politicians');
  remoteUrl.search = localUrl.search;
  return remoteUrl.toString();
}

function getWikidataEntitiesUrl(ids: string[]): string {
  const joinedIds = ids.join('|');

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const localUrl = new URL('/api/wikidata/entities', window.location.origin);
    localUrl.searchParams.set('ids', joinedIds);
    return localUrl.toString();
  }

  const remoteUrl = new URL('https://www.wikidata.org/w/api.php');
  remoteUrl.searchParams.set('action', 'wbgetentities');
  remoteUrl.searchParams.set('ids', joinedIds);
  remoteUrl.searchParams.set('props', 'claims');
  remoteUrl.searchParams.set('format', 'json');
  remoteUrl.searchParams.set('origin', '*');
  return remoteUrl.toString();
}

async function fetchJson<T>(url: string, timeoutMs = 4500): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, { method: 'GET', signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API error ${response.status}:`, errorText.substring(0, 500));
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

function getImageFileName(entity: WikidataEntityResponse['entities'][string] | undefined): string | null {
  const value = entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
  return typeof value === 'string' ? value : null;
}

function getPartyWikidataId(entity: WikidataEntityResponse['entities'][string] | undefined): string {
  const value = entity?.claims?.P102?.[0]?.mainsnak?.datavalue?.value;
  if (typeof value === 'object' && value && 'id' in value && typeof value.id === 'string') {
    return value.id;
  }

  return '';
}

async function loadAbgeordnetenwatchPage(page: number): Promise<AbgeordnetenwatchResponse> {
  return fetchJson<AbgeordnetenwatchResponse>(getAbgeordnetenwatchUrl(page));
}

async function fetchWikidataEntities(qids: string[]): Promise<WikidataEntityResponse> {
  return fetchJson<WikidataEntityResponse>(getWikidataEntitiesUrl(qids), 5500);
}

async function loadPoliticianPool(): Promise<Politician[]> {
  const randomPageCount = Math.ceil(ABGEORDNETENWATCH_TOTAL_WITH_WIKIDATA / ABGEORDNETENWATCH_PAGE_SIZE);
  const pages = new Set<number>();

  while (pages.size < 2) {
    pages.add(1 + Math.floor(Math.random() * randomPageCount));
  }

  const pageResponses = await Promise.all([...pages].map(loadAbgeordnetenwatchPage));
  const politicians = pageResponses
    .flatMap(response => Array.isArray(response.data) ? response.data : [])
    .filter(politician => politician.qid_wikidata && normalizePartyName(politician.party?.label || ''));

  const uniqueByQid = new Map<string, AbgeordnetenwatchPolitician>();
  for (const politician of politicians) {
    if (politician.qid_wikidata) {
      uniqueByQid.set(politician.qid_wikidata, politician);
    }
  }

  const qids = [...uniqueByQid.keys()];
  const entities: WikidataEntityResponse['entities'] = {};

  const chunks: string[][] = [];
  for (let index = 0; index < qids.length; index += 50) {
    chunks.push(qids.slice(index, index + 50));
  }

  for (const chunk of chunks) {
    try {
      const response = await fetchWikidataEntities(chunk);
      Object.assign(entities, response.entities);
    } catch (error) {
      console.warn('Skipping one Wikidata entity batch:', error);
    }
  }

  const mappedPoliticians: Politician[] = [];
  for (const [qid, politician] of uniqueByQid) {
    const entity = entities?.[qid];
    const imageFileName = getImageFileName(entity);
    const partyName = normalizePartyName(politician.party?.label || '');

    if (imageFileName && partyName) {
      mappedPoliticians.push({
        name: politician.label,
        imageUrl: commonsFileUrl(imageFileName),
        partyName,
        partyWikidataId: getPartyWikidataId(entity),
        personWikidataId: qid,
      });
    }
  }

  return shuffledPoliticians(mappedPoliticians);
}

function readCachedPoliticians(): Politician[] {
  try {
    const rawCache = localStorage.getItem(CACHE_KEY);
    if (!rawCache) return [];

    const parsed = JSON.parse(rawCache) as { savedAt?: number; politicians?: Politician[] };
    if (!parsed.savedAt || Date.now() - parsed.savedAt > CACHE_TTL) {
      return [];
    }

    return Array.isArray(parsed.politicians) ? parsed.politicians : [];
  } catch {
    return [];
  }
}

function writeCachedPoliticians(politicians: Politician[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), politicians }));
  } catch {
    // localStorage can be unavailable in private or restricted browser contexts.
  }
}

let politicianPool: Politician[] = readCachedPoliticians();
let liveRefreshPromise: Promise<Politician[]> | null = null;
let lastLiveRefreshAttempt = 0;
let lastLiveRefreshFailure = 0;

function ensureFallbackPool(): void {
  if (politicianPool.length === 0) {
    politicianPool = shuffledPoliticians(FALLBACK_POLITICIANS);
  }
}

function shouldRefreshLivePool(): boolean {
  const now = Date.now();
  return (
    !liveRefreshPromise &&
    now - lastLiveRefreshAttempt > LIVE_REFRESH_COOLDOWN &&
    now - lastLiveRefreshFailure > LIVE_REFRESH_COOLDOWN
  );
}

function refreshLivePoliticians(): Promise<Politician[]> {
  if (!liveRefreshPromise) {
    lastLiveRefreshAttempt = Date.now();
    liveRefreshPromise = loadPoliticianPool()
      .then(livePoliticians => {
        if (livePoliticians.length > 0) {
          const knownIds = new Set(politicianPool.map(politician => politician.personWikidataId));
          politicianPool = shuffledPoliticians([
            ...politicianPool,
            ...livePoliticians.filter(politician => !knownIds.has(politician.personWikidataId)),
          ]);
          writeCachedPoliticians(politicianPool);
        }

        return politicianPool;
      })
      .catch(error => {
        lastLiveRefreshFailure = Date.now();
        console.warn('Using cached or curated politician data because live APIs are unavailable:', error);
        ensureFallbackPool();

        return politicianPool;
      })
      .finally(() => {
        liveRefreshPromise = null;
      });
  }

  return liveRefreshPromise;
}

export function getPartyOptions(correctParty: string, allowedParties: string[] = PARTIES): string[] {
  const allowedPartySet = new Set(allowedParties);
  const optionSet = new Set([
    ...PARTIES.filter(partyName => allowedPartySet.has(partyName)),
    ...politicianPool
      .map(politician => politician.partyName)
      .filter(partyName => allowedPartySet.has(partyName)),
  ]);
  optionSet.delete(correctParty);

  return shuffledPoliticians([...optionSet].map(partyName => ({
    name: partyName,
    imageUrl: '',
    partyName,
    partyWikidataId: '',
    personWikidataId: partyName,
  }))).map(option => option.partyName);
}

function findPoliticianCandidates(excludeIds: string[], allowedParties: string[]): Politician[] {
  const allowedPartySet = new Set(allowedParties);
  const available = politicianPool.filter(p =>
    allowedPartySet.has(p.partyName) && !excludeIds.includes(p.personWikidataId)
  );

  return available.length > 0
    ? available
    : shuffledPoliticians([
        ...politicianPool,
        ...FALLBACK_POLITICIANS,
      ].filter(p => allowedPartySet.has(p.partyName)));
}

export async function fetchRandomPolitician(excludeIds: string[] = [], allowedParties: string[] = PARTIES): Promise<Politician> {
  ensureFallbackPool();

  if (politicianPool.length <= FALLBACK_POLITICIANS.length && shouldRefreshLivePool()) {
    void refreshLivePoliticians();
  }

  let candidates = findPoliticianCandidates(excludeIds, allowedParties);
  if (candidates.length === 0 && shouldRefreshLivePool()) {
    await refreshLivePoliticians();
    candidates = findPoliticianCandidates(excludeIds, allowedParties);
  }

  if (candidates.length === 0) {
    throw new Error('Could not find a suitable politician.');
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}
