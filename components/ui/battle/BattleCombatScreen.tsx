'use client';

import React from 'react';
import { Timer } from 'lucide-react';
import { getCardAttribute, getAttackMultiplier, getEffectivenessLabel, ATTRIBUTE_EMOJIS } from '../../../lib/game-state';
import { cards } from '../../../data/cards';
import { Question, MCQuestion, ItemInventory } from '../../../types';
import { RenderAvatarPreview } from '../AvatarPreview';
import { BattleCard, mapToBattleCard } from './battle-card';

type Stats = { hp: number; attack: number; defense: number };

interface BattleCombatScreenProps {
  studentName: string;
  studentAvatar: string;
  equippedCosmetics: { outfit: string; expression: string; accessory: string; mount: string };
  playerStats: Stats;
  opponent: { name: string; avatar: string; level: number } | null;
  opponentStats: Stats;
  isAI: boolean;
  deck: BattleCard[];
  playerHp: number;
  opponentHp: number;
  round: number;
  roundPhase: 'card_select' | 'quiz' | 'resolve';
  roundTimer: number;
  selectedCardId: string | null;
  opponentSelectedCardId: string | null;
  usedPlayerCardIds: string[];
  damagePopup: { player: number | null; opponent: number | null };
  cardLevels: Record<string, number> | undefined;
  items: ItemInventory | undefined;
  quizQuestion: Question;
  selectedOption: number | null;
  isQuizAnswered: boolean;
  playerCorrect: boolean | null;
  opponentCorrect: boolean | null;
  onSelectRoundCard: (cardId: string) => void;
  onUseHealItem: (itemType: 'potion' | 'potionHyper' | 'potionMax' | 'revive') => void;
  onQuizAnswerSubmit: (optionIndex: number) => void;
}

