SET SQL_SAFE_UPDATES = 0;

DROP DATABASE college_event_management;

CREATE DATABASE IF NOT EXISTS college_event_management;
USE college_event_management;


-- User types/roles table
CREATE TABLE user_roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced students table with role support
CREATE TABLE students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    branch VARCHAR(50),
    year_of_study INT CHECK (year_of_study BETWEEN 1 AND 5),
    user_role_id INT DEFAULT 1, -- Default to 'student' role
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_role_id) REFERENCES user_roles(id) ON DELETE RESTRICT,
    INDEX idx_student_email (email),
    INDEX idx_student_branch (branch),
    INDEX idx_student_role (user_role_id)
);

-- Faculty/Admin table for administrative users
CREATE TABLE faculty_admin (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    department VARCHAR(100),
    designation VARCHAR(100),
    user_role_id INT NOT NULL, -- Can be 'admin' or 'faculty'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_role_id) REFERENCES user_roles(id) ON DELETE RESTRICT,
    INDEX idx_faculty_email (email),
    INDEX idx_faculty_department (department),
    INDEX idx_faculty_role (user_role_id)
);

CREATE TABLE campus (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_campus_name (name)
);

CREATE TABLE venues (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    type ENUM('Hall', 'Ground', 'Classroom', 'Auditorium', 'Laboratory', 'Other') NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    equipment TEXT,
    campus_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (campus_id) REFERENCES campus(id) ON DELETE RESTRICT,
    UNIQUE KEY unique_venue_per_campus (name, campus_id),
    INDEX idx_venue_campus (campus_id),
    INDEX idx_venue_type (type)
);

CREATE TABLE clubs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    faculty_coordinator_id INT, -- Reference to faculty_admin table
    campus_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by_admin_id INT, -- Track which admin created the club
    approved_by_admin_id INT, -- Track approval
    approval_status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (campus_id) REFERENCES campus(id) ON DELETE RESTRICT,
    FOREIGN KEY (faculty_coordinator_id) REFERENCES faculty_admin(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_admin_id) REFERENCES faculty_admin(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by_admin_id) REFERENCES faculty_admin(id) ON DELETE SET NULL,
    
    UNIQUE KEY unique_club_per_campus (name, campus_id),
    INDEX idx_club_campus (campus_id),
    INDEX idx_club_active (is_active),
    INDEX idx_club_approval (approval_status)
);

CREATE TABLE club_memberships (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    club_id INT NOT NULL,
    role ENUM('Head', 'Member') DEFAULT 'Member',
    join_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    is_active BOOLEAN DEFAULT TRUE,
    approved_by_admin_id INT, -- Track admin approval for club head positions
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by_admin_id) REFERENCES faculty_admin(id) ON DELETE SET NULL,
    
    UNIQUE KEY unique_active_membership (student_id, club_id, is_active),
    INDEX idx_membership_student (student_id),
    INDEX idx_membership_club (club_id),
    INDEX idx_membership_role (role)
);

CREATE TABLE venue_bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    venue_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    booking_type ENUM('Event', 'Maintenance', 'Reserved') DEFAULT 'Event',
    status ENUM('Pending', 'Confirmed', 'Cancelled') DEFAULT 'Pending',
    booked_by_club_id INT,
    approved_by_admin_id INT, -- Admin approval for venue bookings
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE RESTRICT,
    FOREIGN KEY (booked_by_club_id) REFERENCES clubs(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by_admin_id) REFERENCES faculty_admin(id) ON DELETE SET NULL,
    
    CHECK (end_time > start_time),
    INDEX idx_booking_venue_time (venue_id, start_time, end_time),
    INDEX idx_booking_status (status),
    INDEX idx_booking_club (booked_by_club_id)
);

