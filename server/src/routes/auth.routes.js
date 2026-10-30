
const express = require("express");
const { login, getMe} = require("../controllers/auth.controller");
const authenticateToken = require("../middleware/auth.middleware");

const router = express.Router();

// POST /api/v1/auth/login
router.post("/login", login);

// GET /api/v1/auth/me
router.get("/me", authenticateToken, getMe);


module.exports = router;
