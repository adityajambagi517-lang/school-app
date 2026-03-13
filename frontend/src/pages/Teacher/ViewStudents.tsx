import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, studentsService } from '../../services/api';
import NavBar from '../../components/NavBar';
import '../Teacher/Dashboard.css';

interface Student {
    _id: string;
    studentId: string;
    name: string;
    email: string;
    guardianName: string;
    guardianPhone: string;
    dateOfBirth: string;
    gender: string;
    classId: {
        className: string;
        section: string;
        academicYear: string;
    };
}

function ViewStudents() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        try {
            if (!user?.assignedClassId) {
                setError('No class assigned to your account');
                setLoading(false);
                return;
            }

            const studentsData = await studentsService.getByClass(user.assignedClassId);
            setStudents(studentsData);
            setLoading(false);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load students');
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="dashboard-container">Loading...</div>;
    }

    return (
        <div className="dashboard-container">
            <NavBar role="teacher" userName={user?.name} onLogout={handleLogout} backTo="/teacher/dashboard" backLabel="← Dashboard" />

            <div className="dashboard-content">
                <div className="page-header">
                    <h1>👥 My Students</h1>
                    <p>
                        Class {user?.className} - Section {user?.section} | Total Students: {students.length}
                    </p>
                </div>

                {error && (
                    <div className="message message-error">
                        {error}
                    </div>
                )}

                {/* Search Bar */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <input
                        type="text"
                        placeholder="Search by name, student ID, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-input"
                        style={{ width: '100%', maxWidth: '500px' }}
                    />
                </div>

                {/* Quick Actions */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/teacher/mark-attendance')}
                    >
                        ✅ Mark Attendance
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/teacher/enter-marks')}
                    >
                        📊 Enter Marks
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/teacher/manage-fees')}
                    >
                        💰 Manage Fees
                    </button>
                </div>

                {/* Student Cards or Table */}
                {selectedStudent ? (
                    <div className="dashboard-card">
                        <button
                            className="btn btn-secondary"
                            onClick={() => setSelectedStudent(null)}
                            style={{ marginBottom: '1rem' }}
                        >
                            ← Back to List
                        </button>

                        <h3>Student Details</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                            <div>
                                <p><strong>Student ID:</strong> {selectedStudent.studentId}</p>
                                <p><strong>Name:</strong> {selectedStudent.name}</p>
                                <p><strong>Email:</strong> {selectedStudent.email}</p>
                                <p><strong>Gender:</strong> {selectedStudent.gender}</p>
                            </div>
                            <div>
                                <p><strong>Date of Birth:</strong> {new Date(selectedStudent.dateOfBirth).toLocaleDateString()}</p>
                                <p><strong>Class:</strong> {selectedStudent.classId.className} - {selectedStudent.classId.section}</p>
                                <p><strong>Academic Year:</strong> {selectedStudent.classId.academicYear}</p>
                            </div>
                            <div>
                                <p><strong>Guardian Name:</strong> {selectedStudent.guardianName}</p>
                                <p><strong>Guardian Phone:</strong> {selectedStudent.guardianPhone}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="attendance-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Student ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Guardian</th>
                                    <th>Contact</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.length > 0 ? (
                                    filteredStudents.map((student) => (
                                        <tr key={student._id}>
                                            <td>{student.studentId}</td>
                                            <td>{student.name}</td>
                                            <td>{student.email}</td>
                                            <td>{student.guardianName}</td>
                                            <td>{student.guardianPhone}</td>
                                            <td>
                                                <button
                                                    className="btn btn-primary"
                                                    style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                                                    onClick={() => setSelectedStudent(student)}
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                                            {searchTerm ? 'No students match your search.' : 'No students in your class.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ViewStudents;
