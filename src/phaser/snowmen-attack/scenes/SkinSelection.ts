import Phaser from 'phaser';
import { SkinManager, SkinConfig } from '../utils/SkinManager';
import { ResponsiveGameUtils } from '../utils/ResponsiveGameUtils';

export default class SkinSelection extends Phaser.Scene {
    private selectedSkin: string;
    private skinCards: Phaser.GameObjects.Container[] = [];
    private backButton!: Phaser.GameObjects.Text;
    private confirmButton!: Phaser.GameObjects.Text;

    constructor() {
        super('SkinSelection');
    }

    init() {
        this.selectedSkin = SkinManager.getCurrentSkinId();
    }

    create(): void {
        const { width, height, centerX, centerY } = ResponsiveGameUtils.getResponsiveConfig(this);
        
        // Add background
        this.add.image(centerX, centerY, SkinManager.getTextureKey('background')).setAlpha(0.3);
        
        // Title
        const title = this.add.text(centerX, height * 0.1, 'Choose Your Skin', 
            ResponsiveGameUtils.getTextStyle(48, this, { align: 'center' })
        ).setOrigin(0.5);

        // Create skin selection cards
        this.createSkinCards();

        // Back button
        this.backButton = this.add.text(width * 0.1, height * 0.9, '← Back', 
            ResponsiveGameUtils.getTextStyle(24, this)
        ).setOrigin(0, 0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            this.scene.start('MainMenu');
        });

        // Confirm button
        this.confirmButton = this.add.text(width * 0.9, height * 0.9, 'Confirm →', 
            ResponsiveGameUtils.getTextStyle(24, this)
        ).setOrigin(1, 0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            // Set skin in both SkinManager and game registry
            SkinManager.setCurrentSkin(this.selectedSkin);
            this.registry.set('selectedSkin', this.selectedSkin);
            
            // Restart from Preloader to reload animations for new skin
            this.scene.start('Preloader');
        });
    }

    private createSkinCards(): void {
        const { width, height, centerX, centerY } = ResponsiveGameUtils.getResponsiveConfig(this);
        const skins = SkinManager.getAllSkins();
        
        const cardWidth = Math.min(300, width * 0.35);
        const cardHeight = Math.min(200, height * 0.25);
        const spacing = width * 0.1;
        
        const startX = centerX - ((skins.length - 1) * (cardWidth + spacing)) / 2;

        skins.forEach((skin, index) => {
            const cardX = startX + index * (cardWidth + spacing);
            const cardY = centerY;

            const card = this.createSkinCard(skin, cardX, cardY, cardWidth, cardHeight);
            this.skinCards.push(card);
        });

        this.updateCardSelection();
    }

    private createSkinCard(skin: SkinConfig, x: number, y: number, width: number, height: number): Phaser.GameObjects.Container {
        const card = this.add.container(x, y);

        // Card background
        const bg = this.add.rectangle(0, 0, width, height, 0x2c3e50, 0.8)
            .setStrokeStyle(4, 0x3498db);
        
        // Preview image placeholder (you'll need to add actual preview loading)
        const preview = this.add.rectangle(0, -height * 0.15, width * 0.8, height * 0.5, 0x34495e, 0.6);
        
        // Skin name
        const nameText = this.add.text(0, height * 0.25, skin.name, 
            ResponsiveGameUtils.getTextStyle(18, this, { align: 'center' })
        ).setOrigin(0.5);

        card.add([bg, preview, nameText]);

        // Make interactive
        bg.setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.selectedSkin = skin.id;
                this.updateCardSelection();
            });

        return card;
    }

    private updateCardSelection(): void {
        const skins = SkinManager.getAllSkins();
        
        this.skinCards.forEach((card, index) => {
            const bg = card.list[0] as Phaser.GameObjects.Rectangle;
            const skin = skins[index];
            
            if (skin.id === this.selectedSkin) {
                bg.setStrokeStyle(6, 0xe74c3c); // Red border for selected
                bg.setFillStyle(0x2c3e50, 1.0); // Solid background
            } else {
                bg.setStrokeStyle(4, 0x3498db); // Blue border for unselected
                bg.setFillStyle(0x2c3e50, 0.8); // Semi-transparent background
            }
        });
    }
}
