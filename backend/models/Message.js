const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    subject: {
      type: String,
      trim: true,
      default: 'No Subject'
    },
    body: {
      type: String,
      required: [true, 'Message body is required'],
      trim: true
    },
    relatedChild: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Child',
      default: null
    },
    attachment: {
      fileName: { type: String },
      url: { type: String },
      mimeType: { type: String },
      size: { type: Number }
    },
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date,
      default: null
    },
    parentMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'urgent'],
      default: 'normal'
    },
    // Announcement broadcast metadata
    broadcastGroup: {
      type: String,
      enum: ['all', 'parents', 'teachers', 'staff', 'individual', null],
      default: null
    },
    broadcastCount: {
      type: Number,
      default: null
    },
    broadcastId: {
      // Groups all messages from the same broadcast together
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

// Mark as read
messageSchema.methods.markRead = async function () {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Message', messageSchema);
