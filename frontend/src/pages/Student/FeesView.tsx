import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { authService, feesService } from '../../services/api';
import NavBar from '../../components/NavBar';
import './Dashboard.css';

interface FeeRecord {
    _id: string;
    studentId: any;
    academicYear: string;
    termName: string;
    amount: number;
    dueDate: string;
    status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PUBLISHED' | 'PAID';
}

function FeesView() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [fees, setFees] = useState<FeeRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadFees();
    }, []);

    const loadFees = async () => {
        try {
            setLoading(true);
            const studentId = user?.referenceId;
            if (!studentId) {
                setError('Student ID not found');
                return;
            }
            const data = await feesService.getStudentFees(studentId);
            setFees(data);
        } catch (err: any) {
            console.error('Failed to load fees:', err);
            setError(err.response?.data?.message || 'Failed to load fee records');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PAID': return <CheckCircle2 size={16} className="text-success" />;
            case 'PUBLISHED': return <Clock size={16} className="text-warning" />;
            default: return <AlertCircle size={16} className="text-muted" />;
        }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'PAID': return 'status-paid';
            case 'PUBLISHED': return 'status-pending';
            default: return 'status-draft';
        }
    };

    if (loading) return <div className="dash-root"><NavBar role="student" userName={user?.name} onLogout={handleLogout} /><div className="dash-scroll">Loading fees...</div></div>;

    return (
        <div className="dash-root">
            <NavBar
                role="student"
                userName={user?.name}
                profileImage={user?.studentDetails?.profileImage}
                onLogout={handleLogout}
                backTo="/student/dashboard"
                backLabel="← Dashboard"
            />

            <div className="dash-scroll">
                <div className="dash-hero">
                    <p className="hero-greeting">Your Finances 💳</p>
                    <h1 className="hero-name">Fee Records</h1>
                </div>

                <div className="section-header">
                    <h2 className="section-title">Academic Fees</h2>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                {fees.length === 0 ? (
                    <div className="activity-card" style={{ textAlign: 'center', padding: '2rem' }}>
                        <DollarSign size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p>No fee records found.</p>
                    </div>
                ) : (
                    <div className="fee-list">
                        {fees.map(fee => (
                            <div key={fee._id} className="activity-card fee-card">
                                <div className="fee-header">
                                    <div className="fee-info">
                                        <h3>{fee.termName} ({fee.academicYear})</h3>
                                        <p className="fee-date">Due: {new Date(fee.dueDate).toLocaleDateString()}</p>
                                    </div>
                                    <div className="fee-amount">
                                        ₹{fee.amount.toLocaleString()}
                                    </div>
                                </div>
                                <div className={`fee-status ${getStatusClass(fee.status)}`}>
                                    {getStatusIcon(fee.status)}
                                    <span>{fee.status === 'PUBLISHED' ? 'PENDING PAYMENT' : fee.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="info-box" style={{ marginTop: '2rem' }}>
                    <p>ℹ️ To pay your fees, please visit the school office with your Reference ID: <strong>{user?.referenceId}</strong></p>
                </div>
            </div>
            
            <style>{`
                .fee-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    padding-bottom: 2rem;
                }
                .fee-card {
                    padding: 1.25rem;
                }
                .fee-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1rem;
                }
                .fee-info h3 {
                    margin: 0;
                    font-size: 1.1rem;
                    color: #2d3748;
                }
                .fee-date {
                    margin: 0.25rem 0 0;
                    font-size: 0.85rem;
                    color: #718096;
                }
                .fee-amount {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #2d3748;
                }
                .fee-status {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.35rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                }
                .status-paid {
                    background: #f0fff4;
                    color: #2f855a;
                }
                .status-pending {
                    background: #fffaf0;
                    color: #c05621;
                }
                .status-draft {
                    background: #edf2f7;
                    color: #4a5568;
                }
                .text-success { color: #2f855a; }
                .text-warning { color: #c05621; }
                .text-muted { color: #4a5568; }
            `}</style>
        </div>
    );
}

export default FeesView;
