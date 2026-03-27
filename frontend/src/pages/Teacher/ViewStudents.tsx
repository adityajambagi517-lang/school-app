import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, studentsService } from '../../services/api';
import NavBar from '../../components/NavBar';
import '../Teacher/Dashboard.css';

interface Student {
    _id: string;
    studentId: string;
    name: string;
    email: string;
    guardianName: string;
    guardianPhone: string;
    dateOfBirth: string;
    gender: string;
    classId: {
        className: string;
        section: string;
        academicYear: string;
        _id?: string;
    };
}

function ViewStudents() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [assignedClasses, setAssignedClasses] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<string>('');

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        try {
            const classes = user?.assignedClasses || [];
            setAssignedClasses(classes);

            if (classes.length === 0) {
                setError('No class assigned to your account');
                setLoading(false);
                return;
            }

            setActiveTab(classes[0]._id);

            let allStudents: any[] = [];
            for (const cls of classes) {
                const studentsData = await studentsService.getByClass(cls._id);
                allStudents = [...allStudents, ...studentsData];
            }
            
            setStudents(allStudents);
            setLoading(false);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load students');
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const studentsForActiveTab = students.filter(s => s.classId._id === activeTab || String(s.classId) === activeTab);
    
    const filteredStudents = studentsForActiveTab.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="dashboard-container">Loading...</div>;
    }

    return (
        <div className="dashboard-container">
            <NavBar role="teacher" userName={user?.name} onLogout={handleLogout} backTo="/teacher/dashboard" backLabel="← Dashboard" />

            <div className="dashboard-content">
                <div className="page-header">
                    <h1>👥 Assigned Students</h1>
                    <p>
                        Total Assigned Students: {students.length}
                    </p>
                </div>

                {error && (
                    <div className="message message-error">
                        {error}
                    </div>
                )}

                {/* Class Tabs */}
                {assignedClasses.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.75rem', overflowX: 'auto' }}>
                        {assignedClasses.map(cls => (
                            <button
                                key={cls._id}
                                onClick={() => setActiveTab(cls._id)}
                                style={{
                                    padding: '0.6rem 1.25rem',
                                    border: 'none',
                                    background: activeTab === cls._id ? 'var(--primary)' : '#f0f0f0',
                                    color: activeTab === cls._id ? 'white' : '#555',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: activeTab === cls._id ? 'bold' : 'normal',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.2s',
                                    boxShadow: activeTab === cls._id ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >
                                Class {cls.className} - {cls.section}
                            </button>
                        ))}
                    </div>
                )}

                {/* Search Bar */}
                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Search by name, student ID, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-input"
                        style={{ width: '100%', maxWidth: '500px' }}
                    />
                    <div style={{ background: '#e3f2fd', color: '#1976d2', padding: '6px 16px', borderRadius: '16px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        {filteredStudents.length} matches
                    </div>
                </div>

                {/* Quick Actions */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/teacher/mark-attendance')}
                    >
                        ✅ Mark Attendance
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/teacher/enter-marks')}
                    >
                        📊 Enter Marks
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/teacher/manage-fees')}
                    >
                        💰 Manage Fees
                    </button>
                </div>

                {/* Student Table */}
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
                                {filteredStudents.length > 0 ? (
                                    filteredStudents.map((student) => (
                                        <tr key={student._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}><strong>{student.studentId}</strong></td>
                                            <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>{student.name}</td>
                                            <td style={{ padding: '14px 16px', color: '#6b7280' }}>{student.email}</td>
                                            <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>{student.guardianName}</td>
                                            <td style={{ padding: '14px 16px', color: '#6b7280', whiteSpace: 'nowrap' }}>{student.guardianPhone}</td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <button
                                                    className="btn btn-primary"
                                                    style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                                                    onClick={() => navigate(`/teacher/students/${student._id}`)}
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                                            {searchTerm ? 'No students match your search.' : 'No students in your class.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
            </div>
        </div>
    );
}

export default ViewStudents;
