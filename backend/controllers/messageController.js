const Message = require('../models/Message');
const crypto = require('crypto');

// @desc    Get inbox messages
// @route   GET /api/messages/inbox
// @access  Private
const getInbox = async (req, res) => {
  try {
    const messages = await Message.find({ recipient: req.user._id, parentMessage: null })
      .populate('sender', 'fullName role')
      .populate('relatedChild', 'firstName lastName')
      .sort({ updatedAt: -1 })
      .lean();

    for (let msg of messages) {
      const latestReply = await Message.findOne({ parentMessage: msg._id })
        .sort({ createdAt: -1 })
        .lean();
      if (latestReply) {
        msg.latestMessageBody = latestReply.body;
        msg.latestMessageCreatedAt = latestReply.createdAt;
      }
    }

    const unreadCount = messages.filter(m => !m.isRead).length;
    res.status(200).json({ success: true, count: messages.length, unreadCount, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get sent messages
// @route   GET /api/messages/sent
// @access  Private
const getSent = async (req, res) => {
  try {
    const messages = await Message.find({ sender: req.user._id, parentMessage: null })
      .populate('recipient', 'fullName role')
      .populate('relatedChild', 'firstName lastName')
      .sort({ updatedAt: -1 })
      .lean();

    for (let msg of messages) {
      const latestReply = await Message.findOne({ parentMessage: msg._id })
        .sort({ createdAt: -1 })
        .lean();
      if (latestReply) {
        msg.latestMessageBody = latestReply.body;
        msg.latestMessageCreatedAt = latestReply.createdAt;
      }
    }

    res.status(200).json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get message thread (replies)
// @route   GET /api/messages/:id/thread
// @access  Private
const getThread = async (req, res) => {
  try {
    const parent = await Message.findById(req.params.id)
      .populate('sender', 'fullName role')
      .populate('recipient', 'fullName role')
      .populate('relatedChild', 'firstName lastName');

    if (!parent) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const replies = await Message.find({ parentMessage: req.params.id })
      .populate('sender', 'fullName role')
      .populate('recipient', 'fullName role')
      .sort({ createdAt: 1 });

    // Mark parent as read
    if (parent.recipient._id.toString() === req.user._id.toString() && !parent.isRead) {
      await parent.markRead();
    }

    res.status(200).json({ success: true, data: { parent, replies } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send a new message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { recipientId, subject, body, relatedChild, priority, parentMessageId, broadcastGroup, broadcastCount, broadcastId } = req.body;

    const messageData = {
      sender: req.user._id,
      recipient: recipientId,
      subject: subject || 'No Subject',
      body,
      relatedChild: relatedChild || null,
      priority: priority || 'normal',
      parentMessage: parentMessageId || null,
      broadcastGroup: broadcastGroup || null,
      broadcastCount: broadcastCount ? Number(broadcastCount) : null,
      broadcastId: broadcastId || null
    };

    if (req.file) {
      messageData.attachment = {
        fileName: req.file.originalname,
        url: `/uploads/messages/${req.file.filename}`,
        mimeType: req.file.mimetype,
        size: req.file.size
      };
    }

    const message = await Message.create(messageData);
    const populated = await Message.findById(message._id)
      .populate('sender', 'fullName role')
      .populate('recipient', 'fullName role')
      .populate('relatedChild', 'firstName lastName');

    // Update the parent's updatedAt so it jumps to the top of recent chats
    if (parentMessageId) {
      await Message.findByIdAndUpdate(
        parentMessageId,
        { $set: { updatedAt: new Date() } },
        { timestamps: false }
      );
    }

    // Emit Socket.io event if recipient is online
    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers');
    if (io && connectedUsers && recipientId) {
      const recipientSocketId = connectedUsers.get(recipientId.toString());
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('newMessage', populated);
      }
    }

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get announcements sent by the current user (grouped by broadcastId)
// @route   GET /api/messages/announcements
// @access  Private (admin/teacher)
const getAnnouncements = async (req, res) => {
  try {
    // Fetch all sent messages that are announcements (subject starts with [Announcement])
    const messages = await Message.find({
      sender: req.user._id,
      subject: { $regex: /^\[Announcement\]/ },
      parentMessage: null
    })
      .populate('sender', 'fullName role')
      .populate('recipient', 'fullName role')
      .sort({ createdAt: -1 });

    // Group by broadcastId; fall back to grouping by subject+timestamp-window for legacy messages
    const grouped = new Map();

    messages.forEach(msg => {
      const key = msg.broadcastId || `${msg.subject}__${Math.floor(new Date(msg.createdAt).getTime() / 5000)}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          _id: msg._id,
          broadcastId: msg.broadcastId || key,
          subject: msg.subject,
          body: msg.body,
          sender: msg.sender,
          priority: msg.priority,
          broadcastGroup: msg.broadcastGroup,
          broadcastCount: msg.broadcastCount,
          createdAt: msg.createdAt,
          recipients: []
        });
      }
      grouped.get(key).recipients.push(msg.recipient);
    });

    const announcements = Array.from(grouped.values()).map(a => ({
      ...a,
      // If broadcastCount was stored use it; otherwise count recipients in this group
      broadcastCount: a.broadcastCount || a.recipients.length
    }));

    res.status(200).json({ success: true, count: announcements.length, data: announcements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark message as read
// @route   PUT /api/messages/:id/read
// @access  Private
const markRead = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    await message.markRead();
    res.status(200).json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Private
const deleteMessage = async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    // Also delete replies
    await Message.deleteMany({ parentMessage: req.params.id });
    res.status(200).json({ success: true, message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get unread count
// @route   GET /api/messages/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({ recipient: req.user._id, isRead: false });
    res.status(200).json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getInbox, getSent, getThread, sendMessage, markRead, deleteMessage, getUnreadCount, getAnnouncements };

module.exports = { getInbox, getSent, getThread, sendMessage, markRead, deleteMessage, getUnreadCount, getAnnouncements };

module.exports = { getInbox, getSent, getThread, sendMessage, markRead, deleteMessage, getUnreadCount, getAnnouncements };

module.exports = { getInbox, getSent, getThread, sendMessage, markRead, deleteMessage, getUnreadCount, getAnnouncements };
