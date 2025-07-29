import Phaser from 'phaser';
import { SkinManager } from '../utils/SkinManager';

export default class Preloader extends Phaser.Scene {
    private loadText!: Phaser.GameObjects.Text;
    private responsiveConfig: any;

    constructor() {
        super('Preloader');
    }

    preload(): void {
        // Initialize skin system with game registry
        SkinManager.initialize(this.game.registry);
        
        // Get responsive config from game registry
        this.responsiveConfig = this.game.registry.get('responsiveConfig');
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;
        
        // Create responsive loading text
        const fontSize = this.responsiveConfig ? 
            Math.max(24, 74 * this.responsiveConfig.uiScale) : 74;
            
        this.loadText = this.add.text(centerX, centerY, 'Loading ...', {
            fontSize: `${fontSize}px`,
            fontFamily: 'Arial',
            color: '#e3f2ed',
            stroke: '#203c5b',
            strokeThickness: 6,
            align: 'center'
        });
        this.loadText.setOrigin(0.5);
        this.loadText.setShadow(2, 2, '#2d2d2d', 4, true, false);

        // Load all skins
        this.loadAllSkins();
        
        // Load shared assets (UI elements, sounds, etc.)
        this.loadSharedAssets();
    }

    private loadAllSkins(): void {
        const skins = SkinManager.getAllSkins();
        
        skins.forEach(skin => {
            this.load.setPath('assets/games/snowmen-attack/');
            
            if (skin.type === 'atlas') {
                // Load classic atlas-based skin (use existing assets)
                this.load.image(`${skin.id}_background`, skin.assets.background);
                this.load.image(`${skin.id}_overlay`, skin.assets.overlay);
                this.load.atlas(`${skin.id}_sprites`, skin.assets.sprites!, skin.assets.spritesJson!);
            } else if (skin.type === 'individual') {
                // Load wizard individual frame skin
                this.load.image(`${skin.id}_background`, skin.assets.background);
                this.load.image(`${skin.id}_overlay`, skin.assets.overlay);
                this.load.image(`${skin.id}_iceball`, skin.assets.playerSnowball!);
                this.load.image(`${skin.id}_fireball`, skin.assets.enemySnowball!);
                
                // Load wizard frames
                this.loadWizardFrames(skin.id);
            }
        });
    }

    private loadWizardFrames(skinId: string): void {
        // Load wizard_ice frames - available frames based on actual file structure
        const iceFrames = [
            '1_IDLE_000', '1_IDLE_001', '1_IDLE_002', '1_IDLE_003', '1_IDLE_004',
            '2_WALK_000', '2_WALK_001', '2_WALK_002', '2_WALK_003', '2_WALK_004',
            '5_ATTACK_000', '5_ATTACK_002', '5_ATTACK_004', '5_ATTACK_005', '5_ATTACK_006',
            '6_HURT_000', '6_HURT_001', '6_HURT_002', '6_HURT_003', '6_HURT_004',
            '7_DIE_000', '7_DIE_004', '7_DIE_006', '7_DIE_008', '7_DIE_011'
        ];
        
        iceFrames.forEach(frame => {
            this.load.image(`${skinId}_ice_${frame}`, `wizard_skin/wizard_ice/${frame}.png`);
        });
        
        // Load wizard_fire frames - available frames based on actual file structure  
        const fireFrames = [
            '1_IDLE_000', '1_IDLE_001', '1_IDLE_002', '1_IDLE_003', '1_IDLE_004',
            '2_WALK_000', '2_WALK_001', '2_WALK_002', '2_WALK_003', '2_WALK_004',
            '5_ATTACK_000', '5_ATTACK_002', '5_ATTACK_004', '5_ATTACK_005', '5_ATTACK_006',
            '6_HURT_000', '6_HURT_001', '6_HURT_002', '6_HURT_003', '6_HURT_004',
            '7_DIE_000', '7_DIE_003', '7_DIE_007', '7_DIE_009', '7_DIE_014'
        ];
        
        fireFrames.forEach(frame => {
            this.load.image(`${skinId}_fire_${frame}`, `wizard_skin/wizard_fire/${frame}.png`);
        });
    }

