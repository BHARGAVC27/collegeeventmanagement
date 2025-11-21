# College Event Management System

A comprehensive full-stack web application for managing college events, clubs, and student registrations. Built with React, Node.js, Express, and MySQL.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Database Architecture](#database-architecture)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Database Objects](#database-objects)
- [Screenshots](#screenshots)
- [Contributors](#contributors)

---

## 🎯 Overview

The College Event Management System is a comprehensive platform designed to streamline the organization, management, and participation in college events. It provides role-based access for students, club heads, and administrators, enabling efficient event lifecycle management from creation to completion.

### Key Objectives

- Centralize event information and registration processes
- Enable seamless communication between clubs and students
- Provide administrative oversight and approval workflows
- Track event attendance and generate analytics
- Manage venue bookings and capacity constraints

---

## ✨ Features

### For Students
- **Browse Events**: View upcoming events with detailed information
- **Event Registration**: Register for events with real-time availability updates
- **My Events Dashboard**: Track registered and attended events
- **Club Discovery**: Explore different clubs and their activities
- **Event Feedback**: Provide feedback on attended events

### For Club Heads
- **Event Creation**: Create and manage club events
- **Registration Management**: View and manage event registrations
- **Venue Booking**: Request venue bookings for events
- **Member Management**: Manage club memberships
- **Analytics Dashboard**: View event performance metrics

### For Administrators
- **Event Approval**: Approve or reject event requests
- **Venue Management**: Manage venues and booking schedules
- **Club Oversight**: Monitor all club activities
- **User Management**: Manage student and club head accounts
- **System Analytics**: Comprehensive reports and statistics
- **SQL Demonstrations**: Execute complex queries for data analysis

---

## 🛠 Technology Stack

### Frontend
- **React 18+**: Modern UI library with hooks
- **Vite**: Fast build tool and dev server
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/ui**: Reusable component library
- **Axios**: HTTP client for API requests

### Backend
- **Node.js v16+**: JavaScript runtime
- **Express.js**: Web application framework
- **MySQL 8.0+**: Relational database
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT authentication
- **mysql2**: MySQL client with promise support
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variable management

### Development Tools
- **ESLint**: Code linting
- **Git**: Version control
- **MySQL Workbench**: Database design and management
- **Postman**: API testing

---

## 🗄 Database Architecture

### Database Schema

The system uses a normalized relational database with 12 core tables:

#### Core Tables
1. **user_roles**: Defines system roles (Student, Club Head, Admin)
2. **students**: Student account information
3. **faculty_admin**: Administrator account information
4. **campus**: Campus locations (RR, EC, HSN)
5. **clubs**: Student clubs and organizations
6. **club_memberships**: Student-club associations
7. **venues**: Event venues with capacity information
8. **venue_bookings**: Venue reservation records
9. **events**: Event details and metadata
10. **event_registrations**: Student event registrations
11. **event_feedback**: Post-event feedback
12. **admin_audit_log**: System activity audit trail

### Database Objects

#### Views
- `student_dashboard`: Aggregated student event information
- `club_head_dashboard`: Club management overview
- `admin_dashboard`: System-wide statistics

#### Stored Procedures
- `get_event_summary(event_id)`: Comprehensive event details with statistics

#### User-Defined Functions
- `calculate_event_utilization(event_id)`: Calculates venue capacity utilization percentage

#### Triggers
- `after_event_status_update`: Logs event status changes to audit log
- `after_registration_insert`: Auto-updates event registration counts
- `after_registration_update`: Maintains registration statistics
- `after_registration_delete`: Decrements registration counts

### Entity Relationships

```
students ──< event_registrations >── events ──> clubs
    │                                    │
    └──< club_memberships >─────────────┘
    
events ──> venue_bookings ──> venues ──> campus

faculty_admin ──> admin_audit_log
```

---

## 📁 Project Structure

```
collegeeventmanagement/
├── frontend/                  # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── ui/          # Shadcn UI components
│   │   │   ├── NavBar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/           # Page components
│   │   │   ├── admin/       # Admin pages
│   │   │   ├── auth/        # Authentication pages
│   │   │   ├── clubs/       # Club pages
│   │   │   └── events/      # Event pages
│   │   ├── services/        # API service layer
│   │   ├── styles/          # CSS files
│   │   ├── App.jsx          # Root component
│   │   └── main.jsx         # Application entry point
│   ├── public/              # Static assets
│   ├── package.json
│   └── vite.config.js
│
├── backend/                  # Node.js backend server
│   ├── db/
│   │   ├── dbConnect.js     # Database connection pool
│   │   ├── initDb.js        # Database initialization
│   │   └── schema_enhanced.sql  # Complete database schema
│   ├── middleware/
│   │   └── auth.js          # Authentication middleware
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   ├── admin.js         # Admin routes
│   │   ├── clubs.js         # Club routes
│   │   ├── events.js        # Event routes
│   │   ├── users.js         # User routes
│   │   └── webhooks.js      # Webhook handlers
│   ├── server.js            # Express server entry point
│   └── package.json
│
├── data/                     # Data files and scripts
│   ├── clubs_data.json      # Club seed data
│   ├── clubs_data.csv       # Club data export
│   └── scraperClubs.py      # Web scraper for club data
│
├── .gitignore
├── AUTHENTICATION_MIGRATION.md
└── README.md
```

---

## 🚀 Installation

### Prerequisites

- **Node.js** v16 or higher
- **MySQL** 8.0 or higher
- **Git**
- **npm** or **yarn**

### Step 1: Clone the Repository

```bash
git clone https://github.com/BHARGAVC27/collegeeventmanagement.git
cd collegeeventmanagement
```

### Step 2: Database Setup

1. Open MySQL Workbench or command line
2. Create the database:

```sql
CREATE DATABASE college_event_management;
USE college_event_management;
```

3. Import the schema:

```bash
mysql -u root -p college_event_management < backend/db/schema_enhanced.sql
```

Or run the schema file directly in MySQL Workbench.

### Step 3: Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=college_event_management
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

### Step 4: Frontend Setup

```bash
cd ../frontend
npm install
```

---

## ⚙️ Configuration

### Database Configuration

Edit `backend/db/dbConnect.js` if needed to match your MySQL setup.

### Environment Variables

Key environment variables in `backend/.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `5000` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_USER` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | Required |
| `DB_NAME` | Database name | `college_event_management` |
| `JWT_SECRET` | Secret for JWT signing | Required |
| `NODE_ENV` | Environment mode | `development` |

---

## 💻 Usage

### Starting the Backend Server

```bash
cd backend
node server.js
```

Backend will run on `http://localhost:5000`

### Starting the Frontend Development Server

```bash
cd frontend
npm run dev
```

Frontend will run on `http://localhost:5173` (Vite default)

### Default Credentials

#### Administrator Accounts
- **Email**: `admin1@pesu.pes.edu` through `admin5@pesu.pes.edu`
- **Password**: `Test@123`

#### Club Head Accounts
- **Email**: `pes2ug23cs001@pesu.pes.edu` through `pes2ug23cs016@pesu.pes.edu`
- **Password**: `Test@123`

#### Student Registration
Students can register through the signup page with any valid email and student ID.

---

## 📡 API Documentation

### Authentication Endpoints

#### Student Authentication
```
POST /api/auth/student/register
POST /api/auth/student/login
```

#### Admin Authentication
```
POST /api/auth/admin/login
POST /api/auth/admin/register
```

### Event Endpoints

```
GET    /api/events              # Get all events
GET    /api/events/:id          # Get event by ID
POST   /api/events              # Create event (Club Head)
PUT    /api/events/:id          # Update event
DELETE /api/events/:id          # Delete event
GET    /api/events/my-events    # Get user's events
POST   /api/events/:id/register # Register for event
```

### Club Endpoints

```
GET    /api/clubs               # Get all clubs
GET    /api/clubs/:id           # Get club by ID
POST   /api/clubs               # Create club (Admin)
PUT    /api/clubs/:id           # Update club
DELETE /api/clubs/:id           # Delete club
```

### Admin Endpoints

```
GET    /api/admin/dashboard           # Admin statistics
GET    /api/admin/pending-events      # Events awaiting approval
POST   /api/admin/approve-event/:id   # Approve event
POST   /api/admin/reject-event/:id    # Reject event
GET    /api/admin/sql-demo/:type      # Execute SQL demonstrations
```

### Authentication

API requests require JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

---

## 🗃 Database Objects

### Invoking Stored Procedures

```sql
-- Get comprehensive event summary
CALL get_event_summary(1);
```

### Using User-Defined Functions

```sql
-- Calculate event capacity utilization
SELECT 
    id,
    name,
    calculate_event_utilization(id) as utilization_percentage
FROM events;
```

### Trigger Behavior

Triggers automatically execute on data changes:

```sql
-- This INSERT will automatically fire the registration count trigger
INSERT INTO event_registrations (event_id, student_id, registration_status)
VALUES (1, 5, 'Registered');

-- The events table current_registrations will be auto-updated
```

### Complex Queries

#### Nested Query Example
```sql
SELECT 
    s.id,
    s.name,
    (SELECT COUNT(*) FROM event_registrations WHERE student_id = s.id) as total_registrations
FROM students s
WHERE (SELECT COUNT(*) FROM event_registrations WHERE student_id = s.id) > 
      (SELECT AVG(reg_count) FROM (SELECT COUNT(*) as reg_count FROM event_registrations GROUP BY student_id) as sub);
```

#### JOIN Query Example
```sql
SELECT 
    e.name as event_name,
    c.name as club_name,
    e.current_registrations,
    e.max_participants
FROM events e
INNER JOIN clubs c ON e.organized_by_club_id = c.id;
```

#### Aggregate Query Example
```sql
SELECT 
    c.name as club_name,
    COUNT(e.id) as total_events,
    AVG(e.current_registrations) as avg_attendance
FROM clubs c
LEFT JOIN events e ON c.id = e.organized_by_club_id
GROUP BY c.id, c.name
HAVING COUNT(e.id) > 0;
```

---

## 📸 Screenshots

### Recommended Screenshots for Documentation

1. **Landing Page** - Homepage with featured events
2. **Student Dashboard** - Student event overview
3. **Event Browse** - Event listing page
4. **Event Details** - Single event view with registration
5. **Club Listing** - All clubs page
6. **Club Details** - Individual club page
7. **My Events** - Student's registered events
8. **Club Head Dashboard** - Club management interface
9. **Create Event** - Event creation form
10. **Admin Dashboard** - Admin overview with statistics
11. **Admin SQL Demos** - Query execution interface
12. **Event Approval** - Pending events list
13. **Database Schema** - ER diagram
14. **Stored Procedure Execution** - SQL output
15. **Trigger Demonstration** - Before/after trigger execution
16. **Function Usage** - UDF execution results
17. **Nested Query Results** - Complex query output
18. **JOIN Query Results** - Multi-table join output
19. **Aggregate Query Results** - Statistical query output

---

## 👥 Contributors

- **Project Team**: DBMS Project - College Event Management System
- **Institution**: PES University
- **Academic Year**: 2024-2025

---

## 📄 License

This project is developed as part of academic curriculum for DBMS course.

---

## 🔗 Links

- **Repository**: [https://github.com/BHARGAVC27/collegeeventmanagement](https://github.com/BHARGAVC27/collegeeventmanagement)
- **Documentation**: See `AUTHENTICATION_MIGRATION.md` for authentication details

---

## 🐛 Known Issues & Future Enhancements

### Known Issues
- None currently reported

### Planned Features
- Email notifications for event updates
- Calendar integration
- Mobile responsive design improvements
- Export reports to PDF
- Advanced analytics dashboard
- QR code check-in for events

---

## 📞 Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

---

**Last Updated**: November 21, 2025
