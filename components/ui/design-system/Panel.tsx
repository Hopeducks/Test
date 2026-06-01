'use client';

import React from 'react';

type Accent = 'cyan' | 'red' | 'orange' | 'amber' | 'green' | 'none';

interface PanelProps {
  accent?: Accent;
  className?: string;
  children: React.ReactNode;
  title?: React.ReactNode;
}

const ACCENT_BORDER: Record<Accent, string> = {
  cyan:   'border-[var(--accent-blue)]/20',
  red:    'border-red-500/20',
  orange: 'border-orange-500/20',
  amber:  'border-[var(--accent-gold)]/20',
  green:  'border-emerald-500/20',
  none:   'border-[var(--border-color)]',
};

export default function Panel({ accent = 'none', className = '', title, children }: PanelProps) {
  return (
    <div className={`glass-panel p-5 ${ACCENT_BORDER[accent]} ${className}`}>
      {title && (
        <div className="border-b border-[var(--border-color)] pb-2 mb-4 text-xs font-mono font-black text-[var(--accent-blue)] uppercase tracking-widest">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}
