// Root application component - main entry point for the Angular app
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ConfirmationDialogComponent } from './shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [RouterModule, ConfirmationDialogComponent]
})
export class AppComponent {
  // Application bootstraps through Angular's routing system
  // All business logic is handled by feature-specific components
}