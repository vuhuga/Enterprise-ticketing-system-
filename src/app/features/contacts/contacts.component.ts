import { Component } from '@angular/core';

@Component({
  selector: 'app-contacts',
  standalone: true,
  template: `
    <div class="contacts-container">
      <h2>Contacts</h2>
      <p>Contact management will be implemented here.</p>
    </div>
  `,
  styles: [`
    .contacts-container {
      padding: 2rem;
    }
  `]
})
export class ContactsComponent {}