import Phaser from 'phaser';

export default class TableSelectScene extends Phaser.Scene {
    selectedTables: Set<number>;
    buttons: Map<number, Phaser.GameObjects.Text>;
    startButton!: Phaser.GameObjects.Text;
    randomButton!: Phaser.GameObjects.Text;

    constructor() {
        super('TableSelectScene');
        this.selectedTables = new Set();
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

        this.drawTitle(this.scale.width / 2, this.scale.height / 4 - 100, 'Choisis les tables à réviser');
        this.drawTableButtons(startX, startY, buttonWidth, buttonHeight, spacing, columns, minTableau, maxTableau);
        this.drawRandomButton(this.scale.width / 2, (this.scale.height / 4) * 2.5, minTableau, maxTableau);
        this.drawStartButton(this.scale.width / 2, (this.scale.height / 4) * 3);
    }

    drawTitle(x: number, y: number, text: string) {
        this.add.text(x, y, text, {
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
        this.randomButton = this.add.text(x, y, 'Table Aléatoire', {
            fontSize: '1.5rem',
            backgroundColor: '#b43e63',
            fontFamily: 'times new roman',
            padding: { x: 20, y: 10 },
            color: '#ffffff',
        }).setOrigin(0.5).setInteractive();

        this.randomButton.on('pointerdown', () => this.pickRandomTable(minTableau, maxTableau));
    }

    drawStartButton(x: number, y: number) {
        this.startButton = this.add.text(x, y, '▶ Commencer', {
            fontSize: '1.5rem',
            fontFamily: 'times new roman',
            backgroundColor: '#0a0',
            padding: { x: 30, y: 15 },
            color: '#999999',
        }).setOrigin(0.5).setInteractive();

        this.startButton.setAlpha(0); // disabled by default
        this.startButton.on('pointerdown', () => {
            if (this.selectedTables.size > 0) {
                this.scene.start('MainGame', {
                    selectedTables: Array.from(this.selectedTables),
                });
            }
        });
    }

    toggleTable(tableNumber: number) {
        const button = this.buttons.get(tableNumber);
        if (!button) return;

        tableNumber+=1

        if (this.selectedTables.has(tableNumber)) {
            this.selectedTables.delete(tableNumber);
            button.setBackgroundColor('#b43e63');
        } else {
            this.selectedTables.add(tableNumber);
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

        this.selectedTables.clear();

        this.buttons.forEach((btn, num) => {
            if (num + 1 === random) {
                btn.setBackgroundColor('#0a0');
                this.selectedTables.add(num + 1);
            } else {
                btn.setBackgroundColor('#b43e63');
            }
        });

        this.updateStartButtonState();
    }

    updateStartButtonState() {
        if (this.selectedTables.size > 0) {
            this.startButton.setAlpha(1);
            this.startButton.setColor('#ffffff');
        } else {
            this.startButton.setAlpha(0);
        }
    }
}
