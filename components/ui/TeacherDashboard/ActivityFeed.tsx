'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Activity } from 'lucide-react';
import { gameAudio } from '../../../lib/audio';
import { DashboardEvent } from '../../../types';

type FeedFilter = 'all' | 'card' | 'battle' | 'achievement';

interface ActivityFeedProps {
  feedEvents: DashboardEvent[];
  setFeedEvents: React.Dispatch<React.SetStateAction<DashboardEvent[]>>;
}

export default function ActivityFeed({ feedEvents, setFeedEvents }: ActivityFeedProps) {
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('all');
  const feedEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [feedEvents]);

  const filteredEvents = useMemo(() => {
    return feedEvents.filter(e => {
      if (feedFilter === 'all') return true;
      if (feedFilter === 'card') return e.type === 'card_unlocked';
      if (feedFilter === 'battle') return e.type === 'battle_start' || e.type === 'battle_end';
      if (feedFilter === 'achievement') return e.type === 'achievement';
      return true;
    });
  }, [feedEvents, feedFilter]);

  const tabs: { id: FeedFilter; label: string }[] = [
    { id: 'all', label: '전체' },
    { id: 'card', label: '카드' },
    { id: 'battle', label: '배틀' },
    { id: 'achievement', label: '업적' },
  ];

  return (
    <div className="lg:col-span-4 glass-panel p-5 border-cyan-500/10 flex flex-col justify-between h-[545px]">
      <div className="space-y-4">
        <h3 className="text-sm font-extrabold text-cyan-400 uppercase tracking-widest border-b border-gray-900 pb-2 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-cyan-400" /> 세션 실시간 로그 피드
        </h3>

        <div className="grid grid-cols-4 gap-1 select-none">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { gameAudio.playClick(); setFeedFilter(tab.id); }}
              className={`py-1 text-[10px] border rounded transition-all font-bold ${
                feedFilter === tab.id
                  ? 'bg-cyan-950/30 border-cyan-400 text-cyan-400'
                  : 'bg-transparent border-gray-850 text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 my-4 space-y-2 max-h-[380px] bg-gray-950/40 border border-gray-900 rounded-lg p-2.5">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-xs font-mono text-gray-600">
            NO RECENT LOGGED EVENTS
          </div>
        ) : (
          filteredEvents.map((evt, idx) => {
            const icon =
              evt.type === 'quiz_answer'
                ? evt.isCorrect !== false ? '✅' : '❌'
                : evt.type === 'card_unlocked' ? '🃏'
                : evt.type === 'battle_start' ? '⚔️'
                : evt.type === 'battle_end' ? '🏆'
                : evt.type === 'boss_damage' ? '💥'
                : evt.type === 'player_join' ? '👤'
                : '📌';
            const nickColor =
              evt.type === 'quiz_answer'
                ? (evt.isCorrect !== false ? 'text-emerald-400' : 'text-red-400')
                : 'text-cyan-400';
            return (
              <div key={idx} className="border-b border-gray-900/60 pb-1.5 text-[11px] leading-relaxed flex items-start gap-1.5">
                <span className="shrink-0 text-xs">{icon}</span>
                <div>
                  <span className="text-gray-500 font-mono mr-1">[{new Date(evt.timestamp).toLocaleTimeString()}]</span>
                  <span className={`font-bold mr-1 ${nickColor}`}>{evt.nickname}</span>
                  <span className="text-gray-300">{evt.detail}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={feedEndRef} />
      </div>

      <button
        onClick={() => { gameAudio.playClick(); setFeedEvents([]); }}
        className="w-full py-2 bg-gray-900 border border-gray-850 hover:border-gray-700 text-[10px] font-mono text-gray-400 rounded-lg"
      >
        콘솔 피드 내역 지우기 (Clear Logs)
      </button>
    </div>
  );
}
