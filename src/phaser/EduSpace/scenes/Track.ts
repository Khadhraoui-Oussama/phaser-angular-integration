import Snowman from './Snowman';
import PlayerSnowball from './PlayerSnowball';
import EnemySnowball from './EnemySnowball';
import Phaser from 'phaser';
import MainGame from './Game';
import { ResponsiveGameUtils } from '../utils/ResponsiveGameUtils';
import { SkinManager } from '../utils/SkinManager';

export default class Track {
    scene: Phaser.Scene;
    id: number;
    y: number;
    nest: Phaser.Physics.Arcade.Image;
    eggCrackSprite: Phaser.GameObjects.Sprite;
    // snowmanBig: Snowman;
    snowmanSmall: Snowman;
    playerSnowballs: Phaser.Physics.Arcade.Group;
    enemySnowballs: Phaser.Physics.Arcade.Group;
    snowBallCollider: Phaser.Physics.Arcade.Collider;
    snowmanSmallCollider: Phaser.Physics.Arcade.Collider;
    nestCollider: Phaser.Physics.Arcade.Collider;
    // snowmanBigCollider: Phaser.Physics.Arcade.Collider;
    releaseTimerSmall: Phaser.Time.TimerEvent;
    // releaseTimerBig: Phaser.Time.TimerEvent;
    snowmenLabel:number


