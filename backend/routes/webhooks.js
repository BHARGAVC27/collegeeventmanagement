const express = require('express');
const router = express.Router();

// Health check endpoint for webhooks
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Webhook service is running',
        timestamp: new Date().toISOString()
    });
});

// Future webhook endpoints can be added here
// For now, we only have our custom authentication system

module.exports = router;
