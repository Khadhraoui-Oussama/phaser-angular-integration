import Phaser from 'phaser';
import { ResponsiveGameUtils } from '../utils/ResponsiveGameUtils';
import { languageManager } from '../utils/LanguageManager';
import { Player } from './Player';
import PlayerBullet from './PlayerBullet';
import Answer, { AnswerData } from './Answer';

export default class MainGame extends Phaser.Scene {
    private background!: Phaser.GameObjects.Image;
    private titleText!: Phaser.GameObjects.Text;
    private backButton!: Phaser.GameObjects.Container;
    private languageChangeUnsubscribe?: () => void;
    private selectedLevel?: number;
    private player!: Player;
    private playerBullets!: Phaser.Physics.Arcade.Group;
    private answers: Answer[] = [];
    private answerSpawnTimer?: Phaser.Time.TimerEvent;
    
    constructor() {
        super('MainGame');
    }

    init(data?: { selectedLevel?: number }) {
        // Initialize with selected level if provided (for future use)
        if (data?.selectedLevel) {
            this.selectedLevel = data.selectedLevel;
            console.log("selectedLevel in MainGame:", data.selectedLevel);
        }
    }

    create(): void {
        // Ensure no other scenes are running to prevent stacking
        this.scene.manager.scenes.forEach(scene => {
            if (scene.scene.key !== 'MainGame' && scene.scene.isActive()) {
                scene.scene.stop();
            }
        });
        
        // Only play background music if it's not already playing to prevent double playback
        const bgMusic = this.sound.get('main_music');
        if (!bgMusic || !bgMusic.isPlaying) {
            this.sound.play('main_music', { loop: true, volume: 0.4 });
        }
        
        const { width, height, centerX, centerY } = ResponsiveGameUtils.getResponsiveConfig(this);

        // Setup responsive input for mobile
        ResponsiveGameUtils.setupMobileInput(this);

        this.createBackground();

        this.createPlayer();
        
        this.createBulletGroups();

        this.setupPhysicsWorldBounds();

        this.createAnswerSpawner();

        this.setupCollisionDetection();

        this.createTitle();

        this.createBackButton();

        // Subscribe to language changes with scene validation
        this.languageChangeUnsubscribe = languageManager.onLanguageChangeWithSceneCheck(this, () => {
            // No text updates needed since we use an icon
        });

        // Setup resize handling
        ResponsiveGameUtils.setupResizeHandler(this, () => {
            this.handleResize();
        });

        // Listen for scene shutdown to cleanup
        this.events.on('shutdown', () => {
            this.cleanup();
        });

        // Listen for scene stop to cleanup
        this.events.on('destroy', () => {
            this.cleanup();
        });
    }

    private createBackground(): void {
        const { width, height, centerX, centerY } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        // Add background (same as main menu)
        this.background = this.add.image(centerX, centerY, 'bg2');
        this.background.setDisplaySize(width, height);
        
        // Add overlay on top of background (same as main menu)
        const overlay = this.add.image(centerX, centerY, 'overlay');
        overlay.setDisplaySize(width, height);
    }

    private createPlayer(): void {
        const { width, height } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        // Create player at fixed X position (width/8) and center-left area of screen for horizontal shooting
        this.player = new Player(this, width / 8, height * 0.5);
        
        // Listen for player events
        this.events.on('player-shoot', (data: { x: number; y: number; direction: { x: number; y: number } }) => {
            // Create a new bullet from the pool
            const bullet = this.playerBullets.get() as PlayerBullet;
            if (bullet) {
                bullet.fire(data.x, data.y, data.direction);
                console.log('Player bullet created at:', data.x, data.y, 'Direction:', data.direction);
            } else {
                console.warn('Could not get bullet from pool (pool might be full)');
            }
        });
        
        this.events.on('player-destroyed', () => {
            console.log('Player destroyed - Game Over');
            // Handle game over logic here
        });
        
        this.events.on('player-life-lost', (remainingLives: number) => {
            console.log('Player lost a life. Remaining lives:', remainingLives);
            // Handle life lost logic here
        });
    }
    
    private createBulletGroups(): void {
        // Create physics group for player bullets
        this.playerBullets = this.physics.add.group({
            classType: PlayerBullet,
            maxSize: 20, // Maximum number of bullets on screen
            runChildUpdate: true // Important: this ensures bullets update properly
        });
    }
    
    private setupPhysicsWorldBounds(): void {
        const { width, height } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        // Set physics world bounds to match screen size
        this.physics.world.setBounds(0, 0, width, height);
        console.log(`Physics world bounds set to: ${width}x${height}`);
    }
    
