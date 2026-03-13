import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, Trash2, Plus, Image as ImageIcon, X } from 'lucide-react';
import { authService, noticesService } from '../../services/api';
import NavBar from '../../components/NavBar';
import '../Admin/Dashboard.css';

function ManageNotices() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [notices, setNotices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        targetRoles: ['teacher', 'student'],
    });
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        loadNotices();
    }, []);

    const loadNotices = async () => {
        try {
            setLoading(true);
            const data = await noticesService.getAll();
            setNotices(data);
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Failed to load notices' });
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('content', formData.content);
            data.append('targetRoles', JSON.stringify(formData.targetRoles));
            if (selectedImage) {
                data.append('image', selectedImage);
            }

            await noticesService.create(data);
            setMessage({ type: 'success', text: 'Notice posted successfully!' });
            setShowForm(false);
            setFormData({ title: '', content: '', targetRoles: ['teacher', 'student'] });
            setSelectedImage(null);
            setImagePreview(null);
            loadNotices();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to post notice' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this notice?')) return;
        try {
            await noticesService.delete(id);
            loadNotices();
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to delete notice' });
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    if (loading) return <div className="dashboard-container">Loading...</div>;

    return (
        <div className="dashboard-container">
            <NavBar role="admin" userName={user?.name} onLogout={handleLogout} backTo="/admin/dashboard" backLabel="← Dashboard" />

            <div className="dashboard-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div className="page-header" style={{ margin: 0 }}>
                        <h1>📣 School Notice Board</h1>
                        <p>Share important information and announcements</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                        {showForm ? 'Cancel' : <><Plus size={18} /> New Notice</>}
                    </button>
                </div>

                {message.text && (
                    <div className={`message message-${message.type}`}>
                        {message.text}
                    </div>
                )}

                {showForm && (
                    <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                        <form onSubmit={handleSubmit} className="form-container">
                            <h3>Post New Announcement</h3>
                            <div className="form-group">
                                <label>Title *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Information/Content *</label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    required
                                    className="form-input"
                                    rows={4}
                                />
                            </div>
                            <div className="form-group">
                                <label>Target Audience</label>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                    {['teacher', 'student'].map(role => (
                                        <label key={role} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.targetRoles.includes(role)}
                                                onChange={(e) => {
                                                    const roles = e.target.checked 
                                                        ? [...formData.targetRoles, role]
                                                        : formData.targetRoles.filter(r => r !== role);
                                                    setFormData({ ...formData, targetRoles: roles });
                                                }}
                                            />
                                            {role.charAt(0).toUpperCase() + role.slice(1)}s
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Notice Image (Optional)</label>
                                <div style={{ marginTop: '0.5rem' }}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        style={{ display: 'none' }}
                                        id="notice-image"
                                    />
                                    <label htmlFor="notice-image" className="btn btn-secondary" style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <ImageIcon size={18} /> Choose Image
                                    </label>
                                    {imagePreview && (
                                        <div style={{ marginTop: '1rem', position: 'relative', width: 'fit-content' }}>
                                            <img src={imagePreview} alt="Preview" style={{ maxWidth: '200px', borderRadius: '8px' }} />
                                            <button 
                                                type="button" 
                                                onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                                                style={{ position: 'absolute', top: -10, right: -10, background: '#ff4444', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer' }}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={submitting}>
                                {submitting ? 'Posting...' : 'Post Notice'}
                            </button>
                        </form>
                    </div>
                )}

                <div className="notice-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {notices.map(notice => (
                        <div key={notice._id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            {notice.imageUrl && (
                                <img 
                                    src={`http://localhost:3000${notice.imageUrl}`} 
                                    alt={notice.title} 
                                    style={{ width: '100%', height: '180px', objectFit: 'cover' }} 
                                />
                            )}
                            <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                    <h3 style={{ margin: 0 }}>{notice.title}</h3>
                                    <button onClick={() => handleDelete(notice._id)} style={{ color: '#ff4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                <p style={{ color: '#666', fontSize: '0.9rem', flex: 1 }}>{notice.content}</p>
                                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                    {notice.targetRoles.map((role: string) => (
                                        <span key={role} style={{ 
                                            padding: '2px 8px', 
                                            borderRadius: '12px', 
                                            fontSize: '0.7rem', 
                                            background: '#f0f0f0',
                                            color: '#666',
                                            textTransform: 'uppercase'
                                        }}>
                                            {role}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {!loading && notices.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                        <Megaphone size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p>No notices posted yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ManageNotices;
