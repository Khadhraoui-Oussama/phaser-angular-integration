import Phaser from 'phaser';

export default class Preloader extends Phaser.Scene {
    private loadText!: Phaser.GameObjects.Text;
    private responsiveConfig: any;

    constructor() {
        super('Preloader');
    }

    preload(): void {
        // Get responsive config from game registry
        this.responsiveConfig = this.game.registry.get('responsiveConfig');
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;
        
        // Create responsive loading text
        const fontSize = this.responsiveConfig ? 
            Math.max(24, 74 * this.responsiveConfig.uiScale) : 74;
            
        this.loadText = this.add.text(centerX, centerY, 'Loading ...', {
            fontSize: `${fontSize}px`,
            fontFamily: 'Arial',
            color: '#e3f2ed',
            stroke: '#203c5b',
            strokeThickness: 6,
            align: 'center'
        });
        this.loadText.setOrigin(0.5);
        this.loadText.setShadow(2, 2, '#2d2d2d', 4, true, false);

        // Set asset path to main folder (no longer need device-specific folders)
        this.load.setPath('assets/games/snowmen-attack/');
        
        //loading the question_ui with responsive assets
        this.load.image('question_ui_large',"question_ui_large.png")
        this.load.image('question_ui',"question_ui.png")
        this.load.image('question_ui_no_top',"question_ui_no_top.png")
        this.load.image('question_ui_large_short_on_top',"question_ui_large_short_on_top.png")
        //
        this.load.image('background',"background.png");
        this.load.image('overlay',"overlay.png");
        this.load.image('gameover',"gameover.png");
        this.load.image('title',"title.png");
        this.load.atlas('sprites', 'sprites.png', 'sprites.json');
        
        // Load sounds from main folder (shared across all devices)
        this.load.setPath('assets/games/snowmen-attack/sounds/');
        this.load.audio('music', ['music.ogg', 'music.m4a', 'music.mp3']);
        this.load.audio('throw', ['throw.ogg', 'throw.m4a', 'throw.mp3']);
        this.load.audio('move', ['move.ogg', 'move.m4a', 'move.mp3']);
        this.load.audio('hit-snowman', ['hit-snowman.ogg', 'hit-snowman.m4a', 'hit-snowman.mp3']);
        this.load.audio('gameover', ['gameover.ogg', 'gameover.m4a', 'gameover.mp3']);
        
        // Load shader from main folder
        this.load.setPath('assets/games/snowmen-attack/');
        this.load.glsl('snow', 'snow.glsl.js');
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
