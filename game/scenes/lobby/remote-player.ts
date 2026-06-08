import Phaser from 'phaser';
import { AvatarConfig, EmoteId } from '../../../types';
import { cards } from '../../../data/cards';
import { costumeCatalog } from '../../../data/costume-catalog';
import { ITEM_EMOJIS } from '../../../components/ui/avatar/avatar-constants';
import { deriveRarityAura } from './lobby-visuals';

export class RemotePlayerContainer extends Phaser.GameObjects.Container {
  public targetX: number;
  public targetY: number;
  private nickname: string;
  private bodyGroup: Phaser.GameObjects.Container;
  private bodyCircle: Phaser.GameObjects.Arc;
  private vehicleText: Phaser.GameObjects.Text;
  private outfitText: Phaser.GameObjects.Text;
  private hatText: Phaser.GameObjects.Text;
  private petText: Phaser.GameObjects.Text;
  private nameText: Phaser.GameObjects.Text;
  private titleText: Phaser.GameObjects.Text;
  private emoteBubble: Phaser.GameObjects.Container;
  private emoteText: Phaser.GameObjects.Text;
  private emoteBg: Phaser.GameObjects.Graphics;
  private emoteTimer: Phaser.Time.TimerEvent | null = null;

  private shadow: Phaser.GameObjects.Image;
  private aura: Phaser.GameObjects.Image;
  private auraTween: Phaser.Tweens.Tween | null = null;
  private reducedMotion: boolean;
  private facing: number = 1;
  private walkPhase: number = 0;