CREATE TABLE events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    event_type ENUM('Workshop', 'Seminar', 'Competition', 'Cultural', 'Sports', 'Meeting', 'Other') DEFAULT 'Other',
    status ENUM('Draft', 'Pending_Approval', 'Approved', 'Rejected', 'Cancelled', 'Completed') DEFAULT 'Draft',
    max_participants INT,
    registration_required BOOLEAN DEFAULT TRUE,
    registration_deadline DATETIME,
    organized_by_club_id INT NOT NULL,
    booking_id INT,
    created_by_student_id INT, -- Track which club head created the event
    approved_by_admin_id INT, -- Track admin approval
    rejection_reason TEXT, -- Store reason if rejected
    current_registrations INT DEFAULT 0,
    last_registration_update TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (organized_by_club_id) REFERENCES clubs(id) ON DELETE RESTRICT,
    FOREIGN KEY (booking_id) REFERENCES venue_bookings(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_student_id) REFERENCES students(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by_admin_id) REFERENCES faculty_admin(id) ON DELETE SET NULL,
    
    CHECK (end_time > start_time),
    INDEX idx_event_date (event_date),
    INDEX idx_event_club (organized_by_club_id),
    INDEX idx_event_status (status),
    INDEX idx_event_type (event_type)
);

CREATE TABLE event_registrations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    event_id INT NOT NULL,
    registration_status ENUM('Registered', 'Waitlisted', 'Cancelled') DEFAULT 'Registered',
    attended BOOLEAN DEFAULT FALSE,
    attendance_marked_at TIMESTAMP NULL,
    registration_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_student_event (student_id, event_id),
    INDEX idx_registration_student (student_id),
    INDEX idx_registration_event (event_id),
    INDEX idx_registration_status (registration_status)
);

CREATE TABLE event_feedback (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    student_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_student_feedback (student_id, event_id),
    INDEX idx_feedback_event (event_id),
    INDEX idx_feedback_rating (rating)
);

CREATE TABLE registration_activity_log (
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

-- Audit log table for tracking admin actions
CREATE TABLE admin_audit_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    action_type ENUM('CREATE_CLUB', 'DELETE_CLUB', 'APPROVE_EVENT', 'REJECT_EVENT', 'APPROVE_VENUE', 'CREATE_ADMIN', 'OTHER') NOT NULL,
    target_type ENUM('CLUB', 'EVENT', 'VENUE', 'USER', 'OTHER') NOT NULL,
    target_id INT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (admin_id) REFERENCES faculty_admin(id) ON DELETE CASCADE,
    INDEX idx_audit_admin (admin_id),
    INDEX idx_audit_type (action_type),
    INDEX idx_audit_date (created_at)
);

-- Insert default user roles
INSERT INTO user_roles (role_name, description) VALUES
('student', 'Regular student - can register for events'),
('club_head', 'Club head - can create and manage events for their club'),
('faculty', 'Faculty member - can coordinate clubs'),
('admin', 'System administrator - full access to manage clubs, events, and users');

-- Views for different user roles

-- View for student dashboard
CREATE VIEW student_dashboard AS
SELECT 
    s.id AS student_id,
    s.name AS student_name,
    s.email,
    ur.role_name,
    COUNT(DISTINCT cm.club_id) AS clubs_joined,
    COUNT(DISTINCT er.event_id) AS events_registered
FROM students s
JOIN user_roles ur ON s.user_role_id = ur.id
LEFT JOIN club_memberships cm ON s.id = cm.student_id AND cm.is_active = TRUE
LEFT JOIN event_registrations er ON s.id = er.student_id AND er.registration_status = 'Registered'
WHERE s.is_active = TRUE
GROUP BY s.id, s.name, s.email, ur.role_name;

-- View for club head dashboard
CREATE VIEW club_head_dashboard AS
SELECT 
    s.id AS student_id,
    s.name AS head_name,
    s.email,
    c.id AS club_id,
    c.name AS club_name,
    COUNT(DISTINCT e.id) AS events_created,
    COUNT(DISTINCT cm.student_id) AS club_members
