-- Aggregate Query Demonstration: Club Event Statistics
-- This query demonstrates multiple aggregate functions with GROUP BY

-- Query uses the following aggregate functions:
-- 1. COUNT() - Count total events and registrations
-- 2. AVG() - Average registrations per event
-- 3. MAX() - Maximum registrations for an event
-- 4. MIN() - Minimum registrations for an event
-- 5. SUM() - Total registrations across all events

USE college_event_management;

SELECT 
    -- Club Information
    c.id AS club_id,
    c.name AS club_name,
    c.description AS club_description,
    
    -- Aggregate Functions
    COUNT(DISTINCT e.id) AS total_events,
    COUNT(DISTINCT CASE WHEN e.status = 'Approved' THEN e.id END) AS approved_events,
    COUNT(DISTINCT CASE WHEN e.status = 'Completed' THEN e.id END) AS completed_events,
    COUNT(DISTINCT CASE WHEN e.status = 'Pending_Approval' THEN e.id END) AS pending_events,
    
    -- Registration Statistics
    COUNT(DISTINCT er.id) AS total_registrations,
    COALESCE(AVG(reg_count.registration_count), 0) AS avg_registrations_per_event,
    COALESCE(MAX(reg_count.registration_count), 0) AS max_registrations_event,
    COALESCE(MIN(CASE WHEN reg_count.registration_count > 0 THEN reg_count.registration_count END), 0) AS min_registrations_event,
    
    -- Member and Participation
    COUNT(DISTINCT cm.student_id) AS total_members,
    COUNT(DISTINCT CASE WHEN er.attended = TRUE THEN er.id END) AS total_attendees,
    
    -- Calculated Metrics
    CASE 
        WHEN COUNT(DISTINCT e.id) > 0 
        THEN ROUND((COUNT(DISTINCT CASE WHEN e.status = 'Completed' THEN e.id END) * 100.0 / COUNT(DISTINCT e.id)), 2)
        ELSE 0 
    END AS completion_rate_percentage,
    
    CASE 
        WHEN COUNT(DISTINCT er.id) > 0 
        THEN ROUND((COUNT(DISTINCT CASE WHEN er.attended = TRUE THEN er.id END) * 100.0 / COUNT(DISTINCT er.id)), 2)
        ELSE 0 
    END AS attendance_rate_percentage

FROM clubs c

-- LEFT JOIN to include clubs even with no events
LEFT JOIN events e ON c.id = e.organized_by_club_id

-- LEFT JOIN for event registrations
LEFT JOIN event_registrations er ON e.id = er.event_id 
    AND er.registration_status = 'Registered'

-- LEFT JOIN for club members
LEFT JOIN club_memberships cm ON c.id = cm.club_id 
    AND cm.is_active = TRUE

-- Subquery to calculate registrations per event
LEFT JOIN (
    SELECT 
        event_id,
        COUNT(*) AS registration_count
    FROM event_registrations
    WHERE registration_status = 'Registered'
    GROUP BY event_id
) AS reg_count ON e.id = reg_count.event_id

WHERE c.is_active = TRUE

GROUP BY c.id, c.name, c.description

HAVING COUNT(DISTINCT e.id) > 0  -- Only show clubs with events

ORDER BY total_events DESC, total_registrations DESC;
