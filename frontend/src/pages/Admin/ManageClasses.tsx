import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, classesService, teachersService } from '../../services/api';
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
    assignedClassId?: string;
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

    const [formData, setFormData] = useState<ClassFormData>({
        className: '',
        section: '',
        academicYear: '2024-2025',
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
            setSuccess('✅ Teacher assigned successfully!');
            await fetchData(); // Refresh the list
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            console.error('Failed to assign teacher:', err);
            setError(`❌ ${err.response?.data?.message || 'Failed to assign teacher'}`);
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
            setSuccess(`✅ Class ${formData.className} Section ${formData.section} created successfully!`);
            setFormData({ className: '', section: '', academicYear: '2024-2025' });
            setShowForm(false);
            await fetchData(); // Refresh the list
        } catch (err: any) {
            console.error('Failed to create class:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to create class';
            setError(`❌ ${errorMessage}`);
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
            setSuccess(`✅ ${className} Section ${section} deleted successfully!`);
            await fetchData(); // Refresh the list
        } catch (err: any) {
            console.error('Failed to delete class:', err);
            setError(`❌ ${err.response?.data?.message || 'Failed to delete class'}`);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    if (loading) {
        return <div className="dashboard-container"><div className="loading">Loading classes...</div></div>;
    }

    return (
        <div className="dashboard-container">
            <nav className="dashboard-nav">
                <div className="nav-brand">
                    <h2>School Management</h2>
                    <span className="badge badge-admin">Admin</span>
                </div>
                <div className="nav-user">
                    <button onClick={() => navigate('/admin/dashboard')} className="btn btn-secondary">
                        ← Back to Dashboard
                    </button>
                    <span className="user-name">{user?.name}</span>
                    <button onClick={handleLogout} className="btn btn-logout">
                        Logout
                    </button>
                </div>
            </nav>

            <div className="dashboard-content">
                <div className="page-header">
                    <div>
                        <h1>🏫 Manage Classes</h1>
                        <p>Create, view, and manage all classes and sections</p>
                    </div>
                    <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
                        {showForm ? '❌ Cancel' : '➕ Add New Class'}
                    </button>
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
                                {submitting ? '⏳ Creating...' : '✅ Create Class'}
                            </button>
                        </form>
                    </div>
                )}

                <div className="classes-table-container">
                    <table className="classes-table">
                        <thead>
                            <tr>
                                <th>Class Name</th>
                                <th>Section</th>
                                <th>Academic Year</th>
                                <th>Class Teacher</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {classes.map((cls) => (
                                <tr key={cls._id}>
                                    <td className="class-name">{cls.className}</td>
                                    <td><span className="section-badge">Section {cls.section}</span></td>
                                    <td>{cls.academicYear}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {cls.classTeacherId?.name ? (
                                                <span className="teacher-assigned">👨‍🏫 {cls.classTeacherId.name}</span>
                                            ) : (
                                                <span className="not-assigned">Not Assigned</span>
                                            )}
                                            <select
                                                value=""
                                                onChange={(e) => handleAssignTeacher(cls._id, e.target.value)}
                                                disabled={assigningTeacher === cls._id}
                                                className="assign-teacher-select"
                                                title="Assign or change teacher"
                                            >
                                                <option value="">{cls.classTeacherId?.name ? 'Change...' : 'Assign...'}</option>
                                                {teachers
                                                    .map(teacher => {
                                                        const isCurrentlyAssigned = teacher.assignedClassId &&
                                                            (typeof teacher.assignedClassId === 'string'
                                                                ? teacher.assignedClassId !== cls._id
                                                                : (teacher.assignedClassId as any)._id !== cls._id);

                                                        return (
                                                            <option
                                                                key={teacher._id}
                                                                value={teacher._id}
                                                                disabled={Boolean(isCurrentlyAssigned)}
                                                            >
                                                                {teacher.name} {isCurrentlyAssigned ? '(Assigned elsewhere)' : ''}
                                                            </option>
                                                        );
                                                    })}
                                            </select>
                                        </div>
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => handleDelete(cls._id, cls.className, cls.section)}
                                            className="btn btn-delete"
                                            title="Delete class"
                                        >
                                            🗑️ Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {classes.length === 0 && !loading && (
                        <div className="empty-state">
                            <span>📚</span>
                            <h3>No Classes Found</h3>
                            <p>Click "Add New Class" to create your first class</p>
                        </div>
                    )}
                </div>

                <div className="stats-summary">
                    <div className="stat-box">
                        <span className="stat-icon">📊</span>
                        <div>
                            <div className="stat-number">{classes.length}</div>
                            <div className="stat-label">Total Classes</div>
                        </div>
                    </div>
                    <div className="stat-box">
                        <span className="stat-icon">📋</span>
                        <div>
                            <div className="stat-number">{new Set(classes.map(c => c.className)).size}</div>
                            <div className="stat-label">Unique Grades</div>
                        </div>
                    </div>
                    <div className="stat-box">
                        <span className="stat-icon">👨‍🏫</span>
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
