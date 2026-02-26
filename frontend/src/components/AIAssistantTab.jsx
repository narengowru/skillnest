import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { aiAssistantAPI } from '../api/api';

const AIAssistantTab = ({ currentUser, style }) => {
    const navigate = useNavigate();
    const [aiMessages, setAiMessages] = useState([
        {
            id: 'welcome',
            role: 'assistant',
            content: `Hi! I'm **SkillNest AI** ✨\n\nI can help you navigate the platform — whether you're looking to hire talent, find work, manage orders, or understand how things work here.\n\nWhat can I help you with today?`,
            timestamp: new Date()
        }
    ]);
    const [aiInput, setAiInput] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const aiMessagesEndRef = useRef(null);
    const aiInputRef = useRef(null);

    // Scroll to bottom on new messages
    useEffect(() => {
        aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [aiMessages]);

    // Load suggested questions on mount
    useEffect(() => {
        const loadSuggestions = async () => {
            try {
                const userType = currentUser?.userType === 'freelancer' ? 'Freelancer' : 'Client';
                const res = await aiAssistantAPI.getSuggestions(userType);
                if (res.data?.success) {
                    setSuggestions(res.data.data.suggestions || []);
                }
            } catch {
                setSuggestions([
                    'How do I get started on SkillNest?',
                    'How does the order system work?',
                    'How do I resolve a dispute?',
                    'What payment methods are supported?'
                ]);
            }
        };
        loadSuggestions();
    }, [currentUser]);

    // ── User identity helpers ─────────────────────────────────────────────────
    // localStorage stores { "id": "...", "userType": "freelancer" }
    // currentUser prop may also carry these — check both sources.
    const getUserId = () =>
        currentUser?.id        // prop: { id: "..." }
        || currentUser?._id    // prop: { _id: "..." }
        || (() => {            // fallback: parse localStorage directly
            try {
                const u = JSON.parse(localStorage.getItem('user') || '{}');
                return u.id || u._id || null;
            } catch { return null; }
        })();

    const getUserType = () =>
        currentUser?.userType
        || currentUser?.role
        || (() => {
            try {
                const u = JSON.parse(localStorage.getItem('user') || '{}');
                return u.userType || u.role || null;
            } catch { return null; }
        })();

    // ─────────────────────────────────────────────────────────────────────────

    // Build conversation history for API context (exclude welcome message)
    const buildHistory = () =>
        aiMessages
            .filter(m => m.id !== 'welcome')
            .map(m => ({ role: m.role, content: m.content }));

    const sendAiMessage = async (text) => {
        const content = (text || aiInput).trim();
        if (!content || isAiLoading) return;

        setShowSuggestions(false);
        setAiInput('');

        const userMsg = {
            id: `user-${Date.now()}`,
            role: 'user',
            content,
            timestamp: new Date()
        };
        setAiMessages(prev => [...prev, userMsg]);
        setIsAiLoading(true);

        try {
            const userId = getUserId();
            const userType = getUserType();

            // ↓ THE FIX: pass userId + userType so the backend can
            //   inject the user's identity into tool calls (e.g. job recommendations)
            const res = await aiAssistantAPI.chat(content, buildHistory(), userId, userType);

            const reply = res.data?.data?.reply || 'Sorry, I could not generate a response. Please try again.';
            setAiMessages(prev => [
                ...prev,
                {
                    id: `ai-${Date.now()}`,
                    role: 'assistant',
                    content: reply,
                    timestamp: new Date()
                }
            ]);
        } catch (err) {
            const errMsg =
                err?.response?.data?.message ||
                'Something went wrong. Please try again in a moment.';
            setAiMessages(prev => [
                ...prev,
                {
                    id: `ai-error-${Date.now()}`,
                    role: 'assistant',
                    content: `⚠️ ${errMsg}`,
                    timestamp: new Date(),
                    isError: true
                }
            ]);
        } finally {
            setIsAiLoading(false);
            setTimeout(() => aiInputRef.current?.focus(), 0);
        }
    };

    // Render AI response text:
    //   **bold**, newlines, and [label](url) markdown links
    const renderContent = (text) => {
        // Split on bold markers and markdown links
        const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
        return parts.map((part, i) => {
            // Bold
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            // Markdown link: [label](url)
            const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
            if (linkMatch) {
                const label = linkMatch[1];
                const url = linkMatch[2];
                const isInternal = url.startsWith('/');
                return (
                    <a
                        key={i}
                        href={isInternal ? undefined : url}
                        onClick={isInternal ? (e) => { e.preventDefault(); navigate(url); } : undefined}
                        target={isInternal ? undefined : '_blank'}
                        rel={isInternal ? undefined : 'noopener noreferrer'}
                        style={{
                            color: '#a78bfa',
                            fontWeight: 600,
                            textDecoration: 'underline',
                            cursor: 'pointer'
                        }}
                    >
                        {label}
                    </a>
                );
            }
            // Plain text with newlines
            return part.split('\n').map((line, j) => (
                <React.Fragment key={`${i}-${j}`}>
                    {line}
                    {j < part.split('\n').length - 1 && <br />}
                </React.Fragment>
            ));
        });
    };

    const formatTime = (ts) =>
        new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="ai-assistant-view" style={style}>

            {/* Message list */}
            <div className="ai-messages-container">
                {aiMessages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`ai-message-row ${msg.role === 'user' ? 'ai-user-row' : 'ai-assistant-row'}`}
                    >
                        {msg.role === 'assistant' && (
                            <div className="ai-avatar">
                                <Sparkles size={13} />
                            </div>
                        )}
                        <div
                            className={`ai-bubble ${msg.role === 'user'
                                ? 'ai-user-bubble'
                                : msg.isError
                                    ? 'ai-error-bubble'
                                    : 'ai-assistant-bubble'
                                }`}
                        >
                            <p className="ai-bubble-text">{renderContent(msg.content)}</p>
                            <span className="ai-bubble-time">{formatTime(msg.timestamp)}</span>
                        </div>
                    </div>
                ))}

                {/* AI typing indicator */}
                {isAiLoading && (
                    <div className="ai-message-row ai-assistant-row">
                        <div className="ai-avatar">
                            <Sparkles size={13} />
                        </div>
                        <div className="ai-bubble ai-assistant-bubble ai-typing-bubble">
                            <div className="ai-typing-dots">
                                <span /><span /><span />
                            </div>
                        </div>
                    </div>
                )}

                {/* Suggested starter questions */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="ai-suggestions">
                        <p className="ai-suggestions-label">Try asking:</p>
                        <div className="ai-suggestions-grid">
                            {suggestions.map((s, i) => (
                                <button
                                    key={i}
                                    className="ai-suggestion-chip"
                                    onClick={() => sendAiMessage(s)}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div ref={aiMessagesEndRef} />
            </div>

            {/* Input bar */}
            <div className="ai-input-container">
                <div className="ai-input-wrapper">
                    <input
                        ref={aiInputRef}
                        type="text"
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendAiMessage()}
                        placeholder="Ask me anything about SkillNest..."
                        className="ai-input"
                        disabled={isAiLoading}
                    />
                    <button
                        onClick={() => sendAiMessage()}
                        disabled={!aiInput.trim() || isAiLoading}
                        className="ai-send-button"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>

        </div>
    );
};

export default AIAssistantTab;