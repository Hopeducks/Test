# Plan: Phase 4 — 맵 유니버스 (Map Universe)

## Summary
LobbyScene의 8개 퀴즈 포탈을 단원별 테마 색상·라벨로 시각화하고, 포탈 진입 시 단원 정보·퀴즈 시작·NPC 대화 버튼을 보여주는 ZoneEntryPanel 오버레이를 추가한다. PRD의 "씬 분리"는 Phaser 멀티씬 분리가 아닌 **단원별 시각 테마 구분**으로 구현 — 씬 분리는 메모리 누수 위험(PRD 리스크 표) 때문에 제외.

## User Story
As a 학생, I want 맵에서 단원별로 구분된 포탈을 발견하고, 포탈에 들어서면 단원 정보와 퀴즈·NPC 대화 옵션을 볼 수 있어야 한다, so that 탐험이 단순 이동이 아닌 의미 있는 학습 여정이 된다.

## Problem → Solution
현재: 8개 퀴즈 포탈이 모두 동일한 amber 색, "1단원"~"8단원" 레이블만 존재, 포탈 진입 즉시 퀴즈 화면으로 전환됨.
목표: 단원별 고유 색상+테마명, 진입 시 ZoneEntryPanel 슬라이드인(퀴즈 시작 / NPC 대화 / 닫기 선택).

## Metadata
- **Complexity**: Medium
- **Source PRD**: `.claude/PRPs/prds/science-master-metaverse-overhaul.prd.md`
- **PRD Phase**: Phase 4 — 맵 유니버스
- **Estimated Files**: 3

---

## UX Design

### Before
```
퀴즈 존 (북)  — 모든 포탈이 동일한 amber 색
[●] [●] [●] [●] [●] [●] [●] [●]
1단원 2단원 3단원 4단원 5단원 6단원 7단원 8단원
포탈 진입 → 즉시 QuizScreen 전환
```

### After
```
퀴즈 존 (북)  — 각 포탈이 단원 테마 색
[●] [●] [●] [●] [●] [●] [●] [●]
brown  yellow  cyan  red  green  sky  orange  purple
지층  빛    용액   몸  생태  날씨  속력  산염기

포탈 진입 → ZoneEntryPanel 슬라이드인
┌─────────────────────────────────┐
│ 🪨 1단원 — 지층과 화석           │
│ 지층, 퇴적암, 화석의 세계         │
│                                 │
│ [퀴즈 시작]  [NPC 대화]  [닫기]  │
└─────────────────────────────────┘
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| 포탈 진입 | 즉시 QuizScreen | ZoneEntryPanel 표시 | 중간 선택 단계 추가 |
| NPC 대화 | NPC 클릭 필요 | 패널에서도 가능 | 편의성 향상 |
| 포탈 색상 | 모두 amber | 단원별 고유 색 | 시각적 구분 |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `game/scenes/LobbyScene.ts` | 580-660 | 퀴즈 포탈 생성 루프 — 수정 대상 |
| P0 | `components/StudentLobby.tsx` | all | `phaser:zoneEntered` 이벤트 핸들러 확인 필수 |
| P1 | `components/ui/NpcQuestModal.tsx` | 1-30 | NPC_QUESTS 키명 확인 (npcName match 방식) |
| P1 | `components/ui/design-system/Button.tsx` | all | Button 컴포넌트 패턴 |
| P2 | `app/globals.css` | 1-60 | glass-panel, CSS 변수 확인 |

---

## Patterns to Mirror

### PHASER_CUSTOM_EVENT
```typescript
// SOURCE: game/scenes/LobbyScene.ts:953-965
private dispatchPositionUpdate(): void {
  const event = new CustomEvent('phaser:positionUpdate', {
    detail: { playerId: this.playerId, x: this.playerContainer.x, ... }
  });
  window.dispatchEvent(event);
}
```
→ Phaser→React 이벤트는 `window.dispatchEvent(new CustomEvent(...))` 패턴 사용.

### REACT_WINDOW_LISTENER
```typescript
// SOURCE: game/scenes/LobbyScene.ts:683-735 (참고 패턴)
const presenceListener = (e: Event) => { ... };
window.addEventListener('react:presenceUpdate', presenceListener);
this.events.once('shutdown', () => {
  window.removeEventListener('react:presenceUpdate', presenceListener);
});
```
→ StudentLobby의 `phaser:zoneEntered` 리스너도 이 패턴 사용. useEffect cleanup 필수.

### GLASS_PANEL_MODAL
```typescript
// SOURCE: components/ui/NpcQuestModal.tsx:216-218
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
  <div className="glass-panel w-full max-w-2xl p-6 border-cyan-500/30 bg-gradient-to-b from-[#091122] to-[#040811] text-gray-100 shadow-2xl">
