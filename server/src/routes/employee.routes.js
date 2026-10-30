
const express = require("express");

const {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  getMyProfile,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/employee.controller");

const authenticateToken = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");
const authorizeEmployeeAccess = require(
  "../middleware/employee-access.middleware"
);

const router = express.Router();

// GET /api/v1/employees - Admin and HR
router.get(
  "/",
  authenticateToken,
  requireRole("admin", "hr"),
  getAllEmployees
);

// GET /api/v1/employees/me - Logged-in employee's own profile
router.get(
  "/me",
  authenticateToken,
  requireRole("employee"),
  getMyProfile
);

// GET /api/v1/employees/:id - Admin and HR
router.get(
  "/:id",
  authenticateToken,
  requireRole("admin", "hr", "employee"),
  authorizeEmployeeAccess,
  getEmployeeById
);

// PATCH /api/v1/employees/:id - Admin and HR
router.patch(
  "/:id",
  authenticateToken,
  requireRole("admin", "hr", "employee"),
  authorizeEmployeeAccess,
  updateEmployee
);

// DELETE /api/v1/employees/:id - Admin only
router.delete(
  "/:id",
  authenticateToken,
  requireRole("admin"),
  deleteEmployee
);

// POST /api/v1/employees - Admin and HR
router.post(
  "/",
  authenticateToken,
  requireRole("admin", "hr"),
  createEmployee
);

module.exports = router;
