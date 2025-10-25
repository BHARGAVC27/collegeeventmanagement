# Registration Count Triggers - Setup & Demo Guide

## 🎯 What This Does

**Automatic Event Registration Counting** - Three database triggers that:
1. **Auto-increment** count when students register (`AFTER INSERT`)
2. **Auto-update** count when registrations change status (`AFTER UPDATE`)
3. **Auto-decrement** count when registrations are cancelled (`AFTER DELETE`)
4. **Log all activity** for demo purposes
5. **Show live statistics** in Admin Dashboard with capacity tracking

---

## ⚡ Quick Setup

### Step 1: Apply the Trigger SQL

**Using MySQL Workbench:**
1. Open MySQL Workbench
2. Connect to `college_event_management`
3. File → Open SQL Script
4. Select `backend/db/triggers/registration_count_trigger.sql`
5. Click Execute (⚡)

**Using Command Prompt:**
```cmd
cd c:\Users\cpans\OneDrive\Desktop\DBMS Project\collegeeventmanagement
mysql -u root -p college_event_management < backend\db\triggers\registration_count_trigger.sql
```

### Step 2: Verify Installation

Run in MySQL:
```sql
USE college_event_management;

-- Check all 3 triggers exist
SHOW TRIGGERS WHERE Trigger IN (
    'after_registration_insert', 
    'after_registration_update', 
    'after_registration_delete'
);

-- Check new columns added
SHOW COLUMNS FROM events LIKE 'current_registrations';
SHOW COLUMNS FROM events LIKE 'last_registration_update';

-- Check activity log table exists
SHOW TABLES LIKE 'registration_activity_log';
```

You should see **3 triggers**, **2 new columns**, and **1 new table**.

### Step 3: Restart Backend

```bash
cd backend
# Stop current server (Ctrl+C)
node server.js
```

New endpoints are now available:
- `/admin/registration-activity`
- `/admin/event-statistics`

---

## 🧪 Testing the Triggers

### Test 1: View the New Tab

1. Login as **Admin**
2. Go to Admin Dashboard
3. Click **"📊 Registration Stats"** tab (green gradient)
4. You'll see:
   - **Live Event Capacity Tracking** table
   - **Recent Registration Activity** log
   - All with trigger-maintained counts!

### Test 2: Register for an Event (As Student)

1. **Open a new browser/incognito window**
2. Login as a **Student**
3. Go to **Events page**
4. Find an approved event
5. Click **Register**
6. Complete registration

### Test 3: See Trigger in Action

1. **Go back to Admin Dashboard**
2. Click **"📊 Registration Stats"** tab
3. Click **"🔄 Refresh Data"**
4. You'll see:
   - Event's registration count **increased by 1** (automatic!)
   - New entry in **Recent Registration Activity**
   - Progress bar updated
   - Activity shows: `0 → 1 / 50` (or similar)
   - Trigger name: `after_registration_insert`

### Test 4: Cancel Registration

1. As **Student**, go to **My Events**
2. Click **Cancel** on the registration
3. **Go back to Admin Dashboard**
4. Refresh Registration Stats tab
5. You'll see:
   - Count **decreased by 1** (automatic!)
   - New activity entry showing cancellation
   - Trigger: `after_registration_delete`

### Test 5: Direct SQL Test

Run this in MySQL:
```sql
-- Register a student directly in database
INSERT INTO event_registrations (student_id, event_id, registration_status)
VALUES (1, 1, 'Registered');

-- Check the count was auto-updated
SELECT id, name, current_registrations, max_participants 
FROM events 
WHERE id = 1;

-- Check the activity log
SELECT * FROM registration_activity_log 
ORDER BY activity_timestamp DESC 
LIMIT 5;
```

The count updated automatically - even though you bypassed the application!

---

## 🎬 Demo Script for Presentation

### Part 1: Explain the Problem

**Say:**
> "In most applications, counting registrations requires running COUNT(*) queries every time, which is slow. Or worse, the count gets out of sync with actual data. We've solved this with database triggers."

### Part 2: Show the Triggers

Open `backend/db/triggers/registration_count_trigger.sql`:

```sql
CREATE TRIGGER after_registration_insert
AFTER INSERT ON event_registrations
FOR EACH ROW
BEGIN
    -- Update the event's registration count
    UPDATE events 
    SET current_registrations = current_registrations + 1,
        last_registration_update = CURRENT_TIMESTAMP
    WHERE id = NEW.event_id;
    
    -- Log the activity
    INSERT INTO registration_activity_log (...) VALUES (...);
END
```

**Explain:**
- **3 triggers** covering INSERT, UPDATE, DELETE
- **AFTER** timing - runs after the registration is saved
- **Automatic counting** - no application code needed
- **Activity logging** - complete audit trail

### Part 3: Live Demonstration

**Step 1: Show current state**
- Admin Dashboard → "📊 Registration Stats"
- Point out an event with some registrations
- Note the current count (e.g., "5 registrations")

**Step 2: Register as student**
- Switch to student account (or use incognito)
- Register for that event
- Show success message

**Step 3: Show automatic update**
- Back to Admin Dashboard
- Click "🔄 Refresh Data"
- **Point out:**
  - Count increased: "5 → 6"
  - Progress bar moved
  - Fill percentage updated
  - New activity entry appeared
  - Shows student name, action, count change
  - Trigger name: `after_registration_insert`

**Step 4: Cancel and show again**
- Cancel the registration
- Refresh stats
- Count decreased: "6 → 5"
- New cancellation entry logged

