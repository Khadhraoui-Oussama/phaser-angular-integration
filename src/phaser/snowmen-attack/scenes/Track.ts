import Snowman from './Snowman';
import PlayerSnowball from './PlayerSnowball';
import EnemySnowball from './EnemySnowball';
import Phaser from 'phaser';

export default class Track {
    scene: Phaser.Scene;
    id: number;
    y: number;
    nest: Phaser.Physics.Arcade.Image;
    snowmanBig: Snowman;
    snowmanSmall: Snowman;
    playerSnowballs: Phaser.Physics.Arcade.Group;
    enemySnowballs: Phaser.Physics.Arcade.Group;
    snowBallCollider: Phaser.Physics.Arcade.Collider;
    snowmanSmallCollider: Phaser.Physics.Arcade.Collider;
    snowmanBigCollider: Phaser.Physics.Arcade.Collider;
    releaseTimerSmall: Phaser.Time.TimerEvent;
    releaseTimerBig: Phaser.Time.TimerEvent;

    constructor(scene: Phaser.Scene, id: number, trackY: number) {
        this.scene = scene;
        this.id = id;
        this.y = trackY;

        this.nest = scene.physics.add.image(1024, trackY - 10, 'sprites', 'nest').setOrigin(1, 1);

        this.snowmanBig = new Snowman(scene, this, 'Big');
        this.snowmanSmall = new Snowman(scene, this, 'Small');

        this.playerSnowballs = scene.physics.add.group({
            frameQuantity: 8,
            key: 'sprites',
            frame: 'snowball2',
            active: false,
            visible: false,
            classType: PlayerSnowball
        });

        this.enemySnowballs = scene.physics.add.group({
            frameQuantity: 8,
            key: 'sprites',
            frame: 'snowball3',
            active: false,
            visible: false,
            classType: EnemySnowball
        });

        this.snowBallCollider = scene.physics.add.overlap(
            this.playerSnowballs,
            this.enemySnowballs,
            this.hitSnowball as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
            undefined,
            this
        );
        this.snowmanSmallCollider = scene.physics.add.overlap(
            this.snowmanSmall,
            this.playerSnowballs,
            this.hitSnowman as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
            undefined,
            this
        );
        this.snowmanBigCollider = scene.physics.add.overlap(
            this.snowmanBig,
            this.playerSnowballs,
            this.hitSnowman as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
            undefined,
            this
        );
    }

    start(minDelay: number, maxDelay: number): void {
        const delay = Phaser.Math.Between(minDelay, maxDelay);

        this.releaseTimerSmall = this.scene.time.addEvent({
            delay: delay,
            callback: () => {
                this.snowmanSmall.start();
            }
        });

        this.releaseTimerBig = this.scene.time.addEvent({
            delay: delay * 3,
            callback: () => {
                this.snowmanBig.start();
            }
        });
    }

    stop(): void {
        this.snowmanSmall.stop();
        this.snowmanBig.stop();

        for (let snowball of this.playerSnowballs.getChildren() as PlayerSnowball[])
        {
            snowball.stop();
        }

        for (let snowball of this.enemySnowballs.getChildren() as EnemySnowball[])
        {
            snowball.stop();
        }

        this.releaseTimerSmall.remove();
        this.releaseTimerBig.remove();
    }

    hitSnowball(
        ball1: Phaser.GameObjects.GameObject,
        ball2: Phaser.GameObjects.GameObject
    ): void {
        if (ball1 instanceof PlayerSnowball && ball2 instanceof EnemySnowball) {
            ball1.stop();
            ball2.stop();
        }
    }

    hitSnowman(
        snowman: Phaser.GameObjects.GameObject,
        ball: Phaser.GameObjects.GameObject
    ): void {
        if (snowman instanceof Snowman && ball instanceof PlayerSnowball) {
            if (snowman.isAlive && snowman.x > 0) {
                ball.stop();
                snowman.hit();
            }
        }
    }

    throwPlayerSnowball(x: number): void {
        let snowball = this.playerSnowballs.getFirstDead(false) as PlayerSnowball;

        if (snowball)
        {
            snowball.fire(x, this.y);
        }
    }

    throwEnemySnowball(x: number): void {
        let snowball = this.enemySnowballs.getFirstDead(false) as EnemySnowball;

        if (snowball)
        {
            snowball.fire(x, this.y);
        }
    }
}
