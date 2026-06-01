# Plan: Phase 5 — 게임 모드 (토너먼트·타임어택·레이드 스케일링)

## Summary
토너먼트 브래킷 모드, 타임어택 속도 보너스 채점, 협동 레이드 HP 스케일링을 추가한다.
기존 `ClassroomSession` 구조와 `ControlPanels` 패턴을 최대한 재사용하고, 신규 `TournamentBracketView` 컴포넌트 1개를 추가한다.
QuizScreen 타이머는 이미 완성되어 있으므로 타임어택은 속도 보너스 계산 로직만 추가한다.

## User Story
As a 교사, I want 토너먼트·타임어택·레이드 모드를 수업 중 원클릭으로 시작할 수 있어야 하며, 학생은 브래킷 배정과 레이드 HP를 실시간으로 확인할 수 있어야 한다.

## Problem → Solution
- 단일 퀴즈 모드만 존재 → 토너먼트·타임어택·레이드 스케일링 세 가지 게임 모드 추가
- 레이드 보스 HP 고정(1000) → 학생 수 비례 공식(`max(500, N * 150)`)으로 자동 계산
- 토너먼트 브래킷이 없음 → ClassroomSession 내 bracket 상태 관리 + 시각화 컴포넌트

## Metadata
- **Complexity**: Medium
- **Source PRD**: `.claude/PRPs/prds/science-master-metaverse-overhaul.prd.md`
- **PRD Phase**: Phase 5 — 게임 모드
- **Estimated Files**: 4 (3 updated, 1 created)

---

## UX Design

### Before
```
ControlPanels
┌──────────────────────────────────────┐
│ [퀴즈 시작]  [퀴즈 중지]              │
│ [레이드 시작] (HP 고정 1000)           │
│ 배틀 모드 토글                         │
└──────────────────────────────────────┘

StudentLobby: status === 'playing' → 퀴즈로 이동
```

### After
```
ControlPanels
┌──────────────────────────────────────┐
│ [퀴즈 시작]  [퀴즈 중지]              │
│ ─── 게임 모드 ───                     │
│ [⚡ 타임어택]  (속도 보너스 점수)      │
│ [🏆 토너먼트 시작] → 브래킷 자동 생성  │
│ [레이드 시작]  HP: N×150 자동 계산    │
└──────────────────────────────────────┘

StudentLobby: status === 'tournament' → TournamentBracketView
QuizScreen: timeAttackMode === true → 속도 보너스 표시
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| 교사: 게임 모드 선택 | 없음 | ControlPanels에 3개 버튼 추가 | 기존 섹션 하단 |
| 학생: 토너먼트 화면 | 없음 | TournamentBracketView 표시 | status='tournament'일 때 |
| 학생: 타임어택 퀴즈 | 일반 채점 | 빠를수록 +bonus 표시 | QuizScreen 기존 timer 활용 |
| 레이드 HP | 1000 고정 | 학생 수 × 150 | ControlPanels 계산 후 session 저장 |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `types/index.ts` | 311-358 | ClassroomSession 구조 — 직접 확장 대상 |
| P0 | `components/ui/TeacherDashboard/ControlPanels.tsx` | 42-143 | 기존 핸들러 패턴 (handleStartRaid, handleAutoMatch) |
| P1 | `components/ui/QuizScreen.tsx` | 227-310 | 타이머 상태(timeLeft, totalTime) — 타임어택 활용 |
| P1 | `components/StudentLobby.tsx` | 1-80 | status 분기 + dynamic import 패턴 |
| P2 | `game/scenes/RaidScene.ts` | 160-185 | bossMaxHp 초기화 위치 (init 메서드) |

## External Documentation
없음 — 기존 내부 패턴만 활용.

---

## Patterns to Mirror

### CLASSROOM_SESSION_STATUS_EXTENSION
```typescript
// SOURCE: types/index.ts:315
// 기존 패턴: union literal 확장
status: 'lobby' | 'playing' | 'ended'
// → 확장:
status: 'lobby' | 'playing' | 'ended' | 'tournament'
```

### CONTROL_PANEL_HANDLER
```typescript
// SOURCE: components/ui/TeacherDashboard/ControlPanels.tsx:52-55
const handleStartRaid = () => {
  gameAudio.playClick();
  setClassroomSession({ ...classroomSession, status: 'raid' as ClassroomSession['status'] });
};
```

### AUTO_MATCH_SHUFFLE
```typescript
// SOURCE: components/ui/TeacherDashboard/ControlPanels.tsx:122-143
const shuffled = [...unpairedStudents].sort(() => Math.random() - 0.5);
for (let i = 0; i < shuffled.length - 1; i += 2) {
  // pair i, i+1
}
```

### DYNAMIC_IMPORT_PATTERN
```typescript
// SOURCE: components/StudentLobby.tsx:19-27
const ZoneEntryPanel = dynamic(() => import('./ui/ZoneEntryPanel'), { ssr: false });
```

### GLASS_PANEL_UI
```tsx
// SOURCE: components/ui/TeacherDashboard/ControlPanels.tsx:163
<div className="glass-panel p-5 border-cyan-500/10 space-y-4">
  <h3 className="text-xs font-mono font-black text-cyan-400 uppercase tracking-widest border-b border-gray-900 pb-2">
    // SECTION TITLE
  </h3>
