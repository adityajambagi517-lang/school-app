import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, Trash2, Plus, Image as ImageIcon, X, Clock } from 'lucide-react';
import { authService, noticesService } from '../../services/api';
import NavBar from '../../components/NavBar';
import '../Admin/Dashboard.css';
import './ManageNotices.css';

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
        targetRoles: ['teacher', 'student'], // Default applies to 'both'
        expiresAt: '',
    });
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [audienceType, setAudienceType] = useState<'both' | 'teacher' | 'student'>('both');

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
            
            // Re-sync targetRoles based on audienceType before submission
            const finalRoles = audienceType === 'both' ? ['teacher', 'student'] : [audienceType];
            data.append('targetRoles', JSON.stringify(finalRoles));
            
            if (formData.expiresAt) {
                data.append('expiresAt', formData.expiresAt);
            }

            if (selectedImage) {
                data.append('image', selectedImage);
            }

            await noticesService.create(data);
            setMessage({ type: 'success', text: 'Notice posted successfully!' });
            setShowForm(false);
            setFormData({ title: '', content: '', targetRoles: ['teacher', 'student'], expiresAt: '' });
            setAudienceType('both');
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

            <div className="manage-notices-container dashboard-content">
                <div className="notices-header">
                    <div className="page-header" style={{ margin: 0 }}>
                        <h1>📣 School Notice Board</h1>
                        <p>Share important information and announcements</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                        {showForm ? 'Close Form' : <><Plus size={18} /> Compose Notice</>}
                    </button>
                </div>

                {message.text && (
                    <div className={`message message-${message.type}`}>
                        {message.text}
                    </div>
                )}

                {showForm && (
                    <div className="notice-form-card">
                        <form onSubmit={handleSubmit} className="form-container">
                            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Compose New Announcement</h3>
                            
                            <div className="form-group">
                                <label>Title *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    className="form-input"
                                    placeholder="e.g. Annual Sports Meet 2026"
                                />
                            </div>

                            <div className="form-group">
                                <label>Notice Content *</label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    required
                                    className="form-input"
                                    rows={4}
                                    placeholder="Write the detailed information here..."
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Target Audience *</label>
                                    <div className="audience-toggle-group">
                                        {(['both', 'teacher', 'student'] as const).map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                className={`audience-toggle-btn ${audienceType === type ? 'active' : ''}`}
                                                onClick={() => setAudienceType(type)}
                                            >
                                                {type.charAt(0).toUpperCase() + type.slice(1)}{type !== 'both' ? 's' : ''}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Notice Expiration Time *</label>
                                    <input 
                                        type="datetime-local" 
                                        className="form-input"
                                        required
                                        value={formData.expiresAt}
                                        onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                        min={new Date().toISOString().slice(0,16)}
                                    />
                                    <small style={{ color: '#888', marginTop: '4px', display: 'block' }}>
                                        Notice will be auto-deleted after this time.
                                    </small>
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

                <div className="notices-grid">
                    {notices.map(notice => (
                        <div key={notice._id} className="notice-card">
                            {notice.imageUrl && (
                                <img 
                                    src={notice.imageUrl} 
                                    alt={notice.title} 
                                    className="notice-image" 
                                />
                            )}
                            <div className="notice-content-wrapper">
                                <div className="notice-header-row">
                                    <h3 className="notice-title">{notice.title}</h3>
                                    <button onClick={() => handleDelete(notice._id)} className="btn-delete-icon" title="Delete Notice">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <p className="notice-body">{notice.content}</p>
                                
                                <div className="notice-meta-footer">
                                    <div className="badge-group">
                                        {notice.targetRoles.length === 2 ? (
                                            <span className="badge badge-both">All</span>
                                        ) : notice.targetRoles.map((role: string) => (
                                            <span key={role} className={`badge badge-${role}`}>
                                                {role}
                                            </span>
                                        ))}
                                    </div>
                                    
                                    {notice.expiresAt && (
                                        <div className="expiry-badge" title="Auto-deletes at this time">
                                            <Clock size={12} />
                                            {new Date(notice.expiresAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    )}
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
