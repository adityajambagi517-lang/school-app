import { useState } from 'react';
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
            const students = response.students || [];
            setResults(students);
            if (students.length === 0) {
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
                                    onClick={() => navigate(`/teacher/students/${student._id}`)}
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


                </div>
            </div>
        </div>
    );
}

export default StudentSearch;
