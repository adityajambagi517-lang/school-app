import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, studentsService, resolveProfilePic } from '../../services/api';
import NavBar from '../../components/NavBar';
import SortDropdown from '../../components/SortDropdown';
import './StudentsOverview.css';


interface Student {
    _id: string;
    studentId: string;
    name: string;
    email: string;
    profileImage?: string;
    phone?: string;
    gender: string;
    classId?: {
        _id: string;
        className: string;
        section: string;
        academicYear?: string;
    };
}

function StudentsOverview() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [students, setStudents] = useState<Student[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'newest' | 'oldest'>('asc');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const response = await studentsService.getAll(1, 1000); // Fetch a large batch for overview
            setStudents(response.students || []);
        } catch (err: any) {
            console.error('Failed to fetch students:', err);
            setError('Failed to load students data');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const filteredStudents = students.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedStudents = [...filteredStudents].sort((a, b) => {
        if (sortOrder === 'asc') return a.name.localeCompare(b.name);
        if (sortOrder === 'desc') return b.name.localeCompare(a.name);
        
        const timeA = (a as any).updatedAt ? new Date((a as any).updatedAt).getTime() : parseInt(a._id.substring(0,8), 16);
        const timeB = (b as any).updatedAt ? new Date((b as any).updatedAt).getTime() : parseInt(b._id.substring(0,8), 16);
        
        if (sortOrder === 'newest') return timeB - timeA;
        return timeA - timeB;
    });

    if (loading) {
        return (
            <div className="dashboard-container">
                <NavBar role="admin" userName={user?.name} onLogout={handleLogout} backTo="/admin/dashboard" backLabel="← Dashboard" />
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--gray-500)' }}>
                    Loading students...
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <NavBar role="admin" userName={user?.name} onLogout={handleLogout} backTo="/admin/dashboard" backLabel="← Dashboard" />

            <div className="dashboard-content">
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1>👥 Students Overview</h1>
                        <p>Total Registered Students: {students.length}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, justifyContent: 'flex-end', minWidth: '300px' }}>
                        <input 
                            type="text"
                            placeholder="Search students..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid var(--gray-200)', flex: 1, maxWidth: '300px' }}
                        />
                        <SortDropdown
                            value={sortOrder}
                            onChange={(val) => setSortOrder(val as any)}
                            options={[
                                { label: 'Name (A-Z)', value: 'asc' },
                                { label: 'Name (Z-A)', value: 'desc' },
                                { label: 'Recently Added', value: 'newest' },
                                { label: 'Oldest First', value: 'oldest' }
                            ]}
                        />
                        <button 
                            className="btn-submit" 
                            onClick={() => navigate('/admin/register-student')}
                            style={{ padding: '10px 18px', borderRadius: '10px', fontSize: '14px', whiteSpace: 'nowrap' }}
                        >
                            + Register
                        </button>
                    </div>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <div className="students-list">
                    {sortedStudents.map((student) => (
                        <div key={student._id} className="student-accordion-item"
                             onClick={() => navigate(`/admin/students/${student._id}`)}
                        >
                            <div className="accordion-header">
                                {(() => {
                                    const resolvedPic = resolveProfilePic(student.profileImage);
                                    const hasPic = !!student.profileImage;
                                    return (
                                        <div className="accordion-avatar" style={hasPic ? { background: `url(${resolvedPic}) center/cover` } : {}}>
                                            {!hasPic && <span>{student.name.charAt(0)}</span>}
                                        </div>
                                    );
                                })()}
                                <div className="accordion-info">
                                    <h3>{student.name}</h3>
                                    <p>ID: {student.studentId} • {student.gender}</p>
                                </div>
                                <div className="accordion-class">
                                    {student.classId ? (
                                        <span className="badge badge-assigned">
                                            Class {student.classId.className}-{student.classId.section}
                                        </span>
                                    ) : (
                                        <span className="badge badge-unassigned">No Class</span>
                                    )}
                                </div>
                                <div className="accordion-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="9 18 15 12 9 6"></polyline>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {sortedStudents.length === 0 && (
                    <div className="empty-state">
                        <span>👥</span>
                        <h3>No Students Found</h3>
                        <p>{searchTerm ? 'Try adjusting your search' : 'Register students to see them here'}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default StudentsOverview;
