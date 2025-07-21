import Phaser from 'phaser';
import Track from './Track';
import Player from './Player';
import PlayerSnowball from './PlayerSnowball';
import EnemySnowball from './EnemySnowball';
import { EventBus } from '../EventBus';
import {generateOptions, generatePossibleAnswersForTable, generateQuestionsForTables, shuffle} from '../utils/QuestionGenerator';
import { Question,  WrongAttempt } from '../models/Types';
import Snowman from './Snowman';
import { ResponsiveGameUtils } from '../utils/ResponsiveGameUtils';
import { LanguageManager } from '../utils/LanguageManager';
import { SkinManager } from '../utils/SkinManager';

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
    private gameStarted: boolean = false;
    
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
        this.gameStarted = false; // Reset game started flag
        
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
        
        // Add responsive background and overlay using SkinManager - these should always fill the screen
        this.add.image(centerX, centerY, SkinManager.getTextureKey('background'));
        this.add.image(0, 0, SkinManager.getTextureKey('overlay')).setOrigin(0);
        
        // Add responsive score panels with scaling
        const panelPadding = ResponsiveGameUtils.getResponsivePadding(16, this);
        const { config } = ResponsiveGameUtils.getResponsiveConfig(this);
        let panelScale = 1.0; // Default desktop scale
        
        if (config.screenSize === 'mobile') {
            panelScale = 0.45; // Smaller scale for mobile
        } else if (config.screenSize === 'tablet') {
            panelScale = 0.7; // Fixed scale for tablet
        }
        
        // Use SkinManager for sprites or fallback to hardcoded names for panels
        const currentSkin = SkinManager.getCurrentSkin();
        let spritesKey: string;
        let panelFrame: string | undefined;
        
        if (currentSkin.type === 'atlas') {
            spritesKey = SkinManager.getTextureKey('sprites');
            panelFrame = 'panel-score';
        } else {
            // For individual frame skins, fallback to classic for UI panels
            spritesKey = 'classic_sprites';
            panelFrame = 'panel-score';
        }
        
        this.add.image(panelPadding, 0, spritesKey, panelFrame).setOrigin(0).setScale(panelScale);
        this.add.image(width - panelPadding, 0, spritesKey, 'panel-best').setOrigin(1, 0).setScale(panelScale);
        
        this.infoPanel = this.add.image(centerX, centerY, spritesKey, 'controls').setScale(panelScale);

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
        
        // Add touch controls for mobile and tablet
        if (ResponsiveGameUtils.needsTouchControls(this)) {
            this.setupMobileControls();
        } else {
            // Only set up keyboard controls for desktop
            this.input.keyboard!.once('keydown-SPACE', this.start, this);
            this.input.keyboard!.once('keydown-UP', this.start, this);
            this.input.keyboard!.once('keydown-DOWN', this.start, this);
        }
    }
    
    private handleResize(): void {
        // Reposition UI elements on resize
        const { width, height, centerX, centerY } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        // Update background position - backgrounds should always fill the screen
        const backgrounds = this.children.list.filter(child => 
            (child as any).texture?.key === SkinManager.getTextureKey('background') || 
            (child as any).texture?.key === SkinManager.getTextureKey('overlay')
        );
        backgrounds.forEach(bg => {
            const bgImage = bg as Phaser.GameObjects.Image;
            if ((bg as any).texture?.key === SkinManager.getTextureKey('background')) {
                bgImage.setPosition(centerX, centerY);
            } else if ((bg as any).texture?.key === SkinManager.getTextureKey('overlay')) {
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
        if (this.mobileControls && ResponsiveGameUtils.needsTouchControls(this)) {
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

        if (!this.questionsToRetry.has(this.currentQuestion)) {
            this.questionsToRetry.add(this.currentQuestion);
        }

        // Update options for each question in retry set with their respective table's possible answers
        this.questionsToRetry.forEach(q => {
            const possibleAnswersForThisQuestion = generatePossibleAnswersForTable(q.operand1);
            q.options = generateOptions(q.answer, possibleAnswersForThisQuestion);
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

    onEggHit(track: Track): void {
        // Use the comprehensive egg crack sequence function
        this.handleEggCrackSequence(track);
    }

    private pauseGameForEggAnimation(): void {
        // Pause physics to stop all movement
        this.physics.pause();
        
        // Stop all tracks and snowmen
        this.tracks.forEach(track => {
            track.stop();
        });
        
        // Stop all player snowballs and hide them
        this.tracks.forEach(track => {
            (track.playerSnowballs.getChildren() as Phaser.Physics.Arcade.Sprite[]).forEach(snowball => {
                if (snowball.active) {
                    snowball.stop();
                    snowball.setVisible(false);
                    snowball.setActive(false);
                }
            });
        });
        
        // Stop all enemy snowballs
        this.stopAllEnemySnowballs();
        
        // Stop player movement and disable input
        this.player.stop();
        this.player.spacebar.enabled = false;
        this.player.up.enabled = false;
        this.player.down.enabled = false;
    }

    private resumeGameAndLoadNext(): void {
        // Resume physics
        this.physics.resume();
        
        // Re-enable player input
        this.player.spacebar.enabled = true;
        this.player.up.enabled = true;
        this.player.down.enabled = true;
        
        // Load next question
        this.loadNextQuestion();
    }

    loadNextQuestion(): void {
        if (!this.questions || this.questions.length === 0) {
            console.error("Questions not initialized correctly:", this.questions);
            return;
        }
        this.stopAllEnemySnowballs()
        this.questionOrder++;
        console.log("question order : ",this.questionOrder)
        console.log("questions.length : ",this.questions.length)
        console.log("questionsToRetry.size : ",this.questionsToRetry.size)
        
        if (this.questionOrder >= this.questions.length) {//acount for 0-index
            if (this.questionsToRetry.size > 0) {
                console.log('Switching to retry questions...');
                console.log('Questions to retry:', [...this.questionsToRetry]);
                
                // Convert to array and shuffle options for each retry question
                this.questions = [...this.questionsToRetry].map(question => {
                    // Generate fresh options for the question
                    const possibleAnswersForThisQuestion = generatePossibleAnswersForTable(question.operand1);
                    const shuffledOptions = generateOptions(question.answer, possibleAnswersForThisQuestion);
                    
                    // Actually shuffle the options array to randomize positions
                    shuffle(shuffledOptions);
                    
                    console.log(`Shuffled options for ${question.operand1} x ${question.operand2}:`, shuffledOptions);
                    
                    return {
                        ...question,
                        options: shuffledOptions
                    };
                });
                
                console.log("this.questions after switch with shuffled options: ", this.questions)
                this.questionsToRetry.clear();
                this.questionOrder = 0;
                console.log('Reset questionOrder to 0, starting retry round with shuffled options');
            } else {
                console.log('All questions done! No more retries available.');
                this.gameOver();
                return;
            }
        }

        this.currentQuestion = this.questions[this.questionOrder];
        console.log('Loading question:', this.currentQuestion);

        this.createQuestionUI(`${this.currentQuestion.operand1} x ${this.currentQuestion.operand2}= ?`);
        this.tracks[0].setSnowmenLabel(this.currentQuestion.options[0]);
        this.tracks[1].setSnowmenLabel(this.currentQuestion.options[1]);
        this.tracks[2].setSnowmenLabel(this.currentQuestion.options[2]);
        this.tracks[3].setSnowmenLabel(this.currentQuestion.options[3]);

        // Restart snowmen with responsive speed
        this.tracks.forEach(track => {
            // Set responsive speed based on screen size
            const { config } = ResponsiveGameUtils.getResponsiveConfig(this);
            let baseSpeed = 50; // Default desktop speed
            if (config.screenSize === 'mobile') {
                baseSpeed = 25; // Slower speed for mobile devices
            } else if (config.screenSize === 'tablet') {
                baseSpeed = 35; // Medium speed for tablets
            }
            track.snowmanSmall.speed = baseSpeed;
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
        
        // Mark game as started
        this.gameStarted = true;
        
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
        console.log('=== GAME OVER ===');
        console.log('Final questionsToRetry.size:', this.questionsToRetry.size);
        console.log('Final wrongAttempts.size:', this.wrongAttempts.size);
        console.log('All questions completed including retries!');
        
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

            if (!this.questionsToRetry.has(this.currentQuestion)) {
                this.questionsToRetry.add(this.currentQuestion);
            }

            // Update options for each question in retry set with their respective table's possible answers
            this.questionsToRetry.forEach(q => {
                const possibleAnswersForThisQuestion = generatePossibleAnswersForTable(q.operand1);
                q.options = generateOptions(q.answer, possibleAnswersForThisQuestion);
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
            this.gameStarted ? 'THROW' : 'START', 
            ResponsiveGameUtils.getTextStyle(18, this)  // Slightly larger text
        ).setOrigin(0.5);
        
        // Add instruction text for mobile players
        // const instructionText = this.add.text(
        //     width / 2,
        //     height - padding - buttonSize.height * 2.5,
        //     'Tap upper/lower screen to move • Tap button to throw',
        //     ResponsiveGameUtils.getTextStyle(12, this, { 
        //         color: '#ffffff',
        //         backgroundColor: 'rgba(0,0,0,0.5)',
        //         padding: { x: 10, y: 5 }
        //     })
        // ).setOrigin(0.5);
        
        // Add touch handlers
        throwButton.on('pointerdown', () => {
            if (!this.gameStarted) {
                // Use throw button to start the game on mobile/tablet
                this.start();
                // Update button text after starting
                throwText.setText('THROW');
            } else if (this.player && this.player.isAlive && !this.player.isThrowing) {
                this.player.throw();
            }
        });
        
        // Add screen tap for movement (tap to move up/down) - only after game starts
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            // Don't move if clicking the throw button
            if (throwButton.getBounds().contains(pointer.x, pointer.y)) {
                return;
            }
            
            // Only allow movement after game has started
            if (this.gameStarted && this.player && this.player.isAlive) {
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
            throwButton, throwText, 
        };
    }

    /**
     * Handles the complete egg crack sequence:
     * 1. Stops all snowmen from moving
     * 2. Stops all snowballs from advancing
     * 3. Plays egg crack animation
     * 4. Loads next question after animation completes
     */
    handleEggCrackSequence(track: Track): void {
        // 1. Stop all snowmen movement
        this.tracks.forEach(t => {
            if (t.snowmanSmall) {
                t.snowmanSmall.stop();
            }
        });

        // 2. Stop all snowballs from advancing
        this.stopAllSnowballs();

        // 3. Pause physics to ensure everything stops
        this.physics.pause();

        // 4. Disable player input during animation
        this.player.spacebar.enabled = false;
        this.player.up.enabled = false;
        this.player.down.enabled = false;

        // 5. Play egg crack animation with callback
        track.triggerEggCrack(() => {
            // 6. After animation completes, load next question
            this.time.delayedCall(500, () => {
                // Resume physics
                this.physics.resume();
                
                // Re-enable player input
                this.player.spacebar.enabled = true;
                this.player.up.enabled = true;
                this.player.down.enabled = true;
                
                // Load next question
                this.loadNextQuestion();
            });
        });
    }

    /**
     * Stops all snowballs (both player and enemy) from advancing
     */
    private stopAllSnowballs(): void {
        this.tracks.forEach(track => {
            // Stop all player snowballs
            (track.playerSnowballs.getChildren() as PlayerSnowball[]).forEach(snowball => {
                if (snowball.active) {
                    snowball.stop();
                    snowball.setVisible(false);
                    snowball.setActive(false);
                }
            });

            // Stop all enemy snowballs
            (track.enemySnowballs.getChildren() as EnemySnowball[]).forEach(snowball => {
                if (snowball.active) {
                    snowball.stop();
                    snowball.setVisible(false);
                    snowball.setActive(false);
                }
            });
        });
    }

    onEggHitAsWrongAnswer(track: Track): void {
        console.log('Egg hit - treating as wrong answer!');
        
        // Get the correct answer for this question
        const correctAnswer = this.currentQuestion.answer;
        
        // Handle this as a wrong answer with the correct answer as the "attempted" answer
        // This represents that the player failed to hit the correct snowman in time
        this.handleWrongAnswerForEggHit(correctAnswer, track);
        
        // Then trigger the egg crack sequence and move to next question
        this.handleEggCrackSequence(track);
    }

    handleWrongAnswerForEggHit(correctAnswer: number, track: Track): void {
        console.log('Handling egg hit as wrong answer...');
        
        // Decrease score for wrong answer
        if(this.score >= 1){
            this.score--;
            this.scoreText.setText(this.score.toString());
        }

        // Add current question to retry set if not already there
        if (!this.questionsToRetry.has(this.currentQuestion)) {
            this.questionsToRetry.add(this.currentQuestion);
        }

        // Update options for each question in retry set with their respective table's possible answers
        this.questionsToRetry.forEach(q => {
            const possibleAnswersForThisQuestion = generatePossibleAnswersForTable(q.operand1);
            q.options = generateOptions(q.answer, possibleAnswersForThisQuestion);
        });

        // Add to wrong attempts - using correctAnswer to indicate player failed to hit correct target
        const alreadyRegistered = Array.from(this.wrongAttempts).some(
            attempt => attempt.question === this.currentQuestion && attempt.attemptedAnswer === correctAnswer
        );

        if (!alreadyRegistered) {
            this.wrongAttempts.add({
                orderOfAppearance: this.questionOrder,
                question: this.currentQuestion,
                attemptedAnswer: correctAnswer, // The answer they should have hit but didn't
            });
        }

        console.log("wrongAttempts after egg hit: ", this.wrongAttempts);
        console.log("questionsToRetry after egg hit: ", this.questionsToRetry);

        // Speed up all snowmen
        this.tracks.forEach(track => {
            track.snowmanSmall.speed += 10;
        });
    }

}
