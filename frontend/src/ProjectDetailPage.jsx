import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './css/ProjectDetailPage.css';
import { jobAPI, proposalAPI, generateProposalAPI } from './api/api';
import { UserContext } from './components/UserContext';

/* ─── Delivery-time options (days) ───────────────── */
const DELIVERY_OPTIONS = [
  { label: '1 day', value: 1 },
  { label: '3 days', value: 3 },
  { label: '7 days', value: 7 },
  { label: '14 days', value: 14 },
  { label: '30 days', value: 30 },
  { label: '45 days', value: 45 },
  { label: '60 days', value: 60 },
  { label: '90 days', value: 90 },
];

/* ─── Proposal Modal ─────────────────────────────── */
const ProposalModal = ({ project, freelancerId, onClose, onSuccess }) => {
  const [form, setForm] = useState({ bidAmount: '', deliveryTime: '', proposalText: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState(null);

  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError(null);
  };

  // Typewriter effect — reveals text char by char for a polished AI feel
  const typewriterEffect = (text, onUpdate, onDone) => {
    let i = 0;
    const interval = setInterval(() => {
      if (i <= text.length) {
        onUpdate(text.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
        onDone();
      }
    }, 12); // ~12ms per char = smooth but fast
    return interval;
  };

  const handleGenerateWithAI = async () => {
    if (!freelancerId) {
      setAiError('You must be logged in as a freelancer to use AI generation.');
      return;
    }
    setAiGenerating(true);
    setAiError(null);
    try {
      const res = await generateProposalAPI.generate(freelancerId, {
        title: project.title,
        description: project.description,
        skills: project.skills,
        budget: project.budget,
        category: project.category,
        experienceLevel: project.experienceLevel,
        projectDuration: project.projectDuration,
      });
      const generated = res.data?.proposal || '';
      // Run typewriter animation into the textarea
      setForm(p => ({ ...p, proposalText: '' }));
      typewriterEffect(
        generated,
        (partial) => setForm(p => ({ ...p, proposalText: partial })),
        () => setAiGenerating(false)
      );
    } catch (err) {
      console.error('AI generation error:', err);
      setAiError('AI generation failed. Please try again or write manually.');
      setAiGenerating(false);
    }
  };

  const validate = () => {
    if (!form.bidAmount || Number(form.bidAmount) < 1)
      return 'Please enter a valid bid amount (at least $1).';
    if (!form.deliveryTime)
      return 'Please select a delivery time.';
    if (!form.proposalText || form.proposalText.trim().length < 20)
      return 'Proposal text must be at least 20 characters.';
    if (form.proposalText.trim().length > 2000)
      return 'Proposal text cannot exceed 2000 characters.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setSubmitting(true);
    setError(null);
    try {
      const res = await proposalAPI.createProposal({
        projectId: project._id,
        freelancerId: freelancerId,
        clientId: project.client?._id,
        bidAmount: Number(form.bidAmount),
        deliveryTime: Number(form.deliveryTime),
        proposalText: form.proposalText.trim(),
      });
      // Also push the proposal ID into Job.proposals[] via the job controller
      const proposalId = res.data?.proposal?._id;
      if (proposalId) {
        try {
          await jobAPI.addProposalToJob(project._id, proposalId);
        } catch (e) {
          console.warn('addProposalToJob fallback failed:', e.message);
        }
      }
      onSuccess();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit proposal. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const charCount = form.proposalText.length;

  return (
    <div style={ms.backdrop} onClick={handleBackdrop}>
      <div style={ms.modal}>
        {/* Header */}
        <div style={ms.header}>
          <div>
            <h2 style={ms.title}>Submit a Proposal</h2>
            <p style={ms.sub}>{project.title}</p>
          </div>
          <button style={ms.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} style={ms.form}>
          {/* Bid Amount */}
          <div style={ms.fieldGroup}>
            <label style={ms.label}>Bid Amount <span style={ms.req}>*</span></label>
            <div style={ms.inputWrapper}>
              <span style={ms.prefix}>$</span>
              <input
                type="number" name="bidAmount" value={form.bidAmount}
                onChange={handleChange} placeholder="e.g. 250" min="1"
                style={{ ...ms.input, paddingLeft: '32px' }}
              />
            </div>
            {project.budget && (
              <span style={ms.hint}>Client's budget: <strong>{project.budget}</strong></span>
            )}
          </div>

          {/* Delivery Time */}
          <div style={ms.fieldGroup}>
            <label style={ms.label}>Delivery Time <span style={ms.req}>*</span></label>
            <select name="deliveryTime" value={form.deliveryTime} onChange={handleChange} style={ms.select}>
              <option value="">— Select delivery time —</option>
              {DELIVERY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Proposal Text */}
          <div style={ms.fieldGroup}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <label style={ms.label}>
                Cover Letter / Proposal <span style={ms.req}>*</span>
              </label>
              <button
                type="button"
                style={aiGenerating ? ms.aiButtonLoading : ms.aiButton}
                onClick={handleGenerateWithAI}
                disabled={aiGenerating || submitting}
              >
                {aiGenerating ? (
                  <>
                    <span style={ms.aiSpinner}>⟳</span>
                    {' Generating…'}
                  </>
                ) : (
                  '✨ Generate with AI'
                )}
              </button>
            </div>
            {aiError && (
              <div style={{ ...ms.errorBox, marginBottom: '4px', fontSize: '12px' }}>
                {aiError}
              </div>
            )}
            <textarea
              name="proposalText" value={form.proposalText} onChange={handleChange}
              placeholder={aiGenerating
                ? 'AI is writing your proposal…'
                : 'Describe your approach, relevant experience, and why you\'re the best fit for this project… or click \u2728 Generate with AI above!'}
              rows={7} style={{
                ...ms.textarea,
                borderColor: aiGenerating ? '#6c63ff' : undefined,
                boxShadow: aiGenerating ? '0 0 0 3px rgba(108,99,255,0.15)' : undefined,
                transition: 'border-color 0.3s, box-shadow 0.3s'
              }} maxLength={2000}
              readOnly={aiGenerating}
            />
            <div style={ms.charCount}>
              <span style={{ color: charCount < 20 ? '#e74c3c' : '#6c63ff' }}>{charCount}</span>
              {' / 2000 characters'}{charCount < 20 && ` (${20 - charCount} more needed)`}
            </div>
          </div>

          {/* Error */}
          {error && <div style={ms.errorBox}>{error}</div>}

          {/* Actions */}
          <div style={ms.actions}>
            <button type="button" style={ms.cancelBtn} onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" style={ms.submitBtn} disabled={submitting}>
              {submitting ? 'Submitting…' : '✉ Submit Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Main Page ──────────────────────────────────── */
const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  const [project, setProject] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal + Toast state
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null); // { msg, type }

  const isFreelancer = user?.userType === 'freelancer';

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        setIsLoading(true);
        const response = await jobAPI.getJob(id);
        setProject(response.data);
        setIsLoaded(true);
      } catch (err) {
        console.error('Error fetching project details:', err);
        setError('Failed to load project details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchProjectDetails();
  }, [id]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  /* Called when the "Apply Now" floating button is clicked */
  const handleApplyClick = () => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      navigate('/login', { state: { redirectTo: `/details/${id}` } });
      return;
    }
    if (!isFreelancer) {
      showToast('Only freelancers can submit proposals.', 'error');
      return;
    }
    setShowModal(true);
  };

  /* Called on successful proposal submission */
  const handleProposalSuccess = () => {
    setShowModal(false);
    showToast('🎉 Proposal submitted successfully! The client will be notified.');
  };

  /* ── Render helpers ── */
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    for (let i = 0; i < fullStars; i++)
      stars.push(<span key={`star-${i}`} className="star full-star">★</span>);
    if (hasHalfStar)
      stars.push(<span key="half-star" className="star half-star">★</span>);
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++)
      stars.push(<span key={`empty-star-${i}`} className="star empty-star">☆</span>);
    return stars;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  /* ── States ── */
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Loading project details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/jobs')}>Back to Jobs</button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="not-found-container">
        <h2>Project Not Found</h2>
        <p>The project you're looking for doesn't exist or has been removed.</p>
        <button onClick={() => navigate('/jobs')}>Browse Other Projects</button>
      </div>
    );
  }

  return (
    <div className={`project-detail-container ${isLoaded ? 'fade-in' : ''}`}>

      {/* ── Proposal Modal ── */}
      {showModal && (
        <ProposalModal
          project={project}
          freelancerId={user?.id}
          onClose={() => setShowModal(false)}
          onSuccess={handleProposalSuccess}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`toast-notification ${toast.type === 'success' ? 'success-toast' : 'error-toast'}`}>
          <div className="toast-icon">{toast.type === 'success' ? '✓' : '✕'}</div>
          <div className="toast-content">
            <h4>{toast.type === 'success' ? 'Proposal Sent!' : 'Error'}</h4>
            <p>{toast.msg}</p>
          </div>
          <button className="toast-close" onClick={() => setToast(null)}>×</button>
        </div>
      )}

      {/* ── Project Card ── */}
      <div className="project-detail-card animate-in">
        <div className="project-image-container">
          <img
            src={project.imageUrl || '/default-project-image.jpg'}
            alt={project.title}
            className="project-image hover-zoom"
          />
        </div>

        <div className="project-info-container">
          <h1 className="project-title">{project.title}</h1>

          <div className="project-meta">
            <div className="meta-item">
              <span className="meta-label"><i className="icon calendar">📅</i> Posted:</span>
              <span className="meta-value">{formatDate(project.datePosted)}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label"><i className="icon money">💰</i> Budget:</span>
              <span className="meta-value">{project.budget}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label"><i className="icon time">⏱️</i> Duration:</span>
              <span className="meta-value">{project.projectDuration}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label"><i className="icon category">🏷️</i> Category:</span>
              <span className="meta-value">{project.category}</span>
            </div>
          </div>

          <div className="project-highlights">
            <div className="highlight-item pulse">
              <div className="highlight-icon">🏆</div>
              <div className="highlight-text">
                <span className="highlight-value">{project.experienceLevel}</span>
                <span className="highlight-label">Experience</span>
              </div>
            </div>
            <div className="highlight-item pulse">
              <div className="highlight-icon">📊</div>
              <div className="highlight-text">
                <span className="highlight-value">{project.status === 'open' ? 'Active' : project.status}</span>
                <span className="highlight-label">Status</span>
              </div>
            </div>
          </div>

          <div className="project-description">
            <h2><i className="icon description">📝</i> Project Description</h2>
            <p>{project.description}</p>
          </div>

          {project.skills && project.skills.length > 0 && (
            <div className="project-skills">
              <h2><i className="icon skills">🔧</i> Skills Required</h2>
              <div className="skills-list">
                {project.skills.map((skill, index) => (
                  <span key={index} className="skill-tag animate-pop" style={{ color: 'white' }}>{skill}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Client Info ── */}
      {project.client && (
        <div className="client-info-card animate-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="section-title"><i className="icon client">👤</i> Client Information</h2>
          <div className="client-profile">
            <div className="client-avatar-container">
              <div className="client-avatar">
                <img
                  src={project.client.avatar || '/default-avatar.jpg'}
                  alt={`${project.client.name} avatar`}
                />
              </div>
              {project.client.verificationBadge && (
                <div className="verification-badge rotate-in" title="Verified Client">✓</div>
              )}
            </div>
            <div className="client-details">
              <h3 className="client-name">{project.client.name}</h3>
              <div className="client-rating animate-sparkle">
                <div className="stars">{renderStars(project.client.rating)}</div>
                <span className="rating-text">
                  {project.client.rating.toFixed(1)}{' '}
                  <span className="reviews-count">({project.client.totalReviews} reviews)</span>
                </span>
              </div>
              <div className="client-meta">
                {project.client.memberSince && (
                  <div className="client-meta-item">
                    <span className="meta-icon">🗓️</span>
                    <span className="meta-label">Member since:</span>
                    <span className="meta-value">{project.client.memberSince}</span>
                  </div>
                )}
                {project.client.location && (
                  <div className="client-meta-item">
                    <span className="meta-icon">📍</span>
                    <span className="meta-label">Location:</span>
                    <span className="meta-value">{project.client.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Apply Button ── */}
      {project.status === 'open' && (
        <div className="apply-float-button">
          <button className="float-btn pulse-button" onClick={handleApplyClick}>
            ✉ Apply Now
          </button>
        </div>
      )}
    </div>
  );
};

/* ─── Modal Styles ───────────────────────────────── */
const ms = {
  backdrop: {
    position: 'fixed', inset: 0, background: 'rgba(10,10,30,0.6)',
    backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 9999, padding: '20px',
  },
  modal: {
    background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '560px',
    maxHeight: '90vh', overflowY: 'auto',
    boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '24px 28px 16px', borderBottom: '1px solid #f0f0f8',
  },
  title: { margin: 0, fontSize: '20px', fontWeight: '700', color: '#1a1a2e' },
  sub: { margin: '4px 0 0', fontSize: '13px', color: '#6c63ff', fontWeight: '500' },
  closeBtn: {
    background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer',
    color: '#999', lineHeight: 1, padding: '2px 6px', borderRadius: '6px',
  },
  form: { padding: '20px 28px 28px', display: 'flex', flexDirection: 'column', gap: '18px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#444', letterSpacing: '0.3px' },
  req: { color: '#e74c3c', marginLeft: '2px' },
  hint: { fontSize: '12px', color: '#888', marginTop: '2px' },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  prefix: {
    position: 'absolute', left: '12px', color: '#888',
    fontSize: '15px', fontWeight: '600', pointerEvents: 'none',
  },
  input: {
    width: '100%', padding: '10px 14px', border: '1.5px solid #e0e0f0',
    borderRadius: '10px', fontSize: '14px', color: '#1a1a2e', outline: 'none',
    background: '#fafafe', boxSizing: 'border-box',
  },
  select: {
    width: '100%', padding: '10px 14px', border: '1.5px solid #e0e0f0',
    borderRadius: '10px', fontSize: '14px', color: '#1a1a2e', outline: 'none',
    background: '#fafafe', cursor: 'pointer',
  },
  textarea: {
    width: '100%', padding: '12px 14px', border: '1.5px solid #e0e0f0',
    borderRadius: '10px', fontSize: '14px', color: '#1a1a2e', outline: 'none',
    resize: 'vertical', lineHeight: '1.6', background: '#fafafe',
    boxSizing: 'border-box', fontFamily: 'inherit',
  },
  charCount: { fontSize: '12px', color: '#999', textAlign: 'right', marginTop: '2px' },
  errorBox: {
    background: '#fff0f0', border: '1px solid #ffc5c5',
    borderRadius: '8px', padding: '10px 14px', color: '#c0392b', fontSize: '13px',
  },
  actions: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '4px' },
  cancelBtn: {
    padding: '10px 22px', border: '1.5px solid #e0e0f0', borderRadius: '10px',
    background: 'white', color: '#555', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
  },
  submitBtn: {
    padding: '10px 26px', border: 'none', borderRadius: '10px',
    background: 'linear-gradient(135deg, #6c63ff, #48b8d0)', color: 'white',
    fontSize: '14px', fontWeight: '700', cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(108,99,255,0.4)',
  },
  aiButton: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '6px 14px', border: 'none', borderRadius: '20px',
    background: 'linear-gradient(135deg, #6c63ff, #a78bfa)',
    color: 'white', fontSize: '12px', fontWeight: '700',
    cursor: 'pointer', letterSpacing: '0.3px',
    boxShadow: '0 3px 10px rgba(108,99,255,0.35)',
    transition: 'transform 0.15s, box-shadow 0.15s',
    whiteSpace: 'nowrap',
  },
  aiButtonLoading: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '6px 14px', border: 'none', borderRadius: '20px',
    background: 'linear-gradient(135deg, #9ca3af, #6b7280)',
    color: 'white', fontSize: '12px', fontWeight: '700',
    cursor: 'not-allowed', letterSpacing: '0.3px',
    whiteSpace: 'nowrap',
  },
  aiSpinner: {
    display: 'inline-block',
    animation: 'spin 0.8s linear infinite',
  },
};

export default ProjectDetailPage;