**Say:**
> "Notice the database is maintaining these counts automatically. Even if I register via SQL, the API, or any other method - the trigger ensures the count is always accurate."

### Part 4: Show Capacity Tracking

Point to the statistics table:

```
Event Name          | Registrations | Capacity | Fill %  | Status
Tech Fest 2024      | 45           | 50       | 90.0%   | ALMOST FULL
Coding Workshop     | 15           | 30       | 50.0%   | HALF FULL
Robotics Demo       | 100          | 100      | 100.0%  | FULL
Cultural Night      | 10           | 200      | 5.0%    | AVAILABLE
```

**Explain:**
- Progress bars show capacity visually
- Color coding: Green (available) → Orange → Red (full)
- Status badges automatically assigned by triggers
- Perfect for event organizers to monitor popularity

---

## 📊 What You'll See in the GUI

### Event Statistics Table:
```
📊 Event Registration Statistics

Live Event Capacity Tracking

┌──────────────────┬────────────────┬────────────┬────────────────┬──────────┬─────────┬──────────────┐
│ Event Name       │ Club           │ Date       │ Registrations  │ Capacity │ Fill %  │ Status       │
├──────────────────┼────────────────┼────────────┼────────────────┼──────────┼─────────┼──────────────┤
│ Tech Fest 2024   │ CS Society     │ 11/15/2025 │ 45             │ 50       │ ▓▓▓▓▓90%│ ALMOST FULL  │
│ Code Workshop    │ Coding Club    │ 11/20/2025 │ 15             │ 30       │ ▓▓▓░░50%│ HALF FULL    │
│ Robotics Expo    │ Robotics Club  │ 12/01/2025 │ 100            │ 100      │ ▓▓▓▓100%│ FULL         │
└──────────────────┴────────────────┴────────────┴────────────────┴──────────┴─────────┴──────────────┘
```

### Registration Activity Log:
```
Recent Registration Activity

┌─────────────────┬──────────────────┬────────────┬──────────────┬──────────────────────┬─────────────────────────┐
│ Student         │ Event            │ Action     │ Count Change │ Timestamp            │ Trigger                 │
├─────────────────┼──────────────────┼────────────┼──────────────┼──────────────────────┼─────────────────────────┤
│ John Smith      │ Tech Fest 2024   │ REGISTERED │ 44 → 45 / 50 │ 10/23/2025, 9:30 PM  │ after_registration_ins..│
│ CS2021001       │                  │            │              │                      │                         │
├─────────────────┼──────────────────┼────────────┼──────────────┼──────────────────────┼─────────────────────────┤
│ Jane Doe        │ Code Workshop    │ CANCELLED  │ 16 → 15 / 30 │ 10/23/2025, 9:25 PM  │ after_registration_del..│
│ CS2021002       │                  │            │              │                      │                         │
└─────────────────┴──────────────────┴────────────┴──────────────┴──────────────────────┴─────────────────────────┘
```

---

## 🔍 Key Features

### What the Triggers Maintain:

1. **`events.current_registrations`**
   - Real-time count of active registrations
   - Updated on every registration/cancellation
   - No need to run COUNT(*) queries

2. **`events.last_registration_update`**
   - Timestamp of last registration activity
   - Useful for sorting "most recently registered events"

3. **`registration_activity_log`**
   - Complete audit trail of all registration activity
   - Shows before/after counts
   - Includes trigger name for demo

### Automatic Calculations:

- **Fill Percentage**: `(current / capacity) * 100`
- **Capacity Status**: 
  - FULL: 100%
  - ALMOST_FULL: ≥80%
  - HALF_FULL: ≥50%
  - AVAILABLE: <50%

---

## 💡 Real-World Use Cases

1. **Event Organizers**: See which events are filling up fast
2. **Students**: Could show "Only 5 spots left!" warnings
3. **Reports**: Generate attendance reports without slow queries
4. **Analytics**: Track registration patterns over time
5. **Capacity Planning**: Identify events that need larger venues

---

## 🐛 Troubleshooting

### Issue: Counts seem wrong

**Fix - Recalculate all counts:**
```sql
UPDATE events e
SET current_registrations = (
    SELECT COUNT(*) 
    FROM event_registrations er 
    WHERE er.event_id = e.id 
    AND er.registration_status = 'Registered'
);
```

### Issue: Activity log is empty

**Check triggers are firing:**
```sql
-- Register someone
INSERT INTO event_registrations (student_id, event_id, registration_status)
VALUES (1, 1, 'Registered');

-- Check log immediately
SELECT * FROM registration_activity_log ORDER BY activity_timestamp DESC LIMIT 1;
```

### Issue: "Column 'current_registrations' doesn't exist"

**Add the column:**
```sql
ALTER TABLE events 
ADD COLUMN current_registrations INT DEFAULT 0,
ADD COLUMN last_registration_update TIMESTAMP NULL;
```

---

## ✨ Summary: Two Triggers Working Together

| Feature | Trigger 1 (Audit) | Trigger 2 (Registrations) |
|---------|------------------|---------------------------|
| **Type** | AFTER UPDATE | AFTER INSERT/UPDATE/DELETE |
| **Purpose** | Log admin actions | Maintain registration counts |
| **Action** | INSERT to audit_log | UPDATE count + log activity |
| **GUI Tab** | 🔧 Trigger Audit Log | 📊 Registration Stats |
| **Color** | Purple gradient | Green gradient |
| **Demo** | Approve/reject events | Register/cancel for events |
| **Timing** | When admin acts | When students register |

Both demonstrate different trigger use cases with full GUI visibility! 🎓
