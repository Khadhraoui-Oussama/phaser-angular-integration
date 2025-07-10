import Phaser from 'phaser';
import { WrongAttempt } from '../models/Types';
import { languageManager } from '../utils/LanguageManager';

export default class VictoryScene extends Phaser.Scene {
    private score: number = 0;
    private mistakes: Set<WrongAttempt> = new Set<WrongAttempt>;
    private titleText!: Phaser.GameObjects.Text;
    private scoreText!: Phaser.GameObjects.Text;
    private replayBtn!: Phaser.GameObjects.Text;
    private reviewBtn!: Phaser.GameObjects.Text;
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
        const { width, height } = this.scale;

        this.cameras.main.setBackgroundColor('#1a1a1a');

        this.titleText = this.add.text(width / 2, height / 4, languageManager.getText('victory_title'), {
            fontSize: '48px',
            color: '#ffffff',
        }).setOrigin(0.5);

        this.scoreText = this.add.text(width / 2, height / 2.7, languageManager.getFormattedText('victory_score', this.score.toString()), {
            fontSize: '32px',
            color: '#00ffcc',
        }).setOrigin(0.5);

        this.replayBtn = this.add.text(width / 2, height / 2, languageManager.getText('victory_play_again'), {
            fontSize: '28px',
            color: '#ffffff',
            backgroundColor: '#007acc',
            padding: { left: 20, right: 20, top: 10, bottom: 10 },
        }).setOrigin(0.5).setInteractive();

        this.replayBtn.on('pointerdown', () => {
            this.scene.start('MainMenu');
        });

        if (this.mistakes.size > 0) {
            this.reviewBtn = this.add.text(width / 2, height / 1.5, languageManager.getText('review_mistakes_title'), {
                fontSize: '28px',
                color: '#ffffff',
                backgroundColor: '#cc3300',
                padding: { left: 20, right: 20, top: 10, bottom: 10 },
            }).setOrigin(0.5).setInteractive();

            this.reviewBtn.on('pointerdown', () => {
                this.scene.start('ReviewMistakesScene', { mistakes: this.mistakes }); // you must implement ReviewScene
            });
        }

        // Subscribe to language changes only when scene is active
        this.languageChangeUnsubscribe = languageManager.onLanguageChange(() => {
            // Only update if this scene is active and manager exists
            if (this.scene && this.scene.manager && this.scene.isActive()) {
                this.updateTexts();
            }
        });

        // Listen for scene shutdown to cleanup
        this.events.on('shutdown', () => {
            this.cleanup();
        });
    }

    private updateTexts() {
        // Only update if scene is active and text objects exist
        if (!this.scene || !this.scene.manager || !this.scene.isActive()) return;
        
        if (this.titleText && this.titleText.active) {
            this.titleText.setText(languageManager.getText('victory_title'));
        }
        if (this.scoreText && this.scoreText.active) {
            this.scoreText.setText(languageManager.getFormattedText('victory_score', this.score.toString()));
        }
        if (this.replayBtn && this.replayBtn.active) {
            this.replayBtn.setText(languageManager.getText('victory_play_again'));
        }
        if (this.reviewBtn && this.reviewBtn.active) {
            this.reviewBtn.setText(languageManager.getText('review_mistakes_title'));
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
    }
}
