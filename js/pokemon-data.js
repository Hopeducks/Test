// 포켓몬 도감 데이터베이스 (총 40종, 단원별 5종)
// 이미지 소스: https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{id}.png

export const pokemonData = {
  unit1: [ // 지층과 화석 (바위/땅/화석)
    {
      id: 74,
      name: "꼬마돌",
      type: "바위 / 땅",
      rarity: "common",
      rarityKo: "일반",
      catchRate: 0.65,
      hint: "지층이 만들어질 때 함께 단단하게 다져진 듯한 바위 몸체를 가진 포켓몬입니다."
    },
    {
      id: 95,
      name: "롱스톤",
      type: "바위 / 땅",
      rarity: "common",
      rarityKo: "일반",
      catchRate: 0.65,
      hint: "지하 깊은 곳에서 단단한 바위 지층을 파고다니며 자라는 지렁이 모양의 포켓몬입니다."
    },
    {
      id: 139,
      name: "암스타",
      type: "바위 / 물",
      rarity: "rare",
      rarityKo: "희귀",
      catchRate: 0.35,
      hint: "아주 오래전 물속 지층에서 화석으로 자주 발견되는 나선형 껍데기의 고대 포켓몬입니다."
    },
    {
      id: 141,
      name: "투구푸스",
      type: "바위 / 물",
      rarity: "rare",
      rarityKo: "희귀",
      catchRate: 0.35,
      hint: "고대 바다 지층에 묻혀있던 투구 화석에서 부활한, 낫 모양의 손발을 가진 포켓몬입니다."
    },
    {
      id: 142,
      name: "프테라",
      type: "바위 / 비행",
      rarity: "legendary",
      rarityKo: "전설",
      catchRate: 0.10,
      hint: "호박 화석 속에 남아있던 고대 공룡 생물의 유전자를 복원하여 부활시킨 하늘의 황제 포켓몬입니다."
    }
  ],
  unit2: [ // 빛의 성질 (불꽃/전기/빛)
    {
      id: 58,
      name: "가디",
      type: "불꽃",
      rarity: "common",
      rarityKo: "일반",
      catchRate: 0.65,
      hint: "체내의 열을 불꽃 빛으로 뿜어내어 어둠 속을 밝히고 직진하는 불꽃을 쏘아보냅니다."
    },
    {
      id: 171,
      name: "랜턴",
      type: "물 / 전기",
      rarity: "common",
      rarityKo: "일반",
      catchRate: 0.65,
      hint: "바다 깊은 어둠 속에서 빛의 성질을 이용해 강렬한 빛을 뿜어 먹이를 유인하는 포켓몬입니다."
    },
    {
      id: 25,
      name: "피카츄",
      type: "전기",
      rarity: "rare",
      rarityKo: "희귀",
      catchRate: 0.35,
      hint: "볼에서 뿜어져 나오는 전기는 빛의 직진 속도만큼 빠르게 공기 중을 통과하여 뻗어 나갑니다."
    },
    {
      id: 181,
      name: "전룡",
      type: "전기",
      rarity: "rare",
      rarityKo: "희귀",
      catchRate: 0.35,
      hint: "꼬리 끝의 빛이 렌즈를 통과한 것처럼 밝게 굴절하고 반사되어 우주에서도 보일 정도로 강하게 빛납니다."
    },
    {
      id: 145,
      name: "썬더",
      type: "전기 / 비행",
      rarity: "legendary",
      rarityKo: "전설",
      catchRate: 0.10,
      hint: "먹구름 속에서 떨어지는 번개(빛)처럼 무서운 기세로 비행하며 온 세상을 밝히는 전설의 새 포켓몬입니다."
    }
  ],
  unit3: [ // 용해와 용액 (물/얼음)
    {
      id: 7,
      name: "꼬부기",
      type: "물",
      rarity: "common",
      rarityKo: "일반",
      catchRate: 0.65,
      hint: "물(용매)에 소금이나 설탕(용질)을 아주 빠르게 휘저어 용해시킬 것 같은 물대포 기술을 씁니다."
    },
    {
      id: 54,
      name: "고라파덕",
      type: "물",
      rarity: "common",
      rarityKo: "일반",
      catchRate: 0.65,
      hint: "머리가 아파서 늘 고민하지만, 물속에 잠겨있을 때 물체에 작용하는 부력을 직관적으로 이해합니다."
    },
    {
      id: 86,
      name: "쥬쥬",
      type: "물",
      rarity: "rare",
      rarityKo: "희귀",
      catchRate: 0.35,
      hint: "소금이 잘 녹는 따뜻한 물보다 얼음이 떠 있는 차가운 물속을 온종일 헤엄치는 것을 좋아합니다."
    },
    {
      id: 131,
      name: "라프라스",
      type: "물 / 얼음",
      rarity: "rare",
      rarityKo: "희귀",
      catchRate: 0.35,
      hint: "등껍질 위에 사람을 태우고 바다를 건너며, 짠 바닷물(소금 용액)의 진하기를 한눈에 알아봅니다."
    },
    {
      id: 382,
      name: "가이오가",
      type: "물",
      rarity: "legendary",
      rarityKo: "전설",
      catchRate: 0.10,
      hint: "온 세상의 물(용매)을 다스리고 비를 내리게 하여 거대한 해양 바다 용액을 창조한 전설의 포켓몬입니다."
    }
  ],
  unit4: [ // 우리 몸의 구조와 기능 (에스퍼/노말/생명)
    {
      id: 113,
      name: "럭키",
      type: "노말",
      rarity: "common",
      rarityKo: "일반",
      catchRate: 0.65,
      hint: "상처받은 사람이나 포켓몬을 치료해주며, 우리 몸 소화기관의 영양 공급과 체내 밸런스를 돕습니다."
    },
    {
      id: 63,
      name: "캐이시",
      type: "에스퍼",
      rarity: "common",
      rarityKo: "일반",
      catchRate: 0.65,
      hint: "하루에 18시간 동안 잠을 자며 뇌의 신경계 감각 자극과 수면 구조를 재정비하는 포켓몬입니다."
    },
    {
      id: 64,
      name: "윤겔라",
      type: "에스퍼",
      rarity: "rare",
      rarityKo: "희귀",
      catchRate: 0.35,
      hint: "강력한 염력(정신 에너지)을 사용해 몸의 근육과 뼈 구조를 자유자재로 움직이게 만듭니다."
    },
    {
      id: 196,
      name: "에브이",
      type: "에스퍼",
      rarity: "rare",
      rarityKo: "희귀",
      catchRate: 0.35,
      hint: "이마의 보석으로 주변의 자극을 민감하게 수용하며, 온몸의 호흡과 심장 순환을 투시할 수 있습니다."
    },
    {
      id: 150,
      name: "뮤츠",
      type: "에스퍼",
      rarity: "legendary",
      rarityKo: "전설",
      catchRate: 0.10,
      hint: "생명의 유전자 설계와 구조를 인위적으로 재구성해 만든 최강의 인공 생명과학 포켓몬입니다."
    }
  ],
  unit5: [ // 생물과 환경 (풀/벌레/생태계)
    {
      id: 10,
      name: "캐터피",
      type: "벌레",
      rarity: "common",
      rarityKo: "일반",
      catchRate: 0.65,
      hint: "생태계 속에서 생산자인 나뭇잎을 갉아먹으며 에너지를 보충하는 아주 귀여운 1차 소비자입니다."
    },
    {
      id: 43,
      name: "뚜벅초",
      type: "풀 / 독",
      rarity: "common",
      rarityKo: "일반",
      catchRate: 0.65,
      hint: "밤이 되면 흙 밖으로 나와 달빛을 쬐고 영양분을 만드는, 비생물 요소와 밀접한 생산자 포켓몬입니다."
    },
    {
      id: 1,
      name: "이상해씨",
      type: "풀 / 독",
      rarity: "rare",
      rarityKo: "희귀",
      catchRate: 0.35,
      hint: "등 뒤의 씨앗으로 광합성(생산자 작용)을 하며 주변 환경 오염을 막아주는 기특한 포켓몬입니다."
    },
    {
      id: 127,
      name: "쁘사이저",
      type: "벌레",
      rarity: "rare",
      rarityKo: "희귀",
      catchRate: 0.35,
      hint: "숲의 먹이그물 속에서 나무 수액을 차지하기 위해 적응해온 무시무시한 뿔을 가진 벌레 포켓몬입니다."
    },
    {
      id: 251,
      name: "세레비",
      type: "에스퍼 / 풀",
      rarity: "legendary",
      rarityKo: "전설",
      catchRate: 0.10,
      hint: "숲과 시간이 어우러져 흐르는 대자연 속에서 온 생태계의 평형을 완벽하게 수호하는 숲의 신 포켓몬입니다."
    }
  ],
  unit6: [ // 날씨와 우리 생활 (비행/드래곤/얼음)
    {
      id: 16,
      name: "구구",
      type: "노말 / 비행",
      rarity: "common",
      rarityKo: "일반",
      catchRate: 0.65,
      hint: "날개짓을 통해 지표 부근에 작은 기압 차이를 만들어 모래바람을 일으키는 포켓몬입니다."
    },
    {
      id: 351,
      name: "캐스퐁",
      type: "노말",
      rarity: "common",
      rarityKo: "일반",
      catchRate: 0.65,
      hint: "날씨(기온, 습도) 변화에 민감하게 적응하여 비, 눈, 햇빛에 따라 자신의 형태를 자유자재로 바꿉니다."
    },
    {
      id: 144,
      name: "프리져",
      type: "얼음 / 비행",
      rarity: "rare",
      rarityKo: "희귀",
      catchRate: 0.35,
      hint: "구름 속 수증기가 공기 중에서 급격하게 얼어붙을 만큼 차가운 눈바람과 눈을 몰고 다니는 새포켓몬입니다."
    },
    {
      id: 148,
      name: "신용",
      type: "드래곤",
      rarity: "rare",
      rarityKo: "희귀",
      catchRate: 0.35,
      hint: "몸에서 뿜어져 나오는 신비로운 오라로 주변 하늘의 기압을 바꾸고 비와 번개를 동반하는 포켓몬입니다."
    },
    {
      id: 384,
      name: "레쿠쟈",
      type: "드래곤 / 비행",
      rarity: "legendary",
      rarityKo: "전설",
      catchRate: 0.10,
      hint: "머나먼 성층권(하늘 높은 곳)에서 지표의 날씨와 대기 순환을 모두 굽어보고 제어하는 천공의 용신 포켓몬입니다."
    }
  ],
  unit7: [ // 물체의 운동 (강철/격투)
    {
      id: 66,
      name: "알통몬",
      type: "격투",
      rarity: "common",
      rarityKo: "일반",
      catchRate: 0.65,
      hint: "자신의 엄청난 운동 에너지를 발휘하여 무거운 바위를 들어 올리고 힘차게 던지는 근육질 포켓몬입니다."
    },
    {
      id: 81,
      name: "코일",
      type: "전기 / 강철",
      rarity: "common",
      rarityKo: "일반",
      catchRate: 0.65,
      hint: "양쪽 자석에서 나오는 힘으로 중력을 극복하고 공중에 뜬 채 일정한 속력으로 등속 운동을 합니다."
    },
    {
      id: 106,
      name: "시라소몬",
      type: "격투",
      rarity: "rare",
      rarityKo: "희귀",
      catchRate: 0.35,
      hint: "강력한 다리 스프링으로 1초당 놀라운 속력을 내며 돌진하여 목표물을 타격하는 격투 포켓몬입니다."
    },
    {
      id: 448,
      name: "루카리오",
      type: "격투 / 강철",
      rarity: "rare",
      rarityKo: "희귀",
      catchRate: 0.35,
      hint: "파동(오라)의 흐름과 방향의 변동을 읽고, 빛보다 빠른 극비의 움직임 속도로 공간을 돌파합니다."
    },
    {
      id: 376,
      name: "메타그로스",
      type: "강철 / 에스퍼",
      rarity: "legendary",
      rarityKo: "전설",
      catchRate: 0.10,
      hint: "네 개의 뇌가 지닌 뛰어난 속도의 연산 처리로 물체의 제동거리와 궤도를 완벽하게 계산해 돌진하는 무쇠 포켓몬입니다."
    }
  ],
  unit8: [ // 산과 염기 (독/화학)
    {
      id: 23,
      name: "아보",
      type: "독",
      rarity: "common",
      rarityKo: "일반",
      catchRate: 0.65,
      hint: "체내에서 산성 성질을 띠는 무서운 용액인 독을 내뿜어 사냥감을 마비시키는 독사 포켓몬입니다."
    },
    {
      id: 109,
      name: "또가스",
      type: "독",
      rarity: "common",
      rarityKo: "일반",
      catchRate: 0.65,
      hint: "몸 안에 가득 찬 유독한 화학 가스가 풍겨 나와 대기를 탁하게 하고 푸른 리트머스를 붉게 만듭니다."
    },
    {
      id: 88,
      name: "질퍽이",
      type: "독",
      rarity: "rare",
      rarityKo: "희귀",
      catchRate: 0.35,
      hint: "하수구의 유기 유독 폐기물이 섞여 탄생한 포켓몬으로, 닿는 물체는 무엇이든 염기나 산성처럼 삭혀버립니다."
    },
    {
      id: 71,
      name: "우츠보트",
      type: "풀 / 독",
      rarity: "rare",
      rarityKo: "희귀",
      catchRate: 0.35,
      hint: "먹이 주머니 안의 위산과 닮은 매우 강력한 산성 소화액으로 동물을 순식간에 녹여 흡수하는 식물 포켓몬입니다."
    },
    {
      id: 94,
      name: "팬텀",
      type: "고스트 / 독",
      rarity: "legendary",
      rarityKo: "전설",
      catchRate: 0.10,
      hint: "그림자 속에 숨어 화학적 독성 오라를 뿜어내며, 지시약마저 검게 물들여버릴 것 같은 신비로운 고스트 포켓몬입니다."
    }
  ]
};
