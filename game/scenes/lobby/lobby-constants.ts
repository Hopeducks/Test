export interface Portal {
  zoneName: string;
  x: number;
  y: number;
  radius: number;
  unitId?: number;
  color?: number;
}

export interface NpcData {
  name: string;
  emoji: string;
  initialX: number;
  initialY: number;
}

export const UNIT_THEMES: { color: number; name: string; emoji: string }[] = [
  { color: 0xb5651d, name: '지층과 화석',      emoji: '🪨' },
  { color: 0xfde047, name: '빛과 렌즈',        emoji: '🔭' },
  { color: 0x06b6d4, name: '용액의 성질',      emoji: '🧪' },
  { color: 0xef4444, name: '우리 몸',          emoji: '❤️' },
  { color: 0x22c55e, name: '생태계와 환경',    emoji: '🌿' },
  { color: 0x7dd3fc, name: '날씨와 우리 생활', emoji: '🌤️' },
  { color: 0xf97316, name: '물체의 속력',      emoji: '💨' },
  { color: 0xa855f7, name: '산과 염기',        emoji: '⚗️' },
];

export const SCIENTIST_TRIVIA: string[] = [
  "지층은 오랜 시간 동안 흙이나 모래가 쌓여서 만들어진단다!",
  "빛은 물체를 만나면 반사하거나 굴절하는 성질이 있어.",
  "소금이나 설탕이 물에 녹는 현상을 '용해'라고 해.",
  "우리 몸의 심장은 온몸으로 피를 보내는 펌프 역할을 한단다.",
  "식물은 햇빛을 받아 스스로 영양분을 만드는 광합성을 해.",
  "비가 내리는 날씨는 대기 중의 수증기가 물방울이 되어 떨어지는 거야.",
  "물체의 빠르기는 일정한 거리 동안 걸린 시간으로 나타내지.",
  "식초는 산성이고, 비눗물은 염기성이란다!"
];
