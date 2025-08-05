import Phaser from 'phaser';
import { languageManager } from '../utils/LanguageManager';
import { ResponsiveGameUtils } from '../utils/ResponsiveGameUtils';

export default class Settings extends Phaser.Scene {
    private settingsContainer!: Phaser.GameObjects.Container;
    private backgroundOverlay!: Phaser.GameObjects.Graphics;
    private titleText!: Phaser.GameObjects.Text;
    private volumeSlider!: Phaser.GameObjects.Container;
    private volumeTrack!: Phaser.GameObjects.Graphics;
    private volumeKnob!: Phaser.GameObjects.Graphics;
    private volumeText!: Phaser.GameObjects.Text;
    private volumeValueText!: Phaser.GameObjects.Text;
    private skinSelectionButton!: Phaser.GameObjects.Container;
    private quitLevelButton!: Phaser.GameObjects.Container;
    private closeButton!: Phaser.GameObjects.Container;
    
    private currentVolume: number = 1.0; // 0.0 to 1.0
    private isDraggingSlider: boolean = false;
    private showQuitLevel: boolean = false;
    private callingScene?: string;
    
    private languageChangeUnsubscribe?: () => void;
    
    constructor() {
        super('Settings');
    }
    
    init(data: { showQuitLevel?: boolean; callingScene?: string }): void {
        this.showQuitLevel = data.showQuitLevel || false;
        this.callingScene = data.callingScene;
        
        // Get current volume from game registry or use default
        this.currentVolume = this.registry.get('gameVolume') || 1.0;
    }
    
    create(): void {
        const { width, height, centerX, centerY } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        // Create semi-transparent background overlay
        this.backgroundOverlay = this.add.graphics();
        this.backgroundOverlay.fillStyle(0x000000, 0.7);
        this.backgroundOverlay.fillRect(0, 0, width, height);
        this.backgroundOverlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);
        this.backgroundOverlay.setDepth(1000);
        
        // Prevent clicks from going through to the scene behind
        this.backgroundOverlay.on('pointerdown', () => {});
        
        
        this.createSettingsContainer();
        
        // Create all UI elements for the settings container
        this.createTitle();
        this.createVolumeSlider();
        this.createSkinSelectionButton();
        
        if (this.showQuitLevel) {
            this.createQuitLevelButton();
        }
        
        this.createCloseButton();
        
        // Subscribe to language changes
        this.languageChangeUnsubscribe = languageManager.onLanguageChangeWithSceneCheck(this, () => {
            this.updateTexts();
        });
        
        // Set up resize handling
        this.scale.on('resize', this.handleResize, this);
        
        // Listen for scene shutdown to cleanup
        this.events.on('shutdown', () => {
            this.cleanup();
        });
        
        // Listen for scene destroy to cleanup
        this.events.on('destroy', () => {
            this.cleanup();
        });
        
