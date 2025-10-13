import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/apiService';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Create Club Modal State
  const [showCreateClubModal, setShowCreateClubModal] = useState(false);
  const [createClubForm, setCreateClubForm] = useState({
    name: '',
    description: '',
    faculty_coordinator_id: '',
    campus_id: ''
  });
  const [availableFaculty, setAvailableFaculty] = useState([]);
  const [availableCampuses, setAvailableCampuses] = useState([]);
  const [createClubLoading, setCreateClubLoading] = useState(false);

  // Edit Club Modal State
  const [showEditClubModal, setShowEditClubModal] = useState(false);
  const [editClubForm, setEditClubForm] = useState({
    id: '',
    name: '',
    description: '',
    faculty_coordinator_id: '',
    campus_id: ''
  });
  const [editClubLoading, setEditClubLoading] = useState(false);

  // View Members Modal State
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [clubMembers, setClubMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in and is admin
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const userType = localStorage.getItem('userType');
    const token = localStorage.getItem('token');

    if (!token || userType !== 'admin' || !userData.role?.includes('admin')) {
      navigate('/admin/login');
      return;
    }

    setUser(userData);
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch dashboard stats
      const statsResponse = await apiService.getAdminDashboardStats();
      if (statsResponse.success) {
        setStats(statsResponse.stats);
      } else {
        console.error('Error fetching dashboard stats:', statsResponse.error);
      }

      // Fetch pending events
      const eventsResponse = await apiService.getPendingEvents();
      if (eventsResponse.success) {
        setPendingEvents(eventsResponse.events || []);
      } else {
        console.error('Error fetching pending events:', eventsResponse.error);
      }

      // Fetch clubs
      const clubsResponse = await apiService.getClubs();
      if (clubsResponse.success) {
        setClubs(clubsResponse.clubs || []);
      } else {
        console.error('Error fetching clubs:', clubsResponse.error);
      }

      // Fetch available faculty for create club form
      const facultyResponse = await apiService.getAvailableFaculty();
      if (facultyResponse.success) {
        setAvailableFaculty(facultyResponse.faculty || []);
      }

      // Fetch available campuses for create club form
      const campusResponse = await apiService.getAvailableCampuses();
      if (campusResponse.success) {
        setAvailableCampuses(campusResponse.campuses || []);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventAction = async (eventId, action, reason = '') => {
    try {
      let response;
      
      if (action === 'approve') {
        response = await apiService.approveEvent(eventId);
      } else if (action === 'reject') {
        response = await apiService.rejectEvent(eventId, reason);
      }

      if (response && response.success) {
        // Refresh pending events
        fetchDashboardData();
        alert(`Event ${action}d successfully!`);
      } else {
        alert(response?.error || `Failed to ${action} event`);
      }
    } catch (error) {
      console.error(`Error ${action}ing event:`, error);
      alert(`Error ${action}ing event`);
    }
  };

  // Create Club Functions
  const handleCreateClubClick = () => {
    setShowCreateClubModal(true);
  };

  const handleCloseCreateClubModal = () => {
    setShowCreateClubModal(false);
    setCreateClubForm({
      name: '',
      description: '',
      faculty_coordinator_id: '',
      campus_id: ''
    });
  };

  const handleCreateClubInputChange = (e) => {
    const { name, value } = e.target;
    setCreateClubForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateClubSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!createClubForm.name.trim()) {
      alert('Club name is required');
      return;
    }
    
    if (!createClubForm.description.trim()) {
      alert('Club description is required');
      return;
    }
    
    if (!createClubForm.campus_id) {
      alert('Please select a campus');
      return;
    }

    setCreateClubLoading(true);
    
    try {
      const response = await apiService.createClub(createClubForm);
      
      if (response.success) {
        alert('Club created successfully!');
        handleCloseCreateClubModal();
        fetchDashboardData(); // Refresh the data
      } else {
        alert(response.error || 'Failed to create club');
      }
    } catch (error) {
      console.error('Error creating club:', error);
      alert('Error creating club');
    } finally {
      setCreateClubLoading(false);
    }
  };

  // Edit Club Functions
  const handleEditClubClick = (club) => {
    setEditClubForm({
      id: club.id,
      name: club.name,
      description: club.description,
      faculty_coordinator_id: club.faculty_coordinator_id || '',
      campus_id: club.campus_id
    });
    setShowEditClubModal(true);
  };

  const handleCloseEditClubModal = () => {
    setShowEditClubModal(false);
    setEditClubForm({
      id: '',
      name: '',
      description: '',
      faculty_coordinator_id: '',
      campus_id: ''
    });
  };

  const handleEditClubInputChange = (e) => {
    const { name, value } = e.target;
    setEditClubForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditClubSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!editClubForm.name.trim()) {
      alert('Club name is required');
      return;
    }
    
    if (!editClubForm.description.trim()) {
      alert('Club description is required');
      return;
    }
    
    if (!editClubForm.campus_id) {
      alert('Please select a campus');
      return;
    }

    setEditClubLoading(true);
    
    try {
      const response = await apiService.updateClub(editClubForm.id, {
        name: editClubForm.name,
        description: editClubForm.description,
        faculty_coordinator_id: editClubForm.faculty_coordinator_id || null,
        campus_id: editClubForm.campus_id
      });
      
      if (response.success) {
        alert('Club updated successfully!');
        handleCloseEditClubModal();
        fetchDashboardData(); // Refresh the data
      } else {
        alert(response.error || 'Failed to update club');
      }
    } catch (error) {
      console.error('Error updating club:', error);
      alert('Error updating club');
    } finally {
      setEditClubLoading(false);
    }
  };

  // View Members Functions
  const handleViewMembersClick = async (club) => {
    setSelectedClub(club);
    setShowMembersModal(true);
    setMembersLoading(true);
    
    try {
      const response = await apiService.getClubMembers(club.id);
      
      if (response.success) {
        setClubMembers(response.members || []);
      } else {
        alert(response.error || 'Failed to fetch club members');
        setClubMembers([]);
      }
    } catch (error) {
      console.error('Error fetching club members:', error);
      alert('Error fetching club members');
      setClubMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleCloseMembersModal = () => {
    setShowMembersModal(false);
    setSelectedClub(null);
    setClubMembers([]);
  };

  const handleRemoveMember = async (memberId, memberName, memberRole) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from ${selectedClub?.name}?`)) {
      return;
    }

    try {
      let response = await apiService.removeClubMember(selectedClub.id, memberId, false);
      
      // If removal failed because member is a head, ask for force removal
      if (!response.success && response.error && response.error.includes('head')) {
        const forceRemove = window.confirm(
          `${memberName} is a club head. Force removal will remove them anyway. Are you sure you want to proceed?`
        );
        
        if (forceRemove) {
          response = await apiService.removeClubMember(selectedClub.id, memberId, true);
        } else {
          return;
        }
      }
      
      if (response.success) {
        alert(response.message || 'Member removed successfully!');
        // Refresh members list
        const updatedResponse = await apiService.getClubMembers(selectedClub.id);
        if (updatedResponse.success) {
          setClubMembers(updatedResponse.members || []);
        }
        // Refresh dashboard data to update member counts
        fetchDashboardData();
      } else {
        alert(response.error || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Error removing member');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-header-left">
            <h1>Admin Dashboard</h1>
            <p>Welcome back, {user?.name}</p>
          </div>
          <div className="admin-header-right">
            <span className="admin-role-badge">{user?.role}</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="admin-nav">
        <div className="admin-nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`nav-tab ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            Pending Events ({pendingEvents.length})
          </button>
          <button 
            className={`nav-tab ${activeTab === 'clubs' ? 'active' : ''}`}
            onClick={() => setActiveTab('clubs')}
          >
            Clubs Management
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="admin-main">
        {activeTab === 'overview' && (
          <div className="overview-section">
            {/* Stats Cards */}
            {stats && (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon clubs-icon">🏛️</div>
                  <div className="stat-content">
                    <h3>{stats.clubs.total_clubs}</h3>
                    <p>Total Clubs</p>
                    <small>{stats.clubs.active_clubs} active</small>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon events-icon">📅</div>
                  <div className="stat-content">
                    <h3>{stats.events.total_events}</h3>
                    <p>Total Events</p>
                    <small>{stats.events.upcoming_events} upcoming</small>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon users-icon">👥</div>
                  <div className="stat-content">
                    <h3>{stats.users.total_students}</h3>
                    <p>Total Students</p>
                    <small>{stats.users.club_heads} club heads</small>
                  </div>
                </div>
                <div className="stat-card pending">
                  <div className="stat-icon pending-icon">⏳</div>
                  <div className="stat-content">
                    <h3>{stats.events.pending_events}</h3>
                    <p>Pending Approvals</p>
                    <small>Requires action</small>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="quick-actions">
              <h2>Quick Actions</h2>
              <div className="action-buttons">
                <button 
                  className="action-btn primary"
                  onClick={() => setActiveTab('events')}
                >
                  Review Pending Events
                </button>
                <button 
                  className="action-btn secondary"
                  onClick={() => setActiveTab('clubs')}
                >
                  Manage Clubs
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="events-section">
            <div className="section-header">
              <h2>Pending Event Approvals</h2>
              <p>Review and approve/reject events submitted by club heads</p>
            </div>
            
            {pendingEvents.length === 0 ? (
              <div className="empty-state">
                <p>No pending events to review</p>
              </div>
            ) : (
              <div className="events-list">
                {pendingEvents.map(event => (
                  <div key={event.id} className="event-card">
                    <div className="event-header">
                      <h3>{event.name}</h3>
                      <span className="event-type">{event.event_type}</span>
                    </div>
                    <div className="event-details">
                      <p><strong>Club:</strong> {event.club_name}</p>
                      <p><strong>Date:</strong> {new Date(event.event_date).toLocaleDateString()}</p>
                      <p><strong>Time:</strong> {event.start_time} - {event.end_time}</p>
                      <p><strong>Venue:</strong> {event.venue_name || 'TBD'}</p>
                      <p><strong>Created by:</strong> {event.created_by}</p>
                      {event.description && (
                        <p><strong>Description:</strong> {event.description}</p>
                      )}
                    </div>
                    <div className="event-actions">
                      <button 
                        className="approve-btn"
                        onClick={() => handleEventAction(event.id, 'approve')}
                      >
                        Approve
                      </button>
                      <button 
                        className="reject-btn"
                        onClick={() => {
                          const reason = prompt('Please provide a reason for rejection:');
                          if (reason) {
                            handleEventAction(event.id, 'reject', reason);
                          }
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'clubs' && (
          <div className="clubs-section">
            <div className="section-header">
              <h2>Clubs Management</h2>
              <button 
                className="create-club-btn"
                onClick={handleCreateClubClick}
              >
                Create New Club
              </button>
            </div>
            
            <div className="clubs-grid">
              {clubs.map(club => (
                <div key={club.id} className="club-card">
                  <div className="club-header">
                    <h3>{club.name}</h3>
                    <span className={`status-badge ${club.is_active ? 'active' : 'inactive'}`}>
                      {club.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="club-details">
                    <p><strong>Campus:</strong> {club.campus_name}</p>
                    <p><strong>Members:</strong> {club.member_count}</p>
                    <p><strong>Events:</strong> {club.event_count}</p>
                    {club.faculty_coordinator_name && (
                      <p><strong>Coordinator:</strong> {club.faculty_coordinator_name}</p>
                    )}
                  </div>
                  <div className="club-actions">
                    <button 
                      className="edit-btn"
                      onClick={() => handleEditClubClick(club)}
                    >
                      Edit
                    </button>
                    <button 
                      className="members-btn"
                      onClick={() => handleViewMembersClick(club)}
                    >
                      View Members
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Create Club Modal */}
      {showCreateClubModal && (
        <div className="modal-overlay" onClick={handleCloseCreateClubModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Club</h2>
              <button 
                className="close-modal-btn"
                onClick={handleCloseCreateClubModal}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateClubSubmit} className="create-club-form">
              <div className="form-group">
                <label htmlFor="clubName">Club Name *</label>
                <input
                  type="text"
                  id="clubName"
                  name="name"
                  value={createClubForm.name}
                  onChange={handleCreateClubInputChange}
                  placeholder="Enter club name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="clubDescription">Description *</label>
                <textarea
                  id="clubDescription"
                  name="description"
                  value={createClubForm.description}
                  onChange={handleCreateClubInputChange}
                  placeholder="Enter club description"
                  rows="4"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="campusId">Campus *</label>
                  <select
                    id="campusId"
                    name="campus_id"
                    value={createClubForm.campus_id}
                    onChange={handleCreateClubInputChange}
                    required
                  >
                    <option value="">Select Campus</option>
                    {availableCampuses.map(campus => (
                      <option key={campus.id} value={campus.id}>
                        {campus.name} - {campus.location}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="facultyCoordinatorId">Faculty Coordinator</label>
                  <select
                    id="facultyCoordinatorId"
                    name="faculty_coordinator_id"
                    value={createClubForm.faculty_coordinator_id}
                    onChange={handleCreateClubInputChange}
                  >
                    <option value="">Select Faculty (Optional)</option>
                    {availableFaculty.map(faculty => (
                      <option key={faculty.id} value={faculty.id}>
                        {faculty.name} - {faculty.department}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={handleCloseCreateClubModal}
                  disabled={createClubLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={createClubLoading}
                >
                  {createClubLoading ? 'Creating...' : 'Create Club'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Club Modal */}
      {showEditClubModal && (
        <div className="modal-overlay" onClick={handleCloseEditClubModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Club</h2>
              <button 
                className="close-modal-btn"
                onClick={handleCloseEditClubModal}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleEditClubSubmit} className="create-club-form">
              <div className="form-group">
                <label htmlFor="editClubName">Club Name *</label>
                <input
                  type="text"
                  id="editClubName"
                  name="name"
                  value={editClubForm.name}
                  onChange={handleEditClubInputChange}
                  placeholder="Enter club name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="editClubDescription">Description *</label>
                <textarea
                  id="editClubDescription"
                  name="description"
                  value={editClubForm.description}
                  onChange={handleEditClubInputChange}
                  placeholder="Enter club description"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="editCampusId">Campus *</label>
                  <select
                    id="editCampusId"
                    name="campus_id"
                    value={editClubForm.campus_id}
                    onChange={handleEditClubInputChange}
                    required
                  >
                    <option value="">Select Campus</option>
                    {availableCampuses.map(campus => (
                      <option key={campus.id} value={campus.id}>
                        {campus.name} - {campus.location}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="editFacultyCoordinatorId">Faculty Coordinator</label>
                  <select
                    id="editFacultyCoordinatorId"
                    name="faculty_coordinator_id"
                    value={editClubForm.faculty_coordinator_id}
                    onChange={handleEditClubInputChange}
                  >
                    <option value="">Select Faculty (Optional)</option>
                    {availableFaculty.map(faculty => (
                      <option key={faculty.id} value={faculty.id}>
                        {faculty.name} - {faculty.department}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={handleCloseEditClubModal}
                  disabled={editClubLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={editClubLoading}
                >
                  {editClubLoading ? 'Updating...' : 'Update Club'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Members Modal */}
      {showMembersModal && (
        <div className="modal-overlay" onClick={handleCloseMembersModal}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedClub?.name} - Members</h2>
              <button 
                className="close-modal-btn"
                onClick={handleCloseMembersModal}
              >
                ×
              </button>
            </div>
            <div className="members-content">
              {membersLoading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading members...</p>
                </div>
              ) : (
                <>
                  <div className="members-header">
                    <h3>Total Members: {clubMembers.length}</h3>
                  </div>
                  {clubMembers.length > 0 ? (
                    <div className="members-list">
                      {clubMembers.map((member) => (
                        <div key={member.id} className="member-card">
                          <div className="member-info">
                            <div className="member-details">
                              <h4>{member.name}</h4>
                              <p className="member-email">{member.email}</p>
                              <p className="member-id">ID: {member.student_id}</p>
                              <span className={`role-badge ${member.role.toLowerCase()}`}>
                                {member.role}
                              </span>
                            </div>
                            <div className="member-meta">
                              <p className="join-date">
                                Joined: {new Date(member.join_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="member-actions">
                            <button 
                              className={`remove-btn ${member.role === 'Head' ? 'remove-head' : ''}`}
                              onClick={() => handleRemoveMember(member.id, member.name, member.role)}
                              title={member.role === 'Head' 
                                ? `Force remove ${member.name} (Club Head)` 
                                : `Remove ${member.name} from club`}
                            >
                              {member.role === 'Head' ? 'Force Remove' : 'Remove'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-members">
                      <p>No members found for this club.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}