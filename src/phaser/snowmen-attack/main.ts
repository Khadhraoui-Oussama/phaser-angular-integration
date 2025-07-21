import Phaser from 'phaser';
import { AUTO, Game } from 'phaser';
import {Boot} from './scenes/Boot';
import Preloader from './scenes/Preloader';
import MainMenu from './scenes/MainMenu';
import MainGame from './scenes/Game'; // make sure Game.js was renamed to MainGame.ts
import TableSelectScene from './scenes/TableSelectScene';
import VictoryScene from './scenes/VictoryScene';
import ReviewMistakesScene from './scenes/ReviewMistakesScene';
import LanguageSelectionScene from './scenes/LanguageSelectionScene';
import SkinSelection from './scenes/SkinSelection';

// Import types for responsive configuration
export interface GameDimensions {
    width: number;
    height: number;
    assetScale: number;
    uiScale: number;
    screenSize: string;
}

// Create responsive config function
const createResponsiveConfig = (dimensions: GameDimensions, parent: string): Phaser.Types.Core.GameConfig => {
    // Calculate appropriate min/max based on screen size
    const minWidth = dimensions.screenSize === 'mobile' ? 
        Math.max(320, Math.floor(dimensions.width * 0.8)) : // Support down to 320px for mobile
        Math.floor(dimensions.width * 0.5);
    
    const minHeight = dimensions.screenSize === 'mobile' ? 
        Math.max(240, Math.floor(dimensions.height * 0.8)) : // Support down to 240px for mobile
        Math.floor(dimensions.height * 0.5);
    
    return {
        type: AUTO,
        width: dimensions.width,
        height: dimensions.height,
        scale: {
            mode: Phaser.Scale.NONE,
            parent: parent,
            width: dimensions.width,
            height: dimensions.height,
            min: {
                width: minWidth,
                height: minHeight
            },
            max: {
                width: Math.floor(dimensions.width * 1.2),
                height: Math.floor(dimensions.height * 1.2)
            }
        },
        backgroundColor: '#3366b2',
        scene: [Boot, Preloader, MainMenu, TableSelectScene, MainGame, VictoryScene, ReviewMistakesScene, LanguageSelectionScene, SkinSelection],
        physics: {
            default: 'arcade',
            arcade: {
                debug: false
            }
        },
        // Pass responsive data to scenes
        callbacks: {
            preBoot: (game: Phaser.Game) => {
                // Store responsive config in game registry for scenes to access
                game.registry.set('responsiveConfig', dimensions);
            }
        }
    };
};

// New responsive game initialization function
const StartSnowmenAttackGameResponsive = (parent: string, dimensions: GameDimensions) => {
    const responsiveConfig = createResponsiveConfig(dimensions, parent);
    return new Game(responsiveConfig);
}



export { StartSnowmenAttackGameResponsive };

