import { GameProgress } from '../types';
import { deriveProgression } from './progression';

export type ZoneId = 'quiz' | 'battle' | 'raid' | 'museum' | 'center' | 'gym' | 'lab';

export interface ZoneInfo {
  id: ZoneId;
  label: string;
  emoji: string;
  color: string;
  description: string;
  unlockHint: string;
}

export const ZONES: ZoneInfo[] = [
  { id: 'quiz',   label: '퀴즈 존',     emoji: '📝', color: '#f59e0b', description: '8개 단원 퀴즈 도전',          unlockHint: '이전 단원 배지 필요' },
  { id: 'battle', label: '배틀 아레나', emoji: '⚔️', color: '#ef4444', description: '카드 배틀 PvP',               unlockHint: '항상 개방' },
  { id: 'raid',   label: '보스 레이드', emoji: '🔮', color: '#8b5cf6', description: '보스 협력 레이드',            unlockHint: '교사 활성화 필요' },
  { id: 'museum', label: '도감 박물관', emoji: '📚', color: '#10b981', description: '카드 도감 열람',              unlockHint: '항상 개방' },
  { id: 'center', label: '포켓몬 센터', emoji: '❤️', color: '#ec4899', description: '아바타 꾸미기',              unlockHint: '항상 개방' },
  { id: 'gym',    label: '체육관',      emoji: '🏆', color: '#f59e0b', description: '체육관 도전',                unlockHint: '항상 개방' },
  { id: 'lab',    label: '탐구 연구소', emoji: '🔬', color: '#2dd4bf', description: '일일 탐구 미션 + 진행 현황', unlockHint: '항상 개방' },
];

export const LOOP_STEPS = [
  { step: 1, icon: '🗺️', label: '탐험',     desc: '로비 월드를 걸어다니며 존을 발견한다' },
  { step: 2, icon: '📝', label: '퀴즈·배틀', desc: '퀴즈와 배틀로 경험치·카드 XP를 쌓는다' },
  { step: 3, icon: '⬆️', label: '랭크 업',   desc: '트레이너 레벨이 오르면 칭호와 코스튬이 해금된다' },
  { step: 4, icon: '🔓', label: '해금',      desc: '상위 단원·에픽 카드·신규 존이 열린다' },
] as const;

export interface WorldProgress {
  trainerTier: string;
  trainerLevel: number;
  completedUnitCount: number;
  totalUnits: number;
  unlockedCardCount: number;
  nextMilestone: string;
  progressPercent: number;
}

export function getWorldProgress(progress: GameProgress): WorldProgress {
  const trainer = deriveProgression({
    unlockedCardIds: progress.unlockedCardIds ?? [],
    completedUnits: progress.completedUnits ?? [],
    cardLevels: progress.cardLevels,
  });
  const completedUnitCount = progress.completedUnits?.length ?? 0;
  const totalUnits = 8;
  const unlockedCardCount = progress.unlockedCardIds?.length ?? 0;

  const remaining = totalUnits - completedUnitCount;
  let nextMilestone: string;

  if (completedUnitCount === 0) {
    nextMilestone = '첫 번째 단원 퀴즈를 완료해 트레이너 레벨을 올리세요!';
  } else if (completedUnitCount < totalUnits) {
    nextMilestone = `${completedUnitCount + 1}단원 완료 목표 — 남은 단원 ${remaining}개`;
  } else {
    nextMilestone = '전 단원 마스터! 배틀 & 레이드로 카드 XP를 쌓아보세요.';
  }

  return {
    trainerTier: trainer.rank,
    trainerLevel: trainer.level,
    completedUnitCount,
    totalUnits,
    unlockedCardCount,
    nextMilestone,
    progressPercent: Math.round((completedUnitCount / totalUnits) * 100),
  };
}

/**
 * 존 해금 여부를 반환한다.
 * - raid는 교사 게이팅(항상 true — LobbyScene에서 실제 체크)
 * - quiz 단원별 잠금은 StudentLobby handleZoneAction에서 처리
 */
export function isZoneUnlocked(_zoneId: ZoneId, _progress: GameProgress): boolean {
  return true;
}
