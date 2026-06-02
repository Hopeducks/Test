'use client';

import React from 'react';
import { cards } from '../../data/cards';

export const ITEM_EMOJIS: Record<string, string> = {
  outfit_scientist: '🥼',
  outfit_spacesuit: '🧑‍🚀',
  outfit_diver: '🧑‍🤿',
  outfit_paleontologist: '🦕',
  outfit_chemist: '🧪',
  outfit_meteorologist: '🌦️',
  outfit_doctor: '🧑‍⚕️',
  outfit_optics: '👓',
  outfit_eco: '🌱',
  outfit_legend: '🏆',

  accessory_magnifier: '🔍',
  accessory_goggles: '🥽',
  accessory_stethoscope: '🩺',
  accessory_compass: '🧭',
  accessory_prism: '💎',
  accessory_testtube: '🧪',
  accessory_crystal: '🔮',

  vehicle_rocket: '🚀',
  vehicle_ufo: '🛸',
  vehicle_submarine: '🚢',
  vehicle_balloon: '🎈',
  vehicle_skates: '🛼',
  vehicle_scooter: '🛴',

  hat_explorer: '🤠',
  hat_mortarboard: '🎓',
  hat_helmet: '🪖',
  hat_beanie: '🧢',
  hat_spacesuit_helmet: '👨‍🚀',
  hat_crown: '👑',

  accessory_badge: '🎖️',
  accessory_badge_u1: '🪨',
  accessory_badge_u2: '🌟',
  accessory_badge_u3: '💧',
  accessory_badge_u4: '❤️',
  accessory_badge_u5: '🌿',
  accessory_badge_u6: '🌀',
  accessory_badge_u7: '👟',
  accessory_badge_u8: '🧪',

  title_beginner: '🔰',
  title_gym_breaker: '🏆',
  title_science_master: '👑',

  pet_robo: '🤖',
  pet_slime: '🟢',
  pet_dino: '🦖',
  pet_cat: '🐱',
  pet_dragon: '🐉',
};

