import Phaser from 'phaser';
import { ResponsiveUtils } from '../utils/ResponsiveUtils';

export default class Preloader extends Phaser.Scene {
    private loadText!: Phaser.GameObjects.Text;

    constructor() {
        super('Preloader');
    }

    preload(): void {
        const { centerX, centerY } = ResponsiveUtils.getResponsiveDimensions(this);
        
        // Create responsive loading text
        this.loadText = this.add.text(centerX, centerY, 'Loading ...', 
            ResponsiveUtils.getTextStyle(74, this, {
                color: '#e3f2ed',
                stroke: '#203c5b',
                strokeThickness: 6
            })
        );
        this.loadText.setOrigin(0.5);
        this.loadText.setShadow(2, 2, '#2d2d2d', 4, true, false);

        this.load.setPath('assets/games/snowmen-attack/');
        
        //loading the question_ui
        //312px width
        this.load.image('question_ui_large',"question_ui_large.png")
        //246px width
        this.load.image('question_ui',"question_ui.png")
        this.load.image('question_ui_no_top',"question_ui_no_top.png")
        this.load.image('question_ui_large_short_on_top',"question_ui_large_short_on_top.png")
        //
        this.load.image('background',"background.png");
        this.load.image('overlay',"overlay.png");
        this.load.image('gameover',"gameover.png");
        this.load.image('title',"title.png");
        this.load.atlas('sprites', 'sprites.png', 'sprites.json');
        this.load.glsl('snow', 'snow.glsl.js');

        this.load.setPath('assets/games/snowmen-attack/sounds/');
        this.load.audio('music', ['music.ogg', 'music.m4a', 'music.mp3']);
        this.load.audio('throw', ['throw.ogg', 'throw.m4a', 'throw.mp3']);
        this.load.audio('move', ['move.ogg', 'move.m4a', 'move.mp3']);
        this.load.audio('hit-snowman', ['hit-snowman.ogg', 'hit-snowman.m4a', 'hit-snowman.mp3']);
        this.load.audio('gameover', ['gameover.ogg', 'gameover.m4a', 'gameover.mp3']);
    }

    create(): void {
        this.anims.create({
            key: 'die',
            frames: this.anims.generateFrameNames('sprites', { prefix: 'die', start: 0, end: 0, zeroPad: 3 }),
        });

        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNames('sprites', { prefix: 'idle', start: 0, end: 3, zeroPad: 3 }),
            yoyo: true,
            frameRate: 8,
            repeat: -1,
        });

        this.anims.create({
            key: 'throwStart',
            frames: this.anims.generateFrameNames('sprites', { prefix: 'throw', start: 0, end: 8, zeroPad: 3 }),
            frameRate: 26,
        });

        this.anims.create({
            key: 'throwEnd',
            frames: this.anims.generateFrameNames('sprites', { prefix: 'throw', start: 9, end: 11, zeroPad: 3 }),
            frameRate: 26,
        });

        this.anims.create({
            key: 'snowmanIdleBig',
            frames: this.anims.generateFrameNames('sprites', { prefix: 'snowman-big-idle', start: 0, end: 3 }),
            yoyo: true,
            frameRate: 8,
            repeat: -1,
        });

        this.anims.create({
            key: 'snowmanWalkBig',
            frames: this.anims.generateFrameNames('sprites', { prefix: 'snowman-big-walk', start: 0, end: 7 }),
            frameRate: 8,
            repeat: -1,
        });

        this.anims.create({
            key: 'snowmanThrowStartBig',
            frames: this.anims.generateFrameNames('sprites', { prefix: 'snowman-big-throw', start: 0, end: 5 }),
            frameRate: 20,
        });

        this.anims.create({
            key: 'snowmanThrowEndBig',
            frames: this.anims.generateFrameNames('sprites', { prefix: 'snowman-big-throw', start: 6, end: 8 }),
            frameRate: 20,
        });

        this.anims.create({
            key: 'snowmanDieBig',
            frames: this.anims.generateFrameNames('sprites', { prefix: 'snowman-big-die', start: 0, end: 4 }),
            frameRate: 14,
        });

        this.anims.create({
            key: 'snowmanIdleSmall',
            frames: this.anims.generateFrameNames('sprites', { prefix: 'snowman-small-idle', start: 0, end: 3 }),
            yoyo: true,
            frameRate: 8,
            repeat: -1,
        });

        this.anims.create({
            key: 'snowmanWalkSmall',
            frames: this.anims.generateFrameNames('sprites', { prefix: 'snowman-small-walk', start: 0, end: 7 }),
            frameRate: 8,
            repeat: -1,
        });

        this.anims.create({
            key: 'snowmanThrowStartSmall',
            frames: this.anims.generateFrameNames('sprites', { prefix: 'snowman-small-throw', start: 0, end: 5 }),
            frameRate: 20,
        });

        this.anims.create({
            key: 'snowmanThrowEndSmall',
            frames: this.anims.generateFrameNames('sprites', { prefix: 'snowman-small-throw', start: 6, end: 8 }),
            frameRate: 20,
        });

        this.anims.create({
            key: 'snowmanDieSmall',
            frames: this.anims.generateFrameNames('sprites', { prefix: 'snowman-small-die', start: 0, end: 4 }),
            frameRate: 14,
        });

        if (this.sound.locked) {
            this.loadText.setText('Click to Start');
            this.input.once('pointerdown', () => {
                this.scene.start('MainMenu');
            });
        } else {
            this.scene.start('MainMenu');
        }
    }
}
