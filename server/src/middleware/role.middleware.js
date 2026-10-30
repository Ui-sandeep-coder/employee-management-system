
function requireRole(...allowedRoles) {
  return function (req, res, next) {
    // Step 1: Check whether authentication ran first
    if (!req.user) {
      return res.status(401).json({
        status: "error",
        message: "Authentication is required",
      });
    }

    // Step 2: Check whether the user's role is allowed
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: "error",
        message: "You do not have permission to perform this action",
      });
    }

    // Step 3: Permission check passed
    next();
  };
}

module.exports = requireRole;