```
→ 모달/패널은 이 구조를 따름.

### UNIT_THEMES_ARRAY (NEW — to define in LobbyScene)
```typescript
// Defined at top of LobbyScene.ts, before class
const UNIT_THEMES: { color: number; name: string; emoji: string }[] = [
  { color: 0xb5651d, name: '지층과 화석',     emoji: '🪨' },
  { color: 0xfde047, name: '빛과 렌즈',       emoji: '🔭' },
  { color: 0x06b6d4, name: '용액의 성질',     emoji: '🧪' },
  { color: 0xef4444, name: '우리 몸',         emoji: '❤️' },
  { color: 0x22c55e, name: '생태계와 환경',   emoji: '🌿' },
  { color: 0x7dd3fc, name: '날씨와 우리 생활', emoji: '🌤️' },
  { color: 0xf97316, name: '물체의 속력',     emoji: '💨' },
  { color: 0xa855f7, name: '산과 염기',       emoji: '⚗️' },
];
```

### NPC_NAME_MATCH (StudentLobby/ZoneEntryPanel 연결용)
```typescript
// SOURCE: components/ui/NpcQuestModal.tsx:24-105
// NPC_QUESTS 키는 성(성만): '갈릴레이', '뉴턴', '파스퇴르', '나이팅게일', '다윈', '베게너', '아인슈타인', '퀴리 부인'
// unitId 1→8 순서와 일치
const NPC_NAMES_BY_UNIT: Record<number, string> = {
  1: '갈릴레이', 2: '뉴턴', 3: '파스퇴르', 4: '나이팅게일',
  5: '다윈', 6: '베게너', 7: '아인슈타인', 8: '퀴리 부인'
};
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `game/scenes/LobbyScene.ts` | UPDATE | 포탈 생성 루프에 UNIT_THEMES 적용, 색상·단원명 추가 |
| `components/ui/ZoneEntryPanel.tsx` | CREATE | 포탈 진입 시 표시할 단원 정보 오버레이 컴포넌트 |
| `components/StudentLobby.tsx` | UPDATE | `phaser:zoneEntered` 핸들러 수정 → ZoneEntryPanel 표시로 변경 |

## NOT Building
- Phaser 멀티씬 분리 (메모리 누수 위험, PRD 리스크 표 참조)
- 새 맵 레이아웃/타일 재설계
- NpcQuestModal 내용 수정
- 단원 진행도 잠금/해금 시스템
- 존별 배경음악/사운드 변경

---

## Step-by-Step Tasks

### Task 1: UNIT_THEMES 상수 추가 및 포탈 루프 수정 (LobbyScene.ts)