    private createAnswerSpawner(): void {
        // Create timer to spawn answers every 3-5 seconds
        this.answerSpawnTimer = this.time.addEvent({
            delay: Phaser.Math.Between(3000, 5000), // Random delay between 3-5 seconds
            callback: this.spawnAnswer,
            callbackScope: this,
            loop: true
        });
        
        console.log('Answer spawner created');
    }
    
    private spawnAnswer(): void {
        // Sample answer data - replace with your actual question/answer logic
        const sampleAnswers: AnswerData[] = [
            { isUrl:true,content: "https://hips.hearstapps.com/hmg-prod/images/dog-puppy-on-garden-royalty-free-image-1586966191.jpg?crop=1xw:0.74975xh;0,0.190xh", isCorrect: true, isImage: true },
            { isUrl:true,content: "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcQK1dXQrVCbBvMdU4A83XdwM7Rtte8YFsWFI-y5JLABKyTRyUTBQko0SqyrqNJQf96aNdEqLNo5eZglqCIH2udWwuewokYR5-0QnjucNq4Y5Q", isCorrect: true, isImage: true },
            { content: "Car", isCorrect: false, isImage: false },
        ];
        
        // Get random answer data
        const randomAnswerData = sampleAnswers[Math.floor(Math.random() * sampleAnswers.length)];
        
        // Get random Y position
        const yPosition = Answer.getRandomYPosition(this);
        
        // Create new answer
        const answer = new Answer(this, randomAnswerData, yPosition);
        this.answers.push(answer);
        
        console.log(`Answer spawned: "${randomAnswerData.content}" at Y: ${yPosition}`);
        
        // Set next spawn delay
        if (this.answerSpawnTimer) {
            this.answerSpawnTimer.reset({
                delay: Phaser.Math.Between(3000, 5000),
                callback: this.spawnAnswer,
                callbackScope: this,
                loop: false
            });
        }
    }
    
    private setupCollisionDetection(): void {
        // Listen for answer collision events
        this.events.on('answer-collision', (data: { answer: Answer; isCorrect: boolean; content: string }) => {
            console.log(`Answer collision detected: "${data.content}", correct: ${data.isCorrect}`);
            
            if (data.isCorrect) {
                // Handle correct answer
                this.handleCorrectAnswer(data.answer);
            } else {
                // Handle wrong answer
                this.handleWrongAnswer(data.answer);
            }
            
            // Remove answer from tracking array
            const index = this.answers.indexOf(data.answer);
            if (index > -1) {
                this.answers.splice(index, 1);
            }
        });
    }
    
    private handleCorrectAnswer(answer: Answer): void {
        console.log('Correct answer selected!');
        // Add score, play success sound, show effect, etc.
        this.sound.play('hit_correct', { volume: 0.5 });
        
        // TODO: Add scoring logic, visual effects, etc.
    }
    
    private handleWrongAnswer(answer: Answer): void {
        console.log('Wrong answer selected!');
        // Reduce player health/lives, play error sound, show effect, etc.
        this.sound.play('shoot_laser', { volume: 0.3 }); // Using available sound as placeholder
        
        if (this.player) {
            // TODO: Reduce player lives or energy
            console.log('Player should lose health/energy for wrong answer');
        }
    }

    private createTitle(): void {
        const { width, height, centerX, centerY, minScale } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        // Create level title (only show level info)
        const titleText = this.selectedLevel ? 
            `LEVEL ${this.selectedLevel}` : 
            'LEVEL 1';
            
        this.titleText = this.add.text(centerX, height * 0.08, titleText, {
            fontSize: `${Math.max(24, 36 * minScale)}px`,
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#2d5aa0',
            strokeThickness: 3,
            align: 'center'
        });
        this.titleText.setOrigin(0.5);
        this.titleText.setShadow(2, 2, '#000000', 4, true, false);
        this.titleText.setDepth(100); // Ensure title is above parallax objects
    }

    private createBackButton(): void {
        const { width, height, minScale } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        const buttonSize = Math.max(40, 60 * minScale);
        const margin = Math.max(20, 30 * minScale);

        // Exit button positioned at top right corner (same size as main menu corner buttons)
        this.backButton = this.add.container(width - margin - buttonSize/2, margin + buttonSize/2);
        
        const exitIcon = this.add.image(0, 0, 'exit');
        exitIcon.setDisplaySize(buttonSize, buttonSize);
        exitIcon.setInteractive();
        
        this.backButton.add(exitIcon);
        this.backButton.setDepth(100); // Ensure button is above other elements
        
        // Store original scale for hover effects
        const originalScale = 1.0;
        
        // Add hover effects (same as main menu corner buttons)
        exitIcon.on('pointerover', () => {
            this.backButton.setScale(originalScale * 1.1);
            exitIcon.setTint(0xcccccc);
        });
        
        exitIcon.on('pointerout', () => {
            this.backButton.setScale(originalScale);
            exitIcon.clearTint();
        });
        
        exitIcon.on('pointerdown', () => {
            this.sound.play('shoot_laser');
            // Stop background music when exiting to main menu
            this.sound.stopAll();
            this.scene.start('MainMenu');
        });
    }

