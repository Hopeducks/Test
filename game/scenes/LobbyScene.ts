import Phaser from 'phaser';
import { AvatarConfig, EmoteId } from '../../types';
import { prefersReducedMotion } from './lobby/lobby-visuals';
import { createLobbyDecorations } from './lobby/decorations';
import { RemotePlayerContainer } from './lobby/remote-player';
import { Portal } from './lobby/lobby-constants';
import { spawnNPCs, NpcInstance } from './lobby/npc-system';
import { setupTilemapAndZones } from './lobby/tilemap-setup';
import {
  TILE_SIZE, MAP_WIDTH, MAP_HEIGHT,
  DEPTH_DECOR, DEPTH_BG_PARTICLE, DEPTH_OVERLAY,
} from './lobby/lobby-constants';

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
  private npcs: NpcInstance[] = [];
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

    // 타일맵·존·포탈·로컬 플레이어 초기화 (tilemap-setup.ts)
    const setup = setupTilemapAndZones(
      this, this.portalRings, this.nickname, this.avatarConfig, this.reducedMotion,
    );
    this.portals = setup.portals;
    this.playerContainer = setup.playerContainer;

    // 5. Keyboard Listener Setup
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wKey = this.input.keyboard.addKey('W');
      this.aKey = this.input.keyboard.addKey('A');
      this.sKey = this.input.keyboard.addKey('S');
      this.dKey = this.input.keyboard.addKey('D');
    }

    // 6. Spawn wandering scientist NPCs
    this.npcs = spawnNPCs(this);

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

}