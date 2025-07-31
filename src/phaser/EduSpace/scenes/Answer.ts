import Phaser from 'phaser';
import { ResponsiveGameUtils } from '../utils/ResponsiveGameUtils';

export interface AnswerData {
    content: string; // Text content, image key, or image URL
    isCorrect: boolean;
    isImage: boolean; // true for image, false for text
    isUrl?: boolean; // true if content is a URL that needs to be loaded
}

export default class Answer extends Phaser.GameObjects.Container {
    private cloudBg!: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
    private answerContent!: Phaser.GameObjects.Text | Phaser.GameObjects.Image;
    private answerData: AnswerData;
    private moveSpeed: number = 150;
    private isDestroyed: boolean = false;
    
    // Predefined Y positions (quarters of screen height)
    public static readonly Y_POSITIONS = {
        TOP: 0.25,      // 25% from top
        MID_TOP: 0.40,  // 40% from top
        MID_BOT: 0.60,  // 60% from top
        BOTTOM: 0.75    // 75% from top
    };
    
    constructor(scene: Phaser.Scene, answerData: AnswerData, yPosition: number) {
        const { width } = ResponsiveGameUtils.getResponsiveConfig(scene);
        
        // Start position: outside screen to the right
        const startX = width + 100;
        
        super(scene, startX, yPosition);
        
        this.answerData = answerData;
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);
        
        // Set up physics body
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(false); // Allow movement off-screen
        
        this.createPortalBackground();
        this.createAnswerContent();
        
        // Set depth to ensure answers are visible above background but below UI
        this.setDepth(30);
        
        // Start moving left
        this.startMovement();
        
