# Intelligent Auto-Assignment System

## What is Auto-Assignment?

The auto-assignment system automatically distributes incoming tickets to available staff members based on their current workload, ticket priority, and department. This ensures fair distribution of work and prevents staff overload while guaranteeing that critical tickets are always handled immediately.

## How Auto-Assignment Works

### The Assignment Process (Step-by-Step)

When a new ticket is created, the system follows this decision flow:

```
New Ticket Created
    ↓
Check Priority (Urgent/High = Critical)
    ↓
Find Available Staff in Department
    ↓
Calculate Current Workload for Each Staff
    ↓
Decision Logic:
    ├─ Is Priority Critical (Urgent/High)?
    │   └─ YES → Assign to least busy staff immediately
    │
    ├─ Is Minimum Load < 7 tickets?
    │   └─ YES → Assign to one of top 3 least busy staff (random selection)
    │
    ├─ Is Minimum Load ≥ 10 tickets?
    │   └─ YES → Mark as "Pending Assignment" (staff saturated)
    │
    └─ Is Minimum Load between 7-9 tickets?
        └─ YES → Mark as "Pending Assignment" (staff busy, non-critical ticket)
```

### Assignment Rules

**Rule 1: Critical Priority Override**
- Tickets with "Urgent" or "High" priority are ALWAYS assigned immediately
- Assigned to the least busy staff member, regardless of their current load
- This ensures critical issues are never delayed

**Rule 2: Comfortable Load Assignment**
- If the least busy staff has fewer than 7 active tickets
- Non-critical tickets are assigned to one of the top 3 least busy staff (randomly selected)
- This provides fair distribution and prevents predictable patterns

**Rule 3: System Saturation Protection**
- If ALL staff have 10 or more active tickets
- New non-critical tickets are marked as "Pending Assignment"
- These tickets will be automatically retried by the background worker

**Rule 4: Busy Staff Deferral**
- If the least busy staff has 7-9 active tickets
- Non-critical tickets are deferred to "Pending Assignment"
- Prevents overloading staff with moderate workloads

**Rule 5: Department Fallback**
- If no staff exist in the ticket's department
- System checks the general staff pool across all departments
- Same load balancing rules apply

### What Counts as "Active Tickets"?

When calculating staff workload, the system counts tickets with these statuses:
- `new` - Just created
- `open` - Being worked on
- `in_progress` - Actively being resolved
- `pending_assignment` - Waiting for assignment

Tickets with these statuses are NOT counted:
- `resolved` - Work completed
- `closed` - Ticket closed

## Background Worker (Automatic Retry System)

### What Does the Worker Do?

The background worker is a scheduled job that runs every 10 minutes to:

1. **Retry Pending Assignments**: Checks all tickets with "Pending Assignment" status and attempts to assign them if staff capacity becomes available

2. **Escalate Old Tickets**: Automatically increases priority for tickets that have been pending too long
   - After 30 minutes: `low` → `medium` → `high` → `urgent`

3. **Send Alerts**: Notifies administrators when the pending queue exceeds 10 tickets

### Worker Schedule

```
Every 10 minutes:
    ↓
Find all "Pending Assignment" tickets
    ↓
For each ticket:
    ├─ Check age (created_at timestamp)
    ├─ If age > 30 minutes → Escalate priority
    └─ Attempt assignment using same rules as initial creation
    ↓
Log results (assigned, still pending, escalated)
```

### Worker Logs

The worker provides detailed console output:

```
⏰ [WORKER] Processing queue at 2025-01-07T10:30:00.000Z
📊 [WORKER] Found 5 pending tickets
   ✅ Assigned ticket #1234 to John Doe
   🔺 Escalated ticket #1235: medium → high (age: 35m)
   ⏳ Ticket #1236 still pending: STAFF_STILL_BUSY

📈 [WORKER] Batch Complete:
   Processed: 5
   Assigned: 3
   Escalated: 1
   Still Pending: 2
   Duration: 0.45s
```

## Configuration

### Workload Thresholds

Located in `backend/server.js` (around line 1233):

```javascript
const MAX_LOAD_THRESHOLD = 10;           // System saturation point
const COMFORTABLE_LOAD_THRESHOLD = 7;    // Comfortable workload limit
```

**Adjusting Thresholds:**

- **Increase thresholds** if staff can handle more tickets:
  ```javascript
  const MAX_LOAD_THRESHOLD = 15;
  const COMFORTABLE_LOAD_THRESHOLD = 10;
  ```

- **Decrease thresholds** for lighter workloads:
  ```javascript
  const MAX_LOAD_THRESHOLD = 8;
  const COMFORTABLE_LOAD_THRESHOLD = 5;
  ```

### Worker Settings

Located in `backend/workers/deferred-assignment-worker.js` (line 14):

```javascript
const RETRY_INTERVAL_MS = 10 * 60 * 1000;  // 10 minutes
const ESCALATION_THRESHOLD_MINUTES = 30;    // 30 minutes
const ALERT_THRESHOLD = 10;                 // 10 tickets
```

