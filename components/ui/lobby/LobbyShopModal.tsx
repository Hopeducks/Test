'use client';

import React, { useState } from 'react';
import { gameAudio } from '../../../lib/audio';
import { GameProgress, ItemInventory } from '../../../types';

interface LobbyShopModalProps {
  progress: GameProgress;
  onPurchase: (key: keyof ItemInventory, price: number, amount: number) => boolean;
  onClose: () => void;
}

type ShopItem = {
  key: keyof ItemInventory;
  name: string;
  emoji: string;
  desc: string;
  price: number;
  category: 'ball' | 'potion' | 'support';
  rarity: 'common' | 'rare' | 'epic';
};

const SHOP_ITEMS: ShopItem[] = [
  { key: 'magnifier', name: '돋보기', emoji: '🔍', desc: '퀴즈 풀 때 오답 2개를 소거합니다', price: 20, category: 'support', rarity: 'common' },
  { key: 'watch', name: '모래시계', emoji: '⏱️', desc: '보스전 제한시간 +10초', price: 20, category: 'support', rarity: 'common' },
  { key: 'potion', name: '상처약', emoji: '🧪', desc: '배틀 HP +30 회복', price: 25, category: 'potion', rarity: 'common' },
  { key: 'potionHyper', name: '좋은상처약', emoji: '🔋', desc: '배틀 HP +60 회복', price: 50, category: 'potion', rarity: 'rare' },
  { key: 'revive', name: '기력의조각', emoji: '💊', desc: '위기(HP 30↓) 시 HP +50 자동 회복', price: 70, category: 'potion', rarity: 'rare' },
  { key: 'superBall', name: '수퍼볼', emoji: '🔵', desc: '카드 포획 확률 ×1.5배 (성공구간 확대)', price: 60, category: 'ball', rarity: 'rare' },
  { key: 'potionMax', name: '풀회복약', emoji: '🌟', desc: '배틀 HP 100% 완전 회복', price: 100, category: 'potion', rarity: 'epic' },
  { key: 'ultraBall', name: '하이퍼볼', emoji: '🟡', desc: '카드 포획 확률 ×2.0배 (성공구간 대폭 확대)', price: 130, category: 'ball', rarity: 'epic' },
  { key: 'masterBall', name: '마스터볼', emoji: '🟣', desc: '포획 확률 100% 무조건 성공 보장', price: 350, category: 'ball', rarity: 'epic' },
];

