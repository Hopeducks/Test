'use client';

import React from 'react';
import { gameAudio } from '../../../lib/audio';
import { GameProgress } from '../../../types';

interface TrainerInfo {
  level: number;
  xp: number;
  rank: string;
  prevThreshold: number;
  nextThreshold: number;
}

interface LobbyQuestsPanelProps {
  progress: GameProgress;
  getTrainerInfo: () => TrainerInfo;
  onClaimQuest: (questId: string, reward: number) => void;
}

interface QuestTier {
  max: number;
  reward: number;
  desc: string;
}

interface QuestCategory {
  category: string;
  namePrefix: string;
  tiers: QuestTier[];
  currentVal: number;
}

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V'];

export default function LobbyQuestsPanel({ progress, getTrainerInfo, onClaimQuest }: LobbyQuestsPanelProps) {
  const myCoins = progress.coins ?? 0;
  const cardLevelsSum = progress.unlockedCardIds.reduce((sum, id) => sum + (progress.cardLevels?.[id] || 1), 0);
  const badgesCount = progress.unlockedBadges?.length || 0;

  const questCategories: QuestCategory[] = [
    {
      category: 'solver',
      namePrefix: '퀴즈 해결사',
      tiers: [
        { max: 1, reward: 30, desc: '단원 복습 퀴즈 1회 완료하기' },
        { max: 3, reward: 60, desc: '단원 복습 퀴즈 3회 완료하기' },
        { max: 7, reward: 120, desc: '단원 복습 퀴즈 7회 완료하기' },
        { max: 15, reward: 250, desc: '단원 복습 퀴즈 15회 완료하기' },
        { max: 30, reward: 500, desc: '단원 복습 퀴즈 30회 완료하기' }
      ],
      currentVal: progress.completedUnits.length
    },
    {
      category: 'collector',
      namePrefix: '지식의 수집가',
      tiers: [
        { max: 5, reward: 50, desc: '과학 도감 카드 5장 해금하기' },
        { max: 15, reward: 100, desc: '과학 도감 카드 15장 해금하기' },
        { max: 25, reward: 200, desc: '과학 도감 카드 25장 해금하기' },
        { max: 40, reward: 400, desc: '과학 도감 카드 40장 해금하기' },
        { max: 48, reward: 800, desc: '과학 도감 카드 48장 모두 해금하기' }
      ],
      currentVal: progress.unlockedCardIds.length
    },
    {
      category: 'wealth',
      namePrefix: '백만장자',
      tiers: [
        { max: 100, reward: 30, desc: '보유 코인 100개 이상 달성하기' },
        { max: 300, reward: 60, desc: '보유 코인 300개 이상 달성하기' },
        { max: 700, reward: 120, desc: '보유 코인 700개 이상 달성하기' },
        { max: 1500, reward: 250, desc: '보유 코인 1500개 이상 달성하기' },
        { max: 3000, reward: 500, desc: '보유 코인 3000개 이상 달성하기' }
      ],
      currentVal: myCoins
    },
    {
      category: 'trainer',
      namePrefix: '만렙 트레이너',
      tiers: [
        { max: 2, reward: 50, desc: '트레이너 레벨 2 달성하기' },
        { max: 3, reward: 100, desc: '트레이너 레벨 3 달성하기' },
        { max: 4, reward: 200, desc: '트레이너 레벨 4 달성하기' },
        { max: 5, reward: 405, desc: '트레이너 레벨 5 달성하기' },
        { max: 6, reward: 800, desc: '트레이너 레벨 6 달성하기' }
      ],
      currentVal: getTrainerInfo().level
    },
    {
      category: 'pokemon',
      namePrefix: '포켓몬 성장',
      tiers: [
        { max: 10, reward: 50, desc: '해금 카드들의 레벨 합계 10 달성하기' },
        { max: 25, reward: 100, desc: '해금 카드들의 레벨 합계 25 달성하기' },
        { max: 50, reward: 200, desc: '해금 카드들의 레벨 합계 50 달성하기' },
        { max: 100, reward: 400, desc: '해금 카드들의 레벨 합계 100 달성하기' },
        { max: 150, reward: 800, desc: '해금 카드들의 레벨 합계 150 달성하기' }
      ],
      currentVal: cardLevelsSum
    },
    {
      category: 'badge',
      namePrefix: '체육관 뱃지 수집',
      tiers: [
        { max: 1, reward: 100, desc: '체육관 뱃지 1개 이상 수집하기' },
        { max: 3, reward: 200, desc: '체육관 뱃지 3개 이상 수집하기' },
        { max: 5, reward: 350, desc: '체육관 뱃지 5개 이상 수집하기' },
        { max: 7, reward: 500, desc: '체육관 뱃지 7개 이상 수집하기' },
        { max: 8, reward: 1000, desc: '체육관 뱃지 8개 모두 수집하기' }
      ],
      currentVal: badgesCount
    }
  ];

  const questsList = questCategories.map(cat => {
    let activeTierIdx = -1;
    for (let i = 0; i < cat.tiers.length; i++) {
      const qId = `quest_${cat.category}_t${i + 1}`;
      if (!progress.claimedQuestIds?.includes(qId)) {
        activeTierIdx = i;
        break;
      }
    }

    if (activeTierIdx === -1) {
      return {
        id: `quest_${cat.category}_cleared`,
        name: `${cat.namePrefix}`,
        desc: '모든 티어 클리어 완료!',
        prog: cat.tiers[cat.tiers.length - 1].max,
        max: cat.tiers[cat.tiers.length - 1].max,
        reward: 0,
        isAllCleared: true
      };
    }

    const activeTier = cat.tiers[activeTierIdx];

    return {
      id: `quest_${cat.category}_t${activeTierIdx + 1}`,
      name: `${cat.namePrefix} ${ROMAN_NUMERALS[activeTierIdx]}`,
      desc: activeTier.desc,
      prog: cat.currentVal,
      max: activeTier.max,
      reward: activeTier.reward,
      isAllCleared: false
    };
  });

  return (
    <div className="glass-panel p-4 border-cyan-500/10 space-y-3 max-h-[300px] overflow-y-auto min-h-[220px]">
      <div className="text-[11px] font-bold text-gray-400 text-center border-b border-gray-900 pb-2 mb-2">
        📋 내 퀘스트 &amp; 보상
      </div>
      {questsList.filter(q => !q.isAllCleared).map(quest => {
        const isClaimed = progress.claimedQuestIds?.includes(quest.id) || false;
        const isReady = quest.prog >= quest.max && !isClaimed;
        const percent = Math.min(100, Math.round((quest.prog / quest.max) * 100));

        return (
          <div key={quest.id} className="p-2 border border-gray-900 bg-gray-950/20 rounded-lg space-y-1 text-left">
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] font-black text-gray-100">{quest.name}</span>
              <span className="text-[9px] font-mono text-cyan-400 font-bold">{quest.prog}/{quest.max}</span>
            </div>
            <p className="text-[9px] text-gray-400 leading-tight">{quest.desc}</p>

            {/* Progress bar */}
            <div className="w-full h-1 bg-gray-900 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500" style={{ width: `${percent}%` }} />
            </div>

            <div className="flex justify-between items-center pt-0.5">
              <span className="text-[9px] font-bold text-amber-400 flex items-center gap-0.5">
                🪙 {quest.reward}
              </span>
              {isClaimed ? (
                <span className="text-[9px] font-bold text-gray-500 font-sans border border-gray-900 px-1.5 py-0.5 rounded bg-gray-950/40">
                  완료됨
                </span>
              ) : isReady ? (
                <button
                  onClick={() => {
                    gameAudio.playCatchSuccess();
                    onClaimQuest(quest.id, quest.reward);
                  }}
                  className="text-[9px] font-black bg-emerald-500 hover:bg-emerald-450 text-black px-2 py-0.5 rounded transition-all animate-pulse"
                >
                  보상 받기
                </button>
              ) : (
                <span className="text-[9px] font-bold text-gray-650 font-sans border border-gray-900 px-1.5 py-0.5 rounded bg-transparent select-none">
                  진행 중
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
