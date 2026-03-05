import React, { useState, useEffect, useContext, useCallback } from "react";
import FindJobs from "./components/FindJobs";
import FindJobCard from "./components/FindJobCard";
import Filter from "./components/Filter";
import { jobAPI, freelancerAPI, recommendationAPI, proposalAPI } from "./api/api";
import { UserContext } from "./components/UserContext";

/* ─────────────────────────────────────────────
   Delivery-time options (in days)
───────────────────────────────────────────── */
const DELIVERY_OPTIONS = [
  { label: "1 day", value: 1 },
  { label: "3 days", value: 3 },
  { label: "7 days", value: 7 },
  { label: "14 days", value: 14 },
  { label: "30 days", value: 30 },
  { label: "45 days", value: 45 },
  { label: "60 days", value: 60 },
  { label: "90 days", value: 90 },
];

/* ─────────────────────────────────────────────
   Proposal Modal
───────────────────────────────────────────── */
const ProposalModal = ({ job, freelancerId, clientId, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    bidAmount: "",
    deliveryTime: "",
    proposalText: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // close on backdrop click
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validate = () => {
    if (!form.bidAmount || Number(form.bidAmount) < 1)
      return "Please enter a valid bid amount (at least $1).";
    if (!form.deliveryTime)
      return "Please select a delivery time.";
    if (!form.proposalText || form.proposalText.trim().length < 20)
      return "Proposal text must be at least 20 characters.";
    if (form.proposalText.trim().length > 2000)
      return "Proposal text cannot exceed 2000 characters.";
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
        projectId: job._id,
        freelancerId,
        clientId: clientId || job.client?._id,
        bidAmount: Number(form.bidAmount),
        deliveryTime: Number(form.deliveryTime),
        proposalText: form.proposalText.trim(),
      });
      // Also push proposal ID into Job.proposals[] via the job controller
      const proposalId = res.data?.proposal?._id;
      if (proposalId) {
        try {
          await jobAPI.addProposalToJob(job._id, proposalId);
        } catch (e) {
          // non-fatal — proposalController already does $push as well
          console.warn('addProposalToJob fallback failed:', e.message);
        }
      }
      onSuccess();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to submit proposal. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const charCount = form.proposalText.length;

  return (
    <div style={styles.backdrop} onClick={handleBackdrop}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.modalHeader}>
          <div>
            <h2 style={styles.modalTitle}>Submit a Proposal</h2>
            <p style={styles.modalSub}>{job.title}</p>
          </div>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Bid Amount */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Bid Amount <span style={styles.required}>*</span></label>
            <div style={styles.inputWrapper}>
              <span style={styles.prefix}>$</span>
              <input
                type="number"
                name="bidAmount"
                value={form.bidAmount}
                onChange={handleChange}
                placeholder="e.g. 250"
                min="1"
                style={{ ...styles.input, paddingLeft: "32px" }}
              />
            </div>
          </div>

          {/* Delivery Time */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Delivery Time <span style={styles.required}>*</span></label>
            <select
              name="deliveryTime"
              value={form.deliveryTime}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="">— Select delivery time —</option>
              {DELIVERY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Proposal Text */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              Cover Letter / Proposal <span style={styles.required}>*</span>
            </label>
            <textarea
              name="proposalText"
              value={form.proposalText}
              onChange={handleChange}
              placeholder="Describe your approach, relevant experience, and why you're the best fit for this project…"
              rows={7}
              style={styles.textarea}
              maxLength={2000}
            />
            <div style={styles.charCount}>
              <span style={{ color: charCount < 20 ? "#e74c3c" : "#6c63ff" }}>
                {charCount}
              </span>
              {" / 2000 characters"}{charCount < 20 && ` (${20 - charCount} more needed)`}
            </div>
          </div>

          {/* Error */}
          {error && <div style={styles.errorBox}>{error}</div>}

          {/* Actions */}
          <div style={styles.actions}>
            <button type="button" style={styles.cancelBtn} onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" style={styles.submitBtn} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit Proposal ✉"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Success Toast
───────────────────────────────────────────── */
const SuccessToast = ({ onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={styles.toast}>
      <span style={{ fontSize: "22px" }}>🎉</span>
      <span>Proposal submitted successfully!</span>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Main Jobs Component
───────────────────────────────────────────── */
const Jobs = () => {
  const { user } = useContext(UserContext);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [postedTimeline, setPostedTimeline] = useState(null);
  const [jobDuration, setJobDuration] = useState("All Durations");
  const [searchTerm, setSearchTerm] = useState("");
  const [freelancerProfile, setFreelancerProfile] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Modal state
  const [selectedJob, setSelectedJob] = useState(null);
  const [showToast, setShowToast] = useState(false);

  const isFreelancer = user && user.userType === "freelancer";

  // Fetch freelancer profile
  useEffect(() => {
    const fetchFreelancerProfile = async () => {
      if (user && user.userType === "freelancer" && user.id) {
        try {
          const response = await freelancerAPI.getFreelancer(user.id);
          setFreelancerProfile(response.data);
        } catch (err) {
          console.error("Error fetching freelancer profile:", err);
        }
      }
    };
    fetchFreelancerProfile();
  }, [user]);

  // Fetch recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (user && user.userType === "freelancer" && user.id) {
        try {
          setLoadingRecommendations(true);
          const response = await recommendationAPI.getJobRecommendations(user.id, {
            limit: 10,
            excludeApplied: true,
            minScore: 0,
          });
          if (response?.data?.data?.recommendations) {
            setRecommendations(response.data.data.recommendations);
          }
        } catch (err) {
          console.error("Error fetching recommendations:", err);
        } finally {
          setLoadingRecommendations(false);
        }
      }
    };
    fetchRecommendations();
  }, [user]);

  // Fetch all jobs
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await jobAPI.getAllJobs();
        if (response?.data) {
          setJobs(response.data);
          setError(null);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        console.error("Error fetching jobs:", err);
        setError("Failed to load jobs. Please try again later.");
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const handleSearch = (term) => {
    setSearchTerm(term.toLowerCase());
    setTimeout(() => {
      document.getElementById("search-results")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const filteredJobs = jobs
    .filter(
      (job) =>
        selectedCategories.length === 0 ||
        (job.category && selectedCategories.includes(job.category))
    )
    .filter(
      (job) =>
        jobDuration === "All Durations" ||
        (job.projectDuration && job.projectDuration.includes(jobDuration))
    )
    .filter(
      (job) =>
        searchTerm === "" ||
        (job.description && job.description.toLowerCase().includes(searchTerm)) ||
        (job.title && job.title.toLowerCase().includes(searchTerm))
    )
    .sort((a, b) => {
      if (postedTimeline === "Newest First")
        return new Date(b.datePosted || b.createdAt) - new Date(a.datePosted || a.createdAt);
      if (postedTimeline === "Oldest First")
        return new Date(a.datePosted || a.createdAt) - new Date(b.datePosted || b.createdAt);
      return 0;
    });

  const handleProposalSuccess = useCallback(() => {
    setSelectedJob(null);
    setShowToast(true);
  }, []);

  if (loading) return <div>Loading jobs...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div style={{ margin: "0 auto", padding: "20px" }}>
      {/* Success Toast */}
      {showToast && <SuccessToast onDone={() => setShowToast(false)} />}

      {/* Proposal Modal */}
      {selectedJob && isFreelancer && (
        <ProposalModal
          job={selectedJob}
          freelancerId={user.id}
          clientId={selectedJob.client?._id}
          onClose={() => setSelectedJob(null)}
          onSuccess={handleProposalSuccess}
        />
      )}

      <div style={{ marginBottom: "30px" }}>
        <FindJobs onSearch={handleSearch} />
      </div>

      <div id="search-results" style={{ display: "flex", gap: "20px" }}>
        <div style={{ width: "350px" }}>
          <Filter
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            postedTimeline={postedTimeline}
            setPostedTimeline={setPostedTimeline}
            jobDuration={jobDuration}
            setJobDuration={setJobDuration}
          />
        </div>

        <div style={{ flex: 1 }}>
          {/* Recommended Jobs Section */}
          {isFreelancer && (
            <>
              {loadingRecommendations ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#7f8c8d" }}>
                  Loading personalized recommendations...
                </div>
              ) : recommendations.length > 0 ? (
                <div style={{ marginBottom: "40px" }}>
                  <h2 style={{
                    marginBottom: "20px", color: "#2c3e50", fontSize: "24px",
                    fontWeight: "600", borderBottom: "2px solid #3498db", paddingBottom: "10px"
                  }}>
                    🎯 Recommended for You
                    <span style={{ fontSize: "14px", color: "#7f8c8d", fontWeight: "400", marginLeft: "10px" }}>
                      Powered by AI • Based on your profile and application history
                    </span>
                  </h2>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px", alignItems: "start" }}>
                    {recommendations.map((rec) => (
                      <div key={rec.job._id} style={{ position: "relative" }}>
                        <div style={{
                          position: "absolute", top: "10px", right: "10px",
                          background: rec.matchScore >= 70 ? "#27ae60" : rec.matchScore >= 50 ? "#f39c12" : "#3498db",
                          color: "white", padding: "5px 12px", borderRadius: "20px",
                          fontSize: "12px", fontWeight: "600", zIndex: 10,
                          boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                        }}>
                          {rec.matchScore}% Match
                        </div>
                        <FindJobCard
                          id={rec.job._id}
                          image={rec.job.imageUrl}
                          category={rec.job.category}
                          title={rec.job.title}
                          postedDate={rec.job.datePosted || rec.job.createdAt}
                          description={rec.job.description}
                          onApply={() => setSelectedJob(rec.job)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : freelancerProfile?.skills?.length > 0 ? (
                <div style={{ backgroundColor: "#fff3cd", border: "1px solid #ffeaa7", borderRadius: "8px", padding: "15px", marginBottom: "20px", color: "#856404" }}>
                  <strong>📝 Building your recommendations:</strong> We're analyzing jobs that match your skills. Check back soon or browse all available jobs below.
                </div>
              ) : (
                <div style={{ backgroundColor: "#d1ecf1", border: "1px solid #bee5eb", borderRadius: "8px", padding: "15px", marginBottom: "20px", color: "#0c5460" }}>
                  <strong>🎯 Get personalized recommendations:</strong> Add your skills to your profile to see AI-powered job suggestions tailored just for you!
                </div>
              )}
            </>
          )}

          {/* All Jobs Section */}
          <div>
            <h2 style={{
              marginBottom: "20px", color: "#2c3e50", fontSize: "24px",
              fontWeight: "600", borderBottom: "2px solid #e74c3c", paddingBottom: "10px"
            }}>
              📋 All Available Jobs
              {isFreelancer && recommendations.length > 0 && (
                <span style={{ fontSize: "14px", color: "#7f8c8d", fontWeight: "400", marginLeft: "10px" }}>
                  ({filteredJobs.length} total jobs)
                </span>
              )}
            </h2>

            {!isFreelancer && (
              <div style={{ backgroundColor: "#f8f9fa", border: "1px solid #dee2e6", borderRadius: "8px", padding: "15px", marginBottom: "20px", color: "#6c757d" }}>
                <strong>💡 Tip:</strong> Log in as a freelancer to see personalized job suggestions and apply directly!
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px", alignItems: "start", marginRight: "1px" }}>
              {filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                  <FindJobCard
                    key={job._id}
                    id={job._id}
                    image={job.imageUrl}
                    category={job.category}
                    title={job.title}
                    postedDate={job.datePosted || job.createdAt}
                    description={job.description}
                    onApply={isFreelancer ? () => setSelectedJob(job) : undefined}
                  />
                ))
              ) : (
                <p>No jobs found. Please try different filters or check back later.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Inline Styles (modal only — keeps CSS clean)
───────────────────────────────────────────── */
const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(10, 10, 30, 0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "20px",
  },
  modal: {
    background: "#ffffff",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "560px",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
    animation: "fadeScaleIn 0.22s ease",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "24px 28px 16px",
    borderBottom: "1px solid #f0f0f8",
  },
  modalTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "700",
    color: "#1a1a2e",
  },
  modalSub: {
    margin: "4px 0 0",
    fontSize: "13px",
    color: "#6c63ff",
    fontWeight: "500",
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    color: "#999",
    lineHeight: 1,
    padding: "2px 6px",
    borderRadius: "6px",
    transition: "background 0.15s",
  },
  form: {
    padding: "20px 28px 28px",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#444",
    letterSpacing: "0.3px",
  },
  required: {
    color: "#e74c3c",
    marginLeft: "2px",
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  prefix: {
    position: "absolute",
    left: "12px",
    color: "#888",
    fontSize: "15px",
    fontWeight: "600",
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    border: "1.5px solid #e0e0f0",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#1a1a2e",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
    background: "#fafafe",
  },
  select: {
    width: "100%",
    padding: "10px 14px",
    border: "1.5px solid #e0e0f0",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#1a1a2e",
    outline: "none",
    background: "#fafafe",
    cursor: "pointer",
    appearance: "auto",
  },
  textarea: {
    width: "100%",
    padding: "12px 14px",
    border: "1.5px solid #e0e0f0",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#1a1a2e",
    outline: "none",
    resize: "vertical",
    lineHeight: "1.6",
    background: "#fafafe",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  charCount: {
    fontSize: "12px",
    color: "#999",
    textAlign: "right",
    marginTop: "2px",
  },
  errorBox: {
    background: "#fff0f0",
    border: "1px solid #ffc5c5",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#c0392b",
    fontSize: "13px",
  },
  actions: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
    marginTop: "4px",
  },
  cancelBtn: {
    padding: "10px 22px",
    border: "1.5px solid #e0e0f0",
    borderRadius: "10px",
    background: "white",
    color: "#555",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background 0.15s",
  },
  submitBtn: {
    padding: "10px 26px",
    border: "none",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #6c63ff, #48b8d0)",
    color: "white",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(108,99,255,0.4)",
    transition: "opacity 0.15s, transform 0.15s",
  },
  toast: {
    position: "fixed",
    bottom: "28px",
    right: "28px",
    background: "linear-gradient(135deg, #27ae60, #2ecc71)",
    color: "white",
    padding: "14px 22px",
    borderRadius: "12px",
    boxShadow: "0 8px 24px rgba(39,174,96,0.4)",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "15px",
    fontWeight: "600",
    zIndex: 99999,
    animation: "fadeScaleIn 0.25s ease",
  },
};

export default Jobs;