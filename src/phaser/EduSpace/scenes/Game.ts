import Phaser from 'phaser';
import { ResponsiveGameUtils } from '../utils/ResponsiveGameUtils';
import { languageManager } from '../utils/LanguageManager';
import { Player } from './Player';
import PlayerBullet from './PlayerBullet';
import EnemyBullet from './EnemyBullet';
import Answer, { AnswerData } from './Answer';
import { QuestionData, AnswerOption } from '../models/Types';
import EnemySpaceship from './EnemySpaceship';

export default class MainGame extends Phaser.Scene {
    private background!: Phaser.GameObjects.Image;
    private titleText!: Phaser.GameObjects.Text;
    private backButton!: Phaser.GameObjects.Container;
    private languageChangeUnsubscribe?: () => void;
    private selectedLevel?: number;
    private player!: Player;
    private playerBullets!: Phaser.Physics.Arcade.Group;
    private enemyBullets!: Phaser.Physics.Arcade.Group;
    private answers: Answer[] = [];
    private answerSpawnTimer?: Phaser.Time.TimerEvent;
    private isCurrentlyFullscreen: boolean = false;
    
    // Question system properties
    private questionContainer!: Phaser.GameObjects.Container;
    private questionText!: Phaser.GameObjects.Text;
    private questionImage?: Phaser.GameObjects.Image;
    private currentQuestion!: QuestionData;
    private questionOrder: number = 0;
    private questions: QuestionData[] = [];
    private gameStarted: boolean = false;
    
    // Enemy spaceship system
    private enemySpaceships: EnemySpaceship[] = [];
    private enemySpawnTimer?: Phaser.Time.TimerEvent;
    public enemySpaceshipSpeed: number = 80; // Configurable speed variable
    
    constructor() {
        super('MainGame');
    }

    init(data?: { selectedLevel?: number }) {
        // Initialize with selected level if provided (for future use)
        if (data?.selectedLevel) {
            this.selectedLevel = data.selectedLevel;
            console.log("selectedLevel in MainGame:", data.selectedLevel);
        }
        
        // Initialize question system
        this.questionOrder = 0;
        this.gameStarted = false;
        this.initializeQuestions();
    }

    create(): void {
        // Ensure no other scenes are running to prevent stacking
        this.scene.manager.scenes.forEach(scene => {
            if (scene.scene.key !== 'MainGame' && scene.scene.isActive()) {
                scene.scene.stop();
            }
        });
        
        // Only play background music if it's not already playing to prevent double playback
        const bgMusic = this.sound.get('main_music');
        if (!bgMusic || !bgMusic.isPlaying) {
            this.sound.play('main_music', { loop: true, volume: 0.4 });
        }
        
        const { width, height, centerX, centerY } = ResponsiveGameUtils.getResponsiveConfig(this);

        // Setup responsive input for mobile
        ResponsiveGameUtils.setupMobileInput(this);

        this.createBackground();

        this.createPlayer();
        
        this.createBulletGroups();

        this.setupPhysicsWorldBounds();

        // Setup enemy spaceship system
        this.setupEnemySpaceshipSystem();

        // Start the question system
        this.startQuestionSystem();

        this.setupCollisionDetection();

        this.createTitle();

        this.createBackButton();

        // Subscribe to language changes with scene validation
        this.languageChangeUnsubscribe = languageManager.onLanguageChangeWithSceneCheck(this, () => {
            // No text updates needed since we use an icon
        });

        // Setup resize handling
        ResponsiveGameUtils.setupResizeHandler(this, () => {
            this.handleResize();
        });
        
        // Setup fullscreen detection
        this.setupFullscreenDetection();

        // Listen for scene shutdown to cleanup
        this.events.on('shutdown', () => {
            this.cleanup();
        });

        // Listen for scene stop to cleanup
        this.events.on('destroy', () => {
            this.cleanup();
        });
    }

    private createBackground(): void {
        const { width, height, centerX, centerY } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        // Add background (same as main menu)
        this.background = this.add.image(centerX, centerY, 'bg2');
        this.background.setDisplaySize(width, height);
        
        // Add overlay on top of background (same as main menu)
        const overlay = this.add.image(centerX, centerY, 'overlay');
        overlay.setDisplaySize(width, height);
    }

    private createPlayer(): void {
        const { width, height } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        // Create player at fixed X position (width/8) and center-left area of screen for horizontal shooting
        this.player = new Player(this, width / 8, height * 0.5);
        
        // Listen for player events
        this.events.on('player-shoot', (data: { x: number; y: number; direction: { x: number; y: number } }) => {
            // Create a new bullet from the pool
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
            // Handle game over logic here
        });
        
        this.events.on('player-life-lost', (remainingLives: number) => {
            console.log('Player lost a life. Remaining lives:', remainingLives);
            // Handle life lost logic here
        });
    }
    
