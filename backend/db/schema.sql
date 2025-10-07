-- Student/User table - represents all students in the system
CREATE TABLE students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id VARCHAR(20) UNIQUE NOT NULL, -- University student ID
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- CRITICAL for security
    phone VARCHAR(15),
    branch VARCHAR(50),
    year_of_study INT CHECK (year_of_study BETWEEN 1 AND 5),
    -- Timestamps for auditing
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for better performance
    INDEX idx_student_email (email),
    INDEX idx_student_branch (branch)
);

CREATE TABLE campus (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique campus names
    UNIQUE KEY unique_campus_name (name)
);

CREATE TABLE venues (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    type ENUM('Hall', 'Ground', 'Classroom', 'Auditorium', 'Laboratory', 'Other') NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    equipment TEXT, -- Available equipment (projector, sound system, etc.)
    campus_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (campus_id) REFERENCES campus(id) ON DELETE RESTRICT,
    
    -- Ensure unique venue names within the same campus
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
    
    -- Ensure unique club names within the same campus
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
    
    -- A student can only have one active membership per club
    UNIQUE KEY unique_active_membership (student_id, club_id, is_active),
    INDEX idx_membership_student (student_id),
    INDEX idx_membership_club (club_id),
    INDEX idx_membership_role (role)
);

-- Venue booking table to prevent double-booking
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
    
    -- Ensure end time is after start time
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
    booking_id INT, -- Links to venue_bookings table
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (organized_by_club_id) REFERENCES clubs(id) ON DELETE RESTRICT,
    FOREIGN KEY (booking_id) REFERENCES venue_bookings(id) ON DELETE SET NULL,
    
    -- Ensure end time is after start time
    CHECK (end_time > start_time),
    -- Ensure registration deadline is before event date
    CHECK (registration_deadline IS NULL OR registration_deadline <= CONCAT(event_date, ' ', start_time)),
    
    INDEX idx_event_date (event_date),
    INDEX idx_event_club (organized_by_club_id),
    INDEX idx_event_status (status),
    INDEX idx_event_type (event_type)
);

-- Event registrations and attendance tracking
CREATE TABLE event_registrations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    event_id INT NOT NULL,
    registration_status ENUM('Registered', 'Waitlisted', 'Cancelled') DEFAULT 'Registered',
    attended BOOLEAN DEFAULT FALSE, -- Tracks actual attendance
    attendance_marked_at TIMESTAMP NULL,
    registration_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    
    -- Student can't register for the same event twice
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
    
    -- One feedback per student per event
    UNIQUE KEY unique_student_feedback (student_id, event_id),
    INDEX idx_feedback_event (event_id),
    INDEX idx_feedback_rating (rating)
);

-- Triggers and constraints to enforce business rules

-- Trigger to ensure only one club head per club
DELIMITER //
CREATE TRIGGER check_single_club_head
    BEFORE INSERT ON club_memberships
    FOR EACH ROW
BEGIN
    IF NEW.role = 'Head' THEN
        IF EXISTS (
            SELECT 1 FROM club_memberships 
            WHERE club_id = NEW.club_id 
            AND role = 'Head' 
            AND is_active = TRUE
        ) THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'A club can have only one active head at a time';
        END IF;
    END IF;
END//

CREATE TRIGGER check_single_club_head_update
    BEFORE UPDATE ON club_memberships
    FOR EACH ROW
BEGIN
    IF NEW.role = 'Head' AND NEW.is_active = TRUE THEN
        IF EXISTS (
            SELECT 1 FROM club_memberships 
            WHERE club_id = NEW.club_id 
            AND role = 'Head' 
            AND is_active = TRUE
            AND id != NEW.id
        ) THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'A club can have only one active head at a time';
        END IF;
    END IF;
END//

-- Trigger to prevent venue double-booking
CREATE TRIGGER check_venue_availability
    BEFORE INSERT ON venue_bookings
    FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1 FROM venue_bookings 
        WHERE venue_id = NEW.venue_id 
        AND status IN ('Pending', 'Confirmed')
        AND (
            (NEW.start_time < end_time AND NEW.end_time > start_time)
        )
    ) THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Venue is already booked for the specified time period';
    END IF;
END//

CREATE TRIGGER check_venue_availability_update
    BEFORE UPDATE ON venue_bookings
    FOR EACH ROW
BEGIN
    IF NEW.status IN ('Pending', 'Confirmed') THEN
        IF EXISTS (
            SELECT 1 FROM venue_bookings 
            WHERE venue_id = NEW.venue_id 
            AND status IN ('Pending', 'Confirmed')
            AND id != NEW.id
            AND (
                (NEW.start_time < end_time AND NEW.end_time > start_time)
            )
        ) THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Venue is already booked for the specified time period';
        END IF;
    END IF;
END//

DELIMITER ;

-- Views for common queries

-- View to get club heads
CREATE VIEW club_heads AS
SELECT 
    c.id AS club_id,
    c.name AS club_name,
    s.id AS head_id,
    s.name AS head_name,
    s.email AS head_email,
    cm.join_date
