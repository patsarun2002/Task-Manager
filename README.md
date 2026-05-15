# 📋 Task Manager

[![Live Demo](https://img.shields.io/badge/Live-Demo-000?style=flat-square&logo=vercel&logoColor=white)](https://task-manager-green-psi.vercel.app/)

A full-stack Task Management application with JWT authentication, subtask support, drag-and-drop reordering, filtering, and pagination — built with React and Express.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Vite, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express.js |
| Database | PostgreSQL, Prisma ORM |
| Auth | JWT (Bearer Token), Zustand |
| Testing | Vitest, React Testing Library (client) / Jest (server) |
| Tools | ESLint, Prettier, GitHub Actions CI |

---

## 📁 Project Structure

```
root/
├── client/                         # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                 # Reusable UI (button, input, select)
│   │   │   ├── FilterBar.jsx       # Filter tasks by status/priority
│   │   │   ├── LoginPage.jsx       # Login / Register page
│   │   │   ├── Pagination.jsx      # Pagination controls
│   │   │   ├── SortableTaskItem.jsx # Drag-and-drop task item wrapper
│   │   │   ├── SubtaskList.jsx     # Subtask management inside a task
│   │   │   ├── SummaryBar.jsx      # Task count summary bar
│   │   │   ├── TaskEditForm.jsx    # Inline task editing form
│   │   │   ├── TaskForm.jsx        # New task creation form
│   │   │   ├── TaskItem.jsx        # Single task card
│   │   │   ├── TaskList.jsx        # Task list with drag-and-drop
│   │   │   └── TaskSkeleton.jsx    # Loading skeleton
│   │   ├── hooks/
│   │   │   └── useTasks.js         # Custom hook — task fetching & state
│   │   ├── services/
│   │   │   └── api.js              # Axios instance + auth interceptor
│   │   ├── store/
│   │   │   └── authStore.js        # Zustand auth state (token + user)
│   │   ├── lib/
│   │   │   └── utils.js            # Utility helpers
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── __tests__/                  # Component unit tests
│   ├── vite.config.js
│   └── package.json
│
└── server/                         # Backend (Express.js)
    ├── controllers/
    │   ├── authController.js       # Register, Login
    │   └── taskController.js       # CRUD tasks + subtasks + reorder
    ├── middleware/
    │   ├── auth.js                 # JWT verification
    │   ├── rateLimiter.js          # Rate limiting
    │   ├── sanitize.js             # Input sanitization
    │   └── validate.js             # Request validation
    ├── routes/
    │   ├── auth.js                 # Auth routes
    │   └── tasks.js                # Task routes
    ├── prisma/
    │   ├── schema.prisma           # Database schema
    │   └── migrations/             # Migration history
    ├── __tests__/                  # API integration tests
    ├── server.js
    └── package.json
```

---

## ✨ Features

- JWT-based authentication with protected routes
- Full CRUD for tasks with title, description, status, and priority
- Subtask support — create and manage nested tasks
- Drag-and-drop task reordering (persisted to database via `order` field)
- Filter tasks by status and priority
- Pagination for task lists
- Summary bar showing task counts by status
- Input sanitization and request validation middleware
- Rate limiting to prevent abuse
- CI pipeline via GitHub Actions
- Unit tests for both client components and server API

---

## 🔐 Middleware

| Middleware | File | Responsibility |
|-----------|------|----------------|
| Auth | `auth.js` | Validates JWT from `Authorization: Bearer <token>` |
| Rate Limiter | `rateLimiter.js` | Limits requests per IP to prevent abuse |
| Sanitize | `sanitize.js` | Strips/escapes harmful input |
| Validate | `validate.js` | Validates request body shape and required fields |

---

## 🔄 API Reference

### Auth

```
POST /api/auth/register   → Register a new account
POST /api/auth/login      → Login and receive JWT token
```

### Tasks

```
GET    /api/tasks              → List all tasks (supports filter + pagination)
POST   /api/tasks              → Create a new task
GET    /api/tasks/:id          → Get a single task with subtasks
PUT    /api/tasks/:id          → Update a task
DELETE /api/tasks/:id          → Delete a task
PATCH  /api/tasks/reorder      → Update task order (drag-and-drop)
```

### Subtasks

```
POST   /api/tasks/:id/subtasks           → Add a subtask
PUT    /api/tasks/:id/subtasks/:subId    → Update a subtask
DELETE /api/tasks/:id/subtasks/:subId    → Delete a subtask
```

---

## 🗃️ Database Schema

```
User
├── id
├── email (unique)
├── password (hashed)
└── tasks[]

Task
├── id
├── title
├── description
├── status        (TODO | IN_PROGRESS | DONE)
├── priority      (LOW | MEDIUM | HIGH)
├── order         (for drag-and-drop sorting)
├── userId
├── createdAt
└── subtasks[]

Subtask
├── id
├── title
├── completed
└── taskId
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/patsarun2545/Task-Manager.git
cd Task-Manager

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Environment Variables

Create a `.env` file in `server/`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/task_manager
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET="your_jwt_refresh_secret_key"
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
BCRYPT_SALT_ROUNDS=10
AUTH_RATE_LIMIT_MAX=10
API_RATE_LIMIT_MAX=100
ALLOWED_ORIGIN=http://localhost:5173
```

Create a `.env` file in `client/`:

```env
VITE_API_URL=http://localhost:3000/api
```

### Database Setup

```bash
cd server
npx prisma migrate dev
```

### Run

```bash
# Backend
cd server
npm run dev

# Frontend (in a separate terminal)
cd client
npm run dev
```

---

## 🧪 Testing

```bash
# Client — unit tests
cd client
npm run test

# Client — coverage report
npm run coverage

# Server — integration tests
cd server
npm run test
```

---

## 👤 Author

**Patsarun Kathinthong**  
Full Stack Developer · PERN Stack  
📧 patsarun2545@gmail.com  
🔗 [github.com/patsarun2545](https://github.com/patsarun2545)
