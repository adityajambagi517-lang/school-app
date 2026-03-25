import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, classesService, teachersService } from '../../services/api';
import NavBar from '../../components/NavBar';
import SortDropdown from '../../components/SortDropdown';
import { getCurrentAcademicYear } from '../../utils/dateUtils';
import './ManageClasses.css';

interface Class {
    _id: string;
    className: string;
    section: string;
    academicYear: string;
    classTeacherId?: {
        _id: string;
        name: string;
    };
}

interface Teacher {
    _id: string;
    name: string;
    teacherId: string;
    assignedClasses?: Array<{
        _id: string;
        className: string;
        section: string;
    }>;
}

interface ClassFormData {
    className: string;
    section: string;
    academicYear: string;
}

function ManageClasses() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [classes, setClasses] = useState<Class[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [assigningTeacher, setAssigningTeacher] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'newest' | 'oldest'>('asc');

    const [formData, setFormData] = useState<ClassFormData>({
        className: '',
        section: '',
        academicYear: getCurrentAcademicYear(),
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setError('');
            const [classesData, teachersData] = await Promise.all([
                classesService.getAll(),
                teachersService.getAll(),
            ]);
            console.log('[DEBUG] Classes received:', classesData);
            console.log('[DEBUG] Teachers received:', teachersData);
            setClasses(classesData);
            setTeachers(teachersData);
            setLoading(false);
        } catch (err: any) {
            console.error('Failed to fetch data:', err);
            setError(`Failed to load data: ${err.response?.data?.message || err.message}`);
            setLoading(false);
        }
    };

    const handleAssignTeacher = async (classId: string, teacherId: string) => {
        try {
            setAssigningTeacher(classId);
            setError('');
            await classesService.assignTeacher(classId, teacherId);
            setSuccess('Teacher assigned successfully!');
            await fetchData(); // Refresh the list
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            console.error('Failed to assign teacher:', err);
            setError(`${err.response?.data?.message || 'Failed to assign teacher'}`);
        } finally {
            setAssigningTeacher(null);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);

        console.log('Submitting class data:', formData);

        try {
            await classesService.create(formData);
            console.log('Class created');
            setSuccess(`Class ${formData.className} Section ${formData.section} created successfully!`);
            setFormData({ className: '', section: '', academicYear: getCurrentAcademicYear() });
            setShowForm(false);
            await fetchData(); // Refresh the list
        } catch (err: any) {
            console.error('Failed to create class:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to create class';
            setError(`${errorMessage}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (classId: string, className: string, section: string) => {
        if (!window.confirm(`Are you sure you want to delete ${className} Section ${section}?`)) {
            return;
        }

        try {
            setError('');
            await classesService.delete(classId);
            setSuccess(`${className} Section ${section} deleted successfully!`);
            await fetchData(); // Refresh the list
        } catch (err: any) {
            console.error('Failed to delete class:', err);
            setError(`${err.response?.data?.message || 'Failed to delete class'}`);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    if (loading) {
        return <div className="dashboard-container"><div className="loading">Loading classes...</div></div>;
    }

    const sortedClasses = [...classes].sort((a, b) => {
        if (sortOrder === 'newest' || sortOrder === 'oldest') {
            const timeA = (a as any).updatedAt ? new Date((a as any).updatedAt).getTime() : parseInt(a._id.substring(0,8), 16);
            const timeB = (b as any).updatedAt ? new Date((b as any).updatedAt).getTime() : parseInt(b._id.substring(0,8), 16);
            if (sortOrder === 'newest') return timeB - timeA;
            return timeA - timeB;
        }
        
        const nameA = `${a.className}-${a.section}`;
        const nameB = `${b.className}-${b.section}`;
        if (sortOrder === 'asc') return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
        return nameB.localeCompare(nameA, undefined, { numeric: true, sensitivity: 'base' });
    });

    return (
        <div className="dashboard-container">
            <NavBar role="admin" userName={user?.name} onLogout={handleLogout} backTo="/admin/dashboard" backLabel="Dashboard" />

            <div className="dashboard-content">
                <div className="page-header">
                    <div>
                        <h1>
                            <span className="heading-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                    <polyline points="9 22 9 12 15 12 15 22" />
                                </svg>
                            </span> 
                            Manage Classes
                        </h1>
                        <p>Create, view, and manage all classes and sections</p>
                    </div>
                    <div className="header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <SortDropdown
                            value={sortOrder}
                            onChange={(val) => setSortOrder(val as 'asc' | 'desc' | 'newest' | 'oldest')}
                            options={[
                                { label: 'Class (A-Z)', value: 'asc' },
                                { label: 'Class (Z-A)', value: 'desc' },
                                { label: 'Latest Updated', value: 'newest' },
                                { label: 'Oldest First', value: 'oldest' }
                            ]}
                        />
                        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary" style={{ padding: '10px 20px', borderRadius: '10px' }}>
                            {showForm ? '× Cancel' : '+ Add New Class'}
                        </button>
                    </div>
                </div>

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                {showForm && (
                    <div className="form-card">
                        <h3>Create New Class</h3>
                        <form onSubmit={handleSubmit} className="class-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Class Name *</label>
                                    <input
                                        type="text"
                                        name="className"
                                        value={formData.className}
                                        onChange={handleChange}
                                        placeholder="e.g., Class 1, Class 10, Nursery"
                                        required
                                        disabled={submitting}
                                    />
                                    <small>Enter the grade or level</small>
                                </div>

                                <div className="form-group">
                                    <label>Section *</label>
                                    <input
                                        type="text"
                                        name="section"
                                        value={formData.section}
                                        onChange={handleChange}
                                        placeholder="e.g., A, B, C"
                                        maxLength={2}
                                        required
                                        disabled={submitting}
                                    />
                                    <small>Single letter or number</small>
                                </div>

                                <div className="form-group">
                                    <label>Academic Year *</label>
                                    <input
                                        type="text"
                                        name="academicYear"
                                        value={formData.academicYear}
                                        onChange={handleChange}
                                        placeholder="e.g., 2024-2025"
                                        required
                                        disabled={submitting}
                                    />
                                    <small>Format: YYYY-YYYY</small>
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary" disabled={submitting}>
                                {submitting ? 'Creating...' : 'Create Class'}
                            </button>
                        </form>
                    </div>
                )}

                <div className="classes-table-container">
                    <header>Active Classes</header>
                    <div className="classes-grid">
                        {sortedClasses.map((cls) => (
                            <div key={cls._id} className="class-card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/classes/${cls._id}`)}>
                                <div className="class-card-header">
                                    <div className="class-info">
                                        <h3 className="class-name">{cls.className}</h3>
                                        <span className="section-badge">Section {cls.section}</span>
                                        <span className="academic-year-badge">{cls.academicYear}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(cls._id, cls.className, cls.section)}
                                        className="btn-delete-icon"
                                        title="Delete class"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="class-card-teacher">
                                    <div className="teacher-status">
                                        <span className="teacher-label">Class Teacher:</span>
                                        {cls.classTeacherId?.name ? (
                                            <span className="teacher-assigned">{cls.classTeacherId.name}</span>
                                        ) : (
                                            <span className="not-assigned">Not Assigned</span>
                                        )}
                                    </div>
                                    <select
                                        value=""
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            handleAssignTeacher(cls._id, e.target.value);
                                        }}
                                        disabled={assigningTeacher === cls._id}
                                        className="assign-teacher-select"
                                        title="Assign or change teacher"
                                    >
                                        <option value="">{cls.classTeacherId?.name ? 'Change...' : 'Assign Teacher'}</option>
                                        {teachers.map(teacher => (
                                            <option
                                                key={teacher._id}
                                                value={teacher._id}
                                            >
                                                {teacher.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>

                    {sortedClasses.length === 0 && !loading && (
                        <div className="empty-state">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--gray-300)', marginBottom: '16px' }}>
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <line x1="9" y1="9" x2="15" y2="9" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" />
                            </svg>
                            <h3>No Classes Found</h3>
                            <p>Click "Add New Class" to create your first class</p>
                        </div>
                    )}
                </div>

                <div className="stats-summary">
                    <div className="stat-box">
                        <span className="stat-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                <line x1="9" y1="14" x2="15" y2="14" />
                            </svg>
                        </span>
                        <div>
                            <div className="stat-number">{classes.length}</div>
                            <div className="stat-label">Total Classes</div>
                        </div>
                    </div>
                    <div className="stat-box">
                        <span className="stat-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                <path d="M6 12v5c3 3 9 3 12 0v-5" />
                            </svg>
                        </span>
                        <div>
                            <div className="stat-number">{new Set(classes.map(c => c.className)).size}</div>
                            <div className="stat-label">Unique Grades</div>
                        </div>
                    </div>
                    <div className="stat-box">
                        <span className="stat-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="8.5" cy="7" r="4" />
                                <polyline points="17 11 19 13 23 9" />
                            </svg>
                        </span>
                        <div>
                            <div className="stat-number">{classes.filter(c => c.classTeacherId).length}</div>
                            <div className="stat-label">Assigned Teachers</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ManageClasses;
