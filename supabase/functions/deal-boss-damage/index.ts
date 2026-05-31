import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { playerId, damage, sessionCode } = await req.json();
    if (!playerId || damage === undefined || !sessionCode) {
      return json({ error: 'Missing parameters' }, 400);
    }

    // 데미지 값 서버에서 검증 (클라이언트 임의 값 방지)
    const clampedDamage = Math.min(Math.max(0, Number(damage)), 100);

    const { data: session, error: sErr } = await supabaseAdmin
      .from('game_sessions')
      .select('boss_hp, status')
      .eq('code', sessionCode)
      .single();

    if (sErr || !session) return json({ error: 'Session not found' }, 404);
    if (session.status !== 'raid') return json({ error: 'Not in raid mode' }, 400);

    const nextHp = Math.max(0, (session.boss_hp ?? 1000) - clampedDamage);

    await supabaseAdmin
      .from('game_sessions')
      .update({ boss_hp: nextHp })
      .eq('code', sessionCode);

    return json({ newBossHp: nextHp, killed: nextHp === 0 });
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
