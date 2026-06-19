# SLA Tracking System - Technical Specification

## Executive Summary

Enterprise-grade dual-phase SLA tracking system for ticket lifecycle management with automated monitoring, breach detection, and performance analytics.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     SLA TRACKING SYSTEM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Database   │───▶│  SLA Service │───▶│  SLA Worker  │      │
│  │   Schema     │    │  Calculator  │    │   Monitor    │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                    │                    │              │
│         │                    │                    │              │
│         ▼                    ▼                    ▼              │
│  ┌──────────────────────────────────────────────────────┐      │
│  │              Backend API Endpoints                    │      │
│  │  - Priority Management (CRUD + SLA config)            │      │
│  │  - Ticket Assignment (with SLA calculation)           │      │
│  │  - SLA Analytics (dashboard metrics)                  │      │
│  │  - Breach Notifications (email alerts)                │      │
│  └──────────────────────────────────────────────────────┘      │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────────────────────────────────────────────┐      │
│  │              Frontend Components                      │      │
│  │  - Settings > Priorities (SLA configuration UI)       │      │
│  │  - Dashboard (SLA analytics & metrics)                │      │
│  │  - Ticket Detail (SLA status indicators)              │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

### Enhanced Tables

#### 1. priorities
```sql
CREATE TABLE priorities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  value VARCHAR(50) UNIQUE NOT NULL,
  label VARCHAR(100) NOT NULL,
  color VARCHAR(20),
  sortOrder INT,
  assignment_sla_minutes INT DEFAULT 1440,      -- NEW: Assignment SLA
  resolution_sla_minutes INT DEFAULT 10080,     -- NEW: Resolution SLA
  is_active BOOLEAN DEFAULT TRUE,               -- NEW: Active flag
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 2. tickets
```sql
ALTER TABLE tickets ADD (
  assigned_at TIMESTAMP NULL,                   -- When assigned
  assignment_deadline TIMESTAMP NULL,           -- Assignment SLA deadline
  resolution_deadline TIMESTAMP NULL,           -- Resolution SLA deadline
  assignment_sla_breached BOOLEAN DEFAULT FALSE,
  resolution_sla_breached BOOLEAN DEFAULT FALSE,
  assignment_breach_duration INT NULL,          -- Minutes overdue
  resolution_breach_duration INT NULL,          -- Minutes overdue
  sla_status ENUM('on_time', 'at_risk', 'breached_assignment', 'breached_resolution', 'breached_both'),
  first_response_at TIMESTAMP NULL,
  resolved_at TIMESTAMP NULL
);
```

#### 3. sla_breach_logs (NEW)
```sql
CREATE TABLE sla_breach_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ticket_id INT NOT NULL,
  breach_type ENUM('assignment', 'resolution'),
  priority VARCHAR(50),
  expected_deadline TIMESTAMP,
  actual_breach_time TIMESTAMP,
  breach_duration_minutes INT,
  assigned_to INT NULL,
  notified BOOLEAN DEFAULT FALSE,
  notification_sent_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id),
  INDEX idx_breach_type (breach_type),
  INDEX idx_ticket_id (ticket_id)
);
```

#### 4. sla_analytics (VIEW)
```sql
CREATE VIEW sla_analytics AS
SELECT 
  DATE(t.created_at) as date,
  t.priority,
  COUNT(*) as total_tickets,
  SUM(CASE WHEN t.assignment_sla_breached THEN 1 ELSE 0 END) as assignment_breaches,
  SUM(CASE WHEN t.resolution_sla_breached THEN 1 ELSE 0 END) as resolution_breaches,
  AVG(TIMESTAMPDIFF(MINUTE, t.created_at, t.assigned_at)) as avg_assignment_time,
  AVG(TIMESTAMPDIFF(MINUTE, t.assigned_at, t.resolved_at)) as avg_resolution_time,
  ROUND((SUM(CASE WHEN t.sla_status = 'on_time' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as compliance_percentage
FROM tickets t
WHERE t.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
GROUP BY DATE(t.created_at), t.priority;
```

## Backend Services

### 1. SLACalculator Service
**Location:** `backend/services/SLACalculator.js`

**Responsibilities:**
- Calculate assignment deadlines
- Calculate resolution deadlines
- Check breach status
- Determine at-risk tickets (80% threshold)
- Format time remaining

**Key Methods:**
```javascript
SLACalculator.calculateTicketSLA(priority, createdAt)
SLACalculator.updateAssignmentSLA(ticketId, assignedTo, assignedAt)
SLACalculator.checkAssignmentBreach(createdAt, deadline, assignedAt)
SLACalculator.checkResolutionBreach(assignedAt, deadline, resolvedAt, status)
SLACalculator.getTicketSLAStatus(ticket)
```

### 2. SLA Monitor Worker
**Location:** `backend/workers/sla-monitor-worker.js`

**Responsibilities:**
- Run every 5 minutes
- Check assignment SLA breaches
- Check resolution SLA breaches
- Update ticket SLA status
- Log breaches to audit table
- Send email notifications

**Workflow:**
```
Every 5 minutes:
  1. Query unassigned tickets past assignment deadline
  2. Query assigned tickets past resolution deadline
  3. Update breach flags and durations
  4. Log to sla_breach_logs table
  5. Send notifications to admins
  6. Update statistics
```

## API Endpoints

### Priority Management
```
GET    /api/priorities              - List all priorities with SLA config
GET    /api/priorities/:id          - Get priority details
POST   /api/priorities              - Create priority with SLA
PUT    /api/priorities/:id          - Update priority SLA config
DELETE /api/priorities/:id          - Delete priority
```

### SLA Analytics
```
GET    /api/sla/dashboard           - Dashboard metrics
GET    /api/sla/breaches            - List all breaches
GET    /api/sla/staff-performance   - Staff SLA compliance
GET    /api/sla/trends              - Historical trends
```

### Ticket Assignment (Enhanced)
```
POST   /api/tickets/:id/assign      - Assign ticket (calculates resolution SLA)
```

## Frontend Components

### 1. Settings > Priorities
**File:** `src/app/features/settings/priorities/priorities.component.ts`

**Enhancements:**
- Add columns: Assignment SLA, Resolution SLA
- Inline editing for SLA timeframes
- Validation (assignment < resolution)
- Display format: "30 minutes", "4 hours", "2 days"

**UI Mockup:**
```
┌────────────────────────────────────────────────────────────┐
│ Priority Settings                                           │
├────────────────────────────────────────────────────────────┤
│ Priority │ Color  │ Assignment SLA │ Resolution SLA │ Edit │
├──────────┼────────┼────────────────┼────────────────┼──────┤
│ Urgent   │ 🔴 Red │ 30 minutes     │ 5 hours        │ ✏️   │
│ High     │ 🟠 Org │ 1 hour         │ 1 day          │ ✏️   │
│ Medium   │ 🟡 Yel │ 4 hours        │ 3 days         │ ✏️   │
│ Low      │ 🟢 Grn │ 1 day          │ 1 week         │ ✏️   │
└────────────────────────────────────────────────────────────┘
```

### 2. Dashboard Analytics
**File:** `src/app/features/dashboard/dashboard.component.ts`

**New Metrics Cards:**
```
┌─────────────────────────────────────────────────────────────┐
│ SLA Performance Overview                                     │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│ │ Assignment   │ │ Resolution   │ │ Overall SLA  │        │
│ │ Breaches     │ │ Breaches     │ │ Compliance   │        │
│ │     5        │ │     12       │ │    87.5%     │        │
│ └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Staff Performance                                     │   │
│ │ John Doe      ████████░░ 85% (42/50 on-time)        │   │
│ │ Jane Smith    █████████░ 92% (46/50 on-time)        │   │
│ │ Bob Johnson   ███████░░░ 78% (39/50 on-time)        │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ SLA Breach Trend (Last 30 Days)                      │   │
│ │ [Line Chart showing daily breach counts]             │   │
│ └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 3. Ticket Detail Page
**File:** `src/app/features/tickets/pages/ticket-detail/ticket-detail.component.ts`

**SLA Status Indicator:**
```
┌─────────────────────────────────────────────────────────────┐
│ Ticket #1234 - Network Issue                                │
├─────────────────────────────────────────────────────────────┤
│ Priority: 🔴 Urgent                                         │
│                                                              │
│ SLA Status:                                                  │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Assignment SLA: ✅ Met (assigned in 15 minutes)      │   │
│ │ Resolution SLA: ⚠️  At Risk (2h 30m remaining)       │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ Timeline:                                                    │
│ • Created: 2025-01-08 10:00 AM                              │
│ • Assigned: 2025-01-08 10:15 AM (✅ 15m - within 30m SLA)  │
│ • Resolution Due: 2025-01-08 3:15 PM (⚠️ 2h 30m left)      │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Phases

### Phase 1: Database & Backend Foundation ✅
- [x] Migration script
- [x] SLACalculator service
- [x] SLA Monitor Worker
- [ ] API endpoints

### Phase 2: Settings UI
- [ ] Priority management with SLA config
- [ ] SLA timeframe input components
- [ ] Validation and error handling

### Phase 3: Dashboard Analytics
- [ ] SLA metrics cards
- [ ] Staff performance table
- [ ] Breach trend charts
- [ ] Real-time updates

### Phase 4: Ticket Integration
- [ ] SLA status indicators
- [ ] Timeline visualization
- [ ] Assignment with SLA calculation
- [ ] Breach warnings

### Phase 5: Testing & Optimization
- [ ] Unit tests
- [ ] Integration tests
- [ ] Performance optimization
- [ ] Documentation

## Configuration

### System Settings
```
sla_monitoring_enabled: true/false
sla_notification_enabled: true/false
sla_at_risk_threshold: 80 (percentage)
sla_worker_interval_minutes: 5
```

### Default SLA Values
```
Urgent:  30 min assignment,  5 hours resolution
High:    1 hour assignment,  8 hours resolution
Medium:  4 hours assignment, 2 days resolution
Low:     1 day assignment,   1 week resolution
```

## Monitoring & Alerts

### Email Notifications
- Sent to all active admins
- Triggered on first breach detection
- Includes ticket details and breach duration
- Action items for immediate response

### Audit Trail
- All breaches logged to `sla_breach_logs`
- Includes timestamp, duration, assignee
- Notification status tracked
- Queryable for compliance reporting

## Performance Considerations

### Database Optimization
- Indexes on deadline columns
- Batch processing (100 tickets per check)
- View for pre-aggregated analytics
- Efficient queries with proper JOINs

### Worker Efficiency
- Configurable check interval
- Batch size limits
- Error handling and retry logic
- Statistics tracking

## Security

- Role-based access to SLA configuration
- Audit trail for all SLA changes
- Secure email notifications
- Input validation on all endpoints

## Next Steps

1. Run migration: `node backend/migrations/002-add-sla-tracking.js`
2. Start SLA worker in `server.js`
3. Implement API endpoints
4. Build frontend components
5. Test end-to-end workflow

---

**Status:** Foundation Complete - Ready for API & Frontend Implementation
**Version:** 2.0.0
**Last Updated:** 2025-01-08
