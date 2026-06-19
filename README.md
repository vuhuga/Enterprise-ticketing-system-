# Enterprise Ticketing System

A production-grade customer support and ticketing platform engineered for scalability, reliability, and exceptional user experience. Built with Angular 20+ and Node.js, this system delivers enterprise-level capabilities for organizations managing complex customer relationships and support workflows.

## System Architecture

### Overview
The Enterprise Ticketing System implements a modern microservices-inspired architecture with clear separation of concerns. The frontend leverages Angular's latest standalone components and signals-based reactivity, while the backend provides a robust REST API layer with comprehensive security controls.

### Technology Stack

**Frontend**
- Angular 20+ with standalone components architecture
- TypeScript 5+ for type-safe development
- RxJS for reactive programming patterns
- Angular Signals for fine-grained reactivity
- SCSS with modular component styling
- Chart.js for data visualization

**Backend**
- Node.js 18+ with Express.js framework
- MySQL 8+ with optimized query patterns and indexing
- JWT-based stateless authentication
- bcrypt for secure password hashing
- Connection pooling for database efficiency
- RESTful API design principles

**Infrastructure**
- SMTP integration for transactional emails
- Background workers for deferred operations
- Migration system for database versioning
- Environment-based configuration management

## Core Features

### Intelligent Ticket Management
- **Automated Assignment**: Smart ticket distribution based on workload balancing and agent availability
- **Deferred Assignment Worker**: Background processing for pending ticket assignments (runs every 1 hour)
- **Priority Escalation**: Automatic priority increase for tickets pending longer than 1 week
- **Admin Alerts**: Email notifications to administrators when pending queue exceeds 100 tickets
- **Status Lifecycle**: Comprehensive workflow from submission through resolution
- **Priority Management**: Configurable priority levels with visual indicators
- **Type & Category System**: Flexible taxonomy for ticket classification
- **Department Routing**: Automatic routing based on organizational structure

### Public Ticket Portal
- **Zero-friction Submission**: No authentication required for ticket creation
- **Rich Text Editor**: Full-featured WYSIWYG editor for detailed descriptions
- **File Attachments**: Drag-and-drop upload with validation
- **Real-time Validation**: Client-side validation with immediate feedback
- **Unique Tracking Keys**: Auto-generated ticket identifiers for easy reference
- **Email Notifications**: Automated status updates and confirmations

### Analytics Dashboard
- **Real-time Metrics**: Live ticket statistics (new, open, closed, unassigned)
- **Visual Analytics**: Interactive pie charts for distribution analysis
  - Tickets by department
  - Tickets by type
  - Tickets by creator
- **Performance KPIs**: 
  - First response time tracking
  - Average resolution time
  - Agent performance metrics
- **Historical Data**: 12-month trend analysis and reporting
- **Customer Insights**: Organization and contact statistics

### User & Access Management
- **Role-Based Access Control (RBAC)**: Granular permissions system
  - Admin: Full system access and configuration
  - Staff: Ticket management and customer interaction
  - Customer: Ticket submission and tracking
- **User Administration**: Complete CRUD operations for user management
- **Profile Management**: User profiles with photo uploads
- **Organization Hierarchy**: Multi-level organizational structure support

### Customer Relationship Management
- **Customer Profiles**: Comprehensive customer information management
- **Organization Management**: Group customers by company/department
- **Contact Management**: Multiple contacts per organization
- **Notes System**: Internal notes for customer context and history
- **Activity Tracking**: Complete audit trail of customer interactions

### Advanced Ticket Operations
- **Multi-criteria Filtering**: Filter by type, category, department, priority, status, assignee
- **Full-text Search**: Search across all ticket fields
- **Bulk Operations**: Mass updates and assignments
- **Import/Export**: CSV-based data migration capabilities
- **Ticket Notes**: Internal and customer-facing comments
- **Email Integration**: Bidirectional email communication

### Email Template System
- **Customizable Templates**: Professional email templates for all notifications
- **Variable Substitution**: Dynamic content insertion (ticket details, user info)
- **Multi-language Support**: i18n-ready template system
- **Template Management**: Admin interface for template customization

