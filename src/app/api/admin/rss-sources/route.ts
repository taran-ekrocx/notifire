import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const db = await getDb();
  const categoryId = req.nextUrl.searchParams.get('categoryId');

  const sources = await db.rssSource.findMany({
    where: categoryId ? { categoryId } : undefined,
    orderBy: { createdAt: 'asc' },
    include: { category: true },
  });
  return NextResponse.json({ sources });
}

export async function POST(req: NextRequest) {
  const { categoryId, url, authority } = await req.json();
  if (!categoryId || !url) {
    return NextResponse.json({ error: 'categoryId and url are required' }, { status: 400 });
  }

  const db = await getDb();

  const existing = await db.rssSource.findUnique({ where: { categoryId_url: { categoryId, url } } });
  if (existing) {
    return NextResponse.json({ error: 'This URL already exists in the selected category' }, { status: 409 });
  }

  const source = await db.rssSource.create({
    data: { categoryId, url, authority: authority ?? 0.8 },
    include: { category: true },
  });
  return NextResponse.json({ source }, { status: 201 });
}
