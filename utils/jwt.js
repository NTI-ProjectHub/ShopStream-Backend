const jwt = require('jsonwebtoken');

const refreshSecret = process.env.JWT_REFRESH_SECRET || 'your_secret_key';
const accessSecret = process.env.JWT_ACCESS_SECRET || 'your_secret_key';
const resetSecret = process.env.JWT_RESET_SECRET || 'your_secret_key';

exports.generateRefreshToken = function (user) {
  return generateToken(user, refreshSecret, '7d');
};

exports.generateAccessToken = function (user) {
  return generateToken(user, accessSecret, '1h');
};

exports.generateResetToken = function (user) {
  return generateToken(user, resetSecret, '1h');
};

exports.verifyToken = function (token, type) {
  if (type === 'reset') {
    return jwt.verify(token, resetSecret);
  } else if (type === 'access') {
    return jwt.verify(token, accessSecret);
  } else if (type === 'refresh') {
    return jwt.verify(token, refreshSecret);
  } else {
    throw new Error('Invalid token type');
  }
};

function generateToken(user, secret, expiresIn) {
  return jwt.sign(
    { id: user.id, role: user.role , restaurantId: user.restaurantId || null },
    secret,
    {expiresIn}
)};

exports.checkExpiry = function (token) {
  const payload = jwt.decode(token);
  const now = Math.floor(Date.now() / 1000); // Current time in seconds (by default milliseconds)
  return payload.exp <= now; // Check if the token has expired
}