FROM students s
JOIN club_memberships cm ON s.id = cm.student_id
JOIN clubs c ON cm.club_id = c.id
LEFT JOIN events e ON c.id = e.organized_by_club_id
WHERE cm.role = 'Head' AND cm.is_active = TRUE AND s.is_active = TRUE
GROUP BY s.id, s.name, s.email, c.id, c.name;

-- View for admin dashboard
CREATE VIEW admin_dashboard AS
SELECT 
    fa.id AS admin_id,
    fa.name AS admin_name,
    fa.email,
    ur.role_name,
    COUNT(DISTINCT c.id) AS clubs_managed,
    COUNT(DISTINCT e.id) AS events_approved,
    COUNT(DISTINCT CASE WHEN e.status = 'Pending_Approval' THEN e.id END) AS pending_events
FROM faculty_admin fa
JOIN user_roles ur ON fa.user_role_id = ur.id
LEFT JOIN clubs c ON fa.id = c.approved_by_admin_id
LEFT JOIN events e ON fa.id = e.approved_by_admin_id
WHERE fa.is_active = TRUE AND ur.role_name IN ('admin', 'faculty')
GROUP BY fa.id, fa.name, fa.email, ur.role_name;

-- Seed data for PES University context
INSERT INTO campus (name, location) VALUES 
('PES University - Electronic City', '190 D1, Electronics City Campus, Bengaluru'),
('PES University - Ring Road', '100 Feet Ring Road, Banashankari Stage III, Bengaluru');

INSERT INTO venues (name, type, capacity, equipment, campus_id) VALUES
('Tech Auditorium', 'Auditorium', 600, 'Stage Lighting, Dolby Sound, Projectors', 1),
('Innovation Lab', 'Laboratory', 45, 'High-performance Workstations, VR Kits', 1),
('Central Quadrangle', 'Ground', 1200, 'Open Air Stage, Lighting Rigs', 1),
('Executive Conference Hall', 'Hall', 80, 'Boardroom Seating, LED Wall', 2);

-- Administrative users (all passwords Test@123)
INSERT INTO faculty_admin (employee_id, name, email, password_hash, phone, department, designation, user_role_id) VALUES
('ADMIN001', 'Anita Rao', 'admin1@pesu.pes.edu', '$2b$10$VLiX1NUncP62zADdHwQRPOci9vvz5iAcbOh1emJpija8QYDBNmxsW', '9845000001', 'Administration', 'Senior Administrator', 4),
('ADMIN002', 'Suresh Kumar', 'admin2@pesu.pes.edu', '$2b$10$VLiX1NUncP62zADdHwQRPOci9vvz5iAcbOh1emJpija8QYDBNmxsW', '9845000002', 'Student Affairs', 'Associate Dean', 4),
('ADMIN003', 'Latha Menon', 'admin3@pesu.pes.edu', '$2b$10$VLiX1NUncP62zADdHwQRPOci9vvz5iAcbOh1emJpija8QYDBNmxsW', '9845000003', 'Academics', 'Dean of Clubs', 4),
('ADMIN004', 'Prakash Shetty', 'admin4@pesu.pes.edu', '$2b$10$VLiX1NUncP62zADdHwQRPOci9vvz5iAcbOh1emJpija8QYDBNmxsW', '9845000004', 'Events Office', 'Director of Events', 4),
('ADMIN005', 'Nidhi Varma', 'admin5@pesu.pes.edu', '$2b$10$VLiX1NUncP62zADdHwQRPOci9vvz5iAcbOh1emJpija8QYDBNmxsW', '9845000005', 'Community Relations', 'Engagement Lead', 4);

