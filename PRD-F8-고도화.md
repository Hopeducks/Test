# PRD — 과학 마스터 메타버스 Phase F8 고도화

> 작성일 2026-06-09 · 대상 빌드: PRD-F7 완료 시점 (커밋 0d94be0)
> 선행 문서: `SPEC.md`, `CLAUDE.md`, `PRD-F7-고도화.md`
> 오프라인 정적 빌드(`output: 'export'`) 제약 유지. 외부 오디오 파일 없이 Web Audio API 합성음만 사용.

---

## 0. 한 줄 요약

**(1) 800줄 초과 파일 분리**로 코드베이스 지속 가능성을 확보하고, **(2) Web Audio API 순수 합성음 엔진**을 도입해 퀴즈 정답·오답·업적·배틀 등 모든 인터랙션에 청각 피드백을 추가한다. 오디오 파일 0개, 외부 패키지 추가 없음.

---

## 1. 배경 & 현재 상태

| 파일 | 현황 |
|------|------|
| `lib/game-state.ts` | **1330줄** — 업적/카드XP/교실관리/데일리/배지가 한 클래스에 혼재 |
| `components/StudentLobby.tsx` | **1018줄** — 세션가입/사이드바/모달 상태가 한 컴포넌트에 집중 |
| 사운드 | **전무** — 퀴즈 정답/오답 피드백이 시각(색 변화)만. 교실 주의 집중도 저하 |

### 코드 레벨 결함

| ID | 심각도 | 내용 | 근거 |
|----|--------|------|------|
| D1 | MEDIUM | `game-state.ts` GameStateManager가 업적·카드XP·데일리·배지 로직을 단일 클래스에 보유 → 1330줄, 800줄 기준 초과 | `lib/game-state.ts` |
| D2 | MEDIUM | `StudentLobby.tsx`가 세션가입 로직·사이드바 렌더·NPC 이벤트를 단일 컴포넌트에 보유 → 1018줄 초과 | `components/StudentLobby.tsx` |
| D3 | MEDIUM | 전체 앱에 사운드 없음 — 퀴즈 정답/오답/스트릭/업적/배틀 이벤트에 시각 피드백만 존재 | — |

---

## 2. 목표

- **G-1** `lib/game-state.ts` → 800줄 미만 (업적·카드XP·데일리·배지 로직 분리)
- **G-2** `components/StudentLobby.tsx` → 800줄 미만 (세션가입·사이드바·채팅 패널 분리)
- **G-3** 사운드 엔진 도입: 퀴즈·업적·배틀·로비 이벤트에 Web Audio 합성음
- **G-4** 전역 음소거 토글 (localStorage 영속), 교사용 교실 모드에서도 ON/OFF
- **G-5** 매 단계 검증: tsc 클린 · 단위 221개 그린 · E2E 27개 그린 · 정적빌드 그린

---

## 3. 비목표

- 오디오 파일(.mp3/.ogg) 번들 추가 — 오프라인 정적 빌드 크기 유지
- 외부 사운드 라이브러리(Howler 등) 의존성 추가
- 기존 기능 변경 — 동작 100% 보존

---

## 4. 실행 계획

### Phase 1 — game-state.ts 분리 (R5)

**목표**: 1330줄 → 800줄 미만

분리 대상:

| 신규 파일 | 추출 내용 | 예상 줄수 |
|-----------|-----------|-----------|
| `lib/achievement-engine.ts` | `checkAndGrantAchievements`, `processAchievementReward`, earnedAchievementIds 관리 | ~180줄 |
| `lib/card-xp.ts` | `gainCardXp`, `getCardPower`, `getCardEvolution` 위임 래퍼 + 레벨업 이벤트 발생 | ~120줄 |
| `lib/daily-stats.ts` | `todayStr`, `getDailyStats`, `incrementDailyStat`, `markLobbyVisited`, `claimDailyQuestReward` | ~100줄 |
| `lib/badge-system.ts` | `unlockBadge`, `beatGymLeader`, badge 보상 처리 | ~80줄 |

GameStateManager는 위 모듈을 호출하는 **게이트웨이**로만 남김.

**검증**: tsc · 단위 221 · E2E 27 · 정적빌드 모두 그린 확인 후 커밋.

---

### Phase 2 — StudentLobby.tsx 분리 (R6)

**목표**: 1018줄 → 800줄 미만

분리 대상:

