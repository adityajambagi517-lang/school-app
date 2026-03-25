import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authService, classesService, studentsService, timetableService, attendanceService } from '../../services/api';
import NavBar from '../../components/NavBar';

function ClassDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [cls, setCls] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [timetable, setTimetable] = useState<any[]>([]);
    const [attendanceSummary, setAttendanceSummary] = useState<{ totalDays: number; presentDays: number; percentage: number } | null>(null);
    const [activeTab, setActiveTab] = useState<'students' | 'timetable' | 'attendance'>('students');

    const handleLogout = () => { authService.logout(); navigate('/login'); };

    useEffect(() => {
        if (!id) return;
        fetchAll();
    }, [id]);

    const fetchAll = async () => {
        try {
            setLoading(true);
            const [classRes, studentsRes, timetableRes] = await Promise.allSettled([
                classesService.getById(id!),
                studentsService.getByClass(id!),
                timetableService.getByClass(id!),
            ]);

            if (classRes.status === 'fulfilled') setCls(classRes.value);
            if (studentsRes.status === 'fulfilled') {
                setStudents(studentsRes.value);
                // Calculate attendance summary: fetch attendance for each student
                try {
                    const allAtt = await attendanceService.getByClass(id!);
                    if (Array.isArray(allAtt) && allAtt.length > 0) {
                        const total = allAtt.length;
                        const present = allAtt.filter((a: any) => a.isPresent).length;
                        setAttendanceSummary({ totalDays: total, presentDays: present, percentage: total > 0 ? Math.round((present / total) * 100) : 0 });
                    }
                } catch { /* ignore */ }
            }
            if (timetableRes.status === 'fulfilled') setTimetable(timetableRes.value);
        } catch (err: any) {
            setError('Failed to load class data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
            <NavBar role="admin" userName={user?.name} onLogout={handleLogout} backTo="/admin/classes" backLabel="Back to Classes" />
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', fontSize: '18px', color: 'var(--text-muted)' }}>Loading class data...</div>
        </div>
    );

    if (error || !cls) return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
            <NavBar role="admin" userName={user?.name} onLogout={handleLogout} backTo="/admin/classes" backLabel="Back to Classes" />
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>{error || 'Class not found'}</div>
        </div>
    );

    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-page)', paddingTop: '52px' }}>
            <NavBar role="admin" userName={user?.name} onLogout={handleLogout} backTo="/admin/classes" backLabel="Back to Classes" />
            <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 16px' }}>

                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '16px', padding: '28px', marginBottom: '20px', color: 'white', boxShadow: '0 8px 32px rgba(99,102,241,0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800 }}>{cls.className}</h1>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '3px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>Section {cls.section}</span>
                                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '3px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>{cls.academicYear}</span>
                            </div>
                            {cls.classTeacherId && (
                                <p style={{ margin: '10px 0 0', opacity: 0.9, fontSize: '14px' }}>
                                    👨‍🏫 Class Teacher:{' '}
                                    <span
                                        style={{ fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}
                                        onClick={() => navigate(`/admin/teachers/${cls.classTeacherId._id}`)}
                                    >
                                        {cls.classTeacherId.name}
                                    </span>
                                </p>
                            )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', textAlign: 'center' }}>
                            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '12px 18px' }}>
                                <div style={{ fontSize: '24px', fontWeight: 800 }}>{students.length}</div>
                                <div style={{ fontSize: '12px', opacity: 0.85 }}>Total Students</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '12px 18px' }}>
                                <div style={{ fontSize: '24px', fontWeight: 800 }}>{attendanceSummary ? `${attendanceSummary.percentage}%` : 'N/A'}</div>
                                <div style={{ fontSize: '12px', opacity: 0.85 }}>Attendance</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    {(['students', 'timetable', 'attendance'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{ padding: '10px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', transition: 'all 0.2s', background: activeTab === tab ? 'var(--primary)' : 'var(--bg-card)', color: activeTab === tab ? 'white' : 'var(--text-muted)', boxShadow: activeTab === tab ? '0 4px 14px rgba(99,102,241,0.35)' : 'var(--shadow-sm)' }}
                        >
                            {tab === 'students' ? `👥 Students (${students.length})` : tab === 'timetable' ? '📅 Timetable' : '✅ Attendance'}
                        </button>
                    ))}
                </div>

                {/* Students Tab */}
                {activeTab === 'students' && (
                    <div style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
                        <h3 style={{ margin: '0 0 16px', color: 'var(--text-main)' }}>Students in this Class</h3>
                        {students.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: '48px' }}>👥</div>
                                <p>No students enrolled yet</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                                {students.map((s: any, i: number) => (
                                    <div
                                        key={s._id || i}
                                        onClick={() => navigate(`/admin/students/${s._id}`)}
                                        style={{ padding: '14px', background: 'var(--bg-page)', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s', border: '1px solid var(--border)' }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
                                    >
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '15px', flexShrink: 0 }}>
                                            {s.name?.charAt(0)?.toUpperCase()}
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.studentId}</div>
                                            {s.phone && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>📞 {s.phone}</div>}
                                        </div>
                                        <span style={{ marginLeft: 'auto', color: '#6366f1', fontSize: '18px', flexShrink: 0 }}>›</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Timetable Tab */}
                {activeTab === 'timetable' && (
                    <div style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
                        <h3 style={{ margin: '0 0 16px', color: 'var(--text-main)' }}>📅 Class Timetable</h3>
                        {timetable.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: '48px' }}>📅</div>
                                <p>No timetable set yet</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                {DAYS.map(day => {
                                    const daySlots = timetable.filter((t: any) => t.day === day);
                                    if (daySlots.length === 0) return null;
                                    return (
                                        <div key={day} style={{ marginBottom: '16px' }}>
                                            <h4 style={{ margin: '0 0 8px', color: 'var(--primary)', fontSize: '14px', fontWeight: 700 }}>{day}</h4>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                {daySlots.sort((a: any, b: any) => a.startTime?.localeCompare(b.startTime)).map((slot: any, j: number) => (
                                                    <div key={j} style={{ padding: '8px 14px', background: 'var(--bg-page)', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '13px' }}>
                                                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{slot.subject}</div>
                                                        <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{slot.startTime} – {slot.endTime}</div>
                                                        {slot.teacherId?.name && <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>👨‍🏫 {slot.teacherId.name}</div>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Attendance Tab */}
                {activeTab === 'attendance' && (
                    <div style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
                        <h3 style={{ margin: '0 0 16px', color: 'var(--text-main)' }}>✅ Attendance Overview</h3>
                        {attendanceSummary ? (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                                    {[
                                        { label: 'Overall Rate', value: `${attendanceSummary.percentage}%`, color: attendanceSummary.percentage >= 75 ? '#10b981' : '#ef4444' },
                                        { label: 'Present Records', value: attendanceSummary.presentDays, color: '#10b981' },
                                        { label: 'Absent Records', value: attendanceSummary.totalDays - attendanceSummary.presentDays, color: '#ef4444' },
                                        { label: 'Total Records', value: attendanceSummary.totalDays, color: 'var(--text-main)' },
                                    ].map((stat, i) => (
                                        <div key={i} style={{ background: 'var(--bg-page)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '24px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{stat.label}</div>
                                        </div>
                                    ))}
                                </div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Per-student attendance is visible in each student's detail page.</p>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: '48px' }}>📊</div>
                                <p>No attendance data available</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ClassDetailPage;