-- Club head students (all passwords Test@123)
INSERT INTO students (student_id, name, email, password_hash, phone, branch, year_of_study, user_role_id) VALUES
('PES2UG23CS001', 'Aarav Sharma', 'pes2ug23cs001@pesu.pes.edu', '$2b$10$VLiX1NUncP62zADdHwQRPOci9vvz5iAcbOh1emJpija8QYDBNmxsW', '9000000001', 'Computer Science', 3, 2),
('PES2UG23CS002', 'Meera Nair', 'pes2ug23cs002@pesu.pes.edu', '$2b$10$VLiX1NUncP62zADdHwQRPOci9vvz5iAcbOh1emJpija8QYDBNmxsW', '9000000002', 'Computer Science', 3, 2),
('PES2UG23CS003', 'Rahul Iyer', 'pes2ug23cs003@pesu.pes.edu', '$2b$10$VLiX1NUncP62zADdHwQRPOci9vvz5iAcbOh1emJpija8QYDBNmxsW', '9000000003', 'Computer Science', 4, 2),
('PES2UG23CS004', 'Priya Kapoor', 'pes2ug23cs004@pesu.pes.edu', '$2b$10$VLiX1NUncP62zADdHwQRPOci9vvz5iAcbOh1emJpija8QYDBNmxsW', '9000000004', 'Computer Science', 4, 2),
('PES2UG23CS005', 'Tanvi Desai', 'pes2ug23cs005@pesu.pes.edu', '$2b$10$VLiX1NUncP62zADdHwQRPOci9vvz5iAcbOh1emJpija8QYDBNmxsW', '9000000005', 'Computer Science', 3, 2),
('PES2UG23CS006', 'Aniket Rao', 'pes2ug23cs006@pesu.pes.edu', '$2b$10$VLiX1NUncP62zADdHwQRPOci9vvz5iAcbOh1emJpija8QYDBNmxsW', '9000000006', 'Computer Science', 4, 2),
('PES2UG23CS007', 'Divya Patil', 'pes2ug23cs007@pesu.pes.edu', '$2b$10$VLiX1NUncP62zADdHwQRPOci9vvz5iAcbOh1emJpija8QYDBNmxsW', '9000000007', 'Computer Science', 3, 2),
('PES2UG23CS008', 'Siddarth Menon', 'pes2ug23cs008@pesu.pes.edu', '$2b$10$VLiX1NUncP62zADdHwQRPOci9vvz5iAcbOh1emJpija8QYDBNmxsW', '9000000008', 'Computer Science', 4, 2),
('PES2UG23CS009', 'Ishita Verma', 'pes2ug23cs009@pesu.pes.edu', '$2b$10$VLiX1NUncP62zADdHwQRPOci9vvz5iAcbOh1emJpija8QYDBNmxsW', '9000000009', 'Computer Science', 3, 2),
('PES2UG23CS010', 'Karan Shetty', 'pes2ug23cs010@pesu.pes.edu', '$2b$10$VLiX1NUncP62zADdHwQRPOci9vvz5iAcbOh1emJpija8QYDBNmxsW', '9000000010', 'Computer Science', 4, 2),
('PES2UG23CS011', 'Sneha Reddy', 'pes2ug23cs011@pesu.pes.edu', '$2b$10$VLiX1NUncP62zADdHwQRPOci9vvz5iAcbOh1emJpija8QYDBNmxsW', '9000000011', 'Computer Science', 3, 2),
('PES2UG23CS012', 'Vikram Singh', 'pes2ug23cs012@pesu.pes.edu', '$2b$10$VLiX1NUncP62zADdHwQRPOci9vvz5iAcbOh1emJpija8QYDBNmxsW', '9000000012', 'Computer Science', 4, 2),
('PES2UG23CS013', 'Ananya Bose', 'pes2ug23cs013@pesu.pes.edu', '$2b$10$VLiX1NUncP62zADdHwQRPOci9vvz5iAcbOh1emJpija8QYDBNmxsW', '9000000013', 'Computer Science', 3, 2),
('PES2UG23CS014', 'Rohan Mukherjee', 'pes2ug23cs014@pesu.pes.edu', '$2b$10$VLiX1NUncP62zADdHwQRPOci9vvz5iAcbOh1emJpija8QYDBNmxsW', '9000000014', 'Computer Science', 4, 2),
('PES2UG23CS015', 'Lakshmi Narayan', 'pes2ug23cs015@pesu.pes.edu', '$2b$10$VLiX1NUncP62zADdHwQRPOci9vvz5iAcbOh1emJpija8QYDBNmxsW', '9000000015', 'Computer Science', 3, 2),
('PES2UG23CS016', 'Harshad Kulkarni', 'pes2ug23cs016@pesu.pes.edu', '$2b$10$VLiX1NUncP62zADdHwQRPOci9vvz5iAcbOh1emJpija8QYDBNmxsW', '9000000016', 'Computer Science', 4, 2);

