# Plan: Phase 1 — 기반 정비 (Foundation Stabilization)

## Summary
현재 빌드 실패(Google Fonts SSL 오류)와 `any` 타입 23건, 800줄 초과 파일 4개를 수정하여 `npm run build` + `tsc --noEmit` 완전 통과 상태를 만든다. 교사→학생 전체 플로우가 브라우저에서 오류 없이 완주 가능한 상태가 목표다.

## User Story
As a 개발자,
I want 빌드와 타입 체크가 완전히 통과하고 주요 기능이 동작하는 안정적인 코드베이스를,
So that 이후 Phase 2~8 개편 작업을 신뢰할 수 있는 기반 위에서 진행할 수 있다.

## Problem → Solution
빌드 실패 + any 타입 23건 + 과밀 파일 → 빌드 통과 + strict 타입 + TeacherDashboard 분리

## Metadata
- **Complexity**: Large
- **Source PRD**: `.claude/PRPs/prds/science-master-metaverse-overhaul.prd.md`
- **PRD Phase**: Phase 1 — 기반 정비
- **Estimated Files**: 12~15개

---

## UX Design

N/A — 내부 코드 품질 개선, 사용자 노출 화면 변경 없음

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `app/layout.tsx` | 1-56 | 빌드 실패 원인 (Google Fonts) |
| P0 | `types/index.ts` | 전체 | 타입 정의 전체 구조 파악 |
| P0 | `lib/game-state.ts` | 전체 | any 6건, 1325줄 |
| P0 | `components/ui/TeacherDashboard.tsx` | 전체 | any 6건, 1643줄 |
| P1 | `AGENTS.md` | 전체 | Non-negotiable 규칙 준수 |
| P1 | `lessons.md` | 전체 | 기존 교훈 재발 방지 |
| P1 | `lib/supabase/realtime.ts` | 전체 | any 4건 |
| P2 | `components/ui/CardBattleArena.tsx` | 전체 | any 3건, 1345줄 |
| P2 | `components/ui/QuizScreen.tsx` | 전체 | any 1건, 1066줄 |
| P2 | `components/ui/BossRaidScreen.tsx` | 전체 | any 2건 |

---

## Patterns to Mirror

### NAMING_CONVENTION
```typescript
// SOURCE: types/index.ts:2-12
export interface AvatarConfig { ... }    // PascalCase interface
export type CostumeId = string           // PascalCase type alias
export type EmoteId = 'wave' | 'cheer'  // union literal type
```

### FONT_LOADING_FIX
```css
/* SOURCE: app/globals.css — CSS @import는 런타임 브라우저에서 실행, 빌드 타임 영향 없음 */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&family=Outfit:wght@300;400;500;600;700;800&display=swap');
```

### TYPE_NARROWING
```typescript
// SOURCE: lessons.md #6 + AGENTS.md Rule 1
// WRONG: const handleEvent = (data: any) => { ... }
// RIGHT: const handleEvent = (data: StorageEvent) => { ... }

// localStorage 파싱 패턴
const raw: unknown = JSON.parse(saved ?? '{}');
function isGameProgress(v: unknown): v is GameProgress {
  return typeof v === 'object' && v !== null && 'unlockedCardIds' in v;
}
```

