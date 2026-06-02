# Plan: Phase 8 — 안정화 (오프라인 폴백·60명 시뮬레이션)

## Summary
오프라인 모드 배지를 UI에 표시하고, AI 봇 15/30/60명 스폰 버튼과
퀴즈 진행 중 자동 응답 시뮬레이션(useEffect)을 추가한다.
Supabase MockClient는 이미 완비되어 있으므로 코드 변경 없음.

## User Story
As a 교사, I want Supabase 없이도 데모를 시연할 수 있고,
60명 규모 AI 수업을 시뮬레이션하여 실제 교실 운영 전 사전 점검할 수 있어야 한다.

## Problem → Solution
| 문제 | 해결 |
|------|------|
| 오프라인 모드 여부 UI에 표시 없음 | `IS_OFFLINE_MODE` export + 헤더 배지 |
| AI 학생 최대 4명 고정 | 60명 스폰 버튼 + 한국어 이름 풀 생성 |
| 퀴즈 중 AI 학생이 답변 안 함 | 800ms 인터벌 자동 응답 시뮬레이션 |

## Metadata
- **Complexity**: Low-Medium
- **Source PRD**: `.claude/PRPs/prds/science-master-metaverse-overhaul.prd.md`
- **PRD Phase**: Phase 8 — 안정화
- **Estimated Files**: 3 updated

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `lib/supabase/client.ts` | UPDATE | `IS_OFFLINE_MODE` export 추가 |
| `components/ui/TeacherDashboard/ControlPanels.tsx` | UPDATE | AI 스폰 버튼 (15/30/60) + 이름 풀 |
| `components/ui/TeacherDashboard/index.tsx` | UPDATE | 오프라인 배지 + 퀴즈 자동 응답 effect |

## NOT Building
- Presence 100ms throttle 실제 구현 — Phaser 게임 씬 내부 문제, 이 Phase 범위 외
- Supabase 스키마 변경 (selected_option) — Phase 8 외
- 실제 60명 동시 WebSocket 부하 테스트 — 브라우저 환경에서 자동화 불가

---

## Acceptance Criteria
- [ ] 오프라인 모드(`NEXT_PUBLIC_SUPABASE_URL` 미설정) 시 헤더에 OFFLINE MODE 배지
- [ ] AI 봇 15/30/60명 스폰 버튼 동작
- [ ] 퀴즈 진행 중(`status==='playing'`) AI 봇 자동 응답 → AnswerDistributionPanel 갱신 확인
- [ ] `tsc --noEmit` 0 errors
- [ ] `next build` 성공
