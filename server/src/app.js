const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "../.env"),
});

const express = require("express");
const cors = require("cors");
const pool = require("./config/db");
const employeeRoutes = require("./routes/employee.routes");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");

// Swagger imports 
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./docs/swagger");

const app = express();

// app.use(express.json());
// app.use(
//   cors({
//     origin: "http://localhost:5173",
//     methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   }),
// );

// Allow frontend origins from local development and production
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Temporary debugging logger
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.originalUrl}`);
  next();
});

app.use(express.json());

// Swagger API documentation setup
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Handle invalid JSON request bodies
app.use((error, req, res, next) => {
  if (
    error instanceof SyntaxError &&
    error.status === 400 &&
    "body" in error
  ) {
    return res.status(400).json({
      status: "error",
      message: "Invalid JSON request body",
    });
  }

  next(error);
});

// Home route
app.get("/", (req, res) => {
  res.send("Employee Management System API is running!");
});

// Database health check
app.get("/health/db", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT current_database() AS database"
    );

    return res.json({
      status: "success",
      message: "Database connected successfully!",
      database: result.rows[0].database,
    });
  } catch (error) {
    console.error("Database connection error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Database connection failed",
    });
  }
});

// Employee routes
app.use("/api/v1/employees", employeeRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);

// Handle unknown routes
app.use((req, res) => {
  return res.status(404).json({
    status: "error",
    message: "Route not found",
    path: req.originalUrl,
  });
});

// Global error handling middleware
app.use((error, req, res, next) => {
  console.error("Global error:", error.message);

  if (res.headersSent) {
    return next(error);
  }

  return res.status(error.status || 500).json({
    status: "error",
    message:
      error.status && error.status < 500
        ? error.message
        : "Internal server error",
  });
});

module.exports = app;
