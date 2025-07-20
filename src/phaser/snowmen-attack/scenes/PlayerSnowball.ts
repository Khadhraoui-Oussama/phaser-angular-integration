import Phaser from 'phaser';
import { ResponsiveGameUtils } from '../utils/ResponsiveGameUtils';

export default class PlayerSnowball extends Phaser.Physics.Arcade.Sprite {
    constructor(scene: Phaser.Scene, x: number, y: number, key: string, frame?: string | number) {
        super(scene, x, y, key, frame);

        // Use hardcoded scale values for different screen sizes
        const { config } = ResponsiveGameUtils.getResponsiveConfig(scene);
        let snowballScale = 0.8; // Default desktop scale
        
        if (config.screenSize === 'mobile') {
            snowballScale = 0.35; // Smaller scale for mobile
        } else if (config.screenSize === 'tablet') {
            snowballScale = 0.5; // Fixed scale for tablet
        }
        
        this.setScale(snowballScale);
    }

    fire(x: number, y: number): void {
        console.log(`PlayerSnowball.fire called with x:${x}, y:${y}`);
        console.log(`Snowball body before fire:`, this.body);
        
        if (this.body) {
            this.body.enable = true;
            this.body.reset(x, y - 44);
            console.log(`Body reset to x:${x}, y:${y - 44}`);
        } else {
            console.error('PlayerSnowball has no body!');
        }

        this.setActive(true);
        this.setVisible(true);
        console.log(`Snowball activated and made visible`);

        // Set responsive speed based on screen size
        const { config } = ResponsiveGameUtils.getResponsiveConfig(this.scene);
        let snowballSpeed = -600; // Default desktop speed (negative for leftward movement)
        let snowballAcceleration = -1400; // Default desktop acceleration
        
        if (config.screenSize === 'mobile') {
            snowballSpeed = -300; // Slower speed for mobile devices
            snowballAcceleration = -700; // Slower acceleration for mobile
        } else if (config.screenSize === 'tablet') {
            snowballSpeed = -420; // Medium speed for tablets
            snowballAcceleration = -980; // Medium acceleration for tablets
        }

        this.setVelocityX(snowballSpeed);
        this.setAccelerationX(snowballAcceleration);
        console.log(`Snowball velocity set to ${snowballSpeed}, acceleration to ${snowballAcceleration}`);
        console.log(`Final snowball position: x:${this.x}, y:${this.y}, active:${this.active}, visible:${this.visible}`);
    }

    override stop(): this {
        this.setActive(false);
        this.setVisible(false);
        this.setVelocityX(0);
        this.setAccelerationX(0);
        if (this.body) {
            this.body.enable = false;
        }
        return this;
    }

    override preUpdate(time: number, delta: number): void {
        super.preUpdate(time, delta);

        if (this.x <= -64) {
            this.stop();
        }
    }
}
