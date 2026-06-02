import { useState, useEffect } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './client';
import { PlayerPosition, BossRaidState, BattleState, GameSession, EmoteId } from '../../types';

interface PresenceEntry {
  presence_ref: string;
  playerId?: string;
  x?: number;
  y?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'idle';
  animFrame?: number;
  emote?: string | null;
}

// ── Presence 동기화 훅 ────────────────────────────────
export function usePresence(sessionCode: string): Record<string, PlayerPosition> {
  const [presenceData, setPresenceData] = useState<Record<string, PlayerPosition>>({});

  useEffect(() => {
    if (!sessionCode) return;

    const channelId = `presence_session_${sessionCode}`;
    const channel = supabase.channel(channelId);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const formatted: Record<string, PlayerPosition> = {};
        
        Object.keys(state).forEach((key) => {
          const userPresences = state[key] as PresenceEntry[];
          if (userPresences && userPresences.length > 0) {
            // 가장 최근의 presence 정보 사용
            const presenceInfo = userPresences[userPresences.length - 1];
            if (presenceInfo && presenceInfo.playerId) {
              formatted[presenceInfo.playerId] = {
                playerId: presenceInfo.playerId,
                x: presenceInfo.x ?? 400,
                y: presenceInfo.y ?? 300,
                direction: presenceInfo.direction ?? 'idle',
                animFrame: presenceInfo.animFrame ?? 0,
                emote: (presenceInfo.emote ?? null) as EmoteId | null,
              };
            }
          }
        });
        
        setPresenceData(formatted);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [sessionCode]);

  return presenceData;
}

// ── 보스 레이드 실시간 동기화 훅 ────────────────────────
export function useBossRaid(sessionCode: string): BossRaidState | null {
  const [bossRaidState, setBossRaidState] = useState<BossRaidState | null>(null);

  useEffect(() => {
    if (!sessionCode) return;

    const channelId = `boss_raid_session_${sessionCode}`;
    const channel = supabase.channel(channelId);

    channel
      .on('broadcast', { event: 'boss_raid_update' }, ({ payload }: { payload: BossRaidState }) => {
        setBossRaidState(payload);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [sessionCode]);

  return bossRaidState;
}

// ── 실시간 배틀 매칭 / 배틀 진행 상황 훅 ────────────────
export function useBattleState(sessionCode: string): BattleState | null {
  const [battleState, setBattleState] = useState<BattleState | null>(null);

  useEffect(() => {
    if (!sessionCode) return;

    const channelId = `battle_session_${sessionCode}`;
    const channel = supabase.channel(channelId);

    channel
      .on('broadcast', { event: 'battle_state_update' }, ({ payload }: { payload: BattleState }) => {
        setBattleState(payload);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [sessionCode]);

  return battleState;
}

// ── 세션 상태 동기화 훅 ───────────────────────────────
export function useSessionStatus(sessionCode: string): GameSession['status'] {
  const [status, setStatus] = useState<GameSession['status']>('lobby');

  useEffect(() => {
    if (!sessionCode) return;

    // 1. 초기 상태 가져오기
    supabase
      .from('game_sessions')
      .select('status')
      .eq('code', sessionCode)
      .single()
      .then(({ data, error }: { data: { status: string } | null; error: { message: string } | null }) => {
        if (data && !error) {
          setStatus(data.status as GameSession['status']);
        }
      });

    // 2. 테이블 실시간 변경 감지 및 브로드캐스트 감지 하이브리드 수신
    const channelId = `session_status_tracker_${sessionCode}`;
    const channel = supabase.channel(channelId);

    // PostgreSQL 리얼타임 구독 (변수에 저장해 cleanup 보장)
    const dbChannel = supabase.channel(`db-changes-${sessionCode}`);
    dbChannel
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_sessions',
          filter: `code=eq.${sessionCode}`,
        },
        (payload: { new: { status: string } }) => {
          if (payload.new && payload.new.status) {
            setStatus(payload.new.status as GameSession['status']);
          }
        }
      )
      .subscribe();

    // 브로드캐스트 백업 수신
    channel
      .on('broadcast', { event: 'status_update' }, ({ payload }: { payload: { status: GameSession['status'] } }) => {
        if (payload && payload.status) {
          setStatus(payload.status);
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
      dbChannel.unsubscribe();
    };
  }, [sessionCode]);

  return status;
}

// ── 브로드캐스트 헬퍼 함수들 ─────────────────────────
export function broadcastPosition(channel: RealtimeChannel, position: PlayerPosition) {
  if (!channel) return;
  channel.send({
    type: 'broadcast',
    event: 'position_update',
    data: position,
  });
}

export function broadcastBattleEvent(channel: RealtimeChannel, event: Record<string, unknown>) {
  if (!channel) return;
  channel.send({
    type: 'broadcast',
    event: 'battle_event',
    data: event,
  });
}
