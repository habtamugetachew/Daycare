const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Meal name is required'],
      trim: true
    },
    type: {
      type: String,
      enum: ['breakfast', 'lunch', 'snack', 'dinner'],
      required: true,
      default: 'lunch'
    },
    date: {
      type: String, // "YYYY-MM-DD" string for easy filtering
      required: true
    },
    time: {
      type: String,
      required: true
    },
    items: {
      type: String,
      required: true
    },
    allergies: {
      type: String,
      default: ''
    },
    notes: {
      type: String,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Meal', mealSchema);
