import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, notificationsService, approvalsService } from '../../services/api';
import api from '../../services/api';
import './Dashboard.css';

function AdminDashboard() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [stats, setStats] = useState<any>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardStats();
        loadUnreadCount();
        loadPendingApprovalsCount();
    }, []);

    const loadUnreadCount = async () => {
        try {
            const data = await notificationsService.getUnreadCount();
            setUnreadCount(data);
        } catch (error) {
            console.error('Failed to load unread count:', error);
        }
    };

    const loadPendingApprovalsCount = async () => {
        try {
            const data = await approvalsService.getPending();
            setPendingApprovalsCount(data.length);
        } catch (error) {
            console.error('Failed to load pending approvals count:', error);
        }
    };

    const loadDashboardStats = async () => {
        try {
            const response = await api.get('/analytics/dashboard');
            setStats(response.data);
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="loading">Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <nav className="dashboard-nav">
                <div className="nav-brand">
                    <h2>School Management</h2>
                    <span className="badge badge-admin">Admin</span>
                </div>
                <div className="nav-user">
                    <span className="user-name">{user?.name}</span>
                    <button onClick={handleLogout} className="btn btn-logout">
                        Logout
                    </button>
                </div>
            </nav>

            <div className="dashboard-content">
                <div className="page-header">
                    <h1>Admin Dashboard</h1>
                    <p>Welcome back, {user?.name}!</p>
                </div>

                <div className="stats-grid">
                    <div className="stat-card stat-primary">
                        <div className="stat-icon">👥</div>
                        <div className="stat-content">
                            <div className="stat-value">{stats?.totalStudents || 0}</div>
                            <div className="stat-label">Total Students</div>
                        </div>
                    </div>

                    <div className="stat-card stat-success">
                        <div className="stat-icon">👨‍🏫</div>
                        <div className="stat-content">
                            <div className="stat-value">{stats?.totalTeachers || 0}</div>
                            <div className="stat-label">Total Teachers</div>
                        </div>
                    </div>

                    <div className="stat-card stat-info">
                        <div className="stat-icon">🏫</div>
                        <div className="stat-content">
                            <div className="stat-value">{stats?.totalClasses || 0}</div>
                            <div className="stat-label">Total Classes</div>
                        </div>
                    </div>

                    <div className="stat-card stat-warning">
                        <div className="stat-icon">📊</div>
                        <div className="stat-content">
                            <div className="stat-value">{stats?.attendanceToday?.rate || 0}%</div>
                            <div className="stat-label">Today's Attendance</div>
                        </div>
                    </div>
                </div>

                <div className="dashboard-grid">
                    <div className="dashboard-card">
                        <h3>Quick Actions</h3>
                        <div className="action-list">
                            <button className="action-btn" onClick={() => navigate('/admin/register-student')}>
                                <span>📝</span>
                                <div>
                                    <strong>Register Student</strong>
                                    <p>Add new students with profile photos</p>
                                </div>
                            </button>
                            <button className="action-btn" onClick={() => navigate('/admin/teachers')}>
                                <span>👨‍🏫</span>
                                <div>
                                    <strong>View Teachers</strong>
                                    <p>See all teachers, their classes, and performance stats</p>
                                </div>
                            </button>
                            <button className="action-btn" onClick={() => navigate('/admin/register-teacher')}>
                                <span>➕</span>
                                <div>
                                    <strong>Register Teacher</strong>
                                    <p>Add new teacher and assign to class</p>
                                </div>
                            </button>
                            <button className="action-btn" onClick={() => navigate('/admin/classes')}>
                                <span>🏫</span>
                                <div>
                                    <strong>Manage Classes</strong>
                                    <p>Create, view, and delete classes & sections</p>
                                </div>
                            </button>
                            <button className="action-btn" onClick={() => navigate('/admin/approvals')}>
                                <span>✅</span>
                                <div>
                                    <strong>Pending Approvals</strong>
                                    {pendingApprovalsCount > 0 && <span className="notification-badge">{pendingApprovalsCount}</span>}
                                    <p>Review marks and fees pending approval</p>
                                </div>
                            </button>
                            <button className="action-btn">
                                <span>📈</span>
                                <div>
                                    <strong>Analytics</strong>
                                    <p>View class performance and reports</p>
                                </div>
                            </button>
                            <button className="action-btn" onClick={() => navigate('/admin/search')}>
                                <span>🔍</span>
                                <div>
                                    <strong>Student Search</strong>
                                    <p>Comprehensive search for marks, attendance & fees</p>
                                </div>
                            </button>
                            <button className="action-btn">
                                <span>💰</span>
                                <div>
                                    <strong>Fee Management</strong>
                                    <p>Manage school fees and payments</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <h3>Recent Activity</h3>
                        <div className="activity-list">
                            <div className="activity-item">
                                <div className="activity-dot"></div>
                                <div>
                                    <strong>System Active</strong>
                                    <p>Dashboard loaded successfully</p>
                                </div>
                            </div>
                            <div className="activity-item">
                                <div className="activity-dot"></div>
                                <div>
                                    <strong>Stats Updated</strong >
                                    <p>Latest statistics retrieved</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
