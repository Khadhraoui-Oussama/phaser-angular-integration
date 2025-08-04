export interface SkinConfig {
    id: string;
    name: string;
    type: 'atlas' | 'individual';
    assets: {
        background: string;
        overlay: string;
        sprites?: string;
        spritesJson?: string;
        playerFrames?: string[];
        enemyFrames?: string[];
        playerSnowball?: string;
        enemySnowball?: string;
    };
    animations: {
        player: {
            idle: string;
            throwStart: string;
            throwEnd: string;
        };
        enemy: {
            idle: string;
            walk: string;
            throwStart: string;
            throwEnd: string;
            die: string;
        };
    };
}

export class SkinManager {
    private static currentSkin: string = 'classic';
    private static availableSkins: Map<string, SkinConfig> = new Map();
    private static gameRegistry: Phaser.Data.DataManager | null = null;

    static initialize(gameRegistry?: Phaser.Data.DataManager) {
        if (gameRegistry) {
            this.gameRegistry = gameRegistry;
        }
        
        this.registerSkin({
            id: 'classic',
            name: 'Classic Winter',
            type: 'atlas',
            assets: {
                background: 'background.png',
                overlay: 'overlay.png',
                sprites: 'sprites.png',
                spritesJson: 'sprites.json',
                playerSnowball: 'sprites',
                enemySnowball: 'sprites'
            },
            animations: {
                player: {
                    idle: 'idle',
                    throwStart: 'throwStart',
                    throwEnd: 'throwEnd'
                },
                enemy: {
                    idle: 'snowmanIdleSmall',
                    walk: 'snowmanWalkSmall',
                    throwStart: 'snowmanThrowStartSmall',
                    throwEnd: 'snowmanThrowEndSmall',
                    die: 'snowmanDieSmall'
                }
            }
        });

        this.registerSkin({
            id: 'wizard',
            name: 'Wizard Battle',
            type: 'individual',
            assets: {
                background: 'wizard_skin/background.png',
                overlay: 'wizard_skin/overlay.png',
                playerFrames: this.generateWizardFramePaths('wizard_ice'),
                enemyFrames: this.generateWizardFramePaths('wizard_fire'),
                playerSnowball: 'wizard_skin/iceball.png',
                enemySnowball: 'wizard_skin/fireball.png'
            },
            animations: {
                player: {
                    idle: 'wizard_ice_idle',
                    throwStart: 'wizard_ice_attack',
                    throwEnd: 'wizard_ice_attack'
                },
                enemy: {
                    idle: 'wizard_fire_idle',
                    walk: 'wizard_fire_walk',
                    throwStart: 'wizard_fire_attack',
                    throwEnd: 'wizard_fire_attack',
                    die: 'wizard_fire_die'
                }
            }
        });

        // Load saved skin preference
        const savedSkin = localStorage.getItem('selectedSkin');
        if (savedSkin && this.availableSkins.has(savedSkin)) {
            this.currentSkin = savedSkin;
        }
    }

    private static generateWizardFramePaths(character: string): string[] {
        const paths: string[] = [];
        
        if (character === 'wizard_ice') {
            // Based on actual file structure for wizard_ice
            const availableFrames = [
                '1_IDLE_000.png', '1_IDLE_001.png', '1_IDLE_002.png', '1_IDLE_003.png', '1_IDLE_004.png',
                '2_WALK_000.png', '2_WALK_001.png', '2_WALK_002.png', '2_WALK_003.png', '2_WALK_004.png',
                '5_ATTACK_000.png', '5_ATTACK_002.png', '5_ATTACK_004.png', '5_ATTACK_005.png', '5_ATTACK_006.png',
                '6_HURT_000.png', '6_HURT_001.png', '6_HURT_002.png', '6_HURT_003.png', '6_HURT_004.png',
                '7_DIE_000.png', '7_DIE_004.png', '7_DIE_006.png', '7_DIE_008.png', '7_DIE_011.png'
            ];
            
            availableFrames.forEach(frame => {
                paths.push(`wizard_skin/wizard_ice/${frame}`);
            });
        } else if (character === 'wizard_fire') {
            // Based on actual file structure for wizard_fire
            const availableFrames = [
                '1_IDLE_000.png', '1_IDLE_001.png', '1_IDLE_002.png', '1_IDLE_003.png', '1_IDLE_004.png',
                '2_WALK_000.png', '2_WALK_001.png', '2_WALK_002.png', '2_WALK_003.png', '2_WALK_004.png',
                '5_ATTACK_000.png', '5_ATTACK_002.png', '5_ATTACK_004.png', '5_ATTACK_005.png', '5_ATTACK_006.png',
                '6_HURT_000.png', '6_HURT_001.png', '6_HURT_002.png', '6_HURT_003.png', '6_HURT_004.png',
                '7_DIE_000.png', '7_DIE_003.png', '7_DIE_007.png', '7_DIE_009.png', '7_DIE_014.png'
            ];
            
            availableFrames.forEach(frame => {
                paths.push(`wizard_skin/wizard_fire/${frame}`);
            });
        }
        
        return paths;
    }

