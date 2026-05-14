'use client';

import { Flame, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface TrendingBadgeProps {
  score: number;
  socialBoost?: number;
}

export function TrendingBadge({ score, socialBoost }: TrendingBadgeProps) {
  if (score <= 50) return null;

  const hasSocial = (socialBoost ?? 0) > 5;

  const intensity =
    score >= 80 ? 'bg-orange-500/15 text-orange-500 border-orange-500/30' :
    score >= 65 ? 'bg-amber-500/15 text-amber-500 border-amber-500/30' :
    'bg-yellow-500/15 text-yellow-500 border-yellow-500/30';

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      className="flex items-center gap-1"
    >
      <Badge
        variant="outline"
        className={`gap-1 text-[10px] font-semibold ${intensity}`}
      >
        <Flame className="size-3" />
        {score >= 80 ? 'Hot' : 'Rising'}
      </Badge>
      {hasSocial && (
        <Badge
          variant="outline"
          className="gap-1 text-[10px] font-semibold bg-blue-500/15 text-blue-500 border-blue-500/30"
        >
          <MessageCircle className="size-3" />
          Social
        </Badge>
      )}
    </motion.div>
  );
}
