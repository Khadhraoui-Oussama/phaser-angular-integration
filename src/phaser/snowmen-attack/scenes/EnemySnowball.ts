import Phaser from 'phaser';
import MainGame from "./Game";
import Track from './Track';

export default class EnemySnowball extends Phaser.Physics.Arcade.Sprite {
    track!: Track;

    constructor(scene: Phaser.Scene, x: number, y: number, key: string, frame?: string | number) {
        super(scene, x, y, key, frame);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(0.5);
    }

    fire(x: number, y: number): void {
        const body = this.body as Phaser.Physics.Arcade.Body;

        body.enable = true;
        body.reset(x + 10, y - 44);

        this.setActive(true);
        this.setVisible(true);

        this.setVelocityX(200);
    }

    override stop(): this {
        this.setActive(false);
        this.setVisible(false);
        this.setVelocityX(0);

        const body = this.body as Phaser.Physics.Arcade.Body;
        body.enable = false;
        return this;
    }

    override preUpdate(time: number, delta: number): void {
        super.preUpdate(time, delta);

        if (this.x >= 970) {
            this.stop();

            const mainScene = this.scene as MainGame;

            const snowman = this.track.snowmanSmall;
            const answer = parseInt(snowman.label.text);

            mainScene.handleWrongAnswer(answer, this.track);
            mainScene.stopAllEnemySnowballs(); 
            mainScene.loadNextQuestion();
        }
    }

}
