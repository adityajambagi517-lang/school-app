import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, homeworkService } from '../../services/api';
import './Dashboard.css';

function HomeworkView() {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(authService.getCurrentUser());
    const [homework, setHomework] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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

    return (
        <div className="dashboard-container">
            <nav className="dashboard-nav">
                <div className="nav-brand">
                    <h2>School Management</h2>
                    <span className="badge badge-student">Student</span>
                </div>
                <div className="nav-user">
                    <button onClick={() => navigate('/student/dashboard')} className="btn btn-secondary">
                        ← Back
                    </button>
                    <span className="user-name">{user?.name}</span>
                </div>
            </nav>

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
                            {homework.map((hw) => (
                                <div key={hw._id} className="dashboard-card">
                                    <div className="hw-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <span className="badge badge-info">{hw.subject}</span>
                                        <span className="badge badge-warning">Due: {new Date(hw.dueDate).toLocaleDateString()}</span>
                                    </div>
                                    <h3>{hw.title}</h3>
                                    <p style={{ marginTop: '10px', color: '#666' }}>{hw.description}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default HomeworkView;
