-- Simplified Database Schema for College Event Management System
-- This version excludes complex triggers to avoid parsing issues

-- Student/User table - represents all students in the system
CREATE TABLE students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    branch VARCHAR(50),
    year_of_study INT CHECK (year_of_study BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_student_email (email),
    INDEX idx_student_branch (branch)
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
    faculty_coordinator VARCHAR(100),
    campus_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (campus_id) REFERENCES campus(id) ON DELETE RESTRICT,
    UNIQUE KEY unique_club_per_campus (name, campus_id),
    INDEX idx_club_campus (campus_id),
    INDEX idx_club_active (is_active)
);

CREATE TABLE club_memberships (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    club_id INT NOT NULL,
    role ENUM('Head', 'Member') DEFAULT 'Member',
    join_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
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
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE RESTRICT,
    FOREIGN KEY (booked_by_club_id) REFERENCES clubs(id) ON DELETE SET NULL,
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
    status ENUM('Draft', 'Pending_Approval', 'Approved', 'Cancelled', 'Completed') DEFAULT 'Draft',
    max_participants INT,
    registration_required BOOLEAN DEFAULT TRUE,
    registration_deadline DATETIME,
    organized_by_club_id INT NOT NULL,
    booking_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organized_by_club_id) REFERENCES clubs(id) ON DELETE RESTRICT,
    FOREIGN KEY (booking_id) REFERENCES venue_bookings(id) ON DELETE SET NULL,
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

-- Insert sample data for testing
INSERT INTO campus (name, location) VALUES 
('Main Campus', 'Downtown University Area'),
('North Campus', 'North Side Academic Complex');

INSERT INTO students (student_id, name, email, password_hash, phone, branch, year_of_study) VALUES
('CS2021001', 'John Smith', 'john.smith@university.edu', '$2y$10$example_hash_1', '1234567890', 'Computer Science', 3),
('CS2021002', 'Jane Doe', 'jane.doe@university.edu', '$2y$10$example_hash_2', '1234567891', 'Computer Science', 3),
('EE2021001', 'Bob Johnson', 'bob.johnson@university.edu', '$2y$10$example_hash_3', '1234567892', 'Electrical Engineering', 2),
('ME2021001', 'Alice Brown', 'alice.brown@university.edu', '$2y$10$example_hash_4', '1234567893', 'Mechanical Engineering', 4);

INSERT INTO venues (name, type, capacity, equipment, campus_id) VALUES
('Main Auditorium', 'Auditorium', 500, 'Projector, Sound System, Stage Lighting', 1),
('Computer Lab 1', 'Laboratory', 40, 'Computers, Projector', 1),
('Sports Ground', 'Ground', 1000, 'Seating, Sports Equipment', 1),
('Conference Room A', 'Hall', 50, 'Projector, Whiteboard', 2);

INSERT INTO clubs (name, description, faculty_coordinator, campus_id) VALUES
('Computer Science Society', 'Club for CS students to organize tech events', 'Dr. Smith', 1),
('Robotics Club', 'Building and programming robots', 'Prof. Johnson', 1),
('Cultural Committee', 'Organizing cultural events and festivals', 'Dr. Brown', 1);

INSERT INTO club_memberships (student_id, club_id, role, join_date) VALUES
(1, 1, 'Head', '2024-08-01'),
(2, 1, 'Member', '2024-08-15'),
(3, 2, 'Head', '2024-08-01'),
(4, 3, 'Head', '2024-08-01'),
(1, 3, 'Member', '2024-09-01');