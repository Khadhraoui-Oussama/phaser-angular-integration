import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import Phaser from "phaser";

import { EventBus } from "../phaser/emoji-match/EventBus"; 
@Component({
    selector: 'phaser-game',
    template: '<div id="game-container"></div>',
    standalone: true,
})
export class PhaserGame implements OnInit, OnDestroy {
    @Input() startGame!: (containerId: string) => Phaser.Game;

    game!: Phaser.Game;

    ngOnInit() {
        if (!this.startGame) {
            console.error("No startGame function provided to PhaserGame component.");
            return;
        }
        this.game = this.startGame('game-container');

        EventBus.on('current-scene-ready', (scene: Phaser.Scene) => {
            console.log("Scene ready:", scene.scene.key);
        });
       
    }

    ngOnDestroy() {
        this.game?.destroy(true);
    }
}
// export class PhaserGame implements OnInit,OnDestroy
// {
//     @Input() startGame!: (containerId: string) => Phaser.Game;

//     scene: Phaser.Scene;
//     game!: Phaser.Game;
//     sceneCallback: (scene: Phaser.Scene) => void;

//     ngOnInit ()
//     {
//         this.game = StartGame('game-container');

//         EventBus.on('current-scene-ready', (scene: Phaser.Scene) =>
//         {
//             this.scene = scene;

//             if (this.sceneCallback)
//             {
//                 this.sceneCallback(scene);
//             }
//         });
//     }

//     ngOnDestroy ()
//     {
//         if (this.game)
//         {
//             this.game.destroy(true);
//         }
//     }
// }
