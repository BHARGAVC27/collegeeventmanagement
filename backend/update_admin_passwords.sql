USE college_event_management;

-- Update Admin password (admin123)
UPDATE faculty_admin 
SET password_hash = '$2b$10$RWWqV3JIVf/yV/xZXcGCAeXvUMvwifJz95IvxSAmfjITzi8ZhoEK6' 
WHERE employee_id = 'ADMIN001';

-- Update Faculty password (faculty123)
UPDATE faculty_admin 
SET password_hash = '$2b$10$A6SB7Ardn4Td7C4ecCnYo.cIy1AnMRxBp/qN9tMNqAPlDF9DrafrW' 
WHERE employee_id = 'FAC001';

-- Show updated records
SELECT employee_id, name, email, LEFT(password_hash, 10) as hash_check, user_role_id 
FROM faculty_admin 
WHERE employee_id IN ('ADMIN001', 'FAC001');