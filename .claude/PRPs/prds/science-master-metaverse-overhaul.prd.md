# 과학 마스터 메타버스 — 전면 개편 PRD

## Problem Statement

교사 대상 바이브코딩 연수용으로 제작된 초등 5학년 과학 복습 플랫폼이 시각적·기능적 완성도 부족, 단조로운 문제 형식, 빈약한 게임 콘텐츠로 인해 실제 교실 운영에 적합하지 않은 상태다. 연수 데모 수준에 머물러 교사들이 학생에게 직접 활용하기 어렵고, 학생 참여 동기를 지속시키는 유니버스·게임 구조가 부재하다.

## Evidence

- 최초 바이브코딩 결과물로, 기능 흐름 일부가 미완성 상태
- 객관식 단일 문제 형식 → 고차원 사고력 평가 불가
- Phaser 2D 맵이 단일 씬으로 구성 → 이동·탐험 동기 없음
- 교사 대시보드 데이터 시각화 미흡 → 수업 중 즉각 활용 불가
- 카드 이미지가 이모지 수준 → 수집 동기 약함

## Proposed Solution

5학년 과학 8단원 콘텐츠 뼈대를 유지하면서 ①평가 다양화(OX·매칭·단답·드래그), ②단원별 테마 존(Zone) 기반 2D 맵 확장, ③신규 게임 모드(협동 레이드·토너먼트·타임어택) 추가, ④디자인 시스템 전면 재정립으로 데모에서 실제 교실 운영 수준으로 끌어올린다.

## Key Hypothesis

우리는 **다양한 문제 형식과 풍부한 게임 유니버스**가 **학생의 반복 학습 참여율**을 높일 것이라고 믿는다.
우리가 옳다는 것은 **단원 완료율 70% 이상, 교사 재사용 의향 80% 이상**일 때 확인한다.

## What We're NOT Building

- 타 학년 또는 타 과목 확장 — 5학년 과학 깊이 보강 우선
- 학생 계정/로그인 시스템 — 닉네임 익명 세션 유지
- 모바일 앱(iOS/Android) — 브라우저 최적화만
- AI 자동 문제 생성 — 수동 큐레이션 품질 유지
- 학교 LMS 연동 — 독립 운영 유지

## Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| 교사 연수 만족도 | 4.5/5.0 이상 | 연수 후 설문 |
| 단원 완료율 (학생) | 70% 이상 | Supabase DB 집계 |
| 퀴즈 정답률 향상 | 1회차 대비 2회차 +15%p | DB 비교 |
| 교사 재사용 의향 | 80% 이상 | 사후 설문 |
| 동시접속 안정성 | 60명 무장애 | 부하 테스트 |

## Open Questions

- [ ] 단답형 문제 채점 기준 — 완전 일치 vs 키워드 매칭?
- [ ] 평가 루브릭 저장 위치 — Supabase DB vs 정적 JSON?
- [ ] 새 맵 에셋 방향 — 픽셀아트 직접 제작 vs CSS/SVG 합성?
- [ ] 협동 레이드 밸런싱 — 학생 수에 따른 보스 HP 스케일링 공식
- [ ] 오프라인 폴백 범위 — Supabase 미연결 시 어디까지 동작?

---

## Users & Context

**Primary User — 교사**
- **Who**: 초등 과학 담당 교사 (바이브코딩 연수 참여자 또는 일반 교사)
- **Current behavior**: 교과서·PPT 기반 수업, 별도 퀴즈 앱 사용
- **Trigger**: 수업 복습 시간 15~20분, 학생 참여 유도 필요
- **Success state**: 코드 공유 → 학생 전원 입장 → 퀴즈/게임 진행 → 결과 확인까지 10분 이내

**Secondary User — 학생 (초등 5학년)**
- **Who**: 태블릿 또는 크롬북 사용하는 10~11세 학생
- **Trigger**: 교사가 참여 코드를 칠판에 제시
- **Success state**: 아바타로 맵 탐험 → 퀴즈 참여 → 카드 수집 → 배틀/레이드

**Job to Be Done (교사)**
수업 복습 시간에, 학생 참여를 유도하는 게임형 활동을 제어하고 싶다, 학습 효과와 결과를 즉시 확인할 수 있도록.

**Non-Users**
중고등학생, 타 교과 교사, 학부모 — 현재 스코프 외

---

## Solution Detail

### Core Capabilities (MoSCoW)

