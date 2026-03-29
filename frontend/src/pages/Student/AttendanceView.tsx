import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import NavBar from '../../components/NavBar';
import StudentAttendanceStats from '../../components/StudentAttendanceStats';
import './Dashboard.css';

function AttendanceView() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };
    return (
        <div className="dashboard-container">
            <NavBar role="student" userName={user?.name} onLogout={handleLogout} backTo="/student/dashboard" backLabel="← Dashboard" />

            <div className="dashboard-content">
                <div className="page-header">
                    <h1>My Attendance</h1>
                    <p>Your academic attendance overview</p>
                </div>

                {user?.referenceId ? (
                    <StudentAttendanceStats studentId={user.referenceId} />
                ) : (
                    <div className="alert alert-error">Student profile not linked properly.</div>
                )}
            </div>
        </div>
    );
}

export default AttendanceView;
