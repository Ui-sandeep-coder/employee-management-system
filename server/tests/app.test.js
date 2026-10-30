require("dotenv").config();

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const app = require("../src/app");
const pool = require("../src/config/db");

assert.ok(process.env.JWT_SECRET, "JWT_SECRET must be configured for tests");

// Admin test token
const testToken = jwt.sign(
  { role: "admin" },
  process.env.JWT_SECRET,
  {
    subject: "1",
    expiresIn: "10m",
    issuer: "employee-management-system",
    audience: "employee-management-api",
  }
);

const authHeader = `Bearer ${testToken}`;

// Employee test token
const employeeTestToken = jwt.sign(
  { role: "employee" },
  process.env.JWT_SECRET,
  {
    subject: "3",
    expiresIn: "10m",
    issuer: "employee-management-system",
    audience: "employee-management-api",
  }
);

const employeeAuthHeader = `Bearer ${employeeTestToken}`;

// HR test token
const hrTestToken = jwt.sign(
  { role: "hr" },
  process.env.JWT_SECRET,
  {
    subject: "2",
    expiresIn: "10m",
    issuer: "employee-management-system",
    audience: "employee-management-api",
  }
);

const hrAuthHeader = `Bearer ${hrTestToken}`;

// Unique emails for test records
const testEmail = `test-${Date.now()}@example.com`;
const hrTestEmail = `test-hr-${Date.now()}@example.com`;
const userEmployeeTestEmail =
  `test-user-employee-${Date.now()}@example.com`;

const newHRPassword = "InitialTestPassword123!";
const resetHRPassword = "ResetTestPassword456!";
const newEmployeePassword = "EmployeeTestPassword123!";
const selfTestEmployeeEmail =
  `test-self-employee-${Date.now()}@example.com`;

const selfTestEmployeePassword = "SelfTestPassword123!";

let createdEmployeeId;
let createdHRUserId;
let createdUserEmployeeId;
let createdUserEmployeeProfileId;
let selfTestEmployeeUserId;
let selfTestEmployeeProfileId;
let selfTestEmployeeAuthHeader;

// Create a dedicated employee for self-access tests
before(async () => {
  const response = await request(app)
    .post("/api/v1/users/employee")
    .set("Authorization", authHeader)
    .send({
      full_name: "Self Test Employee",
      email: selfTestEmployeeEmail,
      password: selfTestEmployeePassword,
      phone: "9876501234",
      department: "Testing",
      job_title: "Test Engineer",
      salary: 40000,
    });

  assert.equal(response.statusCode, 201);

  selfTestEmployeeUserId = response.body.data.user.id;
  selfTestEmployeeProfileId = response.body.data.employee.id;

  const selfTestEmployeeToken = jwt.sign(
    { role: "employee" },
    process.env.JWT_SECRET,
    {
      subject: String(selfTestEmployeeUserId),
      expiresIn: "10m",
      issuer: "employee-management-system",
      audience: "employee-management-api",
    }
  );

  selfTestEmployeeAuthHeader = `Bearer ${selfTestEmployeeToken}`;
});

// 1. Home route
test("GET / returns the API running message", async () => {
  const response = await request(app).get("/");

  assert.equal(response.statusCode, 200);
  assert.equal(
    response.text,
    "Employee Management System API is running!"
  );
});

// 2. Get all employees as admin
test("GET employees returns a success response", async () => {
  const response = await request(app)
    .get("/api/v1/employees")
    .set("Authorization", authHeader);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, "success");
  assert.ok(Array.isArray(response.body.data));
  assert.equal(response.body.count, response.body.data.length);
});

// 3. Missing token
test("GET employees without a token returns 401", async () => {
  const response = await request(app).get("/api/v1/employees");

  assert.equal(response.statusCode, 401);
  assert.equal(response.body.status, "error");
});

