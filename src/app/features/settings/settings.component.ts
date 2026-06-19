import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Tags, Building2, Shield, Flame, ListTodo, Settings, Mail, FileText, ChevronRight } from 'lucide-angular';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-content">
          <h1>Settings</h1>
          <p class="subtitle">Manage system configuration and preferences</p>
        </div>
      </div>

      <div class="settings-grid">
        
        <!-- Ticket Types -->
        <a routerLink="/settings/ticket-types" class="card setting-card">
          <div class="icon-wrapper">
            <lucide-icon [img]="Tags" [size]="24"></lucide-icon>
          </div>
          <div class="card-content">
            <h3>Ticket Types</h3>
            <p>Configure ticket categories and types available for users</p>
          </div>
          <div class="card-action">
            <lucide-icon [img]="ChevronRight" [size]="20"></lucide-icon>
          </div>
        </a>

        <!-- Departments -->
        <a routerLink="/settings/departments" class="card setting-card">
          <div class="icon-wrapper">
            <lucide-icon [img]="Building2" [size]="24"></lucide-icon>
          </div>
          <div class="card-content">
            <h3>Departments</h3>
            <p>Manage organizational departments and assignments</p>
          </div>
          <div class="card-action">
            <lucide-icon [img]="ChevronRight" [size]="20"></lucide-icon>
          </div>
        </a>

        <!-- User Roles -->
        <a routerLink="/settings/user-roles" class="card setting-card">
          <div class="icon-wrapper">
            <lucide-icon [img]="Shield" [size]="24"></lucide-icon>
          </div>
          <div class="card-content">
            <h3>User Roles</h3>
            <p>Define roles and permissions for system access</p>
          </div>
          <div class="card-action">
            <lucide-icon [img]="ChevronRight" [size]="20"></lucide-icon>
          </div>
        </a>

        <!-- Priorities -->
        <a routerLink="/settings/priorities" class="card setting-card">
          <div class="icon-wrapper">
            <lucide-icon [img]="Flame" [size]="24"></lucide-icon>
          </div>
          <div class="card-content">
            <h3>Priorities</h3>
            <p>Set up ticket priority levels and SLA importance</p>
          </div>
          <div class="card-action">
            <lucide-icon [img]="ChevronRight" [size]="20"></lucide-icon>
          </div>
        </a>

        <!-- Statuses -->
        <a routerLink="/settings/statuses" class="card setting-card">
          <div class="icon-wrapper">
            <lucide-icon [img]="ListTodo" [size]="24"></lucide-icon>
          </div>
          <div class="card-content">
            <h3>Ticket Statuses</h3>
            <p>Customize ticket workflow stages and indicators</p>
          </div>
          <div class="card-action">
            <lucide-icon [img]="ChevronRight" [size]="20"></lucide-icon>
          </div>
        </a>

        <!-- Email Templates -->
        <a routerLink="/settings/email-templates" class="card setting-card">
          <div class="icon-wrapper">
            <lucide-icon [img]="FileText" [size]="24"></lucide-icon>
          </div>
          <div class="card-content">
            <h3>Email Templates</h3>
            <p>Customize automated email notifications</p>
          </div>
          <div class="card-action">
            <lucide-icon [img]="ChevronRight" [size]="20"></lucide-icon>
          </div>
        </a>

        <!-- SMTP Settings -->
        <a routerLink="/settings/smtp-settings" class="card setting-card">
          <div class="icon-wrapper">
            <lucide-icon [img]="Mail" [size]="24"></lucide-icon>
          </div>
          <div class="card-content">
            <h3>SMTP Settings</h3>
            <p>Configure email server connection details</p>
          </div>
          <div class="card-action">
            <lucide-icon [img]="ChevronRight" [size]="20"></lucide-icon>
          </div>
        </a>

        <!-- System Settings -->
        <a routerLink="/settings/system-settings" class="card setting-card">
          <div class="icon-wrapper">
            <lucide-icon [img]="Settings" [size]="24"></lucide-icon>
          </div>
          <div class="card-content">
            <h3>System Settings</h3>
            <p>General system configuration and parameters</p>
          </div>
          <div class="card-action">
            <lucide-icon [img]="ChevronRight" [size]="20"></lucide-icon>
          </div>
        </a>

      </div>
    </div>
  `,
  styles: [`
    .page-container {
      max-width: 1200px;
      margin: 0 auto;
      padding-bottom: 4rem;
    }

    .page-header {
      margin-bottom: 2.5rem;
      
      .header-content {
        h1 { font-size: 2rem; margin: 0 0 0.5rem 0; color: var(--slate-900); }
        .subtitle { color: var(--slate-500); font-size: 1.1rem; margin: 0; }
      }
    }

    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 1.5rem;
    }

    .setting-card {
      display: flex;
      align-items: center;
      padding: 1.5rem;
      text-decoration: none;
      transition: all 0.2s ease;
      border: 1px solid var(--slate-200);
      background: white;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
        border-color: var(--primary-200);
        
        .icon-wrapper {
          background: var(--primary-600);
          color: white;
        }
        
        .card-action {
          color: var(--primary-600);
          transform: translateX(4px);
        }
      }
      
      .icon-wrapper {
        width: 48px;
        height: 48px;
        border-radius: var(--radius-lg);
        background: var(--primary-50);
        color: var(--primary-600);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 1.25rem;
        flex-shrink: 0;
        transition: all 0.2s ease;
      }
      
      .card-content {
        flex: 1;
        
        h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--slate-900);
          margin: 0 0 0.25rem 0;
        }
        
        p {
          font-size: 0.9rem;
          color: var(--slate-500);
          margin: 0;
          line-height: 1.4;
        }
      }
      
      .card-action {
        color: var(--slate-300);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
      }
    }

    @media (max-width: 640px) {
      .settings-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class SettingsComponent {
  readonly Tags = Tags;
  readonly Building2 = Building2;
  readonly Shield = Shield;
  readonly Flame = Flame;
  readonly ListTodo = ListTodo;
  readonly Settings = Settings;
  readonly Mail = Mail;
  readonly FileText = FileText;
  readonly ChevronRight = ChevronRight;
}