### Settings & Configuration
- **System Settings**: Global configuration management
- **Ticket Types**: Customizable ticket type definitions
- **Status Management**: Configurable status workflow
- **Priority Levels**: Custom priority definitions
- **User Roles**: Role and permission management
- **Email Templates**: Template editor and preview

## Project Structure

```
enterprise-ticketing-system/
├── src/
│   ├── app/
│   │   ├── core/                              # Singleton services and core functionality
│   │   │   ├── guards/                        # Route guards (auth, role-based)
│   │   │   ├── interceptors/                  # HTTP interceptors (auth, error handling)
│   │   │   └── services/                      # Core services (auth, API)
│   │   ├── shared/                            # Shared resources
│   │   │   ├── components/                    # Reusable UI components
│   │   │   │   ├── header/                    # Application header
│   │   │   │   ├── sidebar/                   # Navigation sidebar
│   │   │   │   ├── ticket-form/               # Ticket creation/edit form
│   │   │   │   └── timezone-indicator/        # Timezone display component
│   │   │   ├── pipes/                         # Custom pipes (date-format, time-ago)
│   │   │   └── services/                      # Shared services (toast, timezone)
│   │   ├── features/                          # Feature modules (lazy-loaded)
│   │   │   ├── public/                        # Public-facing pages
│   │   │   │   ├── home/                      # Landing page
│   │   │   │   ├── faqs/                      # FAQ section
│   │   │   │   └── footer/                    # Public footer
│   │   │   ├── auth/                          # Authentication flows
│   │   │   │   ├── login/                     # Login page
│   │   │   │   ├── register/                  # Registration
│   │   │   │   ├── forgot-password/           # Password recovery
│   │   │   │   └── reset-password/            # Password reset
│   │   │   ├── dashboard/                     # Admin dashboard
│   │   │   ├── tickets/                       # Ticket management
│   │   │   │   ├── pages/
│   │   │   │   │   ├── create-ticket/         # Ticket creation
│   │   │   │   │   └── ticket-detail/         # Ticket detail view
│   │   │   │   └── services/                  # Ticket services
│   │   │   ├── customers/                     # Customer management
│   │   │   ├── organizations/                 # Organization management
│   │   │   ├── contacts/                      # Contact management
│   │   │   ├── notes/                         # Notes management
│   │   │   ├── manage-users/                  # User administration
│   │   │   └── settings/                      # System settings
│   │   │       ├── ticket-types/              # Ticket type configuration
│   │   │       ├── statuses/                  # Status management
│   │   │       ├── priorities/                # Priority configuration
│   │   │       ├── user-roles/                # Role management
│   │   │       ├── email-templates/           # Email template editor
│   │   │       └── system-settings/           # Global settings
│   │   ├── models/                            # TypeScript interfaces and types
│   │   └── app.config.ts                      # Application configuration
│   ├── assets/
│   │   └── i18n/                              # Internationalization files
│   └── styles.scss                            # Global styles
├── backend/
│   ├── server.js                              # Express server entry point
│   ├── db.js                                  # Database connection and utilities
│   ├── workers/
│   │   └── deferred-assignment-worker.js      # Background job processor
│   ├── migrations/                            # Database migration scripts
│   │   └── 001-add-pending-assignment-status.js
│   ├── create-email-templates-table.js        # Email templates schema
│   ├── create-ticket-notes-table.js           # Ticket notes schema
│   ├── run-sql-migration.js                   # Migration runner
│   └── .env                                   # Environment configuration
├── setup-database.sql                         # Initial database schema
├── start-system.ps1                           # PowerShell startup script
├── start-backend.bat                          # Windows batch startup script
├── AUTO_ASSIGNMENT_README.md                  # Auto-assignment documentation
├── TICKET_IMPORT_EXPORT_GUIDE.md             # Import/export documentation
└── README.md                                  # This file
```

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- MySQL 8.0 or higher
- Angular CLI 20.x or higher

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd enterprise-ticketing-system
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

