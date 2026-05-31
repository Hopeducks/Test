import { supabase } from './client';
import { Player, GameSession, BattleState, Question, Card, CostumeId } from '../../types';

const IS_SUPABASE_CONFIGURED = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// ⚠️  오프라인 fallback: Supabase Edge Function 미설정 시 클라이언트에서 실행됩니다.
//    프로덕션에서는 반드시 Edge Function을 배포하여 서버에서 정답 검증이 이루어져야 합니다.
//    배포 방법: supabase/functions/ 디렉터리의 각 함수를 `supabase functions deploy` 로 배포

// ── Helper to find questions from data (오프라인 fallback 전용) ─────────────
async function getQuestionById(questionId: string): Promise<Question | null> {
  try {
    const { getUnitQuestions } = await import('../../data/questions');
    for (let unitId = 1; unitId <= 8; unitId++) {
      const qList = getUnitQuestions(unitId);
      const found = qList.find((q) => q.id === questionId);
      if (found) return found as Question;
    }
  } catch (e) {
    console.error('Failed to import questions', e);
  }
  return null;
}

// ── Helper to find cards from data ────────
async function getCardById(cardId: string): Promise<Card | null> {
  try {
    const { cards } = await import('../../data/cards');
    const found = cards.find((c) => c.id === cardId);
    return found as Card;
  } catch (e) {
    console.error('Failed to import cards', e);
  }
  return null;
}

// ── TASK 1C Edge Function Callers with Offline Mock Fallback ────────────────

export async function joinSession(
  sessionCode: string,
  nickname: string
): Promise<{ player: Player; session: GameSession }> {
  if (IS_SUPABASE_CONFIGURED) {
    try {
      const { data, error } = await supabase.functions.invoke('join-session', {
        body: { sessionCode, nickname }
      });
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('Edge Function join-session failed, falling back to mock.', e);
    }
  }

  // --- Offline Mock Fallback ---
  // 1. Get or create game session
  const { data: sessions } = await supabase.from('game_sessions').select('*').eq('code', sessionCode);
  let session = sessions && sessions[0];
  if (!session) {
    const newSession = {
      code: sessionCode,
      status: 'lobby',
      active_unit_id: 1,
      boss_hp: 1000,
      boss_max_hp: 1000,
      battle_pairs: [],
      settings: { timer: true, timerSeconds: 30, battleModeEnabled: true, raidEnabled: true, allowChat: true }
    };
    await supabase.from('game_sessions').insert(newSession);
    session = newSession;
  }

  // 2. Create player
  const newPlayerObj = {
    id: crypto.randomUUID(),
    nickname,
    session_code: sessionCode,
    avatar: {
      bodyColor: '#4f46e5',
      outfit: null,
      accessory: null,
      vehicle: null,
      hat: null,
      emote: null
    },
    position: { x: 400, y: 300 },
    xp: 0,
    level: 1,
    coins: 0,
    unlocked_cards: [],
    unlocked_costumes: [],
    achievements: []
  };

  const { data: insertedPlayers } = await supabase.from('players').insert(newPlayerObj);
  const playerDb = (insertedPlayers && insertedPlayers[0]) || newPlayerObj;

  // Map database format to TS Player type
  const player: Player = {
    id: playerDb.id,
    nickname: playerDb.nickname,
    sessionCode: playerDb.session_code,
    avatar: playerDb.avatar,
    position: playerDb.position,
    xp: playerDb.xp,
    level: playerDb.level,
    coins: playerDb.coins,
    unlockedCards: playerDb.unlocked_cards,
    unlockedCostumes: playerDb.unlocked_costumes,
    achievements: playerDb.achievements
  };

  const formattedSession: GameSession = {
    code: session.code,
    status: session.status as GameSession['status'],
    activeUnitId: session.active_unit_id,
    bossHp: session.boss_hp ?? 1000,
    bossMaxHp: session.boss_max_hp ?? 1000,
    battlePairs: session.battle_pairs || [],
    settings: {
      timer: session.settings?.timer ?? true,
      timerSeconds: session.settings?.timerSeconds ?? 30,
      battleModeEnabled: session.settings?.battleModeEnabled ?? true,
      raidEnabled: session.settings?.raidEnabled ?? true,
      allowChat: session.settings?.allowChat ?? true
    }
  };

  return { player, session: formattedSession };
}

