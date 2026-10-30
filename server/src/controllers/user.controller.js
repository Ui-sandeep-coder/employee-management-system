const pool = require("../config/db");
const bcrypt = require("bcryptjs");

// Create an HR account
async function createHR(req, res, next) {
  try {
    const { full_name, email, password } = req.body;

    if (
      typeof full_name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !full_name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        status: "error",
        message: "Full name, email and password are required",
      });
    }

    const normalizedName = full_name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (
      normalizedName.length > 100 ||
      normalizedEmail.length > 255
    ) {
      return res.status(400).json({
        status: "error",
        message: "Full name or email is too long",
      });
    }

    if (password.length < 12) {
      return res.status(400).json({
        status: "error",
        message: "Password must be at least 12 characters long",
      });
    }

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = $1",
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        status: "error",
        message: "A user with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, 'hr')
       RETURNING id, full_name, email, role, is_active, created_at`,
      [normalizedName, normalizedEmail, passwordHash]
    );

    return res.status(201).json({
      status: "success",
      message: "HR account created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        status: "error",
        message: "A user with this email already exists",
      });
    }

    next(error);
  }
}

// Create an Employee login account and profile together
async function createEmployee(req, res, next) {
  let client;
  let transactionStarted = false;

  try {
    const {
      full_name,
      email,
      password,
      phone,
      department,
      job_title,
      salary,
    } = req.body;

    // Step 1: Validate required fields
    if (
      typeof full_name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !full_name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        status: "error",
        message: "Full name, email and password are required",
      });
    }

    const normalizedName = full_name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (
      normalizedName.length > 100 ||
      normalizedEmail.length > 255
    ) {
      return res.status(400).json({
        status: "error",
        message: "Full name or email is too long",
      });
    }

    if (password.length < 12) {
      return res.status(400).json({
        status: "error",
        message: "Password must be at least 12 characters long",
      });
    }

    if (
      salary !== undefined &&
      salary !== null &&
      (typeof salary !== "number" ||
        !Number.isFinite(salary) ||
        salary < 0)
    ) {
      return res.status(400).json({
        status: "error",
        message: "Salary must be a non-negative number",
      });
    }

    // Step 2: Check for an existing login account
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = $1",
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        status: "error",
        message: "A user with this email already exists",
      });
    }

    // Step 3: Check for an existing employee profile
    const existingEmployee = await pool.query(
      "SELECT id FROM employees WHERE LOWER(email) = $1",
      [normalizedEmail]
    );

    if (existingEmployee.rows.length > 0) {
      return res.status(409).json({
        status: "error",
        message: "An employee with this email already exists",
      });
    }

    // Step 4: Start a database transaction
    client = await pool.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    // Step 5: Create the login account with employee role
    const passwordHash = await bcrypt.hash(password, 12);

    const userResult = await client.query(
      `INSERT INTO users
        (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, 'employee')
       RETURNING id, full_name, email, role, is_active`,
      [normalizedName, normalizedEmail, passwordHash]
    );

    const user = userResult.rows[0];

    // Step 6: Create the employee profile linked to that account
    const employeeResult = await client.query(
      `INSERT INTO employees
        (user_id, full_name, email, phone, department, job_title, salary)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, user_id, full_name, email, phone,
                 department, job_title, salary, joining_date, created_at`,
      [
        user.id,
        normalizedName,
        normalizedEmail,
        phone ?? null,
        department ?? null,
        job_title ?? null,
        salary ?? null,
      ]
    );

    // Step 7: Save both inserts together
    await client.query("COMMIT");
    transactionStarted = false;

    return res.status(201).json({
      status: "success",
      message: "Employee account and profile created successfully",
      data: {
        user,
        employee: employeeResult.rows[0],
      },
    });
  } catch (error) {
    if (client && transactionStarted) {
      await client.query("ROLLBACK");
    }

    if (error.code === "23505") {
      return res.status(409).json({
        status: "error",
        message: "An account or employee with this email already exists",
      });
    }

    next(error);
  } finally {
    if (client) {
      client.release();
    }
  }
}


async function resetUserPassword(req, res, next) {
  try {
    const userId = Number(req.params.id);
    const { password } = req.body;

    // Step 1: Validate user ID
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        status: "error",
        message: "Invalid user ID",
      });
    }

    // Step 2: Validate new password
    if (typeof password !== "string" || password.length < 12) {
      return res.status(400).json({
        status: "error",
        message: "Password must be at least 12 characters long",
      });
    }

    // Step 3: Hash the new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Step 4: Update the existing user's password
    const result = await pool.query(
      `UPDATE users
       SET password_hash = $1
       WHERE id = $2
       RETURNING id, full_name, email, role, is_active`,
      [passwordHash, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Password reset successfully",
      data: result.rows[0],
    });
  } catch (error) {
    return next(error);
  }
}


module.exports = {
  createHR,
  createEmployee,
  resetUserPassword,
};