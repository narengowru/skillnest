import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Users, Search, Phone, Video, MoreVertical, Paperclip, Smile, ArrowLeft, Circle, Check, CheckCheck, Plus, UserPlus } from 'lucide-react';
import { io } from 'socket.io-client';
import { freelancerAPI, clientAPI } from '../api/api';
import './ChatComponent.css';

const ChatComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState('conversations'); // 'conversations' or 'chat'
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageInputRef = useRef(null);

  // Initialize user and socket connection
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUser(user);
        initializeSocket(user);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Initialize socket connection
  const initializeSocket = (user) => {
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      withCredentials: true,
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      newSocket.emit('join-chat', {
        userId: user.id,
        userType: user.userType === 'freelancer' ? 'Freelancer' : 'Client'
      });
    });

    newSocket.on('chat-joined', (data) => {
      console.log('Successfully joined chat:', data);
      loadConversations();
    });

    newSocket.on('new-message', (message) => {
      if (activeConversation && message.chatRoomId === activeConversation._id) {
        setMessages(prev => [...prev, message]);
        markMessagesAsRead(activeConversation._id);
      } else {
        // Update conversation list with new message
        setConversations(prev => prev.map(conv => 
          conv._id === message.chatRoomId 
            ? { ...conv, lastMessage: message, unreadCount: conv.unreadCount + 1 }
            : conv
        ));
        setUnreadCount(prev => prev + 1);
      }
    });

    newSocket.on('user-typing', (data) => {
      if (data.userId !== user.id) {
        setTypingUsers(prev => {
          if (data.isTyping) {
            return [...prev.filter(u => u.userId !== data.userId), data];
          } else {
            return prev.filter(u => u.userId !== data.userId);
          }
        });
      }
    });

    newSocket.on('messages-read', (data) => {
      if (activeConversation && data.chatRoomId === activeConversation._id) {
        setMessages(prev => prev.map(msg => 
          msg.senderId === currentUser.id ? { ...msg, isRead: true } : msg
        ));
      }
    });

    newSocket.on('message-notification', (notification) => {
      // Show notification for messages from other conversations
      console.log('New message notification:', notification);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  };

  // Load conversations
  const loadConversations = async () => {
    if (!currentUser) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/chat/rooms?userId=${currentUser.id}&userType=${currentUser.userType === 'freelancer' ? 'Freelancer' : 'Client'}`);
      const data = await response.json();
      
      if (data.success) {
        setConversations(data.data.chatRooms);
        const totalUnread = data.data.chatRooms.reduce((sum, room) => sum + room.unreadCount, 0);
        setUnreadCount(totalUnread);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  // Load messages for a conversation
  const loadMessages = async (chatRoomId) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/chat/messages/${chatRoomId}`);
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.data.messages);
        markMessagesAsRead(chatRoomId);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async (chatRoomId) => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/api/chat/messages/read/${chatRoomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          userType: currentUser.userType === 'freelancer' ? 'Freelancer' : 'Client'
        })
      });

      // Update local state
      setConversations(prev => prev.map(conv => 
        conv._id === chatRoomId ? { ...conv, unreadCount: 0 } : conv
      ));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Send message
  const sendMessage = () => {
    if (!newMessage.trim() || !activeConversation || !socket) return;

    socket.emit('send-message', {
      chatRoomId: activeConversation._id,
      content: newMessage.trim(),
      messageType: 'text'
    });

    setNewMessage('');
    stopTyping();
  };

  // Handle typing
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (!isTyping && activeConversation && socket) {
      setIsTyping(true);
      socket.emit('typing-start', { chatRoomId: activeConversation._id });
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  };

  const stopTyping = () => {
    if (isTyping && activeConversation && socket) {
      setIsTyping(false);
      socket.emit('typing-stop', { chatRoomId: activeConversation._id });
    }
    clearTimeout(typingTimeoutRef.current);
  };

  // Start new conversation
  const startNewConversation = async (userId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/chat/room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: currentUser.userType === 'client' ? currentUser.id : userId,
          freelancerId: currentUser.userType === 'freelancer' ? currentUser.id : userId
        })
      });

      const data = await response.json();
      if (data.success) {
        setActiveConversation(data.data.chatRoom);
        setCurrentView('chat');
        
        if (socket) {
          socket.emit('join-room', { chatRoomId: data.data.chatRoom._id });
        }
        
        loadMessages(data.data.chatRoom._id);
        loadConversations();
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  // Open conversation
  const openConversation = (conversation) => {
    setActiveConversation(conversation);
    setCurrentView('chat');
    
    if (socket) {
      socket.emit('join-room', { chatRoomId: conversation._id });
    }
    
    loadMessages(conversation._id);
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Get other user from conversation
  const getOtherUser = (conversation) => {
    if (!conversation || !currentUser) return null;
    
    if (currentUser.userType === 'freelancer') {
      return conversation.clientId;
    } else {
      return conversation.freelancerId;
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    const otherUser = getOtherUser(conv);
    return otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
  });

  // Format time
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Format date
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!currentUser) return null;

  // Load available users for new conversation
  const loadAvailableUsers = async () => {
    if (!currentUser) return;
    
    setLoadingUsers(true);
    try {
      const api = currentUser.userType === 'freelancer' ? clientAPI : freelancerAPI;
      const response = currentUser.userType === 'freelancer' 
        ? await api.getAllClients() 
        : await api.getAllFreelancers();
      
      setAvailableUsers(response.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  return (
    <div className="chat-container">
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="chat-toggle-button"
        >
          <MessageCircle size={24} />
          {unreadCount > 0 && (
            <div className="unread-badge">
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="header-left">
              {currentView === 'chat' && (
                <button
                  onClick={() => setCurrentView('conversations')}
                  className="back-button"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              <h3 className="header-title">
                {currentView === 'conversations' ? 'Messages' : getOtherUser(activeConversation)?.name}
              </h3>
            </div>
            <div className="header-right">
              {currentView === 'chat' && (
                <>
                  <button className="header-action-btn">
                    <Phone size={18} />
                  </button>
                  <button className="header-action-btn">
                    <Video size={18} />
                  </button>
                  <button className="header-action-btn">
                    <MoreVertical size={18} />
                  </button>
                </>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="close-button"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="chat-content">
            {currentView === 'conversations' ? (
              <div className="conversations-container">
                {/* Search */}
                <div className="search-section">
                  <div className="search-controls">
                    <div className="search-input-container">
                      <Search className="search-icon" size={16} />
                      <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setShowNewConversation(true);
                        loadAvailableUsers();
                      }}
                      className="new-conversation-btn"
                      title="Start new conversation"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                {/* Conversations List */}
                <div className="conversations-list">
                  {filteredConversations.length === 0 ? (
                    <div className="empty-conversations">
                      <Users size={48} className="empty-icon" />
                      <p>No conversations yet</p>
                      <p className="empty-subtitle">Start a new conversation!</p>
                    </div>
                  ) : (
                    filteredConversations.map((conv) => {
                      const otherUser = getOtherUser(conv);
                      if (!otherUser) return null;

                      return (
                        <div
                          key={conv._id}
                          onClick={() => openConversation(conv)}
                          className="conversation-item"
                        >
                          <div className="user-avatar-container">
                            <img
                              src={otherUser.profilePicture || '/default-avatar.png'}
                              alt={otherUser.name}
                              className="user-avatar"
                            />
                            {onlineUsers.has(otherUser._id) && (
                              <div className="online-indicator"></div>
                            )}
                          </div>
                          <div className="conversation-info">
                            <div className="conversation-header">
                              <p className="user-name">{otherUser.name}</p>
                              {conv.lastMessage && (
                                <span className="message-time">
                                  {formatTime(conv.lastMessage.createdAt)}
                                </span>
                              )}
                            </div>
                            <div className="conversation-footer">
                              <p className="last-message">
                                {conv.lastMessage?.content || 'No messages yet'}
                              </p>
                              {conv.unreadCount > 0 && (
                                <span className="conversation-unread-badge">
                                  {conv.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="chat-view">
                {/* Messages */}
                <div className="messages-container">
                  {isLoading ? (
                    <div className="loading-container">
                      <div className="loading-spinner"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="empty-messages">
                      <MessageCircle size={48} className="empty-icon" />
                      <p>No messages yet</p>
                      <p className="empty-subtitle">Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isOwn = message.senderId._id === currentUser.id;
                      return (
                        <div
                          key={message._id}
                          className={`message-row ${isOwn ? 'own-message' : 'other-message'}`}
                        >
                          <div className={`message-bubble ${isOwn ? 'own-bubble' : 'other-bubble'}`}>
                            <p className="message-content">{message.content}</p>
                            <div className="message-meta">
                              <span className="message-time-small">{formatTime(message.createdAt)}</span>
                              {isOwn && (
                                <div className="message-status">
                                  {message.isRead ? (
                                    <CheckCheck size={12} className="read-indicator" />
                                  ) : (
                                    <Check size={12} className="sent-indicator" />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  
                  {/* Typing indicator */}
                  {typingUsers.length > 0 && (
                    <div className="typing-indicator-container">
                      <div className="typing-indicator">
                        <div className="typing-dots">
                          <div className="typing-dot"></div>
                          <div className="typing-dot typing-dot-2"></div>
                          <div className="typing-dot typing-dot-3"></div>
                        </div>
                        <span className="typing-text">typing...</span>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="message-input-container">
                  <div className="message-input-wrapper">
                    <button className="input-action-btn">
                      <Paperclip size={20} />
                    </button>
                    <div className="message-input-field">
                      <input
                        ref={messageInputRef}
                        type="text"
                        value={newMessage}
                        onChange={handleTyping}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message..."
                        className="message-input"
                      />
                      <button className="emoji-button">
                        <Smile size={20} />
                      </button>
                    </div>
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="send-button"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Conversation Modal */}
      {showNewConversation && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Start New Conversation</h3>
              <button
                onClick={() => setShowNewConversation(false)}
                className="modal-close-btn"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              {loadingUsers ? (
                <div className="modal-loading">
                  <div className="loading-spinner"></div>
                </div>
              ) : availableUsers.length === 0 ? (
                <div className="modal-empty">
                  <UserPlus size={48} className="empty-icon" />
                  <p>No users available</p>
                </div>
              ) : (
                <div className="users-list">
                  {availableUsers.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => {
                        startNewConversation(user._id);
                        setShowNewConversation(false);
                      }}
                      className="user-item"
                    >
                      <img
                        src={user.profilePhoto || user.profilePicture || '/default-avatar.png'}
                        alt={user.name || user.companyName}
                        className="user-item-avatar"
                      />
                      <div className="user-item-info">
                        <p className="user-item-name">
                          {user.name || user.companyName}
                        </p>
                        <p className="user-item-email">
                          {user.email}
                        </p>
                        {user.skills && user.skills.length > 0 && (
                          <p className="user-item-skills">
                            {user.skills.slice(0, 2).map(skill => skill.name || skill).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatComponent;