'use client';

import React from 'react';
import { CardRarity } from '../../types';

const UNIT_COLORS: Record<number, { from: string; to: string; accent: string }> = {
  1: { from: '#78350f', to: '#1c0a00', accent: '#b5651d' },
  2: { from: '#713f12', to: '#0c0700', accent: '#fde047' },
  3: { from: '#0c4a6e', to: '#020617', accent: '#06b6d4' },
  4: { from: '#7f1d1d', to: '#0c0100', accent: '#ef4444' },
  5: { from: '#14532d', to: '#010a03', accent: '#22c55e' },
  6: { from: '#0c2a4a', to: '#010810', accent: '#7dd3fc' },
  7: { from: '#7c2d12', to: '#0c0300', accent: '#f97316' },
  8: { from: '#4a1d96', to: '#05010f', accent: '#a855f7' },
};

const RARITY_STYLES: Record<CardRarity, { border: string; glow: string; badge: string; stars: number }> = {
  common:    { border: '#4b5563', glow: 'none',                           badge: '#6b7280', stars: 1 },
  uncommon:  { border: '#16a34a', glow: '0 0 8px rgba(22,163,74,0.4)',    badge: '#16a34a', stars: 2 },
  rare:      { border: '#2563eb', glow: '0 0 12px rgba(37,99,235,0.5)',   badge: '#2563eb', stars: 3 },
  epic:      { border: '#7c3aed', glow: '0 0 16px rgba(124,58,237,0.6)', badge: '#7c3aed', stars: 4 },
  legendary: { border: '#b45309', glow: '0 0 24px rgba(180,83,9,0.7)',   badge: '#d97706', stars: 5 },
};

interface CardArtProps {
  unitId: number;
  rarity: CardRarity;
  emoji: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function CardArt({ unitId, rarity, emoji, name, size = 'md' }: CardArtProps) {
  const unitColor = UNIT_COLORS[unitId] ?? UNIT_COLORS[1];
  const rarityStyle = RARITY_STYLES[rarity];

  const sizeMap = {
    sm: { outer: 'w-16 h-20', emoji: 'text-2xl', name: 'text-[8px]' },
    md: { outer: 'w-24 h-32', emoji: 'text-4xl', name: 'text-[10px]' },
    lg: { outer: 'w-36 h-48', emoji: 'text-6xl', name: 'text-xs' },
  };
  const sz = sizeMap[size];

  return (
    <div
      className={`${sz.outer} relative rounded-lg overflow-hidden flex flex-col items-center justify-center gap-1 select-none`}
      style={{
        background: `linear-gradient(135deg, ${unitColor.from} 0%, ${unitColor.to} 100%)`,
        border: `2px solid ${rarityStyle.border}`,
        boxShadow: rarityStyle.glow,
      }}
    >
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 w-full h-1"
        style={{ backgroundColor: unitColor.accent, opacity: 0.6 }}
      />

      {/* Rarity stars */}
      <div className="absolute top-1.5 right-1.5 flex gap-0.5">
        {Array.from({ length: rarityStyle.stars }).map((_, i) => (
          <span key={i} className="text-[7px]" style={{ color: rarityStyle.badge }}>★</span>
        ))}
      </div>

      {/* Main emoji */}
      <span className={sz.emoji}>{emoji}</span>

      {/* Rarity badge */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-[7px] font-mono font-bold uppercase tracking-wider text-white"
        style={{ backgroundColor: `${rarityStyle.badge}99` }}
      >
        {rarity}
      </div>

      {/* Card name */}
      <div className={`absolute bottom-0.5 left-0 right-0 text-center ${sz.name} font-mono text-white/80 truncate px-1`}>
        {name}
      </div>
    </div>
  );
}
