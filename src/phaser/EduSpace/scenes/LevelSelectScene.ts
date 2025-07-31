import Phaser from 'phaser';
import { languageManager } from '../utils/LanguageManager';
import { ResponsiveGameUtils } from '../utils/ResponsiveGameUtils';
import { ParallaxManager } from '../utils/ParallaxManager';
import { LevelProgress } from './Boot';

export default class LevelSelectScene extends Phaser.Scene {
    private titleText!: Phaser.GameObjects.Text;
    private levelButtons: Phaser.GameObjects.Container[] = [];
    private backButton!: Phaser.GameObjects.Container;
    private background!: Phaser.GameObjects.Image;
    private parallaxManager!: ParallaxManager;
    private languageChangeUnsubscribe?: () => void;
    private levelProgress!: LevelProgress;

    constructor() {
        super('LevelSelectScene');
    }

    create(): void {
        // Ensure no other scenes are running to prevent stacking
        this.scene.manager.scenes.forEach(scene => {
            if (scene.scene.key !== 'LevelSelectScene' && scene.scene.isActive()) {
                scene.scene.stop();
            }
        });

        // Load level progress from registry/localStorage
        this.loadLevelProgress();

        // Continue playing menu music if available
        if (!this.sound.get('menu_music') || !this.sound.get('menu_music').isPlaying) {
            this.sound.play('menu_music', { loop: true, volume: 0.6 });
        }

        const { width, height, centerX, centerY } = ResponsiveGameUtils.getResponsiveConfig(this);

        // Setup responsive input for mobile
        ResponsiveGameUtils.setupMobileInput(this);

        // Create background
        this.createBackground();

        // Create parallax effect
        this.createParallaxEffect();

        // Create title
        this.createTitle();

        // Create level buttons
        this.createLevelButtons();

        // Create back button
        this.createBackButton();

        // Subscribe to language changes
        this.languageChangeUnsubscribe = languageManager.onLanguageChange(() => {
            if (this.scene && this.scene.manager && this.scene.isActive()) {
                this.updateTexts();
            }
        });

        // Listen for scene shutdown to cleanup
        this.events.on('shutdown', () => {
            this.cleanup();
        });
    }

    private createBackground(): void {
        const { width, height, centerX, centerY } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        // Create the same background as the main menu
        this.background = this.add.image(centerX, centerY, 'bg');
        this.background.setDisplaySize(width, height);
        
        // Add overlay on top of background
        const overlay = this.add.image(centerX, centerY, 'overlay');
        overlay.setDisplaySize(width, height);
        overlay.setDepth(10); // Above background but below parallax objects
    }

    private createParallaxEffect(): void {
        // Create parallax manager with depth range behind UI elements
        this.parallaxManager = new ParallaxManager(this);
        // Set depth range to be well behind UI elements (UI is at depth 100)
        this.parallaxManager.setDepthRange(1, 50);
    }

    private createTitle(): void {
        const { centerX, centerY, minScale } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        const titleFontSize = Math.max(24, 36 * minScale);
        const titleY = centerY - Math.max(200, 280 * minScale);
        
        this.titleText = this.add.text(centerX, titleY, languageManager.getText('main_menu_select_level'), {
            fontSize: `${titleFontSize}px`,
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#2d5aa0',
            strokeThickness: 3,
            align: 'center'
        });
        this.titleText.setOrigin(0.5);
        this.titleText.setDepth(100); // Ensure title is above parallax objects
    }

    private createLevelButtons(): void {
        const { width, height, centerX, centerY, minScale } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        // Check if it's mobile for smaller buttons
        const isMobile = ResponsiveGameUtils.isMobile(this);
        const mobileScale = isMobile ? 0.7 : 1.0; // 70% size for mobile
        
        const buttonWidth = Math.max(180, 250 * minScale * mobileScale);
        const buttonHeight = Math.max(60, 80 * minScale * mobileScale);
        const fontSize = Math.max(20, 32 * minScale * mobileScale);
        
        // Grid layout: 2 columns, 3 rows
        const columns = 2;
        const rows = 3;
        const horizontalSpacing = Math.max(40, 60 * minScale * mobileScale);
        const verticalSpacing = Math.max(30, 50 * minScale * mobileScale);
        
        // Calculate grid dimensions
        const totalGridWidth = columns * buttonWidth + (columns - 1) * horizontalSpacing;
        const totalGridHeight = rows * buttonHeight + (rows - 1) * verticalSpacing;
        
        // Center the grid
        const gridStartX = centerX - totalGridWidth / 2 + buttonWidth / 2;
        const gridStartY = centerY - totalGridHeight / 2;
        
        // Create 6 level buttons
        for (let level = 1; level <= 6; level++) {
            const col = (level - 1) % columns;
            const row = Math.floor((level - 1) / columns);
            
            const x = gridStartX + col * (buttonWidth + horizontalSpacing);
            const y = gridStartY + row * (buttonHeight + verticalSpacing);
            
            const levelButton = this.createLevelButton(
                x, y, 
                buttonWidth, buttonHeight, 
                `${languageManager.getText('level')} ${level}`, 
                fontSize, 
                level
            );
            
            this.levelButtons.push(levelButton);
        }
    }

