'use client';

import React, { useMemo } from 'react';
import { useGameState } from '../../lib/game-state';
import { cards } from '../../data/cards';
import { ArrowLeft, Trophy, Medal, Star } from 'lucide-react';

interface LeaderboardProps {
  onBack: () => void;
}

interface RankEntry {
  name: string;
  avatar: string;
  cards: number;
  score: number;
  completedUnits: number;
  isLocalPlayer: boolean;
}

export default function Leaderboard({ onBack }: LeaderboardProps) {
  const { progress, studentName, studentAvatar, classroomStudents, classroomSession } = useGameState();

  const entries = useMemo<RankEntry[]>(() => {
    const list: RankEntry[] = [];

    // Local player
    const localScore = Object.values(progress.unitHighScores ?? {}).reduce((a, b) => a + b, 0);
    list.push({
      name: studentName || '나',
      avatar: studentAvatar || '🎒',
      cards: progress.unlockedCardIds.length,
      score: localScore,
      completedUnits: (progress.completedUnits ?? []).length,
      isLocalPlayer: true,
    });

    // Session classmates
    classroomStudents.forEach(s => {
      if (s.name === studentName) return;
      const scoreSum = Object.values(s.unitScores ?? {}).reduce((a, b) => a + b, 0);
      list.push({
        name: s.name,
        avatar: s.avatar,
        cards: s.unlockedCardsCount ?? 0,
        score: scoreSum,
        completedUnits: (s.completedUnits ?? []).length,
        isLocalPlayer: false,
      });
    });

    // Sort: cards desc → score desc → completedUnits desc
    list.sort((a, b) =>
      b.cards !== a.cards ? b.cards - a.cards :
      b.score !== a.score ? b.score - a.score :
      b.completedUnits - a.completedUnits
    );

    return list;
  }, [progress, studentName, studentAvatar, classroomStudents]);

  const rankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}위`;
  };

  const sessionCode = classroomSession?.code;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 animate-slide-up space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg border border-gray-800 bg-gray-950 text-gray-400 hover:text-white hover:border-gray-700 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-2xl font-black text-amber-400 tracking-wide flex items-center gap-2">
          <Trophy className="w-6 h-6" /> 랭킹
        </h1>
        {sessionCode && (
          <span className="ml-auto text-[10px] font-mono text-gray-500 bg-gray-950 border border-gray-800 px-2 py-1 rounded">
            세션 {sessionCode}
          </span>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] font-mono text-gray-600 px-1">
        <span>🃏 카드 수</span>
        <span>📝 총 퀴즈 점수</span>
        <span>✅ 완료 단원</span>
      </div>

      {/* Ranking List */}
      <div className="space-y-2">
        {entries.length === 0 ? (
          <div className="glass-panel p-10 text-center text-gray-600 text-sm font-mono">
            데이터가 없습니다. 퀴즈를 풀고 카드를 수집하면 랭킹에 등록됩니다.
          </div>
        ) : (
          entries.map((entry, idx) => {
            const rank = idx + 1;
            const isTop3 = rank <= 3;
            return (
              <div
                key={entry.name}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  entry.isLocalPlayer
                    ? 'border-cyan-500/40 bg-cyan-950/10 shadow-[0_0_10px_rgba(6,182,212,0.08)]'
                    : isTop3
                    ? 'border-amber-500/20 bg-amber-950/5'
                    : 'border-gray-900 bg-gray-950/40'
                }`}
              >
                {/* Rank */}
                <div className={`w-10 text-center font-black shrink-0 ${
                  rank === 1 ? 'text-xl' : rank === 2 ? 'text-lg' : rank === 3 ? 'text-base' : 'text-xs text-gray-500 font-mono'
                }`}>
                  {rankIcon(rank)}
                </div>

                {/* Avatar + Name */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-2xl shrink-0">{entry.avatar}</span>
                  <div className="min-w-0">
                    <p className={`font-black text-sm truncate ${entry.isLocalPlayer ? 'text-cyan-300' : 'text-white'}`}>
                      {entry.name}
                      {entry.isLocalPlayer && <span className="text-[9px] font-mono text-cyan-500 ml-1">(나)</span>}
                    </p>
                    <p className="text-[10px] text-gray-600 font-mono">{entry.completedUnits}/8단원 완료</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-center">
                    <p className="text-sm font-black text-purple-400">{entry.cards}</p>
                    <p className="text-[9px] text-gray-600 font-mono">카드</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-black text-emerald-400">{entry.score}</p>
                    <p className="text-[9px] text-gray-600 font-mono">점수</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {entries.length === 1 && (
        <p className="text-center text-xs text-gray-600 font-mono">
          세션에 참여 중인 친구들이 표시됩니다. 현재 세션에 다른 학생이 없습니다.
        </p>
      )}

      <button
        onClick={onBack}
        className="w-full py-3 bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white font-bold rounded-xl transition-all"
      >
        ← 홈으로
      </button>
    </div>
  );
}
