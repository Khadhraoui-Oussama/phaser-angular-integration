import { Component } from '@angular/core';
import { PhaserGame } from '../../phaser-game.component';
import StartEmojiMatchGame from '../../../phaser/emoji-match/main';
import { EventBus } from '../../../phaser/emoji-match/EventBus';
import { RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-emoji-match-game',
  imports: [PhaserGame,RouterLink,RouterModule],
  templateUrl:"./emoji-match-game.component.html",
})
export class EmojiMatchGameComponent {
    startGameFn = StartEmojiMatchGame;
    
    constructor() {
        EventBus.on('current-scene-ready', (scene: Phaser.Scene) => {
            console.log('Emoji Match: Scene ready', scene.scene.key);
          });
        EventBus.on('game-over', this.onGameOver);
    }
  

  onGameOver = ([scene, highscore, score]: [Phaser.Scene, number, number]) => {
    console.log('Game Over Event Caught in Angular');
    console.log('Scene:', scene.scene.key);
    console.log('Score:', score, 'High Score:', highscore);

    // You can add logic here: show modal, save score, call backend, etc.
    alert(`Game Over!\nScore: ${score}\nHigh Score: ${highscore}`);
  };

  ngOnDestroy() {
    // Prevent leaks
    EventBus.off('game-over', this.onGameOver);
  }
}
