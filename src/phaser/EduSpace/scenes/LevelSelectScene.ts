import Phaser from 'phaser';
import { languageManager } from '../utils/LanguageManager';
import { ResponsiveGameUtils } from '../utils/ResponsiveGameUtils';

export default class LevelSelectScene extends Phaser.Scene {
    private titleText!: Phaser.GameObjects.Text;
    private levelButtons: Phaser.GameObjects.Container[] = [];
    private backButton!: Phaser.GameObjects.Container;
    private background!: Phaser.GameObjects.Image;
    private languageChangeUnsubscribe?: () => void;

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

        // Continue playing menu music if available
        if (!this.sound.get('menu_music') || !this.sound.get('menu_music').isPlaying) {
            this.sound.play('menu_music', { loop: true, volume: 0.6 });
        }

        const { width, height, centerX, centerY } = ResponsiveGameUtils.getResponsiveConfig(this);

        // Setup responsive input for mobile
        ResponsiveGameUtils.setupMobileInput(this);

        // Create background
        this.createBackground();

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
        
        // Button background using the large UI element
        const buttonBg = this.add.image(0, 0, 'ui_element_large');
        buttonBg.setDisplaySize(width, height);
        
        // Apply additional scale to the button background for mobile
        if (isMobile) {
            buttonBg.setScale(0.5);
        }
        
        // Make the button background interactive instead of the container
        buttonBg.setInteractive();
        
        // Button text
        const buttonText = this.add.text(0, 0, text, {
            fontSize: `${fontSize}px`,
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#2d5aa0',
            strokeThickness: 2,
            align: 'center'
        });
        buttonText.setOrigin(0.5);
        
        container.add([buttonBg, buttonText]);
        
        // Add hover effects to the button background
        buttonBg.on('pointerover', () => {
            container.setScale(1.05);
            buttonBg.setTint(0xcccccc);
        });
        
        buttonBg.on('pointerout', () => {
            container.setScale(1.0);
            buttonBg.clearTint();
        });
        
        buttonBg.on('pointerdown', () => {
            this.sound.play('shoot_laser');
            // Stop menu music before starting the level
            if (this.sound.get('menu_music')) {
                this.sound.get('menu_music').stop();
            }
            
            // Start the game with the selected level
            this.scene.start('LanguageSelectionScene', { selectedLevel: level });
        });
        
        return container;
    }

    private createBackButton(): void {
        const { width, height, centerX, centerY, minScale } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        // Check if it's mobile for smaller buttons
        const isMobile = ResponsiveGameUtils.isMobile(this);
        const mobileScale = isMobile ? 0.7 : 1.0; // 70% size for mobile
        
        const buttonWidth = Math.max(150, 200 * minScale * mobileScale);
        const buttonHeight = Math.max(50, 60 * minScale * mobileScale);
        const fontSize = Math.max(18, 24 * minScale * mobileScale);
        
        // Position button at bottom of screen for mobile, standard position for desktop/tablet
        const buttonY = isMobile ? height - Math.max(30, 40 * minScale) : height - Math.max(80, 100 * minScale);
        
        this.backButton = this.createButton(
            centerX, 
            buttonY, 
            buttonWidth, 
            buttonHeight, 
            languageManager.getText('back'),
            fontSize,
            () => {
                this.sound.play('shoot_laser');
                this.scene.start('MainMenu');
            }
        );
    }

    private createButton(x: number, y: number, width: number, height: number, text: string, fontSize: number, callback: () => void): Phaser.GameObjects.Container {
        const container = this.add.container(x, y);
        
        // Check if it's mobile for smaller UI elements
        const isMobile = ResponsiveGameUtils.isMobile(this);
        const mobileScale = isMobile ? 0.5 : 1.0; // 70% size for mobile
        
        // Button background using the large UI element
        const buttonBg = this.add.image(0, 0, 'ui_element_large');
        buttonBg.setDisplaySize(width, height);
        
        // Apply additional scale to the button background for mobile
        if (isMobile) {
            buttonBg.setScale(mobileScale);
        }
        
        // Make the button background interactive instead of the container
        buttonBg.setInteractive();
        
        // Button text
        const buttonText = this.add.text(0, 0, text, {
            fontSize: `${fontSize}px`,
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#2d5aa0',
            strokeThickness: 2,
            align: 'center'
        });
        buttonText.setOrigin(0.5);
        
        container.add([buttonBg, buttonText]);
        
        // Add hover effects to the button background
        buttonBg.on('pointerover', () => {
            container.setScale(1.05);
            buttonBg.setTint(0xcccccc);
        });
        
        buttonBg.on('pointerout', () => {
            container.setScale(1.0);
            buttonBg.clearTint();
        });
        
        buttonBg.on('pointerdown', callback);
        
        return container;
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
                textObject.setText(`${languageManager.getText('level')} ${level}`);
            }
        });
        
        // Update back button text
        if (this.backButton) {
            const textObject = this.backButton.list[1] as Phaser.GameObjects.Text;
            if (textObject) {
                textObject.setText(languageManager.getText('back'));
            }
        }
    }

    private cleanup(): void {
        if (this.languageChangeUnsubscribe) {
            this.languageChangeUnsubscribe();
            this.languageChangeUnsubscribe = undefined;
        }
    }
}
