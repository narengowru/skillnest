import React, { useState, useEffect, useCallback } from 'react';
import { invitationAPI, orderAPI } from '../api/api';

/* ─── Status colours ─────────────────────────────────────────────────────── */
const STATUS_META = {
    pending: { bg: '#fff8e1', color: '#f59e0b', border: '#fde68a', label: 'Pending' },
    accepted: { bg: '#ecfdf5', color: '#10b981', border: '#a7f3d0', label: 'Accepted' },
    declined: { bg: '#fef2f2', color: '#ef4444', border: '#fecaca', label: 'Declined' },
    expired: { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb', label: 'Expired' },
};

const StatusBadge = ({ status }) => {
    const meta = STATUS_META[status] || STATUS_META.pending;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '3px 11px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
            background: meta.bg, color: meta.color, border: `1.5px solid ${meta.border}`,
        }}>
            {meta.label}
        </span>
    );
};

/* ─── Single invitation card ─────────────────────────────────────────────── */
const InvitationCard = ({ invitation, onStatusChange }) => {
    const [loading, setLoading] = useState(null); // 'accepted' | 'declined'
    const [toast, setToast] = useState(null);

    const client = invitation.clientId || {};

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleAction = async (newStatus) => {
        setLoading(newStatus);
        try {
            await invitationAPI.updateStatus(invitation._id, newStatus);

            if (newStatus === 'accepted') {
                // Create an order automatically when freelancer accepts
                await orderAPI.createOrder({
                    // No jobId — this is invitation-based
                    clientId: invitation.clientId?._id || invitation.clientId,
                    freelancerId: invitation.freelancerId?._id || invitation.freelancerId,
                    whoPlaced: 'freelancer',
                    title: invitation.projectTitle,
                    description: invitation.description,
                    category: 'Others',
                    amount: invitation.budgetAmount,
                    totalAmount: invitation.budgetAmount,
                    status: 'payment-pending',
                    dueDate: invitation.deadline,
                    deliverables: [],
                });
                showToast('Invitation accepted! Order created 🎉', 'success');
            } else {
                showToast('Invitation declined.', 'error');
            }

            onStatusChange(invitation._id, newStatus);
        } catch (err) {
            showToast(err.response?.data?.message || 'Action failed.', 'error');
        } finally {
            setLoading(null);
        }
    };

    const fmt = (iso) => iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

    return (
        <div style={{
            background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: '22px 24px',
            display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative',
        }}>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                    background: toast.type === 'success' ? '#10b981' : '#ef4444',
                    color: '#fff', borderRadius: '20px', padding: '6px 18px',
                    fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 10,
                }}>
                    {toast.msg}
                </div>
            )}

            {/* Top row — client + status */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                        src={client.profilePicture || 'https://i.ibb.co/N6GPXKSt/blank.jpg'}
                        alt={client.companyName || 'Client'}
                        onError={(e) => { e.target.src = 'https://i.ibb.co/N6GPXKSt/blank.jpg'; }}
                        style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #f0f0f0' }}
                    />
                    <div>
                        <div style={{ fontWeight: '700', fontSize: '15px', color: '#111827' }}>
                            {client.companyName || 'Client'}
                        </div>
                        {client.location && (
                            <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                                📍 {typeof client.location === 'object'
                                    ? [client.location.city, client.location.country].filter(Boolean).join(', ')
                                    : client.location}
                            </div>
                        )}
                    </div>
                </div>
                <StatusBadge status={invitation.status} />
            </div>

            {/* Project Title */}
            <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                    Project
                </div>
                <div style={{ fontSize: '17px', fontWeight: '800', color: '#111827' }}>
                    {invitation.projectTitle}
                </div>
            </div>

            {/* Description */}
            <div style={{
                background: '#f9fafb', borderRadius: '10px', padding: '12px 14px',
                fontSize: '14px', color: '#374151', lineHeight: '1.7', whiteSpace: 'pre-wrap',
            }}>
                {invitation.description}
            </div>

            {/* Stats row */}
            <div style={{
                display: 'flex', gap: '20px', flexWrap: 'wrap',
                padding: '14px 0', borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6',
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase' }}>💰 Budget</span>
                    <span style={{ fontSize: '16px', fontWeight: '800', color: '#111827' }}>
                        ${invitation.budgetAmount?.toLocaleString()}
                        <span style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', marginLeft: '4px' }}>
                            ({invitation.budgetType === 'hourly' ? '/hr' : 'fixed'})
                        </span>
                    </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase' }}>📅 Deadline</span>
                    <span style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>{fmt(invitation.deadline)}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase' }}>🕐 Received</span>
                    <span style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>{fmt(invitation.createdAt)}</span>
                </div>
            </div>

            {/* Optional personal message */}
            {invitation.message && (
                <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                        Personal Message
                    </div>
                    <div style={{
                        background: '#eff6ff', borderLeft: '3px solid #6c63ff',
                        borderRadius: '0 8px 8px 0', padding: '10px 14px',
                        fontSize: '14px', color: '#374151', fontStyle: 'italic', lineHeight: '1.6',
                    }}>
                        "{invitation.message}"
                    </div>
                </div>
            )}

            {/* Action buttons — only for pending */}
            {invitation.status === 'pending' && (
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={() => handleAction('declined')}
                        disabled={!!loading}
                        style={{
                            padding: '9px 22px', borderRadius: '10px', border: '1.5px solid #fca5a5',
                            background: '#fff', color: '#ef4444', fontWeight: '700', fontSize: '13px',
                            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
                            transition: 'all 0.15s',
                        }}
                    >
                        {loading === 'declined' ? 'Declining…' : '✕ Decline'}
                    </button>
                    <button
                        onClick={() => handleAction('accepted')}
                        disabled={!!loading}
                        style={{
                            padding: '9px 22px', borderRadius: '10px', border: 'none',
                            background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff',
                            fontWeight: '700', fontSize: '13px',
                            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
                            boxShadow: '0 3px 10px rgba(16,185,129,0.3)', transition: 'all 0.15s',
                        }}
                    >
                        {loading === 'accepted' ? 'Accepting…' : '✓ Accept'}
                    </button>
                </div>
            )}
        </div>
    );
};

/* ─── Tab filter ─────────────────────────────────────────────────────────── */
const TABS = ['all', 'pending', 'accepted', 'declined'];

/* ─── Main component ─────────────────────────────────────────────────────── */
const FreelancerInvitations = ({ freelancer }) => {
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('all');

    const fetchInvitations = useCallback(async () => {
        if (!freelancer?._id) return;
        setLoading(true);
        setError(null);
        try {
            const res = await invitationAPI.getByFreelancer(freelancer._id);
            setInvitations(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load invitations.');
        } finally {
            setLoading(false);
        }
    }, [freelancer?._id]);

    useEffect(() => { fetchInvitations(); }, [fetchInvitations]);

    const handleStatusChange = (id, newStatus) => {
        setInvitations((prev) =>
            prev.map((inv) => inv._id === id ? { ...inv, status: newStatus } : inv)
        );
    };

    const filtered = activeTab === 'all'
        ? invitations
        : invitations.filter((inv) => inv.status === activeTab);

    const countFor = (tab) => tab === 'all'
        ? invitations.length
        : invitations.filter((i) => i.status === tab).length;

    /* ── Loading ── */
    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '16px' }}>
            <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                border: '4px solid #e5e7eb', borderTopColor: '#6c63ff',
                animation: 'spin 0.8s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>Loading invitations…</p>
        </div>
    );

    /* ── Error ── */
    if (error) return (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#ef4444' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
            <p style={{ margin: 0 }}>{error}</p>
            <button onClick={fetchInvitations} style={{
                marginTop: '16px', padding: '8px 22px', borderRadius: '8px', border: 'none',
                background: '#6c63ff', color: '#fff', fontWeight: '600', cursor: 'pointer',
            }}>
                Retry
            </button>
        </div>
    );

    /* ── Main ── */
    return (
        <div style={{ padding: '6px 0' }}>

            {/* Page header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#111827' }}>
                        Invitations
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
                        Project invitations sent to you by clients
                    </p>
                </div>
                <div style={{
                    background: 'linear-gradient(135deg,#6c63ff,#48b8d0)',
                    color: '#fff', borderRadius: '30px', padding: '6px 18px',
                    fontWeight: '700', fontSize: '13px',
                    boxShadow: '0 3px 10px rgba(108,99,255,0.3)',
                }}>
                    {invitations.length} Total
                </div>
            </div>

            {/* Tab filters */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {TABS.map((tab) => {
                    const active = activeTab === tab;
                    const meta = STATUS_META[tab];
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '7px 16px', borderRadius: '20px', border: 'none',
                                background: active
                                    ? (meta ? meta.bg : 'linear-gradient(135deg,#6c63ff,#48b8d0)')
                                    : '#f3f4f6',
                                color: active ? (meta ? meta.color : '#fff') : '#6b7280',
                                fontWeight: active ? '700' : '600', fontSize: '13px', cursor: 'pointer',
                                boxShadow: active && !meta ? '0 3px 10px rgba(108,99,255,0.25)' : 'none',
                                transition: 'all 0.15s',
                                textTransform: 'capitalize',
                            }}
                        >
                            {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}&nbsp;
                            <span style={{
                                background: active ? 'rgba(0,0,0,0.12)' : '#e5e7eb',
                                borderRadius: '20px', padding: '1px 7px', fontSize: '11px', fontWeight: '700',
                                color: active ? 'inherit' : '#6b7280',
                            }}>
                                {countFor(tab)}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Empty state */}
            {filtered.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '60px 20px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px',
                    border: '2px dashed #e5e7eb', borderRadius: '16px',
                }}>
                    <span style={{ fontSize: '52px' }}>📭</span>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#374151' }}>
                        {activeTab === 'all' ? 'No invitations yet' : `No ${activeTab} invitations`}
                    </h3>
                    <p style={{ margin: 0, fontSize: '14px', color: '#9ca3af', maxWidth: '300px' }}>
                        {activeTab === 'all'
                            ? 'Clients will send you project invitations when they want to work with you. Keep your profile updated!'
                            : `You have no ${activeTab} invitations at the moment.`}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {filtered.map((inv) => (
                        <InvitationCard
                            key={inv._id}
                            invitation={inv}
                            onStatusChange={handleStatusChange}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default FreelancerInvitations;
