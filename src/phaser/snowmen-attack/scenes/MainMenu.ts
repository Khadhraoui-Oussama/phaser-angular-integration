import Phaser from 'phaser';
import { languageManager } from '../utils/LanguageManager';
import { ResponsiveGameUtils } from '../utils/ResponsiveGameUtils';
import { SkinManager } from '../utils/SkinManager';

export default class MainMenu extends Phaser.Scene {
    private startText!: Phaser.GameObjects.Text;
    private languageButton!: Phaser.GameObjects.Text;
    private skinButton!: Phaser.GameObjects.Text;
    private languageChangeUnsubscribe?: () => void;
    private logo!: Phaser.GameObjects.Image;
    
    constructor() {
        super('MainMenu');
    }
    
    create(): void {
        this.sound.play('music', { loop: true, delay: 2 });

        const { width, height, centerX, centerY } = ResponsiveGameUtils.getResponsiveConfig(this);

        // Add responsive snow effect
        this.add.shader('snow', centerX, centerY, width, height);

        // Setup responsive input for mobile
        ResponsiveGameUtils.setupMobileInput(this);

        // Intro snowball fight - made responsive
        this.createResponsiveIntro();

        // Create start instruction text
        this.createStartText();
        
        // Create language selection button
        this.createLanguageButton();
        
        // Create skin selection button
        this.createSkinButton();

        // Subscribe to language changes
        this.languageChangeUnsubscribe = languageManager.onLanguageChange(() => {
            // Only update if this scene is active and manager exists
            if (this.scene && this.scene.manager && this.scene.isActive()) {
                this.updateTexts();
            }
        });

        // Set up input handlers
        this.setupInputHandlers();

        // Listen for scene resume events
        this.events.on('resume', () => {
            this.setupInputHandlers();
        });

        // Listen for scene shutdown to cleanup
        this.events.on('shutdown', () => {
            this.cleanup();
        });
    }

    private createResponsiveIntro() {
        const { width, height, centerX, centerY, minScale } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        // Responsive positions for snowballs
        const ball1StartX = -64 * minScale;
        const ball2StartX = width + 64 * minScale;
        const ball3StartX = -64 * minScale;
        
        const ballY1 = height * 0.4;
        const ballY2 = height * 0.47;
        const ballY3 = height * 0.42;

        // Intro snowball fight with responsive scaling
        const { config } = ResponsiveGameUtils.getResponsiveConfig(this);
        let snowballScale = 1.0; // Default desktop scale
        
        if (config.screenSize === 'mobile') {
            snowballScale = 0.45; // Smaller scale for mobile
        } else if (config.screenSize === 'tablet') {
            snowballScale = 0.7; // Fixed scale for tablet
        }
        
        const currentSkin = SkinManager.getCurrentSkin();
        const snowballTexture = SkinManager.getTextureKey('playerSnowball');
        const snowballFrame = currentSkin.type === 'atlas' ? 'snowball1' : undefined;
        
        const ball1 = this.add.image(ball1StartX, ballY1, snowballTexture, snowballFrame).setScale(snowballScale);
        const ball2 = this.add.image(ball2StartX, ballY2, snowballTexture, snowballFrame).setScale(snowballScale);
        const ball3 = this.add.image(ball3StartX, ballY3, snowballTexture, snowballFrame).setScale(snowballScale);
        
        // Logo starts completely off-screen to the right and slides in
        this.logo = this.add.image(width + 400, centerY, 'title'); // Increased offset to ensure completely hidden
        // Scale logo responsively
        const logoScale = Math.min(minScale * 0.8, (width * 0.6) / this.logo.width);
        this.logo.setScale(logoScale);
        
        // Ensure logo is completely off screen by accounting for its scaled width
        const logoScaledWidth = this.logo.width * logoScale;
        this.logo.x = width + logoScaledWidth;

        this.tweens.add({
            targets: ball1,
            x: ball2StartX,
            y: ballY2,
            ease: 'cubic.out',
            duration: 600,
            onStart: () => {
                this.sound.play('throw');
            }
        });

        this.tweens.add({
            targets: ball2,
            x: ball1StartX,
            y: ballY1 - 20,
            ease: 'cubic.out',
            delay: 700,
            duration: 600,
            onStart: () => {
                this.sound.play('throw');
            }
        });

        this.tweens.add({
            targets: ball3,
            x: ball2StartX,
            y: ballY2 + 20,
            ease: 'cubic.out',
            delay: 1200,
            duration: 600,
            onStart: () => {
                this.sound.play('throw');
            }
        });

        this.tweens.add({
            targets: this.logo,
            x: centerX,
            ease: 'back.out',
            delay: 1800,
            duration: 600,
            onStart: () => {
                this.sound.play('throw');
            }
        });
    }

