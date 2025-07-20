import Snowman from './Snowman';
import PlayerSnowball from './PlayerSnowball';
import EnemySnowball from './EnemySnowball';
import Phaser from 'phaser';
import MainGame from './Game';
import { ResponsiveGameUtils } from '../utils/ResponsiveGameUtils';

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
        
        // Create the physics image directly
        this.nest = scene.physics.add.image(nestX, nestY, 'sprites', 'nest').setOrigin(1, 1);
        this.nest.setScale(nestScale);
        
        // Create the egg crack animation sprite (initially hidden)
        this.eggCrackSprite = scene.add.sprite(nestX, nestY, 'eggs_crack').setOrigin(1, 1);
        this.eggCrackSprite.setScale(nestScale);
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
        
        // Now set the collision body to match exactly where the sprite appears
        if (this.nest.body) {
            const body = this.nest.body as Phaser.Physics.Arcade.Body;
            
            // Get the actual dimensions after scaling
            const scaledWidth = this.nest.width * nestScale;
            const scaledHeight = this.nest.height * nestScale;
            
            // Set body size to match the scaled sprite
            body.setSize(scaledWidth, scaledHeight);
            
            // With origin (1,1), the offset should be negative to move the body 
            // from the bottom-right origin to cover the actual sprite area
            body.setOffset(-scaledWidth, -scaledHeight);
        }

        // this.snowmanBig = new Snowman(scene, this, 'Big',25);
        this.snowmanSmall = new Snowman(scene, this, 'Small',this.snowmenLabel);

        this.playerSnowballs = scene.physics.add.group({
            frameQuantity: 8,
            key: 'sprites',
            frame: 'snowball2',
            active: false,
            visible: false,
            classType: PlayerSnowball
        });

        this.enemySnowballs = scene.physics.add.group({
            frameQuantity: 8,
            key: 'sprites',
            frame: 'snowball3',
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

        this.snowmanSmallCollider = this.scene.physics.add.overlap(
            this.snowmanSmall,
            this.playerSnowballs,
            this.hitSnowman as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
            undefined,
            this
        );

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
                ball.stop();
                ball.destroy();
                snowman.hit();
                (this.scene as MainGame).onSnowmanHit(snowman,this)
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
                const emergencySnowball = new PlayerSnowball(this.scene, 0, 0, 'sprites', 'snowball2');
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
}