    constructor(scene: Phaser.Scene, id: number, trackY: number) {
        this.scene = scene;
        this.id = id;
        this.y = trackY;
        this.snowmenLabel = 0;
        
        // Get responsive dimensions for proper positioning
        const { width } = ResponsiveGameUtils.getResponsiveConfig(scene);
        
        // Use hardcoded scale values for different screen sizes
        const { config } = ResponsiveGameUtils.getResponsiveConfig(scene);
        let nestScale = 1.0; // Default desktop scale
        
        if (config.screenSize === 'mobile') {
            nestScale = 0.45; // Smaller scale for mobile
        } else if (config.screenSize === 'tablet') {
            nestScale = 0.7; // Fixed scale for tablet
        }
        
        // Calculate the exact position where we want the nest to appear visually
        const nestX = width ;
        const nestY = trackY -20;
        
        // Always use the classic nest from the classic sprites atlas for all skins
        this.nest = scene.physics.add.image(nestX, nestY, 'classic_sprites', 'nest').setOrigin(1, 1);
        this.nest.setScale(nestScale);
        
        // Create the egg crack animation sprite (initially hidden)
        this.eggCrackSprite = scene.add.sprite(nestX, nestY, 'eggs_crack').setOrigin(1, 1);
        // Make egg crack animation smaller than the nest for better visual effect
        const eggCrackScale = nestScale * 0.6; // 60% of nest size
        this.eggCrackSprite.setScale(eggCrackScale);
        this.eggCrackSprite.setVisible(false);
        
        // Create the egg crack animation if it doesn't exist
        if (!scene.anims.exists('egg_crack')) {
            scene.anims.create({
                key: 'egg_crack',
                frames: scene.anims.generateFrameNumbers('eggs_crack', { start: 0, end: 5 }),
                frameRate: 6,
                repeat: 0
            });
        }
        
        // Now set the collision body to be smaller than the sprite for more precise collision
        if (this.nest.body) {
            const body = this.nest.body as Phaser.Physics.Arcade.Body;
            
            // Get the actual dimensions after scaling
            const scaledWidth = this.nest.width * nestScale;
            const scaledHeight = this.nest.height * nestScale;
            
            // Make collision area smaller (60% of sprite size) for more precise collision
            const collisionWidth = scaledWidth * 0.3;
            const collisionHeight = scaledHeight;
            
            // Set body size to be smaller than the scaled sprite
            body.setSize(collisionWidth, collisionHeight);
            
            // Center the smaller collision body within the sprite
            // With origin (1,1), offset from bottom-right, centering the smaller body
            const offsetX = -scaledWidth + (scaledWidth - collisionWidth) / 2;
            const offsetY = -scaledHeight + (scaledHeight - collisionHeight) / 2;
            body.setOffset(offsetX, offsetY);
        }

        // this.snowmanBig = new Snowman(scene, this, 'Big',25);
        this.snowmanSmall = new Snowman(scene, this, 'Small',this.snowmenLabel);

        this.playerSnowballs = scene.physics.add.group({
            frameQuantity: 8,
            key: SkinManager.getTextureKey('playerSnowball'),
            frame: SkinManager.getCurrentSkin().type === 'atlas' ? 'snowball2' : undefined,
            active: false,
            visible: false,
            classType: PlayerSnowball
        });

        this.enemySnowballs = scene.physics.add.group({
            frameQuantity: 8,
            key: SkinManager.getTextureKey('enemySnowball'),
            frame: SkinManager.getCurrentSkin().type === 'atlas' ? 'snowball3' : undefined,
            active: false,
            visible: false,
            classType: EnemySnowball
        });
       
        this.snowBallCollider = scene.physics.add.overlap(
            this.playerSnowballs,
            this.enemySnowballs,
            this.hitSnowball as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
            undefined,
            this
        );
        this.snowmanSmallCollider = scene.physics.add.overlap(
            this.snowmanSmall,
            this.playerSnowballs,
            this.hitSnowman as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
            undefined,
            this
        );

        console.log(`=== INITIAL COLLISION SETUP DEBUG ===`);
        console.log(`Track ${id} collision setup for skin: ${SkinManager.getCurrentSkinId()}`);
        console.log(`Snowman texture: ${this.snowmanSmall.texture.key}`);
        console.log(`Player snowball texture: ${SkinManager.getTextureKey('playerSnowball')}`);
        console.log(`Initial collision setup completed for track ${id}`);

        // For wizard skin, add a manual collision check as backup
        if (SkinManager.getCurrentSkin().type === 'individual') {
            console.log(`Setting up wizard-specific collision monitoring for track ${id}`);
            scene.physics.world.on('worldstep', () => {
                this.checkWizardCollisions();
            });
        }

        this.nestCollider = scene.physics.add.overlap(
            this.nest,
            this.enemySnowballs,
            this.hitNest as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
            undefined,
            this
        );
       
    }
    setSnowmenLabel(newLabel: number) {
        this.replaceSnowmanWithLabel(newLabel);
    }
    replaceSnowmanWithLabel(newLabel: number) {
        // Destroy existing snowman and label
        if (this.snowmanSmall) {
            this.snowmanSmall.label.destroy();
            this.snowmanSmall.destroy();
        }

        // Create new snowman with new label
        this.snowmanSmall = new Snowman(this.scene, this, 'Small', newLabel);

        // Update the label stored on Track
        this.snowmenLabel = newLabel;

        // Destroy old collider and create a new one for the new snowman
        if (this.snowmanSmallCollider) {
            this.snowmanSmallCollider.destroy();
        }

        console.log(`=== COLLISION SETUP DEBUG ===`);
        console.log(`Setting up collision for skin: ${SkinManager.getCurrentSkinId()}`);
        console.log(`Snowman texture: ${this.snowmanSmall.texture.key}`);
        console.log(`Player snowball texture: ${SkinManager.getTextureKey('playerSnowball')}`);
        console.log(`Snowman body: ${(this.snowmanSmall.body as Phaser.Physics.Arcade.Body).width}x${(this.snowmanSmall.body as Phaser.Physics.Arcade.Body).height}`);

        this.snowmanSmallCollider = this.scene.physics.add.overlap(
            this.snowmanSmall,
            this.playerSnowballs,
            this.hitSnowman as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
            undefined,
            this
        );

        console.log(`Collision setup completed for track ${this.id}`);

        // For wizard skin, add a manual collision check as backup
        if (SkinManager.getCurrentSkin().type === 'individual') {
            console.log(`Setting up wizard-specific collision monitoring for track ${this.id} (replace)`);
        }

        // Recreate nest collider to ensure it works with the new snowball group
        if (this.nestCollider) {
            this.nestCollider.destroy();
        }

        this.nestCollider = this.scene.physics.add.overlap(
            this.nest,
            this.enemySnowballs,
            this.hitNest as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
            undefined,
            this
        );
    }
    start(minDelay: number, maxDelay: number): void {
        const delay = Phaser.Math.Between(minDelay, maxDelay);

        this.releaseTimerSmall = this.scene.time.addEvent({
            delay: delay,
            callback: () => {
                this.snowmanSmall.start();
            }
        });

        // this.releaseTimerBig = this.scene.time.addEvent({
        //     delay: delay * 3,
        //     callback: () => {
        //         this.snowmanBig.start();
        //     }
        // });
    }

    stop(): void {
        this.snowmanSmall.stop();
        // this.snowmanBig.stop();

        for (let snowball of this.playerSnowballs.getChildren() as PlayerSnowball[])
        {
            snowball.stop();
        }

        for (let snowball of this.enemySnowballs.getChildren() as EnemySnowball[])
        {
            snowball.stop();
        }

        this.releaseTimerSmall.remove();
        // this.releaseTimerBig.remove();
    }

