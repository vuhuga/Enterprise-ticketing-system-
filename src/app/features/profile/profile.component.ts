import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService, User } from '../manage-users/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { LucideAngularModule, User as UserIcon, Mail, Phone, MapPin, Shield, Building2, Calendar, CreditCard } from 'lucide-angular';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-content">
          <h1>My Profile</h1>
          <p class="subtitle">Manage your account settings and preferences</p>
        </div>
      </div>

      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading profile...</p>
      </div>

      <div *ngIf="!loading && user" class="profile-layout">
        
        <!-- Profile Card -->
        <div class="card profile-card">
          <div class="profile-header-bg"></div>
          <div class="profile-content">
            <div class="avatar-container">
              <div class="avatar">
                {{ user.firstName.charAt(0) || user.email.charAt(0) }}
              </div>
            </div>
            
            <div class="user-identity">
              <h2>{{ user.firstName }} {{ user.lastName }}</h2>
              <div class="badges">
                <span class="role-badge" [ngClass]="getRoleClass(user.role)">
                  <lucide-icon [img]="Shield" [size]="14"></lucide-icon>
                  {{ user.role | titlecase }}
                </span>
                <span class="status-badge" [class.active]="user.isActive">
                  {{ user.isActive ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </div>

            <div class="divider"></div>

            <div class="info-grid">
              <!-- Contact Info -->
              <div class="info-section">
                <h3>Contact Information</h3>
                
                <div class="info-item">
                  <div class="icon"><lucide-icon [img]="Mail" [size]="18"></lucide-icon></div>
                  <div class="details">
                    <label>Email Address</label>
                    <div class="value">{{ user.email }}</div>
                  </div>
                </div>

                <div class="info-item">
                  <div class="icon"><lucide-icon [img]="Phone" [size]="18"></lucide-icon></div>
                  <div class="details">
                    <label>Phone Number</label>
                    <div class="value">{{ user.phone || 'Not provided' }}</div>
                  </div>
                </div>
              </div>

              <!-- Location Info -->
              <div class="info-section">
                <h3>Location</h3>
                
                <div class="info-item">
                  <div class="icon"><lucide-icon [img]="MapPin" [size]="18"></lucide-icon></div>
                  <div class="details">
                    <label>Address</label>
                    <div class="value">
                      <span *ngIf="user.address">{{ user.address }}</span>
                      <span *ngIf="user.city"><br>{{ user.city }}</span>
                      <span *ngIf="user.country"><br>{{ user.country }}</span>
                      <span *ngIf="!user.address && !user.city && !user.country" class="placeholder">Not provided</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Organization Info -->
              <div class="info-section">
                <h3>Organization</h3>
                
                <div class="info-item">
                  <div class="icon"><lucide-icon [img]="Building2" [size]="18"></lucide-icon></div>
                  <div class="details">
                    <label>Department</label>
                    <div class="value">
                      {{ user.departmentName || (user.role === 'admin' ? 'Administration' : 'Unassigned') }}
                    </div>
                  </div>
                </div>

                <div class="info-item">
                  <div class="icon"><lucide-icon [img]="Calendar" [size]="18"></lucide-icon></div>
                  <div class="details">
                    <label>Joined Date</label>
                    <div class="value">{{ user.createdAt | date:'mediumDate' }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      max-width: 900px;
      margin: 0 auto;
      padding-bottom: 4rem;
    }

    .page-header {
      margin-bottom: 2rem;
      .header-content {
        h1 { font-size: 2rem; margin: 0 0 0.5rem 0; color: var(--slate-900); }
        .subtitle { color: var(--slate-500); font-size: 1.1rem; margin: 0; }
      }
    }

    .loading-state {
      text-align: center; padding: 4rem; color: var(--slate-500);
      .spinner {
        width: 40px; height: 40px; border: 3px solid var(--slate-200);
        border-top-color: var(--primary-600); border-radius: 50%;
        animation: spin 1s linear infinite; margin: 0 auto 1rem;
      }
    }

    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    .card {
      background: white;
      border: 1px solid var(--slate-200);
      border-radius: var(--radius-xl);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }

    .profile-header-bg {
      height: 120px;
      background: linear-gradient(135deg, var(--primary-600), var(--primary-800));
    }

    .profile-content {
      padding: 0 2rem 2rem;
      position: relative;
    }

    .avatar-container {
      margin-top: -50px;
      margin-bottom: 1.5rem;
      
      .avatar {
        width: 100px; height: 100px;
        border-radius: 50%;
        background: white;
        border: 4px solid white;
        box-shadow: var(--shadow-md);
        display: flex; align-items: center; justify-content: center;
        font-size: 2.5rem; font-weight: 700;
        color: var(--primary-600);
        background-color: var(--primary-50);
      }
    }

    .user-identity {
      margin-bottom: 2rem;
      
      h2 { font-size: 1.75rem; color: var(--slate-900); margin: 0 0 0.75rem 0; }
      
      .badges {
        display: flex; gap: 0.75rem;
        
        .role-badge {
          display: flex; align-items: center; gap: 0.35rem;
          padding: 0.25rem 0.75rem; border-radius: 99px;
          font-size: 0.85rem; font-weight: 600;
          
          &.role-admin { background: #fee2e2; color: #991b1b; }
          &.role-staff { background: #dbeafe; color: #1e40af; }
          &.role-customer { background: #dcfce7; color: #166534; }
        }
        
        .status-badge {
          padding: 0.25rem 0.75rem; border-radius: 99px;
          font-size: 0.85rem; font-weight: 600;
          background: #f1f5f9; color: #64748b;
          &.active { background: #dcfce7; color: #15803d; }
        }
      }
    }

    .divider { height: 1px; background: var(--slate-100); margin: 2rem 0; }

    .info-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
    }

    .info-section {
      h3 { font-size: 1rem; color: var(--slate-400); text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 1.25rem 0; }
      
      display: flex; flex-direction: column; gap: 1.25rem;
    }

    .info-item {
      display: flex; gap: 1rem;
      
      .icon {
        width: 36px; height: 36px;
        background: var(--slate-50); color: var(--slate-500);
        border-radius: var(--radius-lg);
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      
      .details {
        label { display: block; font-size: 0.8rem; color: var(--slate-500); margin-bottom: 0.2rem; }
        .value { font-size: 0.95rem; color: var(--slate-800); font-weight: 500; line-height: 1.4; }
        .placeholder { color: var(--slate-400); font-style: italic; }
      }
    }
  `]
})
export class ProfileComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);

  readonly UserIcon = UserIcon;
  readonly Mail = Mail;
  readonly Phone = Phone;
  readonly MapPin = MapPin;
  readonly Shield = Shield;
  readonly Building2 = Building2;
  readonly Calendar = Calendar;

  user: User | null = null;
  loading = true;

  ngOnInit(): void {
    const currentUser = this.authService.currentUser();

    if (currentUser?.id) {
      this.loadUserProfile(Number(currentUser.id));
    } else {
      console.error('No logged in user found');
      this.loading = false;
    }
  }

  loadUserProfile(userId: number) {
    this.userService.getUserById(userId).subscribe({
      next: (user) => {
        this.user = user;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load user profile:', err);
        this.loading = false;
      }
    });
  }

  getRoleClass(role: string): string {
    return `role-${role}`;
  }
}
