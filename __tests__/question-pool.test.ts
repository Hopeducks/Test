import { describe, it, expect } from 'vitest';
import { standards } from '../data/standards';
import { questions } from '../data/questions';
import { oxQuestions } from '../data/questions-ox';
import { matchingQuestions } from '../data/questions-matching';
import { shortQuestions } from '../data/questions-short';
import {
  filterQuestions,
  selectQuestions,
  countQuestions,
  deriveQuestionDifficulty,
  hasActiveFilter,
  QuestionFilter,
} from '../lib/question-pool';

// ── B-6 정합성 테스트 ────────────────────────────────────────────────────
describe('[B-6] 성취기준 카탈로그 정합성', () => {
  it('성취기준 코드가 중복 없이 유일하다', () => {
    const codes = standards.map(s => s.code);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
  });

  it('모든 성취기준은 unitId 1~8 범위에 속한다', () => {
    for (const std of standards) {
      expect(std.unitId).toBeGreaterThanOrEqual(1);
      expect(std.unitId).toBeLessThanOrEqual(8);
    }
  });

  it('모든 성취기준은 gradeLevel이 양수다', () => {
    for (const std of standards) {
      expect(std.gradeLevel).toBeGreaterThan(0);
    }
  });

  it('각 단원에 최소 1개 성취기준이 존재한다 (고아 단원 0)', () => {
    for (let unitId = 1; unitId <= 8; unitId++) {
      const unitStds = standards.filter(s => s.unitId === unitId);
      expect(unitStds.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('성취기준 코드 형식이 [6과NN-NN] 패턴을 따른다', () => {
    const pattern = /^\[6과\d{2}-\d{2}\]$/;
    for (const std of standards) {
      expect(pattern.test(std.code)).toBe(true);
    }
  });
});

// ── selectQuestions 기능 테스트 ───────────────────────────────────────────
describe('filterQuestions', () => {
  it('빈 필터는 전 문항 풀을 반환한다', () => {
    const all = filterQuestions({});
    const total =
      questions.length + oxQuestions.length + matchingQuestions.length + shortQuestions.length;
    expect(all.length).toBe(total);
  });

  it('unitIds 필터로 해당 단원 문항만 반환한다', () => {
    const unit1 = filterQuestions({ unitIds: [1] });
    expect(unit1.every(q => q.unitId === 1)).toBe(true);
    expect(unit1.length).toBeGreaterThan(0);
  });

  it('standardCodes 필터는 해당 성취기준의 unitId 문항을 반환한다', () => {
    // [6과15-01] ~ [6과15-04] 는 unitId=1 에 해당
    const result = filterQuestions({ standardCodes: ['[6과15-01]'] });
    expect(result.every(q => q.unitId === 1)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('여러 standardCodes 선택 시 합집합 단원 문항을 반환한다', () => {
    // unit1 + unit2
    const result = filterQuestions({ standardCodes: ['[6과15-01]', '[6과08-01]'] });
    const unitIds = new Set(result.map(q => q.unitId));
    expect(unitIds.has(1)).toBe(true);
    expect(unitIds.has(2)).toBe(true);
  });

  it('difficulty easy 필터는 쉬운 문항만 반환한다', () => {
    const easy = filterQuestions({ unitIds: [1], difficulties: ['easy'] });
    for (const q of easy) {
      expect(deriveQuestionDifficulty(q)).toBe('easy');
    }
    expect(easy.length).toBeGreaterThan(0);
  });

  it('difficulty hard 필터는 어려운 문항만 반환한다', () => {
    const hard = filterQuestions({ unitIds: [1], difficulties: ['hard'] });
    for (const q of hard) {
      expect(deriveQuestionDifficulty(q)).toBe('hard');
    }
    expect(hard.length).toBeGreaterThan(0);
  });

  it('gradeLevels [5] 필터는 gradeLevel 미설정 문항(=5학년으로 간주)을 포함한다', () => {
    const result = filterQuestions({ unitIds: [1], gradeLevels: [5] });
    expect(result.length).toBeGreaterThan(0);
  });

  it('존재하지 않는 gradeLevel 필터는 빈 배열을 반환한다', () => {
    const result = filterQuestions({ gradeLevels: [99] });
    expect(result.length).toBe(0);
  });
});

describe('selectQuestions', () => {
  it('count만큼 문항을 반환한다', () => {
    const { questions: qs } = selectQuestions({ unitIds: [1], count: 5 });
    expect(qs.length).toBe(5);
  });

  it('풀 크기 < count이면 availableCount가 실제 풀 크기이고 warning이 있다', () => {
    const { availableCount, warning } = selectQuestions({ unitIds: [1], difficulties: ['easy'], count: 999 });
    expect(availableCount).toBeLessThan(999);
    expect(warning).toBeDefined();
    expect(warning).toContain('문항만 가능');
  });

  it('풀 크기 >= count이면 warning이 없다', () => {
    const { warning } = selectQuestions({ unitIds: [1], count: 5 });
    expect(warning).toBeUndefined();
  });

  it('기본 count는 10이다', () => {
    const { questions: qs } = selectQuestions({ unitIds: [1] });
    expect(qs.length).toBe(10);
  });

  it('반환된 문항은 필터 조건을 만족한다', () => {
    const { questions: qs } = selectQuestions({ unitIds: [2], count: 10 });
    expect(qs.every(q => q.unitId === 2)).toBe(true);
  });
});

describe('countQuestions', () => {
  it('단원별 문항 수를 정확히 반환한다', () => {
    const n1 = countQuestions({ unitIds: [1] });
    const n2 = countQuestions({ unitIds: [2] });
    expect(n1).toBeGreaterThan(0);
    expect(n2).toBeGreaterThan(0);
    expect(countQuestions({ unitIds: [1, 2] })).toBe(n1 + n2);
  });
});

describe('deriveQuestionDifficulty', () => {
  it('difficulty 필드가 있으면 그대로 반환한다', () => {
    const q = { id: 'u1_ox1', unitId: 1, question: '', explanation: '', difficulty: 'easy' as const, type: 'ox' as const, correctIndex: 0 as const };
    expect(deriveQuestionDifficulty(q)).toBe('easy');
  });

  it('_q1~13 → easy', () => {
    const q = { id: 'u1_q5', unitId: 1, question: '', explanation: '', options: ['', '', '', ''] as [string, string, string, string], correctIndex: 0 as const };
    expect(deriveQuestionDifficulty(q)).toBe('easy');
  });

  it('_q14~27 → medium', () => {
    const q = { id: 'u1_q20', unitId: 1, question: '', explanation: '', options: ['', '', '', ''] as [string, string, string, string], correctIndex: 0 as const };
    expect(deriveQuestionDifficulty(q)).toBe('medium');
  });

  it('_q28~40 → hard', () => {
    const q = { id: 'u1_q35', unitId: 1, question: '', explanation: '', options: ['', '', '', ''] as [string, string, string, string], correctIndex: 0 as const };
    expect(deriveQuestionDifficulty(q)).toBe('hard');
  });
});

describe('hasActiveFilter', () => {
  it('빈 필터는 false', () => {
    expect(hasActiveFilter({})).toBe(false);
  });

  it('standardCodes가 있으면 true', () => {
    expect(hasActiveFilter({ standardCodes: ['[6과15-01]'] })).toBe(true);
  });

  it('difficulties가 있으면 true', () => {
    expect(hasActiveFilter({ difficulties: ['hard'] })).toBe(true);
  });
});
