const Visitor = require('../models/Visitor');

// @desc    Get all visitors
// @route   GET /api/visitors
// @access  Private (admin, reception)
const getVisitors = async (req, res) => {
  try {
    const { status, date } = req.query;
    let query = {};

    if (status) query.status = status;
    if (date) {
      const d = new Date(date);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      query.checkIn = { $gte: start, $lt: end };
    }

    const visitors = await Visitor.find(query)
      .populate('visitingChild', 'firstName lastName')
      .populate('recordedBy', 'fullName')
      .sort({ checkIn: -1 });

    res.status(200).json({ success: true, count: visitors.length, data: visitors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Check in a visitor
// @route   POST /api/visitors/checkin
// @access  Private (admin, reception)
const checkInVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.create({
      ...req.body,
      checkIn: new Date(),
      status: 'checked-in',
      recordedBy: req.user._id
    });

    const populated = await Visitor.findById(visitor._id)
      .populate('visitingChild', 'firstName lastName')
      .populate('recordedBy', 'fullName');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Check out a visitor
// @route   PUT /api/visitors/:id/checkout
// @access  Private (admin, reception)
const checkOutVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.findByIdAndUpdate(
      req.params.id,
      { checkOut: new Date(), status: 'checked-out' },
      { new: true }
    )
      .populate('visitingChild', 'firstName lastName')
      .populate('recordedBy', 'fullName');

    if (!visitor) {
      return res.status(404).json({ success: false, message: 'Visitor record not found' });
    }

    res.status(200).json({ success: true, data: visitor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get today's visitors
// @route   GET /api/visitors/today
// @access  Private
const getTodayVisitors = async (req, res) => {
  try {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const visitors = await Visitor.find({ checkIn: { $gte: start, $lt: end } })
      .populate('visitingChild', 'firstName lastName')
      .populate('recordedBy', 'fullName')
      .sort({ checkIn: -1 });

    res.status(200).json({
      success: true,
      count: visitors.length,
      checkedIn: visitors.filter(v => v.status === 'checked-in').length,
      data: visitors
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getVisitors, checkInVisitor, checkOutVisitor, getTodayVisitors };
