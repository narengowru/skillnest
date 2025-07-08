// controllers/chatController.js
const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');
const OnlineUser = require('../models/OnlineUser');
const Client = require('../models/Client');
const Freelancer = require('../models/Freelancer');

// Get or create chat room between client and freelancer
exports.getOrCreateChatRoom = async (req, res) => {
  try {
    const { clientId, freelancerId, jobId = null, orderId = null } = req.body;
    console.log('clientId', clientId);
    // Validate that both users exist
    const [client, freelancer] = await Promise.all([
      Client.findById(clientId),
      Freelancer.findById(freelancerId)
    ]);

    if (!client) {
      return res.status(404).json({ 
        success: false, 
        message: 'Client not found' 
      });
    }

    if (!freelancer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Freelancer not found' 
      });
    }

    // Check if chat room already exists
    let chatRoom = await ChatRoom.findOne({
      clientId,
      freelancerId
    }).populate([
      { path: 'clientId', select: 'name email profilePicture' },
      { path: 'freelancerId', select: 'name email profilePicture skills' },
      { path: 'lastMessage', select: 'content messageType createdAt' }
    ]);

    if (!chatRoom) {
      // Create new chat room
      chatRoom = new ChatRoom({
        clientId,
        freelancerId,
        jobId,
        orderId
      });

      await chatRoom.save();
      
      // Populate the newly created chat room
      chatRoom = await ChatRoom.findById(chatRoom._id).populate([
        { path: 'clientId', select: 'name email profilePicture' },
        { path: 'freelancerId', select: 'name email profilePicture skills' },
        { path: 'lastMessage', select: 'content messageType createdAt' }
      ]);
    }

    res.status(200).json({
      success: true,
      message: 'Chat room retrieved successfully',
      data: { chatRoom }
    });

  } catch (error) {
    console.error('Error in getOrCreateChatRoom:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get chat rooms for a user
exports.getChatRooms = async (req, res) => {
  try {
    const { userId, userType } = req.query;

    if (!userId || !userType) {
      return res.status(400).json({
        success: false,
        message: 'userId and userType are required'
      });
    }

    const query = userType === 'Client' ? 
      { clientId: userId } : 
      { freelancerId: userId };

    const chatRooms = await ChatRoom.find(query)
      .populate([
        { path: 'clientId', select: 'name email profilePicture' },
        { path: 'freelancerId', select: 'name email profilePicture skills' },
        { path: 'lastMessage', select: 'content messageType createdAt senderId senderType' }
      ])
      .sort({ lastActivity: -1 });

    // Get online status for each user
    const chatRoomsWithStatus = await Promise.all(
      chatRooms.map(async (room) => {
        const otherUserId = userType === 'Client' ? room.freelancerId._id : room.clientId._id;
        const otherUserType = userType === 'Client' ? 'Freelancer' : 'Client';
        
        const onlineUser = await OnlineUser.findOne({
          userId: otherUserId,
          userType: otherUserType
        });

        return {
          ...room.toObject(),
          otherUserOnline: onlineUser?.isOnline || false,
          otherUserLastSeen: onlineUser?.lastSeen || null,
          unreadCount: userType === 'Client' ? room.clientUnreadCount : room.freelancerUnreadCount
        };
      })
    );

    res.status(200).json({
      success: true,
      message: 'Chat rooms retrieved successfully',
      data: { chatRooms: chatRoomsWithStatus }
    });

  } catch (error) {
    console.error('Error in getChatRooms:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get messages for a chat room
exports.getMessages = async (req, res) => {
  try {
    const { chatRoomId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const chatRoom = await ChatRoom.findById(chatRoomId);
    if (!chatRoom) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found'
      });
    }

    const messages = await Message.find({
      chatRoomId,
      isDeleted: false
    })
      .populate([
        { path: 'senderId', select: 'name email profilePicture' },
        { path: 'receiverId', select: 'name email profilePicture' }
      ])
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.status(200).json({
      success: true,
      message: 'Messages retrieved successfully',
      data: { 
        messages: messages.reverse(),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: messages.length === parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error in getMessages:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Mark messages as read
exports.markMessagesAsRead = async (req, res) => {
  try {
    const { chatRoomId } = req.params;
    const { userId, userType } = req.body;

    const chatRoom = await ChatRoom.findById(chatRoomId);
    if (!chatRoom) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found'
      });
    }

    // Mark unread messages as read
    await Message.updateMany(
      {
        chatRoomId,
        receiverId: userId,
        receiverType: userType,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    // Reset unread count for the user
    const updateField = userType === 'Client' ? 
      { clientUnreadCount: 0 } : 
      { freelancerUnreadCount: 0 };

    await ChatRoom.findByIdAndUpdate(chatRoomId, updateField);

    res.status(200).json({
      success: true,
      message: 'Messages marked as read'
    });

  } catch (error) {
    console.error('Error in markMessagesAsRead:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId, userType } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user owns the message
    if (message.senderId.toString() !== userId || message.senderType !== userType) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }

    // Soft delete the message
    await Message.findByIdAndUpdate(messageId, {
      isDeleted: true,
      deletedAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Error in deleteMessage:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get online users
exports.getOnlineUsers = async (req, res) => {
  try {
    const onlineUsers = await OnlineUser.find({ isOnline: true })
      .populate('userId', 'name email profilePicture')
      .sort({ lastSeen: -1 });

    res.status(200).json({
      success: true,
      message: 'Online users retrieved successfully',
      data: { onlineUsers }
    });

  } catch (error) {
    console.error('Error in getOnlineUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get chat room by ID
exports.getChatRoom = async (req, res) => {
  try {
    const { chatRoomId } = req.params;

    const chatRoom = await ChatRoom.findById(chatRoomId)
      .populate([
        { path: 'clientId', select: 'name email profilePicture' },
        { path: 'freelancerId', select: 'name email profilePicture skills' },
        { path: 'lastMessage', select: 'content messageType createdAt' }
      ]);

    if (!chatRoom) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Chat room retrieved successfully',
      data: { chatRoom }
    });

  } catch (error) {
    console.error('Error in getChatRoom:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Search messages
exports.searchMessages = async (req, res) => {
  try {
    const { chatRoomId } = req.params;
    const { query, page = 1, limit = 20 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const messages = await Message.find({
      chatRoomId,
      content: { $regex: query, $options: 'i' },
      isDeleted: false
    })
      .populate([
        { path: 'senderId', select: 'name email profilePicture' },
        { path: 'receiverId', select: 'name email profilePicture' }
      ])
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.status(200).json({
      success: true,
      message: 'Messages found successfully',
      data: { 
        messages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: messages.length === parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error in searchMessages:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};