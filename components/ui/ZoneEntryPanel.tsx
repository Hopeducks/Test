'use client';

import React from 'react';
import { gameAudio } from '../../lib/audio';
import { X, PlayCircle, MessageCircle } from 'lucide-react';

const UNIT_THEMES: Record<number, { name: string; emoji: string; color: string }> = {
  1: { name: '지층과 화석',      emoji: '🪨', color: '#b5651d' },
  2: { name: '빛과 렌즈',        emoji: '🔭', color: '#ca9a06' },
  3: { name: '용액의 성질',      emoji: '🧪', color: '#06b6d4' },
  4: { name: '우리 몸',          emoji: '❤️',  color: '#ef4444' },
  5: { name: '생태계와 환경',    emoji: '🌿', color: '#22c55e' },
  6: { name: '날씨와 우리 생활', emoji: '🌤️', color: '#38bdf8' },
  7: { name: '물체의 속력',      emoji: '💨', color: '#f97316' },
  8: { name: '산과 염기',        emoji: '⚗️',  color: '#a855f7' },
};

const UNIT_DESCRIPTIONS: Record<number, string> = {
  1: '지층이 쌓이는 과정, 퇴적암의 종류, 화석이 만들어지는 원리를 탐험해 보세요.',
  2: '빛의 직진·반사·굴절과 볼록렌즈·오목렌즈의 원리를 학습합니다.',
  3: '용해, 용질, 용매의 개념과 용액의 진하기·분리 방법을 연구합니다.',
  4: '소화·호흡·순환·배설 기관의 구조와 기능, 기관 간 협력을 학습합니다.',
  5: '생태계 구성 요소, 먹이 그물, 생물과 환경의 상호 작용을 탐구합니다.',
  6: '기온·습도·바람·구름·비 등 날씨 현상과 우리 생활과의 관계를 관측합니다.',
  7: '속력의 의미와 단위(m/s, km/h), 빠르기 비교 방법과 안전거리를 배웁니다.',
  8: '산과 염기의 성질, 지시약 색 변화, 중화 반응을 실험으로 이해합니다.',
};

interface ZoneEntryPanelProps {
  unitId: number;
  onStartQuiz: () => void;
  onOpenNpc: () => void;
  onClose: () => void;
}

export default function ZoneEntryPanel({ unitId, onStartQuiz, onOpenNpc, onClose }: ZoneEntryPanelProps) {
  const theme = UNIT_THEMES[unitId] ?? UNIT_THEMES[1];
  const description = UNIT_DESCRIPTIONS[unitId] ?? '';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="glass-panel w-full max-w-md p-6 text-gray-100 shadow-2xl relative animate-slide-up"
        style={{ borderColor: `${theme.color}40` }}
      >
        {/* Close */}
        <button
          onClick={() => { gameAudio.playClick(); onClose(); }}
          className="absolute top-4 right-4 p-1 rounded hover:text-white text-gray-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Zone Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-3xl shrink-0"
            style={{ backgroundColor: `${theme.color}20`, border: `2px solid ${theme.color}60` }}
          >
            {theme.emoji}
          </div>
          <div>
            <p className="text-xs font-mono uppercase tracking-widest" style={{ color: theme.color }}>
              UNIT {unitId} ZONE
            </p>
            <h2 className="text-lg font-black text-gray-100">{theme.name}</h2>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-400 leading-relaxed mb-6 font-sans">{description}</p>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => { gameAudio.playCorrect(); onStartQuiz(); }}
            className="w-full py-3 rounded-xl font-black text-black transition-all flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98]"
            style={{ backgroundColor: theme.color }}
          >
            <PlayCircle className="w-5 h-5" />
            퀴즈 시작
          </button>
          <button
            onClick={() => { gameAudio.playClick(); onOpenNpc(); }}
            className="w-full py-3 rounded-xl font-bold border transition-all flex items-center justify-center gap-2 text-gray-300 hover:text-white hover:bg-white/5"
            style={{ borderColor: `${theme.color}40` }}
          >
            <MessageCircle className="w-5 h-5" />
            NPC 대화 (서술형 퀘스트)
          </button>
        </div>
      </div>
    </div>
  );
}