    private createBulletGroups(): void {
        // Create physics group for player bullets
        this.playerBullets = this.physics.add.group({
            classType: PlayerBullet,
            maxSize: 20, // Maximum number of bullets on screen
            runChildUpdate: true // Important: this ensures bullets update properly
        });
        
        // Create physics group for enemy bullets
        this.enemyBullets = this.physics.add.group({
            classType: EnemyBullet,
            maxSize: 30, // Maximum number of enemy bullets on screen
            runChildUpdate: true // Important: this ensures bullets update properly
        });
    }
    
    private setupPhysicsWorldBounds(): void {
        const { width, height } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        // Set physics world bounds to match screen size
        this.physics.world.setBounds(0, 0, width, height);
        console.log(`Physics world bounds set to: ${width}x${height}`);
    }
    
    private setupFullscreenDetection(): void {
        // Check initial fullscreen state
        this.isCurrentlyFullscreen = !!(document.fullscreenElement || 
            (document as any).webkitFullscreenElement || 
            (document as any).mozFullScreenElement || 
            (document as any).msFullscreenElement);
        
        // Listen for fullscreen changes
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
        
        // Update all active answers
        this.answers.forEach(answer => {
            if (answer && answer.active) {
                answer.updateFullscreenScale(isFullscreen);
            }
        });
        
        // You can also scale other game elements here if needed
        // For example, the player, bullets, UI elements, etc.
    }
    
    private createAnswerSpawner(): void {
        // Create timer to spawn answers every 3-5 seconds
        this.answerSpawnTimer = this.time.addEvent({
            delay: Phaser.Math.Between(3000, 5000), // Random delay between 3-5 seconds
            callback: this.spawnAnswer,
            callbackScope: this,
            loop: true
        });
        
        console.log('Answer spawner created');
    }
    
    private spawnAnswer(): void {
        // Sample answer data - replace with your actual question/answer logic
        const sampleAnswers: AnswerData[] = [
            { isUrl:true,content: "https://hips.hearstapps.com/hmg-prod/images/dog-puppy-on-garden-royalty-free-image-1586966191.jpg?crop=1xw:0.74975xh;0,0.190xh", isCorrect: true, isImage: true },
            { isUrl:true,content: "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcQK1dXQrVCbBvMdU4A83XdwM7Rtte8YFsWFI-y5JLABKyTRyUTBQko0SqyrqNJQf96aNdEqLNo5eZglqCIH2udWwuewokYR5-0QnjucNq4Y5Q", isCorrect: true, isImage: true },
            { isUrl:true,content: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRvJ5fvcF8CpcLH4z_oaCVANBnRweFNfP2wYw&s", isCorrect: true, isImage: true },
            { isUrl:true,content: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRUlYUm6-xKlW-L0jMgV4713KRacmJfEbIkyQ&s", isCorrect: true, isImage: true },
            { content: "Car", isCorrect: false, isImage: false },
        ];
        
        // Get random answer data
        const randomAnswerData = sampleAnswers[Math.floor(Math.random() * sampleAnswers.length)];
        
        // Get random Y position
        const yPosition = Answer.getRandomYPosition(this);
        
        // Create new answer
        const answer = new Answer(this, randomAnswerData, yPosition);
        this.answers.push(answer);
        
        // Apply current fullscreen state to new answer
        if (this.isCurrentlyFullscreen) {
            answer.updateFullscreenScale(true);
        }
        
        console.log(`Answer spawned: "${randomAnswerData.content}" at Y: ${yPosition}`);
        
        // Set next spawn delay
        if (this.answerSpawnTimer) {
            this.answerSpawnTimer.reset({
                delay: Phaser.Math.Between(3000, 5000),
                callback: this.spawnAnswer,
                callbackScope: this,
                loop: false
            });
        }
    }
    
    private setupCollisionDetection(): void {
        // Listen for answer collision events
        this.events.on('answer-collision', (data: { answer: Answer; isCorrect: boolean; content: string }) => {
            console.log(`Answer collision detected: "${data.content}", correct: ${data.isCorrect}`);
            
            if (data.isCorrect) {
                // Handle correct answer
                this.handleCorrectAnswer(data.answer);
            } else {
                // Handle wrong answer
                this.handleWrongAnswer(data.answer);
            }
            
            // Remove answer from tracking array
            const index = this.answers.indexOf(data.answer);
            if (index > -1) {
                this.answers.splice(index, 1);
            }
        });

       
        // Set up physics collisions between player and enemy bullets
        this.setupPlayerEnemyBulletCollisions();
    }

    

    private setupPlayerEnemyBulletCollisions(): void {
        // Create collider between player and enemy bullets
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
        
        console.log('Player bullet hit enemy spaceship!');
        
        // Explode the bullet
        if (bullet.explode) {
            bullet.explode();
        }
        
        // Destroy the spaceship
        spaceship.destroy();
        
        // Remove spaceship from tracking array
        const index = this.enemySpaceships.indexOf(spaceship);
        if (index > -1) {
            this.enemySpaceships.splice(index, 1);
        }
        
        // Play hit sound
        this.sound.play('hit_correct', { volume: 0.3 });
    }

    private handlePlayerEnemyBulletCollision(object1: any, object2: any): void {
        const player = object1 as Player;
        const bullet = object2 as EnemyBullet;
        
        console.log('Player hit by enemy bullet!');
        
        // Explode the bullet
        if (bullet.explode) {
            bullet.explode();
        }
        
        // Play damage sound
        this.sound.play('hit_wrong', { volume: 0.5 });
    }
    
    private handleCorrectAnswer(answer: Answer): void {
        console.log('Correct answer selected!');
        // Add score, play success sound, show effect, etc.
        this.sound.play('hit_correct', { volume: 0.5 });
        
        // TODO: Add scoring logic, visual effects, etc.
        
        // Move to next question after a delay
        this.time.delayedCall(1000, () => {
            this.loadNextQuestion();
        });
    }
    
    private handleWrongAnswer(answer: Answer): void {
        console.log('Wrong answer selected!');
        // Reduce player health/lives, play error sound, show effect, etc.
        this.sound.play('shoot_laser', { volume: 0.3 }); // Using available sound as placeholder
        
        if (this.player) {
            // TODO: Reduce player lives or energy
            console.log('Player should lose health/energy for wrong answer');
        }
        
        // Move to next question after a delay
        this.time.delayedCall(1500, () => {
            this.loadNextQuestion();
        });
    }

    // Question system methods
    private initializeQuestions(): void {
        // Sample questions for testing , we will load form JSON file later
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
                    { type: "image", value: "House", correct: false, url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRUlYUm6-xKlW-L0jMgV4713KRacmJfEbIkyQ&s" }
                ],
                points: 20,
                langue: "en",
                difficultyLevel: 2
            }
        ];
        
        console.log(`Initialized ${this.questions.length} questions`);
    }

