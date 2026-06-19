import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-faqs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="faqs-container">
      <h2>Frequently Asked Questions</h2>
      
      <div class="faq-list">
        @for (faq of faqs; track faq.id) {
          <div class="faq-item">
            <h3 class="faq-question">{{ faq.question }}</h3>
            <p class="faq-answer">{{ faq.answer }}</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .faqs-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    
    .faq-list {
      margin-top: 2rem;
    }
    
    .faq-item {
      background: white;
      margin-bottom: 1rem;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .faq-question {
      color: #333;
      margin-bottom: 1rem;
      font-size: 1.125rem;
    }
    
    .faq-answer {
      color: #666;
      line-height: 1.6;
      margin: 0;
    }
  `]
})
export class FaqsComponent {
  faqs = [
    {
      id: 1,
      question: 'How do I submit a ticket?',
      answer: 'You can submit a ticket by clicking the "New Ticket" button on the homepage and filling out the required information.'
    },
    {
      id: 2,
      question: 'How long does it take to get a response?',
      answer: 'We aim to respond to all tickets within 24 hours during business days. Urgent tickets are prioritized and may receive faster responses.'
    },
    {
      id: 3,
      question: 'Can I track the status of my ticket?',
      answer: 'Yes, you can track your ticket status by logging into your account and viewing your ticket history.'
    },
    {
      id: 4,
      question: 'What information should I include in my ticket?',
      answer: 'Please provide as much detail as possible about your issue, including steps to reproduce the problem, error messages, and any relevant screenshots.'
    }
  ];
}