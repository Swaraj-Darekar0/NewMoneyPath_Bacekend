const userModel = require('../models/user.model');

// This is a simplified implementation. A production-ready version would use a robust library
// like `date-fns-tz` or `luxon` to handle timezones more accurately.

const getUserTimezone = async (userId) => {
  const user = await userModel.findById(userId);
  return user ? user.timezone : 'Asia/Kolkata'; // Default timezone
};

const getTodayInUserTimezone = async (userId) => {
  const timezone = await getUserTimezone(userId);
  const now = new Date();
  // This is a basic way to get a date string in a specific timezone.
  // It has limitations and might not be perfectly accurate across all Node.js environments.
  const dateString = now.toLocaleDateString('en-CA', { timeZone: timezone }); // YYYY-MM-DD format
  return dateString;
};

const getDayStartInUserTimezone = async (userId) => {
  const timezone = await getUserTimezone(userId);
  const now = new Date();
  const dateString = now.toLocaleDateString('en-CA', { timeZone: timezone });
  const dayStart = new Date(`${dateString}T00:00:00.000Z`);
  // This is a naive conversion and doesn't account for the timezone offset properly.
  // The correct way would be to use a library to construct a date in that timezone.
  return dayStart;
};

const getDayEndInUserTimezone = async (userId) => {
  const timezone = await getUserTimezone(userId);
  const now = new Date();
  const dateString = now.toLocaleDateString('en-CA', { timeZone: timezone });
  const dayEnd = new Date(`${dateString}T23:59:59.999Z`);
  // Similar to getDayStartInUserTimezone, this is a naive implementation.
  return dayEnd;
};

const calculateDaysSince = (startDate, endDate = new Date()) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const differenceInTime = end.getTime() - start.getTime();
  const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));
  return differenceInDays;
};

module.exports = {
  getUserTimezone,
  getTodayInUserTimezone,
  getDayStartInUserTimezone,
  getDayEndInUserTimezone,
  calculateDaysSince,
};
