import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, feesService } from '../../services/api';
import NavBar from '../../components/NavBar';
import './ViewApprovals.css'; // Reuse existing approval styles

interface EditRequest {
    _id: string;
    entityId: string;
    newData: any;
    requestedBy: {
        _id: string;
        name: string;
    };
    requestedAt: string;
    status: string;
}

function FeeApprovals() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [requests, setRequests] = useState<EditRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const data = await feesService.getPendingApprovals();
            setRequests(data);
        } catch (err) {
            console.error('Failed to load fee approvals:', err);
            setError('Failed to load pending fee approvals.');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (requestId: string, feeId: string) => {
        try {
            setLoading(true);
            // First approve the edit request
            await feesService.approve(requestId, 'Approved by admin');
            
            // Then publish the fee so students can see it
            await feesService.publish(feeId);
            
            setSuccess('Fee successfully approved and published!');
            loadRequests();
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            console.error('Approval failed:', err);
            setError('Failed to approve fee request.');
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <div className="approvals-container">
            <NavBar role="admin" userName={user?.name} onLogout={handleLogout} backTo="/admin/dashboard" backLabel="← Dashboard" />

            <div className="approvals-content">
                <div className="page-header">
                    <h1>Fee Approvals</h1>
                    <p>Review and approve fee records submitted by teachers</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                {loading ? (
                    <div className="loading">Loading requests...</div>
                ) : requests.length === 0 ? (
                    <div className="empty-state">
                        <p>No pending fee approvals found.</p>
                    </div>
                ) : (
                    <div className="groups-container">
                        {requests.map((req) => (
                            <div key={req._id} className="dashboard-card" style={{ marginBottom: '24px' }}>
                                <div className="group-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
                                    <div>
                                        <h2 style={{ margin: '0 0 5px 0' }}>{req.newData.termName} ({req.newData.academicYear})</h2>
                                        <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '0.9em' }}>
                                            Requested by: {req.requestedBy?.name || 'Unknown'} on {new Date(req.requestedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <button onClick={() => handleApprove(req._id, req.entityId)} className="btn btn-success" style={{ padding: '10px 20px' }} disabled={loading}>
                                        ✅ Approve & Publish
                                    </button>
                                </div>
                                <div className="group-details">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #edf2f7' }}>
                                        <div>
                                            <div style={{ color: '#718096', fontSize: '13px', marginBottom: '4px' }}>Total Amount</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2d3748' }}>₹{req.newData.amount.toLocaleString()}</div>
                                        </div>
                                        {req.newData.paidAmount > 0 && (
                                            <div>
                                                <div style={{ color: '#718096', fontSize: '13px', marginBottom: '4px' }}>Paid Upfront</div>
                                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2f855a' }}>₹{req.newData.paidAmount.toLocaleString()}</div>
                                            </div>
                                        )}
                                        <div>
                                            <div style={{ color: '#718096', fontSize: '13px', marginBottom: '4px' }}>Remaining</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#e53e3e' }}>₹{(req.newData.amount - req.newData.paidAmount).toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: '#718096', fontSize: '13px', marginBottom: '4px' }}>Due Date</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#e53e3e' }}>{new Date(req.newData.dueDate).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default FeeApprovals;
