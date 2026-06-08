import Phaser from 'phaser';

/**
 * 존별 테마 바닥 텍스처 생성 (E-1).
 *
 * 외부 에셋 없이 Canvas 절차 생성으로 32x32 타일러블 텍스처를 만든다.
 * 생성된 텍스처는 각 존 영역에 `tileSprite`로 깔아 질감을 부여한다.
 * 같은 키가 이미 존재하면 재생성하지 않는다(씬 재시작 안전).
 */

const TILE = 32;

export type ZoneTextureKey =
  | 'zone-lava'
  | 'zone-nebula'
  | 'zone-marble'
  | 'zone-pinktile'
  | 'zone-metal'
  | 'zone-plaza';

type DrawFn = (ctx: CanvasRenderingContext2D) => void;

/** 결정론적 의사난수 — 같은 시드는 항상 같은 패턴(시각 회귀 안정). */
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function fill(ctx: CanvasRenderingContext2D, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, TILE, TILE);
}

/** 미세 노이즈 디더링으로 평면 색을 질감 있게 만든다. */
function dither(ctx: CanvasRenderingContext2D, seed: number, rgba: string, count: number): void {
  const rand = seeded(seed);
  ctx.fillStyle = rgba;
  for (let i = 0; i < count; i++) {
    const x = Math.floor(rand() * TILE);
    const y = Math.floor(rand() * TILE);
    ctx.fillRect(x, y, 1, 1);
  }
}

const DRAW: Record<ZoneTextureKey, DrawFn> = {
  // 배틀 아레나 — 용암 균열 텍스처
  'zone-lava': (ctx) => {
    const grad = ctx.createLinearGradient(0, 0, TILE, TILE);
    grad.addColorStop(0, '#2a0a06');
    grad.addColorStop(1, '#160503');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, TILE, TILE);
    // 용암 균열(밝은 주황 선)
    const rand = seeded(101);
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    let x = rand() * TILE;
    ctx.moveTo(x, 0);
    for (let y = 4; y <= TILE; y += 8) {
      x = Phaser.Math.Clamp(x + (rand() - 0.5) * 12, 2, TILE - 2);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.4)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    dither(ctx, 7, 'rgba(239, 68, 68, 0.12)', 18);
  },

  // 보스 레이드 — 보라 성운
  'zone-nebula': (ctx) => {
    fill(ctx, '#0d0420');
    const rand = seeded(202);
    for (let i = 0; i < 3; i++) {
      const cx = rand() * TILE;
      const cy = rand() * TILE;
      const r = 6 + rand() * 10;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, 'rgba(139, 92, 246, 0.35)');
      g.addColorStop(1, 'rgba(139, 92, 246, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, TILE, TILE);
    }
    // 별
    ctx.fillStyle = 'rgba(216, 180, 254, 0.9)';
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(Math.floor(rand() * TILE), Math.floor(rand() * TILE), 1, 1);
    }
  },

  // 도감 박물관 — 대리석
  'zone-marble': (ctx) => {
    fill(ctx, '#0e1f1a');
    const rand = seeded(303);
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.22)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      let y = rand() * TILE;
      ctx.moveTo(0, y);
      for (let x = 6; x <= TILE; x += 6) {
        y = Phaser.Math.Clamp(y + (rand() - 0.5) * 8, 0, TILE);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    dither(ctx, 9, 'rgba(255, 255, 255, 0.05)', 14);
  },

  // 포켓몬 센터 — 핑크 체크 타일
  'zone-pinktile': (ctx) => {
    fill(ctx, '#23101c');
    ctx.fillStyle = 'rgba(236, 72, 153, 0.14)';
    ctx.fillRect(0, 0, TILE / 2, TILE / 2);
    ctx.fillRect(TILE / 2, TILE / 2, TILE / 2, TILE / 2);
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, TILE - 1, TILE - 1);
  },

  // 체육관 — 금속 패널
  'zone-metal': (ctx) => {
    const grad = ctx.createLinearGradient(0, 0, 0, TILE);
    grad.addColorStop(0, '#1c1a10');
    grad.addColorStop(0.5, '#26230f');
    grad.addColorStop(1, '#161408');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.28)';
    ctx.lineWidth = 1;
    ctx.strokeRect(2.5, 2.5, TILE - 5, TILE - 5);
    // 리벳
    ctx.fillStyle = 'rgba(245, 158, 11, 0.5)';
    [[5, 5], [TILE - 5, 5], [5, TILE - 5], [TILE - 5, TILE - 5]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    });
  },

  // 중앙 광장 — 사이언 홀로 격자
  'zone-plaza': (ctx) => {
    fill(ctx, '#04121c');
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.16)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, TILE - 1, TILE - 1);
    ctx.fillStyle = 'rgba(0, 229, 255, 0.22)';
    ctx.beginPath();
    ctx.arc(TILE / 2, TILE / 2, 1.5, 0, Math.PI * 2);
    ctx.fill();
  },
};

/**
 * 단원 색 그라데이션 바닥(퀴즈 존). 단원별 색이 달라 키도 색마다 구분한다.
 */
export function ensureUnitFloorTexture(scene: Phaser.Scene, color: number): string {
  const key = `zone-unit-${color.toString(16)}`;
  if (scene.textures.exists(key)) return key;
  const canvas = scene.textures.createCanvas(key, TILE, TILE);
  if (!canvas) return key;
  const ctx = canvas.getContext();
  const col = Phaser.Display.Color.IntegerToColor(color);
  fill(ctx, '#070a16');
  const grad = ctx.createRadialGradient(TILE / 2, TILE / 2, 1, TILE / 2, TILE / 2, TILE);
  grad.addColorStop(0, `rgba(${col.red}, ${col.green}, ${col.blue}, 0.22)`);
  grad.addColorStop(1, `rgba(${col.red}, ${col.green}, ${col.blue}, 0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, TILE, TILE);
  ctx.strokeStyle = `rgba(${col.red}, ${col.green}, ${col.blue}, 0.18)`;
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, TILE - 1, TILE - 1);
  canvas.refresh();
  return key;
}

/** 모든 존 테마 텍스처를 한 번 생성한다(이미 있으면 스킵). */
export function ensureZoneTextures(scene: Phaser.Scene): void {
  (Object.keys(DRAW) as ZoneTextureKey[]).forEach((key) => {
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, TILE, TILE);
    if (!canvas) return;
    DRAW[key](canvas.getContext());
    canvas.refresh();
  });
}
