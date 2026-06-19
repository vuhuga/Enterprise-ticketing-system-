import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PublicService {
  // Public service methods will be implemented here
  submitTicket(ticket: Record<string, unknown>) {
    console.log('Submitting ticket:', ticket);
    // Implementation coming soon
  }

  getPublicInfo() {
    // Implementation coming soon
  }
}