-- Clubs seeded from PESU club data (title & description)
INSERT INTO clubs (name, description, campus_id) VALUES
('MAAYA - PES University', 'Cultural Festival of PESU, Electronic City Campus', 1),
('Hashtag - PES University', 'Western dance crew', 1),
('Mangobites - PES University', 'Mangobites is the official theatre club of PES University Electronic City Campus', 1),
('Shaken not Stirred - PES University', 'Shaken not Stirred is the western electric music club of PES University Electronic City Campus.', 1),
('Panache - PES University', 'Panache is the official fashion team of PES University Electronic City Campus.', 1),
('The Pixelloid Club - PES University', 'The Pixelloid Club is the photography team of the college.', 1),
('inGenius - PES University', 'inGenius is the annual intercollegiate hackathon of PES University Electronic City Campus', 1),
('Kludge - PES University', 'Kludge is the annual intercollegiate electronic design challenge of PES University Electronic City Campus', 1),
('onCreate() - PES University', 'onCreate() provides a platform to connect with like minded peers', 1),
('Techwarts - PES University', 'Techwarts is the technical community of specialized technical clubs', 1),
('Nirantara - PES University', 'Nirantara is the Indo-contemporary and classical dance team of PES University Electronic City Campus', 1),
('H.E.L.P - PES University', 'Humanitarian Endeavor for Life Perseverance (H.E.L.P) is the CSR initiative of PES University Electronic City Campus.', 1),
('The Clefhangers - PES University', 'The Clefhangers is the Acapella/Acoustic club of PES University Electronic City Campus.', 1),
('The Entrepreneurship Club - PES University', 'The Entrepreneurship Club is for those who dream beyond the rational limits and for those who seek to make it a reality', 1),
('Swarantraka - PES University', 'Swarantraka is the Indian classical music club of PES University Electronic City Campus.', 1),
('Team Avions - PES University', 'Team Avions is the Aerodesign club of PES University Electronic City Campus.', 1);

-- Approve all seeded clubs through the first admin
UPDATE clubs c
JOIN faculty_admin a ON a.email = 'admin1@pesu.pes.edu'
SET c.approval_status = 'Approved',
    c.created_by_admin_id = a.id,
    c.approved_by_admin_id = a.id;

-- Make seeded students the club heads
INSERT INTO club_memberships (student_id, club_id, role, approved_by_admin_id)
SELECT s.id, c.id, 'Head', a.id
FROM students s
JOIN clubs c ON c.name = 'MAAYA - PES University'
JOIN faculty_admin a ON a.email = 'admin1@pesu.pes.edu'
WHERE s.student_id = 'PES2UG23CS001';

INSERT INTO club_memberships (student_id, club_id, role, approved_by_admin_id)
SELECT s.id, c.id, 'Head', a.id
FROM students s
JOIN clubs c ON c.name = 'Hashtag - PES University'
JOIN faculty_admin a ON a.email = 'admin1@pesu.pes.edu'
WHERE s.student_id = 'PES2UG23CS002';

INSERT INTO club_memberships (student_id, club_id, role, approved_by_admin_id)
SELECT s.id, c.id, 'Head', a.id
FROM students s
JOIN clubs c ON c.name = 'Mangobites - PES University'
JOIN faculty_admin a ON a.email = 'admin1@pesu.pes.edu'
WHERE s.student_id = 'PES2UG23CS003';

