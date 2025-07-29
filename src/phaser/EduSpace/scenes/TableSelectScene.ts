import Phaser from 'phaser';
import { languageManager } from '../utils/LanguageManager';
import { ResponsiveGameUtils } from '../utils/ResponsiveGameUtils';
import { WrongAttempt, Question } from '../models/Types';

export default class TableSelectScene extends Phaser.Scene {
    selectedTables: number[];
    buttons: Map<number, Phaser.GameObjects.Text>;
    startButton!: Phaser.GameObjects.Text;
    randomButton!: Phaser.GameObjects.Text;
    titleText!: Phaser.GameObjects.Text;
    private languageChangeUnsubscribe?: () => void;

    constructor() {
        super('TableSelectScene');
        this.selectedTables = []
        this.buttons = new Map();
    }

    create() {
        const { width, height, centerX, centerY } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        // Improved responsive spacing and layout
        const isMobile = ResponsiveGameUtils.isMobile(this);
        const isTablet = ResponsiveGameUtils.isTablet(this);
        
        // Much closer spacing for table buttons (more compact grid)
        const verticalSpacing = ResponsiveGameUtils.getSpacing(isMobile ? 12 : 18, this); // Much reduced from 25/35
        const horizontalSpacing = ResponsiveGameUtils.getSpacing(isMobile ? 4 : 8, this); // Much reduced from 8/15
        
        // Responsive button dimensions with better proportions
        const baseButtonWidth = isMobile ? width * 0.22 : isTablet ? width * 0.15 : width * 0.10; // Slightly smaller
        const baseButtonHeight = isMobile ? height * 0.07 : height * 0.06; // Slightly smaller
        
        const buttonWidth = Math.max(baseButtonWidth, 70); // Reduced minimum from 80
        const buttonHeight = Math.max(baseButtonHeight, 35); // Reduced minimum from 40
        
        // Better grid layout
        const columns = isMobile ? 3 : 4;
        const rows = Math.ceil(9 / columns); // 9 buttons (2-10)
        
        // Calculate total grid dimensions
        const totalGridWidth = columns * buttonWidth + (columns - 1) * horizontalSpacing;
        const totalGridHeight = rows * buttonHeight + (rows - 1) * verticalSpacing;
        
        // Center the grid
        const gridStartX = centerX - totalGridWidth / 2 + buttonWidth / 2;
        const gridStartY = centerY - totalGridHeight / 2 - ResponsiveGameUtils.getSpacing(80, this); // Move grid up more
        
        const minTableau = 2;
        const maxTableau = 10;

        // Position elements with much better spacing between groups
        this.drawTitle(centerX, gridStartY - ResponsiveGameUtils.getSpacing(60, this)); // More space above grid
        this.drawTableButtons(gridStartX, gridStartY, buttonWidth, buttonHeight, horizontalSpacing, verticalSpacing, columns, minTableau, maxTableau);
        this.drawRandomButton(centerX, gridStartY + totalGridHeight + ResponsiveGameUtils.getSpacing(50, this), minTableau, maxTableau); // More space below grid
        this.drawStartButton(centerX, gridStartY + totalGridHeight + ResponsiveGameUtils.getSpacing(120, this)); // Even more space for start button

        // Subscribe to language changes
        this.languageChangeUnsubscribe = languageManager.onLanguageChange(() => {
            // Only update if this scene is active and manager exists
            if (this.scene && this.scene.manager && this.scene.isActive()) {
                this.updateTexts();
            }
        });

        // Listen for scene shutdown to cleanup
        this.events.on('shutdown', () => {
            this.cleanup();
        });

        // Setup mobile input
        ResponsiveGameUtils.setupMobileInput(this);
    }

    drawTitle(x: number, y: number) {
        const titleStyle = ResponsiveGameUtils.getTextStyle(28, this, { fontFamily: 'times new roman' });
        this.titleText = this.add.text(x, y, languageManager.getText('table_selection_scene_title'), titleStyle).setOrigin(0.5);
    }

