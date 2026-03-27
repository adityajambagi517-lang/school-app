import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import NavBar from '../../components/NavBar';
import { BookMarked, Users } from 'lucide-react';

function MyClasses() {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
    }, []);

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const assignedClasses = user?.assignedClasses || [];

    return (
        <div className="dashboard-container">
            <NavBar role="teacher" userName={user?.name} onLogout={handleLogout} backTo="/teacher/dashboard" backLabel="← Dashboard" />

            <div className="dashboard-content">
                <div className="page-header">
                    <h1>🏫 My Assigned Classes</h1>
                    <p>Select a class to view its dedicated dashboard and student list.</p>
                </div>

                {assignedClasses.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                        {assignedClasses.map((cls: any) => (
                            <div 
                                key={cls._id} 
                                className="class-feature-card" 
                                style={{ margin: 0, cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid #eee' }}
                                onClick={() => navigate(`/teacher/class/${cls._id}`)}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{ fontSize: 40, marginBottom: '1rem' }}><BookMarked size={48} color="var(--primary)" /></div>
                                <div className="class-feature-text" style={{ textAlign: 'center' }}>
                                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#1a1a1a' }}>Class {cls.className} - {cls.section}</h3>
                                    <p style={{ color: '#666' }}>Academic Year: {cls.academicYear || '—'}</p>
                                    <div style={{ marginTop: '1.5rem' }}>
                                        <button className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
                                            Open Class Dashboard
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="dashboard-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                        <Users size={64} color="#ccc" style={{ marginBottom: '1rem' }} />
                        <h2 style={{ color: '#666' }}>No Classes Assigned</h2>
                        <p style={{ color: '#888' }}>You currently do not have any classes assigned to your account. Please contact the administrator.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MyClasses;
