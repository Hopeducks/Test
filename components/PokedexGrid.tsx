'use client';

import React, { useState, useMemo } from 'react';
import { useGameState, getCardAttribute, ATTRIBUTE_EMOJIS, ATTRIBUTE_NAMES, ATTRIBUTE_COLORS } from '../lib/game-state';
import { cards } from '../data/cards';
import { UNITS } from './PokedexHome';
import { gameAudio } from '../lib/audio';
import { Search, X, BookOpen, Lock, Sparkles, SlidersHorizontal } from 'lucide-react';
import CardArt from './ui/CardArt';
import { CollectibleCard, CardRarity } from '../types';

/**
 * 카드 등급별 UI 테마 — epic 포함 4단계 정식화(F-2).
 * 흩어져 있던 legendary/rare/else 삼항을 단일 진실 원천으로 통합한다.
 */
interface RarityTheme {
  tile: string;       // 도감 타일 테두리/호버
  tag: string;        // 작은 등급 뱃지
  modalBorder: string;
  modalText: string;
  modalBadge: string;
  modalImageBox: string;
  modalButton: string;
}

const RARITY_THEMES: Record<CardRarity, RarityTheme> = {
  common: {
    tile: 'border-cyan-500/30 hover:border-cyan-400 hover:scale-[1.05] hover:shadow-[0_0_10px_rgba(0,229,255,0.2)]',
    tag: 'text-cyan-400 border-cyan-500/20 bg-cyan-950/30',
    modalBorder: 'border-cyan-400',
    modalText: 'text-cyan-400',
    modalBadge: 'bg-cyan-950/80 border-cyan-500 text-cyan-300',
    modalImageBox: 'bg-gradient-to-br from-cyan-950/30 to-black border-cyan-950/60',
    modalButton: 'bg-gradient-to-r from-cyan-400 to-cyan-300 hover:shadow-cyan-400/20',
  },
  uncommon: {
    tile: 'border-emerald-500/30 hover:border-emerald-400 hover:scale-[1.05] hover:shadow-[0_0_10px_rgba(16,185,129,0.2)]',
    tag: 'text-emerald-400 border-emerald-500/20 bg-emerald-950/30',
    modalBorder: 'border-emerald-400',
    modalText: 'text-emerald-400',
    modalBadge: 'bg-emerald-950/80 border-emerald-500 text-emerald-300',
    modalImageBox: 'bg-gradient-to-br from-emerald-950/30 to-black border-emerald-950/60',
    modalButton: 'bg-gradient-to-r from-emerald-400 to-emerald-300 hover:shadow-emerald-400/20',
  },
  rare: {
    tile: 'border-blue-500/40 hover:border-blue-400 hover:scale-[1.05] hover:shadow-[0_0_12px_rgba(59,130,246,0.25)]',
    tag: 'text-blue-400 border-blue-500/20 bg-blue-950/30',
    modalBorder: 'border-blue-500',
    modalText: 'text-blue-400',
    modalBadge: 'bg-blue-950/80 border-blue-500 text-blue-300',
    modalImageBox: 'bg-gradient-to-br from-blue-950/30 to-black border-blue-950/60',
    modalButton: 'bg-gradient-to-r from-blue-400 to-blue-300 hover:shadow-blue-400/20',
  },
  epic: {
    tile: 'border-fuchsia-500/40 hover:border-fuchsia-400 hover:scale-[1.05] hover:shadow-[0_0_14px_rgba(217,70,239,0.3)]',
    tag: 'text-fuchsia-300 border-fuchsia-500/25 bg-fuchsia-950/40',
    modalBorder: 'border-fuchsia-500',
    modalText: 'text-fuchsia-300',
    modalBadge: 'bg-fuchsia-950/80 border-fuchsia-500 text-fuchsia-200',
    modalImageBox: 'bg-gradient-to-br from-fuchsia-950/30 to-black border-fuchsia-950/60',
    modalButton: 'bg-gradient-to-r from-fuchsia-500 to-fuchsia-400 hover:shadow-fuchsia-500/20',
  },
  legendary: {
    tile: 'border-amber-500/40 hover:border-amber-400 hover:scale-[1.05] hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]',
    tag: 'text-amber-400 border-amber-500/20 bg-amber-950/30',
    modalBorder: 'border-amber-500',
    modalText: 'text-amber-400 text-gold-glow',
    modalBadge: 'bg-amber-950/80 border-amber-500 text-amber-300',
    modalImageBox: 'bg-gradient-to-br from-amber-950/30 to-black border-amber-950/60',
    modalButton: 'bg-gradient-to-r from-amber-500 to-amber-400 hover:shadow-amber-500/20',
  },
};

