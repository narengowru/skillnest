// socket/chatHandlers.js
const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');
const OnlineUser = require('../models/OnlineUser');
const Client = require('../models/Client');
const Freelancer = require('../models/Freelancer');

// Store active connections
const activeConnections = new Map();

const chatHandlers = (io, socket) => {
  
  // Handle user joining (authentication)
  socket.on('join-chat', async (data) => {
    try {
      const { userId, userType } = data;
      
      // Validate user exists
      const UserModel = userType === 'Client' ? Client : Freelancer;
      const user = await UserModel.findById(userId);
      
      if (!user) {
        socket.emit('error', { message: 'User not found' });
        return;
      }
      
      // Store user info in socket
      socket.userId = userId;
      socket.userType = userType;
      socket.userName = user.name;
      
      // Store connection
      activeConnections.set(userId, {
        socketId: socket.id,
        userType,
        userName: user.name
      });
      
      // Update online status
      await OnlineUser.findOneAndUpdate(
        { userId, userType },
        { 
          socketId: socket.id,
          isOnline: true,
          lastSeen: new Date()
        },
        { upsert: true }
      );
      
      // Join user to their personal room
      socket.join(`user_${userId}`);
      
      console.log(`${user.name} (${userType}) joined chat`);
      
      // Notify user of successful connection
      socket.emit('chat-joined', {
        message: 'Successfully joined chat',
        userId,
        userType
      });
      
    } catch (error) {
      console.error('Error in join-chat:', error);
      socket.emit('error', { message: 'Failed to join chat' });
    }
  });
  
  // Handle joining a specific chat room
  socket.on('join-room', async (data) => {
    try {
      const { chatRoomId } = data;
      
      // Verify chat room exists and user has access
      const chatRoom = await ChatRoom.findById(chatRoomId);
      if (!chatRoom) {
        socket.emit('error', { message: 'Chat room not found' });
        return;
      }
      
      // Check if user has access to this chat room
      const hasAccess = (
        (socket.userType === 'Client' && chatRoom.clientId.toString() === socket.userId) ||
        (socket.userType === 'Freelancer' && chatRoom.freelancerId.toString() === socket.userId)
      );
      
      if (!hasAccess) {
        socket.emit('error', { message: 'Access denied to this chat room' });
        return;
      }
      
      // Join the chat room
      socket.join(chatRoomId);
      socket.currentChatRoom = chatRoomId;
      
      // Notify others in the room
      socket.to(chatRoomId).emit('user-joined-room', {
        userId: socket.userId,
        userName: socket.userName,
        userType: socket.userType,
        timestamp: new Date()
      });
      
      console.log(`${socket.userName} joined room: ${chatRoomId}`);
      
    } catch (error) {
      console.error('Error in join-room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });
  
  // Handle sending messages
  socket.on('send-message', async (data) => {
    try {
      const { chatRoomId, content, messageType = 'text', fileUrl = null, fileName = null } = data;
      
      // Validate required fields
      if (!chatRoomId || !content) {
        socket.emit('error', { message: 'Chat room ID and content are required' });
        return;
      }
      
      // Get chat room and verify access
      const chatRoom = await ChatRoom.findById(chatRoomId);
      if (!chatRoom) {
        socket.emit('error', { message: 'Chat room not found' });
        return;
      }
      
      // Determine receiver
      const receiverId = socket.userType === 'Client' ? 
        chatRoom.freelancerId : chatRoom.clientId;
      const receiverType = socket.userType === 'Client' ? 'Freelancer' : 'Client';
      
      // Create message
      const message = new Message({
        senderId: socket.userId,
        senderType: socket.userType,
        receiverId,
        receiverType,
        chatRoomId,
        content,
        messageType,
        fileUrl,
        fileName
      });
      
      await message.save();
      
      // Populate sender info
      await message.populate([
        { path: 'senderId', select: 'name email profilePicture' },
        { path: 'receiverId', select: 'name email profilePicture' }
      ]);
      
      // Update chat room
      await ChatRoom.findByIdAndUpdate(chatRoomId, {
        lastMessage: message._id,
        lastActivity: new Date(),
        // Increment unread count for receiver
        ...(receiverType === 'Client' ? 
          { $inc: { clientUnreadCount: 1 } } : 
          { $inc: { freelancerUnreadCount: 1 } })
      });
      
      // Emit message to all users in the room
      io.to(chatRoomId).emit('new-message', {
        _id: message._id,
        senderId: message.senderId,
        senderType: message.senderType,
        receiverId: message.receiverId,
        receiverType: message.receiverType,
        chatRoomId: message.chatRoomId,
        content: message.content,
        messageType: message.messageType,
        fileUrl: message.fileUrl,
        fileName: message.fileName,
        createdAt: message.createdAt,
        isRead: message.isRead
      });
      
      // Send notification to receiver if they're online but not in the room
      const receiverConnection = activeConnections.get(receiverId.toString());
      if (receiverConnection) {
        const receiverSocketId = receiverConnection.socketId;
        const receiverSocket = io.sockets.sockets.get(receiverSocketId);
        
        if (receiverSocket && receiverSocket.currentChatRoom !== chatRoomId) {
          receiverSocket.emit('message-notification', {
            chatRoomId,
            senderName: socket.userName,
            senderType: socket.userType,
            content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
            timestamp: new Date()
          });
        }
      }
      
      console.log(`Message sent from ${socket.userName} to room ${chatRoomId}`);
      
    } catch (error) {
      console.error('Error in send-message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
  
  // Handle typing indicators
  socket.on('typing-start', (data) => {
    const { chatRoomId } = data;
    socket.to(chatRoomId).emit('user-typing', {
      userId: socket.userId,
      userName: socket.userName,
      userType: socket.userType,
      isTyping: true,
      timestamp: new Date()
    });
  });
  
  socket.on('typing-stop', (data) => {
    const { chatRoomId } = data;
    socket.to(chatRoomId).emit('user-typing', {
      userId: socket.userId,
      userName: socket.userName,
      userType: socket.userType,
      isTyping: false,
      timestamp: new Date()
    });
  });
  
  // Handle message read receipts
  socket.on('mark-messages-read', async (data) => {
    try {
      const { chatRoomId } = data;
      
      // Update messages as read
      await Message.updateMany(
        {
          chatRoomId,
          receiverId: socket.userId,
          receiverType: socket.userType,
          isRead: false
        },
        {
          isRead: true,
          readAt: new Date()
        }
      );
      
      // Reset unread count
      const updateField = socket.userType === 'Client' ? 
        { clientUnreadCount: 0 } : 
        { freelancerUnreadCount: 0 };
      
      await ChatRoom.findByIdAndUpdate(chatRoomId, updateField);
      
      // Notify sender about read receipt
      socket.to(chatRoomId).emit('messages-read', {
        readBy: socket.userId,
        readByName: socket.userName,
        readByType: socket.userType,
        chatRoomId,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Error marking messages as read:', error);
      socket.emit('error', { message: 'Failed to mark messages as read' });
    }
  });
  
  // Handle leaving a chat room
  socket.on('leave-room', (data) => {
    const { chatRoomId } = data;
    socket.leave(chatRoomId);
    
    // Notify others in the room
    socket.to(chatRoomId).emit('user-left-room', {
      userId: socket.userId,
      userName: socket.userName,
      userType: socket.userType,
      timestamp: new Date()
    });
    
    socket.currentChatRoom = null;
    console.log(`${socket.userName} left room: ${chatRoomId}`);
  });
  
  // Handle disconnection
  socket.on('disconnect', async () => {
    try {
      if (socket.userId) {
        // Update online status
        await OnlineUser.findOneAndUpdate(
          { userId: socket.userId, userType: socket.userType },
          {
            isOnline: false,
            lastSeen: new Date()
          }
        );
        
        // Remove from active connections
        activeConnections.delete(socket.userId);
        
        // Notify current room if user was in one
        if (socket.currentChatRoom) {
          socket.to(socket.currentChatRoom).emit('user-left-room', {
            userId: socket.userId,
            userName: socket.userName,
            userType: socket.userType,
            timestamp: new Date()
          });
        }
        
        console.log(`${socket.userName} (${socket.userType}) disconnected`);
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
  
  // Handle connection errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
};

module.exports = chatHandlers;