import Phaser from 'phaser';
import { ResponsiveGameUtils } from '../utils/ResponsiveGameUtils';

export default class PlayerBullet extends Phaser.Physics.Arcade.Sprite {
    private travelSpeed: number = 800;
    private isExploding: boolean = false;
    private hasHitTarget: boolean = false;
    
    // Note: Bullets now travel horizontally (X-axis) from left to right
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'shot_travel_1');

        // Use responsive scale values for different screen sizes
        const { config } = ResponsiveGameUtils.getResponsiveConfig(scene);
        let bulletScale = 2.0; // Much bigger default desktop scale
        
        if (config.screenSize === 'mobile') {
            bulletScale = 1.4; // Much bigger scale for mobile
        } else if (config.screenSize === 'tablet') {
            bulletScale = 1.7; // Much bigger scale for tablet
        }
        
        this.setScale(bulletScale);
        
        // Set up physics body
        scene.physics.add.existing(this);
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(this.width * 0.8, this.height * 0.6); // Adjust hitbox for horizontal travel
        
        // Create travel animation
        this.createTravelAnimation();
        
        // Create explosion animation
        this.createExplosionAnimation();
        
        // Start with travel animation
        this.play('bullet_travel');
        
        // Set depth to ensure bullets are visible
        this.setDepth(40);
    }
    
    private createTravelAnimation(): void {
        // Create travel animation if it doesn't exist
        if (!this.scene.anims.exists('bullet_travel')) {
            const frames = [];
            for (let i = 1; i <= 4; i++) {
                if (this.scene.textures.exists(`shot_travel_${i}`)) {
                    frames.push({ key: `shot_travel_${i}` });
                }
            }
            
            if (frames.length > 0) {
                this.scene.anims.create({
                    key: 'bullet_travel',
                    frames: frames,
                    frameRate: 15,
                    repeat: -1 // Loop infinitely while traveling
                });
            }
        }
    }
    
    private createExplosionAnimation(): void {
        // Create explosion animation if it doesn't exist
        if (!this.scene.anims.exists('bullet_explosion')) {
            const frames = [];
            for (let i = 1; i <= 10; i++) {
                if (this.scene.textures.exists(`shot6_exp${i}`)) {
                    frames.push({ key: `shot6_exp${i}` });
                }
            }
            
            if (frames.length > 0) {
                this.scene.anims.create({
                    key: 'bullet_explosion',
                    frames: frames,
                    frameRate: 20,
                    repeat: 0 // Play once
                });
            }
        }
    }

    public fire(x: number, y: number, direction: { x: number; y: number }): void {
        console.log(`=== PLAYER BULLET FIRE DEBUG ===`);
        console.log(`PlayerBullet.fire called with x:${x}, y:${y}, direction:`, direction);
        console.log(`Bullet texture: ${this.texture.key}`);
        
        if (this.body) {
            this.body.enable = true;
            this.body.reset(x, y);
            console.log(`Body reset to x:${x}, y:${y}`);
            console.log(`Body size: ${(this.body as Phaser.Physics.Arcade.Body).width}x${(this.body as Phaser.Physics.Arcade.Body).height}`);
        } else {
            console.error('PlayerBullet has no body!');
        }

        this.setActive(true);
        this.setVisible(true);
        this.isExploding = false;
        this.hasHitTarget = false;
        console.log(`Bullet activated and made visible`);

        // Set responsive speed based on screen size and direction
        const { config } = ResponsiveGameUtils.getResponsiveConfig(this.scene);
        let bulletSpeed = this.travelSpeed;
        
        if (config.screenSize === 'mobile') {
            bulletSpeed = 600; // Slightly slower for mobile
        } else if (config.screenSize === 'tablet') {
            bulletSpeed = 700; // Medium speed for tablets
        }

        // Apply velocity based on direction
        this.setVelocity(
            direction.x * bulletSpeed,
            direction.y * bulletSpeed
        );
        
        // Start travel animation
        if (this.anims.exists('bullet_travel')) {
            this.play('bullet_travel');
        }
        
        console.log(`Bullet velocity set to x:${direction.x * bulletSpeed}, y:${direction.y * bulletSpeed}`);
        console.log(`Final bullet position: x:${this.x}, y:${this.y}, active:${this.active}, visible:${this.visible}`);
        console.log(`=== END PLAYER BULLET FIRE DEBUG ===`);
    }
    
    public explode(): void {
        if (this.isExploding || this.hasHitTarget) return;
        
        console.log('PlayerBullet exploding...');
        this.isExploding = true;
        this.hasHitTarget = true;
        
        // Stop movement
        this.setVelocity(0, 0);
        
        // Play explosion animation
        if (this.scene.anims.exists('bullet_explosion')) {
            this.play('bullet_explosion');
            
            // Listen for animation complete
            this.once('animationcomplete', () => {
                this.destroy();
            });
        } else {
            // If no explosion animation, just destroy
            this.destroy();
        }
        
        // Play explosion sound
        this.scene.sound.play('hit', { volume: 0.3 });
    }

    public override stop(): this {
        this.setActive(false);
        this.setVisible(false);
        this.setVelocity(0, 0);
        if (this.body) {
            this.body.enable = false;
        }
        return this;
    }

    public override preUpdate(time: number, delta: number): void {
        super.preUpdate(time, delta);

        // Don't auto-destroy if exploding
        if (this.isExploding) return;

        // Get screen bounds
        const { width, height } = ResponsiveGameUtils.getResponsiveConfig(this.scene);
        
        // Destroy bullet if it goes off screen (optimized for horizontal travel)
        if (this.x > width + 50 || this.x < -50 || this.y < -50 || this.y > height + 50) {
            console.log('PlayerBullet went off screen, destroying...');
            this.destroy();
        }
    }
    
    // Getters for game logic
    public getIsExploding(): boolean {
        return this.isExploding;
    }
    
    public getHasHitTarget(): boolean {
        return this.hasHitTarget;
    }
    
    public setHitTarget(): void {
        this.hasHitTarget = true;
    }
    
    // Test method to trigger explosion (can be removed later)
    public testExplode(): void {
        console.log('Test explosion triggered');
        this.explode();
    }
    
    // Override destroy to ensure cleanup
    public override destroy(fromScene?: boolean): void {
        console.log('PlayerBullet destroyed');
        super.destroy(fromScene);
    }
}
