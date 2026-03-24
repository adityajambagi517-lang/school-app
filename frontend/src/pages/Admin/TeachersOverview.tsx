import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, teachersService, adminResetService } from '../../services/api';
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
    const [expandedTeacherId, setExpandedTeacherId] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'newest' | 'oldest'>('asc');
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        teacherId: '',
        email: '',
        password: 'password123',
        phone: '',
        subject: '',
        assignedClassId: ''
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const toggleTeacher = (id: string) => {
        setExpandedTeacherId(prev => prev === id ? null : id);
    };

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
            setSuccess('Class assigned successfully!');
            fetchTeachers(); // Refresh list to get updated class associations
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to assign class');
            setTimeout(() => setError(''), 5000);
        }
    };

    const handleUnassignClass = async (classId: string) => {
        if (!window.confirm('Are you sure you want to unassign this class from the teacher?')) return;
        try {
            // Unassigning is simply stripping the classTeacherId from the Class document
            await api.patch(`/classes/${classId}/assign-teacher`, { teacherId: '' });
            setSuccess('Class unassigned successfully!');
            fetchTeachers();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to unassign class');
            setTimeout(() => setError(''), 5000);
        }
    };

    const handleDeleteTeacher = async (id: string, name: string) => {
        if (!window.confirm(`⚠️ Are you sure you want to PERMANENTLY delete teacher ${name} and their login account? This action cannot be undone.`)) {
            return;
        }

        try {
            setLoading(true);
            await teachersService.delete(id);
            setSuccess(`✅ Teacher ${name} deleted successfully`);
            await fetchTeachers();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(`❌ ${err.response?.data?.message || 'Failed to delete teacher'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (teacherId: string, name: string) => {
        if (!window.confirm(`Reset password for ${name} to "password123"?`)) return;
        try {
            await adminResetService.resetUserPassword(teacherId);
            setSuccess(`✅ Password for ${name} reset to "password123"`);
            setTimeout(() => setSuccess(''), 4000);
        } catch (err: any) {
            setError(`❌ ${err.response?.data?.message || 'Failed to reset password'}`);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                setError('Image must be less than 5MB');
                return;
            }
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleRegisterTeacher = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const response = await teachersService.register(formData);
            
            // Handle image upload if selected
            if (selectedFile && response.teacher?._id) {
                const uploadData = new FormData();
                uploadData.append('image', selectedFile);
                uploadData.append('teacherId', response.teacher._id);

                await api.post('/teachers/upload-image', uploadData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }

            setSuccess(`✅ Teacher ${formData.name} registered successfully!`);
            setShowForm(false);
            setFormData({
                name: '',
                teacherId: '',
                email: '',
                password: 'password123',
                phone: '',
                subject: '',
                assignedClassId: ''
            });
            setSelectedFile(null);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
            
            fetchTeachers();
            setTimeout(() => setSuccess(''), 4000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to register teacher');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="loading">Loading teachers...</div>
            </div>
        );
    }

    const sortedTeachers = [...teachers].sort((a, b) => {
        if (sortOrder === 'asc') return a.name.localeCompare(b.name);
        if (sortOrder === 'desc') return b.name.localeCompare(a.name);
        
        // MongoDB ObjectIds contain timestamps, we can sort by _id for newest/oldest 
        // fallback in case updatedAt is undefined, but they are both timestamps.
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
                        <p>View all teachers, assign them to classes, and track performance</p>
                    </div>
                    <div className="sort-control" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <SortDropdown
                            value={sortOrder}
                            onChange={(val) => setSortOrder(val as any)}
                            options={[
                                { label: 'Name (A-Z)', value: 'asc' },
                                { label: 'Name (Z-A)', value: 'desc' },
                                { label: 'Latest Updated', value: 'newest' },
                                { label: 'Oldest First', value: 'oldest' }
                            ]}
                        />
                        <button 
                            className="btn-submit" 
                            onClick={() => setShowForm(!showForm)}
                            style={{ padding: '10px 18px', borderRadius: '10px', fontSize: '14px', whiteSpace: 'nowrap' }}
                        >
                            {showForm ? '✕ Cancel' : '+ Add Teacher'}
                        </button>
                    </div>
                </div>

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                {showForm && (
                    <div className="form-card">
                        <h3><span>📝</span> Register New Teacher</h3>
                        <form onSubmit={handleRegisterTeacher} className="teacher-form">
                            {/* Profile Picture Upload */}
                            <div className="profile-upload-section" style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '10px' }}>
                                <div 
                                    className="profile-preview" 
                                    style={{ 
                                        width: '80px', 
                                        height: '80px', 
                                        borderRadius: '50%', 
                                        background: previewUrl ? `url(${previewUrl}) center/cover` : 'var(--gray-200)',
                                        border: '3px solid white',
                                        boxShadow: 'var(--shadow-sm)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {!previewUrl && <span style={{ fontSize: '1.5rem' }}>👨‍🏫</span>}
                                </div>
                                <div className="upload-controls">
                                    <label className="btn-submit" style={{ cursor: 'pointer', padding: '8px 16px', fontSize: '13px', background: 'var(--gray-100)', color: 'var(--gray-700)', border: '1px solid var(--gray-300)', boxShadow: 'none' }}>
                                        Upload Profile Picture
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={handleFileChange}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                    <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '4px' }}>Optional. Max size: 5MB</p>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Full Name*</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    placeholder="e.g. John Doe"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>Teacher ID*</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    placeholder="e.g. T101"
                                    required
                                    value={formData.teacherId}
                                    onChange={e => setFormData({...formData, teacherId: e.target.value})}
                                />
                                <small style={{ fontSize: '11px', color: 'var(--gray-500)' }}>Unique identifier for login</small>
                            </div>
                            <div className="form-group">
                                <label>Email Address*</label>
                                <input 
                                    type="email" 
                                    className="form-control" 
                                    placeholder="e.g. john@school.com"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>Login Password*</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    required
                                    value={formData.password}
                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                />
                                <small style={{ fontSize: '11px', color: 'var(--gray-500)' }}>Initial password for account</small>
                            </div>
                            <div className="form-group">
                                <label>Subject (Optional)</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    placeholder="e.g. Mathematics"
                                    value={formData.subject}
                                    onChange={e => setFormData({...formData, subject: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone Number (Optional)</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    placeholder="e.g. +91 9876543210"
                                    value={formData.phone}
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>Assign Class (Optional)</label>
                                <select 
                                    className="form-control"
                                    value={formData.assignedClassId}
                                    onChange={e => setFormData({...formData, assignedClassId: e.target.value})}
                                >
                                    <option value="">-- No Class Assignment --</option>
                                    {classes.map(cls => (
                                        <option key={cls._id} value={cls._id}>
                                            {cls.className} - {cls.section} ({cls.academicYear})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="btn-submit" disabled={submitting}>
                                    {submitting ? 'Registering...' : 'Complete Registration'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="teachers-list">
                    {sortedTeachers.map((teacher) => (
                        <div key={teacher._id} className={`teacher-accordion-item ${expandedTeacherId === teacher._id ? 'expanded' : ''}`}>
                            <div className="accordion-header" onClick={() => toggleTeacher(teacher._id)}>
                                <div className="accordion-avatar" style={teacher.profilePicture ? { background: `url(${teacher.profilePicture}) center/cover` } : {}}>
                                    {!teacher.profilePicture && <span>{teacher.name.charAt(0)}</span>}
                                </div>
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

                            {expandedTeacherId === teacher._id && (
                                <div className="accordion-body">
                                    <div className="accordion-actions-bar">
                                        <div className="teacher-contact">
                                            <p>📧 {teacher.email}</p>
                                            {teacher.phone && <p>📞 {teacher.phone}</p>}
                                        </div>
                                        <div className="admin-actions">
                                            <button 
                                                className="btn-action btn-reset"
                                                onClick={() => handleResetPassword(teacher.teacherId, teacher.name)}
                                                title="Reset Password to password123"
                                            >
                                                🔑 Reset Password
                                            </button>
                                            <button 
                                                className="btn-action btn-delete" 
                                                onClick={() => handleDeleteTeacher(teacher._id, teacher.name)}
                                                title="Delete Teacher"
                                            >
                                                🗑️ Delete
                                            </button>
                                        </div>
                                    </div>

                                    <div className="class-assignment">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                            <h4>Class Management</h4>
                                            <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>A teacher can manage multiple classes</span>
                                        </div>
                                        
                                        {teacher.assignedClasses && teacher.assignedClasses.length > 0 && (
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                                                {teacher.assignedClasses.map(cls => (
                                                    <span key={cls._id} className="badge badge-assigned" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '6px 12px' }}>
                                                        {cls.className}-{cls.section}
                                                        <button 
                                                            onClick={() => handleUnassignClass(cls._id)} 
                                                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0 2px', color: 'inherit', fontWeight: 'bold' }}
                                                            title="Unassign Class"
                                                        >×</button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="assign-class-section">
                                            <label>Assign to Another Class:</label>
                                            <select
                                                value=""
                                                onChange={(e) => {
                                                    if (e.target.value) handleAssignClass(teacher._id, e.target.value);
                                                }}
                                                className="class-select"
                                            >
                                                <option value="">-- Select Class --</option>
                                                {classes.filter(cls => !teacher.assignedClasses.some(ac => ac._id === cls._id)).map((cls) => (
                                                    <option key={cls._id} value={cls._id}>
                                                        {cls.className} - Section {cls.section} ({cls.academicYear})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {teacher.assignedClasses && teacher.assignedClasses.length > 0 && (
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
