import Phaser from 'phaser';
import { ResponsiveGameUtils } from '../utils/ResponsiveGameUtils';
import MainGame from './Game';

export default class EnemySpaceship extends Phaser.Physics.Arcade.Sprite {
    declare scene: MainGame;
    private isAlive: boolean;
    private isFlashing: boolean = false; // Track if currently flashing
    private speed: number;
    private shootTimer?: Phaser.Time.TimerEvent;
    private shootCooldown: number = 2000; // 2 seconds between shots
    private hitboxBorder!: Phaser.GameObjects.Graphics; // Red border for hitbox visualization
    public spaceshipId: string; // Unique ID for this spaceship
    
    // Static configurable speed variable
    public static BASE_SPEED: number = 150;
    
    constructor(scene: MainGame, x: number, y: number) {
        super(scene, x, y, 'enemy_ship_1_fly_000');
        
        this.scene = scene;
        this.setOrigin(0.5, 0.5);
        
        // Generate a unique ID for this spaceship
        this.spaceshipId = `spaceship_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Set responsive scale - make enemy spaceship bigger than player
        const { config, minScale } = ResponsiveGameUtils.getResponsiveConfig(scene);
        
        // Player ship uses Math.max(0.5, 0.8 * minScale), so make enemy bigger
        const playerShipScale = Math.max(0.5, 0.8 * minScale);
        let spaceshipScale = playerShipScale * 1.2; // 20% bigger than player
        
        if (config.screenSize === 'mobile') {
            spaceshipScale = playerShipScale * 1.15; // 15% bigger on mobile
        } else if (config.screenSize === 'tablet') {
            spaceshipScale = playerShipScale * 1.18; // 18% bigger on tablet
        }
        
        this.setScale(spaceshipScale);
        
        // Set depth to appear above background but below UI
        this.setDepth(25);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Set up physics body
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(this.width * 0.8, this.height * 0.8);
        body.setCollideWorldBounds(false); // Allow movement off-screen
        
        this.isAlive = true;
        
        // Set speed with responsive adjustments
        let baseSpeed = EnemySpaceship.BASE_SPEED;
        if (config.screenSize === 'mobile') {
            baseSpeed *= 0.7; // Slower on mobile
        } else if (config.screenSize === 'tablet') {
            baseSpeed *= 0.85; // Slightly slower on tablet
        }
        this.speed = baseSpeed;
        
        // Create hitbox border for visualization
        //this.createHitboxBorder();
        
        console.log(`EnemySpaceship created at (${x}, ${y}) with speed ${this.speed}`);
    }
    
    private createHitboxBorder(): void {
        // Create a graphics object for the hitbox border
        this.hitboxBorder = this.scene.add.graphics();
        
        // Get the physics body size to match the hitbox border
        const body = this.body as Phaser.Physics.Arcade.Body;
        const width = body.width;
        const height = body.height;
        
        // Draw red border for enemy spaceship hitbox
        this.hitboxBorder.lineStyle(2, 0xff0000, 1); // Red color, 2px thickness
        this.hitboxBorder.strokeRect(this.x - width/2, this.y - height/2, width, height);
        
        // Set depth to ensure border is visible
        this.hitboxBorder.setDepth(30);
    }
    
    private updateHitboxBorder(): void {
        if (!this.hitboxBorder) return;
        
        // Clear previous border
        this.hitboxBorder.clear();
        
        // Get the physics body size to match the hitbox border
        const body = this.body as Phaser.Physics.Arcade.Body;
        const width = body.width;
        const height = body.height;
        
        // Draw red border for enemy spaceship hitbox at current position
        this.hitboxBorder.lineStyle(2, 0xff0000, 1); // Red color, 2px thickness
        this.hitboxBorder.strokeRect(this.x - width/2, this.y - height/2, width, height);
    }
    
    start(): void {
        this.isAlive = true;
        this.setActive(true);
        this.setVisible(true);
        
        // Start flying animation
        this.play('enemy_ship_fly');
        
        // Start moving left
        this.moveLeft();
        
        // Start shooting
        this.startShooting();
        
        console.log('EnemySpaceship started moving left and shooting');
    }
    
    private moveLeft(): void {
        if (!this.isAlive) return;
        
        // Set velocity to move left
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocityX(-this.speed);
    }
    
    private startShooting(): void {
        if (!this.isAlive) return;
        
        // Create timer to shoot periodically
        this.shootTimer = this.scene.time.addEvent({
            delay: this.shootCooldown,
            callback: this.shoot,
            callbackScope: this,
            loop: true
        });
        
        console.log('Enemy spaceship started shooting');
    }
    
    private shoot(): void {
        if (!this.isAlive || !this.active) return;
        
        // Calculate shoot position (slightly in front of the spaceship)
        const shootX = this.x - 30; // Shoot from front of ship
        const shootY = this.y;
        
        // Direction toward player (left direction)
        const direction = { x: -1, y: 0 };
        
        // Emit shoot event to the scene with spaceship ID
        this.scene.events.emit('enemy-shoot', {
            x: shootX,
            y: shootY,
            direction: direction,
            spaceshipId: this.spaceshipId
        });
        
        console.log(`Enemy spaceship ${this.spaceshipId} shot from (${shootX}, ${shootY})`);
    }
    
    override stop(): this {
        this.isAlive = false;
        
        // Stop shooting
        if (this.shootTimer) {
            this.shootTimer.destroy();
            this.shootTimer = undefined;
        }
        
        // Clean up hitbox border
        if (this.hitboxBorder) {
            this.hitboxBorder.destroy();
        }
        
        // Stop movement
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body) {
            body.setVelocity(0, 0);
            body.enable = false;
        }
        
        // Stop animation
        this.anims.stop();
        
        return this;
    }
    
    override preUpdate(time: number, delta: number): void {
        super.preUpdate(time, delta);
        
        if (!this.isAlive) return;
        
        // Update hitbox border position
        this.updateHitboxBorder();
        
        // Check if spaceship is off-screen (left side) and should be destroyed
        if (this.x < -100) {
            console.log('EnemySpaceship went off-screen, destroying');
            this.destroy();
        }
    }
    
    // Static method to update speed for all spaceships
    public static setBaseSpeed(newSpeed: number): void {
        EnemySpaceship.BASE_SPEED = newSpeed;
        console.log(`EnemySpaceship base speed updated to: ${newSpeed}`);
    }
    
    // Method to update individual spaceship speed
    public setSpeed(newSpeed: number): void {
        this.speed = newSpeed;
        this.moveLeft(); // Recalculate movement with new speed
    }
    
    public getIsAlive(): boolean {
        return this.isAlive;
    }
    
    public getIsFlashing(): boolean {
        return this.isFlashing;
    }
    
    public destroyMyBullets(): void {
        // Safety check: ensure scene is still valid
        if (!this.scene || !this.scene.sys || !this.scene.sys.isActive()) {
            console.warn(`Cannot destroy bullets: scene is invalid for spaceship ${this.spaceshipId}`);
            return;
        }
        
        // Get all enemy bullets from the scene and destroy those belonging to this spaceship
        const enemyBullets = this.scene.getEnemyBullets();
        if (enemyBullets && enemyBullets.children) {
            enemyBullets.children.entries.forEach((bullet: any) => {
                if (bullet.active && bullet.spaceshipId === this.spaceshipId) {
                    console.log(`Immediately destroying bullet from spaceship ${this.spaceshipId}`);
                    try {
                        if (bullet.destroyImmediately) {
                            bullet.destroyImmediately();
                        } else {
                            // Fallback for older bullet implementations
                            bullet.spaceshipId = undefined;
                            bullet.destroy();
                        }
                    } catch (error) {
                        console.warn('Error destroying bullet:', error);
                        // If destroy fails: deactivate it
                        bullet.setActive(false);
                        bullet.setVisible(false);
                        bullet.spaceshipId = undefined;
                    }
                }
            });
        }
    }
    
    // Method to flash red when hit by player bullet
    public flashRed(callback?: () => void): void {
        if (this.isFlashing) return; // Prevent multiple flashes
        
        this.isFlashing = true;
        
        // Disable physics body to prevent further collisions during flash
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body) {
            body.enable = false;
        }
        
        // Stop movement and shooting during flash
        this.setVelocity(0, 0);
        if (this.shootTimer) {
            this.shootTimer.destroy();
            this.shootTimer = undefined;
        }
        
        // IMMEDIATELY destroy bullets when hit (don't wait for red flashing animation)
        this.destroyMyBullets();
        
        // Store original values for reset
        const originalScale = this.scaleX;
        const originalTint = this.tint;
        
        // Set red tint
        this.setTint(0xff0000);
        
        // Create size flash effect: grow then shrink like player ship
        this.scene.tweens.add({
            targets: this,
            scaleX: originalScale * 1.3, // Grow 30% bigger
            scaleY: originalScale * 1.3,
            duration: 180,
            ease: 'Power2',
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                // Ensure we're back to original scale
                this.setScale(originalScale);
            }
        });
        
        // Flash effect: quick alpha changes
        this.scene.tweens.add({
            targets: this,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            repeat: 2, // Flash 3 times total
            onComplete: () => {
                // Reset tint and alpha
                this.clearTint();
                this.setAlpha(1);
                this.isFlashing = false;
                
                // Call the callback to destroy the spaceship (with safety checks)
                if (callback) {
                    try {
                        // Additional safety check to ensure the object is still valid
                        if (this && this.scene && this.active) {
                            callback();
                        } else {
                            console.warn(`EnemySpaceship ${this.spaceshipId} callback skipped - object invalid`);
                        }
                    } catch (error) {
                        console.error(`Error in EnemySpaceship ${this.spaceshipId} callback:`, error);
                    }
                }
            }
        });
    }
    
    // Method to update scale for fullscreen changes
    public updateFullscreenScale(isFullscreen: boolean): void {
        const { config, minScale } = ResponsiveGameUtils.getResponsiveConfig(this.scene);
        
        // Use same scaling logic as in constructor - make enemy bigger than player
        const playerShipScale = Math.max(0.5, 0.8 * minScale);
        let spaceshipScale = playerShipScale * 1.2; // 20% bigger than player
        
        if (config.screenSize === 'mobile') {
            spaceshipScale = playerShipScale * 1.15; // 15% bigger on mobile
        } else if (config.screenSize === 'tablet') {
            spaceshipScale = playerShipScale * 1.18; // 18% bigger on tablet
        }
        
        const scaleMultiplier = isFullscreen ? 1.3 : 1.0;
        this.setScale(spaceshipScale * scaleMultiplier);
    }
    
    // Static method to spawn enemy spaceship off-screen (right side only)
    public static spawnOffScreen(scene: MainGame): EnemySpaceship {
        const { width, height } = ResponsiveGameUtils.getResponsiveConfig(scene);
        
        // Spawn from right side only
        const spawnX = width + 50;
        const spawnY = Phaser.Math.Between(100, height - 100); // Random Y position with margins
        
        const spaceship = new EnemySpaceship(scene, spawnX, spawnY);
        spaceship.start();
        
        console.log(`EnemySpaceship spawned off-screen at (${spawnX}, ${spawnY})`);
        return spaceship;
    }
    
    override destroy(fromScene?: boolean): void {
        // Only try to destroy bullets if we haven't been destroyed yet
        if (!this.scene || this.scene === undefined) {
            console.warn(`EnemySpaceship ${this.spaceshipId} destroy called but scene is undefined`);
        } else {
            this.destroyMyBullets();
        }
        
        // Clean up hitbox border
        if (this.hitboxBorder) {
            this.hitboxBorder.destroy();
        }
        
        // Clean up shooting timer
        if (this.shootTimer) {
            this.shootTimer.destroy();
            this.shootTimer = undefined;
        }
        
        super.destroy(fromScene);
    }
}
