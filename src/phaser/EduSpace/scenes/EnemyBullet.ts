import Phaser from 'phaser';
import { ResponsiveGameUtils } from '../utils/ResponsiveGameUtils';

export default class EnemyBullet extends Phaser.Physics.Arcade.Sprite {
    private travelSpeed: number = 400;
    private isExploding: boolean = false;
    private hasHitTarget: boolean = false;
    
    constructor(scene: Phaser.Scene, x: number, y: number) {
        // Use fallback texture if enemy shot texture doesn't exist
        let textureKey = 'enemy_shot_travel_1';
        if (!scene.textures.exists(textureKey)) {
            console.warn(`EnemyBullet: Texture ${textureKey} not found, using fallback`);
            textureKey = 'shot_travel_1'; // Fallback to player bullet texture
        }
        
        super(scene, x, y, textureKey);

        // Use responsive scale values for different screen sizes - make enemy bullets bigger than player bullets
        const { config } = ResponsiveGameUtils.getResponsiveConfig(scene);
        let bulletScale = 3; // Bigger than player bullets (player: 2.0)
        
        if (config.screenSize === 'mobile') {
            bulletScale = 2.2; // Bigger than player bullets (player: 1.4)
        } else if (config.screenSize === 'tablet') {
            bulletScale = 2.6; // Bigger than player bullets (player: 1.7)
        }
        
        this.setScale(bulletScale);
        
        // Set up physics body
        scene.physics.add.existing(this);
        const body = this.body as Phaser.Physics.Arcade.Body | null;
        if (body) {
            body.setSize(this.width * 0.8, this.height * 0.6);
        } else {
            console.error('EnemyBullet: Failed to create physics body in constructor');
        }
        
        this.createTravelAnimation();
        
        this.createExplosionAnimation();
        
        // Start with travel animation
        this.play('enemy_bullet_travel');
        
        // Set depth to ensure bullets are visible
        this.setDepth(35);
        
        // Initially inactive
        this.setActive(false);
        this.setVisible(false);
        
        console.log(`EnemyBullet created with texture: ${textureKey}, body exists: ${!!this.body}`);
    }
    
    private createTravelAnimation(): void {
        // Create travel animation if it doesn't exist
        if (!this.scene.anims.exists('enemy_bullet_travel')) {
            const frames = [];
            for (let i = 1; i <= 5; i++) {
                if (this.scene.textures.exists(`enemy_shot_travel_${i}`)) {
                    frames.push({ key: `enemy_shot_travel_${i}` });
                }
            }
            
            if (frames.length > 0) {
                this.scene.anims.create({
                    key: 'enemy_bullet_travel',
                    frames: frames,
                    frameRate: 8,
                    repeat: 1 // Loop infinitely while traveling
                });
            }
        }
    }
    
    private createExplosionAnimation(): void {
        // Create explosion animation if it doesn't exist
        if (!this.scene.anims.exists('enemy_bullet_explosion')) {
            const frames = [];
            for (let i = 1; i <= 8; i++) {
                if (this.scene.textures.exists(`enemy_shot_exp_${i}`)) {
                    frames.push({ key: `enemy_shot_exp_${i}` });
                }
            }
            
            if (frames.length > 0) {
                this.scene.anims.create({
                    key: 'enemy_bullet_explosion',
                    frames: frames,
                    frameRate: 20,
                    repeat: 0 // Play once
                });
            }
        }
    }

    public fire(x: number, y: number, direction: { x: number; y: number }): void {
        if (this.isExploding) return;
        
        // Check if scene is still valid
        if (!this.scene || !this.scene.physics) {
            console.error('EnemyBullet: Scene or physics is undefined, cannot fire');
            return;
        }
        
        this.hasHitTarget = false;
        this.isExploding = false;
        
        // Ensure physics body exists
        if (!this.body) {
            console.log('EnemyBullet: Creating missing physics body');
            this.scene.physics.add.existing(this);
            const body = this.body as Phaser.Physics.Arcade.Body | null;
            if (body) {
                body.setSize(this.width * 0.8, this.height * 0.6);
            }
        }
        
        // Reset physics body position and enable it
        if (this.body) {
            this.body.enable = true;
            this.body.reset(x, y);
        } else {
            console.error('EnemyBullet: Still no body after attempting to create one!');
            return;
        }
        
        this.setActive(true);
        this.setVisible(true);
        
        // Set responsive speed based on screen size
        const { config } = ResponsiveGameUtils.getResponsiveConfig(this.scene);
        let bulletSpeed = this.travelSpeed;
        
        if (config.screenSize === 'mobile') {
            bulletSpeed = 300; // Slower on mobile
        } else if (config.screenSize === 'tablet') {
            bulletSpeed = 350; // Medium speed for tablets
        }
        
        // Apply velocity based on direction (enemy bullets move left toward player)
        this.setVelocity(
            direction.x * bulletSpeed,
            direction.y * bulletSpeed
        );
        
        // Play travel animation
        if (this.anims.exists('enemy_bullet_travel')) {
            this.play('enemy_bullet_travel');
        } else {
            console.warn('EnemyBullet: enemy_bullet_travel animation not found');
        }
        
        console.log(`Enemy bullet fired from (${x}, ${y}) with direction (${direction.x}, ${direction.y})`);
    }
    
    public explode(): void {
        if (this.isExploding || this.hasHitTarget) return;
        
        this.isExploding = true;
        this.hasHitTarget = true;
        
        // Stop movement
        this.setVelocity(0, 0);
        
        // Play explosion animation
        this.play('enemy_bullet_explosion');
        
        // Listen for animation complete
        this.once('animationcomplete-enemy_bullet_explosion', () => {
            this.returnToPool();
        });
        
        console.log('Enemy bullet exploded');
    }
    
    public getHasHitTarget(): boolean {
        return this.hasHitTarget;
    }
    
    public getIsExploding(): boolean {
        return this.isExploding;
    }
    
    private returnToPool(): void {
        // Reset bullet state for reuse
        this.isExploding = false;
        this.hasHitTarget = false;
        
        // Stop movement
        this.setVelocity(0, 0);
        
        // Stop any animations
        this.anims.stop();
        
        // Return to pool by setting inactive
        this.setActive(false);
        this.setVisible(false);
        
        console.log('Enemy bullet returned to pool');
    }
    
    override preUpdate(time: number, delta: number): void {
        super.preUpdate(time, delta);
        
        if (!this.active || this.isExploding) return;
        
        // Check if scene is still valid
        if (!this.scene) {
            console.warn('EnemyBullet: Scene is undefined in preUpdate, destroying bullet');
            this.destroy();
            return;
        }
        
        // Check if bullet has moved off-screen (left side for enemy bullets)
        const { width } = ResponsiveGameUtils.getResponsiveConfig(this.scene);
        
        if (this.x < -50 || this.x > width + 50 || this.y < -50 || this.y > this.scene.scale.height + 50) {
            console.log('Enemy bullet went off-screen, returning to pool');
            this.returnToPool();
        }
    }
    
    override destroy(fromScene?: boolean): void {
        // Reset state before destruction
        this.isExploding = false;
        this.hasHitTarget = false;
        
        // Stop any velocity
        if (this.body) {
            this.setVelocity(0, 0);
        }
        
        // Clean up any listeners
        this.removeAllListeners();
        
        // Set inactive and invisible
        this.setActive(false);
        this.setVisible(false);
        
        super.destroy(fromScene);
    }
}
