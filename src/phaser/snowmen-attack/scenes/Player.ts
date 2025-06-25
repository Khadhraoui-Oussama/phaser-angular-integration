import Phaser from 'phaser';
import Track from './Track';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    isAlive: boolean;
    isThrowing: boolean;
    currentTrack: Track;
    sound: Phaser.Sound.BaseSoundManager;

    spacebar: Phaser.Input.Keyboard.Key;
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;

    constructor(scene: Phaser.Scene & { tracks: Track[] }, track: Track) {
        super(scene, 900, track.y, 'sprites', 'idle000');

        this.setOrigin(0.5, 1);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.isAlive = true;
        this.isThrowing = false;

        this.sound = scene.sound;
        this.currentTrack = track;

        this.spacebar = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.up = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
        this.down = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);

        this.play('idle');
    }

    start(): void {
        this.isAlive = true;
        this.isThrowing = false;

        this.currentTrack = (this.scene as any).tracks[0];
        this.y = this.currentTrack.y;

        this.on('animationcomplete-throwStart', this.releaseSnowball, this);
        this.on('animationcomplete-throwEnd', this.throwComplete, this);

        this.play('idle', true);
    }

    moveUp(): void {
        if (this.currentTrack.id === 0) {
            this.currentTrack = (this.scene as any).tracks[3];
        } else {
            this.currentTrack = (this.scene as any).tracks[this.currentTrack.id - 1];
        }

        this.y = this.currentTrack.y;
        this.sound.play('move');
    }

    moveDown(): void {
        if (this.currentTrack.id === 3) {
            this.currentTrack = (this.scene as any).tracks[0];
        } else {
            this.currentTrack = (this.scene as any).tracks[this.currentTrack.id + 1];
        }

        this.y = this.currentTrack.y;
        this.sound.play('move');
    }

    throw(): void {
        this.isThrowing = true;
        this.play('throwStart');
        this.sound.play('throw');
    }

    releaseSnowball(): void {
        this.play('throwEnd');
        this.currentTrack.throwPlayerSnowball(this.x);
    }

    throwComplete(): void {
        this.isThrowing = false;
        this.play('idle');
    }

    override stop(): this {
        this.isAlive = false;
        if (this.body) {
            this.body.stop();
        }
        this.play('die');
        return this;
    }

    override preUpdate(time: number, delta: number): void {
        super.preUpdate(time, delta);

        if (!this.isAlive) return;

        if (Phaser.Input.Keyboard.JustDown(this.up)) {
            this.moveUp();
        } else if (Phaser.Input.Keyboard.JustDown(this.down)) {
            this.moveDown();
        } else if (Phaser.Input.Keyboard.JustDown(this.spacebar) && !this.isThrowing) {
            this.throw();
        }
    }
}
