/**
 * User Model
 * 
 * Represents a user in the system. This interface matches the backend database schema.
 * Users can have different roles (admin, staff, customer) which determine their permissions.
 */
export interface User {
  /**
   * Unique identifier for the user
   */
  id: number;

  /**
   * User's first name
   */
  first_name: string;

  /**
   * User's last name
   */
  last_name: string;

  /**
   * User's email address (used for login and notifications)
   */
  email: string;

  /**
   * User's role in the system
   * - 'admin': Full system access
   * - 'staff': Access to ticket management and assigned areas
   * - 'customer': Limited access to own tickets
   */
  role: 'admin' | 'staff' | 'customer';

  /**
   * ID of the department the user belongs to (if staff/admin)
   */
  department_id?: number;

  /**
   * Name of the department (for display purposes)
   */
  department_name?: string;

  /**
   * User's phone number
   */
  phone?: string;

  /**
   * User's city
   */
  city?: string;

  /**
   * User's country
   */
  country?: string;

  /**
   * User's full address
   */
  address?: string;

  /**
   * URL to user's profile photo
   */
  photo?: string;

  /**
   * Whether the user account is active
   */
  is_active?: boolean;

  /**
   * Timestamp when the user was created (ISO string)
   */
  created_at: string;
}