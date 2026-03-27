import { useState, useEffect } from 'react';
import { attendanceService } from '../services/api';

interface StudentAttendanceStatsProps {
    studentId: string;
}

export default function StudentAttendanceStats({ studentId }: StudentAttendanceStatsProps) {
    const [attendance, setAttendance] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (studentId) {
            loadAttendance();
        }
    }, [studentId]);

    const loadAttendance = async () => {
        try {
            setLoading(true);
            const data = await attendanceService.getByStudent(studentId);
            setAttendance(data);
        } catch (error) {
            console.error('Failed to load attendance stats', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading attendance stats...</div>;

    if (!attendance || attendance.length === 0) {
        return <div className="alert alert-info">No attendance records found for this student.</div>;
    }

    const totalDays = attendance.length;
    const presentDays = attendance.filter(a => a.status === 'present').length;
    const absentDays = attendance.filter(a => a.status === 'absent' || a.status === 'late');
    const percentage = ((presentDays / totalDays) * 100).toFixed(1);

    return (
        <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '15px', border: '1px solid var(--border)', marginTop: '1rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                Overall Attendance
                <span style={{ 
                    padding: '0.5rem 1rem', 
                    background: parseFloat(percentage) >= 75 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: parseFloat(percentage) >= 75 ? '#10b981' : '#ef4444',
                    borderRadius: '20px',
                    fontSize: '1.2rem',
                    fontWeight: 'bold'
                }}>
                    {percentage}%
                </span>
            </h3>

            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div>
                    <p style={{ color: 'var(--text-muted)', margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>Total Tracked Days</p>
                    <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>{totalDays}</p>
                </div>
                <div>
                    <p style={{ color: 'var(--text-muted)', margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>Days Present</p>
                    <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: '#10b981' }}>{presentDays}</p>
                </div>
                <div>
                    <p style={{ color: 'var(--text-muted)', margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>Days Absent</p>
                    <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: '#ef4444' }}>{absentDays.length}</p>
                </div>
            </div>

            {absentDays.length > 0 && (
                <div>
                    <h4 style={{ margin: '0 0 1rem 0', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Absent Days History</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
                        {absentDays.map(record => (
                            <div key={record._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '10px', alignItems: 'center' }}>
                                <span style={{ fontWeight: 500, color: '#ef4444', fontSize: '1.1rem' }}>
                                    {new Date(record.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                                {record.remarks && <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Reason: {record.remarks}</span>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