        console.log(`Answer created at position: x:${this.x}, y:${this.y}, content: "${answerData.content}", isCorrect: ${answerData.isCorrect}`);
    }
    
    private createPortalBackground(): void {
        // Create animated portal background
        const { config } = ResponsiveGameUtils.getResponsiveConfig(this.scene);
        let portalScale = 4.0;
        
        if (config.screenSize === 'mobile') {
            portalScale = 2.8;
        } else if (config.screenSize === 'tablet') {
            portalScale = 3; 
        }
        
        // Create portal animation if it doesn't exist
        this.createPortalAnimation();
        
        // Create the portal sprite using the first frame
        if (this.scene.textures.exists('portal_frame_1')) {
            this.cloudBg = this.scene.add.sprite(0, 0, 'portal_frame_1');
            this.cloudBg.setScale(portalScale);
            
            // Play the portal animation
            if (this.scene.anims.exists('portal_spin')) {
                (this.cloudBg as Phaser.GameObjects.Sprite).play('portal_spin');
            }
        } else {
            // Fallback to simple graphics if portal frames don't exist
            const graphics = this.scene.add.graphics();
            graphics.fillStyle(0x4a90e2, 0.8); // Blue with transparency
            graphics.lineStyle(3, 0x2c3e50, 1); // Dark border
            graphics.fillCircle(0, 0, 50);
            graphics.strokeCircle(0, 0, 50);
            
            // Convert graphics to texture for reuse
            graphics.generateTexture('portal_fallback', 100, 100);
            graphics.destroy();
            
            this.cloudBg = this.scene.add.image(0, 0, 'portal_fallback');
            this.cloudBg.setScale(portalScale);
        }
        
        this.add(this.cloudBg);
    }
    
    private createPortalAnimation(): void {
        // Create portal animation if it doesn't exist
        if (!this.scene.anims.exists('portal_spin')) {
            const frames = [];
            for (let i = 1; i <= 6; i++) {
                if (this.scene.textures.exists(`portal_frame_${i}`)) {
                    frames.push({ key: `portal_frame_${i}` });
                }
            }
            
            if (frames.length > 0) {
                this.scene.anims.create({
                    key: 'portal_spin',
                    frames: frames,
                    frameRate: 6, // Slower animation speed
                    repeat: -1 // Loop infinitely
                });
                console.log(`Portal animation created with ${frames.length} frames`);
            }
        }
    }
    
    private createAnswerContent(): void {
        const { config } = ResponsiveGameUtils.getResponsiveConfig(this.scene);
        
        if (this.answerData.isImage) {
            if (this.answerData.isUrl) {
                // Load image from URL
                this.loadImageFromUrl();
            } else {
                // Create image from existing texture key
                this.createImageFromTexture();
            }
        } else {
            // Create text answer
            this.createTextContent();
        }
    }
    
    private loadImageFromUrl(): void {
        const { config } = ResponsiveGameUtils.getResponsiveConfig(this.scene);
        const imageUrl = this.answerData.content;
        
        //could be changed from the questions json file
        const imageKey = `url_image_${Date.now()}}`;
        
        console.log(`Loading image from URL: ${imageUrl}`);
        
        // Load the image from URL
        this.scene.load.image(imageKey, imageUrl);
        
        // Start loading and handle completion
        this.scene.load.once('complete', () => {
            console.log(`Image loaded successfully: ${imageKey}`);
            
            if (this.scene.textures.exists(imageKey)) {
                this.answerContent = this.scene.add.image(0, 0, imageKey);
                
                // Calculate scale to fit within portal while maintaining aspect ratio
                const image = this.answerContent as Phaser.GameObjects.Image;
                const imageWidth = image.width;
                const imageHeight = image.height;
                
                // Target size based on portal size and screen type
                let targetSize = 120; // Base size for desktop
                if (config.screenSize === 'mobile') {
                    targetSize = 80;
                } else if (config.screenSize === 'tablet') {
                    targetSize = 100;
                }
                
                // Calculate scale to fit within target size while maintaining aspect ratio
                const scaleX = targetSize / imageWidth;
                const scaleY = targetSize / imageHeight;
                const finalScale = Math.min(scaleX, scaleY);
                
                image.setScale(finalScale);
                this.add(image);
                
                console.log(`Image scaled: original=${imageWidth}x${imageHeight}, scale=${finalScale}, final=${imageWidth*finalScale}x${imageHeight*finalScale}`);
            } else {
                console.error(`Failed to load image from URL: ${imageUrl}`);
                this.createTextContent(); // Fallback to text
            }
        });
        
        // Handle loading errors
        this.scene.load.once('loaderror', (file: any) => {
            if (file.key === imageKey) {
                console.error(`Failed to load image from URL: ${imageUrl}`, file);
                this.createTextContent(); // Fallback to text
            }
        });
        
        // Start the loading process
        this.scene.load.start();
    }
    
    private createImageFromTexture(): void {
        const { config } = ResponsiveGameUtils.getResponsiveConfig(this.scene);
        
        if (this.scene.textures.exists(this.answerData.content)) {
            this.answerContent = this.scene.add.image(0, 0, this.answerData.content);
            
            // Scale image to fit within portal
            let imageScale = 0.6;
            if (config.screenSize === 'mobile') {
                imageScale = 0.4;
            } else if (config.screenSize === 'tablet') {
                imageScale = 0.5;
            }
            
            (this.answerContent as Phaser.GameObjects.Image).setScale(imageScale);
            this.add(this.answerContent);
        } else {
            console.warn(`Image texture '${this.answerData.content}' not found, creating text fallback`);
            this.createTextContent();
        }
    }
    
    private createTextContent(): void {
        const { config } = ResponsiveGameUtils.getResponsiveConfig(this.scene);
        
        let fontSize = 32;
        if (config.screenSize === 'mobile') {
            fontSize = 20;
        } else if (config.screenSize === 'tablet') {
            fontSize = 24;
        }
        
        this.answerContent = this.scene.add.text(0, 0, this.answerData.content, {
            fontSize: `${fontSize}px`,
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff', // Changed to white text
            align: 'center',
            wordWrap: { width: 140, useAdvancedWrap: true }
        }).setOrigin(0.5);
        
        this.add(this.answerContent);
    }
    
    private startMovement(): void {
        // Set responsive speed based on screen size
        const { config } = ResponsiveGameUtils.getResponsiveConfig(this.scene);
        let speed = this.moveSpeed;
        
        if (config.screenSize === 'mobile') {
            speed = 120; // Slower for mobile
        } else if (config.screenSize === 'tablet') {
            speed = 135; // Medium speed for tablet
        }
        
        // Set velocity to move left
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocityX(-speed);
        
        console.log(`Answer movement started with speed: ${speed}`);
    }
    
    public static getRandomYPosition(scene: Phaser.Scene): number {
        const { height } = ResponsiveGameUtils.getResponsiveConfig(scene);
        const positions = Object.values(Answer.Y_POSITIONS);
        const randomPosition = positions[Math.floor(Math.random() * positions.length)];
        return height * randomPosition;
    }
    
    public static getAllYPositions(scene: Phaser.Scene): number[] {
        const { height } = ResponsiveGameUtils.getResponsiveConfig(scene);
        return Object.values(Answer.Y_POSITIONS).map(pos => height * pos);
    }
    
    // Method to update positions when screen resizes (for fullscreen)
    public updateForScreenResize(): void {
        const { width, height } = ResponsiveGameUtils.getResponsiveConfig(this.scene);
        
        // If answer is still off-screen to the right, update its position
        if (this.x > width) {
            this.x = width + 100;
        }
        
        // Update Y position based on current relative position
        const currentYPercent = this.y / height;
        
        // Find closest predefined position
        const positions = Object.values(Answer.Y_POSITIONS);
        const closestPosition = positions.reduce((prev, curr) => 
            Math.abs(curr - currentYPercent) < Math.abs(prev - currentYPercent) ? curr : prev
        );
        
        this.y = height * closestPosition;
        
        console.log(`Answer position updated for screen resize. New position: x:${this.x}, y:${this.y}`);
    }
    
    public override update(time: number, delta: number): void {
        // Check if answer has moved off-screen to the left
        if (this.x < -100 && !this.isDestroyed) {
            console.log('Answer moved off-screen, destroying...');
            this.destroy();
        }
    }
    
    // Getters for game logic
    public getAnswerData(): AnswerData {
        return this.answerData;
    }
    
    public isCorrect(): boolean {
        return this.answerData.isCorrect;
    }
    
    public getContent(): string {
        return this.answerData.content;
    }
    
    public isImageContent(): boolean {
        return this.answerData.isImage;
    }
    
    // Method to handle collision with player (to be called from Game scene)
    public onPlayerCollision(): void {
        if (this.isDestroyed) return;
        
        console.log(`Player collided with answer: "${this.answerData.content}", correct: ${this.answerData.isCorrect}`);
        
        // Emit event to game scene
        this.scene.events.emit('answer-collision', {
            answer: this,
            isCorrect: this.answerData.isCorrect,
            content: this.answerData.content
        });
        
        // Destroy the answer
        this.destroy();
    }
    
    // Override destroy to ensure cleanup
    public override destroy(fromScene?: boolean): void {
        if (this.isDestroyed) return;
        
        this.isDestroyed = true;
        console.log(`Answer destroyed: "${this.answerData.content}"`);
        
        // Clean up components
        if (this.cloudBg) {
            this.cloudBg.destroy();
        }
        if (this.answerContent) {
            this.answerContent.destroy();
        }
        
        super.destroy(fromScene);
    }
}
