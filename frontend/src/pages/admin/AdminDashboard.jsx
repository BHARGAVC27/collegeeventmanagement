import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/apiService';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [registrationActivity, setRegistrationActivity] = useState([]);
  const [eventStats, setEventStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Stored Procedure State
  const [procedureEventId, setProcedureEventId] = useState('');
  const [procedureResult, setProcedureResult] = useState(null);
  const [procedureLoading, setProcedureLoading] = useState(false);
  
  // Nested Query State
  const [activeStudents, setActiveStudents] = useState([]);
  const [activeStudentsLoading, setActiveStudentsLoading] = useState(false);
  
  // JOIN Query State
  const [joinQueryEvents, setJoinQueryEvents] = useState([]);
  const [joinQueryLoading, setJoinQueryLoading] = useState(false);
  
  // Aggregate Query State
  const [clubStatistics, setClubStatistics] = useState([]);
  const [aggregateLoading, setAggregateLoading] = useState(false);
  
  // Create Club Modal State
  const [showCreateClubModal, setShowCreateClubModal] = useState(false);
  const [createClubForm, setCreateClubForm] = useState({
    name: '',
    description: '',
    faculty_coordinator_id: '',
    campus_id: '',
    club_head_student_id: ''
  });
  const [availableFaculty, setAvailableFaculty] = useState([]);
  const [availableCampuses, setAvailableCampuses] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
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

      // Fetch audit logs (trigger demo)
      const auditResponse = await apiService.getAuditLogs();
      if (auditResponse.success) {
        setAuditLogs(auditResponse.auditLogs || []);
      }

      // Fetch registration activity (trigger demo)
      const activityResponse = await apiService.getRegistrationActivity();
      if (activityResponse.success) {
        setRegistrationActivity(activityResponse.activities || []);
      }

      // Fetch event statistics (trigger demo)
      const eventStatsResponse = await apiService.getEventStatistics();
      if (eventStatsResponse.success) {
        setEventStats(eventStatsResponse.stats || []);
      }

      // Fetch students list for assigning club head
      try {
        const studentsResponse = await apiService.getStudents();
        if (studentsResponse.success) {
          setAvailableStudents(studentsResponse.students || []);
        }
      } catch (err) {
        console.warn('Unable to load students for club head selection', err);
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
      campus_id: '',
      club_head_student_id: ''
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
      const payload = { ...createClubForm };
      if (!payload.faculty_coordinator_id) delete payload.faculty_coordinator_id;
      if (!payload.club_head_student_id) delete payload.club_head_student_id;
      const response = await apiService.createClub(payload);
      
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

  const handleRemoveMember = async (memberId, memberName) => {
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

  // Handle Stored Procedure Execution
  const handleExecuteProcedure = async () => {
    if (!procedureEventId) {
      alert('Please enter an Event ID');
      return;
    }

    setProcedureLoading(true);
    try {
      const result = await apiService.getEventSummary(procedureEventId);
      if (result.success) {
        setProcedureResult(result.data);
      } else {
        alert(result.error || 'Failed to fetch event summary');
      }
    } catch (error) {
      console.error('Error executing procedure:', error);
      alert('Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setProcedureLoading(false);
    }
  };

  // Handle Nested Query Execution
  const handleFetchActiveStudents = async () => {
    setActiveStudentsLoading(true);
    try {
      const result = await apiService.getActiveStudents();
      if (result.success) {
        setActiveStudents(result.students || []);
      } else {
        alert(result.error || 'Failed to fetch active students');
      }
    } catch (error) {
      console.error('Error executing nested query:', error);
      alert('Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setActiveStudentsLoading(false);
    }
  };

  // Handle JOIN Query Execution
  const handleFetchJoinQueryEvents = async () => {
    setJoinQueryLoading(true);
    try {
      const result = await apiService.getEventDetailsWithJoins();
      if (result.success) {
        setJoinQueryEvents(result.events || []);
      } else {
        alert(result.error || 'Failed to fetch event details');
      }
    } catch (error) {
      console.error('Error executing JOIN query:', error);
      alert('Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setJoinQueryLoading(false);
    }
  };

  const handleFetchClubStatistics = async () => {
    setAggregateLoading(true);
    try {
      const result = await apiService.getClubStatistics();
      if (result.success) {
        setClubStatistics(result.clubs || []);
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error executing aggregate query:', error);
      alert('Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setAggregateLoading(false);
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
          <button 
            className={`nav-tab ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
            style={{ background: activeTab === 'audit' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent' }}
          >
            🔧 Trigger Audit Log
          </button>
          <button 
            className={`nav-tab ${activeTab === 'registrations' ? 'active' : ''}`}
            onClick={() => setActiveTab('registrations')}
            style={{ background: activeTab === 'registrations' ? 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)' : 'transparent' }}
          >
            📊 Registration Stats
          </button>
          <button 
            className={`nav-tab ${activeTab === 'procedure' ? 'active' : ''}`}
            onClick={() => setActiveTab('procedure')}
            style={{ background: activeTab === 'procedure' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'transparent' }}
          >
            🔬 Event Summary
          </button>
          <button 
            className={`nav-tab ${activeTab === 'active-students' ? 'active' : ''}`}
            onClick={() => setActiveTab('active-students')}
            style={{ background: activeTab === 'active-students' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent' }}
          >
            🌟 Active Students
          </button>
          <button 
            className={`nav-tab ${activeTab === 'join-query' ? 'active' : ''}`}
            onClick={() => setActiveTab('join-query')}
            style={{ background: activeTab === 'join-query' ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' : 'transparent' }}
          >
            🔗 JOIN Query Demo
          </button>
          <button 
            className={`nav-tab ${activeTab === 'aggregate' ? 'active' : ''}`}
            onClick={() => setActiveTab('aggregate')}
            style={{ background: activeTab === 'aggregate' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'transparent' }}
          >
            📊 Aggregate Functions
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
                    <p><strong>Campus:</strong> {club.campus_id}</p>
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

        {/* Trigger Audit Log Section */}
        {activeTab === 'audit' && (
          <div className="audit-section">
            <div className="section-header">
              <div>
                <h2>🔧 Database Trigger Audit Log</h2>
                <p className="section-subtitle">
                  These entries are automatically created by the <code>after_event_status_update</code> trigger when you approve/reject events
                </p>
              </div>
              <button onClick={fetchDashboardData} className="refresh-btn">
                🔄 Refresh
              </button>
            </div>

            {auditLogs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>No Audit Logs Yet</h3>
                <p>Approve or reject an event to see the trigger in action!</p>
                <p className="hint">The database trigger will automatically log the status change here.</p>
              </div>
            ) : (
              <div className="audit-table-container">
                <table className="audit-table">
                  <thead>
                    <tr>
                      <th>Event Name</th>
                      <th>Action</th>
                      <th>Admin</th>
                      <th>Description</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="event-name-cell">{log.event_name || `Event #${log.target_id}`}</td>
                        <td>
                          <span className={`action-badge action-${log.action_type.toLowerCase().replace('_', '-')}`}>
                            {log.action_type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="admin-cell">
                          {log.admin_name || `Admin #${log.admin_id}`}
                        </td>
                        <td className="description-cell">
                          {log.description}
                        </td>
                        <td className="timestamp-cell">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Trigger Explanation */}
            <div className="trigger-explanation">
              <h3>How It Works</h3>
              <div className="explanation-content">
                <div className="step">
                  <div className="step-number">1</div>
                  <div className="step-text">
                    <strong>You approve/reject an event</strong>
                    <p>When you click approve or reject, the event status in the database changes</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-number">2</div>
                  <div className="step-text">
                    <strong>Trigger fires automatically</strong>
                    <p>The <code>after_event_status_update</code> trigger detects the status change</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-number">3</div>
                  <div className="step-text">
                    <strong>Audit log created</strong>
                    <p>The trigger inserts a new row in <code>admin_audit_log</code> table with action details</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'registrations' && (
          <div className="registrations-section">
            <div className="section-header">
              <div>
                <h2>📊 Event Registration Statistics</h2>
                <p className="section-subtitle">
                  Counts automatically updated by <code>after_registration_insert/update/delete</code> triggers
                </p>
              </div>
              <button className="refresh-btn" onClick={fetchDashboardData}>
                🔄 Refresh Data
              </button>
            </div>

            {/* Event Statistics Table */}
            <div className="stats-table-container">
              <h3>Live Event Capacity Tracking</h3>
              {eventStats.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📅</div>
                  <h3>No Upcoming Events</h3>
                  <p>Create and approve some events to see registration statistics</p>
                </div>
              ) : (
                <table className="stats-table">
                  <thead>
                    <tr>
                      <th>Event Name</th>
                      <th>Club</th>
                      <th>Date</th>
                      <th>Registrations</th>
                      <th>Capacity</th>
                      <th>Fill %</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventStats.map((event) => (
                      <tr key={event.id}>
                        <td className="event-name-cell">{event.name}</td>
                        <td className="club-cell">{event.club_name}</td>
                        <td className="date-cell">
                          {new Date(event.event_date).toLocaleDateString()}
                        </td>
                        <td className="count-cell">
                          <span className="count-badge">{event.current_registrations || 0}</span>
                        </td>
                        <td className="capacity-cell">{event.max_participants}</td>
                        <td className="percentage-cell">
                          <div className="progress-bar-container">
                            <div 
                              className={`progress-bar ${event.capacity_status.toLowerCase()}`}
                              style={{ width: `${event.fill_percentage}%` }}
                            ></div>
                            <span className="percentage-text">{event.fill_percentage}%</span>
                          </div>
                        </td>
                        <td>
                          <span className={`capacity-badge ${event.capacity_status.toLowerCase()}`}>
                            {event.capacity_status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Registration Activity Log */}
            <div className="activity-log-container">
              <h3>Recent Registration Activity</h3>
              {registrationActivity.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">👥</div>
                  <h3>No Registration Activity Yet</h3>
                  <p>Activity will appear here when students register or cancel</p>
                </div>
              ) : (
                <table className="activity-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Event</th>
                      <th>Action</th>
                      <th>Count Change</th>
                      <th>Timestamp</th>
                      <th>Trigger</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrationActivity.slice(0, 20).map((activity) => (
                      <tr key={activity.id}>
                        <td className="student-cell">
                          <div className="student-name">{activity.student_name}</div>
                          <div className="student-roll">{activity.student_roll}</div>
                        </td>
                        <td className="event-cell">{activity.event_name}</td>
                        <td>
                          <span className={`action-badge action-${activity.action_type.toLowerCase()}`}>
                            {activity.action_type}
                          </span>
                        </td>
                        <td className="count-change-cell">
                          <span className="count-display">
                            {activity.old_count} → {activity.new_count}
                            {activity.capacity && ` / ${activity.capacity}`}
                          </span>
                        </td>
                        <td className="timestamp-cell">
                          {new Date(activity.activity_timestamp).toLocaleString()}
                        </td>
                        <td className="trigger-cell">
                          <code>{activity.trigger_name}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Explanation Section */}
            <div className="trigger-explanation">
              <h3>How Registration Count Triggers Work</h3>
              <div className="explanation-content">
                <div className="step">
                  <div className="step-number">1</div>
                  <div className="step-text">
                    <strong>Student registers/cancels</strong>
                    <p>INSERT, UPDATE, or DELETE operation on <code>event_registrations</code> table</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-number">2</div>
                  <div className="step-text">
                    <strong>Trigger fires automatically</strong>
                    <p><code>AFTER INSERT/UPDATE/DELETE</code> triggers detect the change</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-number">3</div>
                  <div className="step-text">
                    <strong>Count updated in real-time</strong>
                    <p>Trigger updates <code>events.current_registrations</code> and logs to <code>registration_activity_log</code></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stored Procedure Section */}
        {activeTab === 'procedure' && (
          <div className="procedure-section">
            <div className="section-header" style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white'
            }}>
              <div>
                <h2>🔬 Event Summary Stored Procedure</h2>
                <p className="section-subtitle">
                  Get comprehensive event details using the <code>get_event_summary()</code> stored procedure
                </p>
              </div>
              <button className="refresh-btn" onClick={() => {
                setProcedureEventId('');
                setProcedureResult(null);
              }} style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                🔄 Clear
              </button>
            </div>

            {/* Input Form */}
            <div className="procedure-input-container">
              <div className="input-group">
                <label htmlFor="procedureEventId">
                  <strong>Enter Event ID:</strong>
                  <span className="input-hint">Get details for any event in the system</span>
                </label>
                <div className="input-with-button">
                  <input
                    type="number"
                    id="procedureEventId"
                    value={procedureEventId}
                    onChange={(e) => setProcedureEventId(e.target.value)}
                    placeholder="e.g., 1"
                    className="procedure-input"
                    disabled={procedureLoading}
                  />
                  <button
                    onClick={handleExecuteProcedure}
                    disabled={procedureLoading || !procedureEventId}
                    className="execute-btn"
                  >
                    {procedureLoading ? '⏳ Loading...' : '▶️ Execute Procedure'}
                  </button>
                </div>
              </div>
            </div>

            {/* Results Display */}
            {procedureResult && (
              <div className="procedure-results">
                <h3>📋 Procedure Results</h3>
                <div className="results-grid">
                  {/* Event Information Card */}
                  <div className="result-card">
                    <div className="card-header">
                      <h4>📅 Event Information</h4>
                    </div>
                    <div className="card-body">
                      <div className="result-row">
                        <span className="result-label">Event ID:</span>
                        <span className="result-value">{procedureResult.id}</span>
                      </div>
                      <div className="result-row">
                        <span className="result-label">Event Name:</span>
                        <span className="result-value">{procedureResult.name}</span>
                      </div>
                      <div className="result-row">
                        <span className="result-label">Description:</span>
                        <span className="result-value">{procedureResult.description || 'N/A'}</span>
                      </div>
                      <div className="result-row">
                        <span className="result-label">Date:</span>
                        <span className="result-value">
                          {new Date(procedureResult.event_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="result-row">
                        <span className="result-label">Time:</span>
                        <span className="result-value">
                          {procedureResult.start_time || 'N/A'} - {procedureResult.end_time || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Organizer & Venue Card */}
                  <div className="result-card">
                    <div className="card-header">
                      <h4>🏛️ Organizer & Venue</h4>
                    </div>
                    <div className="card-body">
                      <div className="result-row">
                        <span className="result-label">Organizing Club:</span>
                        <span className="result-value highlight-orange">
                          {procedureResult.club_name || 'No Club Assigned'}
                        </span>
                      </div>
                      <div className="result-row">
                        <span className="result-label">Venue:</span>
                        <span className="result-value">{procedureResult.venue_name || 'Not Booked'}</span>
                      </div>
                      <div className="result-row">
                        <span className="result-label">Venue Capacity:</span>
                        <span className="result-value">{procedureResult.capacity || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Registration Statistics Card */}
                  <div className="result-card">
                    <div className="card-header">
                      <h4>👥 Registration Statistics</h4>
                    </div>
                    <div className="card-body">
                      <div className="result-row">
                        <span className="result-label">Total Registrations:</span>
                        <span className="result-value stat-highlight">
                          {procedureResult.total_registrations || 0}
                        </span>
                      </div>
                      <div className="result-row">
                        <span className="result-label">Seats Available:</span>
                        <span className="result-value">
                          {procedureResult.seats_available !== null ? procedureResult.seats_available : 'N/A'}
                        </span>
                      </div>
                      <div className="result-row">
                        <span className="result-label">Fill Percentage:</span>
                        <span className="result-value">
                          <div className="progress-bar-container">
                            <div
                              className={`progress-bar ${
                                procedureResult.fill_percentage >= 90 ? 'full' :
                                procedureResult.fill_percentage >= 70 ? 'high' :
                                procedureResult.fill_percentage >= 40 ? 'medium' : 'low'
                              }`}
                              style={{ width: `${procedureResult.fill_percentage || 0}%` }}
                            ></div>
                            <span className="percentage-text">
                              {procedureResult.fill_percentage !== null ? `${procedureResult.fill_percentage}%` : 'N/A'}
                            </span>
                          </div>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Procedure Info Box */}
                <div className="procedure-info-box">
                  <h4>ℹ️ About This Stored Procedure</h4>
                  <p>
                    The <code>get_event_summary(p_event_id INT)</code> stored procedure retrieves comprehensive
                    information about an event by performing the following operations:
                  </p>
                  <ul>
                    <li>Joins <code>events</code> table with <code>clubs</code> to get organizer information</li>
                    <li>Joins with <code>venue_bookings</code> and <code>venues</code> to get venue details</li>
                    <li>Counts registrations from <code>event_registrations</code> table</li>
                    <li>Calculates available seats and fill percentage automatically</li>
                  </ul>
                  <p className="procedure-note">
                    <strong>Note:</strong> This is a READ-ONLY procedure that doesn't modify any data.
                  </p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!procedureResult && !procedureLoading && (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>Enter an Event ID to Execute Procedure</h3>
                <p>The stored procedure will retrieve comprehensive event details including venue, club, and registration statistics</p>
              </div>
            )}
          </div>
        )}

        {/* Nested Query Section - Active Students */}
        {activeTab === 'active-students' && (
          <div className="nested-query-section">
            <div className="section-header" style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white'
            }}>
              <div>
                <h2>🌟 Highly Active Students (Nested Query)</h2>
                <p className="section-subtitle">
                  Find students with above-average event participation using nested subqueries
                </p>
              </div>
              <button 
                className="refresh-btn" 
                onClick={handleFetchActiveStudents}
                disabled={activeStudentsLoading}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                {activeStudentsLoading ? '⏳ Loading...' : '🔄 Execute Query'}
              </button>
            </div>

            {/* Results Display */}
            {activeStudents.length > 0 && (
              <div className="nested-query-results">
                <div className="query-explanation-box">
                  <h4>📊 Query Logic</h4>
                  <p>This query uses <strong>multiple nested subqueries</strong> to:</p>
                  <ul>
                    <li>Calculate the <strong>average</strong> number of events per student (subquery)</li>
                    <li>Compare each student's registrations <strong>against the average</strong> (HAVING clause with subquery)</li>
                    <li>Categorize students as "Highly Active", "Active", or "Average" (CASE with nested subqueries)</li>
                    <li>Filter only students who exceed the average (nested subquery in HAVING)</li>
                  </ul>
                </div>

                <div className="stats-summary">
                  <div className="summary-card">
                    <div className="summary-icon">👥</div>
                    <div className="summary-content">
                      <h3>{activeStudents.length}</h3>
                      <p>Highly Active Students</p>
                      <span className="summary-badge success">Above Average</span>
                    </div>
                  </div>
                  <div className="summary-card">
                    <div className="summary-icon">📈</div>
                    <div className="summary-content">
                      <h3>{activeStudents[0]?.average_events_per_student || 0}</h3>
                      <p>Average Events/Student</p>
                      <span className="summary-badge info">Baseline</span>
                    </div>
                  </div>
                  <div className="summary-card">
                    <div className="summary-icon">🏆</div>
                    <div className="summary-content">
                      <h3>{activeStudents.filter(s => s.engagement_level === 'Highly Active').length}</h3>
                      <p>Highly Engaged</p>
                      <span className="summary-badge highly-active">Top Performers</span>
                    </div>
                  </div>
                </div>

                <div className="students-table-container">
                  <h3>🎓 Student Details</h3>
                  <table className="students-table">
                    <thead>
                      <tr>
                        <th>Roll Number</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Branch</th>
                        <th>Year</th>
                        <th>Events Registered</th>
                        <th>Events Attended</th>
                        <th>Clubs Joined</th>
                        <th>Engagement Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeStudents.map((student) => (
                        <tr key={student.id}>
                          <td className="roll-cell">{student.roll_number}</td>
                          <td className="name-cell">{student.name}</td>
                          <td className="email-cell">{student.email}</td>
                          <td>{student.branch || 'N/A'}</td>
                          <td className="year-cell">{student.year_of_study || 'N/A'}</td>
                          <td className="count-cell">
                            <span className="count-badge primary">{student.total_events_registered}</span>
                          </td>
                          <td className="count-cell">
                            <span className="count-badge success">{student.events_attended}</span>
                          </td>
                          <td className="count-cell">
                            <span className="count-badge info">{student.clubs_joined}</span>
                          </td>
                          <td>
                            <span className={`engagement-badge ${student.engagement_level.toLowerCase().replace(' ', '-')}`}>
                              {student.engagement_level}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* SQL Query Display */}
                <div className="sql-display-box">
                  <h4>💻 Nested Query Structure</h4>
                  <pre className="sql-code">
{`SELECT s.name, COUNT(DISTINCT er.event_id) AS total_events
FROM students s
LEFT JOIN event_registrations er ON s.id = er.student_id
GROUP BY s.id
HAVING COUNT(DISTINCT er.event_id) > (
    -- Nested Subquery: Calculate Average
    SELECT AVG(event_count) FROM (
        SELECT COUNT(DISTINCT er2.event_id) AS event_count
        FROM students s2
        LEFT JOIN event_registrations er2 ON s2.id = er2.student_id
        GROUP BY s2.id
    ) AS student_event_counts
)
ORDER BY total_events DESC;`}
                  </pre>
                  <p className="sql-note">
                    <strong>Note:</strong> The actual query uses multiple nested subqueries in SELECT, CASE, and HAVING clauses
                    to calculate averages and categorize students dynamically.
                  </p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {activeStudents.length === 0 && !activeStudentsLoading && (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>Click "Execute Query" to Find Active Students</h3>
                <p>This nested query will identify students who have registered for more events than the average student</p>
                <div className="empty-hint">
                  <strong>Use Case:</strong> Perfect for identifying engaged students for leadership roles, awards, or scholarships
                </div>
              </div>
            )}

            {activeStudentsLoading && (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Executing nested query...</p>
              </div>
            )}
          </div>
        )}

        {/* JOIN Query Section - Event Details */}
        {activeTab === 'join-query' && (
          <div className="join-query-section">
            <div className="section-header" style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: 'white'
            }}>
              <div>
                <h2>🔗 Multiple JOIN Query Demonstration</h2>
                <p className="section-subtitle">
                  Fetch complete event details using INNER and LEFT JOINs across 5 tables
                </p>
              </div>
              <button 
                className="refresh-btn" 
                onClick={handleFetchJoinQueryEvents}
                disabled={joinQueryLoading}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                {joinQueryLoading ? '⏳ Loading...' : '▶️ Execute JOIN Query'}
              </button>
            </div>

            {/* JOIN Explanation */}
            <div className="join-explanation-box">
              <h4>🔗 JOIN Query Structure</h4>
              <p>This query demonstrates <strong>multiple JOIN operations</strong> combining data from 5 tables:</p>
              <div className="join-diagram">
                <div className="join-step">
                  <div className="table-badge main">events</div>
                  <div className="join-arrow">INNER JOIN →</div>
                  <div className="table-badge">clubs</div>
                  <p className="join-description">Every event must have an organizing club</p>
                </div>
                <div className="join-step">
                  <div className="table-badge main">events</div>
                  <div className="join-arrow">LEFT JOIN →</div>
                  <div className="table-badge">venue_bookings</div>
                  <p className="join-description">Events may or may not have venue bookings</p>
                </div>
                <div className="join-step">
                  <div className="table-badge">venue_bookings</div>
                  <div className="join-arrow">LEFT JOIN →</div>
                  <div className="table-badge">venues</div>
                  <p className="join-description">Bookings reference specific venues</p>
                </div>
                <div className="join-step">
                  <div className="table-badge">venues</div>
                  <div className="join-arrow">LEFT JOIN →</div>
                  <div className="table-badge">campus</div>
                  <p className="join-description">Venues belong to a campus</p>
                </div>
                <div className="join-step">
                  <div className="table-badge main">events</div>
                  <div className="join-arrow">LEFT JOIN →</div>
                  <div className="table-badge">event_registrations</div>
                  <p className="join-description">Count student registrations (with aggregation)</p>
                </div>
              </div>
            </div>

            {/* Results Display */}
            {joinQueryEvents.length > 0 && (
              <div className="join-results">
                <div className="results-summary">
                  <div className="summary-stat">
                    <div className="stat-icon">📅</div>
                    <div className="stat-text">
                      <h3>{joinQueryEvents.length}</h3>
                      <p>Upcoming Events</p>
                    </div>
                  </div>
                  <div className="summary-stat">
                    <div className="stat-icon">🔗</div>
                    <div className="stat-text">
                      <h3>5</h3>
                      <p>Tables Joined</p>
                    </div>
                  </div>
                  <div className="summary-stat">
                    <div className="stat-icon">📊</div>
                    <div className="stat-text">
                      <h3>{joinQueryEvents.reduce((sum, e) => sum + (e.total_registrations || 0), 0)}</h3>
                      <p>Total Registrations</p>
                    </div>
                  </div>
                </div>

                <div className="events-cards-grid">
                  {joinQueryEvents.map((event) => (
                    <div key={event.event_id} className="event-detail-card">
                      <div className="card-header-purple">
                        <h3>{event.event_name}</h3>
                        <span className="event-type-badge">{event.event_type}</span>
                      </div>
                      
                      <div className="card-body">
                        {/* Event Details */}
                        <div className="detail-section">
                          <h4>📅 Event Information</h4>
                          <div className="detail-grid">
                            <div className="detail-item">
                              <span className="label">Date:</span>
                              <span className="value">{new Date(event.event_date).toLocaleDateString()}</span>
                            </div>
                            <div className="detail-item">
                              <span className="label">Time:</span>
                              <span className="value">{event.start_time} - {event.end_time}</span>
                            </div>
                            <div className="detail-item">
                              <span className="label">Status:</span>
                              <span className={`status-badge ${event.status.toLowerCase()}`}>{event.status}</span>
                            </div>
                            <div className="detail-item">
                              <span className="label">Max Participants:</span>
                              <span className="value">{event.max_participants || 'Unlimited'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Club Details (INNER JOIN) */}
                        <div className="detail-section">
                          <h4>🏛️ Club (INNER JOIN)</h4>
                          <div className="detail-grid">
                            <div className="detail-item">
                              <span className="label">Club Name:</span>
                              <span className="value highlight-purple">{event.club_name}</span>
                            </div>
                            <div className="detail-item full-width">
                              <span className="label">Description:</span>
                              <span className="value">{event.club_description || 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Venue & Campus Details (LEFT JOINs) */}
                        <div className="detail-section">
                          <h4>📍 Venue & Campus (LEFT JOINs)</h4>
                          <div className="detail-grid">
                            <div className="detail-item">
                              <span className="label">Venue:</span>
                              <span className="value">{event.venue_name || 'Not Booked'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="label">Type:</span>
                              <span className="value">{event.venue_type || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="label">Capacity:</span>
                              <span className="value">{event.venue_capacity || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="label">Campus:</span>
                              <span className="value">{event.campus_name || 'N/A'}</span>
                            </div>
                            {event.venue_equipment && (
                              <div className="detail-item full-width">
                                <span className="label">Equipment:</span>
                                <span className="value">{event.venue_equipment}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Registration Stats (LEFT JOIN with COUNT) */}
                        <div className="detail-section">
                          <h4>👥 Registrations (LEFT JOIN + Aggregation)</h4>
                          <div className="stats-bar">
                            <div className="stat-box">
                              <div className="stat-number">{event.total_registrations || 0}</div>
                              <div className="stat-label">Registered</div>
                            </div>
                            <div className="stat-box">
                              <div className="stat-number">{event.attended_count || 0}</div>
                              <div className="stat-label">Attended</div>
                            </div>
                            {event.max_participants && (
                              <div className="stat-box">
                                <div className="stat-number">
                                  {Math.round((event.total_registrations / event.max_participants) * 100)}%
                                </div>
                                <div className="stat-label">Fill Rate</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* SQL Query Display */}
                <div className="sql-display-box">
                  <h4>💻 JOIN Query SQL</h4>
                  <pre className="sql-code">
{`SELECT 
    e.*, 
    c.name AS club_name,
    v.name AS venue_name,
    campus.name AS campus_name,
    COUNT(er.id) AS total_registrations
FROM events e
INNER JOIN clubs c 
    ON e.organized_by_club_id = c.id
LEFT JOIN venue_bookings vb 
    ON e.booking_id = vb.id
LEFT JOIN venues v 
    ON vb.venue_id = v.id
LEFT JOIN campus 
    ON v.campus_id = campus.id
LEFT JOIN event_registrations er 
    ON e.id = er.event_id
WHERE e.status = 'Approved'
GROUP BY e.id, c.id, v.id, campus.id;`}
                  </pre>
                </div>
              </div>
            )}

            {/* Empty State */}
            {joinQueryEvents.length === 0 && !joinQueryLoading && (
              <div className="empty-state">
                <div className="empty-icon">🔗</div>
                <h3>Click "Execute JOIN Query" to See Results</h3>
                <p>This query will fetch complete event details by joining data from 5 different tables</p>
                <div className="empty-hint" style={{ background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)' }}>
                  <strong>Tables Joined:</strong> events → clubs → venue_bookings → venues → campus + event_registrations
                </div>
              </div>
            )}

            {joinQueryLoading && (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Executing JOIN query across 5 tables...</p>
              </div>
            )}
          </div>
        )}

        {/* Aggregate Query Section - Club Statistics */}
        {activeTab === 'aggregate' && (
          <div className="aggregate-query-section">
            <div className="section-header" style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white'
            }}>
              <div>
                <h2>📊 Aggregate Functions Demonstration</h2>
                <p className="section-subtitle">
                  Comprehensive club statistics using COUNT, AVG, MAX, MIN with GROUP BY and HAVING
                </p>
              </div>
              <button 
                className="refresh-btn" 
                onClick={handleFetchClubStatistics}
                disabled={aggregateLoading}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                {aggregateLoading ? '⏳ Loading...' : '▶️ Execute Aggregate Query'}
              </button>
            </div>

            {/* Aggregate Functions Explanation */}
            <div className="aggregate-explanation-box">
              <h4>📊 Aggregate Functions Used</h4>
              <p>This query demonstrates <strong>multiple aggregate functions</strong> with GROUP BY and HAVING clauses:</p>
              <div className="aggregate-functions-grid">
                <div className="function-card">
                  <div className="function-icon">🔢</div>
                  <h5>COUNT()</h5>
                  <p>Total events, registrations, members per club</p>
                </div>
                <div className="function-card">
                  <div className="function-icon">📈</div>
                  <h5>AVG()</h5>
                  <p>Average registrations per event</p>
                </div>
                <div className="function-card">
                  <div className="function-icon">⬆️</div>
                  <h5>MAX()</h5>
                  <p>Maximum registrations for any event</p>
                </div>
                <div className="function-card">
                  <div className="function-icon">⬇️</div>
                  <h5>MIN()</h5>
                  <p>Minimum registrations for events</p>
                </div>
                <div className="function-card">
                  <div className="function-icon">🎯</div>
                  <h5>GROUP BY</h5>
                  <p>Groups results by club</p>
                </div>
                <div className="function-card">
                  <div className="function-icon">🔍</div>
                  <h5>HAVING</h5>
                  <p>Filters clubs with events {'>'} 0</p>
                </div>
              </div>
            </div>

            {/* Results Display */}
            {clubStatistics.length > 0 && (
              <div className="aggregate-results">
                <div className="results-header">
                  <h3>📊 Club Performance Statistics</h3>
                  <p>Showing {clubStatistics.length} active clubs with event data</p>
                </div>

                <div className="clubs-stats-grid">
                  {clubStatistics.map((club) => (
                    <div key={club.club_id} className="club-stats-card">
                      <div className="card-header-amber">
                        <div>
                          <h3>{club.club_name}</h3>
                          <span className="club-category-badge">Active Club</span>
                        </div>
                        <div className="club-id">ID: {club.club_id}</div>
                      </div>
                      
                      <div className="stats-body">
                        {/* Event Statistics */}
                        <div className="stats-section">
                          <h4>📅 Event Statistics (COUNT)</h4>
                          <div className="stats-row">
                            <div className="stat-item">
                              <span className="stat-label">Total Events:</span>
                              <span className="stat-value highlight">{club.total_events}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">Approved:</span>
                              <span className="stat-value success">{club.approved_events}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">Completed:</span>
                              <span className="stat-value">{club.completed_events}</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">Pending:</span>
                              <span className="stat-value warning">{club.pending_events}</span>
                            </div>
                          </div>
                        </div>

                        {/* Registration Statistics */}
                        <div className="stats-section">
                          <h4>👥 Registration Analytics</h4>
                          <div className="stats-grid-2col">
                            <div className="metric-box">
                              <div className="metric-label">Total Registrations (COUNT)</div>
                              <div className="metric-value">{club.total_registrations}</div>
                            </div>
                            <div className="metric-box">
                              <div className="metric-label">Average per Event (AVG)</div>
                              <div className="metric-value">{parseFloat(club.avg_registrations_per_event).toFixed(2)}</div>
                            </div>
                            <div className="metric-box">
                              <div className="metric-label">Highest Turnout (MAX)</div>
                              <div className="metric-value highlight">{club.max_registrations_event}</div>
                            </div>
                            <div className="metric-box">
                              <div className="metric-label">Lowest Turnout (MIN)</div>
                              <div className="metric-value">{club.min_registrations_event}</div>
                            </div>
                          </div>
                        </div>

                        {/* Member & Attendance */}
                        <div className="stats-section">
                          <h4>🎯 Participation Metrics</h4>
                          <div className="participation-grid">
                            <div className="participation-item">
                              <div className="participation-number">{club.total_members}</div>
                              <div className="participation-label">Club Members</div>
                            </div>
                            <div className="participation-item">
                              <div className="participation-number">{club.total_attendees}</div>
                              <div className="participation-label">Total Attendees</div>
                            </div>
                          </div>
                        </div>

                        {/* Percentage Metrics */}
                        <div className="stats-section">
                          <h4>📈 Performance Rates (Calculated)</h4>
                          <div className="progress-bars">
                            <div className="progress-item">
                              <div className="progress-label">
                                <span>Completion Rate</span>
                                <span className="progress-percentage">{club.completion_rate_percentage}%</span>
                              </div>
                              <div className="progress-bar-container">
                                <div 
                                  className="progress-bar-fill completion" 
                                  style={{ width: `${club.completion_rate_percentage}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="progress-item">
                              <div className="progress-label">
                                <span>Attendance Rate</span>
                                <span className="progress-percentage">{club.attendance_rate_percentage}%</span>
                              </div>
                              <div className="progress-bar-container">
                                <div 
                                  className="progress-bar-fill attendance" 
                                  style={{ width: `${club.attendance_rate_percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* SQL Query Display */}
                <div className="sql-display-box aggregate">
                  <h4>💻 Aggregate Query SQL</h4>
                  <pre className="sql-code">
{`SELECT 
    c.id, c.name, c.category,
    COUNT(DISTINCT e.id) AS total_events,
    COUNT(DISTINCT CASE WHEN e.status = 'Completed' THEN e.id END) AS completed_events,
    COUNT(DISTINCT er.id) AS total_registrations,
    AVG(registration_count) AS avg_registrations_per_event,
    MAX(registration_count) AS max_registrations_event,
    MIN(registration_count) AS min_registrations_event,
    COUNT(DISTINCT cm.student_id) AS total_members,
    ROUND((completed_events * 100.0 / total_events), 2) AS completion_rate,
    ROUND((attendees * 100.0 / registrations), 2) AS attendance_rate
FROM clubs c
LEFT JOIN events e ON c.id = e.organized_by_club_id
LEFT JOIN event_registrations er ON e.id = er.event_id
LEFT JOIN club_members cm ON c.id = cm.club_id
GROUP BY c.id, c.name, c.category
HAVING COUNT(DISTINCT e.id) > 0
ORDER BY total_events DESC;`}
                  </pre>
                </div>
              </div>
            )}

            {/* Empty State */}
            {clubStatistics.length === 0 && !aggregateLoading && (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <h3>Click "Execute Aggregate Query" to See Results</h3>
                <p>This query will calculate comprehensive statistics for all clubs using multiple aggregate functions</p>
                <div className="empty-hint" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' }}>
                  <strong>Functions Used:</strong> COUNT(), AVG(), MAX(), MIN() with GROUP BY and HAVING clauses
                </div>
              </div>
            )}

            {aggregateLoading && (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Calculating aggregate statistics across all clubs...</p>
              </div>
            )}
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

              <div className="form-group">
                <label htmlFor="clubHeadStudentId">Assign Club Head</label>
                <select
                  id="clubHeadStudentId"
                  name="club_head_student_id"
                  value={createClubForm.club_head_student_id}
                  onChange={handleCreateClubInputChange}
                >
                  <option value="">Select Student (Optional)</option>
                  {availableStudents.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.student_id}) - {student.email}
                    </option>
                  ))}
                </select>
                <small style={{color:'#64748b'}}>If selected, the student will be set as club head and added as a member.</small>
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