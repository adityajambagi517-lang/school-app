import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, studentsService } from '../../services/api';
import type { StudentWithDetails } from '../../types/student';
import NavBar from '../../components/NavBar';
import '../Admin/StudentSearch.css';

function StudentSearch() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<StudentWithDetails[]>([]);
    const [error, setError] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<StudentWithDetails | null>(null);

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
                setError('No students found in your class matching your search.');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Search failed. Please try again.');
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
            <NavBar role="teacher" userName={user?.name} onLogout={handleLogout} backTo="/teacher/dashboard" backLabel="Dashboard" />

            <div className="search-content">
                <div className="search-header">
                    <h1>
                        <span className="heading-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </span> 
                        My Class Student Search
                    </h1>
                    <p>Search for students in Class {user?.className} - {user?.section}</p>

                    <form onSubmit={handleSearch} className="search-bar">
                        <input
                            type="text"
                            placeholder="Enter Student ID, Name or Email..."
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
                                        <strong>{student.name || 'Unknown Student'} ({student.studentId || 'No ID'})</strong>
                                        <span>Class {student.classId?.className || 'N/A'} - {student.classId?.section || 'N/A'}</span>
                                    </div>
                                    <button className="btn btn-sm btn-secondary">View Profile</button>
                                </div>
                            ))}
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
                                    <p>{selectedStudent.classId?.className || 'N/A'} - {selectedStudent.classId?.section || 'N/A'} | {selectedStudent.classId?.academicYear || 'N/A'}</p>
                                </div>
                                <div className="attendance-circle">
                                    <div className="percent">{selectedStudent.academicData?.attendance?.percentage || 0}%</div>
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
                                                {selectedStudent.academicData?.marks?.length > 0 ? (
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
                                        <strong>{selectedStudent.academicData?.attendance?.totalDays || 0}</strong>
                                    </div>
                                    <div className="stat-item">
                                        <span>Present Days</span>
                                        <strong>{selectedStudent.academicData?.attendance?.presentDays || 0}</strong>
                                    </div>
                                    <div className="stat-item">
                                        <span>Absent Days</span>
                                        <strong>{(selectedStudent.academicData?.attendance?.totalDays || 0) - (selectedStudent.academicData?.attendance?.presentDays || 0)}</strong>
                                    </div>
                                </div>

                                <div className="profile-card">
                                    <h3>Fee Payment Status</h3>
                                    <div className="fee-total">
                                        <span>Pending Amount</span>
                                        <strong className={(selectedStudent.academicData?.fees?.pendingAmount || 0) > 0 ? 'unpaid' : 'paid'}>
                                            RS {selectedStudent.academicData?.fees?.pendingAmount || 0}
                                        </strong>
                                    </div>
                                    <div className="fee-list">
                                        {selectedStudent.academicData?.fees?.details?.map((fee, idx) => (
                                            <div key={idx} className="stat-item">
                                                <span>{fee.term}</span>
                                                <span className={fee.isPaid ? 'paid' : 'unpaid'}>RS {fee.amount} ({fee.isPaid ? 'Paid' : 'Unpaid'})</span>
                                            </div>
                                        )) || <p>No fee records found</p>}
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
                </div>
            </div>
        </div>
    );
}

export default StudentSearch;
