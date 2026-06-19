/**
 * Ticket Model
 * 
 * Represents a support ticket in the system.
 * Matches the backend database schema and is used for all ticket-related operations.
 */
export interface Ticket {
  /**
   * Unique identifier for the ticket (UUID)
   */
  id: string;

  /**
   * Human-readable ticket key (e.g., "#838819")
   */
  key: string;

  /**
   * Ticket subject/title
   */
  subject: string;

  /**
   * Detailed description of the issue
   */
  description: string;

  /**
   * Type of ticket (e.g., "Incident", "Service Request")
   * Dynamic value from database configuration
   */
  type: string;

  /**
   * Department responsible for the ticket
   * Dynamic value from database configuration
   */
  department: string;

  /**
   * Priority level (e.g., "Low", "Normal", "High", "Urgent")
   * Dynamic value from database configuration
   */
  priority: string;

  /**
   * Current status (e.g., "Open", "Pending", "Resolved")
   * Dynamic value from database configuration
   */
  status: string;

  /**
   * ID of the customer who created the ticket
   */
  customerId?: string;

  /**
   * Name of the customer
   */
  customerName?: string;

  /**
   * Email of the customer
   */
  customerEmail?: string;

  /**
   * ID of the staff member assigned to the ticket
   */
  assignedTo?: string;

  /**
   * Name of the assigned staff member
   */
  assignedToName?: string;

  /**
   * Timestamp when the ticket was created
   */
  createdAt: Date;

  /**
   * Timestamp when the ticket was last updated
   */
  updatedAt: Date;

  /**
   * Timestamp when the ticket was resolved
   */
  resolvedAt?: Date;

  /**
   * Comment provided by staff upon resolution
   */
  resolution_comment?: string;

  /**
   * List of attachment URLs
   */
  attachments?: string[];

  // SLA Tracking Fields

  /**
   * Deadline for assigning the ticket
   */
  assignmentDeadline?: Date | string;

  /**
   * Deadline for resolving the ticket
   */
  resolutionDeadline?: Date | string;

  /**
   * Whether the assignment SLA has been breached
   */
  assignmentSlaBreached?: boolean;

  /**
   * Whether the resolution SLA has been breached
   */
  resolutionSlaBreached?: boolean;

  /**
   * Overall SLA status of the ticket
   */
  slaStatus?: 'on_time' | 'at_risk' | 'breached_assignment' | 'breached_resolution' | 'breached_both';
}

/**
 * Payload for creating a new ticket
 */
export interface CreateTicketRequest {
  /**
   * Customer's first name
   */
  firstName: string;

  /**
   * Customer's last name
   */
  lastName: string;

  /**
   * Customer's email
   */
  email: string;

  /**
   * Ticket subject
   */
  subject: string;

  /**
   * Ticket description
   */
  description: string;

  /**
   * Ticket type
   */
  type: string;

  /**
   * Target department
   */
  department: string;

  /**
   * Priority level (optional)
   */
  priority?: string;

  /**
   * Array of file attachments (optional)
   */
  attachments?: File[];
}

/**
 * Response for ticket list API with pagination
 */
export interface TicketListResponse {
  /**
   * Array of tickets for the current page
   */
  tickets: Ticket[];

  /**
   * Total number of tickets matching the filter
   */
  total: number;

  /**
   * Current page number
   */
  page: number;

  /**
   * Number of items per page
   */
  limit: number;
}