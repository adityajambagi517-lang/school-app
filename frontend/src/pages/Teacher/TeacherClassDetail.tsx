import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authService, studentsService } from '../../services/api';
import NavBar from '../../components/NavBar';
import { Users, CheckSquare, BarChart3, DollarSign, Search } from 'lucide-react';
import '../Teacher/Dashboard.css';

function TeacherClassDetail() {
    const { id: classId } = useParams();
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [classInfo, setClassInfo] = useState<any>(null);

    useEffect(() => {
        // Authenticate the class exists in the teacher's assigned classes
        const cls = user?.assignedClasses?.find((c: any) => c._id === classId);
        if (cls) {
            setClassInfo(cls);
            loadStudents(classId as string);
        } else {
            setError('Unauthorized: You are not assigned to this class.');
            setLoading(false);
        }
    }, [classId]);

    const loadStudents = async (cId: string) => {
        try {
            setLoading(true);
            const studentsData = await studentsService.getByClass(cId);
            setStudents(studentsData);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load students for this class');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    if (loading) return <div className="dashboard-container">Loading...</div>;

    if (error) return (
        <div className="dashboard-container">
            <NavBar role="teacher" userName={user?.name} onLogout={handleLogout} backTo="/teacher/my-classes" backLabel="← My Classes" />
            <div className="dashboard-content">
                <div className="message message-error">{error}</div>
            </div>
        </div>
    );

    const actionTiles = [
        { icon: <CheckSquare size={20} color="white" />, label: 'Mark Attendance', path: '/teacher/mark-attendance', cls: 't-green' },
        { icon: <BarChart3 size={20} color="white" />, label: 'Enter Marks', path: '/teacher/enter-marks', cls: 't-orange' },
        { icon: <DollarSign size={20} color="white" />, label: 'Manage Fees', path: '/teacher/manage-fees', cls: 't-violet' },
        { icon: <Search size={20} color="white" />, label: 'Search Students', path: '/teacher/search', cls: 't-blue' }
    ];

    return (
        <div className="dashboard-container">
            <NavBar role="teacher" userName={user?.name} onLogout={handleLogout} backTo="/teacher/dashboard" backLabel="← Dashboard" />

            <div className="dashboard-content">
                <div className="page-header" style={{ marginBottom: '2rem' }}>
                    <h1>Class {classInfo?.className} - {classInfo?.section}</h1>
                    <p>Academic Year: {classInfo?.academicYear} | Isolated Class Dashboard</p>
                </div>

                {/* Class Quick Actions */}
                <div className="action-grid" style={{ marginBottom: '3rem' }}>
                    {actionTiles.map((a, i) => (
                        <button key={i} className="action-tile" onClick={() => navigate(a.path)}>
                            <div className={`tile-icon ${a.cls}`}>
                                {a.icon}
                            </div>
                            <span className="tile-label">{a.label}</span>
                        </button>
                    ))}
                </div>

                <div className="dashboard-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Users size={22} color="var(--primary)" /> Class Student List
                        </h2>
                        <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '4px 12px', borderRadius: '16px', fontWeight: 'bold' }}>
                            {students.length} Students
                        </span>
                    </div>

                    <div className="attendance-table" style={{ background: 'white', borderRadius: '8px', border: '1px solid #eee', overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                                    <th style={{ padding: '14px 16px', color: '#4b5563', fontWeight: '600' }}>Student ID</th>
                                    <th style={{ padding: '14px 16px', color: '#4b5563', fontWeight: '600' }}>Name</th>
                                    <th style={{ padding: '14px 16px', color: '#4b5563', fontWeight: '600' }}>Email</th>
                                    <th style={{ padding: '14px 16px', color: '#4b5563', fontWeight: '600' }}>Guardian</th>
                                    <th style={{ padding: '14px 16px', color: '#4b5563', fontWeight: '600' }}>Contact</th>
                                    <th style={{ padding: '14px 16px', color: '#4b5563', fontWeight: '600' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.length > 0 ? students.map((s) => (
                                    <tr key={s._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}><strong>{s.studentId}</strong></td>
                                        <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>{s.name}</td>
                                        <td style={{ padding: '14px 16px', color: '#6b7280' }}>{s.email}</td>
                                        <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>{s.guardianName}</td>
                                        <td style={{ padding: '14px 16px', color: '#6b7280', whiteSpace: 'nowrap' }}>{s.guardianPhone}</td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <button
                                                className="btn btn-primary"
                                                style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                                                onClick={() => navigate(`/teacher/students/${s._id}`)}
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
                                            No students currently enrolled in this specific class.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TeacherClassDetail;
