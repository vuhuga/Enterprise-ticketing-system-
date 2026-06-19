import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrganizationListComponent } from './organization-list.component';

@Component({
  selector: 'app-organizations',
  standalone: true,
  imports: [CommonModule, OrganizationListComponent],
  template: `<app-organization-list></app-organization-list>`
})
export class OrganizationsComponent {}