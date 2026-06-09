import Phaser from 'phaser';
import { AvatarConfig } from '../../../types';
import {
  TILE_SIZE, MAP_WIDTH, MAP_HEIGHT,
  DEPTH_FLOOR, DEPTH_ZONE_FLOOR, DEPTH_ZONE_GFX, DEPTH_WALL,
  Portal, UNIT_THEMES,
} from './lobby-constants';
import { ensureZoneTextures, ensureUnitFloorTexture, ZoneTextureKey } from './zone-textures';
import { prefersReducedMotion, ensureSoftCircleTexture } from './lobby-visuals';
import { RemotePlayerContainer } from './remote-player';

export interface TilemapSetupResult {
  wallLayer: Phaser.Tilemaps.TilemapLayer | null;
  portals: Portal[];
  playerContainer: RemotePlayerContainer;
}

/**
 * 로비 씬의 타일맵·텍스처·존·포탈을 생성하고 로컬 플레이어 컨테이너를 반환한다.
 * create() 초기화 블록을 분리해 LobbyScene 파일 크기를 줄인다.
 */
export function setupTilemapAndZones(
  scene: Phaser.Scene,
  portalRings: Map<string, Phaser.GameObjects.Arc>,
  nickname: string,
  avatarConfig: AvatarConfig,
  reducedMotion: boolean,
): TilemapSetupResult {
  // ── 보조 텍스처 (E-1/E-2) ────────────────────────────────────────────
  ensureZoneTextures(scene);
  ensureSoftCircleTexture(scene, 'soft-shadow', 32, 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0)');
  ensureSoftCircleTexture(scene, 'soft-glow', 48, 'rgba(255,255,255,0.9)', 'rgba(255,255,255,0)');
  ensureSoftCircleTexture(scene, 'dust', 12, 'rgba(180,220,255,0.8)', 'rgba(180,220,255,0)');

  // ── 타일셋 캔버스 텍스처 ────────────────────────────────────────────
  const canvas = scene.textures.createCanvas('lobby-tiles', TILE_SIZE * 4, TILE_SIZE);
  if (canvas) {
    const ctx = canvas.getContext();

    // Tile 1: Floor
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    ctx.strokeStyle = '#0e182e';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(TILE_SIZE / 2, 0);
    ctx.lineTo(TILE_SIZE / 2, TILE_SIZE);
    ctx.moveTo(0, TILE_SIZE / 2);
    ctx.lineTo(TILE_SIZE, TILE_SIZE / 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(0, 229, 255, 0.18)';
    ctx.beginPath();
    ctx.arc(TILE_SIZE / 2, TILE_SIZE / 2, 2, 0, Math.PI * 2);
    ctx.fill();

    // Tile 2: Wall
    ctx.fillStyle = '#0c1221';
    ctx.fillRect(TILE_SIZE, 0, TILE_SIZE, TILE_SIZE);
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(TILE_SIZE + 3, 3, TILE_SIZE - 6, TILE_SIZE - 6);
    ctx.fillStyle = 'rgba(0, 229, 255, 0.15)';
    ctx.fillRect(TILE_SIZE + 6, 6, TILE_SIZE - 12, TILE_SIZE - 12);

    // Tile 3: Zone floor
    ctx.fillStyle = '#0f0e26';
    ctx.fillRect(TILE_SIZE * 2, 0, TILE_SIZE, TILE_SIZE);
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(TILE_SIZE * 2, 0, TILE_SIZE, TILE_SIZE);

    // Tile 4: Border
    ctx.fillStyle = '#020617';
    ctx.fillRect(TILE_SIZE * 3, 0, TILE_SIZE, TILE_SIZE);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    ctx.strokeRect(TILE_SIZE * 3, 0, TILE_SIZE, TILE_SIZE);

    canvas.refresh();
  }

  // ── 스파크 파티클 텍스처 ────────────────────────────────────────────
  const sparkCanvas = scene.textures.createCanvas('spark', 8, 8);
  if (sparkCanvas) {
    const ctx = sparkCanvas.getContext();
    const grad = ctx.createRadialGradient(4, 4, 0, 4, 4, 4);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, '#00e5ff');
    grad.addColorStop(1, 'rgba(0, 229, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 8, 8);
    sparkCanvas.refresh();
  }

  // ── 타일맵 ────────────────────────────────────────────────────────────
  const map = scene.make.tilemap({
    tileWidth: TILE_SIZE,
    tileHeight: TILE_SIZE,
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
  });

  let wallLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  const portals: Portal[] = [];

  const tileset = map.addTilesetImage('lobby-tiles', 'lobby-tiles', TILE_SIZE, TILE_SIZE);
  if (tileset) {
    const floorLayer = map.createBlankLayer('Floor', tileset);
    wallLayer = map.createBlankLayer('Walls', tileset);

    floorLayer?.setDepth(DEPTH_FLOOR);
    wallLayer?.setDepth(DEPTH_WALL);
    floorLayer?.fill(1);

    // 경계 벽
    for (let x = 0; x < MAP_WIDTH; x++) {
      wallLayer?.putTileAt(2, x, 0);
      wallLayer?.putTileAt(2, x, MAP_HEIGHT - 1);
    }
    for (let y = 0; y < MAP_HEIGHT; y++) {
      wallLayer?.putTileAt(2, 0, y);
      wallLayer?.putTileAt(2, MAP_WIDTH - 1, y);
    }

    // 내부 기둥
    const obstacles = [
      { x: 24, y: 24 }, { x: 24, y: 60 },
      { x: 90, y: 24 }, { x: 90, y: 60 },
      { x: 56, y: 20 }, { x: 56, y: 64 },
    ];
    obstacles.forEach(obs => {
      wallLayer?.putTileAt(2, obs.x, obs.y);
      wallLayer?.putTileAt(2, obs.x + 1, obs.y);
      wallLayer?.putTileAt(2, obs.x, obs.y + 1);
      wallLayer?.putTileAt(2, obs.x + 1, obs.y + 1);
    });
    wallLayer?.setCollision([2]);

    scene.physics.world.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);

    // ── 존 그래픽 ──────────────────────────────────────────────────────
    const zoneGraphics = scene.add.graphics();
    zoneGraphics.setDepth(DEPTH_ZONE_GFX);

    const drawZone = (
      name: string,
      tx: number, ty: number, tw: number, th: number,
      color: number,
      themeKey?: ZoneTextureKey,
    ) => {
      const px = tx * TILE_SIZE;
      const py = ty * TILE_SIZE;
      const pw = tw * TILE_SIZE;
      const ph = th * TILE_SIZE;

      if (themeKey) {
        const floor = scene.add.tileSprite(px + pw / 2, py + ph / 2, pw - 8, ph - 8, themeKey);
        floor.setDepth(DEPTH_ZONE_FLOOR);
      }

      zoneGraphics.fillStyle(color, 0.05);
      zoneGraphics.fillRect(px, py, pw, ph);
      zoneGraphics.lineStyle(2, color, 0.7);
      zoneGraphics.strokeRect(px + 4, py + 4, pw - 8, ph - 8);

      scene.add.text(px + pw / 2, py + 20, name, {
        fontFamily: 'Galmuri11',
        fontSize: '12px',
        color: '#' + color.toString(16).padStart(6, '0'),
        fontStyle: 'bold',
      }).setOrigin(0.5);

      if (name === '중앙 광장') return;

      const cx = px + pw / 2;
      const cy = py + ph / 2;

      const ring = scene.add.arc(cx, cy, 18, 0, 360, false);
      ring.setStrokeStyle(1.5, color, 0.8);
      scene.tweens.add({ targets: ring, radius: 32, alpha: 0, duration: 1200, loop: -1 });
      portalRings.set(name, ring);

      const outerRing = scene.add.arc(cx, cy, 24, 0, 360, false);
      outerRing.setStrokeStyle(2, color, 0.6);
      scene.tweens.add({ targets: outerRing, angle: 360, duration: 3000, loop: -1 });

      const innerRing = scene.add.arc(cx, cy, 16, 0, 360, false);
      innerRing.setStrokeStyle(2.5, color, 0.95);
      scene.tweens.add({ targets: innerRing, angle: -360, duration: 2000, loop: -1 });

      zoneGraphics.fillStyle(color, 0.1);
      zoneGraphics.fillCircle(cx, cy, 20);
      zoneGraphics.lineStyle(3, color, 0.9);
      zoneGraphics.strokeCircle(cx, cy, 20);

      const core = scene.add.circle(cx, cy, 8, color, 0.8);
      scene.tweens.add({
        targets: core, scale: 1.3, alpha: 0.4,
        yoyo: true, repeat: -1, duration: 800, ease: 'Sine.easeInOut',
      });

      portals.push({ zoneName: name, x: cx, y: cy, radius: 20, color });
    };

    drawZone('중앙 광장',    50, 40, 20, 16, 0x00e5ff, 'zone-plaza');
    drawZone('배틀 아레나',  96, 40, 16, 16, 0xef4444, 'zone-lava');
    drawZone('보스 레이드 존', 8, 40, 16, 16, 0x8b5cf6, 'zone-nebula');
    drawZone('도감 박물관',  50, 72, 20, 12, 0x10b981, 'zone-marble');
    drawZone('포켓몬 센터',   8, 72, 16, 12, 0xec4899, 'zone-pinktile');
    drawZone('체육관',       96, 72, 16, 12, 0xf59e0b, 'zone-metal');
    drawZone('탐구 연구소',  48, 24, 20, 12, 0x2dd4bf, 'zone-lab');

    // 퀴즈 존 (북) — 8개 단원 개별 포탈
    const qpx = 8 * TILE_SIZE;
    const qpy = 4 * TILE_SIZE;
    const qpw = 104 * TILE_SIZE;
    const qph = 16 * TILE_SIZE;
    zoneGraphics.fillStyle(0xf59e0b, 0.05);
    zoneGraphics.fillRect(qpx, qpy, qpw, qph);
    zoneGraphics.lineStyle(2, 0xf59e0b, 0.7);
    zoneGraphics.strokeRect(qpx + 4, qpy + 4, qpw - 8, qph - 8);
    scene.add.text(qpx + qpw / 2, qpy + 24, '퀴즈 존 (북)', {
      fontFamily: 'Galmuri11', fontSize: '14px',
      color: '#f59e0b', fontStyle: 'bold',
    }).setOrigin(0.5);

    for (let i = 0; i < 8; i++) {
      const cx = (14.5 + i * 13.0) * TILE_SIZE;
      const cy = 12 * TILE_SIZE;
      const theme = UNIT_THEMES[i];
      const themeHex = '#' + theme.color.toString(16).padStart(6, '0');

      const unitFloorKey = ensureUnitFloorTexture(scene, theme.color);
      const unitFloor = scene.add.tileSprite(cx, cy, 12 * TILE_SIZE, 12 * TILE_SIZE, unitFloorKey);
      unitFloor.setDepth(DEPTH_ZONE_FLOOR);

      const qRing = scene.add.arc(cx, cy, 14, 0, 360, false);
      qRing.setStrokeStyle(1.5, theme.color, 0.8);
      scene.tweens.add({ targets: qRing, radius: 26, alpha: 0, duration: 1000 + i * 100, loop: -1 });

      const qSpinner = scene.add.arc(cx, cy, 18, 0, 360, false);
      qSpinner.setStrokeStyle(2, theme.color, 0.6);
      scene.tweens.add({ targets: qSpinner, angle: 360, duration: 2500, loop: -1 });

      zoneGraphics.fillStyle(theme.color, 0.1);
      zoneGraphics.fillCircle(cx, cy, 16);
      zoneGraphics.lineStyle(2, theme.color, 0.9);
      zoneGraphics.strokeCircle(cx, cy, 16);

      const qCore = scene.add.circle(cx, cy, 6, theme.color, 0.8);
      scene.tweens.add({
        targets: qCore, scale: 1.25, alpha: 0.5,
        yoyo: true, repeat: -1, duration: 700 + i * 50, ease: 'Sine.easeInOut',
      });

      scene.add.text(cx, cy - 22, `${i + 1}단원`, {
        fontFamily: 'Galmuri11', fontSize: '9px',
        color: themeHex, fontStyle: 'bold',
        backgroundColor: '#0a0f1dbf', padding: { x: 3, y: 1 },
      }).setOrigin(0.5);

      scene.add.text(cx, cy - 34, `${theme.emoji} ${theme.name}`, {
        fontFamily: 'Galmuri11', fontSize: '8px',
        color: themeHex, backgroundColor: '#0a0f1dcc', padding: { x: 4, y: 1 },
      }).setOrigin(0.5);

      portals.push({ zoneName: 'quiz', x: cx, y: cy, radius: 16, unitId: i + 1, color: theme.color });
    }
  }

  // ── 로컬 플레이어 컨테이너 ─────────────────────────────────────────
  const playerContainer = new RemotePlayerContainer(
    scene, 1920, 1536, nickname, avatarConfig, reducedMotion,
  );

  if (wallLayer && playerContainer) {
    scene.physics.add.collider(playerContainer, wallLayer);
  }

  scene.cameras.main.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);
  scene.cameras.main.startFollow(playerContainer, true, 0.1, 0.1);

  return { wallLayer, portals, playerContainer };
}