    private loadSharedAssets(): void {
        // Set asset path to EduSpace folder for shared assets
        this.load.setPath('assets/games/Eduspace/');
        
        // Load main background and overlay
        this.load.image('bg', 'bg.png');
        this.load.image('overlay', 'overlay.png');
        
        // Load main menu UI assets
        this.load.setPath('assets/games/Eduspace/main_menu_assets/');
        this.load.svg('information', 'information.svg');
        this.load.svg('settings', 'settings.svg');
        this.load.svg('skin_change', 'skin_change.svg');
        this.load.svg('ui_element_small', 'ui_element_small.svg');
        this.load.svg('ui_element_large', 'ui_elemeny_large.svg');
        
        // Load sounds from EduSpace sounds folder
        this.load.setPath('assets/games/Eduspace/sounds/');
        this.load.audio('menu_music', 'menu_music.mp3');
        this.load.audio('shoot_laser', 'shoot_laser.mp3');
        
        // For now, fallback to snowmen-attack assets for missing ones
        this.load.setPath('assets/games/snowmen-attack/');
        
        //loading the question_ui with responsive assets (shared across skins)
        this.load.image('question_ui_large',"question_ui_large.png")
        this.load.image('question_ui',"question_ui.png")
        this.load.image('question_ui_no_top',"question_ui_no_top.png")
        this.load.image('question_ui_large_short_on_top',"question_ui_large_short_on_top.png")
        
        // Load shared images
        this.load.image('gameover',"gameover.png");
        this.load.image('title',"title.png");
        this.load.spritesheet('eggs_crack', 'eggs_crack.png', { frameWidth: 125, frameHeight: 125 });
        
        // Load sounds from main folder (shared across all devices)
        this.load.setPath('assets/games/snowmen-attack/sounds/');
        this.load.audio('music', ['music.ogg', 'music.m4a', 'music.mp3']);
        this.load.audio('move', ['move.ogg', 'move.m4a', 'move.mp3']);
        this.load.audio('hit-snowman', ['hit-snowman.ogg', 'hit-snowman.m4a', 'hit-snowman.mp3']);
        this.load.audio('gameover', ['gameover.ogg', 'gameover.m4a', 'gameover.mp3']);
        this.load.audio('success_sfx', 'success_sfx.mp3');
        this.load.audio('error_sfx', 'error_sfx.mp3');
        
        // Load shader from main folder
        this.load.setPath('assets/games/snowmen-attack/');
        this.load.glsl('snow', 'snow.glsl.js');
    }

    create(): void {
        // Re-initialize skin system with current registry to ensure proper sync
        SkinManager.initialize(this.game.registry);
        
        // Clear any existing animations before creating new ones for the current skin
        this.clearExistingAnimations();
        this.createAnimations();

        if (this.sound.locked) {
            this.loadText.setText('Click to Start');
            this.input.once('pointerdown', () => {
                // Clear the skin selection flag and always go to MainMenu
                this.registry.set('fromSkinSelection', false);
                this.scene.start('MainMenu');
            });
        } else {
            // Clear the skin selection flag and always go to MainMenu
            this.registry.set('fromSkinSelection', false);
            this.scene.start('MainMenu');
        }
    }

    private createAnimations(): void {
        const currentSkin = SkinManager.getCurrentSkin();
        
        if (currentSkin.type === 'atlas') {
            this.createAtlasAnimations();
        } else {
            this.createIndividualFrameAnimations();
        }
    }

