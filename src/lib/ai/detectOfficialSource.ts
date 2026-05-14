// lib/ai/detectOfficialSource.ts

import OpenAI from 'openai';

type OfficialSourceCandidate = {
  name: string;
  domains: string[];
};

export type OfficialSourceDetection = {
  authorized: boolean;
  officialSourceName: string | null;
  officialSourceUrl: string | null;
  reason: string;
};

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

const KNOWN_OFFICIAL_SOURCES: OfficialSourceCandidate[] = [
  {
    name: 'OpenAI',
    domains: ['openai.com'],
  },
  {
    name: 'Anthropic',
    domains: ['anthropic.com'],
  },
  {
    name: 'Google',
    domains: ['blog.google', 'googleblog.com', 'google.com'],
  },
  {
    name: 'Microsoft',
    domains: ['microsoft.com', 'blogs.microsoft.com'],
  },
  {
    name: 'Amazon Web Services',
    domains: ['aws.amazon.com', 'amazon.com'],
  },
  {
    name: 'NVIDIA',
    domains: ['nvidia.com'],
  },
  {
    name: 'Meta',
    domains: ['meta.com', 'about.fb.com'],
  },
  {
    name: 'Apple',
    domains: ['apple.com'],
  },
  {
    name: 'Kubernetes',
    domains: ['kubernetes.io'],
  },
  {
    name: 'PostgreSQL',
    domains: ['postgresql.org'],
  },
  {
    name: 'Redis',
    domains: ['redis.io'],
  },
  {
    name: 'HashiCorp',
    domains: ['hashicorp.com'],
  },
];

export async function detectOfficialSource(
  title: string,
  description: string,
  url: string
): Promise<OfficialSourceDetection> {
  const candidate =
    detectKnownSource(title, description) ||
    (await identifyOfficialSource(title, description, url));

  if (!candidate) {
    return {
      authorized: false,
      officialSourceName: null,
      officialSourceUrl: null,
      reason: 'Could not identify an official source candidate',
    };
  }

  const officialArticleUrl =
    getUrlIfOfficial(url, candidate.domains) ||
    (await findOfficialArticleUrl(title, candidate.domains));

  if (!officialArticleUrl) {
    return {
      authorized: false,
      officialSourceName: candidate.name,
      officialSourceUrl: null,
      reason: `No matching article found on official ${candidate.name} domains`,
    };
  }

  return {
    authorized: true,
    officialSourceName: candidate.name,
    officialSourceUrl: officialArticleUrl,
    reason: `Matched official ${candidate.name} source`,
  };
}

function detectKnownSource(
  title: string,
  description: string
): OfficialSourceCandidate | null {
  const text = `${title} ${description}`.toLowerCase();

  return (
    KNOWN_OFFICIAL_SOURCES.find((source) => {
      const normalizedName = source.name.toLowerCase();
      const simpleName = normalizedName.replace(/[^a-z0-9]/g, '');

      return (
        text.includes(normalizedName) ||
        text.replace(/[^a-z0-9]/g, '').includes(simpleName)
      );
    }) || null
  );
}

async function identifyOfficialSource(
  title: string,
  description: string,
  url: string
): Promise<OfficialSourceCandidate | null> {
  if (!process.env.OPENROUTER_API_KEY) {
    return null;
  }

  try {
    const prompt = `
Analyze this tech news article and identify the company/product owner whose official source should verify the news.

TITLE:
${title}

DESCRIPTION:
${description}

ARTICLE URL:
${url}

Return STRICT JSON only:
{
  "name": "OpenAI",
  "domains": ["openai.com"]
}

Rules:
- Return the company/org/product owner, not the third-party publisher.
- domains must be official company/org domains only.
- Do not include news sites unless they are the company itself.
- Return {"name": null, "domains": []} if unsure.
`;

    const response = await client.chat.completions.create({
      model: 'openai/gpt-4.1-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(
      response.choices[0]?.message?.content || '{}'
    );

    if (!parsed.name || !Array.isArray(parsed.domains)) {
      return null;
    }

    const domains = parsed.domains
      .map((domain: unknown) =>
        typeof domain === 'string' ? normalizeHostname(domain) : null
      )
      .filter(Boolean) as string[];

    if (!domains.length) {
      return null;
    }

    return {
      name: parsed.name,
      domains,
    };
  } catch (err) {
    console.warn('[AI Official Source Identify Failed]', err);
    return null;
  }
}

function getUrlIfOfficial(
  articleUrl: string,
  officialDomains: string[]
) {
  const hostname = normalizeHostname(articleUrl);

  if (
    hostname &&
    officialDomains.some((domain) => isSameOrSubdomain(hostname, domain))
  ) {
    return articleUrl;
  }

  return null;
}

async function findOfficialArticleUrl(
  title: string,
  officialDomains: string[]
) {
  const searchTitle = title
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 10)
    .join(' ');

  for (const domain of officialDomains) {
    const fromSitemap = await findInSitemap(searchTitle, domain);
    if (fromSitemap) return fromSitemap;

    const fromSearch = await findWithDuckDuckGo(searchTitle, domain);
    if (fromSearch) return fromSearch;
  }

  return null;
}