    hitSnowball(
        ball1: Phaser.GameObjects.GameObject,
        ball2: Phaser.GameObjects.GameObject
    ): void {
        if (ball1 instanceof PlayerSnowball && ball2 instanceof EnemySnowball) {
            ball1.stop();
            ball2.stop();

            ball1.disableBody(true, true);
            ball2.disableBody(true, true);
        }
    }

    hitSnowman(
        snowman: Phaser.GameObjects.GameObject,
        ball: Phaser.GameObjects.GameObject
    ): void {
        if (snowman instanceof Snowman && ball instanceof PlayerSnowball) {
            if (snowman.isAlive && snowman.x > 0) {
                console.log(`=== WIZARD COLLISION DEBUG ===`);
                console.log(`Current skin: ${SkinManager.getCurrentSkinId()}`);
                console.log(`Snowman texture: ${snowman.texture.key}`);
                console.log(`Ball texture: ${ball.texture.key}`);
                console.log(`Snowman position: x=${snowman.x}, y=${snowman.y}`);
                console.log(`Ball position: x=${ball.x}, y=${ball.y}`);
                console.log(`Snowman body size: ${(snowman.body as Phaser.Physics.Arcade.Body).width}x${(snowman.body as Phaser.Physics.Arcade.Body).height}`);
                console.log(`Ball body size: ${(ball.body as Phaser.Physics.Arcade.Body).width}x${(ball.body as Phaser.Physics.Arcade.Body).height}`);
                
                ball.stop();
                ball.destroy();
                
                // Check if this is the correct answer before calling hit()
                const answer = parseInt(snowman.label.text);
                const currentQuestion = (this.scene as MainGame).currentQuestion;
                const correct = currentQuestion && currentQuestion.answer === answer;
                
                // Only knock back the snowman if it's the wrong answer
                if (!correct) {
                    snowman.hit();
                }
                
                // Always call onSnowmanHit to handle scoring and game flow
                (this.scene as MainGame).onSnowmanHit(snowman, this);
            }
        }
    }

    hitNest(
        nest: Phaser.GameObjects.GameObject,
        ball: Phaser.GameObjects.GameObject
    ): void {
        if (nest instanceof Phaser.Physics.Arcade.Image && ball instanceof EnemySnowball) {
            // Stop and destroy the snowball that hit the nest
            ball.stop();
            ball.destroy();
            
            // Remove all player snowballs that are currently in flight
            (this.scene as MainGame).tracks.forEach(track => {
                (track.playerSnowballs.getChildren() as PlayerSnowball[]).forEach(snowball => {
                    if (snowball.active) {
                        snowball.stop();
                        snowball.disableBody(true, true); // Disable physics body and hide
                    }
                });
            });
            
            // Treat this as a wrong answer since the player failed to hit the correct snowman
            // before the enemy snowball reached the nest
            (this.scene as MainGame).onEggHitAsWrongAnswer(this);
        }
    }

    throwPlayerSnowball(x: number): void {
        console.log(`=== TRACK ${this.id} SNOWBALL THROW DEBUG ===`);
        console.log(`Total snowballs in pool: ${this.playerSnowballs.children.entries.length}`);
        console.log(`Active snowballs: ${this.playerSnowballs.countActive(true)}`);
        console.log(`Inactive snowballs: ${this.playerSnowballs.countActive(false)}`);
        
        // Debug all snowballs in pool
        this.playerSnowballs.children.entries.forEach((snowball: any, index) => {
            console.log(`Snowball ${index}: active=${snowball.active}, visible=${snowball.visible}, x=${snowball.x}, y=${snowball.y}`);
        });

        let snowball = this.playerSnowballs.getFirstDead(false) as PlayerSnowball;
        console.log(`getFirstDead result:`, snowball);

        if (snowball) {
            console.log(`Firing snowball from track ${this.id} at x:${x}, y:${this.y}`);
            snowball.fire(x, this.y);
        } else {
            // No available snowball in pool - this could be the bug!
            console.warn(`No available player snowball in track ${this.id} pool. Active snowballs:`, 
                this.playerSnowballs.countActive(true));
            
            // Force cleanup of any snowballs that might be stuck
            this.playerSnowballs.children.entries.forEach((snowball: any) => {
                if (snowball.active && (snowball.x < -100 || snowball.x > 1200)) {
                    console.warn('Cleaning up stuck snowball at x:', snowball.x);
                    snowball.stop();
                    snowball.disableBody(true, true);
                }
            });
            
            // Try again after cleanup
            snowball = this.playerSnowballs.getFirstDead(false) as PlayerSnowball;
            if (snowball) {
                console.log('Successfully fired snowball after cleanup');
                snowball.fire(x, this.y);
            } else {
                console.error('Still no available snowball after cleanup!');
                console.error('Attempting to create emergency snowball...');
                
                // Emergency: manually create a snowball if none available
                const currentSkin = SkinManager.getCurrentSkin();
                const textureKey = SkinManager.getTextureKey('playerSnowball');
                const frameKey = currentSkin.type === 'atlas' ? 'snowball2' : undefined;
                
                const emergencySnowball = new PlayerSnowball(this.scene, 0, 0, textureKey, frameKey);
                this.scene.add.existing(emergencySnowball);
                this.scene.physics.add.existing(emergencySnowball);
                this.playerSnowballs.add(emergencySnowball);
                emergencySnowball.fire(x, this.y);
                console.log('Emergency snowball created and fired!');
            }
        }
    }

