# Plan: Phase 6 — 콘텐츠 품질 (카드 아트·루브릭·문제 커버리지)

## Summary
80장 카드를 이모지에서 단원·희귀도별 CSS/SVG 아트로 업그레이드하고, 8단원 × 3단계 루브릭 정적 데이터를 신규 작성한다.
교사 대시보드에 루브릭 패널을 추가하고, PokedexGrid가 새 CardArt 컴포넌트를 사용하도록 교체한다.
"문제 교육학적 검수"는 코드 수준에서 단원별 문제 타입 커버리지를 검증하는 유틸리티로 구현한다.

## User Story
As a 교사, I want 카드 수집이 시각적으로 풍부하고 루브릭으로 학생 수준을 판단할 수 있어야 하며, 학생은 희귀 카드를 얻었을 때 이모지와 구분되는 고품질 카드 아트를 볼 수 있어야 한다.

## Problem → Solution
- 80장 카드 모두 이모지만 표시 → 단원 테마 색상 + 희귀도 그라데이션 CSS/SVG 아트로 교체
- 루브릭 데이터 없음 → `data/rubrics.ts` 정적 파일 (8단원 × 3단계)
- 교사 대시보드에 루브릭 뷰 없음 → `TeacherDashboard/RubricPanel.tsx` 추가

## Metadata
- **Complexity**: Medium
- **Source PRD**: `.claude/PRPs/prds/science-master-metaverse-overhaul.prd.md`
- **PRD Phase**: Phase 6 — 콘텐츠 품질
- **Estimated Files**: 4 (3 created, 1 updated)

---

## UX Design

### Before
```
PokedexGrid 카드:
┌──────────────┐
│      🦖      │  ← 이모지 하나로 모든 카드 표현
│  프테라      │
│ [legendary]  │
└──────────────┘
```

### After
```
PokedexGrid 카드 (CardArt):
┌──────────────┐
│ ███████████  │  ← 단원 테마 그라데이션 배경
│ ░░ 🦖 ░░░  │    (Unit 1 = amber/stone)
│ ✦ LEGENDARY  │  ← 희귀도 글로우 + 별 장식
│   프테라     │
└──────────────┘

교사 대시보드 — 루브릭 탭:
┌──────────────────────────────┐
│ 1단원 지층과 화석 루브릭      │
│ ● 이해: 지층 생성 설명 가능   │
│ ◎ 적용: 퇴적암 분류 가능      │
│ ★ 심화: 화석 형성 조건 추론   │
└──────────────────────────────┘
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| PokedexGrid 카드 이미지 | 이모지 텍스트 | CardArt CSS/SVG | 이모지도 유지, 배경 아트 추가 |
| 교사 대시보드 | 루브릭 없음 | RubricPanel 탭 | StatsPanel 옆에 추가 |
| CardBattleArena 카드 | 이모지 | 이모지 유지 (전투 중 작은 아이콘) | 전투 UI는 빠른 판독 우선 |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `data/cards.ts` | 1-100 | 카드 구조 (id, unitId, rarity, image, name, description) |
| P0 | `components/PokedexGrid.tsx` | 1-50 | 카드 렌더링 현황 — CardArt 교체 대상 |
| P1 | `components/ui/TeacherDashboard/StatsPanel.tsx` | all | 대시보드 패널 패턴 미러 대상 |
| P1 | `components/ui/TeacherDashboard/index.tsx` | all | RubricPanel 연결 위치 |
| P2 | `types/index.ts` | 132-145 | Card·CardRarity 타입 확인 |

## External Documentation
없음 — 순수 CSS/SVG + 정적 데이터, 외부 라이브러리 없음.

---

## Patterns to Mirror

### CARD_RARITY_SYSTEM
```typescript
// SOURCE: types/index.ts:133
export type CardRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
```

### UNIT_THEME_COLORS (Phase 4에서 확립된 패턴)
```typescript
// SOURCE: game/scenes/LobbyScene.ts (UNIT_THEMES 상수)
const UNIT_THEMES = [
  { color: 0xb5651d, name: '지층과 화석',      emoji: '🪨' },  // amber/stone
  { color: 0xfde047, name: '빛과 렌즈',        emoji: '🔭' },  // yellow
  { color: 0x06b6d4, name: '용액의 성질',      emoji: '🧪' },  // cyan
  { color: 0xef4444, name: '우리 몸',          emoji: '❤️'  },  // red
  { color: 0x22c55e, name: '생태계와 환경',    emoji: '🌿' },  // green
  { color: 0x7dd3fc, name: '날씨와 우리 생활', emoji: '🌤️' },  // sky
  { color: 0xf97316, name: '물체의 속력',      emoji: '💨' },  // orange
  { color: 0xa855f7, name: '산과 염기',        emoji: '⚗️' },  // purple
];
// CSS hex 변환: '#' + color.toString(16).padStart(6, '0')
```

### GLASS_PANEL_PATTERN
```tsx
// SOURCE: components/ui/TeacherDashboard/ControlPanels.tsx:163
<div className="glass-panel p-5 border-cyan-500/10 space-y-4">
  <h3 className="text-xs font-mono font-black text-cyan-400 uppercase tracking-widest border-b border-gray-900 pb-2">
    // SECTION TITLE
  </h3>
