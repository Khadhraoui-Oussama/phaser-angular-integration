import Phaser from 'phaser';
import { languageManager } from '../utils/LanguageManager';
import { ResponsiveGameUtils } from '../utils/ResponsiveGameUtils';
import { ParallaxManager } from '../utils/ParallaxManager';

export default class MainMenu extends Phaser.Scene {
    private titleText!: Phaser.GameObjects.Text;
    private playButton!: Phaser.GameObjects.Container;
    private selectLevelButton!: Phaser.GameObjects.Container;
    private quitButton!: Phaser.GameObjects.Container;
    private informationButton!: Phaser.GameObjects.Image;
    private settingsButton!: Phaser.GameObjects.Image;
    private languageButton!: Phaser.GameObjects.Container;
    private skinChangeButton!: Phaser.GameObjects.Image;
    private languageText!: Phaser.GameObjects.Text;
    private background!: Phaser.GameObjects.Image;
    private parallaxManager!: ParallaxManager;
    private languageChangeUnsubscribe?: () => void;
    
    constructor() {
        super('MainMenu');
    }
    
    create(): void {
        // Ensure no other scenes are running to prevent stacking
        this.scene.manager.scenes.forEach(scene => {
            if (scene.scene.key !== 'MainMenu' && scene.scene.isActive()) {
                scene.scene.stop();
            }
        });
        
        // Only play menu music if it's not already playing to prevent double playback
        if (!this.sound.get('menu_music') || !this.sound.get('menu_music').isPlaying) {
            this.sound.play('menu_music', { loop: true,volume:0.6});
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

        // Create main menu buttons
        this.createMainButtons();
        
        // Create corner buttons
        this.createCornerButtons();

        // Subscribe to language changes with scene validation
        this.languageChangeUnsubscribe = languageManager.onLanguageChangeWithSceneCheck(this, () => {
            this.updateTexts();
        });

        // Set up input handlers
        this.setupInputHandlers();

        // Listen for scene resume events
        this.events.on('resume', () => {
            this.setupInputHandlers();
            this.updateTexts(); // Update texts when resuming from language selection
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
        
        // Add background
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
        const { width, height, centerX, centerY, minScale } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        // Create EDUSPACE title
        this.titleText = this.add.text(centerX, height * 0.15, 'EDUSPACE', {
            fontSize: `${Math.max(32, 64 * minScale)}px`,
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#2d5aa0',
            strokeThickness: 4,
            align: 'center'
        });
        this.titleText.setOrigin(0.5);
        this.titleText.setShadow(2, 2, '#000000', 6, true, false);
        this.titleText.setDepth(100); // Ensure title is above parallax objects
    }

    private createMainButtons(): void {
        const { width, height, centerX, centerY, minScale } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        const buttonWidth = Math.max(200, 300 * minScale);
        const buttonHeight = Math.max(50, 70 * minScale);
        const buttonSpacing = Math.max(20, 30 * minScale);
        const fontSize = Math.max(18, 28 * minScale);

        // Play button
        this.playButton = this.createButton(
            centerX, 
            centerY - buttonSpacing, 
            buttonWidth, 
            buttonHeight, 
            languageManager.getText('main_menu_play'),
            fontSize,
            () => {
                // Stop menu music before starting the game
                this.sound.stopAll()
                this.sound.play('shoot_laser');

                this.scene.start('LanguageSelectionScene');
            }
        );

        // Select level button
        this.selectLevelButton = this.createButton(
            centerX, 
            centerY + buttonHeight + buttonSpacing, 
            buttonWidth, 
            buttonHeight, 
            languageManager.getText('main_menu_select_level'),
            fontSize,
            () => {
                // Stop menu music before going to level selection
                this.sound.stopAll()
                this.sound.play('shoot_laser');
                this.scene.start('LevelSelectScene');
            }
        );

        // Quit button
        this.quitButton = this.createButton(
            centerX, 
            centerY + (buttonHeight + buttonSpacing) * 2, 
            buttonWidth, 
            buttonHeight, 
            languageManager.getText('main_menu_quit'),
            fontSize,
            () => {
                // Stop menu music before quitting
                this.sound.stopAll()
                
                this.sound.play('shoot_laser');

                // Send message to Angular to handle quit
                this.game.events.emit('quit-game');
            }
        );
    }

    private createButton(x: number, y: number, width: number, height: number, text: string, fontSize: number, callback: () => void): Phaser.GameObjects.Container {
        const container = this.add.container(x, y);
        
        // Button background using the large UI element
        const buttonBg = this.add.image(0, 0, 'ui_element_large');
        buttonBg.setDisplaySize(width, height);
        
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
        
        // Set high depth to ensure buttons are above parallax objects
        container.setDepth(100);
        
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

    private createCornerButtons(): void {
        const { width, height, minScale } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        const buttonSize = Math.max(40, 60 * minScale);
        const margin = Math.max(20, 30 * minScale);

        // Information button (top-left)
        this.informationButton = this.add.image(margin + buttonSize/2, margin + buttonSize/2, 'information');
        this.informationButton.setDisplaySize(buttonSize, buttonSize);
        this.informationButton.setInteractive();
        this.informationButton.setDepth(100); // Above parallax objects
        this.setupCornerButtonEffects(this.informationButton, () => {
            this.sound.play('shoot_laser');
            // Show information popup or navigate to info scene
            console.log('Information button clicked');
        });

        // Settings button (top-right)
        this.settingsButton = this.add.image(width - margin - buttonSize/2, margin + buttonSize/2, 'settings');
        this.settingsButton.setDisplaySize(buttonSize, buttonSize);
        this.settingsButton.setInteractive();
        this.settingsButton.setDepth(100); // Above parallax objects
        this.setupCornerButtonEffects(this.settingsButton, () => {
            this.sound.play('shoot_laser');
            // Open settings menu
            console.log('Settings button clicked');
        });

        // Language selection button (bottom-left)
        this.languageButton = this.add.container(margin + buttonSize/2, height - margin - buttonSize/2);
        
        const langButtonBg = this.add.image(0, 0, 'ui_element_small');
        langButtonBg.setDisplaySize(buttonSize, buttonSize);
        
        this.languageText = this.add.text(0, 0, languageManager.getCurrentLanguage().toUpperCase(), {
            fontSize: `${Math.max(12, 18 * minScale)}px`,
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#2d5aa0',
            strokeThickness: 2,
            align: 'center'
        });
        this.languageText.setOrigin(0.5);
        
        this.languageButton.add([langButtonBg, this.languageText]);
        this.languageButton.setSize(buttonSize, buttonSize);
        this.languageButton.setInteractive(new Phaser.Geom.Rectangle(-buttonSize/2, -buttonSize/2, buttonSize, buttonSize), Phaser.Geom.Rectangle.Contains);
        this.languageButton.setDepth(100); // Above parallax objects
        
        this.setupCornerButtonEffects(this.languageButton, () => {
            this.sound.play('shoot_laser');
            this.scene.pause();
            this.scene.launch('LanguageSelectionScene');
        });

        // Skin change button (bottom-right)
        this.skinChangeButton = this.add.image(width - margin - buttonSize/2, height - margin - buttonSize/2, 'skin_change');
        this.skinChangeButton.setDisplaySize(buttonSize, buttonSize);
        this.skinChangeButton.setInteractive();
        this.skinChangeButton.setDepth(100); // Above parallax objects
        this.setupCornerButtonEffects(this.skinChangeButton, () => {
            this.sound.play('shoot_laser');
            this.scene.start('SkinSelection');
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

    private setupInputHandlers(): void {
        // Set up keyboard handlers
        if (this.input.keyboard) {
            const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
            const enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
            
            spaceKey.on('down', () => {
                this.sound.play('shoot_laser');
                // Stop menu music before starting the game
                if (this.sound.get('menu_music')) {
                    this.sound.get('menu_music').stop();
                }
                this.scene.start('LanguageSelectionScene');
            });
            
            enterKey.on('down', () => {
                this.sound.play('shoot_laser');
                // Stop menu music before starting the game
                if (this.sound.get('menu_music')) {
                    this.sound.get('menu_music').stop();
                }
                this.scene.start('LanguageSelectionScene');
            });
        }

        // Handle global clicks
        this.input.on('pointerdown', () => {
            if (this.sound.locked) {
                this.sound.unlock();
            }
        });
    }

    private updateTexts(): void {
        // Update button texts based on current language
        if (this.playButton && this.playButton.list && this.playButton.list.length > 1) {
            const playText = this.playButton.list[1] as Phaser.GameObjects.Text;
            if (playText && playText.setText) {
                playText.setText(languageManager.getText('main_menu_play'));
            }
        }
        
        if (this.selectLevelButton && this.selectLevelButton.list && this.selectLevelButton.list.length > 1) {
            const selectText = this.selectLevelButton.list[1] as Phaser.GameObjects.Text;
            if (selectText && selectText.setText) {
                selectText.setText(languageManager.getText('main_menu_select_level'));
            }
        }
        
        if (this.quitButton && this.quitButton.list && this.quitButton.list.length > 1) {
            const quitText = this.quitButton.list[1] as Phaser.GameObjects.Text;
            if (quitText && quitText.setText) {
                quitText.setText(languageManager.getText('main_menu_quit'));
            }
        }
        
        if (this.languageText && this.languageText.setText) {
            this.languageText.setText(languageManager.getCurrentLanguage().toUpperCase());
        }
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
        
        // Stop menu music when leaving the main menu
        if (this.sound.get('menu_music')) {
            this.sound.get('menu_music').stop();
        }
    }

    private stopAllMusic(): void {
        // Stop any existing music to prevent conflicts
        const musicKeys = ['music', 'menu_music'];
        musicKeys.forEach(key => {
            if (this.sound.get(key)) {
                this.sound.get(key).stop();
            }
        });
    }
}
