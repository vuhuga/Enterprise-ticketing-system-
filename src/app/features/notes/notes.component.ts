import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotesListComponent } from './notes-list.component';

@Component({
  selector: 'app-notes',
  standalone: true,
  imports: [CommonModule, NotesListComponent],
  template: `<app-notes-list></app-notes-list>`
})
export class NotesComponent {}