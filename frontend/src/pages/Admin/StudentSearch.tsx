import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, classesService, studentsService, teachersService, adminResetService } from '../../services/api';
import type { StudentWithDetails } from '../../types/student';
import NavBar from '../../components/NavBar';
import SortDropdown from '../../components/SortDropdown';
import StudentCharts from '../../components/StudentCharts';
import './StudentSearch.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function StudentSearch() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<StudentWithDetails[]>([]);
    const [teacherResults, setTeacherResults] = useState<any[]>([]);
    const [classResults, setClassResults] = useState<any[]>([]);
    const [error, setError] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<StudentWithDetails | null>(null);
    const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [searchMode, setSearchMode] = useState<'text' | 'class'>('text');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'newest' | 'oldest'>('asc');
    const [selectedExamType, setSelectedExamType] = useState<string>('');

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
        setClassResults([]);
        setSelectedStudent(null);
        setSelectedTeacher(null);

        try {
            const [response, classesData] = await Promise.all([
                studentsService.search(query),
                classesService.search(query)
            ]);
            
            setResults(response.students || []);
            setTeacherResults(response.teachers || []);
            setClassResults(classesData || []);
            
            if (response.students.length === 0 && (!response.teachers || response.teachers.length === 0) && (!classesData || classesData.length === 0)) {
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
        setClassResults([]);
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

    const handleDeleteStudent = async (id: string, name: string) => {
        if (!window.confirm(`⚠️ Are you sure you want to PERMANENTLY delete student ${name} and their login account?`)) {
            return;
        }

        try {
            setLoading(true);
            await studentsService.delete(id);
            alert('Student deleted successfully');
            setSelectedStudent(null);
            setResults(results.filter(r => r._id !== id));
        } catch (err: any) {
            setError(`Failed to delete student: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTeacher = async (id: string, name: string) => {
        if (!window.confirm(`⚠️ Are you sure you want to PERMANENTLY delete teacher ${name} and their login account?`)) {
            return;
        }

        try {
            setLoading(true);
            await teachersService.delete(id);
            alert('Teacher deleted successfully');
            setSelectedTeacher(null);
            setTeacherResults(teacherResults.filter(r => r._id !== id));
        } catch (err: any) {
            setError(`Failed to delete teacher: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleResetStudentPassword = async (studentId: string, name: string) => {
        if (!window.confirm(`Reset password for ${name} to "password123"?`)) return;
        try {
            await adminResetService.resetUserPassword(studentId);
            alert(`✅ Password for ${name} reset to "password123"`);
        } catch (err: any) {
            setError(`Failed to reset password: ${err.response?.data?.message || err.message}`);
        }
    };

    const handleResetTeacherPassword = async (teacherId: string, name: string) => {
        if (!window.confirm(`Reset password for ${name} to "password123"?`)) return;
        try {
            await adminResetService.resetUserPassword(teacherId);
            alert(`✅ Password for ${name} reset to "password123"`);
        } catch (err: any) {
            setError(`Failed to reset password: ${err.response?.data?.message || err.message}`);
        }
    };

    const sortByTime = (a: any, b: any) => {
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : parseInt(a._id.substring(0,8), 16);
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : parseInt(b._id.substring(0,8), 16);
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    };

    const sortedStudents = [...results].sort((a, b) => {
        if (sortOrder === 'newest' || sortOrder === 'oldest') return sortByTime(a, b);
        return sortOrder === 'asc' ? a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }) : b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: 'base' });
    });
    const sortedTeachers = [...teacherResults].sort((a, b) => {
        if (sortOrder === 'newest' || sortOrder === 'oldest') return sortByTime(a, b);
        return sortOrder === 'asc' ? a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }) : b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: 'base' });
    });
    const sortedClasses = [...classResults].sort((a, b) => {
        if (sortOrder === 'newest' || sortOrder === 'oldest') return sortByTime(a, b);
        return sortOrder === 'asc' ? a.className.localeCompare(b.className, undefined, { numeric: true, sensitivity: 'base' }) : b.className.localeCompare(a.className, undefined, { numeric: true, sensitivity: 'base' });
    });

    const getProfilePic = (person: any, type: 'student' | 'teacher') => {
        const pic = type === 'student' ? person.profileImage || person.profilePicture : person.profilePicture || person.profileImage;
        if (!pic) return null;
        if (pic.startsWith('http') || pic.startsWith('data:')) return pic;
        // Handle relative paths from server
        const cleanPath = pic.startsWith('/') ? pic : `/${pic}`;
        return `${API_URL}${cleanPath}`;
    };

    return (
        <div className="search-container">
            <NavBar role="admin" userName={user?.name} onLogout={handleLogout} backTo="/admin/dashboard" backLabel="Dashboard" />

            <div className="search-content">
                <div className="search-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                            <h1>
                                <span className="heading-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                                    </svg>
                                </span> 
                                Unified Search Engine
                            </h1>
                            <p>Search students and teachers or browse by class</p>
                        </div>
                        <div className="sort-control">
                            <SortDropdown
                                value={sortOrder}
                                onChange={(val) => setSortOrder(val as any)}
                                options={[
                                    { label: 'Name (A-Z)', value: 'asc' },
                                    { label: 'Name (Z-A)', value: 'desc' },
                                    { label: 'Latest Updated', value: 'newest' },
                                    { label: 'Oldest First', value: 'oldest' }
                                ]}
                            />
                        </div>
                    </div>

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
                            onClick={() => { setSearchMode('class'); setQuery(''); setResults([]); setTeacherResults([]); setClassResults([]); }}
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
                    {(results.length > 0 || teacherResults.length > 0 || classResults.length > 0) && !selectedStudent && !selectedTeacher && (
                        <div className="results-list">
                            <h3>Combined Results ({results.length + teacherResults.length + classResults.length})</h3>
                            
                            {teacherResults.length > 0 && (
                                <div className="result-section">
                                    <h4 style={{ margin: '1rem 0 0.5rem', color: 'var(--accent-primary)' }}>Teachers ({teacherResults.length})</h4>
                                    {sortedTeachers.map(teacher => {
                                        const pic = getProfilePic(teacher, 'teacher');
                                        return (
                                            <div
                                                key={teacher._id}
                                                className="result-item teacher-result"
                                                onClick={() => setSelectedTeacher(teacher)}
                                                style={{ borderLeft: '4px solid var(--accent-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', marginBottom: '8px', cursor: 'pointer', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)' }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                                    <div className="search-avatar teacher-avatar">
                                                        {pic ? <img src={pic} alt={teacher.name} /> : (teacher.name?.charAt(0) || 'T')}
                                                    </div>
                                                    <div className="student-main" style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <strong>{teacher.name} ({teacher.teacherId})</strong>
                                                        <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>{teacher.subject || 'All Subjects'} | {teacher.assignedClassId ? `Class ${teacher.assignedClassId.className}-${teacher.assignedClassId.section}` : 'No Class Assigned'}</span>
                                                    </div>
                                                </div>
                                                <button className="btn btn-sm btn-primary">View Profile</button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {classResults.length > 0 && (
                                <div className="result-section">
                                    <h4 style={{ margin: '1rem 0 0.5rem', color: '#10b981' }}>Classes ({classResults.length})</h4>
                                    {sortedClasses.map(cls => (
                                        <div
                                            key={cls._id}
                                            className="result-item"
                                            onClick={() => navigate(`/admin/classes/${cls._id}`)}
                                            style={{ borderLeft: '4px solid #10b981', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', marginBottom: '8px', cursor: 'pointer', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)' }}
                                        >
                                            <div className="student-main" style={{ display: 'flex', flexDirection: 'column' }}>
                                                <strong>Class {cls.className} - {cls.section}</strong>
                                                <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>Academic Year: {cls.academicYear} | Class Teacher: {cls.classTeacherId?.name || 'Not assigned'}</span>
                                            </div>
                                            <button className="btn btn-sm" style={{ backgroundColor: '#10b981', color: 'white' }}>View Class</button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {results.length > 0 && (
                                <div className="result-section">
                                    <h4 style={{ margin: '1rem 0 0.5rem', color: 'var(--accent-secondary)' }}>Students ({results.length})</h4>
                                    {sortedStudents.map(student => {
                                        const pic = getProfilePic(student, 'student');
                                        return (
                                            <div
                                                key={student._id}
                                                className="result-item"
                                                onClick={() => setSelectedStudent(student)}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                                    <div className="search-avatar student-avatar">
                                                        {pic ? <img src={pic} alt={student.name} /> : (student.name?.charAt(0) || 'S')}
                                                    </div>
                                                    <div className="student-main">
                                                        <strong>{student.name || 'Unknown Student'} ({student.studentId || 'No ID'})</strong>
                                                        {student.classId ? (
                                                            <span>Class {student.classId.className || 'N/A'} - {student.classId.section || 'N/A'}</span>
                                                        ) : (
                                                            <span className="not-assigned">No Class Assigned</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button className="btn btn-sm btn-secondary">View Profile</button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {selectedStudent && (
                        <div className="student-profile">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <button className="btn btn-sm btn-secondary" onClick={() => setSelectedStudent(null)}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                                        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                                    </svg>
                                    Back to results
                                </button>
                                <button 
                                    className="btn btn-sm btn-danger" 
                                    onClick={() => handleDeleteStudent(selectedStudent._id, selectedStudent.name)}
                                    style={{ backgroundColor: '#ff4d4d', color: 'white' }}
                                >
                                    🗑️ Delete Student
                                </button>
                                <button
                                    className="btn btn-sm"
                                    onClick={() => handleResetStudentPassword(selectedStudent.studentId, selectedStudent.name)}
                                    style={{ backgroundColor: '#f59e0b', color: 'white' }}
                                >
                                    🔑 Reset Password
                                </button>
                            </div>

                            <div className="profile-header" style={{ flexDirection: 'column', textAlign: 'center', padding: '30px 20px' }}>
                                <div className="profile-avatar student-avatar-large">
                                    {(() => {
                                        const pic = getProfilePic(selectedStudent, 'student');
                                        return pic ? <img src={pic} alt={selectedStudent.name} /> : (selectedStudent.name?.charAt(0) || 'S');
                                    })()}
                                </div>
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

                            <div className="profile-grid" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div className="profile-card">
                                    <h3>Academic Performance</h3>
                                    {selectedStudent.academicData.marks.length > 0 ? (() => {
                                        const allMarks = selectedStudent.academicData.marks;
                                        const examTypes = Array.from(new Set(allMarks.map((m: any) => m.examType)));
                                        const activeType = selectedExamType || examTypes[0] || '';
                                        const filtered = allMarks.filter((m: any) => m.examType === activeType);
                                        const totalMarks = filtered.reduce((s: number, m: any) => s + Number(m.marks), 0);
                                        const totalMax = filtered.reduce((s: number, m: any) => s + Number(m.maxMarks), 0);
                                        const avgPct = totalMax > 0 ? Number(((totalMarks / totalMax) * 100).toFixed(2)) : 0;
                                        return (
                                            <>
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                                    {examTypes.map((type: string) => (
                                                        <button key={type} onClick={() => setSelectedExamType(type)}
                                                            style={{ padding: '6px 16px', borderRadius: '20px', border: activeType === type ? '2px solid var(--primary)' : '1px solid var(--border)', background: activeType === type ? 'var(--primary)' : 'var(--bg-page)', color: activeType === type ? 'white' : 'var(--text-main)', fontWeight: 600, fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                                                            {type}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="marks-table">
                                                    <table>
                                                        <thead><tr><th>Subject</th><th>Marks</th><th>Max</th><th>%</th></tr></thead>
                                                        <tbody>
                                                            {filtered.map((m: any, idx: number) => {
                                                                const pct = m.maxMarks > 0 ? Number(((m.marks / m.maxMarks) * 100).toFixed(2)) : 0;
                                                                return (
                                                                    <tr key={idx}>
                                                                        <td>{m.subject}</td>
                                                                        <td>{Number(Number(m.marks).toFixed(2))}</td>
                                                                        <td>{m.maxMarks}</td>
                                                                        <td className={pct > 40 ? 'pass' : 'fail'}>{pct}%</td>
                                                                    </tr>
                                                                );
                                                            })}
                                                            <tr style={{ fontWeight: 700, background: 'var(--bg-page)' }}>
                                                                <td>Total / Avg</td>
                                                                <td style={{ color: 'var(--primary)' }}>{Number(totalMarks.toFixed(2))}</td>
                                                                <td>{totalMax}</td>
                                                                <td className={avgPct >= 40 ? 'pass' : 'fail'}>{avgPct}%</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </>
                                        );
                                    })() : (
                                        <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No marks recorded yet</p>
                                    )}
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

                            {/* Performance Graphs */}
                            <StudentCharts
                                marks={selectedStudent.academicData?.marks || []}
                                studentId={selectedStudent._id}
                                classId={(selectedStudent.classId as any)?._id || selectedStudent.classId}
                                studentName={selectedStudent.name}
                            />
                        </div>
                    )}

                    {selectedTeacher && (
                        <div className="student-profile teacher-profile">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <button className="btn btn-sm btn-secondary" onClick={() => setSelectedTeacher(null)}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                                        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                                    </svg>
                                    Back to results
                                </button>
                                <button 
                                    className="btn btn-sm btn-danger" 
                                    onClick={() => handleDeleteTeacher(selectedTeacher._id, selectedTeacher.name)}
                                    style={{ backgroundColor: '#ff4d4d', color: 'white' }}
                                >
                                    🗑️ Delete Teacher
                                </button>
                                <button
                                    className="btn btn-sm"
                                    onClick={() => handleResetTeacherPassword(selectedTeacher.teacherId, selectedTeacher.name)}
                                    style={{ backgroundColor: '#f59e0b', color: 'white' }}
                                >
                                    🔑 Reset Password
                                </button>
                            </div>

                            <div className="profile-header" style={{ borderBottomColor: 'var(--accent-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', textAlign: 'center', padding: '30px 20px' }}>
                                <div className="profile-avatar teacher-avatar-large">
                                    {(() => {
                                        const pic = getProfilePic(selectedTeacher, 'teacher');
                                        return pic ? <img src={pic} alt={selectedTeacher.name} /> : (selectedTeacher.name?.charAt(0) || 'T');
                                    })()}
                                </div>
                                <div className="profile-main">
                                    <h2 style={{ color: 'var(--accent-primary)' }}>{selectedTeacher.name}</h2>
                                    <span className="id-badge" style={{ backgroundColor: 'var(--accent-primary)' }}>{selectedTeacher.teacherId}</span>
                                    <p>{selectedTeacher.subject || 'All Subjects'} Specialist</p>
                                </div>
                            </div>

                            <div className="profile-grid" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
