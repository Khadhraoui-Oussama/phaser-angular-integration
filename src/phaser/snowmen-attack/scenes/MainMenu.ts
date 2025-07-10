import Phaser from 'phaser';
import { languageManager } from '../utils/LanguageManager';

export default class MainMenu extends Phaser.Scene {
    private startText!: Phaser.GameObjects.Text;
    private languageButton!: Phaser.GameObjects.Text;
    private languageChangeUnsubscribe?: () => void;
    
    constructor() {
        super('MainMenu');
    }
    
    create(): void {
        this.sound.play('music', { loop: true, delay: 2 });

        this.add.shader('snow', 512, 384, 1024, 768);

        // Intro snowball fight
        const ball1 = this.add.image(-64, 300, 'sprites', 'snowball1');
        const ball2 = this.add.image(1088, 360, 'sprites', 'snowball1');
        const ball3 = this.add.image(-64, 320, 'sprites', 'snowball1');
        const logo = this.add.image(1700, 384, 'title');

        this.tweens.add({
            targets: ball1,
            x: 1088,
            y: 360,
            ease: 'cubic.out',
            duration: 600,
            onStart: () => {
                this.sound.play('throw');
            }
        });

        this.tweens.add({
            targets: ball2,
            x: -64,
            y: 280,
            ease: 'cubic.out',
            delay: 700,
            duration: 600,
            onStart: () => {
                this.sound.play('throw');
            }
        });

        this.tweens.add({
            targets: ball3,
            x: 1088,
            y: 380,
            ease: 'cubic.out',
            delay: 1200,
            duration: 600,
            onStart: () => {
                this.sound.play('throw');
            }
        });

        this.tweens.add({
            targets: logo,
            x: 512,
            ease: 'back.out',
            delay: 1800,
            duration: 600,
            onStart: () => {
                this.sound.play('throw');
            }
        });

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
        this.startText = this.add.text(
            this.scale.width / 2,
            this.scale.height - 100,
            languageManager.getText('main_menu_click_to_start'),
            {
                fontSize: '24px',
                fontFamily: 'Arial',
                color: '#ffffff',
                align: 'center'
            }
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
        const currentLang = languageManager.getCurrentLanguage().toUpperCase();
        
        this.languageButton = this.add.text(
            this.scale.width - 80,
            50,
            `🌐 ${currentLang}`,
            {
                fontSize: '20px',
                fontFamily: 'Arial',
                color: '#ffffff',
                backgroundColor: '#333333',
                padding: { x: 10, y: 5 }
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
