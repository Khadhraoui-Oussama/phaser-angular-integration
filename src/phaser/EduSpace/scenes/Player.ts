import Phaser from 'phaser';
import { ResponsiveGameUtils } from '../utils/ResponsiveGameUtils';

export class Player extends Phaser.GameObjects.Container {
    private ship!: Phaser.GameObjects.Sprite;
    private hitboxBorder!: Phaser.GameObjects.Graphics; // Green border for hitbox visualization
    private spriteBorder!: Phaser.GameObjects.Graphics; // Yellow border for sprite outline
    private lives: number = 3;
    private energy: number = 100;
    private maxEnergy: number = 100;
    private maxLives: number = 3;
    private speed: number = 450; // Increased Y-axis movement speed
    private shootCooldown: number = 0;
    private shootDelay: number = 250; // milliseconds between shots
    private isInvulnerable: boolean = false;
    private invulnerabilityTime: number = 2000; // 2 seconds of invulnerability after hit
    
    // Input handling - NOTE: Player movement is restricted to Y-axis only
    // X position is fixed at window width / 4
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasdKeys?: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
    private spaceKey?: Phaser.Input.Keyboard.Key;
    
    // Mobile touch controls - only vertical movement allowed
    private touchStartX: number = 0;
    private touchStartY: number = 0;
    private isDragging: boolean = false;
    
