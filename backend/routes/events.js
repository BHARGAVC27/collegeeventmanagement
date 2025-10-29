const express = require('express');
const { pool } = require('../db/dbConnect');
const { authenticate, authorizeStudent, authorizeClubHead, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all venues (for event creation)
router.get('/venues', async (req, res) => {
    try {
        const [venues] = await pool.execute(
            `SELECT v.id, v.name, v.type, v.capacity, v.equipment, c.name as campus_name
             FROM venues v 
             LEFT JOIN campus c ON v.campus_id = c.id
             WHERE v.is_active = TRUE 
             ORDER BY c.name ASC, v.name ASC`
        );

        res.json({
            success: true,
            venues
        });
    } catch (error) {
        console.error('Error fetching venues:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch venues'
        });
    }
});

// Get all upcoming events (public, but shows different info based on user role)
router.get('/events', async (req, res) => {
    try {
        const [events] = await pool.execute(
            `SELECT 
                e.id,
                e.name,
                e.description,
                e.event_date,
                e.start_time,
                e.end_time,
                e.event_type,
                e.status,
                e.max_participants,
                e.registration_required,
                e.registration_deadline,
                c.name as club_name,
                v.name as venue_name,
                v.type as venue_type,
                campus.name as campus_name,
                COUNT(er.id) as registered_count
            FROM events e
            JOIN clubs c ON e.organized_by_club_id = c.id
            LEFT JOIN venue_bookings vb ON e.booking_id = vb.id
            LEFT JOIN venues v ON vb.venue_id = v.id
            LEFT JOIN campus ON v.campus_id = campus.id
            LEFT JOIN event_registrations er ON e.id = er.event_id AND er.registration_status = 'Registered'
            WHERE e.status = 'Approved' 
            AND e.event_date >= CURDATE()
            GROUP BY e.id
            ORDER BY e.event_date ASC, e.start_time ASC`
        );
        
        res.json({
            success: true,
            count: events.length,
            events
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch events'
        });
    }
});

// Get pending events (admin only)
router.get('/events/pending', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const [events] = await pool.execute(
            `SELECT 
                e.id,
                e.name,
                e.description,
                e.event_date,
                e.start_time,
                e.end_time,
                e.event_type,
                e.status,
                e.max_participants,
                e.registration_required,
                e.registration_deadline,
                c.name as club_name,
                s.name as created_by,
                s.email as creator_email,
                v.name as venue_name,
                e.created_at
            FROM events e
            JOIN clubs c ON e.organized_by_club_id = c.id
            LEFT JOIN students s ON e.created_by_student_id = s.id
            LEFT JOIN venue_bookings vb ON e.booking_id = vb.id
            LEFT JOIN venues v ON vb.venue_id = v.id
            WHERE e.status = 'Pending_Approval'
            ORDER BY e.created_at ASC`
        );
        
        res.json({
            success: true,
            count: events.length,
            events
        });
    } catch (error) {
        console.error('Error fetching pending events:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch pending events'
        });
    }
});

