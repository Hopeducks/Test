import Phaser from 'phaser';

/**
 * 절차적 장식 오브젝트 (E-1).
 *
 * 외부 에셋 0 — Graphics/Text 도형으로만 분위기 오브젝트를 배치한다.
 * 모두 순수 시각용(충돌 없음). 바닥 부착이므로 호출 측에서 depth를 지정한다.
 * 반환된 트윈/오브젝트는 씬 shutdown 시 자동 정리되지만, 명시적 cleanup을 위해
 * 생성한 트윈 목록을 돌려준다.
 */

const TILE = 32;

export interface DecorationResult {
  tweens: Phaser.Tweens.Tween[];
}

interface DecorSpec {
  /** 타일 좌표 */
  tx: number;
  ty: number;
  kind: 'pillar' | 'fountain' | 'tree' | 'neon' | 'sign' | 'lamp';
  color: number;
  label?: string;
}

// 존 사이/가장자리에 분산 배치. 포탈·이동 경로를 가리지 않는 위치 위주.
const DECOR_LAYOUT: DecorSpec[] = [
  // 중앙 광장 둘레 — 홀로그램 기둥
  { tx: 52, ty: 42, kind: 'pillar', color: 0x00e5ff },
  { tx: 68, ty: 42, kind: 'pillar', color: 0x00e5ff },
  { tx: 52, ty: 54, kind: 'pillar', color: 0x00e5ff },
  { tx: 68, ty: 54, kind: 'pillar', color: 0x00e5ff },
  // 중앙 분수
  { tx: 60, ty: 48, kind: 'fountain', color: 0x38bdf8 },
  // 박물관 주변 나무
  { tx: 46, ty: 74, kind: 'tree', color: 0x10b981 },
  { tx: 73, ty: 74, kind: 'tree', color: 0x10b981 },
  { tx: 46, ty: 82, kind: 'tree', color: 0x22c55e },
  { tx: 73, ty: 82, kind: 'tree', color: 0x22c55e },
  // 배틀 아레나 네온 사인
  { tx: 104, ty: 36, kind: 'neon', color: 0xef4444, label: 'BATTLE' },
  // 체육관 네온
  { tx: 104, ty: 68, kind: 'neon', color: 0xf59e0b, label: 'GYM' },
  // 레이드 네온
  { tx: 16, ty: 36, kind: 'neon', color: 0x8b5cf6, label: 'RAID' },
  // 센터 표지판
  { tx: 16, ty: 68, kind: 'sign', color: 0xec4899, label: '센터' },
  // 가로등(광장 진입로)
  { tx: 44, ty: 48, kind: 'lamp', color: 0x7dd3fc },
  { tx: 76, ty: 48, kind: 'lamp', color: 0x7dd3fc },
  { tx: 60, ty: 36, kind: 'lamp', color: 0x7dd3fc },
  { tx: 60, ty: 60, kind: 'lamp', color: 0x7dd3fc },
];

function hex(color: number): string {
  return '#' + color.toString(16).padStart(6, '0');
}

function drawPillar(scene: Phaser.Scene, x: number, y: number, color: number): Phaser.GameObjects.Container {
  const g = scene.add.graphics();
  g.fillStyle(0x0a0f1d, 0.85);
  g.fillRoundedRect(-6, -28, 12, 32, 3);
  g.lineStyle(1.5, color, 0.7);
  g.strokeRoundedRect(-6, -28, 12, 32, 3);
  // 홀로 상단 구체
  g.fillStyle(color, 0.25);
  g.fillCircle(0, -32, 7);
  g.lineStyle(1.5, color, 0.9);
  g.strokeCircle(0, -32, 7);
  return scene.add.container(x, y, [g]);
}

function drawFountain(scene: Phaser.Scene, x: number, y: number, color: number): Phaser.GameObjects.Container {
  const g = scene.add.graphics();
  g.fillStyle(0x0c1626, 0.9);
  g.fillEllipse(0, 0, 44, 20);
  g.lineStyle(2, color, 0.6);
  g.strokeEllipse(0, 0, 44, 20);
  g.fillStyle(color, 0.25);
  g.fillEllipse(0, -2, 26, 11);
  // 물줄기 기둥
  g.fillStyle(color, 0.5);
  g.fillRect(-2, -22, 4, 20);
  return scene.add.container(x, y, [g]);
}

