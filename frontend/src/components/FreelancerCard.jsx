import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { invitationAPI, clientAPI } from '../api/api';

/* ─── Scoped styles ─────────────────────────────────────────────────────────── */
const styles = `
  .fc-card {
    position: relative;
    background: #ffffff;
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(0, 0, 0, 0.06);
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    display: flex;
    flex-direction: column;
    gap: 14px;
    overflow: hidden;
    text-align: left;
  }
  .fc-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.10), 0 2px 6px rgba(0, 0, 0, 0.06);
  }
  .fc-card:focus-visible {
    outline: 2px solid #4f6ef7;
    outline-offset: 2px;
  }

  .fc-badge {
    position: absolute;
    top: 14px;
    right: 14px;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.3px;
    color: #fff;
  }
  .fc-badge--high   { background: linear-gradient(135deg, #22c55e, #16a34a); }
  .fc-badge--mid    { background: linear-gradient(135deg, #f59e0b, #d97706); }
  .fc-badge--normal { background: linear-gradient(135deg, #4f6ef7, #3b56e0); }

  .fc-header { display: flex; align-items: center; gap: 12px; }
  .fc-avatar-wrap {
    flex-shrink: 0; width: 52px; height: 52px;
    border-radius: 50%; overflow: hidden; border: 2px solid #f0f0f0;
  }
  .fc-avatar-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .fc-identity { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .fc-name {
    font-size: 15px; font-weight: 700; color: #111827;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0;
  }
  .fc-role {
    font-size: 12px; color: #6b7280;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  .fc-divider { height: 1px; background: #f3f4f6; margin: 0; }

  .fc-stats { display: flex; justify-content: space-between; align-items: center; }
  .fc-price { font-size: 17px; font-weight: 800; color: #111827; letter-spacing: -0.4px; }
  .fc-price span { font-size: 11px; font-weight: 500; color: #9ca3af; letter-spacing: 0; margin-left: 2px; }
  .fc-stars { display: flex; gap: 2px; }
  .fc-star { font-size: 13px; color: #d1d5db; line-height: 1; transition: color 0.1s; }
  .fc-star--active { color: #f59e0b; }

  .fc-actions { display: flex; gap: 8px; margin-top: 2px; }
  .fc-btn-secondary {
    flex: 1; padding: 9px 0; border-radius: 10px;
    border: 1.5px solid #e5e7eb; background: transparent;
    color: #374151; font-size: 13px; font-weight: 600; cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }
  .fc-btn-secondary:hover { background: #f9fafb; border-color: #d1d5db; }
  .fc-btn-primary {
    flex: 1.4; padding: 9px 0; border-radius: 10px; border: none;
    background: linear-gradient(135deg, #4f6ef7 0%, #3b56e0 100%);
    color: #fff; font-size: 13px; font-weight: 700; cursor: pointer;
    letter-spacing: 0.3px; transition: opacity 0.15s, transform 0.15s;
    box-shadow: 0 2px 8px rgba(79,110,247,0.30);
  }
  .fc-btn-primary:hover { opacity: 0.92; transform: translateY(-1px); }
`;

