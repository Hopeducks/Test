import Phaser from 'phaser';

/**
 * 로비 비주얼 — Phaser 의존 헬퍼 (E-2).
 * 등급/모션 등 순수 로직은 ./rarity (Phaser 비의존)에서 가져와 재노출한다.
 */

export {
  prefersReducedMotion,
  deriveRarityAura,
  type RarityAura,
} from './rarity';

/** 부드러운 원형 그라데이션 텍스처(그림자/오라/먼지 공용). */
export function ensureSoftCircleTexture(
  scene: Phaser.Scene,
  key: string,
  size: number,
  inner: string,
  outer: string
): string {
  if (scene.textures.exists(key)) return key;
  const canvas = scene.textures.createCanvas(key, size, size);
  if (!canvas) return key;
  const ctx = canvas.getContext();
  const r = size / 2;
  const grad = ctx.createRadialGradient(r, r, 0, r, r, r);
  grad.addColorStop(0, inner);
  grad.addColorStop(1, outer);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  canvas.refresh();
  return key;
}