    private startQuestionSystem(): void {
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
        if (!this.questions || this.questions.length === 0) {
            console.error("Questions not initialized correctly:", this.questions);
            return;
        }

        // Clear existing answer spawner and answers
        this.clearCurrentAnswers();

        this.questionOrder++;
        console.log("question order:", this.questionOrder);
        console.log("questions.length:", this.questions.length);
        
        if (this.questionOrder >= this.questions.length) {
            console.log('All questions completed!');
            this.gameOver();
            return;
        }

        this.currentQuestion = this.questions[this.questionOrder];
        console.log('Loading question:', this.currentQuestion);

        // Create question UI
        const questionText = this.currentQuestion.media.text ;
        const questionImage = this.currentQuestion.media.image;
        
        this.createQuestionUI(questionText, questionImage || undefined);
        
        // Convert AnswerOption[] to AnswerData[] for spawning
        this.spawnAnswersFromQuestion(this.currentQuestion.answers);
    }

    private spawnAnswersFromQuestion(answerOptions: AnswerOption[]): void {
        // Convert AnswerOptions to AnswerData format
        const answerDataArray: AnswerData[] = answerOptions.map(option => ({
            content: option.type === 'image' && option.url ? option.url : option.value,
            isCorrect: option.correct,
            isImage: option.type === 'image',
            isUrl: option.type === 'image' && !!option.url
        }));

        // Spawn answers with staggered timing like in snowmen attack
        const answerSpawnDelayMS = 2500
        answerDataArray.forEach((answerData, index) => {
            this.time.delayedCall(index * answerSpawnDelayMS, () => {
                const yPosition = Answer.getRandomYPosition(this);
                const answer = new Answer(this, answerData, yPosition);
                this.answers.push(answer);
                
                // Apply current fullscreen state to new answer
                if (this.isCurrentlyFullscreen) {
                    answer.updateFullscreenScale(true);
                }
                
                console.log(`Answer spawned: "${answerData.content}" at Y: ${yPosition}`);
            });
        });
    }

