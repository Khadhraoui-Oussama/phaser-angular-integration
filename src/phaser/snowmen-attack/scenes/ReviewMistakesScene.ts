import Phaser from 'phaser';
import { WrongAttempt } from '../models/Types';
import { ResponsiveGameUtils } from '../utils/ResponsiveGameUtils';
import { languageManager } from '../utils/LanguageManager';

export default class ReviewMistakesScene extends Phaser.Scene {
    private mistakes: Set<WrongAttempt> = new Set<WrongAttempt>;
    private unsubscribeLanguageChange?: () => void;
    private scrollContainer!: Phaser.GameObjects.Container;
    private scrollY: number = 0;
    private maxScrollY: number = 0;
    private scrollSpeed: number = 50;

    constructor() {
        super('ReviewMistakesScene');
    }

    init(data: { mistakes: WrongAttempt[] }) {
        data.mistakes.forEach(mistake => {this.mistakes.add(mistake)});
        console.log(this.mistakes)
    }

    create() {
        const { width, height, centerX } = ResponsiveGameUtils.getResponsiveConfig(this);

        this.cameras.main.setBackgroundColor('#1b1b1b');

        // Setup language change callback
        this.unsubscribeLanguageChange = languageManager.onLanguageChangeWithSceneCheck(this, () => {
            this.updateTexts();
        });

        this.updateTexts();
        
        // Setup mobile input
        ResponsiveGameUtils.setupMobileInput(this);
        
        // Setup scroll input
        this.setupScrollInput();
    }
    
    private updateTexts() {
        // Clear existing objects
        this.children.removeAll(true);
        this.scrollY = 0; // Reset scroll position
        
        const { width, height, centerX } = ResponsiveGameUtils.getResponsiveConfig(this);
        const padding = ResponsiveGameUtils.getResponsivePadding(40, this);

        // Title (fixed position)
        this.add.text(centerX, padding, 'Erreurs à Revoir', 
            ResponsiveGameUtils.getTextStyle(40, this, {
                color: '#ff6666'
            })
        ).setOrigin(0.5, 0);

        if (this.mistakes.size === 0) {
            this.add.text(centerX, height / 2, 'Aucune erreur, bien joué', 
                ResponsiveGameUtils.getTextStyle(28, this, {
                    color: '#00ff88'
                })
            ).setOrigin(0.5);
        } else {
            this.createScrollableMistakesList();
        }

        // Add responsive back button (fixed position)
        this.createBackButton();
    }

    private createScrollableMistakesList() {
        const { width, height, centerX } = ResponsiveGameUtils.getResponsiveConfig(this);
        const padding = ResponsiveGameUtils.getResponsivePadding(40, this);
        const spacing = ResponsiveGameUtils.getSpacing(50, this);
        const leftMargin = ResponsiveGameUtils.getResponsivePadding(50, this);
        const rightMargin = width / 2;
        
        // Create scroll container
        this.scrollContainer = this.add.container(0, 0);
        
        // Define scrollable area bounds
        const contentStartY = padding * 3; // Below title
        const contentEndY = height - ResponsiveGameUtils.getResponsivePadding(120, this); // Above back button
        const scrollableHeight = contentEndY - contentStartY;
        
        let yPosition = 0;
        let i = 0;
        
        console.log('Creating mistakes list, total mistakes:', this.mistakes.size);
        
        this.mistakes.forEach((attempt) => {
            const q = attempt.question;
            const wrongText = attempt.attemptedAnswer === -1
                ? 'aucune réponse'
                : `${attempt.attemptedAnswer}`;

            console.log(`Creating mistake ${i}: ${q.operand1} x ${q.operand2} = ${q.answer}, attempted: ${wrongText}`);

            // Create question text
            const questionText = this.add.text(leftMargin, yPosition, `${q.operand1} x ${q.operand2} = ${q.answer}`, 
                ResponsiveGameUtils.getTextStyle(24, this)
            );
            
            // Create answer text
            const answerText = this.add.text(rightMargin, yPosition, `Réponse donnée : ${wrongText}`, 
                ResponsiveGameUtils.getTextStyle(24, this, {
                    color: '#ff5555'
                })
            );

            // Add to scroll container
            this.scrollContainer.add([questionText, answerText]);
            
            yPosition += spacing;
            
            // Add separator line between attempts (except for the last one)
            if (i < this.mistakes.size - 1) {
                const separatorLine = this.add.graphics();
                separatorLine.lineStyle(1, 0xffffff, 0.3); // White line with 30% opacity
                separatorLine.lineBetween(leftMargin, yPosition - spacing/2, width - leftMargin, yPosition - spacing/2);
                this.scrollContainer.add(separatorLine);
            }
            
            i++;
        });
        
        // Calculate max scroll distance
        const totalContentHeight = yPosition;
        this.maxScrollY = Math.max(0, totalContentHeight - scrollableHeight);
        
        console.log('Content setup - totalHeight:', totalContentHeight, 'scrollableHeight:', scrollableHeight, 'maxScrollY:', this.maxScrollY);
        
        // Position scroll container
        this.scrollContainer.setPosition(0, contentStartY);
        
        // TEMPORARILY DISABLE MASK TO DEBUG
        // this.createScrollMask(contentStartY, scrollableHeight, width);
        
        // Show scroll indicators if needed
        if (this.maxScrollY > 0) {
            this.createScrollIndicators();
        }
    }