**Adjusting Worker Behavior:**

- **Faster retry for high-volume systems:**
  ```javascript
  const RETRY_INTERVAL_MS = 5 * 60 * 1000;  // 5 minutes
  ```

- **Slower retry for low-volume systems:**
  ```javascript
  const RETRY_INTERVAL_MS = 15 * 60 * 1000;  // 15 minutes
  ```

- **Faster escalation for urgent environments:**
  ```javascript
  const ESCALATION_THRESHOLD_MINUTES = 15;  // 15 minutes
  ```

### Priority Definitions

Critical priorities that bypass load limits:

```javascript
const CRITICAL_PRIORITIES = new Set(['urgent', 'high']);
```

To add more critical priorities:
```javascript
const CRITICAL_PRIORITIES = new Set(['urgent', 'high', 'critical']);
```

## Installation & Setup

### Step 1: Run Database Migration

The migration adds the "Pending Assignment" status and configuration settings:

```bash
node backend/migrations/001-add-pending-assignment-status.js
```

**What the migration does:**
- Adds `pending_assignment` status to tickets table
- Adds `pending_assignment` to ticket_statuses table
- Creates system settings for auto-assignment configuration
- Sets up load threshold settings

**Expected output:**
```
🔄 Starting migration: Add pending_assignment status...
📋 Step 1: Checking tickets table status ENUM...
   ✅ Added pending_assignment to tickets.status ENUM
📋 Step 2: Checking ticket_statuses table...
   ✅ Added pending_assignment to ticket_statuses table
📋 Step 3: Checking auto-assignment system setting...
   ✅ Added auto_assign_tickets system setting
📋 Step 4: Adding load threshold settings...
   ✅ Added max_load_threshold setting
   ✅ Added comfortable_load_threshold setting
✅ Migration completed successfully!
```

### Step 2: Restart the Server

The background worker starts automatically when the server starts:

```bash
cd backend
npm start
```

**Look for this in the logs:**
```
🚀 [WORKER] Starting Deferred Assignment Worker
   Retry Interval: 600s
   Escalation Threshold: 30 minutes
   Alert Threshold: 10 tickets
```

### Step 3: Verify Auto-Assignment is Working

Create a test ticket and check the console logs:

```
🎯 [AUTO-ASSIGNMENT] Starting intelligent assignment for medium priority ticket to IT department
📊 [LOAD ANALYSIS] Found 3 active staff in IT department
📈 [DEPT LOAD] IT: Min: 2, Avg: 4.3, Staff: 3
✅ [DEPT ASSIGNED] Jane Smith (2 tickets) - IT department
📝 [ASSIGNMENT RESULT] Status: open, Assigned: Yes, Reason: CAPACITY_AVAILABLE_DEPT
```

## System Architecture

### Files Involved

```
backend/
├── server.js                                    # Main auto-assignment logic
│   └── Lines 1233-1360: Assignment algorithm
│
├── workers/
│   └── deferred-assignment-worker.js           # Background retry worker
│       ├── processQueue()                      # Main worker loop
│       ├── attemptAssignment()                 # Retry assignment logic
│       ├── escalateTicket()                    # Priority escalation
│       └── sendQueueAlert()                    # Admin notifications
│
└── migrations/
    └── 001-add-pending-assignment-status.js    # Database setup
```

### Database Schema Changes

**tickets table:**
```sql
ALTER TABLE tickets 
MODIFY COLUMN status ENUM('new', 'open', 'in_progress', 'resolved', 'closed', 'pending_assignment');
```

**ticket_statuses table:**
```sql
INSERT INTO ticket_statuses (value, label, color, sortOrder, isActive, isFinal) 
VALUES ('pending_assignment', 'Pending Assignment', '#ff6b6b', 4, TRUE, FALSE);
```

**system_settings table:**
```sql
INSERT INTO system_settings (`key`, value, label, description, dataType, category, isEditable) 
VALUES 
  ('auto_assign_tickets', 'true', 'Auto Assign Tickets', '...', 'boolean', 'system', TRUE),
  ('max_load_threshold', '10', 'Maximum Load Threshold', '...', 'number', 'system', TRUE),
  ('comfortable_load_threshold', '7', 'Comfortable Load Threshold', '...', 'number', 'system', TRUE);
```

## Monitoring & Troubleshooting

### Check Pending Queue Size

```sql
SELECT COUNT(*) as pending_count 
FROM tickets 
WHERE status = 'pending_assignment';
```

### View Staff Workload

```sql
SELECT 
  u.first_name,
  u.last_name,
  d.name as department,
  COUNT(t.id) as active_tickets,
  CASE 
    WHEN COUNT(t.id) >= 10 THEN '🔴 Saturated'
    WHEN COUNT(t.id) >= 7 THEN '🟡 Busy'
    ELSE '🟢 Available'
  END as status
FROM users u
LEFT JOIN departments d ON u.department_id = d.id
LEFT JOIN tickets t ON u.id = t.assigned_to 
  AND t.status IN ('new', 'open', 'in_progress', 'pending_assignment')
WHERE u.role = 'staff' AND u.is_active = TRUE
GROUP BY u.id
ORDER BY active_tickets ASC;
```

