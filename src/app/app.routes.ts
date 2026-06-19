// Application routing configuration with lazy-loaded components
import { Routes } from '@angular/router';

export const routes: Routes = [
  // Public routes (no authentication required) - using public layout
  {
    path: '',
    loadComponent: () => import('./layout/public-layout/public-layout.component').then(m => m.PublicLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/public/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'home',
        loadComponent: () => import('./features/public/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'contact',
        loadComponent: () => import('./features/public/contact/contact.component').then(m => m.ContactComponent)
      },
      {
        path: 'faqs',
        loadComponent: () => import('./features/public/faqs/faqs.component').then(m => m.FaqsComponent)
      },

    ]
  },

  // Authentication routes
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },

  // Protected routes with dashboard layout
  {
    path: 'dashboard',
    loadComponent: () => import('./layout/dashboard-layout/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    canActivate: [() => import('./core/guards/auth.guard').then(m => m.authGuard)],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      }
    ]
  },

  // Ticket management routes with dashboard layout
  {
    path: 'tickets',
    loadComponent: () => import('./layout/dashboard-layout/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    canActivate: [() => import('./core/guards/auth.guard').then(m => m.authGuard)],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/tickets/tickets.component').then(m => m.TicketsComponent)
      },
      {
        path: 'create',
        loadComponent: () => import('./features/tickets/pages/create-ticket/create-ticket.component').then(m => m.CreateTicketComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./features/tickets/pages/ticket-detail/ticket-detail.component').then(m => m.TicketDetailComponent)
      }
    ]
  },

  // Settings routes with dashboard layout (Admin and Staff only)
  {
    path: 'settings',
    loadComponent: () => import('./layout/dashboard-layout/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    canActivate: [() => import('./core/guards/staff.guard').then(m => m.staffGuard)],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
      },
      {
        path: 'ticket-types',
        loadComponent: () => import('./features/settings/ticket-types/ticket-types.component').then(m => m.TicketTypesComponent)
      },
      {
        path: 'departments',
        loadComponent: () => import('./features/settings/departments/departments.component').then(m => m.DepartmentsComponent)
      },
      {
        path: 'user-roles',
        loadComponent: () => import('./features/settings/user-roles/user-roles.component').then(m => m.UserRolesComponent)
      },
      {
        path: 'priorities',
        loadComponent: () => import('./features/settings/priorities/priorities.component').then(m => m.PrioritiesComponent)
      },
      {
        path: 'statuses',
        loadComponent: () => import('./features/settings/statuses/statuses.component').then(m => m.StatusesComponent)
      },
      {
        path: 'email-templates',
        loadComponent: () => import('./features/settings/email-templates/email-templates.component').then(m => m.EmailTemplatesComponent)
      },
      {
        path: 'system-settings',
        loadComponent: () => import('./features/settings/system-settings/system-settings.component').then(m => m.SystemSettingsComponent)
      },
      {
        path: 'smtp-settings',
        loadComponent: () => import('./features/settings/smtp-settings/smtp-settings.component').then(m => m.SmtpSettingsComponent)
      }
    ]
  },

  // User management routes with dashboard layout (Admin only)
  {
    path: 'manage-users',
    loadComponent: () => import('./layout/dashboard-layout/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    canActivate: [() => import('./core/guards/auth.guard').then(m => m.adminGuard)],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/manage-users/user-list.component').then(m => m.UserListComponent)
      },
      {
        path: 'create',
        loadComponent: () => import('./features/manage-users/create-user/create-user.component').then(m => m.CreateUserComponent)
      },
      {
        path: 'edit/:id',
        loadComponent: () => import('./features/manage-users/edit-user.component').then(m => m.EditUserComponent)
      }
    ]
  },

  // Customer management routes with dashboard layout (Staff/Admin only)
  {
    path: 'customers',
    loadComponent: () => import('./layout/dashboard-layout/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    canActivate: [() => import('./core/guards/staff.guard').then(m => m.staffGuard)],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/customers/customer-list.component').then(m => m.CustomerListComponent)
      },
      {
        path: 'create',
        loadComponent: () => import('./features/customers/create-customer.component').then(m => m.CreateCustomerComponent)
      },
      {
        path: 'edit/:id',
        loadComponent: () => import('./features/customers/edit-customer.component').then(m => m.EditCustomerComponent)
      }
    ]
  },

  // Organization management routes with dashboard layout (Staff/Admin only)
  {
    path: 'organizations',
    loadComponent: () => import('./layout/dashboard-layout/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    canActivate: [() => import('./core/guards/staff.guard').then(m => m.staffGuard)],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/organizations/organization-list.component').then(m => m.OrganizationListComponent)
      },
      {
        path: 'create',
        loadComponent: () => import('./features/organizations/create-organization.component').then(m => m.CreateOrganizationComponent)
      },
      {
        path: 'edit/:id',
        loadComponent: () => import('./features/organizations/edit-organization.component').then(m => m.EditOrganizationComponent)
      }
    ]
  },

  // Notes routes with dashboard layout
  {
    path: 'notes',
    loadComponent: () => import('./layout/dashboard-layout/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    canActivate: [() => import('./core/guards/auth.guard').then(m => m.authGuard)],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/notes/notes-list.component').then(m => m.NotesListComponent)
      },
      {
        path: 'create',
        loadComponent: () => import('./features/notes/create-note.component').then(m => m.CreateNoteComponent)
      },
      {
        path: 'edit/:id',
        loadComponent: () => import('./features/notes/edit-note.component').then(m => m.EditNoteComponent)
      }
    ]
  },

  // Contacts routes with dashboard layout (Staff/Admin only)
  {
    path: 'contacts',
    loadComponent: () => import('./layout/dashboard-layout/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    canActivate: [() => import('./core/guards/staff.guard').then(m => m.staffGuard)],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/contacts/contact-list.component').then(m => m.ContactListComponent)
      },
      {
        path: 'create',
        loadComponent: () => import('./features/contacts/create-contact.component').then(m => m.CreateContactComponent)
      },
      {
        path: 'edit/:id',
        loadComponent: () => import('./features/contacts/edit-contact.component').then(m => m.EditContactComponent)
      }
    ]
  },

  // Departments routes with dashboard layout (Staff/Admin only)
  {
    path: 'departments',
    loadComponent: () => import('./layout/dashboard-layout/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    canActivate: [() => import('./core/guards/staff.guard').then(m => m.staffGuard)],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/departments/department-list.component').then(m => m.DepartmentListComponent)
      }
    ]
  },

  // FAQs routes with dashboard layout (Staff/Admin only)
  {
    path: 'dashboard-faqs',
    loadComponent: () => import('./layout/dashboard-layout/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    canActivate: [() => import('./core/guards/staff.guard').then(m => m.staffGuard)],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/public/faqs/faqs.component').then(m => m.FaqsComponent)
      }
    ]
  },

  // Profile route with dashboard layout
  {
    path: 'profile',
    loadComponent: () => import('./layout/dashboard-layout/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    canActivate: [() => import('./core/guards/auth.guard').then(m => m.authGuard)],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
      }
    ]
  },

  // 404 Not Found
  {
    path: '404',
    loadComponent: () => import('./features/public/not-found/not-found.component').then(m => m.NotFoundComponent)
  },

  // Wildcard route - must be last
  { path: '**', redirectTo: '404' }
];