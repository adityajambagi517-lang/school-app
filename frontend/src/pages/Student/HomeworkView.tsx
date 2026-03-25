import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, homeworkService } from '../../services/api';
import NavBar from '../../components/NavBar';
import './Dashboard.css';

function HomeworkView() {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(authService.getCurrentUser());
    const [homework, setHomework] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastViewedTime, setLastViewedTime] = useState(0);

    useEffect(() => {
        const lastViewedStr = localStorage.getItem('lastHomeworkView');
        setLastViewedTime(lastViewedStr ? parseInt(lastViewedStr, 10) : 0);
        localStorage.setItem('lastHomeworkView', Date.now().toString());
        loadHomework();
    }, []);

    const loadHomework = async () => {
        try {
            setLoading(true);
            // Refresh to get classId
            const userData = await authService.getMe();
            setUser(userData);

            const classId = userData.studentDetails?.classId?._id;
            if (classId) {
                const data = await homeworkService.getByClass(classId);
                setHomework(data);
            }
        } catch (error) {
            console.error('Failed to load homework:', error);
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
                    <h1>Homework</h1>
                    <p>View your assigned tasks and homework</p>
                </div>

                <div className="homework-list">
                    {loading ? (
                        <div className="loading">Loading homework...</div>
                    ) : homework.length === 0 ? (
                        <div className="dashboard-card">
                            <p>No homework assigned to your class.</p>
                        </div>
                    ) : (
                        <div className="dashboard-grid">
                            {homework.map((hw) => {
                                const hwTime = new Date(hw.createdAt).getTime();
                                const isNew = hwTime > lastViewedTime && (new Date().getTime() - hwTime < 48 * 60 * 60 * 1000);
                                return (
                                    <div key={hw._id} className="dashboard-card" style={{ position: 'relative' }}>
                                        {isNew && (
                                            <span style={{ position: 'absolute', top: '-10px', left: '-10px', background: '#e53e3e', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(229, 62, 62, 0.3)', zIndex: 10, letterSpacing: '0.5px' }}>
                                                🚀 NEW
                                            </span>
                                        )}
                                        <div className="hw-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                            <span className="badge badge-info">{hw.subject}</span>
                                            <span className="badge badge-warning">Due: {new Date(hw.dueDate).toLocaleDateString()}</span>
                                        </div>
                                        <h3>{hw.title}</h3>
                                        <p style={{ marginTop: '10px', color: '#666' }}>{hw.description}</p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default HomeworkView;
