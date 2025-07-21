import Phaser from 'phaser';
import Track from './Track';
import MainGame from './Game';
import { ResponsiveGameUtils } from '../utils/ResponsiveGameUtils';
import { SkinManager } from '../utils/SkinManager';

const MAX_X_POSITION = 880;
export default class Snowman extends Phaser.Physics.Arcade.Sprite {
    time: Phaser.Time.Clock;
    sound: Phaser.Sound.BaseSoundManager;
    isAlive: boolean;
    isThrowing: boolean;
    size: 'Small' | 'Big';
    speed: number;
    previousAction: number;
    currentTrack: Track;
    currentHitpoints?: number;
    maxHitpoints?: number;
    chooseEvent?: Phaser.Time.TimerEvent;
    label: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, track: Track, size: 'Small' | 'Big', option: number) {
        // Get frame based on registry skin choice
        const selectedSkin = scene.game.registry.get('selectedSkin') || 'classic';
        let textureKey: string;
        let frameKey: string;
        
        if (selectedSkin === 'classic') {
            // Classic winter: enemies = snowmen (player = penguin)
            textureKey = SkinManager.getTextureKey('sprites');
            frameKey = (size === 'Small') ? 'snowman-small-idle0' : 'snowman-big-idle0';
        } else if (selectedSkin === 'wizard') {
            // Wizard: enemies = fire wizard (player = ice wizard)
            textureKey = SkinManager.getEnemyFrame(size);
            frameKey = '';
        } else {
            // Fallback
            textureKey = SkinManager.getTextureKey('sprites');
            frameKey = (size === 'Small') ? 'snowman-small-idle0' : 'snowman-big-idle0';
        }
        
        // Get responsive positioning
        const { width } = ResponsiveGameUtils.getResponsiveConfig(scene);
        const startX = width * 0.08; // Start at 8% of screen width (was 80/1024)
        const x = (size === 'Small') ? startX : -100;
        
        super(scene, x, track.y, textureKey, frameKey);
        this.setOrigin(0.5, 1);
        
        // Use hardcoded scale values for different screen sizes
        const { config } = ResponsiveGameUtils.getResponsiveConfig(scene);
        let snowmanScale = 1.0; // Default desktop scale
        
        if (config.screenSize === 'mobile') {
            snowmanScale = 0.45; // Smaller scale for mobile
        } else if (config.screenSize === 'tablet') {
            snowmanScale = 0.7; // Fixed scale for tablet
        }
        
        // Apply additional scaling for wizard enemies to make them smaller
        if (selectedSkin === 'wizard') {
            snowmanScale *= 0.3; // Make wizard enemies 60% of their normal size
        }
        
        this.setScale(snowmanScale);
        
        // Update MAX_X_POSITION based on screen width
        this.updateMaxPosition(scene);
        
        //setting depth to 2 makes sure that big snowmen appear on top of the question board which has a depth of 1
        this.depth = 2
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Adjust body size based on scale
        if (size === 'Small') {
            (this.body as Phaser.Physics.Arcade.Body).setSize(100 * snowmanScale, 100 * snowmanScale);
            (this.body as Phaser.Physics.Arcade.Body).setOffset(20 * snowmanScale, 40 * snowmanScale);
        } else {
            (this.body as Phaser.Physics.Arcade.Body).setSize(100 * snowmanScale, 120 * snowmanScale);
            (this.body as Phaser.Physics.Arcade.Body).setOffset(50 * snowmanScale, 50 * snowmanScale);
        }
        this.time = scene.time;
        this.sound = scene.sound;
        this.isAlive = true;
        this.isThrowing = false;
        this.size = size;
        
        // Set responsive speed based on screen size
        let baseSpeed = 50; // Default desktop speed
        if (config.screenSize === 'mobile') {
            baseSpeed = 25; // Slower speed for mobile devices
        } else if (config.screenSize === 'tablet') {
            baseSpeed = 35; // Medium speed for tablets
        }
        this.speed = baseSpeed;
        
        this.previousAction = 0;
        this.currentTrack = track;
        this.play('snowmanIdle' + this.size);
        
        // Create responsive label
        if(option !== 0){
            this.label = scene.add.text(this.x, this.y, option.toString(), {
                font: ResponsiveGameUtils.getResponsiveFontSize(18, scene) + ' Arial',
                color: '#000000',
            }).setOrigin(0.5, 0.4);
            this.label.setDepth(this.depth);
        } else {
            this.label = scene.add.text(this.x, this.y, '', {
                font: ResponsiveGameUtils.getResponsiveFontSize(18, scene) + ' Arial',
                color: '#000000',
            }).setOrigin(0.5, 0.4);
            this.label.setDepth(this.depth);
        }
    }
    
    private updateMaxPosition(scene: Phaser.Scene): void {
        const { width } = ResponsiveGameUtils.getResponsiveConfig(scene);
        // Update the static MAX_X_POSITION based on screen width (was 880/1024)
        (this.constructor as any).MAX_X_POSITION = width * 0.86;
    }

    start(): void {
        this.isAlive = true;
        this.isThrowing = false;
        this.previousAction = 0;
        this.currentHitpoints = this.maxHitpoints;
        this.y = this.currentTrack.y;
        this.on('animationcomplete-snowmanThrowStart' + this.size, this.releaseSnowball, this);
        this.on('animationcomplete-snowmanThrowEnd' + this.size, this.throwComplete, this);
        this.setActive(true);
        this.setVisible(true);
        this.play('snowmanWalk' + this.size);
        this.setVelocityX(this.speed);
        this.chooseEvent = this.time.delayedCall(Phaser.Math.Between(1000, 2000), this.chooseAction, [], this);
    }

    chooseAction(): void {
        this.isAlive = true;
        if (this.body) {
            (this.body as Phaser.Physics.Arcade.Body).enable = true;
        
        this.setVelocityX(0);
        const t = Phaser.Math.Between(0, 100);
        if (t < 50) {
            if (this.previousAction === 2) {
                this.walk();
            } else {
                this.throw();
            }
        } else if (t > 60) {
            this.walk();
        } else {
            if (this.previousAction === 1) {
                if (t > 55) {
                    this.walk();
                } else {
                    this.throw();
                }
            } else {
                this.goIdle();
            }
        }
    }

    }

    walk(): void {
        this.previousAction = 0;
        this.play('snowmanWalk' + this.size, true);
        this.setVelocityX(this.speed);
        this.chooseEvent = this.time.delayedCall(Phaser.Math.Between(3000, 6000), this.chooseAction, [], this);
    }

    goIdle(): void {
        this.previousAction = 1;
        this.play('snowmanIdle' + this.size, true);
        this.chooseEvent = this.time.delayedCall(Phaser.Math.Between(2000, 4000), this.chooseAction, [], this);
    }

    throw(): void {
        this.previousAction = 2;
        this.isThrowing = true;
        this.play('snowmanThrowStart' + this.size);
    }

    releaseSnowball(): void {
        if (!this.isAlive) {
            return;
        }
        this.play('snowmanThrowEnd' + this.size);
        this.currentTrack.throwEnemySnowball(this.x);
    }

    throwComplete(): void {
        if (!this.isAlive) {
            return;
        }
        this.isThrowing = false;
        this.play('snowmanIdle' + this.size);
        this.chooseEvent = this.time.delayedCall(Phaser.Math.Between(2000, 4000), this.chooseAction, [], this);
    }

    hit(): void {
        if (this.chooseEvent) {
            this.chooseEvent.remove();
        }
        this.isAlive = false;
        this.label.setVisible(false);
        this.previousAction = -1;
        this.play('snowmanDie' + this.size);
        this.sound.play('hit-snowman');
        (this.body as Phaser.Physics.Arcade.Body).stop();
        (this.body as Phaser.Physics.Arcade.Body).enable = false;
        const knockback = '-=' + Phaser.Math.Between(100, 200).toString();
        this.scene.tweens.add({
            targets: this,
            x: knockback,
            ease: 'sine.out',
            duration: 1000,
            onComplete: () => {
                if (this.x < -100) {
                    this.x = -100;
                }
            }
        });
        this.chooseEvent = this.time.delayedCall(Phaser.Math.Between(1000, 3000), this.chooseAction, [], this);
    }

    override stop(): this {
        if (this.chooseEvent) {
            this.chooseEvent.remove();
            this.chooseEvent = undefined
        }
        this.isAlive = false;
        this.label.setVisible(false)
        
        this.setVelocityX(0);
        this.anims.stop()
        this.removeAllListeners()
        if (this.body) {
            (this.body as Phaser.Physics.Arcade.Body).enable = false;
        }
        this.play('snowmanIdle' + this.size);
        return this;
    }

    override preUpdate(time: number, delta: number): void {
        super.preUpdate(time, delta);
        if (this.label) {
           this.label.setPosition(this.x, this.y + 10);
        }
        
        // Use responsive max position
        const { width } = ResponsiveGameUtils.getResponsiveConfig(this.scene);
        const maxPosition = width * 0.86; // Same as updateMaxPosition
        
        if (this.x >= maxPosition && this.isAlive) {
            this.isAlive = false;
            this.stop();
            (this.scene as MainGame).onSnowmanReachedTheEndOfTheTrack(this);
        }
    }
    setLabel(text: string) {
        this.label.setText(text);
    }

}
