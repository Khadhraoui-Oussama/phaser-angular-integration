import Phaser from 'phaser';
import { ResponsiveGameUtils } from '../utils/ResponsiveGameUtils';
import { languageManager } from '../utils/LanguageManager';
import { AudioManager } from '../utils/AudioManager';
import { Player } from './Player';
import PlayerBullet from './PlayerBullet';
import EnemyBullet from './EnemyBullet';
import Answer, { AnswerData } from './Answer';
import { QuestionData, AnswerOption, QuestionsJsonData, LevelData, EduSpaceWrongAttempt, EduSpaceAttempt } from '../models/Types';
import EnemySpaceship from './EnemySpaceship';

export default class MainGame extends Phaser.Scene {
    private background!: Phaser.GameObjects.Image;
    private titleText!: Phaser.GameObjects.Text;
    private settingsButton!: Phaser.GameObjects.Container;
    private languageChangeUnsubscribe?: () => void;
    private selectedLevel?: number;
    private player!: Player;
    private playerBullets!: Phaser.Physics.Arcade.Group;
    private enemyBullets!: Phaser.Physics.Arcade.Group;
    private answers: Answer[] = [];
    private isCurrentlyFullscreen: boolean = false;
    
    // UI Elements
    private energyDisplay!: Phaser.GameObjects.Container;
    private energyDisplayImage!: Phaser.GameObjects.Image;
    private energyText!: Phaser.GameObjects.Text;
    private scorePanel!: Phaser.GameObjects.Container;
    private scorePanelImage!: Phaser.GameObjects.Image;
    private scoreText!: Phaser.GameObjects.Text;
    private scoreLabelText!: Phaser.GameObjects.Text;
    
    private currentScore: number = 0;
    private currentEnergy: number = 100;
    private maxEnergy: number = 100;
    private gameState: 'playing' | 'gameOver' = 'playing';
    
    private energyLossWrongAnswer: number = 5;
    private energyLossEnemyBullet: number = 10;
    private energyLossEnemyShip: number = 20;
    
    private scoreCorrectAnswer: number = 2; // Deprecated: now using currentQuestion.points
    private scoreEnemyKill: number = 1;
    
    // Question system properties
    private questionContainer!: Phaser.GameObjects.Container;
    private questionText!: Phaser.GameObjects.Text;
    private questionImage?: Phaser.GameObjects.Image;
    private currentQuestion!: QuestionData;
    private questionOrder: number = 0;
    private questions: QuestionData[] = [];
    private gameStarted: boolean = false;
    
    private allLevels: LevelData[] = [];
    private currentLevel?: LevelData;
    private questionsJsonData?: QuestionsJsonData;
    
    private correctAnswersCount: number = 0;
    private totalQuestionsAnswered: number = 0;
    private nextLevelUnlocked: boolean = false;
    private nextLevelUnlockedText?: Phaser.GameObjects.Text;
    
    private answerSpawnTimers: Phaser.Time.TimerEvent[] = [];
    
   
    private allAttempts: EduSpaceAttempt[] = [];
    
    private questionsPerBackgroundChange: number = 2;
    private availableBackgrounds: string[] = ['bg2', 'bg3', 'bg4', 'bg5', 'bg6', 'bg7', 'bg8', 'bg9'];
    private usedBackgrounds: string[] = [];
    private currentBackgroundKey: string = 'bg2';
    
    private enemySpaceships: EnemySpaceship[] = [];
    private enemySpawnTimer?: Phaser.Time.TimerEvent;
    public enemySpaceshipSpeed: number = 50;
    
    // Victory screen text elements for localization updates
    private victoryScreenTexts?: {
        victoryText: Phaser.GameObjects.Text;
        missionText: Phaser.GameObjects.Text;
        scoreText: Phaser.GameObjects.Text;
        highScoreText?: Phaser.GameObjects.Text; // Optional since it might be a "new high score" text instead
        levelSelectText: Phaser.GameObjects.Text;
        menuText: Phaser.GameObjects.Text;
    };
    
    constructor() {
        super('MainGame');
    }

    init(data?: { selectedLevel?: number }) {
        if (data?.selectedLevel) {
            this.selectedLevel = data.selectedLevel;
            console.log("selectedLevel in MainGame:", data.selectedLevel);
        }
        
        this.gameState = 'playing';
        this.currentScore = 0;
        this.currentEnergy = 100;
        
        this.questionOrder = 0;
        this.gameStarted = false;
        
        this.correctAnswersCount = 0;
        this.totalQuestionsAnswered = 0;
        this.nextLevelUnlocked = false;
        this.answerSpawnTimers = [];
        
        // Initialize all attempts tracking - load existing attempts from localStorage
        this.loadExistingAttempts();
    }
    
    private loadExistingAttempts(): void {
        try {
            // Load all attempts from localStorage (from all levels and game states)
            const allAttemptsKey = 'eduspace_all_attempts_global';
            const existingAttemptsJson = localStorage.getItem(allAttemptsKey);
            
            if (existingAttemptsJson) {
                this.allAttempts = JSON.parse(existingAttemptsJson);
                console.log(`Loaded ${this.allAttempts.length} existing attempts from localStorage`);
            } else {
                this.allAttempts = [];
                console.log('No existing attempts found, starting fresh');
            }
        } catch (error) {
            console.error('Error loading existing attempts:', error);
            this.allAttempts = [];
        }
    }
    
    private saveAttemptsToStorage(): void {
        try {
            // Save to global attempts storage to preserve across levels
            localStorage.setItem('eduspace_all_attempts_global', JSON.stringify(this.allAttempts));
        } catch (error) {
            console.error('Error saving attempts to storage:', error);
        }
    }
    
    // Utility method to clear all attempts (useful for testing/debugging)
    public clearAllAttempts(): void {
        this.allAttempts = [];
        localStorage.removeItem('eduspace_all_attempts_global');
        console.log('All attempts cleared from memory and localStorage');
    }
    
    private loadVolumeSettings(): void {
        // Use centralized AudioManager for consistent volume handling
        AudioManager.loadAndApplyVolume(this);
    }
    
    /**
     * Save volume settings to both localStorage and Phaser registry
     * This ensures audio preferences persist across sessions and scenes
     */
    private saveVolumeSettings(volume: number): void {
        AudioManager.saveVolume(this, volume);
    }
    
    /**
     * Update volume and save preferences
     * Public method that can be called from other scenes or components
     */
    public updateVolumeSettings(newVolume: number): void {
        AudioManager.updateVolume(this, newVolume);
    }

    create(): void {
        this.scene.manager.scenes.forEach(scene => {
            if (scene.scene.key !== 'MainGame' && scene.scene.isActive()) {
                scene.scene.stop();
            }
        });
        
        // Load and apply saved volume settings
        this.loadVolumeSettings();
        
        const bgMusic = this.sound.get('main_music');
        if (!bgMusic || !bgMusic.isPlaying) {
            this.sound.play('main_music', { loop: true, volume: 0.4 });
        }
        
        const { width, height, centerX, centerY } = ResponsiveGameUtils.getResponsiveConfig(this);

        ResponsiveGameUtils.setupMobileInput(this);

        this.createBackground();

        this.createPlayer();
        
        this.createBulletGroups();

        this.setupPhysicsWorldBounds();

        this.setupEnemySpaceshipSystem();

        this.loadQuestionsFromJSON().then(() => {
            this.startQuestionSystem();
        });

        this.setupCollisionDetection();

        this.createTitle();

        this.createSettingsButton();

        this.createEnergyDisplay();

        this.createScorePanel();

        this.languageChangeUnsubscribe = languageManager.onLanguageChangeWithSceneCheck(this, () => {
            if (this.scoreLabelText) {
                this.scoreLabelText.setText(languageManager.getText('score'));
            }
            
            if (this.victoryScreenTexts) {
                this.victoryScreenTexts.victoryText.setText(languageManager.getText('victory_congratulations'));
                this.victoryScreenTexts.missionText.setText(languageManager.getText('victory_all_levels_completed'));
                this.victoryScreenTexts.scoreText.setText(`${languageManager.getText('final_score')}: ${this.currentScore}`);
                if (this.victoryScreenTexts.highScoreText) {
                    // Update high score text if it exists (not a new high score case)
                    const currentHighScore = this.getEduSpaceHighScore();
                    this.victoryScreenTexts.highScoreText.setText(`${languageManager.getText('high_score')}: ${currentHighScore}`);
                }
                this.victoryScreenTexts.levelSelectText.setText(languageManager.getText('victory_level_select'));
                this.victoryScreenTexts.menuText.setText(languageManager.getText('main_menu'));
            }
            
            if (this.nextLevelUnlockedText) {
                const unlockMessage = `${languageManager.getText('next_level_unlocked')} (80% achieved)\n${languageManager.getText('level_unlock_requirement')}`;
                this.nextLevelUnlockedText.setText(unlockMessage);
            }
        });

        ResponsiveGameUtils.setupResizeHandler(this, () => {
            this.handleResize();
        });
        
        this.setupFullscreenDetection();

        this.events.on('shutdown', () => {
            this.cleanup();
        });

        this.events.on('destroy', () => {
            this.cleanup();
        });
        
        // Handle pause/resume events for settings modal
        this.events.on('pause', () => {
            console.log('Game paused - settings opened');
            // Pause all timers and animations
            this.time.paused = true;
            this.tweens.pauseAll();
        });
        
        this.events.on('resume', () => {
            console.log('Game resumed - settings closed');
            this.time.paused = false;
            this.tweens.resumeAll();
        });
    }
   

    private createBackground(): void {
        const { width, height, centerX, centerY } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        this.background = this.add.image(centerX, centerY, this.currentBackgroundKey);
        this.background.setDisplaySize(width, height);
        this.background.setDepth(0);
        
        const overlay = this.add.image(centerX, centerY, 'overlay');
        overlay.setDisplaySize(width, height);
        overlay.setDepth(1);
    }

