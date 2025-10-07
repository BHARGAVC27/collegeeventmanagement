# 🏫 Campus Event Management System – Functional Requirements

## 1. User Management

### User Registration & Login
- Students can register using their university email ID
- Secure authentication with password hashing
- Prevent duplicate email or student ID registration

### Profile Management
- Users can view and update personal details (name, email, phone, branch, year of study)
- Changes are validated (e.g., phone number format, email domain)

### Password Management
- Allow password reset and recovery via registered email
- Enforce strong password policy (min length, mixed characters)

### Role-Based Access Control
- **Roles**: Student, Club Head, Faculty/Coordinator, Admin
- Each role has specific permissions for events, bookings, and approvals

## 2. Campus & Venue Management

### Campus Management
- Maintain a list of campuses with unique names and locations
- Admins can create, update, or deactivate a campus

### Venue Management
- Create, update, and soft-delete venues
- Store venue details: name, type (auditorium, lab, classroom, etc.), capacity, equipment, campus association
- Enforce unique venue names within the same campus

### Venue Availability & Booking
- Check availability to prevent double bookings
- Book venues for events, maintenance, or reservations
- Booking has attributes: date, start time, end time, status (Pending, Confirmed, Cancelled)
- Triggers prevent overlapping time slots for the same venue

### Booking Status Management
- Allow admins to confirm or cancel bookings
- Club heads can view status updates

## 3. Club Management

### Club Creation & Management
- Clubs are linked to a specific campus
- Each club has a unique name within the campus
- Includes description, creation date, and assigned faculty coordinator

### Club Membership
- Students can request to join clubs
- Club heads can approve/reject membership requests
- Maintain member roles: Head or Member
- Enforce only one active club head per club
- Students can be members of multiple clubs but head only one

### Club Role Management
- Admins can reassign club heads if required
- Prevent duplication or conflicts through triggers

## 4. Event Management

### Event Creation & Details
- Club heads can create events linked to their club and optionally to a venue
- Event attributes: name, description, type, date, time, max participants, registration deadline, status

### Event Status Management
- Event lifecycle statuses: Draft, Pending Approval, Approved, Cancelled, Completed

- Admins or faculty can approve/reject events after reviewing details

### Event Registration
- Students can register for approved events until the registration deadline
- Manage registration statuses: Registered, Waitlisted, Cancelled
- Respect participant limit (automatic waitlist if full)
- Students can cancel registration before event day

### Venue and Date Validation
- Ensure event venue is available during chosen slot
- Registration deadline must be before event start date

### Attendance Tracking
- Club heads or event organizers can mark attendance
- Attendance data stored for reports and record keeping

### Event Cancellation
- Club heads or admins can cancel events with reason logging
- Notifications sent to all registered participants

## 5. Notification & Communication Management

### System Notifications
Notify users via in-app or email messages for:
- Event approval/rejection
- Registration confirmation or cancellation
- Venue booking confirmation or rejection
- Event reminders (1 day before event)

### Notification Log
- Maintain notification history for each user

## 6. Event Approval Workflow

### Approval Chain
- Event proposals by club heads go to the assigned faculty coordinator
- Faculty reviews and approves/rejects
- Optionally, final admin approval if required

### Approval History
- Log of approvals with timestamps and remarks
- Status transitions stored for auditing and transparency

## 7. Media & Document Management

### Event Media Uploads
- Allow upload of event-related posters, banners, and images
- Club heads can upload event-related documents (e.g., proposals, permissions)

### File Management
- Media files linked to event IDs
- Admins can view and manage uploaded content

## 8. Audit & Activity Logging

### System Logs
Log key actions such as:
- User logins and profile updates
- Event creation, updates, cancellations
- Venue bookings and approvals
- Include timestamps, actor, and action details

### Admin Activity View
- Admins can view logs for monitoring and resolving disputes

## 9. Search & Filtering Features

### Global Search
- Search for events by keyword, campus, club, or venue

### Filter Options
- Filter by date range, event type, campus, or club

### Venue Filtering
- View available venues filtered by type, capacity, or campus

## 10. Reporting & Views

### Event Reporting
- Generate reports of events by campus, club, or time period
- Summary of participants and attendance per event

### Club Head Views
- Club heads can view all their club events, bookings, and member details

### Venue Availability View
- Interactive view showing free/busy slots for all venues

### Admin Dashboard
- Overview of upcoming events, pending approvals, and venue usage

## 11. Business Rules & Constraints

- Year of study must be between 1 and 4
- Venue capacity ≥ total registered participants
- Registration deadlines must precede event dates
- Only one active head per club
- No overlapping venue bookings allowed
- A student cannot register for two events at the same date/time
- Soft-deleted entities (venues/clubs) should not appear in active listings