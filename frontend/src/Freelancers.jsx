import React, { useState, useEffect, useContext } from "react";
import FindFreelancer from "./components/FindFreeLancer";
import FreelancerCard from "./components/FreelancerCard";
import { freelancerAPI, clientAPI, recommendationAPI } from "./api/api";
import { UserContext } from "./components/UserContext";

/* ─── Page-level styles ───────────────────────────────────────────────────── */
const pageStyles = `
  .fl-page {
    min-height: 100vh;
    background: #f5f6fa;
    padding: 32px 24px 64px;
    box-sizing: border-box;
  }

  /* Section labels */
  .fl-section-header {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 2px solid transparent;
  }
  .fl-section-header--ai   { border-color: #4f6ef7; }
  .fl-section-header--all  { border-color: #e5e7eb; }

  .fl-section-title {
    font-size: 20px;
    font-weight: 700;
    color: #111827;
    margin: 0;
  }
  .fl-section-sub {
    font-size: 12px;
    color: #9ca3af;
    font-weight: 400;
  }

  /* Card grids */
  .fl-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  /* Section wrapper */
  .fl-section {
    max-width: 1200px;
    margin: 0 auto 48px;
  }

  /* Info / tip banners */
  .fl-banner {
    border-radius: 12px;
    padding: 14px 18px;
    font-size: 13px;
    line-height: 1.5;
    margin-bottom: 24px;
    max-width: 1200px;
    margin-left: auto;
    margin-right: auto;
  }
  .fl-banner--tip {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #1d4ed8;
  }
  .fl-banner--build {
    background: #fffbeb;
    border: 1px solid #fde68a;
    color: #92400e;
  }

  /* Empty / loading states */
  .fl-state {
    text-align: center;
    padding: 60px 20px;
    color: #9ca3af;
    font-size: 15px;
  }
  .fl-state--error { color: #ef4444; }

  /* Loading skeleton pulse */
  @keyframes fl-pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
  .fl-loading-text { animation: fl-pulse 1.4s ease-in-out infinite; }

  /* Count badge next to "All Available" */
  .fl-count {
    display: inline-block;
    background: #f3f4f6;
    color: #6b7280;
    border-radius: 20px;
    padding: 2px 10px;
    font-size: 12px;
    font-weight: 600;
    vertical-align: middle;
  }
`;

