const User = require('../models/user');
const Booking = require('../models/booking');

exports.getTotalBookingsTodayForUser = async (req, res) => {
    try {
      const authenticatedUser = req.user;
      const userId = authenticatedUser._id;
  
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to the beginning of the day
  
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1); // Set to the beginning of the next day
  
      // Convert today and tomorrow to strings in the format "YYYY-MM-DD"
      const todayString = today.toISOString().split('T')[0];
      const tomorrowString = tomorrow.toISOString().split('T')[0];
  
      const totalBookingsToday = await Booking.countDocuments({
        userId,
        bookingDate: tomorrowString
      });
  
      res.json({ totalBookingsToday });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Something went wrong' });
    }
};
  

exports.getTotalBookingsThisWeekForUser = async (req, res) => {
    try {
      const authenticatedUser = req.user;
      const userId = authenticatedUser._id;
  
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setHours(0, 0, 0, 0);
      startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
  
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 7);
  
      const totalBookingsThisWeek = await Booking.countDocuments({
        userId,
        createdAt: { $gte: startOfWeek, $lt: endOfWeek }
      });
  
      res.json({ totalBookingsThisWeek });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Something went wrong' });
    }
};

exports.getTotalBookingsThisMonthForUser = async (req, res) => {
    try {
      const authenticatedUser = req.user;
      const userId = authenticatedUser._id;
  
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
      const totalBookingsThisMonth = await Booking.countDocuments({
        userId,
        createdAt: { $gte: startOfMonth, $lt: endOfMonth }
      });
  
      res.json({ totalBookingsThisMonth });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Something went wrong' });
    }
  };
  
  
  
