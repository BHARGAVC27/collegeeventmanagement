const express = require('express');
const { pool } = require('../db/dbConnect');

const router = express.Router();

// Get all students
router.get('/students', async (req, res) => {
    try {
        const [students] = await pool.execute(
            `SELECT 
                id, student_id, name, email, phone, branch, year_of_study, created_at
            FROM students 
            ORDER BY created_at DESC`
        );
        
        res.json({
            success: true,
            count: students.length,
            students
        });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch students'
        });
    }
});

// Get student by ID
router.get('/students/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [students] = await pool.execute(
            `SELECT 
                id, student_id, name, email, phone, branch, year_of_study, created_at
            FROM students 
            WHERE id = ?`,
            [id]
        );
        
        if (students.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Student not found'
            });
        }
        
        res.json({
            success: true,
            student: students[0]
        });
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch student'
        });
    }
});

// Get student by email
router.get('/students/email/:email', async (req, res) => {
    try {
        const { email } = req.params;
        
        const [students] = await pool.execute(
            `SELECT 
                id, student_id, name, email, phone, branch, year_of_study, created_at
            FROM students 
            WHERE email = ?`,
            [email]
        );
        
        if (students.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Student not found'
            });
        }
        
        res.json({
            success: true,
            student: students[0]
        });
    } catch (error) {
        console.error('Error fetching student by email:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch student'
        });
    }
});

// Update student information
router.put('/students/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, branch, year_of_study } = req.body;
        
        const [result] = await pool.execute(
            `UPDATE students 
            SET name = ?, phone = ?, branch = ?, year_of_study = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [name, phone, branch, year_of_study, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Student not found'
            });
        }
        
        // Get updated student
        const [students] = await pool.execute(
            `SELECT 
                id, student_id, name, email, phone, branch, year_of_study, created_at, updated_at
            FROM students 
            WHERE id = ?`,
            [id]
        );
        
        res.json({
            success: true,
            message: 'Student updated successfully',
            student: students[0]
        });
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update student'
        });
    }
});

module.exports = router;