    throwEnemySnowball(x: number): void {
        let snowball = this.enemySnowballs.getFirstDead(false) as EnemySnowball;

        if (snowball)
        {
            snowball.track = this;
            snowball.fire(x, this.y);
        }
    }

    updateTrackPosition(newY: number): void {
        // Update track Y position
        this.y = newY;
        
        // Update nest position
        if (this.nest) {
            this.nest.y = newY ;
        }
        
        // Update egg crack sprite position
        if (this.eggCrackSprite) {
            this.eggCrackSprite.y = newY;
        }
        
        // Update snowman position
        if (this.snowmanSmall) {
            this.snowmanSmall.y = newY;
            this.snowmanSmall.currentTrack.y = newY;
        }
        
        // Update label position if it exists
        if (this.snowmanSmall && this.snowmanSmall.label) {
            this.snowmanSmall.label.y = this.snowmanSmall.y + 10;
        }
    }

    triggerEggCrack(onComplete?: () => void): void {
        // Hide the original nest and show the animated egg crack sprite
        if (this.nest) {
            this.nest.setVisible(false);
        }
        
        if (this.eggCrackSprite) {
            this.eggCrackSprite.setVisible(true);
            
            // Play the egg crack animation
            this.eggCrackSprite.play('egg_crack');
            
            // Listen for animation complete event
            this.eggCrackSprite.once('animationcomplete', () => {
                // Hide the crack sprite and show the original nest again
                this.eggCrackSprite.setVisible(false);
                if (this.nest) {
                    this.nest.setVisible(true);
                }
                
                // Clean up any remaining player snowballs that might have escaped the initial check
                (this.scene as MainGame).tracks.forEach(track => {
                    (track.playerSnowballs.getChildren() as PlayerSnowball[]).forEach(snowball => {
                        if (snowball.active) {
                            snowball.stop();
                            snowball.disableBody(true, true);
                        }
                    });
                });
                
                // Call the callback if provided
                if (onComplete) {
                    onComplete();
                }
            });
        } else if (onComplete) {
            // If no egg crack sprite, call the callback immediately
            onComplete();
        }
    }

    checkWizardCollisions(): void {
        // Only check if we have wizard skin and snowman is alive
        if (SkinManager.getCurrentSkin().type !== 'individual' || !this.snowmanSmall?.isAlive) {
            return;
        }

        // Get all active player snowballs
        const activeSnowballs = (this.playerSnowballs.getChildren() as PlayerSnowball[]).filter(
            snowball => snowball.active && snowball.visible
        );

        for (const snowball of activeSnowballs) {
            // Manual collision detection using distance calculation
            const distance = Phaser.Math.Distance.Between(
                this.snowmanSmall.x, this.snowmanSmall.y,
                snowball.x, snowball.y
            );
            
            // Use a generous collision distance for wizard enemies (100 pixels)
            if (distance < 100) {
                console.log(`=== WIZARD MANUAL COLLISION DETECTED ===`);
                console.log(`Distance: ${distance}`);
                console.log(`Snowman pos: x=${this.snowmanSmall.x}, y=${this.snowmanSmall.y}`);
                console.log(`Snowball pos: x=${snowball.x}, y=${snowball.y}`);
                
                // Trigger collision manually
                this.hitSnowman(this.snowmanSmall, snowball);
                break; // Only handle one collision per frame
            }
        }
    }
}
