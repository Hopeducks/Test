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

    const { sessionCode, nickname } = await req.json();
    if (!sessionCode || !nickname) return json({ error: 'Missing parameters' }, 400);

    // 닉네임 중복 검사 (같은 세션 내)
    const { data: existing } = await supabaseAdmin
      .from('players')
      .select('id')
      .eq('session_code', sessionCode)
      .eq('nickname', nickname)
      .maybeSingle();

    if (existing) return json({ error: '이미 사용 중인 닉네임입니다.' }, 409);

    // 세션 존재 확인
    const { data: session, error: sErr } = await supabaseAdmin
      .from('game_sessions')
      .select('*')
      .eq('code', sessionCode)
      .single();

    if (sErr || !session) return json({ error: '존재하지 않는 세션 코드입니다.' }, 404);
    if (session.status === 'ended') return json({ error: '이미 종료된 세션입니다.' }, 410);

    // 플레이어 생성
    const { data: player, error: pErr } = await supabaseAdmin
      .from('players')
      .insert({
        nickname,
        session_code: sessionCode,
        avatar: { bodyColor: '#4f46e5', outfit: null, accessory: null, vehicle: null },
        position: { x: 400, y: 300 },
      })
      .select()
      .single();

    if (pErr || !player) return json({ error: '플레이어 생성 실패' }, 500);

    return json({ player, session });
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