### FILE_SPLIT
```
// 800줄 초과 → 기능 단위 디렉토리 분리
components/ui/TeacherDashboard/
├── index.tsx        (진입점, 레이아웃, ~200줄)
├── QuizControl.tsx  (~250줄)
├── BattleControl.tsx (~250줄)
├── RaidControl.tsx  (~250줄)
├── StudentGrid.tsx  (~250줄)
└── StatsPanel.tsx   (~200줄)
// app/page.tsx import 경로 변경 없음 (index.tsx 자동 해석)
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `app/layout.tsx` | UPDATE | `next/font/google` 제거, CSS 변수만 유지 |
| `app/globals.css` | UPDATE | Google Fonts @import 추가 |
| `types/index.ts` | UPDATE | BroadcastPayload, PresencePayload 타입 추가 |
| `lib/supabase/realtime.ts` | UPDATE | any 4건 → 명시적 타입 |
| `lib/game-state.ts` | UPDATE | any 6건 → 타입 가드 패턴 |
| `components/ui/BossRaidScreen.tsx` | UPDATE | any 2건 제거 |
| `components/ui/QuizScreen.tsx` | UPDATE | any 1건 제거 |
| `components/ui/CardBattleArena.tsx` | UPDATE | any 3건 제거 |
| `components/ui/TeacherDashboard.tsx` | SPLIT | → `TeacherDashboard/` 디렉토리 |
| `components/ui/TeacherDashboard/index.tsx` | CREATE | 진입점 |
| `components/ui/TeacherDashboard/QuizControl.tsx` | CREATE | 퀴즈 제어 |
| `components/ui/TeacherDashboard/BattleControl.tsx` | CREATE | 배틀 제어 |
| `components/ui/TeacherDashboard/RaidControl.tsx` | CREATE | 레이드 제어 |
| `components/ui/TeacherDashboard/StudentGrid.tsx` | CREATE | 학생 그리드 |
| `components/ui/TeacherDashboard/StatsPanel.tsx` | CREATE | 통계 패널 |

## NOT Building
- UI 디자인 변경 → Phase 2
- 새 문제 형식 → Phase 3
- 새 Phaser 씬 → Phase 4
- game/scenes/ any 수정 → Phase 4에서 함께 처리
- supabase/functions/ any 수정 → Deno 별도 tsconfig, 별도 검토

---

## Step-by-Step Tasks

### Task 1: 빌드 실패 수정 — Google Fonts SSL 오류
- **ACTION**: `app/layout.tsx`에서 `next/font/google` 제거, `globals.css`로 폰트 이동
- **IMPLEMENT**:
  `app/globals.css` 최상단에 추가:
  ```css
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&family=Outfit:wght@300;400;500;600;700;800&display=swap');
  ```
  `app/layout.tsx`:
  - `import { Outfit, Noto_Sans_KR } from 'next/font/google'` 제거
  - `outfit`, `notoSansKr` 변수 제거
  - `<html>` className에서 `${outfit.variable} ${notoSansKr.variable}` 제거
  - CSS 변수 `--font-outfit`, `--font-noto-sans-kr`는 `globals.css`에서 직접 `font-family` 지정으로 대체
- **GOTCHA**: `next/font/google`은 빌드 타임에 Google 서버 접근 → 네트워크 제한 환경에서 항상 실패. CSS @import는 런타임 브라우저에서 실행되므로 빌드와 무관
- **VALIDATE**: `npx next build` → font 관련 오류 없이 완료

### Task 2: Realtime 타입 보강 — `types/index.ts` + `lib/supabase/realtime.ts`
- **ACTION**: Supabase Broadcast/Presence 콜백용 타입을 types/index.ts에 추가, realtime.ts의 any 4건 교체
- **IMPLEMENT** (`types/index.ts` 하단 추가):
  ```typescript
  // ── Supabase Realtime 페이로드 타입 ──────────────────
  export interface BroadcastPayload<T = Record<string, unknown>> {
    event: string;
    payload: T;
    type: 'broadcast';
  }
  export interface PresenceSyncPayload {
    [key: string]: RealtimePlayerState;
  }
  ```
- **MIRROR**: `types/index.ts` 기존 주석 구분선 패턴 (`// ── 이름 ───`)
- **GOTCHA**: Supabase JS SDK의 `on('broadcast')` 콜백은 내부적으로 `RealtimeChannel`에 바인딩 — 제네릭 타입 파라미터로 처리
- **VALIDATE**: `npx tsc --noEmit` → realtime.ts 0 errors

### Task 3: `lib/game-state.ts` — any 6건 제거
- **ACTION**: localStorage 직렬화/역직렬화와 이벤트 핸들러의 any를 타입 가드 + 명시적 타입으로 교체
- **IMPLEMENT**:
  ```typescript
  // 타입 가드 추가
  function isGameProgress(v: unknown): v is GameProgress {
    return typeof v === 'object' && v !== null && 'unlockedCardIds' in v;
  }
  // StorageEvent 핸들러
  const handleStorage = (e: StorageEvent) => { ... }
  ```
- **MIRROR**: `types/index.ts:229-243` GameProgress 구조
- **GOTCHA**: `JSON.parse` 반환값은 항상 `unknown`으로 받은 후 타입 가드 적용 — `as GameProgress` 단언 사용 금지
- **VALIDATE**: `npx tsc --noEmit` → game-state.ts 0 errors

