import Phaser from 'phaser';
import { languageManager } from '../utils/LanguageManager';
import { ResponsiveGameUtils } from '../utils/ResponsiveGameUtils';
import { AudioManager } from '../utils/AudioManager';
import { EduSpaceAttempt } from '../models/Types';

class ReviewAttempts extends Phaser.Scene {
    private background!: Phaser.GameObjects.Image;
    private overlay!: Phaser.GameObjects.Image;
    private titleText!: Phaser.GameObjects.Text;
    private backButton!: Phaser.GameObjects.Container;
    private scrollContainer!: Phaser.GameObjects.Container;
    private contentContainer!: Phaser.GameObjects.Container;
    private scrollMask!: Phaser.GameObjects.Graphics;
    private scrollIndicator!: Phaser.GameObjects.Graphics;
    private scrollZone!: Phaser.GameObjects.Zone;
    
    private languageChangeUnsubscribe?: () => void;
    private scrollY = 0;
    private maxScrollY = 0;
    private contentHeight = 0;
    private visibleHeight = 0;
    private isScrolling = false;
    private lastPointerY = 0;
    private attempts: EduSpaceAttempt[] = [];
    
    constructor() {
        super('ReviewAttempts');
    }
    
    create(): void {
        AudioManager.loadAndApplyVolume(this);

        const { width, height, centerX, centerY } = ResponsiveGameUtils.getResponsiveConfig(this);

        ResponsiveGameUtils.setupMobileInput(this);

        // Load attempts from localStorage
        this.loadAttempts();

        this.createBackground();
        this.createTitle();
        this.createBackButton();
        this.createScrollableContent();

        // Subscribe to language changes
        this.languageChangeUnsubscribe = languageManager.onLanguageChangeWithSceneCheck(this, () => {
            this.updateTexts();
            this.recreateContent();
        });

        // Listen for scene shutdown to cleanup
        this.events.on('shutdown', () => {
            this.cleanup();
        });

        this.events.on('destroy', () => {
            this.cleanup();
        });
    }

    private loadAttempts(): void {
        try {
            // TEMPORARY: Load dummy data for testing (commented out)
            // this.loadDummyData();
            // return;
            
            // Original logic - Load real attempts from localStorage
            const allAttemptsKey = 'eduspace_all_attempts_global';
            const existingAttemptsJson = localStorage.getItem(allAttemptsKey);
            
            if (existingAttemptsJson) {
                this.attempts = JSON.parse(existingAttemptsJson);
                console.log(`Loaded ${this.attempts.length} attempts for review`);
                
                this.loadImagesFromAttempts();
            } else {
                this.attempts = [];
                console.log('No attempts found for review');
            }
        } catch (error) {
            console.error('Error loading attempts for review:', error);
            this.attempts = [];
        }
    }

    // Load images from URLs for real attempts data
    private loadImagesFromAttempts(): void {
        const imagePromises: Promise<void>[] = [];
        
        this.attempts.forEach((attempt, index) => {
            if (attempt.questionData.media.image) {
                const imageUrl = attempt.questionData.media.image;
                
                // Check if it's already a loaded key or if it's a URL
                if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                    const imageKey = `attempt_image_${index}`;
                    
                    const imagePromise = new Promise<void>((resolve, reject) => {
                        this.load.image(imageKey, imageUrl);
                        this.load.once('complete', () => {
                            // Update the image reference to use the loaded key
                            attempt.questionData.media.image = imageKey;
                            resolve();
                        });
                        this.load.once('loaderror', () => {
                            console.warn(`Failed to load image: ${imageUrl}`);
                            attempt.questionData.media.image = null;
                            resolve(); // Continue even if image fails to load
                        });
                    });
                    
                    imagePromises.push(imagePromise);
                }
                // If it's not a URL, assume it's already a loaded texture key
            }
        });
        
