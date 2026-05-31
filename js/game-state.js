// 게임 상태 관리 모듈 (LocalStorage 연동)

const STORAGE_KEY = "sci_pokedex_game_state_v1";

const DEFAULT_STATE = {
  completedQuizzes: {}, // { unit1: score, unit2: score, ... }
  inventory: {
    pokeBall: 10,   // 일반 몬스터볼 (기본 지급)
    greatBall: 3,   // 슈퍼볼
    ultraBall: 1,   // 하이퍼볼
    masterBall: 0   // 마스터볼
  },
  caughtPokemon: [], // 포획한 포켓몬 ID 목록
  currentUnit: null,  // 현재 선택된 단원 ID
  soundEnabled: true, // 사운드 활성화 여부
  audioEnabled: true, // 오디오 활성화 여부
  stats: {
    quizzesAttempted: 0,
    totalCorrectAnswers: 0,
    ballsThrown: {
      pokeBall: 0,
      greatBall: 0,
      ultraBall: 0,
      masterBall: 0
    },
    captureAttempts: 0,
    captureSuccesses: 0
  },
  statistics: {
    quizzesAttempted: 0,
    totalCorrectAnswers: 0,
    ballsThrown: { pokeBall: 0, greatBall: 0, ultraBall: 0, masterBall: 0 },
    captureAttempts: 0,
    captureSuccesses: 0,
    captureFleeCount: 0
  }
};

class GameState {
  constructor() {
    this.state = this.loadState();
  }

