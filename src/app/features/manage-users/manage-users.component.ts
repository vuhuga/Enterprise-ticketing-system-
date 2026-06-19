import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserListComponent } from './user-list.component';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [CommonModule, UserListComponent],
  template: `<app-user-list></app-user-list>`
})
export class ManageUsersComponent {}