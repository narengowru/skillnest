// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Chat Room Routes
router.post('/room', chatController.getOrCreateChatRoom);
router.get('/rooms', chatController.getChatRooms);
router.get('/room/:chatRoomId', chatController.getChatRoom);

// Message Routes
router.get('/messages/:chatRoomId', chatController.getMessages);
router.put('/messages/read/:chatRoomId', chatController.markMessagesAsRead);
router.delete('/message/:messageId', chatController.deleteMessage);
router.get('/messages/search/:chatRoomId', chatController.searchMessages);

// Online Users
router.get('/online-users', chatController.getOnlineUsers);

module.exports = router;