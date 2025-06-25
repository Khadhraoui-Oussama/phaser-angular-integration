import Phaser from 'phaser';
import { EventBus } from '../EventBus';

export class MainGame extends Phaser.Scene {
    private emojis!: Phaser.GameObjects.Group;
    private circle1!: Phaser.GameObjects.Arc;
    private circle2!: Phaser.GameObjects.Arc;
    private child1!: Phaser.GameObjects.Sprite;
    private child2!: Phaser.GameObjects.Sprite;
    private selectedEmoji: Phaser.GameObjects.Sprite | null = null;
    private matched: boolean = false;
    private score = 0;
    private highscore = 0;
    private scoreText!: Phaser.GameObjects.Text;
    private timer!: Phaser.Time.TimerEvent;
    private timerText!: Phaser.GameObjects.Text;

    constructor() {
        super('MainGame');
    }

    create(): void {
        this.add.image(400, 300, 'background');

        this.circle1 = this.add.circle(0, 0, 42).setStrokeStyle(3, 0xf8960e).setVisible(false);
        this.circle2 = this.add.circle(0, 0, 42).setStrokeStyle(3, 0x00ff00).setVisible(false);

        this.emojis = this.add.group({
            key: 'emojis',
            frameQuantity: 1,
            repeat: 15,
            gridAlign: { width: 4, height: 4, cellWidth: 90, cellHeight: 90, x: 280, y: 200 }
        });

        const fontStyle: Phaser.Types.GameObjects.Text.TextStyle = {
            fontFamily: 'Arial',
            fontSize: '48px',
            color: '#ffffff',
            fontStyle: 'bold',
            padding: { top: 16, bottom: 16 },
            shadow: {
                color: '#000000', fill: true, offsetX: 2, offsetY: 2, blur: 4
            }
        };

        this.timerText = this.add.text(20, 20, '30:00', fontStyle);
        this.scoreText = this.add.text(530, 20, 'Found: 0', fontStyle);

        this.emojis.getChildren().forEach((child) => (child as Phaser.GameObjects.Sprite).setInteractive());
        this.input.on('gameobjectdown', this.selectEmoji, this);
        this.input.once('pointerdown', this.start, this);

        this.highscore = this.registry.get('highscore');
        this.arrangeGrid();
        EventBus.emit('current-scene-ready', this);
    }

    start(): void {
        this.score = 0;
        this.matched = false;
        this.timer = this.time.addEvent({ delay: 30000, callback: this.gameOver, callbackScope: this });
        this.sound.play('countdown', { delay: 27 });
    }

    selectEmoji(_: Phaser.Input.Pointer, emoji: Phaser.GameObjects.Sprite): void {
        if (this.matched) return;

        if (!this.selectedEmoji) {
            this.circle1.setPosition(emoji.x, emoji.y).setVisible(true);
            this.selectedEmoji = emoji;
        } else if (emoji !== this.selectedEmoji) {
            if (emoji.frame.name === this.selectedEmoji.frame.name) {
                this.circle1.setStrokeStyle(3, 0x00ff00);
                this.circle2.setPosition(emoji.x, emoji.y).setVisible(true);
                this.tweens.add({
                    targets: [this.child1, this.child2],
                    scale: 1.4,
                    angle: '-=30',
                    yoyo: true,
                    ease: 'Sine.easeInOut',
                    duration: 200,
                    completeDelay: 200,
                    onComplete: () => this.newRound()
                });
                this.sound.play('match');
            } else {
                this.circle1.setPosition(emoji.x, emoji.y).setVisible(true);
                this.selectedEmoji = emoji;
            }
        }
    }

    newRound(): void {
        this.matched = false;
        this.score++;
        this.scoreText.setText('Found: ' + this.score);
        this.circle1.setStrokeStyle(3, 0xf8960e);
        this.circle1.setVisible(false);
        this.circle2.setVisible(false);
        this.tweens.add({
            targets: this.emojis.getChildren(),
            scale: 0,
            ease: 'Power2',
            duration: 600,
            delay: this.tweens.stagger(100, { grid: [4, 4], from: 'center' }),
            onComplete: () => this.arrangeGrid()
        });
    }

    arrangeGrid(): void {
        const frames = Phaser.Utils.Array.NumberArray(1, 40);
        const selected = Phaser.Utils.Array.NumberArray(0, 15);
        const children = this.emojis.getChildren() as Phaser.GameObjects.Sprite[];

        for (let i = 0; i < 16; i++) {
            const frame = Phaser.Utils.Array.RemoveRandomElement(frames);
            children[i].setFrame('smile' + frame);
        }

        let index1 = Phaser.Utils.Array.RemoveRandomElement(selected);
        let index2 = Phaser.Utils.Array.RemoveRandomElement(selected);

        this.child1 = children[Number.parseInt(index1.toString())];
        this.child2 = children[Number.parseInt(index2.toString())];
        
        this.child2.setFrame(this.child1.frame.name);

        this.selectedEmoji = null;

        this.tweens.add({
            targets: children,
            scale: { from: 0, to: 1 },
            ease: 'Bounce.easeOut',
            duration: 600,
            delay: this.tweens.stagger(100, { grid: [4, 4], from: 'center' })
        });
    }

    override update(): void {
        if (this.timer) {
            const remaining = Math.max(0, 30 - this.timer.getElapsedSeconds());
            const seconds = Math.floor(remaining);
            const ms = Math.floor((remaining - seconds) * 100);
            this.timerText.setText(`${seconds.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`);
        }
    }

    gameOver(): void {
        this.circle1.setStrokeStyle(4, 0xfc29a6).setPosition(this.child1.x, this.child1.y).setVisible(true);
        this.circle2.setStrokeStyle(4, 0xfc29a6).setPosition(this.child2.x, this.child2.y).setVisible(true);
        this.input.off('gameobjectdown', this.selectEmoji, this);

        if (this.score > this.highscore) {
            this.registry.set('highscore', this.score);
        }
        //EVENT EMIT EVENTBUS
        EventBus.emit("game-over",[this,this.highscore,this.score])

        this.tweens.add({
            targets: [this.circle1, this.circle2],
            alpha: 0,
            yoyo: true,
            repeat: 2,
            duration: 250,
            ease: 'Sine.easeInOut',
            onComplete: () => this.input.once('pointerdown', () => this.scene.start('MainMenu'))
        });
    }
}
