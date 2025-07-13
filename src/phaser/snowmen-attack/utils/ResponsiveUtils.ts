export class ResponsiveUtils {
    
    /**
     * Get responsive dimensions based on current screen size
     */
    static getResponsiveDimensions(scene: Phaser.Scene) {
        const width = scene.scale.width;
        const height = scene.scale.height;
        const scaleX = width / 1024; // Base width
        const scaleY = height / 768;  // Base height
        const minScale = Math.min(scaleX, scaleY);
        
        return {
            width,
            height,
            scaleX,
            scaleY,
            minScale,
            centerX: width / 2,
            centerY: height / 2
        };
    }

    /**
     * Get responsive font size based on screen size
     */
    static getResponsiveFontSize(baseSize: number, scene: Phaser.Scene): string {
        const { minScale } = this.getResponsiveDimensions(scene);
        const responsiveSize = Math.max(12, baseSize * minScale); // Minimum 12px
        return `${Math.round(responsiveSize)}px`;
    }

    /**
     * Get responsive padding based on screen size
     */
    static getResponsivePadding(basePadding: number, scene: Phaser.Scene): number {
        const { minScale } = this.getResponsiveDimensions(scene);
        return Math.max(5, basePadding * minScale); // Minimum 5px
    }

    /**
     * Check if the current screen is mobile-sized
     */
    static isMobile(scene: Phaser.Scene): boolean {
        const { width, height } = this.getResponsiveDimensions(scene);
        return width <= 768 || height <= 576;
    }

    /**
     * Check if the current screen is tablet-sized
     */
    static isTablet(scene: Phaser.Scene): boolean {
        const { width } = this.getResponsiveDimensions(scene);
        return width > 768 && width <= 1024;
    }

    /**
     * Check if the current screen is desktop-sized
     */
    static isDesktop(scene: Phaser.Scene): boolean {
        const { width } = this.getResponsiveDimensions(scene);
        return width > 1024;
    }

    /**
     * Get responsive button size based on device type
     */
    static getButtonSize(scene: Phaser.Scene) {
        if (this.isMobile(scene)) {
            return {
                width: 120,
                height: 50,
                fontSize: this.getResponsiveFontSize(18, scene)
            };
        } else if (this.isTablet(scene)) {
            return {
                width: 140,
                height: 55,
                fontSize: this.getResponsiveFontSize(20, scene)
            };
        } else {
            return {
                width: 160,
                height: 60,
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
        const { width, height } = this.getResponsiveDimensions(scene);
        element.x = width * (xPercent / 100);
        element.y = height * (yPercent / 100);
    }

    /**
     * Scale sprite while maintaining aspect ratio
     */
    static scaleSprite(sprite: Phaser.GameObjects.Sprite, scene: Phaser.Scene, maxWidthPercent: number = 80) {
        const { width, minScale } = this.getResponsiveDimensions(scene);
        const maxWidth = width * (maxWidthPercent / 100);
        const scale = Math.min(minScale, maxWidth / sprite.width);
        sprite.setScale(scale);
    }

    /**
     * Get responsive spacing between UI elements
     */
    static getSpacing(baseSpacing: number, scene: Phaser.Scene): number {
        const { minScale } = this.getResponsiveDimensions(scene);
        return Math.max(10, baseSpacing * minScale);
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
                // Add touch ripple effect or similar feedback
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
        const { width, height } = this.getResponsiveDimensions(scene);
        const isLandscape = width > height;
        
        return {
            isLandscape,
            isPortrait: !isLandscape,
            orientation: isLandscape ? 'landscape' : 'portrait'
        };
    }

    /**
     * Setup window resize handling for responsive layout updates
     */
    static setupResizeHandler(scene: Phaser.Scene, onResize?: () => void) {
        const handleResize = () => {
            // Allow Phaser to handle the resize first
            setTimeout(() => {
                if (onResize) {
                    onResize();
                }
                
                // Emit custom resize event
                scene.events.emit('scene-resize');
            }, 100);
        };

        // Listen for browser resize events
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);

        // Clean up on scene shutdown
        scene.events.once('shutdown', () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        });
    }

    /**
     * Get responsive track positions for game layout
     */
    static getTrackPositions(scene: Phaser.Scene, trackCount: number = 4) {
        const { height } = this.getResponsiveDimensions(scene);
        const availableHeight = height * 0.8; // Use 80% of height for tracks
        const startY = height * 0.15; // Start at 15% of height
        const spacing = availableHeight / (trackCount + 1);
        
        const positions = [];
        for (let i = 0; i < trackCount; i++) {
            positions.push(startY + spacing * (i + 1));
        }
        
        return positions;
    }
}
