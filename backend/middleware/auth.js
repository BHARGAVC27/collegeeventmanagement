const jwt = require('jsonwebtoken');
const { pool } = require('../db/dbConnect');

// JWT secret - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Generate JWT token
const generateToken = (user, userType) => {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email, 
            userType: userType, // 'student', 'faculty', 'admin'
            role: user.role_name || userType 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
};

// Verify JWT token
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

// Middleware to authenticate any user
const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Access denied. No token provided.'
            });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({
                success: false,
                error: 'Invalid token.'
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication failed'
        });
    }
};

// Middleware to authorize based on user roles
const authorize = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const userRole = req.user.role || req.user.userType;
        
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Insufficient permissions.'
            });
        }

        next();
    };
};

// Middleware specifically for students
const authorizeStudent = authorize(['student', 'club_head']);

// Middleware specifically for club heads
const authorizeClubHead = authorize(['club_head']);

// Middleware specifically for faculty
const authorizeFaculty = authorize(['faculty', 'admin']);

// Middleware specifically for admins
const authorizeAdmin = authorize(['admin']);

// Middleware for club heads to access only their club's resources
const authorizeClubOwnership = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'club_head') {
            return res.status(403).json({
                success: false,
                error: 'Only club heads can perform this action'
            });
        }

        const clubId = req.params.clubId || req.body.clubId;
        if (!clubId) {
            return res.status(400).json({
                success: false,
                error: 'Club ID is required'
            });
        }

        // Check if the user is the head of this club
        const [memberships] = await pool.execute(
            `SELECT cm.*, c.name as club_name 
             FROM club_memberships cm 
             JOIN clubs c ON cm.club_id = c.id 
             WHERE cm.student_id = ? AND cm.club_id = ? AND cm.role = 'Head' AND cm.is_active = TRUE`,
            [req.user.id, clubId]
        );

        if (memberships.length === 0) {
            return res.status(403).json({
                success: false,
                error: 'You are not authorized to manage this club'
            });
        }

        req.clubMembership = memberships[0];
        next();
    } catch (error) {
        console.error('Club ownership authorization error:', error);
        res.status(500).json({
            success: false,
            error: 'Authorization failed'
        });
    }
};

// Helper function to get user details by email and type
const getUserByEmail = async (email, userType) => {
    try {
        let query, params;
        
        if (userType === 'admin' || userType === 'faculty') {
            query = `
                SELECT fa.*, ur.role_name 
                FROM faculty_admin fa 
                JOIN user_roles ur ON fa.user_role_id = ur.id 
                WHERE fa.email = ? AND fa.is_active = TRUE
            `;
            params = [email];
        } else {
            query = `
                SELECT s.*, ur.role_name 
                FROM students s 
                JOIN user_roles ur ON s.user_role_id = ur.id 
                WHERE s.email = ? AND s.is_active = TRUE
            `;
            params = [email];
        }

        const [users] = await pool.execute(query, params);
        return users.length > 0 ? users[0] : null;
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
};

// Helper function to check if user has specific permission
const hasPermission = async (userId, userType, permission) => {
    // Define permissions based on roles
    const permissions = {
        student: ['register_event', 'cancel_registration', 'view_events'],
        club_head: ['create_event', 'delete_event', 'manage_club_members', 'register_event', 'cancel_registration', 'view_events'],
        faculty: ['coordinate_club', 'view_events', 'approve_minor_events'],
        admin: ['create_club', 'delete_club', 'approve_event', 'reject_event', 'manage_all_users', 'manage_venues']
    };

    const userPermissions = permissions[userType] || [];
    return userPermissions.includes(permission);
};

module.exports = {
    generateToken,
    verifyToken,
    authenticate,
    authorize,
    authorizeStudent,
    authorizeClubHead,
    authorizeFaculty,
    authorizeAdmin,
    authorizeClubOwnership,
    getUserByEmail,
    hasPermission
};