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
                c.faculty_coordinator_id,
                c.campus_id,
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
        const { name, description, faculty_coordinator_id, campus_id } = req.body;

        console.log('Update club request:', { id, name, description, faculty_coordinator_id, campus_id });

        // Validation
        if (!name || !description || !campus_id) {
            console.log('Validation failed:', { name: !!name, description: !!description, campus_id: !!campus_id });
            return res.status(400).json({
                success: false,
                error: 'Name, description, and campus_id are required'
            });
        }

        // Check if club exists
        const [existingClub] = await pool.execute(
            'SELECT * FROM clubs WHERE id = ?',
            [id]
        );

        if (existingClub.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Club not found'
            });
        }

        // Check if name is already taken by another club
        const [nameCheck] = await pool.execute(
            'SELECT id FROM clubs WHERE name = ? AND id != ? AND is_active = TRUE',
            [name, id]
        );

        if (nameCheck.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Club name already exists'
            });
        }

        // Verify campus exists
        const [campus] = await pool.execute('SELECT id FROM campus WHERE id = ?', [campus_id]);
        if (campus.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid campus ID'
            });
        }

        // Verify faculty coordinator if provided
        if (faculty_coordinator_id) {
            const [faculty] = await pool.execute('SELECT id FROM faculty_admin WHERE id = ?', [faculty_coordinator_id]);
            if (faculty.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid faculty coordinator ID'
                });
            }
        }

        // Update club
        const [updateResult] = await pool.execute(
            `UPDATE clubs SET 
                name = ?, 
                description = ?, 
                faculty_coordinator_id = ?, 
                campus_id = ?, 
                updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [name, description, faculty_coordinator_id || null, campus_id, id]
        );

        console.log('Update result:', updateResult);

        if (updateResult.affectedRows === 0) {
            console.log('No rows were updated for club ID:', id);
            return res.status(404).json({
                success: false,
                error: 'Club not found or no changes made'
            });
        }

        // Log the action (skip for now to isolate issues)
        try {
            await pool.execute(
                `INSERT INTO admin_audit_log (admin_id, action_type, target_type, target_id, description)
                 VALUES (?, 'OTHER', 'CLUB', ?, ?)`,
                [req.user.id, id, `Updated club: ${name}`]
            );
        } catch (auditError) {
            console.log('Audit log error (non-critical):', auditError.message);
        }

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

// Get available faculty coordinators
router.get('/faculty', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const [faculty] = await pool.execute(
            `SELECT id, name, email, department, designation 
             FROM faculty_admin 
             WHERE user_role_id = 3 AND is_active = TRUE 
             ORDER BY name ASC`
        );

        res.json({
            success: true,
            faculty
        });
    } catch (error) {
        console.error('Error fetching faculty:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch faculty list'
        });
    }
});

// Get available campuses
router.get('/campuses', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const [campuses] = await pool.execute(
            `SELECT id, name, location 
             FROM campus 
             ORDER BY name ASC`
        );

        res.json({
            success: true,
            campuses
        });
    } catch (error) {
        console.error('Error fetching campuses:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch campus list'
        });
    }
});

// Get club members (admin access)
router.get('/clubs/:id/members', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('Get members request for club ID:', id);
        
        // Check if club exists
        const [club] = await pool.execute(
            'SELECT id, name FROM clubs WHERE id = ? AND is_active = TRUE',
            [id]
        );

        console.log('Club check result:', club.length, club[0]);

        if (club.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Club not found'
            });
        }

        const [members] = await pool.execute(
            `SELECT 
                cm.id,
                s.id as student_db_id,
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
            [id]
        );

        console.log('Members query result:', members.length, 'members found');
        console.log('First few members:', members.slice(0, 3));
        
        // Also check raw memberships for debugging
        const [rawMemberships] = await pool.execute(
            'SELECT * FROM club_memberships WHERE club_id = ?',
            [id]
        );
        console.log('Raw memberships (including inactive):', rawMemberships.length);
        
        // Check if students table has data
        const [studentCount] = await pool.execute('SELECT COUNT(*) as count FROM students');
        console.log('Total students in database:', studentCount[0].count);
        
        res.json({
            success: true,
            count: members.length,
            members,
            club: club[0]
        });
    } catch (error) {
        console.error('Error fetching club members:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch club members'
        });
    }
});