function drawTree(scene: Phaser.Scene, x: number, y: number, color: number): Phaser.GameObjects.Container {
  const g = scene.add.graphics();
  g.fillStyle(0x3f2d1a, 1);
  g.fillRect(-3, -6, 6, 14);
  g.fillStyle(color, 0.85);
  g.fillCircle(0, -16, 12);
  g.fillCircle(-8, -10, 8);
  g.fillCircle(8, -10, 8);
  g.fillStyle(0xffffff, 0.08);
  g.fillCircle(-3, -19, 5);
  return scene.add.container(x, y, [g]);
}

function drawNeon(scene: Phaser.Scene, x: number, y: number, color: number, label: string): Phaser.GameObjects.Container {
  const g = scene.add.graphics();
  g.fillStyle(0x05080f, 0.9);
  g.fillRoundedRect(-30, -14, 60, 24, 5);
  g.lineStyle(2, color, 0.95);
  g.strokeRoundedRect(-30, -14, 60, 24, 5);
  const txt = scene.add.text(0, -2, label, {
    fontFamily: 'Galmuri11',
    fontSize: '12px',
    color: hex(color),
    fontStyle: 'bold',
  }).setOrigin(0.5);
  // 지지 기둥
  g.fillStyle(0x1e293b, 1);
  g.fillRect(-2, 10, 4, 14);
  return scene.add.container(x, y, [g, txt]);
}

function drawSign(scene: Phaser.Scene, x: number, y: number, color: number, label: string): Phaser.GameObjects.Container {
  const g = scene.add.graphics();
  g.fillStyle(0x0a0f1d, 0.92);
  g.fillRoundedRect(-22, -16, 44, 22, 4);
  g.lineStyle(1.5, color, 0.8);
  g.strokeRoundedRect(-22, -16, 44, 22, 4);
  g.fillStyle(0x334155, 1);
  g.fillRect(-2, 6, 4, 16);
  const txt = scene.add.text(0, -5, label, {
    fontFamily: 'Galmuri11',
    fontSize: '11px',
    color: hex(color),
    fontStyle: 'bold',
  }).setOrigin(0.5);
  return scene.add.container(x, y, [g, txt]);
}

function drawLamp(scene: Phaser.Scene, x: number, y: number, color: number): Phaser.GameObjects.Container {
  const g = scene.add.graphics();
  g.fillStyle(0x1e293b, 1);
  g.fillRect(-1.5, -28, 3, 32);
  g.fillStyle(color, 0.85);
  g.fillCircle(0, -30, 5);
  // 광원 글로우
  const glow = scene.add.image(0, -30, 'soft-glow').setScale(0.6).setAlpha(0.4).setTint(color);
  glow.setBlendMode(Phaser.BlendModes.ADD);
  return scene.add.container(x, y, [glow, g]);
}

export function createLobbyDecorations(
  scene: Phaser.Scene,
  depth: number,
  reducedMotion: boolean
): DecorationResult {
  const tweens: Phaser.Tweens.Tween[] = [];

  DECOR_LAYOUT.forEach((spec) => {
    const x = spec.tx * TILE;
    const y = spec.ty * TILE;
    let obj: Phaser.GameObjects.Container;

    switch (spec.kind) {
      case 'pillar': obj = drawPillar(scene, x, y, spec.color); break;
      case 'fountain': obj = drawFountain(scene, x, y, spec.color); break;
      case 'tree': obj = drawTree(scene, x, y, spec.color); break;
      case 'neon': obj = drawNeon(scene, x, y, spec.color, spec.label ?? ''); break;
      case 'sign': obj = drawSign(scene, x, y, spec.color, spec.label ?? ''); break;
      case 'lamp': obj = drawLamp(scene, x, y, spec.color); break;
    }

    obj.setDepth(depth);

    // 약한 생동감 애니(모션 감쇠 시 생략) — compositor 친화 속성만(alpha/scale)
    if (!reducedMotion) {
      if (spec.kind === 'pillar' || spec.kind === 'neon') {
        tweens.push(scene.tweens.add({
          targets: obj,
          alpha: { from: 1, to: 0.7 },
          yoyo: true,
          repeat: -1,
          duration: 1400 + Phaser.Math.Between(0, 600),
          ease: 'Sine.easeInOut',
        }));
      } else if (spec.kind === 'tree') {
        tweens.push(scene.tweens.add({
          targets: obj,
          scaleX: { from: 1, to: 1.04 },
          yoyo: true,
          repeat: -1,
          duration: 2200 + Phaser.Math.Between(0, 800),
          ease: 'Sine.easeInOut',
        }));
      }
    }
  });

  return { tweens };
}
