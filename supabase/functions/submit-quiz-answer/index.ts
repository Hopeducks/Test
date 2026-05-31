import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // SERVICE_ROLE_KEY 로 생성 — RLS를 우회하여 questions 테이블의 정답을 서버에서만 조회
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // ANON_KEY 클라이언트 — 플레이어 본인 레코드 수정 (RLS 적용)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { playerId, questionId, selectedIndex } = await req.json();

    if (!playerId || !questionId || selectedIndex === undefined) {
      return json({ error: 'Missing parameters' }, 400);
    }

    // 1. 서버에서 정답 조회 (SERVICE_ROLE 사용 — 클라이언트에 노출 안 됨)
    const { data: question, error: qErr } = await supabaseAdmin
      .from('questions')
      .select('correct_index, card_reward, difficulty, unit_id')
      .eq('id', questionId)
      .single();

    if (qErr || !question) {
      return json({ error: 'Question not found' }, 404);
    }

    // 2. 서버에서 정답 여부 판정
    const isCorrect = question.correct_index === selectedIndex;

    // 3. 플레이어 조회
    const { data: player, error: pErr } = await supabaseClient
      .from('players')
      .select('id, xp, level, coins, unlocked_cards, session_code')
      .eq('id', playerId)
      .single();

    if (pErr || !player) {
      return json({ error: 'Player not found' }, 404);
    }

    // 4. 답변 기록 저장
    await supabaseAdmin.from('quiz_answers').insert({
      player_id: playerId,
      session_code: player.session_code,
      question_id: questionId,
      unit_id: question.unit_id,
      is_correct: isCorrect,
      card_reward: isCorrect ? question.card_reward : null,
    });

    let cardUnlocked: string | undefined;
    let damage: number | undefined;

    if (isCorrect) {
      const difficulty = question.difficulty ?? 'medium';
      const coinsReward = difficulty === 'easy' ? 10 : difficulty === 'hard' ? 30 : 20;
      const xpReward    = difficulty === 'easy' ? 20 : difficulty === 'hard' ? 60 : 40;
      const baseDmg     = difficulty === 'easy' ? 10 : difficulty === 'hard' ? 35 : 20;

      // 5. 카드 최초 해금 확인
      const unlockedCards = [...(player.unlocked_cards ?? [])];
      if (question.card_reward && !unlockedCards.includes(question.card_reward)) {
        unlockedCards.push(question.card_reward);
        cardUnlocked = question.card_reward;
      }

      const nextXp    = player.xp + xpReward;
      const nextLevel = Math.floor(nextXp / 100) + 1;

      // 6. 플레이어 업데이트 (admin으로 — RLS 우회 없이 service role로 안전하게)
      await supabaseAdmin.from('players').update({
        xp: nextXp,
        level: nextLevel,
        coins: player.coins + coinsReward,
        unlocked_cards: unlockedCards,
      }).eq('id', playerId);

      // 7. 레이드 중이면 보스 HP 차감
      const { data: session } = await supabaseAdmin
        .from('game_sessions')
        .select('status, boss_hp')
        .eq('code', player.session_code)
        .single();

      if (session && (session.status === 'raid' || session.status === 'quiz')) {
        damage = baseDmg;
        const nextBossHp = Math.max(0, (session.boss_hp ?? 1000) - damage);
        await supabaseAdmin
          .from('game_sessions')
          .update({ boss_hp: nextBossHp })
          .eq('code', player.session_code);
      }
    }

    return json({ correct: isCorrect, cardUnlocked, damage });
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