// Remove club member (admin access)
router.delete('/clubs/:clubId/members/:memberId', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const { clubId, memberId } = req.params;
        
        console.log('Remove member request:', { clubId, memberId });
        
        // First check if the club exists
        const [clubCheck] = await pool.execute(
            'SELECT id, name FROM clubs WHERE id = ? AND is_active = TRUE',
            [clubId]
        );

        if (clubCheck.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Club not found'
            });
        }

        // Check if membership exists (more comprehensive check)
        const [membership] = await pool.execute(
            `SELECT cm.*, s.name as student_name, c.name as club_name
             FROM club_memberships cm
             JOIN students s ON cm.student_id = s.id
             JOIN clubs c ON cm.club_id = c.id
             WHERE cm.id = ? AND cm.club_id = ? AND cm.is_active = TRUE`,
            [memberId, clubId]
        );

        console.log('Membership query result:', membership.length, membership[0]);

        if (membership.length === 0) {
            // Provide more detailed error info
            const [allMemberships] = await pool.execute(
                `SELECT cm.id, cm.role, s.name as student_name 
                 FROM club_memberships cm 
                 JOIN students s ON cm.student_id = s.id 
                 WHERE cm.club_id = ? AND cm.is_active = TRUE`,
                [clubId]
            );
            
            console.log('Available memberships in club:', allMemberships);
            
            return res.status(404).json({
                success: false,
                error: 'Membership not found',
                availableMemberIds: allMemberships.map(m => m.id),
                clubId: clubId,
                requestedMemberId: memberId
            });
        }

        // Prevent removing club heads (but allow admin override)
        if (membership[0].role === 'Head') {
            console.log('Attempting to remove club head');
            // Admin can remove heads, but we'll warn them
            return res.status(403).json({
                success: false,
                error: 'Cannot remove club head. Please assign a new head first, or use force removal if needed.'
            });
        }

        // Remove membership (soft delete)
        const [removeResult] = await pool.execute(
            'UPDATE club_memberships SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [memberId]
        );

        console.log('Remove result:', removeResult);

        if (removeResult.affectedRows === 0) {
            return res.status(500).json({
                success: false,
                error: 'Failed to remove member - no rows affected'
            });
        }

        // Log the action (skip for now to isolate issues)
        try {
            await pool.execute(
                `INSERT INTO admin_audit_log (admin_id, action_type, target_type, target_id, description)
                 VALUES (?, 'OTHER', 'OTHER', ?, ?)`,
                [req.user.id, memberId, `Removed ${membership[0].student_name} from ${membership[0].club_name}`]
            );
        } catch (auditError) {
            console.log('Audit log error (non-critical):', auditError.message);
        }

        res.json({
            success: true,
            message: `Successfully removed ${membership[0].student_name} from ${membership[0].club_name}`,
            removedMember: {
                name: membership[0].student_name,
                club: membership[0].club_name
            }
        });
    } catch (error) {
        console.error('Error removing club member:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to remove club member'
        });
    }
});

