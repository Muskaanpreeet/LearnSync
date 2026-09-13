const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// protect(): verifies the JWT on every request to a private route.
// This is the ONE place backend auth is enforced — the frontend's
// route guards (see client/src/routes) only control what's shown in
// the UI; they never substitute for this check. A request can only
// reach a controller if this middleware calls next().
const protect = asyncHandler(async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id);
  if (!user) {
    res.status(401);
    throw new Error('Not authorized, user no longer exists');
  }
  if (!user.isActive) {
    res.status(403);
    throw new Error('This account has been deactivated. Contact an administrator.');
  }

  req.user = user; // attach the authenticated user to the request
  next();
});

// authorize('admin', 'teacher'): restricts a route to specific roles.
// Used AFTER protect(), e.g. router.post('/', protect, authorize('admin'), createCourse)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Role '${req.user ? req.user.role : 'unknown'}' is not authorized to access this resource`);
    }
    next();
  };
};

module.exports = { protect, authorize };
