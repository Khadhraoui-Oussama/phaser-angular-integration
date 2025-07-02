import Phaser from 'phaser';
import Track from './Track';
import Player from './Player';
import { EventBus } from '../EventBus';
import {generateQuestionsForTables} from '../utils/QuestionGenerator';
import { Question,  WrongAttempt } from '../models/Types';

export default class MainGame extends Phaser.Scene {
    private player!: Player;
    public tracks!: Track[];

    private score: number = 0;
    private highscore: number = 0;

    private infoPanel!: Phaser.GameObjects.Image;
    private scoreText!: Phaser.GameObjects.Text;
    private highscoreText!: Phaser.GameObjects.Text;
    private scoreTimer!: Phaser.Time.TimerEvent;

    private questionContainer!: Phaser.GameObjects.Container;
    private questionText!: Phaser.GameObjects.Text;

    constructor() {
        super('MainGame');
    }

    questionOrder = 0
    wrongAttempts: WrongAttempt[] // the attempts to display at the review mistakes scene
    questionsToRetry: Question[]; // les questions a reviser : the question.options needs to be updated before pushing to this array and we need to use these questions once the questions array is empty.
    
    selectedTables: number[];
    questions : Question[] 
    init(data:{selectedTables:number[]}){
        this.selectedTables = data.selectedTables
        console.log("selectedTables in MainGame : ",this.selectedTables)
        this.questions = generateQuestionsForTables(this.selectedTables)
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
                
        const createQuestionUI = (questionTextValue: string) => {
            if (this.questionContainer) {
                this.questionContainer.destroy();
            }
            this.questionContainer = this.add.container(1024 / 2, 0).setDepth(1);

            //4 alternatives to choose from
            // const bgImage = this.add.image(0, 0, 'question_ui_no_top').setOrigin(0.5, 0);
            // const bgImage = this.add.image(0, 0, 'question_ui').setOrigin(0.5, 0);
            // const bgImage = this.add.image(0, 0, 'question_ui_large').setOrigin(0.5, 0);
            const bgImage = this.add.image(0, 0, 'question_ui_large_short_on_top').setOrigin(0.5, 0);
            

            this.questionContainer.add(bgImage);

            this.questionText = this.add.text(0, bgImage.height / 2, questionTextValue, {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#ffffff',
            align: 'center',
            }).setOrigin(0.5, 0.5);
            this.questionContainer.add(this.questionText);
        };

        // Verification:
        for (let i = 0; i < this.questions.length; i++) {            
            setTimeout(() => createQuestionUI(`${this.questions[i].operand1} x ${this.questions[i].operand2} = ?`), i * 1000);
        }
        for (let i = 0; i < this.questions.length; i++) {            
            setTimeout(() => {
                this.tracks[0].setSnowmenLabel(this.questions[i].options[0])
                this.tracks[1].setSnowmenLabel(this.questions[i].options[1])
                this.tracks[2].setSnowmenLabel(this.questions[i].options[2])
                this.tracks[3].setSnowmenLabel(this.questions[i].options[3])
            }, i * 3000);
        }
        
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
