const Appointment = require('../models/Appointment');

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res) => {
  try {
    let query = {};

    // Regular users see only their own appointments
    if (!['admin', 'reception'].includes(req.user.role)) {
      query.$or = [{ requestedBy: req.user._id }, { withUser: req.user._id }];
    }

    const { status, from, to } = req.query;
    if (status) query.status = status;
    if (from || to) {
      query.scheduledAt = {};
      if (from) query.scheduledAt.$gte = new Date(from);
      if (to) query.scheduledAt.$lte = new Date(to);
    }

    const appointments = await Appointment.find(query)
      .populate('requestedBy', 'fullName email role')
      .populate('withUser', 'fullName email role')
      .populate('child', 'firstName lastName')
      .sort({ scheduledAt: 1 });

    res.status(200).json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
const getAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('requestedBy', 'fullName email role')
      .populate('withUser', 'fullName email role')
      .populate('child', 'firstName lastName');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create appointment
// @route   POST /api/appointments
// @access  Private
const createAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.create({
      ...req.body,
      requestedBy: req.user._id
    });

    const populated = await Appointment.findById(appointment._id)
      .populate('requestedBy', 'fullName email')
      .populate('withUser', 'fullName email')
      .populate('child', 'firstName lastName');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:id
// @access  Private
const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('requestedBy', 'fullName email')
      .populate('withUser', 'fullName email')
      .populate('child', 'firstName lastName');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private
const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    res.status(200).json({ success: true, message: 'Appointment cancelled' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get upcoming appointments
// @route   GET /api/appointments/upcoming
// @access  Private
const getUpcoming = async (req, res) => {
  try {
    let query = {
      scheduledAt: { $gte: new Date() },
      status: { $in: ['pending', 'confirmed'] }
    };

    if (!['admin', 'reception'].includes(req.user.role)) {
      query.$or = [{ requestedBy: req.user._id }, { withUser: req.user._id }];
    }

    const appointments = await Appointment.find(query)
      .populate('requestedBy', 'fullName email role')
      .populate('withUser', 'fullName email role')
      .populate('child', 'firstName lastName')
      .sort({ scheduledAt: 1 })
      .limit(10);

    res.status(200).json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAppointments, getAppointment, createAppointment, updateAppointment, deleteAppointment, getUpcoming };
