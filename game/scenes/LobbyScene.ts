import Phaser from 'phaser';
import { AvatarConfig, EmoteId } from '../../types';
import { ensureZoneTextures, ensureUnitFloorTexture, ZoneTextureKey } from './lobby/zone-textures';
import { prefersReducedMotion, ensureSoftCircleTexture } from './lobby/lobby-visuals';
import { createLobbyDecorations } from './lobby/decorations';
import { RemotePlayerContainer } from './lobby/remote-player';
import { Portal, NpcData, UNIT_THEMES, SCIENTIST_TRIVIA } from './lobby/lobby-constants';

const TILE_SIZE = 32;
const MAP_WIDTH = 120;
const MAP_HEIGHT = 90;

// 렌더 깊이 레이어 — 바닥(가장 아래)부터 캐릭터·연출 순으로 쌓는다.
const DEPTH_FLOOR = -30;       // 기본 타일맵 바닥
const DEPTH_ZONE_FLOOR = -25;  // 존별 테마 바닥 tileSprite
const DEPTH_ZONE_GFX = -20;    // 존 외곽선·라벨
const DEPTH_DECOR = -15;       // 장식 오브젝트(바닥 부착)
const DEPTH_BG_PARTICLE = -12; // 배경 부유 파티클(캐릭터 뒤)
const DEPTH_WALL = -8;         // 벽/장애물
const DEPTH_OVERLAY = 1000;    // 비네팅·포탈 줌 연출(최상단)

export default class LobbyScene extends Phaser.Scene {
  private playerContainer: RemotePlayerContainer | null = null;
  private remotePlayers: Map<string, RemotePlayerContainer> = new Map();
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wKey: Phaser.Input.Keyboard.Key | null = null;
  private aKey: Phaser.Input.Keyboard.Key | null = null;
  private sKey: Phaser.Input.Keyboard.Key | null = null;
  private dKey: Phaser.Input.Keyboard.Key | null = null;
  
  private playerId: string = '';
  private nickname: string = '';
  private avatarConfig: AvatarConfig = {
    bodyColor: '#4f46e5',
    outfit: null,
    accessory: null,
    vehicle: null,
    hat: null,
    emote: null
  };

  private currentDirection: 'up' | 'down' | 'left' | 'right' | 'idle' = 'idle';
  private currentEmote: EmoteId | null = null;
  private lastBroadcastTime: number = 0;
  private wasMoving: boolean = false;
  
  private portals: Portal[] = [];
  private portalRings: Map<string, Phaser.GameObjects.Arc> = new Map();
  private lastEnteredZone: string | null = null;
  private npcs: Array<{ container: Phaser.GameObjects.Container; initialX: number; initialY: number; name: string }> = [];
  private emoteClearTimer: Phaser.Time.TimerEvent | null = null;
  private moveParticles: any = null; // Spark particle trail emitter
  private reducedMotion: boolean = false;
  private bgParticles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private vignette: Phaser.GameObjects.Image | null = null;
  private isTransitioning: boolean = false;
  private decorTweens: Phaser.Tweens.Tween[] = [];
  private minimap: Phaser.GameObjects.Container | null = null;
  private minimapDot: Phaser.GameObjects.Arc | null = null;
  private minimapScale: number = 0;
  private minimapOrigin = { x: 0, y: 0 };

  constructor() {
    super({ key: 'LobbyScene' });
  }

  public init(data?: { playerId?: string; nickname?: string; avatar?: AvatarConfig }): void {
    if (data) {
      this.playerId = data.playerId || 'player_' + Math.random().toString(36).substring(2, 9);
      this.nickname = data.nickname || '학생';
      if (data.avatar) {
        this.avatarConfig = data.avatar;
      }
    } else {
      // Fallback to localStorage or defaults
      this.playerId = 'player_' + Math.random().toString(36).substring(2, 9);
      this.nickname = '학생';
      if (typeof window !== 'undefined') {
        const savedPlayer = localStorage.getItem('science_pokedex_player');
        if (savedPlayer) {
          try {
            const parsed = JSON.parse(savedPlayer);
            this.playerId = parsed.id || this.playerId;
            this.nickname = parsed.nickname || this.nickname;
            if (parsed.avatar) this.avatarConfig = parsed.avatar;
          } catch (e) {
            console.error('Failed to parse saved player profile', e);
          }
        } else {
          const savedName = localStorage.getItem('science_pokedex_student_name');
          if (savedName) this.nickname = savedName;
        }
      }
    }
  }

  public preload(): void {
    // Dynamic canvas texture initialization occurs in create() to bypass missing assets safely.
  }

  public create(): void {
    this.reducedMotion = prefersReducedMotion();
    this.isTransitioning = false;

    // 존별 테마 바닥 + 보조 텍스처(그림자/오라/먼지) 생성 (E-1/E-2)
    ensureZoneTextures(this);
    ensureSoftCircleTexture(this, 'soft-shadow', 32, 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0)');
    ensureSoftCircleTexture(this, 'soft-glow', 48, 'rgba(255,255,255,0.9)', 'rgba(255,255,255,0)');
    ensureSoftCircleTexture(this, 'dust', 12, 'rgba(180,220,255,0.8)', 'rgba(180,220,255,0)');

    // 1. Draw dynamic tileset
    const canvas = this.textures.createCanvas('lobby-tiles', TILE_SIZE * 4, TILE_SIZE);
    if (canvas) {
      const ctx = canvas.getContext();
      
      // Tile 1: Floor (dark sci-fi grid floor with neon circuit grid lines)
      ctx.fillStyle = '#060913'; // Deeper dark navy
      ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      ctx.strokeStyle = '#0e182e';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
      
      // Draw neon blue tech dots and paths in some tiles (giving a high-tech circuit texture)
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

      // Tile 2: Wall / Solid Boundary Obstacle (neon-shielded wall)
      ctx.fillStyle = '#0c1221';
      ctx.fillRect(TILE_SIZE, 0, TILE_SIZE, TILE_SIZE);
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(TILE_SIZE + 3, 3, TILE_SIZE - 6, TILE_SIZE - 6);
      
      ctx.fillStyle = 'rgba(0, 229, 255, 0.15)';
      ctx.fillRect(TILE_SIZE + 6, 6, TILE_SIZE - 12, TILE_SIZE - 12);

      // Tile 3: Zone Area Floor (cyber indigo glow grid)
      ctx.fillStyle = '#0f0e26';
      ctx.fillRect(TILE_SIZE * 2, 0, TILE_SIZE, TILE_SIZE);
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)'; // Glowing purple border
      ctx.lineWidth = 1;
      ctx.strokeRect(TILE_SIZE * 2, 0, TILE_SIZE, TILE_SIZE);

      // Tile 4: Border Shading (very dark slate)
      ctx.fillStyle = '#020617';
      ctx.fillRect(TILE_SIZE * 3, 0, TILE_SIZE, TILE_SIZE);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.strokeRect(TILE_SIZE * 3, 0, TILE_SIZE, TILE_SIZE);

      canvas.refresh();
    }

