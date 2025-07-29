import { Routes } from '@angular/router';
import { SnowmenAttackGameComponent } from './Games/snowmen-attack-game/snowmen-attack-game.component';

import { HomeComponent } from './home/home.component';
import { EduspaceGameComponentComponent } from './Games/eduspace-game-component/eduspace-game-component.component';


export const routes: Routes = [
    {path:"snowman-attack-game",component:SnowmenAttackGameComponent},
    {path:"eduspace-game",component:EduspaceGameComponentComponent},
    {path: "", component:HomeComponent }
];
