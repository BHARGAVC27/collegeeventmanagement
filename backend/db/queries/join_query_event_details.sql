-- JOIN Query Demonstration: Complete Event Details
-- This query demonstrates multiple JOINs (INNER and LEFT) across 5 tables

-- Query joins the following tables:
-- 1. events (main table)
-- 2. clubs (INNER JOIN - every event must have a club)
-- 3. venue_bookings (LEFT JOIN - some events may not have venue)
-- 4. venues (LEFT JOIN - linked through venue_bookings)
-- 5. campus (LEFT JOIN - venue location)
-- 6. event_registrations (LEFT JOIN - for counting registrations)

USE college_event_management;

SELECT 
    -- Event Information
    e.id AS event_id,
    e.name AS event_name,
    e.description,
    e.event_date,
    e.start_time,
    e.end_time,
    e.event_type,
    e.status,
    e.max_participants,
    e.registration_required,
    e.registration_deadline,
    
    -- Club Information (INNER JOIN)
    c.id AS club_id,
    c.name AS club_name,
    c.description AS club_description,
    
    -- Venue Information (LEFT JOIN - may be NULL)
    v.id AS venue_id,
    v.name AS venue_name,
    v.type AS venue_type,
    v.capacity AS venue_capacity,
    v.equipment AS venue_equipment,
    
    -- Campus Information (LEFT JOIN through venue)
    campus.id AS campus_id,
    campus.name AS campus_name,
    campus.location AS campus_location,
    
    -- Registration Statistics (LEFT JOIN with aggregation)
    COUNT(DISTINCT er.id) AS total_registrations,
    COUNT(DISTINCT CASE WHEN er.attended = TRUE THEN er.id END) AS attended_count,
    
    -- Booking Information
    vb.start_time AS booking_start,
    vb.end_time AS booking_end,
    vb.status AS booking_status

FROM events e

-- INNER JOIN: Every event MUST have an organizing club
INNER JOIN clubs c ON e.organized_by_club_id = c.id

-- LEFT JOIN: Not all events have venue bookings
LEFT JOIN venue_bookings vb ON e.booking_id = vb.id

-- LEFT JOIN: Venues linked through bookings (may be NULL if no booking)
LEFT JOIN venues v ON vb.venue_id = v.id

-- LEFT JOIN: Campus linked through venue (may be NULL)
LEFT JOIN campus ON v.campus_id = campus.id

-- LEFT JOIN: Registration data (for counting participants)
LEFT JOIN event_registrations er ON e.id = er.event_id 
    AND er.registration_status = 'Registered'

WHERE e.status = 'Approved' 
    AND e.event_date >= CURDATE()

GROUP BY 
    e.id, e.name, e.description, e.event_date, e.start_time, e.end_time,
    e.event_type, e.status, e.max_participants, e.registration_required,
    e.registration_deadline, c.id, c.name, c.description, v.id, v.name,
    v.type, v.capacity, v.equipment, campus.id, campus.name, campus.location,
    vb.id, vb.start_time, vb.end_time, vb.status

ORDER BY 
    e.event_date ASC, 
    e.start_time ASC;
