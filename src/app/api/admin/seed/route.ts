import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { CATEGORY_META } from '@/lib/types';
import { RSS_SOURCES } from '@/lib/config/rss-sources';

export async function POST() {
  const db = await getDb();

  for (const [name, meta] of Object.entries(CATEGORY_META)) {
    const cat = await db.rssCategory.upsert({
      where: { name },
      update: { label: meta.label, emoji: meta.emoji, color: meta.color },
      create: { name, label: meta.label, emoji: meta.emoji, color: meta.color },
    });

    const sources = (RSS_SOURCES as Record<string, Array<{ url: string; authority: number }>>)[name] ?? [];
    for (const src of sources) {
      await db.rssSource.upsert({
        where: { categoryId_url: { categoryId: cat.id, url: src.url } },
        update: { authority: src.authority },
        create: { url: src.url, authority: src.authority, categoryId: cat.id },
      });
    }
  }

  return NextResponse.json({ success: true, message: 'Seeded categories and RSS sources from defaults' });
}
