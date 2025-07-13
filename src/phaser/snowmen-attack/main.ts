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

const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 1024,
    height: 768,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_HORIZONTALLY, // works the best for now 
        //this removes the canvas from the document flow, to return it be must phaser.scale.none or make the gamecontainer have a relative postion but that removes responsiveness so must compromise
        parent: 'game-container',
        width: 1024,
        height: 768,
        min: {
            width: 320,
            height: 240
        },
        max: {
            width: 1920,
            height: 1080
        }
    },
    backgroundColor: '#3366b2',
    scene: [Boot, Preloader, MainMenu, TableSelectScene, MainGame, VictoryScene, ReviewMistakesScene, LanguageSelectionScene],
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    }
};

const StartSnowmenAttackGame = (parent: string) => {

    return new Game({ ...config, parent });

}
export default StartSnowmenAttackGame;

