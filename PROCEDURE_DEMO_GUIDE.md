# 🔬 Stored Procedure Demo Guide

## What Was Implemented

A simple stored procedure `get_event_summary(p_event_id INT)` with a GUI interface in the Admin Dashboard.

### Features:
- ✅ **READ-ONLY Procedure** - Safe, doesn't modify any data
- ✅ **Comprehensive Event Info** - Gets all details about an event
- ✅ **Registration Statistics** - Shows current registrations, capacity, fill percentage
- ✅ **Related Data** - Includes club and venue information
- ✅ **GUI Interface** - Orange-themed tab in Admin Dashboard

---

## Files Created/Modified

### Backend:
1. **`backend/db/procedures/event_summary_procedure.sql`** - Stored procedure definition
2. **`backend/db/procedures/apply_procedure.sql`** - Simplified version for MySQL
3. **`backend/routes/admin.js`** - Added GET endpoint `/admin/procedure/event-summary/:eventId`

### Frontend:
1. **`frontend/src/services/apiService.js`** - Added `getEventSummary(eventId)` method
2. **`frontend/src/pages/admin/AdminDashboard.jsx`** - Added complete GUI with:
   - State management (procedureEventId, procedureResult, procedureLoading)
   - Handler function (handleExecuteProcedure)
   - Orange gradient tab button
   - Input form and results display
3. **`frontend/src/pages/admin/AdminDashboard.css`** - Added styling for procedure section

---

## How to Demo for Your Project

### Step 1: Verify Procedure Exists in Database

Open MySQL and check:
```sql
USE college_event_management;
SHOW PROCEDURE STATUS WHERE Db = 'college_event_management';
```

You should see `get_event_summary` listed.

### Step 2: Test Procedure Directly in MySQL

```sql
-- Get a valid event ID first
SELECT id, name FROM events LIMIT 5;

-- Test the procedure (replace 1 with actual event ID)
CALL get_event_summary(1);
```

### Step 3: Demo the GUI

1. **Login as Admin**:
   - Navigate to `http://localhost:5173` (or your frontend URL)
   - Login with admin credentials
   - Go to Admin Dashboard

2. **Find the Procedure Tab**:
   - Look for the **"🔬 Event Summary"** tab (orange gradient)
   - Click on it

3. **Execute the Procedure**:
   - Enter an Event ID (use a valid ID from your database)
   - Click **"▶️ Execute Procedure"** button
   - Watch the results appear in beautiful cards!

### Step 4: Explain to Evaluators

**What to Say:**
> "This stored procedure demonstrates SQL-based data retrieval. The `get_event_summary` procedure performs multiple JOIN operations to gather comprehensive event information including:
> - Event details from the `events` table
> - Club information via `organized_by_club_id`
> - Venue details through `venue_bookings` and `venues` tables
> - Registration count by aggregating `event_registrations`
> - Calculated fields like seats available and fill percentage
>
> The procedure is integrated with a React frontend through a REST API, showing full-stack implementation of database stored procedures."

---

## Procedure SQL Logic

```sql
CREATE PROCEDURE get_event_summary(IN p_event_id INT)
BEGIN
    SELECT 
        e.id,
        e.name,
        e.description,
        e.event_date,
        e.start_time,
        e.end_time,
        c.name AS club_name,           -- JOIN with clubs
        v.name AS venue_name,           -- JOIN with venues
        v.capacity,
        COUNT(DISTINCT er.id) AS total_registrations,
        (e.max_participants - COUNT(DISTINCT er.id)) AS seats_available,
        ROUND((COUNT(DISTINCT er.id) / e.max_participants) * 100, 1) AS fill_percentage
    FROM events e
    LEFT JOIN clubs c ON e.organized_by_club_id = c.id
    LEFT JOIN venue_bookings vb ON e.booking_id = vb.id
    LEFT JOIN venues v ON vb.venue_id = v.id
    LEFT JOIN event_registrations er ON e.id = er.event_id 
        AND er.registration_status = 'Registered'
    WHERE e.id = p_event_id
    GROUP BY e.id, c.id, v.id;
END
```

---

## What Makes This Implementation Good

### 1. **Schema Compatible**
- Uses correct column names (`organized_by_club_id` instead of `club_id`)
- Verified against actual database schema

### 2. **Non-Disruptive**
- READ-ONLY procedure (no INSERT/UPDATE/DELETE)
- Won't affect existing triggers or data integrity
- Safe to demo multiple times

### 3. **Practical Use Case**
- Real-world admin function
- Shows event capacity management
- Useful for decision making

### 4. **Full-Stack Integration**
- Backend endpoint with authentication
- API service with Bearer token
- Complete React UI with state management
- Styled with CSS for professional look

### 5. **Demo-Ready**
- Easy to explain
- Visually appealing results
- Clear information architecture
- Orange theme distinguishes it from other features

---

## Troubleshooting

### "Event not found" Error
- Make sure you're entering a valid event ID
- Check available IDs: `SELECT id, name FROM events;`

### No Results Appearing
- Check browser console for errors (F12)
- Verify backend is running on port 5000
- Ensure you're logged in as admin

### Procedure Not Found
- Re-run the SQL file:
  ```powershell
  Get-Content backend/db/procedures/apply_procedure.sql | mysql -u root -p
  ```

---

## Marking Criteria Met

✅ **Stored Procedure Implementation** - Complex procedure with multiple JOINs and calculations  
✅ **GUI Integration** - Complete frontend interface with form and results display  
✅ **Database Operations** - Demonstrates SQL proficiency with aggregation and joins  
✅ **Full-Stack Skills** - Backend API + Frontend React + Database integration  

**Expected Marks: 2/2 for Procedures with GUI** 🎉

---

## Quick Reference

**Procedure Name:** `get_event_summary`  
**Parameter:** `p_event_id INT`  
**Returns:** Event details, club info, venue info, registration statistics  
**GUI Location:** Admin Dashboard → 🔬 Event Summary Tab  
**API Endpoint:** `GET /admin/procedure/event-summary/:eventId`  
**Authentication:** Admin only (JWT Bearer token)  

---

Good luck with your demo! 🚀
