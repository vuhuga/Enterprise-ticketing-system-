import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { ManageUsersRoutingModule } from './manage-users-routing.module';
import { ManageUsersComponent } from './manage-users.component';
import { CreateUserComponent } from './create-user/create-user.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ManageUsersRoutingModule,
    ManageUsersComponent,
    CreateUserComponent
  ]
})
export class ManageUsersModule { }