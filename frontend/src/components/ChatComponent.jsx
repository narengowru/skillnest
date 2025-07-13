import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Users, Search, Phone, Video, MoreVertical, Paperclip, Smile, ArrowLeft, Circle, Check, CheckCheck, Plus, UserPlus, RefreshCw } from 'lucide-react';
import { io } from 'socket.io-client';
import { freelancerAPI, clientAPI } from '../api/api';
import '../css/ChatComponent.css';

const ChatComponent = () => {
  // All hooks at the top
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
  const [userCache, setUserCache] = useState({});
  const [allowedClientIds, setAllowedClientIds] = useState([]);
  const [allowedFreelancerIds, setAllowedFreelancerIds] = useState([]);
  const [clientId, setClientId] = useState(null);
  const [lastPollTime, setLastPollTime] = useState(Date.now());
  const [pollingInterval, setPollingInterval] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connected', 'disconnected', 'connecting'

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageInputRef = useRef(null);

  // Initialize user and socket connection (only once on mount)
  useEffect(() => {
    const fetchAndSetUser = async () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        let user = JSON.parse(userData);
        if (user.userType === 'client' && user.email && !user.id) {
          try {
            const res = await clientAPI.getAllClients();
            const client = (res.data || []).find(c => c.email === user.email);
            if (client && client._id) {
              user = { ...user, id: client._id };
            }
          } catch (e) {
            // ignore error
          }
        }
        setCurrentUser(user);
        initializeSocket(user);
      }
    };
    fetchAndSetUser();
  }, []);

  // Cleanup socket on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  // Reinitialize socket when currentUser changes
  useEffect(() => {
    if (currentUser && !socket) {
      initializeSocket(currentUser);
    }
  }, [currentUser, socket]);

  // Clean up typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Only set clientId if not already set
  useEffect(() => {
    if (
      currentUser &&
      currentUser.userType === 'client' &&
      currentUser.id &&
      clientId !== currentUser.id
    ) {
      setClientId(currentUser.id);
    }
  }, [currentUser, clientId]);

  // Only load conversations when all data is ready
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.userType === 'client' && !clientId) return;
    loadConversations();
    // eslint-disable-next-line
  }, [currentUser, clientId]);

  // Fetch allowed client IDs for freelancers
  useEffect(() => {
    const fetchAllowedClients = async () => {
      if (currentUser && currentUser.userType === 'freelancer') {
        try {
          const res = await freelancerAPI.getFreelancer(currentUser.id);
          // Extract unique clientIds from freelancer.orders
          const clientIds = (res.data.orders || [])
            .map(order => order.clientId)
            .filter(Boolean);
          setAllowedClientIds([...new Set(clientIds.map(id => id.toString()))]);
        } catch (e) {
          setAllowedClientIds([]);
        }
      }
    };
    fetchAllowedClients();
  }, [currentUser]);

  // Fetch allowed freelancer IDs for clients
  useEffect(() => {
    const fetchAllowedFreelancers = async () => {
      if (currentUser && currentUser.userType === 'client' && clientId) {
        try {
          console.log('clientId', clientId);
          const res = await clientAPI.getClient(clientId);
          // Extract unique freelancerIds from client.orders
          const freelancerIds = (res.data.orders || [])
            .map(order => order.freelancerId)
            .filter(Boolean);
          setAllowedFreelancerIds([...new Set(freelancerIds.map(id => id.toString()))]);
        } catch (e) {
          setAllowedFreelancerIds([]);
        }
      }
    };
    fetchAllowedFreelancers();
  }, [currentUser, clientId]);

  // Initialize socket connection
  const initializeSocket = (user) => {
    // Disconnect existing socket if any
    if (socket) {
      socket.disconnect();
    }

    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      withCredentials: true,
      transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('Socket connected successfully');
      setConnectionStatus('connected');
      newSocket.emit('join-chat', {
        userId: user.id,
        userType: user.userType === 'freelancer' ? 'Freelancer' : 'Client'
      });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setConnectionStatus('disconnected');
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      setConnectionStatus('connected');
      newSocket.emit('join-chat', {
        userId: user.id,
        userType: user.userType === 'freelancer' ? 'Freelancer' : 'Client'
      });
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
      setConnectionStatus('disconnected');
    });

    newSocket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed');
      setConnectionStatus('disconnected');
    });

    newSocket.on('chat-joined', (data) => {
      console.log('Successfully joined chat:', data);
      loadConversations();
    });

    newSocket.on('new-message', (message) => {
      console.log('Received new message:', message);
      
      // Update messages if this is the active conversation
      if (activeConversation && message.chatRoomId === activeConversation._id) {
        setMessages(prev => {
          // Enhanced duplicate detection - check by ID and content
          const messageExists = prev.some(msg => 
            msg._id === message._id || 
            (msg.content === message.content && 
             msg.senderId._id === message.senderId._id &&
             Math.abs(new Date(msg.createdAt) - new Date(message.createdAt)) < 5000) // Within 5 seconds
          );
          
          if (messageExists) {
            console.log('Duplicate message detected, skipping');
            return prev;
          }
          
          // Remove any temporary messages and add the real message
          const filteredMessages = prev.filter(msg => !msg._id?.toString().startsWith('temp-'));
          return [...filteredMessages, message];
        });
        
        // Mark as read immediately for active conversation
        markMessagesAsRead(activeConversation._id);
      }
      
      // Update conversations list without full reload
      setConversations(prev => {
        const existingConvIndex = prev.findIndex(conv => conv._id === message.chatRoomId);
        
        if (existingConvIndex !== -1) {
          // Update existing conversation
          const updatedConversations = prev.map(conv =>
            conv._id === message.chatRoomId
              ? { 
                  ...conv, 
                  lastMessage: message, 
                  unreadCount: activeConversation?._id === message.chatRoomId ? 0 : (conv.unreadCount || 0) + 1
                }
              : conv
          );
          
          // Update total unread count
          const isActiveConversation = activeConversation?._id === message.chatRoomId;
          if (!isActiveConversation) {
            setUnreadCount(prev => prev + 1);
          }
          
          return sortConversations(updatedConversations);
        } else {
          // Conversation not found - silently ignore instead of reloading
          // This prevents disrupting the current chat view
          console.log('Message from unknown conversation, ignoring to prevent view disruption');
          return prev;
        }
      });
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
          msg.senderId._id === currentUser.id ? { ...msg, isRead: true } : msg
        ));
      }
    });

    newSocket.on('message-notification', (notification) => {
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
    let userId = currentUser.id;
    if (currentUser.userType === 'client' && clientId) userId = clientId;
    if (currentUser.userType === 'client' && !clientId) return;
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/chat/rooms?userId=${userId}&userType=${currentUser.userType === 'freelancer' ? 'Freelancer' : 'Client'}`);
      const data = await response.json();
      
      if (data.success) {
        const sorted = sortConversations(data.data.chatRooms);
        setConversations(sorted);
        const totalUnread = sorted.reduce((sum, room) => sum + (room.unreadCount || 0), 0);
        setUnreadCount(totalUnread);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  // Load messages for a conversation
  const loadMessages = async (chatRoomId) => {
    // Prevent loading if already loading or if no chatRoomId
    if (isLoading || !chatRoomId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/chat/messages/${chatRoomId}`);
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.data.messages || []);
        // Mark messages as read after loading them
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
      // Check if messages are already marked as read to avoid unnecessary API calls
      const conversation = conversations.find(conv => conv._id === chatRoomId);
      if (conversation && conversation.unreadCount === 0) {
        return; // Already marked as read
      }

      await fetch(`${process.env.REACT_APP_API_URL}/api/chat/messages/read/${chatRoomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          userType: currentUser.userType === 'freelancer' ? 'Freelancer' : 'Client'
        })
      });

      // Update local state using functional updates to avoid race conditions
      setConversations(prev => {
        const updatedConversations = prev.map(conv => 
          conv._id === chatRoomId ? { ...conv, unreadCount: 0 } : conv
        );
        
        // Calculate new total unread count
        const newTotalUnread = updatedConversations.reduce((sum, room) => sum + (room.unreadCount || 0), 0);
        setUnreadCount(newTotalUnread);
        
        return updatedConversations;
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Send message
  const sendMessage = () => {
    if (!newMessage.trim() || !activeConversation || !socket) return;

    const messageContent = newMessage.trim();
    
    // Create a temporary message object for optimistic UI
    const tempMessage = {
      _id: `temp-${Date.now()}-${Math.random()}`, // More unique ID to prevent conflicts
      senderId: { _id: currentUser.id },
      content: messageContent,
      createdAt: new Date().toISOString(),
      isRead: false,
      chatRoomId: activeConversation._id
    };

    // Add message to current chat
    setMessages(prev => [...prev, tempMessage]);

    // Update conversations list optimistically
    setConversations(prev => {
      const updatedConversations = prev.map(conv =>
        conv._id === activeConversation._id
          ? { ...conv, lastMessage: tempMessage, unreadCount: 0 }
          : conv
      );
      return sortConversations(updatedConversations);
    });

    // Send message via socket
    socket.emit('send-message', {
      chatRoomId: activeConversation._id,
      content: messageContent,
      messageType: 'text'
    });

    setNewMessage('');
    stopTyping();
    
    // Focus back on input
    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 0);
  };

  // Handle typing with debouncing
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (!isTyping && activeConversation && socket) {
      setIsTyping(true);
      socket.emit('typing-start', { chatRoomId: activeConversation._id });
    }

    // Clear existing timeout and set new one
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000); // Reduced from 3000ms to 2000ms for better responsiveness
  };

  const stopTyping = () => {
    if (isTyping && activeConversation && socket) {
      setIsTyping(false);
      socket.emit('typing-stop', { chatRoomId: activeConversation._id });
    }
    clearTimeout(typingTimeoutRef.current);
  };

  // Start new conversation - FIXED VERSION
  const startNewConversation = async (userId) => {
    // Prevent starting a conversation until clientId is available for clients
    if (currentUser.userType === 'client' && !clientId) {
      console.error('Client ID not loaded yet');
      return;
    }
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/chat/room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: currentUser.userType === 'client' ? clientId : userId,
          freelancerId: currentUser.userType === 'freelancer' ? currentUser.id : userId
        })
      });

      const data = await response.json();
      if (data.success) {
        const newChatRoom = data.data.chatRoom;
        
        // Set active conversation
        setActiveConversation(newChatRoom);
        setCurrentView('chat');
        
        // Join the room via socket
        if (socket) {
          socket.emit('join-room', { chatRoomId: newChatRoom._id });
        }
        
        // Load messages for this room
        await loadMessages(newChatRoom._id);
        
        // Ensure the conversation is in the list
        setConversations(prev => {
          const existingIndex = prev.findIndex(conv => conv._id === newChatRoom._id);
          if (existingIndex === -1) {
            // Add new conversation to the list
            const newConversation = {
              ...newChatRoom,
              lastMessage: null,
              unreadCount: 0
            };
            return sortConversations([newConversation, ...prev]);
          }
          return prev;
        });
        
        // Close the modal
        setShowNewConversation(false);
        
        // Focus on message input
        setTimeout(() => {
          messageInputRef.current?.focus();
        }, 100);
        
      } else {
        console.error('Failed to create chat room:', data.message);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  // Open conversation
  const openConversation = (conversation) => {
    // Prevent unnecessary state updates if already viewing this conversation
    if (activeConversation && activeConversation._id === conversation._id) {
      return;
    }

    setActiveConversation(conversation);
    setCurrentView('chat');
    
    if (socket) {
      socket.emit('join-room', { chatRoomId: conversation._id });
    }
    
    // Mark messages as read when opening conversation
    if (conversation.unreadCount > 0) {
      markMessagesAsRead(conversation._id);
    }
    
    loadMessages(conversation._id);
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeConversation]);

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
  // Fetch companyName for other users (clients/freelancers) and cache them
  useEffect(() => {
    const fetchUsers = async () => {
      const idsToFetch = conversations
        .map(conv => {
          const otherUser = getOtherUser(conv);
          return otherUser && otherUser._id;
        })
        .filter(Boolean);

      const uniqueIds = [...new Set(idsToFetch)];
      for (const id of uniqueIds) {
        if (!userCache[id]) {
          try {
            let res, userObj;
            if (currentUser.userType === 'freelancer') {
              res = await clientAPI.getClient(id);
              userObj = res.data;
            } else {
              res = await freelancerAPI.getFreelancer(id);
              userObj = res.data;
            }
            setUserCache(prev => ({ ...prev, [id]: userObj }));
          } catch (e) {
            // ignore error
          }
        }
      }
    };
    fetchUsers();
    // eslint-disable-next-line
  }, [conversations]);

  const filteredConversations = conversations.filter(conv => {
    const otherUser = getOtherUser(conv);
    const clientId = otherUser?._id;
    const companyName = clientId ? userCache[clientId]?.companyName || userCache[clientId]?.name || '' : '';
    // If freelancer, only show conversations with allowed clients
    if (currentUser?.userType === 'freelancer' && clientId) {
      if (!allowedClientIds.includes(clientId.toString())) return false;
    }
    // If client, only show conversations with allowed freelancers
    if (currentUser?.userType === 'client' && otherUser?._id) {
      if (!allowedFreelancerIds.includes(otherUser._id.toString())) return false;
    }
    return companyName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // const filteredConversations = conversations;

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

  // Load available users for new conversation
  const loadAvailableUsers = async () => {
    if (!currentUser) return;
    
    setLoadingUsers(true);
    try {
      const api = currentUser.userType === 'freelancer' ? clientAPI : freelancerAPI;
      const response = currentUser.userType === 'freelancer' 
        ? await api.getAllClients() 
        : await api.getAllFreelancers();
      
      // Filter out users who already have conversations
      const existingUserIds = conversations.map(conv => {
        const otherUser = getOtherUser(conv);
        return otherUser?._id;
      }).filter(Boolean);
      
      let availableUsersFiltered = (response.data || []).filter(user => 
        !existingUserIds.includes(user._id)
      );
      // If freelancer, only allow clients from allowedClientIds
      if (currentUser.userType === 'freelancer') {
        availableUsersFiltered = availableUsersFiltered.filter(user => 
          allowedClientIds.includes(user._id.toString())
        );
      }
      // If client, only allow freelancers from allowedFreelancerIds
      if (currentUser.userType === 'client') {
        availableUsersFiltered = availableUsersFiltered.filter(user => 
          allowedFreelancerIds.includes(user._id.toString())
        );
      }
      setAvailableUsers(availableUsersFiltered);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Helper to sort conversations by last message time
  const sortConversations = (convs) => {
    if (!convs || convs.length === 0) return [];
    
    return [...convs].sort((a, b) => {
      const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  };

  // Helper to get company name for a user
  const getCompanyName = (otherUser) => {
    if (!otherUser?._id) return '';
    const cached = userCache[otherUser._id];
    return cached?.companyName || cached?.name || otherUser.companyName || otherUser.name || 'Unknown';
  };

  // Add helper for profile photo:
  const getProfilePhoto = (otherUser) => {
    if (!otherUser?._id) return '/default-avatar.png';
    const cached = userCache[otherUser._id];
    return cached?.profilePhoto || cached?.profilePicture || otherUser.profilePhoto || otherUser.profilePicture || '/default-avatar.png';
  };

  // Handle back button from chat to conversations
  const handleBackToConversations = () => {
    setCurrentView('conversations');
    setActiveConversation(null);
    setMessages([]);
    setTypingUsers([]);
    setNewMessage('');
    // Reload conversations to get latest state
    setTimeout(() => loadConversations(), 100);
  };

  // After all hooks, check for user
  const userExists = !!localStorage.getItem('user');

  // Add this effect to listen for open-chat-with-user events
  useEffect(() => {
    const handler = (e) => {
      const { userId } = e.detail || {};
      if (!userId || !currentUser) return;
      setIsOpen(true);
      // Try to find an existing conversation with this user
      let foundConv = null;
      for (const conv of conversations) {
        const otherUser = getOtherUser(conv);
        if (otherUser && otherUser._id === userId) {
          foundConv = conv;
          break;
        }
      }
      if (foundConv) {
        openConversation(foundConv);
      } else {
        // Start a new conversation if not found
        startNewConversation(userId);
      }
    };
    window.addEventListener('open-chat-with-user', handler);
    return () => window.removeEventListener('open-chat-with-user', handler);
  }, [conversations, currentUser, clientId, socket]);

  // Poll for new messages and conversations
  const pollForUpdates = async () => {
    if (!currentUser || !isOpen) return;
    
    try {
      // Only poll conversations if we're in conversations view or if socket is disconnected
      if (currentView === 'conversations' || connectionStatus !== 'connected') {
        await loadConversations();
      }
      
      // Poll for new messages in active conversation
      if (activeConversation && connectionStatus !== 'connected') {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/chat/messages/${activeConversation._id}?since=${lastPollTime}`);
        const data = await response.json();
        
        if (data.success && data.data.messages) {
          const newMessages = data.data.messages.filter(msg => 
            new Date(msg.createdAt).getTime() > lastPollTime
          );
          
          if (newMessages.length > 0) {
            setMessages(prev => {
              const existingIds = new Set(prev.map(msg => msg._id));
              const uniqueNewMessages = newMessages.filter(msg => !existingIds.has(msg._id));
              return [...prev, ...uniqueNewMessages];
            });
            
            // Mark as read
            markMessagesAsRead(activeConversation._id);
          }
        }
      }
      
      setLastPollTime(Date.now());
    } catch (error) {
      console.error('Error polling for updates:', error);
      // If polling fails, try to reconnect socket
      if (socket && connectionStatus === 'disconnected') {
        socket.connect();
      }
    }
  };

  // Set up polling interval
  useEffect(() => {
    if (currentUser && isOpen) {
      // Only poll if socket is disconnected or as a backup
      const shouldPoll = connectionStatus !== 'connected';
      const interval = setInterval(pollForUpdates, shouldPoll ? 2000 : 10000); // Poll every 2s if disconnected, 10s as backup
      setPollingInterval(interval);
      
      return () => {
        clearInterval(interval);
        setPollingInterval(null);
      };
    }
  }, [currentUser, isOpen, connectionStatus]);

  if (!userExists) return null;

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
                  onClick={handleBackToConversations}
                  className="back-button"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              {currentView === 'chat' && getOtherUser(activeConversation) && (
                <>
                  <img
                    src={getProfilePhoto(getOtherUser(activeConversation))}
                    alt={getCompanyName(getOtherUser(activeConversation))}
                    className="user-avatar user-avatar-header"
                    style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', marginRight: 8 }}
                  />
                  <span className="header-title" style={{ fontWeight: 600 }}>
                    {getCompanyName(getOtherUser(activeConversation))}
                  </span>
                </>
              )}
              {currentView === 'conversations' && (
                <h3 className="header-title">Messages</h3>
              )}
              {connectionStatus !== 'connected' && (
                <div className={`connection-status ${connectionStatus}`}>
                  {connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
                </div>
              )}
            </div>
            <div className="header-right">
              {currentView === 'chat' && (
                <>
                  <button
                    onClick={() => {
                      if (activeConversation) {
                        loadMessages(activeConversation._id);
                      }
                    }}
                    className="refresh-button"
                    title="Refresh messages"
                  >
                    <RefreshCw size={18} />
                  </button>
                </>
              )}
              {currentView === 'conversations' && (
                <button
                  onClick={() => {
                    loadConversations();
                    setLastPollTime(Date.now());
                  }}
                  className="refresh-button"
                  title="Refresh conversations"
                >
                  <RefreshCw size={18} />
                </button>
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
                              src={getProfilePhoto(otherUser)}
                              alt={getCompanyName(otherUser)}
                              className="user-avatar"
                            />
                            {onlineUsers.has(otherUser._id) && (
                              <div className="online-indicator"></div>
                            )}
                          </div>
                          <div className="conversation-info">
                            <div className="conversation-header">
                              <p className="user-name">{getCompanyName(otherUser)}</p>
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
                  <p>No new users available</p>
                  <p className="empty-subtitle">All available users already have conversations</p>
                </div>
              ) : (
                <div className="users-list">
                  {availableUsers.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => startNewConversation(user._id)}
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