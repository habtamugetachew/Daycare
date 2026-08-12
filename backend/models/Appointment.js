const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Appointment title is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    type: {
      type: String,
      enum: ['parent-teacher-meeting', 'school-visit', 'enrollment-tour', 'health-checkup', 'other'],
      default: 'parent-teacher-meeting'
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    withUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Child',
      default: null
    },
    scheduledAt: {
      type: Date,
      required: [true, 'Scheduled date and time is required']
    },
    duration: {
      type: Number,
      default: 30  // minutes
    },
    location: {
      type: String,
      trim: true,
      default: 'Main Office'
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending'
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
