-- Enhanced Database Schema for College Event Management System with Role-Based Access Control

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

-- Sample data for testing
INSERT INTO campus (name, location) VALUES 
('Main Campus', 'Downtown University Area'),
('North Campus', 'North Side Academic Complex');

-- Sample admin user
INSERT INTO faculty_admin (employee_id, name, email, password_hash, phone, department, designation, user_role_id) VALUES
('ADMIN001', 'Dr. Admin Smith', 'admin@university.edu', '$2y$10$example_admin_hash', '9999999999', 'Administration', 'System Administrator', 4);

-- Sample faculty coordinator
INSERT INTO faculty_admin (employee_id, name, email, password_hash, phone, department, designation, user_role_id) VALUES
('FAC001', 'Prof. John Coordinator', 'faculty@university.edu', '$2y$10$example_faculty_hash', '8888888888', 'Computer Science', 'Professor', 3);

-- Sample students with different roles
INSERT INTO students (student_id, name, email, password_hash, phone, branch, year_of_study, user_role_id) VALUES
('CS2021001', 'John Smith', 'john.smith@university.edu', '$2y$10$example_hash_1', '1234567890', 'Computer Science', 3, 1),
('CS2021002', 'Jane Doe', 'jane.doe@university.edu', '$2y$10$example_hash_2', '1234567891', 'Computer Science', 3, 1),
('CS2021003', 'Club Head One', 'head1@university.edu', '$2y$10$example_hash_3', '1234567892', 'Computer Science', 4, 2),
('EE2021001', 'Club Head Two', 'head2@university.edu', '$2y$10$example_hash_4', '1234567893', 'Electrical Engineering', 4, 2);

-- Sample venues
INSERT INTO venues (name, type, capacity, equipment, campus_id) VALUES
('Main Auditorium', 'Auditorium', 500, 'Projector, Sound System, Stage Lighting', 1),
('Computer Lab 1', 'Laboratory', 40, 'Computers, Projector', 1),
('Sports Ground', 'Ground', 1000, 'Seating, Sports Equipment', 1),
('Conference Room A', 'Hall', 50, 'Projector, Whiteboard', 2);

-- Sample clubs (approved by admin)
INSERT INTO clubs (name, description, faculty_coordinator_id, campus_id, created_by_admin_id, approved_by_admin_id, approval_status) VALUES
('Computer Science Society', 'Club for CS students to organize tech events', 2, 1, 1, 1, 'Approved'),
('Robotics Club', 'Building and programming robots', 2, 1, 1, 1, 'Approved');

-- Sample club memberships with heads
INSERT INTO club_memberships (student_id, club_id, role, approved_by_admin_id) VALUES
(3, 1, 'Head', 1),
(1, 1, 'Member', NULL),
(2, 1, 'Member', NULL),
(4, 2, 'Head', 1);