INSERT INTO club_memberships (student_id, club_id, role, approved_by_admin_id)
SELECT s.id, c.id, 'Head', a.id
FROM students s
JOIN clubs c ON c.name = 'Shaken not Stirred - PES University'
JOIN faculty_admin a ON a.email = 'admin1@pesu.pes.edu'
WHERE s.student_id = 'PES2UG23CS004';

INSERT INTO club_memberships (student_id, club_id, role, approved_by_admin_id)
SELECT s.id, c.id, 'Head', a.id
FROM students s
JOIN clubs c ON c.name = 'Panache - PES University'
JOIN faculty_admin a ON a.email = 'admin1@pesu.pes.edu'
WHERE s.student_id = 'PES2UG23CS005';

INSERT INTO club_memberships (student_id, club_id, role, approved_by_admin_id)
SELECT s.id, c.id, 'Head', a.id
FROM students s
JOIN clubs c ON c.name = 'The Pixelloid Club - PES University'
JOIN faculty_admin a ON a.email = 'admin1@pesu.pes.edu'
WHERE s.student_id = 'PES2UG23CS006';

INSERT INTO club_memberships (student_id, club_id, role, approved_by_admin_id)
SELECT s.id, c.id, 'Head', a.id
FROM students s
JOIN clubs c ON c.name = 'inGenius - PES University'
JOIN faculty_admin a ON a.email = 'admin1@pesu.pes.edu'
WHERE s.student_id = 'PES2UG23CS007';

INSERT INTO club_memberships (student_id, club_id, role, approved_by_admin_id)
SELECT s.id, c.id, 'Head', a.id
FROM students s
JOIN clubs c ON c.name = 'Kludge - PES University'
JOIN faculty_admin a ON a.email = 'admin1@pesu.pes.edu'
WHERE s.student_id = 'PES2UG23CS008';

INSERT INTO club_memberships (student_id, club_id, role, approved_by_admin_id)
SELECT s.id, c.id, 'Head', a.id
FROM students s
JOIN clubs c ON c.name = 'onCreate() - PES University'
JOIN faculty_admin a ON a.email = 'admin1@pesu.pes.edu'
WHERE s.student_id = 'PES2UG23CS009';

INSERT INTO club_memberships (student_id, club_id, role, approved_by_admin_id)
SELECT s.id, c.id, 'Head', a.id
FROM students s
JOIN clubs c ON c.name = 'Techwarts - PES University'
JOIN faculty_admin a ON a.email = 'admin1@pesu.pes.edu'
WHERE s.student_id = 'PES2UG23CS010';

INSERT INTO club_memberships (student_id, club_id, role, approved_by_admin_id)
SELECT s.id, c.id, 'Head', a.id
FROM students s
JOIN clubs c ON c.name = 'Nirantara - PES University'
JOIN faculty_admin a ON a.email = 'admin1@pesu.pes.edu'
WHERE s.student_id = 'PES2UG23CS011';

INSERT INTO club_memberships (student_id, club_id, role, approved_by_admin_id)
SELECT s.id, c.id, 'Head', a.id
FROM students s
JOIN clubs c ON c.name = 'H.E.L.P - PES University'
JOIN faculty_admin a ON a.email = 'admin1@pesu.pes.edu'
WHERE s.student_id = 'PES2UG23CS012';

INSERT INTO club_memberships (student_id, club_id, role, approved_by_admin_id)
SELECT s.id, c.id, 'Head', a.id
FROM students s
JOIN clubs c ON c.name = 'The Clefhangers - PES University'
JOIN faculty_admin a ON a.email = 'admin1@pesu.pes.edu'
WHERE s.student_id = 'PES2UG23CS013';