    private createLevelButton(x: number, y: number, width: number, height: number, text: string, fontSize: number, level: number): Phaser.GameObjects.Container {
        const container = this.add.container(x, y);
        
        // Check if it's mobile for smaller UI elements
        const isMobile = ResponsiveGameUtils.isMobile(this);
        const mobileScale = isMobile ? 0.7 : 1.0; // 70% size for mobile
        
        // Check if level is unlocked
        const isUnlocked = this.levelProgress[level]?.unlocked || false;
        
        // Button background using the large UI element
        const buttonBg = this.add.image(0, 0, 'ui_element_large');
        buttonBg.setDisplaySize(width, height);
        
        // Apply additional scale to the button background for mobile
        if (isMobile) {
            buttonBg.setScale(0.5);
        }
        
        // Apply visual effects based on unlock status
        if (isUnlocked) {
            // Make the button background interactive for unlocked levels
            buttonBg.setInteractive();
            
            // Add hover effects for unlocked buttons
            buttonBg.on('pointerover', () => {
                container.setScale(1.05);
                buttonBg.setTint(0xcccccc);
            });
            
            buttonBg.on('pointerout', () => {
                container.setScale(1.0);
                buttonBg.clearTint();
            });
            
            buttonBg.on('pointerdown', () => {
                
                // Stop menu music before starting the level
                if (this.sound.get('menu_music')) {
                    this.sound.get('menu_music').stop();
                }
                
                // Start the game with the selected level
                this.sound.stopAll()
                this.sound.play('shoot_laser');
                this.scene.start('MainGame', { selectedLevel: level });
            });
        } else {
            // Locked level - apply darker tint and no interaction
            buttonBg.setTint(0x666666); // Dark gray tint for locked levels
            buttonBg.setAlpha(0.6); // Make it semi-transparent
        }
        
        // Button text
        const buttonText = this.add.text(0, 0, isUnlocked ? text : '🔒', {
            fontSize: `${fontSize}px`,
            fontFamily: 'Arial',
            color: isUnlocked ? '#ffffff' : '#999999',
            stroke: isUnlocked ? '#2d5aa0' : '#444444',
            strokeThickness: 2,
            align: 'center'
        });
        buttonText.setOrigin(0.5);
        
        container.add([buttonBg, buttonText]);
        
        // Set high depth to ensure buttons are above parallax objects
        container.setDepth(100);
        
        return container;
    }

    private createBackButton(): void {
        const { width, height, minScale } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        const buttonSize = Math.max(40, 60 * minScale);
        const margin = Math.max(20, 30 * minScale);
        
        // Position exit button in top-right corner
        this.backButton = this.add.container(width - margin - buttonSize/2, margin + buttonSize/2);
        
        // Create exit button using exit.svg
        const exitButton = this.add.image(0, 0, 'exit');
        exitButton.setDisplaySize(buttonSize, buttonSize);
        exitButton.setInteractive();
        
        this.backButton.add(exitButton);
        this.backButton.setDepth(100); // Above parallax objects
        
        // Apply the same hover effects as corner buttons in MainMenu
        this.setupCornerButtonEffects(exitButton, () => {
            this.sound.stopAll()
            this.sound.play('shoot_laser');
            this.scene.start('MainMenu');
        });
    }

    private setupCornerButtonEffects(button: Phaser.GameObjects.GameObject, callback: () => void): void {
        let originalScaleX = (button as any).scaleX;
        let originalScaleY = (button as any).scaleY;
        
        button.on('pointerover', () => {
            (button as any).setScale(originalScaleX * 1.1, originalScaleY * 1.1);
            if ((button as any).setTint) {
                (button as any).setTint(0xcccccc);
            }
        });
        
        button.on('pointerout', () => {
            (button as any).setScale(originalScaleX, originalScaleY);
            if ((button as any).clearTint) {
                (button as any).clearTint();
            }
        });
        
        button.on('pointerdown', () => {
            // Reset scale and tint before executing callback
            (button as any).setScale(originalScaleX, originalScaleY);
            if ((button as any).clearTint) {
                (button as any).clearTint();
            }
            callback();
        });
    }