  private lastX: number | undefined;
  private lastY: number | undefined;
  private petTargetX: number = 22;
  private petTargetY: number = -12;
  private petCurrentX: number = 22;
  private petCurrentY: number = -12;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    nickname: string,
    avatar: AvatarConfig,
    reducedMotion: boolean = false
  ) {
    super(scene, x, y);
    this.targetX = x;
    this.targetY = y;
    this.nickname = nickname;
    this.reducedMotion = reducedMotion;

    this.shadow = scene.add.image(0, 17, 'soft-shadow').setOrigin(0.5);
    this.shadow.setDisplaySize(30, 12);
    this.add(this.shadow);

    this.aura = scene.add.image(0, 0, 'soft-glow').setOrigin(0.5);
    this.aura.setVisible(false);
    this.aura.setBlendMode(Phaser.BlendModes.ADD);
    this.add(this.aura);

    this.bodyGroup = scene.add.container(0, 0);
    this.add(this.bodyGroup);

    this.vehicleText = scene.add.text(0, 10, '', { fontSize: '24px' }).setOrigin(0.5);
    this.bodyGroup.add(this.vehicleText);

    const bodyColor = Phaser.Display.Color.HexStringToColor(avatar.bodyColor || '#4f46e5').color;
    this.bodyCircle = scene.add.arc(0, 0, 16, 0, 360, false, bodyColor);
    this.bodyCircle.setStrokeStyle(2, 0xffffff);
    this.bodyGroup.add(this.bodyCircle);

    this.outfitText = scene.add.text(0, 2, '', { fontSize: '18px' }).setOrigin(0.5);
    this.bodyGroup.add(this.outfitText);

    this.hatText = scene.add.text(0, -18, '', { fontSize: '18px' }).setOrigin(0.5);
    this.bodyGroup.add(this.hatText);

    this.petText = scene.add.text(22, -12, '', { fontSize: '18px' }).setOrigin(0.5);
    this.add(this.petText);

    this.nameText = scene.add.text(0, -35, nickname, {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#22d3ee',
      backgroundColor: '#0a0f1dbf',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);
    this.add(this.nameText);

    this.titleText = scene.add.text(0, -50, '', {
      fontFamily: 'Arial',
      fontSize: '9px',
      color: '#fbbf24',
      backgroundColor: '#0a0f1d99',
      padding: { x: 3, y: 1 }
    }).setOrigin(0.5);
    this.titleText.setVisible(false);
    this.add(this.titleText);

    this.emoteBg = scene.add.graphics();
    this.emoteText = scene.add.text(0, 0, '', { fontSize: '20px' }).setOrigin(0.5);
    this.emoteBubble = scene.add.container(0, -56, [this.emoteBg, this.emoteText]);
    this.emoteBubble.setVisible(false);
    this.add(this.emoteBubble);

    this.updateAvatar(avatar);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setCollideWorldBounds(true);
      body.setSize(32, 32);
      body.setOffset(-16, -16);
    }
  }

  protected preUpdate(time: number, delta: number): void {
    const hoverOffset = Math.sin(time * 0.005) * 4;

    const dx = this.x - (this.lastX ?? this.x);
    const dy = this.y - (this.lastY ?? this.y);
    this.lastX = this.x;
    this.lastY = this.y;

    const isMoving = Math.abs(dx) > 0.3 || Math.abs(dy) > 0.3;

    if (dx > 0.3) this.facing = 1;
    else if (dx < -0.3) this.facing = -1;

    if (this.reducedMotion) {
      this.bodyGroup.setScale(this.facing, 1);
      this.bodyGroup.y = 0;
    } else if (isMoving) {
      this.walkPhase += delta * 0.018;
      const bob = Math.abs(Math.sin(this.walkPhase));
      this.bodyGroup.y = -bob * 3;
      this.bodyGroup.setScale(this.facing * (1 + bob * 0.05), 1 - bob * 0.07);
      this.shadow.setScale(1 - bob * 0.12, 1);
      this.shadow.setAlpha(0.9 - bob * 0.2);
    } else {
      this.bodyGroup.y = Math.sin(time * 0.004) * 1.5;
      this.bodyGroup.setScale(this.facing, 1);
      this.shadow.setScale(1, 1);
      this.shadow.setAlpha(0.85);
    }

    if (dx !== 0 || dy !== 0) {
      if (dx > 0) this.petTargetX = -24;
      else if (dx < 0) this.petTargetX = 24;
      if (dy > 0) this.petTargetY = -24;
      else if (dy < 0) this.petTargetY = 8;
    } else {
      this.petTargetX = 22;
      this.petTargetY = -12;
    }

    this.petCurrentX = Phaser.Math.Linear(this.petCurrentX, this.petTargetX, 0.1);
    this.petCurrentY = Phaser.Math.Linear(this.petCurrentY, this.petTargetY, 0.1);

    this.petText.setPosition(this.petCurrentX, this.petCurrentY + hoverOffset);
  }

  public updateAvatar(avatar: AvatarConfig): void {
    const color = Phaser.Display.Color.HexStringToColor(avatar.bodyColor || '#4f46e5').color;
    this.bodyCircle.setFillStyle(color);

    const emojiOf = (id?: string | null): string =>
      id && id !== 'none' ? ITEM_EMOJIS[id] || '' : '';

    this.vehicleText.setText(emojiOf(avatar.vehicle));
    this.outfitText.setText(emojiOf(avatar.outfit));
    this.hatText.setText(emojiOf(avatar.hat));

    const badgeEmoji = avatar.badge && avatar.badge !== 'none'
      ? ITEM_EMOJIS[avatar.badge] || '🎖️'
      : '';
    this.nameText.setText(badgeEmoji ? `${badgeEmoji} ${this.nickname}` : this.nickname);

    const titleString = avatar.title && avatar.title !== 'none'
      ? costumeCatalog.find(c => c.id === avatar.title)?.name ?? ''
      : '';
    if (titleString) {
      this.titleText.setText(`[${titleString}]`);
      this.titleText.setVisible(true);
    } else {
      this.titleText.setVisible(false);
    }

    let petEmoji = '';
    if (avatar.petId && avatar.petId !== 'none') {
      petEmoji = ITEM_EMOJIS[avatar.petId] || '';
      if (!petEmoji) {
        const card = cards.find(c => c.id === avatar.petId);
        petEmoji = card?.image || card?.emoji || '';
      }
    }
    this.petText.setText(petEmoji);

    this.applyRarityAura(avatar);
  }

  private applyRarityAura(avatar: AvatarConfig): void {
    const aura = deriveRarityAura([
      avatar.outfit,
      avatar.hat,
      avatar.accessory,
      avatar.vehicle,
      avatar.title,
      avatar.badge,
    ]);

    if (this.auraTween) {
      this.auraTween.stop();
      this.auraTween = null;
    }

    if (!aura.show) {
      this.aura.setVisible(false);
      return;
    }

    this.aura.setVisible(true);
    this.aura.setTint(aura.color);
    this.aura.setDisplaySize(52, 52);

    if (this.reducedMotion) {
      this.aura.setAlpha(0.4);
      return;
    }

    this.aura.setAlpha(0.55);
    this.auraTween = this.scene.tweens.add({
      targets: this.aura,
      scale: { from: this.aura.scaleX, to: this.aura.scaleX * 1.25 },
      alpha: { from: 0.55, to: 0.2 },
      yoyo: true,
      repeat: -1,
      duration: 900,
      ease: 'Sine.easeInOut',
    });
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

    const bubbleWidth = 36;
    const bubbleHeight = 36;

    this.emoteBg.clear();
    this.emoteBg.fillStyle(0xffffff, 1);
    this.emoteBg.fillRoundedRect(-bubbleWidth / 2, -bubbleHeight / 2 - 8, bubbleWidth, bubbleHeight, 8);
    this.emoteBg.lineStyle(2, 0x00e5ff, 1);
    this.emoteBg.strokeRoundedRect(-bubbleWidth / 2, -bubbleHeight / 2 - 8, bubbleWidth, bubbleHeight, 8);

    this.emoteBg.beginPath();
    this.emoteBg.moveTo(-6, -8);
    this.emoteBg.lineTo(0, 0);
    this.emoteBg.lineTo(6, -8);
    this.emoteBg.closePath();
    this.emoteBg.fillPath();
    this.emoteBg.strokePath();

    this.emoteText.setPosition(0, -26);
    this.emoteBubble.setVisible(true);

    if (this.emoteTimer) this.emoteTimer.destroy();

    this.emoteTimer = this.scene.time.delayedCall(3000, () => {
      this.emoteBubble.setVisible(false);
    });
  }

  public destroy(fromScene?: boolean): void {
    if (this.auraTween) {
      this.auraTween.stop();
      this.auraTween = null;
    }
    if (this.emoteTimer) {
      this.emoteTimer.destroy();
      this.emoteTimer = null;
    }
    super.destroy(fromScene);
  }
}
