const jwt = require('jsonwebtoken');

// Signs a JWT embedding only the user's id and role. Controllers look
// up the full user by id on each request (see middleware/auth.js) so
// the token itself stays small and nothing sensitive sits inside it.
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = generateToken;
