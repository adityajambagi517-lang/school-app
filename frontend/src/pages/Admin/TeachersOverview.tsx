import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import api from '../../services/api';
import NavBar from '../../components/NavBar';
import './TeachersOverview.css';

interface TeacherStats {
    _id: string;
    teacherId: string;
    name: string;
    email: string;
    phone?: string;
    subject?: string;
    assignedClassId?: string;
    stats: {
        studentCount: number;
        averageMarks: number;
        attendanceRate: number;
        className: string;
        section: string;
        academicYear?: string;
    };
}

interface Class {
    _id: string;
    className: string;
    section: string;
    academicYear: string;
}

function TeachersOverview() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [teachers, setTeachers] = useState<TeacherStats[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchTeachers();
        fetchClasses();
    }, []);

    const fetchTeachers = async () => {
        try {
            const response = await api.get('/teachers/with-stats');
            setTeachers(response.data);
        } catch (err: any) {
            console.error('Failed to fetch teachers:', err);
            setError('Failed to load teachers data');
        } finally {
            setLoading(false);
        }
    };

    const fetchClasses = async () => {
        try {
            const response = await api.get('/classes');
            setClasses(response.data);
        } catch (err: any) {
            console.error('Failed to fetch classes:', err);
        }
    };

    const handleAssignClass = async (teacherId: string, classId: string) => {
        try {
            setError('');
            await api.patch(`/teachers/${teacherId}/assign-class`, { classId });
            setSuccess('✅ Class assigned successfully!');
            await fetchTeachers(); // Refresh the list
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            console.error('Failed to assign class:', err);
            setError(`❌ ${err.response?.data?.message || 'Failed to assign class'}`);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="loading">Loading teachers...</div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <NavBar role="admin" userName={user?.name} onLogout={handleLogout} backTo="/admin/dashboard" backLabel="← Dashboard" />

            <div className="dashboard-content">
                <div className="page-header">
                    <h1>👨‍🏫 Teachers Overview</h1>
                    <p>View all teachers, assign them to classes, and track performance</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <div className="teachers-grid">
                    {teachers.map((teacher) => (
                        <div key={teacher._id} className="teacher-card">
                            <div className="teacher-header">
                                <div className="teacher-avatar">
                                    <span>{teacher.name.charAt(0)}</span>
                                </div>
                                <div className="teacher-info">
                                    <h3>{teacher.name}</h3>
                                    <p className="teacher-id">ID: {teacher.teacherId}</p>
                                    {teacher.subject && <p className="teacher-subject">📚 {teacher.subject}</p>}
                                </div>
                            </div>

                            <div className="teacher-contact">
                                <p>📧 {teacher.email}</p>
                                {teacher.phone && <p>📞 {teacher.phone}</p>}
                            </div>

                            <div className="class-assignment">
                                <h4>Assigned Class</h4>
                                <div className="class-badge">
                                    {teacher.stats.className !== 'Not Assigned' ? (
                                        <>
                                            {teacher.stats.className} - Section {teacher.stats.section}
                                            {teacher.stats.academicYear && (
                                                <span className="academic-year"> ({teacher.stats.academicYear})</span>
                                            )}
                                        </>
                                    ) : (
                                        <span className="not-assigned">Not Assigned</span>
                                    )}
                                </div>

                                {/* Assign/Reassign Class Dropdown */}
                                <div className="assign-class-section">
                                    <label>Assign/Reassign Class:</label>
                                    <select
                                        value={teacher.assignedClassId || ''}
                                        onChange={(e) => handleAssignClass(teacher._id, e.target.value)}
                                        className="class-select"
                                    >
                                        <option value="">-- Select Class --</option>
                                        {classes.map((cls) => (
                                            <option key={cls._id} value={cls._id}>
                                                {cls.className} - Section {cls.section} ({cls.academicYear})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {teacher.stats.className !== 'Not Assigned' && (
                                <>
                                    <div className="stats-grid">
                                        <div className="stat-item">
                                            <div className="stat-icon">👥</div>
                                            <div className="stat-details">
                                                <div className="stat-value">{teacher.stats.studentCount}</div>
                                                <div className="stat-label">Students</div>
                                            </div>
                                        </div>

                                        <div className="stat-item">
                                            <div className="stat-icon">📊</div>
                                            <div className="stat-details">
                                                <div className="stat-value">{teacher.stats.averageMarks}%</div>
                                                <div className="stat-label">Avg Marks</div>
                                            </div>
                                        </div>

                                        <div className="stat-item">
                                            <div className="stat-icon">✅</div>
                                            <div className="stat-details">
                                                <div className="stat-value">{teacher.stats.attendanceRate}%</div>
                                                <div className="stat-label">Attendance</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="performance-indicator">
                                        {teacher.stats.averageMarks >= 75 && teacher.stats.attendanceRate >= 80 ? (
                                            <span className="badge badge-success">✨ Excellent Performance</span>
                                        ) : teacher.stats.averageMarks >= 60 && teacher.stats.attendanceRate >= 70 ? (
                                            <span className="badge badge-warning">👍 Good Performance</span>
                                        ) : (
                                            <span className="badge badge-info">📈 Room for Improvement</span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>

                {teachers.length === 0 && !loading && (
                    <div className="empty-state">
                        <span>👨‍🏫</span>
                        <h3>No Teachers Found</h3>
                        <p>Register teachers to see their performance statistics</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TeachersOverview;