| Priority | Capability | Rationale |
|----------|------------|-----------|
| Must | 문제 형식 다양화 (OX, 매칭, 단답) | 평가 깊이 핵심 |
| Must | 디자인 시스템 재정립 (색상/타이포/컴포넌트) | 완성도 전제 조건 |
| Must | 버그 수정 및 기능 완성 (현재 미동작 항목) | 신뢰성 기반 |
| Must | 단원별 테마 존 맵 (8개 존) | 유니버스 확장 핵심 |
| Should | 평가 루브릭 UI (교사 대시보드) | 교사 활용성 |
| Should | 협동 보스 레이드 개선 (스케일링) | 게임 완성도 |
| Should | 토너먼트 모드 | 신규 게임 모드 |
| Should | 카드 아트워크 개선 (CSS/SVG 기반) | 수집 동기 |
| Could | 타임어택 퀴즈 모드 | 추가 긴장감 |
| Could | NPC 퀘스트 시스템 완성 | 탐험 동기 |
| Could | CSV 내보내기 개선 | 교사 편의 |
| Won't | AI 채점 | 스코프 초과 |
| Won't | 학생 계정 시스템 | 복잡도 급증 |

### MVP Scope (Phase 1-2 완료 시점)

1. 주요 버그 수정 + 기능 완성
2. 디자인 시스템 정립 + UI 전면 적용
3. OX/매칭 문제 형식 추가
4. 단원 테마 맵 존 뼈대 (8개)

### Critical User Flow

```
교사: /teacher/create → 단원 선택 → 코드 발급
학생: 메인 → 코드 입력 → 닉네임 → 아바타 → 테마 맵 탐험
교사 제어: 퀴즈 시작 → 학생 퀴즈 참여 → 실시간 결과 확인
게임: 카드 획득 → 배틀/레이드 → 단원 클리어
```

---

## Technical Approach

**Feasibility**: HIGH (기존 스택 유지, 확장만)

**Architecture Notes**
- 문제 형식 추가: `Question` 타입에 `type: 'mc' | 'ox' | 'matching' | 'short'` 필드 추가
- 테마 맵: `LobbyScene.ts`를 8개 존 씬으로 분리, `ZoneManager` 도입
- 디자인 시스템: Tailwind config에 토큰 정의, 공통 컴포넌트 `components/ui/design-system/` 분리
- 평가 루브릭: `data/rubrics.ts` 정적 파일 + 교사 대시보드 시각화
- 토너먼트 모드: Supabase Broadcast 기반 브래킷 상태 관리

**Technical Risks**

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Phaser 씬 분리 시 메모리 누수 | M | destroy(true) 패턴 엄수, 씬 전환 테스트 |
| 단답형 채점 일관성 | H | 초기엔 키워드 배열 매칭, 정규화 후 확장 |
| 60명 동시접속 + 다양한 문제 형식 | M | Supabase 채널 분리, Presence 스로틀 유지 |
| 정적 빌드(export) + 동적 퀴즈 상태 | L | 기존 패턴(useSearchParams + Suspense) 유지 |

---

## Implementation Phases

| # | Phase | Description | Status | Parallel | Depends | PRP Plan |
|---|-------|-------------|--------|----------|---------|----------|
| 1 | 기반 정비 | 버그 수정, 미완성 기능 완성, TypeScript strict 통과 | complete | - | - | `.claude/PRPs/plans/completed/phase-1-foundation.plan.md` |
| 2 | 디자인 시스템 | 색상 토큰, 타이포, 공통 컴포넌트, 전체 UI 재적용 | complete | - | 1 | `.claude/PRPs/plans/completed/phase-2-design-system.plan.md` |
| 3 | 평가 다양화 | OX·매칭·단답 문제 타입 + 루브릭 UI | complete | with 4 | 2 | `.claude/PRPs/plans/completed/phase-3-assessment-variety.plan.md` |
| 4 | 맵 유니버스 | 8개 단원 테마 존, NPC 퀘스트, 탐험 동선 | complete | with 3 | 2 | `.claude/PRPs/plans/completed/phase-4-map-universe.plan.md` |
| 5 | 게임 모드 | 토너먼트, 타임어택, 협동 레이드 스케일링 | complete | - | 3, 4 | `.claude/PRPs/plans/completed/phase-5-game-modes.plan.md` |
| 6 | 콘텐츠 품질 | 카드 아트, 문제 품질 검수, 루브릭 데이터 완성 | complete | with 5 | 3 | `.claude/PRPs/plans/completed/phase-6-content-quality.plan.md` |
| 7 | 교사 도구 | 대시보드 개선, CSV 내보내기, 답변 분포 차트 | complete | - | 5, 6 | `.claude/PRPs/plans/phase-7-teacher-tools.plan.md` |
| 8 | 안정화 | 오프라인 폴백 배지, 60명 AI 시뮬레이션, 자동 응답 | complete | - | 7 | `.claude/PRPs/plans/phase-8-stabilization.plan.md` |

