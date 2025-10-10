# Frontend Directory Structure

## Overview
The frontend has been reorganized into a more maintainable and scalable directory structure following React best practices.

## Directory Structure

```
src/
├── components/              # Reusable UI components
│   ├── NavBar.jsx          # Navigation component
│   ├── ProtectedRoute.jsx  # Route protection component
│   └── ui/                 # UI library components
│       └── navigation-menu.jsx
├── pages/                  # Page components organized by feature
│   ├── admin/              # Admin-related pages
│   │   ├── AdminDashboard.jsx
│   │   ├── AdminDashboard.css
│   │   ├── AdminLoginPage.jsx
│   │   └── AdminLogin.css
│   ├── auth/               # Authentication pages
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   └── Auth.css
│   ├── clubs/              # Club-related pages
│   │   ├── ClubsPage.jsx
│   │   └── ClubDetails.jsx
│   ├── events/             # Event-related pages
│   │   ├── EventsPage.jsx
│   │   ├── EventRegister.jsx
│   │   └── MyEvents.jsx
│   ├── LandingPage.jsx     # Landing page
│   └── DashboardPage.jsx   # Main dashboard
├── services/               # API and external service integration
│   └── apiService.js       # Main API service
├── hooks/                  # Custom React hooks (ready for future use)
├── utils/                  # Utility functions (ready for future use)
├── lib/                    # External library configurations
│   └── utils.js
├── styles/                 # Global stylesheets
│   ├── App.css
│   └── index.css
├── App.jsx                 # Main App component with routing
└── main.jsx               # Application entry point
```

## Benefits of This Structure

### 1. **Feature-Based Organization**
- Pages are grouped by functionality (admin, auth, clubs, events)
- Related files are kept together
- Easy to locate and maintain specific features

### 2. **Separation of Concerns**
- **Components**: Reusable UI elements
- **Pages**: Feature-specific page components
- **Services**: API and business logic
- **Styles**: Global stylesheets in dedicated folder
- **Utils/Hooks**: Utility functions and custom hooks

### 3. **Scalability**
- Easy to add new features in their own directories
- Clear import paths
- Reduced coupling between components

### 4. **Maintainability**
- Related CSS files are co-located with components
- Consistent naming conventions
- Clear hierarchy and dependencies

## Import Patterns

### From Pages to Services
```jsx
import apiService from '../../services/apiService'
```

### From Pages to Components
```jsx
import NavBar from '../../components/NavBar'
```

### From App to Pages
```jsx
import LoginPage from './pages/auth/LoginPage'
import AdminDashboard from './pages/admin/AdminDashboard'
```

## Future Enhancements

1. **Custom Hooks** - Add reusable stateful logic in `/hooks`
2. **Utility Functions** - Add common helper functions in `/utils`
3. **Constants** - Add application constants in a dedicated file
4. **Types** - Add TypeScript definitions if migrating to TypeScript
5. **Tests** - Add test files co-located with components

## Migration Completed

✅ All files moved to appropriate directories
✅ All import statements updated
✅ CSS files moved with related components
✅ App.jsx routing updated
✅ Build tested successfully