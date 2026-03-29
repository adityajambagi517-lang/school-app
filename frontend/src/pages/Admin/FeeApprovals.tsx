import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, feesService } from '../../services/api';
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

    const handleApprove = async (requestId: string, feeId: string) => {
        try {
            setLoading(true);
            await feesService.approve(requestId, 'Approved by admin');
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

    const handleApproveClass = async (classKey: string) => {
        const classGroup = classGroupedRequests.find(cg => cg.classKey === classKey);
        if (!classGroup) return;

        try {
            setLoading(true);
            // Process all approvals in sequence (backend doesn't have bulk fee approve yet)
            for (const req of classGroup.requests) {
                await feesService.approve(req._id, 'Approved by admin (Bulk)');
                await feesService.publish(req.entityId);
            }
            
            setSuccess(`Successfully approved ALL fees for Class ${classGroup.className} - ${classGroup.section}`);
            loadRequests();
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            console.error('Class approval failed:', err);
            setError('Failed to approve class fee requests.');
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
                    <p>Review and approve fee records submitted by teachers (Organized Class-wise)</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                {loading ? (
                    <div className="loading">Processing fee requests...</div>
                ) : classGroupedRequests.length === 0 ? (
                    <div className="empty-state">
                        <p>No pending fee approvals found.</p>
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
                                            {classGroup.requests.length} pending fee records
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => handleApproveClass(classGroup.classKey)}
                                        className="btn btn-primary"
                                        style={{ padding: '10px 20px', fontWeight: 600, background: 'linear-gradient(135deg, #10b981, #059669)' }}
                                    >
                                        ✅ Approve All for Class
                                    </button>
                                </div>
                                
                                <div className="class-items" style={{ padding: '24px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
                                        {classGroup.requests.map((req) => (
                                            <div key={req._id} className="approval-card" style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', background: '#fff' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                                    <div>
                                                        <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>{req.newData.termName}</h3>
                                                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                                                            By: {req.requestedBy?.name} • {new Date(req.requestedAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b' }}>₹{req.newData.amount.toLocaleString()}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#ef4444' }}>Due: {new Date(req.newData.dueDate).toLocaleDateString()}</div>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                                    <button 
                                                        onClick={() => handleApprove(req._id, req.entityId)}
                                                        className="btn btn-success"
                                                        style={{ flex: 1, padding: '8px', fontSize: '0.9rem' }}
                                                    >
                                                        Approve
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
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
