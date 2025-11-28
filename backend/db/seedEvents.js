const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'college_event_management',
    port: process.env.DB_PORT || 3307
};

const sampleEvents = [
    {
        name: 'Web Development Workshop',
        description: 'Learn the basics of React and Node.js in this hands-on workshop. Perfect for beginners!',
        event_type: 'Workshop',
        days_from_now: 2,
        duration_hours: 4,
        max_participants: 50,
        club_name: 'onCreate() - PES University',
        image_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop'
    },
    {
        name: 'Annual Hackathon 2024',
        description: '24-hour coding battle. Build innovative solutions and win exciting prizes!',
        event_type: 'Competition',
        days_from_now: 10,
        duration_hours: 24,
        max_participants: 200,
        club_name: 'inGenius - PES University',
        image_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=600&fit=crop'
    },
    {
        name: 'Classical Music Night',
        description: 'An evening of mesmerizing classical tunes by our talented students.',
        event_type: 'Cultural',
        days_from_now: 5,
        duration_hours: 3,
        max_participants: 300,
        club_name: 'Swarantraka - PES University',
        image_url: 'https://images.unsplash.com/photo-1507838153414-b4b713384ebd?w=800&h=600&fit=crop'
    },
    {
        name: 'Robotics Showcase',
        description: 'Witness the future of robotics. Live demos and interactive sessions.',
        event_type: 'Seminar',
        days_from_now: 7,
        duration_hours: 2,
        max_participants: 100,
        club_name: 'Team Avions - PES University',
        image_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=600&fit=crop'
    },
    {
        name: 'Photography Walk',
        description: 'Capture the beauty of our campus. Bring your cameras!',
        event_type: 'Workshop',
        days_from_now: 3,
        duration_hours: 3,
        max_participants: 30,
        club_name: 'The Pixelloid Club - PES University',
        image_url: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&h=600&fit=crop'
    },
    {
        name: 'Debate Championship',
        description: 'Voice your opinion. The ultimate battle of words.',
        event_type: 'Competition',
        days_from_now: 15,
        duration_hours: 6,
        max_participants: 40,
        club_name: 'The Entrepreneurship Club - PES University',
        image_url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=600&fit=crop'
    },
    {
        name: 'Dance Face-off',
        description: 'Solo and group dance battles. Show us your moves!',
        event_type: 'Cultural',
        days_from_now: 8,
        duration_hours: 4,
        max_participants: 150,
        club_name: 'Hashtag - PES University',
        image_url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=600&fit=crop'
    },
    {
        name: 'AI & ML Tech Talk',
        description: 'Expert session on the latest trends in Artificial Intelligence.',
        event_type: 'Seminar',
        days_from_now: 12,
        duration_hours: 2,
        max_participants: 120,
        club_name: 'Kludge - PES University',
        image_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=600&fit=crop'
    }
];

async function seedEvents() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected!');

        // Get Club IDs
        const [clubs] = await connection.execute('SELECT id, name FROM clubs');
        const clubMap = {};
        clubs.forEach(club => {
            clubMap[club.name] = club.id;
        });

        // Get Venue IDs (just pick the first one for simplicity or random)
        const [venues] = await connection.execute('SELECT id FROM venues');
        if (venues.length === 0) {
            throw new Error('No venues found. Please seed venues first.');
        }

        // Get an Admin ID for approval
        const [admins] = await connection.execute('SELECT id FROM faculty_admin LIMIT 1');
        const adminId = admins[0]?.id || 1;

        console.log('Seeding events...');

        for (const event of sampleEvents) {
            const clubId = clubMap[event.club_name];
            if (!clubId) {
                console.warn(`Club "${event.club_name}" not found. Skipping event "${event.name}".`);
                continue;
            }

            const eventDate = new Date();
            eventDate.setDate(eventDate.getDate() + event.days_from_now);
            const dateStr = eventDate.toISOString().split('T')[0];

            // Random start time between 9 AM and 2 PM to ensure events fit in the day
            const startHour = 9 + Math.floor(Math.random() * 6);
            const startTime = `${startHour.toString().padStart(2, '0')}:00:00`;

            let endHour = startHour + event.duration_hours;
            // If end hour exceeds 23, just cap it at 23 for this simple schema
            if (endHour >= 24) {
                endHour = 23;
            }
            const endTime = `${endHour.toString().padStart(2, '0')}:00:00`;

            // Check if event already exists
            const [existingEvents] = await connection.execute(
                'SELECT id FROM events WHERE name = ? AND organized_by_club_id = ?',
                [event.name, clubId]
            );

            if (existingEvents.length > 0) {
                console.log(`Event "${event.name}" already exists. Skipping.`);
                continue;
            }

            // Create a booking first (simplified)
            const venueId = venues[Math.floor(Math.random() * venues.length)].id;
            const [bookingResult] = await connection.execute(
                `INSERT INTO venue_bookings 
                (venue_id, start_time, end_time, booking_type, status, booked_by_club_id, approved_by_admin_id) 
                VALUES (?, ?, ?, 'Event', 'Confirmed', ?, ?)`,
                [venueId, `${dateStr} ${startTime}`, `${dateStr} ${endTime}`, clubId, adminId]
            );
            const bookingId = bookingResult.insertId;

            // Insert Event
            await connection.execute(
                `INSERT INTO events 
                (name, description, image_url, event_date, start_time, end_time, event_type, status, max_participants, 
                registration_required, organized_by_club_id, booking_id, approved_by_admin_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?, 'Approved', ?, true, ?, ?, ?)`,
                [
                    event.name,
                    event.description,
                    event.image_url,
                    dateStr,
                    startTime,
                    endTime,
                    event.event_type,
                    event.max_participants,
                    clubId,
                    bookingId,
                    adminId
                ]
            );
            console.log(`Created event: ${event.name}`);
        }

        console.log('✅ Events seeded successfully!');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

seedEvents();
