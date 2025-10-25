-- Nested Query: Find Highly Active Students
-- Students who have registered for more events than the average student

USE college_event_management;

-- This query demonstrates nested subquery usage
-- Outer query: Get students with their event counts
-- Inner subquery: Calculate the average number of events per student

SELECT 
    s.id,
    s.student_id AS roll_number,
    s.name,
    s.email,
    s.branch,
    s.year_of_study,
    COUNT(DISTINCT er.event_id) AS total_events_registered,
    ROUND(
        (SELECT AVG(event_count) 
         FROM (
             SELECT COUNT(DISTINCT er2.event_id) AS event_count
             FROM students s2
             LEFT JOIN event_registrations er2 ON s2.id = er2.student_id 
                 AND er2.registration_status IN ('Registered', 'Waitlisted')
             GROUP BY s2.id
         ) AS student_event_counts
        ), 1
    ) AS average_events_per_student,
    COUNT(DISTINCT CASE 
        WHEN er.attended = TRUE THEN er.event_id 
    END) AS events_attended,
    COUNT(DISTINCT cm.club_id) AS clubs_joined,
    CASE 
        WHEN COUNT(DISTINCT er.event_id) >= 2 * (
            SELECT AVG(event_count) 
            FROM (
                SELECT COUNT(DISTINCT er3.event_id) AS event_count
                FROM students s3
                LEFT JOIN event_registrations er3 ON s3.id = er3.student_id 
                    AND er3.registration_status IN ('Registered', 'Waitlisted')
                GROUP BY s3.id
            ) AS counts
        ) THEN 'Highly Active'
        WHEN COUNT(DISTINCT er.event_id) > (
            SELECT AVG(event_count) 
            FROM (
                SELECT COUNT(DISTINCT er4.event_id) AS event_count
                FROM students s4
                LEFT JOIN event_registrations er4 ON s4.id = er4.student_id 
                    AND er4.registration_status IN ('Registered', 'Waitlisted')
                GROUP BY s4.id
            ) AS avg_counts
        ) THEN 'Active'
        ELSE 'Average'
    END AS engagement_level
FROM students s
LEFT JOIN event_registrations er ON s.id = er.student_id 
    AND er.registration_status IN ('Registered', 'Waitlisted')
LEFT JOIN club_memberships cm ON s.id = cm.student_id 
    AND cm.is_active = TRUE
GROUP BY s.id, s.student_id, s.name, s.email, s.branch, s.year_of_study
HAVING COUNT(DISTINCT er.event_id) > (
    SELECT AVG(event_count) 
    FROM (
        SELECT COUNT(DISTINCT er5.event_id) AS event_count
        FROM students s5
        LEFT JOIN event_registrations er5 ON s5.id = er5.student_id 
            AND er5.registration_status IN ('Registered', 'Waitlisted')
        GROUP BY s5.id
    ) AS final_avg
)
ORDER BY total_events_registered DESC, events_attended DESC;
