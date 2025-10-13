USE college_event_management;

-- Update Club Head 1 password (clubhead1)
UPDATE students 
SET password_hash = '$2b$10$OW6q.xLX3t74oMsRbWfNhe1cf9W2EP1NHyJUVN00ZTn.5XWPwkyDS' 
WHERE student_id = 'CS2021003';

-- Update Club Head 2 password (clubhead2)
UPDATE students 
SET password_hash = '$2b$10$LPo.9oxucHPPskjlscu7L.REQdXS0NgyNYX6K7lOqhNgf3U/ONIWa' 
WHERE student_id = 'EE2021001';

-- Show updated records
SELECT student_id, name, email, LEFT(password_hash, 10) as hash_check, user_role_id 
FROM students 
WHERE user_role_id = 2;