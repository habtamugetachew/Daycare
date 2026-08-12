const Meal = require('../models/Meal');

// @desc    Get all meals
// @route   GET /api/meals
// @access  Private
const getMeals = async (req, res) => {
  try {
    const { date, type } = req.query;
    let query = {};
    if (date) query.date = date;
    if (type) query.type = type;

    const meals = await Meal.find(query)
      .populate('createdBy', 'fullName')
      .sort({ date: -1, time: 1 });

    res.status(200).json({ success: true, count: meals.length, data: meals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create meal
// @route   POST /api/meals
// @access  Private (admin, staff)
const createMeal = async (req, res) => {
  try {
    const meal = await Meal.create({ ...req.body, createdBy: req.user._id });
    const populated = await Meal.findById(meal._id).populate('createdBy', 'fullName');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update meal
// @route   PUT /api/meals/:id
// @access  Private (admin, staff)
const updateMeal = async (req, res) => {
  try {
    const meal = await Meal.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('createdBy', 'fullName');

    if (!meal) {
      return res.status(404).json({ success: false, message: 'Meal not found' });
    }

    res.status(200).json({ success: true, data: meal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete meal
// @route   DELETE /api/meals/:id
// @access  Private (admin, staff)
const deleteMeal = async (req, res) => {
  try {
    const meal = await Meal.findByIdAndDelete(req.params.id);
    if (!meal) {
      return res.status(404).json({ success: false, message: 'Meal not found' });
    }
    res.status(200).json({ success: true, message: 'Meal deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getMeals, createMeal, updateMeal, deleteMeal };
