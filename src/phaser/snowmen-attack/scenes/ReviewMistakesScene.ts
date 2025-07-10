import Phaser from 'phaser';
import { WrongAttempt } from '../models/Types';

export default class ReviewMistakesScene extends Phaser.Scene {
    private mistakes: Set<WrongAttempt> = new Set<WrongAttempt>;

    constructor() {
        super('ReviewMistakesScene');
    }

    init(data: { mistakes: WrongAttempt[] }) {
        data.mistakes.forEach(mistake => {this.mistakes.add(mistake)});
    }

    create() {
        const { width, height } = this.scale;

        this.cameras.main.setBackgroundColor('#1b1b1b');

        this.add.text(width / 2, 40, 'Erreurs à Revoir', {
            fontSize: '40px',
            color: '#ff6666',
        }).setOrigin(0.5);

        if (this.mistakes.size === 0) {
            this.add.text(width / 2, height / 2, 'Aucune erreur, bien joué', {
                fontSize: '28px',
                color: '#00ff88',
            }).setOrigin(0.5);
        } else {
            const yStart = 100;
            let i = 0;
            this.mistakes.forEach((attempt) => {
                const y = yStart + i * 50;
                const q = attempt.question;
                const wrongText = attempt.attemptedAnswer === -1
                    ? 'aucune réponse'
                    : `${attempt.attemptedAnswer}`;

                this.add.text(50, y, `${q.operand1} x ${q.operand2} = ${q.answer}`, {
                    fontSize: '24px',
                    color: '#ffffff',
                });
                this.add.text(500, y, `Réponse donnée : ${wrongText}`, {
                    fontSize: '24px',
                    color: '#ff5555',
                });

                i++;
            });
        }

        const backButton = this.add.text(width / 2, height - 60, 'Retour au menu', {
            fontSize: '28px',
            backgroundColor: '#007acc',
            padding: { x: 20, y: 10 },
            color: '#ffffff',
        }).setOrigin(0.5).setInteractive();

        backButton.on('pointerdown', () => {
            this.scene.start('MainMenu');
        });
    }
}