    private handleResize(): void {
        // Reposition UI elements on resize
        const { width, height, centerX, centerY, minScale } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        // Update physics world bounds to match new screen size
        this.physics.world.setBounds(0, 0, width, height);
        console.log(`Physics world bounds updated to: ${width}x${height} during resize`);
        
        // Update player's fixed X position for new screen size
        if (this.player) {
            this.player.updateForScreenResize();
        }
        
        // Update all active answers for new screen size
        this.answers.forEach(answer => {
            if (answer && answer.active) {
                answer.updateForScreenResize();
            }
        });
        
        // Update background position
        if (this.background) {
            this.background.setPosition(centerX, centerY);
            this.background.setDisplaySize(width, height);
        }
        
        // Update overlay position
        const overlays = this.children.list.filter(child => 
            (child as any).texture?.key === 'overlay'
        );
        overlays.forEach(overlay => {
            const overlayImage = overlay as Phaser.GameObjects.Image;
            overlayImage.setPosition(centerX, centerY);
            overlayImage.setDisplaySize(width, height);
        });
        
        // Update title position
        if (this.titleText) {
            this.titleText.setPosition(centerX, height * 0.08);
        }
        
        // Update back button position to top right corner
        if (this.backButton) {
            const buttonSize = Math.max(40, 60 * minScale);
            const margin = Math.max(20, 30 * minScale);
            this.backButton.setPosition(width - margin - buttonSize/2, margin + buttonSize/2);
        }
    }

    private cleanup(): void {
        if (this.languageChangeUnsubscribe) {
            this.languageChangeUnsubscribe();
            this.languageChangeUnsubscribe = undefined;
        }
        
        // Clean up bullets
        this.cleanupBullets();
        
        // Clean up answers
        this.cleanupAnswers();
        
        // Clean up answer spawner
        if (this.answerSpawnTimer) {
            this.answerSpawnTimer.destroy();
            this.answerSpawnTimer = undefined;
        }
        
        // Stop all audio when cleaning up the scene
        this.sound.stopAll();
    }

    override update(time: number, delta: number): void {
        // Update player if it exists
        if (this.player && this.player.active) {
            this.player.update(time, delta);
        }
        
        // Update all active answers
        this.answers.forEach(answer => {
            if (answer && answer.active) {
                answer.update(time, delta);
            }
        });
        
        // Check for collisions between player and answers
        this.checkPlayerAnswerCollisions();
        
        // Other game update logic can be added here later
    }
    
    private checkPlayerAnswerCollisions(): void {
        if (!this.player || !this.player.active) return;
        
        this.answers.forEach(answer => {
            if (answer && answer.active) {
                // Simple distance-based collision detection
                const distance = Phaser.Math.Distance.Between(
                    this.player.x, this.player.y,
                    answer.x, answer.y
                );
                
                // Collision threshold (adjust as needed)
                const collisionThreshold = 60;
                
                if (distance < collisionThreshold) {
                    answer.onPlayerCollision();
                }
            }
        });
    }
    
    // Utility method to get all active player bullets
    public getPlayerBullets(): Phaser.Physics.Arcade.Group {
        return this.playerBullets;
    }
    
    // Method to clean up bullets (useful for scene transitions)
    private cleanupBullets(): void {
        if (this.playerBullets && this.playerBullets.children) {
            this.playerBullets.clear(true, true);
        }
    }
    
    // Method to clean up answers (useful for scene transitions)
    private cleanupAnswers(): void {
        this.answers.forEach(answer => {
            if (answer && answer.active) {
                answer.destroy();
            }
        });
        this.answers = [];
    }
    
    // Example method for handling bullet-enemy collisions (to be implemented later)
    private handleBulletEnemyCollision(bullet: PlayerBullet, enemy: Phaser.GameObjects.GameObject): void {
        // This will be called when a bullet hits an enemy
        console.log('Bullet hit enemy!');
        
        // Explode the bullet
        bullet.explode();
        
        // Handle enemy damage/destruction here
        // enemy.takeDamage() or similar
        // Note: Bullets now travel horizontally from left to right
    }
}
