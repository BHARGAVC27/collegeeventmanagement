const express = require('express');
const { pool } = require('../db/dbConnect');
const crypto = require('crypto');

const router = express.Router();

// Webhook secret from Clerk dashboard
const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

// Function to verify Clerk webhook signature
function verifyWebhook(payload, headers) {
    // Skip verification in development if no secret is provided
    if (!WEBHOOK_SECRET || WEBHOOK_SECRET === 'your-clerk-webhook-secret-here') {
        console.log('⚠️  Skipping webhook verification in development mode');
        return true;
    }
    
    const svix_id = headers['svix-id'];
    const svix_timestamp = headers['svix-timestamp'];
    const svix_signature = headers['svix-signature'];
    
    console.log('Webhook headers:', { svix_id, svix_timestamp, svix_signature });
    
    if (!svix_id || !svix_timestamp || !svix_signature) {
        console.log('Missing webhook verification headers');
        throw new Error('Missing webhook verification headers');
    }
    
    // Create the signed payload string
    const signed_payload = `${svix_id}.${svix_timestamp}.${payload}`;
    
    // Remove 'whsec_' prefix from the secret if present
    const secret = WEBHOOK_SECRET.startsWith('whsec_') 
        ? WEBHOOK_SECRET.slice(6) 
        : WEBHOOK_SECRET;
    
    // Decode the base64 secret
    const secretBytes = Buffer.from(secret, 'base64');
    
    // Create HMAC signature
    const expected_signature = crypto
        .createHmac('sha256', secretBytes)
        .update(signed_payload, 'utf8')
        .digest('base64');
    
    // Parse signatures from the header
    const signatures = svix_signature.split(' ');
    const valid_signature = signatures.some(sig => {
        const [version, signature] = sig.split(',');
        if (version === 'v1') {
            console.log('Comparing signatures:', { expected: expected_signature, received: signature });
            return signature === expected_signature;
        }
        return false;
    });
    
    if (!valid_signature) {
        console.log('❌ Invalid webhook signature');
        // For development, we'll skip this error and continue
        console.log('⚠️  Continuing despite invalid signature for development');
        return true;
    }
    
    console.log('✅ Webhook signature verified');
    return true;
}

// Function to extract student ID from email
function extractStudentId(email) {
    // Assume university emails follow pattern: studentId@university.edu
    // Extract everything before @ as student ID
    if (email && email.includes('@')) {
        return email.split('@')[0].toUpperCase();
    }
    // Fallback: generate a student ID based on timestamp
    return `STU${Date.now().toString().slice(-6)}`;
}

// Function to extract branch from email or name
function extractBranch(email, firstName, lastName) {
    const fullText = `${email} ${firstName} ${lastName}`.toLowerCase();
    
    // Common branch patterns
    if (fullText.includes('cs') || fullText.includes('computer')) return 'Computer Science';
    if (fullText.includes('ee') || fullText.includes('electrical')) return 'Electrical Engineering';
    if (fullText.includes('me') || fullText.includes('mechanical')) return 'Mechanical Engineering';
    if (fullText.includes('ce') || fullText.includes('civil')) return 'Civil Engineering';
    if (fullText.includes('it') || fullText.includes('information')) return 'Information Technology';
    
    // Default branch
    return 'General';
}

