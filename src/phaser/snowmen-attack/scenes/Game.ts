import Phaser from 'phaser';
import Track from './Track';
import Player from './Player';
import { EventBus } from '../EventBus';
import {generateOptions, generatePossibleAnswersForTable, generateQuestionsForTables} from '../utils/QuestionGenerator';
import { Question,  WrongAttempt } from '../models/Types';
import Snowman from './Snowman';

export default class MainGame extends Phaser.Scene {
    private player!: Player;
    public tracks!: Track[];

    private score: number = 0;
    private highscore: number = 0;

    private infoPanel!: Phaser.GameObjects.Image;
    private scoreText!: Phaser.GameObjects.Text;
    private highscoreText!: Phaser.GameObjects.Text;

    private questionContainer!: Phaser.GameObjects.Container;
    private questionText!: Phaser.GameObjects.Text;
    private currentQuestion!: Question;
    
    constructor() {
        super('MainGame');
    }

    questionOrder = 0
    wrongAttempts: Set<WrongAttempt> // the attempts to display at the review mistakes scene
    questionsToRetry: Set<Question>; // les questions a reviser : the question.options needs to be updated before pushing to this array and we need to use these questions once the questions array is empty.
    
    selectedTables: number[];
    questions : Question[] 
    init(data:{selectedTables:number[]}){
        this.selectedTables = data.selectedTables
        console.log("selectedTables in MainGame : ",this.selectedTables)
        this.questionOrder = 0;
        this.questions = generateQuestionsForTables(this.selectedTables)
    }