// Create new event (club heads only)
router.post('/events', authenticate, authorizeClubHead, async (req, res) => {
    try {
        const { 
            name, 
            description, 
            event_date, 
            start_time, 
            end_time, 
            event_type, 
            max_participants, 
            registration_required, 
            registration_deadline,
            club_id,
            venue_id 
        } = req.body;

        if (!name || !event_date || !start_time || !end_time || !club_id) {
            return res.status(400).json({
                success: false,
                error: 'Name, event date, start time, end time, and club ID are required'
            });
        }

        // Verify user is head of the specified club
        const [memberships] = await pool.execute(
            `SELECT * FROM club_memberships 
             WHERE student_id = ? AND club_id = ? AND role = 'Head' AND is_active = TRUE`,
            [req.user.id, club_id]
        );

        if (memberships.length === 0) {
            return res.status(403).json({
                success: false,
                error: 'You are not authorized to create events for this club'
            });
        }

        let booking_id = null;
        
        // Create venue booking if venue is specified
        if (venue_id) {
            const [bookingResult] = await pool.execute(
                `INSERT INTO venue_bookings (venue_id, start_time, end_time, booking_type, status, booked_by_club_id) 
                 VALUES (?, ?, ?, 'Event', 'Pending', ?)`,
                [venue_id, `${event_date} ${start_time}`, `${event_date} ${end_time}`, club_id]
            );
            booking_id = bookingResult.insertId;
        }

        // Create the event
        const [result] = await pool.execute(
            `INSERT INTO events (
                name, description, event_date, start_time, end_time, event_type, 
                status, max_participants, registration_required, registration_deadline, 
                organized_by_club_id, booking_id, created_by_student_id
            ) VALUES (?, ?, ?, ?, ?, ?, 'Pending_Approval', ?, ?, ?, ?, ?, ?)`,
            [
                name, description, event_date, start_time, end_time, event_type,
                max_participants, registration_required, registration_deadline,
                club_id, booking_id, req.user.id
            ]
        );

        // Get the created event with details
        const [newEvent] = await pool.execute(
            `SELECT 
                e.*,
                c.name as club_name,
                v.name as venue_name
            FROM events e
            JOIN clubs c ON e.organized_by_club_id = c.id
            LEFT JOIN venue_bookings vb ON e.booking_id = vb.id
            LEFT JOIN venues v ON vb.venue_id = v.id
            WHERE e.id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Event created successfully and is pending approval',
            event: newEvent[0]
        });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create event'
        });
    }
});

// Approve event (admin only)
router.put('/events/:id/approve', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { approval_notes } = req.body;

        const [result] = await pool.execute(
            `UPDATE events 
             SET status = 'Approved', approved_by_admin_id = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND status = 'Pending_Approval'`,
            [req.user.id, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Event not found or not pending approval'
            });
        }

        // Also approve the venue booking if it exists
        await pool.execute(
            `UPDATE venue_bookings vb
             JOIN events e ON vb.id = e.booking_id
             SET vb.status = 'Confirmed', vb.approved_by_admin_id = ?
             WHERE e.id = ?`,
            [req.user.id, id]
        );

        // Audit log is automatically created by database trigger

        res.json({
            success: true,
            message: 'Event approved successfully'
        });
    } catch (error) {
        console.error('Error approving event:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to approve event'
        });
    }
});

// Reject event (admin only)
router.put('/events/:id/reject', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { rejection_reason } = req.body;

        if (!rejection_reason) {
            return res.status(400).json({
                success: false,
                error: 'Rejection reason is required'
            });
        }

        const [result] = await pool.execute(
            `UPDATE events 
             SET status = 'Rejected', rejection_reason = ?, approved_by_admin_id = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND status = 'Pending_Approval'`,
            [rejection_reason, req.user.id, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Event not found or not pending approval'
            });
        }

        // Cancel the venue booking if it exists
        await pool.execute(
            `UPDATE venue_bookings vb
             JOIN events e ON vb.id = e.booking_id
             SET vb.status = 'Cancelled'
             WHERE e.id = ?`,
            [id]
        );

        // Audit log is automatically created by database trigger

        res.json({
            success: true,
            message: 'Event rejected successfully'
        });
    } catch (error) {
        console.error('Error rejecting event:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reject event'
        });
    }
});

// Register for an event - MUST come before /events/:id route
router.post('/events/:eventId/register', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { eventId } = req.params;
        const { email, name, phone, paymentScreenshot } = req.body;
        
        console.log('Registration request received:', { eventId, email, name });
        
        // Start transaction
        await connection.beginTransaction();
        
        // First, get or create the student record based on email
        let [students] = await connection.execute(
            'SELECT id FROM students WHERE email = ?',
            [email]
        );
        
        let studentId;
        
        if (students.length === 0) {
            // Create new student record if doesn't exist
            const studentIdGenerated = email.split('@')[0]; // Extract from email
            const [insertResult] = await connection.execute(
                `INSERT INTO students (student_id, name, email, phone, password_hash) 
                 VALUES (?, ?, ?, ?, ?)`,
                [studentIdGenerated, name, email, phone || null, 'temp_password'] // Use placeholder for new users
            );
            studentId = insertResult.insertId;
            console.log('Created new student:', studentId);
        } else {
            studentId = students[0].id;
            console.log('Found existing student:', studentId);
            
            // Update student info if provided
            if (name || phone) {
                await connection.execute(
                    `UPDATE students SET name = COALESCE(?, name), phone = COALESCE(?, phone) 
                     WHERE id = ?`,
                    [name, phone, studentId]
                );
            }
        }
        
        // Check if event exists and is open for registration
        const [events] = await connection.execute(
            `SELECT id, name, max_participants, registration_deadline, event_date, start_time, status
             FROM events 
             WHERE id = ?`,
            [eventId]
        );
        
        if (events.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                error: 'Event not found'
            });
        }
        
        const event = events[0];
        console.log('Event found:', event.name, 'Status:', event.status);
        
        // Check if event is approved
        if (event.status !== 'Approved') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'This event is not open for registration'
            });
        }
        
        // Check registration deadline
        if (event.registration_deadline) {
            const deadline = new Date(event.registration_deadline);
            if (new Date() > deadline) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    error: 'Registration deadline has passed'
                });
            }
        }
        
        // Check if student has any existing registration (including cancelled)
        const [existingReg] = await connection.execute(
            'SELECT id, registration_status FROM event_registrations WHERE student_id = ? AND event_id = ?',
            [studentId, eventId]
        );
        
        if (existingReg.length > 0) {
            // If registration exists and is currently active (Registered or Waitlisted)
            if (existingReg[0].registration_status === 'Registered' || existingReg[0].registration_status === 'Waitlisted') {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    error: 'You are already registered for this event',
                    registrationStatus: existingReg[0].registration_status
                });
            }
            
            // If registration was cancelled, reactivate it
            if (existingReg[0].registration_status === 'Cancelled') {
                console.log('Reactivating cancelled registration for student:', studentId);
                await connection.execute(
                    `UPDATE event_registrations 
                     SET registration_status = 'Registered', 
                         registration_time = CURRENT_TIMESTAMP
                     WHERE id = ?`,
                    [existingReg[0].id]
                );
                
                await connection.commit();
                console.log('Registration reactivated successfully');
                
                return res.json({
                    success: true,
                    message: 'Successfully re-registered for the event',
                    registrationId: existingReg[0].id
                });
            }
        }
        
        // Check if event is full
        if (event.max_participants) {
            const [regCount] = await connection.execute(
                `SELECT COUNT(*) as count FROM event_registrations 
                 WHERE event_id = ? AND registration_status = 'Registered'`,
                [eventId]
            );
            
            if (regCount[0].count >= event.max_participants) {
                // Register as waitlisted
                const [result] = await connection.execute(
                    `INSERT INTO event_registrations (student_id, event_id, registration_status, attended) 
                     VALUES (?, ?, 'Waitlisted', FALSE)`,
                    [studentId, eventId]
                );
                
                await connection.commit();
                
                console.log('Student added to waitlist');
                return res.json({
                    success: true,
                    message: 'Added to waitlist successfully',
                    registration: {
                        id: result.insertId,
                        status: 'Waitlisted',
                        eventName: event.name
                    }
                });
            }
        }
        
        // Register the student for the event with attended set to FALSE (will be marked TRUE when they actually attend)
        const [result] = await connection.execute(
            `INSERT INTO event_registrations (student_id, event_id, registration_status, attended) 
             VALUES (?, ?, 'Registered', FALSE)`,
            [studentId, eventId]
        );
        
        await connection.commit();
        
        console.log('Registration successful:', result.insertId);
        res.json({
            success: true,
            message: 'Successfully registered for the event',
            registration: {
                id: result.insertId,
                studentId: studentId,
                eventId: eventId,
                status: 'Registered',
                eventName: event.name,
                eventDate: event.event_date,
                eventTime: event.start_time
            }
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('Error registering for event:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                error: 'You are already registered for this event'
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Failed to register for event',
            details: error.message
        });
    } finally {
        connection.release();
    }
});

// Cancel event registration
router.delete('/events/:eventId/register', async (req, res) => {
    try {
        const { eventId } = req.params;
        const { email } = req.body;
        
        // Get student by email
        const [students] = await pool.execute(
            'SELECT id FROM students WHERE email = ?',
            [email]
        );
        
        if (students.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Student not found'
            });
        }
        
        const studentId = students[0].id;
        
        // Update registration status to cancelled
        const [result] = await pool.execute(
            `UPDATE event_registrations 
             SET registration_status = 'Cancelled' 
             WHERE student_id = ? AND event_id = ? AND registration_status != 'Cancelled'`,
            [studentId, eventId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Registration not found or already cancelled'
            });
        }
        
        res.json({
            success: true,
            message: 'Registration cancelled successfully'
        });
        
    } catch (error) {
        console.error('Error cancelling registration:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to cancel registration'
        });
    }
});

// Get user's registered events by email - MUST come before /events/:id
router.get('/events/my-registrations', async (req, res) => {
    try {
        const email = req.query.email;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email is required'
            });
        }
        
        // First get the student ID from email
        const [students] = await pool.execute(
            'SELECT id FROM students WHERE email = ?',
            [email.toLowerCase()]
        );
        
        if (students.length === 0) {
            return res.json({
                success: true,
                count: 0,
                events: []
            });
        }
        
        const studentId = students[0].id;
        
        const [events] = await pool.execute(
            `SELECT 
                e.id,
                e.name,
                e.description,
                e.event_date,
                e.start_time,
                e.end_time,
                e.event_type,
                e.status,
                e.max_participants,
                c.name as club_name,
                v.name as venue_name,
                er.registration_status,
                er.attended,
                er.registration_time,
                COUNT(DISTINCT er2.id) as registered_count
            FROM events e
            JOIN event_registrations er ON e.id = er.event_id
            JOIN clubs c ON e.organized_by_club_id = c.id
            LEFT JOIN venue_bookings vb ON e.booking_id = vb.id
            LEFT JOIN venues v ON vb.venue_id = v.id
            LEFT JOIN event_registrations er2 ON e.id = er2.event_id AND er2.registration_status = 'Registered'
            WHERE er.student_id = ?
            AND er.registration_status = 'Registered'
            GROUP BY e.id, e.name, e.description, e.event_date, e.start_time, e.end_time, 
                     e.event_type, e.status, e.max_participants, c.name, v.name, 
                     er.registration_status, er.attended, er.registration_time
            ORDER BY e.event_date ASC, e.start_time ASC`
        , [studentId]);
        
        res.json({
            success: true,
            count: events.length,
            events
        });
    } catch (error) {
        console.error('Error fetching user registered events:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user events'
        });
    }
});

// Get event by ID
router.get('/events/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [events] = await pool.execute(
            `SELECT 
                e.id,
                e.name,
                e.description,
                e.event_date,
                e.start_time,
                e.end_time,
                e.event_type,
                e.status,
                e.max_participants,
                e.registration_required,
                e.registration_deadline,
                c.name as club_name,
                c.description as club_description,
                v.name as venue_name,
                v.type as venue_type,
                v.capacity as venue_capacity,
                campus.name as campus_name,
                COUNT(er.id) as registered_count
            FROM events e
            JOIN clubs c ON e.organized_by_club_id = c.id
            LEFT JOIN venue_bookings vb ON e.booking_id = vb.id
            LEFT JOIN venues v ON vb.venue_id = v.id
            LEFT JOIN campus ON v.campus_id = campus.id
            LEFT JOIN event_registrations er ON e.id = er.event_id AND er.registration_status = 'Registered'
            WHERE e.id = ?
            GROUP BY e.id`
        , [id]);
        
        if (events.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Event not found'
            });
        }
        
        res.json({
            success: true,
            event: events[0]
        });
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch event'
        });
    }
});

// Get events by type
router.get('/events/type/:type', async (req, res) => {
    try {
        const { type } = req.params;
        
        const [events] = await pool.execute(
            `SELECT 
                e.id,
                e.name,
                e.description,
                e.event_date,
                e.start_time,
                e.end_time,
                e.event_type,
                e.status,
                c.name as club_name,
                v.name as venue_name,
                COUNT(er.id) as registered_count
            FROM events e
            JOIN clubs c ON e.organized_by_club_id = c.id
            LEFT JOIN venue_bookings vb ON e.booking_id = vb.id
            LEFT JOIN venues v ON vb.venue_id = v.id
            LEFT JOIN event_registrations er ON e.id = er.event_id AND er.registration_status = 'Registered'
            WHERE e.event_type = ? 
            AND e.status IN ('Approved', 'Pending_Approval')
            AND e.event_date >= CURDATE()
            GROUP BY e.id
            ORDER BY e.event_date ASC, e.start_time ASC`
        , [type]);
        
        res.json({
            success: true,
            count: events.length,
            events
        });
    } catch (error) {
        console.error('Error fetching events by type:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch events'
        });
    }
});

// Get user's registered events
router.get('/events/user/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        
        const [events] = await pool.execute(
            `SELECT 
                e.id,
                e.name,
                e.description,
                e.event_date,
                e.start_time,
                e.end_time,
                e.event_type,
                e.status,
                e.max_participants,
                c.name as club_name,
                v.name as venue_name,
                er.registration_status,
                er.attended,
                er.registration_time,
                COUNT(DISTINCT er2.id) as registered_count
            FROM events e
            JOIN event_registrations er ON e.id = er.event_id
            JOIN clubs c ON e.organized_by_club_id = c.id
            LEFT JOIN venue_bookings vb ON e.booking_id = vb.id
            LEFT JOIN venues v ON vb.venue_id = v.id
            LEFT JOIN event_registrations er2 ON e.id = er2.event_id AND er2.registration_status = 'Registered'
            WHERE er.student_id = ?
            AND er.registration_status = 'Registered'
            GROUP BY e.id
            ORDER BY e.event_date ASC, e.start_time ASC`
        , [studentId]);
        
        res.json({
            success: true,
            count: events.length,
            events
        });
    } catch (error) {
        console.error('Error fetching user events:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user events'
        });
    }
});

module.exports = router;

// =========================
// Event management (club head)
// =========================

// Helper to ensure the authenticated club head owns the event's club
async function verifyEventOwnership(userId, eventId) {
    const [rows] = await pool.execute(
        `SELECT e.organized_by_club_id AS club_id
         FROM events e
         JOIN club_memberships cm ON cm.club_id = e.organized_by_club_id
         WHERE e.id = ? AND cm.student_id = ? AND cm.role = 'Head' AND cm.is_active = TRUE`,
        [eventId, userId]
    );
    return rows.length > 0 ? rows[0].club_id : null;
}

// Get registrations for an event (club head only)
router.get('/events/:eventId/registrations', authenticate, authorizeClubHead, async (req, res) => {
    try {
        const { eventId } = req.params;
        const clubId = await verifyEventOwnership(req.user.id, eventId);
        if (!clubId) {
            return res.status(403).json({ success: false, error: 'Not authorized to manage this event' });
        }

        const [regs] = await pool.execute(
            `SELECT 
                er.id AS registration_id,
                er.student_id,
                er.event_id,
                er.registration_status,
                er.attended,
                er.registration_time,
                s.name AS student_name,
                s.student_id AS roll_number,
                s.email
             FROM event_registrations er
             JOIN students s ON s.id = er.student_id
             WHERE er.event_id = ?
             ORDER BY er.registration_time ASC`,
            [eventId]
        );

        res.json({ success: true, count: regs.length, registrations: regs });
    } catch (error) {
        console.error('Error fetching event registrations:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch registrations' });
    }
});

// Update attendance for a registration (club head only)
router.put('/events/:eventId/registrations/:registrationId/attendance', authenticate, authorizeClubHead, async (req, res) => {
    try {
        const { eventId, registrationId } = req.params;
        const { attended } = req.body;
        const clubId = await verifyEventOwnership(req.user.id, eventId);
        if (!clubId) {
            return res.status(403).json({ success: false, error: 'Not authorized to manage this event' });
        }

        if (typeof attended !== 'boolean') {
            return res.status(400).json({ success: false, error: 'attended must be boolean' });
        }

        const [result] = await pool.execute(
            `UPDATE event_registrations SET attended = ? WHERE id = ? AND event_id = ?`,
            [attended, registrationId, eventId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Registration not found' });
        }

        res.json({ success: true, message: 'Attendance updated' });
    } catch (error) {
        console.error('Error updating attendance:', error);
        res.status(500).json({ success: false, error: 'Failed to update attendance' });
    }
});

// Get winners for an event (club head or public)
router.get('/events/:eventId/winners', async (req, res) => {
    try {
        const { eventId } = req.params;
        // Ensure table exists
        await pool.execute(`CREATE TABLE IF NOT EXISTS event_winners (
            id INT AUTO_INCREMENT PRIMARY KEY,
            event_id INT NOT NULL,
            student_id INT NOT NULL,
            position TINYINT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_event_position (event_id, position),
            KEY idx_event (event_id)
        ) ENGINE=InnoDB`);

        const [rows] = await pool.execute(
            `SELECT ew.id, ew.event_id, ew.student_id, ew.position, s.name AS student_name, s.student_id AS roll_number, s.email
             FROM event_winners ew
             JOIN students s ON s.id = ew.student_id
             WHERE ew.event_id = ?
             ORDER BY ew.position ASC`,
            [eventId]
        );
        res.json({ success: true, winners: rows });
    } catch (error) {
        console.error('Error fetching winners:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch winners' });
    }
});

// Save winners for an event (club head only)
router.post('/events/:eventId/winners', authenticate, authorizeClubHead, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { eventId } = req.params;
        const { winners } = req.body; // [{student_id, position}, ...]
        const clubId = await verifyEventOwnership(req.user.id, eventId);
        if (!clubId) {
            connection.release();
            return res.status(403).json({ success: false, error: 'Not authorized to manage this event' });
        }

        if (!Array.isArray(winners)) {
            connection.release();
            return res.status(400).json({ success: false, error: 'winners must be an array' });
        }

        await connection.beginTransaction();
        await connection.execute(`CREATE TABLE IF NOT EXISTS event_winners (
            id INT AUTO_INCREMENT PRIMARY KEY,
            event_id INT NOT NULL,
            student_id INT NOT NULL,
            position TINYINT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_event_position (event_id, position),
            KEY idx_event (event_id)
        ) ENGINE=InnoDB`);

        // Remove existing winners for event
        await connection.execute('DELETE FROM event_winners WHERE event_id = ?', [eventId]);

        // Insert new winners
        for (const w of winners) {
            if (!w || !w.student_id || !w.position) continue;
            await connection.execute(
                `INSERT INTO event_winners (event_id, student_id, position) VALUES (?, ?, ?)`,
                [eventId, w.student_id, w.position]
            );
        }

        await connection.commit();
        connection.release();
        res.json({ success: true, message: 'Winners saved' });
    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error('Error saving winners:', error);
        res.status(500).json({ success: false, error: 'Failed to save winners' });
    }
});