import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = await getDb();
  const categories = await db.rssCategory.findMany({
    orderBy: { createdAt: 'asc' },
    include: { rssSources: { orderBy: { createdAt: 'asc' } } },
  });
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const { name, label, emoji, color } = await req.json();
  if (!name || !label || !emoji || !color) {
    return NextResponse.json({ error: 'name, label, emoji, and color are required' }, { status: 400 });
  }

  const db = await getDb();

  const existing = await db.rssCategory.findUnique({ where: { name } });
  if (existing) {
    return NextResponse.json({ error: 'Category name already exists' }, { status: 409 });
  }

  const category = await db.rssCategory.create({ data: { name, label, emoji, color } });
  return NextResponse.json({ category }, { status: 201 });
}
