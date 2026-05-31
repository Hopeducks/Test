import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Mock Supabase Database wrapper for offline fallback
class MockQueryBuilder {
  private tableName: string;
  constructor(tableName: string) {
    this.tableName = tableName;
  }
  private getData(): any[] {
    if (typeof window === 'undefined') return [];
    const key = `mock_db_${this.tableName}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }
  private saveData(data: any[]) {
    if (typeof window === 'undefined') return;
    const key = `mock_db_${this.tableName}`;
    localStorage.setItem(key, JSON.stringify(data));
  }
  select(columns: string = '*') {
    const data = this.getData();
    // Simulate RLS: filter players if app.session_code is set
    let filteredData = data;
    if (this.tableName === 'players') {
      const sessionCode = localStorage.getItem('app.session_code');
      if (sessionCode) {
        filteredData = data.filter(p => p.session_code === sessionCode);
      }
    }
    return {
      eq: (col: string, val: any) => {
        const filtered = filteredData.filter(item => item[col] === val);
        return Promise.resolve({ data: filtered, error: null });
      },
      single: () => {
        const item = filteredData[0] || null;
        return Promise.resolve({ data: item, error: item ? null : { message: 'Not found' } });
      },
      then: (resolve: any) => resolve({ data: filteredData, error: null }),
    };
  }
  insert(values: any | any[]) {
    const data = this.getData();
    const newItems = Array.isArray(values) ? values : [values];
    const itemsWithIds = newItems.map(item => ({
      id: item.id || crypto.randomUUID(),
      created_at: new Date().toISOString(),
      ...item
    }));
    this.saveData([...data, ...itemsWithIds]);
    return Promise.resolve({ data: itemsWithIds, error: null });
  }
  update(values: any) {
    const data = this.getData();
    return {
      eq: (col: string, val: any) => {
        // Simulate RLS: check app.player_id
        const playerId = localStorage.getItem('app.player_id');
        const updatedData = data.map(item => {
          if (item[col] === val) {
            // If table is players, check if update matches current player id
            if (this.tableName === 'players' && playerId && item.id !== playerId) {
              return item; // Block by RLS
            }
            return { ...item, ...values };
          }
          return item;
        });
        this.saveData(updatedData);
        const updatedItems = updatedData.filter(item => item[col] === val);
        return Promise.resolve({ data: updatedItems, error: null });
      }
    };
  }
  delete() {
    const data = this.getData();
    return {
      eq: (col: string, val: any) => {
        const filtered = data.filter(item => item[col] !== val);
        this.saveData(filtered);
        return Promise.resolve({ data: filtered, error: null });
      }
    };
  }
}

class MockChannel {
  private channelName: string;
  private presenceCallbacks: Array<(event: string, payload: any) => void> = [];
  private broadcastCallbacks: Record<string, Array<(payload: any) => void>> = {};
  private presenceStateData: Record<string, any> = {};

  constructor(channelName: string) {
    this.channelName = channelName;
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === `mock_realtime_${this.channelName}`) {
          const payload = e.newValue ? JSON.parse(e.newValue) : null;
          if (payload) {
            if (payload.type === 'broadcast') {
              const list = this.broadcastCallbacks[payload.event] || [];
              list.forEach(cb => cb({ payload: payload.data }));
            } else if (payload.type === 'presence') {
              this.presenceCallbacks.forEach(cb => cb('sync', {}));
            }
          }
        }
      });
    }
  }

  on(type: string, filter: any, callback: any) {
    if (type === 'presence') {
      this.presenceCallbacks.push(callback);
    } else if (type === 'broadcast') {
      const eventName = filter.event;
      if (!this.broadcastCallbacks[eventName]) {
        this.broadcastCallbacks[eventName] = [];
      }
      this.broadcastCallbacks[eventName].push(callback);
    }
    return this;
  }

  subscribe(statusCallback?: (status: string) => void) {
    if (statusCallback) {
      setTimeout(() => statusCallback('SUBSCRIBED'), 100);
    }
    return this;
  }

  track(state: any) {
    const playerId = state.playerId || localStorage.getItem('app.player_id') || 'unknown';
    this.presenceStateData[playerId] = state;
    this.broadcastStorageEvent('presence', this.presenceStateData);
    return Promise.resolve('ok');
  }

  untrack() {
    this.presenceStateData = {};
    this.broadcastStorageEvent('presence', this.presenceStateData);
    return Promise.resolve('ok');
  }

  send(payload: any) {
    this.broadcastStorageEvent('broadcast', payload.payload || payload.data, payload.event);
    return Promise.resolve('ok');
  }

  presenceState() {
    if (typeof window !== 'undefined') {
      const key = `mock_presence_${this.channelName}`;
      const saved = localStorage.getItem(key);
      const state = saved ? JSON.parse(saved) : {};
      // Return in Supabase Realtime format: { key: [{ presence_ref: '...', ... }] }
      const formatted: Record<string, any[]> = {};
      Object.keys(state).forEach(k => {
        formatted[k] = [{ presence_ref: k, ...state[k] }];
      });
      return formatted;
    }
    return {};
  }

  private broadcastStorageEvent(type: 'presence' | 'broadcast', data: any, event?: string) {
    if (typeof window === 'undefined') return;
    if (type === 'presence') {
      localStorage.setItem(`mock_presence_${this.channelName}`, JSON.stringify(data));
    }
    const payload = {
      type,
      event,
      data,
      sender: crypto.randomUUID(),
      timestamp: Date.now()
    };
    localStorage.setItem(`mock_realtime_${this.channelName}`, JSON.stringify(payload));
    localStorage.removeItem(`mock_realtime_${this.channelName}`);
  }

  unsubscribe() {
    return 'ok';
  }
}

const mockSupabase = {
  from: (table: string) => new MockQueryBuilder(table),
  channel: (name: string) => new MockChannel(name),
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
  },
  rpc: (fn: string, params: any) => {
    console.log(`Mock RPC call to ${fn}:`, params);
    if (fn === 'set_session_context') {
      if (typeof window !== 'undefined') {
        localStorage.setItem('app.session_code', params.session_code || '');
        localStorage.setItem('app.player_id', params.player_id || '');
      }
    }
    return Promise.resolve({ data: true, error: null });
  }
};

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : (mockSupabase as any);

// Sets PostgreSQL session variables for RLS
export async function setSessionContext(sessionCode: string, playerId: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('app.session_code', sessionCode);
    localStorage.setItem('app.player_id', playerId);
  }

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      await supabase.rpc('set_session_context', {
        session_code: sessionCode,
        player_id: playerId
      });
    } catch (e) {
      console.warn('Failed to call set_session_context RPC:', e);
    }
  }
}

export default supabase;
