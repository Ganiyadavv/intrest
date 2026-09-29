const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    return next();
  }
  return res.status(403).json({
    statusCode: 403,
    status: "ERROR",
    message: "Admin access required"
  });
};

module.exports = adminMiddleware;
