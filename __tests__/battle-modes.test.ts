import { describe, it, expect } from 'vitest';
import {
  determineBattleOutcome,
  shouldEndBattle,
  updateRoundWins,
  RoundWins,
} from '../lib/battle-engine';

describe('determineBattleOutcome', () => {
  describe('standard mode', () => {
    it('returns victory when player HP is higher', () => {
      expect(determineBattleOutcome('standard', 80, 30, { player: 1, opponent: 1 })).toBe('victory');
    });
    it('returns defeat when opponent HP is higher', () => {
      expect(determineBattleOutcome('standard', 10, 70, { player: 0, opponent: 2 })).toBe('defeat');
    });
    it('returns draw when HP is equal', () => {
      expect(determineBattleOutcome('standard', 50, 50, { player: 1, opponent: 1 })).toBe('draw');
    });
    it('returns victory when player has HP and opponent is at 0', () => {
      expect(determineBattleOutcome('standard', 5, 0, { player: 0, opponent: 0 })).toBe('victory');
    });
  });

  describe('bestof3 mode', () => {
    it('returns victory when player has more round wins', () => {
      expect(determineBattleOutcome('bestof3', 20, 80, { player: 2, opponent: 0 })).toBe('victory');
    });
    it('returns defeat when opponent has more round wins', () => {
      expect(determineBattleOutcome('bestof3', 90, 10, { player: 0, opponent: 2 })).toBe('defeat');
    });
    it('returns draw when round wins are tied', () => {
      expect(determineBattleOutcome('bestof3', 50, 50, { player: 1, opponent: 1 })).toBe('draw');
    });
    it('ignores HP entirely in bestof3 mode', () => {
      // opponent HP is 0 but player has fewer round wins → still defeat
      expect(determineBattleOutcome('bestof3', 100, 0, { player: 1, opponent: 2 })).toBe('defeat');
    });
  });
});

describe('shouldEndBattle', () => {
  describe('standard mode', () => {
    it('ends when completed 3 rounds regardless of HP', () => {
      expect(shouldEndBattle('standard', { player: 1, opponent: 1 }, 3, 50, 50)).toBe(true);
    });
    it('ends when player HP reaches 0', () => {
      expect(shouldEndBattle('standard', { player: 0, opponent: 2 }, 1, 0, 80)).toBe(true);
    });
    it('ends when opponent HP reaches 0', () => {
      expect(shouldEndBattle('standard', { player: 1, opponent: 0 }, 2, 60, 0)).toBe(true);
    });
    it('continues when round < 3 and both have HP', () => {
      expect(shouldEndBattle('standard', { player: 1, opponent: 0 }, 2, 50, 40)).toBe(false);
    });
    it('continues after round 1', () => {
      expect(shouldEndBattle('standard', { player: 0, opponent: 1 }, 1, 70, 80)).toBe(false);
    });
  });

  describe('bestof3 mode', () => {
    it('ends when player reaches 2 round wins', () => {
      expect(shouldEndBattle('bestof3', { player: 2, opponent: 0 }, 2, 50, 80)).toBe(true);
    });
    it('ends when opponent reaches 2 round wins', () => {
      expect(shouldEndBattle('bestof3', { player: 0, opponent: 2 }, 2, 80, 50)).toBe(true);
    });
    it('ends after 3 rounds even if no one has 2 wins', () => {
      expect(shouldEndBattle('bestof3', { player: 1, opponent: 1 }, 3, 50, 50)).toBe(true);
    });
    it('continues when neither has 2 wins and < 3 rounds', () => {
      expect(shouldEndBattle('bestof3', { player: 1, opponent: 0 }, 1, 90, 60)).toBe(false);
    });
    it('continues with 1-1 tie after round 2', () => {
      expect(shouldEndBattle('bestof3', { player: 1, opponent: 1 }, 2, 50, 50)).toBe(false);
    });
  });
});

describe('updateRoundWins', () => {
  const start: RoundWins = { player: 0, opponent: 0 };

  it('increments player wins on player victory', () => {
    expect(updateRoundWins(start, 'player')).toEqual({ player: 1, opponent: 0 });
  });
  it('increments opponent wins on opponent victory', () => {
    expect(updateRoundWins(start, 'opponent')).toEqual({ player: 0, opponent: 1 });
  });
  it('does not change wins on draw', () => {
    expect(updateRoundWins(start, 'draw')).toEqual({ player: 0, opponent: 0 });
  });
  it('accumulates correctly over multiple rounds', () => {
    let wins: RoundWins = { player: 0, opponent: 0 };
    wins = updateRoundWins(wins, 'player');
    wins = updateRoundWins(wins, 'opponent');
    wins = updateRoundWins(wins, 'player');
    expect(wins).toEqual({ player: 2, opponent: 1 });
  });
  it('does not mutate the input object', () => {
    const original: RoundWins = { player: 1, opponent: 0 };
    updateRoundWins(original, 'player');
    expect(original).toEqual({ player: 1, opponent: 0 });
  });
});
