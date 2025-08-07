import Phaser from 'phaser';
import { languageManager } from '../utils/LanguageManager';
import { ResponsiveGameUtils } from '../utils/ResponsiveGameUtils';
import { AudioManager } from '../utils/AudioManager';

export default class Information extends Phaser.Scene {
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
    
    constructor() {
        super('Information');
    }
    
    create(): void {
        AudioManager.loadAndApplyVolume(this);

        const { width, height, centerX, centerY } = ResponsiveGameUtils.getResponsiveConfig(this);

        ResponsiveGameUtils.setupMobileInput(this);

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
        
        this.titleText = this.add.text(centerX, height * 0.1, languageManager.getText('information_title'), {
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
        this.scrollMask.fillRect(width * 0.1, contentStartY, width * 0.8, this.visibleHeight);
        this.scrollMask.setDepth(49);
        
        // Apply mask to content
        this.contentContainer.setMask(this.scrollMask.createGeometryMask());
        
        // Create scroll zone for input
        this.scrollZone = this.add.zone(centerX, contentStartY + this.visibleHeight/2, width * 0.8, this.visibleHeight);
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
        
        const margin = width * 0.15;
        const contentWidth = width - (margin * 2);
        const fontSize = Math.max(14, 20 * minScale);
        const headerFontSize = Math.max(16, 24 * minScale);
        const lineSpacing = Math.max(8, 12 * minScale);
        const sectionSpacing = Math.max(20, 30 * minScale);
        
        let currentY = height * 0.2;
        
        // Clear existing content
        this.contentContainer.removeAll(true);
        
        // Text direction and alignment
        const isRTL = languageManager.getTextDirection() === 'rtl';
        const textAlign = languageManager.getTextAlign();
        const textOriginX = isRTL ? 1 : 0;
        const textX = isRTL ? width - margin : margin;
        
        // Content sections
        const sections = [
            {
                header: 'information_objective',
                content: 'information_objective_text'
            },
            {
                header: 'information_controls',
                content: 'information_controls_text'
            },
            {
                header: 'information_gameplay',
                content: 'information_gameplay_text'
            },
            {
                header: 'information_tips',
                content: 'information_tips_text'
            }
        ];
        
        sections.forEach((section, index) => {
            // Section header
            const headerText = this.add.text(textX, currentY, languageManager.getText(section.header as any), {
                fontSize: `${headerFontSize}px`,
                fontFamily: 'Arial',
                color: '#ffff99',
                stroke: '#2d5aa0',
                strokeThickness: 2,
                align: textAlign,
                wordWrap: { width: contentWidth }
            });
            headerText.setOrigin(textOriginX, 0);
            this.contentContainer.add(headerText);
            
            currentY += headerText.height + lineSpacing;
            
            // Section content
            const contentText = this.add.text(textX, currentY, languageManager.getText(section.content as any), {
                fontSize: `${fontSize}px`,
                fontFamily: 'Arial',
                color: '#ffffff',
                align: textAlign,
                wordWrap: { width: contentWidth },
                lineSpacing: 4
            });
            contentText.setOrigin(textOriginX, 0);
            this.contentContainer.add(contentText);
            
            currentY += contentText.height + sectionSpacing;
        });
        
        // Calculate content height
        this.contentHeight = currentY - height * 0.2;
        this.maxScrollY = Math.max(0, this.contentHeight - this.visibleHeight);
        
        // Reset scroll position
        this.scrollY = 0;
        this.updateScrollPosition();
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
        
        const indicatorX = width * 0.92;
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
        
        const indicatorX = width * 0.92;
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
            this.titleText.setText(languageManager.getText('information_title'));
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
