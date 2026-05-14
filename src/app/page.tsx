'use client';

import { ThemeProvider } from 'next-themes';
import { NewsFeed } from '@/components/notifire/NewsFeed';

export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <NewsFeed />
    </ThemeProvider>
  );
}