```

### INLINE_STYLE_DYNAMIC_COLOR
```tsx
// SOURCE: components/ui/ZoneEntryPanel.tsx (Phase 4)
// Tailwind JIT는 동적 hex를 처리 못 함 → inline style 사용
style={{ backgroundColor: theme.color, borderColor: `${theme.color}40` }}
```

### DASHBOARD_PANEL_PATTERN
```tsx
// SOURCE: components/ui/TeacherDashboard/StatsPanel.tsx (참조)
// export default function StatsPanel({ classroomSession, ... })
// glass-panel p-4 space-y-3 구조
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `data/rubrics.ts` | CREATE | 8단원 × 3단계 루브릭 정적 데이터 |
| `components/ui/CardArt.tsx` | CREATE | CSS/SVG 카드 아트 컴포넌트 (희귀도 + 단원 테마) |
| `components/ui/TeacherDashboard/RubricPanel.tsx` | CREATE | 교사 대시보드 루브릭 뷰 |
| `components/ui/TeacherDashboard/index.tsx` | UPDATE | RubricPanel 탭 연결 |

## NOT Building
- CardBattleArena 카드 이미지 교체 — 전투 중 빠른 판독이 우선, 이모지 유지
- 자동 교육학적 검수 AI — 스코프 외 (PRD: "수동 큐레이션 품질 유지")
- 신규 문제 추가 — 기존 320문항으로 충분
- 카드 이미지 필드 타입 변경 — `image: string` 유지 (하위 호환)
- PokedexGrid 대규모 리팩터 — CardArt 컴포넌트만 교체, 나머지 유지

---

## Step-by-Step Tasks

