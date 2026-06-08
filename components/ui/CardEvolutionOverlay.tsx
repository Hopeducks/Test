'use client';

import React, { useEffect } from 'react';

export interface CardEvolutionInfo {
  cardId: string;
  name: string;
  emoji: string;
  stage: number; // 2 = 진화, 3 = 초진화
}

interface CardEvolutionOverlayProps {
  evolution: CardEvolutionInfo;
  onClose: () => void;
}

const STAGE_LABEL: Record<number, string> = {
  2: '진화 완료!',
  3: '초진화 완료!',
};

const STAGE_ACCENT: Record<number, string> = {
  2: 'from-cyan-500/30 to-[#04121a] border-cyan-400/50 shadow-[0_0_40px_rgba(34,211,238,0.4)]',
  3: 'from-fuchsia-600/30 to-[#140414] border-fuchsia-400/50 shadow-[0_0_50px_rgba(232,121,249,0.45)]',
};

const RING_COLOR: Record<number, string> = {
  2: 'border-cyan-300/70',
  3: 'border-fuchsia-300/70',
};

/**
 * 카드가 진화 단계를 넘었을 때 표시되는 전역 연출 오버레이 (D-2).
 * 자동으로 닫히며(부모가 타이머로 해제), compositor 친화적 transform/opacity만 사용한다.
 */
export default function CardEvolutionOverlay({ evolution, onClose }: CardEvolutionOverlayProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2600);
    return () => clearTimeout(timer);
  }, [evolution.cardId, evolution.stage, onClose]);

  const accent = STAGE_ACCENT[evolution.stage] ?? STAGE_ACCENT[2];
  const ring = RING_COLOR[evolution.stage] ?? RING_COLOR[2];
  const label = STAGE_LABEL[evolution.stage] ?? '진화 완료!';

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      onClick={onClose}
    >
      <div className={`relative flex flex-col items-center gap-4 px-10 py-8 rounded-2xl bg-gradient-to-b border animate-evolve-burst ${accent}`}>
        {/* 확산 링 */}
        <span className={`absolute top-[38%] w-32 h-32 rounded-full border-2 animate-evolve-ring ${ring}`} />

        <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/70 font-black">
          CARD EVOLUTION
        </span>

        <div className="text-7xl select-none drop-shadow-[0_0_18px_rgba(255,255,255,0.35)]">
          {evolution.emoji}
        </div>

        <div className="text-2xl font-black text-white text-center">{evolution.name}</div>

        <div className={`text-base font-black tracking-wide ${evolution.stage === 3 ? 'text-fuchsia-300' : 'text-cyan-300'}`}>
          ✨ {label} ✨
        </div>
      </div>
    </div>
  );
}