// Debug endpoint to check database state
router.get('/debug/database-state', authenticate, authorizeAdmin, async (req, res) => {
    try {
        // Check clubs
        const [clubs] = await pool.execute('SELECT id, name FROM clubs LIMIT 5');
        
        // Check students  
        const [students] = await pool.execute('SELECT id, student_id, name, email FROM students LIMIT 5');
        
        // Check memberships
        const [memberships] = await pool.execute(`
            SELECT cm.*, s.name as student_name, c.name as club_name 
            FROM club_memberships cm 
            LEFT JOIN students s ON cm.student_id = s.id 
            LEFT JOIN clubs c ON cm.club_id = c.id 
            LIMIT 10
        `);
        
        res.json({
            success: true,
            data: {
                clubs: clubs.length,
                students: students.length,  
                memberships: memberships.length,
                sampleClubs: clubs,
                sampleStudents: students,
                sampleMemberships: memberships
            }
        });
    } catch (error) {
        console.error('Debug endpoint error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Create test members for clubs (admin only)
router.post('/debug/create-test-members', authenticate, authorizeAdmin, async (req, res) => {
    try {
        // First, let's check if students exist and create some if needed
        const [existingStudents] = await pool.execute('SELECT COUNT(*) as count FROM students');
        
        if (existingStudents[0].count < 5) {
            // Create some test students
            const testStudents = [
                { student_id: 'STU001', name: 'Alice Johnson', email: 'alice.johnson@university.edu', password: 'password123' },
                { student_id: 'STU002', name: 'Bob Smith', email: 'bob.smith@university.edu', password: 'password123' },
                { student_id: 'STU003', name: 'Charlie Brown', email: 'charlie.brown@university.edu', password: 'password123' },
                { student_id: 'STU004', name: 'Diana Prince', email: 'diana.prince@university.edu', password: 'password123' },
                { student_id: 'STU005', name: 'Eve Wilson', email: 'eve.wilson@university.edu', password: 'password123' }
            ];

            for (const student of testStudents) {
                await pool.execute(
                    `INSERT IGNORE INTO students (student_id, name, email, password, campus_id) 
                     VALUES (?, ?, ?, ?, 1)`,
                    [student.student_id, student.name, student.email, student.password]
                );
            }
        }

        // Get students for membership creation
        const [students] = await pool.execute('SELECT id, name FROM students LIMIT 5');
        const [clubs] = await pool.execute('SELECT id, name FROM clubs WHERE is_active = TRUE LIMIT 3');

        let membersCreated = 0;

        // Create memberships for each club
        for (const club of clubs) {
            for (let i = 0; i < Math.min(3, students.length); i++) {
                const student = students[i];
                
                // Check if membership already exists
                const [existing] = await pool.execute(
                    'SELECT id FROM club_memberships WHERE student_id = ? AND club_id = ?',
                    [student.id, club.id]
                );

                if (existing.length === 0) {
                    await pool.execute(
                        `INSERT INTO club_memberships (student_id, club_id, role, is_active) 
                         VALUES (?, ?, 'Member', TRUE)`,
                        [student.id, club.id]
                    );
                    membersCreated++;
                }
            }
        }

        res.json({
            success: true,
            message: `Created ${membersCreated} test memberships`,
            studentsAvailable: students.length,
            clubsAvailable: clubs.length
        });

    } catch (error) {
        console.error('Error creating test members:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Force remove any member (including heads) - Admin ultimate power
router.delete('/clubs/:clubId/members/:memberId/force', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const { clubId, memberId } = req.params;
        
        console.log('Force remove member request:', { clubId, memberId });
        
        // Get membership info before removal
        const [membership] = await pool.execute(
            `SELECT cm.*, s.name as student_name, c.name as club_name
             FROM club_memberships cm
             JOIN students s ON cm.student_id = s.id
             JOIN clubs c ON cm.club_id = c.id
             WHERE cm.id = ? AND cm.club_id = ? AND cm.is_active = TRUE`,
            [memberId, clubId]
        );

        if (membership.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Membership not found'
            });
        }

        // Force remove (even heads)
        const [removeResult] = await pool.execute(
            'UPDATE club_memberships SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [memberId]
        );

        // Log the action
        try {
            await pool.execute(
                `INSERT INTO admin_audit_log (admin_id, action_type, target_type, target_id, description)
                 VALUES (?, 'OTHER', 'OTHER', ?, ?)`,
                [req.user.id, memberId, `FORCE REMOVED ${membership[0].student_name} (${membership[0].role}) from ${membership[0].club_name}`]
            );
        } catch (auditError) {
            console.log('Audit log error (non-critical):', auditError.message);
        }

        res.json({
            success: true,
            message: `Successfully force removed ${membership[0].student_name} (${membership[0].role}) from ${membership[0].club_name}`,
            removedMember: {
                name: membership[0].student_name,
                role: membership[0].role,
                club: membership[0].club_name
            }
        });
    } catch (error) {
        console.error('Error force removing member:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to force remove member'
        });
    }
});

// Populate sample data endpoint (for development)
router.post('/populate-sample-data', async (req, res) => {
    try {
        // Insert sample campus data
        await pool.execute(`
            INSERT IGNORE INTO campus (id, name, location, contact_person, contact_email, is_active) VALUES
            (1, 'Main Campus', '123 University Ave, City, State 12345', 'Campus Director', 'campus@university.edu', TRUE),
            (2, 'North Campus', '456 College St, City, State 12346', 'North Director', 'north@university.edu', TRUE)
        `);

        // Insert sample venues
        await pool.execute(`
            INSERT IGNORE INTO venues (name, type, capacity, equipment, campus_id, is_active) VALUES
            ('Main Auditorium', 'Auditorium', 500, 'Projector, Sound System, Stage Lighting', 1, TRUE),
            ('Conference Hall A', 'Hall', 100, 'Projector, Whiteboard, AC', 1, TRUE),
            ('Conference Hall B', 'Hall', 80, 'Projector, Whiteboard, AC', 1, TRUE),
            ('Computer Lab 1', 'Laboratory', 40, '40 PCs, Projector, AC', 1, TRUE),
            ('Seminar Room 101', 'Classroom', 50, 'Projector, Whiteboard, AC', 1, TRUE),
            ('Sports Ground', 'Ground', 200, 'Open field, Lighting', 1, TRUE),
            ('Library Hall', 'Hall', 150, 'Projector, Sound System, AC', 1, TRUE),
            ('North Auditorium', 'Auditorium', 300, 'Projector, Sound System, Stage', 2, TRUE),
            ('Meeting Room 201', 'Classroom', 30, 'Projector, Whiteboard, AC', 2, TRUE),
            ('Innovation Lab', 'Laboratory', 25, 'Smart Boards, Computers, AC', 2, TRUE)
        `);

        res.json({
            success: true,
            message: 'Sample data populated successfully'
        });
    } catch (error) {
        console.error('Error populating sample data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to populate sample data'
        });
    }
});

// ============================================================================
// TRIGGER DEMO: Get audit log showing trigger-generated entries
// ============================================================================
router.get('/audit-log', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const [auditLogs] = await pool.execute(
            `SELECT 
                aal.id,
                aal.admin_id,
                aal.action_type,
                aal.target_type,
                aal.target_id,
                aal.description,
                aal.created_at,
                e.name as event_name,
                fa.name as admin_name
            FROM admin_audit_log aal
            LEFT JOIN events e ON aal.target_type = 'EVENT' AND aal.target_id = e.id
            LEFT JOIN faculty_admin fa ON aal.admin_id = fa.id
            WHERE aal.action_type IN ('APPROVE_EVENT', 'REJECT_EVENT')
            ORDER BY aal.created_at DESC
            LIMIT 50`
        );

        res.json({
            success: true,
            count: auditLogs.length,
            auditLogs,
            message: 'These entries were automatically created by the database trigger when event status changed'
        });
    } catch (error) {
        console.error('Error fetching audit log:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch audit log'
        });
    }
});

