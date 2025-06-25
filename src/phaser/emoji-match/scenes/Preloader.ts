import Phaser from 'phaser';

export class Preloader extends Phaser.Scene {
    private loadText!: Phaser.GameObjects.Text;

    constructor() {
        super('Preloader');
    }

    preload(): void {
        // this.load.setBaseURL('https://cdn.phaserfiles.com/v355');
        this.loadText = this.add.text(400, 360, 'Loading ...', {
            fontFamily: 'Arial',
            fontSize: '64px',
            color: '#e3f2ed'
        }).setOrigin(0.5).setStroke('#203c5b', 6).setShadow(2, 2, '#2d2d2d', 4, true, false);

        this.load.setPath('assets/games/emoji-match/');
        this.load.image('background', 'background.png');
        this.load.image('logo', 'logo.png');
        this.load.atlas('emojis', 'emojis.png', 'emojis.json');

        this.load.setPath('assets/games/emoji-match/sounds/');
        this.load.audio('music', [ 'music.ogg', 'music.m4a', 'music.mp3' ]);
        this.load.audio('countdown', [ 'countdown.ogg', 'countdown.m4a', 'countdown.mp3' ]);
        this.load.audio('match', [ 'match.ogg', 'match.m4a', 'match.mp3' ]);
    }

    create(): void {
        if (this.sound.locked) {
            this.loadText.setText('Click to Start');
            this.input.once('pointerdown', () => this.scene.start('MainMenu'));
        } else {
            this.scene.start('MainMenu');
        }
    }
}