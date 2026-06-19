import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// SLA dashboard metrics interface
export interface SLADashboardMetrics {
  overall: {
    total_tickets: number;
    assignment_breaches: number;
    resolution_breaches: number;
    on_time_tickets: number;
    at_risk_tickets: number;
    compliance_percentage: number;
  };
  byPriority: {
    priority: string;
    total: number;
    assignment_breaches: number;
    resolution_breaches: number;
  }[];
  recentBreaches: {
    id: number;
    subject: string;
    priority: string;
    department: string;
    created_at: string;
    assigned_at: string | null;
    assignment_sla_breached: boolean;
    resolution_sla_breached: boolean;
    assignment_breach_duration: number | null;
    resolution_breach_duration: number | null;
    assigned_to_name: string | null;
  }[];
}

// Staff performance metrics interface
export interface StaffPerformance {
  id: number;
  staff_name: string;
  email: string;
  department: string | null;
  total_assigned: number;
  on_time_resolutions: number;
  breached_resolutions: number;
  avg_resolution_time_minutes: number | null;
  compliance_percentage: number | null;
}

// SLA breach details interface
export interface SLABreach {
  id: number;
  ticket_id: number;
  breach_type: 'assignment' | 'resolution';
  priority: string;
  expected_deadline: string;
  actual_breach_time: string;
  breach_duration_minutes: number;
  notified: boolean;
  notification_sent_at: string | null;
  created_at: string;
  ticket_subject: string;
  ticket_department: string;
  assigned_to_name: string | null;
}

// SLA trend data interface
export interface SLATrend {
  date: string;
  total_tickets: number;
  assignment_breaches: number;
  resolution_breaches: number;
  on_time_tickets: number;
  compliance_percentage: number;
}

// Individual ticket SLA status interface
export interface TicketSLAStatus {
  ticketId: number;
  priority: string;
  status: string;
  sla: {
    assignment: {
      deadline: string | null;
      breached: boolean;
      breachDuration: number | null;
      timeRemaining: string | null;
      status: string;
    };
    resolution: {
      deadline: string | null;
      breached: boolean;
      breachDuration: number | null;
      timeRemaining: string | null;
      status: string;
    };
    overall: string;
  };
  config: {
    assignmentSLAMinutes: number;
    resolutionSLAMinutes: number;
  };
}

// SLA service - manages SLA tracking and metrics
@Injectable({
  providedIn: 'root'
})
export class SLAService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/api/sla';

  // Get dashboard metrics overview
  getDashboardMetrics(): Observable<SLADashboardMetrics> {
    return this.http.get<SLADashboardMetrics>(`${this.apiUrl}/dashboard`);
  }

  // Get staff performance data
  getStaffPerformance(): Observable<StaffPerformance[]> {
    return this.http.get<StaffPerformance[]>(`${this.apiUrl}/staff-performance`);
  }

  // Get SLA breach history with filters
  getBreaches(params?: {
    page?: number;
    limit?: number;
    breachType?: 'assignment' | 'resolution';
    priority?: string;
  }): Observable<{
    breaches: SLABreach[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    return this.http.get<any>(`${this.apiUrl}/breaches`, { params: params as any });
  }

  // Get SLA performance trends
  getTrends(days = 30): Observable<SLATrend[]> {
    return this.http.get<SLATrend[]>(`${this.apiUrl}/trends`, {
      params: { days: days.toString() }
    });
  }

  // Get SLA status for specific ticket
  getTicketSLA(ticketId: number): Observable<TicketSLAStatus> {
    return this.http.get<TicketSLAStatus>(`${environment.apiUrl}/api/tickets/${ticketId}/sla`);
  }

  // Assign ticket with SLA calculation
  assignTicket(ticketId: number, assignedTo: number): Observable<{
    success: boolean;
    message: string;
    sla: {
      resolutionDeadline: string;
      assignmentBreached: boolean;
      assignmentBreachDuration: number;
    };
  }> {
    return this.http.post<any>(`${environment.apiUrl}/api/tickets/${ticketId}/assign`, {
      assignedTo
    });
  }
}
