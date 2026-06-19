export interface Note {
  title: string;
  content: string;
  relatedTo?: 'Organization' | 'Contact' | 'Ticket';
  referenceId?: string;
  createdBy?: string;
  createdDate?: Date;
  visibility?: 'Private' | 'Public' | 'Team Only';
  tags?: string[];
  priority?: 'Low' | 'Medium' | 'High';
}
