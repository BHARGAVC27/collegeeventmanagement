// Database initialization script
const { initializeDatabase, closeConnection } = require('./dbConnect');

async function init() {
    try {
        await initializeDatabase();
        console.log('\n✅ Database setup completed successfully!');
        
        // Close the connection
        await closeConnection();
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ Database setup failed:', error.message);
        process.exit(1);
    }
}

// Run the initialization
if (require.main === module) {
    init();
}

module.exports = { init };