// 4. Invalid token
test("GET employees with an invalid token returns 401", async () => {
  const response = await request(app)
    .get("/api/v1/employees")
    .set("Authorization", "Bearer invalid.fake.token");

  assert.equal(response.statusCode, 401);
  assert.equal(response.body.status, "error");
});

// 5. Employee cannot list all employees
test("Employee cannot access the full employee list", async () => {
  const response = await request(app)
    .get("/api/v1/employees")
    .set("Authorization", employeeAuthHeader);

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.status, "error");
});

// 6. Employee cannot access another employee's profile
test("Employee cannot access another employee's profile", async () => {
  const response = await request(app)
    .get("/api/v1/employees/1")
    .set("Authorization", employeeAuthHeader);

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.status, "error");
  assert.equal(
    response.body.message,
    "You can only access your own employee profile"
  );
});

// 7. Employee cannot change their own salary
test("Employee cannot update their own salary", async () => {
  const response = await request(app)
    .patch(`/api/v1/employees/${selfTestEmployeeProfileId}`)
    .set("Authorization", selfTestEmployeeAuthHeader)
    .send({ salary: 999999 });

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.status, "error");
});

// 8. Employee can update their own phone
test("Employee can update their own phone number", async () => {
  const response = await request(app)
    .patch(`/api/v1/employees/${selfTestEmployeeProfileId}`)
    .set("Authorization", selfTestEmployeeAuthHeader)
    .send({ phone: "9876501234" });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, "success");
  assert.equal(response.body.data.phone, "9876501234");
});

// 9. Employee cannot delete an employee
test("Employee cannot delete an employee", async () => {
  const response = await request(app)
    .delete(`/api/v1/employees/${selfTestEmployeeProfileId}`)
    .set("Authorization", selfTestEmployeeAuthHeader);

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.status, "error");
});

// 10. Employee cannot change their department
test("Employee cannot change their department", async () => {
  const response = await request(app)
    .patch(`/api/v1/employees/${selfTestEmployeeProfileId}`)
    .set("Authorization", selfTestEmployeeAuthHeader)
    .send({ department: "Finance" });

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.status, "error");
});

// 11. Employee cannot change their email
test("Employee cannot change their email", async () => {
  const response = await request(app)
    .patch(`/api/v1/employees/${selfTestEmployeeProfileId}`)
    .set("Authorization", selfTestEmployeeAuthHeader)
    .send({ email: "changed-email@example.com" });

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.status, "error");
});

// 12. Employee can update their own name
test("Employee can update their own full name", async () => {
  const response = await request(app)
    .patch(`/api/v1/employees/${selfTestEmployeeProfileId}`)
    .set("Authorization", selfTestEmployeeAuthHeader)
    .send({ full_name: "Karan Test Employee" });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, "success");
  assert.equal(response.body.data.full_name, "Karan Test Employee");
});

// 13. Invalid employee ID on GET
test("GET employee with invalid ID returns 400", async () => {
  const response = await request(app)
    .get("/api/v1/employees/abc")
    .set("Authorization", authHeader);

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.status, "error");
  assert.equal(
    response.body.message,
    "Employee ID must be a positive integer"
  );
});

// 14. Employee not found on GET
test("GET non-existent employee returns 404", async () => {
  const response = await request(app)
    .get("/api/v1/employees/999999")
    .set("Authorization", authHeader);

  assert.equal(response.statusCode, 404);
  assert.equal(response.body.status, "error");
  assert.equal(response.body.message, "Employee not found");
});

// 15. Negative salary validation
test("POST employee with negative salary returns 400", async () => {
  const response = await request(app)
    .post("/api/v1/employees")
    .set("Authorization", authHeader)
    .send({
      full_name: "Automated Test Employee",
      email: `invalid-${Date.now()}@example.com`,
      salary: -100,
    });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.status, "error");
  assert.equal(response.body.message, "Validation failed");
});

// 16. Invalid employee ID on PATCH
test("PATCH employee with invalid ID returns 400", async () => {
  const response = await request(app)
    .patch("/api/v1/employees/abc")
    .set("Authorization", authHeader)
    .send({ department: "Engineering" });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.status, "error");
  assert.equal(
    response.body.message,
    "Employee ID must be a positive integer"
  );
});

