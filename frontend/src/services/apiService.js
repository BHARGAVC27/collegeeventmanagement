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
    return this.apiCall(`/events/my-registrations?email=${encodeURIComponent(email)}`);
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
    return this.apiCall(`/clubs/${clubId}/join`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async getClubMembers(clubId) {
    return this.apiCall(`/clubs/${clubId}/members`);
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