export async function submitQuizAnswer(
  playerId: string,
  questionId: string,
  selectedIndex: number
): Promise<{ correct: boolean; cardUnlocked?: string; damage?: number }> {
  if (IS_SUPABASE_CONFIGURED) {
    try {
      const { data, error } = await supabase.functions.invoke('submit-quiz-answer', {
        body: { playerId, questionId, selectedIndex }
      });
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('Edge Function submit-quiz-answer failed, falling back to mock.', e);
    }
  }

  // --- Offline Mock Fallback ---
  // Bypass RLS in mock by temporarily clearing session code filter
  const savedSessionCode = typeof window !== 'undefined' ? localStorage.getItem('app.session_code') : null;
  if (typeof window !== 'undefined') localStorage.removeItem('app.session_code');

  const playerRes = await supabase.from('players').select('*').eq('id', playerId);
  let playerDb = playerRes.data && playerRes.data[0];

  if (!playerDb) {
    // Auto-create player if not found in mock DB to support single-player / guest mode
    const fallbackPlayer = {
      id: playerId,
      nickname: playerId === 'local-player-id' ? '학생' : playerId,
      session_code: savedSessionCode || '',
      avatar: { bodyColor: '#4f46e5', outfit: null, accessory: null, vehicle: null, hat: null, emote: null },
      position: { x: 400, y: 300 },
      xp: 0,
      level: 1,
      coins: 0,
      unlocked_cards: [],
      unlocked_costumes: [],
      achievements: []
    };
    await supabase.from('players').insert(fallbackPlayer);
    playerDb = fallbackPlayer;
  }

  if (typeof window !== 'undefined' && savedSessionCode) {
    localStorage.setItem('app.session_code', savedSessionCode);
  }

  const question = await getQuestionById(questionId);
  if (!question) throw new Error('Question not found');

  const isCorrect = question.correctIndex === selectedIndex;

  // Insert quiz_answers
  await supabase.from('quiz_answers').insert({
    player_id: playerId,
    session_code: playerDb.session_code || '',
    question_id: questionId,
    unit_id: question.unitId,
    is_correct: isCorrect,
    card_reward: isCorrect ? question.cardReward : null
  });

  let cardUnlocked: string | undefined = undefined;
  let damage: number | undefined = undefined;

  if (isCorrect) {
    // 1. Reward Coins + XP
    const coinsReward = question.difficulty === 'easy' ? 10 : question.difficulty === 'medium' ? 20 : 30;
    const xpReward = question.difficulty === 'easy' ? 20 : question.difficulty === 'medium' ? 40 : 60;

    let unlockedCards = [...(playerDb.unlocked_cards || [])];
    if (question.cardReward && !unlockedCards.includes(question.cardReward)) {
      // First time unlocking card
      unlockedCards.push(question.cardReward);
      cardUnlocked = question.cardReward;
    }

    const nextXp = playerDb.xp + xpReward;
    const nextLevel = Math.floor(nextXp / 100) + 1;

    await supabase
      .from('players')
      .update({
        xp: nextXp,
        level: nextLevel,
        coins: playerDb.coins + coinsReward,
        unlocked_cards: unlockedCards
      })
      .eq('id', playerId);

    // 2. Raid Damage Calculations
    const sessionRes = await supabase.from('game_sessions').select('*').eq('code', playerDb.session_code);
    const session = sessionRes.data && sessionRes.data[0];
    if (session && (session.status === 'raid' || session.status === 'quiz')) {
      const multiplier = question.difficulty === 'easy' ? 10 : question.difficulty === 'medium' ? 20 : 35;
      damage = multiplier;
      const nextBossHp = Math.max(0, (session.boss_hp ?? 1000) - damage);
      await supabase.from('game_sessions').update({ boss_hp: nextBossHp }).eq('code', playerDb.session_code);
    }
  }

  return { correct: isCorrect, cardUnlocked, damage };
}

