import Phaser from 'phaser';
import Track from './Track';
import Player from './Player';
import { EventBus } from '../EventBus';
import {generateOptions, generatePossibleAnswersForTable, generateQuestionsForTables} from '../utils/QuestionGenerator';
import { Question,  WrongAttempt } from '../models/Types';
import Snowman from './Snowman';
import { ResponsiveGameUtils } from '../utils/ResponsiveGameUtils';
import { LanguageManager } from '../utils/LanguageManager';

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
    private mobileControls?: any;
    
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

    createQuestionUI(questionTextValue: string) {
        if (this.questionContainer) {
            this.questionContainer.destroy();
        }
        
        const { width, height, centerX } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        this.questionContainer = this.add.container(centerX, 0).setDepth(1);

        // Use responsive background image
        const bgImage = this.add.image(0, 0, 'question_ui_large_short_on_top').setOrigin(0.5, 0);
        
        // Scale background for smaller screens with consistent scaling
        const { config } = ResponsiveGameUtils.getResponsiveConfig(this);
        let bgScale = 1.0; // Default desktop scale
        
        if (config.screenSize === 'mobile') {
            bgScale = 0.45; // Smaller scale for mobile
        } else if (config.screenSize === 'tablet') {
            bgScale = 0.7; // Fixed scale for tablet
        }
        
        bgImage.setScale(bgScale);
        
        this.questionContainer.add(bgImage);

        // Create responsive question text
        this.questionText = this.add.text(0, bgImage.height * bgScale / 2, questionTextValue, 
            ResponsiveGameUtils.getTextStyle(32, this, {
                align: 'center'
            })
        ).setOrigin(0.5, 0.5);
        
        this.questionContainer.add(this.questionText);
    };

    create(): void {
        this.score = 0;
        this.highscore = this.registry.get('highscore') as number;
        this.questionsToRetry = new Set<Question>
        this.wrongAttempts = new Set<WrongAttempt>
        
        this.setupUI();
        this.setupTracks();
        this.setupInputs();
        
        // Setup resize handling
        ResponsiveGameUtils.setupResizeHandler(this, () => {
            this.handleResize();
        });
    }
    
    private setupUI(): void {
        const { width, height, centerX, centerY } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        // Add responsive background and overlay - these should always fill the screen
        this.add.image(centerX, centerY, 'background');
        this.add.image(0, 0, 'overlay').setOrigin(0);
        
        // Add responsive score panels with scaling
        const panelPadding = ResponsiveGameUtils.getResponsivePadding(16, this);
        const { config } = ResponsiveGameUtils.getResponsiveConfig(this);
        let panelScale = 1.0; // Default desktop scale
        
        if (config.screenSize === 'mobile') {
            panelScale = 0.45; // Smaller scale for mobile
        } else if (config.screenSize === 'tablet') {
            panelScale = 0.7; // Fixed scale for tablet
        }
        
        this.add.image(panelPadding, 0, 'sprites', 'panel-score').setOrigin(0).setScale(panelScale);
        this.add.image(width - panelPadding, 0, 'sprites', 'panel-best').setOrigin(1, 0).setScale(panelScale);
        
        this.infoPanel = this.add.image(centerX, centerY, 'sprites', 'controls').setScale(panelScale);

        // Create responsive text
        this.scoreText = this.add.text(140 * (width / 1024), 2, this.score.toString(), 
            ResponsiveGameUtils.getTextStyle(32, this)
        );

        this.highscoreText = this.add.text(820 * (width / 1024), 2, this.highscore.toString(), 
            ResponsiveGameUtils.getTextStyle(32, this)
        );
    }
    
    private setupTracks(): void {
        // Create responsive tracks based on screen height
        const trackPositions = ResponsiveGameUtils.getTrackPositions(this, 4);
        
        // Add extra spacing between tracks for better visibility
        const { height } = ResponsiveGameUtils.getResponsiveConfig(this);
        const extraSpacing = height * 0.035; 
        
        this.tracks = trackPositions.map((trackY, index) => 
            new Track(this, index, trackY + (extraSpacing * index))
        );
        
        this.player = new Player(this, this.tracks[0]);
    }
    
    private setupInputs(): void {
        // Setup mobile input support
        ResponsiveGameUtils.setupMobileInput(this);
        
        // Add touch controls for mobile
        if (ResponsiveGameUtils.isMobile(this)) {
            this.setupMobileControls();
        }

        this.input.keyboard!.once('keydown-SPACE', this.start, this);
        this.input.keyboard!.once('keydown-UP', this.start, this);
        this.input.keyboard!.once('keydown-DOWN', this.start, this);
    }
    
    private handleResize(): void {
        // Reposition UI elements on resize
        const { width, height, centerX, centerY } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        // Update background position - backgrounds should always fill the screen
        const backgrounds = this.children.list.filter(child => 
            (child as any).texture?.key === 'background' || (child as any).texture?.key === 'overlay'
        );
        backgrounds.forEach(bg => {
            const bgImage = bg as Phaser.GameObjects.Image;
            if ((bg as any).texture?.key === 'background') {
                bgImage.setPosition(centerX, centerY);
            } else if ((bg as any).texture?.key === 'overlay') {
                bgImage.setPosition(0, 0);
            }
        });
        
        // Update info panel position
        if (this.infoPanel) {
            this.infoPanel.setPosition(centerX, centerY);
        }
        
        // Update question container position
        if (this.questionContainer) {
            this.questionContainer.setPosition(centerX, 0);
        }
        
        // Update track positions with better spacing
        if (this.tracks) {
            const trackPositions = ResponsiveGameUtils.getTrackPositions(this, 4);
            this.tracks.forEach((track, index) => {
                track.updateTrackPosition(trackPositions[index]);
            });
        }
        
        // Update player position to match current track
        if (this.player) {
            this.player.y = this.player.currentTrack.y;
        }
        
        // Update mobile controls if they exist
        if (this.mobileControls && ResponsiveGameUtils.isMobile(this)) {
            this.destroyMobileControls();
            this.setupMobileControls();
        }
    }
    
    private destroyMobileControls(): void {
        if (this.mobileControls) {
            Object.values(this.mobileControls).forEach((control: any) => {
                if (control && control.destroy) {
                    control.destroy();
                }
            });
            this.mobileControls = undefined;
        }
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

        const { height } = ResponsiveGameUtils.getResponsiveConfig(this);

        this.tweens.add({
            targets: this.infoPanel,
            y: height + 100, // Move off screen
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
        const { centerY } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        this.infoPanel.setTexture('gameover');

        this.tweens.add({
            targets: this.infoPanel,
            y: centerY,
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

    setupMobileControls(): void {
        const { width, height } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        // Create virtual controls for mobile
        const buttonSize = ResponsiveGameUtils.getButtonSize(this);
        const padding = ResponsiveGameUtils.getResponsivePadding(20, this);
        
        // Only show throw button for mobile, remove up/down buttons
        // Throw button (centered horizontally, positioned at bottom)
        const throwButton = this.add.rectangle(
            width / 2,  // Center horizontally
            height - padding - buttonSize.height, 
            buttonSize.width * 1.2,  // Make it slightly wider
            buttonSize.height, 
            0xcc0066, 
            0.7
        ).setInteractive();
        
        const throwText = this.add.text(
            throwButton.x, 
            throwButton.y, 
            'THROW', 
            ResponsiveGameUtils.getTextStyle(18, this)  // Slightly larger text
        ).setOrigin(0.5);
        
        // Add instruction text for mobile players
        const instructionText = this.add.text(
            width / 2,
            height - padding - buttonSize.height * 2.5,
            'Tap upper/lower screen to move • Tap button to throw',
            ResponsiveGameUtils.getTextStyle(12, this, { 
                color: '#ffffff',
                backgroundColor: 'rgba(0,0,0,0.5)',
                padding: { x: 10, y: 5 }
            })
        ).setOrigin(0.5);
        
        // Add touch handlers
        throwButton.on('pointerdown', () => {
            if (this.player && this.player.isAlive && !this.player.isThrowing) {
                this.player.throw();
            }
        });
        
        // Add screen tap for movement (tap to move up/down)
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            // Don't move if clicking the throw button
            if (throwButton.getBounds().contains(pointer.x, pointer.y)) {
                return;
            }
            
            if (this.player && this.player.isAlive) {
                // Simple tap control: tap upper half = move up, tap lower half = move down
                const centerY = height / 2;
                if (pointer.y < centerY) {
                    this.player.moveUp();
                } else {
                    this.player.moveDown();
                }
            }
        });
        
        // Store references for cleanup
        this.mobileControls = {
            throwButton, throwText, instructionText
        };
    }

}
