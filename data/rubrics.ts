export interface RubricLevel {
  level: 1 | 2 | 3;
  label: '이해' | '적용' | '심화';
  labelEmoji: string;
  description: string;
  exampleAnswer?: string;
}

export interface UnitRubric {
  unitId: number;
  unitName: string;
  levels: [RubricLevel, RubricLevel, RubricLevel];
}

export const rubrics: UnitRubric[] = [
  {
    unitId: 1,
    unitName: '지층과 화석',
    levels: [
      {
        level: 1, label: '이해', labelEmoji: '📖',
        description: '지층 생성 순서와 퇴적암 종류(사암·이암·역암)를 나열할 수 있다.',
        exampleAnswer: '아래 지층이 먼저 쌓입니다. 사암, 이암, 역암이 있습니다.',
      },
      {
        level: 2, label: '적용', labelEmoji: '🔬',
        description: '지층 단면 그림을 보고 생성 순서를 판단하고, 화석이 남겨진 암석 종류를 설명할 수 있다.',
        exampleAnswer: '이 지층은 C→B→A 순서로 쌓였고, 화석은 퇴적암에서 발견됩니다.',
      },
      {
        level: 3, label: '심화', labelEmoji: '🌟',
        description: '표준화석과 시상화석의 차이를 구분하고, 화석을 통해 과거 환경을 추론할 수 있다.',
        exampleAnswer: '삼엽충은 표준화석으로 지층의 나이를 알 수 있고, 산호는 시상화석으로 과거 기후를 알 수 있습니다.',
      },
    ],
  },
  {
    unitId: 2,
    unitName: '빛과 렌즈',
    levels: [
      {
        level: 1, label: '이해', labelEmoji: '📖',
        description: '빛의 직진·반사·굴절 개념을 정의하고, 볼록렌즈와 오목렌즈를 구분할 수 있다.',
        exampleAnswer: '빛은 직진하고, 거울에서 반사되며, 물에서 굴절됩니다.',
      },
      {
        level: 2, label: '적용', labelEmoji: '🔬',
        description: '볼록렌즈를 이용한 상(실상·허상)을 그림으로 설명하고, 굴절각과 입사각 관계를 설명할 수 있다.',
        exampleAnswer: '볼록렌즈의 초점 너머에 물체가 있으면 실상이, 안쪽이면 허상이 생깁니다.',
      },
      {
        level: 3, label: '심화', labelEmoji: '🌟',
        description: '망원경·현미경 원리를 볼록렌즈 조합으로 설명하고, 실생활 광학 기기에 적용할 수 있다.',
        exampleAnswer: '망원경은 대물렌즈로 실상을 맺고 접안렌즈로 확대하여 봅니다.',
      },
    ],
  },
  {
    unitId: 3,
    unitName: '용액의 성질',
    levels: [
      {
        level: 1, label: '이해', labelEmoji: '📖',
        description: '용해·용질·용매·용액 용어를 정의하고, 용액의 진하기를 비교하는 방법을 설명할 수 있다.',
        exampleAnswer: '소금이 용질, 물이 용매, 소금물이 용액입니다.',
      },
      {
        level: 2, label: '적용', labelEmoji: '🔬',
        description: '색깔 비교, 증발, 메스실린더를 이용해 용액의 진하기를 측정하고 비교할 수 있다.',
        exampleAnswer: '같은 양의 물에 용질이 많을수록 진한 용액입니다.',
      },
      {
        level: 3, label: '심화', labelEmoji: '🌟',
        description: '용해도 그래프를 해석하고, 혼합물 분리 방법(증발·거름·분별결정)을 상황에 맞게 선택할 수 있다.',
        exampleAnswer: '온도가 높을수록 용해도가 커지므로, 냉각하면 과포화 상태가 됩니다.',
      },
    ],
  },
  {
    unitId: 4,
    unitName: '우리 몸',
    levels: [
      {
        level: 1, label: '이해', labelEmoji: '📖',
        description: '소화·호흡·순환·배설 기관의 이름과 기본 기능을 나열할 수 있다.',
        exampleAnswer: '위에서 음식을 소화하고, 폐에서 산소를 흡수합니다.',
      },
      {
        level: 2, label: '적용', labelEmoji: '🔬',
        description: '각 기관이 협력하는 과정을 순서대로 설명하고, 기관 이상 시 나타나는 증상을 연결할 수 있다.',
        exampleAnswer: '음식 → 식도 → 위 → 소장 → 대장 → 항문 순서로 이동합니다.',
      },
      {
        level: 3, label: '심화', labelEmoji: '🌟',
        description: '운동 시 호흡과 순환 기관의 변화를 설명하고, 건강한 생활습관과 기관 기능의 관계를 추론할 수 있다.',
        exampleAnswer: '운동 시 근육에 산소가 더 필요하므로 심박수와 호흡수가 증가합니다.',
      },
    ],
  },
  {
    unitId: 5,
    unitName: '생태계와 환경',
    levels: [
      {
        level: 1, label: '이해', labelEmoji: '📖',
        description: '생태계 구성 요소(생산자·소비자·분해자)를 구분하고, 먹이사슬 예시를 들 수 있다.',
        exampleAnswer: '풀(생산자) → 메뚜기(1차 소비자) → 개구리(2차 소비자)',
      },
      {
        level: 2, label: '적용', labelEmoji: '🔬',
        description: '먹이그물 그림에서 특정 생물이 줄었을 때 다른 생물에 미치는 영향을 분석할 수 있다.',
        exampleAnswer: '개구리가 줄면 뱀도 줄고, 메뚜기는 늘어납니다.',
      },
      {
        level: 3, label: '심화', labelEmoji: '🌟',
        description: '환경 변화(기온 상승, 서식지 파괴)가 생태계 평형에 미치는 영향을 종합적으로 설명할 수 있다.',
        exampleAnswer: '서식지 파괴로 최상위 포식자가 줄면 피식자가 급증해 식물이 감소합니다.',
      },
    ],
  },
  {
    unitId: 6,
    unitName: '날씨와 우리 생활',
    levels: [
      {
        level: 1, label: '이해', labelEmoji: '📖',
        description: '기온·습도·바람·구름·비의 뜻을 설명하고, 날씨 기호를 읽을 수 있다.',
        exampleAnswer: '습도는 공기 중 수분의 양이며, 습도가 높으면 비가 내리기 쉽습니다.',
      },
      {
        level: 2, label: '적용', labelEmoji: '🔬',
        description: '일기 예보 데이터를 보고 내일 날씨를 예측하고, 계절별 날씨 특성과 생활 변화를 연결할 수 있다.',
        exampleAnswer: '저기압이 다가오면 구름이 많아지고 비가 옵니다.',
      },
      {
        level: 3, label: '심화', labelEmoji: '🌟',
        description: '고기압·저기압의 바람 방향과 날씨 변화 원리를 설명하고, 기후와 날씨의 차이를 구분할 수 있다.',
        exampleAnswer: '고기압에서는 바람이 시계 방향으로 불어 나가며 날씨가 맑습니다.',
      },
    ],
  },
  {
    unitId: 7,
    unitName: '물체의 속력',
    levels: [
      {
        level: 1, label: '이해', labelEmoji: '📖',
        description: '속력의 정의(이동거리÷시간)를 말하고, m/s와 km/h 단위를 설명할 수 있다.',
        exampleAnswer: '속력 = 거리 ÷ 시간, 단위는 m/s 또는 km/h입니다.',
      },
      {
        level: 2, label: '적용', labelEmoji: '🔬',
        description: '두 물체의 거리·시간 데이터를 비교해 더 빠른 물체를 판단하고, 속력을 계산할 수 있다.',
        exampleAnswer: '10m를 2초에 이동하면 속력은 5m/s입니다.',
      },
      {
        level: 3, label: '심화', labelEmoji: '🌟',
        description: '교통 안전 상황(제동 거리·반응 시간)에 속력 개념을 적용하고, 안전 속도의 중요성을 설명할 수 있다.',
        exampleAnswer: '속력이 2배 빠르면 제동 거리는 4배 늘어나므로 안전 거리를 더 확보해야 합니다.',
      },
    ],
  },
  {
    unitId: 8,
    unitName: '산과 염기',
    levels: [
      {
        level: 1, label: '이해', labelEmoji: '📖',
        description: '산성·염기성·중성의 성질과 지시약(리트머스·BTB·페놀프탈레인) 색 변화를 나열할 수 있다.',
        exampleAnswer: '산성에서 리트머스는 파란색→빨간색으로 변합니다.',
      },
      {
        level: 2, label: '적용', labelEmoji: '🔬',
        description: '지시약 색 변화로 물질의 산성·염기성을 판별하고, 중화 반응 과정을 설명할 수 있다.',
        exampleAnswer: '레몬즙에 BTB를 넣으면 노란색이 됩니다. 산성이기 때문입니다.',
      },
      {
        level: 3, label: '심화', labelEmoji: '🌟',
        description: '산과 염기를 혼합했을 때 pH 변화를 예측하고, 실생활에서 중화 반응 사례(소화제, 산성비 중화)를 설명할 수 있다.',
        exampleAnswer: '위산(산성)이 많을 때 제산제(염기성)를 먹으면 중화되어 속이 편해집니다.',
      },
    ],
  },
];

export function getRubric(unitId: number): UnitRubric | undefined {
  return rubrics.find(r => r.unitId === unitId);
}
