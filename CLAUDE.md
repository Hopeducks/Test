# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Commands

```bash
npm run dev        # 개발 서버 (localhost:3000)
npm run build      # 정적 빌드 (output: 'export' → /out 디렉터리)
npm run start      # 빌드 결과물 프리뷰
npm run lint       # ESLint 검사 (ESLint 8 고정 — 9로 올리면 circular JSON 오류 발생)
```

환경 변수는 `.env.local.example`을 복사해 `.env.local`을 생성하고 Supabase 키를 채운다. `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 없으면 `edge-functions.ts`의 모든 함수가 자동으로 오프라인 목(mock) 경로로 폴백한다.

---

## 아키텍처 개요

### 빌드 방식
`next.config.ts`는 `output: 'export'`로 설정된 완전 정적 배포다. 동적 라우트 `/teacher/[code]`는 `generateStaticParams()`로 더미 경로를 만들고, 실제 쿼리스트링 파싱은 `useSearchParams()` + `<Suspense>` 경계 안에서만 수행한다.

### 화면 라우팅
`app/page.tsx`가 싱글 페이지 라우터 역할을 한다. 별도 페이지 이동 없이 `activeScreen` state로 뷰를 전환한다.

```
role === 'none'    → RoleSelector
role === 'teacher' → TeacherDashboard
role === 'student'
  activeScreen:
    home     → PokedexHome
    lobby    → StudentLobby
    quiz     → QuizScreen (components/ui/)
    complete → UnitComplete
    battle   → CardBattleArena
    raid     → BossRaidScreen
```

### 전역 상태 (`lib/game-state.ts`)
`GameStateManager` 싱글톤이 모든 상태를 보유하며 `localStorage`에 직렬화한다. React 컴포넌트는 `useGameState()` 훅을 통해 구독한다. 멀티탭 동기화는 HTML5 `storage` 이벤트로, 멀티기기 실시간 동기화는 Supabase Broadcast 채널 `classroom_session_global`로 처리한다.

### Supabase 연동 패턴 (`lib/supabase/`)
- **`realtime.ts`**: `usePresence`, `useBossRaid`, `useBattleState`, `useSessionStatus` 훅. 캐릭터 위치 동기화는 Presence(100ms 스로틀), 게임 이벤트는 Broadcast를 사용한다.
- **`edge-functions.ts`**: `joinSession`, `submitQuizAnswer`, `startBattle`, `resolveBattleRound`, `dealBossDamage`. Supabase가 미설정이면 자동으로 클라이언트 사이드 목 경로로 실행된다.

### Phaser 4 통합
Phaser 컴포넌트(`components/game/PhaserCanvas.tsx`)는 반드시 `dynamic(() => import(...), { ssr: false })`로 로드한다. `useEffect` cleanup에서 `game.destroy(true)`를 명시적으로 호출해야 메모리 누수가 없다.

### 데이터 레이어
- `data/questions.ts` — 320개 문항 (`getUnitQuestions(unitId)` 함수로 단원별 접근)
- `data/cards.ts` — 80개 카드 (단원당 9개 일반/희귀 + 1개 레전더리)
- `data/costume-catalog.ts` — 코스튬/탈것/악세서리 카탈로그

카드 ID 규칙: `u{unitId}_c{index}` (예: `u1_c1`). 레전더리 카드는 각 단원 마지막 카드.

### 속성(Attribute) 시스템 (`lib/game-state.ts`)
단원 번호 → 포켓몬 속성 매핑(`ATTRIBUTE_MAPPING`)과 상성 테이블(`ATTRIBUTE_RELATIONSHIPS`)로 배틀 배율을 계산한다. `getAttackMultiplier(attackerUnitId, defenderUnitId)` 사용.

### 컴포넌트 중복 주의
`components/AvatarCustomizer.tsx`와 `components/ui/AvatarCustomizer.tsx`,  
`components/QuizView.tsx`와 `components/ui/QuizScreen.tsx`가 공존한다.  
`app/page.tsx`에서 실제 import되는 쪽은 `QuizScreen` (ui/)과 `BossRaidScreen` (ui/)이다.

### 아바타 코스튬 카테고리 매핑 주의
`CostumeItem.category`가 `'pet'`이지만 `AvatarConfig`의 필드명은 `petId`다. 동적 인덱싱 시 `as keyof` 단언 대신 명시적 분기(`if (category === 'pet') { ... }`)를 사용한다.
