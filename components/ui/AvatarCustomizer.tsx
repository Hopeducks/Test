'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Player, AvatarConfig, CostumeId, CostumeItem, CostumeRarity } from '../../types';
import { useGameState } from '../../lib/game-state';
import { supabase } from '../../lib/supabase-client';
import { costumeCatalog } from '../../data/costume-catalog';
import { cards } from '../../data/cards';
import { gameAudio } from '../../lib/audio';
import { Sparkles, Coins, Lock, Check, X, ShieldAlert } from 'lucide-react';
import { ACHIEVEMENT_NAME_MAP } from '../../data/achievements';
import { PRESET_BODY_COLORS, CATEGORY_LABELS, ITEM_EMOJIS } from './avatar/avatar-constants';
import AvatarPreviewPanel from './avatar/AvatarPreviewPanel';
import AvatarModals from './avatar/AvatarModals';

interface AvatarCustomizerProps {
  onClose: () => void;
}

export default function AvatarCustomizer({ onClose }: AvatarCustomizerProps) {
  const { getLocalPlayer, setLocalPlayer } = useGameState();
  
  // Local states
  const [player, setPlayer] = useState<Player | null>(null);
  const [activeTab, setActiveTab] = useState<'outfit' | 'accessory' | 'vehicle' | 'hat' | 'badge' | 'pet' | 'title'>('outfit');
  
  // State 1D: selectedItems represents the current preview configuration
  const [selectedItems, setSelectedItems] = useState<Partial<AvatarConfig>>({
    bodyColor: '#06b6d4',
    outfit: null,
    accessory: null,
    vehicle: null,
    hat: null,
    badge: null,
    title: null,
    emote: null,
    petId: null,
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [hoveredItem, setHoveredItem] = useState<CostumeItem | null>(null);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  
  // Modals for purchasing / unlocking info
  const [purchaseConfirmItem, setPurchaseConfirmItem] = useState<CostumeItem | null>(null);
  const [unlockInfoItem, setUnlockInfoItem] = useState<CostumeItem | null>(null);

  // Initialize state from local player
  useEffect(() => {
    const localPlayer = getLocalPlayer();
    setPlayer(localPlayer);
    if (localPlayer) {
      setSelectedItems({
        bodyColor: localPlayer.avatar.bodyColor || '#06b6d4',
        outfit: localPlayer.avatar.outfit,
        accessory: localPlayer.avatar.accessory,
        vehicle: localPlayer.avatar.vehicle,
        hat: localPlayer.avatar.hat,
        badge: localPlayer.avatar.badge || null,
        title: localPlayer.avatar.title || null,
        emote: localPlayer.avatar.emote || null,
        petId: localPlayer.avatar.petId || null,
      });
    }
  }, []);

  // Sum current stats from equipped items in preview
  const previewStats = useMemo(() => {
    let hp = 0;
    let attack = 0;
    let defense = 0;

    const categories: Array<'outfit' | 'accessory' | 'vehicle' | 'hat' | 'badge' | 'title'> = ['outfit', 'accessory', 'vehicle', 'hat', 'badge', 'title'];
    categories.forEach(cat => {
      const itemId = selectedItems[cat];
      if (itemId && itemId !== 'none') {
        const item = costumeCatalog.find(c => c.id === itemId);
        if (item && item.stats) {
          hp += item.stats.hp || 0;
          attack += item.stats.attack || 0;
          defense += item.stats.defense || 0;
        }
      }
    });

    const petId = selectedItems.petId;
    if (petId && petId !== 'none') {
      const catalogPet = costumeCatalog.find(c => c.id === petId);
      if (catalogPet && catalogPet.stats) {
        hp += catalogPet.stats.hp || 0;
        attack += catalogPet.stats.attack || 0;
        defense += catalogPet.stats.defense || 0;
      }
    }

    return { hp, attack, defense };
  }, [selectedItems]);

  // Calculate stats difference on hover
  const hoveredStatsDelta = useMemo(() => {
    if (!hoveredItem) return null;
    
    const cat = hoveredItem.category;
    const currentId = cat === 'pet' ? selectedItems.petId : (selectedItems as any)[cat];
    
    let hpDelta = 0;
    let attackDelta = 0;
    let defenseDelta = 0;

    if (currentId && currentId !== 'none') {
      const currentItem = costumeCatalog.find(c => c.id === currentId);
      if (currentItem && currentItem.stats) {
        hpDelta -= currentItem.stats.hp || 0;
        attackDelta -= currentItem.stats.attack || 0;
        defenseDelta -= currentItem.stats.defense || 0;
      }
    }

    if (hoveredItem.stats) {
      hpDelta += hoveredItem.stats.hp || 0;
      attackDelta += hoveredItem.stats.attack || 0;
      defenseDelta += hoveredItem.stats.defense || 0;
    }

    return { hpDelta, attackDelta, defenseDelta };
  }, [hoveredItem, selectedItems]);

  if (!player) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
        <div className="text-cyan-400 font-mono text-lg animate-pulse">// LOADING CUSTOMIZER...</div>
      </div>
    );
  }

  // Get unlock conditions text helper
  const getUnlockText = (item: CostumeItem) => {
    switch (item.unlockCondition.type) {
      case 'default':
        return '기본 지급';
      case 'purchase':
        return `${item.unlockCondition.coinCost} 코인으로 상점 구매 가능`;
      case 'unit_complete':
        return `${item.unlockCondition.unitId}단원 복습 완료 시 해금`;
      case 'level':
        return `레벨 ${item.unlockCondition.level} 달성 시 해금`;
      case 'achievement': {
        const achName = ACHIEVEMENT_NAME_MAP[item.unlockCondition.achievementId] ?? item.unlockCondition.achievementId;
        return `특별 업적 [${achName}] 완료 시 해금`;
      }
      default:
        return '특수 조건 해금';
    }
  };

  const isUnlocked = (itemId: CostumeId) => {
    return player.unlockedCostumes.includes(itemId) || 
      itemId.endsWith('_none') ||
      costumeCatalog.find(c => c.id === itemId)?.unlockCondition.type === 'default';
  };

  // Perform purchase confirmed item
  const handleConfirmPurchase = async () => {
    const item = purchaseConfirmItem;
    if (!item || item.price === undefined) return;
    if (player.coins < item.price) {
      gameAudio.playClick();
      setMessage({ text: '코인이 부족하여 구매할 수 없습니다.', isError: true });
      setPurchaseConfirmItem(null);
      return;
    }

    setLoading(true);
    gameAudio.playClick();

    const updatedCoins = player.coins - item.price;
    const updatedUnlockedCostumes = [...player.unlockedCostumes, item.id];
    const updatedPlayer: Player = {
      ...player,
      coins: updatedCoins,
      unlockedCostumes: updatedUnlockedCostumes,
    };

    try {
      // Update DB
      const { error } = await supabase
        .from('players')
        .update({
          coins: updatedCoins,
          unlocked_costumes: updatedUnlockedCostumes,
        })
        .eq('id', player.id);

      if (error) throw error;

      setPlayer(updatedPlayer);
      setLocalPlayer(updatedPlayer);
      setSelectedItems(prev => ({
        ...prev,
        [item.category]: item.id
      }));
      setMessage({ text: `${item.name}을(를) 성공적으로 구매하여 장착했습니다!`, isError: false });
    } catch (err) {
      console.error(err);
      setMessage({ text: '구매 처리 중 오류가 발생했습니다.', isError: true });
    } finally {
      setLoading(false);
      setPurchaseConfirmItem(null);
    }
  };

  // Select body color preset
  const handleColorChange = (color: string) => {
    gameAudio.playClick();
    setSelectedItems(prev => ({
      ...prev,
      bodyColor: color
    }));
  };

  // Equip costume or open unlock condition/purchase modal
  const handleItemInteraction = (item: CostumeItem) => {
    gameAudio.playClick();
    if (isUnlocked(item.id)) {
      // Toggle equippable items
      setSelectedItems(prev => {
        if (item.category === 'pet') {
          return {
            ...prev,
            petId: prev.petId === item.id ? null : item.id
          };
        } else {
          const cat = item.category as keyof AvatarConfig;
          const val = prev[cat];
          return {
            ...prev,
            [cat]: val === item.id ? null : item.id
          };
        }
      });
    } else {
      // Locked item clicked
      if (item.price !== undefined) {
        // Shop item → open purchase confirmation modal
        setPurchaseConfirmItem(item);
      } else {
        // Standard locked item → open unlock info modal
        setUnlockInfoItem(item);
      }
    }
  };

  // Unequip category helper
  const handleUnequipCategory = (category: 'outfit' | 'accessory' | 'vehicle' | 'hat' | 'badge' | 'pet' | 'title') => {
    gameAudio.playClick();
    if (category === 'pet') {
      setSelectedItems(prev => ({
        ...prev,
        petId: null
      }));
    } else {
      setSelectedItems(prev => ({
        ...prev,
        [category]: null
      }));
    }
  };

  // Save selectedItems to player config and submit
  const handleConfirm = async () => {
    if (!player.nickname) return; // Disabled if nickname is missing
    setLoading(true);
    gameAudio.playClick();

    const finalAvatar: AvatarConfig = {
      bodyColor: selectedItems.bodyColor || '#06b6d4',
      outfit: selectedItems.outfit || null,
      accessory: selectedItems.accessory || null,
      vehicle: selectedItems.vehicle || null,
      hat: selectedItems.hat || null,
      badge: selectedItems.badge || null,
      title: selectedItems.title || null,
      emote: selectedItems.emote || null,
      petId: selectedItems.petId || null,
    };

    const updatedPlayer: Player = {
      ...player,
      avatar: finalAvatar,
    };

    try {
      // Update players table
      const { error } = await supabase
        .from('players')
        .update({
          avatar: finalAvatar,
        })
        .eq('id', player.id);

      if (error) throw error;

      // Update state manager and close
      setLocalPlayer(updatedPlayer);
      onClose();
    } catch (err) {
      console.error(err);
      setMessage({ text: '아바타 설정을 저장하는 도중 실패했습니다.', isError: true });
    } finally {
      setLoading(false);
    }
  };

  // Rarity styling helpers — 4단계 등급(epic 포함)
  const getRarityBadgeStyle = (rarity: CostumeRarity) => {
    switch (rarity) {
      case 'legendary':
        return 'border-amber-500/50 bg-amber-950/40 text-amber-400';
      case 'epic':
        return 'border-fuchsia-500/50 bg-fuchsia-950/40 text-fuchsia-300';
      case 'rare':
        return 'border-purple-500/50 bg-purple-950/40 text-purple-400';
      default:
        return 'border-cyan-500/50 bg-cyan-950/40 text-cyan-400';
    }
  };

  const isNicknameSet = !!player.nickname.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes avatar-custom-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes custom-sparkle-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .avatar-idle-bounce {
          animation: avatar-custom-bounce 2.5s ease-in-out infinite;
        }
        .legendary-sparkle-spin {
          animation: custom-sparkle-spin 12s linear infinite;
        }
        @keyframes scanner-sweep {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .animate-sweep {
          animation: scanner-sweep 4s ease-in-out infinite;
        }
        @keyframes avatar-pet-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-float {
          animation: avatar-pet-float 2s ease-in-out infinite;
        }
      `}} />

      <div className="glass-panel w-full max-w-5xl p-6 border-cyan-500/30 bg-[#090f1d] shadow-2xl relative flex flex-col md:flex-row gap-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Close Modal Button */}
        <button
          onClick={() => {
            gameAudio.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center border border-gray-800 hover:border-red-500/40 text-gray-500 hover:text-red-500 rounded-lg text-sm transition-all z-20"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Section: Live Character Preview (40%) */}
        <AvatarPreviewPanel
          selectedItems={selectedItems}
          previewStats={previewStats}
          hoveredStatsDelta={hoveredStatsDelta}
        />

        {/* Right Section: Preset Colors & Tabs & Grid (60%) */}
        <div className="flex-1 flex flex-col justify-between min-h-[50vh] md:min-h-0">
          <div className="space-y-5">
            {/* Header with Coins */}
            <div className="flex items-center justify-between border-b border-cyan-500/10 pb-4">
              <div>
                <h2 className="text-xl font-black text-cyan-400 tracking-wider">
                  대원 아바타 커스텀
                </h2>
                <p className="text-[9px] font-mono text-gray-500">
                  // NICKNAME: {player.nickname || 'NONE'} // SESSION: {player.sessionCode || 'SOLO'}
                </p>
              </div>

              {/* Coins Balance HUD */}
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-950/40 border border-amber-500/30 rounded-lg text-amber-400 font-bold text-sm">
                <Coins className="w-4 h-4 animate-pulse" />
                <span className="font-mono">{player.coins}</span>
              </div>
            </div>

            {/* Preset Color Picker placed at top of right panel */}
            <div className="p-3 bg-gray-950/50 border border-cyan-500/5 rounded-lg flex items-center justify-between gap-4">
              <span className="text-xs font-bold text-cyan-400/80 font-mono tracking-wider">
                피부 색상 선택
              </span>
              <div className="flex gap-2">
                {PRESET_BODY_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${
                      selectedItems.bodyColor === color
                        ? 'border-white scale-110 shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(CATEGORY_LABELS) as Array<'outfit' | 'accessory' | 'vehicle' | 'hat' | 'badge' | 'pet' | 'title'>).map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    gameAudio.playClick();
                    setActiveTab(category);
                  }}
                  className={`flex-1 min-w-[75px] py-2 text-xs font-bold border rounded-lg btn-cyber transition-all ${
                    activeTab === category
                       ? 'bg-cyan-950/30 border-cyan-400 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                      : 'bg-gray-900/50 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                  }`}
                >
                  {CATEGORY_LABELS[category]}
                </button>
              ))}
            </div>

            {/* Items Grid & 해제 Button */}
            <div className="relative">
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => handleUnequipCategory(activeTab)}
                  className="px-2 py-0.5 bg-red-950/20 border border-red-900/30 hover:border-red-500/50 text-red-400 rounded text-[10px] font-bold tracking-wider font-mono transition-all"
                >
                  [ 현재 장비 해제 ]
                </button>
              </div>

              {/* 4-Column Item Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-[32vh] overflow-y-auto pr-1">
                {activeTab === 'pet' ? (
                  (() => {
                    const catalogPets = costumeCatalog.filter(item => item.category === 'pet');
                    const cardPets = cards.filter(card => player.unlockedCards.includes(card.id));
                    
                    if (catalogPets.length === 0 && cardPets.length === 0) {
                      return (
                        <div className="col-span-4 p-8 text-center text-xs text-gray-500 font-mono">
                          해금된 펫이 없습니다!
                        </div>
                      );
                    }

                    return (
                      <>
                        {/* 1. Dedicated companion pets from catalog */}
                        {catalogPets.map((item) => {
                          const unlocked = isUnlocked(item.id);
                          const isEquipped = selectedItems.petId === item.id;
                          return (
                            <div
                              key={item.id}
                              onMouseEnter={() => setHoveredItem(item)}
                              onMouseLeave={() => setHoveredItem(null)}
                              onClick={() => {
                                gameAudio.playClick();
                                if (unlocked) {
                                  setSelectedItems(prev => ({
                                    ...prev,
                                    petId: prev.petId === item.id ? null : item.id
                                  }));
                                } else {
                                  if (item.price !== undefined) {
                                    setPurchaseConfirmItem(item);
                                  } else {
                                    setUnlockInfoItem(item);
                                  }
                                }
                              }}
                              className={`group relative p-3 rounded-lg border text-center flex flex-col items-center justify-between gap-2.5 card-cyber transition-all select-none cursor-pointer ${
                                isEquipped
                                  ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                                  : unlocked
                                    ? 'bg-gray-900/50 border-gray-800 text-gray-200 hover:border-cyan-500/40 hover:bg-gray-900'
                                    : 'bg-gray-950/30 border-gray-950/80 text-gray-650 hover:border-gray-900'
                              }`}
                            >
                              {!unlocked && (
                                <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-black/60 border border-red-500/10 rounded flex items-center justify-center text-red-400">
                                  <Lock className="w-3 h-3" />
                                </div>
                              )}
                              <span className={`text-4xl font-emoji ${!unlocked ? 'opacity-25 filter grayscale' : ''}`}>
                                {ITEM_EMOJIS[item.id] || '🐾'}
                              </span>
                              <div className="w-full">
                                <span className="text-[11px] font-bold block truncate text-gray-200">{item.name}</span>
                                <span className={`inline-block text-[8px] font-mono border px-1 rounded mt-0.5 ${getRarityBadgeStyle(item.rarity)}`}>
                                  {item.rarity.toUpperCase()} PET
                                </span>
                              </div>
                              <div className="w-full z-10">
                                {isEquipped ? (
                                  <span className="text-[9px] font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-1.5 py-0.5 rounded block">
                                    소환 완료
                                  </span>
                                ) : unlocked ? (
                                  <span className="text-[9px] text-gray-500 group-hover:text-cyan-400/80 block py-0.5">
                                    소환하기
                                  </span>
                                ) : item.price !== undefined ? (
                                  <div className="w-full py-1 bg-amber-500 group-hover:bg-amber-400 text-black font-black rounded text-[10px] flex items-center justify-center gap-0.5 transition-all shadow-[0_2px_4px_rgba(245,158,11,0.2)]">
                                    <Coins className="w-2.5 h-2.5" />
                                    <span>{item.price}</span>
                                  </div>
                                ) : (
                                  <span className="text-[8px] text-gray-500 font-bold block py-0.5">
                                    잠금 상태
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* 2. Unlocked cards as pets */}
                        {cardPets.map((card) => {
                          const isEquipped = selectedItems.petId === card.id;
                          return (
                            <div
                              key={card.id}
                              onMouseEnter={() => setHoveredItem({
                                id: card.id,
                                name: card.name,
                                category: 'pet',
                                rarity: card.rarity === 'legendary' ? 'legendary' : (card.rarity === 'rare' || card.rarity === 'epic' ? 'rare' : 'common'),
                                unlockCondition: { type: 'default' },
                                spriteKey: '',
                                stats: {}
                              })}
                              onMouseLeave={() => setHoveredItem(null)}
                              onClick={() => {
                                gameAudio.playClick();
                                setSelectedItems((prev) => ({
                                  ...prev,
                                  petId: prev.petId === card.id ? null : card.id
                                }));
                              }}
                              className={`group relative p-3 rounded-lg border text-center flex flex-col items-center justify-between gap-2.5 card-cyber transition-all select-none cursor-pointer ${
                                isEquipped
                                  ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                                  : 'bg-gray-900/50 border-gray-800 text-gray-200 hover:border-cyan-500/40 hover:bg-gray-900'
                              }`}
                            >
                              <span className="text-4xl font-emoji">
                                {card.image || '❓'}
                              </span>
                              <div className="w-full">
                                <span className="text-[11px] font-bold block truncate text-gray-200">{card.name}</span>
                                <span className={`inline-block text-[8px] font-mono border px-1 rounded mt-0.5 ${
                                  card.rarity === 'legendary' ? 'border-amber-500/50 bg-amber-950/40 text-amber-400' : 'border-cyan-500/50 bg-cyan-950/40 text-cyan-400'
                                }`}>
                                  {card.rarity?.toUpperCase() || 'COMMON'} CARD
                                </span>
                              </div>
                              <div className="w-full z-10">
                                {isEquipped ? (
                                  <span className="text-[9px] font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-1.5 py-0.5 rounded block">
                                    소환 완료
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-gray-500 group-hover:text-cyan-400/80 block py-0.5">
                                    소환하기
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </>
                    );
                  })()
                ) : (
                  costumeCatalog
                    .filter((item) => item.category === activeTab)
                    .map((item) => {
                      const unlocked = isUnlocked(item.id);
                      const isEquipped = selectedItems[activeTab] === item.id;

                    return (
                      <div
                        key={item.id}
                        onMouseEnter={() => setHoveredItem(item)}
                        onMouseLeave={() => setHoveredItem(null)}
                        onClick={() => handleItemInteraction(item)}
                        className={`group relative p-3 rounded-lg border text-center flex flex-col items-center justify-between gap-2.5 card-cyber transition-all select-none cursor-pointer ${
                          isEquipped
                            ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                            : unlocked
                              ? 'bg-gray-900/50 border-gray-800 text-gray-200 hover:border-cyan-500/40 hover:bg-gray-900'
                              : 'bg-gray-950/30 border-gray-950/80 text-gray-600 hover:border-gray-900'
                        }`}
                      >
                        {/* Legendary Sparks Icon Indicator */}
                        {item.rarity === 'legendary' && unlocked && (
                          <div className="absolute top-1.5 right-1.5 animate-pulse">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          </div>
                        )}

                        {/* Lock overlay for locked items */}
                        {!unlocked && (
                          <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-black/60 border border-red-500/10 rounded flex items-center justify-center text-red-400">
                            <Lock className="w-3 h-3" />
                          </div>
                        )}

                        <span className={`text-4xl font-emoji ${!unlocked ? 'opacity-25 filter grayscale' : ''}`}>
                          {ITEM_EMOJIS[item.id] || '👕'}
                        </span>

                        <div className="w-full">
                          <span className="text-[11px] font-bold block truncate text-gray-200">{item.name}</span>
                          <span className={`inline-block text-[8px] font-mono border px-1 rounded mt-0.5 ${getRarityBadgeStyle(item.rarity)}`}>
                            {item.rarity.toUpperCase()}
                          </span>
                        </div>

                        {/* Equip / Shop price badge */}
                        <div className="w-full z-10">
                          {isEquipped ? (
                            <span className="text-[9px] font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-1.5 py-0.5 rounded block">
                              장착 완료
                            </span>
                          ) : unlocked ? (
                            <span className="text-[9px] text-gray-500 group-hover:text-cyan-400/80 block py-0.5">
                              장착하기
                            </span>
                          ) : item.price !== undefined ? (
                            <div className="w-full py-1 bg-amber-500 group-hover:bg-amber-400 text-black font-black rounded text-[10px] flex items-center justify-center gap-0.5 transition-all shadow-[0_2px_4px_rgba(245,158,11,0.2)]">
                              <Coins className="w-2.5 h-2.5" />
                              <span>{item.price}</span>
                            </div>
                          ) : (
                            <span className="text-[8px] text-gray-500 font-bold block py-0.5">
                              잠금 상태
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {/* Hover Unlock Info Tooltip */}
              <div className="mt-4 p-3 bg-gray-950 border border-cyan-500/10 rounded-lg min-h-[52px] flex items-center justify-start gap-3">
                {hoveredItem ? (
                  <>
                    <span className="text-2xl">{ITEM_EMOJIS[hoveredItem.id]}</span>
                    <div className="text-left font-mono">
                      <div className="text-xs font-bold text-gray-100 flex items-center gap-1.5 font-sans">
                        {hoveredItem.name}
                        <span className={`text-[8px] px-1 border rounded ${getRarityBadgeStyle(hoveredItem.rarity)}`}>
                          {hoveredItem.rarity.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[10px] text-cyan-400 mt-0.5">
                        해금 조건: {getUnlockText(hoveredItem)}
                      </div>
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-gray-500 font-mono">// 아이템 카드 위에 마우스를 올리면 상세 정보와 해금 방법을 알 수 있습니다.</span>
                )}
              </div>
            </div>
          </div>

          {/* Feedback message display */}
          {message && (
            <div className={`mt-3 p-3 rounded-lg border text-xs font-mono text-center flex items-center justify-center gap-1.5 ${
              message.isError 
                ? 'bg-red-950/30 border-red-500/30 text-red-400' 
                : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400'
            }`}>
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{message.text}</span>
            </div>
          )}

          {/* Bottom Actions: Close and "입장하기" */}
          <div className="flex gap-3 mt-6 border-t border-cyan-500/10 pt-4">
            <button
              onClick={() => {
                gameAudio.playClick();
                onClose();
              }}
              disabled={loading}
              className="flex-1 py-3 bg-gray-900 hover:bg-gray-850 border border-gray-800 text-gray-400 hover:text-gray-200 rounded-lg text-xs font-bold btn-cyber transition-all"
            >
              닫기 (Close)
            </button>
            
            <button
              onClick={handleConfirm}
              disabled={loading || !isNicknameSet}
              className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed text-black font-black rounded-lg text-xs tracking-wider btn-cyber transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              title={!isNicknameSet ? '닉네임 등록이 선행되어야 메타버스에 입장할 수 있습니다.' : '메타버스 로비 입장'}
            >
              {loading ? '저장 중...' : '입장하기'}
            </button>
          </div>
        </div>
      </div>

      {/* Purchase / Unlock-info sub-modals */}
      <AvatarModals
        purchaseConfirmItem={purchaseConfirmItem}
        unlockInfoItem={unlockInfoItem}
        onCancelPurchase={() => setPurchaseConfirmItem(null)}
        onConfirmPurchase={handleConfirmPurchase}
        onCloseUnlock={() => setUnlockInfoItem(null)}
        getUnlockText={getUnlockText}
      />
    </div>
  );
}
