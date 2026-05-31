# 과학 마스터 메타버스 — Agent Rules

## Project Identity
- App: 과학 마스터 메타버스 (Science Master Metaverse)
- Scale: 40~60 concurrent students per classroom session
- Stack: Next.js 15 (App Router) + Phaser 4 (game canvas) + Supabase (Realtime + PostgreSQL + Edge Functions) + Vercel
- Auth: NO login — nickname-only anonymous sessions via Supabase anon key
- Language: All UI text in Korean

## Architecture Decisions (NEVER override without explicit instruction)
- Phaser 4 runs inside a React ref container — never import Phaser at module level (SSR will break)
- All Phaser scenes communicate with React via a global EventEmitter, never direct DOM manipulation
- Supabase Realtime channels: one per game session (channel key = sessionCode)
- Player position sync: throttled to 100ms via Broadcast (not DB writes — too slow)
- Battle state: Supabase Edge Function handles all HP calculations (clients cannot self-report damage)
- Quiz answers: written to Supabase DB → triggers card unlock via DB webhook
- Teacher dashboard: separate /teacher route, reads same Realtime channel as students (read-only)

## Non-Negotiable Rules
1. TypeScript strict — zero `any`, all types in /types/index.ts
2. npm run build + npx tsc --noEmit must pass before reporting task complete
3. Never write player HP or battle results from the client — always Edge Function
4. Never store quiz answers only in localStorage — always sync to Supabase
5. Phaser canvas: lazy-loaded with dynamic import(() => import('phaser'), always with ssr: false
6. On mistake: record lesson in lessons.md immediately

## File Structure Contract
/app                → Next.js routes
/components/game    → Phaser scene wrappers (React shells)
/components/ui      → Non-game React components
/game/scenes        → Phaser Scene classes (pure Phaser, no React)
/game/entities      → Phaser GameObjects (Avatar, Boss, etc.)
/lib/supabase       → Supabase client, realtime hooks, edge function callers
/lib/game-state.ts  → Local state (costume worn, local quiz session)
/data               → Static data (questions, cards, costume catalog)
/types/index.ts     → ALL TypeScript interfaces
