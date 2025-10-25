-- ============================================================================
-- Simple Stored Procedure: Get Event Summary
-- Shows event details with registration count and venue info
-- READ-ONLY - Safe to use, won't modify any data
-- ============================================================================

USE college_event_management;

-- Drop if exists
DROP PROCEDURE IF EXISTS get_event_summary;

DELIMITER //

CREATE PROCEDURE get_event_summary(IN p_event_id INT)
BEGIN
    -- Get complete event summary with all related info
    SELECT 
        e.id AS event_id,
        e.name AS event_name,
        e.description,
        e.event_date,
        e.start_time,
        e.end_time,
        e.event_type,
        e.status,
        e.max_participants,
        c.name AS club_name,
        v.name AS venue_name,
        v.type AS venue_type,
        v.capacity AS venue_capacity,
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
END //

DELIMITER ;

-- Test the procedure
SELECT '✅ Procedure created successfully!' AS Status;
SELECT 'Test with: CALL get_event_summary(1);' AS TestCommand;
