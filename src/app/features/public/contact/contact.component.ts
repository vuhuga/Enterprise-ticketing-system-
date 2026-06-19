import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

/**
 * Public contact information page
 * Redirects users to home page ticket form for ticket submission
 */
@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent {
  private router = inject(Router);


  /**
   * Navigate to home page and scroll to ticket form
   */
  goToTicketForm(): void {
    this.router.navigate(['/']).then(() => {
      // Wait for navigation to complete, then scroll to form
      setTimeout(() => {
        const formElement = document.querySelector('.ticket-form-section');
        if (formElement) {
          formElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 100);
    });
  }
}