export default function BattleCombatScreen(props: BattleCombatScreenProps) {
  const {
    studentName, studentAvatar, equippedCosmetics, playerStats,
    opponent, opponentStats, isAI, deck, playerHp, opponentHp, round,
    roundPhase, roundTimer, selectedCardId, opponentSelectedCardId, usedPlayerCardIds,
    damagePopup, cardLevels, items, quizQuestion, selectedOption, isQuizAnswered,
    playerCorrect, opponentCorrect, onSelectRoundCard, onUseHealItem, onQuizAnswerSubmit,
  } = props;

  return (
    <div className="space-y-6">

      {/* Top Panel: Player & Opponent stats layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Player Side */}
        <div className="glass-panel p-4 border-cyan-500/20 bg-black/60 relative flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <RenderAvatarPreview
                baseAvatar={studentAvatar}
                outfit={equippedCosmetics.outfit}
                expression={equippedCosmetics.expression}
                accessory={equippedCosmetics.accessory}
                mount={equippedCosmetics.mount}
                size="md"
              />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-cyan-400 flex items-center gap-1.5">
                {studentName}
                <span className="px-1 py-0.2 bg-cyan-950 text-cyan-400 text-[8px] font-mono rounded">대원</span>
              </h3>
              <span className="text-[10px] text-cyan-400/80 font-mono block mt-0.5">
                버프: ❤️+{playerStats.hp} 🗡️+{playerStats.attack} 🛡️+{playerStats.defense}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono mt-1">
                <span>ROUND CARD:</span>
                {selectedCardId ? (
                  <span className="text-white font-bold">{deck.find(c => c.id === selectedCardId)?.emoji} {deck.find(c => c.id === selectedCardId)?.name}</span>
                ) : (
                  <span className="text-red-500 font-bold">미선택</span>
                )}
              </div>
            </div>
          </div>

          {/* HP Bar */}
          <div className="mt-4">
            <div className="flex justify-between items-baseline text-xs font-mono mb-1">
              <span>HP Gauge</span>
              <span className="font-bold text-gray-200">{playerHp} / {100 + playerStats.hp}</span>
            </div>
            <div className="w-full h-3 bg-gray-950 border border-gray-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 transition-all duration-500"
                style={{ width: `${Math.max(0, (playerHp / (100 + playerStats.hp)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Floating Damage Popup overlay */}
          {damagePopup.player !== null && (
            <div className="absolute top-4 right-4 text-red-500 text-3xl font-black animate-float-up pointer-events-none select-none drop-shadow-[0_0_8px_rgba(0,0,0,1)]">
              -{damagePopup.player}
            </div>
          )}
        </div>

        {/* Right Opponent Side */}
        <div className="glass-panel p-4 border-red-500/20 bg-black/60 relative flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center gap-3 md:flex-row-reverse md:text-right">
            <div className="relative transform scale-x-[-1]">
              <RenderAvatarPreview
                baseAvatar={opponent?.avatar || '👾'}
                outfit="none"
                expression="none"
                accessory="none"
                mount="none"
                size="md"
              />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-red-400 flex items-center gap-1.5 md:flex-row-reverse">
                {opponent?.name}
                <span className="px-1 py-0.2 bg-red-950 text-red-400 text-[8px] font-mono rounded">{isAI ? 'AI' : '원격'}</span>
              </h3>
              <span className="text-[10px] text-red-400/80 font-mono block mt-0.5 md:text-right">
                버프: ❤️+{opponentStats.hp} 🗡️+{opponentStats.attack} 🛡️+{opponentStats.defense}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono mt-1 md:flex-row-reverse">
                <span>ROUND CARD:</span>
                {opponentSelectedCardId ? (
                  <span className="text-white font-bold">❓ 페이스다운</span>
                ) : (
                  <span className="text-red-500 font-bold">미선택</span>
                )}
              </div>
            </div>
          </div>

          {/* HP Bar */}
          <div className="mt-4">
            <div className="flex justify-between items-baseline text-xs font-mono mb-1">
              <span>HP Gauge</span>
              <span className="font-bold text-gray-200">{opponentHp} / {100 + opponentStats.hp}</span>
            </div>
            <div className="w-full h-3 bg-gray-950 border border-gray-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all duration-500"
                style={{ width: `${Math.max(0, (opponentHp / (100 + opponentStats.hp)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Floating Damage Popup overlay */}
          {damagePopup.opponent !== null && (
            <div className="absolute top-4 left-4 text-red-500 text-3xl font-black animate-float-up pointer-events-none select-none drop-shadow-[0_0_8px_rgba(0,0,0,1)]">
              -{damagePopup.opponent}
            </div>
          )}
        </div>
      </div>

      {/* Core Interactive Center Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Card Selection Slots */}
        <div className="lg:col-span-1 glass-panel p-5 border-cyan-500/10 space-y-4">
          <h3 className="text-sm font-extrabold text-cyan-400 uppercase tracking-widest border-b border-gray-900 pb-2 flex items-center justify-between">
            <span>내 출전 카드 3장</span>
            <span className="text-[10px] text-gray-500 font-mono">ROUND {round} / 3</span>
          </h3>

          <div className="flex flex-col gap-3">
            {deck.map((card) => {
              const isUsed = usedPlayerCardIds.includes(card.id);
              const isSelected = selectedCardId === card.id;
              const cardLvl = cardLevels?.[card.id] || 1;

              return (
                <button
                  key={card.id}
                  disabled={roundPhase !== 'card_select' || isUsed}
                  onClick={() => onSelectRoundCard(card.id)}
                  className={`p-3 border rounded-xl flex items-center justify-between btn-cyber transition-all ${
                    isUsed
                      ? 'border-gray-950 bg-gray-950/20 opacity-30 cursor-not-allowed'
                      : isSelected
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                        : 'bg-gray-900/30 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{card.emoji}</span>
                    <span className="text-xs font-bold text-gray-200">
                      {card.name} {ATTRIBUTE_EMOJIS[getCardAttribute(card.unitId)]}
                    </span>
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">
                    LV.{cardLvl} · ATK {card.power}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Round Flow Console and Questions (Col-span 2) */}
        <div className="lg:col-span-2 glass-panel p-6 border-cyan-500/15 bg-black/40 min-h-[300px] flex flex-col justify-between">

          {/* CARD SELECT PHASE */}
          {roundPhase === 'card_select' && (
            <div className="flex flex-col items-center justify-center h-full space-y-6 py-4">
              <Timer className="w-12 h-12 text-yellow-500 animate-pulse" />
              <div className="text-center space-y-2">
                <h3 className="text-xl font-black text-yellow-400">전투 카드를 제시하세요!</h3>
                <p className="text-sm text-gray-400">좌측 카드 중 이번 라운드에 비밀리에 출전시킬 카드를 탭하세요.</p>
              </div>
              <div className="text-4xl font-black text-white font-mono-numbers">
                {roundTimer}s
              </div>

              {/* Potion/Heal items bag panel */}
              <div className="w-full max-w-md p-3 border border-cyan-500/10 bg-cyan-950/5 rounded-xl flex flex-col gap-2 mt-4">
                <span className="text-[10px] font-bold text-gray-455 text-left block">// 치료제 사용 (물약 복용)</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'potion', name: '상처약', emoji: '🧪', desc: '+30 HP' },
                    { key: 'potionHyper', name: '좋은상처약', emoji: '🔋', desc: '+60 HP' },
                    { key: 'potionMax', name: '풀회복약', emoji: '🌟', desc: 'HP 전부 회복' },
                    { key: 'revive', name: '기력의조각', emoji: '💊', desc: '+50 HP (HP 30 이하만 가능)' }
                  ].map(item => {
                    const count = items?.[item.key as keyof ItemInventory] || 0;
                    return (
                      <button
                        key={item.key}
                        disabled={count <= 0}
                        onClick={() => onUseHealItem(item.key as 'potion' | 'potionHyper' | 'potionMax' | 'revive')}
                        className={`p-2 border rounded-lg flex items-center justify-between text-left transition-all ${
                          count > 0
                            ? 'bg-gray-900/60 border-cyan-500/20 hover:border-cyan-400 hover:scale-102 active:scale-98'
                            : 'bg-gray-950/20 border-gray-950 opacity-40 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xl shrink-0">{item.emoji}</span>
                          <div className="truncate text-left leading-none">
                            <span className="text-[10px] font-bold block text-gray-200">{item.name}</span>
                            <span className="text-[8px] text-gray-500 block mt-0.5">{item.desc}</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono font-bold text-cyan-400 bg-cyan-950/30 px-1 py-0.5 rounded shrink-0">
                          {count}개
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* QUIZ ANSWER PHASE */}
          {roundPhase === 'quiz' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-gray-900 pb-3">
                <span className="text-xs font-mono text-cyan-400 font-bold">
                  💡 정답 시 데미지 버프 +50% 적용!
                </span>
                <div className="flex items-center gap-1 text-yellow-500 font-mono text-sm">
                  <Timer className="w-4 h-4" />
                  <span>{roundTimer}초 남음</span>
                </div>
              </div>

              <h3 className="text-lg font-bold leading-relaxed text-gray-100">
                {quizQuestion.question}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(quizQuestion as MCQuestion).options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === (quizQuestion as MCQuestion).correctIndex;

                  let btnStyle = 'border-gray-800 bg-gray-950 hover:border-cyan-500/50 text-gray-300';
                  if (isQuizAnswered) {
                    if (isSelected) {
                      btnStyle = isCorrect
                        ? 'border-green-500 bg-green-950/30 text-green-400 font-black'
                        : 'border-red-500 bg-red-950/30 text-red-400';
                    } else if (isCorrect) {
                      btnStyle = 'border-green-500 bg-green-950/10 text-green-400';
                    } else {
                      btnStyle = 'border-gray-950 bg-gray-950/20 text-gray-600 opacity-40';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={isQuizAnswered}
                      onClick={() => onQuizAnswerSubmit(idx)}
                      className={`p-3.5 border rounded-xl text-left text-xs font-bold leading-relaxed btn-cyber transition-all touch-target ${btnStyle}`}
                    >
                      <span className="font-mono text-gray-500 mr-2">{idx + 1}.</span>
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* RESOLVING / CARD FLIPPING PHASE */}
          {roundPhase === 'resolve' && (
            <div className="flex flex-col items-center justify-center h-full space-y-6 py-4">
              <h3 className="text-xl font-black text-cyan-400 animate-pulse">// 카드 플립 및 데미지 계산 //</h3>

              {/* Card Flip Presentation Section */}
              <div className="flex items-center gap-12 select-none">
                {/* Player Card (Flipped) */}
                <div className="w-36 h-48 perspective-1000">
                  <div className="w-full h-full duration-700 preserve-3d rotate-y-180 absolute">
                    <div className="absolute inset-0 rotate-y-180 backface-hidden bg-gradient-to-b from-[#1b1e2a] to-[#090b11] border-2 border-cyan-400 rounded-xl p-3 flex flex-col justify-between">
                      <span className="text-[8px] font-mono text-cyan-400 uppercase font-bold tracking-widest">{deck.find(c => c.id === selectedCardId)?.rarity}</span>
                      <span className="text-4xl text-center">{deck.find(c => c.id === selectedCardId)?.emoji}</span>
                      <div className="text-center">
                        <span className="text-[10px] font-black text-white">
                          {deck.find(c => c.id === selectedCardId)?.name} {selectedCardId && ATTRIBUTE_EMOJIS[getCardAttribute(deck.find(c => c.id === selectedCardId)!.unitId)]}
                        </span>
                        <span className="text-[9px] text-gray-500 block font-mono">POWER: {deck.find(c => c.id === selectedCardId)?.power}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <span className="text-3xl font-black text-red-500 animate-pulse">VS</span>

                {/* Opponent Card (Flipped) */}
                <div className="w-36 h-48 perspective-1000">
                  <div className="w-full h-full duration-700 preserve-3d rotate-y-180 absolute">
                    <div className="absolute inset-0 rotate-y-180 backface-hidden bg-gradient-to-b from-[#2a1b1b] to-[#110909] border-2 border-red-500 rounded-xl p-3 flex flex-col justify-between">
                      <span className="text-[8px] font-mono text-red-500 uppercase font-bold tracking-widest">{cards.find(c => c.id === opponentSelectedCardId)?.rarity || 'common'}</span>
                      <span className="text-4xl text-center">{cards.find(c => c.id === opponentSelectedCardId)?.image || '❓'}</span>
                      <div className="text-center">
                        <span className="text-[10px] font-black text-white">
                          {cards.find(c => c.id === opponentSelectedCardId)?.name || '상대 카드'} {opponentSelectedCardId && ATTRIBUTE_EMOJIS[getCardAttribute(cards.find(c => c.id === opponentSelectedCardId)!.unitId)]}
                        </span>
                        <span className="text-[9px] text-gray-500 block font-mono">
                          POWER: {opponentSelectedCardId ? mapToBattleCard(cards.find(c => c.id === opponentSelectedCardId)!, { [opponentSelectedCardId]: opponent?.level || 1 }).power : 20}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-8 text-center text-xs font-mono">
                <div>
                  <span className="text-gray-500 block">내 퀴즈 보너스</span>
                  <span className={playerCorrect ? 'text-green-400 font-bold' : 'text-red-500'}>
                    {playerCorrect ? '+50% 공격력 증가 (1.5x)' : '보너스 없음 (1.0x)'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">상대 퀴즈 보너스</span>
                  <span className={opponentCorrect ? 'text-green-400 font-bold' : 'text-red-500'}>
                    {opponentCorrect ? '+50% 공격력 증가 (1.5x)' : '보너스 없음 (1.0x)'}
                  </span>
                </div>
              </div>

              {(() => {
                const pCard = deck.find(c => c.id === selectedCardId);
                const oCard = cards.find(c => c.id === opponentSelectedCardId);
                if (!pCard || !oCard) return null;
                const pMult = getAttackMultiplier(pCard.unitId, oCard.unitId);
                const oMult = getAttackMultiplier(oCard.unitId, pCard.unitId);

                const pLabel = getEffectivenessLabel(pMult);
                const oLabel = getEffectivenessLabel(oMult);

                return (
                  <div className="flex flex-col items-center gap-2 mt-2 max-w-md w-full p-3 bg-gray-950/60 border border-gray-900 rounded-xl">
                    <div className="text-xs font-bold text-cyan-400 tracking-wide flex items-center gap-1">
                      ⚔️ 속성 상성 전투 결과 (Type Matchup)
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full text-[11px] font-mono mt-1 pt-1.5 border-t border-gray-900 text-left">
                      <div>
                        <span className="text-gray-500 block">내 공격 효과 ({ATTRIBUTE_EMOJIS[getCardAttribute(pCard.unitId)]} → {ATTRIBUTE_EMOJIS[getCardAttribute(oCard.unitId)]})</span>
                        <span className={`font-black ${pMult >= 2.0 ? 'text-green-400' : pMult <= 0 ? 'text-red-500' : pMult < 1.0 ? 'text-orange-400' : 'text-gray-300'}`}>
                          {pMult}배 {pLabel ? `(${pLabel.replace(/ \(.*배\)/, '')})` : ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">상대 공격 효과 ({ATTRIBUTE_EMOJIS[getCardAttribute(oCard.unitId)]} → {ATTRIBUTE_EMOJIS[getCardAttribute(pCard.unitId)]})</span>
                        <span className={`font-black ${oMult >= 2.0 ? 'text-green-400' : oMult <= 0 ? 'text-red-500' : oMult < 1.0 ? 'text-orange-400' : 'text-gray-300'}`}>
                          {oMult}배 {oLabel ? `(${oLabel.replace(/ \(.*배\)/, '')})` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