### Task 1: data/rubrics.ts — 8단원 루브릭 정적 데이터
- **ACTION**: `data/rubrics.ts` 신규 생성
- **IMPLEMENT**:
  ```typescript
  export interface RubricLevel {
    level: 1 | 2 | 3;
    label: '이해' | '적용' | '심화';
    labelEmoji: string;
    description: string;         // 교사가 확인하는 체크포인트
    exampleAnswer?: string;      // 예시 학생 답변
  }

  export interface UnitRubric {
    unitId: number;
    unitName: string;
    levels: [RubricLevel, RubricLevel, RubricLevel];  // 항상 3단계
  }

  export const rubrics: UnitRubric[] = [
    {
      unitId: 1,
      unitName: '지층과 화석',
      levels: [
        {
          level: 1, label: '이해', labelEmoji: '📖',
          description: '지층 생성 순서와 퇴적암 종류(사암·이암·역암)를 나열할 수 있다.',
          exampleAnswer: '아래 지층이 먼저 쌓입니다. 사암, 이암, 역암이 있습니다.'
        },
        {
          level: 2, label: '적용', labelEmoji: '🔬',
          description: '지층 단면 그림을 보고 생성 순서를 판단하고, 화석이 남겨진 암석 종류를 설명할 수 있다.',
          exampleAnswer: '이 지층은 C→B→A 순서로 쌓였고, 화석은 퇴적암에서 발견됩니다.'
        },
        {
          level: 3, label: '심화', labelEmoji: '🌟',
          description: '표준화석과 시상화석의 차이를 구분하고, 화석을 통해 과거 환경을 추론할 수 있다.',
          exampleAnswer: '삼엽충은 표준화석으로 지층의 나이를 알 수 있고, 산호는 시상화석으로 과거 기후를 알 수 있습니다.'
        },
      ]
    },
    {
      unitId: 2,
      unitName: '빛과 렌즈',
      levels: [
        {
          level: 1, label: '이해', labelEmoji: '📖',
          description: '빛의 직진·반사·굴절 개념을 정의하고, 볼록렌즈와 오목렌즈를 구분할 수 있다.',
          exampleAnswer: '빛은 직진하고, 거울에서 반사되며, 물에서 굴절됩니다.'
        },
        {
          level: 2, label: '적용', labelEmoji: '🔬',
          description: '볼록렌즈를 이용한 상(실상·허상)을 그림으로 설명하고, 굴절각과 입사각 관계를 설명할 수 있다.',
          exampleAnswer: '볼록렌즈의 초점 너머에 물체가 있으면 실상이, 안쪽이면 허상이 생깁니다.'
        },
        {
          level: 3, label: '심화', labelEmoji: '🌟',
          description: '망원경·현미경 원리를 볼록렌즈 조합으로 설명하고, 실생활 광학 기기에 적용할 수 있다.',
          exampleAnswer: '망원경은 대물렌즈로 실상을 맺고 접안렌즈로 확대하여 봅니다.'
        },
      ]
    },
    {
      unitId: 3,
      unitName: '용액의 성질',
      levels: [
        {
          level: 1, label: '이해', labelEmoji: '📖',
          description: '용해·용질·용매·용액 용어를 정의하고, 용액의 진하기를 비교하는 방법을 설명할 수 있다.',
          exampleAnswer: '소금이 용질, 물이 용매, 소금물이 용액입니다.'
        },
        {
          level: 2, label: '적용', labelEmoji: '🔬',
          description: '색깔 비교, 증발, 메스실린더를 이용해 용액의 진하기를 측정하고 비교할 수 있다.',
          exampleAnswer: '같은 양의 물에 용질이 많을수록 진한 용액입니다.'
        },
        {
          level: 3, label: '심화', labelEmoji: '🌟',
          description: '용해도 그래프를 해석하고, 혼합물 분리 방법(증발·거름·분별결정)을 상황에 맞게 선택할 수 있다.',
          exampleAnswer: '온도가 높을수록 용해도가 커지므로, 냉각하면 과포화 상태가 됩니다.'
        },
      ]
    },
    {
      unitId: 4,
      unitName: '우리 몸',
      levels: [
        {
          level: 1, label: '이해', labelEmoji: '📖',
          description: '소화·호흡·순환·배설 기관의 이름과 기본 기능을 나열할 수 있다.',
          exampleAnswer: '위에서 음식을 소화하고, 폐에서 산소를 흡수합니다.'
        },
        {
          level: 2, label: '적용', labelEmoji: '🔬',
          description: '각 기관이 협력하는 과정을 순서대로 설명하고, 기관 이상 시 나타나는 증상을 연결할 수 있다.',
          exampleAnswer: '음식 → 식도 → 위 → 소장 → 대장 → 항문 순서로 이동합니다.'
        },
        {
          level: 3, label: '심화', labelEmoji: '🌟',
          description: '운동 시 호흡과 순환 기관의 변화를 설명하고, 건강한 생활습관과 기관 기능의 관계를 추론할 수 있다.',
          exampleAnswer: '운동 시 근육에 산소가 더 필요하므로 심박수와 호흡수가 증가합니다.'
        },
      ]
    },
    {
      unitId: 5,
      unitName: '생태계와 환경',
      levels: [
        {
          level: 1, label: '이해', labelEmoji: '📖',
          description: '생태계 구성 요소(생산자·소비자·분해자)를 구분하고, 먹이사슬 예시를 들 수 있다.',
          exampleAnswer: '풀(생산자) → 메뚜기(1차 소비자) → 개구리(2차 소비자)'
        },
        {
          level: 2, label: '적용', labelEmoji: '🔬',
          description: '먹이그물 그림에서 특정 생물이 줄었을 때 다른 생물에 미치는 영향을 분석할 수 있다.',
          exampleAnswer: '개구리가 줄면 뱀도 줄고, 메뚜기는 늘어납니다.'
        },
        {
          level: 3, label: '심화', labelEmoji: '🌟',
          description: '환경 변화(기온 상승, 서식지 파괴)가 생태계 평형에 미치는 영향을 종합적으로 설명할 수 있다.',
          exampleAnswer: '서식지 파괴로 최상위 포식자가 줄면 피식자가 급증해 식물이 감소합니다.'
        },
      ]
    },
    {
      unitId: 6,
      unitName: '날씨와 우리 생활',
      levels: [
        {
          level: 1, label: '이해', labelEmoji: '📖',
          description: '기온·습도·바람·구름·비의 뜻을 설명하고, 날씨 기호를 읽을 수 있다.',
          exampleAnswer: '습도는 공기 중 수분의 양이며, 습도가 높으면 비가 내리기 쉽습니다.'
        },
        {
          level: 2, label: '적용', labelEmoji: '🔬',
          description: '일기 예보 데이터를 보고 내일 날씨를 예측하고, 계절별 날씨 특성과 생활 변화를 연결할 수 있다.',
          exampleAnswer: '저기압이 다가오면 구름이 많아지고 비가 옵니다.'
        },
        {
          level: 3, label: '심화', labelEmoji: '🌟',
          description: '고기압·저기압의 바람 방향과 날씨 변화 원리를 설명하고, 기후와 날씨의 차이를 구분할 수 있다.',
          exampleAnswer: '고기압에서는 바람이 시계 방향으로 불어 나가며 날씨가 맑습니다.'
        },
      ]
    },
    {
      unitId: 7,
      unitName: '물체의 속력',
      levels: [
        {
          level: 1, label: '이해', labelEmoji: '📖',
          description: '속력의 정의(이동거리÷시간)를 말하고, m/s와 km/h 단위를 설명할 수 있다.',
          exampleAnswer: '속력 = 거리 ÷ 시간, 단위는 m/s 또는 km/h입니다.'
        },
        {
          level: 2, label: '적용', labelEmoji: '🔬',
          description: '두 물체의 거리·시간 데이터를 비교해 더 빠른 물체를 판단하고, 속력을 계산할 수 있다.',
          exampleAnswer: '10m를 2초에 이동하면 속력은 5m/s입니다.'
        },
        {
          level: 3, label: '심화', labelEmoji: '🌟',
          description: '교통 안전 상황(제동 거리·반응 시간)에 속력 개념을 적용하고, 안전 속도의 중요성을 설명할 수 있다.',
          exampleAnswer: '속력이 2배 빠르면 제동 거리는 4배 늘어나므로 안전 거리를 더 확보해야 합니다.'
        },
      ]
    },
    {
      unitId: 8,
      unitName: '산과 염기',
      levels: [
        {
          level: 1, label: '이해', labelEmoji: '📖',
          description: '산성·염기성·중성의 성질과 지시약(리트머스·BTB·페놀프탈레인) 색 변화를 나열할 수 있다.',
          exampleAnswer: '산성에서 리트머스는 파란색→빨간색으로 변합니다.'
        },
        {
          level: 2, label: '적용', labelEmoji: '🔬',
          description: '지시약 색 변화로 물질의 산성·염기성을 판별하고, 중화 반응 과정을 설명할 수 있다.',
          exampleAnswer: '레몬즙에 BTB를 넣으면 노란색이 됩니다. 산성이기 때문입니다.'
        },
        {
          level: 3, label: '심화', labelEmoji: '🌟',
          description: '산과 염기를 혼합했을 때 pH 변화를 예측하고, 실생활에서 중화 반응 사례(소화제, 산성비 중화)를 설명할 수 있다.',
          exampleAnswer: '위산(산성)이 많을 때 제산제(염기성)를 먹으면 중화되어 속이 편해집니다.'
        },
      ]
    },
  ];

  export function getRubric(unitId: number): UnitRubric | undefined {
    return rubrics.find(r => r.unitId === unitId);
  }
  ```
