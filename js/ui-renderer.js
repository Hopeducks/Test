// UI 동적 렌더링 엔진 모듈
import { quizData } from './quiz-data.js';
import { pokemonData } from './pokemon-data.js';
import { gameState } from './game-state.js';
import { gameAudio } from './audio.js';

// SVG 아이콘 모음 (외부 리소스 의존 배제용)
const ICONS = {
  play: `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`,
  back: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>`,
  dashboard: `<svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`,
  pokedex: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2" fill="none"/><path d="M8 17h8" stroke="currentColor" stroke-width="2"/></svg>`,
  settings: `<svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>`,
  bulb: `<svg viewBox="0 0 24 24"><path d="M12 2C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.65 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.65-.8 3.16-2.15 4.1zM9 20h6v1H9z"/></svg>`,
  correct: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`,
  wrong: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>`,
  pokeball: `
    <svg viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="46" stroke="#222" stroke-width="6" fill="#fff" />
      <path d="M7 50A43 43 0 0 1 93 50Z" fill="currentColor" />
      <line x1="4" y1="50" x2="96" y2="50" stroke="#222" stroke-width="6" />
      <circle cx="50" cy="50" r="18" stroke="#222" stroke-width="6" fill="#fff" />
      <circle cx="50" cy="50" r="8" fill="#555" />
    </svg>`
};

class UIRenderer {
  constructor() {
    this.appContainer = document.getElementById('app');
    this.activeScreen = 'dashboard';
    
    // 테마별 RGB 매핑 (도감 슬롯 개별 배경색 등에 활용)
    this.themeRgb = {
      earth: '229, 169, 59',
      light: '245, 224, 37',
      water: '37, 192, 245',
      biology: '245, 37, 136',
      nature: '37, 245, 100',
      weather: '216, 224, 232',
      motion: '245, 80, 37',
      chemistry: '160, 37, 245'
    };
  }

  // 화면 뼈대 및 기본 헤더 구성
  createBaseLayout() {
    this.appContainer.innerHTML = `
      <header class="app-header">
        <div class="logo-section">
          <div class="logo-icon">${ICONS.pokeball}</div>
          <h1 class="app-title">과학 마스터 도감</h1>
        </div>
        <div class="header-status">
          보유 볼: <span id="header-ball-count">${gameState.state.inventory.pokeBall + gameState.state.inventory.greatBall + gameState.state.inventory.ultraBall + gameState.state.inventory.masterBall}</span>개
        </div>
      </header>
      <div id="screen-container"></div>
      <nav class="bottom-nav">
        <div class="nav-item" id="nav-dashboard">
          ${ICONS.dashboard}
          대시보드
        </div>
        <div class="nav-item" id="nav-pokedex">
          ${ICONS.pokedex}
          도감
        </div>
        <div class="nav-item" id="nav-settings">
          ${ICONS.settings}
          설정
        </div>
      </nav>
    `;

    // 네비게이션 클릭 리스너 바인딩
    document.getElementById('nav-dashboard').addEventListener('click', () => this.navigate('dashboard'));
    document.getElementById('nav-pokedex').addEventListener('click', () => this.navigate('pokedex'));
    document.getElementById('nav-settings').addEventListener('click', () => this.navigate('settings'));
  }

  // 상태에 맞춰 네비게이션 액티브 탭 클래스 토글
  updateActiveNav() {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const activeNav = document.getElementById(`nav-${this.activeScreen}`);
    if (activeNav) activeNav.classList.add('active');
  }

  // 화면 전환 제어 (해시 라우터와 연계)
  navigate(screenName, params = {}) {
    gameAudio.playClick();
    this.activeScreen = screenName;
    this.updateActiveNav();
    
    // 테마 초기화 (디폴트)
    document.body.className = '';
    
    const container = document.getElementById('screen-container');
    if (!container) return;

    // 헤더 상태바 볼 수량 동기화
    const totalBalls = gameState.state.inventory.pokeBall + gameState.state.inventory.greatBall + gameState.state.inventory.ultraBall + gameState.state.inventory.masterBall;
    document.getElementById('header-ball-count').textContent = totalBalls;

    // 화면 렌더링 분기
    switch (screenName) {
      case 'dashboard':
        this.renderDashboard(container);
        break;
      case 'quiz':
        this.renderQuiz(container, params.unitId);
        break;
      case 'capture':
        this.renderCapture(container, params.unitId);
        break;
      case 'pokedex':
        this.renderPokedex(container);
        break;
      case 'settings':
        this.renderSettings(container);
        break;
    }
  }

