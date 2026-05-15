import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const db = await getDb();

  const source = await db.rssSource.update({
    where: { id },
    data: {
      ...(body.url !== undefined && { url: body.url }),
      ...(body.authority !== undefined && { authority: body.authority }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
    },
    include: { category: true },
  });
  return NextResponse.json({ source });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  await db.rssSource.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
