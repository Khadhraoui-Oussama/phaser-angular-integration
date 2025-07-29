import Phaser from 'phaser';
import { WrongAttempt } from '../models/Types';
import { languageManager } from '../utils/LanguageManager';
import { ResponsiveGameUtils } from '../utils/ResponsiveGameUtils';

export default class VictoryScene extends Phaser.Scene {
    private score: number = 0;
    private mistakes: Set<WrongAttempt> = new Set<WrongAttempt>;
    private titleText!: Phaser.GameObjects.Text;
    private scoreText!: Phaser.GameObjects.Text;
    private replayBtn!: Phaser.GameObjects.Rectangle;
    private replayBtnText!: Phaser.GameObjects.Text;
    private reviewBtn!: Phaser.GameObjects.Rectangle;
    private reviewBtnText!: Phaser.GameObjects.Text;
    private languageChangeUnsubscribe?: () => void;

    constructor() {
        super('VictoryScene');
    }

    init(data: { score: number; mistakes: Set<WrongAttempt> }) {
        this.score = data.score;
        data.mistakes.forEach(mistake => {this.mistakes.add(mistake)});
        console.log(this.mistakes)
    }

    create() {
        const { width, height, centerX, centerY } = ResponsiveGameUtils.getResponsiveConfig(this);

        this.cameras.main.setBackgroundColor('#1a1a1a');

        // Setup language change callback with scene safety
        this.languageChangeUnsubscribe = languageManager.onLanguageChangeWithSceneCheck(this, () => {
            this.updateTexts();
        });

        this.createUI();
        
        // Setup mobile input
        ResponsiveGameUtils.setupMobileInput(this);
        
        // Setup resize handling
        ResponsiveGameUtils.setupResizeHandler(this, () => {
            this.handleResize();
        });
    }
    
    private createUI(): void {
        const { width, height, centerX } = ResponsiveGameUtils.getResponsiveConfig(this);
        const buttonSize = ResponsiveGameUtils.getButtonSize(this);
        const spacing = ResponsiveGameUtils.getSpacing(60, this);

        this.titleText = this.add.text(centerX, height / 4, 'Victory!', 
            ResponsiveGameUtils.getTextStyle(48, this)
        ).setOrigin(0.5);

        this.scoreText = this.add.text(centerX, height / 2.7, 
            `Score: ${this.score}`, 
            ResponsiveGameUtils.getTextStyle(32, this, {
                color: '#00ffcc'
            })
        ).setOrigin(0.5);

        // Create responsive replay button
        this.replayBtn = this.add.rectangle(centerX, height / 2, buttonSize.width, buttonSize.height, 0x007acc)
            .setInteractive();
        
        this.replayBtnText = this.add.text(centerX, height / 2, 'Play Again',
            ResponsiveGameUtils.getTextStyle(20, this)
        ).setOrigin(0.5);

        this.replayBtn.on('pointerdown', () => {
            this.scene.start('MainMenu');
        });

        // Add hover effects
        this.replayBtn.on('pointerover', () => {
            this.replayBtn.setFillStyle(0x0099ff);
        });
        
        this.replayBtn.on('pointerout', () => {
            this.replayBtn.setFillStyle(0x007acc);
        });

        if (this.mistakes.size > 0) {
            // Create responsive review button
            this.reviewBtn = this.add.rectangle(centerX, height / 2 + spacing, 
                buttonSize.width, buttonSize.height, 0xcc6600)
                .setInteractive();
            
            this.reviewBtnText = this.add.text(centerX, height / 2 + spacing, 'Review Mistakes',
                ResponsiveGameUtils.getTextStyle(20, this)
            ).setOrigin(0.5);

            this.reviewBtn.on('pointerdown', () => {
                this.scene.start('ReviewMistakesScene', { mistakes: Array.from(this.mistakes) });
            });
            
            // Add hover effects
            this.reviewBtn.on('pointerover', () => {
                this.reviewBtn.setFillStyle(0xdd7711);
            });
            
            this.reviewBtn.on('pointerout', () => {
                this.reviewBtn.setFillStyle(0xcc6600);
            });
        }
    }
    
    private updateTexts(): void {
        if (languageManager && this.scene && this.scene.isActive()) {
            if (this.titleText) {
                this.titleText.setText('Victory!');
            }
            if (this.scoreText) {
                this.scoreText.setText(`Score: ${this.score}`);
            }
            if (this.replayBtnText) {
                this.replayBtnText.setText('Play Again');
            }
            if (this.reviewBtnText) {
                this.reviewBtnText.setText('Review Mistakes');
            }
        }
    }
    
    private handleResize(): void {
        // Clear and recreate UI elements on resize
        this.children.removeAll(true);
        this.createUI();
    }

    shutdown() {
        // Clean up language callback
        if (this.languageChangeUnsubscribe) {
            this.languageChangeUnsubscribe();
            this.languageChangeUnsubscribe = undefined;
        }
    }
}
