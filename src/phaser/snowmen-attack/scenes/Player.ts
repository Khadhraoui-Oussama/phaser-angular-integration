import Phaser from 'phaser';
import Track from './Track';
import { ResponsiveGameUtils } from '../utils/ResponsiveGameUtils';
import { SkinManager } from '../utils/SkinManager';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    isAlive: boolean;
    isThrowing: boolean;
    currentTrack: Track;
    sound: Phaser.Sound.BaseSoundManager;

    spacebar: Phaser.Input.Keyboard.Key;
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;

    constructor(scene: Phaser.Scene & { tracks: Track[] }, track: Track) {
        // Position player responsively
        const { width } = ResponsiveGameUtils.getResponsiveConfig(scene);
        const playerX = width * 0.88; // 88% of screen width (was 900/1024)
        
        // Get initial frame based on registry skin choice
        const selectedSkin = scene.game.registry.get('selectedSkin') || 'classic';
        const currentSkin = SkinManager.getCurrentSkin(); // Keep this for later use
        let textureKey: string;
        let frameKey: string;
        
        if (selectedSkin === 'classic') {
            // Classic winter: player = penguin
            textureKey = SkinManager.getTextureKey('sprites');
            frameKey = 'idle000';
        } else if (selectedSkin === 'wizard') {
            // Wizard: player = ice wizard
            textureKey = SkinManager.getPlayerFrame();
            frameKey = '';
        } else {
            // Fallback - assume classic
            textureKey = SkinManager.getTextureKey('sprites');
            frameKey = 'idle000';
        }
        
        super(scene, playerX, track.y, textureKey, frameKey);

        this.setOrigin(0.5, 1);
        
        // Use hardcoded scale values for different screen sizes
        const { config } = ResponsiveGameUtils.getResponsiveConfig(scene);
        let playerScale = 1.0; // Default desktop scale
        
        if (config.screenSize === 'mobile') {
            playerScale = 0.45; // Smaller scale for mobile
        } else if (config.screenSize === 'tablet') {
            playerScale = 0.7; // Fixed scale for tablet
        }
        
        // Make wizard players smaller and flip them to face left
        if (currentSkin.type === 'individual') {
            playerScale *= 0.25; // Make wizards 75% smaller
            this.setFlipX(true); // Flip wizard player to face left
        }
        
        this.setScale(playerScale);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.isAlive = true;
        this.isThrowing = false;

        this.sound = scene.sound;
        this.currentTrack = track;

        this.spacebar = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.up = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
        this.down = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);

        // Only play animation if it's an atlas-based skin or if animations are ready
        if (currentSkin.type === 'atlas') {
            this.playAnimationSafe('idle');
        }
        // For individual frame skins, the texture is already set to the idle frame
    }
    
    private playAnimationSafe(animationKey: string, ignoreIfPlaying?: boolean): void {
        // Both atlas and individual frame skins now support animations
        this.play(animationKey, ignoreIfPlaying);
    }

    start(): void {
        this.isAlive = true;
        this.isThrowing = false;

        this.currentTrack = (this.scene as any).tracks[0];
        this.y = this.currentTrack.y;

        this.on('animationcomplete-throwStart', this.releaseSnowball, this);
        this.on('animationcomplete-throwEnd', this.throwComplete, this);

        this.playAnimationSafe('idle', true);
    }

    moveUp(): void {
        if (this.currentTrack.id === 0) {
            this.currentTrack = (this.scene as any).tracks[3];
        } else {
            this.currentTrack = (this.scene as any).tracks[this.currentTrack.id - 1];
        }

        this.y = this.currentTrack.y;
        this.sound.play('move');
    }

    moveDown(): void {
        if (this.currentTrack.id === 3) {
            this.currentTrack = (this.scene as any).tracks[0];
        } else {
            this.currentTrack = (this.scene as any).tracks[this.currentTrack.id + 1];
        }

        this.y = this.currentTrack.y;
        this.sound.play('move');
    }

    throw(): void {
        console.log(`Player throwing from track ${this.currentTrack.id} at position y:${this.y}`);
        this.isThrowing = true;
        this.playAnimationSafe('throwStart');
        this.sound.play('throw');
    }

    releaseSnowball(): void {
        console.log(`Player releasing snowball from track ${this.currentTrack.id}`);
        this.playAnimationSafe('throwEnd');
        this.currentTrack.throwPlayerSnowball(this.x);
    }

    throwComplete(): void {
        this.isThrowing = false;
        this.playAnimationSafe('idle');
    }

    override stop(): this {
        this.isAlive = false;
        if (this.body) {
            this.body.stop();
        }
        this.playAnimationSafe('die');
        return this;
    }

    override preUpdate(time: number, delta: number): void {
        super.preUpdate(time, delta);

        if (!this.isAlive) return;

        if (Phaser.Input.Keyboard.JustDown(this.up)) {
            this.moveUp();
        } else if (Phaser.Input.Keyboard.JustDown(this.down)) {
            this.moveDown();
        } else if (Phaser.Input.Keyboard.JustDown(this.spacebar) && !this.isThrowing) {
            this.throw();
        }
    }
}
