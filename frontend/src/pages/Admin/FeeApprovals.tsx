import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, feesService, resolveUploadUrl } from '../../services/api';
import NavBar from '../../components/NavBar';
import './ViewApprovals.css'; // Reuse existing approval styles

interface EditRequest {
    _id: string;
    entityId: string;
    classId?: {
        _id: string;
        className: string;
        section: string;
        academicYear: string;
    };
    newData: any;
    requestedBy: {
        _id: string;
        name: string;
    };
    requestedAt: string;
    status: string;
}

interface FeeClassGroup {
    classKey: string;
    className: string;
    section: string;
    requests: EditRequest[];
}

function FeeApprovals() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [classGroupedRequests, setClassGroupedRequests] = useState<FeeClassGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const data = await feesService.getPendingApprovals();
            groupRequests(data);
        } catch (err) {
            console.error('Failed to load fee approvals:', err);
            setError('Failed to load pending fee approvals.');
        } finally {
            setLoading(false);
        }
    };

    const groupRequests = (data: EditRequest[]) => {
        const classGroups: { [key: string]: FeeClassGroup } = {};

        data.forEach(req => {
            const classInfo = req.classId || { className: 'General', section: 'Fees' };
            const classKey = `${classInfo.className}-${classInfo.section}`;
            
            if (!classGroups[classKey]) {
                classGroups[classKey] = {
                    classKey,
                    className: classInfo.className,
                    section: classInfo.section,
                    requests: []
                };
            }
            classGroups[classKey].requests.push(req);
        });

        setClassGroupedRequests(Object.values(classGroups).sort((a,b) => a.className.localeCompare(b.className)));
    };

    const handleApprove = async (requestId: string, feeId: string, type?: string, paymentId?: string) => {
        try {
            setLoading(true);
            if (type === 'PAYMENT_APPROVAL' && paymentId) {
                await feesService.approvePayment(feeId, paymentId);
                setSuccess('Payment approved successfully!');
            } else {
                await feesService.approve(requestId, 'Approved by admin');
                await feesService.publish(feeId);
                setSuccess('Fee successfully approved and published!');
            }
            
            loadRequests();
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            console.error('Approval failed:', err);
            setError('Failed to approve request.');
            setLoading(false);
        }
    };

    const handleReject = async (feeId: string, paymentId: string) => {
        if (!confirm('Are you sure you want to reject this payment?')) return;
        try {
            setLoading(true);
            await feesService.rejectPayment(feeId, paymentId);
            setSuccess('Payment rejected.');
            loadRequests();
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            console.error('Rejection failed:', err);
            setError('Failed to reject payment.');
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

            {selectedImage && (
                <div className="modal-overlay" onClick={() => setSelectedImage(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
                        <img src={selectedImage} alt="Receipt Proof" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '8px', boxShadow: '0 0 30px rgba(0,0,0,0.5)' }} />
                        <button onClick={() => setSelectedImage(null)} style={{ position: 'absolute', top: '-40px', right: '0', background: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                    </div>
                </div>
            )}

            <div className="approvals-content">
                <div className="page-header">
                    <h1>Fee & Payment Approvals</h1>
                    <p>Review fee assignments and payment receipts submitted by teachers</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                {loading ? (
                    <div className="loading">Processing requests...</div>
                ) : classGroupedRequests.length === 0 ? (
                    <div className="empty-state">
                        <p>No pending approvals found.</p>
                    </div>
                ) : (
                    <div className="class-groups">
                        {classGroupedRequests.map((classGroup) => (
                            <div key={classGroup.classKey} className="class-section-card" style={{ marginBottom: '40px', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                                <div className="class-header" style={{ background: '#f8fafc', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#1e293b' }}>
                                            🏫 Class {classGroup.className} - {classGroup.section}
                                        </h2>
                                        <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                                            {classGroup.requests.length} pending requests
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="class-items" style={{ padding: '24px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
                                        {classGroup.requests.map((req) => {
                                            const isPayment = req.newData?.type === 'PAYMENT_APPROVAL';
                                            return (
                                                <div key={req._id} className="approval-card" style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', background: isPayment ? '#fff' : '#f0f9ff' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                                        <div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                                                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                                                                    {isPayment ? '💰 Payment Record' : `📝 Fee: ${req.newData.termName}`}
                                                                </h3>
                                                                {isPayment && <span style={{ background: '#dcfce7', color: '#166534', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>PAYMENT</span>}
                                                            </div>
                                                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                                                                Sub: {req.requestedBy?.name} • {new Date(req.requestedAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#0f172a' }}>₹{req.newData.amount.toLocaleString()}</div>
                                                            {!isPayment && <div style={{ fontSize: '0.75rem', color: '#ef4444' }}>Due: {new Date(req.newData.dueDate).toLocaleDateString()}</div>}
                                                        </div>
                                                    </div>

                                                    {isPayment && req.newData.proofUrl && (
                                                        <div style={{ marginBottom: '15px' }}>
                                                            <div 
                                                                onClick={() => setSelectedImage(resolveUploadUrl(req.newData.proofUrl))}
                                                                style={{ 
                                                                    height: '100px', 
                                                                    background: '#f1f5f9', 
                                                                    borderRadius: '8px', 
                                                                    display: 'flex', 
                                                                    alignItems: 'center', 
                                                                    justifyContent: 'center',
                                                                    cursor: 'pointer',
                                                                    overflow: 'hidden',
                                                                    border: '1px dashed #cbd5e1'
                                                                }}
                                                            >
                                                                <img 
                                                                    src={resolveUploadUrl(req.newData.proofUrl)} 
                                                                    alt="Proof" 
                                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                                />
                                                            </div>
                                                            <p style={{ fontSize: '0.7rem', color: '#64748b', textAlign: 'center', marginTop: '4px' }}>Click to enlarge receipt</p>
                                                        </div>
                                                    )}

                                                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                                        <button 
                                                            onClick={() => handleApprove(req._id, req.entityId, req.newData?.type, req.newData?.paymentId)}
                                                            className="btn btn-success"
                                                            style={{ flex: 1, padding: '8px', fontSize: '0.9rem' }}
                                                        >
                                                            Approve
                                                        </button>
                                                        {isPayment && (
                                                            <button 
                                                                onClick={() => handleReject(req.entityId, req.newData.paymentId)}
                                                                className="btn btn-danger"
                                                                style={{ padding: '8px 15px', fontSize: '0.9rem' }}
                                                            >
                                                                Reject
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
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
