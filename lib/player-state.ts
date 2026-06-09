import type { GameState } from './game-state';
import { deriveProgression } from './progression';
import { Player, CostumeId, EmoteId } from '../types';

export function buildLocalPlayer(state: GameState, getCoins: () => number): Player {
  const info = deriveProgression(state.progress);
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('science_pokedex_player');
    if (saved) {
      try {
        const player = JSON.parse(saved) as Player;
        player.level = info.level;
        player.xp = info.xp;
        player.coins = getCoins();
        player.achievements = state.progress.earnedAchievementIds ?? [];
        return player;
      } catch (_) {}
    }
  }
  return {
    id: typeof window !== 'undefined' ? (localStorage.getItem('app.player_id') || 'local-player-id') : 'local-player-id',
    nickname: state.studentName || '학생',
    sessionCode: typeof window !== 'undefined' ? (localStorage.getItem('app.session_code') || '') : '',
    avatar: {
      bodyColor: '#4f46e5',
      outfit: state.equippedCosmetics.outfit as CostumeId || null,
      accessory: state.equippedCosmetics.accessory as CostumeId || null,
      vehicle: state.equippedCosmetics.mount as CostumeId || null,
      hat: state.equippedCosmetics.hat as CostumeId || null,
      badge: state.equippedCosmetics.badge as CostumeId || null,
      title: state.equippedCosmetics.title as CostumeId || null,
      emote: state.equippedCosmetics.expression as EmoteId || null,
      petId: state.equippedCosmetics.petId || null,
    },
    position: { x: 400, y: 300 },
    xp: info.xp,
    level: info.level,
    coins: getCoins(),
    unlockedCards: state.progress.unlockedCardIds,
    unlockedCostumes: state.unlockedCosmetics as CostumeId[],
    achievements: state.progress.earnedAchievementIds ?? [],
  };
}

export function applyLocalPlayer(state: GameState, player: Player, save: () => void): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('science_pokedex_player', JSON.stringify(player));
    localStorage.setItem('app.player_id', player.id);
    localStorage.setItem('app.session_code', player.sessionCode);
    window.dispatchEvent(new CustomEvent('react:avatarUpdate', { detail: { nickname: player.nickname, avatar: player.avatar } }));
  }
  state.studentName = player.nickname;
  state.unlockedCosmetics = player.unlockedCostumes as string[];
  state.equippedCosmetics = {
    outfit: player.avatar.outfit || 'none',
    expression: player.avatar.emote || 'none',
    accessory: player.avatar.accessory || 'none',
    mount: player.avatar.vehicle || 'none',
    hat: player.avatar.hat || 'none',
    badge: player.avatar.badge || 'none',
    title: player.avatar.title || 'none',
    petId: player.avatar.petId || 'none',
  };
  state.progress.unlockedCardIds = player.unlockedCards;
  state.progress.coins = player.coins;
  save();
}
