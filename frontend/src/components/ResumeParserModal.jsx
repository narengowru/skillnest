import React, { useState, useRef } from 'react';
import { FaTimes, FaUpload, FaCheckCircle, FaSpinner, FaFilePdf } from 'react-icons/fa';
import { freelancerAPI } from '../api/api';

const ResumeParserModal = ({ freelancerId, onComplete, onSkip }) => {
    const [dragOver, setDragOver] = useState(false);
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('idle'); // idle | parsing | success | error
    const [parsedData, setParsedData] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => setDragOver(false);

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped && dropped.type === 'application/pdf') {
            setFile(dropped);
        } else {
            setErrorMsg('Please upload a PDF file only.');
        }
    };

    const handleFileSelect = (e) => {
        const selected = e.target.files[0];
        if (selected && selected.type === 'application/pdf') {
            setFile(selected);
            setErrorMsg('');
        } else {
            setErrorMsg('Please upload a PDF file only.');
        }
    };

    const handleParse = async () => {
        if (!file) return;

        setStatus('parsing');
        setErrorMsg('');

        try {
            const formData = new FormData();
            formData.append('resume', file);
            formData.append('freelancerId', freelancerId);

            const response = await freelancerAPI.parseResume(formData);
            setParsedData(response.data.parsed);
            setStatus('success');
        } catch (err) {
            console.error('Resume parsing error:', err);
            setErrorMsg(
                err.response?.data?.message || 'Failed to parse resume. Please try again or skip.'
            );
            setStatus('error');
        }
    };

    const handleConfirmAndApply = async () => {
        // Data already saved to DB by backend, just close and refresh
        onComplete(parsedData);
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                {/* Header */}
                <div style={styles.header}>
                    <div>
                        <h2 style={styles.title}>🤖 Auto-Fill Profile with AI</h2>
                        <p style={styles.subtitle}>Upload your resume and we'll fill in your profile automatically</p>
                    </div>
                    <button style={styles.closeBtn} onClick={onSkip}>
                        <FaTimes />
                    </button>
                </div>

                {/* Body */}
                {status === 'idle' || status === 'error' ? (
                    <>
                        {/* Drop Zone */}
                        <div
                            style={{
                                ...styles.dropZone,
                                ...(dragOver ? styles.dropZoneActive : {}),
                                ...(file ? styles.dropZoneHasFile : {}),
                            }}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf"
                                style={{ display: 'none' }}
                                onChange={handleFileSelect}
                            />
                            {file ? (
                                <div style={styles.filePreview}>
                                    <FaFilePdf style={{ fontSize: '2.5rem', color: '#e53935' }} />
                                    <p style={styles.fileName}>{file.name}</p>
                                    <p style={styles.fileSize}>{(file.size / 1024).toFixed(1)} KB</p>
                                    <p style={{ color: '#43a047', fontSize: '0.85rem', marginTop: '4px' }}>
                                        ✓ Ready to parse
                                    </p>
                                </div>
                            ) : (
                                <div style={styles.uploadPrompt}>
                                    <FaUpload style={{ fontSize: '2rem', color: '#90a4ae', marginBottom: '12px' }} />
                                    <p style={styles.uploadText}>Drag & drop your resume here</p>
                                    <p style={styles.uploadSubtext}>or click to browse</p>
                                    <span style={styles.badge}>PDF only · Max 5MB</span>
                                </div>
                            )}
                        </div>

                        {errorMsg && <p style={styles.error}>⚠️ {errorMsg}</p>}

                        {/* What we extract */}
                        <div style={styles.extractInfo}>
                            <p style={styles.extractTitle}>We'll automatically extract:</p>
                            <div style={styles.extractTags}>
                                {['About Me / Bio', 'Skills & Proficiency', 'Education', 'Achievements', 'Languages', 'Location'].map(tag => (
                                    <span key={tag} style={styles.tag}>{tag}</span>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={styles.actions}>
                            <button style={styles.skipBtn} onClick={onSkip}>
                                Skip for now
                            </button>
                            <button
                                style={{ ...styles.parseBtn, ...(file ? {} : styles.parseBtnDisabled) }}
                                onClick={handleParse}
                                disabled={!file}
                            >
                                <FaUpload style={{ marginRight: '8px' }} />
                                Parse Resume
                            </button>
                        </div>
                    </>
                ) : status === 'parsing' ? (
                    <div style={styles.loadingContainer}>
                        <FaSpinner style={styles.spinner} />
                        <h3 style={styles.loadingTitle}>Analyzing your resume...</h3>
                        <p style={styles.loadingText}>Our AI is reading your resume and preparing your profile data.</p>
                        <div style={styles.progressSteps}>
                            {['Extracting text', 'Identifying skills', 'Parsing education', 'Structuring data'].map((step, i) => (
                                <div key={i} style={styles.step}>
                                    <div style={styles.stepDot} />
                                    <span style={styles.stepLabel}>{step}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : status === 'success' ? (
                    <div style={styles.successContainer}>
                        <FaCheckCircle style={styles.successIcon} />
                        <h3 style={styles.successTitle}>Profile Ready!</h3>
                        <p style={styles.successText}>We found the following data from your resume:</p>

                        <div style={styles.previewGrid}>
                            {parsedData?.bio && (
                                <div style={styles.previewCard}>
                                    <span style={styles.previewLabel}>About Me</span>
                                    <p style={styles.previewValue}>{parsedData.bio.slice(0, 100)}...</p>
                                </div>
                            )}
                            {parsedData?.skills?.length > 0 && (
                                <div style={styles.previewCard}>
                                    <span style={styles.previewLabel}>Skills ({parsedData.skills.length})</span>
                                    <p style={styles.previewValue}>{parsedData.skills.slice(0, 4).map(s => s.name).join(', ')}{parsedData.skills.length > 4 ? '...' : ''}</p>
                                </div>
                            )}
                            {parsedData?.education?.university && (
                                <div style={styles.previewCard}>
                                    <span style={styles.previewLabel}>Education</span>
                                    <p style={styles.previewValue}>{parsedData.education.university} — {parsedData.education.degree}</p>
                                </div>
                            )}
                            {parsedData?.achievements?.length > 0 && (
                                <div style={styles.previewCard}>
                                    <span style={styles.previewLabel}>Achievements ({parsedData.achievements.length})</span>
                                    <p style={styles.previewValue}>{parsedData.achievements[0]?.title}</p>
                                </div>
                            )}
                        </div>

                        <p style={styles.editNotice}>✏️ You can edit any of these details in your profile after applying.</p>

                        <div style={styles.actions}>
                            <button style={styles.skipBtn} onClick={onSkip}>
                                Discard
                            </button>
                            <button style={styles.parseBtn} onClick={handleConfirmAndApply}>
                                <FaCheckCircle style={{ marginRight: '8px' }} />
                                Apply to Profile
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: '20px',
        backdropFilter: 'blur(3px)',
    },
    modal: {
        backgroundColor: '#fff',
        borderRadius: '16px',
        padding: '32px',
        width: '100%', maxWidth: '560px',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        animation: 'slideUp 0.3s ease',
    },
    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: '24px',
    },
    title: { margin: 0, fontSize: '1.4rem', color: '#1a1a2e', fontWeight: 700 },
    subtitle: { margin: '4px 0 0', fontSize: '0.9rem', color: '#607d8b' },
    closeBtn: {
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: '1.2rem', color: '#90a4ae', padding: '4px',
        borderRadius: '50%', lineHeight: 1,
        transition: 'color 0.2s',
    },
    dropZone: {
        border: '2px dashed #cfd8dc',
        borderRadius: '12px', padding: '32px',
        textAlign: 'center', cursor: 'pointer',
        transition: 'all 0.3s ease',
        backgroundColor: '#fafafa',
        marginBottom: '20px',
    },
    dropZoneActive: { borderColor: '#1976d2', backgroundColor: '#e3f2fd' },
    dropZoneHasFile: { borderColor: '#43a047', backgroundColor: '#f1f8e9' },
    filePreview: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' },
    fileName: { margin: 0, fontWeight: 600, color: '#333', fontSize: '0.95rem' },
    fileSize: { margin: 0, color: '#90a4ae', fontSize: '0.8rem' },
    uploadPrompt: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
    uploadText: { margin: '0 0 4px', fontWeight: 600, color: '#455a64', fontSize: '1rem' },
    uploadSubtext: { margin: '0 0 12px', color: '#90a4ae', fontSize: '0.85rem' },
    badge: {
        backgroundColor: '#e3f2fd', color: '#1976d2',
        borderRadius: '20px', padding: '4px 12px', fontSize: '0.78rem', fontWeight: 500,
    },
    error: { color: '#e53935', fontSize: '0.85rem', margin: '-12px 0 12px' },
    extractInfo: {
        backgroundColor: '#f8f9fa', borderRadius: '10px',
        padding: '16px', marginBottom: '24px',
    },
    extractTitle: { margin: '0 0 10px', fontSize: '0.85rem', color: '#546e7a', fontWeight: 600 },
    extractTags: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
    tag: {
        backgroundColor: '#e8eaf6', color: '#3949ab',
        borderRadius: '20px', padding: '4px 12px', fontSize: '0.78rem', fontWeight: 500,
    },
    actions: { display: 'flex', gap: '12px', justifyContent: 'flex-end' },
    skipBtn: {
        padding: '10px 20px', borderRadius: '8px',
        border: '1px solid #cfd8dc', backgroundColor: 'white',
        color: '#607d8b', cursor: 'pointer', fontWeight: 500,
        fontSize: '0.9rem',
    },
    parseBtn: {
        padding: '10px 24px', borderRadius: '8px',
        border: 'none', backgroundColor: '#1976d2',
        color: 'white', cursor: 'pointer', fontWeight: 600,
        fontSize: '0.9rem', display: 'flex', alignItems: 'center',
        transition: 'background 0.2s',
    },
    parseBtnDisabled: { backgroundColor: '#b0bec5', cursor: 'not-allowed' },

    // Loading state
    loadingContainer: { textAlign: 'center', padding: '20px 0' },
    spinner: {
        fontSize: '2.5rem', color: '#1976d2',
        animation: 'spin 1s linear infinite',
    },
    loadingTitle: { margin: '16px 0 8px', color: '#1a1a2e', fontSize: '1.2rem' },
    loadingText: { color: '#607d8b', fontSize: '0.9rem', marginBottom: '24px' },
    progressSteps: {
        display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap',
    },
    step: { display: 'flex', alignItems: 'center', gap: '6px' },
    stepDot: {
        width: '8px', height: '8px', borderRadius: '50%',
        backgroundColor: '#1976d2', animation: 'pulse 1.5s infinite',
    },
    stepLabel: { fontSize: '0.8rem', color: '#607d8b' },

    // Success state
    successContainer: { textAlign: 'center' },
    successIcon: { fontSize: '3rem', color: '#43a047', marginBottom: '12px' },
    successTitle: { margin: '0 0 8px', color: '#1a1a2e', fontSize: '1.3rem' },
    successText: { color: '#607d8b', fontSize: '0.9rem', marginBottom: '20px' },
    previewGrid: {
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '12px', marginBottom: '16px', textAlign: 'left',
    },
    previewCard: {
        backgroundColor: '#f8f9fa', borderRadius: '10px', padding: '12px',
        border: '1px solid #e9ecef',
    },
    previewLabel: {
        display: 'block', fontSize: '0.75rem', fontWeight: 700,
        color: '#1976d2', textTransform: 'uppercase', marginBottom: '4px',
    },
    previewValue: { margin: 0, fontSize: '0.85rem', color: '#455a64', lineHeight: 1.4 },
    editNotice: {
        fontSize: '0.82rem', color: '#78909c', marginBottom: '24px',
        backgroundColor: '#fff8e1', padding: '8px 12px', borderRadius: '8px',
    },
};

// Inject keyframe animations
const styleTag = document.createElement('style');
styleTag.textContent = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
`;
document.head.appendChild(styleTag);

export default ResumeParserModal;