const express = require('express');
const { pool } = require('../db/dbConnect');
const { authenticate, authorizeClubHead } = require('../middleware/auth');

const router = express.Router();

// Get all clubs with member count and head info
router.get('/clubs', async (req, res) => {
    try {
        const [clubs] = await pool.execute(
            `SELECT 
                c.id,
                c.name,
                c.description,
                c.faculty_coordinator_id,
                fa.name as faculty_coordinator,
                c.is_active,
                COUNT(DISTINCT cm.id) as member_count,
                s.id as club_head_id,
                s.name as head_name,
                s.email as head_email
            FROM clubs c
            LEFT JOIN faculty_admin fa ON c.faculty_coordinator_id = fa.id
            LEFT JOIN club_memberships cm ON c.id = cm.club_id AND cm.is_active = TRUE
            LEFT JOIN club_memberships head_cm ON c.id = head_cm.club_id AND head_cm.role = 'Head' AND head_cm.is_active = TRUE
            LEFT JOIN students s ON head_cm.student_id = s.id
            WHERE c.is_active = TRUE
            GROUP BY c.id, fa.name, s.id, s.name, s.email
            ORDER BY c.name ASC`
        );
        
        res.json({
            success: true,
            count: clubs.length,
            clubs
        });
    } catch (error) {
        console.error('Error fetching clubs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch clubs'
        });
    }
});

// Get club managed by the authenticated club head
router.get('/clubs/head/:headId', authenticate, authorizeClubHead, async (req, res) => {
    try {
        const { headId } = req.params;

        // Ensure the authenticated club head is requesting their own data
        if (parseInt(headId, 10) !== parseInt(req.user.id, 10)) {
            return res.status(403).json({
                success: false,
                error: 'You are not authorized to access this club information'
            });
        }

        const [clubs] = await pool.execute(
            `SELECT 
                c.id,
                c.name,
                c.description,
                c.faculty_coordinator_id,
                fa.name AS faculty_coordinator,
                c.is_active,
                c.campus_id,
                campus.name AS campus_name,
                campus.location AS campus_location,
                cm.join_date AS head_since,
                head.name AS head_name,
                head.email AS head_email,
                head.student_id AS head_student_id,
                COUNT(DISTINCT members.id) AS member_count
            FROM club_memberships cm
            JOIN clubs c ON cm.club_id = c.id
            JOIN students head ON cm.student_id = head.id
            LEFT JOIN faculty_admin fa ON c.faculty_coordinator_id = fa.id
            LEFT JOIN campus ON c.campus_id = campus.id
            LEFT JOIN club_memberships members ON members.club_id = c.id AND members.is_active = TRUE
            WHERE cm.student_id = ? AND cm.role = 'Head' AND cm.is_active = TRUE
            GROUP BY c.id, fa.name, campus.name, campus.location, cm.join_date, head.name, head.email, head.student_id`,
            [headId]
        );

        if (clubs.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No club found for this club head'
            });
        }

        res.json({
            success: true,
            clubId: clubs[0].id,
            club: clubs[0]
        });
    } catch (error) {
        console.error('Error fetching club for head:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch club information'
        });
    }
});

router.get('/clubs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [clubs] = await pool.execute(
            `SELECT 
                c.id,
                c.name,
                c.description,
                c.faculty_coordinator_id,
                fa.name as faculty_coordinator,
                c.is_active,
                COUNT(DISTINCT cm.id) as member_count,
                s.id as club_head_id,
                s.name as head_name,
                s.email as head_email
            FROM clubs c
            LEFT JOIN faculty_admin fa ON c.faculty_coordinator_id = fa.id
            LEFT JOIN club_memberships cm ON c.id = cm.club_id AND cm.is_active = TRUE
            LEFT JOIN club_memberships head_cm ON c.id = head_cm.club_id AND head_cm.role = 'Head' AND head_cm.is_active = TRUE
            LEFT JOIN students s ON head_cm.student_id = s.id
            WHERE c.id = ?
            GROUP BY c.id, fa.name, s.id, s.name, s.email`,
            [id]
        );
        
        if (clubs.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Club not found'
            });
        }
        
        res.json({
            success: true,
            club: clubs[0]
        });
    } catch (error) {
        console.error('Error fetching club:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch club'
        });
    }
});

// Get club members
router.get('/clubs/:clubId/members', async (req, res) => {
    try {
        const { clubId } = req.params;
        
        const [members] = await pool.execute(
            `SELECT 
                s.id,
                s.student_id,
                s.name,
                s.email,
                cm.role,
                cm.join_date
            FROM club_memberships cm
            JOIN students s ON cm.student_id = s.id
            WHERE cm.club_id = ? AND cm.is_active = TRUE
            ORDER BY 
                CASE cm.role 
                    WHEN 'Head' THEN 1 
                    WHEN 'Member' THEN 2 
                END,
                cm.join_date ASC`,
            [clubId]
        );
        
        res.json({
            success: true,
            count: members.length,
            members
        });
    } catch (error) {
        console.error('Error fetching club members:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch club members'
        });
    }
});

// Get events for a specific club
router.get('/clubs/:clubId/events', async (req, res) => {
    try {
        const { clubId } = req.params;

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
                e.current_registrations,
                e.last_registration_update,
                COUNT(CASE WHEN er.registration_status = 'Registered' THEN 1 END) AS registered_count,
                COUNT(CASE WHEN er.registration_status = 'Waitlisted' THEN 1 END) AS waitlisted_count,
                COUNT(CASE WHEN er.registration_status = 'Cancelled' THEN 1 END) AS cancelled_count
            FROM events e
            LEFT JOIN event_registrations er ON e.id = er.event_id
            WHERE e.organized_by_club_id = ?
            GROUP BY e.id
            ORDER BY e.event_date DESC, e.start_time DESC`,
            [clubId]
        );

        res.json({
            success: true,
            count: events.length,
            events
        });
    } catch (error) {
        console.error('Error fetching club events:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch club events'
        });
    }
});

// Join a club
router.post('/clubs/:clubId/join', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { clubId } = req.params;
        const { email } = req.body;
        
        await connection.beginTransaction();
        
        // Get student by email
        const [students] = await connection.execute(
            'SELECT id FROM students WHERE email = ?',
            [email]
        );
        
        if (students.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                error: 'Student not found'
            });
        }
        
        const studentId = students[0].id;
        
        // Check if club exists
        const [clubs] = await connection.execute(
            'SELECT id, name FROM clubs WHERE id = ? AND is_active = TRUE',
            [clubId]
        );
        
        if (clubs.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                error: 'Club not found'
            });
        }
        
        // Check if already a member
        const [existingMembership] = await connection.execute(
            'SELECT id FROM club_memberships WHERE student_id = ? AND club_id = ? AND is_active = TRUE',
            [studentId, clubId]
        );
        
        if (existingMembership.length > 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                error: 'You are already a member of this club'
            });
        }
        
        // Add membership
        const [result] = await connection.execute(
            `INSERT INTO club_memberships (student_id, club_id, role) 
             VALUES (?, ?, 'Member')`,
            [studentId, clubId]
        );
        
        await connection.commit();
        
        res.json({
            success: true,
            message: `Successfully joined ${clubs[0].name}`,
            membership: {
                id: result.insertId,
                clubName: clubs[0].name
            }
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('Error joining club:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to join club'
        });
    } finally {
        connection.release();
    }
});

module.exports = router;