```

### QUIZ_TIMER_STATE
```typescript
// SOURCE: components/ui/QuizScreen.tsx:227-230
const configuredTimer = classroomSession?.settings?.timerSeconds ?? 30;
const [timeLeft, setTimeLeft] = useState(configuredTimer);
const [totalTime, setTotalTime] = useState(configuredTimer);
const timerRef = useRef<NodeJS.Timeout | null>(null);
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `types/index.ts` | UPDATE | TournamentMatch·TournamentBracket 타입 추가, ClassroomSession 확장 |
| `components/ui/TeacherDashboard/ControlPanels.tsx` | UPDATE | 토너먼트/타임어택/레이드 핸들러 + UI 섹션 |
| `components/ui/TournamentBracketView.tsx` | CREATE | 브래킷 시각화 (교사+학생 공용) |
| `components/StudentLobby.tsx` | UPDATE | status==='tournament' 분기 + TournamentBracketView 렌더링 |

## NOT Building
- Supabase Edge Function 신규 작성 — ClassroomSession broadcast(기존 패턴)로 충분
- 토너먼트 결과 DB 영속화 — localStorage+broadcast 임시 저장
- AI 채점/고급 타임어택 알고리즘 — 단순 선형 속도 보너스
- Phase 6 콘텐츠(카드 아트, 루브릭) — 별도 Phase
- 씬 분리(Phase 4에서 이미 결정: 단일 LobbyScene 유지)

---

## Step-by-Step Tasks

### Task 1: 타입 확장 — TournamentBracket + ClassroomSession
- **ACTION**: `types/index.ts` 에 토너먼트 타입 추가 및 ClassroomSession 확장
- **IMPLEMENT**:
  ```typescript
  // ClassroomSession 바로 위(310번째 줄 부근)에 추가:
  export interface TournamentMatch {
    p1: string;          // 학생 이름
    p2: string;          // 학생 이름 또는 'BYE'
    winner: string | null;
    status: 'pending' | 'fighting' | 'done';
  }

  export interface TournamentRound {
    matches: TournamentMatch[];
  }

  export interface TournamentBracket {
    rounds: TournamentRound[];
    currentRoundIdx: number;
    champion: string | null;
  }

  // ClassroomSession.status에 'tournament' 추가:
  status: 'lobby' | 'playing' | 'ended' | 'tournament'

  // ClassroomSession 필드 추가 (students 바로 위):
  tournament?: TournamentBracket;
  raidBossMaxHp?: number;    // 학생 수 기반 계산값
  timeAttackMode?: boolean;  // 타임어택 속도 보너스 활성화
  ```
- **MIRROR**: CLASSROOM_SESSION_STATUS_EXTENSION
- **IMPORTS**: 없음 (types/index.ts 자체 파일)
- **GOTCHA**: `'tournament'`를 status union에 추가할 때 기존 코드에서 exhaustive switch가 있으면 컴파일 오류 발생 → tsc로 즉시 확인
- **VALIDATE**: `npx tsc --noEmit` 0 errors

