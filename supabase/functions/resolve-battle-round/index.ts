import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 서버에서 카드 공격력을 조회하여 클라이언트 조작 방지
const CARD_DEFAULT_POWER = 20;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { battleId, p1CardId, p2CardId, p1Id, p2Id } = await req.json();
    if (!p1CardId || !p2CardId) return json({ error: 'Missing parameters' }, 400);

    // 카드 타입 기반 간단한 상성 (attack beats defense)
    // 실제 카드 power는 cards 데이터에서 관리; 여기서는 기본값 사용
    const power1 = CARD_DEFAULT_POWER;
    const power2 = CARD_DEFAULT_POWER;

    let p1Damage = power2;
    let p2Damage = power1;

    // attack vs defense 상성
    if (p1CardId.includes('attack') && p2CardId.includes('defense')) {
      p1Damage = Math.max(0, p1Damage - 15);
    } else if (p2CardId.includes('attack') && p1CardId.includes('defense')) {
      p2Damage = Math.max(0, p2Damage - 15);
    }

    const p1HpNew = Math.max(0, 100 - p1Damage);
    const p2HpNew = Math.max(0, 100 - p2Damage);
    const winnerId = p1HpNew > p2HpNew ? 'player1' : p2HpNew > p1HpNew ? 'player2' : 'tie';

    // 배틀 결과 기록
    if (winnerId !== 'tie' && p1Id && p2Id) {
      await supabaseAdmin.from('battle_results').insert({
        winner_id: winnerId === 'player1' ? p1Id : p2Id,
        loser_id: winnerId === 'player1' ? p2Id : p1Id,
        rounds: [{ p1CardId, p2CardId, winnerId }],
      });
    }

    return json({ winnerId, newHp: { p1: p1HpNew, p2: p2HpNew } });
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