    // Create glowing neon spark particle texture
    const sparkCanvas = this.textures.createCanvas('spark', 8, 8);
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

    // 2. Generate Tilemap structure
    const map = this.make.tilemap({
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
      width: MAP_WIDTH,
      height: MAP_HEIGHT
    });

    const tileset = map.addTilesetImage('lobby-tiles', 'lobby-tiles', TILE_SIZE, TILE_SIZE);
    if (tileset) {
      const floorLayer = map.createBlankLayer('Floor', tileset);
      const wallLayer = map.createBlankLayer('Walls', tileset);

      floorLayer?.setDepth(DEPTH_FLOOR);
      wallLayer?.setDepth(DEPTH_WALL);

      // Default fill floor
      floorLayer?.fill(1);

      // Render boundaries
      for (let x = 0; x < MAP_WIDTH; x++) {
        wallLayer?.putTileAt(2, x, 0);
        wallLayer?.putTileAt(2, x, MAP_HEIGHT - 1);
      }
      for (let y = 0; y < MAP_HEIGHT; y++) {
        wallLayer?.putTileAt(2, 0, y);
        wallLayer?.putTileAt(2, MAP_WIDTH - 1, y);
      }

      // Inner obstacles/pillars
      const obstacles = [
        { x: 24, y: 24 }, { x: 24, y: 60 },
        { x: 90, y: 24 }, { x: 90, y: 60 },
        { x: 56, y: 20 }, { x: 56, y: 64 }
      ];
      obstacles.forEach(obs => {
        wallLayer?.putTileAt(2, obs.x, obs.y);
        wallLayer?.putTileAt(2, obs.x + 1, obs.y);
        wallLayer?.putTileAt(2, obs.x, obs.y + 1);
        wallLayer?.putTileAt(2, obs.x + 1, obs.y + 1);
      });

      // Mark collisions
      wallLayer?.setCollision([2]);

      // Set physics world bounds
      this.physics.world.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);

      // 3. Draw Zone Rectangles
      const zoneGraphics = this.add.graphics();
      zoneGraphics.setDepth(DEPTH_ZONE_GFX);

      const drawZone = (
        name: string,
        tx: number,
        ty: number,
        tw: number,
        th: number,
        color: number,
        themeKey?: ZoneTextureKey
      ) => {
        const px = tx * TILE_SIZE;
        const py = ty * TILE_SIZE;
        const pw = tw * TILE_SIZE;
        const ph = th * TILE_SIZE;

        // 존별 테마 바닥 텍스처를 영역 전체에 깐다 (E-1)
        if (themeKey) {
          const floor = this.add.tileSprite(px + pw / 2, py + ph / 2, pw - 8, ph - 8, themeKey);
          floor.setDepth(DEPTH_ZONE_FLOOR);
        }

        // Draw low-opacity filled zone
        zoneGraphics.fillStyle(color, 0.05);
        zoneGraphics.fillRect(px, py, pw, ph);

        // Draw neon dashed-style outline border
        zoneGraphics.lineStyle(2, color, 0.7);
        zoneGraphics.strokeRect(px + 4, py + 4, pw - 8, ph - 8);

        // Zone Name Label Text (using pixel font)
        this.add.text(px + pw / 2, py + 20, name, {
          fontFamily: 'Galmuri11',
          fontSize: '12px',
          color: '#' + color.toString(16).padStart(6, '0'),
          fontStyle: 'bold'
        }).setOrigin(0.5);

        // 중앙 광장인 경우 포탈을 그리지 않음
        if (name === '중앙 광장') return;

        // Spawn Portal Glowing Circle at center
        const cx = px + pw / 2;
        const cy = py + ph / 2;
        
        // Glow Expand Ring animation
        const ring = this.add.arc(cx, cy, 18, 0, 360, false);
        ring.setStrokeStyle(1.5, color, 0.8);
        this.tweens.add({
          targets: ring,
          radius: 32,
          alpha: 0,
          duration: 1200,
          loop: -1
        });

        this.portalRings.set(name, ring);

        // Outer concentric spinning tech ring (represented by a dashed line or rotating arcs)
        const outerRing = this.add.arc(cx, cy, 24, 0, 360, false);
        outerRing.setStrokeStyle(2, color, 0.6);
        this.tweens.add({
          targets: outerRing,
          angle: 360,
          duration: 3000,
          loop: -1
        });
        
        // Inner concentric spinning tech ring spinning in opposite direction
        const innerRing = this.add.arc(cx, cy, 16, 0, 360, false);
        innerRing.setStrokeStyle(2.5, color, 0.95);
        this.tweens.add({
          targets: innerRing,
          angle: -360,
          duration: 2000,
          loop: -1
        });

        zoneGraphics.fillStyle(color, 0.1);
        zoneGraphics.fillCircle(cx, cy, 20);
        zoneGraphics.lineStyle(3, color, 0.9);
        zoneGraphics.strokeCircle(cx, cy, 20);

        // Glowing central core instead of emoji text
        const core = this.add.circle(cx, cy, 8, color, 0.8);
        this.tweens.add({
          targets: core,
          scale: 1.3,
          alpha: 0.4,
          yoyo: true,
          repeat: -1,
          duration: 800,
          ease: 'Sine.easeInOut'
        });

        // Add to collision/overlap list
        this.portals.push({
          zoneName: name,
          x: cx,
          y: cy,
          radius: 20,
          color
        });
      };

