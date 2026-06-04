'use client';

import React from 'react';
import { Swords } from 'lucide-react';

interface MatchmakingScreenProps {
  opponent: { name: string; avatar: string; level: number } | null;
  countdown: number | null;
}

export default function MatchmakingScreen({ opponent, countdown }: MatchmakingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] text-center space-y-8 glass-panel border-cyan-500/10 p-12 bg-cyan-950/5">
      <div className="relative">
        <Swords className="w-20 h-20 text-cyan-400 animate-spin-slow" />
        <span className="absolute inset-0 flex items-center justify-center text-xs">🎮</span>
      </div>

      <div className="space-y-3">
        <h2 className="text-2xl font-black text-gray-100 animate-pulse">배틀 상대 찾는 중...</h2>
        <p className="text-sm text-cyan-400/60 font-mono tracking-wider">// CONNECTING TO MATCHMAKING STADIUM // WAIT FOR OPPONENT</p>
      </div>

      {opponent && (
        <div className="p-5 bg-cyan-950/20 border border-cyan-500/20 rounded-2xl max-w-sm w-full space-y-3 animate-scale-up">
          <span className="text-[10px] text-cyan-400 font-mono font-bold block uppercase tracking-widest">// MATCH FOUND!</span>
          <div className="flex items-center justify-between border-t border-gray-900 pt-3">
            <div className="text-left">
              <span className="text-[9px] text-gray-500 block">NICKNAME</span>
              <span className="text-base font-extrabold text-white">{opponent.name}</span>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-gray-500 block">LEVEL</span>
              <span className="text-sm font-black text-cyan-400 font-mono">LV. {opponent.level}</span>
            </div>
          </div>
        </div>
      )}

      {countdown !== null && (
        <div className="text-6xl font-black text-yellow-400 font-mono animate-ping pt-4">
          {countdown === 0 ? 'START!' : countdown}
        </div>
      )}
    </div>
  );
}
