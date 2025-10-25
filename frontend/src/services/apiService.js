// API service for communicating with backend
const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  // Generic API call method
  async apiCall(endpoint, options = {}) {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const config = {
        headers: {
          'Content-Type': 'application/json',
        },
        ...options,
      };

      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        // Return the error response from backend
        return {
          success: false,
          error: data.error || `HTTP error! status: ${response.status}`,
          status: response.status,
          ...data
        };
      }
      
      return data;
    } catch (error) {
      console.error('API call failed:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  // Events API methods
  async getEvents() {
    return this.apiCall('/events');
  }

  async getEventById(id) {
    return this.apiCall(`/events/${id}`);
  }

  async getEventsByType(type) {
    return this.apiCall(`/events/type/${type}`);
  }

  async getUserEvents(studentId) {
    return this.apiCall(`/events/user/${studentId}`);
  }

  // Get user's registered events by email
  async getMyRegisteredEvents(email) {
    return this.apiCall(`/events/my-registrations?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Create new event (club heads only)
  async createEvent(eventData) {
    const token = localStorage.getItem('token');
    return this.apiCall('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Get venues for event creation
  async getVenues() {
    return this.apiCall('/venues');
  }

  // Register for an event
  async registerForEvent(eventId, registrationData) {
    return this.apiCall(`/events/${eventId}/register`, {
      method: 'POST',
      body: JSON.stringify(registrationData),
    });
  }

  // Cancel event registration
  async cancelEventRegistration(eventId, email) {
    return this.apiCall(`/events/${eventId}/register`, {
      method: 'DELETE',
      body: JSON.stringify({ email }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Clubs API methods
  async getClubs() {
    return this.apiCall('/clubs');
  }

  async getClubById(id) {
    return this.apiCall(`/clubs/${id}`);
  }

  async joinClub(clubId, email) {
    console.log('Joining club:', { clubId, email });
    return this.apiCall(`/clubs/${clubId}/join`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async getClubMembers(clubId) {
    const token = localStorage.getItem('token');
    return this.apiCall(`/admin/clubs/${clubId}/members`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Students API methods
  async getStudents() {
    return this.apiCall('/students');
  }

  // Authentication API methods
  async studentLogin(credentials) {
    return this.apiCall('/auth/student/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async adminLogin(credentials) {
    return this.apiCall('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async studentRegister(userData) {
    return this.apiCall('/auth/student/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getUserProfile() {
    const token = localStorage.getItem('token');
    return this.apiCall('/auth/profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async getStudentById(id) {
    return this.apiCall(`/students/${id}`);
  }

  async updateStudent(id, data) {
    return this.apiCall(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Admin API methods
  async getAdminDashboardStats() {
    const token = localStorage.getItem('token');
    return this.apiCall('/admin/dashboard/stats', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async getPendingEvents() {
    const token = localStorage.getItem('token');
    return this.apiCall('/events/pending', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async approveEvent(eventId) {
    const token = localStorage.getItem('token');
    return this.apiCall(`/events/${eventId}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async rejectEvent(eventId, reason) {
    const token = localStorage.getItem('token');
    return this.apiCall(`/events/${eventId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ rejection_reason: reason }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async createClub(clubData) {
    const token = localStorage.getItem('token');
    return this.apiCall('/admin/clubs', {
      method: 'POST',
      body: JSON.stringify(clubData),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async getAllUsers() {
    const token = localStorage.getItem('token');
    return this.apiCall('/admin/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async updateUserRole(userId, userType, roleData) {
    const token = localStorage.getItem('token');
    return this.apiCall(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ userType, ...roleData }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async getAvailableFaculty() {
    const token = localStorage.getItem('token');
    return this.apiCall('/admin/faculty', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async getAvailableCampuses() {
    const token = localStorage.getItem('token');
    return this.apiCall('/admin/campuses', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async updateClub(clubId, clubData) {
    const token = localStorage.getItem('token');
    return this.apiCall(`/admin/clubs/${clubId}`, {
      method: 'PUT',
      body: JSON.stringify(clubData),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async removeClubMember(clubId, memberId, force = false) {
    const token = localStorage.getItem('token');
    const endpoint = force 
      ? `/admin/clubs/${clubId}/members/${memberId}/force`
      : `/admin/clubs/${clubId}/members/${memberId}`;
    
    return this.apiCall(endpoint, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async getAuditLogs() {
    const token = localStorage.getItem('token');
    return this.apiCall('/admin/audit-log', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async getRegistrationActivity() {
    const token = localStorage.getItem('token');
    return this.apiCall('/admin/registration-activity', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async getEventStatistics() {
    const token = localStorage.getItem('token');
    return this.apiCall('/admin/event-statistics', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Stored Procedure: Get Event Summary
  async getEventSummary(eventId) {
    const token = localStorage.getItem('token');
    return this.apiCall(`/admin/procedure/event-summary/${eventId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Nested Query: Get Highly Active Students
  async getActiveStudents() {
    const token = localStorage.getItem('token');
    return this.apiCall('/admin/nested-query/active-students', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // JOIN Query: Get Event Details with Multiple JOINs
  async getEventDetailsWithJoins() {
    const token = localStorage.getItem('token');
    return this.apiCall('/admin/join-query/event-details', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Aggregate Query: Get Club Statistics with Aggregate Functions
  async getClubStatistics() {
    const token = localStorage.getItem('token');
    return this.apiCall('/admin/aggregate-query/club-stats', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Utility methods
  formatEventDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatEventTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  formatEventDateTime(dateString, timeString) {
    return `${this.formatEventDate(dateString)} at ${this.formatEventTime(timeString)}`;
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;