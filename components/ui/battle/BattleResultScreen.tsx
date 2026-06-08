'use client';

import React from 'react';
import { Crown, AlertTriangle, Swords } from 'lucide-react';
import { BattleCard } from './battle-card';

interface BattleResultScreenProps {
  battleOutcome: 'victory' | 'defeat' | 'draw';
  awardedCoins: number;
  roundsHistory: Array<{ winner: 'player' | 'opponent' | 'draw'; pCard: BattleCard; oCard: BattleCard }>;
  onBack: () => void;
}

export default function BattleResultScreen({ battleOutcome, awardedCoins, roundsHistory, onBack }: BattleResultScreenProps) {
  return (
    <div className="max-w-2xl mx-auto text-center py-12 px-6 glass-panel border-cyan-500/20 bg-gradient-to-b from-[#09101d] to-[#04060b] shadow-2xl relative animate-scale-up">

      {battleOutcome === 'victory' ? (
        <div className="space-y-6">
          <div className="w-20 h-20 rounded-full border border-amber-400 bg-amber-950/20 flex items-center justify-center text-amber-400 mx-auto mb-4 animate-bounce">
            <Crown className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-black text-amber-400 tracking-wider">VICTORY! 최종 배틀 승리</h2>
          <p className="text-sm text-gray-300">훌륭합니다! 상대방의 세련된 전술을 격파하고 스타디움 챔피언에 올랐습니다!</p>
        </div>
      ) : battleOutcome === 'defeat' ? (
        <div className="space-y-6">
          <div className="w-20 h-20 rounded-full border border-red-500 bg-red-950/20 flex items-center justify-center text-red-500 mx-auto mb-4 animate-pulse">
            <AlertTriangle className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-black text-red-500 tracking-wider">DEFEAT. 최종 배틀 패배</h2>
          <p className="text-sm text-gray-300">아쉽지만 상대방 카드 덱 파워에 패배했습니다. 다음 퀴즈 복습으로 실력을 다져보세요!</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="w-20 h-20 rounded-full border border-gray-500 bg-gray-950/20 flex items-center justify-center text-gray-400 mx-auto mb-4">
            <Swords className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-black text-gray-300 tracking-wider">DRAW. 무승부 대결</h2>
          <p className="text-sm text-gray-300">양 플레이어가 팽팽한 호각세의 명승부를 벌였습니다!</p>
        </div>
      )}

      {/* Reward block */}
      <div className="p-4 bg-gray-950 border border-gray-900 rounded-xl max-w-sm mx-auto my-6 text-sm text-gray-400">
        획득 카드 경험치: <span className="text-cyan-400 font-extrabold">+{awardedCoins} XP ⚡</span>
      </div>

      {/* Rounds details summary */}
      <div className="max-w-md mx-auto space-y-2 text-xs font-mono mb-8">
        <span className="text-gray-500 text-[10px] block uppercase tracking-widest">// ROUNDS SUMMARY</span>
        {roundsHistory.map((r, idx) => (
          <div key={idx} className="flex justify-between items-center p-2 border border-gray-900/60 bg-gray-950/20 rounded-lg">
            <span className="text-gray-400">Round {idx + 1}: {r.pCard.emoji} vs {r.oCard.emoji}</span>
            <span className={`font-bold ${r.winner === 'player' ? 'text-green-400' : r.winner === 'opponent' ? 'text-red-500' : 'text-gray-500'}`}>
              {r.winner === 'player' ? '정답 승리' : r.winner === 'opponent' ? '오답 패배' : '무승부'}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-4 max-w-sm mx-auto">
        <button
          onClick={onBack}
          className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-sm rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.3)] btn-cyber transition-all"
        >
          대기실로 돌아가기 (Close)
        </button>
      </div>
    </div>
  );
}
