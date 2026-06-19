export interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  description: string;
  content: string;
  variables: string[];
  createdAt?: Date;
  updatedAt?: Date;
}