    private setupInputHandlers() {
        // Clear any existing event listeners
        this.input.keyboard?.removeAllListeners();
        this.input.removeAllListeners();

        this.input.keyboard?.once('keydown-SPACE', () => {
            this.scene.start('TableSelectScene');
        }, this);

        this.input.once('pointerdown', (pointer: Phaser.Input.Pointer) => {
            // Check if the click was on the language button
            const bounds = this.languageButton.getBounds();
            if (Phaser.Geom.Rectangle.Contains(bounds, pointer.x, pointer.y)) {
                return; // Let the language button handle its own click
            }
            
            this.scene.start('TableSelectScene');
        });
    }

    private createStartText() {
        const { width, height } = ResponsiveGameUtils.getResponsiveConfig(this);
        const textStyle = ResponsiveGameUtils.getTextStyle(24, this);
        
        this.startText = this.add.text(
            width / 2,
            height - ResponsiveGameUtils.getSpacing(100, this),
            languageManager.getText('main_menu_click_to_start'),
            textStyle
        ).setOrigin(0.5);

        // Start completely hidden
        this.startText.setAlpha(0);

        // Fade in after the logo animation completes (delay: 1800 + duration: 600 = 2400ms)
        this.tweens.add({
            targets: this.startText,
            alpha: 1,
            duration: 500,
            delay: 2500, // Slightly after logo animation
            ease: 'power2.out',
            onComplete: () => {
                // Start blinking effect after fade in
                this.tweens.add({
                    targets: this.startText,
                    alpha: 0.3,
                    duration: 1000,
                    yoyo: true,
                    repeat: -1,
                    ease: 'sine.inout'
                });
            }
        });
    }

    private createLanguageButton() {
        const { width } = ResponsiveGameUtils.getResponsiveConfig(this);
        const currentLang = languageManager.getCurrentLanguage().toUpperCase();
        const buttonSize = ResponsiveGameUtils.getButtonSize(this);
        const spacing = ResponsiveGameUtils.getSpacing(50, this);
        
        this.languageButton = this.add.text(
            width - spacing,
            spacing,
            `🌐 ${currentLang}`,
            {
                fontSize: buttonSize.fontSize,
                fontFamily: 'Arial',
                color: '#ffffff',
                backgroundColor: '#333333',
                padding: { 
                    x: ResponsiveGameUtils.getResponsivePadding(10, this), 
                    y: ResponsiveGameUtils.getResponsivePadding(5, this) 
                }
            }
        ).setOrigin(0.5);

        this.languageButton.setInteractive({ useHandCursor: true });
        
        this.languageButton.on('pointerover', () => {
            this.languageButton.setStyle({ backgroundColor: '#555555' });
        });

        this.languageButton.on('pointerout', () => {
            this.languageButton.setStyle({ backgroundColor: '#333333' });
        });

        this.languageButton.on('pointerdown', () => {
            this.scene.launch('LanguageSelectionScene');
            this.scene.pause();
        });
    }
    
    private createSkinButton() {
        const { width } = ResponsiveGameUtils.getResponsiveConfig(this);
        const currentSkin = SkinManager.getCurrentSkin().name;
        const buttonSize = ResponsiveGameUtils.getButtonSize(this);
        const spacing = ResponsiveGameUtils.getSpacing(50, this);
        
        this.skinButton = this.add.text(
            spacing,  // Position on the left side
            spacing,
            `🎨 ${currentSkin}`,
            {
                fontSize: buttonSize.fontSize,
                fontFamily: 'Arial',
                color: '#ffffff',
                backgroundColor: '#4a90e2',
                padding: { 
                    x: ResponsiveGameUtils.getResponsivePadding(10, this), 
                    y: ResponsiveGameUtils.getResponsivePadding(5, this) 
                }
            }
        ).setOrigin(0.5);

        this.skinButton.setInteractive({ useHandCursor: true });
        
        this.skinButton.on('pointerover', () => {
            this.skinButton.setStyle({ backgroundColor: '#357abd' });
        });

        this.skinButton.on('pointerout', () => {
            this.skinButton.setStyle({ backgroundColor: '#4a90e2' });
        });

        this.skinButton.on('pointerdown', () => {
            this.scene.start('SkinSelection');
        });
    }

    private updateTexts() {
        // Only update if scene is active and text objects exist
        if (!this.scene || !this.scene.manager || !this.scene.isActive()) return;
        
        // Update text elements when language changes
        if (this.startText && this.startText.active) {
            this.startText.setText(languageManager.getText('main_menu_click_to_start'));
        }
        
        if (this.languageButton && this.languageButton.active) {
            const currentLang = languageManager.getCurrentLanguage().toUpperCase();
            this.languageButton.setText(`🌐 ${currentLang}`);
        }
        
        if (this.skinButton && this.skinButton.active) {
            const currentSkin = SkinManager.getCurrentSkin().name;
            this.skinButton.setText(`🎨 ${currentSkin}`);
        }
    }

    private cleanup() {
        if (this.languageChangeUnsubscribe) {
            this.languageChangeUnsubscribe();
            this.languageChangeUnsubscribe = undefined;
        }
    }

    destroy() {
        this.cleanup();
        // Note: Phaser scenes don't have a destroy method, cleanup happens automatically
    }
}