  // 상태 로드
  loadState() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        // 기본값 누락 방지 병합
        return {
          ...DEFAULT_STATE,
          ...parsed,
          inventory: { ...DEFAULT_STATE.inventory, ...(parsed.inventory || {}) },
          completedQuizzes: { ...parsed.completedQuizzes },
          caughtPokemon: [...(parsed.caughtPokemon || [])],
          stats: {
            ...DEFAULT_STATE.stats,
            ...(parsed.stats || {}),
            ballsThrown: {
              ...DEFAULT_STATE.stats.ballsThrown,
              ...((parsed.stats && parsed.stats.ballsThrown) || {})
            }
          },
          statistics: {
            ...DEFAULT_STATE.statistics,
            ...(parsed.statistics || {}),
            ballsThrown: {
              ...DEFAULT_STATE.statistics.ballsThrown,
              ...((parsed.statistics && parsed.statistics.ballsThrown) || {})
            }
          }
        };
      }
    } catch (e) {
      console.error("로컬 스토리지를 로드하는 중 오류가 발생했습니다:", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE)); // 딥 카피
  }

  // 상태 저장
  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error("로컬 스토리지에 저장하는 중 오류가 발생했습니다:", e);
    }
  }

  // 퀴즈 결과 기록 및 몬스터볼 보상 지급
  saveQuizResult(unitId, score, correctCount) {
    // 기존 최고 성적보다 높거나 처음인 경우 갱신
    const prevScore = this.state.completedQuizzes[unitId] || 0;
    if (score > prevScore) {
      this.state.completedQuizzes[unitId] = score;
    }

    // 통계 기록
    const calculatedCorrectCount = correctCount !== undefined ? correctCount : Math.round(score / 20);
    this.logQuizAttempt(calculatedCorrectCount);

    // 몬스터볼 보상 계산 및 지급
    let rewarded = { pokeBall: 0, greatBall: 0, ultraBall: 0, masterBall: 0 };

    if (score === 100) { // 5문제 만점
      rewarded = { masterBall: 1, ultraBall: 1, greatBall: 1, pokeBall: 2 };
    } else if (score >= 80) { // 4문제
      rewarded = { masterBall: 0, ultraBall: 1, greatBall: 2, pokeBall: 2 };
    } else if (score >= 60) { // 3문제
      rewarded = { masterBall: 0, ultraBall: 0, greatBall: 1, pokeBall: 3 };
    } else { // 참가상 (1~2문제 또는 0문제)
      rewarded = { masterBall: 0, ultraBall: 0, greatBall: 0, pokeBall: 2 };
    }

    // 인벤토리에 추가
    for (const [key, val] of Object.entries(rewarded)) {
      this.state.inventory[key] += val;
    }

    this.saveState();
    return rewarded;
  }

  // 몬스터볼 사용
  useBall(ballType) {
    if (this.state.inventory[ballType] > 0) {
      this.state.inventory[ballType]--;
      // 통계 기록
      this.logBallThrow(ballType);
      this.logCaptureAttempt(false, false);
      this.saveState();
      return true;
    }
    return false;
  }

  // 포켓몬 획득 (도감 등록)
  addPokemon(pokemonId) {
    if (!this.state.caughtPokemon.includes(pokemonId)) {
      this.state.caughtPokemon.push(pokemonId);
      this.logCaptureAttempt(true, false);
      // Correct for the double attempt since useBall already logged the attempt
      this.state.statistics.captureAttempts--;
      if (this.state.stats) this.state.stats.captureAttempts--;
      this.saveState();
      return true; // 새로 도감에 추가됨
    }
    this.logCaptureAttempt(true, false);
    // Correct for the double attempt since useBall already logged the attempt
    this.state.statistics.captureAttempts--;
    if (this.state.stats) this.state.stats.captureAttempts--;
    this.saveState();
    return false; // 이미 잡았던 포켓몬
  }

  // 포획 성공 기록
  recordCaptureSuccess() {
    this.logCaptureAttempt(true, false);
    // Correct for the double attempt since useBall already logged the attempt
    this.state.statistics.captureAttempts--;
    if (this.state.stats) this.state.stats.captureAttempts--;
    this.saveState();
  }

  // 통계 기록 헬퍼 메소드
  logQuizAttempt(correctCount) {
    this.state.statistics.quizzesAttempted = (this.state.statistics.quizzesAttempted || 0) + 1;
    this.state.statistics.totalCorrectAnswers = (this.state.statistics.totalCorrectAnswers || 0) + correctCount;
    if (this.state.stats) {
      this.state.stats.quizzesAttempted = this.state.statistics.quizzesAttempted;
      this.state.stats.totalCorrectAnswers = this.state.statistics.totalCorrectAnswers;
    }
    this.saveState();
  }

  logBallThrow(ballType) {
    if (this.state.statistics.ballsThrown[ballType] !== undefined) {
      this.state.statistics.ballsThrown[ballType]++;
    } else {
      this.state.statistics.ballsThrown[ballType] = 1;
    }
    if (this.state.stats && this.state.stats.ballsThrown && this.state.stats.ballsThrown[ballType] !== undefined) {
      this.state.stats.ballsThrown[ballType] = this.state.statistics.ballsThrown[ballType];
    }
    this.saveState();
  }

  logCaptureAttempt(isSuccess, didFlee) {
    this.state.statistics.captureAttempts = (this.state.statistics.captureAttempts || 0) + 1;
    if (isSuccess) {
      this.state.statistics.captureSuccesses = (this.state.statistics.captureSuccesses || 0) + 1;
    }
    if (didFlee) {
      this.state.statistics.captureFleeCount = (this.state.statistics.captureFleeCount || 0) + 1;
    }
    if (this.state.stats) {
      this.state.stats.captureAttempts = this.state.statistics.captureAttempts;
      this.state.stats.captureSuccesses = this.state.statistics.captureSuccesses;
    }
    this.saveState();
  }

  // 오디오 활성화 여부 토글
  toggleAudio() {
    this.state.audioEnabled = !this.state.audioEnabled;
    this.state.soundEnabled = this.state.audioEnabled;
    this.saveState();
    return this.state.audioEnabled;
  }

  // 특정 포켓몬 포획 여부 확인
  hasPokemon(pokemonId) {
    return this.state.caughtPokemon.includes(pokemonId);
  }

  // 도감 채운 마리수 반환
  getCaughtCount() {
    return this.state.caughtPokemon.length;
  }

  // 단원 최고 점수 반환
  getQuizScore(unitId) {
    return this.state.completedQuizzes[unitId] || 0;
  }

  // 전체 데이터 초기화
  resetAll() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.saveState();
  }
}

export const gameState = new GameState();
export default gameState;
