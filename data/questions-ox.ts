import { OXQuestion } from '../types';

export const oxQuestions: OXQuestion[] = [
  { id: 'u1_ox1', unitId: 1, type: 'ox', question: '퇴적암은 화성암보다 더 높은 온도에서 만들어진다.', correctIndex: 1, explanation: '퇴적암은 높은 온도가 아닌 퇴적물의 압력과 굳음으로 만들어집니다. 마그마에서 만들어지는 것은 화성암입니다.', difficulty: 'easy', cardReward: 'u1_c1' },
  { id: 'u1_ox2', unitId: 1, type: 'ox', question: '화석은 지층이 쌓인 순서를 알려주어 지질 시대 구분에 도움을 준다.', correctIndex: 0, explanation: '표준 화석은 특정 지질 시대를 나타내므로 지층의 나이와 환경을 알아내는 데 사용됩니다.', difficulty: 'easy' },
  { id: 'u2_ox1', unitId: 2, type: 'ox', question: '빛은 진공에서도 전달된다.', correctIndex: 0, explanation: '빛은 전자기파이므로 매질 없이 진공에서도 전달됩니다.', difficulty: 'easy' },
  { id: 'u2_ox2', unitId: 2, type: 'ox', question: '모든 물체는 빛을 반사한다.', correctIndex: 0, explanation: '우리가 물체를 볼 수 있는 것은 물체가 빛을 반사하기 때문입니다.', difficulty: 'easy' },
  { id: 'u3_ox1', unitId: 3, type: 'ox', question: '설탕을 물에 녹이면 설탕이 사라진다.', correctIndex: 1, explanation: '설탕은 물에 녹아도 없어지지 않고 용액 속에 고르게 퍼져 있습니다.', difficulty: 'easy' },
  { id: 'u3_ox2', unitId: 3, type: 'ox', question: '용질의 양이 많을수록 용액의 농도가 높아진다.', correctIndex: 0, explanation: '같은 양의 용매에 용질이 많이 녹을수록 농도가 높아집니다.', difficulty: 'medium' },
  { id: 'u4_ox1', unitId: 4, type: 'ox', question: '폐는 산소와 이산화탄소를 교환하는 기관이다.', correctIndex: 0, explanation: '폐의 폐포에서 산소를 혈액으로 넣고 이산화탄소를 내보내는 기체 교환이 일어납니다.', difficulty: 'easy' },
  { id: 'u4_ox2', unitId: 4, type: 'ox', question: '소화 기관에는 위, 소장, 대장이 포함된다.', correctIndex: 0, explanation: '소화 기관은 음식물이 이동하며 소화되는 기관으로 위, 소장, 대장이 모두 포함됩니다.', difficulty: 'easy' },
  { id: 'u5_ox1', unitId: 5, type: 'ox', question: '먹이 사슬에서 생산자는 동물이다.', correctIndex: 1, explanation: '생산자는 광합성으로 스스로 양분을 만드는 식물입니다. 동물은 소비자입니다.', difficulty: 'easy' },
  { id: 'u5_ox2', unitId: 5, type: 'ox', question: '생태계에서 분해자는 죽은 생물의 유기물을 무기물로 분해한다.', correctIndex: 0, explanation: '세균과 곰팡이 같은 분해자는 죽은 생물을 무기물로 분해하여 물질 순환에 기여합니다.', difficulty: 'medium' },
  { id: 'u6_ox1', unitId: 6, type: 'ox', question: '구름은 수증기가 응결되어 만들어진 작은 물방울이나 얼음 알갱이의 집합이다.', correctIndex: 0, explanation: '수증기가 차가운 공기를 만나 응결되면 작은 물방울이나 얼음 알갱이로 변해 구름을 형성합니다.', difficulty: 'easy' },
  { id: 'u6_ox2', unitId: 6, type: 'ox', question: '기온이 높을수록 포화 수증기량이 적어진다.', correctIndex: 1, explanation: '기온이 높을수록 공기가 더 많은 수증기를 품을 수 있어 포화 수증기량이 증가합니다.', difficulty: 'medium' },
  { id: 'u7_ox1', unitId: 7, type: 'ox', question: '속력은 이동 거리를 걸린 시간으로 나눈 값이다.', correctIndex: 0, explanation: '속력(m/s) = 이동 거리(m) ÷ 걸린 시간(s) 입니다.', difficulty: 'easy' },
  { id: 'u7_ox2', unitId: 7, type: 'ox', question: '무거운 물체는 항상 가벼운 물체보다 빠르게 떨어진다.', correctIndex: 1, explanation: '공기 저항이 없을 때 무게와 관계없이 모든 물체는 같은 속도로 떨어집니다(자유 낙하).', difficulty: 'medium' },
  { id: 'u8_ox1', unitId: 8, type: 'ox', question: '산은 리트머스 종이를 파란색에서 빨간색으로 변화시킨다.', correctIndex: 0, explanation: '산성 용액은 파란색 리트머스 종이를 빨간색으로 변화시킵니다.', difficulty: 'easy' },
  { id: 'u8_ox2', unitId: 8, type: 'ox', question: '염기는 신맛이 나고 금속과 반응하면 수소 기체를 발생시킨다.', correctIndex: 1, explanation: '신맛과 금속 반응으로 수소 발생은 산의 특성입니다. 염기는 쓴맛이 나고 미끌거리는 성질이 있습니다.', difficulty: 'medium' },
];