      // Zones Setup: 중앙 광장, 배틀 아레나, 보스 레이드 존, 도감 박물관, 포켓몬 센터, 체육관
      drawZone('중앙 광장', 50, 40, 20, 16, 0x00e5ff, 'zone-plaza'); // Cyan (Center)
      drawZone('배틀 아레나', 96, 40, 16, 16, 0xef4444, 'zone-lava'); // Red (East)
      drawZone('보스 레이드 존', 8, 40, 16, 16, 0x8b5cf6, 'zone-nebula'); // Purple (West)
      drawZone('도감 박물관', 50, 72, 20, 12, 0x10b981, 'zone-marble'); // Emerald (South)
      drawZone('포켓몬 센터', 8, 72, 16, 12, 0xec4899, 'zone-pinktile'); // Pink (South-West)
      drawZone('체육관', 96, 72, 16, 12, 0xf59e0b, 'zone-metal'); // Amber (South-East)

      // 퀴즈 존 (북) - 8개 단원 개별 포탈 생성
      const qpx = 8 * TILE_SIZE;
      const qpy = 4 * TILE_SIZE;
      const qpw = 104 * TILE_SIZE;
      const qph = 16 * TILE_SIZE;
      zoneGraphics.fillStyle(0xf59e0b, 0.05);
      zoneGraphics.fillRect(qpx, qpy, qpw, qph);
      zoneGraphics.lineStyle(2, 0xf59e0b, 0.7);
      zoneGraphics.strokeRect(qpx + 4, qpy + 4, qpw - 8, qph - 8);
      this.add.text(qpx + qpw / 2, qpy + 24, '퀴즈 존 (북)', {
        fontFamily: 'Galmuri11',
        fontSize: '14px',
        color: '#f59e0b',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      for (let i = 0; i < 8; i++) {
        const cx = (14.5 + i * 13.0) * TILE_SIZE;
        const cy = 12 * TILE_SIZE;
        const theme = UNIT_THEMES[i];
        const themeHex = '#' + theme.color.toString(16).padStart(6, '0');

        // 단원 색 그라데이션 바닥 패치 (E-1)
        const unitFloorKey = ensureUnitFloorTexture(this, theme.color);
        const unitFloor = this.add.tileSprite(cx, cy, 12 * TILE_SIZE, 12 * TILE_SIZE, unitFloorKey);
        unitFloor.setDepth(DEPTH_ZONE_FLOOR);

        // Glowing Ring Particle
        const qRing = this.add.arc(cx, cy, 14, 0, 360, false);
        qRing.setStrokeStyle(1.5, theme.color, 0.8);
        this.tweens.add({
          targets: qRing,
          radius: 26,
          alpha: 0,
          duration: 1000 + i * 100,
          loop: -1
        });

        // Spinning concentric ring
        const qSpinner = this.add.arc(cx, cy, 18, 0, 360, false);
        qSpinner.setStrokeStyle(2, theme.color, 0.6);
        this.tweens.add({
          targets: qSpinner,
          angle: 360,
          duration: 2500,
          loop: -1
        });

        // Portal base
        zoneGraphics.fillStyle(theme.color, 0.1);
        zoneGraphics.fillCircle(cx, cy, 16);
        zoneGraphics.lineStyle(2, theme.color, 0.9);
        zoneGraphics.strokeCircle(cx, cy, 16);

        // Core dot
        const qCore = this.add.circle(cx, cy, 6, theme.color, 0.8);
        this.tweens.add({
          targets: qCore,
          scale: 1.25,
          alpha: 0.5,
          yoyo: true,
          repeat: -1,
          duration: 700 + i * 50,
          ease: 'Sine.easeInOut'
        });

        // Unit number label
        this.add.text(cx, cy - 22, `${i + 1}단원`, {
          fontFamily: 'Galmuri11',
          fontSize: '9px',
          color: themeHex,
          fontStyle: 'bold',
          backgroundColor: '#0a0f1dbf',
          padding: { x: 3, y: 1 }
        }).setOrigin(0.5);

        // Unit theme name label
        this.add.text(cx, cy - 34, `${theme.emoji} ${theme.name}`, {
          fontFamily: 'Galmuri11',
          fontSize: '8px',
          color: themeHex,
          backgroundColor: '#0a0f1dcc',
          padding: { x: 4, y: 1 }
        }).setOrigin(0.5);

        this.portals.push({
          zoneName: 'quiz',
          x: cx,
          y: cy,
          radius: 16,
          unitId: i + 1,
          color: theme.color
        });
      }

      // 4. Instantiate Local Player (spawn at center of 120x90)
      this.playerContainer = new RemotePlayerContainer(this, 1920, 1536, this.nickname, this.avatarConfig, this.reducedMotion);

      // Collider against bounds/walls
      if (wallLayer && this.playerContainer) {
        this.physics.add.collider(this.playerContainer, wallLayer);
      }

      // Setup Camera following local player
      this.cameras.main.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);
      this.cameras.main.startFollow(this.playerContainer, true, 0.1, 0.1);
    }

