export type BattleMode = 'standard' | 'bestof3';

export interface RoundWins {
  player: number;
  opponent: number;
}

/**
 * Determines the final battle outcome.
 * bestof3 mode uses round wins; standard mode uses remaining HP.
 */
export function determineBattleOutcome(
  mode: BattleMode,
  finalPlayerHp: number,
  finalOppHp: number,
  roundWins: RoundWins
): 'victory' | 'defeat' | 'draw' {
  if (mode === 'bestof3') {
    if (roundWins.player > roundWins.opponent) return 'victory';
    if (roundWins.opponent > roundWins.player) return 'defeat';
    return 'draw';
  }
  if (finalPlayerHp > finalOppHp) return 'victory';
  if (finalOppHp > finalPlayerHp) return 'defeat';
  return 'draw';
}

/**
 * Returns true when the battle should end after the current round.
 */
export function shouldEndBattle(
  mode: BattleMode,
  roundWins: RoundWins,
  completedRound: number,
  nextPlayerHp: number,
  nextOpponentHp: number
): boolean {
  if (mode === 'bestof3') {
    return roundWins.player >= 2 || roundWins.opponent >= 2 || completedRound >= 3;
  }
  return completedRound >= 3 || nextPlayerHp <= 0 || nextOpponentHp <= 0;
}

/**
 * Returns updated round wins after a round resolves.
 */
export function updateRoundWins(
  wins: RoundWins,
  roundWinner: 'player' | 'opponent' | 'draw'
): RoundWins {
  return {
    player: wins.player + (roundWinner === 'player' ? 1 : 0),
    opponent: wins.opponent + (roundWinner === 'opponent' ? 1 : 0),
  };
}
