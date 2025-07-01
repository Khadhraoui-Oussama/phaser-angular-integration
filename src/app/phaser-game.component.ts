//VERSION AVEC NGZONE
import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit } from "@angular/core";
import Phaser from "phaser";
import { NgZone } from '@angular/core';
import { EventBus } from "../phaser/snowmen-attack/EventBus"; 
@Component({
    selector: 'phaser-game',
    template: '<div id="game-container"></div>',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhaserGame implements OnInit, OnDestroy {
    @Input() startGame!: (containerId: string) => Phaser.Game;

    game!: Phaser.Game;

    constructor(private ngZone: NgZone) {}

    ngOnInit() {
        if (!this.startGame) {
            console.error("No startGame function provided to PhaserGame component.");
            return;
        }
        this.ngZone.runOutsideAngular(() => {
            this.game = this.startGame('game-container');
            EventBus.on('current-scene-ready', (scene: Phaser.Scene) => {
                console.log("Scene ready:", scene.scene.key);
            });
        });
    }

    ngOnDestroy() {
        this.game?.destroy(true);
    }
}