    // 5. Keyboard Listener Setup
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wKey = this.input.keyboard.addKey('W');
      this.aKey = this.input.keyboard.addKey('A');
      this.sKey = this.input.keyboard.addKey('S');
      this.dKey = this.input.keyboard.addKey('D');
    }

    // 6. Spawn wandering scientist NPCs
    this.spawnNPCs();

    // 6.5. 절차적 장식 오브젝트 + 분위기 레이어 (E-1)
    const decor = createLobbyDecorations(this, DEPTH_DECOR, this.reducedMotion);
    this.decorTweens = decor.tweens;
    this.setupAtmosphere();
    this.setupMinimap();

    // 7. Event sync binding: React Presence List updates & Emotes
    const presenceListener = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        // Handle presence updates safely
        this.handlePresenceUpdate(customEvent.detail);
      }
    };
    
    const emoteListener = (e: Event) => {
      const customEvent = e as CustomEvent<{ emote: EmoteId }>;
      if (customEvent.detail && customEvent.detail.emote) {
        this.triggerLocalEmote(customEvent.detail.emote);
      }
    };
    
    const moveListener = (e: Event) => {
      const customEvent = e as CustomEvent<{ x: number; y: number }>;
      if (customEvent.detail) {
        this.updatePlayerPositionFromParent(customEvent.detail.x, customEvent.detail.y);
      }
    };
    
    window.addEventListener('react:presenceUpdate', presenceListener);
    window.addEventListener('react:triggerEmote', emoteListener);
    window.addEventListener('react:movePlayer', moveListener);

    const avatarListener = (e: Event) => {
      const customEvent = e as CustomEvent<{ nickname: string; avatar: AvatarConfig }>;
      if (customEvent.detail) {
        const { nickname, avatar } = customEvent.detail;
        this.nickname = nickname;
        this.recreatePlayerTexture(avatar);
      }
    };
    window.addEventListener('react:avatarUpdate', avatarListener);

    // Instantiate Spark Particle Emitter
    this.moveParticles = this.add.particles(0, 0, 'spark', {
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.7, end: 0 },
      lifespan: 500,
      blendMode: 'ADD',
      frequency: -1
    });

    this.events.once('shutdown', () => {
      window.removeEventListener('react:presenceUpdate', presenceListener);
      window.removeEventListener('react:triggerEmote', emoteListener);
      window.removeEventListener('react:movePlayer', moveListener);
      window.removeEventListener('react:avatarUpdate', avatarListener);
      if (this.emoteClearTimer) this.emoteClearTimer.destroy();
      if (this.moveParticles) this.moveParticles.destroy();
      if (this.bgParticles) this.bgParticles.destroy();
      if (this.vignette) this.vignette.destroy();
      if (this.minimap) this.minimap.destroy();
      this.decorTweens.forEach(t => t.stop());
      this.decorTweens = [];
    });
  }

  /**
   * 분위기 레이어 (E-1): 배경 부유 파티클(먼지/별) + 비네팅.
   * compositor 친화 속성만 사용하고, reduced-motion이면 파티클을 감쇠한다.
   */
  private setupAtmosphere(): void {
    const worldW = MAP_WIDTH * TILE_SIZE;
    const worldH = MAP_HEIGHT * TILE_SIZE;

    // 배경 부유 먼지/별 — 파티클 수 상한으로 저사양 교실 PC 보호 (E-4)
    if (!this.reducedMotion) {
      this.bgParticles = this.add.particles(0, 0, 'dust', {
        x: { min: 0, max: worldW },
        y: { min: 0, max: worldH },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 0.5, end: 0 },
        lifespan: 4000,
        frequency: 220,      // 약 4.5/초 → 동시 입자 ~18개로 제한
        blendMode: 'ADD',
        speedY: { min: -6, max: -18 },
        speedX: { min: -4, max: 4 },
      });
      this.bgParticles.setDepth(DEPTH_BG_PARTICLE);
    }

    // 비네팅 — 카메라에 고정(scrollFactor 0)된 어두운 가장자리 오버레이
    const cam = this.cameras.main;
    const vignetteKey = 'lobby-vignette';
    if (!this.textures.exists(vignetteKey)) {
      const size = 256;
      const canvas = this.textures.createCanvas(vignetteKey, size, size);
      if (canvas) {
        const ctx = canvas.getContext();
        const grad = ctx.createRadialGradient(size / 2, size / 2, size * 0.3, size / 2, size / 2, size * 0.62);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.5)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
        canvas.refresh();
      }
    }
    this.vignette = this.add.image(cam.width / 2, cam.height / 2, vignetteKey);
    this.vignette.setDisplaySize(cam.width, cam.height);
    this.vignette.setScrollFactor(0);
    this.vignette.setDepth(DEPTH_OVERLAY);
    this.vignette.setAlpha(0.85);
  }

  /**
   * 우상단 절차 미니맵 (E-3): 존 위치 + 내 위치 점. 카메라 고정(scrollFactor 0).
   * 매 프레임 점 위치만 갱신하므로 비용이 낮다.
   */
  private setupMinimap(): void {
    const cam = this.cameras.main;
    const worldW = MAP_WIDTH * TILE_SIZE;
    const worldH = MAP_HEIGHT * TILE_SIZE;
    const panelW = 132;
    this.minimapScale = panelW / worldW;
    const panelH = worldH * this.minimapScale;

    const originX = cam.width - panelW - 12;
    const originY = 12;
    this.minimapOrigin = { x: originX, y: originY };

    const g = this.add.graphics();
    g.fillStyle(0x05080f, 0.78);
    g.fillRoundedRect(0, 0, panelW, panelH, 6);
    g.lineStyle(1.5, 0x00e5ff, 0.5);
    g.strokeRoundedRect(0, 0, panelW, panelH, 6);

    // 존 마커
    const zones: Array<{ x: number; y: number; color: number }> = [
      { x: 60, y: 48, color: 0x00e5ff }, // 광장
      { x: 104, y: 48, color: 0xef4444 }, // 배틀
      { x: 16, y: 48, color: 0x8b5cf6 }, // 레이드
      { x: 60, y: 78, color: 0x10b981 }, // 박물관
      { x: 16, y: 78, color: 0xec4899 }, // 센터
      { x: 104, y: 78, color: 0xf59e0b }, // 체육관
      { x: 60, y: 12, color: 0xf59e0b }, // 퀴즈
    ];
    zones.forEach((z) => {
      const mx = z.x * TILE_SIZE * this.minimapScale;
      const my = z.y * TILE_SIZE * this.minimapScale;
      g.fillStyle(z.color, 0.85);
      g.fillCircle(mx, my, 2.5);
    });

    this.minimapDot = this.add.arc(0, 0, 3, 0, 360, false, 0xffffff);
    this.minimapDot.setStrokeStyle(1, 0x00e5ff);

    this.minimap = this.add.container(originX, originY, [g, this.minimapDot]);
    this.minimap.setScrollFactor(0);
    this.minimap.setDepth(DEPTH_OVERLAY);
  }

  public updateClassmates(
    classmates: Array<{
      name: string;
      avatar: string;
      x: number;
      y: number;
      equippedCosmetics?: {
        outfit: string;
        expression: string;
        accessory: string;
        mount: string;
        hat?: string;
        petId?: string;
      };
    }>
  ): void {
    const activeIds = new Set<string>();

    classmates.forEach(playerData => {
      if (playerData.name === this.nickname) {
        return;
      }

      const id = playerData.name;
      if (!id) return;

      activeIds.add(id);

      const nickname = playerData.name || '학생';
      
      const rawX = playerData.x ?? 1920;
      const rawY = playerData.y ?? 1536;
      const targetPx = (rawX < 120) ? (rawX * 32 + 16) : rawX;
      const targetPy = (rawY < 90) ? (rawY * 32 + 16) : rawY;

      // Parse cosmetics
      let avatar: AvatarConfig = {
        bodyColor: '#3b82f6',
        outfit: null,
        accessory: null,
        vehicle: null,
        hat: null,
        emote: null
      };

      if (playerData.equippedCosmetics) {
        const eq = playerData.equippedCosmetics;
        avatar = {
          bodyColor: '#3b82f6',
          outfit: (eq.outfit && eq.outfit !== 'none') ? eq.outfit : null,
          accessory: (eq.accessory && eq.accessory !== 'none') ? eq.accessory : null,
          vehicle: (eq.mount && eq.mount !== 'none') ? eq.mount : null,
          hat: (eq.hat && eq.hat !== 'none') ? eq.hat : null,
          emote: (eq.expression && ['wave', 'cheer', 'think', 'celebrate', 'sad'].includes(eq.expression)) ? eq.expression as EmoteId : null,
          petId: (eq.petId && eq.petId !== 'none') ? eq.petId : null
        };
      }

      let remote = this.remotePlayers.get(id);
      if (!remote) {
        remote = new RemotePlayerContainer(this, targetPx, targetPy, nickname, avatar, this.reducedMotion);
        this.remotePlayers.set(id, remote);
      } else {
        remote.updateAvatar(avatar);
        remote.targetX = targetPx;
        remote.targetY = targetPy;
      }

      if (avatar.emote) {
        remote.showEmote(avatar.emote);
      }
    });

    // Remove stale players
    this.remotePlayers.forEach((remote, id) => {
      if (!activeIds.has(id)) {
        remote.destroy();
        this.remotePlayers.delete(id);
      }
    });
  }

  public updatePlayerPositionFromParent(x: number, y: number): void {
    if (!this.playerContainer) return;
    const targetPx = (x < 120) ? (x * 32 + 16) : x;
    const targetPy = (y < 90) ? (y * 32 + 16) : y;
    
    this.playerContainer.setPosition(targetPx, targetPy);
    
    const body = this.playerContainer.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.reset(targetPx, targetPy);
    }
  }

  public recreatePlayerTexture(avatar: AvatarConfig): void {
    this.avatarConfig = avatar;
    if (this.playerContainer) {
      this.playerContainer.updateAvatar(avatar);
    }
  }

  public update(time: number, delta: number): void {
    if (!this.playerContainer) return;

    let vx = 0;
    let vy = 0;

    // Movement calculation with mount speed modifier
    if (this.cursors) {
      let speed = 160;
      const vehicle = this.avatarConfig.vehicle;
      if (vehicle === 'vehicle_rocket') speed = 280;       // 1.75x speed
      else if (vehicle === 'vehicle_ufo') speed = 230;      // 1.45x speed
      else if (vehicle === 'vehicle_submarine') speed = 110;// slow under water
      else if (vehicle === 'vehicle_balloon') speed = 130;  // slower
      else if (vehicle === 'vehicle_scooter') speed = 200;  // 1.25x speed
      else if (vehicle === 'vehicle_skates') speed = 180;   // 1.125x speed

      if (this.cursors.left.isDown || this.aKey?.isDown) {
        vx = -speed;
      } else if (this.cursors.right.isDown || this.dKey?.isDown) {
        vx = speed;
      }

      if (this.cursors.up.isDown || this.wKey?.isDown) {
        vy = -speed;
      } else if (this.cursors.down.isDown || this.sKey?.isDown) {
        vy = speed;
      }
    }

    // Diagonal speed normalization
    if (vx !== 0 && vy !== 0) {
      vx *= Math.SQRT1_2;
      vy *= Math.SQRT1_2;
    }

    const body = this.playerContainer.body as Phaser.Physics.Arcade.Body;
    let actualVx = 0;
    let actualVy = 0;
    
    if (body) {
      // Smooth movement interpolation (acceleration & drag)
      const accel = 0.25; // 25% linear interpolation factor per frame for smooth transitions
      const targetVx = vx;
      const targetVy = vy;
      const currentVx = body.velocity.x;
      const currentVy = body.velocity.y;
      
      const newVx = Phaser.Math.Linear(currentVx, targetVx, accel);
      const newVy = Phaser.Math.Linear(currentVy, targetVy, accel);
      body.setVelocity(newVx, newVy);
      
      actualVx = newVx;
      actualVy = newVy;
    }

    // Identify direction state
    let direction: 'up' | 'down' | 'left' | 'right' | 'idle' = 'idle';
    if (vx < 0) direction = 'left';
    else if (vx > 0) direction = 'right';
    else if (vy < 0) direction = 'up';
    else if (vy > 0) direction = 'down';

    this.currentDirection = direction;

    // Dispatch position update periodically
    const isMoving = (Math.abs(actualVx) > 5 || Math.abs(actualVy) > 5);
    
    // Emit particle trail when moving
    if (isMoving && this.moveParticles && this.playerContainer) {
      this.moveParticles.emitParticleAt(this.playerContainer.x, this.playerContainer.y + 12);
    }

    if (isMoving) {
      if (time - this.lastBroadcastTime >= 100) {
        this.dispatchPositionUpdate();
        this.lastBroadcastTime = time;
      }
      this.wasMoving = true;
    } else if (this.wasMoving) {
      // Send one final idle update upon halting
      this.dispatchPositionUpdate();
      this.wasMoving = false;
    }

    // Collision/Overlap check against portals
    this.checkPortalCollisions();

    // Light up Boss Raid portal with intense red glow if active
    const session = this.registry.get('classroomSession');
    const isRaidActive = session?.status === 'raid' || session?.settings?.raidEnabled;
    const raidRing = this.portalRings.get('보스 레이드 존');
    if (raidRing) {
      if (isRaidActive) {
        raidRing.setStrokeStyle(2, 0xef4444, 1); // Intense Red glow when active
      } else {
        raidRing.setStrokeStyle(1.5, 0x8b5cf6, 0.4); // Pale purple when inactive
      }
    }

    // Smoothly interpolate other players
    this.remotePlayers.forEach(remote => {
      const distance = Phaser.Math.Distance.Between(remote.x, remote.y, remote.targetX, remote.targetY);
      if (distance > 200) {
        remote.setPosition(remote.targetX, remote.targetY);
      } else {
        remote.x = Phaser.Math.Linear(remote.x, remote.targetX, 0.15);
        remote.y = Phaser.Math.Linear(remote.y, remote.targetY, 0.15);
      }
    });

    // 미니맵 내 위치 점 갱신 (E-3)
    if (this.minimapDot && this.playerContainer) {
      this.minimapDot.setPosition(
        this.playerContainer.x * this.minimapScale,
        this.playerContainer.y * this.minimapScale
      );
    }
  }

  private dispatchPositionUpdate(): void {
    if (!this.playerContainer) return;
    const event = new CustomEvent('phaser:positionUpdate', {
      detail: {
        playerId: this.playerId,
        x: this.playerContainer.x,
        y: this.playerContainer.y,
        direction: this.currentDirection,
        animFrame: 0,
        emote: this.currentEmote
      }
    });
    window.dispatchEvent(event);
  }

  private triggerLocalEmote(emote: EmoteId): void {
    this.currentEmote = emote;
    this.playerContainer?.showEmote(emote);
    this.dispatchPositionUpdate();

    if (this.emoteClearTimer) {
      this.emoteClearTimer.destroy();
    }
    
    this.emoteClearTimer = this.time.delayedCall(3000, () => {
      this.currentEmote = null;
      this.dispatchPositionUpdate();
    });
  }

  private checkPortalCollisions(): void {
    if (!this.playerContainer) return;

    let currentOverlapPortal: Portal | null = null;
    for (const portal of this.portals) {
      const dist = Phaser.Math.Distance.Between(this.playerContainer.x, this.playerContainer.y, portal.x, portal.y);
      if (dist <= portal.radius + 16) { // 16px is player body radius
        currentOverlapPortal = portal;
        break;
      }
    }

    const currentZoneKey = currentOverlapPortal 
      ? (currentOverlapPortal.zoneName === 'quiz' 
          ? `quiz_${currentOverlapPortal.unitId}` 
          : currentOverlapPortal.zoneName)
      : null;

    if (currentZoneKey !== this.lastEnteredZone) {
      if (currentOverlapPortal) {
        const zoneName = currentOverlapPortal.zoneName;

        // If it is Boss Raid portal, check if it's active
        if (zoneName === '보스 레이드 존') {
          const session = this.registry.get('classroomSession');
          const isRaidActive = session?.status === 'raid' || session?.settings?.raidEnabled;
          if (!isRaidActive) {
            this.playerContainer.showEmote('think'); // Trigger think emote warning
            const event = new CustomEvent('phaser:zoneWarning', {
              detail: { message: '보스 레이드가 활성화되지 않았습니다. 교사의 시작 승인을 기다려야 합니다.' }
            });
            window.dispatchEvent(event);
            this.lastEnteredZone = currentZoneKey;
            return;
          } else {
            // Transition to RaidScene
            this.playPortalEnterEffect(this.playerContainer.x, this.playerContainer.y, 0x8b5cf6);
            this.scene.start('RaidScene', {
              sessionCode: this.registry.get('sessionCode'),
              playerId: this.playerId,
              nickname: this.nickname,
              avatar: this.avatarConfig
            });
            this.lastEnteredZone = currentZoneKey;
            
            const event = new CustomEvent('phaser:zoneEntered', {
              detail: { 
                zone: 'raid',
                unitId: currentOverlapPortal.unitId
              }
            });
            window.dispatchEvent(event);
            return;
          }
        }

        // Translate zones
        let mappedZone = 'quiz';
        if (zoneName === '배틀 아레나') mappedZone = 'battle';
        else if (zoneName === '보스 레이드 존') mappedZone = 'raid';
        else if (zoneName === '도감 박물관') mappedZone = 'museum';
        else if (zoneName === '포켓몬 센터') mappedZone = 'center';
        else if (zoneName === '체육관') mappedZone = 'gym';

        this.playPortalEnterEffect(
          this.playerContainer.x,
          this.playerContainer.y,
          currentOverlapPortal.color ?? 0x00e5ff
        );

        const event = new CustomEvent('phaser:zoneEntered', {
          detail: {
            zone: mappedZone,
            unitId: currentOverlapPortal.unitId
          }
        });
        window.dispatchEvent(event);
      }
      this.lastEnteredZone = currentZoneKey;
    }
  }

  /**
   * 포탈 진입 연출 (E-3): 파티클 버스트 + 카메라 플래시 + 짧은 줌 펀치.
   * reduced-motion이면 줌·파티클을 생략하고 가벼운 플래시만 남긴다 (E-4).
   */
  private playPortalEnterEffect(x: number, y: number, color: number): void {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    const col = Phaser.Display.Color.IntegerToColor(color);
    const cam = this.cameras.main;
    cam.flash(220, col.red, col.green, col.blue);

    if (!this.reducedMotion) {
      // 1회성 파티클 버스트 — 수명 후 자동 정리
      const burst = this.add.particles(x, y, 'spark', {
        speed: { min: 60, max: 180 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 0.9, end: 0 },
        lifespan: 500,
        blendMode: 'ADD',
        tint: color,
        emitting: false,
      });
      burst.setDepth(DEPTH_OVERLAY - 1);
      burst.explode(24, x, y);
      this.time.delayedCall(700, () => burst.destroy());

      // 줌 펀치 — 진입감 강조 후 원복
      const prevZoom = cam.zoom;
      cam.zoomTo(prevZoom * 1.12, 140, 'Sine.easeOut');
      this.time.delayedCall(160, () => cam.zoomTo(prevZoom, 200, 'Sine.easeInOut'));
    }

    // 연출 락 해제(다음 포탈 진입 허용). 씬 전환 시엔 무의미하나 안전.
    this.time.delayedCall(400, () => { this.isTransitioning = false; });
  }

  private handlePresenceUpdate(
    playersData: Record<string, {
      id?: string;
      name?: string;
      nickname?: string;
      x?: number;
      y?: number;
      position?: { x: number; y: number };
      equippedCosmetics?: {
        outfit: string;
        expression: string;
        accessory: string;
        mount: string;
      };
      avatar?: AvatarConfig;
      emote?: EmoteId;
    }> | Array<{
      id?: string;
      name?: string;
      nickname?: string;
      x?: number;
      y?: number;
      position?: { x: number; y: number };
      equippedCosmetics?: {
        outfit: string;
        expression: string;
        accessory: string;
        mount: string;
      };
      avatar?: AvatarConfig;
      emote?: EmoteId;
    }>
  ): void {
    const activeIds = new Set<string>();
    
    const list = Array.isArray(playersData)
      ? playersData
      : Object.keys(playersData).map(key => ({ id: key, ...playersData[key] }));

    list.forEach(playerData => {
      // Exclude local player nickname or ID
      if (playerData.id === this.playerId || playerData.name === this.nickname) {
        return;
      }

      const id = playerData.id || playerData.name;
      if (!id) return;

      activeIds.add(id);

      const nickname = playerData.nickname || playerData.name || '학생';
      
      // Parse coordinates (support grid coordinates mapping)
      const rawX = playerData.position?.x ?? playerData.x ?? 1920;
      const rawY = playerData.position?.y ?? playerData.y ?? 1536;
      const targetPx = (rawX < 120) ? (rawX * 32 + 16) : rawX;
      const targetPy = (rawY < 90) ? (rawY * 32 + 16) : rawY;

      // Parse cosmetics
      let avatar: AvatarConfig = {
        bodyColor: '#4f46e5',
        outfit: null,
        accessory: null,
        vehicle: null,
        hat: null,
        emote: null
      };

      if (playerData.avatar && typeof playerData.avatar === 'object') {
        avatar = playerData.avatar;
      } else if (playerData.equippedCosmetics && typeof playerData.equippedCosmetics === 'object') {
        const eq = playerData.equippedCosmetics as any;
        avatar = {
          bodyColor: '#4f46e5',
          outfit: eq.outfit !== 'none' ? eq.outfit : null,
          accessory: eq.accessory !== 'none' ? eq.accessory : null,
          vehicle: eq.mount !== 'none' ? eq.mount : null,
          hat: eq.hat && eq.hat !== 'none' ? eq.hat : null,
          emote: (eq.expression && ['wave', 'cheer', 'think', 'celebrate', 'sad'].includes(eq.expression)) ? eq.expression as EmoteId : null,
          petId: eq.petId && eq.petId !== 'none' ? eq.petId : null
        };
      }

      let remote = this.remotePlayers.get(id);
      if (!remote) {
        remote = new RemotePlayerContainer(this, targetPx, targetPy, nickname, avatar, this.reducedMotion);
        this.remotePlayers.set(id, remote);
      } else {
        remote.updateAvatar(avatar);
        remote.targetX = targetPx;
        remote.targetY = targetPy;
      }

      const rawExpression = playerData.equippedCosmetics?.expression;
      const emote = playerData.emote ?? playerData.avatar?.emote ?? (
        (rawExpression && ['wave', 'cheer', 'think', 'celebrate', 'sad'].includes(rawExpression)) ? rawExpression as EmoteId : null
      );
      if (emote) {
        remote.showEmote(emote);
      }
    });

    // Remove stale players
    this.remotePlayers.forEach((remote, id) => {
      if (!activeIds.has(id)) {
        remote.destroy();
        this.remotePlayers.delete(id);
      }
    });
  }

  private spawnNPCs(): void {
    const npcDefinitions: NpcData[] = [
      { name: '갈릴레이 박사', emoji: '🔭', initialX: 464, initialY: 320 },    // 1단원
      { name: '뉴턴 박사', emoji: '🧑‍🔬', initialX: 880, initialY: 320 },     // 2단원
      { name: '파스퇴르 박사', emoji: '🧪', initialX: 1296, initialY: 320 },      // 3단원
      { name: '나이팅게일 박사', emoji: '🩺', initialX: 1712, initialY: 320 },    // 4단원
      { name: '다윈 박사', emoji: '🧔', initialX: 2128, initialY: 320 },        // 5단원
      { name: '베게너 박사', emoji: '🌀', initialX: 2544, initialY: 320 },      // 6단원
      { name: '아인슈타인 박사', emoji: '👨‍🔬', initialX: 2960, initialY: 320 },  // 7단원
      { name: '퀴리 박사', emoji: '👩‍🔬', initialX: 3376, initialY: 320 },      // 8단원
      { name: '아이템 상인 포켓박사', emoji: '🪙', initialX: 1920, initialY: 1480 } // 상점
    ];

    npcDefinitions.forEach(npc => {
      const container = this.add.container(npc.initialX, npc.initialY);
      const visuals = this.add.container(0, 0);
      container.add(visuals);

      // Glowing green hover plate beneath drone NPC
      const hoverColor = npc.name === '아이템 상인 포켓박사' ? 0xf59e0b : 0x10b981;
      const hoverPlate = this.add.ellipse(0, 18, 20, 6, hoverColor, 0.4);
      visuals.add(hoverPlate);
      this.tweens.add({
        targets: hoverPlate,
        scaleX: 1.35,
        scaleY: 1.35,
        alpha: 0.05,
        yoyo: true,
        repeat: -1,
        duration: 1200 + Phaser.Math.Between(0, 300)
      });

      // Base body circle for NPC (cyber drone casing)
      const bodyCircle = this.add.arc(0, 0, 16, 0, 360, false, 0x0f172a);
      bodyCircle.setStrokeStyle(2.5, hoverColor);
      visuals.add(bodyCircle);

      // Head text/emoji representing the scientist inside the drone bubble
      const head = this.add.text(0, -4, npc.emoji, { fontSize: '18px' }).setOrigin(0.5);
      visuals.add(head);

      // Name tag
      const tag = this.add.text(0, -25, npc.name, {
        fontFamily: 'Arial',
        fontSize: '9px',
        color: '#' + hoverColor.toString(16).padStart(6, '0'),
        backgroundColor: '#020617ef',
        padding: { x: 4, y: 1.5 }
      }).setOrigin(0.5);
      visuals.add(tag);

      // Trivia speech bubble (invisible initially)
      const bubbleBg = this.add.graphics();
      const bubbleText = this.add.text(0, 0, '', {
        fontFamily: 'Galmuri11',
        fontSize: '11px',
        color: '#ffffff',
        wordWrap: { width: 140 }
      }).setOrigin(0.5);

      const bubbleContainer = this.add.container(0, -65, [bubbleBg, bubbleText]);
      bubbleContainer.setVisible(false);
      visuals.add(bubbleContainer);

      // Click Interaction Setup
      container.setSize(36, 36);
      container.setInteractive(new Phaser.Geom.Rectangle(-18, -18, 36, 36), Phaser.Geom.Rectangle.Contains);
      if (container.input) {
        container.input.cursor = 'pointer';
      }

      container.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (npc.name === '아이템 상인 포켓박사') {
          window.dispatchEvent(new CustomEvent('react:openShop'));
        } else {
          // Open storytelling NPC quest modal
          window.dispatchEvent(new CustomEvent('react:openNpcQuest', { detail: { name: npc.name } }));
        }
        this.showTriviaBubble(bubbleContainer, bubbleBg, bubbleText, npc.name === '아이템 상인 포켓박사', npc.name);
      });

      // Add a floating bobbing animation to the visuals container to hover smoothly
      this.tweens.add({
        targets: visuals,
        y: -6,
        yoyo: true,
        repeat: -1,
        duration: 1500 + Phaser.Math.Between(0, 500),
        ease: 'Sine.easeInOut'
      });

      this.npcs.push({
        container,
        initialX: npc.initialX,
        initialY: npc.initialY,
        name: npc.name
      });
    });

    // Wandering Timer Loop: run NPC movement updates every 5 seconds
    this.time.addEvent({
      delay: 5000,
      callback: () => {
        this.npcs.forEach(npc => {
          if (npc.name === '아이템 상인 포켓박사') return; // 상인은 고정
          if (Math.random() < 0.5) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Phaser.Math.Between(30, 80);
            
            const targetX = Phaser.Math.Clamp(npc.initialX + Math.cos(angle) * distance, 64, MAP_WIDTH * TILE_SIZE - 64);
            const targetY = Phaser.Math.Clamp(npc.initialY + Math.sin(angle) * distance, 64, MAP_HEIGHT * TILE_SIZE - 64);

            const duration = Phaser.Math.Between(1500, 2500);

            this.tweens.add({
              targets: npc.container,
              x: targetX,
              y: targetY,
              duration: duration,
              ease: 'Sine.easeInOut'
            });
          }
        });
      },
      loop: true
    });
  }

  private showTriviaBubble(
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
    const textWidth = txt.width;
    const textHeight = txt.height;

    const bubbleWidth = textWidth + padding * 2;
    const bubbleHeight = textHeight + padding * 2;

    bg.clear();
    bg.fillStyle(0x090f1d, 0.95);
    bg.fillRoundedRect(-bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight, 8);
    const borderCol = isMerchant ? 0xf59e0b : 0x10b981;
    bg.lineStyle(2, borderCol, 1);
    bg.strokeRoundedRect(-bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight, 8);

    // Speak tail drawing
    bg.beginPath();
    bg.moveTo(-6, bubbleHeight / 2);
    bg.lineTo(0, bubbleHeight / 2 + 8);
    bg.lineTo(6, bubbleHeight / 2);
    bg.closePath();
    bg.fillPath();
    bg.strokePath();

    txt.setPosition(0, 0);
    bubble.setVisible(true);

    this.time.delayedCall(4000, () => {
      bubble.setVisible(false);
    });
  }
}
