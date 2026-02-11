import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, analyticsService } from '../../services/api';
import './Dashboard.css';

function StudentDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(authService.getCurrentUser());
    const [performance, setPerformance] = useState<any>(null);
    const [attendanceRate, setAttendanceRate] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStudentData();
    }, []);

    const loadStudentData = async () => {
        try {
            setLoading(true);
            // Refresh user data to ensure we have the latest (including classId)
            const userData = await authService.getMe();
            setUser(userData);

            const studentId = userData.referenceId;
            if (studentId) {
                // Fetch performance stats
                const perf = await analyticsService.getStudentPerformance(studentId);
                setPerformance(perf);

                // Fetch attendance rate (current year)
                const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString();
                const today = new Date().toISOString();
                const att = await analyticsService.getStudentAttendanceRate(studentId, startOfYear, today);
                setAttendanceRate(att);
            }
        } catch (error) {
            console.error('Failed to load student data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <div className="dashboard-container">
            <nav className="dashboard-nav">
                <div className="nav-brand">
                    <h2>School Management</h2>
                    <span className="badge badge-student">Student</span>
                </div>
                <div className="nav-user">
                    {user?.studentDetails?.profileImage ? (
                        <img
                            src={user.studentDetails.profileImage}
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
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                    <h1>Student Dashboard</h1>
                    <p>Hello, {user?.name}!</p>
                </div>

                <div className="dashboard-grid">
                    <div className="dashboard-card">
                        <h3>📚 My Academics</h3>
                        <div className="action-list">
                            <button className="action-btn" onClick={() => navigate('/student/marks')}>
                                <span>📊</span>
                                <div>
                                    <strong>My Marks</strong>
                                    <p>View your published exam results</p>
                                </div>
                            </button>
                            <button className="action-btn" onClick={() => navigate('/student/attendance')}>
                                <span>✅</span>
                                <div>
                                    <strong>Attendance</strong>
                                    <p>Check your attendance record</p>
                                </div>
                            </button>
                            <button className="action-btn" onClick={() => navigate('/student/homework')}>
                                <span>📖</span>
                                <div>
                                    <strong>Homework</strong>
                                    <p>View assigned homework and tasks</p>
                                </div>
                            </button>
                            <button className="action-btn" onClick={() => navigate('/student/timetable')}>
                                <span>📅</span>
                                <div>
                                    <strong>Timetable</strong>
                                    <p>View your class schedule</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <h3>💰 Fees</h3>
                        <div className="action-list">
                            <button className="action-btn" onClick={() => navigate('/student/fees')}>
                                <span>💵</span>
                                <div>
                                    <strong>Fee Status</strong>
                                    <p>View your fee payment status</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="dashboard-card">
                    <h3>📈 Performance Overview</h3>
                    <div className="info-list">
                        <div className="info-item">
                            <span className="info-label">Overall Average</span>
                            <span className="info-value">
                                {loading ? 'Loading...' : `${performance?.overallAverage?.toFixed(1) || 0}%`}
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Attendance Rate</span>
                            <span className="info-value">
                                {loading ? 'Loading...' : `${attendanceRate?.attendanceRate || 0}%`}
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Current Class</span>
                            <span className="info-value">
                                {loading ? 'Loading...' : user?.studentDetails?.classId?.className || 'N/A'}
                            </span>
                        </div>
                    </div>
                    <button
                        className="btn btn-primary"
                        style={{ marginTop: '20px', width: '100%' }}
                        onClick={() => navigate('/student/change-password')}
                    >
                        🔐 Change Password
                    </button>
                </div>
            </div>
        </div>
    );
}

export default StudentDashboard;
