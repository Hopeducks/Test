import { ShortQuestion } from '../types';

export const shortQuestions: ShortQuestion[] = [
  { id: 'u1_s1', unitId: 1, type: 'short', question: '생물의 몸 일부나 흔적이 암석에 보존된 것을 무엇이라고 하나요?', correctAnswer: '화석', acceptedAnswers: ['화석', 'fossil'], explanation: '화석은 과거 생물의 몸이나 흔적(발자국, 알 등)이 암석 속에 보존된 것입니다.', difficulty: 'easy', cardReward: 'u1_c10' },
  { id: 'u2_s1', unitId: 2, type: 'short', question: '빛이 한 매질에서 다른 매질로 들어갈 때 경계면에서 방향이 꺾이는 현상을 무엇이라고 하나요?', correctAnswer: '굴절', acceptedAnswers: ['굴절', '빛의 굴절', 'refraction'], explanation: '굴절은 빛이 물이나 유리 같은 다른 매질로 들어갈 때 속도가 변해 방향이 바뀌는 현상입니다.', difficulty: 'medium' },
  { id: 'u3_s1', unitId: 3, type: 'short', question: '소금물에서 소금처럼 다른 물질에 녹는 물질을 무엇이라고 하나요?', correctAnswer: '용질', acceptedAnswers: ['용질', '녹는 물질'], explanation: '용질은 용매에 녹아 용액을 만드는 물질입니다. 소금물에서 소금이 용질입니다.', difficulty: 'easy' },
  { id: 'u4_s1', unitId: 4, type: 'short', question: '혈액을 온몸으로 순환시키는 펌프 역할을 하는 기관은 무엇인가요?', correctAnswer: '심장', acceptedAnswers: ['심장', '염통'], explanation: '심장은 근육으로 이루어진 펌프로, 규칙적으로 수축·이완하며 혈액을 순환시킵니다.', difficulty: 'easy', cardReward: 'u4_c1' },
  { id: 'u5_s1', unitId: 5, type: 'short', question: '광합성으로 스스로 양분을 만드는 생물을 생태계에서 무엇이라고 하나요?', correctAnswer: '생산자', acceptedAnswers: ['생산자', '식물', '광합성 생물'], explanation: '식물은 태양 에너지를 이용해 이산화탄소와 물로 포도당을 만드는 생산자입니다.', difficulty: 'easy' },
  { id: 'u6_s1', unitId: 6, type: 'short', question: '공기 중 수증기의 양을 나타내는 척도로 보통 퍼센트(%)로 표현하는 것을 무엇이라고 하나요?', correctAnswer: '습도', acceptedAnswers: ['습도', '상대습도'], explanation: '습도는 현재 공기 중 수증기의 양이 포화 수증기량에 대한 비율입니다.', difficulty: 'medium' },
  { id: 'u7_s1', unitId: 7, type: 'short', question: '이동한 거리를 걸린 시간으로 나눈 값을 무엇이라고 하나요?', correctAnswer: '속력', acceptedAnswers: ['속력', '빠르기', 'speed'], explanation: '속력(m/s) = 이동 거리(m) ÷ 걸린 시간(s). 방향을 포함하면 속도가 됩니다.', difficulty: 'easy' },
  { id: 'u8_s1', unitId: 8, type: 'short', question: '산과 염기가 반응하여 서로의 성질을 잃는 반응을 무엇이라고 하나요?', correctAnswer: '중화', acceptedAnswers: ['중화', '중화 반응', '중화반응'], explanation: '산의 H⁺과 염기의 OH⁻가 결합하여 물을 생성하는 반응을 중화 반응이라 합니다.', difficulty: 'medium', cardReward: 'u8_c1' },
];
