import Phaser from 'phaser';
import Track from './Track';
import Player from './Player';
import { EventBus } from '../EventBus';

export default class MainGame extends Phaser.Scene {
    private player!: Player;
    public tracks!: Track[];

    private score: number = 0;
    private highscore: number = 0;

    private infoPanel!: Phaser.GameObjects.Image;
    private scoreText!: Phaser.GameObjects.Text;
    private highscoreText!: Phaser.GameObjects.Text;
    private scoreTimer!: Phaser.Time.TimerEvent;

    constructor() {
        super('MainGame');
    }

    create(): void {
        this.score = 0;
        this.highscore = this.registry.get('highscore') as number;

        this.add.image(512, 384, 'background');

        this.tracks = [
            new Track(this, 0, 196),
            new Track(this, 1, 376),
            new Track(this, 2, 536),
            new Track(this, 3, 700),
        ];

        this.player = new Player(this, this.tracks[0]);

        this.add.image(0, 0, 'overlay').setOrigin(0);
        this.add.image(16, 0, 'sprites', 'panel-score').setOrigin(0);
        this.add.image(1024 - 16, 0, 'sprites', 'panel-best').setOrigin(1, 0);

        this.infoPanel = this.add.image(512, 384, 'sprites', 'controls');

        this.scoreText = this.add.text(140, 2, this.score.toString(), {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#ffffff',
        });

        this.highscoreText = this.add.text(820, 2, this.highscore.toString(), {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#ffffff',
        });

        this.input.keyboard!.once('keydown-SPACE', this.start, this);
        this.input.keyboard!.once('keydown-UP', this.start, this);
        this.input.keyboard!.once('keydown-DOWN', this.start, this);
    }

    private start(): void {
        this.input.keyboard!.removeAllListeners();

        this.tweens.add({
            targets: this.infoPanel,
            y: 700,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
        });

        this.player.start();

        this.tracks[0].start(4000, 8000);
        this.tracks[1].start(500, 1000);
        this.tracks[2].start(5000, 9000);
        this.tracks[3].start(6000, 10000);

        this.scoreTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.score++;
                this.scoreText.setText(this.score.toString());
            },
            callbackScope: this,
            repeat: -1,
        });
    }

    public gameOver(): void {
        this.infoPanel.setTexture('gameover');

        this.tweens.add({
            targets: this.infoPanel,
            y: 384,
            alpha: 1,
            duration: 500,
            ease: 'Power2',
        });

        this.tracks.forEach((track) => track.stop());

        this.sound.stopAll();
        this.sound.play('gameover');

        this.player.stop();
        this.scoreTimer.destroy();

        if (this.score > this.highscore) {
            this.highscoreText.setText('NEW!');
            this.registry.set('highscore', this.score);
        }
        //GAME OVER EVENT EMIT( snowman-attack-game.component will listen for this event)
        EventBus.emit("game-over",this)

        this.input.keyboard!.once('keydown-SPACE', () => {
            this.scene.start('MainMenu');
        }, this);

        this.input.once('pointerdown', () => {
            this.scene.start('MainMenu');
        }, this);
    }
}
