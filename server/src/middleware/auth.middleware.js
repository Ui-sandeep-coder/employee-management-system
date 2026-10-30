
const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  // Check whether the Authorization header exists
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      status: "error",
      message: "Authentication token is required",
    });
  }

  // Extract the token after "Bearer "
  const token = authHeader.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      status: "error",
      message: "Authentication token is required",
    });
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret || jwtSecret.length < 32) {
    return res.status(500).json({
      status: "error",
      message: "Authentication is not configured correctly",
    });
  }

  // Verify the token's signature, expiry, issuer and audience
  jwt.verify(
    token,
    jwtSecret,
    {
      issuer: "employee-management-system",
      audience: "employee-management-api",
    },
    (error, decoded) => {
      if (error) {
        return res.status(401).json({
          status: "error",
          message: "Invalid or expired authentication token",
        });
      }

      const userId = Number(decoded.sub);
      const allowedRoles = ["admin", "hr", "employee"];

      if (
        !Number.isSafeInteger(userId) ||
        userId <= 0 ||
        !allowedRoles.includes(decoded.role)
      ) {
        return res.status(401).json({
          status: "error",
          message: "Invalid authentication token",
        });
      }

      // Make the authenticated user's identity available to later handlers
      req.user = {
        id: userId,
        role: decoded.role,
      };

      next();
    }
  );
}

module.exports = authenticateToken;
