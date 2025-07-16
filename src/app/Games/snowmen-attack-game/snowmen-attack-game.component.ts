import { Component } from '@angular/core';
import { PhaserGame } from '../../phaser-game.component';
import StartSnowmenAttackGame, { StartSnowmenAttackGameResponsive } from '../../../phaser/snowmen-attack/main';
import { EventBus } from '../../../phaser/snowmen-attack/EventBus';
import { RouterLink, RouterModule } from '@angular/router';
import { ScreenDetectionService } from '../../services/screen-detection.service';

@Component({
  selector: 'app-snowmen-attack-game',
  imports: [PhaserGame,RouterModule,RouterLink],
  templateUrl:"./snowmen-attack-game.component.html",
  styleUrl: './snowmen-attack-game.component.css'
})
export class SnowmenAttackGameComponent {
    startGameFn = StartSnowmenAttackGame; // Legacy function
    startGameResponsiveFn = StartSnowmenAttackGameResponsive; // New responsive function
    
    constructor(private screenDetectionService: ScreenDetectionService) {
        EventBus.on('current-scene-ready', (scene: Phaser.Scene) => {
            console.log('Snowmen Attack: Scene ready', scene.scene.key);
            try {
                console.log('Current screen size:', this.screenDetectionService.getCurrentScreenSize());
                console.log('Current dimensions:', this.screenDetectionService.getCurrentDimensions());
            } catch (error) {
                console.error('Error accessing screen detection service:', error);
            }
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
