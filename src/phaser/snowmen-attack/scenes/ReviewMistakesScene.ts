import Phaser from 'phaser';
import { WrongAttempt } from '../models/Types';
import { ResponsiveGameUtils } from '../utils/ResponsiveGameUtils';
import { languageManager } from '../utils/LanguageManager';

export default class ReviewMistakesScene extends Phaser.Scene {
    private mistakes: Set<WrongAttempt> = new Set<WrongAttempt>;
    private unsubscribeLanguageChange?: () => void;

    constructor() {
        super('ReviewMistakesScene');
    }

    init(data: { mistakes: WrongAttempt[] }) {
        data.mistakes.forEach(mistake => {this.mistakes.add(mistake)});
    }

    create() {
        const { width, height, centerX } = ResponsiveGameUtils.getResponsiveConfig(this);

        this.cameras.main.setBackgroundColor('#1b1b1b');

        // Setup language change callback
        this.unsubscribeLanguageChange = languageManager.onLanguageChangeWithSceneCheck(this, () => {
            this.updateTexts();
        });

        this.updateTexts();
        
        // Setup mobile input
        ResponsiveGameUtils.setupMobileInput(this);
    }
    
    private updateTexts() {
        // Clear existing text objects
        this.children.removeAll(true);
        
        const { width, height, centerX } = ResponsiveGameUtils.getResponsiveConfig(this);
        const padding = ResponsiveGameUtils.getResponsivePadding(40, this);

        this.add.text(centerX, padding, 'Erreurs à Revoir', 
            ResponsiveGameUtils.getTextStyle(40, this, {
                color: '#ff6666'
            })
        ).setOrigin(0.5, 0);

        if (this.mistakes.size === 0) {
            this.add.text(centerX, height / 2, 'Aucune erreur, bien joué', 
                ResponsiveGameUtils.getTextStyle(28, this, {
                    color: '#00ff88'
                })
            ).setOrigin(0.5);
        } else {
            const yStart = padding * 2.5;
            const spacing = ResponsiveGameUtils.getSpacing(50, this);
            const leftMargin = ResponsiveGameUtils.getResponsivePadding(50, this);
            const rightMargin = width / 2;
            
            let i = 0;
            this.mistakes.forEach((attempt) => {
                const y = yStart + i * spacing;
                const q = attempt.question;
                const wrongText = attempt.attemptedAnswer === -1
                    ? 'aucune réponse'
                    : `${attempt.attemptedAnswer}`;

                this.add.text(leftMargin, y, `${q.operand1} x ${q.operand2} = ${q.answer}`, 
                    ResponsiveGameUtils.getTextStyle(24, this)
                );
                this.add.text(rightMargin, y, `Réponse donnée : ${wrongText}`, 
                    ResponsiveGameUtils.getTextStyle(24, this, {
                        color: '#ff5555'
                    })
                );

                i++;
            });
        }

        // Add responsive back button
        const buttonSize = ResponsiveGameUtils.getButtonSize(this);
        const backButton = this.add.rectangle(
            centerX, 
            height - ResponsiveGameUtils.getResponsivePadding(60, this), 
            buttonSize.width, 
            buttonSize.height, 
            0x0066cc
        ).setInteractive();

        this.add.text(backButton.x, backButton.y, 'Retour', 
            ResponsiveGameUtils.getTextStyle(20, this)
        ).setOrigin(0.5);

        backButton.on('pointerdown', () => {
            this.scene.start('MainMenu');
        });
    }

    shutdown() {
        // Clean up language callback
        if (this.unsubscribeLanguageChange) {
            this.unsubscribeLanguageChange();
            this.unsubscribeLanguageChange = undefined;
        }
    }
}
