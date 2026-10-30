
const pool = require("../config/db");

// Create employee

const createEmployee = async (req, res, next) => {
  try {
    // 1. Validate request body
    if (
      !req.body ||
      typeof req.body !== "object" ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        status: "error",
        message: "Request body must be a valid JSON object",
      });
    }

    const {
      full_name,
      email,
      phone,
      department,
      job_title,
      salary,
    } = req.body;

    // 2. Collect validation errors
    const errors = [];

    // Full name validation
    if (typeof full_name !== "string" || !full_name.trim()) {
      errors.push({
        field: "full_name",
        message: "Full name is required and must be a non-empty string",
      });
    }

    // Email validation
    if (typeof email !== "string" || !email.trim()) {
      errors.push({
        field: "email",
        message: "Email is required and must be a non-empty string",
      });
    } else {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(email.trim())) {
        errors.push({
          field: "email",
          message: "Please provide a valid email address",
        });
      }
    }

    // Phone validation: string or null
    if (
      phone !== undefined &&
      phone !== null &&
      typeof phone !== "string"
    ) {
      errors.push({
        field: "phone",
        message: "Phone must be a string or null",
      });
    }

    // Department validation: string or null
    if (
      department !== undefined &&
      department !== null &&
      typeof department !== "string"
    ) {
      errors.push({
        field: "department",
        message: "Department must be a string or null",
      });
    }

    // Job title validation: string or null
    if (
      job_title !== undefined &&
      job_title !== null &&
      typeof job_title !== "string"
    ) {
      errors.push({
        field: "job_title",
        message: "Job title must be a string or null",
      });
    }

    // 3. Salary validation
    // Salary must be a JSON number or null
    let salaryValue = null;

    if (salary !== undefined && salary !== null) {
      if (typeof salary !== "number") {
        errors.push({
          field: "salary",
          message: "Salary must be a JSON number or null",
        });
      } else if (!Number.isFinite(salary) || salary < 0) {
        errors.push({
          field: "salary",
          message: "Salary must be a non-negative number",
        });
      } else {
        salaryValue = salary;
      }
    }

    // 4. Return all validation errors together
    if (errors.length > 0) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors,
      });
    }

    // 5. Normalize input
    const normalizedName = full_name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    const normalizedPhone =
      typeof phone === "string" && phone.trim() !== ""
        ? phone.trim()
        : null;

    const normalizedDepartment =
      typeof department === "string" && department.trim() !== ""
        ? department.trim()
        : null;

    const normalizedJobTitle =
      typeof job_title === "string" && job_title.trim() !== ""
        ? job_title.trim()
        : null;

    // 6. Insert employee into database
    const result = await pool.query(
      `INSERT INTO employees
        (full_name, email, phone, department, job_title, salary)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        normalizedName,
        normalizedEmail,
        normalizedPhone,
        normalizedDepartment,
        normalizedJobTitle,
        salaryValue,
      ]
    );

    // 7. Return success response
    return res.status(201).json({
      status: "success",
      message: "Employee created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Create employee error:", error.message);

    // Duplicate email
    if (error.code === "23505") {
      return res.status(409).json({
        status: "error",
        message: "An employee with this email already exists",
      });
    }

    // Database constraint violation
    if (error.code === "23514") {
      return res.status(400).json({
        status: "error",
        message: "Employee data violates a database constraint",
      });
    }
    // Forward unexpected errors to the global error handler
   return next(error);
  }
};

// Get all employees


const getAllEmployees = async (req, res, next) => {
  try {
    // 1. Read query parameters
    const pageParam = req.query.page ?? "1";
    const limitParam = req.query.limit ?? "10";
    const searchParam = req.query.search ?? "";
    const departmentParam = req.query.department ?? "";

    // 2. Validate pagination parameters
    if (
      typeof pageParam !== "string" ||
      typeof limitParam !== "string" ||
      !/^[1-9]\d*$/.test(pageParam) ||
      !/^[1-9]\d*$/.test(limitParam)
    ) {
      return res.status(400).json({
        status: "error",
        message: "Page and limit must be positive integers",
      });
    }

    const page = Number(pageParam);
    const limit = Number(limitParam);

    if (
      !Number.isSafeInteger(page) ||
      !Number.isSafeInteger(limit) ||
      limit > 100 ||
      !Number.isSafeInteger((page - 1) * limit)
    ) {
      return res.status(400).json({
        status: "error",
        message: "Invalid pagination values",
      });
    }

    // 3. Validate search and department
    if (
      typeof searchParam !== "string" ||
      typeof departmentParam !== "string"
    ) {
      return res.status(400).json({
        status: "error",
        message: "Search and department must be strings",
      });
    }

    const search = searchParam.trim();
    const department = departmentParam.trim();

    if (search.length > 100 || department.length > 100) {
      return res.status(400).json({
        status: "error",
        message: "Search and department must not exceed 100 characters",
      });
    }

    // 4. Build SQL filters safely
    const conditions = [];
    const filterValues = [];

    if (search) {
      filterValues.push(`%${search}%`);
      const searchPlaceholder = `$${filterValues.length}`;

      conditions.push(
        `(full_name ILIKE ${searchPlaceholder} OR email ILIKE ${searchPlaceholder})`
      );
    }

    if (department) {
      filterValues.push(department);

      conditions.push(
        `LOWER(department) = LOWER($${filterValues.length})`
      );
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    // 5. Calculate pagination offset
    const offset = (page - 1) * limit;

    const employeeValues = [...filterValues, limit, offset];
    const limitPlaceholder = `$${filterValues.length + 1}`;
    const offsetPlaceholder = `$${filterValues.length + 2}`;

    // 6. Fetch filtered employees and filtered total count
    const [employeesResult, countResult] = await Promise.all([
      pool.query(
        `SELECT *
         FROM employees
         ${whereClause}
         ORDER BY id ASC
         LIMIT ${limitPlaceholder}
         OFFSET ${offsetPlaceholder}`,
        employeeValues
      ),

      pool.query(
        `SELECT COUNT(*)::int AS total
         FROM employees
         ${whereClause}`,
        filterValues
      ),
    ]);

    const total = countResult.rows[0].total;
    const totalPages = Math.ceil(total / limit);

    // 7. Return employees and pagination metadata
    return res.json({
      status: "success",
      count: employeesResult.rowCount,
      data: employeesResult.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get employees error:", error.message);
    return next(error);
  }
};


/**
 * GET /api/v1/employees/me
 * Fetch the employee profile linked to the logged-in user.
 */
const getMyProfile = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
         id,
         full_name,
         email,
         phone,
         department,
         job_title,
         joining_date,
         created_at
       FROM employees
       WHERE user_id = $1`,
      [req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        status: "error",
        message: "No employee profile is linked to your account",
      });
    }

    return res.status(200).json({
      status: "success",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get my profile error:", error.message);
    return next(error);
  }
};



