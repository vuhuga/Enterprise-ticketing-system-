export interface Contact {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    jobTitle?: string;
    department?: string;
    organizationId?: number;
    city?: string;
    country?: string;
    address?: string;
    notes?: string;
    status?: 'Active' | 'Inactive';
    preferredContactMethod?: 'Email' | 'Phone' | 'SMS';
    createdAt?: string;
  }
  