        this.animateEntrance();
    }
    
    private createSettingsContainer(): void {
        const { width, height, centerX, centerY, config } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        this.settingsContainer = this.add.container(centerX, centerY);
        this.settingsContainer.setDepth(1001);
        
        // Use dynamic scaling with maximum limit to prevent oversized modals in fullscreen
        const baseScale = Math.max(width / 400, height / 300) * 0.7;
        const bgScale = Math.min(baseScale, 2.0); // Cap at 2x scale to prevent oversizing
        const panelBackground = this.add.image(0, 0, 'ui_element_small');
        panelBackground.setScale(bgScale);
        panelBackground.setTint(0x2a2a2a); // Dark theme
        panelBackground.setAlpha(0.95); // Slightly transparent like game over modal
        
        this.settingsContainer.add(panelBackground);
    }
    
    private createTitle(): void {
        const titleText = languageManager.getText('settings_title');
        this.titleText = this.add.text(0, -180, titleText, {
            fontSize: ResponsiveGameUtils.getResponsiveFontSize(32, this),
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center'
        });
        this.titleText.setOrigin(0.5);
        this.titleText.setShadow(2, 2, '#000000', 4, true, false);
        
        this.settingsContainer.add(this.titleText);
    }
    
    private createVolumeSlider(): void {
        const { config } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        // Volume label
        this.volumeText = this.add.text(0, -120, languageManager.getText('settings_volume'), {
            fontSize: ResponsiveGameUtils.getResponsiveFontSize(24, this),
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center'
        });
        this.volumeText.setOrigin(0.5);
        this.volumeText.setShadow(1, 1, '#000000', 2, true, false);
        
        // Volume slider container
        this.volumeSlider = this.add.container(0, -80);
        
        const sliderWidth = 200 * config.uiScale;
        const sliderHeight = 20 * config.uiScale;
        
        // Slider track
        this.volumeTrack = this.add.graphics();
        this.volumeTrack.fillStyle(0x444444);
        this.volumeTrack.fillRoundedRect(-sliderWidth / 2, -sliderHeight / 2, sliderWidth, sliderHeight, sliderHeight / 2);
        this.volumeTrack.lineStyle(2, 0x666666);
        this.volumeTrack.strokeRoundedRect(-sliderWidth / 2, -sliderHeight / 2, sliderWidth, sliderHeight, sliderHeight / 2);
        
        // Volume fill (shows current volume level)
        const volumeFill = this.add.graphics();
        const fillWidth = sliderWidth * this.currentVolume;
        volumeFill.fillStyle(0x00ff00);
        volumeFill.fillRoundedRect(-sliderWidth / 2, -sliderHeight / 2, fillWidth, sliderHeight, sliderHeight / 2);
        
        // Slider knob
        const knobSize = 30 * config.uiScale;
        const knobX = -sliderWidth / 2 + (sliderWidth * this.currentVolume);
        this.volumeKnob = this.add.graphics();
        this.volumeKnob.fillStyle(0xffffff);
        this.volumeKnob.fillCircle(knobX, 0, knobSize / 2);
        this.volumeKnob.lineStyle(2, 0x888888);
        this.volumeKnob.strokeCircle(knobX, 0, knobSize / 2);
        
        this.volumeSlider.add([this.volumeTrack, volumeFill, this.volumeKnob]);
        
        // Volume percentage text
        this.volumeValueText = this.add.text(0, -50, `${Math.round(this.currentVolume * 100)}%`, {
            fontSize: ResponsiveGameUtils.getResponsiveFontSize(18, this),
            fontFamily: 'Arial',
            color: '#cccccc',
            align: 'center'
        });
        this.volumeValueText.setOrigin(0.5);
        
        // Make slider interactive
        this.setupVolumeSliderInteraction(sliderWidth);
        
        this.settingsContainer.add([this.volumeText, this.volumeSlider, this.volumeValueText]);
    }
    
    private setupVolumeSliderInteraction(sliderWidth: number): void {
        // Create invisible interactive area over the slider
        const interactiveZone = this.add.zone(0, 0, sliderWidth + 60, 60);
        interactiveZone.setInteractive();
        
        interactiveZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.isDraggingSlider = true;
            this.updateVolumeFromPointer(pointer, sliderWidth);
        });
        
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.isDraggingSlider) {
                this.updateVolumeFromPointer(pointer, sliderWidth);
            }
        });
        
        this.input.on('pointerup', () => {
            this.isDraggingSlider = false;
        });
        
        this.volumeSlider.add(interactiveZone);
    }
    
    private updateVolumeFromPointer(pointer: Phaser.Input.Pointer, sliderWidth: number): void {
        // Convert pointer position to slider position
        const localPoint = this.volumeSlider.getLocalPoint(pointer.x, pointer.y);
        const normalizedX = (localPoint.x + sliderWidth / 2) / sliderWidth;
        
        // Clamp between 0 and 1
        this.currentVolume = Math.max(0, Math.min(1, normalizedX));
        
        // Update visual elements
        this.updateVolumeVisuals(sliderWidth);
        
        // Apply volume to all sounds
        this.applyVolumeToGame();
    }
    
    private updateVolumeVisuals(sliderWidth: number): void {
        const { config } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        // Update knob position
        const knobX = -sliderWidth / 2 + (sliderWidth * this.currentVolume);
        this.volumeKnob.clear();
        this.volumeKnob.fillStyle(0xffffff);
        this.volumeKnob.fillCircle(knobX, 0, 15 * config.uiScale);
        this.volumeKnob.lineStyle(2, 0x888888);
        this.volumeKnob.strokeCircle(knobX, 0, 15 * config.uiScale);
        
        // Update volume fill
        const volumeFill = this.volumeSlider.list[1] as Phaser.GameObjects.Graphics;
        volumeFill.clear();
        const fillWidth = sliderWidth * this.currentVolume;
        volumeFill.fillStyle(0x00ff00);
        volumeFill.fillRoundedRect(-sliderWidth / 2, -10 * config.uiScale, fillWidth, 20 * config.uiScale, 10 * config.uiScale);
        
        // Update percentage text
        this.volumeValueText.setText(`${Math.round(this.currentVolume * 100)}%`);
    }
    
    private applyVolumeToGame(): void {
        // Save volume to registry
        this.registry.set('gameVolume', this.currentVolume);
        
        // Apply to all sound instances
        this.sound.setVolume(this.currentVolume);
        
        // Save to localStorage for persistence
        localStorage.setItem('gameVolume', this.currentVolume.toString());
    }
    
    private createSkinSelectionButton(): void {
        const yPos = this.showQuitLevel ? 20 : 40;
        
        this.skinSelectionButton = this.createButton(
            0,
            yPos,
            languageManager.getText('settings_skin_selection'),
            () => {
                this.sound.play('shoot_laser', { volume: 0.5 });
                console.log('Skin selection clicked - feature not implemented yet');
                // TODO: Implement skin selection logic
            }
        );
        
        this.settingsContainer.add(this.skinSelectionButton);
    }
    
    private createQuitLevelButton(): void {
        this.quitLevelButton = this.createButton(
            0,
            120,
            languageManager.getText('settings_quit_level'),
            () => {
                this.sound.play('shoot_laser', { volume: 0.5 });
                this.confirmQuitLevel();
            },
            0xff4444 // Red tint
        );
        
        this.settingsContainer.add(this.quitLevelButton);
    }
    
    private createCloseButton(): void {
        const yPos = this.showQuitLevel ? 200 : 140;
        
        this.closeButton = this.createButton(
            0,
            yPos,
            languageManager.getText('settings_close'),
            () => {
                this.sound.play('shoot_laser', { volume: 0.5 });
                this.closeSettings();
            }
        );
        
        this.settingsContainer.add(this.closeButton);
    }
    
    private createButton(x: number, y: number, text: string, callback: () => void, tint?: number): Phaser.GameObjects.Container {
        const { config } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        const buttonContainer = this.add.container(x, y);
        
        // Button dimensions based on screen size
        let buttonWidth = 200;
        let buttonHeight = 50;
        
        if (config.screenSize === 'mobile') {
            buttonWidth = 160;
            buttonHeight = 40;
        } else if (config.screenSize === 'tablet') {
            buttonWidth = 180;
            buttonHeight = 45;
        }
        
        buttonWidth *= config.uiScale;
        buttonHeight *= config.uiScale;
        
        // Button background
        const buttonBg = this.add.image(0, 0, 'ui_element_large');
        buttonBg.setDisplaySize(buttonWidth, buttonHeight);
        buttonBg.setInteractive();
        
        if (tint) {
            buttonBg.setTint(tint);
        }
        
        // Button text
        const buttonText = this.add.text(0, 0, text, {
            fontSize: ResponsiveGameUtils.getResponsiveFontSize(20, this),
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center'
        });
        buttonText.setOrigin(0.5);
        buttonText.setShadow(1, 1, '#000000', 2, true, false);
        
        buttonContainer.add([buttonBg, buttonText]);
        
        // Add hover effects
        buttonBg.on('pointerover', () => {
            buttonContainer.setScale(1.05);
            if (tint) {
                // Use a brighter version of the tint on hover
                if (tint === 0xff4444) { // Red quit button
                    buttonBg.setTint(0xff6666);
                } else {
                    buttonBg.setTint(0xffffff);
                }
            } else {
                buttonBg.setTint(0xcccccc);
            }
        });
        
        buttonBg.on('pointerout', () => {
            buttonContainer.setScale(1.0);
            if (tint) {
                buttonBg.setTint(tint);
            } else {
                buttonBg.clearTint();
            }
        });
        
        buttonBg.on('pointerdown', callback);
        
        return buttonContainer;
    }
    
    private confirmQuitLevel(): void {
        // For now, just quit directly. Later you could add a confirmation dialog
        this.sound.stopAll();
        this.scene.stop(); // Close settings
        
        // Stop the calling scene and go to main menu
        if (this.callingScene) {
            this.scene.stop(this.callingScene);
        }
        this.scene.start('MainMenu');
    }
    
    private closeSettings(): void {
        this.animateExit(() => {
            // Resume the calling scene if it was paused
            if (this.callingScene && this.callingScene === 'MainGame') {
                this.scene.resume(this.callingScene);
            }
            this.scene.stop();
        });
    }
    
    private animateEntrance(): void {
        // Start with settings container scaled down and invisible
        this.settingsContainer.setScale(0);
        this.settingsContainer.setAlpha(0);
        this.backgroundOverlay.setAlpha(0);
        
        // Animate background overlay
        this.tweens.add({
            targets: this.backgroundOverlay,
            alpha: 0.7,
            duration: 200,
            ease: 'Power2.easeOut'
        });
        
        // Animate settings container
        this.tweens.add({
            targets: this.settingsContainer,
            scaleX: 1,
            scaleY: 1,
            alpha: 1,
            duration: 300,
            delay: 100,
            ease: 'Back.easeOut'
        });
    }
    
    private animateExit(onComplete: () => void): void {
        // Animate settings container out
        this.tweens.add({
            targets: this.settingsContainer,
            scaleX: 0,
            scaleY: 0,
            alpha: 0,
            duration: 200,
            ease: 'Back.easeIn'
        });
        
        // Animate background overlay out
        this.tweens.add({
            targets: this.backgroundOverlay,
            alpha: 0,
            duration: 250,
            delay: 50,
            ease: 'Power2.easeIn',
            onComplete: onComplete
        });
    }
    
    private getContainerHeight(): number {
        const { config } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        let baseHeight = this.showQuitLevel ? 500 : 450;
        
        if (config.screenSize === 'mobile') {
            baseHeight = this.showQuitLevel ? 400 : 350;
        } else if (config.screenSize === 'tablet') {
            baseHeight = this.showQuitLevel ? 450 : 400;
        }
        
        return baseHeight * config.uiScale;
    }
    
    private updateTexts(): void {
        if (this.titleText) {
            this.titleText.setText(languageManager.getText('settings_title'));
        }
        
        if (this.volumeText) {
            this.volumeText.setText(languageManager.getText('settings_volume'));
        }
        
        if (this.skinSelectionButton) {
            const buttonText = this.skinSelectionButton.list[1] as Phaser.GameObjects.Text;
            buttonText.setText(languageManager.getText('settings_skin_selection'));
        }
        
        if (this.quitLevelButton) {
            const buttonText = this.quitLevelButton.list[1] as Phaser.GameObjects.Text;
            buttonText.setText(languageManager.getText('settings_quit_level'));
        }
        
        if (this.closeButton) {
            const buttonText = this.closeButton.list[1] as Phaser.GameObjects.Text;
            buttonText.setText(languageManager.getText('settings_close'));
        }
    }
    
    private handleResize(): void {
        const { width, height, centerX, centerY } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        // Update background overlay
        this.backgroundOverlay.clear();
        this.backgroundOverlay.fillStyle(0x000000, 0.7);
        this.backgroundOverlay.fillRect(0, 0, width, height);
        
        // Update settings container position
        this.settingsContainer.setPosition(centerX, centerY);
        
        // You could add more responsive updates here if needed
    }
    
    private cleanup(): void {
        // Remove resize listener
        this.scale.off('resize', this.handleResize, this);
        
        // Unsubscribe from language changes
        if (this.languageChangeUnsubscribe) {
            this.languageChangeUnsubscribe();
            this.languageChangeUnsubscribe = undefined;
        }
    }
}