    // Mouse/cursor dragging controls
    private isMouseDragging: boolean = false;
    private mouseStartY: number = 0;
    
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);
        
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);
        
        // Set up physics body
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(true);
        
        // Fix X position to width/4
        const { width } = ResponsiveGameUtils.getResponsiveConfig(this.scene);
        this.x = width / 8;
        
        this.createShip();
        this.createHitboxBorder(); // Add hitbox visualization
        this.createSpriteBorder(); // Add sprite outline visualization
        this.setupInput();
        this.setupTouchControls();
        
        // Set depth to ensure player is above other game objects
        this.setDepth(50);
    }
    
    private createShip(): void {
        // Check if ship frames are loaded, use fallback if not
        let shipTexture = 'ship_6_move_000';
        if (!this.scene.textures.exists(shipTexture)) {
            // Fallback to a basic texture if ship frames aren't loaded
            console.warn('Ship texture not found, using fallback');
            // You can use any existing texture as fallback, or create a simple rectangle
            shipTexture = this.createFallbackShipTexture();
        }
        
        // Create the ship sprite with the first frame or fallback
        this.ship = this.scene.add.sprite(0, 0, shipTexture);
        
        // Scale the ship appropriately for the game
        const { minScale } = ResponsiveGameUtils.getResponsiveConfig(this.scene);
        const shipScale = Math.max(0.5, 0.8 * minScale);
        this.ship.setScale(shipScale);
        
        // Add ship to this container
        this.add(this.ship);
        
        // Set physics body size based on ship sprite
        const body = this.body as Phaser.Physics.Arcade.Body;
        const physicsWidth = this.ship.width * shipScale * 0.7; // Slightly bigger hitbox (was 0.6)
        const physicsHeight = this.ship.height * shipScale * 0.7; // Slightly bigger hitbox (was 0.6)
        body.setSize(physicsWidth, physicsHeight);
        
        // Remove setOffset to let physics body center naturally
        // The offset might be causing collision position issues
        
        console.log(`Player physics body: ${physicsWidth}x${physicsHeight}`);
        console.log(`Player ship size: ${this.ship.width * shipScale}x${this.ship.height * shipScale}`);
        
        // Create ship movement animation
        this.createShipAnimation();
    }
    
    private createHitboxBorder(): void {
        // Create a graphics object for the hitbox border
        this.hitboxBorder = this.scene.add.graphics();
        this.add(this.hitboxBorder);
        
        // Get the physics body size to show actual collision area
        const body = this.body as Phaser.Physics.Arcade.Body;
        const width = body.width;
        const height = body.height;
        
        // Draw green border for player hitbox (showing actual physics body)
        this.hitboxBorder.lineStyle(2, 0x00ff00, 1); // Green color, 2px thickness
        this.hitboxBorder.strokeRect(-width/2, -height/2, width, height);
        
        // Set depth to ensure border is visible
        this.hitboxBorder.setDepth(60);
    }
    
    private createSpriteBorder(): void {
        // Create a graphics object for the sprite border
        this.spriteBorder = this.scene.add.graphics();
        this.add(this.spriteBorder);
        
        // Get the ship sprite size with scaling
        const { minScale } = ResponsiveGameUtils.getResponsiveConfig(this.scene);
        const shipScale = Math.max(0.5, 0.8 * minScale);
        const spriteWidth = this.ship.width * shipScale;
        const spriteHeight = this.ship.height * shipScale;
        
        // Draw yellow border for sprite outline (visual reference)
        this.spriteBorder.lineStyle(2, 0xffff00, 0.8); // Yellow color, 2px thickness, slightly transparent
        this.spriteBorder.strokeRect(-spriteWidth/2, -spriteHeight/2, spriteWidth, spriteHeight);
        
        // Set depth to ensure border is visible but behind hitbox border
        this.spriteBorder.setDepth(59);
    }
    
    private createFallbackShipTexture(): string {
        // Create a simple fallback ship texture using graphics
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(0x00ff00); // Green color
        graphics.fillTriangle(0, 0, -20, 40, 20, 40); // Simple triangle shape
        graphics.generateTexture('fallback_ship', 40, 40);
        graphics.destroy();
        return 'fallback_ship';
    }
    
    private createShipAnimation(): void {
        // Check if the first frame exists before creating animation
        if (!this.scene.textures.exists('ship_6_move_000')) {
            console.warn('Ship frames not loaded yet, using fallback');
            return;
        }
        
        // Create the animation using individual frame keys
        if (!this.scene.anims.exists('ship_move')) {
            const frames = [];
            for (let i = 0; i < 8; i++) {
                const frameNumber = i.toString().padStart(3, '0');
                const frameKey = `ship_6_move_${frameNumber}`;
                
                // Only add frame if it exists
                if (this.scene.textures.exists(frameKey)) {
                    frames.push({ key: frameKey });
                }
            }
            
            // Only create animation if we have frames
            if (frames.length > 0) {
                this.scene.anims.create({
                    key: 'ship_move',
                    frames: frames,
                    frameRate: 12,
                    repeat: -1 // Loop infinitely
                });
                
                // Start the animation
                this.ship.play('ship_move');
            } else {
                console.warn('No ship frames found, animation not created');
            }
        } else {
            // Animation already exists, just play it
            this.ship.play('ship_move');
        }
    }
    
    private setupInput(): void {
        // Set up keyboard input - only up/down keys and shooting
        if (this.scene.input.keyboard) {
            this.cursors = this.scene.input.keyboard.createCursorKeys();
            this.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
            
            // WASD keys as alternative - only W (up) and S (down)
            this.wasdKeys = {
                W: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
                A: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A), // Not used but kept for compatibility
                S: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
                D: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)  // Not used but kept for compatibility
            };
        }
    }
    
    private setupTouchControls(): void {
        // Set up touch/mouse controls for mobile and desktop - only vertical movement
        this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.touchStartX = pointer.x;
            this.touchStartY = pointer.y;
            this.mouseStartY = pointer.y;
            
            if (ResponsiveGameUtils.isMobile(this.scene)) {
                this.isDragging = true;
            } else {
                // Desktop mouse dragging
                this.isMouseDragging = true;
            }
        });
        
        this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            // Mobile touch dragging
            if (this.isDragging && ResponsiveGameUtils.isMobile(this.scene)) {
                const deltaY = pointer.y - this.touchStartY;
                
                // Move player based on touch drag - only Y axis
                this.y += deltaY * 0.5; // Dampen movement for better control
                
                // Keep player within screen bounds - only Y axis, X is fixed
                const { width, height } = ResponsiveGameUtils.getResponsiveConfig(this.scene);
                this.x = width / 8; // Always keep X fixed at width/8
                this.y = Phaser.Math.Clamp(this.y, 50, height - 50);
                
                this.touchStartY = pointer.y;
            }
            
            // Desktop mouse dragging
            if (this.isMouseDragging && !ResponsiveGameUtils.isMobile(this.scene)) {
                const deltaY = pointer.y - this.mouseStartY;
                
                // Move player based on mouse drag - only Y axis
                this.y += deltaY * 0.8; // Slightly less damping for desktop precision
                
                // Keep player within screen bounds - only Y axis, X is fixed
                const { width, height } = ResponsiveGameUtils.getResponsiveConfig(this.scene);
                this.x = width / 8; // Always keep X fixed at width/8
                this.y = Phaser.Math.Clamp(this.y, 50, height - 50);
                
                this.mouseStartY = pointer.y;
            }
        });
        
        this.scene.input.on('pointerup', () => {
            this.isDragging = false;
            this.isMouseDragging = false;
        });
        
        // Tap/click to shoot
        this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            // Only shoot if not starting a drag (small delay to differentiate)
            this.scene.time.delayedCall(100, () => {
                if (!this.isDragging && !this.isMouseDragging) {
                    this.shoot();
                }
            });
        });
    }
    
    public override update(time: number, delta: number): void {
        this.handleInput(delta);
        this.updateShootCooldown(delta);
        this.updateInvulnerability(delta);
        this.regenerateEnergy(delta);
        this.enforceFixedXPosition();
    }
    
    private enforceFixedXPosition(): void {
        // Always ensure X position remains at width/4
        const { width } = ResponsiveGameUtils.getResponsiveConfig(this.scene);
        this.x = width / 8;
    }
    
    private handleInput(delta: number): void {
        if (!this.cursors && !this.wasdKeys) return;
        
        const body = this.body as Phaser.Physics.Arcade.Body;
        const moveSpeed = this.speed;
        
        // Reset velocity
        body.setVelocity(0);
        
        // Ensure X position remains fixed
        const { width } = ResponsiveGameUtils.getResponsiveConfig(this.scene);
        this.x = width / 8;
        
        // Handle vertical movement input only
        let moving = false;
        
        if (this.cursors) {
            // Only process up/down movement, ignore left/right
            if (this.cursors.up.isDown || (this.wasdKeys && this.wasdKeys.W.isDown)) {
                body.setVelocityY(-moveSpeed);
                moving = true;
            } else if (this.cursors.down.isDown || (this.wasdKeys && this.wasdKeys.S.isDown)) {
                body.setVelocityY(moveSpeed);
                moving = true;
            }
        }
        
        // Check if we're moving via mouse/touch dragging
        if (this.isMouseDragging || this.isDragging) {
            moving = true;
        }
        
        // Handle shooting input
        if (this.spaceKey && this.spaceKey.isDown) {
            this.shoot();
        }
        
        // Update ship animation based on movement
        if (this.ship && this.ship.anims) {
            if (moving) {
                if (!this.ship.anims.isPlaying || this.ship.anims.currentAnim?.key !== 'ship_move') {
                    if (this.scene.anims.exists('ship_move')) {
                        this.ship.play('ship_move');
                    }
                }
            } else {
                // Could add idle animation here if available
                if (!this.ship.anims.isPlaying && this.scene.anims.exists('ship_move')) {
                    this.ship.play('ship_move');
                }
            }
        }
    }
    
    private updateShootCooldown(delta: number): void {
        if (this.shootCooldown > 0) {
            this.shootCooldown -= delta;
        }
    }
    
    private updateInvulnerability(delta: number): void {
        if (this.isInvulnerable) {
            // Flash effect during invulnerability
            this.alpha = Math.sin(this.scene.time.now * 0.01) * 0.5 + 0.5;
        } else {
            this.alpha = 1;
        }
    }
    
    private regenerateEnergy(delta: number): void {
        // Slowly regenerate energy over time
        if (this.energy < this.maxEnergy) {
            this.energy = Math.min(this.maxEnergy, this.energy + (delta * 0.02)); // Regenerate 20 energy per second
        }
    }
    
    public shoot(): boolean {
        if (this.shootCooldown <= 0 && this.energy >= 10) {
            this.shootCooldown = this.shootDelay;
            this.energy = Math.max(0, this.energy - 10); // Shooting costs energy
            
            // Play shoot sound
            this.scene.sound.play('shoot_laser', { volume: 0.3 });
            
            // Emit event for bullet creation (will be handled by the game scene)
            this.scene.events.emit('player-shoot', {
                x: this.x + 30, // Shoot from right side of ship
                y: this.y, // Same Y position as ship
                direction: { x: 1, y: 0 } // Shoot to the right (positive X direction)
            });
            
            return true;
        }
        return false;
    }
    
    public takeDamage(damage: number = 20): boolean {
        if (this.isInvulnerable) return false;
        
        this.energy = Math.max(0, this.energy - damage);
        
        // If energy is depleted, lose a life
        if (this.energy <= 0) {
            this.loseLife();
            return true;
        }
        
        // Start invulnerability period
        this.startInvulnerability();
        
        // Play damage sound
        this.scene.sound.play('hit_wrong', { volume: 0.4 });
        
        return false; // Didn't die
    }
    
    private loseLife(): void {
        this.lives--;
        this.energy = this.maxEnergy; // Restore energy when losing a life
        
        if (this.lives <= 0) {
            this.destroy();
            this.scene.events.emit('player-destroyed');
        } else {
            this.startInvulnerability();
            this.scene.events.emit('player-life-lost', this.lives);
        }
    }
    
    private startInvulnerability(): void {
        this.isInvulnerable = true;
        
        // Add red hit effect
        this.createHitEffect();
        
        this.scene.time.delayedCall(this.invulnerabilityTime, () => {
            this.isInvulnerable = false;
        });
    }
    
    private createHitEffect(): void {
        if (!this.ship) return;
        
        // Store original values
        const originalScale = this.ship.scaleX;
        const originalTint = this.ship.tint;
        
        // Apply red tint to indicate damage
        this.ship.setTint(0xff0000);
        
        // Create a slight shake/scale effect
        this.scene.tweens.add({
            targets: this.ship,
            scaleX: originalScale * 1.2,
            scaleY: originalScale * 1.2,
            duration: 150,
            ease: 'Power2',
            yoyo: true,
            repeat: 1,
            onComplete: () => {
                // Reset the ship to original state after animation
                this.ship.setScale(originalScale);
            }
        });
        
        // Flash red effect - alternate between red and normal tint
        let flashCount = 0;
        const maxFlashes = 6; // 3 full red/normal cycles
        
        const flashTimer = this.scene.time.addEvent({
            delay: 200,
            callback: () => {
                flashCount++;
                if (flashCount % 2 === 0) {
                    this.ship.setTint(originalTint); // Normal tint
                } else {
                    this.ship.setTint(0xff0000); // Red tint
                }
                
                if (flashCount >= maxFlashes) {
                    this.ship.setTint(originalTint); // Ensure we end with normal tint
                    flashTimer.destroy();
                }
            },
            loop: true
        });
        
        // Add floating damage text above the player
        const damageText = this.scene.add.text(this.x, this.y - 40, '-1', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Animate the damage text
        this.scene.tweens.add({
            targets: damageText,
            y: this.y - 80,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                damageText.destroy();
            }
        });
    }
    
    public heal(amount: number): void {
        this.energy = Math.min(this.maxEnergy, this.energy + amount);
    }
    
    public addLife(): void {
        if (this.lives < this.maxLives) {
            this.lives++;
        }
    }
    
    public restoreEnergy(): void {
        this.energy = this.maxEnergy;
    }
    
    // Getters
    public getLives(): number {
        return this.lives;
    }
    
    public getEnergy(): number {
        return this.energy;
    }
    
    public getMaxEnergy(): number {
        return this.maxEnergy;
    }
    
    public getEnergyPercentage(): number {
        return (this.energy / this.maxEnergy) * 100;
    }
    
    public isAlive(): boolean {
        return this.lives > 0;
    }
    
    public getIsInvulnerable(): boolean {
        return this.isInvulnerable;
    }
    
    public getIsDragging(): boolean {
        return this.isDragging || this.isMouseDragging;
    }
    
    // Setters
    public setSpeed(speed: number): void {
        this.speed = speed;
    }
    
    public setShootDelay(delay: number): void {
        this.shootDelay = delay;
    }
    
    // Method to update player position and boundaries on screen resize
    public updateForScreenResize(): void {
        const { width } = ResponsiveGameUtils.getResponsiveConfig(this.scene);
        
        // Update fixed X position
        this.x = width / 8;
        
        // The physics body collision bounds are automatically updated by Phaser
        // when setCollideWorldBounds(true) is set, so no manual bounds update needed
        console.log(`Player position updated for screen resize. New X: ${this.x}`);
    }
    
    public override destroy(fromScene?: boolean): void {
        // Clean up animations
        if (this.ship) {
            this.ship.destroy();
        }
        
        // Clean up hitbox border
        if (this.hitboxBorder) {
            this.hitboxBorder.destroy();
        }
        
        // Clean up sprite border
        if (this.spriteBorder) {
            this.spriteBorder.destroy();
        }
        
        super.destroy(fromScene);
    }
}