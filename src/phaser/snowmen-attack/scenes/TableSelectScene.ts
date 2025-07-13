import Phaser from 'phaser';
import { languageManager } from '../utils/LanguageManager';
import { ResponsiveUtils } from '../utils/ResponsiveUtils';

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
        const { width, height, centerX, centerY } = ResponsiveUtils.getResponsiveDimensions(this);
        
        // Improved responsive spacing and layout
        const isMobile = ResponsiveUtils.isMobile(this);
        const isTablet = ResponsiveUtils.isTablet(this);
        
        // Much closer spacing for table buttons (more compact grid)
        const verticalSpacing = ResponsiveUtils.getSpacing(isMobile ? 12 : 18, this); // Much reduced from 25/35
        const horizontalSpacing = ResponsiveUtils.getSpacing(isMobile ? 4 : 8, this); // Much reduced from 8/15
        
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
        const gridStartY = centerY - totalGridHeight / 2 - ResponsiveUtils.getSpacing(80, this); // Move grid up more
        
        const minTableau = 2;
        const maxTableau = 10;

        // Position elements with much better spacing between groups
        this.drawTitle(centerX, gridStartY - ResponsiveUtils.getSpacing(60, this)); // More space above grid
        this.drawTableButtons(gridStartX, gridStartY, buttonWidth, buttonHeight, horizontalSpacing, verticalSpacing, columns, minTableau, maxTableau);
        this.drawRandomButton(centerX, gridStartY + totalGridHeight + ResponsiveUtils.getSpacing(50, this), minTableau, maxTableau); // More space below grid
        this.drawStartButton(centerX, gridStartY + totalGridHeight + ResponsiveUtils.getSpacing(120, this)); // Even more space for start button

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
        ResponsiveUtils.setupMobileInput(this);
    }

    drawTitle(x: number, y: number) {
        const titleStyle = ResponsiveUtils.getTextStyle(28, this, { fontFamily: 'times new roman' });
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
        const buttonStyle = ResponsiveUtils.getTextStyle(30, this, { 
            backgroundColor: '#b43e63',
            padding: { 
                x: ResponsiveUtils.getResponsivePadding(18, this), 
                y: ResponsiveUtils.getResponsivePadding(12, this)  
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
        const buttonStyle = ResponsiveUtils.getTextStyle(20, this, {
            backgroundColor: '#b43e63',
            fontFamily: 'times new roman',
            padding: { 
                x: ResponsiveUtils.getResponsivePadding(20, this), 
                y: ResponsiveUtils.getResponsivePadding(10, this) 
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
        const buttonStyle = ResponsiveUtils.getTextStyle(20, this, {
            fontFamily: 'times new roman',
            backgroundColor: '#0a0',
            padding: { 
                x: ResponsiveUtils.getResponsivePadding(30, this), 
                y: ResponsiveUtils.getResponsivePadding(15, this) 
            },
            color: '#999999',
        });

        this.startButton = this.add.text(x, y, languageManager.getText('table_selection_scene_start'), buttonStyle)
            .setOrigin(0.5)
            .setInteractive();

        this.startButton.setAlpha(0); // disabled by default
        
        this.startButton.on('pointerdown', () => {
            if (this.selectedTables.length > 0) {
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
}
