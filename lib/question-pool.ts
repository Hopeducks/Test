// 출제 풀 셀렉터 (B-2) — 순수 모듈, 사이드 이펙트 없음
import { Question } from '../types';
import { questions } from '../data/questions';
import { oxQuestions } from '../data/questions-ox';
import { matchingQuestions } from '../data/questions-matching';
import { shortQuestions } from '../data/questions-short';
import { standards } from '../data/standards';

export interface QuestionFilter {
  unitIds?: number[];
  gradeLevels?: number[];
  difficulties?: ('easy' | 'medium' | 'hard')[];
  standardCodes?: string[];  // 빈 배열 = 전체 풀
  count?: number;            // 기본 10
}

export interface SelectResult {
  questions: Question[];
  availableCount: number;
  warning?: string;
}

// MC 문항은 ID 끝의 숫자로 위치 파악 (u1_q14 → 14번째 → medium)
export function deriveQuestionDifficulty(q: Question): 'easy' | 'medium' | 'hard' {
  if (q.difficulty) return q.difficulty;
  const match = q.id.match(/_q(\d+)$/);
  if (!match) return 'medium';
  const idx = parseInt(match[1], 10);
  if (idx <= 13) return 'easy';
  if (idx <= 27) return 'medium';
  return 'hard';
}

const ALL_QUESTIONS: Question[] = [
  ...questions,
  ...oxQuestions,
  ...matchingQuestions,
  ...shortQuestions,
];

// 필터 조건에 맞는 문항 배열 반환 (셔플 없음 — 순수 함수)
export function filterQuestions(filter: QuestionFilter): Question[] {
  // Step 1: standardCodes → unitIds 변환
  const resolvedUnitIds = new Set<number>(filter.unitIds ?? []);
  if (filter.standardCodes && filter.standardCodes.length > 0) {
    for (const code of filter.standardCodes) {
      const std = standards.find(s => s.code === code);
      if (std) resolvedUnitIds.add(std.unitId);
    }
  }

  // Step 2: unitId 필터 (없으면 전체)
  let pool = resolvedUnitIds.size > 0
    ? ALL_QUESTIONS.filter(q => resolvedUnitIds.has(q.unitId))
    : ALL_QUESTIONS;

  // Step 3: gradeLevel 필터 (미설정 문항은 5학년으로 간주)
  if (filter.gradeLevels && filter.gradeLevels.length > 0) {
    pool = pool.filter(q => filter.gradeLevels!.includes(q.gradeLevel ?? 5));
  }

  // Step 4: difficulty 필터
  if (filter.difficulties && filter.difficulties.length > 0) {
    pool = pool.filter(q => filter.difficulties!.includes(deriveQuestionDifficulty(q)));
  }

  return pool;
}

// 필터 적용 후 셔플하여 count개 반환
export function selectQuestions(filter: QuestionFilter): SelectResult {
  const count = filter.count ?? 10;
  const pool = filterQuestions(filter);
  const availableCount = pool.length;
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, count);

  return {
    questions: shuffled,
    availableCount,
    warning:
      availableCount < count
        ? `선택 성취기준으로 ${availableCount}문항만 가능합니다.`
        : undefined,
  };
}

// 필터 조건에 맞는 문항 수만 반환 (UI 뱃지용)
export function countQuestions(filter: QuestionFilter): number {
  return filterQuestions(filter).length;
}

// 활성 필터 여부 — 빈 필터이면 기존 단원 기반 셔플 경로를 사용
export function hasActiveFilter(filter: QuestionFilter): boolean {
  return (
    (filter.standardCodes?.length ?? 0) > 0 ||
    (filter.difficulties?.length ?? 0) > 0 ||
    (filter.gradeLevels?.length ?? 0) > 0 ||
    (filter.unitIds?.length ?? 0) > 0
  );
}