  // 1. 대시보드 화면
  renderDashboard(container) {
    const totalPokemon = 40;
    const caught = gameState.getCaughtCount();
    const percent = Math.round((caught / totalPokemon) * 100);

    container.innerHTML = `
      <div class="screen">
        <div class="glass-panel pokedex-summary-card">
          <div class="summary-info" style="flex: 1;">
            <h2>도감 완성도</h2>
            <div class="progress-text">${caught} / ${totalPokemon} 마리</div>
            <div class="progress-container">
              <div class="progress-bar" id="summary-bar" style="width: 0%;"></div>
            </div>
          </div>
          <div class="percent-badge" style="font-size: 2.2rem; font-weight: 900; color: var(--theme-color); text-shadow: 0 0 10px var(--theme-glow);">${percent}%</div>
        </div>

        <div class="glass-panel" style="padding: 15px 20px;">
          <h3 style="font-size: 0.95rem; margin-bottom: 12px; font-weight: 700; border-left: 3px solid var(--theme-color); padding-left: 8px;">단원 선택 (복습 및 포획)</h3>
          <div class="unit-list">
            ${Object.entries(quizData).map(([unitId, unit]) => {
              const bestScore = gameState.getQuizScore(unitId);
              const theme = unit.theme;
              const hasScore = bestScore > 0;
              const scoreText = hasScore ? `${bestScore}점` : "도전 안 함";
              
              return `
                <div class="unit-card theme-${theme}" data-unit="${unitId}" style="--card-theme: var(--theme-color); --card-theme-rgb: var(--theme-color-rgb);">
                  <div class="unit-info">
                    <div class="unit-title">${unit.title}</div>
                    <div class="unit-meta">
                      최고 성적: <span class="unit-meta-score" style="color: var(--card-theme);">${scoreText}</span>
                      ${bestScore === 100 ? `<span style="color: #10b981; font-weight: 800; font-size: 0.7rem;">⭐ 완벽 마스터!</span>` : ''}
                    </div>
                  </div>
                  <div class="unit-action-btn" style="--theme-color: var(--card-theme);">
                    ${ICONS.play}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    // 게이지 애니메이션 구동용
    setTimeout(() => {
      const bar = document.getElementById('summary-bar');
      if (bar) bar.style.width = `${percent}%`;
    }, 50);

    // 단원 카드 클릭 리스너
    container.querySelectorAll('.unit-card').forEach(card => {
      card.addEventListener('click', () => {
        const unitId = card.getAttribute('data-unit');
        this.navigate('quiz', { unitId });
      });
    });
  }

  // 2. 퀴즈 도전 화면
  renderQuiz(container, unitId) {
    const unit = quizData[unitId];
    if (!unit) return;

    // 바디에 테마 클래스 삽입
    document.body.className = `theme-${unit.theme}`;

    // 해당 단원 문제 리스트에서 5문항 무작위 추출
    const allQuestions = [...unit.questions];
    // 셔플 알고리즘
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    const quizQuestions = shuffled.slice(0, 5);

    let currentIdx = 0;
    let correctCount = 0;

    const showQuestion = () => {
      if (currentIdx >= quizQuestions.length) {
        // 모든 퀴즈 완료 -> 결과 화면
        renderQuizResult();
        return;
      }

      const q = quizQuestions[currentIdx];
      
      container.innerHTML = `
        <div class="screen">
          <div class="quiz-header">
            <button class="back-btn" id="quiz-back-btn">
              ${ICONS.back} 대시보드
            </button>
            <div class="quiz-progress">문제 ${currentIdx + 1} / ${quizQuestions.length}</div>
          </div>

          <div class="glass-panel quiz-question-box">
            <div class="question-text">${q.question}</div>
          </div>

          <div class="quiz-interactive-area">
            ${renderQuestionInput(q)}
          </div>
        </div>
      `;

      // 뒤로가기 버튼 리스너
      document.getElementById('quiz-back-btn').addEventListener('click', () => {
        this.navigate('dashboard');
      });

      // 입력 양식 바인딩
      bindQuestionEvents(q);
    };

    // 문제 유형별 HTML 반환
    const renderQuestionInput = (q) => {
      switch (q.type) {
        case 'choice':
          return `
            <div class="quiz-options">
              ${q.options.map((option, idx) => `
                <button class="option-btn" data-value="${option}">
                  <span class="option-num">${idx + 1}</span>
                  <span class="option-content">${option}</span>
                </button>
              `).join('')}
            </div>
          `;
        case 'ox':
          return `
            <div class="ox-options">
              <button class="ox-btn ox-btn-o" data-value="O">
                O
                <span>그렇다</span>
              </button>
              <button class="ox-btn ox-btn-x" data-value="X">
                X
                <span>아니다</span>
              </button>
            </div>
          `;
        case 'blank':
          return `
            <div class="glass-panel blank-box">
              <div class="info-label">초성 힌트: <strong style="color: var(--theme-color); font-size: 1.1rem; letter-spacing: 2px;">${q.hint}</strong></div>
              <input type="text" class="blank-input" id="blank-input" placeholder="정답 단어 입력" autocomplete="off" autofocus />
              <button class="submit-btn" id="blank-submit">정답 제출</button>
            </div>
          `;
      }
    };

    // 이벤트 리스너 바인딩
    const bindQuestionEvents = (q) => {
      // 객관식 선택 시
      container.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', () => handleAnswer(btn.getAttribute('data-value'), q));
      });

      // OX 선택 시
      container.querySelectorAll('.ox-btn').forEach(btn => {
        btn.addEventListener('click', () => handleAnswer(btn.getAttribute('data-value'), q));
      });