4. **Database setup**
   
   Create the MySQL database:
   ```bash
   mysql -u root -p
   ```
   
   ```sql
   CREATE DATABASE support_ticket_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
   
   Run the initial schema:
   ```bash
   mysql -u root -p support_ticket_crm < setup-database.sql
   ```

5. **Configure environment variables**
   
   Create `backend/.env`:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_secure_password
   DB_NAME=support_ticket_crm
   DB_PORT=3306
   
   # Application Configuration
   PORT=3000
   NODE_ENV=development
   
   # Security
   JWT_SECRET=your_jwt_secret_key_min_32_chars
   JWT_EXPIRES_IN=24h
   
   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:4200
   
   # Email Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_xxx@gmail.com
   SMTP_PASS=xxx
   SMTP_FROM=noreply@yourdomain.com
   ```

6. **Start the application**
   
   Option A - Using PowerShell script (Windows):
   ```powershell
   .\start-system.ps1
   ```
   
   Option B - Manual start:
   ```bash
   # Terminal 1: Start backend
   cd backend
   npm start
   
   # Terminal 2: Start frontend
   ng serve
   ```

7. **Access the application**
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:3000
   - API Health Check: http://localhost:3000/health

### Default Credentials

**Administrator Account**
- Email: `admin@presidentsaward.ke`
- Password: `admin123`
- Role: Admin (full system access)

**Staff Account**
- Email: `user@presidentsaward.ke`
- Password: `user123`
- Role: Staff (ticket management)

**Important**: Change these credentials immediately in production environments.

## Development Workflow

### Running Development Servers

```bash
# Frontend development server with live reload
ng serve --open

# Backend development server with nodemon
cd backend && npm run dev

# Run both concurrently (if configured)
npm run dev:all
```

### Building for Production

```bash
# Build frontend
ng build --configuration production

# Output will be in dist/ directory
```

### Database Migrations

```bash
# Run pending migrations
cd backend
node run-sql-migration.js

# Create new migration
# Add migration file to backend/migrations/
# Follow naming convention: XXX-description.js
```

### Code Quality

```bash
# Lint TypeScript code
ng lint

# Format code
npm run format

# Type checking
ng build --configuration development
```

## API Documentation

### Authentication Endpoints

```
POST   /api/auth/login          # User login
POST   /api/auth/register       # User registration
POST   /api/auth/forgot-password # Password recovery
POST   /api/auth/reset-password  # Password reset
GET    /api/auth/me             # Get current user
```

### Ticket Endpoints

```
GET    /api/tickets             # List all tickets (with filters)
GET    /api/tickets/:id         # Get ticket details
POST   /api/tickets             # Create new ticket
PUT    /api/tickets/:id         # Update ticket
DELETE /api/tickets/:id         # Delete ticket
POST   /api/tickets/import      # Import tickets from CSV
GET    /api/tickets/export      # Export tickets to CSV
```

### User Management Endpoints

```
GET    /api/users               # List all users
GET    /api/users/:id           # Get user details
POST   /api/users               # Create new user
PUT    /api/users/:id           # Update user
DELETE /api/users/:id           # Delete user
```

### Customer & Organization Endpoints

```
GET    /api/customers           # List customers
POST   /api/customers           # Create customer
GET    /api/organizations       # List organizations
POST   /api/organizations       # Create organization
GET    /api/contacts            # List contacts
POST   /api/contacts            # Create contact
```

### Settings Endpoints

```
GET    /api/settings/ticket-types    # Get ticket types
POST   /api/settings/ticket-types    # Create ticket type
GET    /api/settings/statuses        # Get statuses
GET    /api/settings/priorities      # Get priorities
GET    /api/settings/roles           # Get user roles
GET    /api/email-templates          # Get email templates
PUT    /api/email-templates/:id      # Update email template
```

## Configuration

### Frontend Configuration

Edit `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  apiTimeout: 30000,
  enableDebugMode: true
};
```

### Backend Configuration

All backend configuration is managed through environment variables in `backend/.env`.

### Database Configuration

Connection pooling settings in `backend/db.js`:

```javascript
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
```

## Deployment

### Production Build

1. **Build frontend**
   ```bash
   ng build --configuration production
   ```

