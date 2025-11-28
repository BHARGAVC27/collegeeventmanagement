const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'college_event_management',
    port: process.env.DB_PORT || 3307
};

(async () => {
    let conn;
    try {
        conn = await mysql.createConnection(dbConfig);

        // Disable foreign key checks to allow truncation/deletion in any order
        await conn.execute("SET FOREIGN_KEY_CHECKS = 0");

        console.log("Deleting event registrations...");
        await conn.execute("TRUNCATE TABLE event_registrations");

        console.log("Deleting events...");
        await conn.execute("TRUNCATE TABLE events");

        console.log("Deleting venue bookings (for events)...");
        // Only delete bookings related to events to avoid clearing other bookings if any
        // But since we are resetting, maybe just clearing all 'Event' type bookings is safer
        await conn.execute("DELETE FROM venue_bookings WHERE booking_type = 'Event'");

        await conn.execute("SET FOREIGN_KEY_CHECKS = 1");

        console.log("✅ Events data reset successfully.");

    } catch (e) {
        console.error("❌ Error:", e.message);
    } finally {
        if (conn) conn.end();
    }
})();