### Task 4: UI 컴포넌트 any 제거 (BossRaid, Quiz, CardBattle)
- **ACTION**: 3개 파일의 any 합계 6건을 기존 타입으로 교체
- **IMPLEMENT**:
  - `BossRaidScreen.tsx`: `BossRaidState`, `Question` 활용, `Object.entries(contributions)` 패턴
  - `QuizScreen.tsx`: `(questionId: string, selectedIndex: number) => void` prop 타입
  - `CardBattleArena.tsx`: `BattleState`, `Card`, `BattlePlayer` 활용
- **MIRROR**: `types/index.ts` 각 인터페이스
- **VALIDATE**: `npx tsc --noEmit` → 3파일 0 errors

### Task 5: `TeacherDashboard.tsx` 분리 (1643줄)
- **ACTION**: 단일 파일을 `TeacherDashboard/` 디렉토리로 분리
- **IMPLEMENT**:
  1. 기존 파일에서 JSX 섹션 경계 파악 (주석 기준)
  2. `index.tsx`: 레이아웃 조합, 공유 상태 props 정의
  3. 각 서브컴포넌트: 해당 섹션 JSX + 로컬 핸들러 이동
  4. 공유 props 타입은 `types/index.ts`의 기존 타입 재사용
  5. 기존 `TeacherDashboard.tsx` 파일 삭제 (`index.tsx`로 대체)
- **GOTCHA**: `app/page.tsx`의 import `'../components/ui/TeacherDashboard'`는 변경 불필요 — Next.js가 디렉토리의 index.tsx를 자동 해석
- **VALIDATE**: 분리 후 `npx tsc --noEmit` 통과, `npm run dev`에서 교사 대시보드 정상 렌더링

### Task 6: 최종 빌드 검증
- **ACTION**: 전체 검증 명령어 순서대로 실행
- **IMPLEMENT**:
  ```bash
  npx tsc --noEmit   # 0 errors
  npx next build     # Successfully built
  npm run lint       # 0 errors
  ```
- **VALIDATE**: `/out` 디렉토리 생성 확인, 파일 크기 정상 범위

---

## Testing Strategy

### Edge Cases Checklist
- [ ] Supabase 미연결 시 mock 폴백 정상 동작 (기존 패턴 유지)
- [ ] TeacherDashboard 분리 후 모든 버튼/이벤트 정상 동작
- [ ] 폰트 로딩 실패 시 시스템 폰트 폴백 표시

### Manual Validation
- [ ] `npm run dev` → `localhost:3000` 정상 접속
- [ ] RoleSelector → 학생 선택 → 닉네임 입력 → 로비 플로우 완주
- [ ] RoleSelector → 교사 선택 → 대시보드 정상 렌더링
- [ ] 콘솔 오류 없음
- [ ] 폰트(Noto Sans KR, Outfit) 정상 적용 확인

---

## Validation Commands

```bash
# 타입 체크
npx tsc --noEmit

# 빌드
npx next build

# 린트
npm run lint

# 개발 서버 (수동 검증용)
npm run dev
```

---

## Acceptance Criteria
- [ ] `npx next build` 오류 없이 완료, `/out` 디렉토리 생성
- [ ] `npx tsc --noEmit` 오류 0건
- [ ] `npm run lint` 오류 0건
- [ ] `any` 타입: 프로젝트 소스(supabase/functions 제외) 0건
- [ ] `TeacherDashboard` 분리 완료 (각 파일 800줄 이하)
- [ ] 브라우저에서 교사/학생 전체 플로우 오류 없이 완주

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| TeacherDashboard 분리 후 상태 끊김 | M | H | 분리 전 props 목록 전수 파악 후 진행 |
| CSS @import 폰트 차단 환경 | L | M | `font-family` 시스템 폰트 폴백 병행 |
| Supabase SDK 타입 버전 불일치 | L | M | `@supabase/supabase-js` 버전 고정 유지 |

## Notes
- `game/scenes/LobbyScene.ts` any 1건은 Phaser API 특성상 Phase 4에서 처리
- `supabase/functions/` Edge Function any는 Deno 런타임용 별도 tsconfig → Phase 1 스코프 외
- `components/AvatarCustomizer.tsx` (루트) 중복 파일 정리는 Phase 2에서 처리
