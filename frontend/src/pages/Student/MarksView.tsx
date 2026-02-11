import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, markcardsService } from '../../services/api';
import './Dashboard.css';

function MarksView() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [marks, setMarks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMarks();
    }, []);

    const loadMarks = async () => {
        try {
            setLoading(true);
            const studentId = user.referenceId;
            if (studentId) {
                const data = await markcardsService.getStudentMarks(studentId);
                setMarks(data);
            }
        } catch (error) {
            console.error('Failed to load marks:', error);
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
                    <h1>My Marks</h1>
                    <p>Your published exam results</p>
                </div>

                <div className="marks-list">
                    {loading ? (
                        <div className="loading">Loading marks...</div>
                    ) : marks.length === 0 ? (
                        <div className="dashboard-card">
                            <p>No published marks found yet.</p>
                        </div>
                    ) : (
                        <div className="dashboard-grid">
                            {marks.map((mark) => (
                                <div key={mark._id} className="dashboard-card">
                                    <h3>{mark.subject}</h3>
                                    <div className="info-list">
                                        <div className="info-item">
                                            <span className="info-label">Exam Type</span>
                                            <span className="info-value">{mark.examType}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">Marks</span>
                                            <span className="info-value">{mark.marks} / {mark.maxMarks}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">Percentage</span>
                                            <span className="info-value">
                                                {((mark.marks / mark.maxMarks) * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MarksView;
