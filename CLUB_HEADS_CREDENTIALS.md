# Club Head Test Credentials

This document contains the credentials for all club head accounts in the system for testing purposes.

## Test Accounts

All club head accounts use the password: **Test@123**

### 1. Existing Club Head
- **Email:** head1@university.edu
- **Password:** clubhead1
- **Club:** Computer Science Club
- **Student ID:** STU202401

### 2. Sarah Johnson - Robotics Club
- **Email:** sarah.robotics@university.edu
- **Password:** Test@123
- **Club:** Robotics Club
- **Student ID:** STU202502

### 3. Priya Sharma - Maaya
- **Email:** priya.maaya@university.edu
- **Password:** Test@123
- **Club:** Maaya
- **Student ID:** STU202503

### 4. Rahul Patel - Terpiscope
- **Email:** rahul.terp@university.edu
- **Password:** Test@123
- **Club:** Terpiscope
- **Student ID:** STU202504

## Testing Event Creation

To test the automatic club selection feature:
1. Log in with any of the club head credentials above
2. Navigate to "Create Event"
3. The organizing club should be automatically selected and disabled
4. Fill in the event details and create the event

## Database Verification

To verify these accounts exist in the database:

```sql
USE college_event_management;

SELECT 
    s.id,
    s.student_id,
    s.name,
    s.email,
    ur.role_name,
    c.name as club_name,
    cm.role as club_role
FROM students s
LEFT JOIN user_roles ur ON s.user_role_id = ur.id
LEFT JOIN club_memberships cm ON s.id = cm.student_id AND cm.is_active = TRUE
LEFT JOIN clubs c ON cm.club_id = c.id
WHERE s.email IN (
    'head1@university.edu',
    'sarah.robotics@university.edu',
    'priya.maaya@university.edu',
    'rahul.terp@university.edu'
)
ORDER BY s.id;
```

## Notes

- All accounts are stored in the `students` table with `user_role_id` set to the club_head role
- Club memberships are stored in the `club_memberships` table with `role='Head'`
- Password hashes are generated using bcryptjs with 10 salt rounds
