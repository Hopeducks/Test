'use client';

import React from 'react';
import { CostumeItem } from '../../../types';
import { gameAudio } from '../../../lib/audio';
import { ShoppingBag, HelpCircle } from 'lucide-react';

interface AvatarModalsProps {
  purchaseConfirmItem: CostumeItem | null;
  unlockInfoItem: CostumeItem | null;
  onCancelPurchase: () => void;
  onConfirmPurchase: () => void;
  onCloseUnlock: () => void;
  getUnlockText: (item: CostumeItem) => string;
}

export default function AvatarModals({
  purchaseConfirmItem,
  unlockInfoItem,
  onCancelPurchase,
  onConfirmPurchase,
  onCloseUnlock,
  getUnlockText,
}: AvatarModalsProps) {
  return (
    <>
      {/* ── SUB-MODAL 1: Coins Purchase Confirm ── */}
      {purchaseConfirmItem && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-sm p-6 border-amber-500/30 bg-[#0e0a05] shadow-2xl relative text-center">
            <div className="w-12 h-12 bg-amber-950/50 border border-amber-500/30 rounded-full flex items-center justify-center text-amber-400 mx-auto mb-4 animate-bounce">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-amber-400 mb-2">상점 코스튬 구매</h3>
            <p className="text-xs text-gray-300 leading-relaxed mb-5">
              정말로 <span className="text-amber-400 font-bold font-sans">[{purchaseConfirmItem.name}]</span> 코스튬을 구매하시겠습니까?<br />
              구매 가격: <span className="text-amber-400 font-mono font-bold">{purchaseConfirmItem.price} 코인</span>이 차감됩니다.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  gameAudio.playClick();
                  onCancelPurchase();
                }}
                className="flex-1 py-2 bg-gray-900 border border-gray-800 text-gray-400 hover:text-white rounded text-xs font-bold transition-all"
              >
                취소
              </button>
              <button
                onClick={onConfirmPurchase}
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-450 text-black font-black rounded text-xs transition-all shadow-[0_0_10px_rgba(245,158,11,0.2)]"
              >
                구매 승인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SUB-MODAL 2: Locked Condition Explanation ── */}
      {unlockInfoItem && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-sm p-6 border-red-500/30 bg-[#120707] shadow-2xl relative text-center">
            <div className="w-12 h-12 bg-red-950/50 border border-red-500/30 rounded-full flex items-center justify-center text-red-400 mx-auto mb-4 animate-pulse">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-red-400 mb-2">잠금된 코스튬 정보</h3>
            <p className="text-xs text-gray-300 leading-relaxed mb-6">
              아이템명: <span className="text-white font-bold">{unlockInfoItem.name}</span><br />
              등급: <span className="text-red-400 font-mono font-bold">{unlockInfoItem.rarity.toUpperCase()}</span>
            </p>
            <div className="p-3 bg-black/80 border border-red-900/20 rounded-lg text-left text-xs text-gray-400 font-mono mb-6">
              <span className="text-[10px] text-red-400 font-bold block mb-1">획득/해금 조건:</span>
              {getUnlockText(unlockInfoItem)}
            </div>
            <button
              onClick={() => {
                gameAudio.playClick();
                onCloseUnlock();
              }}
              className="w-full py-2 bg-gray-900 border border-gray-800 text-gray-300 hover:text-white rounded text-xs font-bold transition-all"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
}