    createQuestionUI(questionTextValue: string)  {
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

    create(): void {
        this.score = 0;
        this.highscore = this.registry.get('highscore') as number;
        this.questionsToRetry = new Set<Question>
        this.wrongAttempts = new Set<WrongAttempt>
        this.add.image(512, 384, 'background');
        this.add.image(0, 0, 'overlay').setOrigin(0);
        this.add.image(16, 0, 'sprites', 'panel-score').setOrigin(0);
        this.add.image(1024 - 16, 0, 'sprites', 'panel-best').setOrigin(1, 0);

        this.tracks = [
            new Track(this, 0, 196),
            new Track(this, 1, 376),
            new Track(this, 2, 536),
            new Track(this, 3, 700),
        ];
        this.player = new Player(this, this.tracks[0]);
        
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

    onSnowmanHit(snowman: Snowman,track:Track): void {
        const answer = parseInt(snowman.label.text);
        const correct = this.currentQuestion.answer === answer;

        if (correct) {
            console.log('Correct!');
            
            this.score++;
            this.scoreText.setText(this.score.toString()); 
            
            this.loadNextQuestion();
        } else {
            console.log('Wrong!');
            this.handleWrongAnswer(answer,track);
        }
    }
    handleWrongAnswer(answer: number, track: Track): void {
        console.log('Wrong!');
        if(this.score >= 1){
            this.score--;
            this.scoreText.setText(this.score.toString());
        }
        const possibleAnswersForTable = generatePossibleAnswersForTable(this.currentQuestion.operand1);

        if (!this.questionsToRetry.has(this.currentQuestion)) {
            this.questionsToRetry.add(this.currentQuestion);
        }

        this.questionsToRetry.forEach(q => {
            q.options = generateOptions(q.answer, possibleAnswersForTable);
        });

        const alreadyRegistered = Array.from(this.wrongAttempts).some(
            attempt => attempt.question === this.currentQuestion && attempt.attemptedAnswer === answer
        );

        if (!alreadyRegistered) {
            this.wrongAttempts.add({
                orderOfAppearance: this.questionOrder,
                question: this.currentQuestion,
                attemptedAnswer: answer,
            });
        }

        console.log("wrongAttempts: ", this.wrongAttempts);
        console.log("questionsToRetry: ", this.questionsToRetry);

        // Speed up all snowmen
        this.tracks.forEach(track => {
            track.snowmanSmall.speed += 10;
        });

        track.setSnowmenLabel(answer);
        track.snowmanSmall.start();
    }

    loadNextQuestion(): void {
        if (!this.questions || this.questions.length === 0) {
            console.error("Questions not initialized correctly:", this.questions);
            return;
        }
        this.stopAllEnemySnowballs()
        this.questionOrder++;
        console.log("question order : ",this.questionOrder)
        if (this.questionOrder >= this.questions.length) {//acount for 0-index
            if (this.questionsToRetry.size > 0) {
                console.log('Switching to retry questions...');
                this.questions = [...this.questionsToRetry];
                console.log("this.questions : ",this.questions)
                this.questionsToRetry.clear();
                this.questionOrder = 0;
            } else {
                console.log('All questions done!');
                this.gameOver();
                return;
            }
        }

        this.currentQuestion = this.questions[this.questionOrder];

        this.createQuestionUI(`${this.currentQuestion.operand1} x ${this.currentQuestion.operand2}= ?`);
        this.tracks[0].setSnowmenLabel(this.currentQuestion.options[0]);
        this.tracks[1].setSnowmenLabel(this.currentQuestion.options[1]);
        this.tracks[2].setSnowmenLabel(this.currentQuestion.options[2]);
        this.tracks[3].setSnowmenLabel(this.currentQuestion.options[3]);

        // Restart snowmen
        this.tracks.forEach(track => {
            track.snowmanSmall.speed = 50;
            track.snowmanSmall.start();
        });
    }

    public stopAllEnemySnowballs(): void {
        this.tracks.forEach(track => {
            (track.enemySnowballs.getChildren() as Phaser.Physics.Arcade.Sprite[]).forEach(snowball => {
                if (snowball.active) {
                    snowball.stop();
                }
            });
        });
    }


    private start(): void {
        if (!this.questions || this.questions.length === 0) {
            console.error("Questions not initialized correctly:", this.questions);
            return;
        }
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


        this.currentQuestion = this.questions[this.questionOrder];
        this.createQuestionUI(`${this.currentQuestion.operand1} x ${this.currentQuestion.operand2}= ?`);

        
        this.tracks[0].setSnowmenLabel(this.currentQuestion.options[0]);
        this.tracks[1].setSnowmenLabel(this.currentQuestion.options[1]);
        this.tracks[2].setSnowmenLabel(this.currentQuestion.options[2]);
        this.tracks[3].setSnowmenLabel(this.currentQuestion.options[3]);
    
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

        this.tracks.forEach((track) => 
            {
                track.stop()
                // track.snowmanSmall.stop()
            });

        this.sound.stopAll();
        this.sound.play('gameover');

        this.player.stop();

        if (this.score > this.highscore) {
            this.highscore = this.score;
            this.highscoreText.setText('NEW HighScore!');
            this.registry.set('highscore', this.score);
            localStorage.setItem('highscore', this.score.toString()); 
        }
        //GAME OVER EVENT EMIT( snowman-attack-game.component will listen for this event)
        EventBus.emit("game-over",this)
        console.log("send data mistakes: ",this.wrongAttempts )
        this.time.delayedCall(1000, () => {
            this.scene.start('VictoryScene', {
            score: this.score,
            mistakes: this.wrongAttempts,
         });
});
    }
    onSnowmanReachedTheEndOfTheTrack(snowman: Snowman): void {
        const answer = parseInt(snowman.label.text);
        const correct = this.currentQuestion.answer === answer;

        if (correct) {
            console.log('Snowman with correct answer reached end: counted as wrong.');

            const possibleAnswersForTable = generatePossibleAnswersForTable(this.currentQuestion.operand1);

            if (!this.questionsToRetry.has(this.currentQuestion)) {
                this.questionsToRetry.add(this.currentQuestion);
            }

            this.questionsToRetry.forEach(q => {
                q.options = generateOptions(q.answer, possibleAnswersForTable);
            });
            const alreadyRegistered = Array.from(this.wrongAttempts).some(
                attempt => attempt.question === this.currentQuestion && attempt.attemptedAnswer === -1
            );

            if (!alreadyRegistered) {
                this.wrongAttempts.add({
                    orderOfAppearance: this.questionOrder,
                    question: this.currentQuestion,
                    attemptedAnswer: -1,
                });
            }
            console.log(this.wrongAttempts)
        } else {
            console.log("Snowman with wrong answer reached end : snowmen stopped in preUpdate, continue playing")
            // snowman.stop()
        }

        this.loadNextQuestion();
    }

}
