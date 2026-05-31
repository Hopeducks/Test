import Phaser from 'phaser';
import { AvatarConfig, EmoteId } from '../../types';
import { gameAudio } from '../../lib/audio';

// Player avatar container for RaidScene
class RaidPlayerContainer extends Phaser.GameObjects.Container {
  private bodyCircle: Phaser.GameObjects.Arc;
  private vehicleText: Phaser.GameObjects.Text;
  private outfitText: Phaser.GameObjects.Text;
  private hatText: Phaser.GameObjects.Text;
  private nameText: Phaser.GameObjects.Text;
  private emoteBubble: Phaser.GameObjects.Container;
  private emoteText: Phaser.GameObjects.Text;
  private emoteBg: Phaser.GameObjects.Graphics;
  private emoteTimer: Phaser.Time.TimerEvent | null = null;
  public playerId: string;

  constructor(scene: Phaser.Scene, x: number, y: number, nickname: string, avatar: AvatarConfig, playerId: string) {
    super(scene, x, y);
    this.playerId = playerId;

    // 1. Vehicle (mount)
    this.vehicleText = scene.add.text(0, 10, '', { fontSize: '24px' }).setOrigin(0.5);
    this.add(this.vehicleText);

    // 2. Body circle
    const bodyColor = Phaser.Display.Color.HexStringToColor(avatar.bodyColor || '#06b6d4').color;
    this.bodyCircle = scene.add.arc(0, 0, 16, 0, 360, false, bodyColor);
    this.bodyCircle.setStrokeStyle(2, 0xffffff);
    this.add(this.bodyCircle);

    // 3. Outfit
    this.outfitText = scene.add.text(0, 2, '', { fontSize: '18px' }).setOrigin(0.5);
    this.add(this.outfitText);

    // 4. Hat
    this.hatText = scene.add.text(0, -18, '', { fontSize: '18px' }).setOrigin(0.5);
    this.add(this.hatText);

    // 5. Name Tag
    this.nameText = scene.add.text(0, -35, nickname, {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 4, y: 1.5 }
    }).setOrigin(0.5);
    this.add(this.nameText);

    // 6. Emote Bubble
    this.emoteBg = scene.add.graphics();
    this.emoteText = scene.add.text(0, 0, '', { fontSize: '18px' }).setOrigin(0.5);
    this.emoteBubble = scene.add.container(0, -56, [this.emoteBg, this.emoteText]);
    this.emoteBubble.setVisible(false);
    this.add(this.emoteBubble);

    this.updateAvatar(avatar);

