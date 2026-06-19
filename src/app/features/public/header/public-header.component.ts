import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-public-header',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './public-header.component.html',
    styleUrls: ['./public-header.component.scss']
})
export class PublicHeaderComponent {

}