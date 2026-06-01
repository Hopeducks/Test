'use client';

import React from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'warning';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:   'bg-[var(--accent-blue)] hover:opacity-90 text-white border-transparent',
  secondary: 'bg-[var(--bg-panel-sub)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-blue)]',
  danger:    'bg-red-600 hover:bg-red-500 text-white border-transparent',
  ghost:     'bg-transparent border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
  warning:   'bg-amber-500 hover:bg-amber-400 text-black border-transparent',
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'px-2.5 py-1 text-[10px] font-bold',
  md: 'px-4 py-2 text-xs font-black',
  lg: 'px-5 py-2.5 text-xs font-black',
};

export default function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
    >
      {children}
    </button>
  );
}
