import Phaser from 'phaser';

export class Boot extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    create(): void {
        this.registry.set('highscore', 0);
        this.scene.start('Preloader');
    }
}