        if (imagePromises.length > 0) {
            this.load.start();
        }
    }
    
    // DUMMY DATA METHODS (commented out - for testing only)
    /*
    private loadDummyData(): void {
        this.attempts = [
            {
                orderOfAppearance: 1,
                questionData: {
                    id: 1,
                    media: {
                        text: "What suffix completes the word 'enj___'?",
                        audio: null,
                        image: "https://cdn-icons-png.flaticon.com/512/742/742751.png" // Smiley face icon
                    },
                    answers: [
                        { type: 'text', value: 'oy', correct: true, url: null },
                        { type: 'text', value: 'ay', correct: false, url: null },
                        { type: 'text', value: 'ey', correct: false, url: null }
                    ],
                    points: 10,
                    langue: 'en',
                    difficultyLevel: 1
                },
                attemptedAnswer: 'oy',
                isCorrect: true,
                pointsEarned: 10
            },
            {
                orderOfAppearance: 2,
                questionData: {
                    id: 2,
                    media: {
                        text: "What suffix completes the word 'conv___'?",
                        audio: null,
                        image: "https://cdn-icons-png.flaticon.com/512/3774/3774299.png" // Convoy/truck icon
                    },
                    answers: [
                        { type: 'text', value: 'oy', correct: true, url: null },
                        { type: 'text', value: 'ay', correct: false, url: null },
                        { type: 'text', value: 'ey', correct: false, url: null }
                    ],
                    points: 10,
                    langue: 'en',
                    difficultyLevel: 1
                },
                attemptedAnswer: 'ay',
                isCorrect: false,
                pointsEarned: 0
            },
            {
                orderOfAppearance: 3,
                questionData: {
                    id: 3,
                    media: {
                        text: "What suffix completes the word 'p___nting'?",
                        audio: null,
                        image: "https://cdn-icons-png.flaticon.com/512/1827/1827933.png" // Paint brush icon
                    },
                    answers: [
                        { type: 'text', value: 'ai', correct: true, url: null },
                        { type: 'text', value: 'ay', correct: false, url: null },
                        { type: 'text', value: 'ey', correct: false, url: null }
                    ],
                    points: 15,
                    langue: 'en',
                    difficultyLevel: 2
                },
                attemptedAnswer: 'ey',
                isCorrect: false,
                pointsEarned: 0
            },
            {
                orderOfAppearance: 4,
                questionData: {
                    id: 4,
                    media: {
                        text: "What suffix completes the word 'b___'?",
                        audio: null,
                        image: null
                    },
                    answers: [
                        { type: 'text', value: 'oy', correct: true, url: null },
                        { type: 'text', value: 'ay', correct: false, url: null },
                        { type: 'text', value: 'ey', correct: false, url: null }
                    ],
                    points: 5,
                    langue: 'en',
                    difficultyLevel: 1
                },
                attemptedAnswer: 'oy',
                isCorrect: true,
                pointsEarned: 5
            }
        ];
        
        // Load images from URLs
        this.loadImagesFromURLs();
        
        console.log(`Loaded ${this.attempts.length} dummy attempts for testing`);
    }

    // Load images from URLs for real attempts data
    private loadImagesFromAttempts(): void {
        const imagePromises: Promise<void>[] = [];
        
        this.attempts.forEach((attempt, index) => {
            if (attempt.questionData.media.image) {
                const imageUrl = attempt.questionData.media.image;
                
                // Check if it's already a loaded key or if it's a URL
                if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                    const imageKey = `attempt_image_${index}`;
                    
                    const imagePromise = new Promise<void>((resolve, reject) => {
                        this.load.image(imageKey, imageUrl);
                        this.load.once('complete', () => {
                            // Update the image reference to use the loaded key
                            attempt.questionData.media.image = imageKey;
                            resolve();
                        });
                        this.load.once('loaderror', () => {
                            console.warn(`Failed to load image: ${imageUrl}`);
                            attempt.questionData.media.image = null;
                            resolve(); // Continue even if image fails to load
                        });
                    });
                    
                    imagePromises.push(imagePromise);
                }
                // If it's not a URL, assume it's already a loaded texture key
            }
        });
        
        if (imagePromises.length > 0) {
            this.load.start();
        }
    }

    private loadImagesFromURLs(): void {
        const imagePromises: Promise<void>[] = [];
        
        this.attempts.forEach((attempt, index) => {
            if (attempt.questionData.media.image) {
                const imageUrl = attempt.questionData.media.image;
                const imageKey = `dummy_image_${index}`;
                
                const imagePromise = new Promise<void>((resolve, reject) => {
                    this.load.image(imageKey, imageUrl);
                    this.load.once('complete', () => {
                        // Update the image reference to use the loaded key
                        attempt.questionData.media.image = imageKey;
                        resolve();
                    });
                    this.load.once('loaderror', () => {
                        console.warn(`Failed to load image: ${imageUrl}`);
                        attempt.questionData.media.image = null;
                        resolve(); // Continue even if image fails to load
                    });
                });
                
                imagePromises.push(imagePromise);
            }
        });
        
        if (imagePromises.length > 0) {
            this.load.start();
        }
    }
    */

    private createBackground(): void {
        const { width, height, centerX, centerY } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        this.background = this.add.image(centerX, centerY, 'bg');
        this.background.setDisplaySize(width, height);
        
        // Add star overlay on top of background
        this.overlay = this.add.image(centerX, centerY, 'overlay');
        this.overlay.setDisplaySize(width, height);
        this.overlay.setDepth(10);
    }

    private createTitle(): void {
        const { width, height, centerX, minScale } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        this.titleText = this.add.text(centerX, height * 0.1, languageManager.getText('review_attempts_title'), {
            fontSize: `${Math.max(24, 48 * minScale)}px`,
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#2d5aa0',
            strokeThickness: 3,
            align: 'center'
        });
        this.titleText.setOrigin(0.5);
        this.titleText.setShadow(2, 2, '#000000', 4, true, false);
        this.titleText.setDepth(100);
    }

    private createBackButton(): void {
        const { width, height, minScale } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        const buttonWidth = Math.max(120, 180 * minScale);
        const buttonHeight = Math.max(40, 60 * minScale);
        const fontSize = Math.max(14, 22 * minScale);
        const margin = Math.max(20, 30 * minScale);

        this.backButton = this.add.container(margin + buttonWidth/2, height - margin - buttonHeight/2);
        
        // Button background
        const buttonBg = this.add.image(0, 0, 'ui_element_large');
        buttonBg.setDisplaySize(buttonWidth, buttonHeight);
        buttonBg.setInteractive();
        
        // Button text
        const buttonText = this.add.text(0, 0, languageManager.getText('back'), {
            fontSize: `${fontSize}px`,
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#2d5aa0',
            strokeThickness: 2,
            align: 'center'
        });
        buttonText.setOrigin(0.5);
        
        this.backButton.add([buttonBg, buttonText]);
        this.backButton.setDepth(100);
        
        // Add hover effects
        buttonBg.on('pointerover', () => {
            this.backButton.setScale(1.05);
            buttonBg.setTint(0xcccccc);
        });
        
        buttonBg.on('pointerout', () => {
            this.backButton.setScale(1.0);
            buttonBg.clearTint();
        });
        
        buttonBg.on('pointerdown', () => {
            this.sound.play('shoot_laser');
            this.scene.start('MainMenu');
        });
    }

    private createScrollableContent(): void {
        const { width, height, centerX, minScale } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        // Calculate content area
        const contentStartY = height * 0.18;
        const contentEndY = height * 0.82;
        this.visibleHeight = contentEndY - contentStartY;
        
        // Create scroll container
        this.scrollContainer = this.add.container(0, 0);
        this.scrollContainer.setDepth(50);
        
        // Create content container
        this.contentContainer = this.add.container(0, 0);
        
        // Create content
        this.createContent();
        
        // Create mask for scrolling
        this.scrollMask = this.add.graphics();
        this.scrollMask.fillStyle(0x4673EB);
        this.scrollMask.fillRect(width * 0.05, contentStartY, width * 0.9, this.visibleHeight);
        this.scrollMask.setDepth(49);
        
        // Apply mask to content
        this.contentContainer.setMask(this.scrollMask.createGeometryMask());
        
        // Create scroll zone for input
        this.scrollZone = this.add.zone(centerX, contentStartY + this.visibleHeight/2, width * 0.9, this.visibleHeight);
        this.scrollZone.setInteractive();
        this.scrollZone.setDepth(60);
        
        // Set up scrolling
        this.setupScrolling();
        
        // Create scroll indicator
        this.createScrollIndicator();
        
        // Add containers
        this.scrollContainer.add(this.contentContainer);
    }

    private createContent(): void {
        const { width, height, centerX, minScale } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        const margin = width * 0.1;
        const contentWidth = width - (margin * 2);
        const fontSize = Math.max(12, 16 * minScale);
        const headerFontSize = Math.max(14, 18 * minScale);
        const rowHeight = Math.max(120, 150 * minScale);
        const rowPadding = Math.max(10, 15 * minScale);
        
        let currentY = height * 0.2;
        
        // Clear existing content
        this.contentContainer.removeAll(true);
        
        // Text direction and alignment
        const isRTL = languageManager.getTextDirection() === 'rtl';
        const textAlign = languageManager.getTextAlign();
        const textOriginX = isRTL ? 1 : 0;
        const baseTextX = isRTL ? width - margin : margin;
        
        if (this.attempts.length === 0) {
            // Show "No attempts found" message
            const noAttemptsText = this.add.text(centerX, currentY + 100, 'No attempts found to review', {
                fontSize: `${Math.max(18, 24 * minScale)}px`,
                fontFamily: 'Arial',
                color: '#ffffff',
                align: 'center'
            });
            noAttemptsText.setOrigin(0.5);
            this.contentContainer.add(noAttemptsText);
            this.contentHeight = 200;
        } else {
            // Create attempt rows
            this.attempts.forEach((attempt, index) => {
                const rowContainer = this.createAttemptRow(attempt, index + 1, baseTextX, currentY, contentWidth, fontSize, headerFontSize, isRTL, textAlign, textOriginX);
                this.contentContainer.add(rowContainer);
                currentY += rowHeight + rowPadding;
            });
            
            this.contentHeight = currentY - height * 0.2;
        }
        
        // Calculate max scroll
        this.maxScrollY = Math.max(0, this.contentHeight - this.visibleHeight);
        
        // Reset scroll position
        this.scrollY = 0;
        this.updateScrollPosition();
    }

    private createAttemptRow(
        attempt: EduSpaceAttempt, 
        attemptNumber: number, 
        baseX: number, 
        y: number, 
        contentWidth: number, 
        fontSize: number, 
        headerFontSize: number,
        isRTL: boolean,
        textAlign: string,
        textOriginX: number
    ): Phaser.GameObjects.Container {
        const { width, minScale } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        const rowContainer = this.add.container(0, 0);
        const rowHeight = Math.max(120, 150 * minScale);
        const itemSpacing = Math.max(8, 12 * minScale);
        
        // Row background
        const rowBg = this.add.graphics();
        if (attempt.isCorrect) {
            rowBg.fillStyle(0x00dd00, 0.5);
        } else {
           
            rowBg.fillStyle(0xdd0000, 0.5);
        }
        rowBg.fillRoundedRect(baseX - (isRTL ? contentWidth : 0), y - 10, contentWidth, rowHeight, 8);
        rowContainer.add(rowBg);
        
        // Correct/Incorrect indicator
        const indicatorSize = Math.max(24, 32 * minScale);
        const indicatorX = isRTL ? baseX - contentWidth + indicatorSize/2 + 10 : baseX + contentWidth - indicatorSize/2 - 10;
        const indicatorY = y + 20;
        
        const indicator = this.add.graphics();
        if (attempt.isCorrect) {
            // Green checkmark
            indicator.lineStyle(4, 0x00ff00);
            indicator.beginPath();
            indicator.moveTo(indicatorX - indicatorSize/3, indicatorY);
            indicator.lineTo(indicatorX - indicatorSize/6, indicatorY + indicatorSize/3);
            indicator.lineTo(indicatorX + indicatorSize/3, indicatorY - indicatorSize/3);
            indicator.strokePath();
        } else {
            // Red X
            indicator.lineStyle(4, 0xff0000);
            indicator.beginPath();
            indicator.moveTo(indicatorX - indicatorSize/3, indicatorY - indicatorSize/3);
            indicator.lineTo(indicatorX + indicatorSize/3, indicatorY + indicatorSize/3);
            indicator.moveTo(indicatorX + indicatorSize/3, indicatorY - indicatorSize/3);
            indicator.lineTo(indicatorX - indicatorSize/3, indicatorY + indicatorSize/3);
            indicator.strokePath();
        }
        rowContainer.add(indicator);
        
        // Attempt number
        const attemptNumberText = this.add.text(baseX, y, `${languageManager.getText('attempt_number')} ${attemptNumber}`, {
            fontSize: `${headerFontSize}px`,
            fontFamily: 'Arial',
            color: '#ffff99',
            fontStyle: 'bold',
            align: textAlign
        });
        attemptNumberText.setOrigin(textOriginX, 0);
        rowContainer.add(attemptNumberText);
        
        let currentTextY = y + attemptNumberText.height + itemSpacing;
        
        // Question image (if exists) - position it in bottom right like answer images
        if (attempt.questionData.media.image) {
            const questionImageSize = Math.max(50, 70 * minScale); // Same size as answer images
            // Position in bottom right of row, just before where answer images would be
            const questionImageX = isRTL ? baseX - contentWidth + questionImageSize/2 + 10 : baseX + contentWidth - questionImageSize/2 - 150; // Offset more to the left from answer images
            const questionImageY = y + rowHeight - questionImageSize/2 - 15; // Bottom right positioning, same as answer images
            
            // Store image info for later loading
            const imageInfo = {
                imageUrl: attempt.questionData.media.image,
                imageSize: questionImageSize,
                imageX: questionImageX,
                imageY: questionImageY,
                isRTL: isRTL,
                rowContainer: rowContainer,
                attemptNumber: attemptNumber
            };
            
            // Load image after a short delay to ensure text is rendered first
            this.time.delayedCall(50, () => {
                this.loadQuestionImage(imageInfo);
            });
        }
        
        // Question text
        const questionText = this.add.text(baseX, currentTextY, `${languageManager.getText('question_text')}: ${attempt.questionData.media.text}`, {
            fontSize: `${fontSize}px`,
            fontFamily: 'Arial',
            color: '#ffffff',
            align: textAlign,
            wordWrap: { width: contentWidth * 0.7 }
        });
        questionText.setOrigin(textOriginX, 0);
        rowContainer.add(questionText);
        
        currentTextY += questionText.height + itemSpacing;
        
        // Show answer images if they exist (for the attempted answer)
        const attemptedAnswerOption = attempt.questionData.answers.find(answer => answer.value === attempt.attemptedAnswer);
        if (attemptedAnswerOption && attemptedAnswerOption.url) {
            const answerImageSize = Math.max(50, 70 * minScale); // Bigger size
            // Position in bottom right of row
            const answerImageX = isRTL ? baseX - contentWidth + answerImageSize/2 + 10 : baseX + contentWidth - answerImageSize/2 - 10;
            const answerImageY = y + rowHeight - answerImageSize/2 - 15; // Bottom right positioning
            
            try {
                // Handle URL-based answer images dynamically
                if (attemptedAnswerOption.url.startsWith('http://') || attemptedAnswerOption.url.startsWith('https://')) {
                    const tempAnswerKey = `temp_answer_${attemptNumber}_${Date.now()}`;
                    
                    this.load.image(tempAnswerKey, attemptedAnswerOption.url);
                    this.load.once('complete', () => {
                        try {
                            const answerImage = this.add.image(answerImageX, answerImageY, tempAnswerKey);
                            answerImage.setDisplaySize(answerImageSize, answerImageSize);
                            answerImage.setOrigin(0.5, 0.5);
                            rowContainer.add(answerImage);
                        } catch (error) {
                            console.warn('Could not display loaded answer image:', tempAnswerKey);
                        }
                    });
                    this.load.once('loaderror', () => {
                        console.warn('Failed to load answer image from URL:', attemptedAnswerOption.url);
                    });
                    this.load.start();
                } else {
                    // Use pre-loaded texture key
                    const answerImage = this.add.image(answerImageX, answerImageY, attemptedAnswerOption.url);
                    answerImage.setDisplaySize(answerImageSize, answerImageSize);
                    answerImage.setOrigin(0.5, 0.5);
                    rowContainer.add(answerImage);
                }
            } catch (error) {
                console.warn('Could not load answer image:', attemptedAnswerOption.url);
            }
        }
        
        // Your answer
        const yourAnswerText = this.add.text(baseX, currentTextY, `${languageManager.getText('your_answer')}: ${attempt.attemptedAnswer}`, {
            fontSize: `${fontSize}px`,
            fontFamily: 'Arial',
            color: attempt.isCorrect ? '#88ff88' : '#ff8888',
            align: textAlign,
            wordWrap: { width: contentWidth * 0.7 }
        });
        yourAnswerText.setOrigin(textOriginX, 0);
        rowContainer.add(yourAnswerText);
        
        // Show correct answer if the attempt was wrong
        if (!attempt.isCorrect) {
            currentTextY += yourAnswerText.height + itemSpacing;
            
            // Find the correct answer
            const correctAnswer = attempt.questionData.answers.find(answer => answer.correct);
            if (correctAnswer) {
                // Show correct answer image if it exists
                if (correctAnswer.url) {
                    const correctImageSize = Math.max(50, 70 * minScale); // Bigger size
                    // Position in bottom right of row, slightly offset from attempted answer image
                    const correctImageX = isRTL ? baseX - contentWidth + correctImageSize/2 + 10 : baseX + contentWidth - correctImageSize/2 - 80; // Offset left from answer image
                    const correctImageY = y + rowHeight - correctImageSize/2 - 15; // Bottom right positioning
                    
                    try {
                        // Handle URL-based correct answer images dynamically
                        if (correctAnswer.url.startsWith('http://') || correctAnswer.url.startsWith('https://')) {
                            const tempCorrectKey = `temp_correct_${attemptNumber}_${Date.now()}`;
                            
                            this.load.image(tempCorrectKey, correctAnswer.url);
                            this.load.once('complete', () => {
                                try {
                                    const correctImage = this.add.image(correctImageX, correctImageY, tempCorrectKey);
                                    correctImage.setDisplaySize(correctImageSize, correctImageSize);
                                    correctImage.setOrigin(0.5, 0.5);
                                    rowContainer.add(correctImage);
                                } catch (error) {
                                    console.warn('Could not display loaded correct answer image:', tempCorrectKey);
                                }
                            });
                            this.load.once('loaderror', () => {
                                console.warn('Failed to load correct answer image from URL:', correctAnswer.url);
                            });
                            this.load.start();
                        } else {
                            // Use pre-loaded texture key
                            const correctImage = this.add.image(correctImageX, correctImageY, correctAnswer.url);
                            correctImage.setDisplaySize(correctImageSize, correctImageSize);
                            correctImage.setOrigin(0.5, 0.5);
                            rowContainer.add(correctImage);
                        }
                    } catch (error) {
                        console.warn('Could not load correct answer image:', correctAnswer.url);
                    }
                }
                
                const correctAnswerText = this.add.text(baseX, currentTextY, `${languageManager.getText('correct_answer')}: ${correctAnswer.value}`, {
                    fontSize: `${fontSize}px`,
                    fontFamily: 'Arial',
                    color: '#88ff88',
                    align: textAlign,
                    wordWrap: { width: contentWidth * 0.7 }
                });
                correctAnswerText.setOrigin(textOriginX, 0);
                rowContainer.add(correctAnswerText);
            }
        }
        
        return rowContainer;
    }

    /**
     * Load question image after content is created to avoid positioning conflicts
     */
    private loadQuestionImage(imageInfo: any): void {
        try {
            // Handle URL-based images dynamically
            if (typeof imageInfo.imageUrl === 'string' && 
                (imageInfo.imageUrl.startsWith('http://') || imageInfo.imageUrl.startsWith('https://'))) {
                
                // Create a temporary key for this URL image
                const tempImageKey = `temp_question_${imageInfo.attemptNumber}_${Date.now()}`;
                
                // Load the image dynamically
                this.load.image(tempImageKey, imageInfo.imageUrl);
                this.load.once('complete', () => {
                    try {
                        const questionImage = this.add.image(imageInfo.imageX, imageInfo.imageY, tempImageKey);
                        questionImage.setDisplaySize(imageInfo.imageSize, imageInfo.imageSize);
                        questionImage.setOrigin(0.5, 0.5); // Center origin like answer images
                        imageInfo.rowContainer.add(questionImage);
                    } catch (error) {
                        console.warn('Could not display loaded question image:', tempImageKey);
                    }
                });
                this.load.once('loaderror', () => {
                    console.warn('Failed to load question image from URL:', imageInfo.imageUrl);
                });
                this.load.start();
                
            } else {
                // Use pre-loaded texture key
                const questionImage = this.add.image(imageInfo.imageX, imageInfo.imageY, imageInfo.imageUrl);
                questionImage.setDisplaySize(imageInfo.imageSize, imageInfo.imageSize);
                questionImage.setOrigin(0.5, 0.5); // Center origin like answer images
                imageInfo.rowContainer.add(questionImage);
            }
        } catch (error) {
            console.warn('Could not load question image:', imageInfo.imageUrl);
        }
    }

    private setupScrolling(): void {
        // Mouse wheel scrolling
        this.input.on('wheel', (pointer: any, gameObjects: any, deltaX: number, deltaY: number) => {
            if (gameObjects.length === 0 || gameObjects.includes(this.scrollZone)) {
                this.scroll(deltaY * 0.5);
            }
        });
        
        // Touch/drag scrolling
        this.scrollZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.isScrolling = true;
            this.lastPointerY = pointer.y;
        });
        
        this.scrollZone.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.isScrolling) {
                const deltaY = this.lastPointerY - pointer.y;
                this.scroll(deltaY);
                this.lastPointerY = pointer.y;
            }
        });
        
        this.scrollZone.on('pointerup', () => {
            this.isScrolling = false;
        });
        
        this.scrollZone.on('pointerupoutside', () => {
            this.isScrolling = false;
        });
        
        // Keyboard scrolling
        if (this.input.keyboard) {
            const upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
            const downKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
            const pageUpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PAGE_UP);
            const pageDownKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PAGE_DOWN);
            
            upKey.on('down', () => this.scroll(-30));
            downKey.on('down', () => this.scroll(30));
            pageUpKey.on('down', () => this.scroll(-this.visibleHeight * 0.8));
            pageDownKey.on('down', () => this.scroll(this.visibleHeight * 0.8));
        }
    }

    private scroll(deltaY: number): void {
        if (this.maxScrollY <= 0) return;
        
        this.scrollY = Phaser.Math.Clamp(this.scrollY + deltaY, 0, this.maxScrollY);
        this.updateScrollPosition();
        this.updateScrollIndicator();
    }

    private updateScrollPosition(): void {
        this.contentContainer.y = -this.scrollY;
    }

    private createScrollIndicator(): void {
        if (this.maxScrollY <= 0) return;
        
        const { width, height } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        const indicatorX = width * 0.97;
        const indicatorStartY = height * 0.18;
        const indicatorHeight = this.visibleHeight;
        const indicatorWidth = 6;
        
        // Scroll track
        const scrollTrack = this.add.graphics();
        scrollTrack.fillStyle(0x333333, 0.5);
        scrollTrack.fillRect(indicatorX - indicatorWidth/2, indicatorStartY, indicatorWidth, indicatorHeight);
        scrollTrack.setDepth(70);
        
        // Scroll indicator
        this.scrollIndicator = this.add.graphics();
        this.scrollIndicator.setDepth(71);
        
        this.updateScrollIndicator();
    }

    private updateScrollIndicator(): void {
        if (this.maxScrollY <= 0 || !this.scrollIndicator) return;
        
        const { width, height } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        this.scrollIndicator.clear();
        
        const indicatorX = width * 0.97;
        const indicatorStartY = height * 0.18;
        const indicatorHeight = this.visibleHeight;
        const indicatorWidth = 6;
        
        // Calculate thumb height and position
        const thumbHeight = Math.max(20, (this.visibleHeight / this.contentHeight) * indicatorHeight);
        const thumbY = indicatorStartY + (this.scrollY / this.maxScrollY) * (indicatorHeight - thumbHeight);
        
        this.scrollIndicator.fillStyle(0xffffff, 0.8);
        this.scrollIndicator.fillRect(indicatorX - indicatorWidth/2, thumbY, indicatorWidth, thumbHeight);
    }

    private updateTexts(): void {
        if (this.titleText) {
            this.titleText.setText(languageManager.getText('review_attempts_title'));
        }
        
        if (this.backButton && this.backButton.list && this.backButton.list.length > 1) {
            const backText = this.backButton.list[1] as Phaser.GameObjects.Text;
            if (backText && backText.setText) {
                backText.setText(languageManager.getText('back'));
            }
        }
    }

    private recreateContent(): void {
        this.createContent();
        this.updateScrollIndicator();
    }

    private cleanup(): void {
        if (this.languageChangeUnsubscribe) {
            this.languageChangeUnsubscribe();
            this.languageChangeUnsubscribe = undefined;
        }
    }
}

export default ReviewAttempts;