export async function startBattle(
  p1Id: string,
  p2Id: string,
  sessionCode: string
): Promise<BattleState> {
  if (IS_SUPABASE_CONFIGURED) {
    try {
      const { data, error } = await supabase.functions.invoke('start-battle', {
        body: { p1Id, p2Id, sessionCode }
      });
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('Edge Function start-battle failed, falling back to mock.', e);
    }
  }

  // --- Offline Mock Fallback ---
  // Bypass RLS in mock by temporarily clearing session code filter
  const savedSessionCode = typeof window !== 'undefined' ? localStorage.getItem('app.session_code') : null;
  if (typeof window !== 'undefined') localStorage.removeItem('app.session_code');

  const p1Res = await supabase.from('players').select('*').eq('id', p1Id);
  const p2Res = await supabase.from('players').select('*').eq('id', p2Id);
  const p1 = p1Res.data && p1Res.data[0];
  const p2 = p2Res.data && p2Res.data[0];

  if (typeof window !== 'undefined' && savedSessionCode) {
    localStorage.setItem('app.session_code', savedSessionCode);
  }

  if (!p1 || !p2) throw new Error('Players not found for battle');

  // Load first 3 cards or random cards from player inventory as default deck
  const getDeck = async (unlocked: string[]): Promise<Card[]> => {
    const deck: Card[] = [];
    for (const cardId of unlocked.slice(0, 3)) {
      const card = await getCardById(cardId);
      if (card) deck.push(card);
    }
    // Fill up to 3 cards with default attacks if inventory is small
    while (deck.length < 3) {
      deck.push({
        id: `default_${deck.length}`,
        name: '기본 공격 광선',
        emoji: '⚡',
        rarity: 'common',
        unitId: 1,
        description: '과학 지식의 일격!',
        power: 20,
        type: 'attack'
      });
    }
    return deck;
  };

  const p1Deck = await getDeck(p1.unlocked_cards || []);
  const p2Deck = await getDeck(p2.unlocked_cards || []);

  const battleState: BattleState = {
    sessionId: sessionCode,
    player1: {
      id: p1.id,
      nickname: p1.nickname,
      hp: 100,
      maxHp: 100,
      deck: p1Deck,
      avatar: p1.avatar
    },
    player2: {
      id: p2.id,
      nickname: p2.nickname,
      hp: 100,
      maxHp: 100,
      deck: p2Deck,
      avatar: p2.avatar
    },
    currentTurn: p1.id,
    round: 1,
    maxRounds: 3,
    status: 'selecting',
    selectedCards: {}
  };

  // Save to game session metadata or channel (broadcasting simulated state)
  return battleState;
}

export async function resolveBattleRound(
  battleId: string,
  p1Card: string,
  p2Card: string
): Promise<{ winnerId: string; newHp: Record<string, number> }> {
  if (IS_SUPABASE_CONFIGURED) {
    try {
      const { data, error } = await supabase.functions.invoke('resolve-battle-round', {
        body: { battleId, p1Card, p2Card }
      });
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('Edge Function resolve-battle-round failed, falling back to mock.', e);
    }
  }

  // --- Offline Mock Fallback ---
  // Simple rock-paper-scissors or pure power evaluation
  const card1 = await getCardById(p1Card);
  const card2 = await getCardById(p2Card);

  const power1 = card1?.power ?? 20;
  const power2 = card2?.power ?? 20;

  // Let's decide winner based on power
  let p1Damage = power2;
  let p2Damage = power1;

  // Simple element modifier logic (optional)
  if (card1?.type === 'attack' && card2?.type === 'defense') {
    p1Damage = Math.max(0, p1Damage - 15);
  } else if (card2?.type === 'attack' && card1?.type === 'defense') {
    p2Damage = Math.max(0, p2Damage - 15);
  }

  const p1HpNew = Math.max(0, 100 - p1Damage);
  const p2HpNew = Math.max(0, 100 - p2Damage);

  const winnerId = p1HpNew > p2HpNew ? 'player1' : p2HpNew > p1HpNew ? 'player2' : 'tie';

  return {
    winnerId,
    newHp: {
      p1: p1HpNew,
      p2: p2HpNew
    }
  };
}

export async function dealBossDamage(
  playerId: string,
  damage: number,
  sessionCode: string
): Promise<{ newBossHp: number; killed: boolean }> {
  if (IS_SUPABASE_CONFIGURED) {
    try {
      const { data, error } = await supabase.functions.invoke('deal-boss-damage', {
        body: { playerId, damage, sessionCode }
      });
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('Edge Function deal-boss-damage failed, falling back to mock.', e);
    }
  }

  // --- Offline Mock Fallback ---
  const sessionRes = await supabase.from('game_sessions').select('*').eq('code', sessionCode);
  const session = sessionRes.data && sessionRes.data[0];
  if (!session) throw new Error('Game session not found');

  const nextHp = Math.max(0, (session.boss_hp ?? 1000) - damage);
  await supabase.from('game_sessions').update({ boss_hp: nextHp }).eq('code', sessionCode);

  return {
    newBossHp: nextHp,
    killed: nextHp === 0
  };
}
