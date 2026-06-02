# PRD: Science Master Pokédex — Quality Improvement (과학 마스터 포켓도감)

**Document version:** 1.0  
**Date:** 2026-06-02  

---

## 1. Executive Summary

### Current state assessment
The app is a Next.js 15 static-export single-page router with Supabase realtime backend and Phaser 4 metaverse lobby. It has substantial mechanics: 8 science units, ~320 questions, 80 collectible cards, capture minigame, gym battles, boss raids, quests, cosmetic shop, and teacher dashboard with live presence/CSV export.

The core problem is **tone and audience fit, not missing features**. The product targets 초등/중등 students but presents as a dark, cyberpunk terminal with English-heavy `font-mono` chrome. The entry flow forces a 성별(남/여) + avatar-type (소년/청년/소녀/여성) selection that is **inappropriate for the classroom context**. Learning is shallow: a correct/wrong flash plus a one-sentence explanation that auto-advances in ~2.2s, with no learner control, hints, or "why the other options are wrong."

### Key problems to solve
1. **Inappropriate gating** — gender + avatar-type selection in `RoleSelector.tsx`
2. **Wrong visual register** — dark sci-fi/terminal aesthetic, low color/playfulness for the age group
3. **Low pedagogical depth** — quiz is recognition-only; explanations are brief and time-gated; no self-directed exploration
4. **Stability/data inconsistencies** — hardcoded magic numbers, redundant Supabase channel churn, raw `alert()`, per-render channel instantiation

### Success metrics
- Entry flow contains **zero** gender/avatar-type prompts; one screen: name → class/number → join code
- Lobby and quiz pass the design-quality checklist: at least 4 of the "Required Qualities"
- Every answered question shows an explanation the learner **dismisses manually**
- `npm run build` and `npm run lint` pass clean; no `alert()` in student-facing flows; no console errors on a full quiz run
- Card/question counts derive from data, not magic numbers

---

## 2. Phase A — Removal / Cleanup (최우선)

### 2.1 Elements to remove
| Element | Location | Action |
|---|---|---|
| `gender` state + `handleGenderChange` | `RoleSelector.tsx` | Remove |
| 남/여 toggle UI | `RoleSelector.tsx` | Remove |
| Avatar-type selector (소년/청년/소녀/여성) | `RoleSelector.tsx` | Remove |
| English "// SYSTEM INITIALIZATION" copy | `RoleSelector.tsx` | → 친근한 한국어 |
| `studentAvatar` default `'👦'`/`'👧'` derivation | `RoleSelector.tsx`, `game-state.ts` | → neutral `'⚡'` |
| Avatar gender fallback `p.avatar?.gender === 'female' ? '👧' : '👦'` | `TeacherDashboard/index.tsx` | → `'🧑‍🔬'` |
| `alert()` for locked unit | `StudentLobby.tsx` | → styled toast/modal |

### 2.2 Replacement: science-themed avatar picker
Reuse the existing `AVATARS` array (⚡🔥💧🌱🦖🔬🌋🛸⭐🧬). Replace gender/person flow with a single grid of science icons. Age-neutral and on-theme.

- New flow: avatar grid → 반/번호 selects → nickname input → **참여 코드** (기존 student-code 화면) → 입장

### 2.3 Migration path
- Old person emojis (`👦/👧/🧑/👩`) remain renderable as emoji strings — no destructive migration
- Add normalizer in `game-state.ts loadFromStorage`: if saved avatar is legacy person emoji → map to `'🔬'`
- No DB schema change required; `players.avatar.gender` stops being written/read

---

## 3. Phase B — Stability Foundation

### Known bugs / inconsistencies
| Issue | Location | Fix | Priority |
|---|---|---|---|
| `totalCards = 80` magic number | `page.tsx`, `PokedexHome.tsx` | Derive `cards.length` | HIGH |
| `alert()` for locked unit | `StudentLobby.tsx` | Styled modal/toast | MEDIUM |
| Supabase channel created per-call instead of reusing | `game-state.ts` | Stable channel ref | HIGH |
| Presence effect re-subscribes on every state change | `StudentLobby.tsx` | Throttle deps | HIGH |
| Dashboard presence depends on full `classroomSession` | `TeacherDashboard/index.tsx` | Narrow deps + ref | MEDIUM |
| Mock seed students leak into real sessions | `TeacherDashboard/index.tsx` | Demo-only toggle | MEDIUM |
| `console.log` in prod paths | Various | Dev-gated logger | LOW |

