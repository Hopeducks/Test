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

    const { p1Id, p2Id, sessionCode } = await req.json();
    if (!p1Id || !p2Id || !sessionCode) return json({ error: 'Missing parameters' }, 400);

    const [{ data: p1 }, { data: p2 }] = await Promise.all([
      supabaseAdmin.from('players').select('*').eq('id', p1Id).single(),
      supabaseAdmin.from('players').select('*').eq('id', p2Id).single(),
    ]);

    if (!p1 || !p2) return json({ error: 'Player not found' }, 404);

    const makeDefaultDeck = (unlockedCards: string[]) =>
      (unlockedCards ?? []).slice(0, 3).map((id: string) => ({ id, power: 20 }));

    const battleState = {
      sessionId: sessionCode,
      player1: { id: p1.id, nickname: p1.nickname, hp: 100, maxHp: 100, deck: makeDefaultDeck(p1.unlocked_cards), avatar: p1.avatar },
      player2: { id: p2.id, nickname: p2.nickname, hp: 100, maxHp: 100, deck: makeDefaultDeck(p2.unlocked_cards), avatar: p2.avatar },
      currentTurn: p1.id,
      round: 1,
      maxRounds: 3,
      status: 'selecting',
      selectedCards: {},
    };

    return json(battleState);
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
