import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, Calendar } from 'lucide-react';
import { authService, noticesService, notificationsService } from '../../services/api';
import NavBar from '../../components/NavBar';
import '../Student/Dashboard.css';

function NoticesView() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [notices, setNotices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotices();
    }, []);

    const loadNotices = async () => {
        try {
            setLoading(true);
            const data = await noticesService.getAll();
            setNotices(data);
            
            // Mark as read when viewing
            await notificationsService.markAllAsRead();
        } catch (error) {
            console.error('Failed to load notices', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    if (loading) return <div className="dash-root"><NavBar role={user?.role} userName={user?.name} onLogout={handleLogout} /><div className="dash-scroll">Loading notices...</div></div>;

    return (
        <div className="dash-root">
            <NavBar 
                role={user?.role} 
                userName={user?.name} 
                onLogout={handleLogout} 
                backTo={`/${user?.role}/dashboard`} 
                backLabel="← Dashboard" 
            />

            <div className="dash-scroll">
                <div className="dash-hero" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <p className="hero-greeting">Stay Updated 📢</p>
                    <h1 className="hero-name">School Notice Board</h1>
                </div>

                <div className="section-header">
                    <h2 className="section-title">Latest Announcements</h2>
                </div>

                <div className="notice-grid" style={{ padding: '0 1rem 2rem' }}>
                    {notices.length === 0 ? (
                        <div className="activity-card" style={{ textAlign: 'center', padding: '3rem' }}>
                            <Megaphone size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <p>No notices at the moment. Check back later!</p>
                        </div>
                    ) : (
                        notices.map(notice => (
                            <div key={notice._id} className="activity-card" style={{ marginBottom: '1.5rem', padding: 0, overflow: 'hidden' }}>
                                {notice.imageUrl && (
                                    <img 
                                        src={notice.imageUrl} 
                                        alt={notice.title} 
                                        style={{ width: '100%', maxHeight: '300px', objectFit: 'cover' }} 
                                    />
                                )}
                                <div style={{ padding: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#718096', fontSize: '0.85rem' }}>
                                        <Calendar size={14} />
                                        <span>{new Date(notice.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                                    </div>
                                    <h3 style={{ margin: '0 0 1rem 0', color: '#2d3748', fontSize: '1.25rem' }}>{notice.title}</h3>
                                    <p style={{ margin: 0, color: '#4a5568', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{notice.content}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default NoticesView;
