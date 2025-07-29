import { Component } from '@angular/core';
import { PhaserGame } from '../../phaser-game.component';
import { RouterLink, RouterModule } from '@angular/router';
import { StartSnowmenAttackGameResponsive } from '../../../phaser/EduSpace/main';
import { ScreenDetectionService } from '../../services/screen-detection.service';
import { EventBus } from '../../../phaser/EduSpace/EventBus';

@Component({
  selector: 'app-eduspace-game-component',
  imports: [PhaserGame,RouterModule,RouterLink],
  templateUrl: './eduspace-game-component.component.html',
  styleUrl: './eduspace-game-component.component.css'
})
export class EduspaceGameComponentComponent {
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