      // 빈칸 입력식
      const blankInput = document.getElementById('blank-input');
      const blankSubmit = document.getElementById('blank-submit');
      if (blankInput && blankSubmit) {
        // 엔터키 제출
        blankInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            handleAnswer(blankInput.value.trim(), q);
          }
        });
        // 버튼 클릭 제출
        blankSubmit.addEventListener('click', () => {
          handleAnswer(blankInput.value.trim(), q);
        });
      }
    };

    // 정오답 처리
    const handleAnswer = (userAns, q) => {
      // 빈 값 방지
      if (!userAns) return;

      // 띄어쓰기 및 대소문자 제거 정규화 비교 (주관식)
      const normalizedUser = userAns.replace(/\s+/g, "").toLowerCase();
      const normalizedCorrect = q.answer.replace(/\s+/g, "").toLowerCase();
      const isCorrect = normalizedUser === normalizedCorrect;

      if (isCorrect) {
        correctCount++;
        gameAudio.playCorrect();
      } else {
        gameAudio.playWrong();
      }

      // 모달 오버레이 생성
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content" style="border-color: ${isCorrect ? '#10b981' : '#ef4444'}">
          <div class="modal-result-icon ${isCorrect ? 'correct' : 'wrong'}">
            ${isCorrect ? ICONS.correct : ICONS.wrong}
          </div>
          <h2 class="modal-title ${isCorrect ? 'correct' : 'wrong'}">${isCorrect ? '정답입니다!' : '아쉬운 오답입니다.'}</h2>
          <div class="modal-body">
            <p style="margin-bottom: 8px;"><strong>내 입력:</strong> ${userAns}</p>
            <p style="margin-bottom: 12px;"><strong>진짜 정답:</strong> <strong style="color: var(--theme-color);">${q.answer}</strong></p>
            <p style="font-size: 0.8rem; border-top: 1px dashed var(--panel-border); padding-top: 10px;">${q.explanation}</p>
          </div>
          <button class="modal-next-btn" id="modal-next-btn">
            ${currentIdx + 1 < quizQuestions.length ? '다음 문제' : '퀴즈 결과 보기'}
          </button>
        </div>
      `;

      document.body.appendChild(modal);

      document.getElementById('modal-next-btn').addEventListener('click', () => {
        gameAudio.playClick();
        modal.remove();
        currentIdx++;
        showQuestion();
      });
    };

    // 결과 화면 렌더러
    const renderQuizResult = () => {
      const scorePercent = Math.round((correctCount / quizQuestions.length) * 100);
      
      // 결과 기록 및 보상 획득
      const rewarded = gameState.saveQuizResult(unitId, scorePercent);

      container.innerHTML = `
        <div class="screen">
          <div class="glass-panel quiz-result-card">
            <h2 style="font-size: 1.3rem; font-weight: 800;">${unit.title}</h2>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">퀴즈 복습을 마쳤습니다!</p>
            
            <div class="score-badge">${scorePercent}%</div>
            <p style="font-weight: 600; font-size: 0.95rem; color: var(--theme-color);">${correctCount} / 5 문제를 맞췄습니다.</p>

            <div class="reward-section">
              <div class="reward-title">퀴즈 완료 보상 획득!</div>
              <div class="reward-balls-grid">
                ${Object.entries(rewarded).map(([ballType, count]) => {
                  if (count === 0) return '';
                  let nameKo = '몬스터볼';
                  let glowClass = 'poke-glow';
                  if (ballType === 'greatBall') { nameKo = '슈퍼볼'; glowClass = 'great-glow'; }
                  if (ballType === 'ultraBall') { nameKo = '하이퍼볼'; glowClass = 'ultra-glow'; }
                  if (ballType === 'masterBall') { nameKo = '마스터볼'; glowClass = 'master-glow'; }

                  return `
                    <div class="reward-ball-item">
                      <div class="reward-ball-icon ${glowClass}">${ICONS.pokeball}</div>
                      <div class="ball-name">${nameKo}</div>
                      <div class="reward-ball-count">+${count}</div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <div class="action-buttons-group">
              <button class="primary-btn" id="go-capture-btn">포켓몬 포획하기</button>
              <button class="secondary-btn" id="go-dashboard-btn">대시보드</button>
            </div>
          </div>
        </div>
      `;

      // 버튼 바인딩
      document.getElementById('go-capture-btn').addEventListener('click', () => {
        this.navigate('capture', { unitId });
      });
      document.getElementById('go-dashboard-btn').addEventListener('click', () => {
        this.navigate('dashboard');
      });
    };

    // 첫 문제 표시 시작
    showQuestion();
  }

  // 3. 포획(사냥) 화면
  renderCapture(container, unitId) {
    const unit = quizData[unitId];
    if (!unit) return;

    // 바디에 테마 클래스 삽입
    document.body.className = `theme-${unit.theme}`;

    // 이 단원의 포켓몬 풀 로드
    const pkmPool = pokemonData[unitId];
    let selectedBall = null;

    const buildCaptureLayout = () => {
      // 디폴트로 쓸 수 있는 볼 자동 선택
      const inventory = gameState.state.inventory;
      if (inventory.pokeBall > 0) selectedBall = 'pokeBall';
      else if (inventory.greatBall > 0) selectedBall = 'greatBall';
      else if (inventory.ultraBall > 0) selectedBall = 'ultraBall';
      else if (inventory.masterBall > 0) selectedBall = 'masterBall';
      else selectedBall = null; // 공 없음

      container.innerHTML = `
        <div class="screen">
          <div class="quiz-header">
            <button class="back-btn" id="capture-back-btn">
              ${ICONS.back} 나가기
            </button>
            <h2 style="font-size: 0.95rem; font-weight: 800;">${unit.title} 서식지</h2>
          </div>

          <div class="capture-scene bg-${unit.theme}" id="capture-scene">
            <div class="grass-container">
              <!-- 흔들리는 풀숲 -->
              <div class="capture-grass grass-shake" id="wild-grass">
                <svg viewBox="0 0 24 24">
                  <path d="M3 21h18c-1.3-4.3-3.6-8.2-6.5-11.4l1.5-2.6c.3-.5.1-1.2-.4-1.5-.5-.3-1.2-.1-1.5.4l-1.9 3.3C13.2 9.1 12.6 9 12 9s-1.2.1-1.7.2L8.4 5.9c-.3-.5-1-.7-1.5-.4-.5.3-.7 1-.4 1.5l1.5 2.6C5.1 12.8 2.8 16.7 1.5 21 1 21.6 1.8 22 2.2 22h.8zm9-9c2 0 3.7 1.3 4.4 3H8.6c.7-1.7 2.4-3 4.4-3z"/>
                </svg>
              </div>

              <!-- 던져질 볼 이미지 -->
              <div class="throwing-ball-sprite" id="throwing-ball"></div>

              <!-- 포획될 때 흡입 빔 이펙트 -->
              <div class="suction-beam" id="suction-beam"></div>

              <!-- 가만히 안착해 흔들릴 볼 -->
              <div class="resting-ball-container" id="resting-ball"></div>
            </div>
            
            <div class="capture-tip-text" id="capture-tip-text">흔들리는 풀숲을 클릭하여 야생 포켓몬을 찾아보세요!</div>
          </div>

          <!-- 볼 인벤토리 선택 바 -->
          <div class="glass-panel" style="padding: 15px 20px;">
            <h3 style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 10px;">사용할 몬스터볼 선택</h3>
            <div class="ball-inventory-bar" id="ball-inventory">
              ${renderBallInventory()}
            </div>
          </div>
        </div>
      `;

      // 뒤로가기 버튼
      document.getElementById('capture-back-btn').addEventListener('click', () => {
        this.navigate('dashboard');
      });

      // 풀숲 클릭 시 포켓몬 조우 시작
      const grass = document.getElementById('wild-grass');
      grass.addEventListener('click', () => {
        grass.style.pointerEvents = 'none'; // 연타 방지
        triggerEncounter();
      });

      // 볼 선택 버튼들 바인딩
      bindBallSelectEvents();
    };

    // 볼 인벤토리 렌더러
    const renderBallInventory = () => {
      const inv = gameState.state.inventory;
      const balls = [
        { type: 'pokeBall', name: '몬스터볼', qty: inv.pokeBall, glow: 'poke-glow' },
        { type: 'greatBall', name: '슈퍼볼', qty: inv.greatBall, glow: 'great-glow' },
        { type: 'ultraBall', name: '하이퍼볼', qty: inv.ultraBall, glow: 'ultra-glow' },
        { type: 'masterBall', name: '마스터볼', qty: inv.masterBall, glow: 'master-glow' }
      ];

      return balls.map(b => {
        const isSelected = selectedBall === b.type;
        const isDisabled = b.qty <= 0;
        
        return `
          <button class="ball-select-btn ${isSelected ? 'active' : ''}" data-type="${b.type}" ${isDisabled ? 'disabled' : ''}>
            <div class="ball-icon-wrapper ${b.glow}">${ICONS.pokeball}</div>
            <div class="ball-name">${b.name}</div>
            <div class="ball-count">${b.qty}개</div>
          </button>
        `;
      }).join('');
    };

    // 볼 선택 이벤트 리스너 바인딩
    const bindBallSelectEvents = () => {
      const container = document.getElementById('ball-inventory');
      if (!container) return;

      container.querySelectorAll('.ball-select-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const type = btn.getAttribute('data-type');
          if (gameState.state.inventory[type] > 0) {
            selectedBall = type;
            gameAudio.playClick();
            // 활성화 보더 갱신
            container.querySelectorAll('.ball-select-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
          }
        });
      });
    };

    // 포켓몬 조우 연출
    const triggerEncounter = () => {
      gameAudio.playShake();
      
      // 풀숲 흔들림 멈추고 확대/페이드아웃 처리
      const grass = document.getElementById('wild-grass');
      grass.classList.remove('grass-shake');
      grass.style.transition = 'transform 0.4s ease-out, opacity 0.4s ease-out';
      grass.style.transform = 'scale(0.01)';
      grass.style.opacity = '0';

      setTimeout(() => {
        grass.style.display = 'none';
        
        // 희귀도 가중치 롤링 (일반 60%, 희귀 30%, 전설 10%)
        const roll = Math.random();
        let targetRarity = 'common';
        if (roll < 0.10) targetRarity = 'legendary';
        else if (roll < 0.40) targetRarity = 'rare';

        // 해당 희귀도의 단원 포켓몬 추출
        const filtered = pkmPool.filter(p => p.rarity === targetRarity);
        // 만약 해당 풀이 비어있으면 안전장치로 무작위
        const finalPkm = filtered.length > 0 
          ? filtered[Math.floor(Math.random() * filtered.length)]
          : pkmPool[Math.floor(Math.random() * pkmPool.length)];

        renderEncounterInterface(finalPkm);
      }, 400);
    };

    // 포켓몬 대면 UI 렌더링
    const renderEncounterInterface = (pkm) => {
      const scene = document.getElementById('capture-scene');
      
      // 조우 전용 판넬 생성
      const encounterPanel = document.createElement('div');
      encounterPanel.className = 'encounter-panel';
      encounterPanel.id = 'encounter-panel';
      
      encounterPanel.innerHTML = `
        <div class="wild-pokemon-header">
          <span class="wild-badge">WILD 야생</span>
          <div class="pokemon-meta-box">
            <div class="pokemon-name-tag">${pkm.name}</div>
            <div class="pokemon-rarity-badge rarity-${pkm.rarity}">${pkm.rarityKo}</div>
          </div>
        </div>

        <div class="pokemon-sprite-container">
          <div class="pokemon-shadow-ellipse"></div>
          <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pkm.id}.png" class="wild-pokemon-img" id="wild-pokemon-img" alt="${pkm.name}" />
        </div>

        <div style="display: flex; gap: 10px; width: 100%; z-index: 10;">
          <button class="primary-btn" id="throw-ball-btn" style="flex: 2; height: 46px;">볼 던지기!</button>
          <button class="secondary-btn" id="run-away-btn" style="flex: 1; height: 46px;">도망치기</button>
        </div>
      `;

      scene.appendChild(encounterPanel);
      
      const tipText = document.getElementById('capture-tip-text');
      tipText.textContent = `도감 등록 확률: ${Math.round(pkm.catchRate * 100)}% (볼 등급에 따라 상승)`;

      // 도망치기 리스너
      document.getElementById('run-away-btn').addEventListener('click', () => {
        gameAudio.playClick();
        resetToGrassScene();
      });

      // 던지기 리스너
      const throwBtn = document.getElementById('throw-ball-btn');
      throwBtn.addEventListener('click', () => {
        if (!selectedBall) {
          alert('몬스터볼이 부족합니다! 과학 퀴즈를 풀어 몬스터볼을 충전하세요.');
          return;
        }
        throwBtn.disabled = true; // 연타 방지
        executeCapture(pkm);
      });
    };

    // 풀숲 씬으로 복귀 (도망치기 혹은 실패 후 도망침 시)
    const resetToGrassScene = () => {
      const panel = document.getElementById('encounter-panel');
      if (panel) panel.remove();

      const grass = document.getElementById('wild-grass');
      grass.style.display = 'flex';
      grass.style.transform = 'scale(1)';
      grass.style.opacity = '1';
      grass.style.pointerEvents = 'auto';
      grass.classList.add('grass-shake');

      const tipText = document.getElementById('capture-tip-text');
      tipText.textContent = '흔들리는 풀숲을 클릭하여 야생 포켓몬을 찾아보세요!';
    };

    // 포획 연출 실행
    const executeCapture = (pkm) => {
      // 1. 볼 개수 1 차감 및 상태창 반영
      gameState.useBall(selectedBall);
      
      // 인벤토리 바 갱신
      document.getElementById('ball-inventory').innerHTML = renderBallInventory();
      bindBallSelectEvents(); // 리스너 재바인딩
      
      // 상단 헤더 개수 갱신
      const totalBalls = gameState.state.inventory.pokeBall + gameState.state.inventory.greatBall + gameState.state.inventory.ultraBall + gameState.state.inventory.masterBall;
      document.getElementById('header-ball-count').textContent = totalBalls;

      // 애니메이션 노드 로드
      const pkmImg = document.getElementById('wild-pokemon-img');
      const throwingBall = document.getElementById('throwing-ball');
      const suctionBeam = document.getElementById('suction-beam');
      const restingBall = document.getElementById('resting-ball');

      // 선택한 볼 타입에 따른 색상/모양 클래스 매칭
      let ballGlow = 'poke-glow';
      if (selectedBall === 'greatBall') ballGlow = 'great-glow';
      if (selectedBall === 'ultraBall') ballGlow = 'ultra-glow';
      if (selectedBall === 'masterBall') ballGlow = 'master-glow';

      throwingBall.innerHTML = ICONS.pokeball;
      throwingBall.className = `throwing-ball-sprite throw-active ${ballGlow}`;

      gameAudio.playThrow();

      // 2. 던지는 궤적 완료 시점 (0.8초 후)
      setTimeout(() => {
        throwingBall.classList.remove('throw-active');
        
        // 흡입 빔 연출 시작
        suctionBeam.classList.add('suction-active');
        pkmImg.classList.add('pokemon-captured-fade'); // 포켓몬이 빨려 들어감
        
        setTimeout(() => {
          suctionBeam.classList.remove('suction-active');
          pkmImg.style.display = 'none';

          // 바닥 안착 볼 노출
          restingBall.innerHTML = ICONS.pokeball;
          restingBall.className = `resting-ball-container resting-active ${ballGlow}`;

          // 3. 흔들림 3회 시뮬레이션
          let shakeCount = 0;
          
          const performShake = () => {
            if (shakeCount < 3) {
              restingBall.classList.add('shake-active');
              gameAudio.playShake();
              
              setTimeout(() => {
                restingBall.classList.remove('shake-active');
                shakeCount++;
                setTimeout(performShake, 350); // 다음 흔들림 대기
              }, 800); // 흔들림 애니메이션 지속
            } else {
              // 포획 성공 판정 진행
              evalCaptureResult(pkm, restingBall);
            }
          };

          // 첫 번째 흔들림 트리거
          setTimeout(performShake, 200);

        }, 400);

      }, 800);
    };

    // 포획 성공여부 최종 연출 및 판정
    const evalCaptureResult = (pkm, restingBall) => {
      // 성공 확률 계산
      let multiplier = 1.0;
      if (selectedBall === 'greatBall') multiplier = 1.8;
      if (selectedBall === 'ultraBall') multiplier = 3.0;
      if (selectedBall === 'masterBall') multiplier = 100.0; // 100% 무조건 포획

      const successRate = pkm.catchRate * multiplier;
      const roll = Math.random();
      const isSuccess = roll < successRate;

      if (isSuccess) {
        // 성공!!
        restingBall.style.filter = 'brightness(1.5)';
        gameAudio.playCatchSuccess();
        
        // 통계 기록
        gameState.recordCaptureSuccess();
        
        // 새로 잡은 건지 판별
        const isNew = gameState.addPokemon(pkm.id);

        // 폭죽 파티클 애니메이션 구동
        launchFireworks();

        // 성공 모달 띄우기
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
          <div class="modal-content" style="border-color: var(--theme-color); text-align: center;">
            <div style="font-size: 0.8rem; font-weight: 800; color: var(--theme-color); margin-bottom: 5px;">포획에 성공했습니다!</div>
            <h2 class="modal-title" style="color: #ffffff;">야생 ${pkm.name} 획득!</h2>
            
            <div style="position: relative; height: 130px; margin: 15px 0; display: flex; align-items: center; justify-content: center;">
              <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pkm.id}.png" style="width: 120px; height: 120px; object-fit: contain; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.3));" alt="${pkm.name}" />
            </div>

            <div class="modal-body" style="text-align: left; font-size: 0.85rem;">
              <div class="science-tip-title" style="color: var(--theme-color);">
                ${ICONS.bulb} 과학 복습 팁
              </div>
              <div class="science-tip-content">${pkm.hint}</div>
            </div>

            <div class="action-buttons-group">
              <button class="primary-btn" id="modal-pokedex-btn">도감에서 확인하기</button>
              <button class="secondary-btn" id="modal-close-btn">계속 탐험하기</button>
            </div>
          </div>
        `;

        document.body.appendChild(modal);

        // 도감 보러가기
        document.getElementById('modal-pokedex-btn').addEventListener('click', () => {
          modal.remove();
          this.navigate('pokedex');
        });

        // 계속 탐험
        document.getElementById('modal-close-btn').addEventListener('click', () => {
          modal.remove();
          resetToGrassScene();
        });

      } else {
        // 실패!!
        restingBall.classList.remove('resting-active');
        gameAudio.playCatchFail();

        // 몬스터볼 탈출 폭발 이펙트 흉내
        const scene = document.getElementById('capture-scene');
        const failPuff = document.createElement('div');
        failPuff.style.position = 'absolute';
        failPuff.style.bottom = '95px';
        failPuff.style.left = '50%';
        failPuff.style.transform = 'translateX(-50%)';
        failPuff.style.width = '30px';
        failPuff.style.height = '30px';
        failPuff.style.borderRadius = '50%';
        failPuff.style.background = 'rgba(255, 255, 255, 0.4)';
        failPuff.style.transition = 'all 0.3s ease-out';
        scene.appendChild(failPuff);

        setTimeout(() => {
          failPuff.style.transform = 'translateX(-50%) scale(2)';
          failPuff.style.opacity = '0';
          setTimeout(() => failPuff.remove(), 300);
        }, 50);

        // 포켓몬 다시 보이기
        const pkmImg = document.getElementById('wild-pokemon-img');
        pkmImg.style.display = 'block';
        pkmImg.classList.remove('pokemon-captured-fade');
        pkmImg.style.opacity = '1';
        pkmImg.style.transform = 'scale(1)';

        // 30% 확률로 도망침
        const fleeRoll = Math.random();
        if (fleeRoll < 0.35) {
          setTimeout(() => {
            pkmImg.style.transition = 'transform 0.4s ease-in, opacity 0.4s ease-in';
            pkmImg.style.transform = 'translateX(200px) scale(0.5)';
            pkmImg.style.opacity = '0';
            
            const tipText = document.getElementById('capture-tip-text');
            tipText.textContent = `${pkm.name}이(가) 도망쳐 버렸습니다!`;
            
            setTimeout(() => {
              resetToGrassScene();
            }, 600);
          }, 800);
        } else {
          // 실패했으나 다시 기회를 제공
          const tipText = document.getElementById('capture-tip-text');
          tipText.textContent = '포획 실패! 몬스터볼을 다시 던져보세요.';
          
          const throwBtn = document.getElementById('throw-ball-btn');
          throwBtn.disabled = false;
        }
      }
    };

    // 꽃가루/스파크 파티클 애니메이션 구동 함수
    const launchFireworks = () => {
      const scene = document.getElementById('capture-scene');
      if (!scene) return;

      const canvas = document.createElement('canvas');
      canvas.id = 'capture-canvas';
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '45';
      
      scene.appendChild(canvas);

      // 캔버스 렌더링 해상도 매칭
      const rect = scene.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      const ctx = canvas.getContext('2d');
      const particles = [];
      const particleCount = 50;
      
      // 알록달록한 네온 컬러 풀
      const colors = ['#ff0055', '#00ffcc', '#ffcc00', '#ff6600', '#9900ff', '#33ff00', '#ffffff', '#00e5ff'];

      // 볼 안착 지점 (대략 중앙 하단)
      const startX = canvas.width / 2;
      const startY = canvas.height - 110;

      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 3;
        particles.push({
          x: startX,
          y: startY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2, // 초기에 위쪽 방향 힘 추가
          radius: Math.random() * 3 + 2.5,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          decay: Math.random() * 0.015 + 0.01,
          gravity: 0.18
        });
      }

      let animationFrameId;
      const startTime = Date.now();

      const tick = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        let alive = false;
        particles.forEach(p => {
          if (p.alpha > 0) {
            alive = true;
            // 상태 업데이트
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.alpha -= p.decay;

            // 그리기
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 8;
            ctx.shadowColor = p.color;
            ctx.fill();
            ctx.restore();
          }
        });

        // 2초 경과 시 강제 조기 종료 또는 살아있는 파티클이 있을 경우 루프
        if (alive && (Date.now() - startTime < 2000)) {
          animationFrameId = requestAnimationFrame(tick);
        } else {
          canvas.remove();
        }
      };

      tick();

      // 2초 후 확실한 정리 보장
      setTimeout(() => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        if (canvas.parentNode) {
          canvas.remove();
        }
      }, 2000);
    };

    buildCaptureLayout();
  }

  // 4. 포켓몬 도감 화면
  renderPokedex(container) {
    const totalCount = 40;
    const caughtCount = gameState.getCaughtCount();

    container.innerHTML = `
      <div class="screen">
        <div class="pokedex-header-summary">
          <h2 style="font-size: 1.1rem; font-weight: 800;">마스터 도감</h2>
          <div class="header-status">완성률: <span style="color: var(--theme-color); font-weight: 800;">${caughtCount} / ${totalCount}</span> 마리</div>
        </div>

        <div class="glass-panel pokedex-grid">
          ${renderPokedexGrid()}
        </div>
      </div>
    `;

    // 8x5 그리드(총 40종) 순회 생성기
    function renderPokedexGrid() {
      let html = '';
      
      // 단원 순서대로 슬롯 생성
      Object.entries(pokemonData).forEach(([unitId, list]) => {
        // 단원별 테마를 슬롯에 연동
        const unit = quizData[unitId];
        const theme = unit ? unit.theme : 'earth';
        
        list.forEach(pkm => {
          const registered = gameState.hasPokemon(pkm.id);
          const nameDisplay = registered ? pkm.name : '???';
          const imgUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pkm.id}.png`;
          const slotClass = registered ? 'registered' : 'unregistered';

          html += `
            <div class="pokedex-slot ${slotClass} type-${theme}" data-id="${pkm.id}" data-unit="${unitId}" style="--theme-rgb-type: var(--theme-color-rgb);">
              <div class="pokedex-slot-num">#${pkm.id}</div>
              <img class="pokedex-slot-img" src="${imgUrl}" alt="${nameDisplay}" />
              <div class="pokedex-slot-name">${nameDisplay}</div>
            </div>
          `;
        });
      });

      return html;
    }

    // 각 슬롯 클릭 시 상세조회 이벤트 바인딩
    container.querySelectorAll('.pokedex-slot').forEach(slot => {
      slot.addEventListener('click', () => {
        const pkmId = parseInt(slot.getAttribute('data-id'));
        const unitId = slot.getAttribute('data-unit');
        
        // 단원 데이터 로드
        const pkmList = pokemonData[unitId];
        const pkm = pkmList.find(p => p.id === pkmId);
        const registered = gameState.hasPokemon(pkmId);

        showPokemonDetails(pkm, registered, unitId);
      });
    });

    // 도감 상세정보 팝업 모달
    const showPokemonDetails = (pkm, registered, unitId) => {
      gameAudio.playClick();
      
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      
      // 해당 단원 타이틀
      const unit = quizData[unitId];
      const unitTitle = unit ? unit.title : '';

      if (registered) {
        // 획득 시 - 상세 과학 상식 및 이미지 표시
        modal.innerHTML = `
          <div class="modal-content poke-detail-card" style="border-color: var(--theme-color);">
            <div class="detail-header-band">
              <div class="detail-pokedex-number">NO.${pkm.id} [${pkm.rarityKo}]</div>
              <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pkm.id}.png" class="detail-img" alt="${pkm.name}" />
            </div>
            
            <div class="detail-body">
              <h2 class="detail-name">${pkm.name}</h2>
              <div class="detail-types">
                <span class="type-badge">${pkm.type}</span>
                <span class="type-badge" style="color: var(--theme-color); border-color: rgba(var(--theme-color-rgb), 0.3);">${unitTitle.split('.')[1].trim()}</span>
              </div>

              <div class="detail-description-box">
                <div class="science-tip-title">
                  ${ICONS.bulb} 과학 연계 지식
                </div>
                <div class="science-tip-content">${pkm.hint}</div>
              </div>

              <button class="detail-close-btn" id="detail-close-btn">확인 완료</button>
            </div>
          </div>
        `;
      } else {
        // 미획득 시 - 힌트 제공 및 포획 경로 안내
        modal.innerHTML = `
          <div class="modal-content poke-detail-card" style="border-color: var(--text-muted);">
            <div class="detail-header-band" style="background: linear-gradient(185deg, rgba(255,255,255,0.03) 0%, transparent 100%);">
              <div class="detail-pokedex-number">NO.${pkm.id} [${pkm.rarityKo}]</div>
              <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pkm.id}.png" class="detail-img" style="filter: brightness(0) opacity(0.15);" alt="???" />
            </div>
            
            <div class="detail-body">
              <h2 class="detail-name" style="color: var(--text-secondary);">미발견 포켓몬</h2>
              <div class="detail-types">
                <span class="type-badge">${unitTitle.split('.')[1].trim()} 단원</span>
              </div>

              <div class="detail-description-box" style="background: rgba(0,0,0,0.15);">
                <div class="science-tip-title" style="color: var(--text-secondary);">
                  포획 힌트
                </div>
                <div class="science-tip-content" style="color: var(--text-secondary); font-size: 0.85rem;">
                  "${unitTitle}" 단원의 퀴즈 복습을 마친 뒤, 획득한 몬스터볼로 서식지에서 포획해야 해제할 수 있습니다.<br>
                  <strong style="color: var(--theme-color);">도감 단서:</strong> ${pkm.hint}
                </div>
              </div>

              <div class="action-buttons-group">
                <button class="primary-btn" id="detail-run-quiz-btn">복습 퀴즈 풀러 가기</button>
                <button class="secondary-btn" id="detail-close-btn">닫기</button>
              </div>
            </div>
          </div>
        `;
      }

      document.body.appendChild(modal);

      // 닫기 버튼
      document.getElementById('detail-close-btn').addEventListener('click', () => {
        gameAudio.playClick();
        modal.remove();
      });

      // 미획득 상태에서 퀴즈로 바로가기 클릭 시
      const runQuizBtn = document.getElementById('detail-run-quiz-btn');
      if (runQuizBtn) {
        runQuizBtn.addEventListener('click', () => {
          modal.remove();
          this.navigate('quiz', { unitId });
        });
      }
    };
  }

  // 5. 설정 화면
  renderSettings(container) {
    const totalPokemon = 40;
    const caught = gameState.getCaughtCount();

    const stats = gameState.state.stats || {
      quizzesAttempted: 0,
      totalCorrectAnswers: 0,
      ballsThrown: { pokeBall: 0, greatBall: 0, ultraBall: 0, masterBall: 0 },
      captureAttempts: 0,
      captureSuccesses: 0
    };

    const quizSuccessRate = stats.quizzesAttempted > 0 
      ? Math.round((stats.totalCorrectAnswers / (stats.quizzesAttempted * 5)) * 100) 
      : 0;

    const captureSuccessRate = stats.captureAttempts > 0 
      ? Math.round((stats.captureSuccesses / stats.captureAttempts) * 100) 
      : 0;

    container.innerHTML = `
      <div class="screen">
        <div class="glass-panel">
          <h2 style="font-size: 1.1rem; font-weight: 800; margin-bottom: 15px; border-left: 3px solid var(--theme-color); padding-left: 8px;">마스터 통계</h2>
          
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">도감 등록 포켓몬</div>
              <div class="info-value">${caught} / ${totalPokemon} 마리</div>
            </div>
            <div class="info-item">
              <div class="info-label">복습 완료 단원 수</div>
              <div class="info-value">${Object.keys(gameState.state.completedQuizzes).length} / 8 개</div>
            </div>
            <div class="info-item">
              <div class="info-label">퀴즈 도전 횟수</div>
              <div class="info-value">${stats.quizzesAttempted}회</div>
            </div>
            <div class="info-item">
              <div class="info-label">정답률 (맞춘 문제)</div>
              <div class="info-value">${quizSuccessRate}% (${stats.totalCorrectAnswers}개)</div>
            </div>
            <div class="info-item">
              <div class="info-label">볼 던진 횟수</div>
              <div class="info-value">${stats.captureAttempts}회</div>
            </div>
            <div class="info-item">
              <div class="info-label">포획 성공률</div>
              <div class="info-value">${captureSuccessRate}%</div>
            </div>
          </div>

          <div style="margin-top: 15px; border-top: 1px solid var(--panel-border); padding-top: 15px;">
            <h3 style="font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 10px; text-align: left;">던진 몬스터볼 상세 분석</h3>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
              <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--panel-border); border-radius: 12px; padding: 8px; text-align: center;">
                <div style="font-size: 0.65rem; color: var(--ball-poke); font-weight: 700;">몬스터볼</div>
                <div style="font-size: 1rem; font-weight: 800; margin-top: 4px;">${stats.ballsThrown.pokeBall || 0}회</div>
              </div>
              <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--panel-border); border-radius: 12px; padding: 8px; text-align: center;">
                <div style="font-size: 0.65rem; color: var(--ball-great); font-weight: 700;">슈퍼볼</div>
                <div style="font-size: 1rem; font-weight: 800; margin-top: 4px;">${stats.ballsThrown.greatBall || 0}회</div>
              </div>
              <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--panel-border); border-radius: 12px; padding: 8px; text-align: center;">
                <div style="font-size: 0.65rem; color: var(--ball-ultra); font-weight: 700;">하이퍼볼</div>
                <div style="font-size: 1rem; font-weight: 800; margin-top: 4px;">${stats.ballsThrown.ultraBall || 0}회</div>
              </div>
              <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--panel-border); border-radius: 12px; padding: 8px; text-align: center;">
                <div style="font-size: 0.65rem; color: var(--ball-master); font-weight: 700;">마스터볼</div>
                <div style="font-size: 1rem; font-weight: 800; margin-top: 4px;">${stats.ballsThrown.masterBall || 0}회</div>
              </div>
            </div>
          </div>
        </div>

        <div class="glass-panel settings-list">
          <h2 style="font-size: 1.1rem; font-weight: 800; border-left: 3px solid var(--theme-color); padding-left: 8px;">게임 설정</h2>
          
          <div class="settings-item">
            <div class="settings-info">
              <div class="settings-title">효과음 설정</div>
              <div class="settings-desc">퀴즈 정답/오답 및 포획 연출 효과음을 켭니다.</div>
            </div>
            <button class="sound-toggle-btn ${gameState.state.soundEnabled ? 'active' : ''}" id="sound-toggle-btn">
              <span class="toggle-status-text">${gameState.state.soundEnabled ? '켜짐 (ON)' : '꺼짐 (OFF)'}</span>
              <div class="toggle-slider">
                <div class="toggle-nob"></div>
              </div>
            </button>
          </div>

          <div class="settings-item">
            <div class="settings-info">
              <div class="settings-title">데이터 초기화</div>
              <div class="settings-desc">도감 및 보유 볼 현황 등 저장된 데이터를 초기 상태로 돌립니다.</div>
            </div>
            <button class="reset-danger-btn" id="reset-all-btn">모두 초기화</button>
          </div>
        </div>

        <div class="glass-panel" style="text-align: center; padding: 25px; display: flex; flex-direction: column; gap: 8px; font-size: 0.8rem; color: var(--text-muted); line-height: 1.5;">
          <p style="font-weight: 700; color: var(--text-secondary);">초등 5학년 과학 복습 마스터 도감 v1.0</p>
          <p>본 애플리케이션은 2022 개정 과학과 교육과정을 충족합니다.</p>
          <p>모든 이미지의 저작권은 PokeAPI 및 Nintendo/Creatures Inc./GAME FREAK에 있습니다.</p>
        </div>
      </div>
    `;

    // 초기화 버튼 바인딩
    document.getElementById('reset-all-btn').addEventListener('click', () => {
      const confirmReset = confirm("주의: 모든 도감 데이터와 몬스터볼 인벤토리가 완전히 지워집니다. 정말 초기화하시겠습니까?");
      if (confirmReset) {
        gameState.resetAll();
        gameAudio.playWrong();
        alert("게임 데이터가 공장 초기화되었습니다.");
        this.navigate('dashboard');
      }
    });

    // 사운드 토글 버튼 바인딩
    const soundToggle = document.getElementById('sound-toggle-btn');
    if (soundToggle) {
      soundToggle.addEventListener('click', () => {
        const isEnabled = gameState.toggleAudio();
        gameAudio.playClick();
        
        // UI 업데이트
        soundToggle.className = `sound-toggle-btn ${isEnabled ? 'active' : ''}`;
        soundToggle.querySelector('.toggle-status-text').textContent = isEnabled ? '켜짐 (ON)' : '꺼짐 (OFF)';
      });
    }
  }
}

export const uiRenderer = new UIRenderer();
export default uiRenderer;
