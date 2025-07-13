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
        const spacing = ResponsiveUtils.getSpacing(60, this);
        const buttonSize = ResponsiveUtils.getButtonSize(this);
        
        // Responsive button dimensions
        const buttonWidth = Math.min(buttonSize.width * 0.6, width * 0.15);
        const buttonHeight = Math.min(buttonSize.height * 0.8, height * 0.08);
        
        // Calculate responsive grid
        const columns = ResponsiveUtils.isMobile(this) ? 3 : 4;
        const totalWidth = columns * buttonWidth + (columns - 1) * (spacing * 0.5);
        const startX = centerX - totalWidth / 2 + buttonWidth / 2;
        const startY = centerY - spacing;
        
        const minTableau = 2;
        const maxTableau = 10;

        this.drawTitle(centerX, centerY - spacing * 2);
        this.drawTableButtons(startX, startY, buttonWidth, buttonHeight, spacing * 0.5, columns, minTableau, maxTableau);
        this.drawRandomButton(centerX, centerY + spacing * 1.5, minTableau, maxTableau);
        this.drawStartButton(centerX, centerY + spacing * 2.5);

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
        spacing: number,
        columns: number,
        minTableau: number,
        maxTableau: number
    ) {
        const buttonStyle = ResponsiveUtils.getTextStyle(18, this, {
            backgroundColor: '#b43e63',
            padding: { 
                x: ResponsiveUtils.getResponsivePadding(24, this), 
                y: ResponsiveUtils.getResponsivePadding(16, this) 
            },
            color: '#e2dede',
            align: 'center',
            fontFamily: 'times new roman'
        });

        for (let i = minTableau - 1; i <= maxTableau - 1; i++) {
            const col = (i - 1) % columns;
            const row = Math.floor((i - 1) / columns);

            const x = startX + col * (buttonWidth + spacing);
            const y = startY + row * (buttonHeight + spacing);

            const button = this.add.text(x, y, `x${i + 1}`, buttonStyle)
                .setInteractive()
                .setOrigin(0.5)
                .on('pointerdown', () => this.toggleTable(i));

            this.buttons.set(i, button);
        }
    }

    drawRandomButton(x: number, y: number, minTableau: number, maxTableau: number) {
        this.randomButton = this.add.text(x, y, languageManager.getText('table_selection_scene_random'), {
            fontSize: '1.5rem',
            backgroundColor: '#b43e63',
            fontFamily: 'times new roman',
            padding: { x: 20, y: 10 },
            color: '#ffffff',
        }).setOrigin(0.5).setInteractive();

        this.randomButton.on('pointerdown', () => this.pickRandomTable(minTableau, maxTableau));
    }

    drawStartButton(x: number, y: number) {
        this.startButton = this.add.text(x, y, languageManager.getText('table_selection_scene_start'), {
            fontSize: '1.5rem',
            fontFamily: 'times new roman',
            backgroundColor: '#0a0',
            padding: { x: 30, y: 15 },
            color: '#999999',
        }).setOrigin(0.5).setInteractive();

        this.startButton.setAlpha(0); // disabled by default
        this.startButton.on('pointerdown', () => {
            if (this.selectedTables.length > 0) {
                this.scene.start('MainGame', {
                    selectedTables: Array.from(this.selectedTables),
                });
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
