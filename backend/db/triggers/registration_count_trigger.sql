-- ============================================================================
-- Event Registration Count Auto-Update Trigger
-- ============================================================================
-- Purpose: Automatically maintain accurate registration counts for events
-- Benefit: Real-time capacity tracking without manual counting
-- Demo: Register/cancel for events and watch counts update automatically
-- ============================================================================

USE college_event_management;

-- First, add registration_count column to events table if it doesn't exist
-- Check and add current_registrations column
SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'college_event_management' 
    AND TABLE_NAME = 'events' 
    AND COLUMN_NAME = 'current_registrations'
);

SET @sql_add_current = IF(@column_exists = 0, 
    'ALTER TABLE events ADD COLUMN current_registrations INT DEFAULT 0', 
    'SELECT "Column current_registrations already exists"'
);

PREPARE stmt FROM @sql_add_current;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add last_registration_update column
SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'college_event_management' 
    AND TABLE_NAME = 'events' 
    AND COLUMN_NAME = 'last_registration_update'
);

SET @sql_add_last_update = IF(@column_exists = 0, 
    'ALTER TABLE events ADD COLUMN last_registration_update TIMESTAMP NULL', 
    'SELECT "Column last_registration_update already exists"'
);

PREPARE stmt FROM @sql_add_last_update;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create a table to log registration activities (for demo purposes)
CREATE TABLE IF NOT EXISTS registration_activity_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    student_id INT NOT NULL,
    action_type ENUM('REGISTERED', 'CANCELLED', 'WAITLISTED') NOT NULL,
    old_count INT,
    new_count INT,
    capacity INT,
    activity_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    trigger_name VARCHAR(100),
    
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    
    INDEX idx_activity_event (event_id),
    INDEX idx_activity_timestamp (activity_timestamp)
);

-- Trigger 1: After INSERT on event_registrations (New Registration)
DELIMITER $$

DROP TRIGGER IF EXISTS after_registration_insert$$

CREATE TRIGGER after_registration_insert
AFTER INSERT ON event_registrations
FOR EACH ROW
BEGIN
    DECLARE old_count INT;
    DECLARE event_capacity INT;
    
    -- Get current count and capacity
    SELECT current_registrations, max_participants 
    INTO old_count, event_capacity
    FROM events 
    WHERE id = NEW.event_id;
    
    -- Update the event's registration count
    UPDATE events 
    SET current_registrations = current_registrations + 1,
        last_registration_update = CURRENT_TIMESTAMP
    WHERE id = NEW.event_id;
    
    -- Log the activity
    INSERT INTO registration_activity_log (
        event_id,
        student_id,
        action_type,
        old_count,
        new_count,
        capacity,
        trigger_name
    ) VALUES (
        NEW.event_id,
        NEW.student_id,
        NEW.registration_status,
        old_count,
        old_count + 1,
        event_capacity,
        'after_registration_insert'
    );
END$$

-- Trigger 2: After UPDATE on event_registrations (Status Change)
DROP TRIGGER IF EXISTS after_registration_update$$

CREATE TRIGGER after_registration_update
AFTER UPDATE ON event_registrations
FOR EACH ROW
BEGIN
    DECLARE old_count INT;
    DECLARE event_capacity INT;
    DECLARE count_change INT DEFAULT 0;
    
    -- Get current count and capacity
    SELECT current_registrations, max_participants 
    INTO old_count, event_capacity
    FROM events 
    WHERE id = NEW.event_id;
    
    -- Determine count change based on status change
    IF OLD.registration_status = 'Registered' AND NEW.registration_status = 'Cancelled' THEN
        SET count_change = -1;
    ELSEIF OLD.registration_status = 'Cancelled' AND NEW.registration_status = 'Registered' THEN
        SET count_change = 1;
    ELSEIF OLD.registration_status = 'Waitlisted' AND NEW.registration_status = 'Registered' THEN
        SET count_change = 1;
    ELSEIF OLD.registration_status = 'Registered' AND NEW.registration_status = 'Waitlisted' THEN
        SET count_change = -1;
    END IF;
    
    -- Update count if there was a change
    IF count_change != 0 THEN
        UPDATE events 
        SET current_registrations = GREATEST(0, current_registrations + count_change),
            last_registration_update = CURRENT_TIMESTAMP
        WHERE id = NEW.event_id;
        
        -- Log the activity
        INSERT INTO registration_activity_log (
            event_id,
            student_id,
            action_type,
            old_count,
            new_count,
            capacity,
            trigger_name
        ) VALUES (
            NEW.event_id,
            NEW.student_id,
            NEW.registration_status,
            old_count,
            old_count + count_change,
            event_capacity,
            'after_registration_update'
        );
    END IF;
END$$

-- Trigger 3: After DELETE on event_registrations (Registration Deleted)
DROP TRIGGER IF EXISTS after_registration_delete$$

CREATE TRIGGER after_registration_delete
AFTER DELETE ON event_registrations
FOR EACH ROW
BEGIN
    DECLARE old_count INT;
    DECLARE event_capacity INT;
    
    -- Only decrease count if the deleted registration was active
    IF OLD.registration_status = 'Registered' THEN
        -- Get current count and capacity
        SELECT current_registrations, max_participants 
        INTO old_count, event_capacity
        FROM events 
        WHERE id = OLD.event_id;
        
        -- Update the event's registration count
        UPDATE events 
        SET current_registrations = GREATEST(0, current_registrations - 1),
            last_registration_update = CURRENT_TIMESTAMP
        WHERE id = OLD.event_id;
        
        -- Log the activity
        INSERT INTO registration_activity_log (
            event_id,
            student_id,
            action_type,
            old_count,
            new_count,
            capacity,
            trigger_name
        ) VALUES (
            OLD.event_id,
            OLD.student_id,
            'CANCELLED',
            old_count,
            old_count - 1,
            event_capacity,
            'after_registration_delete'
        );
    END IF;
END$$

DELIMITER ;

-- Initialize current counts for existing events
-- Disable safe update mode temporarily
SET SQL_SAFE_UPDATES = 0;

UPDATE events e
SET current_registrations = (
    SELECT COUNT(*) 
    FROM event_registrations er 
    WHERE er.event_id = e.id 
    AND er.registration_status = 'Registered'
)
WHERE e.id > 0;

-- Re-enable safe update mode
SET SQL_SAFE_UPDATES = 1;

-- Verify triggers were created
SELECT 'Registration triggers created successfully! Event registration counts will now be automatically maintained.' as Status;

-- Show the triggers
SELECT 
    TRIGGER_NAME,
    EVENT_MANIPULATION,
    EVENT_OBJECT_TABLE,
    ACTION_TIMING
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = 'college_event_management'
AND TRIGGER_NAME IN ('after_registration_insert', 'after_registration_update', 'after_registration_delete')
ORDER BY TRIGGER_NAME;