    drawTableButtons(
        startX: number,
        startY: number,
        buttonWidth: number,
        buttonHeight: number,
        horizontalSpacing: number,
        verticalSpacing: number,
        columns: number,
        minTableau: number,
        maxTableau: number
    ) {
        const buttonStyle = ResponsiveGameUtils.getTextStyle(30, this, { 
            backgroundColor: '#b43e63',
            padding: { 
                x: ResponsiveGameUtils.getResponsivePadding(18, this), 
                y: ResponsiveGameUtils.getResponsivePadding(12, this)  
            },
            color: '#e2dede',
            align: 'center',
            fontFamily: 'times new roman'
        });

        for (let i = minTableau - 1; i <= maxTableau - 1; i++) {
            const col = (i - 1) % columns;
            const row = Math.floor((i - 1) / columns);
            //  + horizontalSpacing
            const x = startX + col * (buttonWidth  + horizontalSpacing);
            const y = startY + row * (buttonHeight + verticalSpacing);

            const button = this.add.text(x, y, `x${i + 1}`, buttonStyle)
                .setInteractive()
                .setOrigin(0.5)
                .on('pointerdown', () => this.toggleTable(i));

            // Add hover effects for better UX
            button.on('pointerover', () => {
                if (!this.selectedTables.includes(i + 1)) {
                    button.setStyle({ backgroundColor: '#d44e73' });
                }
            });
            
            button.on('pointerout', () => {
                if (!this.selectedTables.includes(i + 1)) {
                    button.setStyle({ backgroundColor: '#b43e63' });
                }
            });

            this.buttons.set(i, button);
        }
    }

    drawRandomButton(x: number, y: number, minTableau: number = 2, maxTableau: number = 10) {
        const buttonStyle = ResponsiveGameUtils.getTextStyle(20, this, {
            backgroundColor: '#b43e63',
            fontFamily: 'times new roman',
            padding: { 
                x: ResponsiveGameUtils.getResponsivePadding(20, this), 
                y: ResponsiveGameUtils.getResponsivePadding(10, this) 
            },
            color: '#ffffff',
        });

        this.randomButton = this.add.text(x, y, languageManager.getText('table_selection_scene_random'), buttonStyle)
            .setOrigin(0.5)
            .setInteractive();

        this.randomButton.on('pointerdown', () => this.pickRandomTable(minTableau, maxTableau));
        
        // Add hover effects
        this.randomButton.on('pointerover', () => {
            this.randomButton.setStyle({ backgroundColor: '#d44e73' });
        });
        
        this.randomButton.on('pointerout', () => {
            this.randomButton.setStyle({ backgroundColor: '#b43e63' });
        });
    }

    drawStartButton(x: number, y: number) {
        const buttonStyle = ResponsiveGameUtils.getTextStyle(20, this, {
            fontFamily: 'times new roman',
            backgroundColor: '#0a0',
            padding: { 
                x: ResponsiveGameUtils.getResponsivePadding(30, this), 
                y: ResponsiveGameUtils.getResponsivePadding(15, this) 
            },
            color: '#999999',
        });

        this.startButton = this.add.text(x, y, languageManager.getText('table_selection_scene_start'), buttonStyle)
            .setOrigin(0.5)
            .setInteractive();

        this.startButton.setAlpha(0); // disabled by default
        
        this.startButton.on('pointerdown', () => {
            if (this.selectedTables.length > 0) {
                // TEMPORARY: Call ReviewMistakesScene with dummy data for testing
                // const dummyMistakes = this.createDummyMistakes();
                // this.scene.start('ReviewMistakesScene', {
                //     mistakes: dummyMistakes
                // });
                
                //Normal game start
                this.scene.start('MainGame', {
                    selectedTables: Array.from(this.selectedTables),
                });
            }
        });
        
        // Add hover effects
        this.startButton.on('pointerover', () => {
            if (this.selectedTables.length > 0) {
                this.startButton.setStyle({ backgroundColor: '#0c0' });
            }
        });
        
        this.startButton.on('pointerout', () => {
            if (this.selectedTables.length > 0) {
                this.startButton.setStyle({ backgroundColor: '#0a0' });
            }
        });
    }

    toggleTable(tableNumber: number) {
        const button = this.buttons.get(tableNumber);
        if (!button) return;

        tableNumber += 1;

        const index = this.selectedTables.indexOf(tableNumber);
        if (index !== -1) {
            this.selectedTables.splice(index, 1);
            button.setBackgroundColor('#b43e63');
        } else {
            this.selectedTables.push(tableNumber);
            button.setBackgroundColor('#0a0');
        }

        this.updateStartButtonState();
    }

    lastRandomTable?: number;

    pickRandomTable(min: number, max: number) {
        if (min >= max) throw new Error("Min >= Max, verifier l'appel de la fonction pickRandomTable");
        let random: number;
        do {
            random = Phaser.Math.Between(min, max);
        } while (random === this.lastRandomTable);

        this.lastRandomTable = random;

        this.selectedTables = [];

        this.buttons.forEach((btn, num) => {
            if (num + 1 === random) {
                btn.setBackgroundColor('#0a0');
                this.selectedTables.push(num + 1);
            } else {
                btn.setBackgroundColor('#b43e63');
            }
        });

        this.updateStartButtonState();
    }