2. **Configure web server** (nginx example)
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       root /var/www/ticketing-system/dist/browser;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       location /api {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **Deploy backend**
   ```bash
   # Install PM2 for process management
   npm install -g pm2
   
   # Start backend with PM2
   cd backend
   pm2 start server.js --name ticketing-api
   pm2 startup
   pm2 save
   ```

4. **Configure SSL** (using Let's Encrypt)
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

### Environment Variables for Production

Update `backend/.env` for production:

```env
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://yourdomain.com
JWT_SECRET=<generate-strong-secret>
DB_HOST=<production-db-host>
# ... other production settings
```

### Database Backup

```bash
# Backup database
mysqldump -u root -p support_ticket_crm > backup_$(date +%Y%m%d).sql

# Restore database
mysql -u root -p support_ticket_crm < backup_20250107.sql
```

## Performance Optimization

### Frontend Optimizations
- Lazy loading of feature modules
- OnPush change detection strategy
- Virtual scrolling for large lists
- Image optimization and lazy loading
- Bundle size optimization with tree shaking

### Backend Optimizations
- Database query optimization with proper indexing
- Connection pooling for database efficiency
- Response caching for frequently accessed data
- Compression middleware for API responses
- Rate limiting to prevent abuse

### Database Optimizations
- Indexed columns: `id`, `email`, `ticket_key`, `status`, `assigned_to`
- Query optimization with EXPLAIN analysis
- Regular ANALYZE TABLE maintenance
- Proper foreign key relationships

## Security Considerations

### Authentication & Authorization
- JWT tokens with secure secret keys
- Password hashing with bcrypt (10 rounds)
- Role-based access control (RBAC)
- Protected routes with auth guards
- Token expiration and refresh mechanisms

### Data Protection
- SQL injection prevention with parameterized queries
- XSS protection with input sanitization
- CSRF protection
- CORS configuration
- Secure HTTP headers

### Best Practices
- Environment variables for sensitive data
- Regular security audits
- Dependency vulnerability scanning
- HTTPS enforcement in production
- Regular backup procedures

## Troubleshooting

### Common Issues

**Database Connection Errors**
```bash
# Check MySQL service status
# Windows:
net start MySQL80

# Verify credentials in backend/.env
# Test connection:
mysql -u root -p -h localhost
```

**Port Already in Use**
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (Windows)
taskkill /PID <process_id> /F
```

**Angular Build Errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Angular cache
ng cache clean
```

**CORS Issues**
- Verify `FRONTEND_URL` in `backend/.env`
- Check CORS middleware configuration in `backend/server.js`

## Contributing

### Development Guidelines

1. **Code Style**
   - Follow Angular style guide
   - Use TypeScript strict mode
   - Write self-documenting code
   - Add comments for complex logic

2. **Git Workflow**
   ```bash
   # Create feature branch
   git checkout -b feature/your-feature-name
   
   # Make changes and commit
   git add .
   git commit -m "feat: add new feature"
   
   # Push and create pull request
   git push origin feature/your-feature-name
   ```

3. **Commit Message Convention**
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation changes
   - `style:` Code style changes
   - `refactor:` Code refactoring
   - `test:` Test additions or changes
   - `chore:` Build process or auxiliary tool changes

### Testing

```bash
# Run unit tests
ng test

# Run e2e tests
ng e2e

# Generate code coverage
ng test --code-coverage
```

## Additional Documentation

- [Auto-Assignment System](AUTO_ASSIGNMENT_README.md) - Detailed documentation on the automatic ticket assignment feature
- [Import/Export Guide](TICKET_IMPORT_EXPORT_GUIDE.md) - Guide for bulk ticket operations

## Support & Contact

For technical support or questions:
- Create an issue in the repository
- Contact: support@presidentsaward.ke
- Documentation: [Project Wiki]

## License

This project is proprietary software developed for The President's Award - Kenya.

## Acknowledgments

Built with modern web technologies and best practices to deliver a world-class ticketing experience.

---

**Enterprise Ticketing System** | Built for The President's Award - Kenya | © 2025