// ============================================================================
// TRIGGER DEMO: Get registration activity log showing trigger-maintained counts
// ============================================================================
router.get('/registration-activity', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const [activities] = await pool.execute(
            `SELECT 
                ral.id,
                ral.event_id,
                ral.student_id,
                ral.action_type,
                ral.old_count,
                ral.new_count,
                ral.capacity,
                ral.activity_timestamp,
                ral.trigger_name,
                e.name as event_name,
                e.current_registrations,
                e.max_participants,
                s.name as student_name,
                s.student_id as student_roll
            FROM registration_activity_log ral
            LEFT JOIN events e ON ral.event_id = e.id
            LEFT JOIN students s ON ral.student_id = s.id
            ORDER BY ral.activity_timestamp DESC
            LIMIT 100`
        );

        res.json({
            success: true,
            count: activities.length,
            activities,
            message: 'These counts were automatically updated by database triggers when students registered/cancelled'
        });
    } catch (error) {
        console.error('Error fetching registration activity:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch registration activity'
        });
    }
});

// Get event statistics with trigger-maintained counts
router.get('/event-statistics', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const [stats] = await pool.execute(
            `SELECT 
                e.id,
                e.name,
                e.event_date,
                e.status,
                e.max_participants,
                e.current_registrations,
                e.last_registration_update,
                CASE 
                    WHEN e.max_participants > 0 
                    THEN ROUND((e.current_registrations / e.max_participants) * 100, 1)
                    ELSE 0
                END as fill_percentage,
                CASE
                    WHEN e.current_registrations >= e.max_participants THEN 'FULL'
                    WHEN e.current_registrations >= e.max_participants * 0.8 THEN 'ALMOST_FULL'
                    WHEN e.current_registrations >= e.max_participants * 0.5 THEN 'HALF_FULL'
                    ELSE 'AVAILABLE'
                END as capacity_status,
                c.name as club_name
            FROM events e
            LEFT JOIN clubs c ON e.organized_by_club_id = c.id
            WHERE e.status = 'Approved' 
            AND e.event_date >= CURDATE()
            AND e.max_participants > 0
            ORDER BY e.event_date ASC, e.current_registrations DESC
            LIMIT 50`
        );

        res.json({
            success: true,
            count: stats.length,
            stats,
            message: 'Registration counts are automatically maintained by database triggers'
        });
    } catch (error) {
        console.error('Error fetching event statistics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch event statistics'
        });
    }
});

