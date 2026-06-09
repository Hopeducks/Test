// 2022 개정 교육과정 초등학교 5-6학년 과학 성취기준 카탈로그 (B-1)
// unitId 1~8은 이 앱의 8단원에 대응

export type StandardDomain = '운동과 에너지' | '물질' | '생명' | '지구와 우주';

export interface AchievementStandard {
  code: string;
  gradeBand: '3-4' | '5-6';
  gradeLevel: number;
  unitId: number;
  statement: string;
  domain: StandardDomain;
}

export const standards: AchievementStandard[] = [
  // ── Unit 1: 지층과 화석 (지구와 우주) ──────────────────────────────────
  {
    code: '[6과15-01]', gradeBand: '5-6', gradeLevel: 5, unitId: 1, domain: '지구와 우주',
    statement: '퇴적물이 굳어져 퇴적암이 만들어지는 과정을 알고, 퇴적암의 종류와 특징을 설명할 수 있다.',
  },
  {
    code: '[6과15-02]', gradeBand: '5-6', gradeLevel: 5, unitId: 1, domain: '지구와 우주',
    statement: '지층의 특징을 관찰하고 지층이 만들어지는 순서와 지층 역전을 설명할 수 있다.',
  },
  {
    code: '[6과15-03]', gradeBand: '5-6', gradeLevel: 5, unitId: 1, domain: '지구와 우주',
    statement: '화석이 만들어지는 과정을 알고, 화석을 이용하여 과거의 생물과 환경을 추론할 수 있다.',
  },
  {
    code: '[6과15-04]', gradeBand: '5-6', gradeLevel: 5, unitId: 1, domain: '지구와 우주',
    statement: '표준화석과 시상화석의 차이를 구분하고, 화석 연구가 과학 발전에 미친 영향을 설명할 수 있다.',
  },

  // ── Unit 1: 지층과 화석 6학년 심화 (지구와 우주) ─────────────────────
  {
    code: '[6과15-05]', gradeBand: '5-6', gradeLevel: 6, unitId: 1, domain: '지구와 우주',
    statement: '화성암·퇴적암·변성암이 서로 변하는 암석 순환 과정을 이해하고 지구 내부 에너지와의 관계를 설명할 수 있다.',
  },
  {
    code: '[6과15-06]', gradeBand: '5-6', gradeLevel: 6, unitId: 1, domain: '지구와 우주',
    statement: '습곡과 단층의 형성 원인을 이해하고, 지각 변동이 만들어낸 다양한 지형을 설명할 수 있다.',
  },

  // ── Unit 2: 빛과 렌즈 (운동과 에너지) ─────────────────────────────────
  {
    code: '[6과08-01]', gradeBand: '5-6', gradeLevel: 5, unitId: 2, domain: '운동과 에너지',
    statement: '빛의 직진, 반사, 굴절 현상을 관찰하고 그 특징을 설명할 수 있다.',
  },
  {
    code: '[6과08-02]', gradeBand: '5-6', gradeLevel: 5, unitId: 2, domain: '운동과 에너지',
    statement: '볼록렌즈와 오목렌즈의 특징을 알고, 빛이 렌즈를 통과할 때 굴절되는 원리를 설명할 수 있다.',
  },
  {
    code: '[6과08-03]', gradeBand: '5-6', gradeLevel: 5, unitId: 2, domain: '운동과 에너지',
    statement: '볼록렌즈를 이용하여 물체의 상을 만들고, 상의 크기와 방향이 달라지는 조건을 설명할 수 있다.',
  },
  {
    code: '[6과08-04]', gradeBand: '5-6', gradeLevel: 5, unitId: 2, domain: '운동과 에너지',
    statement: '렌즈가 활용된 기구를 알고, 볼록렌즈와 오목렌즈의 활용 사례를 설명할 수 있다.',
  },
  // ── Unit 2: 빛과 렌즈 6학년 심화 (운동과 에너지) ──────────────────────
  {
    code: '[6과08-05]', gradeBand: '5-6', gradeLevel: 6, unitId: 2, domain: '운동과 에너지',
    statement: '빛의 분산(프리즘)과 색의 합성 원리를 이해하고, 무지개가 생기는 과정을 설명할 수 있다.',
  },
  {
    code: '[6과08-06]', gradeBand: '5-6', gradeLevel: 6, unitId: 2, domain: '운동과 에너지',
    statement: '광학 기기(망원경, 현미경, 사진기)의 구조와 렌즈 활용 원리를 설명할 수 있다.',
  },

  // ── Unit 3: 용액의 성질 (물질) ────────────────────────────────────────
  {
    code: '[6과11-01]', gradeBand: '5-6', gradeLevel: 5, unitId: 3, domain: '물질',
    statement: '용매, 용질, 용액의 의미를 알고 용질이 용매에 녹아 용액이 되는 현상을 설명할 수 있다.',
  },
  {
    code: '[6과11-02]', gradeBand: '5-6', gradeLevel: 5, unitId: 3, domain: '물질',
    statement: '용질의 종류에 따른 용해도 차이를 비교하고, 온도에 따른 용해도 변화를 설명할 수 있다.',
  },
  {
    code: '[6과11-03]', gradeBand: '5-6', gradeLevel: 5, unitId: 3, domain: '물질',
    statement: '물의 증발과 재결정 현상을 이용하여 혼합물을 분리하는 방법을 설명할 수 있다.',
  },
  {
    code: '[6과11-04]', gradeBand: '5-6', gradeLevel: 5, unitId: 3, domain: '물질',
    statement: '용액의 진하기를 비교하는 여러 가지 방법을 알고 실생활에서 활용하는 사례를 설명할 수 있다.',
  },

  // ── Unit 4: 우리 몸 (생명) ────────────────────────────────────────────
  {
    code: '[6과09-01]', gradeBand: '5-6', gradeLevel: 5, unitId: 4, domain: '생명',
    statement: '뼈와 근육의 역할을 알고, 운동 기관의 구조와 기능을 설명할 수 있다.',
  },
  {
    code: '[6과09-02]', gradeBand: '5-6', gradeLevel: 5, unitId: 4, domain: '생명',
    statement: '소화 기관의 구조와 기능을 이해하고, 소화 과정을 설명할 수 있다.',
  },
  {
    code: '[6과09-03]', gradeBand: '5-6', gradeLevel: 5, unitId: 4, domain: '생명',
    statement: '혈액의 구성 성분과 순환 기관의 역할을 알고, 혈액 순환 과정을 설명할 수 있다.',
  },
  {
    code: '[6과09-04]', gradeBand: '5-6', gradeLevel: 5, unitId: 4, domain: '생명',
    statement: '호흡 기관의 구조와 기능을 알고, 호흡 과정에서 일어나는 기체 교환을 설명할 수 있다.',
  },
  {
    code: '[6과09-05]', gradeBand: '5-6', gradeLevel: 5, unitId: 4, domain: '생명',
    statement: '배설 기관의 구조와 기능을 알고, 노폐물이 몸 밖으로 나오는 과정을 설명할 수 있다.',
  },

  // ── Unit 5: 생태계와 환경 (생명) ──────────────────────────────────────
  {
    code: '[6과10-01]', gradeBand: '5-6', gradeLevel: 5, unitId: 5, domain: '생명',
    statement: '생태계의 구성 요소를 알고, 생물과 환경의 관계를 설명할 수 있다.',
  },
  {
    code: '[6과10-02]', gradeBand: '5-6', gradeLevel: 5, unitId: 5, domain: '생명',
    statement: '먹이 사슬과 먹이 그물을 이해하고, 생태계 평형이 유지되는 원리를 설명할 수 있다.',
  },
  {
    code: '[6과10-03]', gradeBand: '5-6', gradeLevel: 5, unitId: 5, domain: '생명',
    statement: '인간의 활동이 생태계에 미치는 영향을 파악하고 환경 보전의 필요성을 설명할 수 있다.',
  },
  {
    code: '[6과10-04]', gradeBand: '5-6', gradeLevel: 5, unitId: 5, domain: '생명',
    statement: '다양한 생물의 생태적 역할을 알고, 생물 다양성 보전의 중요성을 설명할 수 있다.',
  },

  // ── Unit 6: 날씨와 우리 생활 (지구와 우주) ────────────────────────────
  {
    code: '[6과16-01]', gradeBand: '5-6', gradeLevel: 5, unitId: 6, domain: '지구와 우주',
    statement: '수증기의 응결과 구름 생성 과정을 알고, 비와 눈의 생성 원리를 설명할 수 있다.',
  },
  {
    code: '[6과16-02]', gradeBand: '5-6', gradeLevel: 5, unitId: 6, domain: '지구와 우주',
    statement: '이슬점과 상대 습도의 의미를 알고, 측정 방법을 설명할 수 있다.',
  },
  {
    code: '[6과16-03]', gradeBand: '5-6', gradeLevel: 5, unitId: 6, domain: '지구와 우주',
    statement: '고기압과 저기압의 특성을 알고, 바람이 부는 원리와 날씨 변화를 설명할 수 있다.',
  },
  {
    code: '[6과16-04]', gradeBand: '5-6', gradeLevel: 5, unitId: 6, domain: '지구와 우주',
    statement: '계절별 날씨 특징을 알고, 날씨가 우리 생활에 미치는 영향을 설명할 수 있다.',
  },

  // ── Unit 7: 물체의 속력 (운동과 에너지) ───────────────────────────────
  {
    code: '[6과06-01]', gradeBand: '5-6', gradeLevel: 5, unitId: 7, domain: '운동과 에너지',
    statement: '물체의 운동을 속력으로 나타내고, 속력의 단위와 측정 방법을 설명할 수 있다.',
  },
  {
    code: '[6과06-02]', gradeBand: '5-6', gradeLevel: 5, unitId: 7, domain: '운동과 에너지',
    statement: '속력을 계산하는 공식을 이해하고, 물체의 빠르기를 다양한 방법으로 비교할 수 있다.',
  },
  {
    code: '[6과06-03]', gradeBand: '5-6', gradeLevel: 5, unitId: 7, domain: '운동과 에너지',
    statement: '교통안전 속력 규제의 필요성을 알고, 안전한 속력과 관련된 규정을 설명할 수 있다.',
  },
  {
    code: '[6과06-04]', gradeBand: '5-6', gradeLevel: 5, unitId: 7, domain: '운동과 에너지',
    statement: '일상생활에서 속력이 활용되는 다양한 사례를 찾아 설명할 수 있다.',
  },

  // ── Unit 8: 산과 염기 (물질) ──────────────────────────────────────────
  {
    code: '[6과12-01]', gradeBand: '5-6', gradeLevel: 5, unitId: 8, domain: '물질',
    statement: '산과 염기의 성질을 알고, 지시약을 이용하여 산성과 염기성을 구별할 수 있다.',
  },
  {
    code: '[6과12-02]', gradeBand: '5-6', gradeLevel: 5, unitId: 8, domain: '물질',
    statement: '산성 용액과 염기성 용액의 특징을 비교하고, 생활 속 산성·염기성 물질의 예를 설명할 수 있다.',
  },
  {
    code: '[6과12-03]', gradeBand: '5-6', gradeLevel: 5, unitId: 8, domain: '물질',
    statement: '산과 염기가 반응하면 중성이 됨을 알고, 중화 반응의 사례를 설명할 수 있다.',
  },
  {
    code: '[6과12-04]', gradeBand: '5-6', gradeLevel: 5, unitId: 8, domain: '물질',
    statement: 'pH 개념을 이해하고, 일상생활에서 산과 염기의 활용 사례를 설명할 수 있다.',
  },
];

export function getStandardsByUnit(unitId: number): AchievementStandard[] {
  return standards.filter(s => s.unitId === unitId);
}

export function getStandardByCode(code: string): AchievementStandard | undefined {
  return standards.find(s => s.code === code);
}

export function getStandardsByDomain(domain: StandardDomain): AchievementStandard[] {
  return standards.filter(s => s.domain === domain);
}

export const STANDARD_DOMAINS: StandardDomain[] = [
  '운동과 에너지',
  '물질',
  '생명',
  '지구와 우주',
];