// 17. Invalid employee ID on DELETE
test("DELETE employee with invalid ID returns 400", async () => {
  const response = await request(app)
    .delete("/api/v1/employees/abc")
    .set("Authorization", authHeader);

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.status, "error");
  assert.equal(
    response.body.message,
    "Employee ID must be a positive integer"
  );
});

// 18. Unknown route
test("Unknown route returns 404", async () => {
  const response = await request(app).get(
    "/this-route-does-not-exist"
  );

  assert.equal(response.statusCode, 404);
  assert.equal(response.body.status, "error");
  assert.equal(response.body.message, "Route not found");
});

// 19. Create employee successfully
test("POST creates an employee successfully", async () => {
  const response = await request(app)
    .post("/api/v1/employees")
    .set("Authorization", authHeader)
    .send({
      full_name: "Automated Test Employee",
      email: testEmail,
      phone: "9876543210",
      department: "Engineering",
      job_title: "Test Engineer",
      salary: 50000,
    });

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.status, "success");

  createdEmployeeId = response.body.data.id;

  assert.ok(createdEmployeeId);
  assert.equal(response.body.data.email, testEmail);
});

// 20. Duplicate employee email
test("POST rejects a duplicate employee email", async () => {
  const response = await request(app)
    .post("/api/v1/employees")
    .set("Authorization", authHeader)
    .send({
      full_name: "Duplicate Test Employee",
      email: testEmail,
      salary: 40000,
    });

  assert.equal(response.statusCode, 409);
  assert.equal(response.body.status, "error");
});

// 21. Update employee successfully
test("PATCH updates an existing employee", async () => {
  assert.ok(createdEmployeeId, "Create test must run first");

  const response = await request(app)
    .patch(`/api/v1/employees/${createdEmployeeId}`)
    .set("Authorization", authHeader)
    .send({ department: "Quality Assurance" });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, "success");
  assert.equal(response.body.data.department, "Quality Assurance");
});

// 22. Update non-existent employee
test("PATCH returns 404 for a missing employee", async () => {
  const response = await request(app)
    .patch("/api/v1/employees/999999")
    .set("Authorization", authHeader)
    .send({ department: "Engineering" });

  assert.equal(response.statusCode, 404);
  assert.equal(response.body.status, "error");
  assert.equal(response.body.message, "Employee not found");
});

// 23. Delete created employee
test("DELETE removes the created employee", async () => {
  assert.ok(createdEmployeeId, "Create test must run first");

  const response = await request(app)
    .delete(`/api/v1/employees/${createdEmployeeId}`)
    .set("Authorization", authHeader);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, "success");

  createdEmployeeId = undefined;
});

// 24. Delete non-existent employee
test("DELETE returns 404 for a missing employee", async () => {
  const response = await request(app)
    .delete("/api/v1/employees/999999")
    .set("Authorization", authHeader);

  assert.equal(response.statusCode, 404);
  assert.equal(response.body.status, "error");
  assert.equal(response.body.message, "Employee not found");
});

// 25. Employee cannot create HR account
test("Employee cannot create an HR account", async () => {
  const response = await request(app)
    .post("/api/v1/users/hr")
    .set("Authorization", employeeAuthHeader)
    .send({
      full_name: "Test HR",
      email: `forbidden-hr-${Date.now()}@example.com`,
      password: "StrongTestPassword123!",
    });

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.status, "error");
});

// 26. Employee cannot create employee account
test("Employee cannot create an employee account", async () => {
  const response = await request(app)
    .post("/api/v1/users/employee")
    .set("Authorization", employeeAuthHeader)
    .send({
      full_name: "Test Employee",
      email: `forbidden-employee-${Date.now()}@example.com`,
      password: "StrongTestPassword123!",
    });

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.status, "error");
});

