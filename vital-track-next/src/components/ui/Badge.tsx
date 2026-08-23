'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'emerald' | 'electric' | 'hybrid' | 'mucus' | 'warning' | 'purple' | 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'emerald', children, ...props }) => {
  const variantStyles = {
    emerald: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    electric: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30 font-bold",
    hybrid: "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30",
    mucus: "bg-red-500/15 text-red-600 dark:text-red-300 border-red-500/30",
    warning: "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30",
    purple: "bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30",
    neutral: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border select-none",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
