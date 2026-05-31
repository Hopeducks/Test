// Web Audio API 기반 8비트 레트로 효과음 합성 모듈
import { gameState } from './game-state.js';

class AudioSynthesizer {
  constructor() {
    this.ctx = null;
  }

  // 브라우저 보안 정책으로 인해 첫 클릭 등 사용자 제스처 시점에 AudioContext 초기화
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // 일시 중단된 경우 재개
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // 공통 오실레이터 재생 헬퍼
  playTone(freqs, duration, type = "sine", volume = 0.1, pitchSweep = null) {
    if (gameState && gameState.state && !gameState.state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = type;
    
    // 볼륨 엔벨로프 설정 (부드러운 페이드아웃으로 클릭음 방지)
    gainNode.gain.setValueAtTime(volume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // 단일 주파수 혹은 멜로디 시퀀스 처리
    if (Array.isArray(freqs)) {
      let timeOffset = 0;
      const noteLength = duration / freqs.length;
      freqs.forEach((freq, index) => {
        osc.frequency.setValueAtTime(freq, now + timeOffset);
        timeOffset += noteLength;
      });
    } else {
      osc.frequency.setValueAtTime(freqs, now);
      if (pitchSweep) {
        osc.frequency.exponentialRampToValueAtTime(pitchSweep, now + duration);
      }
    }

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  // 1. 일반 버튼 클릭음
  playClick() {
    this.playTone(600, 0.08, "sine", 0.05, 100);
  }

  // 2. 정답 효과음 (상승 2화음)
  playCorrect() {
    // E5 (659Hz) -> C6 (1046Hz)
    this.playTone([523.25, 659.25, 1046.50], 0.35, "triangle", 0.15);
  }

  // 3. 오답 효과음 (하강 디스토션 화음)
  playWrong() {
    // F#3 (185Hz) -> C3 (130Hz)
    this.playTone(220, 0.4, "sawtooth", 0.12, 80);
  }

  // 4. 몬스터볼 던지기 (슈우욱 휘파람)
  playThrow() {
    this.playTone(150, 0.25, "triangle", 0.08, 900);
  }

  // 5. 몬스터볼 흔들림 (달그락)
  playShake() {
    this.playTone(80, 0.15, "triangle", 0.2, 40);
  }

  // 6. 포획 성공 (행복한 메인 멜로디)
  playCatchSuccess() {
    if (gameState && gameState.state && !gameState.state.soundEnabled) return;
    const now = this.ctx ? this.ctx.currentTime : 0;
    // C5(523) -> D5(587) -> E5(659) -> G5(784) -> E5(659) -> C6(1046)
    const melody = [
      { f: 523.25, d: 0.08 },
      { f: 587.33, d: 0.08 },
      { f: 659.25, d: 0.08 },
      { f: 783.99, d: 0.12 },
      { f: 659.25, d: 0.08 },
      { f: 1046.50, d: 0.35 }
    ];
    
    this.init();
    if (!this.ctx) return;

    let timeOffset = 0;
    melody.forEach((note) => {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(note.f, this.ctx.currentTime + timeOffset);
      gainNode.gain.setValueAtTime(0.12, this.ctx.currentTime + timeOffset);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + timeOffset + note.d);

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      
      osc.start(this.ctx.currentTime + timeOffset);
      osc.stop(this.ctx.currentTime + timeOffset + note.d);
      
      timeOffset += note.d * 0.9; // 약간씩 겹쳐서 자연스럽게 연주
    });
  }

  // 7. 포획 실패 (또로롱 하강)
  playCatchFail() {
    // C4(261) -> G3(196)
    this.playTone([261.63, 196.00], 0.25, "sawtooth", 0.08);
  }
}

export const gameAudio = new AudioSynthesizer();
export default gameAudio;
