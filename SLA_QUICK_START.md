# SLA Tracking System - Quick Start Guide

## Installation & Setup

### Step 1: Run Database Migration

```bash
cd backend
node migrations/002-add-sla-tracking.js
```

**Expected Output:**
```
[MIGRATION] Starting SLA Tracking System migration...
[STEP 1] Adding SLA timeframes to priorities table...
   [SUCCESS] SLA columns added to priorities table
[STEP 2] Setting default SLA values for existing priorities...
   [SUCCESS] urgent: 30min assignment, 300min resolution
   [SUCCESS] high: 60min assignment, 480min resolution
   [SUCCESS] medium: 240min assignment, 2880min resolution
   [SUCCESS] low: 1440min assignment, 10080min resolution
...
[MIGRATION] SLA Tracking System migration completed successfully!
```

### Step 2: Configure Email Notifications (Optional)

Edit `backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@yourdomain.com
FRONTEND_URL=http://localhost:4200
```

### Step 3: Start the System

```bash
# Start backend (workers auto-start)
cd backend
npm start

# Start frontend (in another terminal)
ng serve
```

**Look for these logs:**
```
[WORKERS] Starting background workers...
[WORKERS] Starting Deferred Assignment Worker...
[WORKERS] Starting SLA Monitoring Worker...
   Retry Interval: 60 minutes (1 hour(s))
   Escalation Threshold: 10080 minutes (7 days)
   Alert Threshold: 100 tickets
[WORKERS] All workers started successfully
```

## Usage

### Configure Priority SLA Values

1. Navigate to **Settings > Priorities**
2. Click on any priority to edit
3. Set **Assignment SLA** (time to assign ticket)
4. Set **Resolution SLA** (time to resolve after assignment)
5. Click **Update**

**Recommended Values:**
- **Urgent**: 30 min assignment, 5 hours resolution
- **High**: 1 hour assignment, 1 day resolution
- **Medium**: 4 hours assignment, 3 days resolution
- **Low**: 1 day assignment, 1 week resolution

### View SLA Dashboard

1. Navigate to **Dashboard**
2. View SLA metrics cards:
   - Assignment breaches count
   - Resolution breaches count
   - Overall compliance percentage
3. Check staff performance table
4. Review recent breaches

### Monitor Ticket SLA

1. Open any ticket
2. View SLA status section:
   - Assignment SLA status (met/breached/at-risk)
   - Resolution SLA status
   - Time remaining or overdue
3. Color indicators:
   - 🟢 Green: On time
   - 🟡 Yellow: At risk (80% time elapsed)
   - 🔴 Red: Breached

### Manual Ticket Assignment

1. Open unassigned ticket
2. Select staff member from dropdown
3. Click **Assign**
4. System automatically:
   - Calculates resolution deadline
   - Checks if assignment SLA breached
   - Updates ticket status
   - Sends notification

## How It Works

### Phase 1: Assignment SLA (Unassigned Tickets)

```
Ticket Created
    ↓
Assignment Deadline = Created Time + Assignment SLA
    ↓
SLA Worker checks every 5 minutes
    ↓
If not assigned by deadline → BREACH
    ↓
- Flag ticket as breached
- Log to audit table
- Send email to admins
```

### Phase 2: Resolution SLA (Assigned Tickets)

```
Ticket Assigned
    ↓
Resolution Deadline = Assigned Time + Resolution SLA
    ↓
SLA Worker checks every 5 minutes
    ↓
If not resolved by deadline → BREACH
    ↓
- Flag ticket as breached
- Log to audit table
- Send email to admins & assignee
```

### Automatic Escalation

```
Ticket pending for 1 week
    ↓
Priority automatically escalates:
- Low → Medium
- Medium → High
- High → Urgent
    ↓
New SLA deadlines calculated
```

## API Endpoints

### Get Dashboard Metrics
```bash
GET /api/sla/dashboard
```

### Get Staff Performance
```bash
GET /api/sla/staff-performance
```

