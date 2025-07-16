//VERSION AVEC NGZONE - RESPONSIVE
import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, ElementRef, ViewChild } from "@angular/core";
import Phaser from "phaser";
import { NgZone } from '@angular/core';
import { EventBus } from "../phaser/snowmen-attack/EventBus"; 
import { ScreenDetectionService, GameDimensions } from './services/screen-detection.service';

@Component({
    selector: 'phaser-game',
    template: '<div #gameContainer id="game-container" [style.width.px]="gameWidth" [style.height.px]="gameHeight" style="margin: 0 auto; border: 2px solid #333;"></div>',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhaserGame implements OnInit, OnDestroy {
    @Input() startGameResponsive?: (containerId: string, dimensions: GameDimensions) => Phaser.Game;
    @Input() startGame?: (containerId: string) => Phaser.Game; // Legacy support
    @ViewChild('gameContainer', { static: true }) gameContainer!: ElementRef<HTMLDivElement>;

    game!: Phaser.Game;
    gameWidth: number = 1024;
    gameHeight: number = 768;

    constructor(
        private ngZone: NgZone,
        private screenDetectionService: ScreenDetectionService
    ) {}

    ngOnInit() {
        // Use responsive version if available, otherwise fall back to legacy
        if (this.startGameResponsive) {
            this.initializeResponsiveGame();
        } else if (this.startGame) {
            this.initializeLegacyGame();
        } else {
            console.error("No startGame function provided to PhaserGame component.");
            return;
        }

        EventBus.on('current-scene-ready', (scene: Phaser.Scene) => {
            console.log("Scene ready:", scene.scene.key);
        });
    }

    private initializeResponsiveGame() {
        if (!this.startGameResponsive) return;
        
        // Add safety check for screen detection service
        let dimensions: GameDimensions;
        try {
            dimensions = this.screenDetectionService.getCurrentDimensions();
            if (!dimensions) {
                throw new Error('No dimensions available');
            }
        } catch (error) {
            console.warn('Failed to get current dimensions, using default:', error);
            // Fallback to default dimensions
            dimensions = {
                width: 1024,
                height: 768,
                assetScale: 1,
                uiScale: 1,
                screenSize: 'desktop' as any
            };
        }
        
        this.updateGameDimensions(dimensions);
        
        this.ngZone.runOutsideAngular(() => {
            this.game = this.startGameResponsive!('game-container', dimensions);
        });

        // Listen for screen size changes with error handling
        this.screenDetectionService.currentDimensions$.subscribe({
            next: (newDimensions) => {
                if (this.game && newDimensions) {
                    this.updateGameDimensions(newDimensions);
                    // Optionally restart game with new dimensions
                    this.restartGameWithNewDimensions(newDimensions);
                }
            },
            error: (error) => {
                console.error('Error in screen dimensions subscription:', error);
            }
        });
    }

    private initializeLegacyGame() {
        if (!this.startGame) return;
        
        this.ngZone.runOutsideAngular(() => {
            this.game = this.startGame!('game-container');
        });
    }

    private updateGameDimensions(dimensions: GameDimensions) {
        this.gameWidth = dimensions.width;
        this.gameHeight = dimensions.height;
        
        // Update the container size
        if (this.gameContainer && this.gameContainer.nativeElement) {
            this.gameContainer.nativeElement.style.width = `${dimensions.width}px`;
            this.gameContainer.nativeElement.style.height = `${dimensions.height}px`;
        }
    }

    private restartGameWithNewDimensions(dimensions: GameDimensions) {
        // Optional: Restart game when screen size changes significantly
        if (this.game && this.startGameResponsive) {
            this.game.destroy(true);
            this.ngZone.runOutsideAngular(() => {
                setTimeout(() => {
                    this.game = this.startGameResponsive!('game-container', dimensions);
                }, 100);
            });
        }
    }

    ngOnDestroy() {
        this.game?.destroy(true);
    }
}
