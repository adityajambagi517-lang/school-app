import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart3, CheckSquare, BookOpen, Calendar,
    DollarSign, Lock, TrendingUp, Megaphone
} from 'lucide-react';
import { authService, analyticsService, notificationsService } from '../../services/api';
import NavBar from '../../components/NavBar';
import './Dashboard.css';

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

function StudentDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(authService.getCurrentUser());
    const [performance, setPerformance] = useState<any>(null);
    const [attendanceRate, setAttendanceRate] = useState<any>(null);
    const [unreadNoticesCount, setUnreadNoticesCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => { 
        loadStudentData();
        loadUnreadNoticesCount();
    }, []);

    const loadUnreadNoticesCount = async () => {
        try {
            const notifications = await notificationsService.getAll();
            const count = notifications.filter((n: any) => n.type === 'school_notice' && !n.isRead).length;
            setUnreadNoticesCount(count);
        } catch { /* silent */ }
    };

    const loadStudentData = async () => {
        try {
            setLoading(true);
            const userData = await authService.getMe();
            setUser(userData);
            const studentId = userData.referenceId;
            if (studentId) {
                const perf = await analyticsService.getStudentPerformance(studentId);
                setPerformance(perf);
                const start = new Date(new Date().getFullYear(), 0, 1).toISOString();
                const today = new Date().toISOString();
                const att = await analyticsService.getStudentAttendanceRate(studentId, start, today);
                setAttendanceRate(att);
            }
        } catch { /* silent */ } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const actions = [
        { icon: <BarChart3 size={22} color="white" />, label: 'My Marks', path: '/student/marks', cls: 't-indigo' },
        { icon: <CheckSquare size={22} color="white" />, label: 'Attendance', path: '/student/attendance', cls: 't-green' },
        { icon: <BookOpen size={22} color="white" />, label: 'Homework', path: '/student/homework', cls: 't-orange' },
        { icon: <Calendar size={22} color="white" />, label: 'Timetable', path: '/student/timetable', cls: 't-teal' },
        { icon: <DollarSign size={22} color="white" />, label: 'Fees', path: '/student/fees', cls: 't-red' },
        { icon: <Megaphone size={22} color="white" />, label: 'Notices', path: '/student/notices', cls: 't-indigo', badge: unreadNoticesCount > 0 ? unreadNoticesCount : undefined },
        { icon: <Lock size={22} color="white" />, label: 'Password', path: '/student/change-password', cls: 't-orange' },
    ];

    return (
        <div className="dash-root">
            <NavBar
                role="student"
                userName={user?.name}
                onLogout={handleLogout}
                links={actions.map(a => ({ icon: '→', label: a.label, path: a.path }))}
            />

            <div className="dash-scroll">
                {/* Hero */}
                <div className="dash-hero">
                    <p className="hero-greeting">{getGreeting()} 📚</p>
                    <h1 className="hero-name">{user?.name?.split(' ')[0] || 'Student'}</h1>
                    <span className="hero-role-badge">Student</span>
                </div>

                {/* Stats */}
                <div className="stats-row">
                    <div className="stat-pill pill-orange">
                        <div className="stat-pill-top">
                            <div className="stat-pill-icon">
                                <TrendingUp size={18} />
                            </div>
                        </div>
                        <div className="stat-pill-value">
                            {loading ? '…' : `${performance?.overallAverage?.toFixed(0) ?? 0}%`}
                        </div>
                        <div className="stat-pill-label">Avg Score</div>
                    </div>
                    <div className="stat-pill pill-green">
                        <div className="stat-pill-top">
                            <div className="stat-pill-icon">
                                <CheckSquare size={18} />
                            </div>
                        </div>
                        <div className="stat-pill-value">
                            {loading ? '…' : `${attendanceRate?.attendanceRate ?? 0}%`}
                        </div>
                        <div className="stat-pill-label">Attendance</div>
                    </div>
                </div>

                {/* Actions */}
                <div className="section-header">
                    <h2 className="section-title">My Portal</h2>
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

                {/* Info */}
                <div className="section-header">
                    <h2 className="section-title">My Details</h2>
                </div>
                <div className="activity-card">
                    <div className="info-row">
                        <span className="info-row-label">Class</span>
                        <span className="info-row-value">
                            {loading ? '…' : (
                                user?.studentDetails?.classId 
                                ? `${user.studentDetails.classId.className} - ${user.studentDetails.classId.section}` 
                                : 'Not assigned'
                            )}
                        </span>
                    </div>
                    <div className="info-row">
                        <span className="info-row-label">Student ID</span>
                        <span className="info-row-value">{user?.referenceId || '—'}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-row-label">Email</span>
                        <span className="info-row-value" style={{ fontSize: 12 }}>{user?.email || '—'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StudentDashboard;
