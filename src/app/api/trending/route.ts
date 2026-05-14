import { NextResponse } from 'next/server';
import { fetchAllSources } from '@/lib/fetchers/aggregator';

export async function GET() {
  try {
    const articles = await fetchAllSources('all', true);

    return NextResponse.json({
      success: true,
      articles,
    });
  } catch (error) {
    console.error('[Trending API]', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch trending news',
      },
      { status: 500 }
    );
  }
}