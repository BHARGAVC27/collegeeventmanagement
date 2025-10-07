const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const ngrok = require('@ngrok/ngrok');
const { initializeDatabase, testConnection } = require('./db/dbConnect');
const webhookRoutes = require('./routes/webhooks');
const userRoutes = require('./routes/users');
const eventRoutes = require('./routes/events');
const clubRoutes = require('./routes/clubs');

dotenv.config();
const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());

// Raw body parsing for webhooks (must come before express.json())
app.use('/api/webhooks', express.raw({ type: 'application/json' }));

// JSON parsing for all other routes
app.use(express.json());

// API routes
app.use('/api/webhooks', webhookRoutes);
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
        const server = app.listen(PORT, async () => {
            console.log(`✅ Server is running on http://localhost:${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            
            // Set up ngrok tunnel for webhook endpoint
            try {
                console.log('🔗 Starting ngrok tunnel...');
                const tunnel = await ngrok.forward({
                    addr: PORT,
                    subdomain: "college-events-webhook", // Static subdomain
                    authtoken_from_env: true,
                });
                
                const webhookUrl = `${tunnel.url()}/api/webhooks/clerk`;
                console.log('🌐 Ngrok tunnel created successfully!');
                console.log(`📡 Webhook URL: ${webhookUrl}`);
                console.log('');
                console.log('🔧 SETUP INSTRUCTIONS:');
                console.log('1. Copy the webhook URL above');
                console.log('2. Go to your Clerk dashboard (dashboard.clerk.com)');
                console.log('3. Navigate to Webhooks section');
                console.log('4. Create a new webhook with the URL above');
                console.log('5. Select "user.created" event');
                console.log('6. Save the webhook configuration');
                console.log('');
                
            } catch (ngrokError) {
                console.warn('⚠️  Failed to create ngrok tunnel:', ngrokError.message);
                console.log('📍 Server is still running locally at http://localhost:' + PORT);
                console.log('💡 You can manually set up a tunnel or use the local URL for testing');
            }
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