import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, timetableService } from '../../services/api';
import NavBar from '../../components/NavBar';
import './Dashboard.css';

function TimetableView() {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(authService.getCurrentUser());
    const [timetable, setTimetable] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const days = [
        { name: 'Monday', index: 1 },
        { name: 'Tuesday', index: 2 },
        { name: 'Wednesday', index: 3 },
        { name: 'Thursday', index: 4 },
        { name: 'Friday', index: 5 },
        { name: 'Saturday', index: 6 },
        { name: 'Sunday', index: 0 },
    ];

    useEffect(() => {
        loadTimetable();
    }, []);

    const loadTimetable = async () => {
        try {
            setLoading(true);
            const userData = await authService.getMe();
            setUser(userData);

            const classId = userData.studentDetails?.classId?._id || userData.studentDetails?.classId;
            if (classId) {
                const data = await timetableService.getByClass(classId);
                setTimetable(data);
            }
        } catch (error) {
            console.error('Failed to load timetable:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDaySchedule = (dayIndex: number) => {
        return timetable.filter(t => t.dayOfWeek === dayIndex);
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
                    <h1>Class Timetable</h1>
                    <p>Your weekly class schedule</p>
                </div>

                {loading ? (
                    <div className="loading">Loading timetable...</div>
                ) : timetable.length === 0 ? (
                    <div className="dashboard-card">
                        <p>No timetable found for your class.</p>
                    </div>
                ) : (
                    <div className="timetable-grid">
                        {days.map(day => (
                            <div key={day.name} className="dashboard-card" style={{ marginBottom: '20px' }}>
                                <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>{day.name}</h3>
                                {getDaySchedule(day.index).length === 0 ? (
                                    <p style={{ fontStyle: 'italic', color: '#999' }}>No classes scheduled</p>
                                ) : (
                                    <div className="schedule-list">
                                        {getDaySchedule(day.index).map((period, index) => (
                                            <div key={index} className="info-item" style={{ padding: '8px 0', borderBottom: '1px solid #f9f9f9' }}>
                                                <span className="info-label" style={{ minWidth: '100px' }}>
                                                    Period {period.period}: {period.startTime} - {period.endTime}
                                                </span>
                                                <div className="info-value">
                                                    <strong>{period.subject}</strong>
                                                    <div style={{ fontSize: '0.8em', color: '#666' }}>Teacher: {period.teacherId?.name}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default TimetableView;
