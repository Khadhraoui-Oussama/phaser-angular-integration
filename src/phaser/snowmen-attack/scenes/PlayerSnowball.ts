import Phaser from 'phaser';

export default class PlayerSnowball extends Phaser.Physics.Arcade.Sprite {
    constructor(scene: Phaser.Scene, x: number, y: number, key: string, frame?: string | number) {
        super(scene, x, y, key, frame);

        this.setScale(0.5);
    }

    fire(x: number, y: number): void {
        if (this.body) {
            this.body.enable = true;
            this.body.reset(x + 10, y - 44);
        }

        this.setActive(true);
        this.setVisible(true);

        this.setVelocityX(-600);
        this.setAccelerationX(-1400);
    }

    override stop(): this {
        this.setActive(false);
        this.setVelocityX(0);
        if (this.body) {
            this.body.enable = false;
        }
        this.setVelocityX(0);
        if (this.body) {
            this.body.enable = false;
        }
        return this;
    }

    override preUpdate(time: number, delta: number): void {
        super.preUpdate(time, delta);

        if (this.x <= -64) {
            this.stop();
        }
    }
}
