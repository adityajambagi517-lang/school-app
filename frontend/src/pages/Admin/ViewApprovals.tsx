import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, approvalsService } from '../../services/api';
import './ViewApprovals.css';

interface ApprovalRequest {
    _id: string;
    entityType: string;
    requestType: string;
    requestedBy: {
        _id: string;
        name: string;
    };
    requestedAt: string;
    classId: {
        _id: string;
        className: string;
        section: string;
        academicYear: string;
    };
    entityId: {
        _id: string;
        subject: string;
        examType: string;
        marks: number;
        maxMarks: number;
        studentId: any;
    };
}

interface GroupedRequest {
    groupId: string;
    className: string;
    section: string;
    examType: string;
    subject: string;
    teacherName: string;
    requestType: string;
    requests: ApprovalRequest[];
    requestedAt: string;
}

function ViewApprovals() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [groupedRequests, setGroupedRequests] = useState<GroupedRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const data = await approvalsService.getPending();
            groupRequests(data);
        } catch (err) {
            console.error('Failed to load approvals:', err);
            setError('Failed to load pending approvals.');
        } finally {
            setLoading(false);
        }
    };

    const groupRequests = (data: ApprovalRequest[]) => {
        const groups: { [key: string]: GroupedRequest } = {};

        data.forEach(req => {
            const classInfo = req.classId || { className: 'Unknown', section: 'Unknown' };
            const groupId = `${classInfo.className}-${classInfo.section}-${req.entityId?.examType || 'Unknown'}-${req.entityId?.subject || 'Unknown'}-${req.requestType}`;

            if (!groups[groupId]) {
                groups[groupId] = {
                    groupId,
                    className: classInfo.className,
                    section: classInfo.section,
                    examType: req.entityId?.examType || 'N/A',
                    subject: req.entityId?.subject || 'N/A',
                    teacherName: req.requestedBy?.name || 'Unknown',
                    requestType: req.requestType,
                    requests: [],
                    requestedAt: req.requestedAt
                };
            }
            groups[groupId].requests.push(req);
        });

        setGroupedRequests(Object.values(groups));
    };

    const handleBulkApprove = async (groupId: string) => {
        const group = groupedRequests.find(g => g.groupId === groupId);
        if (!group) return;

        const ids = group.requests.map(r => r._id);

        try {
            setLoading(true);
            await approvalsService.bulkApprove(ids);
            setSuccess(`Successfully approved marks for ${group.className} - ${group.section} (${group.requests.length} students)`);
            loadRequests();
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            console.error('Bulk approval failed:', err);
            setError('Failed to approve group requests.');
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <div className="approvals-container">
            <nav className="dashboard-nav">
                <div className="nav-brand">
                    <h2>School Management</h2>
                    <span className="badge badge-admin">Admin</span>
                </div>
                <div className="nav-user">
                    <button onClick={() => navigate('/admin/dashboard')} className="btn btn-secondary">
                        ← Back to Dashboard
                    </button>
                    <span className="user-name">{user?.name}</span>
                    <button onClick={handleLogout} className="btn btn-logout">
                        Logout
                    </button>
                </div>
            </nav>

            <div className="approvals-content">
                <div className="page-header">
                    <h1>Pending Approvals</h1>
                    <p>Review and approve marks submitted by teachers (Grouped by Class & Exam)</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                {loading ? (
                    <div className="loading">Processing requests...</div>
                ) : groupedRequests.length === 0 ? (
                    <div className="empty-state">
                        <p>No pending approval requests found.</p>
                    </div>
                ) : (
                    <div className="groups-container">
                        {groupedRequests.map((group) => (
                            <div key={group.groupId} className="dashboard-card" style={{ marginBottom: '24px' }}>
                                <div className="group-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
                                    <div>
                                        <h2 style={{ margin: '0 0 5px 0' }}>Class {group.className} - {group.section}</h2>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <span className="badge badge-info">{group.examType}</span>
                                            <span className="badge badge-teacher">{group.subject}</span>
                                            <span className="badge badge-warning">{group.requests.length} Students</span>
                                        </div>
                                        <p style={{ margin: '10px 0 0 0', color: '#666', fontSize: '0.9em' }}>
                                            Requested by: {group.teacherName} on {new Date(group.requestedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <button onClick={() => handleBulkApprove(group.groupId)} className="btn btn-success" style={{ padding: '12px 24px' }}>
                                        ✅ Approve All Records
                                    </button>
                                </div>
                                <div className="group-details">
                                    <p style={{ color: '#718096', fontSize: '14px', marginBottom: '10px' }}>
                                        Previewing first 3 records:
                                    </p>
                                    <div className="info-list">
                                        {group.requests.slice(0, 3).map((req, idx) => (
                                            <div key={req._id} className="info-item" style={{ background: '#f8fafc', border: '1px solid #edf2f7' }}>
                                                <span className="info-label">{req.entityId?.studentId?.name || `Student ${idx + 1}`}</span>
                                                <span className="info-value">{req.entityId?.marks} / {req.entityId?.maxMarks}</span>
                                            </div>
                                        ))}
                                        {group.requests.length > 3 && (
                                            <p style={{ margin: '10px 0 0 0', fontStyle: 'italic', fontSize: '13px', color: '#a0aec0' }}>
                                                ... and {group.requests.length - 3} more students
                                            </p>
                                        )}
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

export default ViewApprovals;
