import { Component, inject, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { LucideAngularModule, Home, Ticket, HelpCircle, Users, FileText, Phone, Building, User, Settings, FileImage, RefreshCw, ChevronDown, ChevronRight } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

interface MenuItem {
  icon: string;
  label: string;
  route: string;
  active: boolean;
  expandable?: boolean;
  subItems?: MenuItem[];
}

interface SubMenuItem {
  label: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private routerSubscription?: Subscription;
  
  @Output() menuItemClick = new EventEmitter<void>();
  
  menuItems: MenuItem[] = [];
  settingsSubItems: SubMenuItem[] = [];
  expandedSettings = false;

  // Lucide icons
  readonly Home = Home;
  readonly Ticket = Ticket;
  readonly HelpCircle = HelpCircle;
  readonly Users = Users;
  readonly FileText = FileText;
  readonly Phone = Phone;
  readonly Building = Building;
  readonly User = User;
  readonly Settings = Settings;
  readonly FileImage = FileImage;
  readonly RefreshCw = RefreshCw;
  readonly ChevronDown = ChevronDown;
  readonly ChevronRight = ChevronRight;

  // Customer menu items (limited access)
  private customerMenuItems = [
    { icon: 'home', label: 'Dashboard', route: '/dashboard', active: false },
    { icon: 'ticket', label: 'Tickets', route: '/tickets', active: false },
    { icon: 'file-text', label: 'Notes', route: '/notes', active: false }
  ];

  // Staff and Admin menu items (full access)
  private staffAdminMenuItems = [
    { icon: 'home', label: 'Dashboard', route: '/dashboard', active: false },
    { icon: 'ticket', label: 'Tickets', route: '/tickets', active: false },
    { icon: 'help-circle', label: 'FAQs', route: '/dashboard-faqs', active: false },
    { icon: 'users', label: 'Customers', route: '/customers', active: false },
    { icon: 'file-text', label: 'Notes', route: '/notes', active: false },
    { icon: 'phone', label: 'Contacts', route: '/contacts', active: false },
    { icon: 'building', label: 'Organizations', route: '/organizations', active: false },
    { icon: 'user', label: 'Manage Users', route: '/manage-users', active: false },
    { icon: 'settings', label: 'Settings', route: '/settings', active: false, expandable: true },
    { icon: 'file-image', label: 'Front Pages', route: '/front-pages', active: false },
    { icon: 'refresh-cw', label: 'System Update', route: '/system-update', active: false }
  ];

  private adminSettingsSubItems = [
    { label: 'Ticket Types', route: '/settings/ticket-types' },
    { label: 'Departments', route: '/settings/departments' },
    { label: 'User Roles', route: '/settings/user-roles' },
    { label: 'Priorities', route: '/settings/priorities' },
    { label: 'Statuses', route: '/settings/statuses' },
    { label: 'Email Templates', route: '/settings/email-templates' },
    { label: 'SMTP Settings', route: '/settings/smtp-settings' },
    { label: 'System Settings', route: '/settings/system-settings' }
  ];

  ngOnInit() {
    this.setMenuBasedOnRole();
    this.updateActiveMenuItem();
    
    // Subscribe to router events to update active menu item
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateActiveMenuItem();
      });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private setMenuBasedOnRole() {
    const user = this.authService.currentUser();
    
    if (user?.role === 'customer') {
      // Customers only see Dashboard, Tickets, and Notes
      this.menuItems = [...this.customerMenuItems];
      this.settingsSubItems = []; // No settings for customers
    } else {
      // Staff and Admin get full menu (staff, admin roles)
      this.menuItems = [...this.staffAdminMenuItems];
      this.settingsSubItems = [...this.adminSettingsSubItems];
    }
  }

  toggleSettings() {
    this.expandedSettings = !this.expandedSettings;
  }

  handleSettingsClick(event: Event) {
    event.preventDefault();
    this.toggleSettings();
  }

  onMenuItemClick() {
    this.menuItemClick.emit();
  }

  private updateActiveMenuItem() {
    const currentUrl = this.router.url;
    
    // Reset all menu items to inactive
    this.menuItems.forEach(item => {
      item.active = false;
    });

    // Find and activate the matching menu item
    const activeItem = this.menuItems.find(item => {
      // Exact match for root routes
      if (item.route === currentUrl) {
        return true;
      }
      
      // For nested routes, check if current URL starts with the menu route
      if (currentUrl.startsWith(item.route) && item.route !== '/') {
        return true;
      }
      
      // Special handling for settings routes
      if (item.route === '/settings' && currentUrl.startsWith('/settings/')) {
        this.expandedSettings = true;
        return true;
      }
      
      return false;
    });

    if (activeItem) {
      activeItem.active = true;
    }
  }

  getIconComponent(iconName: string) {
    const iconMap: { [key: string]: any } = {
      'home': this.Home,
      'ticket': this.Ticket,
      'help-circle': this.HelpCircle,
      'users': this.Users,
      'file-text': this.FileText,
      'phone': this.Phone,
      'building': this.Building,
      'user': this.User,
      'settings': this.Settings,
      'file-image': this.FileImage,
      'refresh-cw': this.RefreshCw
    };
    return iconMap[iconName] || this.Home;
  }
}