    updateStartButtonState() {
        if (this.selectedTables.length > 0) {
            this.startButton.setAlpha(1);
            this.startButton.setColor('#ffffff');
        } else {
            this.startButton.setAlpha(0);
        }
    }

    private updateTexts() {
        // Only update if scene is active and text objects exist
        if (!this.scene || !this.scene.manager || !this.scene.isActive()) return;
        
        // Update all translatable text elements
        if (this.titleText && this.titleText.active) {
            this.titleText.setText(languageManager.getText('table_selection_scene_title'));
        }
        if (this.randomButton && this.randomButton.active) {
            this.randomButton.setText(languageManager.getText('table_selection_scene_random'));
        }
        if (this.startButton && this.startButton.active) {
            this.startButton.setText(languageManager.getText('table_selection_scene_start'));
        }
    }

    private cleanup() {
        if (this.languageChangeUnsubscribe) {
            this.languageChangeUnsubscribe();
            this.languageChangeUnsubscribe = undefined;
        }
    }

    destroy() {
        this.cleanup();
    }

    // TEMPORARY: Method to create dummy mistakes for testing ReviewMistakesScene
    private createDummyMistakes(): WrongAttempt[] {
        const dummyQuestions: Question[] = [
            { id: 1, operand1: 7, operand2: 8, answer: 56, options: [56, 48, 64, 42], speedMultiplier: 1.0 },
            { id: 2, operand1: 9, operand2: 6, answer: 54, options: [54, 45, 63, 36], speedMultiplier: 1.0 },
            { id: 3, operand1: 4, operand2: 7, answer: 28, options: [28, 24, 32, 35], speedMultiplier: 1.0 },
            { id: 4, operand1: 8, operand2: 9, answer: 72, options: [72, 64, 81, 63], speedMultiplier: 1.0 },
            { id: 5, operand1: 6, operand2: 7, answer: 42, options: [42, 36, 48, 49], speedMultiplier: 1.0 },
            { id: 6, operand1: 5, operand2: 8, answer: 40, options: [40, 35, 45, 48], speedMultiplier: 1.0 },
            { id: 7, operand1: 9, operand2: 7, answer: 63, options: [63, 56, 72, 54], speedMultiplier: 1.0 },
            { id: 8, operand1: 8, operand2: 6, answer: 48, options: [48, 42, 54, 56], speedMultiplier: 1.0 },
            { id: 9, operand1: 7, operand2: 9, answer: 63, options: [63, 54, 72, 56], speedMultiplier: 1.0 },
            { id: 10, operand1: 6, operand2: 8, answer: 48, options: [48, 42, 54, 56], speedMultiplier: 1.0 },
            { id: 11, operand1: 5, operand2: 9, answer: 45, options: [45, 40, 54, 36], speedMultiplier: 1.0 },
            { id: 12, operand1: 7, operand2: 6, answer: 42, options: [42, 36, 48, 49], speedMultiplier: 1.0 },
            { id: 13, operand1: 8, operand2: 7, answer: 56, options: [56, 48, 64, 49], speedMultiplier: 1.0 },
            { id: 14, operand1: 9, operand2: 8, answer: 72, options: [72, 63, 81, 64], speedMultiplier: 1.0 },
            { id: 15, operand1: 4, operand2: 9, answer: 36, options: [36, 32, 45, 28], speedMultiplier: 1.0 }
        ];

        const wrongAttempts: WrongAttempt[] = [];
        
        dummyQuestions.forEach((question, index) => {
            // Create different types of wrong answers
            let wrongAnswer: number;
            
            if (index % 4 === 0) {
                // No answer (timeout)
                wrongAnswer = -1;
            } else if (index % 4 === 1) {
                // Wrong option from the choices
                wrongAnswer = question.options.find(opt => opt !== question.answer) || 0;
            } else if (index % 4 === 2) {
                // Completely random wrong answer
                wrongAnswer = question.answer + 10;
            } else {
                // Another wrong option
                wrongAnswer = question.options[question.options.length - 1] !== question.answer 
                    ? question.options[question.options.length - 1] 
                    : question.options[0];
            }

            wrongAttempts.push({
                orderOfAppearance: index + 1,
                question: question,
                attemptedAnswer: wrongAnswer
            });
        });

        return wrongAttempts;
    }
}
