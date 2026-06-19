import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TicketService, Ticket } from '../../services/ticket.service';
import { TicketNotesService, TicketNote } from '../../services/ticket-notes.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../shared/toast.service';
import { ConfirmationService } from '../../../../shared/services/confirmation.service';
import { TimeAgoPipe } from '../../../../shared/pipes/time-ago.pipe';
import { SLAService, TicketSLAStatus } from '../../../../shared/services/sla.service';
import { SLAFormatter } from '../../../../shared/utils/sla-formatter';
import { LucideAngularModule, ArrowLeft, User, Clock, AlertTriangle, CheckCircle, MessageSquare, Trash2, Edit, AlertCircle, Calendar } from 'lucide-angular';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, TimeAgoPipe, LucideAngularModule],
  template: `
    <div class="page-container">
      
      <!-- Back Button & Header -->
      <div class="page-header">
        <button type="button" class="btn-back" (click)="goBack()">
           <lucide-icon [img]="ArrowLeft" [size]="20"></lucide-icon> Back to Tickets
        </button>
      </div>

      @if (loading) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading ticket details...</p>
        </div>
      }

      @if (!loading && ticket) {
        <div class="detail-layout">
        
          <!-- Left Column: Main Content -->
          <div class="main-content">
            <div class="card detail-card">
               <div class="ticket-header">
                 <div class="header-top">
                   <span class="ticket-key">{{ ticket.key }}</span>
                   <div class="badges">
                     <span class="badge" [ngClass]="'badge-priority-' + (ticket.priority | lowercase)">
                       {{ ticket.priority }} Priority
                     </span>
                     <span class="badge" [ngClass]="'badge-status-' + (ticket.status | lowercase)">
                       {{ ticket.status | titlecase }}
                     </span>
                   </div>
                 </div>
                 
                 <h1 class="ticket-subject">{{ ticket.subject }}</h1>
                 
                 <div class="ticket-meta">
                   <div class="meta-item">
                     <lucide-icon [img]="User" [size]="16"></lucide-icon>
                     <span>{{ ticket.customerName }}</span>
                   </div>
                   <div class="meta-item">
                     <lucide-icon [img]="Clock" [size]="16"></lucide-icon>
                     <span>Created {{ ticket.createdAt | timeAgo }}</span>
                   </div>
                   <div class="meta-item">
                     <lucide-icon [img]="Calendar" [size]="16"></lucide-icon>
                     <span>Updated {{ ticket.updatedAt | timeAgo }}</span>
                   </div>
                 </div>
               </div>

               <div class="ticket-body">
                 <h3>Description</h3>
                 <div class="description-text">
                   {{ ticket.description }}
                 </div>
               </div>

               <!-- Resolution Details if Resolved/Closed -->
               @if (ticket.resolution_comment && ['resolved', 'closed'].includes(ticket.status)) {
                 <div class="resolution-box">
                   <div class="resolution-header">
                      <lucide-icon [img]="CheckCircle" [size]="20" color="#16a34a"></lucide-icon>
                      <h4>{{ ticket.status === 'resolved' ? 'Resolution Details' : 'Closure Details' }}</h4>
                   </div>
                   <p>{{ ticket.resolution_comment }}</p>
                   <div class="resolution-footer">
                      Resolved by {{ ticket.assignedToName }} • {{ ticket.updatedAt | timeAgo }}
                   </div>
                 </div>
               }
            </div>
            
            <!-- Notes Section -->
            <div class="card notes-card">
              <div class="card-header">
                <div class="header-with-icon">
                  <lucide-icon [img]="MessageSquare" [size]="20"></lucide-icon>
                  <h3>Internal Notes</h3>
                </div>
                <span class="badge badge-neutral">Staff Only</span>
              </div>
              
              <div class="notes-list">
                @if (notes.length === 0) {
                  <div class="empty-notes">
                    <p>No internal notes yet.</p>
                  </div>
                }
                
                @for (note of notes; track note.id) {
                  <div class="note-item">
                    <div class="note-header">
                      <div class="note-author">
                        <div class="avatar-circle">{{ (note.author_name || 'U').charAt(0) }}</div>
                        <span class="author-name">{{ note.author_name }}</span>
                        <span class="role-badge" [class.admin]="note.author_role === 'admin'">{{ note.author_role }}</span>
                      </div>
                      <div class="note-actions">
                        <span class="note-time">{{ note.created_at | timeAgo }}</span>
                        @if (canDeleteNote(note)) {
                          <button class="btn-icon-sm" (click)="deleteNote(note.id)" title="Delete">
                            <lucide-icon [img]="Trash2" [size]="14"></lucide-icon>
                          </button>
                        }
                      </div>
                    </div>
                    <div class="note-content">{{ note.note }}</div>
                  </div>
                }
              </div>
              
              <div class="add-note-box">
                <textarea 
                  [(ngModel)]="internalNote" 
                  class="form-control" 
                  rows="3" 
                  placeholder="Add an internal note..."></textarea>
                <div class="note-actions">
                  <button class="btn btn-primary btn-sm" (click)="addNote()" [disabled]="!internalNote.trim() || addingNote">
                    {{ addingNote ? 'Adding...' : 'Add Note' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Sidebar -->
          <div class="sidebar-content">
            
            <!-- Ticket Properties Panel -->
            <div class="card properties-card">
              <h3>Properties</h3>
              
              <div class="property-group">
                <label>Department</label>
                <div class="value">{{ ticket.department }}</div>
              </div>
              
              <div class="property-group">
                <label>Type</label>
                <div class="value">{{ ticket.type }}</div>
              </div>
              
              <div class="property-group">
                <label>Assignee</label>
                <div class="value flex-align">
                   @if (ticket.assignedToName) {
                     <div class="avatar-xs">{{ ticket.assignedToName.charAt(0) }}</div>
                   }
                   {{ ticket.assignedToName || 'Unassigned' }}
                </div>
              </div>
              
              <div class="property-group">
                <label>Customer Email</label>
                <div class="value email-link">{{ ticket.customerEmail }}</div>
              </div>
            </div>

            <!-- Staff Actions Panel (Only visible to staff/admin) -->
            @if (isStaffOrAdmin()) {
              <div class="card actions-card">
                <h3>Staff Actions</h3>
                
                <div class="form-group">
                   <label>Status</label>
                   <select [(ngModel)]="selectedStatus" class="form-select">
                     <option value="new">New</option>
                     <option value="open">Open</option>
                     <option value="in_progress">In Progress</option>
                     <option value="resolved">Resolved</option>
                     <option value="closed">Closed</option>
                   </select>
                </div>

                <div class="form-group">
                   <label>Priority</label>
                   <select [(ngModel)]="selectedPriority" class="form-select">
                     <option value="low">Low</option>
                     <option value="medium">Medium</option>
                     <option value="high">High</option>
                     <option value="urgent">Urgent</option>
                   </select>
                </div>
                
                <div class="form-group">
                   <label>Assign To</label>
                   <select [(ngModel)]="selectedAssignee" class="form-select">
                     <option value="">{{ ticket.assignedToName || 'Unassigned' }}</option>
                     @for (staff of staffMembers; track staff.id) {
                       <option [value]="staff.id">
                         {{ staff.firstName }} {{ staff.lastName }}
                       </option>
                     }
                   </select>
                </div>

                <button class="btn btn-primary w-100" (click)="updateTicketWithResolution()" [disabled]="updating">
                  {{ updating ? 'Updating...' : 'Update Ticket' }}
                </button>
              </div>
            }
            
          </div>

        </div>
      }

      <!-- Resolution Modal -->
      @if (showResolveModal) {
        <div class="modal-backdrop">
          <div class="modal-card">
            <div class="modal-header">
              <h3>{{ resolveModalType === 'resolve' ? 'Resolve Ticket' : 'Close Ticket' }}</h3>
              <button class="btn-close" (click)="closeResolveModal()">×</button>
            </div>
            <div class="modal-body">
              <p>Please provide a reason for {{ resolveModalType === 'resolve' ? 'resolution' : 'closure' }}:</p>
              <textarea 
                [(ngModel)]="resolutionComment" 
                class="form-control" 
                rows="5"
                placeholder="This comment will be sent to the customer..."></textarea>
            </div>
            <div class="modal-footer">
              <button class="btn btn-ghost" (click)="closeResolveModal()">Cancel</button>
              <button class="btn btn-primary" (click)="confirmResolveTicket()" [disabled]="!resolutionComment.trim()">
                Confirm
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .page-container {
      max-width: 1200px;
      margin: 0 auto;
      padding-bottom: 4rem;
    }

    .page-header {
      margin-bottom: 1.5rem;
    }

    .btn-back {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: none;
      border: none;
      font-size: 0.95rem;
      font-weight: 500;
      color: var(--slate-500);
      cursor: pointer;
      padding: 0;
      &:hover { color: var(--primary-600); }
    }

    .detail-layout {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 1.5rem;
      
      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
      }
    }

    .main-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .card {
      background: white;
      border: 1px solid var(--slate-200);
      border-radius: var(--radius-xl);
      padding: 2rem;
      box-shadow: var(--shadow-sm);
    }

    .ticket-header {
      margin-bottom: 2rem;
      border-bottom: 1px solid var(--slate-100);
      padding-bottom: 1.5rem;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .ticket-key {
      font-family: 'Roboto Mono', monospace;
      font-size: 0.9rem;
      color: var(--slate-500);
      font-weight: 500;
    }

    .badges {
      display: flex;
      gap: 0.5rem;
    }

    .ticket-subject {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--slate-900);
      margin: 0 0 1rem 0;
      line-height: 1.2;
    }

    .ticket-meta {
      display: flex;
      gap: 1.5rem;
      font-size: 0.9rem;
      color: var(--slate-500);
      
      .meta-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
    }

    .ticket-body {
      h3 {
        font-size: 1.1rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: var(--slate-800);
      }
      
      .description-text {
        font-size: 1rem;
        line-height: 1.6;
        color: var(--slate-700);
        white-space: pre-wrap;
      }
    }

    .resolution-box {
      margin-top: 2rem;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      
      .resolution-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
        
        h4 { margin: 0; color: #166534; font-size: 1rem; font-weight: 600; }
      }
      
      p { margin: 0 0 1rem 0; color: #14532d; }
      
      .resolution-footer {
        font-size: 0.85rem;
        color: #166534;
        opacity: 0.8;
      }
    }

    /* Notes Card */
    .notes-card {
      padding: 0;
      overflow: hidden;
      
      .card-header {
        padding: 1.5rem;
        border-bottom: 1px solid var(--slate-100);
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: var(--slate-50);
        
        .header-with-icon {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--slate-700);
          
          h3 { margin: 0; font-size: 1.1rem; font-weight: 600; }
        }
      }
    }

    .notes-list {
      max-height: 500px;
      overflow-y: auto;
      padding: 1.5rem;
      background: white;
    }

    .note-item {
      margin-bottom: 1.5rem;
      &:last-child { margin-bottom: 0; }
    }

    .note-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      
      .note-author {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        
        .avatar-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--primary-100);
          color: var(--primary-700);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.9rem;
        }
        
        .author-name { font-weight: 600; color: var(--slate-900); font-size: 0.95rem; }
        
        .role-badge {
          background: var(--slate-100);
          color: var(--slate-600);
          padding: 2px 8px;
          border-radius: 99px;
          font-size: 0.75rem;
          text-transform: uppercase;
          font-weight: 600;
          
          &.admin { background: #fee2e2; color: #991b1b; }
        }
      }
      
      .note-time { font-size: 0.8rem; color: var(--slate-400); }
    }

    .note-content {
      margin-left: 44px; // Align with name, nudge right past avatar
      padding: 1rem;
      background: var(--slate-50);
      border-radius: 0 12px 12px 12px;
      color: var(--slate-700);
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .add-note-box {
      padding: 1.5rem;
      border-top: 1px solid var(--slate-100);
      background: var(--slate-50);
      
      .note-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 0.75rem;
      }
    }

    /* Sidebar Cards */
    .sidebar-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .properties-card, .actions-card {
      padding: 1.5rem;
      
      h3 { font-size: 1rem; font-weight: 600; color: var(--slate-900); margin-bottom: 1.25rem; }
    }

    .property-group {
      margin-bottom: 1.25rem;
      &:last-child { margin-bottom: 0; }
      
      label { display: block; font-size: 0.8rem; color: var(--slate-500); margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
      .value { font-size: 0.95rem; color: var(--slate-800); font-weight: 500; }
      
      .flex-align { display: flex; align-items: center; gap: 0.5rem; }
      .avatar-xs { width: 24px; height: 24px; border-radius: 50%; background: var(--primary-100); color: var(--primary-700); font-size: 0.75rem; display: flex; align-items: center; justify-content: center; font-weight: 700; }
    }

    .actions-card {
      background: var(--slate-50);
      border-color: var(--slate-200);
      
      .form-group { margin-bottom: 1rem; }
      label { display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.5rem; }
      .form-select { width: 100%; padding: 0.6rem; border: 1px solid var(--slate-300); border-radius: var(--radius-md); font-size: 0.95rem; }
    }

    /* Modal */
    .modal-backdrop {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 100;
      display: flex; align-items: center; justify-content: center;
      backdrop-filter: blur(2px);
    }
    
    .modal-card {
      background: white;
      width: 90%; max-width: 500px;
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-xl);
      overflow: hidden;
      animation: fadeIn 0.2s ease-out;
      
      .modal-header {
        padding: 1.25rem; border-bottom: 1px solid var(--slate-100);
        display: flex; justify-content: space-between; align-items: center;
        h3 { margin: 0; font-size: 1.25rem; font-weight: 600; }
        .btn-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--slate-400); }
      }
      
      .modal-body {
        padding: 1.5rem;
        textarea { width: 100%; padding: 0.75rem; border: 1px solid var(--slate-300); border-radius: var(--radius-md); font-family: inherit; }
      }
      
      .modal-footer {
        padding: 1.25rem; border-top: 1px solid var(--slate-100); background: var(--slate-50);
        display: flex; justify-content: flex-end; gap: 0.75rem;
      }
    }
  `]
})
export class TicketDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ticketService = inject(TicketService);
  private notesService = inject(TicketNotesService);
  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);
  public authService = inject(AuthService);

  // Icons
  readonly ArrowLeft = ArrowLeft;
  readonly User = User;
  readonly Clock = Clock;
  readonly AlertTriangle = AlertTriangle;
  readonly CheckCircle = CheckCircle;
  readonly MessageSquare = MessageSquare;
  readonly Trash2 = Trash2;
  readonly Edit = Edit;
  readonly AlertCircle = AlertCircle;
  readonly Calendar = Calendar;

  ticket: Ticket | null = null;
  loading = true;
  updating = false;
  addingNote = false;
  loadingNotes = false;
  loadingStaff = false;

  // Form controls for staff actions
  selectedStatus = '';
  selectedPriority = '';
  selectedAssignee = '';
  internalNote = '';

  // Staff members for assignment
  staffMembers: any[] = [];

  // Notes
  notes: TicketNote[] = [];

  // Resolution modal properties
  showResolveModal = false;
  resolveModalType: 'resolve' | 'close' = 'resolve';
  resolutionComment = '';

  ngOnInit(): void {
    const ticketId = this.route.snapshot.paramMap.get('id');
    if (ticketId) {
      this.loadTicket(ticketId);
      this.loadNotes(ticketId);
    } else {
      this.error('Ticket ID missing');
    }

    if (this.isStaffOrAdmin()) {
      this.loadStaff();
    }
  }

  isStaffOrAdmin(): boolean {
    return this.authService.isStaff() || this.authService.isAdmin();
  }

  canDeleteNote(note: TicketNote): boolean {
    return this.authService.isAdmin() || (Number(this.authService.currentUser()?.id) === note.author_id);
  }

  loadTicket(id: string) {
    this.loading = true;
    this.ticketService.getTicketById(id).subscribe({
      next: (ticket) => {
        this.ticket = ticket;
        this.selectedStatus = ticket.status;
        this.selectedPriority = ticket.priority;
        this.selectedAssignee = ticket.assignedTo || '';
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading ticket:', err);
        this.loading = false;
        this.toastService.showError('Error', 'Could not load ticket details');
      }
    });
  }

  loadNotes(ticketId: string) {
    this.loadingNotes = true;
    this.notesService.getNotes(ticketId).subscribe({
      next: (notes) => {
        this.notes = notes;
        this.loadingNotes = false;
      },
      error: (err) => {
        this.loadingNotes = false;
        console.error('Error loading notes:', err);
      }
    });
  }

  loadStaff() {
    this.loadingStaff = true;
    this.ticketService.getStaffMembers().subscribe({
      next: (staff) => {
        this.staffMembers = staff;
        this.loadingStaff = false;
      },
      error: (err) => {
        this.loadingStaff = false;
        console.error('Error loading staff:', err);
      }
    });
  }

  goBack() {
    this.router.navigate(['/tickets']);
  }

  updateTicketWithResolution() {
    // Logic to open modal if status is resolved/closed, otherwise update directly
    if (this.selectedStatus === 'resolved' || this.selectedStatus === 'closed') {
      if (this.ticket?.status !== this.selectedStatus) {
        this.resolveModalType = this.selectedStatus === 'resolved' ? 'resolve' : 'close';
        this.showResolveModal = true;
        return;
      }
    }
    this.performUpdate();
  }

  confirmResolveTicket() {
    this.performUpdate();
    this.closeResolveModal();
  }

  closeResolveModal() {
    this.showResolveModal = false;
    this.resolutionComment = '';
  }

  performUpdate() {
    if (!this.ticket) return;
    this.updating = true;

    const updates: any = {
      status: this.selectedStatus,
      priority: this.selectedPriority,
      assignedTo: this.selectedAssignee
    };

    if (this.resolutionComment) {
      updates.resolution_comment = this.resolutionComment;
    }

    this.ticketService.updateTicket(this.ticket.id, updates).subscribe({
      next: (updatedTicket) => {
        this.ticket = updatedTicket;
        this.updating = false;
        this.toastService.showSuccess('Updated', 'Ticket updated successfully');
      },
      error: (err) => {
        this.updating = false;
        this.toastService.showError('Error', 'Failed to update ticket');
      }
    });
  }

  addNote() {
    if (!this.ticket || !this.internalNote.trim()) return;
    this.addingNote = true;

    this.notesService.addNote(this.ticket.id, { note: this.internalNote, is_internal: true }).subscribe({
      next: (note) => {
        this.notes.unshift(note);
        this.internalNote = '';
        this.addingNote = false;
        this.toastService.showSuccess('Note Added', 'Internal note added successfully');
      },
      error: (err) => {
        this.addingNote = false;
        this.toastService.showError('Error', 'Failed to add note');
      }
    });
  }

  deleteNote(noteId: number) {
    if (!confirm('Are you sure you want to delete this note?')) return;

    this.notesService.deleteNote(this.ticket!.id, noteId).subscribe({
      next: () => {
        this.notes = this.notes.filter(n => n.id !== noteId);
        this.toastService.showSuccess('Deleted', 'Note deleted');
      },
      error: (err) => this.toastService.showError('Error', 'Failed to delete note')
    });
  }

  error(msg: string) {
    this.toastService.showError('Error', msg);
  }
}