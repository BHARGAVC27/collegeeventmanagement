# Quick Setup & Test Guide

Follow these steps to set up and test the trigger implementation.

## ⚡ Quick Setup (5 minutes)

### 1. Install the Database Trigger

Open MySQL Workbench or command line and run:

```bash
# Navigate to your project folder
cd "c:\Users\cpans\OneDrive\Desktop\DBMS Project\collegeeventmanagement"

# Apply the trigger SQL
mysql -u root -p college_event_management < backend/db/triggers/event_audit_trigger.sql
```

OR in MySQL Workbench:
- File → Open SQL Script
- Navigate to `backend/db/triggers/event_audit_trigger.sql`
- Click Execute (⚡ icon)

### 2. Verify Trigger Installation

Run this in MySQL:
```sql
USE college_event_management;
SHOW TRIGGERS WHERE `Trigger` = 'after_event_status_update';
```

You should see 1 row.

### 3. Start Backend

```bash
cd backend
node server.js
```

Wait for: `Server running on port 5000`

### 4. Start Frontend (new terminal)

```bash
cd frontend
npm run dev
```

Wait for: `Local: http://localhost:5173/`

---

## ✅ Testing Checklist

### Test 1: Access Admin Dashboard
- [ ] Navigate to `http://localhost:5173`
- [ ] Click "Admin Login"
- [ ] Login with admin credentials
- [ ] Verify you see Admin Dashboard

### Test 2: Check New Tab Exists
- [ ] Look for "🔧 Trigger Audit Log" tab
- [ ] Click on it
- [ ] Should see either:
  - Empty state message: "No Audit Logs Yet"
  - OR existing audit entries if you've already approved events

### Test 3: Trigger the Trigger
- [ ] Click on "Events" tab
- [ ] Find a pending event (status = "Pending")
- [ ] Click "Approve" button
- [ ] Wait for success message

### Test 4: Verify Audit Log
- [ ] Click back to "🔧 Trigger Audit Log" tab
- [ ] Click "🔄 Refresh Audit Logs" button
- [ ] Verify you see a new entry with:
  - Event name
  - Action: "Event Status Update"
  - Old Status: "Pending"
  - New Status: "Approved"
  - Timestamp (current time)
  - Trigger: `after_event_status_update`

### Test 5: Verify Database-Level Automation (Optional)
- [ ] Open MySQL Workbench
- [ ] Run this query:
```sql
UPDATE events 
SET status = 'Rejected' 
WHERE event_id = (SELECT event_id FROM events WHERE status = 'Pending' LIMIT 1);
```
- [ ] Go back to Admin Dashboard
- [ ] Refresh Audit Log tab
- [ ] Verify new entry appeared (proving trigger works even for direct SQL updates)

---

## 🐛 Troubleshooting

### Issue: "🔧 Trigger Audit Log" tab not visible
**Fix:**
- Make sure frontend server restarted after changes
- Clear browser cache (Ctrl+Shift+R)
- Check browser console for errors

### Issue: Audit log shows "No Audit Logs Yet" after approving event
**Fix:**
- Verify trigger is installed: `SHOW TRIGGERS;`
- Check backend console for errors
- Click "🔄 Refresh Audit Logs" button
- Check MySQL directly:
```sql
SELECT * FROM admin_audit_log WHERE action_type = 'EVENT_STATUS_CHANGE';
```

### Issue: Backend errors when fetching audit logs
**Fix:**
- Verify `admin_audit_log` table exists:
```sql
SHOW TABLES LIKE 'admin_audit_log';
```
- If missing, run: `backend/db/initDb.js` to create tables

### Issue: No pending events to approve
**Fix:**
- Create a new event through the Club Head interface
- OR manually insert a pending event:
```sql
INSERT INTO events (name, description, club_id, event_date, start_time, venue_id, status)
VALUES ('Test Event', 'For testing trigger', 1, '2024-12-31', '18:00:00', 1, 'Pending');
```

---

## 📸 What You Should See

### Empty State (Before Any Approvals):
```
🔧 Trigger Audit Log

📋 No Audit Logs Yet

Approve or reject an event to see the trigger in action!

The database trigger will automatically log all event status changes here.
```

### With Audit Entries:
```
🔧 Trigger Audit Log                                    [🔄 Refresh Audit Logs]

┌─────────────────┬────────────────────┬────────────┬────────────┬─────────────────────┬──────────────────────────┐
│ Event Name      │ Action             │ Old Status │ New Status │ Timestamp           │ Trigger                  │
├─────────────────┼────────────────────┼────────────┼────────────┼─────────────────────┼──────────────────────────┤
│ Tech Fest 2024  │ EVENT STATUS UPDATE│ Pending    │ Approved   │ 2024-01-15 14:30:22 │ after_event_status_update│
└─────────────────┴────────────────────┴────────────┴────────────┴─────────────────────┴──────────────────────────┘

How It Works:
1. When admin approves/rejects an event, the database trigger fires
2. Trigger automatically inserts a log entry
3. This audit log shows all trigger-generated entries
```

---

## ✨ All Set!

If all tests pass, your trigger implementation is ready for the demo!

See `TRIGGER_DEMO_GUIDE.md` for detailed presentation script.
