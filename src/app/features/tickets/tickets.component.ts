import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, Home, Ticket as TicketIcon, User, Search, Plus, Download, Upload, RefreshCw, Check, AlertCircle } from 'lucide-angular';
import { TicketService, Ticket, TicketFilter } from './services/ticket.service';
import { TicketImportExportService } from './services/ticket-import-export.service';
import { ViewChild, ElementRef } from '@angular/core';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';
import { DepartmentService, Department } from '../../shared/services/department.service';
import { PriorityService, Priority } from '../settings/services/priority.service';
import { StatusService, TicketStatus } from '../settings/services/status.service';
import { TicketTypeService, TicketType } from '../settings/services/ticket-type.service';
import { ToastService } from '../../shared/toast.service';
import { AuthService } from '../../core/services/auth.service';

/**
 * Main tickets list page for admin dashboard
 * Shows all tickets with filtering and search capabilities
 */
@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule, TimeAgoPipe, LucideAngularModule],
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.scss']
})
export class TicketsComponent implements OnInit {
  private router = inject(Router);
  private ticketService = inject(TicketService);
  private importExportService = inject(TicketImportExportService);
  private departmentService = inject(DepartmentService);
  private priorityService = inject(PriorityService);
  private statusService = inject(StatusService);
  private ticketTypeService = inject(TicketTypeService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  @ViewChild('importFileInput') importFileInput!: ElementRef<HTMLInputElement>;

  // Filter properties
  searchTerm = '';
  selectedType = '';
  selectedDepartment = '';
  selectedPriority = '';
  selectedStatus = '';
  selectedAssignee = '';

  // Dropdown data arrays
  departments: Department[] = [];
  priorities: Priority[] = [];
  statuses: TicketStatus[] = [];
  ticketTypes: TicketType[] = [];
  staffMembers: any[] = [];
  loadingDropdowns = false;

  // Lucide icons
  readonly Home = Home;
  readonly TicketIcon = TicketIcon;
  readonly User = User;
  readonly Search = Search;
  readonly Plus = Plus;
  readonly Download = Download;
  readonly Upload = Upload;
  readonly RefreshCw = RefreshCw;
  readonly Check = Check;
  readonly AlertCircle = AlertCircle;
  // readonly Filter = Filter; // If Filter is used, add it. Error didn't mention it but let's check imports
  // Error mentioned: Search, RefreshCw, Download, Upload, Plus
  // I need to update imports first to include these

  // API data
  tickets: Ticket[] = [];
  filteredTickets: Ticket[] = [];
  loading = false;
  currentPage = 1;
  totalPages = 1;
  totalCount = 0;
  pageSize = 10;
  exportFormat: 'excel' | 'pdf' | 'csv' = 'excel';

  // Role-based access
  isCustomer = false;

  ngOnInit() {
    this.isCustomer = this.authService.isCustomer();
    this.loadDropdownData();
    this.loadTickets();
  }

  /**
   * Load data for all filter dropdowns
   */
  loadDropdownData() {
    this.loadingDropdowns = true;
    console.log('Loading dropdown data for filters...');

    // Load departments
    this.departmentService.getAllDepartments().subscribe({
      next: (departments) => {
        this.departments = departments.filter(dept => dept.isActive);
        console.log('✅ Loaded departments:', this.departments.length);
      },
      error: (error) => {
        console.error('❌ Failed to load departments:', error);
        this.departments = [];
      }
    });

    // Load priorities
    this.priorityService.getPriorities().subscribe({
      next: (priorities) => {
        this.priorities = priorities.filter(priority => priority.isActive)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        console.log('✅ Loaded priorities:', this.priorities.length);
      },
      error: (error) => {
        console.error('❌ Failed to load priorities:', error);
        this.priorities = [];
      }
    });

    // Load statuses
    this.statusService.getStatuses().subscribe({
      next: (statuses) => {
        this.statuses = statuses.filter(status => status.isActive)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        console.log('✅ Loaded statuses:', this.statuses.length);
      },
      error: (error) => {
        console.error('❌ Failed to load statuses:', error);
        this.statuses = [];
      }
    });

    // Load ticket types
    this.ticketTypeService.getTicketTypes().subscribe({
      next: (ticketTypes) => {
        this.ticketTypes = ticketTypes.filter(type => type.isActive);
        console.log('✅ Loaded ticket types:', this.ticketTypes.length);
        this.loadingDropdowns = false;
      },
      error: (error) => {
        console.error('❌ Failed to load ticket types:', error);
        this.ticketTypes = [];
        this.loadingDropdowns = false;
      }
    });

    // Load staff members for assignment filter
    this.ticketService.getStaffMembers().subscribe({
      next: (staff) => {
        this.staffMembers = staff;
        console.log('✅ Loaded staff members:', this.staffMembers.length);
      },
      error: (error) => {
        console.error('❌ Failed to load staff members:', error);
        this.staffMembers = [];
      }
    });
  }

  // Fallback method to load tickets using dashboard stats if main endpoint fails
  loadTicketsFromStats() {
    console.log('Trying fallback method to load tickets...');
    this.loading = true;

    // Try the dashboard endpoints that we know work
    this.ticketService.getTicketsByDepartment().subscribe({
      next: (deptData) => {
        console.log('✅ Got department data:', deptData);

        // Also try to get ticket stats
        this.ticketService.getTicketStats().subscribe({
          next: (stats) => {
            console.log('✅ Got ticket stats:', stats);
            this.totalCount = stats.total || 0;
            this.loading = false;

            if (this.totalCount > 0) {
              console.log(`ℹ️ Found ${this.totalCount} tickets in database, but /api/tickets endpoint is not available`);
              console.log('💡 The tickets exist but the backend may not have implemented the tickets list endpoint');
            }
          },
          error: (statsError) => {
            console.error('❌ Stats endpoint also failed:', statsError);
            this.loading = false;
            this.totalCount = 0;
          }
        });
      },
      error: (error) => {
        console.error('❌ Dashboard endpoints also failed:', error);
        this.loading = false;
        this.totalCount = 0;
      }
    });
  }

  loadTickets() {
    this.loading = true;
    const user = this.authService.currentUser();
    const isCustomer = this.authService.isCustomer();

    const filter: TicketFilter = {
      page: this.currentPage,
      limit: this.pageSize,
      search: this.searchTerm || undefined,
      status: this.selectedStatus || undefined,
      priority: this.selectedPriority || undefined,
      department: this.selectedDepartment || undefined,
      assignedTo: this.selectedAssignee || undefined
    };

    // For customers, only show their own tickets
    if (isCustomer && user?.id) {
      filter.created_by = Number(user.id); // Ensure it's a number
      console.log('🔒 Customer filter applied - User ID:', user.id, 'Email:', user.email, 'Type:', typeof user.id);
    } else {
      console.log('Staff/Admin - showing all tickets');
    }

    console.log('🚀 Loading tickets with filters:', filter);
    console.log('🔍 Is Customer:', isCustomer, 'User:', user);

    this.ticketService.getTickets(filter).subscribe({
      next: (response) => {
        this.tickets = response.tickets || [];
        // Apply client-side filtering for type and category
        this.applyClientSideFilters();
        this.totalCount = response.total || 0;
        this.totalPages = Math.ceil((response.total || 0) / this.pageSize);
        this.loading = false;
        console.log('✅ Loaded', this.tickets.length, 'tickets');
      },
      error: () => {
        console.error('❌ Tickets endpoint not available (404)');

        // Use dashboard endpoints as workaround since /api/tickets doesn't exist
        this.loadTicketsFromStats();

        this.tickets = [];
        this.filteredTickets = [];
      }
    });
  }

  /**
   * Apply client-side filtering for properties not supported by backend
   */
  applyClientSideFilters() {
    let filtered = [...this.tickets];

    // Filter by type if selected
    if (this.selectedType) {
      filtered = filtered.filter(ticket =>
        ticket.type?.toLowerCase() === this.selectedType.toLowerCase()
      );
    }

    this.filteredTickets = filtered;
    console.log(`🔍 Client-side filters applied: ${filtered.length}/${this.tickets.length} tickets shown`);
  }

  applyFilters() {
    this.currentPage = 1;
    this.loadTickets();
  }

  resetFilters() {
    this.searchTerm = '';
    this.selectedType = '';
    this.selectedDepartment = '';
    this.selectedPriority = '';
    this.selectedStatus = '';
    this.selectedAssignee = '';
    this.currentPage = 1;
    this.loadTickets();
  }



  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'new': return 'status-new';
      case 'open': return 'status-open';
      case 'in_progress': return 'status-progress';
      case 'resolved': return 'status-resolved';
      case 'closed': return 'status-closed';
      default: return 'status-pending';
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'priority-urgent';
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'priority-medium';
    }
  }



  viewTicket(ticket: Ticket) {
    this.router.navigate(['/tickets', ticket.id]);
  }

  /**
   * Navigate to ticket creation form
   */
  navigateToCreateTicket() {
    this.router.navigate(['/tickets/create']);
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.loadTickets();
  }

  downloadTemplate() {
    const templateContent = `subject,description,type,department,priority,status,customerName,customerEmail,assignedToName,resolution_comment
Sample Ticket 1,This is a sample ticket description for testing import functionality,General,Support,medium,new,John Doe,john.doe@example.com,,
Sample Ticket 2,Another sample ticket with high priority,Technical,IT,high,open,Jane Smith,jane.smith@example.com,,
Sample Ticket 3,Resolved ticket example,Billing,Finance,low,resolved,Bob Johnson,bob.johnson@example.com,,Issue was resolved by updating the billing information
Sample Ticket 4,Manually assigned ticket,Technical,IT,high,open,Alice Williams,alice@example.com,John Smith,This ticket is manually assigned to John Smith`;

    this.importExportService.downloadFile(templateContent, 'ticket-import-template.csv', 'text/csv;charset=utf-8');
    this.toastService.showSuccess('Template Downloaded', 'Leave assignedToName empty for automatic assignment');
  }

  exportTickets() {
    try {
      // Fetch ALL tickets (no pagination limit) for export
      console.log('📤 Fetching all tickets for export...');

      const exportParams: any = { limit: 10000 }; // Get up to 10,000 tickets

      // Apply current filters to export
      if (this.searchTerm) exportParams.search = this.searchTerm;
      if (this.selectedType) exportParams.type = this.selectedType;
      if (this.selectedDepartment) exportParams.department = this.selectedDepartment;
      if (this.selectedPriority) exportParams.priority = this.selectedPriority;
      if (this.selectedStatus) exportParams.status = this.selectedStatus;
      if (this.selectedAssignee) exportParams.assignedTo = this.selectedAssignee;

      this.ticketService.getTickets(exportParams).subscribe({
        next: (response) => {
          const ticketsToExport = response.tickets;

          if (ticketsToExport.length === 0) {
            this.toastService.showError('No Data', 'No tickets to export');
            return;
          }

          console.log(`📊 Exporting ${ticketsToExport.length} tickets...`);
          const options = this.importExportService.getDefaultExportOptions();

          switch (this.exportFormat) {
            case 'excel':
              options.format = 'excel';
              this.importExportService.exportToExcel(ticketsToExport, options);
              this.toastService.showSuccess('Exported', `${ticketsToExport.length} tickets exported to Excel`);
              break;

            case 'pdf':
              options.format = 'excel'; // Use same options structure
              this.importExportService.exportToPDF(ticketsToExport, options);
              this.toastService.showSuccess('Exported', `${ticketsToExport.length} tickets exported to PDF`);
              break;

            case 'csv': {
              options.format = 'csv';
              const content = this.importExportService.exportToCSV(ticketsToExport, options);
              const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
              this.importExportService.downloadFile(content, `tickets-export-${timestamp}.csv`, 'text/csv;charset=utf-8');
              this.toastService.showSuccess('Exported', `${ticketsToExport.length} tickets exported to CSV`);
              break;
            }
          }
        },
        error: (err) => {
          console.error('❌ Export failed:', err);
          this.toastService.showError('Export Failed', 'Unable to fetch tickets for export');
        }
      });
    } catch (err) {
      console.error('Export failed:', err);
      this.toastService.showError('Export Failed', 'Unable to export tickets');
    }
  }

  importTickets() {
    if (this.importFileInput) {
      this.importFileInput.nativeElement.value = '';
      this.importFileInput.nativeElement.click();
    }
  }

  onImportFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();

    // Handle Excel files differently (binary)
    if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
      reader.readAsArrayBuffer(file);
      reader.onload = async () => {
        try {
          const rows = this.importExportService.parseExcel(reader.result as ArrayBuffer);
          this.processImportData(rows);
        } catch (e) {
          console.error('Excel import error:', e);
          this.toastService.showError('Import Failed', 'Could not process the Excel file');
        }
      };
      return;
    }

    // Handle CSV and JSON files (text)
    reader.onload = async () => {
      try {
        const text = (reader.result || '').toString();
        let rows: any[] = [];
        if (file.name.toLowerCase().endsWith('.csv')) {
          rows = this.importExportService.parseCSV(text);
        } else if (file.name.toLowerCase().endsWith('.json')) {
          rows = this.importExportService.parseJSON(text);
        } else {
          this.toastService.showError('Unsupported File', 'Please select a CSV, JSON, or Excel file');
          return;
        }
        this.processImportData(rows);
      } catch (e) {
        console.error('Import error:', e);
        this.toastService.showError('Import Failed', 'Could not process the selected file');
      }
    };
    reader.readAsText(file);
  }

  private processImportData(rows: any[]) {
    try {

      const importOptions = this.importExportService.getDefaultImportOptions();
      const validation = this.importExportService.validateTicketData(rows, importOptions);
      if (!validation.success) {
        const firstError = validation.errors[0];
        this.toastService.showError('Import Validation Failed', `Row ${firstError.row}: ${firstError.field} - ${firstError.message}`);
        return;
      }

      const tickets = this.importExportService.convertToTicketData(rows, importOptions);
      this.ticketService.bulkCreateTickets(tickets).subscribe({
        next: (res) => {
          if (res.success) {
            this.toastService.showSuccess('Import Complete', `${res.imported} tickets imported successfully`);
            this.loadTickets();
          } else {
            this.toastService.showError('Import Failed', `${res.failed} rows failed`);
          }
        },
        error: () => this.toastService.showError('Import Failed', 'Server error while importing tickets')
      });
    } catch (e) {
      console.error('Import processing error:', e);
      this.toastService.showError('Import Failed', 'Could not process the import data');
    }
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadTickets();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Make Math available in template
  Math = Math;

  // SLA Badge Methods
  getSLABadgeClass(ticket: Ticket): string {
    const now = new Date();
    const isResolved = ticket.status === 'resolved' || ticket.status === 'closed';

    // For resolved tickets, check if they were breached
    if (isResolved) {
      // Check if either deadline was breached (historical)
      const assignmentDeadline = ticket.assignmentDeadline ? new Date(ticket.assignmentDeadline) : null;
      const resolutionDeadline = ticket.resolutionDeadline ? new Date(ticket.resolutionDeadline) : null;
      const resolvedAt = ticket.resolvedAt ? new Date(ticket.resolvedAt) : now;

      if (resolutionDeadline && resolvedAt > resolutionDeadline) {
        return 'sla-breached-historical';
      }
      return 'sla-met';
    }

    // For open tickets, check current status
    if (!ticket.assignedTo) {
      // Unassigned - check assignment deadline
      const assignmentDeadline = ticket.assignmentDeadline ? new Date(ticket.assignmentDeadline) : null;
      if (assignmentDeadline) {
        if (now > assignmentDeadline) {
          return 'sla-breached';
        }
        const timeRemaining = assignmentDeadline.getTime() - now.getTime();
        const hoursRemaining = timeRemaining / (1000 * 60 * 60);
        if (hoursRemaining <= 1) {
          return 'sla-at-risk';
        }
      }
    } else {
      // Assigned - check resolution deadline
      const resolutionDeadline = ticket.resolutionDeadline ? new Date(ticket.resolutionDeadline) : null;
      if (resolutionDeadline) {
        if (now > resolutionDeadline) {
          return 'sla-breached';
        }
        const timeRemaining = resolutionDeadline.getTime() - now.getTime();
        const hoursRemaining = timeRemaining / (1000 * 60 * 60);
        if (hoursRemaining <= 2) {
          return 'sla-at-risk';
        }
      }
    }

    return 'sla-on-time';
  }

  getSLABadgeText(ticket: Ticket): string {
    const badgeClass = this.getSLABadgeClass(ticket);

    switch (badgeClass) {
      case 'sla-breached':
        return '⚠️ Breached';
      case 'sla-breached-historical':
        return '⚠️ Was Breached';
      case 'sla-at-risk':
        return '⏰ At Risk';
      case 'sla-met':
        return '✅ Met SLA';
      case 'sla-on-time':
      default:
        return '✅ On Time';
    }
  }
}
