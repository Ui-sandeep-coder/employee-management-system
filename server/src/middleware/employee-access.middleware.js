
const pool = require("../config/db");

const authorizeEmployeeAccess = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;

    // Admin aur HR ko employee profiles access karne ki permission hai.
    if (role === "admin" || role === "hr") {
      return next();
    }

    // Employee profile ID validate karo.
    const employeeId = Number(req.params.id);

    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      return res.status(400).json({
        status: "error",
        message: "Invalid employee ID",
      });
    }

    // Check karo ki profile isi logged-in employee ki hai.
    const result = await pool.query(
      "SELECT user_id FROM employees WHERE id = $1",
      [employeeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Employee not found",
      });
    }

    if (result.rows[0].user_id !== userId) {
      return res.status(403).json({
        status: "error",
        message: "You can only access your own employee profile",
      });
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = authorizeEmployeeAccess;
