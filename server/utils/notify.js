const Notification = require('../models/Notification');

// Called from other controllers at the moment something notification-
// worthy happens (a published assignment, a graded submission, a new
// announcement, etc.) — never on a schedule. One bulk insert covers
// notifying a whole class at once. Failures are swallowed (logged,
// not thrown) so a notification glitch never blocks the actual
// action the user was performing (creating the assignment still
// succeeds even if this fails).
const notifyUsers = async (userIds, { type, title, message, link = '' }) => {
  if (!userIds || userIds.length === 0) return;
  try {
    const docs = userIds.map((recipient) => ({ recipient, type, title, message, link }));
    await Notification.insertMany(docs);
  } catch (err) {
    console.error('Failed to create notifications:', err.message);
  }
};

module.exports = { notifyUsers };
