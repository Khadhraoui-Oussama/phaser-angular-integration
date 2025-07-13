import Phaser from 'phaser';
import { languageManager } from '../utils/LanguageManager';
import { ResponsiveUtils } from '../utils/ResponsiveUtils';

export default class MainMenu extends Phaser.Scene {
    private startText!: Phaser.GameObjects.Text;
    private languageButton!: Phaser.GameObjects.Text;
    private languageChangeUnsubscribe?: () => void;
    private logo!: Phaser.GameObjects.Image;
    
    constructor() {
        super('MainMenu');
    }
    
    create(): void {
        this.sound.play('music', { loop: true, delay: 2 });

        const { width, height, centerX, centerY } = ResponsiveUtils.getResponsiveDimensions(this);

        // Add responsive snow effect
        this.add.shader('snow', centerX, centerY, width, height);

        // Setup responsive input for mobile
        ResponsiveUtils.setupMobileInput(this);

        // Intro snowball fight - made responsive
        this.createResponsiveIntro();

        // Create start instruction text
        this.createStartText();
        
        // Create language selection button
        this.createLanguageButton();

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
        const { width, height, centerX, centerY, minScale } = ResponsiveUtils.getResponsiveDimensions(this);
        
        // Responsive positions for snowballs
        const ball1StartX = -64 * minScale;
        const ball2StartX = width + 64 * minScale;
        const ball3StartX = -64 * minScale;
        
        const ballY1 = height * 0.4;
        const ballY2 = height * 0.47;
        const ballY3 = height * 0.42;

        // Intro snowball fight
        const ball1 = this.add.image(ball1StartX, ballY1, 'sprites', 'snowball1');
        const ball2 = this.add.image(ball2StartX, ballY2, 'sprites', 'snowball1');
        const ball3 = this.add.image(ball3StartX, ballY3, 'sprites', 'snowball1');
        
        // Logo starts off-screen and slides in
        this.logo = this.add.image(width + 200, centerY, 'title');
        // Scale logo responsively
        const logoScale = Math.min(minScale * 0.8, (width * 0.6) / this.logo.width);
        this.logo.setScale(logoScale);

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
        const { width, height } = ResponsiveUtils.getResponsiveDimensions(this);
        const textStyle = ResponsiveUtils.getTextStyle(24, this);
        
        this.startText = this.add.text(
            width / 2,
            height - ResponsiveUtils.getSpacing(100, this),
            languageManager.getText('main_menu_click_to_start'),
            textStyle
        ).setOrigin(0.5);

        // Blinking effect
        this.tweens.add({
            targets: this.startText,
            alpha: 0.3,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inout'
        });
    }

    private createLanguageButton() {
        const { width } = ResponsiveUtils.getResponsiveDimensions(this);
        const currentLang = languageManager.getCurrentLanguage().toUpperCase();
        const buttonSize = ResponsiveUtils.getButtonSize(this);
        const spacing = ResponsiveUtils.getSpacing(50, this);
        
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
                    x: ResponsiveUtils.getResponsivePadding(10, this), 
                    y: ResponsiveUtils.getResponsivePadding(5, this) 
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
