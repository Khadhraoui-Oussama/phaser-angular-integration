import Phaser from 'phaser';
import { languageManager } from '../utils/LanguageManager';

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
        const startX = this.scale.width / 2 - 200;
        const startY = this.scale.height / 4;
        const buttonWidth = 80;
        const buttonHeight = 40;
        const spacing = 60;
        const columns = 4;
        const minTableau = 2;
        const maxTableau = 10;

        this.drawTitle(this.scale.width / 2, this.scale.height / 4 - 100);
        this.drawTableButtons(startX, startY, buttonWidth, buttonHeight, spacing, columns, minTableau, maxTableau);
        this.drawRandomButton(this.scale.width / 2, (this.scale.height / 4) * 2.5, minTableau, maxTableau);
        this.drawStartButton(this.scale.width / 2, (this.scale.height / 4) * 3);

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
    }

    drawTitle(x: number, y: number) {
        this.titleText = this.add.text(x, y, languageManager.getText('table_selection_scene_title'), {
            fontSize: '1.75rem',
            fontFamily: 'times new roman',
            color: '#ffffff',
        }).setOrigin(0.5);
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
        for (let i = minTableau - 1; i <= maxTableau - 1; i++) {
            const col = (i - 1) % columns;
            const row = Math.floor((i - 1) / columns);

            const x = startX + col * (buttonWidth + spacing);
            const y = startY + row * (buttonHeight + spacing);

            const button = this.add.text(x, y, `x${i + 1}`, {
                fontSize: '1.5rem',
                fontFamily: 'times new roman',
                backgroundColor: '#b43e63',
                padding: { x: 24, y: 16 },
                color: '#e2dede',
                align: 'center',
            })
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