    scene.add.existing(this);
  }

  public updateAvatar(avatar: AvatarConfig): void {
    const color = Phaser.Display.Color.HexStringToColor(avatar.bodyColor || '#06b6d4').color;
    this.bodyCircle.setFillStyle(color);

    let vehicleEmoji = '';
    if (avatar.vehicle) {
      const v = avatar.vehicle;
      if (v === 'vehicle_rocket') vehicleEmoji = '🚀';
      else if (v === 'vehicle_ufo') vehicleEmoji = '🛸';
      else if (v === 'vehicle_submarine') vehicleEmoji = '🚢';
      else if (v === 'vehicle_balloon') vehicleEmoji = '🎈';
      else if (v === 'vehicle_skates') vehicleEmoji = '🛼';
      else if (v === 'vehicle_scooter') vehicleEmoji = '🛴';
    }
    this.vehicleText.setText(vehicleEmoji);

    let outfitEmoji = '';
    if (avatar.outfit) {
      const o = avatar.outfit;
      if (o === 'outfit_scientist') outfitEmoji = '🥼';
      else if (o === 'outfit_spacesuit') outfitEmoji = '🧑‍🚀';
      else if (o === 'outfit_diver') outfitEmoji = '🧑‍🤿';
      else if (o === 'outfit_paleontologist') outfitEmoji = '🦕';
      else if (o === 'outfit_chemist') outfitEmoji = '🧪';
      else if (o === 'outfit_meteorologist') outfitEmoji = '🌦️';
      else if (o === 'outfit_doctor') outfitEmoji = '🧑‍⚕️';
      else if (o === 'outfit_optics') outfitEmoji = '👓';
      else if (o === 'outfit_eco') outfitEmoji = '🌱';
      else if (o === 'outfit_legend') outfitEmoji = '🏆';
    }
    this.outfitText.setText(outfitEmoji);

    let hatEmoji = '';
    if (avatar.hat) {
      const h = avatar.hat;
      if (h === 'hat_explorer') hatEmoji = '🤠';
      else if (h === 'hat_mortarboard') hatEmoji = '🎓';
      else if (h === 'hat_helmet') hatEmoji = '🪖';
      else if (h === 'hat_beanie') hatEmoji = '🧢';
      else if (h === 'hat_spacesuit_helmet') hatEmoji = '👨‍🚀';
      else if (h === 'hat_crown') hatEmoji = '👑';
    }
    this.hatText.setText(hatEmoji);
  }

  public showEmote(emote: EmoteId): void {
    let emoteEmoji = '';
    if (emote === 'wave') emoteEmoji = '👋';
    else if (emote === 'cheer') emoteEmoji = '🙌';
    else if (emote === 'think') emoteEmoji = '🤔';
    else if (emote === 'celebrate') emoteEmoji = '🎉';
    else if (emote === 'sad') emoteEmoji = '😭';

    if (!emoteEmoji) return;

    this.emoteText.setText(emoteEmoji);
    
    const bubbleWidth = 32;
    const bubbleHeight = 32;

    this.emoteBg.clear();
    this.emoteBg.fillStyle(0xffffff, 1);
    this.emoteBg.fillRoundedRect(-bubbleWidth / 2, -bubbleHeight / 2 - 6, bubbleWidth, bubbleHeight, 6);
    this.emoteBg.lineStyle(2, 0xef4444, 1); // Red accent for boss raid urgency
    this.emoteBg.strokeRoundedRect(-bubbleWidth / 2, -bubbleHeight / 2 - 6, bubbleWidth, bubbleHeight, 6);
    
    this.emoteBg.beginPath();
    this.emoteBg.moveTo(-5, -6);
    this.emoteBg.lineTo(0, 0);
    this.emoteBg.lineTo(5, -6);
    this.emoteBg.closePath();
    this.emoteBg.fillPath();
    this.emoteBg.strokePath();

    this.emoteText.setPosition(0, -22);
    this.emoteBubble.setVisible(true);

    if (this.emoteTimer) this.emoteTimer.destroy();

    this.emoteTimer = this.scene.time.delayedCall(3000, () => {
      this.emoteBubble.setVisible(false);
    });
  }
}

export default class RaidScene extends Phaser.Scene {
  private bossContainer: Phaser.GameObjects.Container | null = null;
  private bossVisuals: Phaser.GameObjects.Container | null = null;
  private bossSprite: Phaser.GameObjects.Text | null = null;
  private bossHpText: Phaser.GameObjects.Text | null = null;
  private bossHpBar: Phaser.GameObjects.Graphics | null = null;

  // Players
  private localPlayer: RaidPlayerContainer | null = null;
  private remotePlayers: Map<string, RaidPlayerContainer> = new Map();

  // Settings
  private sessionCode: string = '';
  private localPlayerId: string = '';
  private nickname: string = '';
  private avatarConfig: AvatarConfig = { bodyColor: '#06b6d4', outfit: null, accessory: null, vehicle: null, hat: null, emote: null };

  // Raid Scene parameters
  private bossX: number = 384;
  private bossY: number = 180;
  private formationRadius: number = 180;
  private bossMaxHp: number = 1000;
  private currentBossHp: number = 1000;