async function findInSitemap(
  title: string,
  domain: string
) {
  const sitemapUrls = [
    `https://${domain}/sitemap.xml`,
    `https://${domain}/post-sitemap.xml`,
    `https://${domain}/blog-sitemap.xml`,
  ];

  const titleTokens = tokenize(title);

  for (const sitemapUrl of sitemapUrls) {
    try {
      const response = await fetch(sitemapUrl, {
        headers: {
          'User-Agent': 'NotifireBot/1.0',
        },
        cache: 'no-store',
      });

      if (!response.ok) continue;

      const xml = await response.text();
      const urls = Array.from(xml.matchAll(/<loc>(.*?)<\/loc>/g))
        .map((match) => decodeHtml(match[1]))
        .filter((loc) => isOfficialUrl(loc, [domain]));

      const match = urls.find((loc) => {
        const urlTokens = tokenize(loc.replace(/[-_/]/g, ' '));
        return hasTokenOverlap(titleTokens, urlTokens);
      });

      if (match) return match;
    } catch {
      // Try the next official source lookup path.
    }
  }

  return null;
}

async function findWithDuckDuckGo(
  title: string,
  domain: string
) {
  try {
    const query = `site:${domain} ${title}`;
    const response = await fetch(
      `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) return null;

    const html = await response.text();
    const candidates = Array.from(
      html.matchAll(/href="([^"]+)"/g)
    )
      .map((match) => decodeDuckDuckGoUrl(decodeHtml(match[1])))
      .filter((candidate): candidate is string =>
        Boolean(candidate && isOfficialUrl(candidate, [domain]))
      );

    return candidates[0] || null;
  } catch {
    return null;
  }
}

function isOfficialUrl(
  url: string,
  officialDomains: string[]
) {
  const hostname = normalizeHostname(url);

  return Boolean(
    hostname &&
      officialDomains.some((domain) => isSameOrSubdomain(hostname, domain))
  );
}

function normalizeHostname(value: string) {
  try {
    const withProtocol = /^https?:\/\//i.test(value)
      ? value
      : `https://${value}`;

    return new URL(withProtocol).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

function isSameOrSubdomain(
  hostname: string,
  domain: string
) {
  const normalizedDomain = domain.replace(/^www\./, '').toLowerCase();
  return (
    hostname === normalizedDomain ||
    hostname.endsWith(`.${normalizedDomain}`)
  );
}

function tokenize(value: string) {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter(
        (token) =>
          token.length > 3 &&
          ![
            'with',
            'from',
            'that',
            'this',
            'into',
            'over',
            'news',
            'blog',
          ].includes(token)
      )
  );
}

function hasTokenOverlap(
  titleTokens: Set<string>,
  candidateTokens: Set<string>
) {
  const tokens = Array.from(titleTokens);
  if (!tokens.length) return false;

  const matches = tokens.filter((token) => candidateTokens.has(token));
  return matches.length >= Math.min(3, tokens.length);
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x2F;/g, '/')
    .replace(/&#39;/g, "'");
}

function decodeDuckDuckGoUrl(value: string) {
  try {
    if (value.startsWith('//duckduckgo.com/l/?')) {
      const parsed = new URL(`https:${value}`);
      return parsed.searchParams.get('uddg');
    }

    if (value.startsWith('/l/?')) {
      const parsed = new URL(`https://duckduckgo.com${value}`);
      return parsed.searchParams.get('uddg');
    }

    if (/^https?:\/\//i.test(value)) {
      return value;
    }
  } catch {
    return null;
  }

  return null;
}
