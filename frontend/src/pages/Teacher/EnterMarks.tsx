import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, markcardsService, studentsService, subjectsService } from '../../services/api';
import NavBar from '../../components/NavBar';
import '../Teacher/Dashboard.css';

interface Student {
    _id: string;
    studentId: string;
    name: string;
    classId: {
        className: string;
        section: string;
    };
}

interface Subject {
    _id: string;
    name: string;
}

interface SubjectMark {
    subject: string;
    marks: string;
    maxMarks: string;
}

function EnterMarks() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const assignedClasses = (user as any)?.assignedClasses || [];

    const [activeTab, setActiveTab] = useState<string>(
        assignedClasses.length > 0 ? assignedClasses[0]._id : ''
    );
    const [students, setStudents] = useState<Student[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [examType, setExamType] = useState('');
    const [subjectMarks, setSubjectMarks] = useState<SubjectMark[]>([]);

    useEffect(() => {
        if (activeTab) {
            loadData(activeTab);
        } else if (!assignedClasses.length) {
            setLoading(false);
            setMessage({ type: 'error', text: 'No class assigned to your account' });
        }
    }, [activeTab]);

    const loadData = async (classId: string) => {
        try {
            setLoading(true);
            setMessage({ type: '', text: '' });
            
            // Reset selection when class changes
            setSelectedStudentId('');
            setSelectedStudent(null);
            setSubjectMarks([]);

            const [studentsData, subjectsData] = await Promise.all([
                studentsService.getByClass(classId),
                subjectsService.getAll(classId),
            ]);
            setStudents(studentsData);
            setSubjects(subjectsData);
            setLoading(false);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to load data for this class' });
            setLoading(false);
        }
    };

    const handleStudentChange = (studentId: string) => {
        setSelectedStudentId(studentId);
        const student = students.find(s => s._id === studentId);
        setSelectedStudent(student || null);

        // Initialize subject marks with class-specific subjects
        if (student) {
            const initialMarks = subjects.map(subject => ({
                subject: subject.name,
                marks: '',
                maxMarks: '100',
            }));
            setSubjectMarks(initialMarks);
        }
    };

    const handleMarkChange = (subjectName: string, field: 'marks' | 'maxMarks', value: string) => {
        setSubjectMarks(prev => prev.map(sm =>
            sm.subject === subjectName
                ? { ...sm, [field]: value }
                : sm
        ));
    };

    const calculateTotalPercentage = (): { totalMarks: number; totalMaxMarks: number; percentage: string; count: number } => {
        let totalMarks = 0;
        let totalMaxMarks = 0;
        let count = 0;

        subjectMarks.forEach(sm => {
            if (sm.marks && sm.marks.trim() !== '') {
                const marks = parseFloat(sm.marks);
                const maxMarks = parseFloat(sm.maxMarks);
                if (!isNaN(marks) && !isNaN(maxMarks)) {
                    totalMarks += marks;
                    totalMaxMarks += maxMarks;
                    count++;
                }
            }
        });

        const cleanTotalMarks = Number(totalMarks.toFixed(2));
        const percentage = totalMaxMarks > 0 ? ((totalMarks / totalMaxMarks) * 100).toFixed(2) : '0.00';
        return { totalMarks: cleanTotalMarks, totalMaxMarks, percentage, count };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            const marksToSubmit = subjectMarks.filter(sm => sm.marks && sm.marks.trim() !== '');

            if (marksToSubmit.length === 0) {
                throw new Error('Please enter marks for at least one subject');
            }

            for (const mark of marksToSubmit) {
                const marks = parseFloat(mark.marks);
                const maxMarks = parseFloat(mark.maxMarks);

                if (isNaN(marks) || marks < 0) {
                    throw new Error(`Invalid marks for ${mark.subject}`);
                }
                if (isNaN(maxMarks) || maxMarks <= 0) {
                    throw new Error(`Invalid maximum marks for ${mark.subject}`);
                }
                if (marks > maxMarks) {
                    throw new Error(`Marks cannot exceed maximum marks for ${mark.subject}`);
                }
            }

            await markcardsService.bulkCreate({
                studentId: selectedStudentId,
                classId: activeTab,
                examType,
                marks: marksToSubmit.map(sm => ({
                    subject: sm.subject,
                    marks: parseFloat(sm.marks),
                    maxMarks: parseFloat(sm.maxMarks),
                })),
            });

            setMessage({
                type: 'success',
                text: `Successfully submitted ${marksToSubmit.length} subject marks for admin approval!`
            });

            setSelectedStudentId('');
            setSelectedStudent(null);
            setExamType('');
            setSubjectMarks([]);

            window.scrollTo(0, 0);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || error.message || 'Failed to submit marks' });
            window.scrollTo(0, 0);
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    if (loading && !subjects.length) {
        return <div className="dashboard-container">Loading...</div>;
    }

    return (
        <div className="dashboard-container">
            <NavBar role="teacher" userName={user?.name} onLogout={handleLogout} backTo="/teacher/dashboard" backLabel="← Dashboard" />

            <div className="dashboard-content">
                <div className="page-header">
                    <h1>📊 Enter Marks</h1>
                    <p>Enter marks for all subjects at once</p>
                </div>

                {/* Class Tabs Selection */}
                {assignedClasses.length > 0 && (
                    <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px' }}>
                        {assignedClasses.map((cls: any) => (
                            <button
                                key={cls._id}
                                className={`btn ${activeTab === cls._id ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setActiveTab(cls._id)}
                                style={{ borderRadius: '20px', padding: '8px 20px', fontSize: '13px', whiteSpace: 'nowrap' }}
                            >
                                Class {cls.className} - {cls.section}
                            </button>
                        ))}
                    </div>
                )}

                {message.text && (
                    <div className={`message message-${message.type}`} style={{ marginBottom: '1.5rem' }}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="form-container">
                    {/* Step 1: Select Student */}
                    <div className="dashboard-card" style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>1</div>
                            <h3 style={{ margin: 0 }}>Select Student</h3>
                        </div>
                        <div className="form-group">
                            <select
                                value={selectedStudentId}
                                onChange={(e) => handleStudentChange(e.target.value)}
                                required
                                className="form-input"
                                disabled={!activeTab || loading}
                            >
                                <option value="">-- Select Student --</option>
                                {students.map(student => (
                                    <option key={student._id} value={student._id}>
                                        {student.studentId} - {student.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedStudent && (
                            <div style={{
                                marginTop: '1rem',
                                padding: '1rem',
                                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-end) 100%)',
                                color: 'white',
                                borderRadius: '12px',
                                boxShadow: 'var(--shadow-sm)'
                            }}>
                                <h4 style={{ margin: '0 0 0.5rem 0' }}>👤 {selectedStudent.name}</h4>
                                <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>
                                    <strong>Student ID:</strong> {selectedStudent.studentId} |
                                    <strong> Class:</strong> {selectedStudent.classId.className} - {selectedStudent.classId.section}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Step 2: Select Exam Type */}
                    {selectedStudent && (
                        <div className="dashboard-card" style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>2</div>
                                <h3 style={{ margin: 0 }}>Select Exam Type</h3>
                            </div>
                            <div className="form-group">
                                <select
                                    value={examType}
                                    onChange={(e) => setExamType(e.target.value)}
                                    required
                                    className="form-input"
                                >
                                    <option value="">-- Select Exam Type --</option>
                                    <option value="Unit Test 1">Unit Test 1</option>
                                    <option value="Unit Test 2">Unit Test 2</option>
                                    <option value="Mid Term">Mid Term</option>
                                    <option value="Final Term">Final Term</option>
                                    <option value="Assignment">Assignment</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Enter Marks for All Subjects */}
                    {selectedStudent && examType && (
                        <div className="dashboard-card" style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>3</div>
                                <h3 style={{ margin: 0 }}>Enter Marks for All Subjects</h3>
                            </div>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                                ℹ️ Enter marks for each subject. Leave blank to skip a subject.
                            </p>

                            <div className="attendance-table" style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--gray-50)' }}>
                                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: 'var(--text-muted)' }}>Subject</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: 'var(--text-muted)' }}>Marks Obtained</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: 'var(--text-muted)' }}>Maximum Marks</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {subjectMarks.map((sm, index) => (
                                            <tr key={index} style={{ borderTop: '1px solid var(--border)' }}>
                                                <td style={{ padding: '12px' }}><strong style={{ color: 'var(--text-main)' }}>{sm.subject}</strong></td>
                                                <td style={{ padding: '12px' }}>
                                                    <input
                                                        type="number"
                                                        value={sm.marks}
                                                        onChange={(e) => handleMarkChange(sm.subject, 'marks', e.target.value)}
                                                        placeholder="e.g., 85"
                                                        min="0"
                                                        step="0.01"
                                                        className="form-input"
                                                        style={{ minWidth: '80px', height: '40px' }}
                                                    />
                                                </td>
                                                <td style={{ padding: '12px' }}>
                                                    <input
                                                        type="number"
                                                        value={sm.maxMarks}
                                                        onChange={(e) => handleMarkChange(sm.subject, 'maxMarks', e.target.value)}
                                                        placeholder="e.g., 100"
                                                        min="1"
                                                        step="1"
                                                        className="form-input"
                                                        style={{ minWidth: '80px', height: '40px' }}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Total Percentage Summary */}
                            {(() => {
                                const total = calculateTotalPercentage();
                                if (total.count > 0) {
                                    return (
                                        <div style={{
                                            marginTop: '1.5rem',
                                            padding: '1.5rem',
                                            background: parseFloat(total.percentage) >= 40
                                                ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-end) 100%)'
                                                : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                            color: 'white',
                                            borderRadius: '16px',
                                            textAlign: 'center',
                                            boxShadow: 'var(--shadow-md)'
                                        }}>
                                            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '2.5rem', fontWeight: '800' }}>
                                                {total.percentage}%
                                            </h2>
                                            <p style={{ margin: '0', fontSize: '1rem', fontWeight: '600', opacity: 0.9 }}>
                                                Total Performance
                                            </p>
                                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', opacity: 0.8 }}>
                                                {total.totalMarks} / {total.totalMaxMarks} marks across {total.count} subjects
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            <button
                                type="submit"
                                className="btn btn-primary btn-block"
                                disabled={submitting}
                                style={{ marginTop: '1.5rem', height: '52px' }}
                            >
                                {submitting ? 'Submitting for Approval...' : '✅ Submit All Marks for Admin Approval'}
                            </button>
                        </div>
                    )}
                </form>

                {!selectedStudent && activeTab && (
                    <div className="info-box" style={{ marginTop: '2rem' }}>
                        <p>ℹ️ <strong>How it works:</strong></p>
                        <ol style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-sub)' }}>
                            <li>Select a class tab if you have multiple classes</li>
                            <li>Select a student from the dropdown</li>
                            <li>Choose the exam type (applies to all subjects)</li>
                            <li>Enter marks for all subjects in the table</li>
                            <li>Click submit - marks go to admin for approval</li>
                        </ol>
                    </div>
                )}
            </div>
        </div>
    );
}

export default EnterMarks;