    private createScrollMask(startY: number, height: number, width: number) {
        // Create a graphics object for the mask
        const maskGraphics = this.add.graphics();
        maskGraphics.fillStyle(0xffffff);
        maskGraphics.fillRect(0, startY, width, height);
        
        // Apply mask to scroll container
        const mask = maskGraphics.createGeometryMask();
        this.scrollContainer.setMask(mask);
    }

    private createScrollIndicators() {
        // Remove scroll instructions - no longer needed
        // Users can naturally discover scroll functionality
    }

    private createBackButton() {
        const { width, height, centerX } = ResponsiveGameUtils.getResponsiveConfig(this);
        const buttonSize = ResponsiveGameUtils.getButtonSize(this);
        
        const backButton = this.add.rectangle(
            centerX, 
            height - ResponsiveGameUtils.getResponsivePadding(60, this), 
            buttonSize.width, 
            buttonSize.height, 
            0x0066cc
        ).setInteractive();

        this.add.text(backButton.x, backButton.y, 'Retour', 
            ResponsiveGameUtils.getTextStyle(20, this)
        ).setOrigin(0.5);

        backButton.on('pointerdown', () => {
            this.scene.start('MainMenu');
        });
    }

    private setupScrollInput() {
        const { width, height } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        // Mouse wheel scrolling (desktop)
        this.input.on('wheel', (pointer: any, gameObjects: any, deltaX: number, deltaY: number) => {
            this.scroll(deltaY > 0 ? this.scrollSpeed : -this.scrollSpeed);
        });
        
        // Keyboard scrolling (desktop)
        if (this.input.keyboard) {
            const cursors = this.input.keyboard.createCursorKeys();
            
            // Arrow key scrolling
            cursors.up!.on('down', () => {
                this.scroll(-this.scrollSpeed);
            });
            
            cursors.down!.on('down', () => {
                this.scroll(this.scrollSpeed);
            });
        }
        
        // Touch/drag scrolling (mobile/tablet)
        if (ResponsiveGameUtils.needsTouchControls(this)) {
            let isDragging = false;
            let startY = 0;
            let startScrollY = 0;
            
            this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                isDragging = true;
                startY = pointer.y;
                startScrollY = this.scrollY;
            });
            
            this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
                if (isDragging && this.maxScrollY > 0) {
                    const deltaY = startY - pointer.y;
                    const newScrollY = startScrollY + deltaY;
                    this.setScrollY(newScrollY);
                }
            });
            
            this.input.on('pointerup', () => {
                isDragging = false;
            });
        }
    }

    private scroll(deltaY: number) {
        if (this.maxScrollY > 0) {
            this.setScrollY(this.scrollY + deltaY);
        }
    }

    private setScrollY(newScrollY: number) {
        // Clamp scroll position
        this.scrollY = Phaser.Math.Clamp(newScrollY, 0, this.maxScrollY);
        
        // Update container position
        if (this.scrollContainer) {
            const { height } = ResponsiveGameUtils.getResponsiveConfig(this);
            const padding = ResponsiveGameUtils.getResponsivePadding(40, this);
            const contentStartY = padding * 3;
            
            this.scrollContainer.setY(contentStartY - this.scrollY);
        }
    }

    shutdown() {
        // Clean up language callback
        if (this.unsubscribeLanguageChange) {
            this.unsubscribeLanguageChange();
            this.unsubscribeLanguageChange = undefined;
        }
    }
}