### Task 2: ControlPanels — 토너먼트·타임어택·레이드 스케일링
- **ACTION**: `components/ui/TeacherDashboard/ControlPanels.tsx` 에 3개 핸들러 + UI 섹션 추가
- **IMPLEMENT**:

  핸들러 3개 (handleStartRaid 아래에 추가):
  ```typescript
  const handleStartTournament = () => {
    gameAudio.playClick();
    const names = classroomSession.students.map(s => s.name);
    if (names.length < 2) return;
    const shuffled = [...names].sort(() => Math.random() - 0.5);
    const matches: TournamentMatch[] = [];
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      matches.push({ p1: shuffled[i], p2: shuffled[i + 1], winner: null, status: 'pending' });
    }
    if (shuffled.length % 2 === 1) {
      const last = shuffled[shuffled.length - 1];
      matches.push({ p1: last, p2: 'BYE', winner: last, status: 'done' });
    }
    const bracket: TournamentBracket = {
      rounds: [{ matches }],
      currentRoundIdx: 0,
      champion: null,
    };
    setClassroomSession({ ...classroomSession, status: 'tournament', tournament: bracket });
  };

  const handleStopTournament = () => {
    gameAudio.playClick();
    setClassroomSession({ ...classroomSession, status: 'lobby', tournament: undefined });
  };

  const handleToggleTimeAttack = () => {
    gameAudio.playClick();
    setClassroomSession({ ...classroomSession, timeAttackMode: !classroomSession.timeAttackMode });
  };

  // handleStartRaid 수정: HP 자동 계산
  const handleStartRaid = () => {
    gameAudio.playClick();
    const N = classroomSession.students.length || 1;
    const raidBossMaxHp = Math.max(500, N * 150);
    setClassroomSession({ ...classroomSession, status: 'raid' as ClassroomSession['status'], raidBossMaxHp });
  };
  ```

  UI 섹션 — 기존 Raid 섹션 아래 "게임 모드" 섹션 추가:
  ```tsx
  {/* 게임 모드 섹션 */}
  <div className="glass-panel p-5 border-purple-500/10 space-y-4">
    <h3 className="text-xs font-mono font-black text-purple-400 uppercase tracking-widest border-b border-gray-900 pb-2">
      // GAME MODES (게임 모드)
    </h3>
    <div className="space-y-2">
      {/* 타임어택 토글 */}
      <button
        onClick={handleToggleTimeAttack}
        className={`w-full py-2 px-3 rounded-lg text-xs font-mono font-bold border transition-colors ${
          classroomSession.timeAttackMode
            ? 'bg-yellow-950/50 border-yellow-500/60 text-yellow-300'
            : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-yellow-500/40'
        }`}
      >
        ⚡ 타임어택 {classroomSession.timeAttackMode ? 'ON — 속도 보너스 활성' : 'OFF'}
      </button>
      {/* 토너먼트 */}
      {classroomSession.status === 'tournament' ? (
        <Button variant="danger" size="sm" className="w-full" onClick={handleStopTournament}>
          🏆 토너먼트 종료
        </Button>
      ) : (
        <Button
          variant="primary"
          size="sm"
          className="w-full"
          onClick={handleStartTournament}
          disabled={classroomSession.students.length < 2}
        >
          🏆 토너먼트 시작 ({classroomSession.students.length}명 → 브래킷 자동 생성)
        </Button>
      )}
    </div>
  </div>
  ```

- **MIRROR**: CONTROL_PANEL_HANDLER, AUTO_MATCH_SHUFFLE, GLASS_PANEL_UI
- **IMPORTS**: `TournamentMatch, TournamentBracket` from `'../../../types'` 상단 import에 추가
- **GOTCHA**: `status: 'raid'` 타입캐스트(`as ClassroomSession['status']`)는 'tournament' 추가 후 불필요해지지만 기존 코드 건드리지 말고 handleStartRaid만 수정
- **VALIDATE**: `npx tsc --noEmit` 0 errors

