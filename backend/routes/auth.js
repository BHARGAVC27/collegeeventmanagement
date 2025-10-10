const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db/dbConnect');
const { generateToken, getUserByEmail } = require('../middleware/auth');

const router = express.Router();

// Student login
router.post('/student/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }

        const user = await getUserByEmail(email, 'student');
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        const token = generateToken(user, user.role_name);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                student_id: user.student_id,
                name: user.name,
                email: user.email,
                role: user.role_name,
                userType: 'student'
            }
        });
    } catch (error) {
        console.error('Student login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed'
        });
    }
});

// Admin/Faculty login
router.post('/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }

        const user = await getUserByEmail(email, 'admin');
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        const token = generateToken(user, user.role_name);

        res.json({
            success: true,
            message: 'Admin login successful',
            token,
            user: {
                id: user.id,
                employee_id: user.employee_id,
                name: user.name,
                email: user.email,
                role: user.role_name,
                userType: 'admin',
                department: user.department,
                designation: user.designation
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed'
        });
    }
});

// Student registration
router.post('/student/register', async (req, res) => {
    try {
        const { student_id, name, email, password, phone, branch, year_of_study } = req.body;

        if (!student_id || !name || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Student ID, name, email, and password are required'
            });
        }

        // Check if student already exists
        const [existingStudents] = await pool.execute(
            'SELECT id FROM students WHERE email = ? OR student_id = ?',
            [email, student_id]
        );

        if (existingStudents.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Student with this email or student ID already exists'
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const [result] = await pool.execute(
            `INSERT INTO students (student_id, name, email, password_hash, phone, branch, year_of_study, user_role_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
            [student_id, name, email, passwordHash, phone, branch, year_of_study]
        );

        const [newStudent] = await pool.execute(
            `SELECT s.*, ur.role_name 
             FROM students s 
             JOIN user_roles ur ON s.user_role_id = ur.id 
             WHERE s.id = ?`,
            [result.insertId]
        );

        const token = generateToken(newStudent[0], newStudent[0].role_name);

        res.status(201).json({
            success: true,
            message: 'Student registered successfully',
            token,
            user: {
                id: newStudent[0].id,
                student_id: newStudent[0].student_id,
                name: newStudent[0].name,
                email: newStudent[0].email,
                role: newStudent[0].role_name,
                userType: 'student'
            }
        });
    } catch (error) {
        console.error('Student registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Registration failed'
        });
    }
});

// Admin registration (only existing admins can create new admins)
router.post('/admin/register', async (req, res) => {
    try {
        const { employee_id, name, email, password, phone, department, designation, role } = req.body;

        if (!employee_id || !name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                error: 'Employee ID, name, email, password, and role are required'
            });
        }

        // Validate role
        const [roles] = await pool.execute(
            'SELECT id FROM user_roles WHERE role_name = ? AND role_name IN ("admin", "faculty")',
            [role]
        );

        if (roles.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid role. Must be admin or faculty'
            });
        }

        // Check if admin already exists
        const [existingAdmins] = await pool.execute(
            'SELECT id FROM faculty_admin WHERE email = ? OR employee_id = ?',
            [email, employee_id]
        );

        if (existingAdmins.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Admin with this email or employee ID already exists'
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const [result] = await pool.execute(
            `INSERT INTO faculty_admin (employee_id, name, email, password_hash, phone, department, designation, user_role_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [employee_id, name, email, passwordHash, phone, department, designation, roles[0].id]
        );

        const [newAdmin] = await pool.execute(
            `SELECT fa.*, ur.role_name 
             FROM faculty_admin fa 
             JOIN user_roles ur ON fa.user_role_id = ur.id 
             WHERE fa.id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Admin registered successfully',
            user: {
                id: newAdmin[0].id,
                employee_id: newAdmin[0].employee_id,
                name: newAdmin[0].name,
                email: newAdmin[0].email,
                role: newAdmin[0].role_name,
                userType: 'admin'
            }
        });
    } catch (error) {
        console.error('Admin registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Registration failed'
        });
    }
});

// Logout (client-side token deletion, server-side can implement token blacklisting if needed)
router.post('/logout', (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// Get current user profile
router.get('/profile', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'No token provided'
            });
        }

        const { verifyToken } = require('../middleware/auth');
        const decoded = verifyToken(token);
        
        if (!decoded) {
            return res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        }

        let user;
        if (decoded.userType === 'admin' || decoded.userType === 'faculty') {
            [user] = await pool.execute(
                `SELECT fa.*, ur.role_name 
                 FROM faculty_admin fa 
                 JOIN user_roles ur ON fa.user_role_id = ur.id 
                 WHERE fa.id = ? AND fa.is_active = TRUE`,
                [decoded.id]
            );
        } else {
            [user] = await pool.execute(
                `SELECT s.*, ur.role_name 
                 FROM students s 
                 JOIN user_roles ur ON s.user_role_id = ur.id 
                 WHERE s.id = ? AND s.is_active = TRUE`,
                [decoded.id]
            );
        }

        if (!user || user.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const userData = user[0];
        delete userData.password_hash; // Remove password hash from response

        res.json({
            success: true,
            user: userData
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch profile'
        });
    }
});

module.exports = router;