- **MIRROR**: CARD_RARITY_SYSTEM (타입 정의 스타일)
- **IMPORTS**: 없음 (자체 파일)
- **GOTCHA**: `levels` 배열을 tuple `[RubricLevel, RubricLevel, RubricLevel]`로 선언 시 TypeScript가 정확히 3개를 강제함 — 각 unitId마다 정확히 3개 작성
- **VALIDATE**: `tsc --noEmit` 0 errors

### Task 2: components/ui/CardArt.tsx — CSS/SVG 카드 아트 컴포넌트
- **ACTION**: 신규 컴포넌트 생성 — unitId + rarity 기반 그라데이션 카드 비주얼
- **IMPLEMENT**:
  ```tsx
  'use client';

  import React from 'react';
  import { CardRarity } from '../../types';

  // Unit theme colors (aligned with Phase 4 UNIT_THEMES)
  const UNIT_COLORS: Record<number, { from: string; to: string; accent: string }> = {
    1: { from: '#78350f', to: '#1c0a00', accent: '#b5651d' },  // amber/stone
    2: { from: '#713f12', to: '#0c0700', accent: '#fde047' },  // yellow
    3: { from: '#0c4a6e', to: '#020617', accent: '#06b6d4' },  // cyan
    4: { from: '#7f1d1d', to: '#0c0100', accent: '#ef4444' },  // red
    5: { from: '#14532d', to: '#010a03', accent: '#22c55e' },  // green
    6: { from: '#0c2a4a', to: '#010810', accent: '#7dd3fc' },  // sky
    7: { from: '#7c2d12', to: '#0c0300', accent: '#f97316' },  // orange
    8: { from: '#4a1d96', to: '#05010f', accent: '#a855f7' },  // purple
  };

  const RARITY_STYLES: Record<CardRarity, {
    border: string;
    glow: string;
    badge: string;
    stars: number;
  }> = {
    common:    { border: '#4b5563', glow: 'none',                              badge: '#6b7280', stars: 1 },
    uncommon:  { border: '#16a34a', glow: '0 0 8px rgba(22,163,74,0.4)',       badge: '#16a34a', stars: 2 },
    rare:      { border: '#2563eb', glow: '0 0 12px rgba(37,99,235,0.5)',      badge: '#2563eb', stars: 3 },
    epic:      { border: '#7c3aed', glow: '0 0 16px rgba(124,58,237,0.6)',     badge: '#7c3aed', stars: 4 },
    legendary: { border: '#b45309', glow: '0 0 24px rgba(180,83,9,0.7)',       badge: '#d97706', stars: 5 },
  };

  interface CardArtProps {
    unitId: number;
    rarity: CardRarity;
    emoji: string;
    name: string;
    size?: 'sm' | 'md' | 'lg';
  }

  export default function CardArt({ unitId, rarity, emoji, name, size = 'md' }: CardArtProps) {
    const unitColor = UNIT_COLORS[unitId] ?? UNIT_COLORS[1];
    const rarityStyle = RARITY_STYLES[rarity];

    const sizeMap = {
      sm: { outer: 'w-16 h-20', emoji: 'text-2xl', name: 'text-[8px]' },
      md: { outer: 'w-24 h-32', emoji: 'text-4xl', name: 'text-[10px]' },
      lg: { outer: 'w-36 h-48', emoji: 'text-6xl', name: 'text-xs' },
    };
    const sz = sizeMap[size];

    return (
      <div
        className={`${sz.outer} relative rounded-lg overflow-hidden flex flex-col items-center justify-center gap-1 select-none`}
        style={{
          background: `linear-gradient(135deg, ${unitColor.from} 0%, ${unitColor.to} 100%)`,
          border: `2px solid ${rarityStyle.border}`,
          boxShadow: rarityStyle.glow,
        }}
      >
        {/* Corner decoration */}
        <div
          className="absolute top-0 left-0 w-full h-1"
          style={{ backgroundColor: unitColor.accent, opacity: 0.6 }}
        />

        {/* Rarity stars */}
        <div className="absolute top-1.5 right-1.5 flex gap-0.5">
          {Array.from({ length: rarityStyle.stars }).map((_, i) => (
            <span key={i} className="text-[7px]" style={{ color: rarityStyle.badge }}>★</span>
          ))}
        </div>

        {/* Main emoji */}
        <span className={sz.emoji}>{emoji}</span>

        {/* Rarity badge */}
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-[7px] font-mono font-bold uppercase tracking-wider text-white"
          style={{ backgroundColor: `${rarityStyle.badge}99` }}
        >
          {rarity}
        </div>

        {/* Card name */}
        <div
          className={`absolute bottom-0.5 left-0 right-0 text-center ${sz.name} font-mono text-white/80 truncate px-1`}
        >
          {name}
        </div>
      </div>
    );
  }
  ```