### Phase Details

**Phase 1: 기반 정비**
- **Goal**: `npm run build` + `tsc --noEmit` 오류 없이 통과, 주요 기능 동작
- **Scope**: 미동작 기능 목록 작성 → 우선순위 수정, `any` 타입 제거
- **Success signal**: 빌드 통과, 교사→학생 전체 플로우 오류 없이 완주

**Phase 2: 디자인 시스템**
- **Goal**: 시각적으로 일관되고 완성된 UI
- **Scope**: Tailwind 디자인 토큰 정의, 공통 컴포넌트 추출, 전체 화면 재적용
- **Success signal**: 모든 화면이 통일된 색상/폰트/간격 사용, 반응형 태블릿 대응

**Phase 3: 평가 다양화**
- **Goal**: 객관식 외 3가지 문제 형식 추가
- **Scope**: `Question` 타입 확장, 문제 렌더러 컴포넌트, 기존 문제 데이터 일부 변환
- **Success signal**: OX·매칭·단답 문제가 퀴즈 플로우에서 정상 채점·카드 연동

**Phase 4: 맵 유니버스**
- **Goal**: 8개 단원 테마 존이 구분된 2D 맵
- **Scope**: Phaser 씬 분리, 존 전환 UI, 각 존 테마 비주얼
- **Success signal**: 학생이 맵에서 단원 존을 선택해 진입·탐험 가능

**Phase 5: 게임 모드**
- **Goal**: 토너먼트·타임어택 모드 추가, 레이드 스케일링
- **Scope**: Supabase 브래킷 상태, 타이머 UI, 보스 HP 공식
- **Success signal**: 교사가 토너먼트 시작 → 학생 자동 브래킷 배정 → 결과 집계

**Phase 6: 콘텐츠 품질**
- **Goal**: 카드·문제·루브릭 콘텐츠 퀄리티 상향
- **Scope**: CSS/SVG 카드 아트, 문제 교육학적 검수, 루브릭 데이터
- **Success signal**: 80장 카드 모두 시각적으로 구분 가능, 루브릭 3단계 이상 정의

**Phase 7: 교사 도구**
- **Goal**: 교사가 수업 중 즉각 활용 가능한 대시보드
- **Scope**: 실시간 정답률 차트, 루브릭 뷰, CSV 개선
- **Success signal**: 수업 중 교사가 대시보드만 보고 다음 활동 결정 가능

**Phase 8: 안정화**
- **Goal**: 60명 동시접속 안정, 오프라인 폴백 완비
- **Scope**: 부하 시나리오 테스트, Supabase 없이 데모 모드 동작
- **Success signal**: 60명 시뮬레이션 무오류, 네트워크 차단 상태에서 단독 데모 가능

### Parallelism Notes

- Phase 3(평가)와 Phase 4(맵)는 독립적이므로 병렬 진행 가능
- Phase 5(게임 모드)는 평가 타입과 맵 존이 확정된 후 시작
- Phase 6(콘텐츠)는 Phase 3 완료 후 문제 형식 기반으로 데이터 제작

---

## Decisions Log

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| 타 학년 확장 | 5학년 유지 | 전 학년 확장 | 깊이 우선, 범위 통제 |
| 단답형 채점 | 키워드 배열 매칭 | AI 채점 | 스코프·비용·신뢰성 |
| 맵 에셋 | CSS/SVG 합성 | 픽셀아트 외주 | 바이브코딩 연수 취지에 맞는 코드 기반 |
| 계정 시스템 | 닉네임 익명 유지 | JWT 계정 | 복잡도 급증, 교실 현실(계정 없음) |
| 빌드 방식 | static export 유지 | SSR 전환 | Vercel 무료 티어, 배포 간소화 |

---

## Research Summary

**현재 코드베이스 현황**
- `lib/game-state.ts` (1,324줄): 상태 관리 과밀, 분리 필요
- `components/ui/TeacherDashboard.tsx` (1,642줄): 단일 파일 과대 → 분리 필요
- `components/AvatarCustomizer.tsx` 중복 존재 (ui/ 와 루트)
- `game/scenes/LobbyScene.ts`: 단일 씬으로 모든 맵 처리
- `data/questions.ts` (2,701줄): 320문항 전부 객관식, 형식 확장 필요

**기술 제약**
- `next.config.ts`: `output: 'export'` → SSR 불가, 모든 동적 기능은 클라이언트에서
- Phaser 4: 반드시 `dynamic import + ssr: false`
- Supabase Free Tier: 동시 연결 200개 상한

---

*Generated: 2026-06-01*
*Status: DRAFT — 사용자 확인 후 Phase 1부터 착수*
