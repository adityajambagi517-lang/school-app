import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, classesService, studentsService } from '../../services/api';
import type { StudentWithDetails } from '../../types/student';
import NavBar from '../../components/NavBar';
import './StudentSearch.css';

function StudentSearch() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<StudentWithDetails[]>([]);
    const [teacherResults, setTeacherResults] = useState<any[]>([]);
    const [error, setError] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<StudentWithDetails | null>(null);
    const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [searchMode, setSearchMode] = useState<'text' | 'class'>('text');

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const classesData = await classesService.getAll();
            setClasses(classesData);
        } catch (err) {
            console.error('Failed to fetch classes:', err);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError('');
        setResults([]);
        setTeacherResults([]);
        setSelectedStudent(null);
        setSelectedTeacher(null);

        try {
            const response = await studentsService.search(query);
            setResults(response.students || []);
            setTeacherResults(response.teachers || []);
            
            if (response.students.length === 0 && (!response.teachers || response.teachers.length === 0)) {
                setError('No results found matching your search.');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Search failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClassFilter = async (classId: string) => {
        if (!classId) return;

        setLoading(true);
        setError('');
        setResults([]);
        setTeacherResults([]);
        setSelectedStudent(null);
        setSelectedTeacher(null);
        setSelectedClassId(classId);

        try {
            const students = await studentsService.getByClass(classId);
            // Transform to match StudentWithDetails format (without academic data for simple list)
            const transformedStudents = students.map((s: any) => ({
                ...s,
                academicData: {
                    marks: [],
                    attendance: { totalDays: 0, presentDays: 0, percentage: 0 },
                    fees: { total: 0, paid: 0, pending: 0, pendingAmount: 0, details: [] }
                }
            }));
            setResults(transformedStudents);
            if (students.length === 0) {
                setError('No students found in this class.');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load students.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <div className="search-container">
            <NavBar role="admin" userName={user?.name} onLogout={handleLogout} backTo="/admin/dashboard" backLabel="Dashboard" />

            <div className="search-content">
                <div className="search-header">
                    <h1>
                        <span className="heading-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </span> 
                        Unified Search Engine
                    </h1>
                    <p>Search students and teachers or browse by class</p>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
                        <button
                            className={`btn ${searchMode === 'text' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => { setSearchMode('text'); setResults([]); setTeacherResults([]); setSelectedClassId(''); }}
                            type="button"
                        >
                            Search by Text
                        </button>
                        <button
                            className={`btn ${searchMode === 'class' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => { setSearchMode('class'); setQuery(''); setResults([]); setTeacherResults([]); }}
                            type="button"
                        >
                            Browse by Class
                        </button>
                    </div>

                    {searchMode === 'text' ? (
                        <form onSubmit={handleSearch} className="search-bar">
                            <input
                                type="text"
                                placeholder="Search students or teachers..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                autoFocus
                            />
                            <button type="submit" disabled={loading}>
                                {loading ? 'Searching...' : (
                                    <>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                                        </svg>
                                        Search
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className="search-bar" style={{ padding: '4px' }}>
                            <select
                                value={selectedClassId}
                                onChange={(e) => handleClassFilter(e.target.value)}
                                style={{ flex: 1, padding: '12px', fontSize: '1rem', borderRadius: '8px', border: 'none', background: 'transparent', color: 'var(--text-main)', outline: 'none' }}
                            >
                                <option value="">-- Select a Class --</option>
                                {classes.map((cls) => (
                                    <option key={cls._id} value={cls._id}>
                                        Class {cls.className} - Section {cls.section} ({cls.academicYear})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <div className="results-grid">
                    {(results.length > 0 || teacherResults.length > 0) && !selectedStudent && !selectedTeacher && (
                        <div className="results-list">
                            <h3>Combined Results ({results.length + teacherResults.length})</h3>
                            
                            {teacherResults.length > 0 && (
                                <div className="result-section">
                                    <h4 style={{ margin: '1rem 0 0.5rem', color: 'var(--accent-primary)' }}>Teachers ({teacherResults.length})</h4>
                                    {teacherResults.map(teacher => (
                                        <div
                                            key={teacher._id}
                                            className="result-item teacher-result"
                                            onClick={() => setSelectedTeacher(teacher)}
                                            style={{ borderLeft: '4px solid var(--accent-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', marginBottom: '8px', cursor: 'pointer', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)' }}
                                        >
                                            <div className="student-main" style={{ display: 'flex', flexDirection: 'column' }}>
                                                <strong>{teacher.name} ({teacher.teacherId})</strong>
                                                <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>{teacher.subject || 'All Subjects'} | {teacher.assignedClassId ? `Class ${teacher.assignedClassId.className}-${teacher.assignedClassId.section}` : 'No Class Assigned'}</span>
                                            </div>
                                            <button className="btn btn-sm btn-primary">View Profile</button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {results.length > 0 && (
                                <div className="result-section">
                                    <h4 style={{ margin: '1rem 0 0.5rem', color: 'var(--accent-secondary)' }}>Students ({results.length})</h4>
                                    {results.map(student => (
                                        <div
                                            key={student._id}
                                            className="result-item"
                                            onClick={() => setSelectedStudent(student)}
                                        >
                                            <div className="student-main">
                                                <strong>{student.name || 'Unknown Student'} ({student.studentId || 'No ID'})</strong>
                                                {student.classId ? (
                                                    <span>Class {student.classId.className || 'N/A'} - {student.classId.section || 'N/A'}</span>
                                                ) : (
                                                    <span className="not-assigned">No Class Assigned</span>
                                                )}
                                            </div>
                                            <button className="btn btn-sm btn-secondary">View Profile</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {selectedStudent && (
                        <div className="student-profile">
                            <button className="btn btn-sm btn-secondary" style={{ marginBottom: '16px' }} onClick={() => setSelectedStudent(null)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                                    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                                </svg>
                                Back to results
                            </button>

                            <div className="profile-header">
                                <div className="profile-main">
                                    <h2>{selectedStudent.name || 'Unknown'}</h2>
                                    <span className="id-badge">{selectedStudent.studentId || 'No ID'}</span>
                                    {selectedStudent.classId ? (
                                        <p>{selectedStudent.classId.className || 'N/A'} - {selectedStudent.classId.section || 'N/A'} | {selectedStudent.classId.academicYear || 'N/A'}</p>
                                    ) : (
                                        <p className="not-assigned">No class information available</p>
                                    )}
                                </div>
                                <div className="attendance-circle">
                                    <div className="percent">{selectedStudent.academicData.attendance.percentage}%</div>
                                    <div className="label">Attendance</div>
                                </div>
                            </div>

                            <div className="profile-grid">
                                <div className="profile-card">
                                    <h3>Academic Performance</h3>
                                    <div className="marks-table">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Subject</th>
                                                    <th>Exam</th>
                                                    <th>Marks</th>
                                                    <th>%</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedStudent.academicData.marks.length > 0 ? (
                                                    selectedStudent.academicData.marks.map((m, idx) => (
                                                        <tr key={idx}>
                                                            <td>{m.subject}</td>
                                                            <td>{m.examType}</td>
                                                            <td>{m.marks}/{m.maxMarks}</td>
                                                            <td className={m.percentage > 40 ? 'pass' : 'fail'}>
                                                                {m.percentage}%
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>No marks recorded yet</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="profile-card">
                                    <h3>Attendance Details</h3>
                                    <div className="stat-item">
                                        <span>Total Class Days</span>
                                        <strong>{selectedStudent.academicData.attendance.totalDays}</strong>
                                    </div>
                                    <div className="stat-item">
                                        <span>Present Days</span>
                                        <strong>{selectedStudent.academicData.attendance.presentDays}</strong>
                                    </div>
                                    <div className="stat-item">
                                        <span>Absent Days</span>
                                        <strong>{selectedStudent.academicData.attendance.totalDays - selectedStudent.academicData.attendance.presentDays}</strong>
                                    </div>
                                </div>

                                <div className="profile-card">
                                    <h3>Fee Payment Status</h3>
                                    <div className="fee-total">
                                        <span>Pending Amount</span>
                                        <strong className={selectedStudent.academicData.fees.pendingAmount > 0 ? 'unpaid' : 'paid'}>
                                            RS {selectedStudent.academicData.fees.pendingAmount}
                                        </strong>
                                    </div>
                                    <div className="fee-list">
                                        {selectedStudent.academicData.fees.details.map((fee, idx) => (
                                            <div key={idx} className="stat-item">
                                                <span>{fee.term}</span>
                                                <span className={fee.isPaid ? 'paid' : 'unpaid'}>RS {fee.amount} ({fee.isPaid ? 'Paid' : 'Unpaid'})</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="profile-card">
                                    <h3>Personal and Contact</h3>
                                    <div className="contact-info">
                                        <p><strong>Email:</strong> {selectedStudent.email}</p>
                                        <p><strong>DOB:</strong> {selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                                        <p><strong>Guardian:</strong> {selectedStudent.guardianName}</p>
                                        <p><strong>Guardian Contact:</strong> {selectedStudent.guardianPhone}</p>
                                        <p><strong>Address:</strong> {selectedStudent.address}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedTeacher && (
                        <div className="student-profile teacher-profile">
                            <button className="btn btn-sm btn-secondary" style={{ marginBottom: '16px' }} onClick={() => setSelectedTeacher(null)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                                    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                                </svg>
                                Back to results
                            </button>

                            <div className="profile-header" style={{ borderBottomColor: 'var(--accent-primary)' }}>
                                <div className="profile-main">
                                    <h2 style={{ color: 'var(--accent-primary)' }}>{selectedTeacher.name}</h2>
                                    <span className="id-badge" style={{ backgroundColor: 'var(--accent-primary)' }}>{selectedTeacher.teacherId}</span>
                                    <p>{selectedTeacher.subject || 'All Subjects'} Specialist</p>
                                </div>
                            </div>

                            <div className="profile-grid">
                                <div className="profile-card">
                                    <h3>Employment Details</h3>
                                    <div className="stat-item">
                                        <span>Email Address</span>
                                        <strong>{selectedTeacher.email}</strong>
                                    </div>
                                    <div className="stat-item">
                                        <span>Phone Number</span>
                                        <strong>{selectedTeacher.phone || 'Not Provided'}</strong>
                                    </div>
                                    <div className="stat-item">
                                        <span>Status</span>
                                        <strong className={selectedTeacher.isActive ? 'pass' : 'fail'}>
                                            {selectedTeacher.isActive ? 'Active' : 'Inactive'}
                                        </strong>
                                    </div>
                                </div>

                                <div className="profile-card">
                                    <h3>Assigned Responsibilities</h3>
                                    <div className="stat-item">
                                        <span>Primary Class</span>
                                        <strong>{selectedTeacher.assignedClassId ? `Class ${selectedTeacher.assignedClassId.className}` : 'None'}</strong>
                                    </div>
                                    <div className="stat-item">
                                        <span>Section</span>
                                        <strong>{selectedTeacher.assignedClassId ? selectedTeacher.assignedClassId.section : 'N/A'}</strong>
                                    </div>
                                    <div className="stat-item">
                                        <span>Academic Year</span>
                                        <strong>{selectedTeacher.assignedClassId ? selectedTeacher.assignedClassId.academicYear : 'N/A'}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default StudentSearch;
