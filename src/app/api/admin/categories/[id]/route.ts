import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const db = await getDb();

  const category = await db.rssCategory.update({
    where: { id },
    data: {
      ...(body.label !== undefined && { label: body.label }),
      ...(body.emoji !== undefined && { emoji: body.emoji }),
      ...(body.color !== undefined && { color: body.color }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  });
  return NextResponse.json({ category });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  await db.rssCategory.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