// Stored Procedure: Get Event Summary
router.get('/procedure/event-summary/:eventId', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const eventId = parseInt(req.params.eventId);
        
        if (isNaN(eventId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid event ID'
            });
        }

        const [results] = await pool.execute('CALL get_event_summary(?)', [eventId]);
        
        if (!results[0] || results[0].length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Event not found'
            });
        }

        res.json({
            success: true,
            data: results[0][0],
            message: 'Event summary fetched using stored procedure'
        });
    } catch (error) {
        console.error('Error executing event summary procedure:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch event summary'
        });
    }
});

// Nested Query: Get Highly Active Students (students with above-average event registrations)
router.get('/nested-query/active-students', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const [results] = await pool.execute(`
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
            ORDER BY total_events_registered DESC, events_attended DESC
        `);

        res.json({
            success: true,
            count: results.length,
            students: results,
            message: 'Highly active students fetched using nested subquery (students with above-average event registrations)'
        });
    } catch (error) {
        console.error('Error executing nested query:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch active students'
        });
    }
});

// JOIN Query Demo: Get Complete Event Details with Multiple JOINs
router.get('/join-query/event-details', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const [events] = await pool.execute(`
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
            GROUP BY e.id, e.name, e.description, e.event_date, e.start_time, e.end_time, 
                     e.event_type, e.status, e.max_participants, e.registration_required, 
                     e.registration_deadline, c.id, c.name, c.description, v.id, v.name, 
                     v.type, v.capacity, v.equipment, campus.id, campus.name, campus.location,
                     vb.id, vb.start_time, vb.end_time, vb.status
            ORDER BY e.event_date ASC, e.start_time ASC
        `);

        res.json({
            success: true,
            count: events.length,
            events,
            message: 'Event details fetched using multiple JOINs (5 tables: events, clubs, venues, campus, registrations)'
        });
    } catch (error) {
        console.error('Error executing JOIN query:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch event details'
        });
    }
});

// Aggregate Query Demo: Get Club Event Statistics with Multiple Aggregate Functions
router.get('/aggregate-query/club-stats', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const [clubStats] = await pool.execute(`
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
            ORDER BY total_events DESC, total_registrations DESC
        `);

        res.json({
            success: true,
            count: clubStats.length,
            clubs: clubStats,
            message: 'Club statistics using aggregate functions: COUNT, AVG, MAX, MIN, SUM with GROUP BY and HAVING'
        });
    } catch (error) {
        console.error('Error executing aggregate query:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch club statistics'
        });
    }
});

module.exports = router;