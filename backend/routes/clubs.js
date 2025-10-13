const express = require('express');
const { pool } = require('../db/dbConnect');

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
                s.name as head_name,
                s.email as head_email
            FROM clubs c
            LEFT JOIN faculty_admin fa ON c.faculty_coordinator_id = fa.id
            LEFT JOIN club_memberships cm ON c.id = cm.club_id AND cm.is_active = TRUE
            LEFT JOIN club_memberships head_cm ON c.id = head_cm.club_id AND head_cm.role = 'Head' AND head_cm.is_active = TRUE
            LEFT JOIN students s ON head_cm.student_id = s.id
            WHERE c.is_active = TRUE
            GROUP BY c.id, fa.name, s.name, s.email
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

// Get club by ID
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
                s.name as head_name,
                s.email as head_email
            FROM clubs c
            LEFT JOIN faculty_admin fa ON c.faculty_coordinator_id = fa.id
            LEFT JOIN club_memberships cm ON c.id = cm.club_id AND cm.is_active = TRUE
            LEFT JOIN club_memberships head_cm ON c.id = head_cm.club_id AND head_cm.role = 'Head' AND head_cm.is_active = TRUE
            LEFT JOIN students s ON head_cm.student_id = s.id
            WHERE c.id = ?
            GROUP BY c.id, fa.name, s.name, s.email`,
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
