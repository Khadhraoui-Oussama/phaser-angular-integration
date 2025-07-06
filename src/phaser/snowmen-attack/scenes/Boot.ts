import Phaser from 'phaser';

export class Boot extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    create(): void {
        const storedHighscore = localStorage.getItem('highscore');
        const parsedHighscore = storedHighscore ? parseInt(storedHighscore) : 0;
        this.registry.set('highscore', parsedHighscore);
        this.scene.start('Preloader');
    }
}
