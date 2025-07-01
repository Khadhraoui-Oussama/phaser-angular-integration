import { Routes } from '@angular/router';
import { SnowmenAttackGameComponent } from './Games/snowmen-attack-game/snowmen-attack-game.component';

import { HomeComponent } from './home/home.component';


export const routes: Routes = [
    {path:"snowman-attack-game",component:SnowmenAttackGameComponent},
    {path: "", component:HomeComponent }
];
