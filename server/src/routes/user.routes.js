const express = require("express");

const {
  createHR,
  getHRList,
  createEmployee,
  resetUserPassword
} = require("../controllers/user.controller");

const authenticateToken = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");

const router = express.Router();

// Only Admin can create HR accounts
router.post(
  "/hr",
  authenticateToken,
  requireRole("admin"),
  createHR
);

// Only Admin can view HR accounts
router.get(
  "/hr",
  authenticateToken,
  requireRole("admin"),
  getHRList
);

// Admin and HR can create Employee accounts
router.post(
  "/employee",
  authenticateToken,
  requireRole("admin", "hr"),
  createEmployee
);

// Only Admin can reset an HR password
router.patch(
  "/hr/:id/password",
  authenticateToken,
  requireRole("admin"),
  resetUserPassword
);

module.exports = router;