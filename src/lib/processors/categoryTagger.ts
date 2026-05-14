// lib/processors/categoryTagger.ts
import { Category } from '../types';

const KEYWORDS: Record<Category, string[]> = {
  ai: [
    'artificial intelligence', 'machine learning', 'llm', 'gpt', 'neural',
    'openai', 'anthropic', 'gemini', 'deep learning', 'transformer', 'embedding', 'nlp',
    'chatgpt', 'large language model', 'generative ai', 'diffusion model', 'copilot',
    'ai agent', 'rag', 'fine-tuning', 'claude', 'deepseek',
  ],
  cybersecurity: [
    'ransomware', 'malware', 'vulnerability', 'breach', 'cve', 'zero-day',
    'phishing', 'siem', 'soc', 'threat', 'exploit', 'patch', 'firewall',
    'hacker', 'cybersecurity', 'infosec', 'security', 'attack', 'botnet',
    'encryption', 'mfa', 'authentication', 'sso',
  ],
  cloud: [
    'cloud computing', 'aws', 'azure', 'google cloud', 'gcp', 'serverless',
    'lambda', 's3', 'ec2', 'cloudfront', 'sagemaker', 'cloud native',
    'multi-cloud', 'hybrid cloud', 'cdn', 'edge computing',
  ],
  databases: [
    'postgresql', 'mysql', 'mongodb', 'redis', 'cassandra', 'sqlite', 'oracle',
    'database', 'vector db', 'sql', 'nosql', 'clickhouse', 'snowflake',
    'supabase', 'planetscale', 'turso', 'duckdb', 'query optimization',
  ],
  infrastructure: [
    'kubernetes', 'docker', 'terraform', 'ansible', 'devops', 'ci/cd',
    'serverless', 'edge', 'cdn', 'load balancer', 'microservices',
    'helm', 'gitops', 'cloud', 'infrastructure', 'sre', 'observability',
  ],
  devops: [
    'devops', 'ci/cd', 'sre', 'platform engineering', 'gitops',
    'jenkins', 'github actions', 'gitlab ci', 'argocd', 'terraform',
    'monitoring', 'grafana', 'prometheus', 'incident management',
  ],
  startup: [
    'startup', 'venture capital', 'funding', 'series a', 'series b',
    'unicorn', 'ipo', 'acquisition', 'founder', 'y combinator',
    'seed round', 'pre-seed', 'valuation', 'pitch deck', 'saas',
  ],
};

export function detectCategory(text: string): Category {
  const lower = text.toLowerCase();
  const scores: Record<Category, number> = {
    ai: 0, cybersecurity: 0, cloud: 0, databases: 0,
    infrastructure: 0, devops: 0, startup: 0,
  };

  for (const [cat, keywords] of Object.entries(KEYWORDS) as [Category, string[]][]) {
    scores[cat] = keywords.filter(kw => lower.includes(kw)).length;
  }

  const best = (Object.entries(scores) as [Category, number][])
    .sort((a, b) => b[1] - a[1])[0];

  return best[1] > 0 ? best[0] : 'ai';
}

export function extractTags(text: string, limit = 5): string[] {
  const lower = text.toLowerCase();
  const found: Array<{ tag: string; count: number }> = [];

  for (const [, keywords] of Object.entries(KEYWORDS) as [Category, string[]][]) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        const existing = found.find(f => f.tag === kw);
        if (existing) {
          existing.count++;
        } else {
          found.push({ tag: kw, count: 1 });
        }
      }
    }
  }

  return found
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(f => f.tag);
}
