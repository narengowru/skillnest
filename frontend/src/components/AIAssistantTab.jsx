import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Bot } from 'lucide-react';
import { aiAssistantAPI } from '../api/api';

const AIAssistantTab = ({ currentUser, style }) => {
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

    // Build conversation history array for API context (exclude welcome message)
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
            const res = await aiAssistantAPI.chat(content, buildHistory());
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

    // Render **bold** and newlines in AI responses
    const renderContent = (text) => {
        const parts = text.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
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