const RARITY_STYLES: Record<ShopItem['rarity'], { card: string; badge: string; price: string; glow: string }> = {
  common:    { card: 'border-gray-800 hover:border-cyan-500/30',      badge: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/30',      price: 'text-amber-300',  glow: '' },
  rare:      { card: 'border-purple-900/60 hover:border-purple-500/40', badge: 'text-purple-300 border-purple-500/40 bg-purple-950/30', price: 'text-amber-300',  glow: 'shadow-[0_0_8px_rgba(168,85,247,0.12)]' },
  epic:      { card: 'border-fuchsia-900/60 hover:border-fuchsia-500/50', badge: 'text-fuchsia-300 border-fuchsia-500/50 bg-fuchsia-950/40', price: 'text-amber-400', glow: 'shadow-[0_0_12px_rgba(217,70,239,0.2)]' },
};

const CATEGORY_LABELS: Record<ShopItem['category'], string> = {
  ball: '🎯 포획볼',
  potion: '💊 회복약',
  support: '🛠 지원도구',
};

export default function LobbyShopModal({ progress, onPurchase, onClose }: LobbyShopModalProps) {
  const myCoins = progress.coins ?? 0;
  const [activeCategory, setActiveCategory] = useState<ShopItem['category'] | 'all'>('all');
  const [flashItem, setFlashItem] = useState<keyof ItemInventory | null>(null);

  const filteredItems = activeCategory === 'all'
    ? SHOP_ITEMS
    : SHOP_ITEMS.filter(i => i.category === activeCategory);

  const handleBuy = (item: ShopItem) => {
    if (myCoins < item.price) {
      gameAudio.playWrong();
      return;
    }
    const success = onPurchase(item.key, item.price, 1);
    if (success) {
      gameAudio.playCatchSuccess();
      setFlashItem(item.key);
      setTimeout(() => setFlashItem(null), 800);
    } else {
      gameAudio.playWrong();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div
        className="w-full max-w-2xl rounded-2xl border border-amber-500/25 bg-gradient-to-b from-[#160f03] via-[#0d0900] to-[#040301] shadow-[0_0_60px_rgba(245,158,11,0.12)] flex flex-col overflow-hidden animate-scale-up"
        style={{ maxHeight: '90vh' }}
      >
        {/* ── Header ── */}
        <div className="shrink-0 px-6 pt-5 pb-4 border-b border-amber-500/15 flex items-center justify-between gap-4 bg-amber-950/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-xl">
              🏪
            </div>
            <div>
              <h3 className="text-base font-black text-amber-300 tracking-wide leading-none">포켓 상점</h3>
              <p className="text-[9px] font-mono text-amber-700 mt-0.5 tracking-widest uppercase">// Merchant Dr. Poke</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Coin balance */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-950/50 border border-amber-500/30">
              <span className="text-lg leading-none">🪙</span>
              <div>
                <div className="text-[9px] text-amber-700 font-mono leading-none">보유 코인</div>
                <div className="text-sm font-black text-amber-300 leading-none">{myCoins}</div>
              </div>
            </div>
            <button
              onClick={() => { gameAudio.playClick(); onClose(); }}
              className="w-8 h-8 flex items-center justify-center border border-gray-800 hover:border-red-500/40 text-gray-500 hover:text-red-400 rounded-lg text-sm transition-all"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Category Tabs ── */}
        <div className="shrink-0 px-6 pt-4 pb-2 flex gap-2">
          {(['all', 'ball', 'potion', 'support'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => { gameAudio.playClick(); setActiveCategory(cat); }}
              className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg border transition-all ${
                activeCategory === cat
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-gray-900/50 border-gray-800 text-gray-500 hover:text-gray-300 hover:border-gray-700'
              }`}
            >
              {cat === 'all' ? '🗃 전체' : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* ── Items Grid ── */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {filteredItems.map(item => {
              const owned = progress.items?.[item.key] ?? 0;
              const canBuy = myCoins >= item.price;
              const isFlashing = flashItem === item.key;
              const rs = RARITY_STYLES[item.rarity];

              return (
                <div
                  key={item.key}
                  className={`relative rounded-xl border bg-gray-950/70 flex flex-col transition-all duration-300 ${rs.card} ${rs.glow} ${
                    isFlashing ? 'scale-[1.03] border-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.4)]' : ''
                  }`}
                >
                  {/* Owned badge */}
                  {owned > 0 && (
                    <div className="absolute top-2 right-2 bg-emerald-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none z-10">
                      ×{owned}
                    </div>
                  )}

                  <div className="p-4 flex flex-col gap-2.5 flex-1">
                    {/* Rarity + Icon */}
                    <div className="flex items-start justify-between">
                      <div className="text-3xl leading-none">{item.emoji}</div>
                      <span className={`text-[8px] font-mono font-bold border px-1.5 py-0.5 rounded ${rs.badge}`}>
                        {item.rarity.toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-black text-gray-100 leading-tight">{item.name}</div>
                      <div className="text-[10px] text-gray-500 mt-1 leading-snug">{item.desc}</div>
                    </div>
                  </div>

                  {/* Buy Row */}
                  <div className="px-4 pb-4 flex items-center justify-between gap-2">
                    <div className={`flex items-center gap-1 text-sm font-black ${rs.price}`}>
                      <span className="text-base leading-none">🪙</span>
                      <span>{item.price}</span>
                    </div>
                    <button
                      onClick={() => handleBuy(item)}
                      disabled={!canBuy}
                      className={`px-4 py-1.5 text-[11px] font-black rounded-lg transition-all ${
                        canBuy
                          ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_2px_8px_rgba(245,158,11,0.3)]'
                          : 'bg-gray-900 text-gray-600 cursor-not-allowed border border-gray-800'
                      }`}
                    >
                      {canBuy ? '구매' : '코인 부족'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Low coin hint */}
          {myCoins < 20 && (
            <div className="mt-4 p-3 rounded-xl bg-amber-950/30 border border-amber-500/15 text-center">
              <p className="text-[11px] text-amber-600 font-mono">
                💡 퀴즈 단원 최초 완료, 체육관 관장 격파, 퀘스트 달성 시 코인을 획득할 수 있습니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