/* ─── Modal overlay styles (inline — no extra CSS file needed) ──────────────── */
const m = {
  backdrop: {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
  },
  box: {
    background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '540px',
    boxShadow: '0 25px 60px rgba(0,0,0,0.25)', overflow: 'hidden',
  },
  header: {
    padding: '22px 28px', borderBottom: '1px solid #f0f0f0',
    background: 'linear-gradient(135deg,#6c63ff 0%,#48b8d0 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  title: { margin: 0, color: '#fff', fontSize: '18px', fontWeight: '800' },
  sub: { margin: '4px 0 0', color: 'rgba(255,255,255,0.8)', fontSize: '13px' },
  closeBtn: {
    background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
    width: '34px', height: '34px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: '18px', lineHeight: 1,
  },
  body: { padding: '28px', maxHeight: '70vh', overflowY: 'auto' },
  form: { display: 'flex', flexDirection: 'column', gap: '18px' },
  label: {
    display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151',
    marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px',
  },
  input: {
    width: '100%', padding: '10px 14px', borderRadius: '10px',
    border: '1.5px solid #e5e7eb', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  },
  textarea: {
    width: '100%', padding: '10px 14px', borderRadius: '10px',
    border: '1.5px solid #e5e7eb', fontSize: '14px', resize: 'vertical',
    outline: 'none', boxSizing: 'border-box',
  },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
  errBox: {
    background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
    borderRadius: '10px', padding: '10px 14px', fontSize: '13px',
  },
  actions: { display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '4px' },
  cancelBtn: {
    padding: '10px 22px', borderRadius: '10px', border: '1.5px solid #e5e7eb',
    background: '#fff', color: '#374151', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
  },
  submitBtn: (submitting) => ({
    padding: '10px 28px', borderRadius: '10px', border: 'none',
    background: submitting ? '#c4b5fd' : 'linear-gradient(135deg,#6c63ff,#48b8d0)',
    color: '#fff', fontWeight: '700', fontSize: '14px',
    cursor: submitting ? 'not-allowed' : 'pointer',
    boxShadow: '0 4px 14px rgba(108,99,255,0.35)',
  }),
  successWrap: {
    textAlign: 'center', padding: '30px 0',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px',
  },
};

/* ─── FreelancerCard ────────────────────────────────────────────────────────── */
export default function FreelancerCard({
  id, name, role, rating, price, profileImage, matchScore,
}) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ projectTitle: '', description: '', budgetType: 'fixed', budgetAmount: '', deadline: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  /* ── helpers ── */
  const renderStars = (r) => {
    const n = Math.min(Math.max(0, Number(r) || 0), 5);
    return [...Array(5)].map((_, i) => (
      <span key={i} className={`fc-star${i < n ? ' fc-star--active' : ''}`}>★</span>
    ));
  };

  const displayPrice = () => {
    if (price === undefined || price === null || isNaN(price)) return '$0';
    return `$${Number(price).toLocaleString()}`;
  };

  const goToProfile = () => { window.location.href = `/view-profile/${id}`; };

  const getClientIdByEmail = async (email) => {
    const res = await clientAPI.getAllClients();
    const match = res.data.find((c) => c.email === email);
    return match ? match._id : null;
  };

  /* ── open modal ── */
  const handleBookNow = (e) => {
    e.stopPropagation();
    const raw = localStorage.getItem('user');
    if (!raw) { window.location.href = '/login'; return; }
    const user = JSON.parse(raw);
    if (!user?.isLoggedIn) { window.location.href = '/login'; return; }
    setError(null); setSent(false);
    setForm({ projectTitle: '', description: '', budgetType: 'fixed', budgetAmount: '', deadline: '', message: '' });
    setShowModal(true);
  };

  /* ── form handlers ── */
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const raw = localStorage.getItem('user');
      const user = raw ? JSON.parse(raw) : null;
      if (!user?.email) throw new Error('Please log in to send an invitation.');

      const clientId = await getClientIdByEmail(user.email);
      if (!clientId) throw new Error('Client account not found. Please log in again.');

      await invitationAPI.sendInvitation({
        clientId,
        freelancerId: id,
        projectTitle: form.projectTitle,
        description: form.description,
        budgetType: form.budgetType,
        budgetAmount: Number(form.budgetAmount),
        deadline: new Date(form.deadline).toISOString(),
        message: form.message,
      });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send invitation.');
    } finally {
      setSubmitting(false);
    }
  };

  const badgeClass =
    matchScore >= 70 ? 'fc-badge fc-badge--high'
      : matchScore >= 50 ? 'fc-badge fc-badge--mid'
        : 'fc-badge fc-badge--normal';

  /* ── render ── */
  return (
    <>
      <style>{styles}</style>

      {/* ── Send Invitation Modal ── */}
      {showModal && (
        <div
          style={m.backdrop}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div style={m.box}>
            {/* Header */}
            <div style={m.header}>
              <div>
                <h3 style={m.title}>Send Invitation</h3>
                <p style={m.sub}>to <strong>{name}</strong></p>
              </div>
              <button style={m.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>

            {/* Body */}
            <div style={m.body}>
              {sent ? (
                <div style={m.successWrap}>
                  <div style={{ fontSize: '56px' }}>🎉</div>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#111827' }}>
                    Invitation Sent!
                  </h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', maxWidth: '320px', lineHeight: '1.6' }}>
                    Your invitation has been sent to <strong>{name}</strong>. They'll be notified and can accept or decline.
                  </p>
                  <button
                    onClick={() => setShowModal(false)}
                    style={{ ...m.submitBtn(false), marginTop: '8px' }}
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={m.form}>

                  {/* Project Title */}
                  <div>
                    <label style={m.label}>Project Title <span style={{ color: '#ef4444' }}>*</span></label>
                    <input name="projectTitle" value={form.projectTitle} onChange={handleChange}
                      required placeholder="e.g. E-commerce Website Redesign" style={m.input} />
                  </div>

                  {/* Description */}
                  <div>
                    <label style={m.label}>Project Description <span style={{ color: '#ef4444' }}>*</span></label>
                    <textarea name="description" value={form.description} onChange={handleChange}
                      required rows={4} style={m.textarea}
                      placeholder="Describe what you need done, deliverables, and requirements…" />
                  </div>

                  {/* Budget Type + Amount */}
                  <div style={m.grid2}>
                    <div>
                      <label style={m.label}>Budget Type <span style={{ color: '#ef4444' }}>*</span></label>
                      <select name="budgetType" value={form.budgetType} onChange={handleChange}
                        required style={{ ...m.input, background: '#fff' }}>
                        <option value="fixed">Fixed Price</option>
                        <option value="hourly">Hourly Rate</option>
                      </select>
                    </div>
                    <div>
                      <label style={m.label}>Budget Amount ($) <span style={{ color: '#ef4444' }}>*</span></label>
                      <input type="number" name="budgetAmount" value={form.budgetAmount}
                        onChange={handleChange} required min="1" placeholder="e.g. 500" style={m.input} />
                    </div>
                  </div>

                  {/* Deadline */}
                  <div>
                    <label style={m.label}>Deadline <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="date" name="deadline" value={form.deadline} onChange={handleChange}
                      required min={new Date().toISOString().split('T')[0]} style={m.input} />
                  </div>

                  {/* Optional Message */}
                  <div>
                    <label style={m.label}>
                      Personal Message&nbsp;
                      <span style={{ color: '#9ca3af', fontWeight: '400', textTransform: 'none' }}>(optional)</span>
                    </label>
                    <textarea name="message" value={form.message} onChange={handleChange}
                      rows={3} style={m.textarea} placeholder="Add a personal note…" />
                  </div>

                  {/* Error */}
                  {error && <div style={m.errBox}>⚠️ {error}</div>}

                  {/* Actions */}
                  <div style={m.actions}>
                    <button type="button" onClick={() => setShowModal(false)}
                      disabled={submitting} style={m.cancelBtn}>
                      Cancel
                    </button>
                    <button type="submit" disabled={submitting} style={m.submitBtn(submitting)}>
                      {submitting ? 'Sending…' : '✉️ Send Invitation'}
                    </button>
                  </div>

                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Card ── */}
      <div
        className="fc-card"
        onClick={goToProfile}
        onKeyDown={(e) => e.key === 'Enter' && goToProfile()}
        role="button"
        tabIndex={0}
      >
        {matchScore !== undefined && matchScore !== null && (
          <div className={badgeClass}>{matchScore}% Match</div>
        )}

        <div className="fc-header">
          <div className="fc-avatar-wrap">
            <img
              src={profileImage}
              alt={`${name}'s profile`}
              onError={(e) => { e.target.src = 'https://i.ibb.co/N6GPXKSt/blank.jpg'; }}
            />
          </div>
          <div className="fc-identity">
            <h3 className="fc-name">{name || 'Freelancer'}</h3>
            <span className="fc-role">{role || 'Professional'}</span>
          </div>
        </div>

        <div className="fc-divider" />

        <div className="fc-stats">
          <div className="fc-price">{displayPrice()}<span>/hr</span></div>
          <div className="fc-stars">{renderStars(rating)}</div>
        </div>

        <div className="fc-actions">
          <button className="fc-btn-secondary" onClick={(e) => { e.stopPropagation(); goToProfile(); }}>
            Profile
          </button>
          <button className="fc-btn-primary" onClick={handleBookNow}>
            Book Now
          </button>
        </div>
      </div>
    </>
  );
}

FreelancerCard.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  role: PropTypes.string,
  rating: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  hours: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  profileImage: PropTypes.string,
  matchScore: PropTypes.number,
  matchReasons: PropTypes.arrayOf(PropTypes.string),
};

FreelancerCard.defaultProps = {
  id: '',
  name: 'Freelancer',
  role: 'Professional',
  rating: 0,
  hours: 0,
  price: 0,
  profileImage: 'https://i.ibb.co/N6GPXKSt/blank.jpg',
};