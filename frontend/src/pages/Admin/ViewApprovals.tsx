import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, approvalsService } from '../../services/api';
import NavBar from '../../components/NavBar';
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

interface ClassGroup {
    classKey: string;
    className: string;
    section: string;
    groups: GroupedRequest[];
}

function ViewApprovals() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [classGroupedRequests, setClassGroupedRequests] = useState<ClassGroup[]>([]);
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
        const classGroups: { [key: string]: ClassGroup } = {};

        data.forEach(req => {
            const classInfo = req.classId || { _id: 'unknown', className: 'Unknown', section: 'Unknown' };
            const classKey = `${classInfo.className}-${classInfo.section}`;
            
            if (!classGroups[classKey]) {
                classGroups[classKey] = {
                    classKey,
                    className: classInfo.className,
                    section: classInfo.section,
                    groups: []
                };
            }

            const groupId = `${classKey}-${req.entityId?.examType || 'Unknown'}-${req.entityId?.subject || 'Unknown'}-${req.requestType}`;
            let group = classGroups[classKey].groups.find(g => g.groupId === groupId);

            if (!group) {
                group = {
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
                classGroups[classKey].groups.push(group);
            }
            group.requests.push(req);
        });

        // Set state with sorted classes
        setClassGroupedRequests(Object.values(classGroups).sort((a,b) => a.className.localeCompare(b.className)));
    };

    const handleBulkApprove = async (groupId: string, className: string, section: string, subject: string) => {
        const group = classGroupedRequests.flatMap(cg => cg.groups).find(g => g.groupId === groupId);
        if (!group) return;

        const ids = group.requests.map(r => r._id);

        try {
            setLoading(true);
            await approvalsService.bulkApprove(ids);
            setSuccess(`Approved marks for ${className} - ${section} (${subject})`);
            loadRequests();
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            console.error('Bulk approval failed:', err);
            setError('Failed to approve group requests.');
            setLoading(false);
        }
    };

    const handleApproveClass = async (classKey: string) => {
        const classGroup = classGroupedRequests.find(cg => cg.classKey === classKey);
        if (!classGroup) return;

        const ids = classGroup.groups.flatMap(g => g.requests.map(r => r._id));

        try {
            setLoading(true);
            await approvalsService.bulkApprove(ids);
            setSuccess(`Successfully approved ALL marks for Class ${classGroup.className} - ${classGroup.section}`);
            loadRequests();
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            console.error('Class approval failed:', err);
            setError('Failed to approve class requests.');
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
                    <h1>Pending Approvals</h1>
                    <p>Review and approve marks submitted by teachers (Organized Class-wise)</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                {loading ? (
                    <div className="loading">Processing requests...</div>
                ) : classGroupedRequests.length === 0 ? (
                    <div className="empty-state">
                        <p>No pending approval requests found.</p>
                    </div>
                ) : (
                    <div className="class-groups">
                        {classGroupedRequests.map((classGroup) => (
                            <div key={classGroup.classKey} className="class-section-card" style={{ marginBottom: '40px', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                                <div className="class-header" style={{ background: '#f1f5f9', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>
                                            🏫 Class {classGroup.className} - {classGroup.section}
                                        </h2>
                                        <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.95rem' }}>
                                            {classGroup.groups.reduce((acc, g) => acc + g.requests.length, 0)} pending records across {classGroup.groups.length} groups
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => handleApproveClass(classGroup.classKey)}
                                        className="btn btn-primary"
                                        style={{ padding: '10px 20px', fontWeight: 600, background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
                                    >
                                        ✅ Approve Entire Class
                                    </button>
                                </div>
                                
                                <div className="class-items" style={{ padding: '24px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                                        {classGroup.groups.map((group) => (
                                            <div key={group.groupId} className="approval-card" style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#fff' }}>
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                        <span className="badge badge-info" style={{ borderRadius: '6px' }}>{group.examType}</span>
                                                        <span className="badge badge-warning" style={{ borderRadius: '6px' }}>{group.requests.length} students</span>
                                                    </div>
                                                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#334155' }}>{group.subject}</h3>
                                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
                                                        By: {group.teacherName} • {new Date(group.requestedAt).toLocaleDateString()}
                                                    </p>
                                                    
                                                    <div className="marks-preview" style={{ marginTop: '16px', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                                                        {group.requests.slice(0, 2).map((req, i) => (
                                                            <div key={req._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: i === 0 && group.requests.length > 1 ? '8px' : 0 }}>
                                                                <span style={{ color: '#475569' }}>{req.entityId?.studentId?.name || `Student ${i+1}`}</span>
                                                                <span style={{ fontWeight: 600 }}>{req.entityId?.marks}/{req.entityId?.maxMarks}</span>
                                                            </div>
                                                        ))}
                                                        {group.requests.length > 2 && (
                                                            <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                                                + {group.requests.length - 2} more...
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <button 
                                                    onClick={() => handleBulkApprove(group.groupId, group.className, group.section, group.subject)}
                                                    className="btn btn-outline"
                                                    style={{ marginTop: '16px', width: '100%', borderColor: '#e2e8f0', color: '#475569', fontWeight: 600 }}
                                                >
                                                    Approve Group
                                                </button>
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

export default ViewApprovals;
