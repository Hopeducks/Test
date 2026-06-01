'use client';

import React from 'react';
import { TournamentBracket, TournamentMatch } from '../../types';

interface TournamentBracketViewProps {
  bracket: TournamentBracket;
  myName?: string;
  onMatchWinner?: (roundIdx: number, matchIdx: number, winner: string) => void;
  isTeacher?: boolean;
}

function MatchCard({ match, myName, onWinner, isTeacher }: {
  match: TournamentMatch;
  myName?: string;
  onWinner?: (winner: string) => void;
  isTeacher?: boolean;
}) {
  const isBye = match.p2 === 'BYE';
  const isMyMatch = match.p1 === myName || match.p2 === myName;

  return (
    <div className={`rounded-lg border p-2 text-xs font-mono transition-colors ${
      match.status === 'done'
        ? 'border-emerald-500/40 bg-emerald-950/20'
        : isMyMatch
          ? 'border-cyan-500/60 bg-cyan-950/20 shadow-[0_0_8px_rgba(6,182,212,0.15)]'
          : 'border-gray-700/40 bg-gray-900/30'
    }`}>
      <div className={`flex items-center justify-between py-0.5 px-1 rounded ${
        match.winner === match.p1 ? 'bg-emerald-950/40 text-emerald-300 font-bold' : 'text-gray-300'
      }`}>
        <span>{match.p1 === myName ? `⭐ ${match.p1}` : match.p1}</span>
        {isTeacher && match.status !== 'done' && !isBye && (
          <button
            onClick={() => onWinner?.(match.p1)}
            className="ml-2 text-[10px] px-1.5 py-0.5 bg-emerald-900/50 border border-emerald-500/40 rounded hover:bg-emerald-800/50"
          >
            승
          </button>
        )}
      </div>
      <div className="text-center text-gray-600 text-[10px] my-0.5">vs</div>
      <div className={`flex items-center justify-between py-0.5 px-1 rounded ${
        isBye
          ? 'text-gray-600 italic'
          : match.winner === match.p2
            ? 'bg-emerald-950/40 text-emerald-300 font-bold'
            : 'text-gray-300'
      }`}>
        <span>{isBye ? 'BYE' : match.p2 === myName ? `⭐ ${match.p2}` : match.p2}</span>
        {isTeacher && !isBye && match.status !== 'done' && (
          <button
            onClick={() => onWinner?.(match.p2)}
            className="ml-2 text-[10px] px-1.5 py-0.5 bg-emerald-900/50 border border-emerald-500/40 rounded hover:bg-emerald-800/50"
          >
            승
          </button>
        )}
      </div>
    </div>
  );
}

export default function TournamentBracketView({
  bracket,
  myName,
  onMatchWinner,
  isTeacher = false,
}: TournamentBracketViewProps) {
  if (!bracket) return null;
  const currentRound = bracket.rounds[bracket.currentRoundIdx];
  if (!currentRound) return null;

  const colCount = Math.min(currentRound.matches.length, 3);

  return (
    <div className="glass-panel p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-mono font-black text-purple-400 uppercase tracking-widest">
          🏆 토너먼트 브래킷
        </h2>
        {bracket.champion && (
          <span className="text-xs font-mono text-yellow-300 bg-yellow-950/40 border border-yellow-500/30 px-2 py-0.5 rounded-full">
            🥇 우승: {bracket.champion}
          </span>
        )}
      </div>

      <div className="text-[10px] font-mono text-gray-500">
        라운드 {bracket.currentRoundIdx + 1} / {bracket.rounds.length}
      </div>

      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${colCount}, 1fr)` }}
      >
        {currentRound.matches.map((match, mIdx) => (
          <MatchCard
            key={mIdx}
            match={match}
            myName={myName}
            isTeacher={isTeacher}
            onWinner={onMatchWinner ? (w) => onMatchWinner(bracket.currentRoundIdx, mIdx, w) : undefined}
          />
        ))}
      </div>

      {!bracket.champion && isTeacher && (
        <p className="text-[10px] font-mono text-gray-600 text-center">
          각 대결에서 승자를 선택하면 다음 라운드가 자동 생성됩니다.
        </p>
      )}
      {!bracket.champion && !isTeacher && (
        <p className="text-[10px] font-mono text-gray-600 text-center">
          교사가 대결 결과를 선택하면 다음 라운드로 진행됩니다.
        </p>
      )}
    </div>
  );
}