| 신규 파일 | 추출 내용 |
|-----------|-----------|
| `components/ui/lobby/SessionJoinPanel.tsx` | `inputSessionCode`, `handleJoinSession`, 이름 입력 로직, NicknameModal 연결 |
| `components/ui/lobby/LobbySidebar.tsx` | `activeSidebarTab`, 랭킹/퀘스트 사이드바 렌더 |

기존 `LobbyEntryScreen`, `LobbyQuestsPanel`, `LobbyShopModal`은 이미 분리됨.

**검증**: 동일.

---

### Phase 3 — 사운드 엔진 (S-시리즈)

#### S-1: `lib/sound-engine.ts` 신규

Web Audio API 순수 합성음 엔진. 외부 파일·패키지 없음.

```
SoundEngine (싱글톤)
  ctx: AudioContext | null (첫 인터랙션 시 lazy init)
  isMuted: boolean (localStorage 'science_pokedex_sound_muted')

  playTone(freq, duration, type, gain)   // 기반 원시 메서드
  playCorrect()   // C5-E5-G5 상승 아르페지오 (0.4s)
  playWrong()     // G4-Eb4 하강 (0.3s)
  playStreak(n)   // n=3 트릴, n=5 팡파레, n=10 화려한 멜로디
  playCardUnlock()  // 반짝임 상승 (6음 0.6s)
  playAchievement() // 승리 팡파레 4음 (0.8s)
  playBattleHit()  // 저음 충격파 (0.15s)
  playBattleWin()  // 3단 상승 + 롤 (1.0s)
  playPortalEnter() // 스윕 사운드 (0.5s)
  setMuted(bool)
  toggleMute(): boolean
```

AudioContext는 사용자 인터랙션(클릭) 이후에만 생성(브라우저 정책 준수).

#### S-2: 퀴즈 피드백 사운드

- `QuizScreen.tsx`: 보기 선택 시 → `playCorrect()` or `playWrong()`
- `QuizScreen.tsx`: 연속 정답 스트릭 증가 시 → `playStreak(streakCount)`

#### S-3: 업적·카드 잠금해제 사운드

- `app/page.tsx`: `react:achievementUnlocked` 이벤트 → `playAchievement()`
- `app/page.tsx`: `react:cardEvolved` 이벤트 → `playCardUnlock()`
- `CardUnlockAnim.tsx`: 마운트 시 → `playCardUnlock()`

#### S-4: 전역 음소거 토글

- `app/page.tsx` 우상단 고정 버튼 🔊/🔇
- 클릭 시 `soundEngine.toggleMute()`, localStorage 영속
- aria-label, 키보드 접근 가능

#### S-5: 배틀·로비 사운드

- `BattleCombatScreen.tsx`: 공격 발생 → `playBattleHit()`
- `BattleResultScreen.tsx`: 승리 → `playBattleWin()`
- `PhaserCanvas.tsx`: 포탈 진입 이벤트 → `playPortalEnter()`

---

### Phase 4 — 단위 테스트 보강

| 파일 | 테스트 내용 |
|------|-------------|
| `__tests__/sound-engine.test.ts` | muted 상태 토글·영속, playCorrect/Wrong 호출 시 예외 없음(AudioContext mock), streak 레벨별 호출 |
| `__tests__/achievement-engine.test.ts` | 분리 후 기존 동작 유지 확인 (regression) |
| `__tests__/daily-stats.test.ts` | 분리 후 기존 동작 유지 확인 |

목표 단위: **221 → 240개 이상**

---

## 5. 검증 게이트 (매 단계)

```
tsc --noEmit          → 0 errors
npx vitest run        → 전체 그린
npx playwright test   → 27개 그린
npm run build         → 정적빌드 성공, First Load JS ≤ 200 kB
```

---

## 6. 파일별 예상 줄수 변화

| 파일 | 현재 | 목표 |
|------|------|------|
| `lib/game-state.ts` | 1330 | < 800 |
| `components/StudentLobby.tsx` | 1018 | < 800 |
| `lib/sound-engine.ts` | 0 | ~200 |
| `lib/achievement-engine.ts` | 0 | ~180 |
| `lib/card-xp.ts` | 0 | ~120 |
| `lib/daily-stats.ts` | 0 | ~100 |
| `lib/badge-system.ts` | 0 | ~80 |

---

## 7. 완료 기준

- [ ] game-state.ts < 800줄
- [ ] StudentLobby.tsx < 800줄
- [ ] 사운드 엔진 동작 (정답/오답/업적/배틀)
- [ ] 전역 음소거 버튼 작동 + localStorage 영속
- [ ] 단위 240개 이상 그린
- [ ] E2E 27개 그린
- [ ] 정적빌드 ≤ 200 kB
