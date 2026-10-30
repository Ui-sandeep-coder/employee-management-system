
const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        status: "error",
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find the user by email
    const result = await pool.query(
      `SELECT id, full_name, email, password_hash, role, is_active
       FROM users
       WHERE LOWER(email) = $1
       LIMIT 1`,
      [normalizedEmail]
    );

    const user = result.rows[0];

    // Use a generic message for invalid credentials
    if (!user || !user.is_active) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    // Compare submitted password with stored password hash
    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    // JWT secret must be configured in .env
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret || jwtSecret.length < 32) {
      throw new Error("JWT_SECRET must be configured with at least 32 characters");
    }

    // Create a token with user identity and role
    const token = jwt.sign(
      {
        role: user.role,
      },
      jwtSecret,
      {
        subject: String(user.id),
        expiresIn: "1h",
        issuer: "employee-management-system",
        audience: "employee-management-api",
      }
    );

    return res.status(200).json({
      status: "success",
      message: "Login successful",
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, role, is_active, created_at
       FROM users
       WHERE id = $1 AND is_active = TRUE`,
      [req.user.id]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "User account is unavailable",
      });
    }

    return res.status(200).json({
      status: "success",
      user,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { login, getMe };
