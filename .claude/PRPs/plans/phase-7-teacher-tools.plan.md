# Plan: Phase 7 — 교사 도구 (대시보드 개선·CSV·답변 분포 차트)

## Summary
StatsPanel의 가짜 `Math.random()` 정답률을 실제 세션 데이터로 교체하고,
실시간 선택지 분포 패널(AnswerDistributionPanel)을 신규 추가한다.
히트맵 로직 오류를 수정하고 CSV 필드를 보강한다.

## User Story
As a 교사, I want 대시보드만 보고도 학생들의 정답률·응답 분포를 즉시 파악하여
수업 다음 행동을 결정할 수 있어야 한다.

## Problem → Solution
| 문제 | 해결 |
|------|------|
| 정답률 차트에 `Math.random()` 가짜 데이터 | 실제 `currentScore / totalAttempted` 계산 |
| 히트맵 로직 오류 (`currentScore > unitId`) | 세션 점수 기반 진행 바로 대체 |
| 선택지 분포 차트 미구현 | `AnswerDistributionPanel` 신규 추가 |
| CSV에 정답률·단원 없음 | 필드 보강 |

## Metadata
- **Complexity**: Medium
- **Source PRD**: `.claude/PRPs/prds/science-master-metaverse-overhaul.prd.md`
- **PRD Phase**: Phase 7 — 교사 도구
- **Estimated Files**: 4 (1 created, 3 updated)

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `components/ui/TeacherDashboard/AnswerDistributionPanel.tsx` | CREATE | 선택지 분포 실시간 차트 |
| `components/ui/TeacherDashboard/StatsPanel.tsx` | UPDATE | 정답률 실제 데이터, 히트맵 수정 |
| `components/ui/TeacherDashboard/ControlPanels.tsx` | UPDATE | AnswerDistributionPanel 연결 |
| `components/ui/TeacherDashboard/index.tsx` | UPDATE | CSV 필드 보강 |

## NOT Building
- Supabase `selected_option` 컬럼 추가 — 스키마 변경 없이 기존 데이터 최대 활용
- 과거 단원별 정답률 이력 — 현재 세션 데이터만 사용
- 실시간 차트 애니메이션 라이브러리 — CSS 바 차트로 충분

---

## Step-by-Step Tasks

### Task 1: AnswerDistributionPanel.tsx — 선택지 분포 패널
- 현재 문제 응답 현황 (응답 인원/전체, %)
- 정답/오답 카운트 (실제 데이터 기반)
- MC 문제: ①②③④ 선택지별 바 차트 (올바른 선택지 = emerald, 틀린 선택지 = red)
- OX 문제: O/X 분포
- 오답 배분: wrong 학생을 오답 선택지에 균등 분배 (시뮬레이션 전용)

### Task 2: StatsPanel.tsx — 정답률 차트 수정
- `Math.random()` 제거
- 현재 활성 단원만 실제 정답률 표시 (`avgScore / totalAttempted * 100`)
- 비활성 단원은 "-" 표시 (데이터 없음)
- 히트맵: `currentScore > unitId` → 세션 점수 기반 진행 바로 교체

### Task 3: ControlPanels.tsx — AnswerDistributionPanel 연결
- 퀴즈 진행 중(`status === 'playing'`)일 때 패널 하단에 렌더링

### Task 4: index.tsx — CSV 보강
- 기존 5개 필드 → 7개 필드: 단원 ID·단원명·정답 점수·정답률·스트릭 추가

---

## Validation Commands
```bash
"C:/Users/user/Desktop/Test/Hopeducks-Test/node_modules/.bin/tsc" --noEmit --project "C:/Users/user/Desktop/Test/Hopeducks-Test/tsconfig.json"
```
EXPECT: Zero errors

## Acceptance Criteria
- [ ] StatsPanel 정답률: `Math.random()` 0개
- [ ] 히트맵: `student.currentScore > unitId` 패턴 0개
- [ ] AnswerDistributionPanel: 퀴즈 중 렌더링 확인
- [ ] CSV: 7개 컬럼 포함
- [ ] `tsc --noEmit` 0 errors
