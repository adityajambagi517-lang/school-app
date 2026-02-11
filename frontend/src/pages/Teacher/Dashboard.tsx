import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import './Dashboard.css';

function TeacherDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(authService.getCurrentUser());

    useEffect(() => {
        const refreshUser = async () => {
            try {
                const freshUser = await authService.getMe();
                setUser(freshUser);
            } catch (err) {
                console.error('Failed to refresh user profile:', err);
            }
        };
        refreshUser();
    }, []);

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <div className="dashboard-container">
            <nav className="dashboard-nav">
                <div className="nav-brand">
                    <h2>School Management</h2>
                    <span className="badge badge-teacher">Teacher</span>
                </div>
                <div className="nav-user">
                    {user?.teacherDetails?.profileImage ? (
                        <img
                            src={user.teacherDetails.profileImage}
                            alt={user?.name}
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                marginRight: '10px'
                            }}
                        />
                    ) : (
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            marginRight: '10px'
                        }}>
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <span className="user-name">{user?.name}</span>
                    <button onClick={handleLogout} className="btn btn-logout">
                        Logout
                    </button>
                </div>
            </nav>

            <div className="dashboard-content">
                <div className="page-header">
                    <h1>👨‍🏫 Teacher Dashboard</h1>
                    <p>Welcome back, {user?.name}!</p>
                </div>

                {/* Class Information Card */}
                {user?.assignedClassId && (
                    <div className="class-info-card" style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        marginBottom: '2rem',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ fontSize: '3rem' }}>🏫</div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>
                                    Your Assigned Class
                                </h3>
                                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                                    <div>
                                        <div style={{ opacity: 0.9, fontSize: '0.9rem' }}>Class & Section</div>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                                            {user.className} - {user.section}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ opacity: 0.9, fontSize: '0.9rem' }}>Total Students</div>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                                            {user.totalStudents || 0}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="dashboard-grid">
                    <div className="dashboard-card">
                        <h3>📋 Class Management</h3>
                        <div className="action-list">
                            <button className="action-btn" onClick={() => navigate('/teacher/manage-subjects')}>
                                <span>📚</span>
                                <div>
                                    <strong>Manage Subjects</strong>
                                    <p>Create and manage subjects</p>
                                </div>
                            </button>
                            <button className="action-btn" onClick={() => navigate('/teacher/manage-homework')}>
                                <span>📝</span>
                                <div>
                                    <strong>Manage Homework</strong>
                                    <p>Assign homework to students</p>
                                </div>
                            </button>
                            <button className="action-btn" onClick={() => navigate('/teacher/register-student')}>
                                <span>👤</span>
                                <div>
                                    <strong>Register Student</strong>
                                    <p>Add new students to your class</p>
                                </div>
                            </button>
                            <button className="action-btn" onClick={() => navigate('/teacher/view-students')}>
                                <span>👥</span>
                                <div>
                                    <strong>View All Students</strong>
                                    <p>See complete list of your students</p>
                                </div>
                            </button>
                            <button className="action-btn" onClick={() => navigate('/teacher/mark-attendance')}>
                                <span>✅</span>
                                <div>
                                    <strong>Mark Attendance</strong>
                                    <p>Take attendance for your class</p>
                                </div>
                            </button>
                            <button className="action-btn" onClick={() => navigate('/teacher/homework')}>
                                <span>📚</span>
                                <div>
                                    <strong>Homework</strong>
                                    <p>Create and manage assignments</p>
                                </div>
                            </button>
                            <button className="action-btn" onClick={() => navigate('/teacher/enter-marks')}>
                                <span>📊</span>
                                <div>
                                    <strong>Enter Marks</strong>
                                    <p>Record student marks for exams</p>
                                </div>
                            </button>
                            <button className="action-btn" onClick={() => navigate('/teacher/manage-fees')}>
                                <span>💰</span>
                                <div>
                                    <strong>Manage Fees</strong>
                                    <p>Create and manage fee records</p>
                                </div>
                            </button>
                            <button className="action-btn" onClick={() => navigate('/teacher/timetable')}>
                                <span>📅</span>
                                <div>
                                    <strong>Timetable</strong>
                                    <p>View and manage class schedule</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <h3>📈 Quick Stats</h3>
                        <div className="info-list">
                            <div className="info-item">
                                <span className="info-label">Assigned Class</span>
                                <span className="info-value">Available after class assignment</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Total Students</span>
                                <span className="info-value">Loading...</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Pending Submissions</span>
                                <span className="info-value">0</span>
                            </div>
                        </div>
                        <button
                            className="btn btn-primary"
                            style={{ marginTop: '20px', width: '100%' }}
                            onClick={() => navigate('/teacher/change-password')}
                        >
                            🔐 Change Password
                        </button>
                    </div>
                </div>

                <div className="dashboard-card">
                    <h3>📝 Recent Actions</h3>
                    <div className="activity-list">
                        <div className="activity-item">
                            <div className="activity-dot"></div>
                            <div>
                                <strong>Dashboard Loaded</strong>
                                <p>Welcome to your teacher portal</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TeacherDashboard;
