import Phaser from 'phaser';
import { NpcData, SCIENTIST_TRIVIA } from './lobby-constants';

const TILE_SIZE = 32;
const MAP_WIDTH = 120;
const MAP_HEIGHT = 90;

export interface NpcInstance {
  container: Phaser.GameObjects.Container;
  initialX: number;
  initialY: number;
  name: string;
}

export function showTriviaBubble(
  scene: Phaser.Scene,
  bubble: Phaser.GameObjects.Container,
  bg: Phaser.GameObjects.Graphics,
  txt: Phaser.GameObjects.Text,
  isMerchant: boolean = false,
  npcName: string = ''
): void {
  let trivia = '';
  if (isMerchant) {
    trivia = "어서오세요! 퀴즈로 번 코인으로 모험에 필요한 유용한 아이템을 구매하세요!";
  } else if (npcName === '다윈 박사') {
    trivia = "생물과 환경의 평형 관계는 아주 중요하단다. 숲을 살려주게나!";
  } else if (npcName === '베게너 박사') {
    trivia = "이슬과 안개는 수증기의 응결 현상으로 발생하는 아름다운 날씨란다.";
  } else if (npcName === '파스퇴르 박사') {
    trivia = "물질이 녹아 섞이는 용해 현상의 신비를 밝혀주게.";
  } else if (npcName === '나이팅게일 박사') {
    trivia = "우리 몸의 호흡과 순환은 모두 유기적으로 연결되어 작동한단다.";
  } else {
    trivia = SCIENTIST_TRIVIA[Phaser.Math.Between(0, SCIENTIST_TRIVIA.length - 1)];
  }
  txt.setText(trivia);

  const padding = 10;
  const bubbleWidth = txt.width + padding * 2;
  const bubbleHeight = txt.height + padding * 2;

  bg.clear();
  bg.fillStyle(0x090f1d, 0.95);
  bg.fillRoundedRect(-bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight, 8);
  const borderCol = isMerchant ? 0xf59e0b : 0x10b981;
  bg.lineStyle(2, borderCol, 1);
  bg.strokeRoundedRect(-bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight, 8);

  bg.beginPath();
  bg.moveTo(-6, bubbleHeight / 2);
  bg.lineTo(0, bubbleHeight / 2 + 8);
  bg.lineTo(6, bubbleHeight / 2);
  bg.closePath();
  bg.fillPath();
  bg.strokePath();

  txt.setPosition(0, 0);
  bubble.setVisible(true);

  scene.time.delayedCall(4000, () => {
    bubble.setVisible(false);
  });
}

export function spawnNPCs(scene: Phaser.Scene): NpcInstance[] {
  const npcDefinitions: NpcData[] = [
    { name: '갈릴레이 박사', emoji: '🔭', initialX: 464, initialY: 320 },
    { name: '뉴턴 박사', emoji: '🧑‍🔬', initialX: 880, initialY: 320 },
    { name: '파스퇴르 박사', emoji: '🧪', initialX: 1296, initialY: 320 },
    { name: '나이팅게일 박사', emoji: '🩺', initialX: 1712, initialY: 320 },
    { name: '다윈 박사', emoji: '🧔', initialX: 2128, initialY: 320 },
    { name: '베게너 박사', emoji: '🌀', initialX: 2544, initialY: 320 },
    { name: '아인슈타인 박사', emoji: '👨‍🔬', initialX: 2960, initialY: 320 },
    { name: '퀴리 박사', emoji: '👩‍🔬', initialX: 3376, initialY: 320 },
    { name: '아이템 상인 포켓박사', emoji: '🪙', initialX: 1920, initialY: 1480 },
  ];

  const instances: NpcInstance[] = [];

  npcDefinitions.forEach(npc => {
    const container = scene.add.container(npc.initialX, npc.initialY);
    const visuals = scene.add.container(0, 0);
    container.add(visuals);

    const hoverColor = npc.name === '아이템 상인 포켓박사' ? 0xf59e0b : 0x10b981;
    const hoverPlate = scene.add.ellipse(0, 18, 20, 6, hoverColor, 0.4);
    visuals.add(hoverPlate);
    scene.tweens.add({
      targets: hoverPlate,
      scaleX: 1.35,
      scaleY: 1.35,
      alpha: 0.05,
      yoyo: true,
      repeat: -1,
      duration: 1200 + Phaser.Math.Between(0, 300)
    });

    const bodyCircle = scene.add.arc(0, 0, 16, 0, 360, false, 0x0f172a);
    bodyCircle.setStrokeStyle(2.5, hoverColor);
    visuals.add(bodyCircle);

    const head = scene.add.text(0, -4, npc.emoji, { fontSize: '18px' }).setOrigin(0.5);
    visuals.add(head);

    const tag = scene.add.text(0, -25, npc.name, {
      fontFamily: 'Arial',
      fontSize: '9px',
      color: '#' + hoverColor.toString(16).padStart(6, '0'),
      backgroundColor: '#020617ef',
      padding: { x: 4, y: 1.5 }
    }).setOrigin(0.5);
    visuals.add(tag);

    const bubbleBg = scene.add.graphics();
    const bubbleText = scene.add.text(0, 0, '', {
      fontFamily: 'Galmuri11',
      fontSize: '11px',
      color: '#ffffff',
      wordWrap: { width: 140 }
    }).setOrigin(0.5);

    const bubbleContainer = scene.add.container(0, -65, [bubbleBg, bubbleText]);
    bubbleContainer.setVisible(false);
    visuals.add(bubbleContainer);

    container.setSize(36, 36);
    container.setInteractive(new Phaser.Geom.Rectangle(-18, -18, 36, 36), Phaser.Geom.Rectangle.Contains);
    if (container.input) {
      container.input.cursor = 'pointer';
    }

    container.on('pointerdown', () => {
      if (npc.name === '아이템 상인 포켓박사') {
        window.dispatchEvent(new CustomEvent('react:openShop'));
      } else {
        window.dispatchEvent(new CustomEvent('react:openNpcQuest', { detail: { name: npc.name } }));
      }
      showTriviaBubble(scene, bubbleContainer, bubbleBg, bubbleText, npc.name === '아이템 상인 포켓박사', npc.name);
    });

    scene.tweens.add({
      targets: visuals,
      y: -6,
      yoyo: true,
      repeat: -1,
      duration: 1500 + Phaser.Math.Between(0, 500),
      ease: 'Sine.easeInOut'
    });

    instances.push({ container, initialX: npc.initialX, initialY: npc.initialY, name: npc.name });
  });

  scene.time.addEvent({
    delay: 5000,
    callback: () => {
      instances.forEach(npc => {
        if (npc.name === '아이템 상인 포켓박사') return;
        if (Math.random() < 0.5) {
          const angle = Math.random() * Math.PI * 2;
          const distance = Phaser.Math.Between(30, 80);
          const targetX = Phaser.Math.Clamp(npc.initialX + Math.cos(angle) * distance, 64, MAP_WIDTH * TILE_SIZE - 64);
          const targetY = Phaser.Math.Clamp(npc.initialY + Math.sin(angle) * distance, 64, MAP_HEIGHT * TILE_SIZE - 64);
          scene.tweens.add({
            targets: npc.container,
            x: targetX,
            y: targetY,
            duration: Phaser.Math.Between(1500, 2500),
            ease: 'Sine.easeInOut'
          });
        }
      });
    },
    loop: true
  });

  return instances;
}
