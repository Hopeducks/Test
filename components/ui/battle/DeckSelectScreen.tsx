'use client';

import React from 'react';
import { Swords, AlertTriangle } from 'lucide-react';
import { getCardAttribute, ATTRIBUTE_EMOJIS } from '../../../lib/game-state';
import { BattleCard } from './battle-card';

interface DeckSelectScreenProps {
  playerStats: { hp: number; attack: number; defense: number };
  hasEnoughCards: boolean;
  top10UnlockedCards: BattleCard[];
  tempSelectedCards: string[];
  cardLevels: Record<string, number> | undefined;
  onToggleCard: (cardId: string) => void;
  onConfirmDeck: () => void;
  onBack: () => void;
}

export default function DeckSelectScreen({
  playerStats,
  hasEnoughCards,
  top10UnlockedCards,
  tempSelectedCards,
  cardLevels,
  onToggleCard,
  onConfirmDeck,
  onBack,
}: DeckSelectScreenProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-900 pb-4">
        <div>
          <h2 className="text-2xl font-black text-cyan-400 flex items-center gap-2">
            <Swords className="w-7 h-7" /> 출전 카드 덱 편성 (Select Deck)
          </h2>
          <p className="text-xs text-gray-500 font-mono mt-1">// SELECT EXACTLY 3 SCI-CARDS TO START BATTLE</p>
        </div>
        <div className="flex gap-4 p-3 bg-cyan-950/20 border border-cyan-500/15 rounded-xl text-xs font-mono text-cyan-400">
          <span>장비 버프 효과:</span>
          <span>❤️ 체력 +{playerStats.hp}</span>
          <span>🗡️ 공격력 +{playerStats.attack}</span>
          <span>🛡️ 방어력 +{playerStats.defense}</span>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 border border-gray-800 bg-gray-950 hover:text-cyan-400 rounded-lg text-xs font-bold btn-cyber transition-all font-mono"
        >
          대기실 탈출 (QUIT)
        </button>
      </div>

      {!hasEnoughCards ? (
        <div className="p-12 glass-panel border-red-500/20 bg-red-950/5 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto animate-bounce" />
          <h3 className="text-xl font-bold text-gray-200">배틀 카드 부족</h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
            출전하려면 3장 이상의 카드가 해금되어 있어야 합니다. 단원 복습 퀴즈를 풀어 신규 카드를 수집한 후 다시 도전해보세요!
          </p>
          <button
            onClick={onBack}
            className="px-6 py-2.5 bg-gray-900 border border-gray-800 hover:border-gray-700 text-xs font-black rounded-lg"
          >
            로비로 돌아가기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Card List (Col-span 2) */}
          <div className="lg:col-span-2 glass-panel p-6 border-cyan-500/10 space-y-6">
            <div className="flex justify-between items-center border-b border-gray-900 pb-3">
              <h3 className="text-sm font-extrabold text-gray-200">나의 전투 카드 가용 리스트 (최대 10개)</h3>
              <span className="text-xs font-mono text-cyan-400 font-bold">선택됨: {tempSelectedCards.length} / 3</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[350px] overflow-y-auto pr-1">
              {top10UnlockedCards.map((card) => {
                const isSelected = tempSelectedCards.includes(card.id);
                return (
                  <button
                    key={card.id}
                    onClick={() => onToggleCard(card.id)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between h-36 card-cyber transition-all hover:scale-[1.02] ${
                      isSelected
                        ? 'bg-cyan-950/30 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                        : 'bg-gray-900/40 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className={`text-[8px] font-mono px-1 py-0.5 rounded font-bold uppercase flex items-center gap-1 ${
                        card.rarity === 'legendary' ? 'bg-amber-500 text-black' : card.rarity === 'rare' ? 'bg-purple-950 text-purple-300' : 'bg-gray-800 text-gray-300'
                      }`}>
                        {card.rarity} {ATTRIBUTE_EMOJIS[getCardAttribute(card.unitId)]}
                      </span>
                      <span className="text-xl">{card.emoji}</span>
                    </div>

                    <div className="mt-4">
                      <span className="text-xs font-extrabold text-gray-100 block truncate">{card.name}</span>
                      <span className="text-[9px] text-gray-500 block font-mono mt-0.5">
                        {card.type === 'attack' ? '🗡️ 공격' : card.type === 'defense' ? '🛡️ 방어' : '✨ 특수'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center w-full mt-2 pt-2 border-t border-gray-900/60 text-[9px] font-mono text-gray-400">
                      <span>ATK {card.power}</span>
                      <span className="text-cyan-400 font-bold">LV. {cardLevels?.[card.id] || 1}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Confirm panel (Col-span 1) */}
          <div className="lg:col-span-1 glass-panel p-6 border-cyan-500/10 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-cyan-400 uppercase tracking-widest border-b border-gray-900 pb-3 mb-4">선택된 대진표 덱</h3>

              {tempSelectedCards.length === 0 ? (
                <div className="p-8 border border-dashed border-gray-800 rounded-xl text-center text-xs text-gray-500 font-mono">
                  DECK IS EMPTY // CHOOSE 3 CARDS
                </div>
              ) : (
                <div className="space-y-2">
                  {top10UnlockedCards.filter(c => tempSelectedCards.includes(c.id)).map((card, idx) => (
                    <div key={card.id} className="p-2.5 border border-gray-850 bg-gray-950/50 rounded-lg flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-mono">#{idx + 1}</span>
                        <span className="text-base">{card.emoji}</span>
                        <span className="text-xs font-bold text-gray-200">{card.name} {ATTRIBUTE_EMOJIS[getCardAttribute(card.unitId)]}</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold text-cyan-400">LV. {cardLevels?.[card.id] || 1} · ATK {card.power}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              disabled={tempSelectedCards.length !== 3}
              onClick={onConfirmDeck}
              className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-black font-black text-base rounded-xl btn-cyber transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] mt-8"
            >
              출전 확인 (Confirm Deck)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
