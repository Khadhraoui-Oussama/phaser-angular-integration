import Phaser from 'phaser';
import { languageManager, SupportedLanguage } from '../utils/LanguageManager';

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
        // Background
        this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x000000, 0.7);

        this.createTitle();
        this.createLanguageButtons();
        this.createBackButton();
        this.updateButtonStates();
    }

    private createTitle() {
        this.titleText = this.add.text(
            this.scale.width / 2,
            this.scale.height / 4,
            languageManager.getText('language_selection_title'),
            {
                fontSize: '32px',
                fontFamily: 'Arial',
                color: '#ffffff',
                align: 'center'
            }
        ).setOrigin(0.5);
    }

    private createLanguageButtons() {
        const languages: SupportedLanguage[] = ['en', 'fr', 'ar'];
        const startY = this.scale.height / 2 - 60;
        const spacing = 80;

        languages.forEach((language, index) => {
            const y = startY + (index * spacing);
            const displayName = languageManager.getLanguageDisplayName(language);
            
            const button = this.add.text(
                this.scale.width / 2,
                y,
                displayName,
                {
                    fontSize: '24px',
                    fontFamily: 'Arial',
                    color: '#ffffff',
                    backgroundColor: '#333333',
                    padding: { x: 20, y: 10 }
                }
            ).setOrigin(0.5);

            button.setInteractive({ useHandCursor: true });
            
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
        this.backButton = this.add.text(
            100,
            this.scale.height - 100,
            languageManager.getText('back'),
            {
                fontSize: '20px',
                fontFamily: 'Arial',
                color: '#ffffff',
                backgroundColor: '#666666',
                padding: { x: 15, y: 8 }
            }
        ).setOrigin(0.5);

        this.backButton.setInteractive({ useHandCursor: true });
        
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
