const { pool } = require('./db/dbConnect');

async function addSampleData() {
    try {
        console.log('Adding sample data...');

        // Add sample campus
        await pool.execute(`
            INSERT IGNORE INTO campus (name, location) 
            VALUES ('Main Campus', 'University District')
        `);

        // Get campus ID
        const [campusResult] = await pool.execute('SELECT id FROM campus LIMIT 1');
        const campusId = campusResult[0].id;

        // Add sample clubs
        const clubs = [
            ['Tech Club', 'Technology and programming enthusiasts', 'Dr. Smith'],
            ['Cultural Society', 'Promoting arts and cultural activities', 'Dr. Johnson'],
            ['Sports Club', 'Athletic activities and competitions', 'Dr. Brown'],
            ['Science Society', 'Scientific research and innovation', 'Dr. Davis'],
            ['Music Club', 'Musical performances and events', 'Dr. Wilson']
        ];

        for (const [name, description, coordinator] of clubs) {
            await pool.execute(`
                INSERT IGNORE INTO clubs (name, description, faculty_coordinator, campus_id) 
                VALUES (?, ?, ?, ?)
            `, [name, description, coordinator, campusId]);
        }

        // Add sample venues
        const venues = [
            ['Main Auditorium', 'Auditorium', 500],
            ['Conference Hall A', 'Hall', 200],
            ['Sports Ground', 'Ground', 1000],
            ['Lab 101', 'Laboratory', 50],
            ['Music Room', 'Other', 30]
        ];

        for (const [name, type, capacity] of venues) {
            await pool.execute(`
                INSERT IGNORE INTO venues (name, type, capacity, campus_id) 
                VALUES (?, ?, ?, ?)
            `, [name, type, capacity, campusId]);
        }

        // Get club and venue IDs
        const [clubsResult] = await pool.execute('SELECT id, name FROM clubs');
        const [venuesResult] = await pool.execute('SELECT id, name FROM venues');

        // Add sample venue bookings
        const bookings = [];
        for (let i = 0; i < 5; i++) {
            const venue = venuesResult[i % venuesResult.length];
            const [bookingResult] = await pool.execute(`
                INSERT INTO venue_bookings (venue_id, start_time, end_time, booking_type, status)
                VALUES (?, 
                        DATE_ADD(DATE_ADD(CURDATE(), INTERVAL ? DAY), INTERVAL 10 HOUR), 
                        DATE_ADD(DATE_ADD(CURDATE(), INTERVAL ? DAY), INTERVAL 12 HOUR), 
                        'Event', 'Confirmed')
            `, [venue.id, 7 + i * 5, 7 + i * 5]);
            bookings.push(bookingResult.insertId);
        }

        // Add sample events
        const events = [
            ['Tech Innovation Summit', 'Annual technology conference featuring latest innovations', 'Workshop', 7, '10:00:00', '17:00:00'],
            ['Cultural Heritage Festival', 'Celebrating diverse cultural traditions', 'Cultural', 12, '14:00:00', '20:00:00'],
            ['Inter-College Sports Meet', 'Annual sports competition between colleges', 'Sports', 17, '09:00:00', '18:00:00'],
            ['Science Exhibition 2025', 'Showcase of student research projects', 'Seminar', 22, '11:00:00', '16:00:00'],
            ['Music Concert Night', 'Live performances by student bands', 'Cultural', 27, '19:00:00', '22:00:00']
        ];

        for (let i = 0; i < events.length; i++) {
            const [name, description, eventType, daysFromNow, startTime, endTime] = events[i];
            const club = clubsResult[i % clubsResult.length];
            const bookingId = bookings[i];

            await pool.execute(`
                INSERT INTO events (
                    name, description, event_date, start_time, end_time, 
                    event_type, status, max_participants, registration_required,
                    registration_deadline, organized_by_club_id, booking_id
                ) VALUES (?, ?, DATE_ADD(CURDATE(), INTERVAL ? DAY), ?, ?, ?, 'Approved', 100, TRUE, 
                         DATE_ADD(NOW(), INTERVAL ? DAY), ?, ?)
            `, [name, description, daysFromNow, startTime, endTime, eventType, daysFromNow - 1, club.id, bookingId]);
        }

        console.log('✅ Sample data added successfully!');
        console.log('Added:');
        console.log('- 1 Campus');
        console.log('- 5 Clubs');
        console.log('- 5 Venues');
        console.log('- 5 Events');

    } catch (error) {
        console.error('❌ Error adding sample data:', error);
    } finally {
        process.exit(0);
    }
}

addSampleData();