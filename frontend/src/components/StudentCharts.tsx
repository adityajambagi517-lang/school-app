import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface StudentChartsProps {
    /** All published marks for this student */
    marks: any[];
    /** Student's _id (ObjectId) */
    studentId: string;
    /** Class ObjectId — needed to fetch classmates' marks for rank */
    classId?: string;
    /** Student's name — used for legend label */
    studentName?: string;
}

/**
 * Two charts:
 * 1. Performance across all exams (bar chart — one bar per subject grouped by examType)
 * 2. Class rank position (shows where the student stands, how many are above)
 */
export default function StudentCharts({ marks, studentId, classId, studentName }: StudentChartsProps) {
    const [classMarks, setClassMarks] = useState<any[]>([]);
    const [loadingRank, setLoadingRank] = useState(false);

    // Fetch all class marks for rank calculation
    useEffect(() => {
        if (!classId) return;
        setLoadingRank(true);
        api.get(`/markcards/class/${classId}`)
            .then((res: any) => {
                const data = res.data;
                const arr = Array.isArray(data) ? data : (data.markcards || data.marks || []);
                setClassMarks(arr);
            })
            .catch(() => setClassMarks([]))
            .finally(() => setLoadingRank(false));
    }, [classId]);

    // ─── Chart 1: Marks across all tests ───────────────────────────
    const examChart = useMemo(() => {
        if (!marks || marks.length === 0) return null;

        // Group by examType → subjects
        const examTypes = Array.from(new Set(marks.map((m: any) => m.examType)));

        // For each exam type, compute average percentage
        const percentages = examTypes.map(type => {
            const exams = marks.filter((m: any) => m.examType === type);
            const totalMarks = exams.reduce((s: number, m: any) => s + Number(m.marks), 0);
            const totalMax = exams.reduce((s: number, m: any) => s + Number(m.maxMarks), 0);
            return totalMax > 0 ? Number(((totalMarks / totalMax) * 100).toFixed(2)) : 0;
        });

        return {
            labels: examTypes,
            datasets: [{
                label: `${studentName || 'Student'}'s Average %`,
                data: percentages,
                backgroundColor: percentages.map(p =>
                    p >= 75 ? 'rgba(16,185,129,0.7)' :
                    p >= 40 ? 'rgba(59,130,246,0.7)' :
                             'rgba(239,68,68,0.7)'
                ),
                borderColor: percentages.map(p =>
                    p >= 75 ? '#10b981' :
                    p >= 40 ? '#3b82f6' :
                             '#ef4444'
                ),
                borderWidth: 2,
                borderRadius: 8,
            }],
        };
    }, [marks, studentName]);

    // ─── Chart 2: Class rank ───────────────────────────────────────
    const rankData = useMemo(() => {
        if (!classMarks.length || !marks.length) return null;

        // Get published marks from class
        const publishedClassMarks = classMarks.filter((m: any) => m.status === 'PUBLISHED');
        if (publishedClassMarks.length === 0) return null;

        // Get all unique students in the class
        const studentIds = Array.from(new Set(publishedClassMarks.map((m: any) =>
            typeof m.studentId === 'object' ? (m.studentId._id || m.studentId) : m.studentId
        )));

        // Calculate total percentage per student across ALL exams
        const studentTotals = studentIds.map(sid => {
            const sidStr = typeof sid === 'object' ? sid.toString() : sid;
            const stuMarks = publishedClassMarks.filter((m: any) => {
                const mid = typeof m.studentId === 'object' ? (m.studentId._id || m.studentId).toString() : m.studentId?.toString();
                return mid === sidStr;
            });
            const totalMarks = stuMarks.reduce((s: number, m: any) => s + Number(m.marks), 0);
            const totalMax = stuMarks.reduce((s: number, m: any) => s + Number(m.maxMarks), 0);
            const pct = totalMax > 0 ? Number(((totalMarks / totalMax) * 100).toFixed(2)) : 0;
            return { studentId: sidStr, percentage: pct };
        });

        // Sort descending by percentage
        studentTotals.sort((a, b) => b.percentage - a.percentage);

        // Find this student's rank
        const myRank = studentTotals.findIndex(s => s.studentId === studentId) + 1;
        const totalStudents = studentTotals.length;
        const aboveCount = myRank > 0 ? myRank - 1 : 0;
        const myPct = studentTotals.find(s => s.studentId === studentId)?.percentage || 0;

        return { myRank, totalStudents, aboveCount, myPct, studentTotals };
    }, [classMarks, marks, studentId]);

    const rankChart = useMemo(() => {
        if (!rankData) return null;

        const { studentTotals } = rankData;

        // Create bar chart data — show all students ranked but highlight current student
        const labels = studentTotals.map((_, i) => `#${i + 1}`);
        const bgColors = studentTotals.map((s) =>
            s.studentId === studentId ? 'rgba(124,58,237,0.85)' : 'rgba(148,163,184,0.35)'
        );
        const borderColors = studentTotals.map(s =>
            s.studentId === studentId ? '#7c3aed' : 'transparent'
        );

        return {
            labels,
            datasets: [{
                label: 'Overall %',
                data: studentTotals.map(s => s.percentage),
                backgroundColor: bgColors,
                borderColor: borderColors,
                borderWidth: 2,
                borderRadius: 4,
            }],
        };
    }, [rankData, studentId]);

    if (!marks || marks.length === 0) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Chart 1: Marks across tests */}
            {examChart && (
                <div style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
                    <h3 style={{ margin: '0 0 14px', fontSize: '16px', color: 'var(--text-main)' }}>📈 Performance Across Tests</h3>
                    <div style={{ position: 'relative', height: '250px' }}>
                        <Bar
                            data={examChart}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { display: true, position: 'top', labels: { font: { size: 12 }, color: '#64748b' } },
                                    tooltip: {
                                        callbacks: {
                                            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}%`,
                                        },
                                    },
                                },
                                scales: {
                                    y: { beginAtZero: true, max: 100, ticks: { callback: (v) => `${v}%`, color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.1)' } },
                                    x: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { display: false } },
                                },
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Chart 2: Class rank */}
            {loadingRank && (
                <div style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading class ranking...
                </div>
            )}
            {!loadingRank && rankData && rankChart && (
                <div style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: 'var(--text-main)' }}>🏆 Class Ranking</h3>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '14px', alignItems: 'center' }}>
                        <div style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', borderRadius: '12px', padding: '12px 20px', textAlign: 'center', minWidth: '100px' }}>
                            <div style={{ fontSize: '28px', fontWeight: 800 }}>#{rankData.myRank}</div>
                            <div style={{ fontSize: '11px', opacity: 0.9 }}>Rank</div>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                            <div><strong style={{ color: 'var(--text-main)' }}>{rankData.aboveCount}</strong> student{rankData.aboveCount !== 1 ? 's' : ''} above</div>
                            <div><strong style={{ color: 'var(--text-main)' }}>{rankData.totalStudents - rankData.myRank}</strong> student{(rankData.totalStudents - rankData.myRank) !== 1 ? 's' : ''} below</div>
                            <div>Overall: <strong style={{ color: rankData.myPct >= 40 ? '#10b981' : '#ef4444' }}>{rankData.myPct}%</strong> out of {rankData.totalStudents} students</div>
                        </div>
                    </div>
                    <div style={{ position: 'relative', height: '200px' }}>
                        <Bar
                            data={rankChart}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                        callbacks: {
                                            title: (items) => {
                                                const i = items[0]?.dataIndex;
                                                if (i !== undefined && rankData.studentTotals[i]?.studentId === studentId) {
                                                    return `${studentName || 'You'} (Rank #${i + 1})`;
                                                }
                                                return `Rank #${(i ?? 0) + 1}`;
                                            },
                                            label: (ctx) => `Overall: ${ctx.parsed.y}%`,
                                        },
                                    },
                                },
                                scales: {
                                    y: { beginAtZero: true, max: 100, ticks: { callback: (v) => `${v}%`, color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.1)' } },
                                    x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { display: false } },
                                },
                            }}
                        />
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
                        🟣 = {studentName || 'This student'} &nbsp;|&nbsp; Grey = classmates (sorted by overall %)
                    </p>
                </div>
            )}
        </div>
    );
}
