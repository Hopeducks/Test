'use client';

import React from 'react';
import { getUnitIcon, getUnitTitle } from '../../../data/questions';

interface LobbyEntryScreenProps {
  inputSessionCode: string;
  onInputChange: (value: string) => void;
  onJoinWithCode: () => void;
  onSelectUnit: (unitId: number) => void;
  unlockedBadges?: string[];
}

const UNIT_THEMES = [
  { border: 'border-amber-500/40',   bg: 'bg-amber-950/25',   glow: 'hover:shadow-[0_0_12px_rgba(245,158,11,0.2)]',   text: 'text-amber-300',   badge: 'bg-amber-500' },
  { border: 'border-blue-500/40',    bg: 'bg-blue-950/25',    glow: 'hover:shadow-[0_0_12px_rgba(59,130,246,0.2)]',    text: 'text-blue-300',    badge: 'bg-blue-500' },
  { border: 'border-emerald-500/40', bg: 'bg-emerald-950/25', glow: 'hover:shadow-[0_0_12px_rgba(16,185,129,0.2)]',  text: 'text-emerald-300', badge: 'bg-emerald-500' },
  { border: 'border-rose-500/40',    bg: 'bg-rose-950/25',    glow: 'hover:shadow-[0_0_12px_rgba(244,63,94,0.2)]',    text: 'text-rose-300',    badge: 'bg-rose-500' },
  { border: 'border-violet-500/40',  bg: 'bg-violet-950/25',  glow: 'hover:shadow-[0_0_12px_rgba(139,92,246,0.2)]',  text: 'text-violet-300',  badge: 'bg-violet-500' },
  { border: 'border-sky-500/40',     bg: 'bg-sky-950/25',     glow: 'hover:shadow-[0_0_12px_rgba(14,165,233,0.2)]',   text: 'text-sky-300',     badge: 'bg-sky-500' },
  { border: 'border-orange-500/40',  bg: 'bg-orange-950/25',  glow: 'hover:shadow-[0_0_12px_rgba(249,115,22,0.2)]',  text: 'text-orange-300',  badge: 'bg-orange-500' },
  { border: 'border-teal-500/40',    bg: 'bg-teal-950/25',    glow: 'hover:shadow-[0_0_12px_rgba(20,184,166,0.2)]',   text: 'text-teal-300',    badge: 'bg-teal-500' },
];

export default function LobbyEntryScreen({
  inputSessionCode,
  onInputChange,
  onJoinWithCode,
  onSelectUnit,
  unlockedBadges,
}: LobbyEntryScreenProps) {
  const unlockedCount = [1,2,3,4,5,6,7,8].filter(
    u => u === 1 || unlockedBadges?.includes(`accessory_badge_u${u - 1}`)
  ).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* ── 헤더 ── */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-cyan-950/40 border border-cyan-500/20 mb-1">
          <span className="text-2xl">🔬</span>
          <span className="text-sm font-black text-cyan-300 tracking-wider">과학 탐험 메타버스</span>
          <span className="text-2xl">🌍</span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          퀴즈를 풀어 도감을 완성하고, 배틀로 라이벌을 제압하라!
        </p>
      </div>

      {/* ── 실시간 수업 참가 ── */}
      <div className="rounded-2xl border border-cyan-500/35 bg-gradient-to-br from-cyan-950/30 via-blue-950/15 to-transparent p-5 shadow-[0_0_20px_rgba(6,182,212,0.08)]">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-lg">🎯</div>
          <div>
            <h3 className="font-black text-cyan-300 text-sm leading-none">실시간 수업 참가</h3>
            <p className="text-[11px] text-cyan-700 mt-0.5">선생님이 알려주신 참여 코드를 입력하세요</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="참여 코드 입력 (예: ABC123)"
            value={inputSessionCode}
            onChange={(e) => onInputChange(e.target.value.toUpperCase())}
            className="flex-1 px-4 py-3 bg-black/40 border border-cyan-500/30 rounded-xl text-gray-100 placeholder-gray-700 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_8px_rgba(6,182,212,0.2)] text-sm font-bold font-mono tracking-widest transition-all"
          />
          <button
            onClick={onJoinWithCode}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-black text-sm font-black rounded-xl transition-all shadow-[0_4px_16px_rgba(6,182,212,0.35)]"
          >
            참가 →
          </button>
        </div>
      </div>

      {/* ── 단원 선택 ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🗺️</span>
            <h3 className="font-black text-gray-200 text-sm">혼자 연습하기</h3>
          </div>
          <span className="text-[11px] font-mono text-gray-500 bg-gray-900 px-2.5 py-0.5 rounded-full border border-gray-800">
            {unlockedCount}/8 단원 해금
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[1,2,3,4,5,6,7,8].map((unitId) => {
            const isLocked = unitId > 1 && !unlockedBadges?.includes(`accessory_badge_u${unitId - 1}`);
            const theme = UNIT_THEMES[unitId - 1];

            return (
              <button
                key={unitId}
                disabled={isLocked}
                onClick={() => onSelectUnit(unitId)}
                className={`relative p-3 border rounded-xl text-center flex flex-col items-center justify-center gap-1.5 transition-all touch-target group ${
                  isLocked
                    ? 'border-gray-800 bg-gray-950/30 opacity-35 cursor-not-allowed'
                    : `${theme.border} ${theme.bg} ${theme.glow} active:scale-95 hover:scale-[1.02]`
                }`}
              >
                {/* Unit number badge */}
                {!isLocked && (
                  <div className={`absolute top-1.5 left-1.5 w-4 h-4 ${theme.badge} rounded-full flex items-center justify-center text-[8px] font-black text-black`}>
                    {unitId}
                  </div>
                )}

                <span className="text-2xl">{isLocked ? '🔒' : getUnitIcon(unitId)}</span>
                <span className={`text-[11px] font-black leading-tight ${isLocked ? 'text-gray-600' : theme.text}`}>
                  {unitId}단원
                </span>
                <span className="text-[9px] text-gray-500 line-clamp-1 leading-tight">
                  {isLocked ? '이전 단원 배지 필요' : getUnitTitle(unitId)}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-center text-[10px] text-gray-600 font-mono">
          // 단원 퀴즈 80% 이상 달성 시 다음 단원 잠금 해제
        </p>
      </div>
    </div>
  );
}