FROM clubs c
JOIN club_memberships cm ON c.id = cm.club_id
JOIN students s ON cm.student_id = s.id
WHERE cm.role = 'Head' AND cm.is_active = TRUE;

-- View to get venue availability
CREATE VIEW venue_availability AS
SELECT 
    v.id AS venue_id,
    v.name AS venue_name,
    v.type,
    v.capacity,
    ca.name AS campus_name,
    COALESCE(
        (SELECT COUNT(*) FROM venue_bookings vb 
         WHERE vb.venue_id = v.id 
         AND vb.status IN ('Pending', 'Confirmed')
         AND vb.start_time >= CURDATE()),
        0
    ) AS upcoming_bookings
FROM venues v
JOIN campus ca ON v.campus_id = ca.id
WHERE v.is_active = TRUE;

-- View for event details with venue and club info
CREATE VIEW event_details AS
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
    c.name AS organizing_club,
    v.name AS venue_name,
    v.type AS venue_type,
    v.capacity AS venue_capacity,
    vb.start_time AS booking_start,
    vb.end_time AS booking_end,
    COALESCE(
        (SELECT COUNT(*) FROM event_registrations er 
         WHERE er.event_id = e.id 
         AND er.registration_status = 'Registered'),
        0
    ) AS registered_count
FROM events e
JOIN clubs c ON e.organized_by_club_id = c.id
LEFT JOIN venue_bookings vb ON e.booking_id = vb.id
LEFT JOIN venues v ON vb.venue_id = v.id;

-- Sample data for testing (uncomment to use)
/*
-- Insert sample campus
INSERT INTO campus (name, location) VALUES 
('Main Campus', 'Downtown University Area'),
('North Campus', 'North Side Academic Complex');

-- Insert sample students
INSERT INTO students (student_id, name, email, password_hash, phone, branch, year_of_study) VALUES
('CS2021001', 'John Smith', 'john.smith@university.edu', '$2y$10$example_hash_1', '1234567890', 'Computer Science', 3),
('CS2021002', 'Jane Doe', 'jane.doe@university.edu', '$2y$10$example_hash_2', '1234567891', 'Computer Science', 3),
('EE2021001', 'Bob Johnson', 'bob.johnson@university.edu', '$2y$10$example_hash_3', '1234567892', 'Electrical Engineering', 2),
('ME2021001', 'Alice Brown', 'alice.brown@university.edu', '$2y$10$example_hash_4', '1234567893', 'Mechanical Engineering', 4);

-- Insert sample venues
INSERT INTO venues (name, type, capacity, equipment, campus_id) VALUES
('Main Auditorium', 'Auditorium', 500, 'Projector, Sound System, Stage Lighting', 1),
('Computer Lab 1', 'Laboratory', 40, 'Computers, Projector', 1),
('Sports Ground', 'Ground', 1000, 'Seating, Sports Equipment', 1),
('Conference Room A', 'Hall', 50, 'Projector, Whiteboard', 2);

-- Insert sample clubs
INSERT INTO clubs (name, description, faculty_coordinator, campus_id) VALUES
('Computer Science Society', 'Club for CS students to organize tech events', 'Dr. Smith', 1),
('Robotics Club', 'Building and programming robots', 'Prof. Johnson', 1),
('Cultural Committee', 'Organizing cultural events and festivals', 'Dr. Brown', 1);

-- Insert club memberships (including heads)
INSERT INTO club_memberships (student_id, club_id, role, join_date) VALUES
(1, 1, 'Head', '2024-08-01'),
(2, 1, 'Member', '2024-08-15'),
(3, 2, 'Head', '2024-08-01'),
(4, 3, 'Head', '2024-08-01'),
(1, 3, 'Member', '2024-09-01');

-- Insert sample venue bookings
INSERT INTO venue_bookings (venue_id, start_time, end_time, booking_type, status, booked_by_club_id, notes) VALUES
(1, '2024-10-15 14:00:00', '2024-10-15 17:00:00', 'Event', 'Confirmed', 1, 'Tech Talk by Industry Expert'),
(3, '2024-10-20 09:00:00', '2024-10-20 18:00:00', 'Event', 'Confirmed', 2, 'Robotics Competition');

-- Insert sample events
INSERT INTO events (name, description, event_date, start_time, end_time, event_type, status, max_participants, registration_required, registration_deadline, organized_by_club_id, booking_id) VALUES
('AI and Machine Learning Workshop', 'Introduction to AI/ML concepts and hands-on practice', '2024-10-15', '14:00:00', '17:00:00', 'Workshop', 'Approved', 100, TRUE, '2024-10-14 23:59:59', 1, 1),
('Annual Robotics Competition', 'Inter-college robotics competition', '2024-10-20', '09:00:00', '18:00:00', 'Competition', 'Approved', 200, TRUE, '2024-10-18 23:59:59', 2, 2);

-- Insert sample registrations
INSERT INTO event_registrations (student_id, event_id, registration_status) VALUES
(2, 1, 'Registered'),
(3, 1, 'Registered'),
(4, 1, 'Registered'),
(1, 2, 'Registered'),
(4, 2, 'Registered');
*/