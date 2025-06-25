import { Component } from '@angular/core';
import { PhaserGame } from '../../phaser-game.component';
import StartSnowmenAttackGame from '../../../phaser/snowmen-attack/main';
import { EventBus } from '../../../phaser/snowmen-attack/EventBus';

@Component({
  selector: 'app-snowmen-attack-game',
  imports: [PhaserGame],
  template: `<phaser-game [startGame]="startGameFn"></phaser-game>`,
  styleUrl: './snowmen-attack-game.component.css'
})
export class SnowmenAttackGameComponent {
    startGameFn = StartSnowmenAttackGame;
    
    constructor() {
        EventBus.on('current-scene-ready', (scene: Phaser.Scene) => {
            console.log('Snowmen Attack: Scene ready', scene.scene.key);
          });
        EventBus.on('game-over', this.onGameOver);
    }
  

  onGameOver = (scene:Phaser.Scene) => {
    console.log('Game Over Event Caught in Angular');
    console.log('Scene:', scene.scene.key);
    
  };

  ngOnDestroy() {
    // Prevent leaks
    EventBus.off('game-over', this.onGameOver);
  }
}