  // Projectile/Attack Timer loop
  private bossAttackTimer: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super({ key: 'RaidScene' });
  }

  public init(data?: { sessionCode?: string; playerId?: string; nickname?: string; avatar?: AvatarConfig }): void {
    const reg = this.registry;
    this.sessionCode = data?.sessionCode || reg.get('sessionCode') || 'SESSION_TEMP';
    this.localPlayerId = data?.playerId || reg.get('playerId') || 'player_local';
    this.nickname = data?.nickname || reg.get('nickname') || '대원';
    this.avatarConfig = data?.avatar || reg.get('avatar') || this.avatarConfig;
  }

  public create(): void {
    // 1. Draw Starry Space background
    const bgGraphics = this.add.graphics();
    bgGraphics.fillGradientStyle(0x020617, 0x020617, 0x0f172a, 0x0f172a, 1);
    bgGraphics.fillRect(0, 0, 768, 576);

    // Draw background nebula dust particles
    for (let i = 0; i < 40; i++) {
      const rx = Phaser.Math.Between(0, 768);
      const ry = Phaser.Math.Between(0, 576);
      const rSize = Phaser.Math.Between(1, 3);
      this.add.circle(rx, ry, rSize, 0xffffff, Phaser.Math.FloatBetween(0.1, 0.4));
    }

    // 2. Draw Boss Monster Group Container
    this.bossContainer = this.add.container(this.bossX, this.bossY);

    this.bossVisuals = this.add.container(0, 0);
    this.bossContainer.add(this.bossVisuals);

    // Dynamic Concentric Rings & Hologram Orbits
    const bossOrbit1 = this.add.arc(0, 0, 56, 0, 360, false);
    bossOrbit1.setStrokeStyle(1.5, 0xef4444, 0.3);
    this.bossVisuals.add(bossOrbit1);

    const bossOrbit2 = this.add.arc(0, 0, 44, 0, 360, false);
    bossOrbit2.setStrokeStyle(1.5, 0xef4444, 0.4);
    this.bossVisuals.add(bossOrbit2);

    const bossTechRing1 = this.add.graphics();
    bossTechRing1.lineStyle(2.5, 0xef4444, 0.85);
    bossTechRing1.beginPath();
    bossTechRing1.arc(0, 0, 48, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(90));
    bossTechRing1.strokePath();
    bossTechRing1.beginPath();
    bossTechRing1.arc(0, 0, 48, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(270));
    bossTechRing1.strokePath();
    this.bossVisuals.add(bossTechRing1);

    const bossTechRing2 = this.add.graphics();
    bossTechRing2.lineStyle(2, 0xf87171, 0.6);
    bossTechRing2.beginPath();
    bossTechRing2.arc(0, 0, 52, Phaser.Math.DegToRad(45), Phaser.Math.DegToRad(135));
    bossTechRing2.strokePath();
    bossTechRing2.beginPath();
    bossTechRing2.arc(0, 0, 52, Phaser.Math.DegToRad(225), Phaser.Math.DegToRad(315));
    bossTechRing2.strokePath();
    this.bossVisuals.add(bossTechRing2);

    // Spin tech rings
    this.tweens.add({
      targets: bossTechRing1,
      angle: 360,
      repeat: -1,
      duration: 5000
    });
    this.tweens.add({
      targets: bossTechRing2,
      angle: -360,
      repeat: -1,
      duration: 4000
    });

    // Central glowing core
    const bossCoreGlow = this.add.circle(0, 0, 26, 0xef4444, 0.15);
    this.bossVisuals.add(bossCoreGlow);

    const bossCore = this.add.circle(0, 0, 20, 0xef4444, 0.85);
    bossCore.setStrokeStyle(1.5, 0xfc8181);
    this.bossVisuals.add(bossCore);

    this.tweens.add({
      targets: [bossCore, bossCoreGlow],
      scale: 1.25,
      alpha: { from: 0.85, to: 0.5 },
      yoyo: true,
      repeat: -1,
      duration: 1000,
      ease: 'Sine.easeInOut'
    });

    // Boss Hologram central emoji
    this.bossSprite = this.add.text(0, 0, '👹', { fontSize: '32px' }).setOrigin(0.5);
    this.bossSprite.setAlpha(0.85);
    this.bossVisuals.add(this.bossSprite);

    // Floating bob animation for the entire composite visuals container
    this.tweens.add({
      targets: this.bossVisuals,
      y: -15,
      yoyo: true,
      repeat: -1,
      duration: 2000,
      ease: 'Sine.easeInOut'
    });

    // Boss Name Label
    const bossLabel = this.add.text(0, -65, '전설 보스 크로노스', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#f87171',
      fontStyle: 'bold',
      backgroundColor: '#180202cc',
      padding: { x: 5, y: 2 }
    }).setOrigin(0.5);
    this.bossContainer.add(bossLabel);

    // Boss HP graphics bar
    this.bossHpBar = this.add.graphics();
    this.bossContainer.add(this.bossHpBar);
    this.drawBossHpBar();

    // 3. Setup semicircle slots for players (Angles 35 to 145 degrees)
    this.localPlayer = new RaidPlayerContainer(this, this.bossX, this.bossY + this.formationRadius, this.nickname, this.avatarConfig, this.localPlayerId);
    
    // Reposition player in semicircle layout
    this.arrangePlayersSemicircle();

    // 4. Register Event Listeners from React Bridge
    const hpSyncListener = (e: Event) => {
      const customEvent = e as CustomEvent<{ hp: number }>;
      if (customEvent.detail && typeof customEvent.detail.hp === 'number') {
        const damage = this.currentBossHp - customEvent.detail.hp;
        this.currentBossHp = customEvent.detail.hp;
        this.drawBossHpBar();
        
        if (damage > 0) {
          // Trigger floating damage number above boss
          this.triggerDamageNumberAnimation(damage);
        }
      }
    };

    const raidEndListener = (e: Event) => {
      const customEvent = e as CustomEvent<{ victory: boolean }>;
      if (customEvent.detail && customEvent.detail.victory) {
        this.triggerVictoryFireworks();
      }
    };

    const presenceListener = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        this.syncRemotePlayers(customEvent.detail);
      }
    };

    window.addEventListener('react:bossHpUpdate', hpSyncListener);
    window.addEventListener('react:raidEnd', raidEndListener);
    window.addEventListener('react:presenceUpdate', presenceListener);

    this.events.once('shutdown', () => {
      window.removeEventListener('react:bossHpUpdate', hpSyncListener);
      window.removeEventListener('react:raidEnd', raidEndListener);
      window.removeEventListener('react:presenceUpdate', presenceListener);
      if (this.bossAttackTimer) this.bossAttackTimer.destroy();
    });

    // 5. Boss Periodic Attack loop (Visual tween projectile to random player)
    this.bossAttackTimer = this.time.addEvent({
      delay: 4500,
      callback: () => {
        this.shootBossProjectile();
      },
      loop: true
    });
  }

  private drawBossHpBar(): void {
    if (!this.bossHpBar) return;
    this.bossHpBar.clear();

    const barWidth = 140;
    const barHeight = 8;
    const bx = -barWidth / 2;
    const by = 40;

    // Background track (dark red)
    this.bossHpBar.fillStyle(0x450a0a, 0.85);
    this.bossHpBar.fillRoundedRect(bx, by, barWidth, barHeight, 3);
    this.bossHpBar.lineStyle(1.5, 0xf87171, 0.4);
    this.bossHpBar.strokeRoundedRect(bx, by, barWidth, barHeight, 3);

    // HP Fill ratio
    const ratio = Phaser.Math.Clamp(this.currentBossHp / this.bossMaxHp, 0, 1);
    const fillWidth = barWidth * ratio;
    
    let hpColor = 0x10b981; // Green
    if (ratio <= 0.3) hpColor = 0xef4444; // Red
    else if (ratio <= 0.6) hpColor = 0xf59e0b; // Amber

    if (fillWidth > 0) {
      this.bossHpBar.fillStyle(hpColor, 1);
      this.bossHpBar.fillRoundedRect(bx, by, fillWidth, barHeight, 3);
    }
  }

  private arrangePlayersSemicircle(): void {
    const list = [this.localPlayer, ...Array.from(this.remotePlayers.values())].filter((p): p is RaidPlayerContainer => p !== null);
    const N = list.length;
    if (N === 0) return;

    // Semicircle range: 45 degrees to 135 degrees
    const minAngle = 45;
    const maxAngle = 135;
    const step = N > 1 ? (maxAngle - minAngle) / (N - 1) : 0;

    list.forEach((playerObj, idx) => {
      const angleDeg = minAngle + idx * step;
      const angleRad = Phaser.Math.DegToRad(angleDeg);

      // Semicircle equations relative to boss center coordinate
      const px = this.bossX + this.formationRadius * Math.cos(angleRad);
      const py = this.bossY + this.formationRadius * Math.sin(angleRad);

      // Smooth Tween reposition to slots
      this.tweens.add({
        targets: playerObj,
        x: px,
        y: py,
        duration: 800,
        ease: 'Cubic.easeOut'
      });
    });
  }

  private syncRemotePlayers(presenceData: any): void {
    const list = Array.isArray(presenceData)
      ? presenceData
      : Object.keys(presenceData).map(key => ({ id: key, ...presenceData[key] }));

    const activeIds = new Set<string>();

    list.forEach(p => {
      const id = p.id || p.name;
      // Filter out local player profile
      if (id === this.localPlayerId || p.name === this.nickname) return;

      activeIds.add(id);

      let remote = this.remotePlayers.get(id);
      
      const avatar: AvatarConfig = {
        bodyColor: p.avatar?.bodyColor || p.equippedCosmetics?.bodyColor || '#a855f7',
        outfit: p.avatar?.outfit || p.equippedCosmetics?.outfit || null,
        accessory: p.avatar?.accessory || p.equippedCosmetics?.accessory || null,
        vehicle: p.avatar?.vehicle || p.equippedCosmetics?.mount || null,
        hat: p.avatar?.hat || null,
        emote: p.avatar?.emote || null
      };

      if (!remote) {
        // Spawn at random lobby center, will arrange into slot immediately
        remote = new RaidPlayerContainer(this, this.bossX, this.bossY + this.formationRadius, p.name || '동료', avatar, id);
        this.remotePlayers.set(id, remote);
      } else {
        remote.updateAvatar(avatar);
      }

      if (p.emote) {
        remote.showEmote(p.emote);
      }
    });

    // Remove old remotes
    this.remotePlayers.forEach((val, key) => {
      if (!activeIds.has(key)) {
        val.destroy();
        this.remotePlayers.delete(key);
      }
    });

    // Re-align layouts
    this.arrangePlayersSemicircle();
  }

  private triggerDamageNumberAnimation(dmg: number): void {
    // Generate text pop floating up from random player slot to boss
    const list = [this.localPlayer, ...Array.from(this.remotePlayers.values())].filter((p): p is RaidPlayerContainer => p !== null);
    if (list.length === 0) return;
    
    // Choose a random player container to spawn damage laser/text
    const attacker = list[Phaser.Math.Between(0, list.length - 1)];

    // Float text pop
    const damageText = this.add.text(attacker.x, attacker.y - 20, `-${dmg}`, {
      fontFamily: 'Impact, Arial Black',
      fontSize: '28px',
      color: '#ef4444',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Laser line beam visual from attacker to boss
    const laser = this.add.graphics();
    laser.lineStyle(2, 0xff0000, 0.8);
    laser.beginPath();
    laser.moveTo(attacker.x, attacker.y);
    laser.lineTo(this.bossX, this.bossY);
    laser.strokePath();

    // Spawn hit particles at boss position
    this.spawnHitParticles(this.bossX + Phaser.Math.Between(-15, 15), this.bossY + Phaser.Math.Between(-10, 10), 0xff0000);

    this.time.delayedCall(120, () => {
      laser.destroy();
    });

    // Animate Text Pop floating to Boss position
    this.tweens.add({
      targets: damageText,
      x: this.bossX + Phaser.Math.Between(-30, 30),
      y: this.bossY - 40 + Phaser.Math.Between(-20, 20),
      alpha: 0.2,
      scale: 1.3,
      duration: 900,
      ease: 'Quad.easeOut',
      onComplete: () => {
        damageText.destroy();
        
        // Shake boss visuals container as feedback
        if (this.bossVisuals) {
          this.tweens.add({
            targets: this.bossVisuals,
            x: Phaser.Math.Between(-8, 8),
            yoyo: true,
            repeat: 2,
            duration: 50,
            onComplete: () => {
              if (this.bossVisuals) this.bossVisuals.x = 0;
            }
          });
        }
      }
    });
  }

  private shootBossProjectile(): void {
    const list = [this.localPlayer, ...Array.from(this.remotePlayers.values())].filter((p): p is RaidPlayerContainer => p !== null);
    if (list.length === 0) return;

    // Pick target student
    const target = list[Phaser.Math.Between(0, list.length - 1)];

    // Draw fire projectile
    const projectile = this.add.circle(this.bossX, this.bossY - 20, 10, 0xef4444, 1);
    this.add.existing(projectile);
    
    // Add glowing halo ring to projectile
    const halo = this.add.arc(this.bossX, this.bossY - 20, 14, 0, 360, false);
    halo.setStrokeStyle(1.5, 0xf97316, 0.7);

    // Projectile sound click trigger simulation
    gameAudio.playClick();

    this.tweens.add({
      targets: [projectile, halo],
      x: target.x,
      y: target.y,
      duration: 1200,
      ease: 'Sine.easeIn',
      onUpdate: (tween, targetObj) => {
        if (targetObj.radius) targetObj.radius = 10 + Math.sin(tween.progress * Math.PI) * 4;
        
        // Emit flame trail particles during movement
        if (targetObj === projectile) {
          const trail = this.add.circle(projectile.x, projectile.y, projectile.radius * 0.75, 0xf97316, 0.65);
          this.tweens.add({
            targets: trail,
            alpha: 0,
            scale: 0.1,
            duration: 400,
            onComplete: () => trail.destroy()
          });
        }
      },
      onComplete: () => {
        projectile.destroy();
        halo.destroy();

        // Spawn red splash explosion particles on hit
        this.spawnHitParticles(target.x, target.y, 0xef4444);

        // Target triggers flash think emote on hit
        target.showEmote('sad');
        this.cameras.main.shake(150, 0.005);
      }
    });
  }

  private triggerVictoryFireworks(): void {
    if (this.bossAttackTimer) this.bossAttackTimer.destroy();

    // Spawn 8 explosions over 3 seconds representing boss defeat
    for (let i = 0; i < 8; i++) {
      this.time.delayedCall(i * 350, () => {
        const rx = this.bossX + Phaser.Math.Between(-40, 40);
        const ry = this.bossY + Phaser.Math.Between(-30, 30);
        this.spawnVictoryExplosion(rx, ry);
      });
    }

    // Victory Fireworks Particle emitter
    this.time.delayedCall(1200, () => {
      if (this.bossVisuals) {
        this.tweens.add({
          targets: this.bossVisuals,
          alpha: 0,
          scale: 0.1,
          duration: 800
        });
      }

      // Start fireworks emitters
      for (let j = 0; j < 5; j++) {
        this.time.delayedCall(j * 400, () => {
          const fx = Phaser.Math.Between(100, 668);
          const fy = Phaser.Math.Between(80, 240);
          this.spawnVictoryExplosion(fx, fy);
        });
      }
    });

    // Warp back to LobbyScene after 3.2 seconds
    this.time.delayedCall(3200, () => {
      this.scene.start('LobbyScene');
    });
  }

  private spawnVictoryExplosion(x: number, y: number): void {
    const colors = [0xfacc15, 0xef4444, 0x3b82f6, 0x10b981, 0xa855f7, 0xec4899];
    const color = colors[Phaser.Math.Between(0, colors.length - 1)];

    // Create 15 particles expanding in a ring
    for (let i = 0; i < 15; i++) {
      const angle = (i / 15) * Math.PI * 2;
      const speed = Phaser.Math.Between(80, 220);
      const dot = this.add.circle(x, y, 4, color, 1);
      
      this.physics.add.existing(dot);
      const body = dot.body as Phaser.Physics.Arcade.Body;
      if (body) {
        body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        body.setGravityY(200); // Gravity pulls down
      }

      this.tweens.add({
        targets: dot,
        alpha: 0,
        scale: 0.2,
        duration: 1000 + Phaser.Math.Between(0, 500),
        onComplete: () => {
          dot.destroy();
        }
      });
    }
  }

  private spawnHitParticles(x: number, y: number, color: number): void {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Phaser.Math.Between(60, 180);
      const dot = this.add.circle(x, y, Phaser.Math.Between(2, 5), color, 0.95);
      this.physics.add.existing(dot);
      const body = dot.body as Phaser.Physics.Arcade.Body;
      if (body) {
        body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      }
      this.tweens.add({
        targets: dot,
        alpha: 0,
        scale: 0.1,
        duration: 600,
        onComplete: () => dot.destroy()
      });
    }
  }
}