    private clearCurrentAnswers(): void {
        // Stop answer spawner
        if (this.answerSpawnTimer) {
            this.answerSpawnTimer.destroy();
            this.answerSpawnTimer = undefined;
        }
        
        // Clear existing answers
        this.answers.forEach(answer => {
            if (answer && answer.active) {
                answer.destroy();
            }
        });
        this.answers = [];
    }

    private gameOver(): void {
        console.log('=== GAME OVER ===');
        console.log('All questions completed!');
        
        // Stop all game elements
        this.clearCurrentAnswers();
        this.clearEnemySpaceships();
        
        if (this.questionContainer) {
            this.questionContainer.destroy();
        }
        
        // TODO: Show game over screen, final score, etc.
        // For now, restart the questions
        this.questionOrder = -1; // Will be incremented to 0 in loadNextQuestion
        this.time.delayedCall(2000, () => {
            this.loadNextQuestion();
        });
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
        this.events.on('enemy-shoot', (data: { x: number; y: number; direction: { x: number; y: number } }) => {
            // Create a new enemy bullet from the pool
            const bullet = this.enemyBullets.get() as EnemyBullet;
            if (bullet) {
                bullet.fire(data.x, data.y, data.direction);
                console.log('Enemy bullet created at:', data.x, data.y, 'Direction:', data.direction);
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
        // Don't spawn if game hasn't started or too many spaceships
        if (!this.gameStarted || this.enemySpaceships.length >= 5) {
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
        
        // Play damage sound
        this.sound.play('hit_wrong', { volume: 0.5 });
        
        // Remove spaceship from tracking array
        const index = this.enemySpaceships.indexOf(spaceship);
        if (index > -1) {
            this.enemySpaceships.splice(index, 1);
        }
        
        // TODO: Reduce player lives/health, show damage effect, etc.
        console.log('Player should lose health for enemy collision');
        //TODO: add red flash or overlay
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

    private createBackButton(): void {
        const { width, height, minScale } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        const buttonSize = Math.max(40, 60 * minScale);
        const margin = Math.max(20, 30 * minScale);

        // Exit button positioned at top right corner (same size as main menu corner buttons)
        this.backButton = this.add.container(width - margin - buttonSize/2, margin + buttonSize/2);
        
        const exitIcon = this.add.image(0, 0, 'exit');
        exitIcon.setDisplaySize(buttonSize, buttonSize);
        exitIcon.setInteractive();
        
        this.backButton.add(exitIcon);
        this.backButton.setDepth(100); // Ensure button is above other elements
        
        // Store original scale for hover effects
        const originalScale = 1.0;
        
        // Add hover effects (same as main menu corner buttons)
        exitIcon.on('pointerover', () => {
            this.backButton.setScale(originalScale * 1.1);
            exitIcon.setTint(0xcccccc);
        });
        
        exitIcon.on('pointerout', () => {
            this.backButton.setScale(originalScale);
            exitIcon.clearTint();
        });
        
        exitIcon.on('pointerdown', () => {
            this.sound.play('shoot_laser');
            // Stop background music when exiting to main menu
            this.sound.stopAll();
            this.scene.start('MainMenu');
        });
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
        
        // Update back button position to top right corner
        if (this.backButton) {
            const buttonSize = Math.max(40, 60 * minScale);
            const margin = Math.max(20, 30 * minScale);
            this.backButton.setPosition(width - margin - buttonSize/2, margin + buttonSize/2);
        }
    }

    private cleanup(): void {
        if (this.languageChangeUnsubscribe) {
            this.languageChangeUnsubscribe();
            this.languageChangeUnsubscribe = undefined;
        }
        
        // Clean up bullets
        this.cleanupBullets();
        
        // Clean up answers
        this.cleanupAnswers();
        
        // Clean up question system
        this.clearCurrentAnswers();
        if (this.questionContainer) {
            this.questionContainer.destroy();
        }
        
        // Clean up answer spawner
        if (this.answerSpawnTimer) {
            this.answerSpawnTimer.destroy();
            this.answerSpawnTimer = undefined;
        }
        
        // Stop all audio when cleaning up the scene
        this.sound.stopAll();
    }

    override update(time: number, delta: number): void {
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
                if (!spaceship || !spaceship.active) return;
                
                // Use Phaser's built-in overlap detection
                if (this.physics.overlap(bullet, spaceship)) {
                    console.log('Player bullet hit enemy spaceship!');
                    
                    // Explode the bullet
                    if (bullet.explode) {
                        bullet.explode();
                    }
                    
                    // Destroy the spaceship
                    spaceship.destroy();
                    this.enemySpaceships.splice(spaceshipIndex, 1);
                    
                    // Play hit sound
                    this.sound.play('hit_correct', { volume: 0.3 });
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
    
}
