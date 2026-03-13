import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, subjectsService } from '../../services/api';
import NavBar from '../../components/NavBar';
import '../Teacher/Dashboard.css';

interface Subject {
    _id: string;
    name: string;
    description?: string;
    isActive: boolean;
}

function ManageSubjects() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });

    useEffect(() => {
        loadSubjects();
    }, []);

    const loadSubjects = async () => {
        try {
            const data = await subjectsService.getAll();
            setSubjects(data);
            setLoading(false);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to load subjects' });
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            if (editingId) {
                await subjectsService.update(editingId, formData);
                setMessage({ type: 'success', text: 'Subject updated successfully!' });
                setEditingId(null);
            } else {
                await subjectsService.create(formData);
                setMessage({ type: 'success', text: 'Subject created successfully!' });
            }
            setFormData({ name: '', description: '' });
            loadSubjects();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Operation failed' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (subject: Subject) => {
        setEditingId(subject._id);
        setFormData({
            name: subject.name,
            description: subject.description || '',
        });
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this subject?')) {
            return;
        }

        try {
            await subjectsService.delete(id);
            setMessage({ type: 'success', text: 'Subject deleted successfully!' });
            loadSubjects();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to delete subject' });
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({ name: '', description: '' });
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    if (loading) {
        return <div className="dashboard-container">Loading...</div>;
    }

    return (
        <div className="dashboard-container">
            <NavBar role="teacher" userName={user?.name} onLogout={handleLogout} backTo="/teacher/dashboard" backLabel="← Dashboard" />

            <div className="dashboard-content">
                <div className="page-header">
                    <h1>📚 Manage Subjects</h1>
                    <p>Create and manage subjects for your class</p>
                </div>

                {message.text && (
                    <div className={`message message-${message.type}`}>
                        {message.text}
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    {/* Subject Form */}
                    <form onSubmit={handleSubmit} className="form-container">
                        <h3>{editingId ? 'Edit Subject' : 'Add New Subject'}</h3>

                        <div className="form-group">
                            <label>Subject Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Mathematics"
                                required
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Optional subject description"
                                className="form-input"
                                rows={3}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="submit" className="btn btn-primary" disabled={submitting}>
                                {submitting ? 'Saving...' : editingId ? 'Update Subject' : 'Create Subject'}
                            </button>
                            {editingId && (
                                <button type="button" onClick={handleCancel} className="btn btn-secondary">
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>

                    {/* Subjects List */}
                    <div>
                        <h3>Your Subjects</h3>
                        {subjects.length === 0 ? (
                            <p>No subjects created yet. Create your first subject!</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {subjects.map(subject => (
                                    <div key={subject._id} className="card" style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 0.5rem 0' }}>{subject.name}</h4>
                                                {subject.description && (
                                                    <p style={{ margin: 0, color: '#666' }}>{subject.description}</p>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => handleEdit(subject)}
                                                    className="btn btn-secondary"
                                                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(subject._id)}
                                                    className="btn btn-logout"
                                                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ManageSubjects;
