import React, { useState, useEffect, useCallback } from 'react';
import { proposalAPI, orderAPI, jobAPI } from '../api/api';
import { useNavigate } from 'react-router-dom';

/* ─── Status badge helper ─────────────────────────── */
const STATUS_COLORS = {
    pending: { bg: '#fff8e1', color: '#f59e0b', border: '#fde68a' },
    accepted: { bg: '#ecfdf5', color: '#10b981', border: '#a7f3d0' },
    rejected: { bg: '#fef2f2', color: '#ef4444', border: '#fecaca' },
    withdrawn: { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb' },
    'order-created': { bg: '#eff6ff', color: '#3b82f6', border: '#bfdbfe' },
};

const StatusBadge = ({ status }) => {
    const s = STATUS_COLORS[status] || STATUS_COLORS.pending;
    return (
        <span style={{
            background: s.bg, color: s.color, border: `1px solid ${s.border}`,
            borderRadius: '20px', padding: '3px 12px', fontSize: '12px', fontWeight: '600',
            textTransform: 'capitalize', letterSpacing: '0.3px',
        }}>
            {status}
        </span>
    );
};

/* ─── Create-Order Modal ──────────────────────────── */
const CreateOrderModal = ({ proposal, job, clientId, onClose, onSuccess }) => {
    const [form, setForm] = useState({
        title: job?.title || '',
        description: job?.description || '',
        dueDate: '',
        deliverables: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
        setError(null);
    };

    const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.dueDate) { setError('Please select a due date.'); return; }

        setSubmitting(true);
        setError(null);
        try {
            await orderAPI.createOrder({
                jobId: proposal.projectId?._id || proposal.projectId,
                clientId: clientId,
                freelancerId: proposal.freelancerId?._id || proposal.freelancerId,
                whoPlaced: 'client',
                title: form.title,
                description: form.description,
                category: job?.category || 'Others',
                amount: proposal.bidAmount,
                totalAmount: proposal.bidAmount,
                status: 'payment-pending',
                dueDate: new Date(form.dueDate).toISOString(),
                deliverables: form.deliverables
                    ? form.deliverables.split('\n').map((d) => d.trim()).filter(Boolean)
                    : [],
            });
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create order. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={ms.backdrop} onClick={handleBackdrop}>
            <div style={ms.modal}>
                <div style={ms.header}>
                    <div>
                        <h3 style={ms.title}>Create Order</h3>
                        <p style={ms.sub}>from proposal by <strong>{proposal.freelancerId?.name || 'Freelancer'}</strong></p>
                    </div>
                    <button style={ms.closeBtn} onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit} style={ms.form}>
                    <div style={ms.field}>
                        <label style={ms.label}>Order Title <span style={ms.req}>*</span></label>
                        <input name="title" value={form.title} onChange={handleChange}
                            style={ms.input} required placeholder="e.g. Website Redesign" />
                    </div>

                    <div style={ms.field}>
                        <label style={ms.label}>Description <span style={ms.req}>*</span></label>
                        <textarea name="description" value={form.description} onChange={handleChange}
                            rows={4} style={ms.textarea} required placeholder="Describe what needs to be done…" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        <div style={ms.field}>
                            <label style={ms.label}>Bid Amount</label>
                            <div style={{ ...ms.input, background: '#f0f4ff', fontWeight: '700', color: '#6c63ff', display: 'flex', alignItems: 'center' }}>
                                ${proposal.bidAmount}
                            </div>
                        </div>
                        <div style={ms.field}>
                            <label style={ms.label}>Due Date <span style={ms.req}>*</span></label>
                            <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange}
                                style={ms.input} min={new Date().toISOString().split('T')[0]} required />
                        </div>
                    </div>

                    <div style={ms.field}>
                        <label style={ms.label}>Deliverables <span style={{ color: '#999', fontWeight: '400' }}>(one per line)</span></label>
                        <textarea name="deliverables" value={form.deliverables} onChange={handleChange}
                            rows={3} style={ms.textarea} placeholder="e.g. Figma mockups&#10;Source code&#10;Documentation" />
                    </div>

                    {error && <div style={ms.errBox}>{error}</div>}

                    <div style={ms.actions}>
                        <button type="button" style={ms.cancelBtn} onClick={onClose} disabled={submitting}>Cancel</button>
                        <button type="submit" style={ms.submitBtn} disabled={submitting}>
                            {submitting ? 'Creating…' : '🚀 Create Order'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* ─── Proposal Card ───────────────────────────────── */
const ProposalCard = ({ proposal, job, clientId, onStatusChange }) => {
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [toast, setToast] = useState(null);
    const navigate = useNavigate();

    const freelancer = proposal.freelancerId || {};
    const freelancerId = freelancer._id;

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleAction = async (newStatus) => {
        setActionLoading(newStatus);
        try {
            await proposalAPI.updateProposalStatus(proposal._id, newStatus);
            showToast(
                newStatus === 'accepted' ? 'Proposal accepted!' : 'Proposal rejected.',
                newStatus === 'accepted' ? 'success' : 'error'
            );
            onStatusChange(proposal._id, newStatus);
        } catch (err) {
            showToast(err.response?.data?.message || 'Action failed.', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleOrderSuccess = () => {
        setShowOrderModal(false);
        // Update local proposal status so the badge renders immediately;
        // the backend has also persisted 'order-created' to the DB.
        onStatusChange(proposal._id, 'order-created');
        showToast('Order created! 🎉 Status: payment-pending');
    };

    const isPending = proposal.status === 'pending';

    return (
        <div style={cs.card}>
            {/* Toast for this card */}
            {toast && (
                <div style={{ ...cs.toast, background: toast.type === 'success' ? '#10b981' : '#ef4444' }}>
                    {toast.msg}
                </div>
            )}

            {/* Order Modal */}
            {showOrderModal && (
                <CreateOrderModal
                    proposal={proposal}
                    job={job}
                    clientId={clientId}
                    onClose={() => setShowOrderModal(false)}
                    onSuccess={handleOrderSuccess}
                />
            )}

            {/* Freelancer Row */}
            <div style={cs.freelancerRow}>
                <img
                    src={freelancer.profilePhoto || 'https://i.ibb.co/N6GPXKSt/blank.jpg'}
                    alt={freelancer.name || 'Freelancer'}
                    style={{ ...cs.avatar, cursor: freelancerId ? 'pointer' : 'default' }}
                    onClick={() => freelancerId && navigate(`/view-profile/${freelancerId}`)}
                    title={freelancerId ? `View ${freelancer.name}'s profile` : ''}
                    onError={(e) => { e.target.src = '/default-profile.jpg'; }}
                />
                <div style={{ flex: 1 }}>
                    {/* Freelancer name — clickable link to ViewProfile */}
                    <div style={cs.freelancerName}>
                        {freelancerId ? (
                            <span
                                onClick={() => navigate(`/view-profile/${freelancerId}`)}
                                style={cs.freelancerNameLink}
                                title="View freelancer profile"
                            >
                                {freelancer.name || 'Unnamed Freelancer'}
                                {/* <span style={cs.viewProfileArrow}></span> */}
                            </span>
                        ) : (
                            freelancer.name || 'Unnamed Freelancer'
                        )}
                    </div>
                    {freelancer.tagline && (
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>
                            {freelancer.tagline}
                        </div>
                    )}
                    {freelancer.skills?.length > 0 && (
                        <div style={cs.skillsRow}>
                            {freelancer.skills.slice(0, 4).map((sk, i) => (
                                <span key={i} style={cs.skillTag}>{sk?.name || sk}</span>
                            ))}
                            {freelancer.skills.length > 4 && (
                                <span style={cs.skillMore}>+{freelancer.skills.length - 4} more</span>
                            )}
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <StatusBadge status={proposal.status} />
                    {freelancerId && (
                        <button
                            style={cs.viewProfileBtn}
                            onClick={() => navigate(`/view-profile/${freelancerId}`)}
                        >
                            View Profile
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Row */}
            <div style={cs.statsRow}>
                <div style={cs.stat}>
                    <span style={cs.statLabel}>💰 Bid Amount</span>
                    <span style={cs.statValue}>${proposal.bidAmount}</span>
                </div>
                <div style={cs.stat}>
                    <span style={cs.statLabel}>⏱ Delivery</span>
                    <span style={cs.statValue}>{proposal.deliveryTime} day{proposal.deliveryTime !== 1 ? 's' : ''}</span>
                </div>
                <div style={cs.stat}>
                    <span style={cs.statLabel}>📅 Submitted</span>
                    <span style={cs.statValue}>{new Date(proposal.createdAt).toLocaleDateString()}</span>
                </div>
                {freelancer.hourlyRate && (
                    <div style={cs.stat}>
                        <span style={cs.statLabel}>💼 Hourly Rate</span>
                        <span style={cs.statValue}>${freelancer.hourlyRate}/hr</span>
                    </div>
                )}
            </div>

            {/* Proposal Text */}
            <div style={cs.proposalText}>
                <span style={cs.proposalLabel}>Cover Letter</span>
                <p style={cs.proposalBody}>{proposal.proposalText}</p>
            </div>

            {/* Actions */}
            {isPending && (
                <div style={cs.actionsRow}>
                    <button
                        style={{ ...cs.rejectBtn, opacity: actionLoading ? 0.6 : 1 }}
                        onClick={() => handleAction('rejected')}
                        disabled={!!actionLoading}
                    >
                        {actionLoading === 'rejected' ? 'Rejecting…' : '✕ Reject'}
                    </button>
                    <button
                        style={{ ...cs.acceptBtn, opacity: actionLoading ? 0.6 : 1 }}
                        onClick={() => handleAction('accepted')}
                        disabled={!!actionLoading}
                    >
                        {actionLoading === 'accepted' ? 'Accepting…' : '✓ Accept'}
                    </button>
                </div>
            )}

            {(proposal.status === 'accepted' || proposal.status === 'order-created') && (
                <div style={cs.actionsRow}>
                    {proposal.status === 'order-created' ? (
                        <div style={cs.orderCreatedBadge}>
                            ✅ Order Created
                            <span style={{ fontWeight: 400, opacity: 0.75, fontSize: '12px' }}>&nbsp;</span>
                        </div>
                    ) : (
                        <button style={cs.createOrderBtn} onClick={() => setShowOrderModal(true)}>
                            🚀 Create Order
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

/* ─── Job Section — receives proposals directly ───── */
const JobSection = ({ job, proposals: initialProposals, clientId }) => {
    const [proposals, setProposals] = useState(initialProposals || []);
    const [expanded, setExpanded] = useState(true);

    // Sync when parent refreshes and passes new proposals
    useEffect(() => { setProposals(initialProposals || []); }, [initialProposals]);

    const handleStatusChange = (proposalId, newStatus) => {
        setProposals((prev) =>
            prev.map((p) => p._id === proposalId ? { ...p, status: newStatus } : p)
        );
    };

    const pendingCount = proposals.filter((p) => p.status === 'pending').length;
    const acceptedCount = proposals.filter((p) => p.status === 'accepted').length;

    return (
        <div style={js.wrapper}>
            {/* Job Header */}
            <div style={js.header} onClick={() => setExpanded((e) => !e)}>
                <div style={{ flex: 1 }}>
                    <div style={js.jobTitle}>{job.title}</div>
                    <div style={js.jobMeta}>
                        <span style={js.metaChip}>{job.category}</span>
                        <span style={js.metaChip}>💰 {job.budget || 'N/A'}</span>
                        {pendingCount > 0 && <span style={{ ...js.metaChip, background: '#fff8e1', color: '#f59e0b' }}>{pendingCount} pending</span>}
                        {acceptedCount > 0 && <span style={{ ...js.metaChip, background: '#ecfdf5', color: '#10b981' }}>{acceptedCount} accepted</span>}
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={js.count}>{proposals.length} proposal{proposals.length !== 1 ? 's' : ''}</span>
                    <span style={js.chevron}>{expanded ? '▲' : '▼'}</span>
                </div>
            </div>

            {/* Proposals */}
            {expanded && (
                <div style={js.body}>
                    {proposals.length === 0 ? (
                        <div style={js.empty}>
                            <span style={{ fontSize: '32px' }}>📭</span>
                            <p style={{ margin: '8px 0 0', color: '#9ca3af' }}>No proposals yet for this project.</p>
                        </div>
                    ) : (
                        proposals.map((proposal) => (
                            <ProposalCard
                                key={proposal._id}
                                proposal={proposal}
                                job={job}
                                clientId={clientId}
                                onStatusChange={handleStatusChange}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

/* ─── Main Component ──────────────────────────────── */
const ClientProposals = ({ client }) => {
    const [jobGroups, setJobGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchAll = useCallback(async () => {
        if (!client?._id) return;
        setLoading(true);
        setError(null);
        try {
            // Single query — all proposals for this client, always fresh from DB
            const res = await proposalAPI.getProposalsByClient(client._id);
            const allProposals = res.data || [];

            if (allProposals.length === 0) {
                setJobGroups([]);
                setLoading(false);
                return;
            }

            // Group proposals by their projectId
            const byJob = {};
            allProposals.forEach((p) => {
                const jobId = (p.projectId?._id || p.projectId)?.toString();
                if (!jobId) return;
                if (!byJob[jobId]) byJob[jobId] = { jobId, proposals: [] };
                byJob[jobId].proposals.push(p);
            });

            // Fetch full job details for each unique job
            const groups = await Promise.all(
                Object.values(byJob).map(async ({ jobId, proposals }) => {
                    try {
                        const jobRes = await jobAPI.getJob(jobId);
                        return { job: jobRes.data, proposals };
                    } catch {
                        return null;
                    }
                })
            );

            setJobGroups(groups.filter(Boolean));
        } catch (err) {
            setError('Failed to load proposals. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [client?._id]);

    useEffect(() => { fetchAll(); }, [fetchAll, refreshKey]);

    const handleRefresh = () => setRefreshKey((k) => k + 1);

    /* ── Loading ── */
    if (loading) {
        return (
            <div style={root.center}>
                <div style={root.spinner} />
                <p style={{ color: '#9ca3af', marginTop: '16px' }}>Loading proposals…</p>
            </div>
        );
    }

    /* ── Error ── */
    if (error) {
        return (
            <div style={root.center}>
                <span style={{ fontSize: '40px' }}>⚠️</span>
                <p style={{ color: '#ef4444', marginTop: '12px' }}>{error}</p>
                <button style={root.retryBtn} onClick={handleRefresh}>Retry</button>
            </div>
        );
    }

    /* ── Empty ── */
    if (jobGroups.length === 0) {
        return (
            <div style={root.center}>
                <span style={{ fontSize: '56px' }}>📭</span>
                <h3 style={{ color: '#374151', margin: '12px 0 6px', fontSize: '20px' }}>No proposals yet</h3>
                <p style={{ color: '#9ca3af', margin: '0 0 16px' }}>Freelancers haven't applied to your projects yet.</p>
                <button style={root.retryBtn} onClick={handleRefresh}>↻ Refresh</button>
            </div>
        );
    }

    /* ── Main View ── */
    return (
        <div style={root.page}>
            {/* Page Header */}
            <div style={root.pageHeader}>
                <div>
                    <h2 style={root.pageTitle}>📨 Incoming Proposals</h2>
                    <p style={root.pageSub}>Review proposals, accept or reject, and create orders.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button style={root.refreshBtn} onClick={handleRefresh}>↻ Refresh</button>
                    <div style={root.jobCount}>{jobGroups.length} project{jobGroups.length !== 1 ? 's' : ''}</div>
                </div>
            </div>

            {/* One section per job-group */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {jobGroups.map(({ job, proposals }) => (
                    <JobSection
                        key={job._id}
                        job={job}
                        proposals={proposals}
                        clientId={client._id}
                    />
                ))}
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────────
   Styles
───────────────────────────────────────────────────── */

/* Card styles */
const cs = {
    card: {
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '14px',
        padding: '20px',
        position: 'relative',
        marginBottom: '12px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        transition: 'box-shadow 0.2s',
    },
    toast: {
        position: 'absolute', top: '12px', right: '60px',
        color: '#fff', borderRadius: '8px', padding: '6px 14px',
        fontSize: '13px', fontWeight: '600', zIndex: 10,
    },
    freelancerRow: {
        display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px',
    },
    avatar: {
        width: '52px', height: '52px', borderRadius: '50%',
        objectFit: 'cover', border: '2px solid #e5e7eb',
        flexShrink: 0,
    },
    freelancerName: {
        fontWeight: '700', fontSize: '16px', color: '#111827', marginBottom: '5px',
    },
    freelancerNameLink: {
        cursor: 'pointer',
        color: '#6c63ff',
        fontWeight: '700',
        fontSize: '16px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        transition: 'color 0.15s',
        textDecoration: 'none',
    },
    viewProfileArrow: {
        fontSize: '14px',
        opacity: 0.7,
        fontWeight: '400',
    },
    viewProfileBtn: {
        padding: '4px 12px',
        border: '1.5px solid #6c63ff',
        borderRadius: '20px',
        background: 'transparent',
        color: '#6c63ff',
        fontSize: '11px',
        fontWeight: '600',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all 0.15s',
    },
    skillsRow: { display: 'flex', flexWrap: 'wrap', gap: '5px' },
    skillTag: {
        background: '#f0f4ff', color: '#6c63ff', borderRadius: '20px',
        padding: '2px 10px', fontSize: '11px', fontWeight: '500',
    },
    skillMore: { color: '#9ca3af', fontSize: '11px', padding: '2px 4px' },
    statsRow: {
        display: 'flex', gap: '20px', flexWrap: 'wrap',
        padding: '14px 0', borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6',
        marginBottom: '14px',
    },
    stat: { display: 'flex', flexDirection: 'column', gap: '2px' },
    statLabel: { fontSize: '11px', color: '#9ca3af', fontWeight: '500' },
    statValue: { fontSize: '15px', fontWeight: '700', color: '#111827' },
    proposalLabel: { fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' },
    proposalText: { marginBottom: '16px' },
    proposalBody: {
        margin: '6px 0 0', fontSize: '14px', color: '#374151', lineHeight: '1.7',
        background: '#f9fafb', borderRadius: '8px', padding: '12px',
        whiteSpace: 'pre-wrap',
    },
    actionsRow: { display: 'flex', gap: '10px', justifyContent: 'flex-end' },
    rejectBtn: {
        padding: '8px 20px', borderRadius: '8px', border: '1.5px solid #fca5a5',
        background: '#fff', color: '#ef4444', fontWeight: '600', fontSize: '13px', cursor: 'pointer',
        transition: 'all 0.15s',
    },
    acceptBtn: {
        padding: '8px 20px', borderRadius: '8px', border: 'none',
        background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff',
        fontWeight: '600', fontSize: '13px', cursor: 'pointer',
        boxShadow: '0 3px 10px rgba(16,185,129,0.3)', transition: 'all 0.15s',
    },
    createOrderBtn: {
        padding: '9px 24px', borderRadius: '8px', border: 'none',
        background: 'linear-gradient(135deg, #6c63ff, #48b8d0)', color: '#fff',
        fontWeight: '700', fontSize: '14px', cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(108,99,255,0.35)', transition: 'all 0.15s',
    },
    orderCreatedBadge: {
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '9px 18px', borderRadius: '8px',
        background: '#ecfdf5', border: '1.5px solid #a7f3d0',
        color: '#059669', fontWeight: '700', fontSize: '14px',
    },
};

/* Job section styles */
const js = {
    wrapper: {
        background: '#fff', borderRadius: '16px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        overflow: 'hidden',
    },
    header: {
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '18px 22px', cursor: 'pointer',
        background: 'linear-gradient(135deg, #f8f9ff, #f0f4ff)',
        borderBottom: '1px solid #e5e7eb',
        userSelect: 'none',
    },
    jobTitle: { fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '6px' },
    jobMeta: { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' },
    metaChip: {
        background: '#f3f4f6', color: '#6b7280', borderRadius: '20px',
        padding: '2px 10px', fontSize: '12px', fontWeight: '500',
    },
    count: { fontSize: '13px', color: '#6b7280', fontWeight: '500', whiteSpace: 'nowrap' },
    chevron: { fontSize: '12px', color: '#9ca3af' },
    body: { padding: '18px 22px' },
    empty: {
        textAlign: 'center', padding: '30px 0',
        color: '#9ca3af', fontSize: '14px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
    },
};

/* Root/page styles */
const root = {
    page: { padding: '6px 0' },
    pageHeader: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: '28px', flexWrap: 'wrap', gap: '12px',
    },
    pageTitle: { margin: 0, fontSize: '24px', fontWeight: '800', color: '#111827' },
    pageSub: { margin: '6px 0 0', fontSize: '14px', color: '#6b7280' },
    jobCount: {
        background: 'linear-gradient(135deg, #6c63ff, #48b8d0)',
        color: '#fff', borderRadius: '30px', padding: '6px 18px',
        fontWeight: '700', fontSize: '13px',
        boxShadow: '0 3px 10px rgba(108,99,255,0.3)',
        alignSelf: 'flex-start',
    },
    center: {
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '360px', gap: '10px',
        textAlign: 'center',
    },
    spinner: {
        width: '38px', height: '38px', borderRadius: '50%',
        border: '4px solid #e5e7eb', borderTopColor: '#6c63ff',
        animation: 'spin 0.8s linear infinite',
    },
    retryBtn: {
        marginTop: '10px', padding: '8px 20px', borderRadius: '8px',
        border: 'none', background: '#6c63ff', color: '#fff',
        fontWeight: '600', cursor: 'pointer',
    },
    refreshBtn: {
        padding: '7px 16px', borderRadius: '8px',
        border: '1.5px solid #6c63ff', background: 'transparent', color: '#6c63ff',
        fontWeight: '600', fontSize: '13px', cursor: 'pointer',
        transition: 'all 0.15s',
    },
};

/* Modal styles */
const ms = {
    backdrop: {
        position: 'fixed', inset: 0, background: 'rgba(10,10,30,0.55)',
        backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 9999, padding: '20px',
    },
    modal: {
        background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '520px',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
    },
    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: '22px 26px 14px', borderBottom: '1px solid #f3f4f6',
    },
    title: { margin: 0, fontSize: '19px', fontWeight: '700', color: '#111827' },
    sub: { margin: '4px 0 0', fontSize: '13px', color: '#6b7280' },
    closeBtn: {
        background: 'none', border: 'none', fontSize: '18px',
        cursor: 'pointer', color: '#9ca3af', padding: '2px 6px', borderRadius: '6px',
    },
    form: { padding: '18px 26px 26px', display: 'flex', flexDirection: 'column', gap: '16px' },
    field: { display: 'flex', flexDirection: 'column', gap: '5px' },
    label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
    req: { color: '#ef4444' },
    input: {
        padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: '10px',
        fontSize: '14px', outline: 'none', background: '#fafafe',
        color: '#111827', boxSizing: 'border-box', width: '100%',
    },
    textarea: {
        padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: '10px',
        fontSize: '14px', outline: 'none', background: '#fafafe', color: '#111827',
        resize: 'vertical', lineHeight: '1.6', fontFamily: 'inherit',
        boxSizing: 'border-box', width: '100%',
    },
    errBox: {
        background: '#fff0f0', border: '1px solid #fca5a5',
        borderRadius: '8px', padding: '10px 14px', color: '#dc2626', fontSize: '13px',
    },
    actions: { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' },
    cancelBtn: {
        padding: '10px 22px', border: '1.5px solid #e5e7eb', borderRadius: '10px',
        background: '#fff', color: '#374151', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
    },
    submitBtn: {
        padding: '10px 26px', border: 'none', borderRadius: '10px',
        background: 'linear-gradient(135deg, #6c63ff, #48b8d0)', color: '#fff',
        fontSize: '14px', fontWeight: '700', cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(108,99,255,0.35)',
    },
};

export default ClientProposals;
