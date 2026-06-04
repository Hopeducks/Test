'use client';

import React from 'react';
import { AvatarConfig, CostumeId } from '../../../types';
import { costumeCatalog } from '../../../data/costume-catalog';
import { cards } from '../../../data/cards';
import { Sparkles } from 'lucide-react';
import { ITEM_EMOJIS } from './avatar-constants';

interface AvatarPreviewPanelProps {
  selectedItems: Partial<AvatarConfig>;
  previewStats: { hp: number; attack: number; defense: number };
  hoveredStatsDelta: { hpDelta: number; attackDelta: number; defenseDelta: number } | null;
}

export default function AvatarPreviewPanel({ selectedItems, previewStats, hoveredStatsDelta }: AvatarPreviewPanelProps) {
  // 전설 등급 아이템 장착 시 회전 스파클 이펙트 트리거
  const checkLegendary = (id: CostumeId | null) => {
    if (!id) return false;
    const found = costumeCatalog.find(c => c.id === id);
    return found?.rarity === 'legendary';
  };
  const hasLegendaryEquipped =
    checkLegendary(selectedItems.outfit || null) ||
    checkLegendary(selectedItems.accessory || null) ||
    checkLegendary(selectedItems.vehicle || null) ||
    checkLegendary(selectedItems.hat || null);

  return (
    <div className="w-full md:w-[40%] flex flex-col items-center border-r border-cyan-500/10 pr-0 md:pr-6 pb-6 md:pb-0 shrink-0">
      <h3 className="text-[10px] font-mono text-cyan-500 tracking-widest uppercase mb-4 text-center">
        // LIVE AVATAR SIMULATION
      </h3>

      <div className="relative w-52 h-52 flex items-center justify-center mb-6 bg-gray-950/60 border border-cyan-500/35 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.15)] bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.15)_0%,transparent_70%)]">
        {/* Holographic Scanline Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.35)_50%)] bg-[size:100%_4px] pointer-events-none opacity-50 z-28" />

        {/* Glowing vertical scanner beam */}
        <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_rgba(6,182,212,0.8)] absolute left-0 z-29 animate-sweep" />

        {/* Corner Bracket Accents (Hologram look) */}
        <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-500/60" />
        <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyan-500/60" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyan-500/60" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-500/60" />

        {/* Background color glow matching current skin */}
        <div
          className="absolute inset-4 rounded-full blur-3xl opacity-20 transition-all duration-500"
          style={{ backgroundColor: selectedItems.bodyColor }}
        />

        {/* Sparkles rotating background for legendary config */}
        {hasLegendaryEquipped && (
          <div className="absolute inset-0 flex items-center justify-center legendary-sparkle-spin pointer-events-none">
            <Sparkles className="w-44 h-44 text-amber-400/25 absolute animate-pulse" />
            <Sparkles className="w-40 h-40 text-amber-500/15 absolute transform rotate-45" />
          </div>
        )}

        {/* CSS Layered Avatar Preview container */}
        <div className="relative w-40 h-40 flex items-center justify-center avatar-idle-bounce z-20">

          {/* Layer 0: Title Text (renders above head) */}
          {selectedItems.title && (
            <div className="absolute top-[-25px] px-2 py-0.5 bg-cyan-950/80 border border-cyan-400/40 rounded text-[9px] font-bold text-cyan-400 whitespace-nowrap z-50">
              {costumeCatalog.find(c => c.id === selectedItems.title)?.name}
            </div>
          )}

          {/* Layer 1: Vehicle (renders behind/under body) */}
          {selectedItems.vehicle && (
            <span className="absolute bottom-1 z-10 text-5xl font-emoji filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]">
              {ITEM_EMOJIS[selectedItems.vehicle] || selectedItems.vehicle}
            </span>
          )}

          {/* Layer 2: Colored Body Circle */}
          <div
            className="relative w-24 h-24 rounded-full border-4 border-cyan-400/40 flex items-center justify-center shadow-lg transition-all duration-300 z-20"
            style={{ backgroundColor: selectedItems.bodyColor }}
          >
            {/* Layer 3: Base Character Face */}
            <span className="text-4xl select-none z-22 font-emoji filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">🧑‍🎓</span>

            {/* Layer 3.5: Badge (chest emblem) */}
            {selectedItems.badge && (
              <span className="absolute bottom-1 right-1 text-2xl z-30 font-emoji filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                {ITEM_EMOJIS[selectedItems.badge] || '🎖️'}
              </span>
            )}

            {/* Layer 4: Outfit (positioned on top of body) */}
            {selectedItems.outfit && (
              <span className="absolute bottom-1 right-1 text-3xl z-30 font-emoji filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                {ITEM_EMOJIS[selectedItems.outfit] || selectedItems.outfit}
              </span>
            )}

            {/* Layer 5: Accessory (positioned on side) */}
            {selectedItems.accessory && (
              <span className="absolute bottom-2 left-[-12px] text-3xl z-30 font-emoji filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                {ITEM_EMOJIS[selectedItems.accessory] || selectedItems.accessory}
              </span>
            )}

            {/* Layer 6: Hat (on top of head) */}
            {selectedItems.hat && (
              <span className="absolute top-[-20px] text-4xl z-40 font-emoji filter drop-shadow-[0_3px_5px_rgba(0,0,0,0.5)]">
                {ITEM_EMOJIS[selectedItems.hat] || selectedItems.hat}
              </span>
            )}
          </div>

          {/* Layer 7: Pet (rendered floating beside avatar) */}
          {selectedItems.petId && (
            <div className="absolute right-[-24px] top-[24px] text-4xl animate-float pointer-events-none select-none z-30 font-emoji filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]">
              {costumeCatalog.find(c => c.id === selectedItems.petId)?.name
                ? ITEM_EMOJIS[selectedItems.petId] || '🐾'
                : cards.find(c => c.id === selectedItems.petId)?.image || '❓'}
              <span className="absolute bottom-[-10px] left-1/2 transform -translate-x-1/2 px-1 py-0.2 bg-black/75 border border-cyan-500/30 rounded text-[6px] font-mono text-cyan-400 font-bold whitespace-nowrap tracking-wider select-none animate-pulse">PET</span>
            </div>
          )}
        </div>
      </div>

      {/* Current selections display */}
      <div className="p-3.5 bg-gray-950/80 border border-cyan-500/10 rounded-lg w-full">
        <span className="text-cyan-400 font-bold text-xs block mb-2 font-mono tracking-wide">// CURRENT EQUIPMENT</span>
        <div className="text-[11px] text-gray-400 space-y-1.5 font-mono text-left">
          <div className="flex justify-between border-b border-cyan-500/5 pb-1">
            <span>의상 (Outfit):</span>
            <span className="text-gray-200 font-bold">
              {selectedItems.outfit ? costumeCatalog.find(c => c.id === selectedItems.outfit)?.name : '미장착'}
            </span>
          </div>
          <div className="flex justify-between border-b border-cyan-500/5 pb-1">
            <span>악세서리 (Acc):</span>
            <span className="text-gray-200 font-bold">
              {selectedItems.accessory ? costumeCatalog.find(c => c.id === selectedItems.accessory)?.name : '미장착'}
            </span>
          </div>
          <div className="flex justify-between border-b border-cyan-500/5 pb-1">
            <span>탈것 (Mount):</span>
            <span className="text-gray-200 font-bold">
              {selectedItems.vehicle ? costumeCatalog.find(c => c.id === selectedItems.vehicle)?.name : '미장착'}
            </span>
          </div>
          <div className="flex justify-between border-b border-cyan-500/5 pb-1">
            <span>모자 (Hat):</span>
            <span className="text-gray-200 font-bold">
              {selectedItems.hat ? costumeCatalog.find(c => c.id === selectedItems.hat)?.name : '미장착'}
            </span>
          </div>
          <div className="flex justify-between border-b border-cyan-500/5 pb-1">
            <span>배지 (Badge):</span>
            <span className="text-gray-200 font-bold">
              {selectedItems.badge ? costumeCatalog.find(c => c.id === selectedItems.badge)?.name : '미장착'}
            </span>
          </div>
          <div className="flex justify-between border-b border-cyan-500/5 pb-1">
            <span>칭호 (Title):</span>
            <span className="text-gray-200 font-bold">
              {selectedItems.title ? costumeCatalog.find(c => c.id === selectedItems.title)?.name : '미장착'}
            </span>
          </div>
          <div className="flex justify-between pb-1">
            <span>펫 (Pet):</span>
            <span className="text-gray-200 font-bold">
              {selectedItems.petId
                ? costumeCatalog.find(c => c.id === selectedItems.petId)?.name || cards.find(c => c.id === selectedItems.petId)?.name
                : '미장착'}
            </span>
          </div>
        </div>
      </div>

      {/* 📊 STATS BONUS HUD */}
      <div className="p-3.5 bg-gray-950/80 border border-cyan-500/10 rounded-lg w-full mt-3">
        <span className="text-cyan-400 font-bold text-xs block mb-2 font-mono tracking-wide">// COMBAT STATS BONUS</span>
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
          <div className="p-2 bg-cyan-950/20 border border-cyan-500/5 rounded">
            <span className="text-gray-500 block text-[9px]">체력 (HP)</span>
            <span className="text-base font-extrabold text-cyan-400">+{previewStats.hp}</span>
            {hoveredStatsDelta && hoveredStatsDelta.hpDelta !== 0 && (
              <span className={`text-[10px] ml-1 font-bold ${hoveredStatsDelta.hpDelta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                ({hoveredStatsDelta.hpDelta > 0 ? '+' : ''}{hoveredStatsDelta.hpDelta})
              </span>
            )}
          </div>
          <div className="p-2 bg-cyan-950/20 border border-cyan-500/5 rounded">
            <span className="text-gray-500 block text-[9px]">공격 (ATK)</span>
            <span className="text-base font-extrabold text-cyan-400">+{previewStats.attack}</span>
            {hoveredStatsDelta && hoveredStatsDelta.attackDelta !== 0 && (
              <span className={`text-[10px] ml-1 font-bold ${hoveredStatsDelta.attackDelta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                ({hoveredStatsDelta.attackDelta > 0 ? '+' : ''}{hoveredStatsDelta.attackDelta})
              </span>
            )}
          </div>
          <div className="p-2 bg-cyan-950/20 border border-cyan-500/5 rounded">
            <span className="text-gray-500 block text-[9px]">방어 (DEF)</span>
            <span className="text-base font-extrabold text-cyan-400">+{previewStats.defense}</span>
            {hoveredStatsDelta && hoveredStatsDelta.defenseDelta !== 0 && (
              <span className={`text-[10px] ml-1 font-bold ${hoveredStatsDelta.defenseDelta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                ({hoveredStatsDelta.defenseDelta > 0 ? '+' : ''}{hoveredStatsDelta.defenseDelta})
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
