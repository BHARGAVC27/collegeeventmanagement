const express = require('express');
const { pool } = require('../db/dbConnect');
const { authenticate, authorizeAdmin, authorizeFaculty } = require('../middleware/auth');

const router = express.Router();

// Get all clubs (admin view with detailed info)
router.get('/clubs', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const [clubs] = await pool.execute(
            `SELECT 
                c.id,
                c.name,
                c.description,
                c.approval_status,
                c.is_active,
                c.created_at,
                campus.name as campus_name,
                fc.name as faculty_coordinator_name,
                fc.email as faculty_coordinator_email,
                admin_creator.name as created_by_admin,
                admin_approver.name as approved_by_admin,
                COUNT(DISTINCT cm.student_id) as member_count,
                COUNT(DISTINCT e.id) as event_count
            FROM clubs c
            JOIN campus ON c.campus_id = campus.id
            LEFT JOIN faculty_admin fc ON c.faculty_coordinator_id = fc.id
            LEFT JOIN faculty_admin admin_creator ON c.created_by_admin_id = admin_creator.id
            LEFT JOIN faculty_admin admin_approver ON c.approved_by_admin_id = admin_approver.id
            LEFT JOIN club_memberships cm ON c.id = cm.club_id AND cm.is_active = TRUE
            LEFT JOIN events e ON c.id = e.organized_by_club_id
            GROUP BY c.id
            ORDER BY c.created_at DESC`
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

// Create new club (admin only)
router.post('/clubs', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const { name, description, faculty_coordinator_id, campus_id } = req.body;

        if (!name || !campus_id) {
            return res.status(400).json({
                success: false,
                error: 'Club name and campus ID are required'
            });
        }

        // Check if club name already exists in the same campus
        const [existingClubs] = await pool.execute(
            'SELECT id FROM clubs WHERE name = ? AND campus_id = ?',
            [name, campus_id]
        );

        if (existingClubs.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Club with this name already exists in the selected campus'
            });
        }

        // Verify faculty coordinator exists if provided
        if (faculty_coordinator_id) {
            const [faculty] = await pool.execute(
                'SELECT id FROM faculty_admin WHERE id = ? AND is_active = TRUE',
                [faculty_coordinator_id]
            );

            if (faculty.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid faculty coordinator ID'
                });
            }
        }

        const [result] = await pool.execute(
            `INSERT INTO clubs (name, description, faculty_coordinator_id, campus_id, created_by_admin_id, approved_by_admin_id, approval_status) 
             VALUES (?, ?, ?, ?, ?, ?, 'Approved')`,
            [name, description, faculty_coordinator_id, campus_id, req.user.id, req.user.id]
        );

        // Log the action
        await pool.execute(
            `INSERT INTO admin_audit_log (admin_id, action_type, target_type, target_id, description)
             VALUES (?, 'CREATE_CLUB', 'CLUB', ?, ?)`,
            [req.user.id, result.insertId, `Created club: ${name}`]
        );

        // Get the created club with details
        const [newClub] = await pool.execute(
            `SELECT 
                c.*,
                campus.name as campus_name,
                fc.name as faculty_coordinator_name
            FROM clubs c
            JOIN campus ON c.campus_id = campus.id
            LEFT JOIN faculty_admin fc ON c.faculty_coordinator_id = fc.id
            WHERE c.id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Club created successfully',
            club: newClub[0]
        });
    } catch (error) {
        console.error('Error creating club:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create club'
        });
    }
});

// Update club (admin only)
router.put('/clubs/:id', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, faculty_coordinator_id, is_active } = req.body;

        // Build dynamic update query
        const updateFields = [];
        const updateValues = [];

        if (name !== undefined) {
            updateFields.push('name = ?');
            updateValues.push(name);
        }
        if (description !== undefined) {
            updateFields.push('description = ?');
            updateValues.push(description);
        }
        if (faculty_coordinator_id !== undefined) {
            updateFields.push('faculty_coordinator_id = ?');
            updateValues.push(faculty_coordinator_id);
        }
        if (is_active !== undefined) {
            updateFields.push('is_active = ?');
            updateValues.push(is_active);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No fields to update'
            });
        }

        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(id);

        const [result] = await pool.execute(
            `UPDATE clubs SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Club not found'
            });
        }

        // Log the action
        await pool.execute(
            `INSERT INTO admin_audit_log (admin_id, action_type, target_type, target_id, description)
             VALUES (?, 'UPDATE_CLUB', 'CLUB', ?, ?)`,
            [req.user.id, id, 'Updated club information']
        );

        res.json({
            success: true,
            message: 'Club updated successfully'
        });
    } catch (error) {
        console.error('Error updating club:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update club'
        });
    }
});