### Realtime reliability
- Centralize channel lifecycle: one subscribe per `sessionCode`, cleanup on unmount only
- Audit all `supabase.channel(...)` call sites
- Add reconnect + offline indicator (using existing `IS_OFFLINE_MODE` flag)

---

## 4. Phase C — UI/UX Redesign

### 4.1 Design system tokens
**Playful "science lab adventure"** direction — bright, high-saturation, rounded. Replace dark terminal default for student surfaces.

```css
--color-bg:        oklch(98% 0.01 250)   /* near-white lab */
--color-surface:   oklch(100% 0 0)
--color-primary:   oklch(62% 0.19 250)   /* science blue */
--color-accent:    oklch(75% 0.18 145)   /* lab green */
--color-fun-1:     oklch(72% 0.20 25)    /* coral */
--color-fun-2:     oklch(80% 0.17 85)    /* sunshine */
--radius-card:     1.25rem
--shadow-soft:     0 8px 24px oklch(62% 0.19 250 / 0.15)
--duration-pop:    220ms
--ease-pop:        cubic-bezier(0.34, 1.56, 0.64, 1)
```

- Replace `font-mono` "// SYSTEM" labels with friendly Korean headings throughout
- Animation: only `transform`/`opacity`/`filter` (performance rule); overshoot easing for card pop-in
- Respect `prefers-reduced-motion`

### 4.2 Lobby redesign (`StudentLobby.tsx`)
- Replace dark `glass-panel` with rounded, light, color-coded zone cards (퀴즈 포탈, 배틀, 레이드, 박물관)
- Animated header: floating science emoji (CSS `transform` drift)
- Remove "// CONNECT TO ACTIVE CLASSROOM" English labels
- Keep Phaser canvas, presence sync, quest/ranking tabs intact
- **Extract sub-panels** into `components/lobby/` (file exceeds 800-line limit): `LobbySidebar`, `LobbyZoneCards`, `ShopModal`, `EntryScreen`

### 4.3 Per-component changes
| Component | Change | Size |
|---|---|---|
| `RoleSelector.tsx` | Remove gender/avatar-type; science avatar grid; Korean copy | M |
| `StudentLobby.tsx` | Restyle + extract sub-panels + colorful zones | L |
| `PokedexHome.tsx` | Palette warm-up, Korean-primary copy | S |
| `QuizScreen.tsx` | Learner-controlled explanation (Phase D) | M |
| `TeacherDashboard/index.tsx` | De-mock, restyle header, gender fallback fix | M |
| `globals.css` | Token system | M |

---

## 5. Phase D — Self-Directed Learning Enhancement

### 5.1 Quiz redesign (`QuizScreen.tsx`)
**Current problem:** `handleOptionClick` → flash → auto-advance after ~2200ms. Denies reading time and reflection.

**Changes:**
1. **Learner-controlled advance** — remove nested `setTimeout(...handleNext, 2200)`. Show explanation with **"다음 문제 ▶"** button. Auto-advance only as 15s timeout fallback.
2. **Rich explanation panel** — show: correct answer + existing `explanation` + **"왜 틀렸을까?"** for chosen wrong option + **"더 알아보기"** expandable tip.
3. **Hint system** — pre-answer "💡 힌트 보기" button; reveals hint and optionally removes 2 wrong options (wire to existing `magnifier` item logic).
4. **Data model extension** — add optional fields to `types.ts`:
   ```ts
   hint?: string
   wrongExplanations?: Record<number, string>
   deepDive?: string
   ```
   Backward compatible (all optional). Renderers fall back gracefully.

### 5.2 Battle mode → review/learning path
- Add **"복습 배틀"** mode: questions drawn from `progress.wrongAnswers` (already tracked)
- Correct answers "heal/attack"; each shows explanation
- Surface a **learning path**: unit → review wrong answers → gym leader, gated by mastery

### 5.3 Progress tracking — learning journey
- New panel in `MyPage.tsx`: per-unit mastery (accuracy + wrong-answer count)
- Visual "journey map": completed → in-progress → locked units
- Reuse existing `getTrainerInfo()` rank/XP for journey header

### 5.4 Learning achievements
Add to `data/achievements.ts`:
- "오답 10개 복습 완료"
- "힌트 없이 만점"
- "한 단원 완전 정복(10/10 카드)"
- Reward review behavior with coins (hook into `claimQuestReward`/`checkAchievements`)