// 27. HR cannot create HR account
test("HR cannot create another HR account", async () => {
  const response = await request(app)
    .post("/api/v1/users/hr")
    .set("Authorization", hrAuthHeader)
    .send({
      full_name: "Another Test HR",
      email: `another-hr-${Date.now()}@example.com`,
      password: "StrongTestPassword123!",
    });

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.status, "error");
});

// 28. HR cannot reset a user's password
test("HR cannot reset a user's password", async () => {
  const response = await request(app)
    .patch("/api/v1/users/1/password")
    .set("Authorization", hrAuthHeader)
    .send({
      password: "AnotherStrongPassword123!",
    });

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.status, "error");
});

// 29. Admin HR creation rejects a short password
test("Admin HR creation rejects a short password", async () => {
  const response = await request(app)
    .post("/api/v1/users/hr")
    .set("Authorization", authHeader)
    .send({
      full_name: "Validation Test HR",
      email: `short-password-${Date.now()}@example.com`,
      password: "short",
    });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.status, "error");
  assert.equal(
    response.body.message,
    "Password must be at least 12 characters long"
  );
});

// 30. Admin gets 404 resetting a non-existent user's password
test("Admin gets 404 when resetting a non-existent user's password", async () => {
  const response = await request(app)
    .patch("/api/v1/users/999999/password")
    .set("Authorization", authHeader)
    .send({
      password: "AnotherStrongPassword123!",
    });

  assert.equal(response.statusCode, 404);
  assert.equal(response.body.status, "error");
  assert.equal(response.body.message, "User not found");
});

// 31. Admin creates an HR account successfully
test("Admin creates an HR account successfully", async () => {
  const response = await request(app)
    .post("/api/v1/users/hr")
    .set("Authorization", authHeader)
    .send({
      full_name: "Automated Test HR",
      email: hrTestEmail,
      password: newHRPassword,
    });

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.status, "success");
  assert.equal(
    response.body.message,
    "HR account created successfully"
  );

  const hr = response.body.data;

  assert.ok(hr.id);
  createdHRUserId = hr.id;

  assert.equal(hr.full_name, "Automated Test HR");
  assert.equal(hr.email, hrTestEmail);
  assert.equal(hr.role, "hr");
  assert.equal(hr.is_active, true);

  assert.equal("password" in hr, false);
  assert.equal("password_hash" in hr, false);

  const dbResult = await pool.query(
    `SELECT id, email, role, password_hash
     FROM users
     WHERE id = $1`,
    [createdHRUserId]
  );

  assert.equal(dbResult.rows.length, 1);
  assert.equal(dbResult.rows[0].email, hrTestEmail);
  assert.equal(dbResult.rows[0].role, "hr");

  assert.notEqual(dbResult.rows[0].password_hash, newHRPassword);
  assert.equal(
    await bcrypt.compare(newHRPassword, dbResult.rows[0].password_hash),
    true
  );
});

