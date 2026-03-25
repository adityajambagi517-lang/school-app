import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, markcardsService } from '../../services/api';
import NavBar from '../../components/NavBar';
import './Dashboard.css';

interface Mark {
    _id: string;
    subject: string;
    examType: string;
    marks: number;
    maxMarks: number;
}

function MarksView() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [marks, setMarks] = useState<Mark[]>([]);
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

    const groupedMarks = useMemo(() => {
        const groups: { [key: string]: Mark[] } = {};
        marks.forEach(mark => {
            if (!groups[mark.examType]) {
                groups[mark.examType] = [];
            }
            groups[mark.examType].push(mark);
        });
        return groups;
    }, [marks]);

    const calculateTotal = (examMarks: Mark[]) => {
        let totalMarks = 0;
        let totalMaxMarks = 0;
        examMarks.forEach(m => {
            totalMarks += m.marks;
            totalMaxMarks += m.maxMarks;
        });
        // Round totalMarks to 2 decimal places to avoid floating point errors (e.g. 183.60000000004)
        const cleanTotalMarks = Number(totalMarks.toFixed(2));
        const percentage = totalMaxMarks > 0 ? ((totalMarks / totalMaxMarks) * 100).toFixed(2) : '0.00';
        return { totalMarks: cleanTotalMarks, totalMaxMarks, percentage };
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
                    <h1>📊 My Marks</h1>
                    <p>Your official academic performance report</p>
                </div>

                <div className="marks-list">
                    {loading ? (
                        <div className="loading">Loading your results...</div>
                    ) : marks.length === 0 ? (
                        <div className="dashboard-card" style={{ textAlign: 'center', padding: '40px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                            <h3>No Results Yet</h3>
                            <p style={{ color: 'var(--text-muted)' }}>Your marks will appear here once they are published by the administration.</p>
                        </div>
                    ) : (
                        Object.keys(groupedMarks).sort().map(examType => {
                            const examMarks = groupedMarks[examType];
                            const totals = calculateTotal(examMarks);
                            const isPassing = parseFloat(totals.percentage) >= 40;
                            return (
                                <div key={examType} className="exam-section">
                                    <div className="section-header" style={{ padding: '0 4px', marginBottom: '12px' }}>
                                        <h2 className="section-title">📅 {examType}</h2>
                                        <span className={`badge ${isPassing ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '12px', padding: '4px 12px' }}>
                                            {isPassing ? 'PASSED' : 'FAILED'}
                                        </span>
                                    </div>

                                    <div className="dashboard-card results-card">
                                        <div className="table-responsive">
                                            <table className="data-table">
                                                <thead>
                                                    <tr>
                                                        <th>Subject</th>
                                                        <th>Obtained</th>
                                                        <th>Maximum</th>
                                                        <th>Percentage</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {examMarks.map(mark => {
                                                        const markPercentage = ((mark.marks / mark.maxMarks) * 100);
                                                        const passed = markPercentage >= 40;
                                                        return (
                                                            <tr key={mark._id}>
                                                                <td style={{ fontWeight: '600' }}>{mark.subject}</td>
                                                                <td style={{ color: passed ? 'inherit' : 'var(--danger)', fontWeight: '700' }}>
                                                                    {Number(mark.marks.toFixed(2))}
                                                                </td>
                                                                <td>{mark.maxMarks}</td>
                                                                <td>{markPercentage.toFixed(1)}%</td>
                                                                <td>
                                                                    <span style={{ 
                                                                        color: passed ? 'var(--success)' : 'var(--danger)',
                                                                        fontSize: '11px',
                                                                        fontWeight: '800'
                                                                    }}>
                                                                        {passed ? 'PASS' : 'FAIL'}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Performance Summary Banner */}
                                        <div className={`performance-banner ${isPassing ? 'pass' : 'fail'}`}>
                                            <div className="performance-stat">
                                                <div className="stat-group">
                                                    <p>Total Marks</p>
                                                    <h3>{totals.totalMarks} / {totals.totalMaxMarks}</h3>
                                                </div>
                                                <div className="stat-group">
                                                    <p>Average</p>
                                                    <h3>{((totals.totalMarks / examMarks.length)).toFixed(1)}</h3>
                                                </div>
                                            </div>
                                            <div className="percentage-box">
                                                <p>Overall Percentage</p>
                                                <h2>{totals.percentage}%</h2>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

export default MarksView;