    /**
     * Get a random background that hasn't been used yet.
     * If all backgrounds have been used, reset the used list and pick randomly.
     */
    private getNextRandomBackground(): string {
        if (this.usedBackgrounds.length >= this.availableBackgrounds.length) {
            this.usedBackgrounds = [];
            console.log('All backgrounds used, resetting cycle');
        }
        
        const unusedBackgrounds = this.availableBackgrounds.filter(bg => 
            !this.usedBackgrounds.includes(bg) && bg !== this.currentBackgroundKey
        );
        
        const backgroundsToChooseFrom = unusedBackgrounds.length > 0 ? unusedBackgrounds : this.availableBackgrounds;
        
        const randomIndex = Math.floor(Math.random() * backgroundsToChooseFrom.length);
        const nextBackground = backgroundsToChooseFrom[randomIndex];
        
        this.usedBackgrounds.push(nextBackground);
        
        return nextBackground;
    }

    /**
     * Animate background change with fade in/out effect
     */
    private changeBackgroundAnimated(): void {
        const nextBackgroundKey = this.getNextRandomBackground();
        
        if (nextBackgroundKey === this.currentBackgroundKey) {
            console.log('Background is the same, skipping animation');
            return;
        }
        
        console.log(`Changing background from ${this.currentBackgroundKey} to ${nextBackgroundKey}`);
        
        const { width, height, centerX, centerY } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        const newBackground = this.add.image(centerX, centerY, nextBackgroundKey);
        newBackground.setDisplaySize(width, height);
        newBackground.setDepth(0);
        newBackground.setAlpha(0);
        
        this.tweens.add({
            targets: this.background,
            alpha: 0,
            duration: 800,
            ease: 'Power2.easeInOut'
        });
        
        const bgChangeDurationMS = 1000
        this.tweens.add({
            targets: newBackground,
            alpha: 1,
            duration: bgChangeDurationMS,
            ease: 'Power2.easeInOut',
            onComplete: () => {
                this.background.destroy();
                this.background = newBackground;
                this.currentBackgroundKey = nextBackgroundKey;
                console.log(`Background changed to ${nextBackgroundKey}`);
            }
        });
    }

    /**
     * Check if background should change based on question count
     */
    private checkForBackgroundChange(): void {
        if (this.questionOrder > 0 && this.questionOrder % this.questionsPerBackgroundChange === 0) {
            console.log(`Question ${this.questionOrder}: Time to change background!`);
            this.changeBackgroundAnimated();
        }
    }

    private createPlayer(): void {
        const { width, height } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        this.player = new Player(this, width / 8, height * 0.5);
        
        this.events.on('player-shoot', (data: { x: number; y: number; direction: { x: number; y: number } }) => {
            const bullet = this.playerBullets.get() as PlayerBullet;
            if (bullet) {
                bullet.fire(data.x, data.y, data.direction);
                console.log('Player bullet created at:', data.x, data.y, 'Direction:', data.direction);
            } else {
                console.warn('Could not get bullet from pool (pool might be full)');
            }
        });
        
        this.events.on('player-destroyed', () => {
            console.log('Player destroyed - Game Over');
        });
        
        this.events.on('player-life-lost', (remainingLives: number) => {
            console.log('Player lost a life. Remaining lives:', remainingLives);
        });
    }
    
    private createBulletGroups(): void {
        this.playerBullets = this.physics.add.group({
            classType: PlayerBullet,
            maxSize: 20,
            runChildUpdate: true
        });
        
        this.enemyBullets = this.physics.add.group({
            classType: EnemyBullet,
            maxSize: 30,
            runChildUpdate: true
        });
    }
    
    private setupPhysicsWorldBounds(): void {
        const { width, height } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        this.physics.world.setBounds(0, 0, width, height);
        console.log(`Physics world bounds set to: ${width}x${height}`);
    }
    
    private setupFullscreenDetection(): void {
        this.isCurrentlyFullscreen = !!(document.fullscreenElement || 
            (document as any).webkitFullscreenElement || 
            (document as any).mozFullScreenElement || 
            (document as any).msFullscreenElement);
        
        const fullscreenEvents = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
        
        fullscreenEvents.forEach(eventName => {
            document.addEventListener(eventName, () => {
                const newFullscreenState = !!(document.fullscreenElement || 
                    (document as any).webkitFullscreenElement || 
                    (document as any).mozFullScreenElement || 
                    (document as any).msFullscreenElement);
                
                if (newFullscreenState !== this.isCurrentlyFullscreen) {
                    this.isCurrentlyFullscreen = newFullscreenState;
                    this.handleFullscreenChange(newFullscreenState);
                }
            });
        });
        
        console.log(`Fullscreen detection setup. Initial state: ${this.isCurrentlyFullscreen}`);
    }
    
    private handleFullscreenChange(isFullscreen: boolean): void {
        console.log(`Fullscreen state changed: ${isFullscreen}`);
        
        this.answers.forEach(answer => {
            if (answer && answer.active) {
                answer.updateFullscreenScale(isFullscreen);
            }
        });
    }
    
    private setupCollisionDetection(): void {
        this.events.on('answer-collision', (data: { answer: Answer; isCorrect: boolean; content: string }) => {
            console.log(`Answer collision detected: "${data.content}", correct: ${data.isCorrect}`);
            
            const answerIndex = this.answers.indexOf(data.answer);
            if (answerIndex === -1) {
                console.log('Answer already processed, ignoring duplicate collision event');
                return;
            }
            
            this.answers.splice(answerIndex, 1);
            
            if (data.isCorrect) {
                this.handleCorrectAnswer(data.answer);
            } else {
                this.handleWrongAnswer(data.answer);
            }
        });

        this.events.on('answer-off-screen', (data: { answer: Answer; content: string; isCorrect: boolean }) => {
            console.log(`Answer went off-screen: "${data.content}", correct: ${data.isCorrect}`);
            
            const index = this.answers.indexOf(data.answer);
            if (index > -1) {
                this.answers.splice(index, 1);
            }
            
            this.checkAndRespawnAnswers();
        });
       
        this.setupPlayerEnemyBulletCollisions();
    }

    

    private setupPlayerEnemyBulletCollisions(): void {
        this.physics.add.overlap(
            this.player,
            this.enemyBullets,
            this.handlePlayerEnemyBulletCollision,
            undefined,
            this
        );
        
        console.log('Player vs enemy bullet collision detection setup');
    }

    private handlePlayerBulletEnemyCollision(object1: any, object2: any): void {
        const bullet = object1 as PlayerBullet;
        const spaceship = object2 as EnemySpaceship;
        
        // Skip if spaceship is already flashing (being destroyed)
        if (spaceship.getIsFlashing()) {
            return;
        }
        
        console.log('Player bullet hit enemy spaceship!');
        
        if (bullet.explode) {
            bullet.explode();
        }
        
        // Flash red before destroying the spaceship
        spaceship.flashRed(() => {
            // This callback runs after the flash effect completes
            spaceship.destroy();
            
            const index = this.enemySpaceships.indexOf(spaceship);
            if (index > -1) {
                this.enemySpaceships.splice(index, 1);
            }
        });
        
        this.addScore(this.scoreEnemyKill);
        
        this.sound.play('hit_enemy', { volume: 0.3 });
    }

    private handlePlayerEnemyBulletCollision(object1: any, object2: any): void {
        const player = object1 as Player;
        const bullet = object2 as EnemyBullet;
        
        console.log('=== COLLISION DETECTED ===');
        console.log(`Player position: (${player.x}, ${player.y})`);
        console.log(`Bullet position: (${bullet.x}, ${bullet.y})`);
        
        // Check physics body positions
        const playerBody = player.body as Phaser.Physics.Arcade.Body;
        const bulletBody = bullet.body as Phaser.Physics.Arcade.Body;
        
        if (playerBody && bulletBody) {
            console.log(`Player body center: (${playerBody.center.x}, ${playerBody.center.y})`);
            console.log(`Player body bounds: left=${playerBody.left}, right=${playerBody.right}, top=${playerBody.top}, bottom=${playerBody.bottom}`);
            console.log(`Bullet body center: (${bulletBody.center.x}, ${bulletBody.center.y})`);
            console.log(`Bullet body bounds: left=${bulletBody.left}, right=${bulletBody.right}, top=${bulletBody.top}, bottom=${bulletBody.bottom}`);
            console.log(`Distance between centers: ${Phaser.Math.Distance.Between(playerBody.center.x, playerBody.center.y, bulletBody.center.x, bulletBody.center.y)}`);
        }
        
        console.log(`Bullet has hit target: ${bullet.getHasHitTarget()}`);
        console.log(`Bullet is exploding: ${bullet.getIsExploding()}`);
        console.log(`Bullet active: ${bullet.active}`);
        
        if (bullet.getHasHitTarget() || bullet.getIsExploding() || !bullet.active) {
            console.log('Collision ignored - bullet already processed');
            return;
        }
        
        console.log('Processing bullet collision with player!');
        
        if (bullet.explode) {
            bullet.explode();
        }
        
        const playerDied = player.takeDamage(20);
        
        this.removeEnergy(this.energyLossEnemyBullet);
        
        if (this.currentEnergy <= 0) {
            this.triggerGameOver();
        }
        
        console.log('=== END COLLISION ===');
    }
    
    private handleCorrectAnswer(answer: Answer): void {
        console.log('=== CORRECT ANSWER SELECTED ===');
        console.log(`Answer: "${answer.getContent()}" | Score: +${this.currentQuestion.points}`);
        
        // Record the attempt
        const attempt: EduSpaceAttempt = {
            orderOfAppearance: this.questionOrder + 1,
            questionData: this.currentQuestion,
            attemptedAnswer: answer.getContent(),
            isCorrect: true,
            pointsEarned: this.currentQuestion.points
        };
        this.allAttempts.push(attempt);
        
        // Save attempts to prevent data loss
        this.saveAttemptsToStorage();
        
        this.sound.play('hit_correct', { volume: 0.5 });
        
        this.addScore(this.currentQuestion.points);
        
        this.correctAnswersCount++;
        this.totalQuestionsAnswered++;
        
        console.log(`Progress: ${this.correctAnswersCount}/${this.totalQuestionsAnswered} correct answers`);
        
        this.checkLevelUnlockCondition();
        
        this.clearCurrentAnswers();
        
        const loadNextQuestionDelayMS = 500;
        this.time.delayedCall(loadNextQuestionDelayMS, () => {
            this.loadNextQuestion();
        });
    }
    
