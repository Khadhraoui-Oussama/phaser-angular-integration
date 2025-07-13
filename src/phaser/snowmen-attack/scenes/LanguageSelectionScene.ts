import Phaser from 'phaser';
import { languageManager, SupportedLanguage } from '../utils/LanguageManager';
import { ResponsiveUtils } from '../utils/ResponsiveUtils';

export default class LanguageSelectionScene extends Phaser.Scene {
    private languageButtons: Map<SupportedLanguage, Phaser.GameObjects.Text> = new Map();
    private titleText!: Phaser.GameObjects.Text;
    private backButton!: Phaser.GameObjects.Text;
    private selectedLanguage: SupportedLanguage;

    constructor() {
        super('LanguageSelectionScene');
        this.selectedLanguage = languageManager.getCurrentLanguage();
    }

    create() {
        const { width, height, centerX, centerY } = ResponsiveUtils.getResponsiveDimensions(this);
        
        // Background
        this.add.rectangle(centerX, centerY, width, height, 0x000000, 0.7);

        this.createTitle();
        this.createLanguageButtons();
        this.createBackButton();
        this.updateButtonStates();
        
        // Setup mobile input
        ResponsiveUtils.setupMobileInput(this);
    }

    private createTitle() {
        const { centerX, height } = ResponsiveUtils.getResponsiveDimensions(this);
        
        this.titleText = this.add.text(
            centerX,
            height / 4,
            languageManager.getText('language_selection_title'),
            ResponsiveUtils.getTextStyle(32, this, {
                align: 'center'
            })
        ).setOrigin(0.5);
    }

    private createLanguageButtons() {
        const { centerX, centerY } = ResponsiveUtils.getResponsiveDimensions(this);
        const languages: SupportedLanguage[] = ['en', 'fr', 'ar'];
        const spacing = ResponsiveUtils.getSpacing(80, this);
        const startY = centerY - spacing;

        languages.forEach((language, index) => {
            const y = startY + (index * spacing);
            const displayName = languageManager.getLanguageDisplayName(language);
            
            const button = this.add.text(
                centerX,
                y,
                displayName,
                ResponsiveUtils.getTextStyle(24, this, {
                    align: 'center'
                })
            ).setOrigin(0.5).setInteractive();

            button.on('pointerover', () => {
                if (this.selectedLanguage !== language) {
                    button.setStyle({ backgroundColor: '#555555' });
                }
            });

            button.on('pointerout', () => {
                if (this.selectedLanguage !== language) {
                    button.setStyle({ backgroundColor: '#333333' });
                }
            });

            button.on('pointerdown', () => {
                this.selectLanguage(language);
            });

            this.languageButtons.set(language, button);
        });
    }

    private createBackButton() {
        const { width, height } = ResponsiveUtils.getResponsiveDimensions(this);
        
        this.backButton = this.add.text(
            100,
            height - 100,
            languageManager.getText('back'),
            ResponsiveUtils.getTextStyle(20, this)
        ).setOrigin(0.5).setInteractive();

        this.backButton.on('pointerover', () => {
            this.backButton.setStyle({ backgroundColor: '#888888' });
        });

        this.backButton.on('pointerout', () => {
            this.backButton.setStyle({ backgroundColor: '#666666' });
        });

        this.backButton.on('pointerdown', () => {
            this.goBack();
        });
    }

    private selectLanguage(language: SupportedLanguage) {
        this.selectedLanguage = language;
        languageManager.setLanguage(language);
        this.updateButtonStates();
        this.updateTexts();
    }

    private updateButtonStates() {
        this.languageButtons.forEach((button, language) => {
            if (language === this.selectedLanguage) {
                button.setStyle({ backgroundColor: '#00aa00' });
            } else {
                button.setStyle({ backgroundColor: '#333333' });
            }
        });
    }

    private updateTexts() {
        // Update all text elements with new language
        this.titleText.setText(languageManager.getText('language_selection_title'));
        this.backButton.setText(languageManager.getText('back'));
    }

    private goBack() {
        // Stop this scene and resume the MainMenu
        this.scene.stop();
        this.scene.resume('MainMenu');
    }
}
