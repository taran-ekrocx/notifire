import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = await getDb();
  const settings = await db.appSetting.findMany();
  const map: Record<string, string> = {};
  for (const s of settings) map[s.key] = s.value;
  return NextResponse.json({ settings: map });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const db = await getDb();

  const updates = body as Record<string, string>;
  for (const [key, value] of Object.entries(updates)) {
    if (typeof value !== 'string') continue;
    await db.appSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  return NextResponse.json({ success: true });
}
