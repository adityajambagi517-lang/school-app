import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, classesService, studentsService } from '../../services/api';
import type { StudentWithDetails } from '../../types/student';
import './StudentSearch.css';

function StudentSearch() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<StudentWithDetails[]>([]);
    const [error, setError] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<StudentWithDetails | null>(null);
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
        setSelectedStudent(null);

        try {
            const response = await studentsService.search(query);
            setResults(response.students);
            if (response.students.length === 0) {
                setError('No students found matching your search.');
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
        setSelectedStudent(null);
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
            <nav className="dashboard-nav">
                <div className="nav-brand">
                    <h2>School Management</h2>
                    <span className="badge badge-admin">Admin</span>
                </div>
                <div className="nav-user">
                    <button onClick={() => navigate('/admin/dashboard')} className="btn btn-secondary">
                        ← Back
                    </button>
                    <span className="user-name">{user?.name}</span>
                    <button onClick={handleLogout} className="btn btn-logout">
                        Logout
                    </button>
                </div>
            </nav>

            <div className="search-content">
                <div className="search-header">
                    <h1>🔍 Student Search Engine</h1>
                    <p>Search by name/ID or browse students by class</p>

                    {/* Search Mode Toggle */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', justifyContent: 'center' }}>
                        <button
                            className={`btn ${searchMode === 'text' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => { setSearchMode('text'); setResults([]); setSelectedClassId(''); }}
                            type="button"
                        >
                            Search by Text
                        </button>
                        <button
                            className={`btn ${searchMode === 'class' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => { setSearchMode('class'); setQuery(''); setResults([]); }}
                            type="button"
                        >
                            Browse by Class
                        </button>
                    </div>

                    {searchMode === 'text' ? (
                        <form onSubmit={handleSearch} className="search-bar">
                            <input
                                type="text"
                                placeholder="Enter Student ID, Name or Email..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                autoFocus
                            />
                            <button type="submit" disabled={loading}>
                                {loading ? 'Searching...' : '🔍 Search'}
                            </button>
                        </form>
                    ) : (
                        <div className="search-bar">
                            <select
                                value={selectedClassId}
                                onChange={(e) => handleClassFilter(e.target.value)}
                                style={{ flex: 1, padding: '12px', fontSize: '1rem', borderRadius: '8px', border: '2px solid #e0e0e0' }}
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
                    {results.length > 0 && !selectedStudent && (
                        <div className="results-list">
                            <h3>Results ({results.length})</h3>
                            {results.map(student => (
                                <div
                                    key={student._id}
                                    className="result-item"
                                    onClick={() => setSelectedStudent(student)}
                                >
                                    <div className="student-main">
                                        <strong>{student.name} ({student.studentId})</strong>
                                        <span>Class {student.classId.className} - {student.classId.section}</span>
                                    </div>
                                    <button className="btn btn-view">View Full Profile →</button>
                                </div>
                            ))}
                        </div>
                    )}

                    {selectedStudent && (
                        <div className="student-profile">
                            <button className="btn btn-back" onClick={() => setSelectedStudent(null)}>
                                ← Back to results
                            </button>

                            <div className="profile-header">
                                <div className="profile-main">
                                    <h2>{selectedStudent.name}</h2>
                                    <span className="id-badge">{selectedStudent.studentId}</span>
                                    <p>{selectedStudent.classId.className} - {selectedStudent.classId.section} | {selectedStudent.classId.academicYear}</p>
                                </div>
                                <div className="attendance-circle">
                                    <div className="percent">{selectedStudent.academicData.attendance.percentage}%</div>
                                    <div className="label">Attendance</div>
                                </div>
                            </div>

                            <div className="profile-grid">
                                {/* Academic Performance */}
                                <div className="profile-card">
                                    <h3>📊 Academic Performance</h3>
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
                                                    <tr><td colSpan={4}>No marks recorded yet</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Attendance Details */}
                                <div className="profile-card">
                                    <h3>📅 Attendance Details</h3>
                                    <div className="stats-list">
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
                                </div>

                                {/* Fee Status */}
                                <div className="profile-card">
                                    <h3>💰 Fee Payment Status</h3>
                                    <div className="fee-summary">
                                        <div className="fee-total">
                                            <span>Pending Amount</span>
                                            <strong className={selectedStudent.academicData.fees.pendingAmount > 0 ? 'unpaid' : 'paid'}>
                                                ₹ {selectedStudent.academicData.fees.pendingAmount}
                                            </strong>
                                        </div>
                                        <div className="fee-list">
                                            {selectedStudent.academicData.fees.details.map((fee, idx) => (
                                                <div key={idx} className={`fee-item ${fee.isPaid ? 'paid' : 'unpaid'}`}>
                                                    <span>{fee.term}</span>
                                                    <span>₹ {fee.amount}</span>
                                                    <span>{fee.isPaid ? '✅ Paid' : '❌ Unpaid'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Personal & Contact */}
                                <div className="profile-card">
                                    <h3>ℹ️ Personal & Contact</h3>
                                    <div className="contact-info">
                                        <p><strong>Email:</strong> {selectedStudent.email}</p>
                                        <p><strong>DOB:</strong> {new Date(selectedStudent.dateOfBirth).toLocaleDateString()}</p>
                                        <p><strong>Guardian:</strong> {selectedStudent.guardianName}</p>
                                        <p><strong>Guardian Contact:</strong> {selectedStudent.guardianPhone}</p>
                                        <p><strong>Address:</strong> {selectedStudent.address}</p>
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