// 32. Admin creates employee login and profile together
test("Admin creates an employee account and profile successfully", async () => {
  const response = await request(app)
    .post("/api/v1/users/employee")
    .set("Authorization", authHeader)
    .send({
      full_name: "Automated User Employee",
      email: userEmployeeTestEmail,
      password: newEmployeePassword,
      phone: "9876543210",
      department: "Engineering",
      job_title: "Junior Developer",
      salary: 45000,
    });

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.status, "success");
  assert.equal(
    response.body.message,
    "Employee account and profile created successfully"
  );

  const { user, employee } = response.body.data;

  assert.ok(user.id);
  assert.ok(employee.id);

  createdUserEmployeeId = user.id;
  createdUserEmployeeProfileId = employee.id;

  assert.equal(user.email, userEmployeeTestEmail);
  assert.equal(user.role, "employee");
  assert.equal(user.is_active, true);

  assert.equal(employee.user_id, user.id);
  assert.equal(employee.email, userEmployeeTestEmail);
  assert.equal(employee.full_name, "Automated User Employee");
  assert.equal(employee.phone, "9876543210");
  assert.equal(employee.department, "Engineering");
  assert.equal(employee.job_title, "Junior Developer");
  assert.equal(Number(employee.salary), 45000);

  assert.equal("password" in user, false);
  assert.equal("password_hash" in user, false);
  assert.equal("password" in employee, false);
  assert.equal("password_hash" in employee, false);

  const dbResult = await pool.query(
    `SELECT
       u.id AS user_id,
       u.email AS user_email,
       u.role,
       u.password_hash,
       e.id AS employee_id,
       e.user_id AS linked_user_id
     FROM users u
     JOIN employees e ON e.user_id = u.id
     WHERE u.id = $1`,
    [createdUserEmployeeId]
  );

  assert.equal(dbResult.rows.length, 1);
  assert.equal(dbResult.rows[0].user_email, userEmployeeTestEmail);
  assert.equal(dbResult.rows[0].role, "employee");
  assert.equal(
    Number(dbResult.rows[0].employee_id),
    Number(createdUserEmployeeProfileId)
  );
  assert.equal(
    Number(dbResult.rows[0].linked_user_id),
    Number(createdUserEmployeeId)
  );

  assert.equal(
    await bcrypt.compare(
      newEmployeePassword,
      dbResult.rows[0].password_hash
    ),
    true
  );
});

// 33. Admin resets an existing HR user's password
test("Admin resets an HR password successfully", async () => {
  assert.ok(
    createdHRUserId,
    "Test 31 must create the HR account first"
  );

  const response = await request(app)
    .patch(`/api/v1/users/${createdHRUserId}/password`)
    .set("Authorization", authHeader)
    .send({
      password: resetHRPassword,
    });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, "success");
  assert.equal(
    response.body.message,
    "Password reset successfully"
  );

  assert.equal(Number(response.body.data.id), Number(createdHRUserId));
  assert.equal(response.body.data.role, "hr");
  assert.equal("password" in response.body.data, false);
  assert.equal("password_hash" in response.body.data, false);

  const dbResult = await pool.query(
    "SELECT password_hash FROM users WHERE id = $1",
    [createdHRUserId]
  );

  assert.equal(dbResult.rows.length, 1);

  const savedHash = dbResult.rows[0].password_hash;

  assert.equal(
    await bcrypt.compare(resetHRPassword, savedHash),
    true
  );

  assert.equal(
    await bcrypt.compare(newHRPassword, savedHash),
    false
  );
});

// Cleanup test-created records

 // Cleanup test-created records
after(async () => {
  try {
    // 1. Delete the dedicated self-test employee profile
    if (selfTestEmployeeProfileId) {
      await pool.query(
        "DELETE FROM employees WHERE id = $1",
        [selfTestEmployeeProfileId]
      );
    }

    // 2. Delete the dedicated self-test employee user
    if (selfTestEmployeeUserId) {
      await pool.query(
        "DELETE FROM users WHERE id = $1",
        [selfTestEmployeeUserId]
      );
    }

    // 3. Delete the employee profile created for user-employee tests
    if (createdUserEmployeeProfileId) {
      await pool.query(
        "DELETE FROM employees WHERE id = $1",
        [createdUserEmployeeProfileId]
      );
    }

    // 4. Delete the employee user created for user-employee tests
    if (createdUserEmployeeId) {
      await pool.query(
        "DELETE FROM users WHERE id = $1",
        [createdUserEmployeeId]
      );
    }

    // 5. Delete the HR user created during tests
    if (createdHRUserId) {
      await pool.query(
        "DELETE FROM users WHERE id = $1",
        [createdHRUserId]
      );
    }

    // 6. Delete any employee left over from CRUD tests
    if (createdEmployeeId) {
      await pool.query(
        "DELETE FROM employees WHERE id = $1",
        [createdEmployeeId]
      );
    }
  } finally {
    // Close the PostgreSQL connection pool
    await pool.end();
  }
});
