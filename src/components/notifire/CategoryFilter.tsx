'use client';

import { Category, CATEGORY_META } from '@/lib/types';
import { motion } from 'framer-motion';

interface CategoryFilterProps {
  activeCategory: Category | 'all';
  onCategoryChange: (category: Category | 'all') => void;
}

const ALL_PILL = { label: 'All', emoji: '📰', color: '#a78bfa' };

export function CategoryFilter({ activeCategory, onCategoryChange }: CategoryFilterProps) {
  const categories: (Category | 'all')[] = ['all', 'ai', 'cybersecurity', 'cloud', 'databases', 'infrastructure', 'devops', 'startup'];

  const getMeta = (cat: Category | 'all') => {
    if (cat === 'all') return ALL_PILL;
    return CATEGORY_META[cat];
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" role="tablist" aria-label="Category filter">
      {categories.map((cat) => {
        const meta = getMeta(cat);
        const isActive = activeCategory === cat;

        return (
          <button
            key={cat}
            role="tab"
            aria-selected={isActive}
            onClick={() => onCategoryChange(cat)}
            className={`
              relative flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5
              text-sm font-medium transition-all duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
              ${
                isActive
                  ? 'text-white shadow-lg'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
              }
            `}
            style={
              isActive
                ? { backgroundColor: meta.color, boxShadow: `0 2px 12px ${meta.color}40` }
                : undefined
            }
          >
            <span className="text-base leading-none">{meta.emoji}</span>
            <span>{meta.label}</span>
            {isActive && (
              <motion.div
                layoutId="category-active"
                className="absolute inset-0 rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
