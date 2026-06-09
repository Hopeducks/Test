import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── AudioContext mock ────────────────────────────────────────────────────────
const mockStop = vi.fn();
const mockStart = vi.fn();
const mockConnect = vi.fn();
const freqMock = () => ({
  setValueAtTime: vi.fn(),
  exponentialRampToValueAtTime: vi.fn(),
  linearRampToValueAtTime: vi.fn(),
});
const gainMock = () => ({
  gain: {
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  },
  connect: mockConnect,
});
const oscMock = () => ({
  type: 'sine' as OscillatorType,
  frequency: freqMock(),
  connect: mockConnect,
  start: mockStart,
  stop: mockStop,
});

class FakeAudioContext {
  currentTime = 0;
  state: AudioContextState = 'running';
  destination = {};
  resume = vi.fn().mockResolvedValue(undefined);
  createOscillator = vi.fn().mockImplementation(oscMock);
  createGain = vi.fn().mockImplementation(gainMock);
}

// ── game-state mock ──────────────────────────────────────────────────────────
let mockSoundOn = true;

vi.mock('../lib/game-state', () => ({
  gameStateManager: { getSoundOn: () => mockSoundOn },
  default: { getSoundOn: () => mockSoundOn },
  useGameState: vi.fn(() => ({
    soundOn: mockSoundOn,
    setSoundOn: vi.fn(),
    progress: {},
  })),
}));

// ── stub window before importing audio ───────────────────────────────────────
vi.stubGlobal('window', {
  AudioContext: FakeAudioContext,
  webkitAudioContext: undefined,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  localStorage: { getItem: vi.fn(), setItem: vi.fn() },
  dispatchEvent: vi.fn(),
});

import { gameAudio } from '../lib/audio';

describe('SoundSynthesizer — new methods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSoundOn = true;
    // Reset ctx so initContext creates a new FakeAudioContext per test
    (gameAudio as any).ctx = null;
  });

  // ── playStreak ─────────────────────────────────────────────────────────────
  it('playStreak(3) plays trill — 3 tones', () => {
    gameAudio.playStreak(3);
    expect(mockStart).toHaveBeenCalledTimes(3);
  });

  it('playStreak(5) plays fanfare — 4 tones', () => {
    gameAudio.playStreak(5);
    expect(mockStart).toHaveBeenCalledTimes(4);
  });

  it('playStreak(10) plays elaborate melody — 6 tones', () => {
    gameAudio.playStreak(10);
    expect(mockStart).toHaveBeenCalledTimes(6);
  });

  it('playStreak(12) also uses 6-tone path', () => {
    gameAudio.playStreak(12);
    expect(mockStart).toHaveBeenCalledTimes(6);
  });

  it('playStreak(4) uses trill path (n < 5)', () => {
    gameAudio.playStreak(4);
    expect(mockStart).toHaveBeenCalledTimes(3);
  });

  it('playStreak does nothing when muted', () => {
    mockSoundOn = false;
    gameAudio.playStreak(5);
    expect(mockStart).not.toHaveBeenCalled();
  });

  // ── playCardUnlock ─────────────────────────────────────────────────────────
  it('playCardUnlock plays 6 ascending tones', () => {
    gameAudio.playCardUnlock();
    expect(mockStart).toHaveBeenCalledTimes(6);
    expect(mockStop).toHaveBeenCalledTimes(6);
  });

  it('playCardUnlock does nothing when muted', () => {
    mockSoundOn = false;
    gameAudio.playCardUnlock();
    expect(mockStart).not.toHaveBeenCalled();
  });

  // ── playAchievement ────────────────────────────────────────────────────────
  it('playAchievement plays 4-note fanfare', () => {
    gameAudio.playAchievement();
    expect(mockStart).toHaveBeenCalledTimes(4);
  });

  it('playAchievement does nothing when muted', () => {
    mockSoundOn = false;
    gameAudio.playAchievement();
    expect(mockStart).not.toHaveBeenCalled();
  });

  // ── playBattleHit ──────────────────────────────────────────────────────────
  it('playBattleHit plays single impact tone', () => {
    gameAudio.playBattleHit();
    expect(mockStart).toHaveBeenCalledTimes(1);
    expect(mockStop).toHaveBeenCalledTimes(1);
  });

  it('playBattleHit does nothing when muted', () => {
    mockSoundOn = false;
    gameAudio.playBattleHit();
    expect(mockStart).not.toHaveBeenCalled();
  });

  // ── playBattleWin ──────────────────────────────────────────────────────────
  it('playBattleWin plays 9 tones — 3 tiers × 3', () => {
    gameAudio.playBattleWin();
    expect(mockStart).toHaveBeenCalledTimes(9);
  });

  it('playBattleWin does nothing when muted', () => {
    mockSoundOn = false;
    gameAudio.playBattleWin();
    expect(mockStart).not.toHaveBeenCalled();
  });

  // ── playPortalEnter ────────────────────────────────────────────────────────
  it('playPortalEnter plays sweep — 1 oscillator', () => {
    gameAudio.playPortalEnter();
    expect(mockStart).toHaveBeenCalledTimes(1);
  });

  it('playPortalEnter does nothing when muted', () => {
    mockSoundOn = false;
    gameAudio.playPortalEnter();
    expect(mockStart).not.toHaveBeenCalled();
  });

  // ── existing methods still work ───────────────────────────────────────────
  it('playCorrect does not throw', () => {
    expect(() => gameAudio.playCorrect()).not.toThrow();
  });

  it('playWrong does not throw', () => {
    expect(() => gameAudio.playWrong()).not.toThrow();
  });

  it('playClick does not throw', () => {
    expect(() => gameAudio.playClick()).not.toThrow();
  });
});