- **ACTION**: LobbyScene.ts 상단(SCIENTIST_TRIVIA 배열 직전)에 `UNIT_THEMES` 배열 추가. 퀴즈 포탈 생성 루프(for i < 8)에서 `0xf59e0b` 대신 `UNIT_THEMES[i].color` 사용.
- **IMPLEMENT**:
  1. `SCIENTIST_TRIVIA` 배열 바로 위(line ~286)에 `UNIT_THEMES` 배열 삽입
  2. 퀴즈 포탈 루프(line ~595)에서:
     - `const theme = UNIT_THEMES[i];` 로 테마 가져오기
     - `qRing.setStrokeStyle(1.5, theme.color, 0.8)` — 균일 amber → 테마 색
     - `qSpinner.setStrokeStyle(2, theme.color, 0.6)` — 동일
     - `zoneGraphics.fillStyle(theme.color, 0.1)` 및 `.lineStyle(2, theme.color, 0.9)` — 동일
     - `qCore` circle: `this.add.circle(cx, cy, 6, theme.color, 0.8)`
     - 레이블 텍스트: `${i + 1}단원` → `${i + 1}단원 ${theme.name}` 으로 확장  
       (단, 기존 레이블 y 위치 cy-22 유지, 색상도 `theme.color`를 hex로 변환)
     - 레이블 색상: `'#f59e0b'` → `'#' + theme.color.toString(16).padStart(6, '0')`
  3. `phaser:zoneEntered` 이벤트 payload에 `themeName`, `themeEmoji` 추가:
     ```typescript
     window.dispatchEvent(new CustomEvent('phaser:zoneEntered', {
       detail: { zone: mappedZone, unitId: currentOverlapPortal.unitId,
                 themeName: UNIT_THEMES[(currentOverlapPortal.unitId ?? 1) - 1]?.name,
                 themeEmoji: UNIT_THEMES[(currentOverlapPortal.unitId ?? 1) - 1]?.emoji }
     }));
     ```
- **MIRROR**: UNIT_THEMES_ARRAY, PHASER_CUSTOM_EVENT
- **IMPORTS**: 없음 (LobbyScene 자체에서만 사용)
- **GOTCHA**: `theme.color.toString(16).padStart(6, '0')` — `0xfde047` 같은 색은 6자리. `padStart(6, '0')` 필수.
- **VALIDATE**: `npx tsc --noEmit` 통과. Phaser 루프 8개 포탈 각각 다른 색 렌더링.

---

### Task 2: ZoneEntryPanel.tsx 생성

- **ACTION**: `components/ui/ZoneEntryPanel.tsx` 신규 생성.
- **IMPLEMENT**:
  ```typescript
  'use client';
  
  import React from 'react';
  import { gameAudio } from '../../lib/audio';
  import { X, PlayCircle, MessageCircle } from 'lucide-react';
  
  const UNIT_DESCRIPTIONS: Record<number, string> = {
    1: '지층, 퇴적암, 화석의 생성 과정을 탐험해 보세요.',
    2: '빛의 직진, 반사, 굴절, 볼록렌즈의 원리를 학습합니다.',
    3: '용해, 용질, 용매의 개념과 용액의 성질을 연구합니다.',
    4: '우리 몸의 소화·호흡·순환·배설 기관의 구조와 기능.',
    5: '생태계 구성 요소, 먹이 그물, 환경과 생물의 관계.',
    6: '기온, 습도, 바람, 구름, 비 등 날씨 현상을 관측합니다.',
    7: '속력의 의미와 단위, 빠르기 비교 방법을 배웁니다.',
    8: '산과 염기의 성질, 지시약, 중화 반응을 실험합니다.',
  };
  
  const UNIT_THEME_COLORS: Record<number, string> = {
    1: '#b5651d', 2: '#fde047', 3: '#06b6d4', 4: '#ef4444',
    5: '#22c55e', 6: '#7dd3fc', 7: '#f97316', 8: '#a855f7',
  };
  
  interface ZoneEntryPanelProps {
    unitId: number;
    themeName: string;
    themeEmoji: string;
    onStartQuiz: () => void;
    onOpenNpc: () => void;
    onClose: () => void;
  }
  
  export default function ZoneEntryPanel({ unitId, themeName, themeEmoji, onStartQuiz, onOpenNpc, onClose }: ZoneEntryPanelProps) {
    const color = UNIT_THEME_COLORS[unitId] ?? '#06b6d4';
    const description = UNIT_DESCRIPTIONS[unitId] ?? '';
  
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="glass-panel w-full max-w-md p-6 text-gray-100 shadow-2xl relative animate-slide-up"
             style={{ borderColor: `${color}40` }}>
  
          {/* Close */}
          <button onClick={() => { gameAudio.playClick(); onClose(); }}
                  className="absolute top-4 right-4 p-1 rounded hover:text-white text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
  
          {/* Zone Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl shrink-0"
                 style={{ backgroundColor: `${color}20`, border: `2px solid ${color}60` }}>
              {themeEmoji}
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-widest" style={{ color }}>
                UNIT {unitId} ZONE
              </p>
              <h2 className="text-lg font-black text-gray-100">{themeName}</h2>
            </div>
          </div>
  
          {/* Description */}
          <p className="text-sm text-gray-400 leading-relaxed mb-6 font-sans">{description}</p>
  
          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button onClick={() => { gameAudio.playCorrect(); onStartQuiz(); }}
                    className="w-full py-3 rounded-xl font-black text-black transition-all flex items-center justify-center gap-2 hover:brightness-110"
                    style={{ backgroundColor: color }}>
              <PlayCircle className="w-5 h-5" />
              퀴즈 시작
            </button>
            <button onClick={() => { gameAudio.playClick(); onOpenNpc(); }}
                    className="w-full py-3 rounded-xl font-bold border transition-all flex items-center justify-center gap-2 text-gray-300 hover:text-white"
                    style={{ borderColor: `${color}40` }}>
              <MessageCircle className="w-5 h-5" />
              NPC 대화 (서술형 퀘스트)
            </button>
          </div>
        </div>
      </div>
    );
  }
  ```
