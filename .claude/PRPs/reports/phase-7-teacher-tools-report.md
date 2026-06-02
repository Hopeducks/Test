# Implementation Report: Phase 7 — 교사 도구 (대시보드 개선·CSV·답변 분포 차트)

## Summary
StatsPanel의 가짜 Math.random() 정답률을 실세션 데이터로 교체하고,
선택지 분포 실시간 패널(AnswerDistributionPanel)을 신규 추가했다.
완료 히트맵 오류를 세션 점수 기반 진행 바로 교체하고 CSV 필드를 보강했다.

## Tasks Completed

| # | Task | Status | Notes |
|---|---|---|---|
| 1 | AnswerDistributionPanel.tsx 신규 생성 | ✅ Complete | 응답률·정답/오답·선택지 분포 바 차트 |
| 2 | StatsPanel.tsx 정답률 차트 수정 | ✅ Complete | Math.random() 제거, 실제 세션 avg 계산 |
| 3 | StatsPanel.tsx 히트맵 수정 | ✅ Complete | 세션 점수 기반 진행 바로 교체 |
| 4 | ControlPanels.tsx AnswerDistributionPanel 연결 | ✅ Complete | 퀴즈 진행 중(status==='playing')에만 표시 |
| 5 | index.tsx CSV 필드 보강 | ✅ Complete | 5개 → 8개 컬럼 (단원ID·단원명·정답률 추가) |
| 6 | index.tsx TSV 복사 보강 | ✅ Complete | 정답률 컬럼 추가 |

## Files Changed

| File | Action | Notes |
|---|---|---|
| `components/ui/TeacherDashboard/AnswerDistributionPanel.tsx` | CREATED | 응답률 + 정답/오답 + 선택지 분포 바 차트 |
| `components/ui/TeacherDashboard/StatsPanel.tsx` | UPDATED | Math.random() 제거, 히트맵 로직 수정 |
| `components/ui/TeacherDashboard/ControlPanels.tsx` | UPDATED | AnswerDistributionPanel import + 렌더링 |
| `components/ui/TeacherDashboard/index.tsx` | UPDATED | CSV·TSV 필드 보강 |

## Validation Results

| Level | Status | Notes |
|---|---|---|
| Static Analysis (tsc) | ✅ Pass | 0 errors |
| Build | ✅ Pass | Next.js static export 성공 |

## Key Improvements
- 정답률 차트: `Math.random()` → 실제 `currentScore / totalAttempted * 100`
- 비활성 단원은 "—" 표시 (데이터 없음을 명시)
- 히트맵: `isDone = student.currentScore > unitId` 오류 → 세션 점수·정확도 바로 대체
- AnswerDistributionPanel: MC 문제 선택지 ①②③④ 분포, OX 분포, 응답률 바
- CSV: 학습원 닉네임·아바타·단원ID·단원명·정답점수·정답률·콤보·시뮬 여부

## Notes
- 선택지별 분포는 `lastAnswerCorrect` + 오답 균등 배분 근사법 사용
  (실제 selectedOption 추적은 Supabase quiz_answers 스키마 변경 필요 → Phase 8 범위)
- AnswerDistributionPanel은 `status === 'playing'`일 때만 렌더링 (로비·종료 화면 불필요)
