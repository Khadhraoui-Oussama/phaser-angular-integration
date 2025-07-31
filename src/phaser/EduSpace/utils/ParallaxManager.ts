import Phaser from 'phaser';
import { ResponsiveGameUtils } from './ResponsiveGameUtils';

export interface ParallaxObject {
    sprite: Phaser.GameObjects.Image;
    speed: number;
    depth: number;
    scale: number;
    direction: number; // 1 for left-to-right, -1 for right-to-left
}

export class ParallaxManager {
    private scene: Phaser.Scene;
    private parallaxObjects: ParallaxObject[] = [];
    private objectTypes = ['asteroid', 'baren', 'ice', 'lava', 'terran', 'blue_planet', 'green_nebula', 'orange_planet'];
    private isActive: boolean = true;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.createParallaxObjects();
    }

    private createParallaxObjects(): void {
        const { width, height } = ResponsiveGameUtils.getResponsiveConfig(this.scene);
        const numberOfObjects = Phaser.Math.Between(3, 5); // Reduced number of objects

        for (let i = 0; i < numberOfObjects; i++) {
            // Random object type
            const objectType = Phaser.Utils.Array.GetRandom(this.objectTypes);
            
            // Random direction (left-to-right or right-to-left)
            const direction = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
            
            // Random position - start closer to screen edges for faster appearance
            const x = direction === 1 ? Phaser.Math.Between(-150, -50) : Phaser.Math.Between(width + 50, width + 150);
            const y = Phaser.Math.Between(0, height);
            
            // Create sprite
            const sprite = this.scene.add.image(x, y, objectType);
            
            // Random scale (bigger objects for better visibility - increased by 1.5x)
            const scale = Phaser.Math.FloatBetween(0.45, 1.8); // Original 0.3-1.2 * 1.5
            
            // Scale down for mobile and tablet devices
            const isMobile = ResponsiveGameUtils.isMobile(this.scene);
            const isTablet = ResponsiveGameUtils.isTablet(this.scene);
            const deviceScale = isMobile ? 0.5 : (isTablet ? 0.6 : 1.0); // 50% for mobile, 60% for tablet, 100% for desktop
            sprite.setScale(scale * deviceScale);
            
            // Random depth (smaller objects have lower depth - appear behind)
            const depth = Math.floor(scale * 10); // 1-8 depth based on scale
            sprite.setDepth(depth);
            
            // Random speed (even slower movement for more relaxed visual effect)
            const baseSpeed = Phaser.Math.FloatBetween(0.05, 0.3);
            const speed = baseSpeed * scale; // Smaller objects move slower
            
            // Random rotation
            sprite.setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));
              
            this.parallaxObjects.push({
                sprite,
                speed,
                depth,
                scale,
                direction
            });
        }
    }

    public update(): void {
        if (!this.isActive) return;
        
        const { width, height } = ResponsiveGameUtils.getResponsiveConfig(this.scene);
        
        this.parallaxObjects.forEach(obj => {
            // Move objects horizontally based on their direction
            obj.sprite.x += obj.speed * obj.direction;
            
            // Wrap around screen edges horizontally with closer spawn points
            if (obj.direction === 1 && obj.sprite.x > width + 150) {
                // Reset to left side for left-to-right movement and change object type
                obj.sprite.x = Phaser.Math.Between(-150, -50);
                obj.sprite.y = Phaser.Math.Between(0, height);
                this.recycleObject(obj);
            } else if (obj.direction === -1 && obj.sprite.x < -150) {
                // Reset to right side for right-to-left movement and change object type
                obj.sprite.x = Phaser.Math.Between(width + 50, width + 150);
                obj.sprite.y = Phaser.Math.Between(0, height);
                this.recycleObject(obj);
            }
            
            // Very slow rotation for subtle dynamic effect
            obj.sprite.rotation += obj.speed * 0.002;
        });
    }

    private recycleObject(obj: ParallaxObject): void {
        // Get a new random object type (different from current one if possible)
        let newObjectType = Phaser.Utils.Array.GetRandom(this.objectTypes);
        
        // Try to get a different object type than the current one
        const currentTexture = obj.sprite.texture.key;
        const availableTypes = this.objectTypes.filter(type => type !== currentTexture);
        if (availableTypes.length > 0) {
            newObjectType = Phaser.Utils.Array.GetRandom(availableTypes);
        }
        
        // Change the sprite texture to the new object type
        obj.sprite.setTexture(newObjectType);
        
        // Randomize other properties for variety
        const scale = Phaser.Math.FloatBetween(0.45, 1.8);
        const isMobile = ResponsiveGameUtils.isMobile(this.scene);
        const isTablet = ResponsiveGameUtils.isTablet(this.scene);
        const deviceScale = isMobile ? 0.5 : (isTablet ? 0.6 : 1.0);
        obj.sprite.setScale(scale * deviceScale);
        
        // Update object properties
        obj.scale = scale;
        obj.depth = Math.floor(scale * 10);
        obj.sprite.setDepth(obj.depth);
        
        // Update speed based on new scale
        const baseSpeed = Phaser.Math.FloatBetween(0.05, 0.3);
        obj.speed = baseSpeed * scale;
        
        // Set new random rotation
        obj.sprite.setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));
    }

    public setActive(active: boolean): void {
        this.isActive = active;
        this.parallaxObjects.forEach(obj => {
            obj.sprite.setVisible(active);
        });
    }

    public destroy(): void {
        this.parallaxObjects.forEach(obj => {
            if (obj.sprite) {
                obj.sprite.destroy();
            }
        });
        this.parallaxObjects = [];
    }

    public setDepthRange(minDepth: number, maxDepth: number): void {
        this.parallaxObjects.forEach(obj => {
            const normalizedDepth = (obj.depth / 10) * (maxDepth - minDepth) + minDepth;
            obj.sprite.setDepth(normalizedDepth);
        });
    }
}
