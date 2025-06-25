import Phaser from 'phaser';
import { EventBus } from '../EventBus';

export class MainMenu extends Phaser.Scene {
    private music?: Phaser.Sound.BaseSound;

    constructor() {
        super('MainMenu');
    }

    create(): void {
        const background = this.add.image(400, 300, 'background');
        this.tweens.add({ targets: background, alpha: { from: 0, to: 1 }, duration: 1000 });

        const fontStyle: Phaser.Types.GameObjects.Text.TextStyle = {
            fontFamily: 'Arial',
            fontSize: '48px',
            color: '#ffffff',
            fontStyle: 'bold',
            padding: { top: 16, bottom: 16 },
            shadow: {
                color: '#000000', fill: true, offsetX: 2, offsetY: 2, blur: 4
            }
        };

        this.add.text(20, 20, 'High Score: ' + this.registry.get('highscore'), fontStyle);
        const logo = this.add.image(400, -200, 'logo');

        if (!this.music) {
            this.music = this.sound.add('music', { loop: true });
            this.music.play();
        }

        this.tweens.add({
            targets: logo,
            y: 300,
            ease: 'Bounce.easeOut',
            duration: 1200
        });

        this.input.once('pointerdown', () => this.scene.start('MainGame'));
        
        EventBus.emit('current-scene-ready', this);
    }
}
