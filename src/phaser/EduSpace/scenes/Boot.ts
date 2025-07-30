import Phaser from 'phaser';

// Level progress interface
export interface LevelProgress {
    [level: number]: {
        unlocked: boolean;
        highScore?: number;
        completed: boolean;
    };
}

export class Boot extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    create(): void {
        const storedHighscore = localStorage.getItem('highscore');
        const parsedHighscore = storedHighscore ? parseInt(storedHighscore) : 0;
        this.registry.set('highscore', parsedHighscore);
        
        // Set selected skin in registry from localStorage or default to classic
        const storedSkin = localStorage.getItem('selectedSkin') || 'classic';
        this.registry.set('selectedSkin', storedSkin);
        
        // Initialize level progress system
        this.initializeLevelProgress();
        
        this.scene.start('Preloader');
    }

    private initializeLevelProgress(): void {
        // Check if level progress exists in localStorage
        const storedProgress = localStorage.getItem('levelProgress');
        
        let levelProgress: LevelProgress;
        
        if (storedProgress) {
            // Load existing progress
            try {
                levelProgress = JSON.parse(storedProgress);
            } catch (error) {
                console.error('Error parsing level progress from localStorage:', error);
                levelProgress = this.createDefaultProgress();
            }
        } else {
            // Create default progress with all levels locked except level 1
            levelProgress = this.createDefaultProgress();
        }
        
        // Store in game registry and localStorage
        this.registry.set('levelProgress', levelProgress);
        localStorage.setItem('levelProgress', JSON.stringify(levelProgress));
    }

    private createDefaultProgress(): LevelProgress {
        const defaultProgress: LevelProgress = {};
        
        // Initialize 6 levels - only first level unlocked
        for (let i = 1; i <= 6; i++) {
            defaultProgress[i] = {
                // unlocked: true, // Only level 1 is unlocked by default
                unlocked: i === 1, // Only level 1 is unlocked by default
                completed: false,
                highScore: 0
            };
        }
        
        return defaultProgress;
    }
}
