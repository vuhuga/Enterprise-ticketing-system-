import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmailTemplateService, EmailTemplate } from '../services/email-template.service';

@Component({
  selector: 'app-email-templates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './email-templates.component.html',
  styleUrls: ['./email-templates.component.scss']
})
export class EmailTemplatesComponent implements OnInit {
  private emailTemplateService = inject(EmailTemplateService);

  @ViewChild('emailPreview') emailPreview!: ElementRef;

  emailTemplates: EmailTemplate[] = [];
  isEditing = false;
  selectedTemplate: EmailTemplate | null = null;
  editedContent: string = '';

  ngOnInit() {
    this.loadTemplates();
  }

  loadTemplates() {
    this.emailTemplateService.getEmailTemplates().subscribe({
      next: (templates) => {
        console.log('Templates loaded:', templates);
        this.emailTemplates = templates;
      },
      error: (error) => {
        console.error('Error loading templates:', error);
        alert('Failed to load email templates. Please check console for details.');
      }
    });
  }

  editTemplate(template: EmailTemplate) {
    this.selectedTemplate = { ...template };
    this.editedContent = template.content;
    this.isEditing = true;
    
    // Set content after view initializes
    setTimeout(() => {
      if (this.emailPreview) {
        this.emailPreview.nativeElement.innerHTML = this.editedContent;
      }
    }, 0);
  }

  onContentChange(event: Event) {
    const element = event.target as HTMLElement;
    this.editedContent = element.innerHTML;
  }

  closeEditor() {
    this.isEditing = false;
    this.selectedTemplate = null;
    this.editedContent = '';
  }

  updateTemplate() {
    if (!this.selectedTemplate) return;

    // Update the template with the edited content directly
    const updatedTemplate = {
      ...this.selectedTemplate,
      content: this.editedContent
    };

    this.emailTemplateService.updateEmailTemplate(updatedTemplate.id, updatedTemplate).subscribe({
      next: () => {
        alert('Template updated successfully!');
        this.loadTemplates();
        this.closeEditor();
      },
      error: (error) => {
        console.error('Error updating template:', error);
        alert('Failed to update template. Please try again.');
      }
    });
  }
}