INSERT INTO club_memberships (student_id, club_id, role, approved_by_admin_id)
SELECT s.id, c.id, 'Head', a.id
FROM students s
JOIN clubs c ON c.name = 'The Entrepreneurship Club - PES University'
JOIN faculty_admin a ON a.email = 'admin1@pesu.pes.edu'
WHERE s.student_id = 'PES2UG23CS014';

INSERT INTO club_memberships (student_id, club_id, role, approved_by_admin_id)
SELECT s.id, c.id, 'Head', a.id
FROM students s
JOIN clubs c ON c.name = 'Swarantraka - PES University'
JOIN faculty_admin a ON a.email = 'admin1@pesu.pes.edu'
WHERE s.student_id = 'PES2UG23CS015';

INSERT INTO club_memberships (student_id, club_id, role, approved_by_admin_id)
SELECT s.id, c.id, 'Head', a.id
FROM students s
JOIN clubs c ON c.name = 'Team Avions - PES University'
JOIN faculty_admin a ON a.email = 'admin1@pesu.pes.edu'
WHERE s.student_id = 'PES2UG23CS016';

-- Stored procedures
DROP PROCEDURE IF EXISTS get_event_summary;

DELIMITER //
CREATE PROCEDURE get_event_summary(IN p_event_id INT)
BEGIN
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
        CASE 
            WHEN e.max_participants IS NULL OR e.max_participants = 0 THEN NULL
            ELSE ROUND((COUNT(DISTINCT er.id) / e.max_participants) * 100, 1)
        END AS fill_percentage
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

-- Triggers
DELIMITER $$

DROP TRIGGER IF EXISTS after_event_status_update $$
CREATE TRIGGER after_event_status_update
AFTER UPDATE ON events
FOR EACH ROW
BEGIN
    IF OLD.status <> NEW.status THEN
        INSERT INTO admin_audit_log (
            admin_id,
            action_type,
            target_type,
            target_id,
            description
        ) VALUES (
            COALESCE(NEW.approved_by_admin_id, OLD.approved_by_admin_id, 1),
            CASE 
                WHEN NEW.status = 'Approved' THEN 'APPROVE_EVENT'
                WHEN NEW.status = 'Rejected' THEN 'REJECT_EVENT'
                ELSE 'OTHER'
            END,
            'EVENT',
            NEW.id,
            CONCAT('Event ', NEW.name, ' status changed from ', OLD.status, ' to ', NEW.status)
        );
    END IF;
END $$

DROP TRIGGER IF EXISTS after_registration_insert $$
CREATE TRIGGER after_registration_insert
AFTER INSERT ON event_registrations
FOR EACH ROW
BEGIN
    DECLARE old_count INT;
    DECLARE event_capacity INT;

    SELECT current_registrations, max_participants
    INTO old_count, event_capacity
    FROM events 
    WHERE id = NEW.event_id;

    UPDATE events 
    SET current_registrations = current_registrations + 1,
        last_registration_update = CURRENT_TIMESTAMP
    WHERE id = NEW.event_id;

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
END $$

DROP TRIGGER IF EXISTS after_registration_update $$
CREATE TRIGGER after_registration_update
AFTER UPDATE ON event_registrations
FOR EACH ROW
BEGIN
    DECLARE old_count INT;
    DECLARE event_capacity INT;
    DECLARE count_change INT DEFAULT 0;

    SELECT current_registrations, max_participants
    INTO old_count, event_capacity
    FROM events 
    WHERE id = NEW.event_id;

    IF OLD.registration_status = 'Registered' AND NEW.registration_status = 'Cancelled' THEN
        SET count_change = -1;
    ELSEIF OLD.registration_status = 'Cancelled' AND NEW.registration_status = 'Registered' THEN
        SET count_change = 1;
    ELSEIF OLD.registration_status = 'Waitlisted' AND NEW.registration_status = 'Registered' THEN
        SET count_change = 1;
    ELSEIF OLD.registration_status = 'Registered' AND NEW.registration_status = 'Waitlisted' THEN
        SET count_change = -1;
    END IF;

    IF count_change <> 0 THEN
        UPDATE events 
        SET current_registrations = GREATEST(0, current_registrations + count_change),
            last_registration_update = CURRENT_TIMESTAMP
        WHERE id = NEW.event_id;

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
END $$

