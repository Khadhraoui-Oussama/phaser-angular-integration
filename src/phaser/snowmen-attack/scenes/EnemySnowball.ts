import Phaser from 'phaser';
import Track from './Track';
import { ResponsiveGameUtils } from '../utils/ResponsiveGameUtils';
import MainGame from './Game';

export default class EnemySnowball extends Phaser.Physics.Arcade.Sprite {
    track!: Track;

    constructor(scene: Phaser.Scene, x: number, y: number, key: string, frame?: string | number) {
        super(scene, x, y, key, frame);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Use hardcoded scale values for different screen sizes
        const { config } = ResponsiveGameUtils.getResponsiveConfig(scene);
        let snowballScale = 0.8; // Default desktop scale
        
        if (config.screenSize === 'mobile') {
            snowballScale = 0.3; // Smaller scale for mobile
        } else if (config.screenSize === 'tablet') {
            snowballScale = 0.5; // Fixed scale for tablet
        }
        
        this.setScale(snowballScale);
    }

    fire(x: number, y: number): void {
        const body = this.body as Phaser.Physics.Arcade.Body;

        body.enable = true;
        body.reset(x + 10, y - 44);

        this.setActive(true);
        this.setVisible(true);

        // Set responsive speed based on screen size
        const { config } = ResponsiveGameUtils.getResponsiveConfig(this.scene);
        let snowballSpeed = 200; // Default desktop speed
        if (config.screenSize === 'mobile') {
            snowballSpeed = 100; // Slower speed for mobile devices
        } else if (config.screenSize === 'tablet') {
            snowballSpeed = 140; // Medium speed for tablets
        }

        this.setVelocityX(snowballSpeed);
    }

    override stop(): this {
        this.setActive(false);
        this.setVisible(false);
        this.setVelocityX(0);

        const body = this.body as Phaser.Physics.Arcade.Body;
        body.enable = false;
        return this;
    }

    override preUpdate(time: number, delta: number): void {
        super.preUpdate(time, delta);

        const { width } = ResponsiveGameUtils.getResponsiveConfig(this.scene);
        // Calculate nest position dynamically (same as in Track.ts: width)
        const nestPosition = width;
        
        // Check if snowball has reached the nest position
        if (this.x >= nestPosition- 40) {
            this.stop();

            const mainScene = this.scene as MainGame;
            const snowman = this.track.snowmanSmall;
            const answer = parseInt(snowman.label.text);

            mainScene.handleWrongAnswer(answer, this.track);
            mainScene.stopAllEnemySnowballs(); 
            mainScene.loadNextQuestion();
        }
    }

}