- **MIRROR**: GLASS_PANEL_MODAL, NPC_NAME_MATCH
- **IMPORTS**: lucide-react `X, PlayCircle, MessageCircle`, `../../lib/audio`
- **GOTCHA**: `style={{ borderColor: ... }}` — inline style로 동적 색상. Tailwind JIT는 동적 hex 미지원이므로 inline style 필수.
- **VALIDATE**: `npx tsc --noEmit` 통과.

---

### Task 3: StudentLobby.tsx — ZoneEntryPanel + NpcQuestModal 연동

- **ACTION**: `components/StudentLobby.tsx`를 읽어 `phaser:zoneEntered` 핸들러를 확인한 후, 기존 즉시-quiz-전환 로직을 ZoneEntryPanel 표시로 교체.
- **IMPLEMENT**: (StudentLobby.tsx를 먼저 읽어 정확한 핸들러 위치 확인)
  1. state 추가:
     ```typescript
     const [zoneEntry, setZoneEntry] = useState<{
       unitId: number; themeName: string; themeEmoji: string;
     } | null>(null);
     const [npcQuestTarget, setNpcQuestTarget] = useState<string | null>(null);
     ```
  2. `phaser:zoneEntered` 핸들러에서 zone === 'quiz' 분기:
     - 기존: `onStartQuiz(detail.unitId)` 직접 호출
     - 변경: `setZoneEntry({ unitId: detail.unitId, themeName: detail.themeName ?? '', themeEmoji: detail.themeEmoji ?? '📚' })`
  3. NPC 이름 매핑:
     ```typescript
     const NPC_NAMES: Record<number, string> = {
       1: '갈릴레이', 2: '뉴턴', 3: '파스퇴르', 4: '나이팅게일',
       5: '다윈', 6: '베게너', 7: '아인슈타인', 8: '퀴리 부인'
     };
     ```
  4. JSX에 ZoneEntryPanel + NpcQuestModal 조건부 렌더링 추가:
     ```tsx
     {zoneEntry && (
       <ZoneEntryPanel
         unitId={zoneEntry.unitId}
         themeName={zoneEntry.themeName}
         themeEmoji={zoneEntry.themeEmoji}
         onStartQuiz={() => { setZoneEntry(null); onStartQuiz(zoneEntry.unitId); }}
         onOpenNpc={() => { setNpcQuestTarget(NPC_NAMES[zoneEntry.unitId] ?? '갈릴레이'); setZoneEntry(null); }}
         onClose={() => setZoneEntry(null)}
       />
     )}
     {npcQuestTarget && (
       <NpcQuestModal npcName={npcQuestTarget} onClose={() => setNpcQuestTarget(null)} />
     )}
     ```
