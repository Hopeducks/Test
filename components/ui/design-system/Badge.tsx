'use client';

import React from 'react';

type BadgeVariant = 'blue' | 'green' | 'red' | 'amber' | 'gray' | 'pulse-blue' | 'pulse-orange';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const BADGE_CLASSES: Record<BadgeVariant, string> = {
  blue:          'border-[var(--accent-blue)]/30 bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]',
  green:         'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
  red:           'border-red-500/30 bg-red-500/10 text-red-500',
  amber:         'border-[var(--accent-gold)]/30 bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]',
  gray:          'border-[var(--border-color)] bg-[var(--bg-panel-sub)] text-[var(--text-secondary)]',
  'pulse-blue':  'border-[var(--accent-blue)] bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] animate-pulse',
  'pulse-orange':'border-orange-500 bg-orange-500/10 text-orange-500 animate-pulse',
};

export default function Badge({ variant = 'gray', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-black uppercase tracking-wider ${BADGE_CLASSES[variant]} ${className}`}>
      {children}
    </span>
  );
}
