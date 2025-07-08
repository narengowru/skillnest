import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Users, Search, Phone, Video, MoreVertical, Paperclip, Smile, ArrowLeft, Circle, Check, CheckCheck, Plus, UserPlus } from 'lucide-react';
import { io } from 'socket.io-client';
import { freelancerAPI, clientAPI } from '../api/api';

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
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-105 relative"
        >
          <MessageCircle size={24} />
          {unreadCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-lg shadow-2xl w-80 h-96 flex flex-col overflow-hidden border">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {currentView === 'chat' && (
                <button
                  onClick={() => setCurrentView('conversations')}
                  className="hover:bg-blue-700 p-1 rounded"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              <h3 className="font-semibold">
                {currentView === 'conversations' ? 'Messages' : getOtherUser(activeConversation)?.name}
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              {currentView === 'chat' && (
                <>
                  <button className="hover:bg-blue-700 p-1 rounded">
                    <Phone size={18} />
                  </button>
                  <button className="hover:bg-blue-700 p-1 rounded">
                    <Video size={18} />
                  </button>
                  <button className="hover:bg-blue-700 p-1 rounded">
                    <MoreVertical size={18} />
                  </button>
                </>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-blue-700 p-1 rounded"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {currentView === 'conversations' ? (
              <div className="h-full flex flex-col">
                {/* Search */}
                <div className="p-3 border-b">
                  <div className="flex items-center justify-between mb-3">
                    <div className="relative flex-1 mr-3">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setShowNewConversation(true);
                        loadAvailableUsers();
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-2 transition-colors"
                      title="Start new conversation"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto">
                  {filteredConversations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <Users size={48} className="mx-auto mb-2 text-gray-300" />
                      <p>No conversations yet</p>
                      <p className="text-sm">Start a new conversation!</p>
                    </div>
                  ) : (
                    filteredConversations.map((conv) => {
                      const otherUser = getOtherUser(conv);
                      if (!otherUser) return null;

                      return (
                        <div
                          key={conv._id}
                          onClick={() => openConversation(conv)}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b flex items-center space-x-3"
                        >
                          <div className="relative">
                            <img
                              src={otherUser.profilePicture || '/default-avatar.png'}
                              alt={otherUser.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            {onlineUsers.has(otherUser._id) && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <p className="font-medium text-sm truncate">{otherUser.name}</p>
                              {conv.lastMessage && (
                                <span className="text-xs text-gray-500">
                                  {formatTime(conv.lastMessage.createdAt)}
                                </span>
                              )}
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <p className="text-xs text-gray-600 truncate">
                                {conv.lastMessage?.content || 'No messages yet'}
                              </p>
                              {conv.unreadCount > 0 && (
                                <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
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
              <div className="h-full flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500">
                      <MessageCircle size={48} className="mx-auto mb-2 text-gray-300" />
                      <p>No messages yet</p>
                      <p className="text-sm">Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isOwn = message.senderId._id === currentUser.id;
                      return (
                        <div
                          key={message._id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs px-4 py-2 rounded-lg ${
                              isOwn
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-800'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <div className={`flex items-center justify-end mt-1 space-x-1 ${isOwn ? 'text-blue-200' : 'text-gray-500'}`}>
                              <span className="text-xs">{formatTime(message.createdAt)}</span>
                              {isOwn && (
                                <div className="text-xs">
                                  {message.isRead ? (
                                    <CheckCheck size={12} className="text-blue-200" />
                                  ) : (
                                    <Check size={12} className="text-blue-200" />
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
                    <div className="flex justify-start">
                      <div className="bg-gray-200 rounded-lg px-4 py-2 flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                        <span className="text-xs text-gray-500">typing...</span>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t bg-gray-50">
                  <div className="flex items-center space-x-2">
                    <button className="text-gray-500 hover:text-gray-700">
                      <Paperclip size={20} />
                    </button>
                    <div className="flex-1 relative">
                      <input
                        ref={messageInputRef}
                        type="text"
                        value={newMessage}
                        onChange={handleTyping}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message..."
                        className="w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700">
                        <Smile size={20} />
                      </button>
                    </div>
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-full p-2 transition-colors"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg w-96 max-h-96 flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Start New Conversation</h3>
              <button
                onClick={() => setShowNewConversation(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {loadingUsers ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : availableUsers.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <UserPlus size={48} className="mx-auto mb-2 text-gray-300" />
                  <p>No users available</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableUsers.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => {
                        startNewConversation(user._id);
                        setShowNewConversation(false);
                      }}
                      className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer rounded-lg"
                    >
                      <img
                        src={user.profilePhoto || user.profilePicture || '/default-avatar.png'}
                        alt={user.name || user.companyName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {user.name || user.companyName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                        {user.skills && user.skills.length > 0 && (
                          <p className="text-xs text-blue-600 truncate">
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