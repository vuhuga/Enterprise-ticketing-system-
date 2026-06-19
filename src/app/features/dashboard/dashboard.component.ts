import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, NgIf, NgFor, NgClass } from '@angular/common';

import { LucideAngularModule, Home, Users, Phone, Building, AlertTriangle, CheckCircle, Clock, AlertCircle, Sparkles, TrendingUp, TrendingDown } from 'lucide-angular';
import { TicketService, Ticket } from '../tickets/services/ticket.service';
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { AuthService } from '../../core/services/auth.service';
import { SLAService, SLADashboardMetrics, StaffPerformance } from '../../shared/services/sla.service';
import { interval, Subscription } from 'rxjs';

interface DashboardMetric {
  title: string;
  value: string;
  percentage: string;
  color: string;
  bgColor: string;
  trend?: 'up' | 'down' | 'neutral';
  change?: string;
  description?: string;
}

interface ChartData {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

interface TicketHistoryMonth {
  label: string;
  count: number;
  isCurrentMonth: boolean;
}

interface TicketHistoryData {
  currentMonth: number;
  lastMonth: number;
  maxCount: number;
  months: TicketHistoryMonth[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, NgClass, TranslatePipe, LucideAngularModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private ticketService = inject(TicketService);
  private translationService = inject(TranslationService);
  private authService = inject(AuthService);
  private slaService = inject(SLAService);
  Math = Math;

  metrics: DashboardMetric[] = [
    { title: 'NEW TICKETS', value: '0', percentage: '0%', color: '#06b6d4', bgColor: '#e0f2fe' },
    { title: 'OPEN TICKETS', value: '0', percentage: '0%', color: '#8b5cf6', bgColor: '#f3e8ff' },
    { title: 'PENDING ASSIGNMENT', value: '0', percentage: '0%', color: '#ff6b6b', bgColor: '#ffe5e5' },
    { title: 'CLOSED TICKETS', value: '0', percentage: '0%', color: '#10b981', bgColor: '#d1fae5' }
  ];

  departmentData: ChartData[] = [];
  ticketTypeData: ChartData[] = [];
  topCreators: ChartData[] = [];
  ticketHistoryData: TicketHistoryData = {
    currentMonth: 0,
    lastMonth: 0,
    maxCount: 0,
    months: []
  };

  totalTickets = 0;
  customers = 0;
  contacts = 0;
  departments = 0;
  loading = true;
  private refreshSubscription?: Subscription;

  // SLA Metrics
  slaMetrics: SLADashboardMetrics | null = null;
  staffPerformance: StaffPerformance[] = [];
  loadingSLA = false;
  currentTime = new Date();

  // Rich, vibrant, saturated colors for charts
  private chartColors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

  // Lucide icons
  readonly Home = Home;
  readonly Users = Users;
  readonly Phone = Phone;
  readonly Building = Building;
  readonly AlertTriangle = AlertTriangle;
  readonly CheckCircle = CheckCircle;
  readonly Clock = Clock;
  readonly AlertCircle = AlertCircle;
  readonly Sparkles = Sparkles;
  readonly TrendingUp = TrendingUp;
  readonly TrendingDown = TrendingDown;

  ngOnInit() {
    this.loadDashboardData();
    this.loadSLAMetrics();

    // Refresh data every 5 minutes for real-time updates
    this.refreshSubscription = interval(300000).subscribe(() => {
      this.loadTicketHistoryData();
      this.loadSLAMetrics();
    });
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadDashboardData() {
    this.loading = true;
    const user = this.authService.currentUser();
    const isCustomer = this.authService.isCustomer();

    // For customers, only load their own tickets
    const ticketParams = isCustomer ? { limit: 1000, created_by: user?.id } : { limit: 1000 };

    // Load tickets and calculate stats locally
    this.ticketService.getTickets(ticketParams).subscribe({
      next: (response) => {
        const tickets = response.tickets;
        const stats = this.calculateTicketStats(tickets);
        this.updateMetrics(stats);
        this.totalTickets = stats.total;
      },
      error: (err) => console.error('❌ Tickets error:', err)
    });

    // Only load additional data for staff/admin users
    if (!isCustomer) {
      // Load tickets by department
      this.ticketService.getTicketsByDepartment().subscribe({
        next: (data) => {
          // backend returns `total_tickets` for department aggregation
          this.departmentData = this.validateChartData(this.mapChartData(data, 'department', 'total_tickets'));
        },
        error: (err) => console.error('❌ Department data error:', err)
      });

      // Load tickets by type
      this.ticketService.getTicketsByType().subscribe({
        next: (data) => {
          this.ticketTypeData = this.validateChartData(this.mapChartData(data, 'type', 'count'));
        },
        error: (err) => console.error('❌ Type data error:', err)
      });

      // Load top creators
      this.ticketService.getTopCreators().subscribe({
        next: (data) => {
          this.topCreators = this.validateChartData(this.mapChartData(data, 'creator', 'tickets_created', 5));
        },
        error: (err) => console.error('❌ Creator data error:', err)
      });

      // Load ticket history
      this.loadTicketHistoryData();

      // Load CRM stats (includes customers, contacts, departments)
      this.ticketService.getCRMStats().subscribe({
        next: (stats) => {
          this.customers = stats.active_customers || 0;
          this.contacts = stats.total_contacts || 0;
          this.departments = stats.total_departments || 0;
          this.loading = false;
        },
        error: (err) => {
          console.error('❌ CRM stats error:', err);
          this.loading = false;
        }
      });
    } else {
      // For customers, set loading to false since we don't load additional data
      this.loading = false;
    }
  }



  private calculateTicketStats(tickets: Ticket[]) {
    const total = tickets.length;
    const pending = tickets.filter(t => t.status === 'new').length;
    const open = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
    const inProgress = tickets.filter(t => t.status === 'in_progress').length;
    const pendingAssignment = tickets.filter(t => t.status === 'pending_assignment').length;
    const resolved = tickets.filter(t => t.status === 'resolved').length;
    const closed = tickets.filter(t => t.status === 'closed').length;
    const unassigned = tickets.filter(t => !t.assignedTo || t.assignedTo === '').length;

    return { total, pending, open, inProgress, pendingAssignment, resolved, closed, unassigned };
  }

  private updateMetrics(stats: { total?: number; pending?: number; open?: number; inProgress?: number; pendingAssignment?: number; resolved?: number; closed?: number; unassigned?: number }) {
    const newCount = stats.pending || 0;
    const openCount = stats.open || 0;
    // Treat "unassigned tickets" as those created but not yet assigned
    const pendingAssignmentCount = stats.unassigned || 0;
    const closedCount = stats.closed || 0;

    // Calculate percentages based on total tickets
    const total = stats.total || 0;

    let newPercentage = 0;
    let openPercentage = 0;
    let pendingAssignmentPercentage = 0;
    let closedPercentage = 0;

    if (total > 0) {
      // Calculate percentages based on total tickets
      newPercentage = Math.round((newCount / total) * 100);
      openPercentage = Math.round((openCount / total) * 100);
      pendingAssignmentPercentage = Math.round((pendingAssignmentCount / total) * 100);
      closedPercentage = Math.round((closedCount / total) * 100);

      // Ensure percentages add up to 100%
      const statusTotal = newPercentage + openPercentage + pendingAssignmentPercentage + closedPercentage;
      if (statusTotal !== 100 && (newCount + openCount + pendingAssignmentCount + closedCount) > 0) {
        const diff = 100 - statusTotal;
        // Add difference to the largest category
        if (newCount >= openCount && newCount >= closedCount) {
          newPercentage += diff;
        } else if (openCount >= closedCount) {
          openPercentage += diff;
        } else {
          closedPercentage += diff;
        }
      }
    }

    this.metrics = [
      {
        title: 'NEW TICKETS',
        value: newCount.toString(),
        percentage: newPercentage + '%',
        color: '#06b6d4',
        bgColor: '#e0f2fe'
      },
      {
        title: 'OPEN TICKETS',
        value: openCount.toString(),
        percentage: openPercentage + '%',
        color: '#8b5cf6',
        bgColor: '#f3e8ff'
      },
      {
        title: 'UNASSIGNED TICKETS',
        value: pendingAssignmentCount.toString(),
        percentage: pendingAssignmentPercentage + '%',
        color: '#ff6b6b',
        bgColor: '#ffe5e5'
      },
      {
        title: 'CLOSED TICKETS',
        value: closedCount.toString(),
        percentage: closedPercentage + '%',
        color: '#10b981',
        bgColor: '#d1fae5'
      }
    ];
  }

  private mapChartData(data: unknown[], labelKey: string, valueKey: string, limit = 10): ChartData[] {
    if (!data || data.length === 0) {
      return [];
    }

    const total = data.reduce((sum: number, item) => {
      const value = typeof item === 'object' && item !== null ? (item as Record<string, unknown>)[valueKey] : 0;
      return sum + (Number(value) || 0);
    }, 0);

    const chartData = data.slice(0, limit).map((item, index) => {
      const obj = typeof item === 'object' && item !== null ? (item as Record<string, unknown>) : {};
      let label = String(obj[labelKey]);
      const count = Number(obj[valueKey]) || 0;

      // Handle various label issues
      if (!label || label === 'null' || label === 'undefined' || label === '') {
        label = 'Unspecified';
      }

      // For numeric labels, try to make them more meaningful
      if (/^\d+$/.test(label)) {
        if (labelKey === 'department' || labelKey === 'department_name') {
          label = `Department ${label}`;
        } else if (labelKey === 'type' || labelKey === 'ticket_type') {
          // Common ticket types mapping
          const typeMap: { [key: string]: string } = {
            '1': 'General Inquiry',
            '2': 'Technical Support',
            '3': 'Bug Report',
            '4': 'Feature Request',
            '5': 'Account Issue'
          };
          label = typeMap[label] || `Type ${label}`;
        } else if (labelKey === 'creator' || labelKey === 'created_by') {
          label = `User ${label}`;
        }
      }

      // Try to get better names from other fields if available
      if (obj['name'] && obj['name'] !== obj[labelKey]) {
        label = String(obj['name']);
      } else if (obj['title'] && obj['title'] !== obj[labelKey]) {
        label = String(obj['title']);
      } else if (obj['display_name'] && obj['display_name'] !== obj[labelKey]) {
        label = String(obj['display_name']);
      }

      return {
        name: label,
        count: count,
        percentage: Number(total) ? Math.round((count / Number(total)) * 100) : 0,
        color: this.chartColors[index % this.chartColors.length]
      };
    });

    // Ensure percentages add up to 100% for pie charts
    if (chartData.length > 0 && total > 0) {
      const totalPercentage = chartData.reduce((sum, item) => sum + item.percentage, 0);
      if (totalPercentage !== 100) {
        const diff = 100 - totalPercentage;
        // Add the difference to the largest item
        const largest = chartData.reduce((prev, current) => (current.count > prev.count) ? current : prev);
        largest.percentage += diff;
      }
    }

    return chartData;
  }

  calculateStrokeDashArray(percentage: number): string {
    const circumference = 2 * Math.PI * 26; // radius is 26 for metric circles
    const strokeLength = (percentage / 100) * circumference;
    const gapLength = circumference - strokeLength;
    return `${strokeLength} ${gapLength}`;
  }

  calculatePieStrokeDashArray(percentage: number): string {
    const circumference = 2 * Math.PI * 50; // radius is 50 for pie charts
    const strokeLength = (percentage / 100) * circumference;
    const gapLength = circumference - strokeLength;
    return `${strokeLength} ${gapLength}`;
  }

  calculateStrokeDashOffset(startPercentage: number): number {
    const circumference = 2 * Math.PI * 50; // radius is 50 for pie charts
    return -(startPercentage / 100) * circumference;
  }

  // Ensure pie chart data always forms a complete circle
  validateChartData(data: ChartData[]): ChartData[] {
    if (data.length === 0) return data;

    const totalPercentage = data.reduce((sum, item) => sum + item.percentage, 0);
    if (totalPercentage === 0) return data;

    // If total is not 100%, normalize the percentages
    if (totalPercentage !== 100) {
      return data.map(item => ({
        ...item,
        percentage: Math.round((item.percentage / totalPercentage) * 100)
      }));
    }

    return data;
  }

  getCumulativePercentage(data: ChartData[], index: number): number {
    return data.slice(0, index).reduce((sum, item) => sum + item.percentage, 0);
  }

  // Translation helper method
  translate(key: string): string {
    return this.translationService.translate(key as never);
  }

  // Check if current user is a customer
  isCustomerUser(): boolean {
    return this.authService.isCustomer();
  }

  // Helper method to parse percentage string to number
  parsePercentage(percentage: string): number {
    return parseInt(percentage.replace('%', ''), 10) || 0;
  }

  // Process ticket history data for the chart
  private processTicketHistoryData(data: any[]): TicketHistoryData {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Create 12 months of data (current month and 11 previous months)
    const months: TicketHistoryMonth[] = [];
    let maxCount = 0;
    let currentMonthCount = 0;
    let lastMonthCount = 0;

    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(currentYear, currentMonth - i, 1);
      const monthIndex = monthDate.getMonth();
      const year = monthDate.getFullYear();
      const isCurrentMonth = i === 0;

      // Find data for this month
      const monthData = data.find(item => {
        const itemDate = new Date(item.month + '-01');
        return itemDate.getMonth() === monthIndex && itemDate.getFullYear() === year;
      });

      const count = monthData ? monthData.count : 0;
      maxCount = Math.max(maxCount, count);

      if (isCurrentMonth) {
        currentMonthCount = count;
      } else if (i === 1) {
        lastMonthCount = count;
      }

      months.push({
        label: monthNames[monthIndex],
        count: count,
        isCurrentMonth: isCurrentMonth
      });
    }

    return {
      currentMonth: currentMonthCount,
      lastMonth: lastMonthCount,
      maxCount: maxCount || 1, // Avoid division by zero
      months: months
    };
  }

  // Calculate bar height percentage for the chart
  calculateBarPercentage(count: number, maxCount: number): number {
    if (maxCount === 0 || count === 0) return 0;
    return (count / maxCount) * 100;
  }

  // Load ticket history data separately for real-time updates
  private loadTicketHistoryData() {
    this.ticketService.getTicketHistory().subscribe({
      next: (data) => {
        this.ticketHistoryData = this.processTicketHistoryData(data);
      },
      error: (err) => console.error('❌ Ticket history error:', err)
    });
  }

  // Load SLA metrics
  private loadSLAMetrics() {
    if (this.isCustomerUser()) {
      return; // Don't load SLA metrics for customers
    }

    this.loadingSLA = true;

    // Load dashboard metrics
    this.slaService.getDashboardMetrics().subscribe({
      next: (metrics) => {
        this.slaMetrics = metrics;
        this.loadingSLA = false;
      },
      error: (err) => {
        console.error('❌ SLA metrics error:', err);
        this.loadingSLA = false;
      }
    });

    // Load staff performance
    this.slaService.getStaffPerformance().subscribe({
      next: (performance) => {
        this.staffPerformance = performance.slice(0, 5); // Top 5 staff
      },
      error: (err) => console.error('❌ Staff performance error:', err)
    });
  }

  // Calculate SLA compliance percentage
  getSLACompliancePercentage(): number {
    if (!this.slaMetrics?.overall) return 0;
    return Math.round(this.slaMetrics.overall.compliance_percentage || 0);
  }

  // Get SLA status color
  getSLAColor(): string {
    if (!this.slaMetrics?.overall) return '#94a3b8';
    const percentage = this.slaMetrics.overall.compliance_percentage;
    if (percentage >= 90) return '#10b981'; // Green
    if (percentage >= 75) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  }

  // Calculate SLA stroke dash array for progress ring
  calculateSLAStrokeDashArray(percentage: number): string {
    const circumference = 2 * Math.PI * 50; // radius is 50
    const progress = (percentage / 100) * circumference;
    return `${progress} ${circumference}`;
  }

  // Get SLA status color (overload for percentage parameter)
  getSLAStatusColor(percentage: number): string {
    if (percentage >= 90) return '#10b981'; // Green
    if (percentage >= 75) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  }

  // Format breach duration for display
  formatBreachDuration(minutes: number | null): string {
    if (!minutes || minutes === 0) {
      return '0 min';
    }

    if (minutes < 60) {
      return `${minutes} min`;
    }

    if (minutes < 1440) { // Less than 24 hours
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;

      if (remainingMinutes === 0) {
        return `${hours}h`;
      }

      return `${hours}h ${remainingMinutes}m`;
    }

    // Days
    const days = Math.floor(minutes / 1440);
    const remainingHours = Math.floor((minutes % 1440) / 60);

    if (remainingHours === 0) {
      return `${days}d`;
    }

    return `${days}d ${remainingHours}h`;
  }

  // Get breach type label
  getBreachTypeLabel(breach: any): string {
    if (breach.assignment_sla_breached && breach.resolution_sla_breached) {
      return 'Both Breached';
    }
    return breach.assignment_sla_breached ? 'Assignment Breach' : 'Resolution Breach';
  }

  // Get breach duration to display
  getBreachDuration(breach: any): number {
    if (breach.resolution_sla_breached && breach.resolution_breach_duration) {
      return breach.resolution_breach_duration;
    }
    return breach.assignment_breach_duration || 0;
  }

  getTotalBreachCount(): number {
    if (!this.slaMetrics?.overall) return 0;
    return (parseInt(this.slaMetrics.overall.assignment_breaches as any) || 0) +
      (parseInt(this.slaMetrics.overall.resolution_breaches as any) || 0);
  }

  getTotalTickets(data?: ChartData[]): number {
    if (data && data.length > 0) {
      return data.reduce((sum, item) => sum + item.count, 0);
    }
    return this.totalTickets;
  }
}
