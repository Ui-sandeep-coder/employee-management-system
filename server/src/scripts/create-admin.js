
const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "../../.env"),
});

const bcrypt = require("bcryptjs");
const pool = require("../config/db");

async function createAdmin() {
  try {
    const fullName = process.env.ADMIN_NAME;
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    // Check required environment variables
    if (!fullName || !email || !password) {
      throw new Error(
        "Please set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in your .env file."
      );
    }

    if (password.length < 12) {
      throw new Error("Admin password must be at least 12 characters long.");
    }

    // Check whether this email already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log("A user with this email already exists.");
      return;
    }

    // Hash the password before storing it
    const passwordHash = await bcrypt.hash(password, 12);

    // Create the Admin account
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')
       RETURNING id, full_name, email, role, is_active`,
      [fullName, email, passwordHash]
    );

    console.log("Admin account created successfully:");
    console.log(result.rows[0]);
  } catch (error) {
    console.error("Could not create Admin:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

createAdmin();
