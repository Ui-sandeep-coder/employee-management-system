# Employee Management System (EMS)

A full-stack Employee Management System built with **React, Node.js, Express.js, and PostgreSQL**. The application provides secure authentication, role-based access control, and employee management features through a RESTful API.

## 🚀 Live Demo

- **Frontend:** https://genuine-blancmange-7c9264.netlify.app/login
- **Backend API:** https://employee-management-system-0gqe.onrender.com/
- **API Documentation (Swagger):** https://employee-management-system-0gqe.onrender.com/api-docs

## ✨ Features

### Authentication & Authorization
- Secure login using JWT authentication.
- Password hashing using bcrypt.
- Protected routes and API endpoints.
- Role-Based Access Control (RBAC).
- Logout functionality.

### User Roles

| Role | Permissions |
|---|---|
| Admin | Manage HR accounts and employees |
| HR | Manage employee records |
| Employee | Access and update own profile |

### Employee Management
- Create employees.
- View employee records.
- Update employee details.
- Delete employee records.
- Search and filter employees.

### HR Management
- Create HR accounts.
- View HR directory.
- Reset HR passwords.
- Admin-only HR management.

### Additional Features
- React dashboard.
- Protected frontend routes.
- Axios API integration.
- Request and response handling.
- Input validation and error handling.
- Swagger API documentation.
- Backend automated tests.

## 🛠️ Tech Stack

### Frontend
- React
- JavaScript
- Vite
- Axios
- React Router
- Tailwind CSS / CSS (update according to your implementation)

### Backend
- Node.js
- Express.js
- PostgreSQL
- JSON Web Token (JWT)
- bcryptjs
- pg
- dotenv

### Testing & Documentation
- Node.js Test Runner
- Supertest
- Swagger / OpenAPI

### Deployment
- Frontend: Netlify
- Backend: Render
- Database: Neon PostgreSQL
- Version Control: Git & GitHub

## 📁 Project Structure

```text
employee-management-system/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── docs/
│   │   ├── scripts/
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── tests/
│   ├── package.json
│   └── openapi.yaml
│
└── README.md
```

## ⚙️ Installation & Setup

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- PostgreSQL
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Ui-sandeep-coder/employee-management-system.git

cd employee-management-system
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file inside the `server` directory.

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=employee_management
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password

JWT_SECRET=your_secure_jwt_secret
```

Configure the PostgreSQL database and ensure the required tables are created before starting the application.

Start the backend:

```bash
npm run dev
```

Backend runs at:

```text
http://localhost:3000
```

### 3. Frontend Setup

Open another terminal:

```bash
cd client
npm install
```

Create a `.env` file inside the `client` directory.

```env
VITE_API_URL=http://localhost:3000/api/v1
```

Start the frontend:

```bash
npm run dev
```

Open the local frontend URL shown by Vite in your terminal.

## 📚 API Documentation

Swagger documentation is available at:

```text
http://localhost:3000/api-docs
```

Production API documentation:

https://employee-management-system-0gqe.onrender.com/api-docs

### Main API Routes

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/login` | User login |
| GET | `/api/v1/auth/me` | Get logged-in user |
| GET | `/api/v1/employees` | Get employees |
| POST | `/api/v1/employees` | Create employee |
| PATCH | `/api/v1/employees/:id` | Update employee |
| DELETE | `/api/v1/employees/:id` | Delete employee |
| POST | `/api/v1/users/hr` | Create HR account |
| GET | `/api/v1/users/hr` | Get HR accounts |
| PATCH | `/api/v1/users/hr/:id/password` | Reset HR password |
| POST | `/api/v1/users/employee` | Create employee login account |

**Note:** Protected endpoints require a valid JWT Bearer token and appropriate role permissions.

## 🧪 Run Tests

From the `server` directory:

```bash
npm test
```

## 🔐 Security

- Passwords are stored as bcrypt hashes.
- JWT authentication protects private APIs.
- Role-based middleware controls access.
- Environment variables are used for sensitive configuration.
- `.env` files and secrets should never be committed to GitHub.

## ☁️ Deployment

The application is deployed using:

- **Netlify:** React frontend
- **Render:** Node.js / Express backend
- **Neon:** PostgreSQL production database

Production environment variables must be configured in the respective deployment dashboards.

## 👨‍💻 Author

**Sandeep Vishwakarma**

GitHub: https://github.com/Ui-sandeep-coder

---

⭐ If you find this project useful, feel free to star the repository!