---

## 6. Phase E — Content Addition

### 6.1 Enrich explanations
- Add `deepDive` and `hint` to high-value questions (start with 10/unit)
- Keep curriculum-accurate Korean (초등 5학년 + 중등 연계)

### 6.2 Add questions
- Target +5-10 reasoning/application questions per unit (not just recall)
- Maintain ID convention `u{unit}_q{n}` and `cardReward` rules

### 6.3 Learning tips
- Per-unit "오늘의 과학 상식" tips surfaced via NPC scientists (갈릴레이/뉴턴/etc)
- Surface in `NpcQuestModal.tsx` or `ZoneEntryPanel.tsx`

### 6.4 Data validation
- Add test ensuring every `cardReward` references an existing card
- Ensure every question has `explanation`

---

## 7. Phase F — Polish & Performance

### 7.1 Mobile responsiveness
- Quiz capture minigame: fixed `800px` track → responsive/clamped
- Lobby `lg:grid-cols-4` → verify 320/375/768 breakpoints

### 7.2 Realtime reconnect
- Reconnect handler on connection drop
- Offline indicator (existing `IS_OFFLINE_MODE` flag)

### 7.3 Testing
- Unit: data integrity, `calculateCP`, `getTrainerInfo`, quiz scoring
- Integration: join session → presence → quiz submit → dashboard receives
- E2E (Playwright): student entry (no gender prompt) → join → answer → manual advance → complete
- Target: 80% coverage on logic modules

---

## 8. Implementation Order (Prioritized Task List)

### Phase A — 제거 (즉시)
- [ ] A1: `RoleSelector.tsx` — gender + avatar-type 제거, science avatar grid 추가, 한국어 copy | **M**
- [ ] A2: `game-state.ts` / `TeacherDashboard` — neutral avatar defaults, legacy-emoji normalizer | **S**
- [ ] A3: `StudentLobby.tsx` — `alert()` → toast/modal | **S**

### Phase B — 안정성 기반
- [ ] B1: `page.tsx`, `PokedexHome.tsx` — `cards.length` 동적 도출 | **S**
- [ ] B2: Supabase channel lifecycle 중앙화 (`StudentLobby`, `game-state`, dashboard) | **L**
- [ ] B3: 중복 컴포넌트 정리, dev-logger 추가 | **M**
- [ ] B4: data-integrity 테스트, lint/build 통과 | **M**

### Phase C — 디자인 시스템 + 로비
- [ ] C1: tokens (`globals.css`), 터미널 copy 제거 (앱 전체) | **M**
- [ ] C2: `StudentLobby` 하위 컴포넌트 분리 + 컬러풀 존 카드 + 애니메이션 헤더 | **L**
- [ ] C3: `PokedexHome`, 헤더/푸터 warm-palette 적용 | **S**

### Phase D — 자기주도 학습
- [ ] D1: `QuizScreen` — learner-controlled advance + "다음 문제" 버튼 | **M**
- [ ] D2: 힌트 시스템 + magnifier 연동 + 풍부한 설명 패널 | **M**
- [ ] D3: `types.ts` — `hint`/`wrongExplanations`/`deepDive` 옵셔널 필드 | **S**
- [ ] D4: 복습 배틀 모드 + 학습 경로 게이팅 | **L**
- [ ] D5: `MyPage` 학습 여정 패널 + 학습 업적 | **M**

### Phase E — 콘텐츠
- [ ] E1: 설명/힌트/심화 내용 보강 (10개/단원) | **L**
- [ ] E2: 추론형 문제 +5~10개/단원 | **L**
- [ ] E3: NPC 학습 팁 | **S**

### Phase F — 완성도/성능
- [ ] F1: 반응형 캡처 미니게임 + 브레이크포인트 감사 | **M**
- [ ] F2: Realtime 재연결 + 오프라인 인디케이터 | **M**
- [ ] F3: Playwright E2E + 80% 커버리지 | **L**

---

## 9. Key File Paths

```
components/RoleSelector.tsx
components/StudentLobby.tsx
components/PokedexHome.tsx
components/ui/QuizScreen.tsx
components/ui/TeacherDashboard/index.tsx
lib/game-state.ts
app/page.tsx
app/globals.css
data/questions.ts
data/questions-ox.ts
data/questions-matching.ts
data/questions-short.ts
data/cards.ts
data/achievements.ts
types.ts
```
