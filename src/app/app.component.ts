import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';

//THIS IS JUST AN ANGULAR WRAPPER FOR PHASER 
@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule,RouterModule,RouterLink],
    templateUrl: './app.component.html'
})
export class AppComponent{}
