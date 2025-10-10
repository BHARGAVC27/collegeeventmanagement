const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { initializeDatabase, testConnection } = require('./db/dbConnect');
const webhookRoutes = require('./routes/webhooks');
const userRoutes = require('./routes/users');
const eventRoutes = require('./routes/events');
const clubRoutes = require('./routes/clubs');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

dotenv.config();
const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());

// JSON parsing
app.use(express.json());

// API routes
app.use('/api/webhooks', webhookRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', userRoutes);
app.use('/api', eventRoutes);
app.use('/api', clubRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'College Event Management System API',
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const dbConnected = await testConnection();
        res.json({
            status: 'healthy',
            database: dbConnected ? 'connected' : 'disconnected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            database: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Initialize database and start server
async function startServer() {
    try {
        console.log('🚀 Starting College Event Management System...');
        
        // Initialize database
        await initializeDatabase();
        
        // Start the server
        const server = app.listen(PORT, () => {
            console.log(`✅ Server is running on http://localhost:${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log('� Authentication endpoints:');
            console.log(`   � Student login: http://localhost:${PORT}/api/auth/student/login`);
            console.log(`   👨‍💼 Admin login: http://localhost:${PORT}/api/auth/admin/login`);
            console.log('');
        });
        
        return server;
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully...');
    process.exit(0);
});

// Start the application
startServer();