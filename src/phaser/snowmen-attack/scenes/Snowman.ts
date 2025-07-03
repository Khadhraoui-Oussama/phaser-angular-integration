import Phaser from 'phaser';
import Track from './Track';

export default class Snowman extends Phaser.Physics.Arcade.Sprite {
    time: Phaser.Time.Clock;
    sound: Phaser.Sound.BaseSoundManager;
    isAlive: boolean;
    isThrowing: boolean;
    size: 'Small' | 'Big';
    speed: number;
    previousAction: number;
    currentTrack: Track;
    currentHitpoints?: number;
    maxHitpoints?: number;
    chooseEvent?: Phaser.Time.TimerEvent;
    label: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, track: Track, size: 'Small' | 'Big',option:number) {
        const frame = (size === 'Small') ? 'snowman-small-idle0' : 'snowman-big-idle0';
        const x = (size === 'Small') ? 80 : -100;
        super(scene, x, track.y, 'sprites', frame);
        this.setOrigin(0.5, 1);
        
        //setting depth to 2 makes sure that big snowmen appear on top of the question board which has a depth of 1
        this.depth = 2
        scene.add.existing(this);
        scene.physics.add.existing(this);
        if (size === 'Small') {
            (this.body as Phaser.Physics.Arcade.Body).setSize(100, 100);
            (this.body as Phaser.Physics.Arcade.Body).setOffset(20, 40);
        } else {
            (this.body as Phaser.Physics.Arcade.Body).setSize(100, 120);
            (this.body as Phaser.Physics.Arcade.Body).setOffset(50, 50);
        }
        this.time = scene.time;
        this.sound = scene.sound;
        this.isAlive = true;
        this.isThrowing = false;
        this.size = size;
        this.speed = 50;
        this.previousAction = 0;
        this.currentTrack = track;
        this.play('snowmanIdle' + this.size);
        if(option !== 0){
            this.label = scene.add.text(this.x, this.y, option.toString(), {
                font: '1.15rem Arial',
                color: '#000000',
            }).setOrigin(0.5, 0.4);
            this.label.setDepth(this.depth);
        }else {
            this.label = scene.add.text(this.x, this.y, '', {
                font: '1.15rem Arial',
                color: '#000000',
            }).setOrigin(0.5, 0.4);
            this.label.setDepth(this.depth);
        }
    }

    start(): void {
        this.isAlive = true;
        this.isThrowing = false;
        this.previousAction = 0;
        this.currentHitpoints = this.maxHitpoints;
        this.y = this.currentTrack.y;
        this.on('animationcomplete-snowmanThrowStart' + this.size, this.releaseSnowball, this);
        this.on('animationcomplete-snowmanThrowEnd' + this.size, this.throwComplete, this);
        this.setActive(true);
        this.setVisible(true);
        this.play('snowmanWalk' + this.size);
        this.setVelocityX(this.speed);
        this.chooseEvent = this.time.delayedCall(Phaser.Math.Between(3000, 6000), this.chooseAction, [], this);
    }

    chooseAction(): void {
        this.isAlive = true;
        if (this.body) {
            (this.body as Phaser.Physics.Arcade.Body).enable = true;
        
        this.setVelocityX(0);
        const t = Phaser.Math.Between(0, 100);
        if (t < 50) {
            if (this.previousAction === 2) {
                this.walk();
            } else {
                this.throw();
            }
        } else if (t > 60) {
            this.walk();
        } else {
            if (this.previousAction === 1) {
                if (t > 55) {
                    this.walk();
                } else {
                    this.throw();
                }
            } else {
                this.goIdle();
            }
        }
    }

    }

    walk(): void {
        this.previousAction = 0;
        this.play('snowmanWalk' + this.size, true);
        this.setVelocityX(this.speed);
        this.chooseEvent = this.time.delayedCall(Phaser.Math.Between(3000, 6000), this.chooseAction, [], this);
    }

    goIdle(): void {
        this.previousAction = 1;
        this.play('snowmanIdle' + this.size, true);
        this.chooseEvent = this.time.delayedCall(Phaser.Math.Between(2000, 4000), this.chooseAction, [], this);
    }

    throw(): void {
        this.previousAction = 2;
        this.isThrowing = true;
        this.play('snowmanThrowStart' + this.size);
    }

    releaseSnowball(): void {
        if (!this.isAlive) {
            return;
        }
        this.play('snowmanThrowEnd' + this.size);
        this.currentTrack.throwEnemySnowball(this.x);
    }

    throwComplete(): void {
        if (!this.isAlive) {
            return;
        }
        this.isThrowing = false;
        this.play('snowmanIdle' + this.size);
        this.chooseEvent = this.time.delayedCall(Phaser.Math.Between(2000, 4000), this.chooseAction, [], this);
    }

    hit(): void {
        if (this.chooseEvent) {
            this.chooseEvent.remove();
        }
        this.isAlive = false;
        this.label.setVisible(false);
        this.previousAction = -1;
        this.play('snowmanDie' + this.size);
        this.sound.play('hit-snowman');
        (this.body as Phaser.Physics.Arcade.Body).stop();
        (this.body as Phaser.Physics.Arcade.Body).enable = false;
        const knockback = '-=' + Phaser.Math.Between(100, 200).toString();
        this.scene.tweens.add({
            targets: this,
            x: knockback,
            ease: 'sine.out',
            duration: 1000,
            onComplete: () => {
                if (this.x < -100) {
                    this.x = -100;
                }
            }
        });
        this.chooseEvent = this.time.delayedCall(Phaser.Math.Between(1000, 3000), this.chooseAction, [], this);
    }

    override stop(): this {
        if (this.chooseEvent) {
            this.chooseEvent.remove();
        }
        this.isAlive = false;
        this.label.setVisible(false);
        this.play('snowmanIdle' + this.size);
        this.setVelocityX(0);
        return this;
    }

    override preUpdate(time: number, delta: number): void {
        super.preUpdate(time, delta);
        if (this.label) {
           this.label.setPosition(this.x, this.y + 10);
        }
        if (this.x >= 880) {
            this.stop();
            (this.scene as any).gameOver();
        }
        
    }
    setLabel(text: string) {
        this.label.setText(text);
    }

}