function rarityTheme(rarity?: CardRarity): RarityTheme {
  return RARITY_THEMES[rarity ?? 'common'] ?? RARITY_THEMES.common;
}

interface PokedexGridProps {
  onBack: () => void;
}

export default function PokedexGrid({ onBack }: PokedexGridProps) {
  const { progress, getCardEvolution } = useGameState();
  const { unlockedCardIds } = progress;

  const [selectedUnitFilter, setSelectedUnitFilter] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCard, setSelectedCard] = useState<CollectibleCard | null>(null);

  // Filtered card list
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const matchesUnit = selectedUnitFilter === 'all' || card.unitId === selectedUnitFilter;
      const matchesSearch = card.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            card.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesUnit && matchesSearch;
    });
  }, [selectedUnitFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = cards.length;
    const unlocked = cards.filter(c => unlockedCardIds.includes(c.id)).length;
    return {
      total,
      unlocked,
      percent: Math.round((unlocked / total) * 100)
    };
  }, [unlockedCardIds]);

  const handleCardClick = (card: CollectibleCard) => {
    const isUnlocked = unlockedCardIds.includes(card.id);
    if (!isUnlocked) {
      // Play a fail/locked sound
      gameAudio.playWrong();
      return;
    }
    
    // Play open sound
    gameAudio.playClick();
    setSelectedCard(card);
  };

  const getUnitName = (unitId: number) => {
    const unit = UNITS.find(u => u.id === unitId);
    return unit ? `${unitId}단원. ${unit.title}` : `${unitId}단원`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 animate-slide-up">
      {/* Pokedex Header Dashboard */}
      <div className="glass-panel p-6 mb-8 border-cyan-500/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <button
            onClick={() => {
              gameAudio.playClick();
              onBack();
            }}
            className="text-sm font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 mb-2 hover:underline touch-target"
          >
            ← BACK TO HOME
          </button>
          <h1 className="text-3xl md:text-4xl font-black tracking-wider text-cyan-400 text-neon-glow uppercase flex items-center gap-2">
            <BookOpen className="w-8 h-8" />
            마스터 도감 목록 (Pokedex)
          </h1>
        </div>

        <div className="flex items-center gap-4 bg-cyan-950/20 border border-cyan-500/10 px-6 py-3.5 rounded-xl font-mono">
          <div className="text-right">
            <div className="text-xs text-gray-500 tracking-wider">UNLOCKED DATA</div>
            <div className="text-2xl font-black text-cyan-400 text-neon-glow font-mono-numbers">
              {stats.unlocked} / {stats.total}
            </div>
          </div>
          <div className="h-8 w-[1px] bg-cyan-500/20" />
          <div className="text-left">
            <div className="text-xs text-gray-500 tracking-wider">SYNC RATE</div>
            <div className="text-2xl font-black text-amber-400 text-gold-glow font-mono-numbers">
              {stats.percent}%
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel: Filters, Tabs & Search */}
      <div className="glass-panel p-4 md:p-6 mb-8 border-cyan-500/10 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500/60" />
            <input
              type="text"
              placeholder="카드 이름 또는 설명 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-950/80 border border-cyan-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 font-medium text-base touch-target"
            />
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto text-gray-400 text-sm font-medium">
            <SlidersHorizontal className="w-4 h-4 text-cyan-500" />
            <span>단원 필터 (Unit Filters)</span>
          </div>
        </div>

        {/* Tab Buttons (Horizontal Scrollable) */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => {
              gameAudio.playClick();
              setSelectedUnitFilter('all');
            }}
            className={`px-4 py-2.5 rounded-lg text-sm font-bold tracking-wide uppercase shrink-0 transition-all border touch-target ${
              selectedUnitFilter === 'all'
                ? 'bg-cyan-500 text-black border-cyan-400 font-extrabold shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'bg-cyan-950/20 border-cyan-500/10 text-cyan-400 hover:border-cyan-500/30'
            }`}
          >
            전체 (All)
          </button>
          
          {UNITS.map((unit) => (
            <button
              key={unit.id}
              onClick={() => {
                gameAudio.playClick();
                setSelectedUnitFilter(unit.id);
              }}
              className={`px-4 py-2.5 rounded-lg text-sm font-bold tracking-wide shrink-0 transition-all border touch-target ${
                selectedUnitFilter === unit.id
                  ? 'bg-cyan-500 text-black border-cyan-400 font-extrabold shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                  : 'bg-cyan-950/20 border-cyan-500/10 text-cyan-400 hover:border-cyan-500/30'
              }`}
            >
              {unit.id}단원 ({unit.icon})
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      {filteredCards.length === 0 ? (
        <div className="glass-panel p-16 text-center border-cyan-500/10 text-gray-500 font-medium">
          <p className="text-xl">일치하는 과학 카드가 없습니다.</p>
          <p className="text-sm mt-2">검색어 또는 단원 필터를 다시 확인해보세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-4 select-none">
          {filteredCards.map((card) => {
            const isUnlocked = unlockedCardIds.includes(card.id);
            const theme = rarityTheme(card.rarity);
            const cardLevel = progress.cardLevels?.[card.id] || 1;
            const evolution = getCardEvolution(card.id, cardLevel);

            return (
              <div
                key={card.id}
                onClick={() => handleCardClick(card)}
                className={`glass-panel aspect-[3/4.2] flex flex-col justify-between p-3 cursor-pointer group relative overflow-hidden transition-all duration-300 border ${
                  isUnlocked
                    ? theme.tile
                    : 'border-gray-800/80 bg-gray-950/80 opacity-70 hover:opacity-100 cursor-not-allowed'
                }`}
              >
                {/* ID Tag */}
                <div className="flex justify-between items-center text-[10px] font-mono text-gray-600 mb-1">
                  <span className="flex items-center gap-1">
                    #{card.id.toUpperCase()}
                    {isUnlocked && <span title={getCardAttribute(card.unitId)} className="shrink-0">{ATTRIBUTE_EMOJIS[getCardAttribute(card.unitId)]}</span>}
                  </span>
                  {isUnlocked && (
                    <span className={`uppercase font-black px-1.5 py-0.5 rounded text-[8px] tracking-wide border ${theme.tag}`}>
                      {card.rarity || 'common'}
                    </span>
                  )}
                </div>

                {/* Display Body */}
                <div className="flex-1 flex flex-col items-center justify-center py-2">
                  {isUnlocked ? (
                    <div className="group-hover:scale-105 transition-transform">
                      <CardArt
                        unitId={card.unitId}
                        rarity={card.rarity as import('../types').CardRarity}
                        emoji={evolution.emoji}
                        name={evolution.name}
                        size="sm"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-800 flex items-center justify-center mb-1 bg-gray-900/40">
                        <Lock className="w-5 h-5 text-gray-700" />
                      </div>
                      <span className="text-xs font-mono font-bold text-gray-600 tracking-wider">LOCKED</span>
                    </>
                  )}
                </div>

                {/* Card footer indicator (unit ID) */}
                <div className="text-[10px] font-mono text-gray-500 text-center border-t border-cyan-500/5 pt-1.5 mt-1 flex justify-between px-1">
                  <span>UNIT 0{card.unitId}</span>
                  {isUnlocked && (
                    <span className="text-cyan-400 font-bold">LV.{cardLevel}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Card Details Modal (Overlay) */}
      {selectedCard && (() => {
        const cardLevel = progress.cardLevels?.[selectedCard.id] || 1;
        const cardXp = progress.cardXps?.[selectedCard.id] || 0;
        const maxLvl = cardLevel >= 10;
        const cardAttr = getCardAttribute(selectedCard.unitId);
        const evolution = getCardEvolution(selectedCard.id, cardLevel);
        const theme = rarityTheme(selectedCard.rarity);

        const advantages: Record<string, { strong: string[]; weak: string[] }> = {
          '불꽃': { strong: ['풀'], weak: ['물', '불꽃'] },
          '물': { strong: ['불꽃', '땅'], weak: ['물', '풀'] },
          '풀': { strong: ['물', '땅'], weak: ['불꽃', '풀', '비행'] },
          '전기': { strong: ['물', '비행'], weak: ['풀', '전기', '땅 (면역당함)'] },
          '땅': { strong: ['불꽃', '전기'], weak: ['풀', '비행 (면역당함)'] },
          '비행': { strong: ['풀'], weak: ['전기'] },
          '에스퍼': { strong: ['노말'], weak: ['에스퍼'] },
          '노말': { strong: [], weak: [] }
        };

        const advantageInfo = advantages[cardAttr] || { strong: [], weak: [] };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div
              className={`glass-panel w-full max-w-lg p-6 relative flex flex-col overflow-hidden bg-gradient-to-b from-[#0b0f19] to-[#04060c] border-2 shadow-[0_0_35px_rgba(0,0,0,0.8)] ${theme.modalBorder}`}
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  gameAudio.playClick();
                  setSelectedCard(null);
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-white bg-gray-950/80 border border-gray-800 p-2 rounded-lg touch-target"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Modal Header */}
              <div className="mb-4">
                <span className="text-xs font-mono text-cyan-500 uppercase tracking-widest block mb-1">
                  {getUnitName(selectedCard.unitId)}
                </span>
                <div className="flex items-center gap-3">
                  <h2 className={`text-2xl md:text-3xl font-black tracking-wide ${theme.modalText}`}>
                    {evolution.name}
                  </h2>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-black border uppercase tracking-wider ${theme.modalBadge}`}>
                    {selectedCard.rarity || 'common'}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-black border uppercase tracking-wider ${ATTRIBUTE_COLORS[getCardAttribute(selectedCard.unitId)]}`}>
                    {ATTRIBUTE_EMOJIS[getCardAttribute(selectedCard.unitId)]} {ATTRIBUTE_NAMES[getCardAttribute(selectedCard.unitId)]}
                  </span>
                </div>
              </div>

              {/* Larger Image Box */}
              <div className={`w-full aspect-[4/2.8] rounded-xl flex items-center justify-center relative mb-5 border overflow-hidden ${theme.modalImageBox}`}>
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,var(--color-neon-blue)_0%,transparent_70%)]" />
                <span className="text-8xl drop-shadow-[0_0_15px_rgba(255,255,255,0.25)] select-none">
                  {evolution.emoji}
                </span>
              </div>

              {/* Level & XP Gauge Bar */}
              <div className="space-y-4 mb-4 select-none">
                <div className="p-3 bg-gray-950/80 border border-cyan-500/10 rounded-xl text-left">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs font-bold text-cyan-400">카드의 훈련 등급 (Card Level)</span>
                    <span className="text-sm font-black text-amber-400 font-mono">
                      LV. {cardLevel} {maxLvl ? '(MAX)' : `(${cardXp} / 100 XP)`}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-900 border border-gray-800 rounded-full overflow-hidden p-[1px]">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-300"
                      style={{ width: `${maxLvl ? 100 : cardXp}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-500 mt-2 font-sans font-bold">
                    <span>해금된 기술: <span className="text-amber-400">{evolution.skills.join(', ')}</span></span>
                    <span className="font-mono text-cyan-400">전투력(CP): {20 + (cardLevel - 1) * 10}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono p-2.5 bg-gray-950/40 border border-gray-900 rounded-xl text-left">
                  <div className="space-y-1">
                    <span className="text-emerald-400 font-black flex items-center gap-1">💥 유리한 상대 (2.0x):</span>
                    <div className="text-gray-300">
                      {advantageInfo.strong.length > 0 ? advantageInfo.strong.join(', ') : '없음 (무상성)'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-red-400 font-black flex items-center gap-1">🛡️ 취약한 상대 (0.5x/0x):</span>
                    <div className="text-gray-300">
                      {advantageInfo.weak.length > 0 ? advantageInfo.weak.join(', ') : '없음 (무상성)'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Explanation / Description Box with 20px+ font size for classrooms */}
              <div className="bg-gray-950/60 border border-cyan-500/10 p-4 md:p-5 rounded-xl flex-1 max-h-60 overflow-y-auto mb-6">
                <h4 className="text-xs font-mono text-cyan-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  과학 교과 설명 (Scientific Concept)
                </h4>
                <p className="text-gray-100 text-[20px] md:text-[22px] font-medium leading-relaxed text-justify tracking-wide">
                  {selectedCard.description}
                </p>
              </div>

              {/* Confirm/Close Button */}
              <button
                onClick={() => {
                  gameAudio.playClick();
                  setSelectedCard(null);
                }}
                className={`w-full py-4 rounded-xl text-black font-extrabold text-lg tracking-wider uppercase transition-all transform hover:scale-[1.01] active:scale-[0.99] touch-target ${theme.modalButton}`}
              >
                확인 (Confirm)
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
