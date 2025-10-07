const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Bhargav@1',
    database: process.env.DB_NAME || 'college_event_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true // Allow multiple SQL statements
};

// Create connection pool
const pool = mysql.createPool(dbConfig);
const promisePool = pool.promise();

// Function to create database if it doesn't exist
async function createDatabaseIfNotExists() {
    try {
        // Create connection without specifying database
        const connectionConfig = { ...dbConfig };
        delete connectionConfig.database;
        const connection = mysql.createConnection(connectionConfig);
        const promiseConnection = connection.promise();

        console.log('Checking if database exists...');
        
        // Create database if it doesn't exist
        await promiseConnection.execute(
            `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        );
        
        console.log(`Database '${dbConfig.database}' is ready.`);
        await promiseConnection.end();
        
    } catch (error) {
        console.error('Error creating database:', error);
        throw error;
    }
}

// Function to load schema from SQL file
async function loadSchema() {
    try {
        console.log('Loading database schema...');
        
        const schemaPath = path.join(__dirname, 'schema_simple.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        // Remove comments and split by semicolons properly
        const cleanSql = schemaSql
            .split('\n')
            .filter(line => !line.trim().startsWith('--'))
            .join('\n');
        
        // Split by semicolons but preserve statement integrity
        const statements = cleanSql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.toLowerCase().includes('delimiter'));
        
        console.log(`Found ${statements.length} SQL statements to execute...`);
        
        // Execute statements one by one
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            
            // Skip empty statements
            if (!statement || statement.length < 5) {
                continue;
            }
            
            try {
                await promisePool.execute(statement);
                console.log(`✓ Executed statement ${i + 1}: ${statement.split('\n')[0].substring(0, 50)}...`);
            } catch (error) {
                console.error(`✗ Failed to execute statement ${i + 1}:`);
                console.error('Statement:', statement.substring(0, 200) + '...');
                console.error('Error:', error.message);
                throw error;
            }
        }
        
        console.log('Database schema loaded successfully!');
        
    } catch (error) {
        console.error('Error loading schema:', error);
        throw error;
    }
}

// Function to test database connection
async function testConnection() {
    try {
        const [rows] = await promisePool.execute('SELECT 1 as test');
        console.log('Database connection test successful!');
        return true;
    } catch (error) {
        console.error('Database connection test failed:', error);
        return false;
    }
}

// Initialize database
async function initializeDatabase() {
    try {
        console.log('Initializing database...');
        
        // Step 1: Create database if it doesn't exist
        await createDatabaseIfNotExists();
        
        // Step 2: Test connection
        const connected = await testConnection();
        if (!connected) {
            throw new Error('Failed to connect to database');
        }
        
        // Step 3: Check if tables exist
        const [tables] = await promisePool.execute(
            `SELECT COUNT(*) as count FROM information_schema.tables 
             WHERE table_schema = ?`,
            [dbConfig.database]
        );
        
        // Step 4: Load schema if tables don't exist
        if (tables[0].count === 0) {
            console.log('Tables not found. Loading schema...');
            await loadSchema();
        } else {
            console.log('Database tables already exist.');
            console.log('To reload schema, delete the existing database manually and run this script again.');
        }
        
        console.log('Database initialization complete!');
        
    } catch (error) {
        console.error('Database initialization failed:', error);
        throw error;
    }
}

// Function to gracefully close the pool
function closeConnection() {
    return new Promise((resolve) => {
        pool.end(() => {
            console.log('Database connection pool closed.');
            resolve();
        });
    });
}

module.exports = {
    pool: promisePool,
    initializeDatabase,
    testConnection,
    closeConnection
};
