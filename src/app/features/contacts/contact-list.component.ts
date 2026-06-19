import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, Phone, Plus, Search, Edit, Trash2, Home } from 'lucide-angular';
import { ContactService } from './services/contact.service';
import { Contact } from './services/contact.service';
import { ToastService } from '../../shared/toast.service';
import { ConfirmationService } from '../../shared/services/confirmation.service';

@Component({
  selector: 'app-contact-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './contact-list.component.html',
  styleUrls: ['./contact-list.component.scss']
})
export class ContactListComponent implements OnInit {
  private contactService = inject(ContactService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);

  contacts: Contact[] = [];
  loading = false;
  searchTerm = '';
  currentPage = 1;
  totalPages = 1;
  totalCount = 0;
  pageSize = 10;
  expandedRowId: number | null = null;

  // Lucide icons
  readonly Phone = Phone;
  readonly Plus = Plus;
  readonly Search = Search;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly Home = Home;

  ngOnInit() {
    this.loadContacts();
    
    // Subscribe to real-time updates
    this.contactService.contacts$.subscribe(contacts => {
      this.contacts = contacts;
    });

    this.contactService.loading$.subscribe(loading => {
      this.loading = loading;
    });
  }

  loadContacts() {
    this.contactService.getContacts(this.currentPage, this.pageSize, this.searchTerm).subscribe({
      next: (response) => {
        this.totalCount = response.total;
        this.totalPages = Math.ceil(response.total / this.pageSize);
        // The contacts are automatically updated via the service's observable
      },
      error: (error) => {
        this.toastService.showError('Error', 'Failed to load contacts');
        console.error('Error loading contacts:', error);
      }
    });
  }

  onSearch() {
    this.currentPage = 1;
    this.loadContacts();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadContacts();
  }

  onEdit(contact: Contact) {
    this.router.navigate(['/contacts/edit', contact.id]);
  }

  onDelete(contact: Contact) {
    this.confirmationService.confirm({
      title: 'Delete Contact',
      message: `Are you sure you want to delete ${contact.firstName} ${contact.lastName}? This action cannot be undone.`,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      confirmButtonClass: 'btn-danger'
    }).then((confirmed) => {
      if (confirmed) {
        this.contactService.deleteContact(contact.id).subscribe({
          next: () => {
            this.toastService.showSuccess('Success', 'Contact deleted successfully');
          },
          error: (error) => {
            this.toastService.showError('Error', 'Failed to delete contact');
            console.error('Error deleting contact:', error);
          }
        });
      }
    });
  }

  onCreateContact() {
    this.router.navigate(['/contacts/create']);
  }

  getStatusClass(status: string | undefined): string {
    return status === 'Active' ? 'status-active' : 'status-inactive';
  }

  // Make Math available in template
  Math = Math;
}