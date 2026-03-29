import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, resolveProfilePic } from '../../services/api';
import api from '../../services/api';
import NavBar from '../../components/NavBar';
import SortDropdown from '../../components/SortDropdown';
import './TeachersOverview.css';


interface TeacherStats {
    _id: string;
    teacherId: string;
    name: string;
    email: string;
    profilePicture?: string;
    phone?: string;
    subject?: string;
    assignedClasses: Array<{ _id: string; className: string; section: string; academicYear?: string }>;
    stats: {
        studentCount: number;
        averageMarks: number;
        attendanceRate: number;
    };
}

function TeachersOverview() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [teachers, setTeachers] = useState<TeacherStats[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'newest' | 'oldest'>('asc');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');


    useEffect(() => {
        fetchTeachers();
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


    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="loading">Loading teachers...</div>
            </div>
        );
    }

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const filteredTeachers = teachers.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.teacherId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.subject && t.subject.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const sortedTeachers = [...filteredTeachers].sort((a, b) => {
        if (sortOrder === 'asc') return a.name.localeCompare(b.name);
        if (sortOrder === 'desc') return b.name.localeCompare(a.name);
        
        const timeA = (a as any).updatedAt ? new Date((a as any).updatedAt).getTime() : parseInt(a._id.substring(0,8), 16);
        const timeB = (b as any).updatedAt ? new Date((b as any).updatedAt).getTime() : parseInt(b._id.substring(0,8), 16);
        
        if (sortOrder === 'newest') return timeB - timeA;
        return timeA - timeB; // oldest
    });

    return (
        <div className="dashboard-container">
            <NavBar role="admin" userName={user?.name} onLogout={handleLogout} backTo="/admin/dashboard" backLabel="← Dashboard" />

            <div className="dashboard-content">
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1>👨‍🏫 Teachers Overview</h1>
                        <p>Total Registered Teachers: {teachers.length}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, justifyContent: 'flex-end', minWidth: '300px' }}>
                        <input 
                            type="text"
                            placeholder="Search teachers..."
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
                                { label: 'Recently Updated', value: 'newest' },
                                { label: 'Oldest First', value: 'oldest' }
                            ]}
                        />
                        <button 
                            className="btn-submit" 
                            onClick={() => navigate('/admin/register-teacher')}
                            style={{ padding: '10px 18px', borderRadius: '10px', fontSize: '14px', whiteSpace: 'nowrap' }}
                        >
                            + Register
                        </button>
                    </div>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <div className="teachers-list">
                    {sortedTeachers.map((teacher) => (
                        <div key={teacher._id} className="teacher-accordion-item">
                            <div className="accordion-header" style={{ cursor: 'pointer' }}
                                onClick={() => navigate(`/admin/teachers/${teacher._id}`)}
                            >
                                {(() => {
                                    const resolvedPic = resolveProfilePic(teacher.profilePicture);
                                    const hasPic = !!teacher.profilePicture;
                                    return (
                                        <div className="accordion-avatar" style={hasPic ? { background: `url(${resolvedPic}) center/cover` } : {}}>
                                            {!hasPic && <span>{teacher.name.charAt(0)}</span>}
                                        </div>
                                    );
                                })()}
                                <div className="accordion-info">
                                    <h3>{teacher.name}</h3>
                                    <p>ID: {teacher.teacherId} <span className="mobile-hidden">{teacher.subject ? `• ${teacher.subject}` : ''}</span></p>
                                </div>
                                <div className="accordion-class">
                                    {teacher.assignedClasses && teacher.assignedClasses.length > 0 ? (
                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                            {teacher.assignedClasses.map(cls => (
                                                <span key={cls._id} className="badge badge-assigned">{cls.className}-{cls.section}</span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="badge badge-unassigned">Unassigned</span>
                                    )}
                                </div>
                                <div className="accordion-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="chevron">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </div>
                            </div>


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
