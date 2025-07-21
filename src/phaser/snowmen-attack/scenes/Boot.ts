import Phaser from 'phaser';

export class Boot extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    create(): void {
        const storedHighscore = localStorage.getItem('highscore');
        const parsedHighscore = storedHighscore ? parseInt(storedHighscore) : 0;
        this.registry.set('highscore', parsedHighscore);
        
        // Set selected skin in registry from localStorage or default to classic
        const storedSkin = localStorage.getItem('selectedSkin') || 'classic';
        this.registry.set('selectedSkin', storedSkin);
        
        this.scene.start('Preloader');
    }
}
