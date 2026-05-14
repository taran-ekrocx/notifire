'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRef } from 'react';

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
}

export function SearchBar({ query, onQueryChange }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative flex items-center">
      <Search className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
      <Input
        ref={inputRef}
        type="text"
        placeholder="Search articles..."
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        className="pl-9 pr-9 h-9 bg-secondary/30 border-secondary/50 focus-visible:bg-secondary/50"
      />
      {query && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 size-7"
          onClick={() => {
            onQueryChange('');
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
