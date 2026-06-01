# Plan: Phase 2 — 디자인 시스템 (Design System)

## Summary
`globals.css`에 이미 구축된 CSS 변수 기반 라이트/다크 테마 시스템을 TeacherDashboard 전 하위 컴포넌트에 일관 적용하고, Tailwind 시맨틱 토큰과 3개의 공통 UI 프리미티브(Button, Panel, Badge)를 추가해 전체 화면이 통일된 색상·폰트·간격을 사용하도록 한다.

## User Story
As a 교사/학생,
I want 라이트 모드와 다크 모드가 모든 화면에서 올바르게 동작하는 일관된 UI를,
So that 연수 발표 또는 교실 수업 중 어느 조명 환경에서도 화면이 보기 좋다.

## Problem → Solution
TeacherDashboard 하위 컴포넌트들이 다크 모드 전용 Tailwind 클래스(`bg-gray-950`, `text-gray-100`)를 하드코딩하고, `index.tsx`에 별도 `<style jsx global>`로 `.glass-panel`을 재정의해 전역 CSS 변수 테마 시스템을 무력화하는 문제.  
→ 인라인 스타일 제거, `var(--*)` 토큰 적용, 공통 프리미티브 추출.

## Metadata
- **Complexity**: Medium
- **Source PRD**: `.claude/PRPs/prds/science-master-metaverse-overhaul.prd.md`
- **PRD Phase**: Phase 2 — 디자인 시스템
- **Estimated Files**: 9~11개

---

## UX Design

### Before
```
라이트 모드 선택 시:
  - RoleSelector/PokedexHome → 올바른 라이트 테마
  - TeacherDashboard → 여전히 검정 배경(dark 하드코딩)
  - QuizScreen → 단원별 어두운 그라디언트(의도된 몰입형)

다크 모드 선택 시:
  - 전체 화면 → 올바른 다크 테마
```