// Get employee by ID
const getEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate employee ID
    if (!/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({
        status: "error",
        message: "Employee ID must be a positive integer",
      });
    }

    const result = await pool.query(
      "SELECT * FROM employees WHERE id = $1",
      [id]
    );

    // Employee not found
    if (result.rowCount === 0) {
      return res.status(404).json({
        status: "error",
        message: "Employee not found",
      });
    }

    return res.json({
      status: "success",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Get employee by ID error:", error.message);
    return next(error);
  }
};

// Update employee


const updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Validate employee ID
    if (!/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({
        status: "error",
        message: "Employee ID must be a positive integer",
      });
    }

    // 2. Validate request body
    if (
      !req.body ||
      typeof req.body !== "object" ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        status: "error",
        message: "Request body must be a valid JSON object",
      });
    }

    // 3. All fields that can be updated by Admin/HR
    const fields = [
      "full_name",
      "email",
      "phone",
      "department",
      "job_title",
      "salary",
    ];

    // 4. Reject unknown fields
    const unknownFields = Object.keys(req.body).filter(
      (key) => !fields.includes(key)
    );

    if (unknownFields.length > 0) {
      return res.status(400).json({
        status: "error",
        message: "Unknown fields provided",
        errors: unknownFields.map((field) => ({
          field,
          message: "This field cannot be updated",
        })),
      });
    }

    // 5. Role-based field permissions
    const role = req.user.role;

    const employeeAllowedFields = ["full_name", "phone"];

    const allowedFields =
      role === "admin" || role === "hr"
        ? fields
        : employeeAllowedFields;

    const forbiddenFields = Object.keys(req.body).filter(
      (field) =>
        fields.includes(field) && !allowedFields.includes(field)
    );

    if (forbiddenFields.length > 0) {
      return res.status(403).json({
        status: "error",
        message: "You are not allowed to update these fields",
        fields: forbiddenFields,
      });
    }

    // 6. Ensure at least one permitted field is provided
    const providedFields = allowedFields.filter(
      (field) => req.body[field] !== undefined
    );

    if (providedFields.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Provide at least one field to update",
      });
    }

    const errors = [];
    const valuesToUpdate = {};

    // 7. Validate and normalize provided fields
    for (const field of providedFields) {
      const value = req.body[field];

      if (field === "full_name") {
        if (typeof value !== "string" || !value.trim()) {
          errors.push({
            field,
            message: "Full name must be a non-empty string",
          });
        } else if (value.trim().length > 100) {
          errors.push({
            field,
            message: "Full name must not exceed 100 characters",
          });
        } else {
          valuesToUpdate[field] = value.trim();
        }
      } else if (field === "email") {
        if (typeof value !== "string" || !value.trim()) {
          errors.push({
            field,
            message: "Email must be a non-empty string",
          });
        } else {
          const normalizedEmail = value.trim().toLowerCase();
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

          if (!emailPattern.test(normalizedEmail)) {
            errors.push({
              field,
              message: "Please provide a valid email address",
            });
          } else if (normalizedEmail.length > 255) {
            errors.push({
              field,
              message: "Email must not exceed 255 characters",
            });
          } else {
            valuesToUpdate[field] = normalizedEmail;
          }
        }
      } else if (field === "salary") {
        if (value === null) {
          valuesToUpdate[field] = null;
        } else if (typeof value !== "number") {
          errors.push({
            field,
            message: "Salary must be a JSON number or null",
          });
        } else if (!Number.isFinite(value) || value < 0) {
          errors.push({
            field,
            message: "Salary must be a non-negative number",
          });
        } else {
          valuesToUpdate[field] = value;
        }
      } else {
        // phone, department and job_title
        if (value !== null && typeof value !== "string") {
          errors.push({
            field,
            message: `${field} must be a string or null`,
          });
        } else {
          const normalizedValue =
            typeof value === "string" ? value.trim() : value;

          const maxLength =
            field === "phone"
              ? 20
              : 100;

          if (
            normalizedValue !== null &&
            normalizedValue.length > maxLength
          ) {
            errors.push({
              field,
              message: `${field} must not exceed ${maxLength} characters`,
            });
          } else {
            valuesToUpdate[field] =
              normalizedValue === "" ? null : normalizedValue;
          }
        }
      }
    }

    // 8. Return validation errors
    if (errors.length > 0) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors,
      });
    }

    // 9. Build parameterized UPDATE query
    const values = [];
    const setClauses = [];

    for (const field of providedFields) {
      values.push(valuesToUpdate[field]);
      setClauses.push(`${field} = $${values.length}`);
    }

    values.push(Number(id));

    const query = `
      UPDATE employees
      SET ${setClauses.join(", ")}
      WHERE id = $${values.length}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    // 10. Check whether employee exists
    if (result.rowCount === 0) {
      return res.status(404).json({
        status: "error",
        message: "Employee not found",
      });
    }

    // 11. Send success response
    return res.status(200).json({
      status: "success",
      message: "Employee updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Update employee error:", error.message);

    // Duplicate email
    if (error.code === "23505") {
      return res.status(409).json({
        status: "error",
        message: "An employee with this email already exists",
      });
    }

    // Database constraint violation
    if (error.code === "23514") {
      return res.status(400).json({
        status: "error",
        message: "Invalid field value",
      });
    }

    return next(error);
  }
};


// Delete employee
const deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate employee ID
    if (!/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({
        status: "error",
        message: "Employee ID must be a positive integer",
      });
    }

    const result = await pool.query(
      "DELETE FROM employees WHERE id = $1 RETURNING *",
      [id]
    );

    // Check whether employee existed
    if (result.rowCount === 0) {
      return res.status(404).json({
        status: "error",
        message: "Employee not found",
      });
    }

    return res.json({
      status: "success",
      message: "Employee deleted successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Delete employee error:", error.message);
    return next(error);
  }
};

module.exports = {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  getMyProfile,
  updateEmployee,
  deleteEmployee,
};
