import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authService, studentsService, adminResetService } from '../../services/api';
import NavBar from '../../components/NavBar';
import StudentCharts from '../../components/StudentCharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function StudentDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [student, setStudent] = useState<any>(null);
    const [marks, setMarks] = useState<any[]>([]);
    const [fees, setFees] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [selectedExamType, setSelectedExamType] = useState<string>('');

    const handleLogout = () => { authService.logout(); navigate('/login'); };

    useEffect(() => {
        if (!id) return;
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await studentsService.getStudentFull(id!);
            setStudent(data.student);
            setMarks(Array.isArray(data.marks) ? data.marks : []);
            setFees(Array.isArray(data.fees) ? data.fees : []);
            setAttendance(Array.isArray(data.attendance) ? data.attendance : []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load student data');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`⚠️ Permanently delete ${student?.name}? This cannot be undone.`)) return;
        try {
            await studentsService.delete(id!);
            navigate(-1);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Delete failed');
        }
    };

    const handleResetPassword = async () => {
        if (!window.confirm(`Reset password for ${student?.name} to "password123"?`)) return;
        try {
            await adminResetService.resetUserPassword(student.studentId);
            alert('✅ Password reset to "password123"');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Reset failed');
        }
    };

    // Compute attendance summary
    const totalDays = attendance.length;
    const presentDays = attendance.filter((a: any) => a.isPresent).length;
    const attendancePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    // Compute fees summary
    const totalFees = fees.reduce((sum: number, f: any) => sum + (f.amount || 0), 0);
    const paidFees = fees.filter((f: any) => f.isPaid).reduce((sum: number, f: any) => sum + (f.amount || 0), 0);
    const pendingFees = totalFees - paidFees;

    if (loading) return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
            <NavBar role="admin" userName={user?.name} onLogout={handleLogout} backTo={-1 as any} backLabel="Back" />
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', fontSize: '18px', color: 'var(--text-muted)' }}>
                Loading student data...
            </div>
        </div>
    );

    if (error || !student) return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
            <NavBar role="admin" userName={user?.name} onLogout={handleLogout} backTo={-1 as any} backLabel="Back" />
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>{error || 'Student not found'}</div>
        </div>
    );

    const rawPic = student.profilePicture || student.profileImage;
    const profilePic = rawPic
        ? (rawPic.startsWith('http') || rawPic.startsWith('data:') ? rawPic : `${API_URL}${rawPic.startsWith('/') ? '' : '/'}${rawPic}`)
        : null;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-page)', paddingTop: '52px' }}>
            <NavBar role="admin" userName={user?.name} onLogout={handleLogout} backTo={-1 as any} backLabel="Back" />
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px' }}>
                {/* Header */}
                <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '24px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', justifyContent: 'space-between', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: profilePic ? `url(${profilePic}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--primary-end))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'white', fontWeight: 700, border: '3px solid var(--border)', flexShrink: 0, overflow: 'hidden' }}>
                            {!profilePic && student.name?.charAt(0)}
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--text-main)' }}>{student.name}</h1>
                            <span style={{ background: 'var(--primary)', color: 'white', padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>{student.studentId}</span>
                            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                                {student.classId ? `Class ${student.classId.className} - Section ${student.classId.section} (${student.classId.academicYear})` : 'No class assigned'}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button onClick={handleResetPassword} style={{ padding: '8px 14px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>🔑 Reset Password</button>
                        <button onClick={handleDelete} style={{ padding: '8px 14px', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>🗑️ Delete</button>
                    </div>
                </div>

                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                    {[
                        { label: 'Attendance', value: `${attendancePct}%`, icon: '✅', color: attendancePct >= 75 ? '#10b981' : '#ef4444' },
                        { label: 'Present Days', value: `${presentDays}/${totalDays}`, icon: '📅', color: 'var(--primary)' },
                        { label: 'Total Fees', value: `₹${totalFees}`, icon: '💰', color: 'var(--text-main)' },
                        { label: 'Pending Fees', value: `₹${pendingFees}`, icon: '⏳', color: pendingFees > 0 ? '#ef4444' : '#10b981' },
                        { label: 'Marks Records', value: marks.length, icon: '📊', color: 'var(--primary)' },
                    ].map((stat, i) => (
                        <div key={i} style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '16px', boxShadow: 'var(--shadow-sm)', textAlign: 'center' }}>
                            <div style={{ fontSize: '22px' }}>{stat.icon}</div>
                            <div style={{ fontSize: '20px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{stat.label}</div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Personal Info */}
                    <div style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
                        <h3 style={{ margin: '0 0 14px', fontSize: '16px', color: 'var(--text-main)' }}>👤 Personal Information</h3>
                        {[
                            { label: 'Email', value: student.email },
                            { label: 'Phone', value: student.phone || 'N/A' },
                            { label: 'Date of Birth', value: student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A' },
                            { label: 'Gender', value: student.gender || 'N/A' },
                            { label: 'Address', value: student.address },
                            { label: 'Guardian', value: student.guardianName },
                            { label: 'Guardian Phone', value: student.guardianPhone },
                        ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '14px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                                <span style={{ color: 'var(--text-main)', fontWeight: 500, textAlign: 'right', maxWidth: '55%', wordBreak: 'break-word' }}>{item.value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Fees */}
                    <div style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
                        <h3 style={{ margin: '0 0 14px', fontSize: '16px', color: 'var(--text-main)' }}>💳 Fee Status</h3>
                        {fees.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No fee records</p>
                        ) : (
                            fees.map((fee: any, i: number) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: '14px' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{fee.term || fee.feeType || 'Fee'}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : ''}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>₹{fee.amount}</div>
                                        <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: fee.isPaid ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: fee.isPaid ? '#10b981' : '#ef4444' }}>
                                            {fee.isPaid ? 'Paid' : 'Unpaid'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Marks — grouped by exam type */}
                    <div style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
                        <h3 style={{ margin: '0 0 14px', fontSize: '16px', color: 'var(--text-main)' }}>📊 Academic Marks</h3>
                        {marks.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No marks recorded yet</p>
                        ) : (() => {
                            // Group marks by examType
                            const examTypes = Array.from(new Set(marks.map((m: any) => m.examType)));
                            const activeType = selectedExamType || examTypes[0] || '';
                            const filtered = marks.filter((m: any) => m.examType === activeType);
                            const totalMarks = filtered.reduce((s: number, m: any) => s + Number(m.marks), 0);
                            const totalMax = filtered.reduce((s: number, m: any) => s + Number(m.maxMarks), 0);
                            const avgPct = totalMax > 0 ? Number(((totalMarks / totalMax) * 100).toFixed(2)) : 0;

                            return (
                                <>
                                    {/* Exam type tabs */}
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                                        {examTypes.map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setSelectedExamType(type)}
                                                style={{
                                                    padding: '8px 18px',
                                                    borderRadius: '20px',
                                                    border: activeType === type ? '2px solid var(--primary)' : '1px solid var(--border)',
                                                    background: activeType === type ? 'var(--primary)' : 'var(--bg-page)',
                                                    color: activeType === type ? 'white' : 'var(--text-main)',
                                                    fontWeight: 600,
                                                    fontSize: '13px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                }}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Marks table for selected exam type */}
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                            <thead>
                                                <tr style={{ background: 'var(--bg-page)' }}>
                                                    {['Subject', 'Marks', 'Max Marks', '%', 'Status'].map(h => (
                                                        <th key={h} style={{ padding: '10px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filtered.map((m: any, i: number) => {
                                                    const pct = m.maxMarks > 0 ? Number(((m.marks / m.maxMarks) * 100).toFixed(2)) : 0;
                                                    return (
                                                        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                                            <td style={{ padding: '10px', color: 'var(--text-main)', fontWeight: 500 }}>{m.subject}</td>
                                                            <td style={{ padding: '10px', color: 'var(--text-main)' }}>{Number(Number(m.marks).toFixed(2))}</td>
                                                            <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{m.maxMarks}</td>
                                                            <td style={{ padding: '10px', color: pct >= 40 ? '#10b981' : '#ef4444', fontWeight: 700 }}>{pct}%</td>
                                                            <td style={{ padding: '10px' }}>
                                                                <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: pct >= 40 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: pct >= 40 ? '#10b981' : '#ef4444' }}>
                                                                    {pct >= 40 ? 'Pass' : 'Fail'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                {/* Total & Average row */}
                                                <tr style={{ background: 'var(--bg-page)', fontWeight: 700 }}>
                                                    <td style={{ padding: '10px', color: 'var(--text-main)' }}>Total / Average</td>
                                                    <td style={{ padding: '10px', color: 'var(--primary)' }}>{Number(totalMarks.toFixed(2))}</td>
                                                    <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{totalMax}</td>
                                                    <td style={{ padding: '10px', color: avgPct >= 40 ? '#10b981' : '#ef4444' }}>{avgPct}%</td>
                                                    <td style={{ padding: '10px' }}>
                                                        <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: avgPct >= 40 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: avgPct >= 40 ? '#10b981' : '#ef4444' }}>
                                                            {avgPct >= 40 ? 'Pass' : 'Fail'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            );
                        })()}
                    </div>

                    {/* Attendance Table */}
                    {attendance.length > 0 && (
                        <div style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
                            <h3 style={{ margin: '0 0 14px', fontSize: '16px', color: 'var(--text-main)' }}>📅 Attendance Records</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {[...attendance].reverse().slice(0, 60).map((a: any, i: number) => (
                                    <div key={i} title={`${new Date(a.date).toLocaleDateString()}: ${a.isPresent ? 'Present' : 'Absent'}`}
                                        style={{ width: '28px', height: '28px', borderRadius: '6px', background: a.isPresent ? '#10b981' : '#ef4444', opacity: 0.8, cursor: 'default' }} />
                                ))}
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                                Showing last {Math.min(attendance.length, 60)} days. 🟢 Present 🔴 Absent
                            </p>
                        </div>
                    )}

                    {/* Performance Graphs */}
                    <StudentCharts
                        marks={marks}
                        studentId={id || ''}
                        classId={student.classId?._id || student.classId}
                        studentName={student.name}
                    />
                </div>
            </div>
        </div>
    );
}

export default StudentDetailPage;