### After
```
라이트 모드 선택 시:
  - 모든 화면 → 밝은 배경, 진한 텍스트, 파란 액센트
  - TeacherDashboard → retro card 스타일 (white+bold border)
  - QuizScreen → 단원별 테마 유지 (의도된 몰입형)

다크 모드 선택 시:
  - 모든 화면 → 어두운 배경, 밝은 텍스트, 파란 액센트
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| TeacherDashboard | 항상 다크 | 테마 토글 반영 | `<style jsx global>` 제거 |
| 공통 버튼 | 인라인 Tailwind | `<Button>` 컴포넌트 | 일관된 hover/focus |
| 공통 패널 | `.glass-panel` 직접 | `<Panel>` 컴포넌트 | 테마 자동 적용 |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `app/globals.css` | 34-330 | 기존 CSS 변수 시스템 — 확장할 토큰 목록 |
| P0 | `tailwind.config.ts` | 전체 | 현재 커스텀 색상 — 시맨틱 토큰 추가 위치 |
| P0 | `components/ui/TeacherDashboard/index.tsx` | 마지막 5줄 | 제거할 `<style jsx global>` |
| P1 | `components/ui/TeacherDashboard/ActivityFeed.tsx` | 전체 | dark-only 클래스 현황 |
| P1 | `components/ui/TeacherDashboard/ControlPanels.tsx` | 전체 | dark-only 클래스 현황 |
| P1 | `components/ui/TeacherDashboard/StudentGrid.tsx` | 전체 | dark-only 클래스 현황 |
| P2 | `app/page.tsx` | 164-270 | 헤더 하드코딩 `bg-[#030712]` |

---

## Patterns to Mirror

### CSS_VAR_TOKEN
```css
/* SOURCE: app/globals.css:294-321 */
.light-theme {
  --bg-panel: #ffffff;
  --text-primary: #1e293b;
  --text-secondary: #475569;
  --accent-blue: #2563eb;
  --border-color: #cbd5e1;
}
.dark-theme {
  --bg-panel: #161f30;
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --accent-blue: #3b82f6;
  --border-color: #334155;
}
```

### GLASS_PANEL_GLOBAL
```css
/* SOURCE: app/globals.css:77-91 */
/* light-theme .glass-panel / dark-theme .glass-panel: CSS 변수로 자동 처리 */
.glass-panel { background: #ffffff !important; border: 3px solid #1e293b !important; border-radius: 12px !important; box-shadow: 4px 4px 0px 0px #1e293b !important; }
/* → TeacherDashboard 내부 <style jsx global>에 glass-panel 재정의 금지 */
```

### TAILWIND_SEMANTIC_TOKEN
```typescript
// SOURCE: tailwind.config.ts:11-27 (추가 패턴)
// 기존 cyberBlue, cyberGold → CSS 변수 참조 토큰 추가
colors: {
  panel:   'var(--bg-panel)',
  panelSub:'var(--bg-panel-sub)',
  textPrimary: 'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  accentBlue: 'var(--accent-blue)',
  accentGold: 'var(--accent-gold)',
  border:  'var(--border-color)',
}
```

### PRIMITIVE_COMPONENT
```tsx
// SOURCE: components/ui/TeacherDashboard/ControlPanels.tsx (패턴 추출)
// 버튼: 현재 매번 인라인 className 200자
// → Button 컴포넌트: variant prop으로 primary/secondary/danger/ghost
<Button variant="primary" onClick={handleStartQuiz}>퀴즈 개시</Button>
```

### TEACHER_DASHBOARD_PANEL
```tsx
// SOURCE: components/ui/TeacherDashboard/*.tsx (공통 패턴)
// 모든 패널이 className="glass-panel p-5 border-*-500/10 space-y-4" 반복
// → <Panel accent="cyan"> 컴포넌트로 추출
<Panel accent="cyan" className="space-y-4">...</Panel>
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `tailwind.config.ts` | UPDATE | CSS 변수 참조 시맨틱 토큰 추가 |
| `app/globals.css` | UPDATE | `--bg-panel-header` 토큰 추가, 헤더용 변수 보완 |
| `components/ui/design-system/Button.tsx` | CREATE | 공통 버튼 컴포넌트 |
| `components/ui/design-system/Panel.tsx` | CREATE | 공통 패널 컴포넌트 |
| `components/ui/design-system/Badge.tsx` | CREATE | 공통 배지/태그 컴포넌트 |
| `components/ui/design-system/index.ts` | CREATE | 배럴 export |
| `components/ui/TeacherDashboard/index.tsx` | UPDATE | `<style jsx global>` 제거 |
| `components/ui/TeacherDashboard/ActivityFeed.tsx` | UPDATE | 다크 전용 클래스 → CSS 변수/시맨틱 |
| `components/ui/TeacherDashboard/ControlPanels.tsx` | UPDATE | Button 컴포넌트 일부 적용 |
| `components/ui/TeacherDashboard/StudentGrid.tsx` | UPDATE | Panel 컴포넌트 적용 |
| `app/page.tsx` | UPDATE | 헤더 `bg-[#030712]/80` → `bg-[var(--bg-panel-header)]/80` |

## NOT Building
- QuizScreen 단원별 테마 변경 — 의도된 몰입형 디자인, Phase 2 스코프 외
- Phaser 캔버스 스타일 — 게임 씬 내부, Phase 4에서 처리
- 스토리북/비주얼 테스트 환경 구축 — 스코프 초과
- 애니메이션 시스템 — Phase 2 범위 외
- PokedexHome, RoleSelector 등 이미 테마 적용된 학생 화면 — 기존 잘 동작

---

## Step-by-Step Tasks

### Task 1: Tailwind 시맨틱 토큰 추가
- **ACTION**: `tailwind.config.ts`의 `theme.extend.colors`에 CSS 변수 참조 토큰 추가
- **IMPLEMENT**:
  ```typescript
  colors: {
    // 기존 cyberBg, cyberBlue 등 유지
    panel:        'var(--bg-panel)',
    'panel-sub':  'var(--bg-panel-sub)',
    primary:      'var(--text-primary)',
    secondary:    'var(--text-secondary)',
    'accent-blue':'var(--accent-blue)',
    'accent-gold':'var(--accent-gold)',
    border:       'var(--border-color)',
  }
  ```
- **GOTCHA**: Tailwind CSS 변수 참조 시 `'var(--name)'` 문자열 직접 사용 — 별도 플러그인 불필요
- **VALIDATE**: `npx tsc --noEmit` — 타입 에러 없음 (tailwind.config.ts는 JS/TS 설정이므로 타입 검사 대상 아님, build 검증으로 대체)

### Task 2: globals.css 헤더 토큰 추가
- **ACTION**: `.light-theme`와 `.dark-theme` CSS 변수 블록에 헤더 배경색 토큰 추가
- **IMPLEMENT** (globals.css의 `.light-theme` 블록에 추가):
  ```css
  .light-theme {
    /* 기존 변수 유지 */
    --bg-panel-header: #ffffff;  /* 헤더 배경 */
  }
  .dark-theme {
    /* 기존 변수 유지 */
    --bg-panel-header: #0b0f19;  /* 헤더 배경 다크 */
  }
  ```
- **VALIDATE**: 변수 추가 후 `npx next build` 통과

### Task 3: 공통 Button 컴포넌트 생성
- **ACTION**: `components/ui/design-system/Button.tsx` 생성
- **IMPLEMENT**:
  ```tsx
  'use client';
  import React from 'react';
  
  type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'warning';
  type Size = 'sm' | 'md' | 'lg';
  
  interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
  }
  
  const VARIANT_CLASSES: Record<Variant, string> = {
    primary:   'bg-[var(--accent-blue)] hover:opacity-90 text-white border-transparent',
    secondary: 'bg-[var(--bg-panel-sub)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent-blue)]',
    danger:    'bg-red-600 hover:bg-red-500 text-white border-transparent',
    ghost:     'bg-transparent border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
    warning:   'bg-amber-500 hover:bg-amber-400 text-black border-transparent',
  };
  
  const SIZE_CLASSES: Record<Size, string> = {
    sm: 'px-2.5 py-1 text-[10px] font-bold',
    md: 'px-4 py-2 text-xs font-black',
    lg: 'px-5 py-3 text-sm font-black',
  };
  
  export default function Button({ variant = 'secondary', size = 'md', className = '', children, ...props }: ButtonProps) {
    return (
      <button
        {...props}
        className={`rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      >
        {children}
      </button>
    );
  }
  ```
- **VALIDATE**: `npx tsc --noEmit` 통과

### Task 4: 공통 Panel 컴포넌트 생성
- **ACTION**: `components/ui/design-system/Panel.tsx` 생성
- **IMPLEMENT**:
  ```tsx
  'use client';
  import React from 'react';
  
  type Accent = 'cyan' | 'red' | 'orange' | 'amber' | 'green' | 'none';
  
  interface PanelProps {
    accent?: Accent;
    className?: string;
    children: React.ReactNode;
    title?: React.ReactNode;
  }
  
  const ACCENT_BORDER: Record<Accent, string> = {
    cyan:   'border-[var(--accent-blue)]/20',
    red:    'border-red-500/20',
    orange: 'border-orange-500/20',
    amber:  'border-[var(--accent-gold)]/20',
    green:  'border-emerald-500/20',
    none:   'border-[var(--border-color)]',
  };
  
  export default function Panel({ accent = 'none', className = '', title, children }: PanelProps) {
    return (
      <div className={`glass-panel p-5 ${ACCENT_BORDER[accent]} ${className}`}>
        {title && (
          <div className="border-b border-[var(--border-color)] pb-2 mb-4 text-xs font-mono font-black text-[var(--accent-blue)] uppercase tracking-widest">
            {title}
          </div>
        )}
        {children}
      </div>
    );
  }
  ```
- **VALIDATE**: `npx tsc --noEmit` 통과

### Task 5: 공통 Badge 컴포넌트 생성
- **ACTION**: `components/ui/design-system/Badge.tsx` 생성
- **IMPLEMENT**:
  ```tsx
  'use client';
  import React from 'react';
  
  type BadgeVariant = 'blue' | 'green' | 'red' | 'amber' | 'gray' | 'pulse-blue' | 'pulse-orange';
  
  interface BadgeProps {
    variant?: BadgeVariant;
    children: React.ReactNode;
    className?: string;
  }
  
  const BADGE_CLASSES: Record<BadgeVariant, string> = {
    blue:         'border-[var(--accent-blue)]/30 bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]',
    green:        'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
    red:          'border-red-500/30 bg-red-500/10 text-red-500',
    amber:        'border-[var(--accent-gold)]/30 bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]',
    gray:         'border-[var(--border-color)] bg-[var(--bg-panel-sub)] text-[var(--text-secondary)]',
    'pulse-blue': 'border-[var(--accent-blue)] bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] animate-pulse',
    'pulse-orange':'border-orange-500 bg-orange-500/10 text-orange-500 animate-pulse',
  };
  
  export default function Badge({ variant = 'gray', children, className = '' }: BadgeProps) {
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-black uppercase tracking-wider ${BADGE_CLASSES[variant]} ${className}`}>
        {children}
      </span>
    );
  }
  ```
- **VALIDATE**: `npx tsc --noEmit` 통과

### Task 6: 배럴 export 생성
- **ACTION**: `components/ui/design-system/index.ts` 생성
- **IMPLEMENT**:
  ```typescript
  export { default as Button } from './Button';
  export { default as Panel } from './Panel';
  export { default as Badge } from './Badge';
  ```
- **VALIDATE**: import 경로 테스트 (`from '../../design-system'`)

### Task 7: TeacherDashboard index.tsx — inline style 제거
- **ACTION**: `<style jsx global>` 블록 전체 제거 (`.glass-panel` 재정의 충돌 해소)
- **IMPLEMENT**: 파일 하단 `<style jsx global>{`...`}</style>` 블록 삭제
- **GOTCHA**: 이 블록이 제거되면 `.glass-panel`이 `globals.css`의 전역 정의를 사용 — 라이트/다크 테마 모두 올바르게 적용됨
- **VALIDATE**: `npx next build` 통과, 브라우저에서 라이트/다크 전환 시 TeacherDashboard가 올바르게 변경됨 확인

### Task 8: TeacherDashboard 하위 컴포넌트 — 다크 전용 클래스 수정
- **ACTION**: ActivityFeed, ControlPanels, StudentGrid, StatsPanel에서 다크 전용 하드코딩 클래스를 CSS 변수 참조로 교체
- **IMPLEMENT** (교체 패턴):
  ```
  bg-gray-950  →  bg-[var(--bg-panel-sub)]
  bg-gray-900  →  bg-[var(--bg-panel-sub)]
  text-gray-100 →  text-[var(--text-primary)]
  text-gray-400 →  text-[var(--text-secondary)]
  text-gray-500 →  text-[var(--text-secondary)]
  border-gray-900 → border-[var(--border-color)]
  border-gray-850 → border-[var(--border-color)]
  ```
  - 각 파일에서 위 패턴으로 교체 (accent 색상 `text-cyan-400`, `text-red-400` 등은 globals.css에 이미 매핑 있으므로 유지)
- **GOTCHA**: `globals.css`에 `.dark-theme .bg-gray-950 { background: var(--bg-panel-sub) }` 등 이미 오버라이드가 있으나, 인라인 스타일이 우선순위 더 높음 → 직접 교체가 더 안정적
- **VALIDATE**: `npx tsc --noEmit` 통과, 라이트 모드에서 TeacherDashboard 패널이 흰색 배경으로 표시됨

### Task 9: TeacherDashboard ControlPanels — Button 컴포넌트 적용
- **ACTION**: 주요 제어 버튼들을 `<Button>` 컴포넌트로 교체
- **IMPLEMENT**: ControlPanels.tsx에서 시작/종료 버튼들 교체
  ```tsx
  import { Button } from '../../design-system';
  
  // Before:
  <button onClick={handleStartQuiz} className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black rounded-lg">
  // After:
  <Button variant="primary" size="lg" onClick={handleStartQuiz} className="w-full">
    퀴즈 개시 (Start Quiz)
  </Button>
  ```
- **VALIDATE**: `npx tsc --noEmit` 통과, 버튼 스타일 visual 확인

### Task 10: page.tsx 헤더 테마 적용
- **ACTION**: `app/page.tsx` 헤더의 `bg-[#030712]/80`을 테마 변수로 교체
- **IMPLEMENT**:
  ```tsx
  // Before:
  <header className="sticky top-0 z-30 w-full border-b border-cyan-500/10 bg-[#030712]/80 backdrop-blur-md">
  // After:
  <header className="sticky top-0 z-30 w-full border-b border-[var(--border-color)] bg-[var(--bg-panel-header)]/95 backdrop-blur-md">
  ```
- **VALIDATE**: 라이트 모드 헤더가 흰색 배경으로, 다크 모드 헤더가 어두운 배경으로 표시됨

---

## Testing Strategy

### Edge Cases Checklist
- [ ] 라이트 모드 → 다크 모드 전환 시 TeacherDashboard 모든 패널 변경 확인
- [ ] 다크 모드 → 라이트 모드 전환 시 텍스트 가독성 (흰 배경 + 진한 텍스트)
- [ ] Button 컴포넌트 `disabled` 상태 (opacity 40%)
- [ ] Panel 컴포넌트 accent 별 border 색상 구분
- [ ] 태블릿(768px)에서 TeacherDashboard 3열 그리드 → 1열 스택 확인
- [ ] `var(--*)` 토큰이 정의되지 않은 컴포넌트 없는지 확인

### Manual Validation
- [ ] `npm run dev` → `localhost:3000` 접속
- [ ] 라이트/다크 전환 토글 → 모든 화면 즉시 반영
- [ ] TeacherDashboard: 패널 배경, 텍스트, 버튼 모두 테마 반영
- [ ] 공통 Button: primary/secondary/danger/ghost 모두 시각 확인
- [ ] 태블릿 뷰포트(768px) 반응형 확인

---

## Validation Commands

```bash
# 타입 체크
npx tsc --noEmit

# 빌드
npx next build

# 개발 서버
npm run dev
```

---

## Acceptance Criteria
- [ ] `npx next build` 오류 없이 완료
- [ ] `npx tsc --noEmit` 오류 0건
- [ ] TeacherDashboard: 라이트/다크 토글 모두 가독성 있는 UI 표시
- [ ] `<Button>`, `<Panel>`, `<Badge>` 컴포넌트 존재 및 빌드 포함
- [ ] TeacherDashboard `<style jsx global>` 블록 제거됨
- [ ] `tailwind.config.ts`에 `panel`, `primary`, `accent-blue` 등 시맨틱 토큰 추가됨
- [ ] 태블릿(768px)에서 TeacherDashboard 레이아웃 깨짐 없음

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| CSS 변수 오버라이드 우선순위 충돌 | M | M | `!important` 사용 최소화, 직접 교체 방식 우선 |
| Button 컴포넌트가 기존 스타일과 충돌 | L | L | 적용 범위를 ControlPanels로 제한, 점진적 확대 |
| Tailwind 빌드에서 CSS 변수 토큰 미인식 | L | M | 빌드 후 확인, 필요 시 `safelist` 추가 |

## Notes
- `QuizScreen`의 단원별 어두운 그라디언트(`from-stone-900` 등)는 의도된 몰입형 디자인 → Phase 2 스코프 외
- Phase 1에서 작성된 TeacherDashboard 컴포넌트들(~700줄)이 전원 다크 전용 클래스 사용 → 이번 Phase에서 일괄 수정
- 공통 컴포넌트 파일 위치: `components/ui/design-system/` (기존 `components/ui/` 하위 컨벤션 준수)