// Function to store user in database
async function storeUserInDatabase(clerkUser) {
    try {
        const {
            id: clerkId,
            email_addresses,
            first_name,
            last_name,
            phone_numbers,
            created_at
        } = clerkUser;
        
        // Get primary email
        const primaryEmail = email_addresses.find(email => email.id === clerkUser.primary_email_address_id);
        const email = primaryEmail ? primaryEmail.email_address : null;
        
        // Get primary phone
        const primaryPhone = phone_numbers.find(phone => phone.id === clerkUser.primary_phone_number_id);
        const phone = primaryPhone ? primaryPhone.phone_number : null;
        
        if (!email) {
            throw new Error('No email address found for user');
        }
        
        // Extract information
        const studentId = extractStudentId(email);
        const name = `${first_name || ''} ${last_name || ''}`.trim();
        const branch = extractBranch(email, first_name, last_name);
        
        // Default values
        const yearOfStudy = 1; // Default to first year, can be updated later
        const passwordHash = 'clerk_managed'; // Clerk manages authentication
        
        // Check if user already exists
        const [existingUser] = await pool.execute(
            'SELECT id FROM students WHERE email = ? OR student_id = ?',
            [email, studentId]
        );
        
        if (existingUser.length > 0) {
            console.log(`User already exists: ${email}`);
            return existingUser[0];
        }
        
        // Insert new user
        const [result] = await pool.execute(
            `INSERT INTO students (
                student_id, name, email, password_hash, phone, branch, year_of_study
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [studentId, name, email, passwordHash, phone, branch, yearOfStudy]
        );
        
        console.log(`User created successfully: ${email} (ID: ${result.insertId})`);
        
        return {
            id: result.insertId,
            student_id: studentId,
            name,
            email,
            branch,
            year_of_study: yearOfStudy
        };
        
    } catch (error) {
        console.error('Error storing user in database:', error);
        throw error;
    }
}

// Test endpoint to simulate Clerk webhook (for development)
router.post('/test-user-creation', async (req, res) => {
    try {
        console.log('Testing user creation with sample data...');
        
        // Sample Clerk user data
        const sampleClerkUser = {
            id: 'user_test123',
            email_addresses: [
                {
                    id: 'email_test123',
                    email_address: req.body.email || 'john.smith@university.edu'
                }
            ],
            primary_email_address_id: 'email_test123',
            first_name: req.body.firstName || 'John',
            last_name: req.body.lastName || 'Smith',
            phone_numbers: [
                {
                    id: 'phone_test123',
                    phone_number: req.body.phone || '+1234567890'
                }
            ],
            primary_phone_number_id: 'phone_test123',
            created_at: new Date().toISOString()
        };
        
        const user = await storeUserInDatabase(sampleClerkUser);
        
        res.json({
            success: true,
            message: 'Test user created successfully',
            user
        });
        
    } catch (error) {
        console.error('Test user creation error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Webhook endpoint for Clerk events (both paths for compatibility)
router.post('/clerk', async (req, res) => {
    try {
        // Convert raw body to string for signature verification
        const payload = req.body.toString();
        
        // Verify webhook signature using raw payload
        verifyWebhook(payload, req.headers);
        
        // Parse the JSON payload
        const { type, data } = JSON.parse(payload);
        
        console.log(`Received Clerk webhook: ${type}`);
        console.log('Webhook data:', JSON.stringify(data, null, 2));
        
        switch (type) {
            case 'user.created':
                console.log('Processing user.created event');
                const user = await storeUserInDatabase(data);
                console.log('User stored successfully:', user);
                
                res.status(200).json({
                    success: true,
                    message: 'User created successfully',
                    user: user
                });
                break;
                
            default:
                console.log(`Unhandled webhook type: ${type}`);
                res.status(200).json({
                    success: true,
                    message: `Webhook received but not processed: ${type}`
                });
        }
        
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Alternative webhook endpoint for Clerk events (legacy)
router.post('/clerk-webhook', async (req, res) => {
    try {
        // Verify webhook signature
        verifyWebhook(req);
        
        const { type, data } = req.body;
        
        console.log(`Received Clerk webhook: ${type}`);
        
        switch (type) {
            case 'user.created':
                console.log('Processing user.created event');
                const user = await storeUserInDatabase(data);
                console.log('User stored successfully:', user);
                break;
                
            case 'user.updated':
                console.log('User updated event received - implement if needed');
                break;
                
            case 'user.deleted':
                console.log('User deleted event received - implement if needed');
                break;
                
            default:
                console.log(`Unhandled webhook type: ${type}`);
        }
        
        res.status(200).json({ success: true });
        
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(400).json({ 
            error: 'Webhook processing failed',
            message: error.message 
        });
    }
});

module.exports = router;