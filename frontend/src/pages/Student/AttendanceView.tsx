import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, attendanceService, analyticsService } from '../../services/api';
import NavBar from '../../components/NavBar';
import './Dashboard.css';

function AttendanceView() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [attendance, setAttendance] = useState<any[]>([]);
    const [subjectStats, setSubjectStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAttendance();
    }, []);

    const loadAttendance = async () => {
        try {
            setLoading(true);
            const studentId = user.referenceId;
            if (studentId) {
                const data = await attendanceService.getByStudent(studentId);
                setAttendance(data);

                // Fetch subject-wise stats for the current year
                const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString();
                const today = new Date().toISOString();
                const stats = await analyticsService.getStudentSubjectAttendance(studentId, startOfYear, today);
                setSubjectStats(stats);
            }
        } catch (error) {
            console.error('Failed to load attendance:', error);
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
            <NavBar role="student" userName={user?.name} onLogout={handleLogout} backTo="/student/dashboard" backLabel="← Dashboard" />

            <div className="dashboard-content">
                <div className="page-header">
                    <h1>My Attendance</h1>
                    <p>Your academic attendance overview</p>
                </div>

                <div className="dashboard-grid" style={{ marginBottom: '20px' }}>
                    <div className="dashboard-card">
                        <h3>📊 Subject-wise Attendance</h3>
                        {loading ? (
                            <p>Loading stats...</p>
                        ) : subjectStats.length === 0 ? (
                            <p>No subject statistics available.</p>
                        ) : (
                            <div className="info-list">
                                {subjectStats.map((stat, idx) => (
                                    <div key={idx} className="info-item">
                                        <span className="info-label">{stat.subjectName}</span>
                                        <span className="info-value">
                                            {stat.attendanceRate.toFixed(1)}%
                                            <small style={{ marginLeft: '10px', color: '#666' }}>
                                                ({stat.present}/{stat.total})
                                            </small>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="dashboard-card">
                    <h3>📅 Recent Records</h3>
                    {loading ? (
                        <div className="loading">Loading attendance...</div>
                    ) : attendance.length === 0 ? (
                        <p>No attendance records found.</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Subject</th>
                                        <th>Status</th>
                                        <th>Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendance.map((record) => (
                                        <tr key={record._id}>
                                            <td>{new Date(record.date).toLocaleDateString()}</td>
                                            <td>
                                                <span className="badge badge-info">
                                                    {record.subjectId?.name || 'N/A'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge badge-${record.status}`}>
                                                    {record.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td>{record.remarks || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AttendanceView;
