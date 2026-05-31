// 애플리케이션 메인 엔트리 및 초기화 모듈
import { uiRenderer } from './ui-renderer.js';
import { gameAudio } from './audio.js';

// 웹앱 초기화
window.addEventListener('DOMContentLoaded', () => {
  // 기본 레이아웃 (헤더, 컨테이너, 네비게이션) 빌드
  uiRenderer.createBaseLayout();
  
  // 첫 시작 시 대시보드 강제 렌더링
  uiRenderer.navigate('dashboard');

  // 모바일 웹 및 오디오 오토플레이 제약 해제를 위한 클릭 제스처 오디오 활성화
  document.body.addEventListener('click', () => {
    gameAudio.init();
  }, { once: true }); // 최초 1회만 트리거
});
