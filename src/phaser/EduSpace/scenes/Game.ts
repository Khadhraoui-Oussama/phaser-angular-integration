import Phaser from 'phaser';
import { ResponsiveGameUtils } from '../utils/ResponsiveGameUtils';
import { languageManager } from '../utils/LanguageManager';
import { Player } from './Player';

export default class MainGame extends Phaser.Scene {
    private background!: Phaser.GameObjects.Image;
    private titleText!: Phaser.GameObjects.Text;
    private backButton!: Phaser.GameObjects.Container;
    private languageChangeUnsubscribe?: () => void;
    private selectedLevel?: number;
    private player!: Player;
    
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
        this.background = this.add.image(centerX, centerY, 'bg');
        this.background.setDisplaySize(width, height);
        
        // Add overlay on top of background (same as main menu)
        const overlay = this.add.image(centerX, centerY, 'overlay');
        overlay.setDisplaySize(width, height);
    }

    private createPlayer(): void {
        const { width, height } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        // Create player at fixed X position (width/4) and bottom area of screen
        this.player = new Player(this, width / 4, height * 0.8);
        
        // Listen for player events
        this.events.on('player-shoot', (data: { x: number; y: number; direction: { x: number; y: number } }) => {
            // Handle bullet creation here when PlayerBullet class is implemented
            console.log('Player shot at:', data.x, data.y, 'Direction:', data.direction);
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
        
        // Stop all audio when cleaning up the scene
        this.sound.stopAll();
    }

    override update(time: number, delta: number): void {
        // Update player if it exists
        if (this.player && this.player.active) {
            this.player.update(time, delta);
        }
        
        // Other game update logic can be added here later
    }
}