/* ─── Component ───────────────────────────────────────────────────────────── */
const Freelancers = () => {
  const { user } = useContext(UserContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [clientProfile, setClientProfile] = useState(null);

  // Fetch all freelancers
  useEffect(() => {
    const fetchFreelancers = async () => {
      try {
        setLoading(true);
        const response = await freelancerAPI.getAllFreelancers();
        const verifiedFreelancers = response.data.filter(f => f.isVerified === true);
        setFreelancers(verifiedFreelancers);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching freelancers:", err);
        setError("Failed to load freelancers. Please try again later.");
        setLoading(false);
      }
    };
    fetchFreelancers();
  }, []);

  // Fetch client profile
  useEffect(() => {
    const fetchClientProfile = async () => {
      if (user && user.userType === 'client' && user.id) {
        try {
          const response = await clientAPI.getClient(user.id);
          setClientProfile(response.data);
        } catch (err) {
          console.error("Error fetching client profile:", err);
        }
      }
    };
    fetchClientProfile();
  }, [user]);

  // Fetch ML recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (user && user.userType === 'client' && user.id) {
        try {
          setLoadingRecommendations(true);
          const response = await recommendationAPI.getFreelancerRecommendations(user.id, {
            limit: 10,
            minScore: 50,
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

  // Filtered lists
  const match = (obj) =>
    obj.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    obj.tagline?.toLowerCase().includes(searchTerm.toLowerCase());

  const filteredFreelancers = freelancers.filter(match);
  const filteredRecommendations = recommendations.filter((rec) => match(rec.freelancer));
  const recommendedIds = new Set(recommendations.map(rec => rec.freelancer._id));
  const filteredOthers = filteredFreelancers.filter(f => !recommendedIds.has(f._id));

  const isClient = user && user.userType === 'client';

  return (
    <>
      <style>{pageStyles}</style>

      <div className="fl-page">
        <FindFreelancer onSearch={setSearchTerm} />

        {loading ? (
          <div className="fl-state fl-loading-text">Loading freelancers…</div>
        ) : error ? (
          <div className="fl-state fl-state--error">{error}</div>
        ) : (
          <>
            {/* ── AI Recommendations ── */}
            {isClient && (
              <div className="fl-section">
                {loadingRecommendations ? (
                  <div className="fl-state fl-loading-text">
                    Building your personalized recommendations…
                  </div>
                ) : filteredRecommendations.length > 0 ? (
                  <>
                    <br />
                    <div className="fl-section-header fl-section-header--ai">
                      <h2 className="fl-section-title">⭐ Recommended for You</h2>
                      {/* <span className="fl-section-sub">AI-powered · based on your job history</span> */}
                    </div>

                    <div className="fl-grid">
                      {filteredRecommendations.map((rec) => (
                        <div key={rec.freelancer._id}>
                          <FreelancerCard
                            id={rec.freelancer._id}
                            name={rec.freelancer.name}
                            role={rec.freelancer.tagline}
                            rating={rec.freelancer.ratings?.average || 0}
                            hours={rec.freelancer.availability?.hoursPerWeek || 0}
                            price={rec.freelancer.hourlyRate
                              ? parseInt(rec.freelancer.hourlyRate.replace(/[^0-9]/g, ''))
                              : 0}
                            profileImage={rec.freelancer.profilePhoto || 'https://i.ibb.co/N6GPXKSt/blank.jpg'}
                            matchScore={rec.matchScore}
                            matchReasons={rec.matchReasons}
                          />

                          {/* Subtle reasons list below card */}
                          {rec.matchReasons?.length > 0 && (
                            <ul style={{
                              margin: '8px 4px 0',
                              paddingLeft: '16px',
                              fontSize: '11px',
                              color: '#9ca3af',
                              lineHeight: 1.6,
                            }}>
                              {rec.matchReasons.map((r, i) => <li key={i}>{r}</li>)}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  /* No recommendations yet — nudge client to post a job */
                  !loadingRecommendations && (
                    <div className="fl-banner fl-banner--build">
                      📝 <strong>Building your recommendations:</strong> Post jobs with skill
                      requirements to get AI-powered freelancer suggestions tailored to your needs!
                    </div>
                  )
                )}
              </div>
            )}

            {/* ── Non-client tip ── */}
            {!isClient && (
              <div className="fl-banner fl-banner--tip" style={{ marginBottom: 32 }}>
                <strong>💡 Tip:</strong> Log in as a client to see personalized freelancer recommendations powered by our AI engine.
              </div>
            )}

            {/* ── All freelancers ── */}
            <div className="fl-section">
              <div className="fl-section-header fl-section-header--all">
                <h2 className="fl-section-title">All Available Freelancers</h2>
                {isClient && filteredRecommendations.length > 0 && (
                  <span className="fl-count">{filteredOthers.length} others</span>
                )}
              </div>

              {filteredOthers.length > 0 ? (
                <div className="fl-grid">
                  {filteredOthers.map((freelancer) => (
                    <FreelancerCard
                      key={freelancer._id}
                      id={freelancer._id}
                      name={freelancer.name}
                      role={freelancer.tagline}
                      rating={freelancer.ratings?.average || 0}
                      hours={freelancer.availability?.hoursPerWeek || 0}
                      price={freelancer.hourlyRate
                        ? parseInt(freelancer.hourlyRate.replace(/[^0-9]/g, ''))
                        : 0}
                      profileImage={freelancer.profilePhoto || 'https://i.ibb.co/N6GPXKSt/blank.jpg'}
                    />
                  ))}
                </div>
              ) : (
                <div className="fl-state">
                  No verified freelancers found matching your search criteria.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Freelancers;