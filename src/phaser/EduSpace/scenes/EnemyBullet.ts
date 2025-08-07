import Phaser from 'phaser';
import { ResponsiveGameUtils } from '../utils/ResponsiveGameUtils';

export default class EnemyBullet extends Phaser.Physics.Arcade.Sprite {
    private travelSpeed: number = 400;
    private isExploding: boolean = false;
    private hasHitTarget: boolean = false;
    private hitboxBorder!: Phaser.GameObjects.Graphics; // Orange border for hitbox visualization
    public spaceshipId?: string; // ID of the spaceship that fired this bullet
    
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
            // Make physics body much smaller for precise collision detection
            const physicsWidth = this.width * 0.4; // Much smaller than visual (was 0.7)
            const physicsHeight = this.height * 0.4; // Much smaller than visual (was 0.7)
            body.setSize(physicsWidth, physicsHeight);
            
            // IMPORTANT: Don't use setOffset - let it center automatically
            // The offset might be causing the collision to happen in the wrong position
            console.log(`EnemyBullet physics body: ${physicsWidth}x${physicsHeight}`);
            console.log(`EnemyBullet sprite size: ${this.width}x${this.height}, scale: ${this.scaleX}`);
        } else {
            console.error('EnemyBullet: Failed to create physics body in constructor');
        }
        
        this.createTravelAnimation();
        
        this.createExplosionAnimation();
        
        // Create hitbox border for visualization
        this.createHitboxBorder();
        
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
                } else {
                    console.warn(`EnemyBullet: Missing texture enemy_shot_travel_${i}`);
                }
            }
            
            if (frames.length > 0) {
                this.scene.anims.create({
                    key: 'enemy_bullet_travel',
                    frames: frames,
                    frameRate: 8,
                    repeat: 1
                });
                console.log(`EnemyBullet: Created travel animation with ${frames.length} frames`);
            } else {
                console.error('EnemyBullet: No frames found for travel animation');
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
                } else {
                    console.warn(`EnemyBullet: Missing texture enemy_shot_exp_${i}`);
                }
            }
            
            if (frames.length > 0) {
                this.scene.anims.create({
                    key: 'enemy_bullet_explosion',
                    frames: frames,
                    frameRate: 20,
                    repeat: 0 // Play once
                });
                console.log(`EnemyBullet: Created explosion animation with ${frames.length} frames`);
            } else {
                console.error('EnemyBullet: No frames found for explosion animation');
            }
        }
    }
    
    private createHitboxBorder(): void {
        // Create a graphics object for the hitbox border
        this.hitboxBorder = this.scene.add.graphics();
        
        // Show the actual physics body size for accurate collision visualization
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body) {
            const width = body.width;
            const height = body.height;
            
            // Draw orange border for enemy bullet hitbox (showing actual physics body)
            this.hitboxBorder.lineStyle(2, 0xffa500, 1); // Orange color, 2px thickness
            this.hitboxBorder.strokeRect(this.x - width/2, this.y - height/2, width, height);
        }
        
        // Set depth to ensure border is visible
        this.hitboxBorder.setDepth(40);
    }
    
    private updateHitboxBorder(): void {
        if (!this.hitboxBorder || !this.active) return;
        
        // Clear previous border
        this.hitboxBorder.clear();
        
        // Show the actual physics body size for accurate collision visualization
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body && body.enable) {
            const width = body.width;
            const height = body.height;
            
            // Draw orange border for enemy bullet hitbox (showing actual physics body)
            this.hitboxBorder.lineStyle(2, 0xffa500, 1); // Orange color, 2px thickness
            this.hitboxBorder.strokeRect(this.x - width/2, this.y - height/2, width, height);
        }
    }

    public fire(x: number, y: number, direction: { x: number; y: number }, spaceshipId?: string): void {
        if (this.isExploding) return;
        
        // Store the spaceship ID that fired this bullet
        this.spaceshipId = spaceshipId;
        
        // Check if scene is still valid and active
        if (!this.scene || 
            !this.scene.physics || 
            !this.scene.physics.world || 
            !this.scene.scene || 
            !this.scene.scene.isActive() ||
            this.scene.scene.isPaused() ||
            this.scene.scene.isSleeping()) {
            console.error('EnemyBullet: Scene or physics is undefined/inactive, cannot fire');
            // Clear spaceship ID to prevent future issues
            this.spaceshipId = undefined;
            // Return bullet to pool instead of keeping it in limbo
            this.returnToPool();
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
                // Make physics body much smaller for precise collision detection
                const physicsWidth = this.width * 0.4; // Much smaller than visual
                const physicsHeight = this.height * 0.4; // Much smaller than visual
                body.setSize(physicsWidth, physicsHeight);
                // Center the physics body properly
                body.setOffset((this.width - physicsWidth) / 2, (this.height - physicsHeight) / 2);
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
        
        // Show hitbox border
        if (this.hitboxBorder) {
            this.hitboxBorder.setVisible(true);
        }
        
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
        if (this.scene.anims.exists('enemy_bullet_travel')) {
            this.play('enemy_bullet_travel');
        } else {
            console.warn('EnemyBullet: enemy_bullet_travel animation not found, attempting to create it');
            this.createTravelAnimation();
            if (this.scene.anims.exists('enemy_bullet_travel')) {
                this.play('enemy_bullet_travel');
            } else {
                console.error('EnemyBullet: Failed to create enemy_bullet_travel animation');
            }
        }
        
        console.log(`Enemy bullet fired from (${x}, ${y}) with direction (${direction.x}, ${direction.y})`);
    }
    
    public explode(): void {
        if (this.isExploding || this.hasHitTarget) return;
        
        this.isExploding = true;
        this.hasHitTarget = true;
        
        // Stop movement
        this.setVelocity(0, 0);
        
        // Immediately disable physics body to prevent further collisions
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body) {
            body.enable = false;
        }
        
        // Play explosion animation
        if (this.scene.anims.exists('enemy_bullet_explosion')) {
            this.play('enemy_bullet_explosion');
        } else {
            console.warn('EnemyBullet: enemy_bullet_explosion animation not found, attempting to create it');
            this.createExplosionAnimation();
            if (this.scene.anims.exists('enemy_bullet_explosion')) {
                this.play('enemy_bullet_explosion');
            } else {
                console.error('EnemyBullet: Failed to create enemy_bullet_explosion animation, returning to pool immediately');
                this.returnToPool();
                return;
            }
        }
        
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
    
    public destroyImmediately(): void {
        // Immediately destroy bullet without explosion animation
        // This is used when the parent spaceship is destroyed
        console.log(`Enemy bullet destroyed immediately (spaceship killed)`);
        this.returnToPool();
    }
    
    private returnToPool(): void {
        // Reset bullet state for reuse
        this.isExploding = false;
        this.hasHitTarget = false;
        
        // Stop movement
        this.setVelocity(0, 0);
        
        // Hide hitbox border
        if (this.hitboxBorder) {
            this.hitboxBorder.clear();
            this.hitboxBorder.setVisible(false);
        }
        
        // Disable physics body
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body) {
            body.enable = false;
        }
        
        // Stop any animations
        this.anims.stop();
        
        // Clear spaceship ID when bullet is returned to pool
        this.spaceshipId = undefined;
        
        // Remove any animation listeners to prevent memory leaks
        this.removeAllListeners();
        
        // Return to pool by setting inactive
        this.setActive(false);
        this.setVisible(false);
        
        console.log('Enemy bullet returned to pool');
    }
    
    override preUpdate(time: number, delta: number): void {
        super.preUpdate(time, delta);
        
        if (!this.active || this.isExploding) return;
        
        // Update hitbox border position
        this.updateHitboxBorder();
        
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
        
        // Clean up hitbox border
        if (this.hitboxBorder) {
            this.hitboxBorder.destroy();
        }
        
        // Clean up any listeners
        this.removeAllListeners();
        
        // Clear spaceship ID
        this.spaceshipId = undefined;
        
        // Set inactive and invisible
        this.setActive(false);
        this.setVisible(false);
        
        super.destroy(fromScene);
    }
}