### View Pending Tickets by Age

```sql
SELECT 
  id,
  subject,
  priority,
  department,
  TIMESTAMPDIFF(MINUTE, created_at, NOW()) as age_minutes,
  CASE 
    WHEN TIMESTAMPDIFF(MINUTE, created_at, NOW()) >= 30 THEN '🔴 Overdue'
    WHEN TIMESTAMPDIFF(MINUTE, created_at, NOW()) >= 15 THEN '🟡 Warning'
    ELSE '🟢 Recent'
  END as age_status
FROM tickets 
WHERE status = 'pending_assignment'
ORDER BY created_at ASC;
```

### Common Issues & Solutions

**Issue: All tickets going to "Pending Assignment"**

**Cause:** All staff are saturated (≥10 active tickets)

**Solutions:**
1. Increase thresholds in `server.js`:
   ```javascript
   const MAX_LOAD_THRESHOLD = 15;
   const COMFORTABLE_LOAD_THRESHOLD = 10;
   ```

2. Add more staff members to the system

3. Manually assign some pending tickets to free up capacity

4. Close resolved tickets to reduce active ticket count

---

**Issue: Worker not running**

**Cause:** Server not started or worker failed to initialize

**Solutions:**
1. Check server logs for worker startup message:
   ```
   🚀 [WORKER] Starting Deferred Assignment Worker
   ```

2. Restart the server:
   ```bash
   cd backend
   npm start
   ```

3. Check for errors in console output

---

**Issue: No assignments happening at all**

**Cause:** No active staff in the system

**Solutions:**
1. Verify staff users exist:
   ```sql
   SELECT * FROM users WHERE role = 'staff' AND is_active = TRUE;
   ```

2. Create staff users if none exist

3. Ensure staff have departments assigned

4. Check that staff `is_active` flag is TRUE

---

**Issue: Critical tickets not being assigned**

**Cause:** Priority not set to "urgent" or "high"

**Solutions:**
1. Verify ticket priority:
   ```sql
   SELECT id, subject, priority FROM tickets WHERE id = ?;
   ```

2. Update priority if needed:
   ```sql
   UPDATE tickets SET priority = 'urgent' WHERE id = ?;
   ```

3. Check `CRITICAL_PRIORITIES` set in `server.js`

---

**Issue: Worker processing but not assigning**

**Cause:** Staff still at capacity

**Solutions:**
1. Check current staff loads (see monitoring queries above)

2. Wait for staff to close tickets

3. Manually assign to specific staff if urgent

4. Temporarily increase thresholds

## Manual Assignment Override

Staff and admins can manually assign any ticket regardless of auto-assignment rules:

1. Navigate to ticket detail page
2. Use the "Assign To" dropdown
3. Select staff member
4. Click "Update"

This bypasses all load balancing rules and immediately assigns the ticket.

## Performance Considerations

### Database Indexing

Ensure these indexes exist for optimal performance:

```sql
-- Index for assignment queries
CREATE INDEX idx_tickets_status_assigned ON tickets(status, assigned_to);

-- Index for staff lookup
CREATE INDEX idx_users_role_active ON users(role, is_active);

-- Index for department filtering
CREATE INDEX idx_users_department ON users(department_id);
```

### Worker Performance

- Worker processes all pending tickets in a single batch
- Typical processing time: 0.3-0.5 seconds for 10 tickets
- Database queries are optimized with JOINs and proper indexing
- No performance impact on main application

## Best Practices

1. **Monitor the pending queue regularly** - If it consistently grows, adjust thresholds or add staff

2. **Review staff workload distribution** - Ensure tickets are being distributed fairly

3. **Adjust thresholds based on your team** - Every organization has different capacity

4. **Use priority levels appropriately** - Don't mark everything as urgent

5. **Keep staff profiles updated** - Ensure `is_active` and department assignments are correct

6. **Review worker logs** - Check for patterns in assignment failures

7. **Test configuration changes** - Adjust one threshold at a time and monitor results

## Future Enhancements

Potential improvements to the auto-assignment system:

- **Skill-based routing**: Assign based on staff expertise/skills
- **Time-based routing**: Consider staff working hours and time zones
- **SLA tracking**: Prioritize tickets approaching SLA deadlines
- **Customer priority**: VIP customers get preferential assignment
- **Round-robin option**: Alternative to load-based assignment
- **Department capacity limits**: Set per-department thresholds
- **Email notifications**: Notify staff when assigned via worker
- **Assignment history**: Track assignment patterns and success rates

## Support

For questions or issues with the auto-assignment system:

1. Check the console logs for detailed assignment information
2. Review the monitoring queries to understand current system state
3. Verify configuration settings match your requirements
4. Test with different priority levels and departments

---

**Auto-Assignment System** | Enterprise Ticketing System | © 2025
