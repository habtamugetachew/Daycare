const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Child',
      required: true
    },
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      required: false
    },
    date: {
      type: Date,
      required: true,
      default: () => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      }
    },
    checkIn: {
      time: { type: Date, default: null },
      recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
    },
    checkOut: {
      time: { type: Date, default: null },
      recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'sick', 'authorized-absence'],
      default: 'absent'
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    napStart: {
      type: Date,
      default: null
    },
    napEnd: {
      type: Date,
      default: null
    },
    napQuality: {
      type: String,
      enum: ['good', 'fair', 'poor'],
      default: null
    }
  },
  { timestamps: true }
);

// Unique: one record per child per day
attendanceSchema.index({ child: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
