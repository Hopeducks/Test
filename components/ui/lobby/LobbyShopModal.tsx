'use client';

import React from 'react';
import { gameAudio } from '../../../lib/audio';
import { GameProgress, ItemInventory } from '../../../types';

interface LobbyShopModalProps {
  progress: GameProgress;
  onPurchase: (key: keyof ItemInventory, price: number, amount: number) => boolean;
  onClose: () => void;
}

const SHOP_ITEMS: { key: keyof ItemInventory; name: string; emoji: string; desc: string; price: number }[] = [
  { key: 'superBall', name: '수퍼볼', emoji: '🔵', desc: '카드 포획 확률 1.5배 상승 (성공 구간 확대)', price: 50 },
  { key: 'ultraBall', name: '하이퍼볼', emoji: '🟡', desc: '카드 포획 확률 2.0배 상승 (성공 구간 대폭 확대)', price: 100 },
  { key: 'masterBall', name: '마스터볼', emoji: '🟣', desc: '포획 확률 100% 무조건 성공 보장 (화면 전체 판정)', price: 300 },
  { key: 'potion', name: '상처약', emoji: '🧪', desc: '1v1 카드 배틀 매치에서 HP를 30 회복합니다.', price: 20 },
  { key: 'potionHyper', name: '좋은상처약', emoji: '🔋', desc: '1v1 카드 배틀 매치에서 HP를 60 회복합니다.', price: 40 },
  { key: 'potionMax', name: '풀회복약', emoji: '🌟', desc: '1v1 카드 배틀 매치에서 HP를 100% 회복합니다.', price: 80 },
  { key: 'revive', name: '기력의조각', emoji: '💊', desc: '위기 상태(체력 30 이하)에서 체력을 50 회복합니다.', price: 60 },
  { key: 'magnifier', name: '돋보기', emoji: '🔍', desc: '퀴즈를 풀 때 오답 2개를 지워줍니다.', price: 15 },
  { key: 'watch', name: '모래시계', emoji: '⏱️', desc: '보스전 및 시간제한 상황에서 제한시간을 10초 늘려줍니다.', price: 15 },
];

export default function LobbyShopModal({ progress, onPurchase, onClose }: LobbyShopModalProps) {
  const myCoins = progress.coins !== undefined ? progress.coins : progress.unlockedCardIds.length * 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="glass-panel w-full max-w-2xl p-6 border-amber-500/30 bg-gradient-to-b from-[#140e06] to-[#040301] shadow-2xl relative animate-scale-up">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-amber-500/20 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🪙</span>
            <div>
              <h3 className="text-lg font-black text-amber-450">포켓 상점 (Poké Shop)</h3>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">// MERCHANT SUPPLIER DR. POKE</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl px-4 py-2 flex items-center gap-2 text-xs font-black text-amber-300">
              <span>보유 코인:</span>
              <span>🪙 {myCoins}</span>
            </div>
            <button
              onClick={() => {
                gameAudio.playClick();
                onClose();
              }}
              className="text-gray-400 hover:text-white border border-gray-800 hover:border-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            >
              닫기 (CLOSE)
            </button>
          </div>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-[350px] overflow-y-auto pr-1">
          {SHOP_ITEMS.map(item => {
            const owned = progress.items?.[item.key] || 0;
            const canBuy = myCoins >= item.price;

            return (
              <div key={item.key} className="p-3 bg-gray-950/60 border border-gray-900 rounded-xl flex flex-col justify-between space-y-3 relative group hover:border-amber-500/25 transition-all text-left">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl shrink-0 animate-bounce">{item.emoji}</span>
                    <span className="text-[10px] font-bold text-gray-500 font-mono">소지: {owned}개</span>
                  </div>
                  <h4 className="text-xs font-black text-gray-200">{item.name}</h4>
                  <p className="text-[9px] text-gray-405 leading-normal line-clamp-3">{item.desc}</p>
                </div>

                <div className="flex items-center justify-between border-t border-gray-900 pt-2 mt-auto">
                  <span className="text-[11px] font-black text-amber-400">🪙 {item.price}</span>
                  <button
                    disabled={!canBuy}
                    onClick={() => {
                      const success = onPurchase(item.key, item.price, 1);
                      if (success) {
                        gameAudio.playCatchSuccess();
                      } else {
                        gameAudio.playWrong();
                      }
                    }}
                    className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${
                      canBuy
                        ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_6px_rgba(245,158,11,0.2)]'
                        : 'bg-gray-900 text-gray-650 cursor-not-allowed'
                    }`}
                  >
                    구매
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
