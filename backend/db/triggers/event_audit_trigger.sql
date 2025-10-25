-- ============================================================================
-- Event Status Change Audit Trigger
-- ============================================================================
-- Purpose: Automatically log when events are approved/rejected by admins
-- Benefit: Maintains audit trail without application code changes
-- Demo: Approve/reject an event, then show the audit log was auto-created
-- ============================================================================

USE college_event_management;

-- Create the trigger
DELIMITER $$

DROP TRIGGER IF EXISTS after_event_status_update$$

CREATE TRIGGER after_event_status_update
AFTER UPDATE ON events
FOR EACH ROW
BEGIN
    -- Only log if status changed
    IF OLD.status != NEW.status THEN
        INSERT INTO admin_audit_log (
            admin_id,
            action_type,
            target_type,
            target_id,
            description
        ) VALUES (
            COALESCE(NEW.approved_by_admin_id, 1),  -- Admin who made the change
            CASE 
                WHEN NEW.status = 'Approved' THEN 'APPROVE_EVENT'
                WHEN NEW.status = 'Rejected' THEN 'REJECT_EVENT'
                ELSE 'OTHER'
            END,
            'EVENT',
            NEW.id,
            CONCAT('Event "', NEW.name, '" status changed from "', OLD.status, '" to "', NEW.status, '" by trigger')
        );
    END IF;
END$$

DELIMITER ;

-- Verify trigger was created
SELECT 'Trigger created successfully! Event status changes will now be automatically logged.' as Status;

-- Show existing triggers
SELECT 
    TRIGGER_NAME,
    EVENT_MANIPULATION,
    EVENT_OBJECT_TABLE,
    ACTION_TIMING
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = 'college_event_management'
AND TRIGGER_NAME = 'after_event_status_update';
