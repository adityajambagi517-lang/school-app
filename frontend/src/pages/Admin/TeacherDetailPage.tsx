import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authService, teachersService, adminResetService, classesService, resolveProfilePic } from '../../services/api';
import api from '../../services/api';
import NavBar from '../../components/NavBar';


function TeacherDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [teacher, setTeacher] = useState<any>(null);
    const [allClasses, setAllClasses] = useState<any[]>([]);
    const [assigningLoading, setAssigningLoading] = useState(false);

    const handleLogout = () => { authService.logout(); navigate('/login'); };

    useEffect(() => {
        if (!id) return;
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Try /teachers/with-stats first for rich data, fallback to getById
            const statsRes = await api.get('/teachers/with-stats');
            const found = statsRes.data.find((t: any) => t._id === id);
            setTeacher(found || null);

            // Also fetch all classes for assignment dropdown
            try {
                const ac = await classesService.getAll();
                setAllClasses(ac || []);
            } catch { /* ignore */ }
        } catch (err: any) {
            // fallback to simple getById
            try {
                const t = await teachersService.getById(id!);
                setTeacher(t);
            } catch {
                setError('Failed to load teacher data');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`⚠️ Permanently delete teacher ${teacher?.name}?`)) return;
        try {
            await teachersService.delete(id!);
            navigate(-1);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Delete failed');
        }
    };

    const handleResetPassword = async () => {
        if (!window.confirm(`Reset password for ${teacher?.name} to "password123"?`)) return;
        try {
            await adminResetService.resetUserPassword(teacher.teacherId);
            alert('✅ Password reset to "password123"');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Reset failed');
        }
    };

    const handleAssignClass = async (classId: string) => {
        if (!classId) return;
        try {
            setAssigningLoading(true);
            await classesService.assignTeacher(classId, id!);
            await fetchData();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Assignment failed');
        } finally {
            setAssigningLoading(false);
        }
    };

    const handleRemoveClass = async (e: React.MouseEvent, classId: string) => {
        e.stopPropagation();
        if (!window.confirm('Remove teacher from this class?')) return;
        try {
            setAssigningLoading(true);
            await classesService.assignTeacher(classId, '');
            await fetchData();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Removal failed');
        } finally {
            setAssigningLoading(false);
        }
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
            <NavBar role="admin" userName={user?.name} onLogout={handleLogout} backTo={-1 as any} backLabel="Back" />
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', fontSize: '18px', color: 'var(--text-muted)' }}>Loading teacher data...</div>
        </div>
    );

    if (error || !teacher) return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
            <NavBar role="admin" userName={user?.name} onLogout={handleLogout} backTo={-1 as any} backLabel="Back" />
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>{error || 'Teacher not found'}</div>
        </div>
    );

    const profilePic = resolveProfilePic(teacher.profilePicture);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-page)', paddingTop: '52px' }}>
            <NavBar role="admin" userName={user?.name} onLogout={handleLogout} backTo={-1 as any} backLabel="Back" />
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px' }}>

                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-end))', borderRadius: '16px', padding: '24px', marginBottom: '20px', color: 'white', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', justifyContent: 'space-between', boxShadow: 'var(--shadow-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: profilePic ? `url(${profilePic}) center/cover` : 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700, border: '3px solid rgba(255,255,255,0.5)', flexShrink: 0, overflow: 'hidden' }}>
                            {!profilePic && teacher.name?.charAt(0)}
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>{teacher.name}</h1>
                            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>{teacher.teacherId}</span>
                            {teacher.subject && <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '14px' }}>📚 {teacher.subject}</p>}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button onClick={handleResetPassword} style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>🔑 Reset Password</button>
                        <button onClick={handleDelete} style={{ padding: '8px 14px', background: 'rgba(239,68,68,0.8)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>🗑️ Delete</button>
                    </div>
                </div>

                {/* Stats */}
                {teacher.stats && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                        {[
                            { label: 'Students', value: teacher.stats.studentCount, icon: '👥', color: 'var(--primary)' },
                            { label: 'Avg Marks', value: `${teacher.stats.averageMarks}%`, icon: '📊', color: teacher.stats.averageMarks >= 60 ? '#10b981' : '#f59e0b' },
                            { label: 'Attendance Rate', value: `${teacher.stats.attendanceRate}%`, icon: '✅', color: teacher.stats.attendanceRate >= 75 ? '#10b981' : '#ef4444' },
                            { label: 'Classes', value: teacher.assignedClasses?.length || 0, icon: '🏫', color: 'var(--text-main)' },
                        ].map((s, i) => (
                            <div key={i} style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '16px', boxShadow: 'var(--shadow-sm)', textAlign: 'center' }}>
                                <div style={{ fontSize: '22px' }}>{s.icon}</div>
                                <div style={{ fontSize: '20px', fontWeight: 700, color: s.color }}>{s.value}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Personal Info */}
                    <div style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
                        <h3 style={{ margin: '0 0 14px', fontSize: '16px', color: 'var(--text-main)' }}>👨‍🏫 Teacher Details</h3>
                        {[
                            { label: 'Email', value: teacher.email },
                            { label: 'Phone', value: teacher.phone || 'N/A' },
                            { label: 'Subject Taught', value: teacher.subject || 'N/A' },
                            { label: 'Status', value: teacher.isActive !== false ? 'Active' : 'Inactive' },
                        ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '14px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                                <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{item.value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Assigned Classes */}
                    <div style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-main)' }}>🏫 Assigned Classes</h3>
                            <span style={{ fontSize: '12px', background: 'var(--bg-page)', padding: '2px 8px', borderRadius: '10px', color: 'var(--text-muted)' }}>
                                {teacher.assignedClasses?.length || 0} classes
                            </span>
                        </div>

                        {(!teacher.assignedClasses || teacher.assignedClasses.length === 0) ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0', border: '1px dashed var(--border)', borderRadius: '12px' }}>No classes assigned</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {teacher.assignedClasses.map((cls: any, i: number) => (
                                    <div key={i}
                                        onClick={() => navigate(`/admin/classes/${cls._id}`)}
                                        style={{ padding: '12px', background: 'var(--bg-page)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--border)' }}
                                        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
                                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '15px' }}>Class {cls.className} - {cls.section}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Academic Year: {cls.academicYear}</div>
                                        </div>
                                        <button 
                                            onClick={(e) => handleRemoveClass(e, cls._id)}
                                            style={{ background: 'none', border: 'none', color: 'var(--danger)', padding: '6px', cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                                            title="Remove teacher from this class"
                                            disabled={assigningLoading}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>Assign to Another Class:</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <select 
                                    className="form-control"
                                    onChange={(e) => handleAssignClass(e.target.value)}
                                    value=""
                                    disabled={assigningLoading}
                                    style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-page)', color: 'var(--text-main)', fontSize: '14px' }}
                                >
                                    <option value="">-- Choose Class --</option>
                                    {allClasses
                                        .filter(c => !teacher.assignedClasses?.some((ac: any) => ac._id === c._id))
                                        .map(c => (
                                            <option key={c._id} value={c._id}>
                                                {c.className} - {c.section} ({c.academicYear}) {c.classTeacherId?.name ? `(Curr: ${c.classTeacherId.name})` : '(No Teacher)'}
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Students in first class */}
                </div>
            </div>
        </div>
    );
}

export default TeacherDetailPage;