- **MIRROR**: UNIT_THEME_COLORS, INLINE_STYLE_DYNAMIC_COLOR
- **IMPORTS**: `CardRarity` from `'../../types'`
- **GOTCHA**: Tailwind 동적 색상 불가 → 모든 색상을 `style={}` inline 처리. `boxShadow: 'none'` 도 문자열로 처리 (TypeScript 오류 없음)
- **VALIDATE**: `tsc --noEmit` 0 errors

### Task 3: components/ui/TeacherDashboard/RubricPanel.tsx — 루브릭 뷰
- **ACTION**: 교사 대시보드용 루브릭 패널 신규 생성
- **IMPLEMENT**:
  ```tsx
  'use client';

  import React, { useState } from 'react';
  import { rubrics, getRubric } from '../../../data/rubrics';
  import { gameAudio } from '../../../lib/audio';

  interface RubricPanelProps {
    activeUnitId: number;
  }

  export default function RubricPanel({ activeUnitId }: RubricPanelProps) {
    const [selectedUnit, setSelectedUnit] = useState(activeUnitId);
    const rubric = getRubric(selectedUnit);

    const LEVEL_COLORS = {
      1: { border: 'border-blue-500/40',  bg: 'bg-blue-950/20',  text: 'text-blue-300',  dot: '#3b82f6' },
      2: { border: 'border-amber-500/40', bg: 'bg-amber-950/20', text: 'text-amber-300', dot: '#f59e0b' },
      3: { border: 'border-purple-500/40',bg: 'bg-purple-950/20',text: 'text-purple-300',dot: '#a855f7' },
    } as const;

    return (
      <div className="glass-panel p-4 space-y-4">
        <h3 className="text-xs font-mono font-black text-teal-400 uppercase tracking-widest border-b border-gray-900 pb-2">
          // RUBRIC VIEWER (평가 루브릭)
        </h3>

        {/* Unit selector */}
        <select
          value={selectedUnit}
          onChange={e => { gameAudio.playClick(); setSelectedUnit(Number(e.target.value)); }}
          className="w-full p-1.5 bg-gray-950 border border-gray-800 rounded text-xs font-mono text-gray-300"
        >
          {rubrics.map(r => (
            <option key={r.unitId} value={r.unitId}>{r.unitId}단원. {r.unitName}</option>
          ))}
        </select>

        {/* Rubric levels */}
        {rubric && (
          <div className="space-y-2">
            {rubric.levels.map(level => {
              const colors = LEVEL_COLORS[level.level];
              return (
                <div key={level.level} className={`rounded-lg border p-3 space-y-1 ${colors.border} ${colors.bg}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{level.labelEmoji}</span>
                    <span className={`text-xs font-mono font-bold ${colors.text}`}>
                      Level {level.level} — {level.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-300 leading-relaxed">{level.description}</p>
                  {level.exampleAnswer && (
                    <p className="text-[10px] text-gray-500 italic border-t border-gray-800 pt-1 mt-1">
                      예시: "{level.exampleAnswer}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
  ```
- **MIRROR**: GLASS_PANEL_PATTERN, DASHBOARD_PANEL_PATTERN
- **IMPORTS**: `rubrics, getRubric` from `'../../../data/rubrics'`, `gameAudio` from `'../../../lib/audio'`
- **GOTCHA**: `LEVEL_COLORS`의 key가 `1 | 2 | 3` literal이므로 `level.level` 타입과 일치해야 함 — `as const` 명시
- **VALIDATE**: `tsc --noEmit` 0 errors

### Task 4: TeacherDashboard/index.tsx — RubricPanel 탭 연결
- **ACTION**: `components/ui/TeacherDashboard/index.tsx`를 읽어 RubricPanel import 추가 + 탭/섹션으로 렌더링
- **IMPLEMENT**:
  파일 상단 import 추가:
  ```typescript
  import RubricPanel from './RubricPanel';
  ```
  기존 StatsPanel 렌더링 아래 (또는 옆 탭)에 RubricPanel 추가:
  ```tsx
  {/* Rubric Panel — 루브릭 뷰 */}
  <RubricPanel activeUnitId={selectedUnitId} />
  ```
  (정확한 삽입 위치는 index.tsx 실제 구조를 읽은 후 결정)
- **MIRROR**: GLASS_PANEL_PATTERN
- **IMPORTS**: `import RubricPanel from './RubricPanel'`
- **GOTCHA**: `selectedUnitId` prop이 index.tsx 내에 존재하는지 확인 — 없으면 내부 state 사용
- **VALIDATE**: `tsc --noEmit` → `next build` 0 errors

---

## Testing Strategy

Manual validation (테스트 인프라 없음):
- [ ] PokedexGrid에서 카드 클릭 → CardArt 렌더링 확인
- [ ] 희귀도별 (common/rare/legendary) 색상·글로우 차이 확인
- [ ] 교사 대시보드 → 루브릭 패널에서 단원 선택 → 3단계 표시

### Edge Cases
- [ ] unitId가 1~8 범위 밖(0 또는 9)일 때 CardArt 기본값(unit 1) 사용
- [ ] rubrics.ts getRubric(9) → undefined → RubricPanel graceful 처리

---

## Validation Commands

```bash
# tsc
"C:/Users/user/Desktop/Test/Hopeducks-Test/node_modules/.bin/tsc" --noEmit --project "C:/Users/user/Desktop/Test/Hopeducks-Test/tsconfig.json"
```
EXPECT: Zero errors

```bash
# build
cd "C:/Users/user/Desktop/Test/Hopeducks-Test" && node_modules/.bin/next build
```
EXPECT: Static export 성공

### Manual Validation
- [ ] PokedexGrid 카드에 CardArt 배경 표시
- [ ] 교사 대시보드 → 루브릭 단원 선택 동작
- [ ] 루브릭 3단계 (이해/적용/심화) 모두 표시

---

## Acceptance Criteria
- [ ] `data/rubrics.ts` 8단원 × 3단계 데이터 완성
- [ ] `CardArt` 컴포넌트: unitId + rarity로 고유한 비주얼 생성
- [ ] `RubricPanel` 교사 대시보드에 연결
- [ ] `tsc --noEmit` 0 errors
- [ ] `next build` 성공

## Completion Checklist
- [ ] 모든 동적 색상 `style={}` inline 처리 (Tailwind JIT 우회)
- [ ] rubrics tuple `[Level, Level, Level]` 타입 안전
- [ ] CardArt `unitId` 범위 밖 방어 처리 (`?? UNIT_COLORS[1]`)

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| TeacherDashboard/index.tsx에 selectedUnitId 미존재 | M | L | 내부 state로 대체 또는 activeUnitId=1 기본값 |
| CardArt emoji 렌더링 플랫폼별 차이 | L | L | emoji는 기존과 동일, 배경만 추가 |
| rubrics levels tuple 3개 강제로 컴파일 오류 | L | M | 모든 unitId 정확히 3개 작성 |

## Notes
- Phase 6는 Phase 3(평가 다양화)와 병렬 가능하다고 PRD에 명시. 이미 Phase 3이 완료된 상태이므로 독립 진행.
- CardArt는 PokedexGrid에만 우선 적용. CardBattleArena는 빠른 판독을 위해 이모지 유지 (NOT Building 항목).
- 루브릭 데이터는 정적 파일이므로 DB 연동 없음. 향후 Phase 7 교사 도구에서 루브릭 기반 채점 기능 확장 가능.
