import { useState, useEffect, useRef } from 'react';
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

// ── 탭 가시성 / 네트워크 복구 시 채널 재구독 ────────────
// Supabase WebSocket은 자동 재연결되지만, 탭이 오랫동안 백그라운드에
// 있었던 경우 채널이 CLOSED 상태로 남을 수 있다.
// visibilitychange + online 이벤트로 복귀 시 즉시 재구독한다.
function useTabReconnect(channelRef: { current: RealtimeChannel | null }): void {
  useEffect(() => {
    const reconnect = () => {
      channelRef.current?.subscribe();
    };
    const handleVisible = () => {
      if (document.visibilityState === 'visible') reconnect();
    };

    document.addEventListener('visibilitychange', handleVisible);
    window.addEventListener('online', reconnect);

    return () => {
      document.removeEventListener('visibilitychange', handleVisible);
      window.removeEventListener('online', reconnect);
    };
  }, [channelRef]);
}

// CHANNEL_ERROR / TIMED_OUT 시 지수 백오프로 재구독 (최대 5회)
const MAX_RETRIES = 5;

function subscribeWithReconnect(
  channel: RealtimeChannel,
  signal: { destroyed: boolean },
): void {
  let retryCount = 0;

  const trySubscribe = () => {
    if (signal.destroyed) return;
    channel.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        retryCount = 0;
      } else if (
        (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') &&
        retryCount < MAX_RETRIES &&
        !signal.destroyed
      ) {
        retryCount++;
        const delay = Math.min(1_000 * 2 ** retryCount, 30_000);
        setTimeout(trySubscribe, delay);
      }
    });
  };

  trySubscribe();
}

// ── Presence 동기화 훅 ────────────────────────────────
export function usePresence(sessionCode: string): Record<string, PlayerPosition> {
  const [presenceData, setPresenceData] = useState<Record<string, PlayerPosition>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!sessionCode) return;

    const channel = supabase.channel(`presence_session_${sessionCode}`);
    channelRef.current = channel;
    const signal = { destroyed: false };

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const formatted: Record<string, PlayerPosition> = {};

      Object.keys(state).forEach((key) => {
        const userPresences = state[key] as PresenceEntry[];
        if (userPresences && userPresences.length > 0) {
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
    });

    subscribeWithReconnect(channel, signal);

    return () => {
      signal.destroyed = true;
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [sessionCode]);

  useTabReconnect(channelRef);

  return presenceData;
}

// ── 보스 레이드 실시간 동기화 훅 ────────────────────────
export function useBossRaid(sessionCode: string): BossRaidState | null {
  const [bossRaidState, setBossRaidState] = useState<BossRaidState | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!sessionCode) return;

    const channel = supabase.channel(`boss_raid_session_${sessionCode}`);
    channelRef.current = channel;
    const signal = { destroyed: false };

    channel.on('broadcast', { event: 'boss_raid_update' }, ({ payload }: { payload: BossRaidState }) => {
      setBossRaidState(payload);
    });

    subscribeWithReconnect(channel, signal);

    return () => {
      signal.destroyed = true;
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [sessionCode]);

  useTabReconnect(channelRef);

  return bossRaidState;
}

// ── 실시간 배틀 상태 훅 ──────────────────────────────
export function useBattleState(sessionCode: string): BattleState | null {
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!sessionCode) return;

    const channel = supabase.channel(`battle_session_${sessionCode}`);
    channelRef.current = channel;
    const signal = { destroyed: false };

    channel.on('broadcast', { event: 'battle_state_update' }, ({ payload }: { payload: BattleState }) => {
      setBattleState(payload);
    });

    subscribeWithReconnect(channel, signal);

    return () => {
      signal.destroyed = true;
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [sessionCode]);

  useTabReconnect(channelRef);

  return battleState;
}

// ── 세션 상태 동기화 훅 ───────────────────────────────
export function useSessionStatus(sessionCode: string): GameSession['status'] {
  const [status, setStatus] = useState<GameSession['status']>('lobby');
  const broadcastRef = useRef<RealtimeChannel | null>(null);
  const dbRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!sessionCode) return;

    // 초기 상태 1회 조회
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

    const signal = { destroyed: false };

    // PostgreSQL 변경 감지 (primary source)
    const dbChannel = supabase.channel(`db-changes-${sessionCode}`);
    dbRef.current = dbChannel;
    dbChannel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'game_sessions', filter: `code=eq.${sessionCode}` },
      (payload: { new: { status: string } }) => {
        if (payload.new?.status) {
          setStatus(payload.new.status as GameSession['status']);
        }
      },
    );
    subscribeWithReconnect(dbChannel, signal);

    // 브로드캐스트 백업 (fallback)
    const bcastChannel = supabase.channel(`session_status_tracker_${sessionCode}`);
    broadcastRef.current = bcastChannel;
    bcastChannel.on(
      'broadcast',
      { event: 'status_update' },
      ({ payload }: { payload: { status: GameSession['status'] } }) => {
        if (payload?.status) {
          setStatus(payload.status);
        }
      },
    );
    subscribeWithReconnect(bcastChannel, signal);

    return () => {
      signal.destroyed = true;
      dbChannel.unsubscribe();
      bcastChannel.unsubscribe();
      dbRef.current = null;
      broadcastRef.current = null;
    };
  }, [sessionCode]);

  useTabReconnect(dbRef);
  useTabReconnect(broadcastRef);

  return status;
}

// ── 브로드캐스트 헬퍼 ─────────────────────────────────
export function broadcastPosition(channel: RealtimeChannel, position: PlayerPosition) {
  if (!channel) return;
  channel.send({ type: 'broadcast', event: 'position_update', data: position });
}

export function broadcastBattleEvent(channel: RealtimeChannel, event: Record<string, unknown>) {
  if (!channel) return;
  channel.send({ type: 'broadcast', event: 'battle_event', data: event });
}
