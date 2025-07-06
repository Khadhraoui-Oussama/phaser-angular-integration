import Phaser from 'phaser';
import { WrongAttempt } from '../models/Types';

export default class VictoryScene extends Phaser.Scene {
    private score: number = 0;
    private mistakes: Set<WrongAttempt> = new Set<WrongAttempt>;

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

        this.add.text(width / 2, height / 4, 'Partie terminé', {
            fontSize: '48px',
            color: '#ffffff',
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2.7, `Score final : ${this.score}`, {
            fontSize: '32px',
            color: '#00ffcc',
        }).setOrigin(0.5);

        const replayBtn = this.add.text(width / 2, height / 2, 'Rejouer', {
            fontSize: '28px',
            color: '#ffffff',
            backgroundColor: '#007acc',
            padding: { left: 20, right: 20, top: 10, bottom: 10 },
        }).setOrigin(0.5).setInteractive();

        replayBtn.on('pointerdown', () => {
            this.scene.start('MainMenu');
        });

        if (this.mistakes.size > 0) {
            const reviewBtn = this.add.text(width / 2, height / 1.5, 'Revoir les erreurs', {
                fontSize: '28px',
                color: '#ffffff',
                backgroundColor: '#cc3300',
                padding: { left: 20, right: 20, top: 10, bottom: 10 },
            }).setOrigin(0.5).setInteractive();

            reviewBtn.on('pointerdown', () => {
                this.scene.start('ReviewMistakesScene', { mistakes: this.mistakes }); // you must implement ReviewScene
            });
        }
    }
}