    private updateTexts(): void {
        if (this.titleText) {
            this.titleText.setText(languageManager.getText('main_menu_select_level'));
        }
        
        // Update level button texts
        this.levelButtons.forEach((button, index) => {
            const level = index + 1;
            const textObject = button.list[1] as Phaser.GameObjects.Text;
            if (textObject) {
                const isUnlocked = this.levelProgress[level]?.unlocked || false;
                const buttonText = isUnlocked ? `${languageManager.getText('level')} ${level}` : '🔒';
                textObject.setText(buttonText);
            }
        });
        
        // Note: Back button is now an image button (exit.svg) and doesn't need text updates
    }

    override update(): void {
        if (this.parallaxManager) {
            this.parallaxManager.update();
        }
    }

    private cleanup(): void {
        if (this.languageChangeUnsubscribe) {
            this.languageChangeUnsubscribe();
            this.languageChangeUnsubscribe = undefined;
        }
        
        if (this.parallaxManager) {
            this.parallaxManager.destroy();
        }
    }

    private loadLevelProgress(): void {
        // Get level progress from registry (set in Boot scene)
        this.levelProgress = this.registry.get('levelProgress') as LevelProgress;
        
        // If not found in registry, try localStorage as fallback
        if (!this.levelProgress) {
            const storedProgress = localStorage.getItem('levelProgress');
            if (storedProgress) {
                try {
                    this.levelProgress = JSON.parse(storedProgress);
                } catch (error) {
                    console.error('Error parsing level progress:', error);
                    // Create default progress if parsing fails
                    this.levelProgress = this.createDefaultProgress();
                }
            } else {
                this.levelProgress = this.createDefaultProgress();
            }
        }
    }

    private createDefaultProgress(): LevelProgress {
        const defaultProgress: LevelProgress = {};
        
        // Initialize 6 levels - only first level unlocked
        for (let i = 1; i <= 6; i++) {
            defaultProgress[i] = {
                unlocked: i === 1, // Only level 1 is unlocked by default
                completed: false,
                highScore: 0
            };
        }
        
        return defaultProgress;
    }

    // Static method to unlock a level - can be called from other scenes
    static unlockLevel(scene: Phaser.Scene, level: number, score?: number): void {
        const levelProgress = scene.registry.get('levelProgress') as LevelProgress;
        
        if (levelProgress) {
            // Unlock the current level
            if (levelProgress[level]) {
                levelProgress[level].completed = true;
                if (score !== undefined && (levelProgress[level].highScore || 0) < score) {
                    levelProgress[level].highScore = score;
                }
            }
            
            // Unlock the next level
            const nextLevel = level + 1;
            if (levelProgress[nextLevel]) {
                levelProgress[nextLevel].unlocked = true;
            }
            
            // Update registry and localStorage
            scene.registry.set('levelProgress', levelProgress);
            localStorage.setItem('levelProgress', JSON.stringify(levelProgress));
        }
    }

    // Method to refresh level buttons after progress changes
    public refreshLevelButtons(): void {
        // Reload progress
        this.loadLevelProgress();
        
        // Update button states
        this.levelButtons.forEach((button, index) => {
            const level = index + 1;
            const isUnlocked = this.levelProgress[level]?.unlocked || false;
            
            const buttonBg = button.list[0] as Phaser.GameObjects.Image;
            const buttonText = button.list[1] as Phaser.GameObjects.Text;
            
            if (isUnlocked) {
                // Unlock visual state
                buttonBg.clearTint();
                buttonBg.setAlpha(1);
                buttonBg.setInteractive();
                buttonText.setStyle({ 
                    color: '#ffffff', 
                    stroke: '#2d5aa0' 
                });
                buttonText.setText(`${languageManager.getText('level')} ${level}`);
            } else {
                // Lock visual state
                buttonBg.setTint(0x666666);
                buttonBg.setAlpha(0.6);
                buttonBg.removeInteractive();
                buttonText.setStyle({ 
                    color: '#999999', 
                    stroke: '#444444' 
                });
                buttonText.setText('🔒');
            }
        });
    }
}
