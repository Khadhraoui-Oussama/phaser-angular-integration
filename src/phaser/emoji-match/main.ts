import { Boot } from './scenes/Boot';
import {  MainGame } from './scenes/MainGame';
import { MainMenu } from './scenes/MainMenu';
import { AUTO, Game } from 'phaser';
import { Preloader } from './scenes/Preloader';

// Find out more information about the Game Config at:
// https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#028af8',
    scene: [
        Boot,
        Preloader,
        MainMenu,
        MainGame
    ]
};

const StartEmojiMatchGame = (parent: string) => {

    return new Game({ ...config, parent });

}

export default StartEmojiMatchGame;
