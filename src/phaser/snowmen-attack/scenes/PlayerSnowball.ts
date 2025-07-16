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
        if (this.body) {
            this.body.enable = true;
            this.body.reset(x, y - 44);
        }

        this.setActive(true);
        this.setVisible(true);

        this.setVelocityX(-600);
        this.setAccelerationX(-1400);
    }

    override stop(): this {
        this.setActive(false);
        this.setVelocityX(0);
        if (this.body) {
            this.body.enable = false;
        }
        this.setVelocityX(0);
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