DROP TRIGGER IF EXISTS after_registration_delete $$
CREATE TRIGGER after_registration_delete
AFTER DELETE ON event_registrations
FOR EACH ROW
BEGIN
    DECLARE old_count INT;
    DECLARE event_capacity INT;

    IF OLD.registration_status = 'Registered' THEN
        SELECT current_registrations, max_participants
        INTO old_count, event_capacity
        FROM events 
        WHERE id = OLD.event_id;

        UPDATE events 
        SET current_registrations = GREATEST(0, current_registrations - 1),
            last_registration_update = CURRENT_TIMESTAMP
        WHERE id = OLD.event_id;

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
END $$

DELIMITER ;

-- Initialize registration counts after trigger creation
SET @prev_sql_safe_updates = @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 0;

UPDATE events e
SET current_registrations = (
    SELECT COUNT(*)
    FROM event_registrations er 
    WHERE er.event_id = e.id 
      AND er.registration_status = 'Registered'
);

SET SQL_SAFE_UPDATES = @prev_sql_safe_updates;

-- Analytical and demo queries
-- Aggregated club statistics
SELECT 
    c.id AS club_id,
    c.name AS club_name,
    c.description AS club_description,
    COUNT(DISTINCT e.id) AS total_events,
    COUNT(DISTINCT CASE WHEN e.status = 'Approved' THEN e.id END) AS approved_events,
    COUNT(DISTINCT CASE WHEN e.status = 'Completed' THEN e.id END) AS completed_events,
    COUNT(DISTINCT CASE WHEN e.status = 'Pending_Approval' THEN e.id END) AS pending_events,
    COUNT(DISTINCT er.id) AS total_registrations,
    COALESCE(AVG(reg_count.registration_count), 0) AS avg_registrations_per_event,
    COALESCE(MAX(reg_count.registration_count), 0) AS max_registrations_event,
    COALESCE(MIN(CASE WHEN reg_count.registration_count > 0 THEN reg_count.registration_count END), 0) AS min_registrations_event,
    COUNT(DISTINCT cm.student_id) AS total_members,
    COUNT(DISTINCT CASE WHEN er.attended = TRUE THEN er.id END) AS total_attendees,
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
LEFT JOIN events e ON c.id = e.organized_by_club_id
LEFT JOIN event_registrations er ON e.id = er.event_id 
    AND er.registration_status = 'Registered'
LEFT JOIN club_memberships cm ON c.id = cm.club_id 
    AND cm.is_active = TRUE
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
HAVING COUNT(DISTINCT e.id) > 0
ORDER BY total_events DESC, total_registrations DESC;

-- Upcoming approved events with venue and registration summary
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
    e.registration_required,
    e.registration_deadline,
    c.id AS club_id,
    c.name AS club_name,
    c.description AS club_description,
    v.id AS venue_id,
    v.name AS venue_name,
    v.type AS venue_type,
    v.capacity AS venue_capacity,
    v.equipment AS venue_equipment,
    campus.id AS campus_id,
    campus.name AS campus_name,
    campus.location AS campus_location,
    COUNT(DISTINCT er.id) AS total_registrations,
    COUNT(DISTINCT CASE WHEN er.attended = TRUE THEN er.id END) AS attended_count,
    vb.start_time AS booking_start,
    vb.end_time AS booking_end,
    vb.status AS booking_status
FROM events e
INNER JOIN clubs c ON e.organized_by_club_id = c.id
LEFT JOIN venue_bookings vb ON e.booking_id = vb.id
LEFT JOIN venues v ON vb.venue_id = v.id
LEFT JOIN campus ON v.campus_id = campus.id
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
ORDER BY e.event_date ASC, e.start_time ASC;

-- Highly active students (nested query example)
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