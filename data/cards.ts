import { CollectibleCard } from '../types';

export const cards: CollectibleCard[] = [
  // === Unit 1: 지층과 화석 (Earth/Strata and Fossils) ===
  {
    id: "u1_c1",
    rarity: "common",
    unitId: 1,
    name: "꼬마돌",
    image: "🪨",    description: "지층이 만들어질 때 함께 단단하게 다져진 바위 몸체를 가졌습니다. 지층은 오랜 시간 동안 퇴적물이 쌓여 굳어진 것입니다."
  },
  {
    id: "u1_c2",
    rarity: "common",
    unitId: 1,
    name: "롱스톤",
    image: "🐍",
    description: "지하 깊은 곳에서 단단한 바위 지층을 파고다닙니다. 지층은 보통 아래쪽이 위쪽보다 먼저 만들어진 것입니다."
  },
  {
    id: "u1_c3",
    rarity: "common",
    unitId: 1,
    name: "데구리",
    image: "⛰️",
    description: "가파른 산길을 굴러가며 돌을 흡수합니다. 퇴적암은 자갈, 모래, 진흙 등이 다져지고 굳어져 만들어집니다."
  },
  {
    id: "u1_c4",
    rarity: "common",
    unitId: 1,
    name: "딱구리",
    image: "🐢",
    description: "단단한 바위 껍질로 몸을 지킵니다. 모래가 주로 굳어지면 사암, 진흙은 이암, 자갈은 역암이 됩니다."
  },
  {
    id: "u1_c5",
    rarity: "uncommon",
    unitId: 1,
    name: "뿔카노",
    image: "🦏",
    description: "뼈가 매우 단단하여 부딪혀도 끄떡없습니다. 화석은 옛날에 살았던 생물의 몸체나 생활 흔적이 지층에 남아있는 것입니다."
  },
  {
    id: "u1_c6",
    rarity: "uncommon",
    unitId: 1,
    name: "코코리",
    image: "🐘",
    description: "흙을 파는 것을 좋아하는 아기 포켓몬입니다. 화석을 통해 그 지층이 만들어질 당시의 자연환경을 짐작할 수 있습니다."
  },
  {
    id: "u1_c7",
    rarity: "rare",
    unitId: 1,
    name: "투구",
    image: "🐚",
    description: "바다 지층에서 삼엽충 화석처럼 발견되는 고대 포켓몬입니다. 삼엽충 화석은 그곳이 과거에 바다였음을 알려줍니다."
  },
  {
    id: "u1_c8",
    rarity: "rare",
    unitId: 1,
    name: "암스타",
    image: "🦑",
    description: "나선형 껍데기가 암모나이트 화석을 닮았습니다. 공룡이나 암모나이트 화석은 그 시대를 대표하는 표준화석입니다."
  },
  {
    id: "u1_c9",
    rarity: "epic",
    unitId: 1,
    name: "투구푸스",
    image: "🦀",
    description: "고대 바다에서 수영하며 사냥했던 고대 생물입니다. 생물이 죽은 후 빠르게 묻혀서 화석화되어야 화석이 됩니다."
  },
  {
    id: "u1_c10",
    rarity: "legendary",
    unitId: 1,
    name: "프테라",
    image: "🦖",    description: "호박 화석 속에 남아있던 유전자를 복원해 부활시킨 전설의 포켓몬입니다. 단층과 습곡 등 큰 지각 변동을 이겨내고 되살아났습니다."
  },

  // === Unit 2: 빛의 성질 (Light/Properties of Light) ===
  {
    id: "u2_c1",
    rarity: "common",
    unitId: 2,
    name: "가디",
    image: "🐕",    description: "빛이 직진하듯이 곧은 마음을 가졌습니다. 빛은 장애물이 없으면 사방으로 똑바로 곧게 나아갑니다."
  },
  {
    id: "u2_c2",
    rarity: "common",
    unitId: 2,
    name: "랜턴",
    image: "🐟",    description: "머리의 등불로 어둠 속을 비춥니다. 우리가 물체를 보려면 물체에서 반사된 빛이 우리 눈으로 들어와야 합니다."
  },
  {
    id: "u2_c3",
    rarity: "common",
    unitId: 2,
    name: "파이리",
    image: "🦎",    description: "꼬리의 불꽃으로 주변을 밝힙니다. 빛은 스스로 빛을 내는 광원으로부터 사방으로 퍼져 나갑니다."
  },
  {
    id: "u2_c4",
    rarity: "common",
    unitId: 2,
    name: "브케인",
    image: "🦔",    description: "등에서 불꽃을 뿜어냅니다. 어두운 방에서 물체를 보려면 반드시 빛과 이를 감지하는 눈이 필요합니다."
  },
  {
    id: "u2_c5",
    rarity: "uncommon",
    unitId: 2,
    name: "메리프",
    image: "🐑",    description: "솜털 피부에 전기를 모아 빛을 냅니다. 거울에 빛을 비추면 빛이 부딪혀 꺾여 나가는 반사 현상이 일어납니다."
  },
  {
    id: "u2_c6",
    rarity: "uncommon",
    unitId: 2,
    name: "볼비트",
    image: "🪰",    description: "빛의 반사를 이용해 밤하늘에 신호를 보냅니다. 평면거울은 물체의 실제 크기와 같지만 좌우를 반대로 보여줍니다."
  },
  {
    id: "u2_c7",
    rarity: "rare",
    unitId: 2,
    name: "피카츄",
    image: "⚡",    description: "볼에서 뿜어져 나오는 전기는 빛처럼 빠릅니다. 빛이 공기에서 물로 나아갈 때 꺾이는 현상을 굴절이라고 합니다."
  },
  {
    id: "u2_c8",
    rarity: "rare",
    unitId: 2,
    name: "전룡",
    image: "🦒",    description: "꼬리 끝의 불빛은 렌즈를 통과한 것처럼 굴절됩니다. 오목렌즈는 빛을 퍼지게 하여 물체를 항상 작고 바르게 보이게 합니다."
  },
  {
    id: "u2_c9",
    rarity: "epic",
    unitId: 2,
    name: "쥬피썬더",
    image: "🦊",    description: "날카로운 가시 털을 빛처럼 쏘아 보냅니다. 볼록렌즈는 빛을 한곳으로 모아주어 물체를 가깝게 볼 때 확대해 보여줍니다."
  },
  {
    id: "u2_c10",
    rarity: "legendary",
    unitId: 2,
    name: "썬더",
    image: "🦅",    description: "번개의 빛으로 온 세상을 비추는 전설의 새입니다. 잠망경은 평면거울의 반사 원리를 활용하여 높은 곳이나 장애물 너머를 보게 해줍니다."
  },

  // === Unit 3: 용해와 용액 (Water/Dissolution and Solutions) ===
  {
    id: "u3_c1",
    rarity: "common",
    unitId: 3,
    name: "꼬부기",
    image: "🐢",    description: "물대포로 용질을 빠르게 녹입니다. 소금이나 설탕 같은 용질이 물(용매)에 섞여 들어가는 현상을 용해라고 합니다."
  },
  {
    id: "u3_c2",
    rarity: "common",
    unitId: 3,
    name: "고라파덕",
    image: "🦆",    description: "물속에 떠오르는 부력을 직관적으로 느낍니다. 용액은 시간이 지나도 가라앉지 않고 모든 부분의 성질이 같습니다."
  },
  {
    id: "u3_c3",
    rarity: "common",
    unitId: 3,
    name: "크랩",
    image: "🦀",    description: "거품을 뿜어내며 용액을 저어줍니다. 유리 막대로 용질을 저어주거나 가루로 만들면 용해 속도가 빨라집니다."
  },
  {
    id: "u3_c4",
    rarity: "common",
    unitId: 3,
    name: "콘치",
    image: "🐠",    description: "투명하고 맑은 용액 속을 우아하게 헤엄칩니다. 물 100g에 설탕 20g을 녹이면 설탕물 전체 무게는 정확히 120g이 됩니다."
  },
  {
    id: "u3_c5",
    rarity: "uncommon",
    unitId: 3,
    name: "셀러",
    image: "🦪",    description: "껍질을 닫아 염분 용액을 보존합니다. 일반적으로 고체 용질은 물의 온도가 높을수록 더 많이 녹습니다."
  },
  {
    id: "u3_c6",
    rarity: "uncommon",
    unitId: 3,
    name: "발챙이",
    image: "🌀",    description: "배의 소용돌이 모양처럼 용액을 회전시킵니다. 용액의 진하기는 색깔, 맛, 또는 물체가 뜨는 정도로 비교할 수 있습니다."
  },
  {
    id: "u3_c7",
    rarity: "rare",
    unitId: 3,
    name: "쥬쥬",
    image: "🦭",    description: "차가운 물(용매) 속을 헤엄쳐 다닙니다. 백반 용액을 식히면 녹아 있던 백반이 다시 하얀 알갱이로 나오는 석출 현상이 생깁니다."
  },
  {
    id: "u3_c8",
    rarity: "rare",
    unitId: 3,
    name: "라프라스",
    image: "🦕",    description: "바닷물 용액의 진하기를 가장 잘 구별합니다. 용액이 진할수록 밀도가 높아져 방울토마토나 메추리알을 높이 띄웁니다."
  },
  {
    id: "u3_c9",
    rarity: "epic",
    unitId: 3,
    name: "아쿠스타",
    image: "⭐",    description: "나선형으로 회전하며 소금을 결정화합니다. 흙탕물이나 미숫가루 물은 시간이 지나면 가라앉으므로 용액이 아닙니다."
  },
  {
    id: "u3_c10",
    rarity: "legendary",
    unitId: 3,
    name: "가이오가",
    image: "🐳",    description: "거대한 바다 용액을 다스리는 전설의 포켓몬입니다. 온 세상의 용매와 용질의 상호작용을 주관하여 수권의 평형을 유지합니다."
  },

  // === Unit 4: 우리 몸의 구조와 기능 (Biology/Structure and Function of Our Body) ===
  {
    id: "u4_c1",
    rarity: "common",
    unitId: 4,
    name: "럭키",
    image: "🥚",    description: "상처를 치료하고 우리 몸의 체내 밸런스를 지켜줍니다. 뼈는 몸의 형태를 유지하고 장기를 보호하는 지지대 역할을 합니다."
  },
  {
    id: "u4_c2",
    rarity: "common",
    unitId: 4,
    name: "캐이시",
    image: "🐨",    description: "하루 18시간 동안 잠을 자며 뇌 신경계를 정비합니다. 근육이 수축하고 이완되면서 뼈를 당겨 몸을 움직이게 합니다."
  },
  {
    id: "u4_c3",
    rarity: "common",
    unitId: 4,
    name: "슬리프",
    image: "🐘",    description: "꿈을 먹으며 수면 주기를 조절합니다. 소화는 영양소를 몸에 흡수되도록 잘게 쪼개는 과정으로, 식도와 위, 소장을 거칩니다."
  },
  {
    id: "u4_c4",
    rarity: "common",
    unitId: 4,
    name: "메가니움",
    image: "🦕",    description: "싱그러운 향기로 호흡 기관을 정화합니다. 공기는 코, 기관, 기관지를 거쳐 폐로 들어가며 산소와 이산화탄소를 교환합니다."
  },
  {
    id: "u4_c5",
    rarity: "uncommon",
    unitId: 4,
    name: "야도란",
    image: "🐚",    description: "느긋한 성격으로 심장박동을 안정시킵니다. 심장과 혈관은 피를 온몸으로 순환시켜 산소와 영양소를 전달하는 순환 기관입니다."
  },
  {
    id: "u4_c6",
    rarity: "uncommon",
    unitId: 4,
    name: "마임맨",
    image: "🤡",    description: "감각 기관의 자극을 마임으로 표현합니다. 감각 기관(눈, 코, 귀, 혀, 피부)은 자극을 신경을 통해 뇌로 전달합니다."
  },
  {
    id: "u4_c7",
    rarity: "rare",
    unitId: 4,
    name: "윤겔라",
    image: "🦊",    description: "강력한 염력으로 신경계를 자극합니다. 신장(콩팥)은 혈액 속의 노폐물을 걸러 오줌으로 내보내는 대표적인 배설 기관입니다."
  },
  {
    id: "u4_c8",
    rarity: "rare",
    unitId: 4,
    name: "에브이",
    image: "🐈",    description: "이마의 보석으로 자극을 민감하게 감지합니다. 소장은 음식물의 영양소를 최종 분해하고 내벽의 융털로 대부분 흡수합니다."
  },
  {
    id: "u4_c9",
    rarity: "epic",
    unitId: 4,
    name: "해피너스",
    image: "🧚",    description: "해피니스 에너지를 뿜어 소화를 도우며 장운동을 돕습니다. 대장은 영양분 흡수 후 남은 찌꺼기에서 주로 수분을 흡수합니다."
  },
  {
    id: "u4_c10",
    rarity: "legendary",
    unitId: 4,
    name: "뮤츠",
    image: "👽",    description: "생명의 유전자를 인위적으로 재구성한 전설의 에스퍼 포켓몬입니다. 뇌는 자극을 판단하고 행동을 명령하는 신경계의 최고 중추입니다."
  },

  // === Unit 5: 생물과 환경 (Nature/Living Things and Environment) ===
  {
    id: "u5_c1",
    rarity: "common",
    unitId: 5,
    name: "캐터피",
    image: "🐛",    description: "생산자인 나뭇잎을 갉아먹는 귀여운 1차 소비자입니다. 생산자는 햇빛을 이용해 스스로 양분을 만드는 생물입니다."
  },
  {
    id: "u5_c2",
    rarity: "common",
    unitId: 5,
    name: "뚜벅초",
    image: "🌱",    description: "밤이 되면 흙 밖으로 나와 영양분을 만드는 생산자입니다. 소비자는 스스로 양분을 못 만들고 다른 생물을 먹습니다."
  },
  {
    id: "u5_c3",
    rarity: "common",
    unitId: 5,
    name: "단데기",
    image: "🟢",    description: "움직이지 않고 번데기 속에서 주변 환경에 적응합니다. 분해자(버섯, 곰팡이, 세균)는 생물의 사체를 썩혀 분해합니다."
  },
  {
    id: "u5_c4",
    rarity: "common",
    unitId: 5,
    name: "버터플",
    image: "🦋",    description: "꽃의 가루받이를 도우며 환경과 상호작용합니다. 생태계는 생물 요소와 비생물 요소(햇빛, 물, 온도, 흙)로 구성됩니다."
  },
  {
    id: "u5_c5",
    rarity: "uncommon",
    unitId: 5,
    name: "파라스",
    image: "🍄",    description: "등에 달린 동충하초 버섯은 훌륭한 분해자 역할을 합니다. 먹이사슬이 복잡하게 얽혀 있는 구조를 먹이그물이라고 합니다."
  },
  {
    id: "u5_c6",
    rarity: "uncommon",
    unitId: 5,
    name: "모부기",
    image: "🐢",    description: "등 위에 작은 숲 생태계를 지닌 아기 포켓몬입니다. 먹이그물이 복잡할수록 생태계 평형이 안정적으로 유지됩니다."
  },
  {
    id: "u5_c7",
    rarity: "rare",
    unitId: 5,
    name: "이상해씨",
    image: "🐸",    description: "광합성을 통해 숲의 에너지를 순환시킵니다. 생물이 서식지 환경에 맞게 형태나 생활 방식을 바꾸는 것을 적응이라고 합니다."
  },
  {
    id: "u5_c8",
    rarity: "rare",
    unitId: 5,
    name: "쁘사이저",
    image: "🦂",    description: "숲속 나무 수액을 얻기 위해 뿔을 단단하게 적응시켰습니다. 생태계 생물의 종류와 수는 일정하게 평형을 유지합니다."
  },
  {
    id: "u5_c9",
    rarity: "epic",
    unitId: 5,
    name: "스라크",
    image: "🦗",    description: "풀숲의 초록색 몸체로 적들에게 들키지 않게 보호색을 띱니다. 사람은 플라스틱 쓰레기 등으로 생태계를 파괴하면 안 됩니다."
  },
  {
    id: "u5_c10",
    rarity: "legendary",
    unitId: 5,
    name: "세레비",
    image: "🧚‍♂️",    description: "숲과 시간의 흐름 속에서 대자연의 평형을 완벽히 수호하는 신입니다. 비생물 요소와 생물 요소가 조화롭게 공존하도록 돕습니다."
  },

  // === Unit 6: 날씨와 우리 생활 (Weather/Weather and Our Life) ===
  {
    id: "u6_c1",
    rarity: "common",
    unitId: 6,
    name: "구구",
    image: "🐦",    description: "날갯짓으로 지표 근처에 약한 기압 차를 일으켜 바람을 만듭니다. 공기의 압력인 기압 차이 때문에 바람이 붑니다."
  },
  {
    id: "u6_c2",
    rarity: "common",
    unitId: 6,
    name: "캐스퐁",
    image: "⛅",    description: "날씨(기온, 습도) 변화에 따라 모습을 바꿉니다. 공기 중 포함된 수증기의 양이나 습한 정도를 습도라고 합니다."
  },
  {
    id: "u6_c3",
    rarity: "common",
    unitId: 6,
    name: "깨비참",
    image: "🦅",    description: "먹구름을 뚫고 지나가며 날씨를 관찰합니다. 이슬은 밤에 기온이 낮아져 지표 근처 수증기가 물방울로 응결한 것입니다."
  },
  {
    id: "u6_c4",
    rarity: "common",
    unitId: 6,
    name: "야부엉",
    image: "🦉",    description: "밤하늘의 찬 공기와 구름의 높이를 꿰뚫어 봅니다. 안개는 밤사이 지표면 부근의 수증기가 미세한 물방울로 뜬 것입니다."
  },
  {
    id: "u6_c5",
    rarity: "uncommon",
    unitId: 6,
    name: "포포니",
    image: "🐱",    description: "겨울철 한랭건조한 시베리아 바람에 털을 세웁니다. 바람은 기압이 높은 고기압에서 낮은 저기압으로 불어갑니다."
  },
  {
    id: "u6_c6",
    rarity: "uncommon",
    unitId: 6,
    name: "흔들풍손",
    image: "🎈",    description: "따뜻해진 공기가 가벼워져 위로 상승하듯 하늘로 둥실 떠오릅니다. 지표면이 데워지면 상승 기류가 생깁니다."
  },
  {
    id: "u6_c7",
    rarity: "rare",
    unitId: 6,
    name: "프리져",
    image: "❄️",    description: "차가운 눈바람과 눈을 내리는 전설의 얼음 새입니다. 눈은 상층 구름 속 얼음 알갱이가 지상 기온이 낮아 안 녹고 내린 것입니다."
  },
  {
    id: "u6_c8",
    rarity: "rare",
    unitId: 6,
    name: "신용",
    image: "🐉",    description: "주변 하늘의 기압을 바꾸어 비구름을 불러 모읍니다. 구름은 위로 올라간 공기가 팽창, 냉각하여 물방울이나 얼음이 된 것입니다."
  },
  {
    id: "u6_c9",
    rarity: "epic",
    unitId: 6,
    name: "망나뇽",
    image: "🦕",    description: "태풍이나 폭풍우 속에서도 안전하게 비행하며 바다를 지킵니다. 여름철에는 남동쪽 고온다습한 기단의 영향을 많이 받습니다."
  },
  {
    id: "u6_c10",
    rarity: "legendary",
    unitId: 6,
    name: "레쿠쟈",
    image: "🐉",    description: "성층권 높은 기압 속에서 지구 전체의 기상 현상을 다스리는 용입니다. 낮에는 육지가 빨리 데워져 바다에서 해풍이 붑니다."
  },

  // === Unit 7: 물체의 운동 (Motion/Motion of Objects) ===
  {
    id: "u7_c1",
    rarity: "common",
    unitId: 7,
    name: "알통몬",
    image: "💪",    description: "엄청난 근육으로 돌을 멀리 던져 운동 상태를 만듭니다. 운동은 시간에 따라 물체의 위치가 변하는 현상입니다."
  },
  {
    id: "u7_c2",
    rarity: "common",
    unitId: 7,
    name: "코일",
    image: "🧲",    description: "자기력으로 공중에 뜬 채 일정한 속력으로 등속 운동을 합니다. 속력은 물체가 단위 시간 동안 이동한 거리입니다."
  },
  {
    id: "u7_c3",
    rarity: "common",
    unitId: 7,
    name: "배루키",
    image: "🥊",    description: "빠르게 펀치를 뻗어 이동 속력을 높입니다. 같은 거리를 이동할 때는 걸린 시간이 짧을수록 속력이 빠릅니다."
  },
  {
    id: "u7_c4",
    rarity: "common",
    unitId: 7,
    name: "무장조",
    image: "🛡️",    description: "강철 날개로 공기 저항을 뚫고 일정한 방향으로 비행합니다. 시속은 한 시간 동안 이동한 거리를 기반으로 한 속력 단위입니다."
  },
  {
    id: "u7_c5",
    rarity: "uncommon",
    unitId: 7,
    name: "동미러",
    image: "🪙",    description: "회전하며 튕겨 나가 충격을 운동 에너지로 전환합니다. 10초 동안 달릴 때 이동한 거리가 길수록 속력이 빠릅니다."
  },
  {
    id: "u7_c6",
    rarity: "uncommon",
    unitId: 7,
    name: "쏘콘",
    image: "🌰",    description: "단단한 껍질 속에 숨어 비탈길을 빠르게 굴러내려 갑니다. 이동거리는 물체의 속력과 걸린 시간을 곱하여 구합니다."
  },
  {
    id: "u7_c7",
    rarity: "rare",
    unitId: 7,
    name: "시라소몬",
    image: "🦵",    description: "강력한 발차기로 엄청난 순발력과 가속을 냅니다. 속력을 비교할 때는 거리를 같게 하거나 시간을 같게 하여 비교합니다."
  },
  {
    id: "u7_c8",
    rarity: "rare",
    unitId: 7,
    name: "루카리오",
    image: "🐺",    description: "파동의 힘으로 상대방의 속력과 궤도를 미리 읽어냅니다. 태풍의 속도나 바람의 빠르기 풍속도 속력 단위를 사용합니다."
  },
  {
    id: "u7_c9",
    rarity: "epic",
    unitId: 7,
    name: "레어코일",
    image: "📡",    description: "코일 세 개가 결합하여 강력한 자기 부상 가속을 냅니다. 과속하면 브레이크 시 제동거리가 길어집니다."
  },
  {
    id: "u7_c10",
    rarity: "legendary",
    unitId: 7,
    name: "메타그로스",
    image: "🤖",    description: "네 개의 뇌로 모든 물체의 제동거리와 궤도를 연산하는 강철 로봇입니다. 60km/h로 3시간 달리면 이동 거리는 180km가 됩니다."
  },

  // === Unit 8: 산과 염기 (Chemistry/Acids and Bases) ===
  {
    id: "u8_c1",
    rarity: "common",
    unitId: 8,
    name: "아보",
    image: "🐍",    description: "시큼하고 강력한 산성 독액을 내뿜습니다. 산성 용액은 신맛이 나고 푸른색 리트머스 종이를 붉게 만듭니다."
  },
  {
    id: "u8_c2",
    rarity: "common",
    unitId: 8,
    name: "또가스",
    image: "☁️",    description: "가스 성분으로 주변 대기를 산성화시킵니다. 붉은 양배추 천연 지시약은 산성 물질과 섞이면 붉은색 계열로 변합니다."
  },
  {
    id: "u8_c3",
    rarity: "common",
    unitId: 8,
    name: "질퍽이",
    image: "☣️",    description: "미끈거리는 하수구의 진흙 염기성 폐기물 포켓몬입니다. 염기성은 붉은색 리트머스 종이를 푸른색으로 변화시킵니다."
  },
  {
    id: "u8_c4",
    rarity: "common",
    unitId: 8,
    name: "니드런",
    image: "🐹",    description: "뿔의 독침 속에 산성 물질을 함유하고 있습니다. 페놀프탈레인 용액은 염기성을 만나면 강렬한 붉은색(분홍색)이 됩니다."
  },
  {
    id: "u8_c5",
    rarity: "uncommon",
    unitId: 8,
    name: "주뱃",
    image: "🦇",    description: "어두운 동굴 속 염기성 박쥐 배설물 더미에서 살아갑니다. 산성 용액과 염기성 용액을 섞으면 성질이 약해지는 중화 반응이 일어납니다."
  },
  {
    id: "u8_c6",
    rarity: "uncommon",
    unitId: 8,
    name: "삐딱구리",
    image: "🐸",    description: "피부에서 끈적이고 미끄러운 염기성 독액을 뿜어냅니다. 염기성 용액은 단백질을 녹이는 성질이 있어 손끝에 닿으면 미끄럽습니다."
  },
  {
    id: "u8_c7",
    rarity: "rare",
    unitId: 8,
    name: "아보크",
    image: "🦖",    description: "몸집을 키워 산성 위산을 과다하게 분비해 통째로 삼깁니다. 위산이 너무 나와 속이 쓰릴 때는 제산제(약염기성)를 먹어 중화합니다."
  },
  {
    id: "u8_c8",
    rarity: "rare",
    unitId: 8,
    name: "또도가스",
    image: "💨",    description: "화학 반응을 통해 이산화탄소 기체를 방출합니다. 달걀 껍데기(탄산칼슘)를 산성 용액에 넣으면 이산화탄소 기체가 나옵니다."
  },
  {
    id: "u8_c9",
    rarity: "epic",
    unitId: 8,
    name: "우츠보트",
    image: "🪴",    description: "곤충을 녹이는 매우 강력한 산성 소화액 주머니 식물입니다. 염기성 물질을 다룰 때는 보안경과 실험용 장갑을 착용해야 합니다."
  },
  {
    id: "u8_c10",
    rarity: "legendary",
    unitId: 8,
    name: "팬텀",
    image: "😈",    description: "지시약의 색마저 어둡게 물들여버리는 전설의 고스트입니다. 생선 비린내(염기성)에 식초(산성)를 뿌리는 것도 중화 반응의 예입니다."
  }
];
