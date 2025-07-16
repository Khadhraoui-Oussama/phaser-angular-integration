export class ResponsiveGameUtils {
    
    /**
     * Get responsive dimensions and config from scene registry
     */
    static getResponsiveConfig(scene: Phaser.Scene) {
        const responsiveConfig = scene.game.registry.get('responsiveConfig');
        const width = scene.scale.width;
        const height = scene.scale.height;
        
        // Calculate minScale for backward compatibility
        const baseWidth = 1024;
        const baseHeight = 768;
        const scaleX = width / baseWidth;
        const scaleY = height / baseHeight;
        const minScale = Math.min(scaleX, scaleY);
        
        return {
            width,
            height,
            centerX: width / 2,
            centerY: height / 2,
            minScale,
            config: responsiveConfig || {
                assetScale: 1,
                uiScale: 1,
                screenSize: 'desktop',
                assetFolder: 'desktop'
            }
        };
    }

    /**
     * Get responsive font size based on UI scale from config
     */
    static getResponsiveFontSize(baseSize: number, scene: Phaser.Scene): string {
        const { config } = this.getResponsiveConfig(scene);
        const responsiveSize = Math.max(12, baseSize * config.uiScale);
        return `${Math.round(responsiveSize)}px`;
    }

    /**
     * Get responsive padding based on UI scale from config
     */
    static getResponsivePadding(basePadding: number, scene: Phaser.Scene): number {
        const { config } = this.getResponsiveConfig(scene);
        return Math.max(5, basePadding * config.uiScale);
    }

    /**
     * Check if the current screen is mobile-sized
     */
    static isMobile(scene: Phaser.Scene): boolean {
        const { config } = this.getResponsiveConfig(scene);
        return config.screenSize === 'mobile';
    }

    /**
     * Check if the current screen is tablet-sized
     */
    static isTablet(scene: Phaser.Scene): boolean {
        const { config } = this.getResponsiveConfig(scene);
        return config.screenSize === 'tablet';
    }

    /**
     * Check if the current screen is desktop-sized
     */
    static isDesktop(scene: Phaser.Scene): boolean {
        const { config } = this.getResponsiveConfig(scene);
        return config.screenSize === 'desktop';
    }

    /**
     * Get responsive button size based on device type
     */
    static getButtonSize(scene: Phaser.Scene) {
        const { config } = this.getResponsiveConfig(scene);
        
        switch (config.screenSize) {
            case 'mobile':
                return {
                    width: 120 * config.uiScale,
                    height: 50 * config.uiScale,
                    fontSize: this.getResponsiveFontSize(18, scene)
                };
            case 'tablet':
                return {
                    width: 140 * config.uiScale,
                    height: 55 * config.uiScale,
                    fontSize: this.getResponsiveFontSize(20, scene)
                };
            default:
                return {
                    width: 160 * config.uiScale,
                    height: 60 * config.uiScale,
                    fontSize: this.getResponsiveFontSize(22, scene)
                };
        }
    }

    /**
     * Position element responsively based on percentages
     */
    static positionElement(
        element: Phaser.GameObjects.GameObject & { x: number; y: number },
        xPercent: number,
        yPercent: number,
        scene: Phaser.Scene
    ) {
        const { width, height } = this.getResponsiveConfig(scene);
        element.x = width * (xPercent / 100);
        element.y = height * (yPercent / 100);
    }

    /**
     * Scale sprite based on responsive config with additional sprite scaling
     */
    static scaleSprite(sprite: Phaser.GameObjects.Sprite, scene: Phaser.Scene, maxWidthPercent: number = 80) {
        const { width, config } = this.getResponsiveConfig(scene);
        const maxWidth = width * (maxWidthPercent / 100);
        
        // Additional sprite-specific scaling for smaller screens
        let spriteScale = config.assetScale;
        
        // // Apply extra scaling reduction for sprites specifically
        // if (config.screenSize === 'mobile') {
        //     spriteScale *= 0.6; // Further reduce mobile sprites by 40%
        // } else if (config.screenSize === 'tablet') {
        //     spriteScale *= 0.75; // Further reduce tablet sprites by 25%
        // }
        
        const finalScale = Math.min(spriteScale, maxWidth / sprite.width);
        sprite.setScale(finalScale);
    }

    /**
     * Get sprite scale factor for different screen sizes
     */
    static getSpriteScale(scene: Phaser.Scene): number {
        const { config } = this.getResponsiveConfig(scene);
        
        // Base scale from responsive config
        let spriteScale = config.assetScale;
        
        // // Additional sprite-specific scaling
        // if (config.screenSize === 'mobile') {
        //     spriteScale *= 0.8; // Mobile sprites: 25% * 0.6 = 15% of original
        // } else if (config.screenSize === 'tablet') {
        //     spriteScale *= 0.9; // Tablet sprites: 45% * 0.75 = 33.75% of original
        // }
        // // Desktop remains at 100%
        
        return spriteScale;
    }

    /**
     * Get responsive spacing between UI elements
     */
    static getSpacing(baseSpacing: number, scene: Phaser.Scene): number {
        const { config } = this.getResponsiveConfig(scene);
        return Math.max(10, baseSpacing * config.uiScale);
    }

    /**
     * Create responsive text style
     */
    static getTextStyle(baseFontSize: number, scene: Phaser.Scene, additionalProps: any = {}): Phaser.Types.GameObjects.Text.TextStyle {
        const fontSize = this.getResponsiveFontSize(baseFontSize, scene);
        
        return {
            fontSize,
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: scene.scale.width * 0.8 },
            ...additionalProps
        };
    }

    /**
     * Setup responsive input for mobile devices
     */
    static setupMobileInput(scene: Phaser.Scene) {
        if (this.isMobile(scene)) {
            // Enable touch input
            scene.input.addPointer(2); // Allow up to 3 touch points
            
            // Add visual feedback for touch
            scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                this.createTouchFeedback(scene, pointer.x, pointer.y);
            });
        }
    }

    /**
     * Create visual feedback for touch interactions
     */
    private static createTouchFeedback(scene: Phaser.Scene, x: number, y: number) {
        const circle = scene.add.circle(x, y, 20, 0xffffff, 0.3);
        
        scene.tweens.add({
            targets: circle,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                circle.destroy();
            }
        });
    }

    /**
     * Adjust game elements for landscape/portrait orientation
     */
    static handleOrientationChange(scene: Phaser.Scene) {
        const { width, height } = this.getResponsiveConfig(scene);
        const isLandscape = width > height;
        
        return {
            isLandscape,
            isPortrait: !isLandscape,
            orientation: isLandscape ? 'landscape' : 'portrait'
        };
    }

    /**
     * Setup window resize handling - simplified for new system
     */
    static setupResizeHandler(scene: Phaser.Scene, onResize?: () => void) {
        // In the new system, resize is handled by Angular
        // This is kept for compatibility but simplified
        if (onResize) {
            scene.events.on('scene-resize', onResize);
        }
    }

    /**
     * Get responsive track positions for game layout
     */
    static getTrackPositions(scene: Phaser.Scene, trackCount: number = 4) {
        const { height, config } = this.getResponsiveConfig(scene);
        const isMobile = config.screenSize === 'mobile';
        
        // Use responsive values based on screen size
        const availableHeight = height * (isMobile ? 0.85 : 0.9);
        const startY = height * (isMobile ? 0.12 : 0.08);
        const spacing = availableHeight / (trackCount + 1.5);
        
        const positions = [];
        for (let i = 0; i < trackCount; i++) {
            positions.push(startY + spacing * (i + 1) + (spacing * 0.4));
        }
        
        return positions;
    }
}