    private handleWrongAnswer(answer: Answer): void {
        console.log('=== WRONG ANSWER SELECTED ===');
        console.log(`Answer: "${answer.getContent()}" | Score: -1 | Energy: -${this.energyLossWrongAnswer}`);
        
        // Record the attempt
        const attempt: EduSpaceAttempt = {
            orderOfAppearance: this.questionOrder + 1,
            questionData: this.currentQuestion,
            attemptedAnswer: answer.getContent(),
            isCorrect: false,
            pointsEarned: -1
        };
        
        // Check if this exact attempt already exists to prevent duplicates
        const alreadyRegistered = this.allAttempts.some(
            existingAttempt => 
                existingAttempt.questionData === this.currentQuestion && 
                existingAttempt.attemptedAnswer === answer.getContent()
        );

        if (!alreadyRegistered) {
            this.allAttempts.push(attempt);
            // Save attempts to prevent data loss
            this.saveAttemptsToStorage();
        }

        this.sound.play('shoot_laser', { volume: 0.3 });
        
        this.addScore(-1);
        
        if (this.player) {
            this.removeEnergy(this.energyLossWrongAnswer);
            console.log(`Player energy reduced to: ${this.currentEnergy}`);
            
            if (this.currentEnergy <= 0) {
                this.triggerGameOver();
                return;
            }
        }
        
        this.clearCurrentAnswers();
        
        const respawnAnswersDelayMS = 500;
        this.time.delayedCall(respawnAnswersDelayMS, () => {
            this.respawnCurrentQuestionAnswers();
        });
    }

    // Question system methods
    private async loadQuestionsFromJSON(): Promise<void> {
        try {
            console.log('=== LOADING QUESTIONS FROM JSON ===');
            
            // Load the questions.json file
            const response = await fetch('assets/games/Eduspace/questions.json');
            if (!response.ok) {
                throw new Error(`Failed to load questions.json: ${response.status}`);
            }
            
            this.questionsJsonData = await response.json() as QuestionsJsonData;
            this.allLevels = this.questionsJsonData.levels;
            
            console.log(`Loaded ${this.allLevels.length} levels from JSON`);
            this.allLevels.forEach(level => {
                console.log(`Level ${level.levelId}: ${level.levelName} (Difficulty: ${level.difficulty}/5, ${level.questions.length} questions)`);
            });
            
            // Set the current level based on selected level or default to first level
            const levelId = this.selectedLevel || 1;
            this.currentLevel = this.allLevels.find(level => level.levelId === levelId);
            
            if (!this.currentLevel) {
                console.warn(`Level ${levelId} not found, using first available level`);
                this.currentLevel = this.allLevels[0];
            }
            
            if (this.currentLevel) {
                this.questions = this.currentLevel.questions;
                console.log(`Selected Level: ${this.currentLevel.levelName}`);
                console.log(`Questions for this level: ${this.questions.length}`);
                
                // Debug: Log all questions in this level
                console.log('=== ALL QUESTIONS IN THIS LEVEL ===');
                this.questions.forEach((question, index) => {
                    console.log(`Question ${index + 1}: ID=${question.id}, Text="${question.media.text}"`);
                });
                console.log('=== END QUESTION LIST ===');
            } else {
                throw new Error('No levels available in questions.json');
            }
            
        } catch (error) {
            console.error('Error loading questions from JSON:', error);
            
            // Fallback to hardcoded questions if JSON loading fails
            console.log('Falling back to hardcoded questions...');
            this.initializeFallbackQuestions();
        }
    }

