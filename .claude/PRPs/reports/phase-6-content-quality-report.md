# Implementation Report: Phase 6 — 콘텐츠 품질 (카드 아트·루브릭·문제 커버리지)

## Summary
80장 카드를 단원·희귀도별 CSS/SVG 그라데이션 아트(CardArt)로 업그레이드하고, 8단원 × 3단계 루브릭 정적 데이터를 신규 작성했다. 교사 대시보드에 루브릭 탭(RubricPanel)을 추가하고, PokedexGrid에서 CardArt를 사용하도록 교체했다.

## Assessment vs Reality

| Metric | Predicted (Plan) | Actual |
|---|---|---|
| Complexity | Medium | Medium |
| Files Changed | 4 (3 created, 1 updated) | 5 (3 created, 2 updated) |

## Tasks Completed

| # | Task | Status | Notes |
|---|---|---|---|
| 1 | data/rubrics.ts 루브릭 정적 데이터 | ✅ Complete | |
| 2 | components/ui/CardArt.tsx 카드 아트 컴포넌트 | ✅ Complete | |
| 3 | TeacherDashboard/RubricPanel.tsx 루브릭 뷰 | ✅ Complete | |
| 4 | TeacherDashboard/index.tsx 루브릭 탭 연결 | ✅ Complete | stats 삼항 중첩 구조 수정 필요 |
| + | PokedexGrid.tsx CardArt 통합 | ✅ Complete | 계획 P0 읽기 대상이었으나 Files to Change 미포함 — 추가 구현 |

## Validation Results

| Level | Status | Notes |
|---|---|---|
| Static Analysis (tsc) | ✅ Pass | 0 errors |
| Build | ✅ Pass | Next.js static export 성공 |
| Lint | N/A | ESLint 미실행 (프로젝트 관례) |
| Unit Tests | N/A | 테스트 인프라 없음 (계획 명시) |
| Integration | N/A | |

## Files Changed

| File | Action | Notes |
|---|---|---|
| `data/rubrics.ts` | CREATED | 8단원 × 3단계 RubricLevel + UnitRubric tuple 타입 |
| `components/ui/CardArt.tsx` | CREATED | unitId + rarity 기반 그라데이션 카드 비주얼 |
| `components/ui/TeacherDashboard/RubricPanel.tsx` | CREATED | 단원 선택 + 3단계 표시 |
| `components/ui/TeacherDashboard/index.tsx` | UPDATED | 'rubric' 탭 추가 |
| `components/PokedexGrid.tsx` | UPDATED | CardArt 컴포넌트로 이모지 렌더링 교체 |

## Deviations from Plan
- PokedexGrid.tsx가 Files to Change에 없었으나, Mandatory Reading P0에 "CardArt 교체 대상"으로 명시되어 추가 구현. UX Design의 After 스케치에도 PokedexGrid에 CardArt 적용이 명시되어 있었음.
- TeacherDashboard/index.tsx 삼항 연산자 중첩 시 `) : (` → `) : activeTab === 'stats' ? (` 패턴으로 수정 (구문 오류 해결).

## Issues Encountered
- TeacherDashboard tabs: 3단 삼항 중첩에서 괄호 누락으로 tsc 오류 1건 발생 → 즉시 수정 후 0 오류 확인.

## Next Steps
- [ ] 개발 서버에서 PokedexGrid 카드 CardArt 배경 시각 확인
- [ ] 교사 대시보드 → 루브릭 탭 → 단원 선택 동작 확인
- [ ] Code review via `/code-review`
- [ ] Create PR via `/prp-pr`
