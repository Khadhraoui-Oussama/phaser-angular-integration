import { Routes } from '@angular/router';
import { EmojiMatchGameComponent } from './Games/emoji-match-game/emoji-match-game.component';
import { SnowmenAttackGameComponent } from './Games/snowmen-attack-game/snowmen-attack-game.component';

import { HomeComponent } from './home/home.component';


export const routes: Routes = [
    {path:"emoji-match-game",component:EmojiMatchGameComponent},
    {path:"snowman-attack-game",component:SnowmenAttackGameComponent},
    {path: "", component:HomeComponent }
];
