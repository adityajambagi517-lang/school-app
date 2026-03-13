import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen, ClipboardList, Users, BarChart3,
    Calendar, DollarSign, BookMarked,
    CheckSquare, Lock, UserPlus, Megaphone, Search
} from 'lucide-react';
import { authService, notificationsService } from '../../services/api';
import NavBar from '../../components/NavBar';
import './Dashboard.css';

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

function TeacherDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(authService.getCurrentUser());
    const [unreadNoticesCount, setUnreadNoticesCount] = useState(0);

    useEffect(() => {
        authService.getMe()
            .then(u => setUser(u))
            .catch(() => { /* silent */ });
        
        loadUnreadNoticesCount();
    }, []);

    const loadUnreadNoticesCount = async () => {
        try {
            const notifications = await notificationsService.getAll();
            const count = notifications.filter((n: any) => n.type === 'school_notice' && !n.isRead).length;
            setUnreadNoticesCount(count);
        } catch { /* silent */ }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const actions = [
        { icon: <BookOpen size={22} color="white" />, label: 'Subjects', path: '/teacher/manage-subjects', cls: 't-green' },
        { icon: <ClipboardList size={22} color="white" />, label: 'Homework', path: '/teacher/manage-homework', cls: 't-indigo' },
        { icon: <CheckSquare size={22} color="white" />, label: 'Attendance', path: '/teacher/mark-attendance', cls: 't-teal' },
        { icon: <BarChart3 size={22} color="white" />, label: 'Marks', path: '/teacher/enter-marks', cls: 't-orange' },
        { icon: <Users size={22} color="white" />, label: 'Students', path: '/teacher/view-students', cls: 't-blue' },
        { icon: <UserPlus size={22} color="white" />, label: 'Register Student', path: '/teacher/register-student', cls: 't-green' },
        { icon: <DollarSign size={22} color="white" />, label: 'Fees', path: '/teacher/manage-fees', cls: 't-violet' },
        { icon: <Calendar size={22} color="white" />, label: 'Timetable', path: '/teacher/timetable', cls: 't-red' },
        { icon: <Megaphone size={22} color="white" />, label: 'Notices', path: '/teacher/notices', cls: 't-indigo', badge: unreadNoticesCount > 0 ? unreadNoticesCount : undefined },
        { icon: <Search size={22} color="white" />, label: 'Search Students', path: '/teacher/search', cls: 't-orange' },
        { icon: <Lock size={22} color="white" />, label: 'Password', path: '/teacher/change-password', cls: 't-lime' },
    ];

    return (
        <div className="dash-root">
            <NavBar
                role="teacher"
                userName={user?.name}
                onLogout={handleLogout}
                links={[
                    ...actions.map(a => ({ icon: '→', label: a.label, path: a.path })),
                    { icon: '🔍', label: 'Search Students', path: '/teacher/search' }
                ]}
            />

            <div className="dash-scroll">
                {/* Hero */}
                <div className="dash-hero">
                    <p className="hero-greeting">{getGreeting()} 🎓</p>
                    <h1 className="hero-name">{(user as any)?.name?.split(' ')[0] || 'Teacher'}</h1>
                    <span className="hero-role-badge">Teacher</span>
                </div>

                {/* Stats */}
                <div className="stats-row">
                    <div className="stat-pill pill-green">
                        <div className="stat-pill-top">
                            <div className="stat-pill-icon">
                                <Users size={18} />
                            </div>
                        </div>
                        <div className="stat-pill-value">{(user as any)?.totalStudents ?? 0}</div>
                        <div className="stat-pill-label">Students</div>
                    </div>
                    <div className="stat-pill pill-teal">
                        <div className="stat-pill-top">
                            <div className="stat-pill-icon">
                                <BookMarked size={18} />
                            </div>
                        </div>
                        <div className="stat-pill-value">
                            {(user as any)?.className ? `${(user as any).className}-${(user as any).section}` : '—'}
                        </div>
                        <div className="stat-pill-label">My Class</div>
                    </div>
                </div>

                {/* Class banner if assigned */}
                {(user as any)?.assignedClassId && (
                    <div className="class-feature-card">
                        <div style={{ fontSize: 36 }}>🏫</div>
                        <div className="class-feature-text">
                            <h3>Assigned Class</h3>
                            <p>{(user as any).className} — {(user as any).section}</p>
                            <small>{(user as any).totalStudents || 0} students enrolled</small>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="section-header">
                    <h2 className="section-title">Classroom Tools</h2>
                </div>
                <div className="action-grid">
                    {actions.map((a, i) => (
                        <button key={i} className="action-tile" onClick={() => navigate(a.path || '')}>
                            <div className={`tile-icon ${a.cls}`}>
                                {a.icon}
                                {a.badge && <span className="tile-badge">{a.badge}</span>}
                            </div>
                            <span className="tile-label">{a.label}</span>
                        </button>
                    ))}
                </div>

                {/* Quick info */}
                <div className="section-header">
                    <h2 className="section-title">My Profile</h2>
                </div>
                <div className="activity-card">
                    <div className="info-row">
                        <span className="info-row-label">Teacher ID</span>
                        <span className="info-row-value">{(user as any)?.referenceId || '—'}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-row-label">Email</span>
                        <span className="info-row-value" style={{ fontSize: 12 }}>{(user as any)?.email || '—'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TeacherDashboard;