    private createAtlasAnimations(): void {
        const skinId = SkinManager.getCurrentSkinId();
        const spritesKey = `${skinId}_sprites`;

        this.anims.create({
            key: 'die',
            frames: this.anims.generateFrameNames(spritesKey, { prefix: 'die', start: 0, end: 0, zeroPad: 3 }),
        });

        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNames(spritesKey, { prefix: 'idle', start: 0, end: 3, zeroPad: 3 }),
            yoyo: true,
            frameRate: 8,
            repeat: -1,
        });

        this.anims.create({
            key: 'throwStart',
            frames: this.anims.generateFrameNames(spritesKey, { prefix: 'throw', start: 0, end: 8, zeroPad: 3 }),
            frameRate: 26,
        });

        this.anims.create({
            key: 'throwEnd',
            frames: this.anims.generateFrameNames(spritesKey, { prefix: 'throw', start: 9, end: 11, zeroPad: 3 }),
            frameRate: 26,
        });

        this.anims.create({
            key: 'snowmanIdleBig',
            frames: this.anims.generateFrameNames(spritesKey, { prefix: 'snowman-big-idle', start: 0, end: 3 }),
            yoyo: true,
            frameRate: 8,
            repeat: -1,
        });

        this.anims.create({
            key: 'snowmanWalkBig',
            frames: this.anims.generateFrameNames(spritesKey, { prefix: 'snowman-big-walk', start: 0, end: 7 }),
            frameRate: 8,
            repeat: -1,
        });

        this.anims.create({
            key: 'snowmanThrowStartBig',
            frames: this.anims.generateFrameNames(spritesKey, { prefix: 'snowman-big-throw', start: 0, end: 5 }),
            frameRate: 20,
        });

        this.anims.create({
            key: 'snowmanThrowEndBig',
            frames: this.anims.generateFrameNames(spritesKey, { prefix: 'snowman-big-throw', start: 6, end: 8 }),
            frameRate: 20,
        });

        this.anims.create({
            key: 'snowmanDieBig',
            frames: this.anims.generateFrameNames(spritesKey, { prefix: 'snowman-big-die', start: 0, end: 4 }),
            frameRate: 14,
        });

        this.anims.create({
            key: 'snowmanIdleSmall',
            frames: this.anims.generateFrameNames(spritesKey, { prefix: 'snowman-small-idle', start: 0, end: 3 }),
            yoyo: true,
            frameRate: 8,
            repeat: -1,
        });

        this.anims.create({
            key: 'snowmanWalkSmall',
            frames: this.anims.generateFrameNames(spritesKey, { prefix: 'snowman-small-walk', start: 0, end: 7 }),
            frameRate: 8,
            repeat: -1,
        });

        this.anims.create({
            key: 'snowmanThrowStartSmall',
            frames: this.anims.generateFrameNames(spritesKey, { prefix: 'snowman-small-throw', start: 0, end: 5 }),
            frameRate: 20,
        });

        this.anims.create({
            key: 'snowmanThrowEndSmall',
            frames: this.anims.generateFrameNames(spritesKey, { prefix: 'snowman-small-throw', start: 6, end: 8 }),
            frameRate: 20,
        });

        this.anims.create({
            key: 'snowmanDieSmall',
            frames: this.anims.generateFrameNames(spritesKey, { prefix: 'snowman-small-die', start: 0, end: 4 }),
            frameRate: 14,
        });
    }

    private createIndividualFrameAnimations(): void {
        const skinId = SkinManager.getCurrentSkinId();

        // Player (wizard_ice) animations - using multiple ice frames for smooth animation
        this.anims.create({
            key: 'idle',
            frames: [
                { key: `${skinId}_ice_1_IDLE_000` },
                { key: `${skinId}_ice_1_IDLE_001` },
                { key: `${skinId}_ice_1_IDLE_002` },
                { key: `${skinId}_ice_1_IDLE_003` },
                { key: `${skinId}_ice_1_IDLE_004` }
            ],
            frameRate: 8,
            repeat: -1,
        });

        this.anims.create({
            key: 'throwStart',
            frames: [
                { key: `${skinId}_ice_5_ATTACK_000` },
                { key: `${skinId}_ice_5_ATTACK_002` },
                { key: `${skinId}_ice_5_ATTACK_004` }
            ],
            frameRate: 26,
        });

        this.anims.create({
            key: 'throwEnd',
            frames: [
                { key: `${skinId}_ice_5_ATTACK_004` },
                { key: `${skinId}_ice_5_ATTACK_005` },
                { key: `${skinId}_ice_5_ATTACK_006` }
            ],
            frameRate: 26,
        });

        // Enemy (wizard_fire) animations using fire wizard frames
        this.anims.create({
            key: 'snowmanIdleSmall',
            frames: [
                { key: `${skinId}_fire_1_IDLE_000` },
                { key: `${skinId}_fire_1_IDLE_001` },
                { key: `${skinId}_fire_1_IDLE_002` },
                { key: `${skinId}_fire_1_IDLE_003` },
                { key: `${skinId}_fire_1_IDLE_004` }
            ],
            frameRate: 8,
            repeat: -1,
        });

        this.anims.create({
            key: 'snowmanWalkSmall',
            frames: [
                { key: `${skinId}_fire_2_WALK_000` },
                { key: `${skinId}_fire_2_WALK_001` },
                { key: `${skinId}_fire_2_WALK_002` },
                { key: `${skinId}_fire_2_WALK_003` },
                { key: `${skinId}_fire_2_WALK_004` }
            ],
            frameRate: 8,
            repeat: -1,
        });

        this.anims.create({
            key: 'snowmanThrowStartSmall',
            frames: [
                { key: `${skinId}_fire_5_ATTACK_000` },
                { key: `${skinId}_fire_5_ATTACK_002` },
                { key: `${skinId}_fire_5_ATTACK_004` }
            ],
            frameRate: 20,
        });

        this.anims.create({
            key: 'snowmanThrowEndSmall',
            frames: [
                { key: `${skinId}_fire_5_ATTACK_004` },
                { key: `${skinId}_fire_5_ATTACK_005` },
                { key: `${skinId}_fire_5_ATTACK_006` }
            ],
            frameRate: 20,
        });

        this.anims.create({
            key: 'snowmanDieSmall',
            frames: [
                { key: `${skinId}_fire_7_DIE_000` },
                { key: `${skinId}_fire_7_DIE_003` },
                { key: `${skinId}_fire_7_DIE_007` },
                { key: `${skinId}_fire_7_DIE_009` },
                { key: `${skinId}_fire_7_DIE_014` }
            ],
            frameRate: 14,
        });

        // Big snowman animations (same as small for wizard)
        this.anims.create({
            key: 'snowmanIdleBig',
            frames: [
                { key: `${skinId}_fire_1_IDLE_000` },
                { key: `${skinId}_fire_1_IDLE_001` },
                { key: `${skinId}_fire_1_IDLE_002` },
                { key: `${skinId}_fire_1_IDLE_003` },
                { key: `${skinId}_fire_1_IDLE_004` }
            ],
            frameRate: 8,
            repeat: -1,
        });

        this.anims.create({
            key: 'snowmanWalkBig',
            frames: [
                { key: `${skinId}_fire_2_WALK_000` },
                { key: `${skinId}_fire_2_WALK_001` },
                { key: `${skinId}_fire_2_WALK_002` },
                { key: `${skinId}_fire_2_WALK_003` },
                { key: `${skinId}_fire_2_WALK_004` }
            ],
            frameRate: 8,
            repeat: -1,
        });

        this.anims.create({
            key: 'snowmanThrowStartBig',
            frames: [
                { key: `${skinId}_fire_5_ATTACK_000` },
                { key: `${skinId}_fire_5_ATTACK_002` },
                { key: `${skinId}_fire_5_ATTACK_004` }
            ],
            frameRate: 20,
        });

        this.anims.create({
            key: 'snowmanThrowEndBig',
            frames: [
                { key: `${skinId}_fire_5_ATTACK_004` },
                { key: `${skinId}_fire_5_ATTACK_005` },
                { key: `${skinId}_fire_5_ATTACK_006` }
            ],
            frameRate: 20,
        });

        this.anims.create({
            key: 'snowmanDieBig',
            frames: [
                { key: `${skinId}_fire_7_DIE_000` },
                { key: `${skinId}_fire_7_DIE_003` },
                { key: `${skinId}_fire_7_DIE_007` },
                { key: `${skinId}_fire_7_DIE_009` },
                { key: `${skinId}_fire_7_DIE_014` }
            ],
            frameRate: 14,
        });
    }

    private clearExistingAnimations(): void {
        // List of all animation keys that might exist from previous skin loads
        const animKeys = [
            // Atlas-based animations (classic skin)
            'die', 'idle', 'throwStart', 'throwEnd', 
            'snowmanIdleSmall', 'snowmanWalkSmall', 'snowmanThrowStartSmall', 
            'snowmanThrowEndSmall', 'snowmanDieSmall', 'snowmanIdleBig', 
            'snowmanWalkBig', 'snowmanThrowStartBig', 'snowmanThrowEndBig', 'snowmanDieBig',
            // Individual frame animations (wizard skin)
            'wizard_ice_idle', 'wizard_ice_attack', 'wizard_fire_idle', 
            'wizard_fire_walk', 'wizard_fire_attack', 'wizard_fire_die'
        ];
        
        // Remove existing animations if they exist
        animKeys.forEach(key => {
            if (this.anims.exists(key)) {
                this.anims.remove(key);
            }
        });
    }
}