### Get Breach History
```bash
GET /api/sla/breaches?page=1&limit=20&breachType=resolution
```

### Get SLA Trends
```bash
GET /api/sla/trends?days=30
```

### Get Ticket SLA Status
```bash
GET /api/tickets/:id/sla
```

### Manually Assign Ticket
```bash
POST /api/tickets/:id/assign
Body: { "assignedTo": 5 }
```

## Monitoring

### Check SLA Worker Status

Look for these logs every 5 minutes:

```
[SLA-WORKER] Processing queue at 2025-01-08T10:30:00.000Z
[SLA-WORKER] Checking assignment SLA...
   [OK] No assignment SLA breaches detected
[SLA-WORKER] Checking resolution SLA...
   [ALERT] Found 3 tickets with resolution SLA breach
   [BREACH] Ticket #1234 - Resolution SLA breached by 120 minutes
   [NOTIFICATION] Sent resolution breach alert to 2 admin(s)

[SLA-WORKER] Batch Complete:
   Processed: 3
   Assigned: 0
   Escalated: 1
   Duration: 0.45s
```

### Database Queries

**Check pending tickets:**
```sql
SELECT COUNT(*) FROM tickets 
WHERE status = 'pending_assignment';
```

**Check SLA breaches:**
```sql
SELECT COUNT(*) FROM tickets 
WHERE assignment_sla_breached = TRUE 
   OR resolution_sla_breached = TRUE;
```

**View breach logs:**
```sql
SELECT * FROM sla_breach_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

**Staff performance:**
```sql
SELECT 
  CONCAT(u.first_name, ' ', u.last_name) as staff,
  COUNT(t.id) as total_tickets,
  SUM(CASE WHEN t.resolution_sla_breached = FALSE THEN 1 ELSE 0 END) as on_time,
  ROUND((SUM(CASE WHEN t.resolution_sla_breached = FALSE THEN 1 ELSE 0 END) / COUNT(t.id)) * 100, 2) as compliance
FROM users u
LEFT JOIN tickets t ON u.id = t.assigned_to
WHERE u.role = 'staff'
GROUP BY u.id;
```

## Troubleshooting

### Worker Not Running

**Problem:** No SLA checks happening

**Solution:**
1. Check server logs for worker startup
2. Restart backend server
3. Verify no errors in console

### No Email Notifications

**Problem:** Breaches detected but no emails sent

**Solution:**
1. Check SMTP configuration in `.env`
2. Verify `sla_notification_enabled` = true in system_settings
3. Test SMTP connection
4. Check spam folder

### Incorrect SLA Calculations

**Problem:** Deadlines seem wrong

**Solution:**
1. Verify priority SLA values in Settings > Priorities
2. Check server timezone settings
3. Review ticket created_at and assigned_at timestamps
4. Recalculate: `deadline = start_time + sla_minutes`

### High Breach Rate

**Problem:** Too many tickets breaching SLA

**Solution:**
1. Review priority SLA timeframes (may be too aggressive)
2. Check staff workload distribution
3. Consider adding more staff
4. Adjust thresholds in Settings > Priorities

## Best Practices

1. **Set Realistic SLAs**
   - Base on historical data
   - Consider team capacity
   - Account for complexity

2. **Monitor Regularly**
   - Check dashboard daily
   - Review breach logs weekly
   - Analyze trends monthly

3. **Train Staff**
   - Explain SLA importance
   - Show how to check SLA status
   - Encourage timely responses

4. **Adjust as Needed**
   - Review SLA values quarterly
   - Update based on performance
   - Consider seasonal variations

5. **Use Priorities Correctly**
   - Don't mark everything urgent
   - Follow priority guidelines
   - Escalate appropriately

## Support

For issues or questions:
- Check logs: `backend/logs/`
- Review documentation: `SLA_TRACKING_SPECIFICATION.md`
- Check implementation progress: `SLA_IMPLEMENTATION_PROGRESS.md`

---

**SLA Tracking System** | Enterprise Ticketing System | © 2025
