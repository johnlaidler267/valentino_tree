import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import NewsletterEditor from './NewsletterEditor';
import ProductManagement from './ProductManagement';
import './AdminDashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('appointments');
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const adminPassword = localStorage.getItem('adminPassword') || password;
    try {
      const response = await axios.get(`${API_URL}/appointments`, {
        headers: {
          'x-admin-password': adminPassword
        }
      });
      setAppointments(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch appointments. Please check your password.');
      if (err.response?.status === 401) {
        setIsAuthenticated(false);
        localStorage.removeItem('adminPassword');
      }
    } finally {
      setLoading(false);
    }
  }, [password]);

  const filterAppointments = useCallback(() => {
    let filtered = [...appointments];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(apt =>
        apt.name.toLowerCase().includes(term) ||
        apt.email.toLowerCase().includes(term) ||
        apt.phone.includes(term) ||
        apt.address.toLowerCase().includes(term) ||
        apt.service_type.toLowerCase().includes(term)
      );
    }

    setFilteredAppointments(filtered);
  }, [appointments, statusFilter, searchTerm]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAppointments();
    }
  }, [isAuthenticated, fetchAppointments]);

  useEffect(() => {
    filterAppointments();
  }, [filterAppointments]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post(`${API_URL}/admin/login`, { password });
      if (response.data.authenticated) {
        setIsAuthenticated(true);
        localStorage.setItem('adminPassword', password);
        setPassword('');
      }
    } catch (err) {
      setError('Invalid password. Please try again.');
      setPassword('');
    }
  };


  const updateStatus = async (id, newStatus) => {
    const adminPassword = localStorage.getItem('adminPassword') || password;
    try {
      await axios.put(
        `${API_URL}/appointments/${id}`,
        { status: newStatus },
        {
          headers: {
            'x-admin-password': adminPassword
          }
        }
      );
      fetchAppointments();
    } catch (err) {
      setError('Failed to update appointment status');
      if (err.response?.status === 401) {
        setIsAuthenticated(false);
        localStorage.removeItem('adminPassword');
      }
    }
  };

  const deleteAppointment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) {
      return;
    }

    const adminPassword = localStorage.getItem('adminPassword') || password;
    try {
      await axios.delete(`${API_URL}/appointments/${id}`, {
        headers: {
          'x-admin-password': adminPassword
        }
      });
      fetchAppointments();
    } catch (err) {
      setError('Failed to delete appointment');
      if (err.response?.status === 401) {
        setIsAuthenticated(false);
        localStorage.removeItem('adminPassword');
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      confirmed: '#10b981',
      completed: '#3b82f6',
      cancelled: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login-container">
        <div className="container">
          <div className="login-box">
            <h2>Admin Login</h2>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                />
              </div>
              {error && <div className="alert alert-error">{error}</div>}
              <button type="submit" className="login-btn">Login</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <div className="container">
        <div className="dashboard-header">
          <h2>Admin Dashboard</h2>
          <button 
            className="logout-btn"
            onClick={() => {
              setIsAuthenticated(false);
              setPassword('');
              localStorage.removeItem('adminPassword');
            }}
          >
            Logout
          </button>
        </div>

        <div className="admin-tabs">
          <button
            className={activeTab === 'appointments' ? 'admin-tab active' : 'admin-tab'}
            onClick={() => setActiveTab('appointments')}
          >
            Appointments
          </button>
          <button
            className={activeTab === 'newsletter' ? 'admin-tab active' : 'admin-tab'}
            onClick={() => setActiveTab('newsletter')}
          >
            Newsletter
          </button>
          <button
            className={activeTab === 'products' ? 'admin-tab active' : 'admin-tab'}
            onClick={() => setActiveTab('products')}
          >
            Products
          </button>
        </div>

        {activeTab === 'appointments' && (
          <div className="tab-content">
            {error && <div className="alert alert-error">{error}</div>}

            <div className="dashboard-controls">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search appointments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="filter-box">
                <label>Filter by Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <button className="refresh-btn" onClick={fetchAppointments}>
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="loading">Loading appointments...</div>
            ) : filteredAppointments.length === 0 ? (
              <div className="no-appointments">No appointments found.</div>
            ) : (
              <div className="appointments-table-container">
                <table className="appointments-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Service</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Address</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.map(appointment => (
                      <tr key={appointment.id}>
                        <td>{appointment.id}</td>
                        <td>{appointment.name}</td>
                        <td>{appointment.email}</td>
                        <td>{appointment.phone}</td>
                        <td>{appointment.service_type}</td>
                        <td>{new Date(appointment.date).toLocaleDateString()}</td>
                        <td>{appointment.time}</td>
                        <td className="address-cell">{appointment.address}</td>
                        <td>
                          <select
                            value={appointment.status}
                            onChange={(e) => updateStatus(appointment.id, e.target.value)}
                            style={{ 
                              backgroundColor: getStatusColor(appointment.status),
                              color: 'white',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td>
                          <button
                            className="delete-btn"
                            onClick={() => deleteAppointment(appointment.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'newsletter' && (
          <div className="tab-content">
            <NewsletterEditor />
          </div>
        )}

        {activeTab === 'products' && (
          <div className="tab-content">
            <ProductManagement />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

