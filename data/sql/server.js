// Filename - server.js

// importing mysql2 module
const mysql = require('mysql2');

// First connect without specifying database to create it
const tempConnection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'Bhargav@1'
});

// Create database if it doesn't exist
tempConnection.connect(function(err) {
    if (err) {
        console.log("Error connecting to MySQL server:");
        console.log("Error code:", err.code);
        console.log("Error message:", err.message);
        return;
    }
    
    console.log("Connected to MySQL server successfully");
    
    // Create database
    tempConnection.query('CREATE DATABASE IF NOT EXISTS college_event_management', function(err, result) {
        if (err) {
            console.log("Error creating database:", err);
        } else {
            console.log("Database 'college_event_management' created or already exists");
        }
        
        tempConnection.end();
        
        // Now connect to the specific database
        const connection = mysql.createConnection({
            host: 'localhost',
            port: 3306,
            database: 'college_event_management',
            user: 'root',
            password: 'Bhargav@1'
        });
        
        connection.connect(function(err) {
            if (err) {
                console.log("Error connecting to college_event_management database:");
                console.log("Error code:", err.code);
                console.log("Error message:", err.message);
            } else {
                console.log("Connected to college_event_management database successfully!");
            }
        });
    });
});