- **MIRROR**: REACT_WINDOW_LISTENER, NPC_NAME_MATCH
- **IMPORTS**: `ZoneEntryPanel from './ui/ZoneEntryPanel'`, `NpcQuestModal from './ui/NpcQuestModal'`
- **GOTCHA**: `NpcQuestModal`이 StudentLobby.tsx에 이미 import되어 있을 수 있음 — 중복 import 주의. StudentLobby.tsx를 읽어 확인 후 import 추가.
- **VALIDATE**: `npx tsc --noEmit` 통과.

---

## Testing Strategy

### Unit Tests
해당 단계에서 자동화 테스트 파일 없음(Phaser/브라우저 이벤트 의존). 수동 검증으로 대체.

### Manual Validation Checklist
- [ ] 맵 로드 후 퀴즈 존 북쪽에 8개 포탈이 각각 다른 색상으로 표시됨
- [ ] 각 포탈 레이블에 단원명이 표시됨 (예: "1단원 지층과 화석")
- [ ] 플레이어가 포탈에 진입 시 ZoneEntryPanel이 슬라이드인됨
- [ ] ZoneEntryPanel의 테마 색상이 포탈 색상과 일치함
- [ ] "퀴즈 시작" 클릭 → QuizScreen으로 전환됨
- [ ] "NPC 대화" 클릭 → NpcQuestModal이 해당 단원 NPC로 열림
- [ ] "닫기" 클릭 → 패널 닫히고 맵 복귀
- [ ] `npx tsc --noEmit` 0 errors
- [ ] `npx next build` 성공

---

## Validation Commands

### Static Analysis
```bash
npx tsc --noEmit
```
EXPECT: Zero type errors

### Build
```bash
npx next build
```
EXPECT: Static export 성공

---

## Acceptance Criteria
- [ ] 8개 포탈이 단원별 고유 색상으로 렌더링됨
- [ ] 포탈 레이블에 단원명 표시
- [ ] ZoneEntryPanel이 포탈 진입 시 표시됨
- [ ] 퀴즈 시작 / NPC 대화 / 닫기 3가지 액션 모두 동작
- [ ] tsc 0 errors, next build 성공
- [ ] 기존 비-퀴즈 존(배틀, 레이드, 박물관 등) 진입 동작 무변경

## Completion Checklist
- [ ] UNIT_THEMES 상수 정의 완료
- [ ] 포탈 루프 색상/레이블 수정 완료
- [ ] phaser:zoneEntered payload에 themeName/themeEmoji 추가
- [ ] ZoneEntryPanel.tsx 생성 완료 (~70줄 이내)
- [ ] StudentLobby.tsx state + 핸들러 + JSX 수정 완료
- [ ] tsc 통과
- [ ] build 통과

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| StudentLobby.tsx 핸들러 구조 예상과 다름 | M | M | Task 3 시작 전 반드시 파일 전체 읽기 |
| NpcQuestModal 이미 StudentLobby에 import 중 | L | L | 중복 방지 — 읽고 확인 |
| `theme.color.toString(16)` 6자리 미만 | M | L | `.padStart(6, '0')` 필수 |
| ZoneEntryPanel 애니메이션 클래스 미존재 | L | L | `animate-slide-up`이 globals.css에 있는지 확인; 없으면 `transition-all` 단순 대체 |

## Notes
- PRD의 "Phaser 씬 분리"는 실용적 위험 때문에 단원별 시각 테마 구분으로 재해석
- ZoneEntryPanel은 모바일에서 하단 sheet로 표시 (`items-end sm:items-center`)
- 비-퀴즈 존 진입 로직(배틀, 레이드, 박물관, 센터, 체육관)은 변경 없음
- 기존 NPC 클릭 → `react:openNpcQuest` 이벤트 flow는 유지