### Task 3: TournamentBracketView 컴포넌트 생성
- **ACTION**: `components/ui/TournamentBracketView.tsx` 신규 생성
- **IMPLEMENT**:
  ```tsx
  'use client';

  import React from 'react';
  import { TournamentBracket, TournamentMatch } from '../../types';

  interface TournamentBracketViewProps {
    bracket: TournamentBracket;
    myName?: string;          // 학생 자신의 이름 (하이라이트용)
    onMatchWinner?: (roundIdx: number, matchIdx: number, winner: string) => void; // 교사용
    isTeacher?: boolean;
  }

  function MatchCard({ match, myName, onWinner, isTeacher }: {
    match: TournamentMatch;
    myName?: string;
    onWinner?: (winner: string) => void;
    isTeacher?: boolean;
  }) {
    const isBye = match.p2 === 'BYE';
    const isMyMatch = match.p1 === myName || match.p2 === myName;

    return (
      <div className={`rounded-lg border p-2 text-xs font-mono transition-colors ${
        match.status === 'done'
          ? 'border-emerald-500/40 bg-emerald-950/20'
          : isMyMatch
            ? 'border-cyan-500/60 bg-cyan-950/20 shadow-[0_0_8px_rgba(6,182,212,0.15)]'
            : 'border-gray-700/40 bg-gray-900/30'
      }`}>
        {/* p1 */}
        <div
          className={`flex items-center justify-between py-0.5 px-1 rounded ${
            match.winner === match.p1 ? 'bg-emerald-950/40 text-emerald-300 font-bold' : 'text-gray-300'
          }`}
        >
          <span>{match.p1 === myName ? `⭐ ${match.p1}` : match.p1}</span>
          {isTeacher && match.status === 'fighting' && (
            <button
              onClick={() => onWinner?.(match.p1)}
              className="ml-2 text-[10px] px-1.5 py-0.5 bg-emerald-900/50 border border-emerald-500/40 rounded hover:bg-emerald-800/50"
            >
              승
            </button>
          )}
        </div>
        <div className="text-center text-gray-600 text-[10px] my-0.5">vs</div>
        {/* p2 */}
        <div
          className={`flex items-center justify-between py-0.5 px-1 rounded ${
            isBye
              ? 'text-gray-600 italic'
              : match.winner === match.p2
                ? 'bg-emerald-950/40 text-emerald-300 font-bold'
                : 'text-gray-300'
          }`}
        >
          <span>{isBye ? 'BYE' : match.p2 === myName ? `⭐ ${match.p2}` : match.p2}</span>
          {isTeacher && !isBye && match.status === 'fighting' && (
            <button
              onClick={() => onWinner?.(match.p2)}
              className="ml-2 text-[10px] px-1.5 py-0.5 bg-emerald-900/50 border border-emerald-500/40 rounded hover:bg-emerald-800/50"
            >
              승
            </button>
          )}
        </div>
      </div>
    );
  }

  export default function TournamentBracketView({
    bracket,
    myName,
    onMatchWinner,
    isTeacher = false,
  }: TournamentBracketViewProps) {
    if (!bracket) return null;
    const currentRound = bracket.rounds[bracket.currentRoundIdx];

    return (
      <div className="glass-panel p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-mono font-black text-purple-400 uppercase tracking-widest">
            🏆 토너먼트 브래킷
          </h2>
          {bracket.champion && (
            <span className="text-xs font-mono text-yellow-300 bg-yellow-950/40 border border-yellow-500/30 px-2 py-0.5 rounded-full">
              🥇 우승: {bracket.champion}
            </span>
          )}
        </div>

        <div className="text-[10px] font-mono text-gray-500">
          라운드 {bracket.currentRoundIdx + 1} / {bracket.rounds.length}
        </div>

        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(currentRound.matches.length, 3)}, 1fr)` }}>
          {currentRound.matches.map((match, mIdx) => (
            <MatchCard
              key={mIdx}
              match={match}
              myName={myName}
              isTeacher={isTeacher}
              onWinner={onMatchWinner ? (w) => onMatchWinner(bracket.currentRoundIdx, mIdx, w) : undefined}
            />
          ))}
        </div>

        {!bracket.champion && isTeacher && (
          <p className="text-[10px] font-mono text-gray-600 text-center">
            각 대결에서 승자를 선택하면 다음 라운드가 자동 생성됩니다.
          </p>
        )}
      </div>
    );
  }
  ```
- **MIRROR**: GLASS_PANEL_UI (glass-panel, font-mono, text-xs 패턴)
- **IMPORTS**: `TournamentBracket, TournamentMatch` from `'../../types'`
- **GOTCHA**: `grid-template-columns` 동적 값은 Tailwind JIT가 처리 못 하므로 `style={{ gridTemplateColumns: ... }}` 사용
- **VALIDATE**: `npx tsc --noEmit` 0 errors

### Task 4: StudentLobby — 토너먼트 상태 분기 + 승자 처리
- **ACTION**: `components/StudentLobby.tsx` 에 TournamentBracketView dynamic import + 토너먼트 상태 분기 추가
- **IMPLEMENT**:

  import 추가 (ZoneEntryPanel 아래):
  ```typescript
  const TournamentBracketView = dynamic(() => import('./ui/TournamentBracketView'), { ssr: false });
  ```

  상태 분기 — 기존 `classroomSession?.status === 'playing'` 체크 근처에 추가:
  ```tsx
  {/* 토너먼트 브래킷 오버레이 */}
  {classroomSession?.status === 'tournament' && classroomSession.tournament && (
    <div className="absolute inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <TournamentBracketView
          bracket={classroomSession.tournament}
          myName={studentName}
        />
        <p className="text-center text-xs font-mono text-gray-500 mt-3">
          교사가 대결 결과를 선택하면 다음 라운드로 진행됩니다
        </p>
      </div>
    </div>
  )}
  ```

  ControlPanels(교사)에서 승자 선택 시 다음 라운드 자동 생성 핸들러도 ControlPanels.tsx에 추가:
  ```typescript
  const handleAdvanceTournament = (roundIdx: number, matchIdx: number, winner: string) => {
    if (!classroomSession.tournament) return;
    gameAudio.playClick();
    const bracket = classroomSession.tournament;
    const updatedRounds = bracket.rounds.map((r, ri) =>
      ri !== roundIdx ? r : {
        matches: r.matches.map((m, mi) =>
          mi !== matchIdx ? m : { ...m, winner, status: 'done' as const }
        )
      }
    );
    const currentRound = updatedRounds[roundIdx];
    const allDone = currentRound.matches.every(m => m.status === 'done');

    if (allDone) {
      const winners = currentRound.matches
        .map(m => m.winner)
        .filter((w): w is string => w !== null && w !== 'BYE');
      if (winners.length === 1) {
        // 우승자 확정
        setClassroomSession({
          ...classroomSession,
          tournament: { ...bracket, rounds: updatedRounds, champion: winners[0] },
        });
      } else {
        // 다음 라운드 생성
        const nextMatches: TournamentMatch[] = [];
        for (let i = 0; i < winners.length - 1; i += 2) {
          nextMatches.push({ p1: winners[i], p2: winners[i + 1], winner: null, status: 'pending' });
        }
        if (winners.length % 2 === 1) {
          const last = winners[winners.length - 1];
          nextMatches.push({ p1: last, p2: 'BYE', winner: last, status: 'done' });
        }
        setClassroomSession({
          ...classroomSession,
          tournament: {
            rounds: [...updatedRounds, { matches: nextMatches }],
            currentRoundIdx: roundIdx + 1,
            champion: null,
          },
        });
      }
    } else {
      setClassroomSession({ ...classroomSession, tournament: { ...bracket, rounds: updatedRounds } });
    }
  };
  ```

  TeacherDashboard/ControlPanels.tsx의 TournamentBracketView 렌더링 (토너먼트 섹션 안):
  ```tsx
  {classroomSession.status === 'tournament' && classroomSession.tournament && (
    <TournamentBracketView
      bracket={classroomSession.tournament}
      isTeacher
      onMatchWinner={handleAdvanceTournament}
    />
  )}
  ```

  TournamentBracketView를 ControlPanels.tsx에서도 사용하므로 dynamic이 아닌 일반 import 사용 (SSR 없는 컴포넌트 내부이므로):
  ```typescript
  import TournamentBracketView from '../TournamentBracketView';
  ```

- **MIRROR**: DYNAMIC_IMPORT_PATTERN, GLASS_PANEL_UI
- **IMPORTS**:
  - StudentLobby: `const TournamentBracketView = dynamic(() => import('./ui/TournamentBracketView'), { ssr: false })`
  - ControlPanels: `import TournamentBracketView from '../TournamentBracketView'`, `import { TournamentMatch, TournamentBracket } from '../../../types'`
- **GOTCHA**: ControlPanels는 `'use client'` 파일이므로 일반 import 가능. StudentLobby는 기존 패턴대로 dynamic import 사용
- **VALIDATE**: `npx tsc --noEmit` 0 errors → `npx next build` 성공

---

## Testing Strategy

### Unit Tests
이 프로젝트는 테스트 파일이 없으므로 Manual Validation으로 대체 (기존 Phase 패턴 동일).

### Edge Cases Checklist
- [ ] 학생 1명일 때 토너먼트 시작 버튼 disabled (2명 미만 조건)
- [ ] 홀수 학생 → BYE 자동 처리 (마지막 학생 자동 진출)
- [ ] 우승자가 단 1명 남았을 때 `champion` 표시
- [ ] 레이드 학생 0명 → `Math.max(500, 0 * 150) = 500` (최솟값 보장)
- [ ] status='tournament'에서 퀴즈 시작 시 기존 quiz 로직 충돌 없음

---

## Validation Commands

### Static Analysis
```bash
cd "C:/Users/user/Desktop/Test/Hopeducks-Test"
npx tsc --noEmit
```
EXPECT: Zero type errors

### Build Check
```bash
npx next build
```
EXPECT: Static export 성공, 0 errors

### Manual Validation
- [ ] 교사 대시보드 → 게임 모드 섹션 표시 확인
- [ ] 학생 2명 이상 → 토너먼트 시작 버튼 활성화
- [ ] 토너먼트 시작 → 학생 화면에 브래킷 오버레이 표시
- [ ] 교사에서 승자 선택 → 다음 라운드 자동 생성
- [ ] 마지막 1명 남으면 우승자 배너 표시
- [ ] 레이드 시작 → `raidBossMaxHp` 가 session에 저장됨 (콘솔 확인)
- [ ] 타임어택 토글 → ON/OFF 상태 반영

---

## Acceptance Criteria
- [ ] 토너먼트 브래킷이 자동 생성되고 학생·교사 화면에 표시
- [ ] 승자 선택 → 다음 라운드 자동 생성 → 우승자 확정
- [ ] 레이드 HP = `max(500, N × 150)` 자동 계산 (session에 저장)
- [ ] 타임어택 토글 UI 표시
- [ ] `npx tsc --noEmit` 0 errors
- [ ] `npx next build` 성공

## Completion Checklist
- [ ] 기존 ClassroomSession 상태 패턴 유지 (불변 복사 {...session, ...})
- [ ] dynamic import 패턴 사용 (StudentLobby)
- [ ] glass-panel + font-mono 디자인 토큰 유지
- [ ] 타입 가드 없이도 `bracket.rounds[idx]` 접근 안전하게 (옵셔널 체이닝 활용)

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| 'tournament' status 추가로 기존 switch문 컴파일 오류 | M | M | tsc로 즉시 확인, never 타입 처리 |
| ControlPanels에서 TournamentBracketView 직접 import 시 SSR 오류 | L | M | ControlPanels는 'use client' 이므로 SSR 없음, 문제없음 |
| 학생 0명 시 토너먼트 버튼 클릭 | L | L | `names.length < 2` 조건으로 early return |

## Notes
- 타임어택 속도 보너스는 이번 Phase에서 토글 UI만 추가. QuizScreen 채점 로직(`timeLeft`, `totalTime` 활용)은 별도로 Phase 6에서 고도화 가능 — 현재는 `timeAttackMode` 플래그만 ClassroomSession에 저장
- RaidScene의 `bossMaxHp` 는 `react:raidStart` 이벤트 브리지로 전달하는 대신 ClassroomSession의 `raidBossMaxHp` 필드에 저장. 실제 RaidScene 반영은 ControlPanels가 세션을 broadcast하면 StudentLobby가 `onStartRaid` 호출 시 전달 가능 — 이번 Phase 스코프 내에서는 교사 대시보드 UI/계산 로직만 완성
- 이 Phase는 4파일, Medium 복잡도. Phase 4와 동일한 접근법