    private initializeFallbackQuestions(): void {
        // Fallback questions in case JSON loading fails
        this.questions = [
            {
                id: 1,
                media: {
                    text: "What is 2+2?",
                    audio: null,
                    image: null
                },
                answers: [
                    { type: "text", value: "3", correct: false, url: null },
                    { type: "text", value: "4", correct: true, url: null },
                    { type: "text", value: "5", correct: false, url: null },
                    { type: "text", value: "6", correct: false, url: null }
                ],
                points: 10,
                langue: "en",
                difficultyLevel: 1
            },
            {
                id: 2,
                media: {
                    text: "Which animal is shown in the image?",
                    audio: null,
                    image: "https://hips.hearstapps.com/hmg-prod/images/dog-puppy-on-garden-royalty-free-image-1586966191.jpg?crop=1xw:0.74975xh;0,0.190xh"
                },
                answers: [
                    { type: "text", value: "Cat", correct: false, url: null },
                    { type: "text", value: "Dog", correct: true, url: null },
                    { type: "text", value: "Bird", correct: false, url: null },
                    { type: "text", value: "Fish", correct: false, url: null }
                ],
                points: 15,
                langue: "en",
                difficultyLevel: 1
            },
            {
                id: 3,
                media: {
                    text: "Which one is a car?",
                    audio: null,
                    image: null
                },
                answers: [
                    { type: "image", value: "Car", correct: true, url: "https://hips.hearstapps.com/hmg-prod/images/2025-ford-mustang-60th-anniversary-exterior-66227932bb88e.jpg?crop=0.793xw:1.00xh;0.106xw,0&resize=2048:*" },
                    { type: "image", value: "Dog", correct: false, url: "https://hips.hearstapps.com/hmg-prod/images/dog-puppy-on-garden-royalty-free-image-1586966191.jpg?crop=1xw:0.74975xh;0,0.190xh" },
                    { type: "image", value: "Cat", correct: false, url: "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcQK1dXQrVCbBvMdU4A83XdwM7Rtte8YFsWFI-y5JLABKyTRyUTBQko0SqyrqNJQf96aNdEqLNo5eZglqCIH2udWwuewokYR5-0QnjucNq4Y5Q" },
                    { type: "image", value: "Ant", correct: false, url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRUlYUm6-xKlW-L0jMgV4713KRacmJfEbIkyQ&s" }
                ],
                points: 20,
                langue: "en",
                difficultyLevel: 2
            }
        ];
        
        console.log(`Initialized ${this.questions.length} fallback questions`);
    }

    private startQuestionSystem(): void {
        console.log('=== STARTING QUESTION SYSTEM ===');
        console.log(`Total questions available: ${this.questions.length}`);
        console.log('Question system initialized with proper answer spawning');
        
        // Mark game as started
        this.gameStarted = true;
        
        // Start with the first question
        this.questionOrder = -1; // Will be incremented to 0 in loadNextQuestion
        this.loadNextQuestion();
    }

    private createQuestionUI(questionTextValue: string, imageUrl?: string): void {
        if (this.questionContainer) {
            this.questionContainer.destroy();
        }
        
        const { width, height, centerX } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        this.questionContainer = this.add.container(centerX, 0).setDepth(1000);

        // Use the ui_element_large SVG as background
        const bgImage = this.add.image(0, 0, 'ui_element_large').setOrigin(0.5, 0);
        
        // Scale background for different screen sizes
        const { config } = ResponsiveGameUtils.getResponsiveConfig(this);
        let bgScale = 1.0; // Default desktop scale
        
        if (config.screenSize === 'mobile') {
            bgScale = 0.5; // Smaller scale for mobile
        } else if (config.screenSize === 'tablet') {
            bgScale = 0.7; // Medium scale for tablet
        }
        
        bgImage.setScale(bgScale);
        this.questionContainer.add(bgImage);

        // Create question text
        this.questionText = this.add.text(0, bgImage.height * bgScale * 0.3, questionTextValue, 
            ResponsiveGameUtils.getTextStyle(24, this, {
                align: 'center',
                wordWrap: { width: bgImage.width * bgScale * 0.8 }
            })
        ).setOrigin(0.5, 0.5);
        
        this.questionContainer.add(this.questionText);

        // Add question image if provided
        if (imageUrl) {
            this.loadQuestionImage(imageUrl, bgImage, bgScale);
        }
    }

    private loadQuestionImage(imageUrl: string, bgImage: Phaser.GameObjects.Image, bgScale: number): void {
        const imageKey = `question_image_${this.currentQuestion.id}`;
        
        // Check if image is already loaded
        if (this.textures.exists(imageKey)) {
            this.createQuestionImage(imageKey, bgImage, bgScale);
        } else {
            // Load the image dynamically
            this.load.image(imageKey, imageUrl);
            this.load.once('complete', () => {
                this.createQuestionImage(imageKey, bgImage, bgScale);
            });
            this.load.start();
        }
    }

    private createQuestionImage(imageKey: string, bgImage: Phaser.GameObjects.Image, bgScale: number): void {
        if (!this.textures.exists(imageKey)) {
            console.warn(`Image with key ${imageKey} not found`);
            return;
        }

        this.questionImage = this.add.image(0, bgImage.height * bgScale * 0.7, imageKey);
        
        // Scale the image to fit within the background
        const maxWidth = bgImage.width * bgScale * 0.6;
        const maxHeight = bgImage.height * bgScale * 0.4;
        const imageScale = Math.min(maxWidth / this.questionImage.width, maxHeight / this.questionImage.height);
        this.questionImage.setScale(imageScale);
        
        this.questionContainer.add(this.questionImage);
    }

    private loadNextQuestion(): void {
        // Don't load next question if game is over
        if (this.gameState === 'gameOver') {
            console.log('Game is over, not loading next question');
            return;
        }
        
        if (!this.questions || this.questions.length === 0) {
            console.error("Questions not initialized correctly:", this.questions);
            return;
        }

        // Clear existing answers and timers FIRST
        this.clearCurrentAnswers();

        this.questionOrder++;
        console.log(`=== LOADING QUESTION ${this.questionOrder + 1}/${this.questions.length} ===`);
        console.log(`Debug: questionOrder=${this.questionOrder}, questions.length=${this.questions.length}`);
        
        // Check if background should change
        this.checkForBackgroundChange();
        
        if (this.questionOrder >= this.questions.length) {
            console.log('All questions completed!');
            console.log(`Debug: Triggering levelCompleted because questionOrder (${this.questionOrder}) >= questions.length (${this.questions.length})`);
            this.levelCompleted();
            return;
        }

        this.currentQuestion = this.questions[this.questionOrder];
        console.log('Current question:', {
            id: this.currentQuestion.id,
            text: this.currentQuestion.media.text,
            answerCount: this.currentQuestion.answers.length,
            hasImage: !!this.currentQuestion.media.image
        });

        // Create question UI
        const questionText = this.currentQuestion.media.text;
        const questionImage = this.currentQuestion.media.image;
        
        this.createQuestionUI(questionText, questionImage || undefined);
        
        // Spawn answers for this specific question
        this.spawnAnswersFromQuestion(this.currentQuestion.answers);
    }

    private spawnAnswersFromQuestion(answerOptions: AnswerOption[]): void {
        // Don't spawn if game is over
        if (this.gameState === 'gameOver') {
            return;
        }
        
        console.log(`Spawning ${answerOptions.length} answers for current question`);
        
        // Clear any existing spawn timers first
        this.clearAnswerSpawnTimers();
        
        // Convert AnswerOptions to AnswerData format
        const answerDataArray: AnswerData[] = answerOptions.map(option => ({
            content: option.type === 'image' && option.url ? option.url : option.value,
            isCorrect: option.correct,
            isImage: option.type === 'image',
            isUrl: option.type === 'image' && !!option.url
        }));

        // Spawn answers with delay and store timer references
        const answerSpawnDelayMS = 2500; 
        answerDataArray.forEach((answerData, index) => {
            const timer = this.time.delayedCall(index * answerSpawnDelayMS, () => {
                // Double-check game state before spawning each answer
                if (this.gameState === 'gameOver') {
                    return;
                }
                
                const yPosition = Answer.getRandomYPosition(this);
                const answer = new Answer(this, answerData, yPosition);
                this.answers.push(answer);
                
                // Apply current fullscreen state to new answer
                if (this.isCurrentlyFullscreen) {
                    answer.updateFullscreenScale(true);
                }
                
                console.log(`Answer ${index + 1}/${answerOptions.length} spawned: "${answerData.content}" at Y: ${yPosition} (Correct: ${answerData.isCorrect})`);
                
                // Remove this timer from the active list
                const timerIndex = this.answerSpawnTimers.indexOf(timer);
                if (timerIndex > -1) {
                    this.answerSpawnTimers.splice(timerIndex, 1);
                }
            });
            
            // Store the timer reference
            this.answerSpawnTimers.push(timer);
        });
        
        console.log(`All ${answerOptions.length} answers scheduled to spawn over ${(answerOptions.length - 1) * answerSpawnDelayMS}ms`);
    }

    /**
     * Respawn the current question's answers without changing the question.
     * This is used when wrong answers are selected or answers go off-screen.
     */
    private respawnCurrentQuestionAnswers(): void {
        // Don't respawn if game is over or no current question
        if (this.gameState === 'gameOver' || !this.currentQuestion) {
            return;
        }
        
        console.log('=== RESPAWNING CURRENT QUESTION ANSWERS ===');
        console.log(`Respawning answers for question: "${this.currentQuestion.media.text}"`);
        
        // Spawn the same question's answers again
        this.spawnAnswersFromQuestion(this.currentQuestion.answers);
    }

    /**
     * Check if we need to respawn answers for the current question.
     * This is called when answers go off-screen to ensure the question continues
     * until the correct answer is selected.
     */
    private checkAndRespawnAnswers(): void {
        // Don't respawn if game is over or no current question
        if (this.gameState === 'gameOver' || !this.currentQuestion) {
            return;
        }
        
        // Check if there are any active answers remaining
        const activeAnswers = this.answers.filter(answer => answer && answer.active);
        
        console.log(`Active answers remaining: ${activeAnswers.length}`);
        
        // If no answers are active and we're still on a question, respawn them
        if (activeAnswers.length === 0) {
            console.log('No active answers remaining, respawning current question answers...');
            
            // Add a small delay before respawning to avoid immediate overlap
            const respawnDelayMS = 1000;
            this.time.delayedCall(respawnDelayMS, () => {
                this.respawnCurrentQuestionAnswers();
            });
        }
    }

    private clearCurrentAnswers(): void {
        console.log(`Clearing ${this.answers.length} active answers`);

        // Clear any pending answer spawn timers first
        this.clearAnswerSpawnTimers();
        
        // Clear existing answers
        let clearedCount = 0;
        this.answers.forEach(answer => {
            if (answer && answer.active) {
                answer.destroy();
                clearedCount++;
            }
        });
        this.answers = [];
        
        console.log(`Successfully cleared ${clearedCount} answers`);
    }

    private clearAnswerSpawnTimers(): void {
        console.log(`Clearing ${this.answerSpawnTimers.length} pending answer spawn timers`);
        
        this.answerSpawnTimers.forEach(timer => {
            if (timer && !timer.hasDispatched) {
                timer.destroy();
            }
        });
        this.answerSpawnTimers = [];
        
        console.log('All answer spawn timers cleared');
    }

    private levelCompleted(): void {
        console.log('=== LEVEL COMPLETED ===');
        console.log('All questions completed successfully!');
        console.log(`Final Score: ${this.currentScore}`);
        console.log(`Questions Answered: ${this.totalQuestionsAnswered}/${this.questions.length}`);
        console.log(`Correct Answers: ${this.correctAnswersCount}/${this.questions.length}`);
        
        // Save all attempts to localStorage for review
        if (this.allAttempts.length > 0) {
            // Save to global attempts storage (used by ReviewAttempts scene)
            localStorage.setItem('eduspace_all_attempts_global', JSON.stringify(this.allAttempts));
            console.log(`Saved ${this.allAttempts.length} total attempts globally`);
            
            console.log('All Attempts Structure:', this.allAttempts);
        }
        
        // Check and unlock next level based on 80% accuracy
        const totalQuestions = this.questions.length;
        const accuracyPercentage = (this.correctAnswersCount / totalQuestions) * 100;
        
        if (accuracyPercentage >= 80) {
            const nextLevelId = (this.selectedLevel || 1) + 1;
            localStorage.setItem(`eduspace_level_${nextLevelId}_unlocked`, 'true');
            this.nextLevelUnlocked = true;
            console.log(`Next level ${nextLevelId} unlocked with ${accuracyPercentage.toFixed(1)}% accuracy`);
        }
        
        // Stop all game elements
        this.clearCurrentAnswers();
        this.clearEnemySpaceships();
        
        if (this.questionContainer) {
            this.questionContainer.destroy();
        }
        
        // Mark current level as completed and update high score
        this.markCurrentLevelCompleted();
        
        // Check if player answered ALL questions correctly (100% completion)
        const allQuestionsCorrect = this.correctAnswersCount === totalQuestions;
        
        console.log(`Level completion check: correctAnswersCount=${this.correctAnswersCount}, totalQuestions=${totalQuestions}, allQuestionsCorrect=${allQuestionsCorrect}`);
        
        // Check if there's a next level
        const nextLevelId = (this.currentLevel?.levelId || 1) + 1;
        const nextLevel = this.allLevels.find(level => level.levelId === nextLevelId);
        
        // Check if next level is unlocked using localStorage
        const isNextLevelUnlocked = localStorage.getItem(`eduspace_level_${nextLevelId}_unlocked`) === 'true';
        
        console.log(`Next level check: nextLevelId=${nextLevelId}, exists=${!!nextLevel}, unlocked=${isNextLevelUnlocked}, accuracy=${accuracyPercentage.toFixed(1)}%`);
        
        // Check if this is the last level completed with 100% accuracy
        const isLastLevel = !nextLevel; // No next level means this is the last one
        const isGameCompleted = isLastLevel && allQuestionsCorrect;
        
        if (isGameCompleted) {
            // Show victory screen for completing all levels with 100% accuracy
            console.log(`=== GAME COMPLETED! ALL LEVELS FINISHED WITH 100% ACCURACY ===`);
            this.time.delayedCall(2000, () => {
                this.showVictoryScreen();
            });
        } else if (nextLevel && isNextLevelUnlocked && allQuestionsCorrect) {
            // Transition to next level only if ALL questions were answered correctly (100%)
            console.log(`=== TRANSITIONING TO LEVEL ${nextLevelId} (ALL QUESTIONS CORRECT - 100% COMPLETION) ===`);
            this.time.delayedCall(2000, () => {
                this.scene.restart({ selectedLevel: nextLevelId });
            });
        } else {
            // Level completed but not transitioning anywhere - just log the completion status
            if (nextLevel && isNextLevelUnlocked && !allQuestionsCorrect) {
                console.log(`=== LEVEL COMPLETED (${this.correctAnswersCount}/${totalQuestions} correct - need 100% for auto-progression) ===`);
            } else if (nextLevel && !isNextLevelUnlocked) {
                console.log(`=== LEVEL COMPLETED (Next level not unlocked - need 80% accuracy) ===`);
            } else {
                console.log('=== LEVEL COMPLETED (No next level available) ===');
            }
            
            // Instead of transitioning to level select, just stay in the current scene
            // The user can use the back button to return to the main menu if they want to
            console.log('=== STAYING IN CURRENT SCENE - Use back button to return to main menu ===');
        }
    }

    private triggerGameOver(): void {
        if (this.gameState === 'gameOver') {
            return; // Already in game over state
        }
        
        this.gameState = 'gameOver';
        console.log('=== GAME OVER - ENERGY DEPLETED ===');
        console.log(`Final Score: ${this.currentScore}`);
        
        // Save all attempts to localStorage for review
        if (this.allAttempts.length > 0) {
            // Save to global attempts storage (used by ReviewAttempts scene)
            localStorage.setItem('eduspace_all_attempts_global', JSON.stringify(this.allAttempts));
            console.log(`Saved ${this.allAttempts.length} total attempts globally (game over)`);
            
            console.log('All Attempts Structure:', this.allAttempts);
        }
        
        // Stop all game elements
        this.clearCurrentAnswers();
        this.clearEnemySpaceships();
        
        // Stop the player from moving/shooting
        if (this.player) {
            this.player.setActive(false);
        }
        
        // Clear question UI
        if (this.questionContainer) {
            this.questionContainer.destroy();
        }
        
        // Show game over UI
        this.showGameOverScreen();
    }

    private showGameOverScreen(): void {
        const { width, height, centerX, centerY } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        // Create main container
        const gameOverContainer = this.add.container(centerX, centerY);
        gameOverContainer.setDepth(2000);
        
        // Create background using ui_element_small scaled up
        const baseScale = Math.max(width / 400, height / 300) * 0.8;
        const bgScale = Math.min(baseScale, 2.2); // Cap at 2.2x scale to prevent oversizing in fullscreen
        const backgroundPanel = this.add.image(0, 0, 'ui_element_small');
        backgroundPanel.setScale(bgScale);
        backgroundPanel.setAlpha(0.95); // Slightly transparent
        gameOverContainer.add(backgroundPanel);
        
        // Game Over text
        const gameOverText = this.add.text(0, -120, languageManager.getText('mission_failed'), {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ff4444',
            fontStyle: 'bold',
            align: 'center'
        });
        gameOverText.setOrigin(0.5);
        gameOverText.setShadow(3, 3, '#000000', 6, true, false);
        gameOverContainer.add(gameOverText);
        
        // Energy depleted text
        const energyText = this.add.text(0, -60, languageManager.getText('energy_depleted'), {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center'
        });
        energyText.setOrigin(0.5);
        energyText.setShadow(2, 2, '#000000', 4, true, false);
        gameOverContainer.add(energyText);
        
        // Final score text
        const scoreText = this.add.text(0, -20, `${languageManager.getText('final_score')}: ${this.currentScore}`, {
            fontSize: '28px',
            fontFamily: 'Arial',
            color: '#ffff44',
            fontStyle: 'bold',
            align: 'center'
        });
        scoreText.setOrigin(0.5);
        scoreText.setShadow(2, 2, '#000000', 4, true, false);
        gameOverContainer.add(scoreText);
        
        // High score or new high score text
        const currentHighScore = this.getEduSpaceHighScore();
        const isNewHigh = this.isNewHighScore();
        
        if (isNewHigh) {
            // Update high score before showing it
            this.updateEduSpaceHighScore(this.currentScore);
            
            // Show "NEW HIGH SCORE!" message
            const newHighScoreText = this.add.text(0, 20, languageManager.getText('new_high_score'), {
                fontSize: '24px',
                fontFamily: 'Arial',
                color: '#44ff44',
                fontStyle: 'bold',
                align: 'center'
            });
            newHighScoreText.setOrigin(0.5);
            newHighScoreText.setShadow(2, 2, '#000000', 4, true, false);
            gameOverContainer.add(newHighScoreText);
            
            // Add flashing animation for new high score
            this.tweens.add({
                targets: newHighScoreText,
                alpha: { from: 1, to: 0.5 },
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: 'Power2.easeInOut'
            });
        } else {
            // Show regular high score
            const highScoreText = this.add.text(0, 20, `${languageManager.getText('high_score')}: ${currentHighScore}`, {
                fontSize: '22px',
                fontFamily: 'Arial',
                color: '#88ff88',
                align: 'center'
            });
            highScoreText.setOrigin(0.5);
            highScoreText.setShadow(2, 2, '#000000', 4, true, false);
            gameOverContainer.add(highScoreText);
        }
        
        // Restart button using ui_element_large
        const restartButton = this.add.container(-80, 80);
        
        const restartBg = this.add.image(0, 0, 'ui_element_large');
        restartBg.setScale(0.7); // Slightly smaller to fit multiple buttons
        restartBg.setInteractive();
        
        const restartText = this.add.text(0, 0, languageManager.getText('restart_level'), {
            fontSize: '24px', // Adjusted font size
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center'
        });
        restartText.setOrigin(0.5);
        restartText.setShadow(2, 2, '#000000', 4, true, false);
        
        restartButton.add([restartBg, restartText]);
        gameOverContainer.add(restartButton);
        
        // Restart button hover effects
        restartBg.on('pointerover', () => {
            restartBg.setTint(0xcccccc);
            restartButton.setScale(1.05);
        });
        
        restartBg.on('pointerout', () => {
            restartBg.clearTint();
            restartButton.setScale(1.0);
        });
        
        restartBg.on('pointerdown', () => {
            this.sound.play('shoot_laser', { volume: 0.5 });
            this.restartLevel();
        });
        
        // Review Attempts button using ui_element_large
        const reviewButton = this.add.container(80, 80);
        
        const reviewBg = this.add.image(0, 0, 'ui_element_large');
        reviewBg.setScale(0.7); // Slightly smaller to fit multiple buttons
        reviewBg.setInteractive();
        reviewBg.setTint(0x4444ff); // Blue tint for review button
        
        const reviewText = this.add.text(0, 0, languageManager.getText('review_attempts_button'), {
            fontSize: '24px', // Adjusted font size
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center'
        });
        reviewText.setOrigin(0.5);
        reviewText.setShadow(2, 2, '#000000', 4, true, false);
        
        reviewButton.add([reviewBg, reviewText]);
        gameOverContainer.add(reviewButton);
        
        // Review button hover effects
        reviewBg.on('pointerover', () => {
            reviewBg.setTint(0x6666ff);
            reviewButton.setScale(1.05);
        });
        
        reviewBg.on('pointerout', () => {
            reviewBg.setTint(0x4444ff);
            reviewButton.setScale(1.0);
        });
        
        reviewBg.on('pointerdown', () => {
            this.sound.play('shoot_laser', { volume: 0.5 });
            this.scene.start('ReviewAttempts');
        });
        
        // Main menu button using ui_element_large
        const menuButton = this.add.container(0, 180); // Moved down to accommodate review button
        
        const menuBg = this.add.image(0, 0, 'ui_element_large');
        menuBg.setScale(0.7); // Consistent with other buttons
        menuBg.setInteractive();
        menuBg.setTint(0x888888); // Slightly darker tint for menu button
        
        const menuText = this.add.text(0, 0, languageManager.getText('main_menu'), {
            fontSize: '24px', // Consistent font size
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center'
        });
        menuText.setOrigin(0.5);
        menuText.setShadow(2, 2, '#000000', 4, true, false);
        
        menuButton.add([menuBg, menuText]);
        gameOverContainer.add(menuButton);
        
        // Menu button hover effects
        menuBg.on('pointerover', () => {
            menuBg.setTint(0xaaaaaa);
            menuButton.setScale(1.05);
        });
        
        menuBg.on('pointerout', () => {
            menuBg.setTint(0x888888);
            menuButton.setScale(1.0);
        });
        
        menuBg.on('pointerdown', () => {
            this.sound.play('shoot_laser', { volume: 0.5 });
            this.sound.stopAll();
            this.scene.start('MainMenu');
        });
    }

    private showVictoryScreen(): void {
        const { width, height, centerX, centerY } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        // Create main container
        const victoryContainer = this.add.container(centerX, centerY);
        victoryContainer.setDepth(2000);
        
        // Create background using ui_element_small scaled up
        const baseScale = Math.max(width / 400, height / 300) * 0.8;
        const bgScale = Math.min(baseScale, 2.2); // Cap at 2.2x scale to prevent oversizing in fullscreen
        const backgroundPanel = this.add.image(0, 0, 'ui_element_small');
        backgroundPanel.setScale(bgScale);
        backgroundPanel.setAlpha(0.95); // Slightly transparent
        backgroundPanel.setTint(0x44ff44); // Green for victory
        victoryContainer.add(backgroundPanel);
        
        // Victory text
        const victoryText = this.add.text(0, -140, languageManager.getText('victory_congratulations'), {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#44ff44',
            fontStyle: 'bold',
            align: 'center'
        });
        victoryText.setOrigin(0.5);
        victoryText.setShadow(3, 3, '#000000', 6, true, false);
        victoryContainer.add(victoryText);
        
        // Mission completed text
        const missionText = this.add.text(0, -80, languageManager.getText('victory_all_levels_completed'), {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center'
        });
        missionText.setOrigin(0.5);
        missionText.setShadow(2, 2, '#000000', 4, true, false);
        victoryContainer.add(missionText);
        
        // Final score text
        const scoreText = this.add.text(0, -50, `${languageManager.getText('final_score')}: ${this.currentScore}`, {
            fontSize: '28px',
            fontFamily: 'Arial',
            color: '#ffff44',
            fontStyle: 'bold',
            align: 'center'
        });
        scoreText.setOrigin(0.5);
        scoreText.setShadow(2, 2, '#000000', 4, true, false);
        victoryContainer.add(scoreText);
        
        // High score or new high score text for victory screen
        const currentHighScore = this.getEduSpaceHighScore();
        const isNewHigh = this.isNewHighScore();
        let highScoreText: Phaser.GameObjects.Text | undefined;
        
        if (isNewHigh) {
            
            this.updateEduSpaceHighScore(this.currentScore);
            
            
            const newHighScoreText = this.add.text(0, -10, languageManager.getText('new_high_score'), {
                fontSize: '24px',
                fontFamily: 'Arial',
                color: '#44ff44',
                fontStyle: 'bold',
                align: 'center'
            });
            newHighScoreText.setOrigin(0.5);
            newHighScoreText.setShadow(2, 2, '#000000', 4, true, false);
            victoryContainer.add(newHighScoreText);
            
            this.tweens.add({
                targets: newHighScoreText,
                alpha: { from: 1, to: 0.5 },
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: 'Power2.easeInOut'
            });
        } else {
            // Show regular high score
            highScoreText = this.add.text(0, -10, `${languageManager.getText('high_score')}: ${currentHighScore}`, {
                fontSize: '22px',
                fontFamily: 'Arial',
                color: '#88ff88',
                align: 'center'
            });
            highScoreText.setOrigin(0.5);
            highScoreText.setShadow(2, 2, '#000000', 4, true, false);
            victoryContainer.add(highScoreText);
        }
        
        // Level Select button using ui_element_large
        const levelSelectButton = this.add.container(-80, 90);
        
        const levelSelectBg = this.add.image(0, 0, 'ui_element_large');
        levelSelectBg.setScale(0.7); // Smaller to fit multiple buttons
        levelSelectBg.setInteractive();
        levelSelectBg.setTint(0x4444ff); // Blue tint for level select
        
        const levelSelectText = this.add.text(0, 0, languageManager.getText('victory_level_select'), {
            fontSize: '24px', // Adjusted font size
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center'
        });
        levelSelectText.setOrigin(0.5);
        levelSelectText.setShadow(2, 2, '#000000', 4, true, false);
        
        levelSelectButton.add([levelSelectBg, levelSelectText]);
        victoryContainer.add(levelSelectButton);
        
        // Level Select button hover effects
        levelSelectBg.on('pointerover', () => {
            levelSelectBg.setTint(0x6666ff);
            levelSelectButton.setScale(1.05);
        });
        
        levelSelectBg.on('pointerout', () => {
            levelSelectBg.setTint(0x4444ff);
            levelSelectButton.setScale(1.0);
        });
        
        levelSelectBg.on('pointerdown', () => {
            this.sound.play('shoot_laser', { volume: 0.5 });
            this.sound.stopAll();
            this.scene.start('LevelSelectScene');
        });
        
        // Review Attempts button using ui_element_large
        const reviewButton = this.add.container(80, 90);
        
        const reviewBg = this.add.image(0, 0, 'ui_element_large');
        reviewBg.setScale(0.7); // Smaller to fit multiple buttons
        reviewBg.setInteractive();
        reviewBg.setTint(0xff8800); // Orange tint for review button
        
        const reviewText = this.add.text(0, 0, languageManager.getText('review_attempts_button'), {
            fontSize: '24px', // Adjusted font size
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center'
        });
        reviewText.setOrigin(0.5);
        reviewText.setShadow(2, 2, '#000000', 4, true, false);
        
        reviewButton.add([reviewBg, reviewText]);
        victoryContainer.add(reviewButton);
        
        // Review button hover effects
        reviewBg.on('pointerover', () => {
            reviewBg.setTint(0xffaa44);
            reviewButton.setScale(1.05);
        });
        
        reviewBg.on('pointerout', () => {
            reviewBg.setTint(0xff8800);
            reviewButton.setScale(1.0);
        });
        
        reviewBg.on('pointerdown', () => {
            this.sound.play('shoot_laser', { volume: 0.5 });
            this.scene.start('ReviewAttempts');
        });
        
        // Main menu button using ui_element_large
        const menuButton = this.add.container(0, 180); // Moved down to accommodate review button
        
        const menuBg = this.add.image(0, 0, 'ui_element_large');
        menuBg.setScale(0.7); // Consistent with other buttons
        menuBg.setInteractive();
        menuBg.setTint(0x888888); // Gray tint for menu button
        
        const menuText = this.add.text(0, 0, languageManager.getText('main_menu'), {
            fontSize: '24px', // Consistent font size
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center'
        });
        menuText.setOrigin(0.5);
        menuText.setShadow(2, 2, '#000000', 4, true, false);
        
        menuButton.add([menuBg, menuText]);
        victoryContainer.add(menuButton);
        
        // Menu button hover effects
        menuBg.on('pointerover', () => {
            menuBg.setTint(0xaaaaaa);
            menuButton.setScale(1.05);
        });
        
        menuBg.on('pointerout', () => {
            menuBg.setTint(0x888888);
            menuButton.setScale(1.0);
        });
        
        menuBg.on('pointerdown', () => {
            this.sound.play('shoot_laser', { volume: 0.5 });
            this.sound.stopAll();
            this.scene.start('MainMenu');
        });
        
        // Store text references for language change updates
        this.victoryScreenTexts = {
            victoryText,
            missionText,
            scoreText,
            highScoreText, // Will be undefined if new high score
            levelSelectText,
            menuText
        };
        
        // Add celebration animation
        this.createCelebrationAnimation(victoryContainer);
    }

    private createCelebrationAnimation(container: Phaser.GameObjects.Container): void {
        // Create flashing effect for the victory text
        const victoryText = container.list[1] as Phaser.GameObjects.Text; // The "CONGRATULATIONS!" text
        
        this.tweens.add({
            targets: victoryText,
            alpha: { from: 1, to: 0.6 },
            duration: 400,
            yoyo: true,
            repeat: -1, // Infinite repeat
            ease: 'Power2.easeInOut'
        });
        
        // Create pulsing effect for the background
        const background = container.list[0] as Phaser.GameObjects.Image;
        
        this.tweens.add({
            targets: background,
            scaleX: { from: background.scaleX, to: background.scaleX * 1.02 },
            scaleY: { from: background.scaleY, to: background.scaleY * 1.02 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    private restartLevel(): void {
        console.log('Restarting level...');
        
        // Stop all sounds
        this.sound.stopAll();
        
        // Restart the scene with the same level
        this.scene.restart({ selectedLevel: this.selectedLevel });
    }

    // Enemy Spaceship System Methods
    private setupEnemySpaceshipSystem(): void {
        // Set the configurable speed
        EnemySpaceship.setBaseSpeed(this.enemySpaceshipSpeed);
        
        // Set up event listener for enemy spaceship collisions
        this.events.on('enemy-spaceship-collision', (data: { spaceship: EnemySpaceship; player: Player }) => {
            console.log('Enemy spaceship collided with player!');
            this.handleEnemyShipPlayerCollision(data.spaceship, data.player);
        });
        
        // Set up event listener for enemy shooting
        this.events.on('enemy-shoot', (data: { x: number; y: number; direction: { x: number; y: number }; spaceshipId: string }) => {
            // Check if scene is still active before trying to fire bullets
            if (!this.scene.isActive() || this.scene.isPaused() || this.scene.isSleeping()) {
                console.warn('Game scene is not active, ignoring enemy-shoot event');
                return;
            }
            
            // Create a new enemy bullet from the pool
            const bullet = this.enemyBullets.get() as EnemyBullet;
            if (bullet) {
                bullet.fire(data.x, data.y, data.direction, data.spaceshipId);
                console.log('Enemy bullet created at:', data.x, data.y, 'Direction:', data.direction, 'SpaceshipId:', data.spaceshipId);
            } else {
                console.warn('Could not get enemy bullet from pool (pool might be full)');
            }
        });
        
        // Start spawning enemy spaceships
        this.startEnemySpaceshipSpawning();
        
        console.log('Enemy spaceship system initialized');
    }

    private startEnemySpaceshipSpawning(): void {
        // Create timer to spawn enemy spaceships periodically
        this.enemySpawnTimer = this.time.addEvent({
            delay: Phaser.Math.Between(3000, 6000), // Random delay between 3-6 seconds
            callback: this.spawnEnemySpaceship,
            callbackScope: this,
            loop: true
        });
        
        console.log('Enemy spaceship spawning started');
    }

    private spawnEnemySpaceship(): void {
        // Don't spawn if game hasn't started, too many spaceships, or game is over
        if (!this.gameStarted || this.enemySpaceships.length >= 5 || this.gameState === 'gameOver') {
            return;
        }
        
        // Spawn enemy spaceship off-screen
        const spaceship = EnemySpaceship.spawnOffScreen(this);
        this.enemySpaceships.push(spaceship);
        
        // Apply current fullscreen state to new spaceship
        if (this.isCurrentlyFullscreen) {
            spaceship.updateFullscreenScale(true);
        }
        
        console.log(`Enemy spaceship spawned. Total active: ${this.enemySpaceships.length}`);
    }

    private handleEnemyShipPlayerCollision(spaceship: EnemySpaceship, player: Player): void {
        console.log('Player hit by enemy spaceship!');
        
        // Apply damage to player (this will trigger hit effect and invulnerability)
        const playerDied = player.takeDamage(30); // Higher damage for spaceship collision
        
        // Reduce energy when hit by enemy spaceship
        this.removeEnergy(this.energyLossEnemyShip); 
        
        // Remove spaceship from tracking array
        const index = this.enemySpaceships.indexOf(spaceship);
        if (index > -1) {
            this.enemySpaceships.splice(index, 1);
        }
        
        // Destroy the spaceship
        spaceship.destroy();
        
        // Check for game over
        if (this.currentEnergy <= 0) {
            this.triggerGameOver();
        }
        
        // Play damage sound (this is already called in player.takeDamage, but we can keep it for emphasis)
        // this.sound.play('hit_wrong', { volume: 0.5 });
    }


    private clearEnemySpaceships(): void {
        // Stop spawning
        if (this.enemySpawnTimer) {
            this.enemySpawnTimer.destroy();
            this.enemySpawnTimer = undefined;
        }
        
        // Destroy all active spaceships
        this.enemySpaceships.forEach(spaceship => {
            if (spaceship && spaceship.active) {
                spaceship.destroy();
            }
        });
        this.enemySpaceships = [];
        
        console.log('All enemy spaceships cleared');
    }

    // Method to manually adjust enemy spaceship speed
    public setEnemySpaceshipSpeed(newSpeed: number): void {
        this.enemySpaceshipSpeed = newSpeed;
        EnemySpaceship.setBaseSpeed(newSpeed);
        
        // Update speed of existing spaceships
        this.enemySpaceships.forEach(spaceship => {
            if (spaceship && spaceship.active) {
                spaceship.setSpeed(newSpeed);
            }
        });
        
        console.log(`Enemy spaceship speed set to: ${newSpeed}`);
    }

    private createTitle(): void {
        const { width, height, centerX, centerY, minScale } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        // Create level title (only show level info)
        const titleText = this.selectedLevel ? 
            `LEVEL ${this.selectedLevel}` : 
            'LEVEL 1';
            
        this.titleText = this.add.text(centerX, height * 0.08, titleText, {
            fontSize: `${Math.max(24, 36 * minScale)}px`,
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#2d5aa0',
            strokeThickness: 3,
            align: 'center'
        });
        this.titleText.setOrigin(0.5);
        this.titleText.setShadow(2, 2, '#000000', 4, true, false);
        this.titleText.setDepth(100); // Ensure title is above parallax objects
    }

    private createSettingsButton(): void {
        const { width, height, minScale } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        const buttonSize = Math.max(40, 60 * minScale);
        const margin = Math.max(20, 30 * minScale);

        // Settings button positioned at top right corner
        this.settingsButton = this.add.container(width - margin - buttonSize/2, margin + buttonSize/2);
        
        const settingsIcon = this.add.image(0, 0, 'settings');
        settingsIcon.setDisplaySize(buttonSize, buttonSize);
        settingsIcon.setInteractive();
        
        this.settingsButton.add(settingsIcon);
        this.settingsButton.setDepth(100); // Ensure button is above other elements
        
        // Store original scale for hover effects
        const originalScale = 1.0;
        
        // Add hover effects (same as main menu corner buttons)
        settingsIcon.on('pointerover', () => {
            this.settingsButton.setScale(originalScale * 1.1);
            settingsIcon.setTint(0xcccccc);
        });
        
        settingsIcon.on('pointerout', () => {
            this.settingsButton.setScale(originalScale);
            settingsIcon.clearTint();
        });
        
        settingsIcon.on('pointerdown', () => {
            this.sound.play('shoot_laser');
            // Pause the game and open settings modal with quit level option
            this.scene.pause();
            this.scene.launch('Settings', { showQuitLevel: true, callingScene: 'MainGame' });
        });
    }

    private createEnergyDisplay(): void {
        const { width, height, minScale } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        const panelWidth = Math.max(120, 150 * minScale);
        const panelHeight = Math.max(40, 50 * minScale);
        const margin = Math.max(20, 30 * minScale);

        // Position at top left corner
        this.energyDisplay = this.add.container(margin + panelWidth/2, margin + panelHeight/2);
        
        // Create the energy display background
        this.energyDisplayImage = this.add.image(0, 0, 'energy_display');
        this.energyDisplayImage.setDisplaySize(panelWidth, panelHeight);
        
        // Create energy text
        const fontSize = Math.max(16, 20 * minScale);
        this.energyText = this.add.text(0, 0, this.currentEnergy.toString(), {
            fontSize: `${fontSize}px`,
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center'
        });
        this.energyText.setOrigin(0.5);
        this.energyText.setShadow(1, 1, '#000000', 2, true, false);
        
        // Add elements to container
        this.energyDisplay.add([this.energyDisplayImage, this.energyText]);
        this.energyDisplay.setDepth(100); // Ensure UI is above other elements
    }

    private createScorePanel(): void {
        const { width, height, minScale } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        const panelWidth = Math.max(160, 200 * minScale);
        const panelHeight = Math.max(40, 50 * minScale);
        const margin = Math.max(20, 30 * minScale);

        // Position at top left corner, under the energy display
        const energyPanelHeight = Math.max(40, 50 * minScale);
        const leftX = margin + panelWidth/2;
        const topY = margin + energyPanelHeight + 10 + panelHeight/2; // Below the energy display with some spacing
        
        this.scorePanel = this.add.container(leftX, topY);
        
        // Create the score panel background
        this.scorePanelImage = this.add.image(0, 0, 'score_panel');
        this.scorePanelImage.setDisplaySize(panelWidth, panelHeight);
        
        // Create score label text (left side)
        const fontSize = Math.max(14, 18 * minScale);
        const scoreLabel = languageManager.getText('score');
        this.scoreLabelText = this.add.text(-panelWidth/4, 0, scoreLabel, {
            fontSize: `${fontSize}px`,
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center'
        });
        this.scoreLabelText.setOrigin(0.5);
        this.scoreLabelText.setShadow(1, 1, '#000000', 2, true, false);
        
        // Create score value text (right side)
        this.scoreText = this.add.text(panelWidth/4, 0, this.currentScore.toString(), {
            fontSize: `${fontSize}px`,
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center'
        });
        this.scoreText.setOrigin(0.5);
        this.scoreText.setShadow(1, 1, '#000000', 2, true, false);
        
        // Add elements to container
        this.scorePanel.add([this.scorePanelImage, this.scoreLabelText, this.scoreText]);
        this.scorePanel.setDepth(100); // Ensure UI is above other elements
    }

    public updateScore(newScore: number): void {
        this.currentScore = Math.max(0, newScore); // Ensure score never goes below 0
        if (this.scoreText) {
            this.scoreText.setText(this.currentScore.toString());
        }
    }

    public addScore(points: number): void {
        this.updateScore(this.currentScore + points);
    }

    public updateEnergy(newEnergy: number): void {
        this.currentEnergy = Math.max(0, Math.min(newEnergy, this.maxEnergy));
        if (this.energyText) {
            this.energyText.setText(this.currentEnergy.toString());
        }
        
        // Check for game over if energy reaches 0
        if (this.currentEnergy <= 0 && this.gameState === 'playing') {
            this.triggerGameOver();
        }
    }

    public removeEnergy(amount: number): void {
        this.updateEnergy(this.currentEnergy - amount);
    }

    public getScore(): number {
        return this.currentScore;
    }

    public getEnergy(): number {
        return this.currentEnergy;
    }

    private handleResize(): void {
        // Reposition UI elements on resize
        const { width, height, centerX, centerY, minScale } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        // Update physics world bounds to match new screen size
        this.physics.world.setBounds(0, 0, width, height);
        console.log(`Physics world bounds updated to: ${width}x${height} during resize`);
        
        // Update player's fixed X position for new screen size
        if (this.player) {
            this.player.updateForScreenResize();
        }
        
        // Update all active answers for new screen size
        this.answers.forEach(answer => {
            if (answer && answer.active) {
                answer.updateForScreenResize();
            }
        });
        
        // Update background position
        if (this.background) {
            this.background.setPosition(centerX, centerY);
            this.background.setDisplaySize(width, height);
        }
        
        // Update overlay position
        const overlays = this.children.list.filter(child => 
            (child as any).texture?.key === 'overlay'
        );
        overlays.forEach(overlay => {
            const overlayImage = overlay as Phaser.GameObjects.Image;
            overlayImage.setPosition(centerX, centerY);
            overlayImage.setDisplaySize(width, height);
        });
        
        // Update title position
        if (this.titleText) {
            this.titleText.setPosition(centerX, height * 0.08);
        }
        
        // Update question container position
        if (this.questionContainer) {
            this.questionContainer.setPosition(centerX, 0);
        }
        
        // Update settings button position to top right corner
        if (this.settingsButton) {
            const buttonSize = Math.max(40, 60 * minScale);
            const margin = Math.max(20, 30 * minScale);
            this.settingsButton.setPosition(width - margin - buttonSize/2, margin + buttonSize/2);
        }

        // Update energy display position and size
        if (this.energyDisplay) {
            const panelWidth = Math.max(120, 150 * minScale);
            const panelHeight = Math.max(40, 50 * minScale);
            const margin = Math.max(20, 30 * minScale);
            
            this.energyDisplay.setPosition(margin + panelWidth/2, margin + panelHeight/2);
            this.energyDisplayImage.setDisplaySize(panelWidth, panelHeight);
            
            const fontSize = Math.max(16, 20 * minScale);
            this.energyText.setStyle({ fontSize: `${fontSize}px` });
        }

        // Update score panel position and size
        if (this.scorePanel) {
            const panelWidth = Math.max(160, 200 * minScale);
            const panelHeight = Math.max(40, 50 * minScale);
            const margin = Math.max(20, 30 * minScale);
            const energyPanelHeight = Math.max(40, 50 * minScale);
            
            const leftX = margin + panelWidth/2;
            const topY = margin + energyPanelHeight + 10 + panelHeight/2;
            
            this.scorePanel.setPosition(leftX, topY);
            this.scorePanelImage.setDisplaySize(panelWidth, panelHeight);
            
            const fontSize = Math.max(14, 18 * minScale);
            this.scoreLabelText.setStyle({ fontSize: `${fontSize}px` });
            this.scoreText.setStyle({ fontSize: `${fontSize}px` });
            
            // Update text positions
            this.scoreLabelText.setPosition(-panelWidth/4, 0);
            this.scoreText.setPosition(panelWidth/4, 0);
        }
    }

    private cleanup(): void {
        if (this.languageChangeUnsubscribe) {
            this.languageChangeUnsubscribe();
            this.languageChangeUnsubscribe = undefined;
        }
        
        // Clear victory screen text references
        this.victoryScreenTexts = undefined;
        
        // Clean up bullets
        this.cleanupBullets();
        
        // Clean up answers and timers
        this.cleanupAnswers();
        this.clearAnswerSpawnTimers();
        
        // Clean up question system
        this.clearCurrentAnswers();
        if (this.questionContainer) {
            this.questionContainer.destroy();
        }
        
        // Stop all audio when cleaning up the scene
        this.sound.stopAll();
    }

    override update(time: number, delta: number): void {
        // Don't update if game is over
        if (this.gameState === 'gameOver') {
            return;
        }
        
        // Update player if it exists
        if (this.player && this.player.active) {
            this.player.update(time, delta);
        }
        
        // Update all active answers
        this.answers.forEach(answer => {
            if (answer && answer.active) {
                answer.update(time, delta);
            }
        });
        
        // Update enemy spaceships and clean up destroyed ones
        this.enemySpaceships = this.enemySpaceships.filter(spaceship => {
            if (spaceship && spaceship.active) {
                spaceship.update(time, delta);
                return true;
            }
            return false;
        });
        
        // Check for collisions between player and answers
        this.checkPlayerAnswerCollisions();
        
        // Check for collisions between player bullets and enemy spaceships
        this.checkPlayerBulletEnemyCollisions();
        
        // Other game update logic can be added here later
    }
    
    private checkPlayerAnswerCollisions(): void {
        if (!this.player || !this.player.active) return;
        
        this.answers.forEach(answer => {
            if (answer && answer.active) {
                // Simple distance-based collision detection
                const distance = Phaser.Math.Distance.Between(
                    this.player.x, this.player.y,
                    answer.x, answer.y
                );
                
                // Collision threshold (adjust as needed)
                const collisionThreshold = 60;
                
                if (distance < collisionThreshold) {
                    answer.onPlayerCollision();
                }
            }
        });
    }
    
    private checkPlayerBulletEnemyCollisions(): void {
        if (!this.playerBullets || this.enemySpaceships.length === 0) return;
        
        // Check collision between each player bullet and each enemy spaceship
        this.playerBullets.children.entries.forEach((bullet: any) => {
            if (!bullet.active) return;
            
            this.enemySpaceships.forEach((spaceship, spaceshipIndex) => {
                if (!spaceship || !spaceship.active || spaceship.getIsFlashing()) return;
                
                // Use Phaser's built-in overlap detection
                if (this.physics.overlap(bullet, spaceship)) {
                    console.log('Player bullet hit enemy spaceship!');
                    
                    // Explode the bullet
                    if (bullet.explode) {
                        bullet.explode();
                    }
                    
                    // Flash red before destroying the spaceship
                    spaceship.flashRed(() => {
                        // This callback runs after the flash effect completes
                        spaceship.destroy();
                        const index = this.enemySpaceships.indexOf(spaceship);
                        if (index > -1) {
                            this.enemySpaceships.splice(index, 1);
                        }
                    });
                    
                    this.addScore(this.scoreEnemyKill);
                    this.sound.play('hit_enemy', { volume: 0.3 });
                    
                    // Add score for destroying enemy
                    this.addScore(this.scoreEnemyKill);
                    
                    // Play hit sound
                    this.sound.play('hit_enemy', { volume: 0.3 });
                }
            });
        });
    }
    
    
    // Utility method to get all active player bullets
    public getPlayerBullets(): Phaser.Physics.Arcade.Group {
        return this.playerBullets;
    }
    
    // Utility method to get all active enemy bullets
    public getEnemyBullets(): Phaser.Physics.Arcade.Group {
        return this.enemyBullets;
    }
    
    // Utility method to get the player
    public getPlayer(): Player {
        return this.player;
    }
    
    // Method to clean up bullets (useful for scene transitions)
    private cleanupBullets(): void {
        if (this.playerBullets && this.playerBullets.children) {
            this.playerBullets.clear(true, true);
        }
        if (this.enemyBullets && this.enemyBullets.children) {
            this.enemyBullets.clear(true, true);
        }
    }
    
    // Method to clean up answers (useful for scene transitions)
    private cleanupAnswers(): void {
        this.answers.forEach(answer => {
            if (answer && answer.active) {
                answer.destroy();
            }
        });
        this.answers = [];
    }
    
    private checkLevelUnlockCondition(): void {
        if (!this.currentLevel || this.nextLevelUnlocked) {
            return; // No current level or already unlocked
        }
        
        const totalQuestions = this.currentLevel.questions.length;
        const questionsNeededFor80Percent = Math.ceil(totalQuestions * 0.8);
        
        console.log(`Level unlock check: ${this.correctAnswersCount}/${totalQuestions} correct answers`);
        console.log(`Need ${questionsNeededFor80Percent} correct answers to unlock next level (80% of ${totalQuestions})`);
        
        // Check if we have enough CORRECT answers to reach 80% threshold
        // This unlocks the next level in localStorage but doesn't transition to it
        if (this.correctAnswersCount >= questionsNeededFor80Percent && !this.nextLevelUnlocked) {
            console.log(`=== 80% THRESHOLD REACHED! Unlocking next level... ===`);
            console.log(`Correct answers: ${this.correctAnswersCount}/${totalQuestions} (${Math.round((this.correctAnswersCount / totalQuestions) * 100)}%)`);
            
            const nextLevelId = (this.selectedLevel || 1) + 1;
            localStorage.setItem(`eduspace_level_${nextLevelId}_unlocked`, 'true');
            this.nextLevelUnlocked = true;
            
            this.unlockNextLevel();
        }
    }
    
    private unlockNextLevel(): void {
        const nextLevelId = this.currentLevel!.levelId + 1;
        const nextLevel = this.allLevels.find(level => level.levelId === nextLevelId);
        
        if (!nextLevel) {
            console.log('No next level to unlock - this is the last level');
            return;
        }
        
        this.nextLevelUnlocked = true;
        console.log(`=== NEXT LEVEL UNLOCKED: Level ${nextLevelId} ===`);
        console.log(`This level was unlocked due to reaching 80% correct answers (${this.correctAnswersCount} correct out of ${this.currentLevel!.questions.length} total)`);
        
        // Update level progress in registry and localStorage
        this.updateLevelProgress(nextLevelId);
        
        // Show unlock message to the player
        this.showNextLevelUnlockedMessage();
    }
    
    private updateLevelProgress(levelIdToUnlock: number): void {
        let levelProgress = this.registry.get('levelProgress') || {};
        
        // Initialize if doesn't exist
        if (!levelProgress[levelIdToUnlock]) {
            levelProgress[levelIdToUnlock] = {
                unlocked: false,
                completed: false,
                highScore: 0
            };
        }
        
        // Unlock the specified level (but do NOT mark it as completed)
        levelProgress[levelIdToUnlock].unlocked = true;
        
        console.log(`=== UNLOCKING LEVEL ${levelIdToUnlock} (NOT COMPLETING IT) ===`);
        console.log(`Level ${levelIdToUnlock} before unlock:`, levelProgress[levelIdToUnlock]);
        
        // Save to registry and localStorage
        this.registry.set('levelProgress', levelProgress);
        localStorage.setItem('levelProgress', JSON.stringify(levelProgress));
        
        console.log(`Level ${levelIdToUnlock} unlocked in progress:`, levelProgress);
    }
    
    private markCurrentLevelCompleted(): void {
        if (!this.currentLevel) return;
        
        let levelProgress = this.registry.get('levelProgress') || {};
        
        console.log(`=== MARKING LEVEL ${this.currentLevel.levelId} AS COMPLETED ===`);
        
        // Initialize current level if doesn't exist
        if (!levelProgress[this.currentLevel.levelId]) {
            levelProgress[this.currentLevel.levelId] = {
                unlocked: true, // Current level must be unlocked if we can play it
                completed: false,
                highScore: 0
            };
        }
        
        console.log(`Level ${this.currentLevel.levelId} before completion:`, levelProgress[this.currentLevel.levelId]);
        
        // Mark current level as completed and update high score
        levelProgress[this.currentLevel.levelId].completed = true;
        const currentHighScore = levelProgress[this.currentLevel.levelId].highScore || 0;
        if (this.currentScore > currentHighScore) {
            levelProgress[this.currentLevel.levelId].highScore = this.currentScore;
        }
        
        console.log(`Level ${this.currentLevel.levelId} after completion:`, levelProgress[this.currentLevel.levelId]);
        
        // Save to registry and localStorage
        this.registry.set('levelProgress', levelProgress);
        localStorage.setItem('levelProgress', JSON.stringify(levelProgress));
        
        console.log(`Level ${this.currentLevel.levelId} marked as completed with score ${this.currentScore}:`, levelProgress);
    }

    // EduSpace High Score Management Methods
    private getEduSpaceHighScore(): number {
        const highScoreStr = localStorage.getItem('highScoreEduspace');
        return highScoreStr ? parseInt(highScoreStr) : 0;
    }

    private updateEduSpaceHighScore(newScore: number): boolean {
        const currentHighScore = this.getEduSpaceHighScore();
        if (newScore > currentHighScore) {
            localStorage.setItem('highScoreEduspace', newScore.toString());
            this.registry.set('highScoreEduspace', newScore);
            console.log(`New EduSpace high score: ${newScore} (previous: ${currentHighScore})`);
            return true; // New high score achieved
        }
        return false; // No new high score
    }

    private isNewHighScore(): boolean {
        return this.currentScore > this.getEduSpaceHighScore();
    }
    
    private showNextLevelUnlockedMessage(): void {
        const { centerX, height } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        // Create a localized unlock message
        const unlockMessage = `${languageManager.getText('next_level_unlocked')} (80% achieved)\n${languageManager.getText('level_unlock_requirement')}`;
        
        // Create the unlock message text
        this.nextLevelUnlockedText = this.add.text(
            centerX, 
            height - 120, 
            unlockMessage, 
            {
                fontSize: '28px',
                fontFamily: 'Arial',
                color: '#00ff00', // Green color
                stroke: '#004400',
                strokeThickness: 3,
                align: 'center'
            }
        );
        this.nextLevelUnlockedText.setOrigin(0.5);
        this.nextLevelUnlockedText.setDepth(1000);
        
        // Create flashing animation
        this.tweens.add({
            targets: this.nextLevelUnlockedText,
            alpha: { from: 1, to: 0.3 },
            duration: 300,
            yoyo: true,
            repeat: 5,                                                                                                                  
            onComplete: () => {
                // Remove the text after staying on screen for 4 seconds
                this.time.delayedCall(4000, () => {
                    if (this.nextLevelUnlockedText) {
                        this.nextLevelUnlockedText.destroy();
                        this.nextLevelUnlockedText = undefined;
                    }
                });
            }
        });
    }
    
}
