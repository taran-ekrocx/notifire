// src/app/api/generate-image/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const prompt = body.prompt || 'Tech news illustration';

    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;

    return NextResponse.json({
      success: true,
      imageUrl,
    });
  } catch (error) {
    console.error('[ImageGen]', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate image',
      },
      { status: 500 }
    );
  }
}