    static registerSkin(config: SkinConfig) {
        this.availableSkins.set(config.id, config);
    }

    static setCurrentSkin(skinId: string) {
        if (this.availableSkins.has(skinId)) {
            this.currentSkin = skinId;
            localStorage.setItem('selectedSkin', skinId);
        }
    }

    static getCurrentSkin(): SkinConfig {
        const currentSkinId = this.getCurrentSkinId(); // This will check registry
        return this.availableSkins.get(currentSkinId) || this.availableSkins.get('classic')!;
    }

    static getCurrentSkinId(): string {
        // Always check registry first, fall back to internal state
        if (this.gameRegistry && this.gameRegistry.has('selectedSkin')) {
            return this.gameRegistry.get('selectedSkin');
        }
        return this.currentSkin;
    }

    static getAllSkins(): SkinConfig[] {
        return Array.from(this.availableSkins.values());
    }

    static getTextureKey(assetType: 'background' | 'overlay' | 'sprites' | 'playerSnowball' | 'enemySnowball'): string {
        const skin = this.getCurrentSkin();
        const skinId = this.getCurrentSkinId();
        
        switch (assetType) {
            case 'background':
                return `${skinId}_background`;
            case 'overlay':
                return `${skinId}_overlay`;
            case 'sprites':
                return `${skinId}_sprites`;
            case 'playerSnowball':
                if (skin.type === 'atlas') {
                    return `${skinId}_sprites`;
                } else {
                    return `${skinId}_iceball`;
                }
            case 'enemySnowball':
                if (skin.type === 'atlas') {
                    return `${skinId}_sprites`;
                } else {
                    return `${skinId}_fireball`;
                }
            default:
                return `${skinId}_${assetType}`;
        }
    }

    static getPlayerFrame(): string {
        const skinId = this.getCurrentSkinId();
        
        if (skinId === 'classic') {
            return 'idle000'; // Classic winter: player = penguin
        } else if (skinId === 'wizard') {
            return 'wizard_ice_1_IDLE_000'; // Wizard: player = ice wizard
        } else {
            return 'idle000'; // Default to penguin
        }
    }

    static getEnemyFrame(size: 'Small' | 'Big'): string {
        const skinId = this.getCurrentSkinId();
        
        if (skinId === 'classic') {
            // Classic winter: enemies = snowmen
            return size === 'Small' ? 'snowman-small-idle0' : 'snowman-big-idle0';
        } else if (skinId === 'wizard') {
            return 'wizard_fire_1_IDLE_000'; // Wizard: enemies = fire wizard
        } else {
            // Default to snowmen
            return size === 'Small' ? 'snowman-small-idle0' : 'snowman-big-idle0';
        }
    }

    static getAnimationKey(entityType: 'player' | 'enemy', animationType: keyof SkinConfig['animations']['player'] | keyof SkinConfig['animations']['enemy']): string {
        const skin = this.getCurrentSkin();
        
        if (entityType === 'player') {
            return skin.animations.player[animationType as keyof SkinConfig['animations']['player']];
        } else {
            return skin.animations.enemy[animationType as keyof SkinConfig['animations']['enemy']];
        }
    }
}