export function RenderAvatarPreview({
  baseAvatar,
  outfit,
  expression,
  accessory,
  mount = 'none',
  hat = 'none',
  badge = 'none',
  title = 'none',
  petId = 'none',
  bodyColor = '#06b6d4',
  size = 'md',
}: {
  baseAvatar: string;
  outfit: string;
  expression: string;
  accessory: string;
  mount?: string;
  hat?: string;
  badge?: string;
  title?: string;
  petId?: string;
  bodyColor?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const sizeClasses = {
    sm: 'w-10 h-10 text-xl',
    md: 'w-14 h-14 text-2xl',
    lg: 'w-20 h-20 text-4xl',
    xl: 'w-28 h-28 text-6xl',
  };

  const layerSizes = {
    sm: {
      base: 'text-xl',
      mount: 'text-2xl bottom-0.5 z-10',
      outfit: 'text-sm bottom-0.5 right-0.5 z-30',
      accessory: 'text-sm bottom-0.5 left-[-2px] z-30',
      hat: 'text-base top-[-6px] z-40',
      emote: 'text-[8px] top-0.5 left-0.5 z-30',
    },
    md: {
      base: 'text-2xl',
      mount: 'text-3xl bottom-1 z-10',
      outfit: 'text-lg bottom-1 right-1 z-30',
      accessory: 'text-lg bottom-1 left-[-4px] z-30',
      hat: 'text-xl top-[-10px] z-40',
      emote: 'text-xs top-1 left-1 z-30',
    },
    lg: {
      base: 'text-4xl',
      mount: 'text-5xl bottom-1.5 z-10',
      outfit: 'text-2xl bottom-1.5 right-1.5 z-30',
      accessory: 'text-2xl bottom-1.5 left-[-6px] z-30',
      hat: 'text-3xl top-[-14px] z-40',
      emote: 'text-sm top-1.5 left-1.5 z-30',
    },
    xl: {
      base: 'text-6xl',
      mount: 'text-7xl bottom-2 z-10',
      outfit: 'text-4xl bottom-2 right-2 z-30',
      accessory: 'text-4xl bottom-2 left-[-10px] z-30',
      hat: 'text-5xl top-[-20px] z-40',
      emote: 'text-lg top-2 left-2 z-30',
    },
  };

  const scale = layerSizes[size] || layerSizes.md;

  const outfitEmoji = outfit && outfit !== 'none'
    ? (ITEM_EMOJIS[outfit] || (outfit.length <= 4 ? outfit : ''))
    : '';
  const accessoryEmoji = accessory && accessory !== 'none'
    ? (ITEM_EMOJIS[accessory] || (accessory.length <= 4 ? accessory : ''))
    : '';
  const mountEmoji = mount && mount !== 'none'
    ? (ITEM_EMOJIS[mount] || (mount.length <= 4 ? mount : ''))
    : '';
  const hatEmoji = hat && hat !== 'none'
    ? (ITEM_EMOJIS[hat] || (hat.length <= 4 ? hat : ''))
    : '';
  const badgeEmoji = badge && badge !== 'none' ? (ITEM_EMOJIS[badge] || '') : '';

  let titleText = '';
  if (title === 'title_beginner') titleText = '초보 연구원';
  else if (title === 'title_gym_breaker') titleText = '체육관 돌파자';
  else if (title === 'title_science_master') titleText = '과학 마스터';

  const emoteEmoji = expression && expression !== 'none'
    ? (ITEM_EMOJIS[expression] || (expression === 'fire' ? '🔥' : expression === 'wink' ? '😉' : expression === 'sunglasses' ? '🕶️' : expression.length <= 4 ? expression : ''))
    : '';

  const petEmoji = petId && petId !== 'none'
    ? (ITEM_EMOJIS[petId] || cards.find(c => c.id === petId)?.image || cards.find(c => c.id === petId)?.emoji || '')
    : '';

  const baseEmoji = baseAvatar && baseAvatar !== '⚡' ? baseAvatar : '🧑‍🎓';

  const titleFontSize = size === 'sm' ? '6px' : size === 'md' ? '8px' : size === 'lg' ? '10px' : '12px';
  const titleTop = size === 'sm' ? '-18px' : size === 'md' ? '-24px' : size === 'lg' ? '-32px' : '-40px';
  const badgeFontSize = size === 'sm' ? '10px' : size === 'md' ? '14px' : size === 'lg' ? '18px' : '24px';
  const badgePos = size === 'sm' ? '1px' : size === 'md' ? '2px' : size === 'lg' ? '3px' : '4px';
  const petRight = size === 'sm' ? '-12px' : size === 'md' ? '-16px' : size === 'lg' ? '-24px' : '-32px';
  const petTop = size === 'sm' ? '-4px' : size === 'md' ? '-6px' : size === 'lg' ? '-8px' : '-12px';

  return (
    <div
      className={`relative flex items-center justify-center rounded-full border-2 border-cyan-400/40 shadow-lg shrink-0 select-none transition-all ${sizeClasses[size]}`}
      style={{ backgroundColor: bodyColor }}
    >
      {titleText && (
        <span
          className="absolute bg-cyan-950/80 border border-cyan-400/30 rounded px-1 text-cyan-400 font-bold whitespace-nowrap z-50 text-center"
          style={{ fontSize: titleFontSize, top: titleTop, lineHeight: '1.2' }}
        >
          {titleText}
        </span>
      )}
      {mountEmoji && (
        <span className={`absolute font-emoji filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.6)] ${scale.mount}`}>
          {mountEmoji}
        </span>
      )}
      <span className={`relative z-20 font-emoji filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] ${scale.base}`}>
        {baseEmoji}
      </span>
      {outfitEmoji && (
        <span className={`absolute font-emoji filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] ${scale.outfit}`}>
          {outfitEmoji}
        </span>
      )}
      {badgeEmoji && (
        <span
          className="absolute z-30 font-emoji filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
          style={{ fontSize: badgeFontSize, bottom: badgePos, right: badgePos }}
        >
          {badgeEmoji}
        </span>
      )}
      {emoteEmoji && (
        <span className={`absolute font-emoji animate-pulse ${scale.emote}`}>
          {emoteEmoji}
        </span>
      )}
      {accessoryEmoji && (
        <span className={`absolute font-emoji filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] ${scale.accessory}`}>
          {accessoryEmoji}
        </span>
      )}
      {hatEmoji && (
        <span className={`absolute font-emoji filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)] ${scale.hat}`}>
          {hatEmoji}
        </span>
      )}
      {petEmoji && (
        <span
          className="absolute text-xl font-emoji animate-float pointer-events-none select-none z-30 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
          style={{ right: petRight, top: petTop }}
        >
          {petEmoji}
        </span>
      )}
    </div>
  );
}
