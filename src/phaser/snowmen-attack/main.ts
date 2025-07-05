import Phaser from 'phaser';
import { AUTO, Game } from 'phaser';
import {Boot} from './scenes/Boot';
import Preloader from './scenes/Preloader';
import MainMenu from './scenes/MainMenu';
import MainGame from './scenes/Game'; // make sure Game.js was renamed to MainGame.ts
import TableSelectScene from './scenes/TableSelectScene';
import VictoryScene from './scenes/VictoryScene';
import ReviewMistakesScene from './scenes/ReviewMistakesScene';

const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 1024,
    height: 768,
    backgroundColor: '#3366b2',
    parent: 'phaser-example',
    scene: [Boot, Preloader, MainMenu,TableSelectScene, MainGame,VictoryScene, ReviewMistakesScene],
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

