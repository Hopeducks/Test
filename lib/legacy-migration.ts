import { cards } from '../data/cards';
import { GameProgress } from '../types';

const LEGACY_ID_TO_NAME: Record<number, string> = {
  74: '꼬마돌', 95: '롱스톤', 139: '암스타', 141: '투구푸스', 142: '프테라',
  58: '가디', 171: '랜턴', 25: '피카츄', 181: '전룡', 145: '썬더',
  7: '꼬부기', 54: '고라파덕', 86: '쥬쥬', 131: '라프라스', 382: '가이오가',
  113: '럭키', 63: '캐이시', 64: '윤겔라', 196: '에브이', 150: '뮤츠',
  10: '캐터피', 43: '뚜벅초', 1: '이상해씨', 127: '쁘사이저', 251: '세레비',
  16: '구구', 351: '캐스퐁', 144: '프리져', 148: '신용', 384: '레쿠쟈',
  66: '알통몬', 81: '코일', 106: '시라소몬', 448: '루카리오', 376: '메타그로스',
  23: '아보', 109: '또가스', 88: '질퍽이', 71: '우츠보트', 94: '팬텀',
};

/** v1 레거시 로컬스토리지 데이터를 현재 진행도 형식으로 변환. 실패 시 null 반환. */
export function migrateLegacyState(legacyData: string): {
  progress: Pick<GameProgress, 'unlockedCardIds' | 'completedUnits' | 'unitHighScores' | 'items'>;
  soundOn?: boolean;
} | null {
  try {
    const parsedLegacy = JSON.parse(legacyData);

    const completedUnits: number[] = [];
    const unitHighScores: Record<number, number> = {};

    if (parsedLegacy.completedQuizzes) {
      Object.entries(parsedLegacy.completedQuizzes).forEach(([key, val]) => {
        const match = key.match(/unit(\d+)/);
        if (match) {
          const unitNum = parseInt(match[1], 10);
          completedUnits.push(unitNum);
          const legacyScore = typeof val === 'number' ? val : 0;
          unitHighScores[unitNum] = Math.round(legacyScore / 10);
        }
      });
    }

    const unlockedCardIds: string[] = [];
    if (Array.isArray(parsedLegacy.caughtPokemon)) {
      parsedLegacy.caughtPokemon.forEach((legacyId: string | number) => {
        const name = LEGACY_ID_TO_NAME[Number(legacyId)];
        if (name) {
          const card = cards.find(c => c.name === name);
          if (card) unlockedCardIds.push(card.id);
        }
      });
    }

    let soundOn: boolean | undefined;
    if (parsedLegacy.soundEnabled !== undefined) soundOn = !!parsedLegacy.soundEnabled;
    else if (parsedLegacy.audioEnabled !== undefined) soundOn = !!parsedLegacy.audioEnabled;

    return {
      progress: {
        unlockedCardIds,
        completedUnits,
        unitHighScores,
        items: { potion: 3, magnifier: 3, watch: 3 },
      },
      soundOn,
    };
  } catch {
    return null;
  }
}