// Delete club (admin only)
router.delete('/clubs/:id', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if club has active events
        const [activeEvents] = await pool.execute(
            `SELECT COUNT(*) as count FROM events 
             WHERE organized_by_club_id = ? AND status IN ('Approved', 'Pending_Approval') AND event_date >= CURDATE()`,
            [id]
        );

        if (activeEvents[0].count > 0) {
            return res.status(409).json({
                success: false,
                error: 'Cannot delete club with active or upcoming events'
            });
        }

        // Get club name for logging
        const [club] = await pool.execute('SELECT name FROM clubs WHERE id = ?', [id]);
        if (club.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Club not found'
            });
        }

        // Soft delete by setting is_active to false
        const [result] = await pool.execute(
            'UPDATE clubs SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );

        // Log the action
        await pool.execute(
            `INSERT INTO admin_audit_log (admin_id, action_type, target_type, target_id, description)
             VALUES (?, 'DELETE_CLUB', 'CLUB', ?, ?)`,
            [req.user.id, id, `Deleted club: ${club[0].name}`]
        );

        res.json({
            success: true,
            message: 'Club deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting club:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete club'
        });
    }
});

// Get club members (admin only)
router.get('/clubs/:id/members', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const [members] = await pool.execute(
            `SELECT 
                s.id,
                s.student_id,
                s.name,
                s.email,
                s.phone,
                s.branch,
                s.year_of_study,
                cm.role,
                cm.join_date,
                cm.is_active
            FROM club_memberships cm
            JOIN students s ON cm.student_id = s.id
            WHERE cm.club_id = ?
            ORDER BY 
                CASE cm.role 
                    WHEN 'Head' THEN 1 
                    WHEN 'Member' THEN 2 
                END,
                cm.join_date ASC`,
            [id]
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

// Assign club head (admin only)
router.post('/clubs/:id/assign-head', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const { id: clubId } = req.params;
        const { student_id } = req.body;

        if (!student_id) {
            return res.status(400).json({
                success: false,
                error: 'Student ID is required'
            });
        }

        // Check if student exists and is a member of the club
        const [studentMembership] = await pool.execute(
            `SELECT cm.*, s.name as student_name 
             FROM club_memberships cm 
             JOIN students s ON cm.student_id = s.id 
             WHERE cm.student_id = ? AND cm.club_id = ? AND cm.is_active = TRUE`,
            [student_id, clubId]
        );

        if (studentMembership.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Student is not an active member of this club'
            });
        }

        // Remove existing head role from any current head
        await pool.execute(
            `UPDATE club_memberships 
             SET role = 'Member' 
             WHERE club_id = ? AND role = 'Head' AND is_active = TRUE`,
            [clubId]
        );

        // Assign new head
        await pool.execute(
            `UPDATE club_memberships 
             SET role = 'Head', approved_by_admin_id = ?
             WHERE student_id = ? AND club_id = ? AND is_active = TRUE`,
            [req.user.id, student_id, clubId]
        );

        // Update student role to club_head
        await pool.execute(
            'UPDATE students SET user_role_id = 2 WHERE id = ?',
            [student_id]
        );

        // Log the action
        await pool.execute(
            `INSERT INTO admin_audit_log (admin_id, action_type, target_type, target_id, description)
             VALUES (?, 'ASSIGN_CLUB_HEAD', 'CLUB', ?, ?)`,
            [req.user.id, clubId, `Assigned ${studentMembership[0].student_name} as club head`]
        );

        res.json({
            success: true,
            message: 'Club head assigned successfully'
        });
    } catch (error) {
        console.error('Error assigning club head:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to assign club head'
        });
    }
});

// Get admin dashboard stats
router.get('/dashboard/stats', authenticate, authorizeAdmin, async (req, res) => {
    try {
        // Get various statistics
        const [clubStats] = await pool.execute(
            `SELECT 
                COUNT(*) as total_clubs,
                COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_clubs,
                COUNT(CASE WHEN approval_status = 'Pending' THEN 1 END) as pending_clubs
             FROM clubs`
        );

        const [eventStats] = await pool.execute(
            `SELECT 
                COUNT(*) as total_events,
                COUNT(CASE WHEN status = 'Pending_Approval' THEN 1 END) as pending_events,
                COUNT(CASE WHEN status = 'Approved' AND event_date >= CURDATE() THEN 1 END) as upcoming_events,
                COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_events
             FROM events`
        );

        const [userStats] = await pool.execute(
            `SELECT 
                COUNT(*) as total_students,
                COUNT(CASE WHEN ur.role_name = 'club_head' THEN 1 END) as club_heads
             FROM students s
             JOIN user_roles ur ON s.user_role_id = ur.id
             WHERE s.is_active = TRUE`
        );

        const [venueStats] = await pool.execute(
            `SELECT 
                COUNT(*) as total_venues,
                COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_venues
             FROM venues`
        );

        res.json({
            success: true,
            stats: {
                clubs: clubStats[0],
                events: eventStats[0],
                users: userStats[0],
                venues: venueStats[0]
            }
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard statistics'
        });
    }
});

module.exports = router;