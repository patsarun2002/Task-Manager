# 📋 Task Manager

[![Live Demo](https://img.shields.io/badge/Live-Demo-000?style=flat-square&logo=vercel&logoColor=white)](https://task-manager-green-psi.vercel.app/)

A full-stack Task Management application with JWT authentication, subtask support, drag-and-drop reordering, filtering, and pagination — built with React 19, Express 5, and PostgreSQL.

---

## 🛠️ Tech Stack

| Layer      | Technology                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------ |
| Framework  | React 19 (Frontend), Express 5 (Backend)                                                         |
| Frontend   | Vite 8, Tailwind CSS 4, shadcn/ui, @dnd-kit, @tanstack/react-query                               |
| Backend    | Node.js, Express 5, Morgan, Cookie-parser                                                        |
| Runtime    | Node.js 18+                                                                                      |
| Database   | PostgreSQL, Prisma ORM 7                                                                         |
| Auth       | JWT (access + refresh tokens), bcrypt, HttpOnly cookies                                          |
| Storage    | PostgreSQL                                                                                       |
| Validation | Custom validation middleware (title length, status, priority, date/time format, recurring rules) |
| Caching    | @tanstack/react-query with query invalidation strategy                                           |
| UI Extras  | shadcn/ui components, Sonner (toasts), Lucide icons, dark mode                                   |
| Tools      | ESLint, Prettier, Vitest, Jest, Supertest, GitHub Actions CI                                     |

---

## ✨ Features Overview

- JWT-based authentication with access token (15min) and refresh token (7 days) stored in HttpOnly cookies
- Full CRUD for tasks with title, status, priority, category, note, deadline, and deadline time
- Subtask support — create, toggle completion, and delete nested tasks
- Drag-and-drop task reordering persisted to database via `order` field
- Filter tasks by status (all, pending, done), priority (all, low, medium, high), and category
- Search tasks with debounced input (400ms delay)
- Sort tasks by deadline, priority, or creation date
- Pagination (20 tasks per page)
- Summary bar showing total, pending, done, and overdue task counts
- Category management — dynamic category list from existing tasks
- Dark/light theme toggle with localStorage persistence
- Input sanitization using XSS library to prevent XSS attacks
- Rate limiting — separate limits for auth routes (10 req/15min) and API routes (100 req/15min)
- Request validation middleware for task fields (title length, status enum, priority enum, date/time format, recurring rules)
- Cron job to clean up expired refresh tokens daily at 02:00
- Optimistic updates with React Query for smooth UI
- Automatic token refresh on 401 responses with retry logic
- Loading skeletons for task list

---

## 📁 Project Structure

```
client/src/
├── components/
│   └── ui/                         # shadcn/ui components (button, input, select)
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   └── LoginPage.jsx       # Login/Register modal with form validation
│   │   └── index.js                # Auth feature exports
│   └── tasks/
│       ├── components/
│       │   ├── SortableTaskItem.jsx # @dnd-kit wrapper for drag-and-drop
│       │   ├── SubtaskList.jsx     # Subtask CRUD UI with inline add/toggle/delete
│       │   ├── TaskEditForm.jsx    # Inline edit form for task details
│       │   ├── TaskForm.jsx        # New task creation with all fields
│       │   ├── TaskItem.jsx        # Task card with expandable details
│       │   ├── TaskList.jsx        # Main task list with drag-and-drop
│       │   └── TaskSkeleton.jsx    # Loading placeholder
│       └── index.js                # Tasks feature exports
├── shared/
│   └── components/
│       ├── FilterBar.jsx           # Status, priority, category, search, sort filters
│       ├── Pagination.jsx          # Page navigation controls
│       ├── SummaryBar.jsx          # Task count summary display
│       └── index.js                # Shared components exports
├── hooks/
│   └── useTasks.js                # React Query mutations + queries with optimistic updates
├── services/
│   └── api.js                     # Axios instance with auth interceptor and token refresh
├── store/
│   └── authStore.js               # Zustand store for auth state + theme persistence
├── lib/
│   └── utils.js                   # Utility functions (cn for className merging)
├── App.jsx                        # Main app component with routing and state management
├── main.jsx                       # React entry point
├── index.css                      # Global styles with Tailwind directives
└── App.css                        # Component-specific styles

server/
├── controllers/
│   ├── authController.js          # Register, login, refresh, logout handlers
│   └── taskController.js          # Task CRUD, subtask operations, summary, categories
├── middleware/
│   ├── auth.js                    # JWT verification from Authorization header
│   ├── rateLimiter.js             # Rate limiting for auth and API routes
│   ├── sanitize.js                # XSS sanitization for request body
│   └── validate.js                # Task field validation (status, priority, date/time, recurring)
├── routes/
│   ├── auth.js                    # Auth endpoints (register, login, refresh, logout)
│   └── tasks.js                   # Task endpoints with auth middleware
├── services/
│   ├── authService.js             # Auth business logic (register, login, refresh, logout)
│   └── taskService.js             # Task business logic (CRUD, subtasks, summary, categories)
├── utils/
│   ├── jwt.js                     # JWT token generation (access + refresh)
│   ├── hash.js                    # SHA-256 token hashing for refresh token storage
│   └── cookie.js                  # HttpOnly cookie configuration
├── prisma/
│   ├── schema.prisma              # Database schema (User, Task, Subtask, RefreshToken)
│   └── migrations/                # Prisma migration files
├── __tests__/                     # Jest integration tests
├── __mocks__/                     # Test mocks (Prisma client)
├── app.js                         # Express app configuration (middleware, routes, error handler)
├── server.js                      # Server entry point with cron job for token cleanup
├── db.js                          # Prisma client singleton
└── package.json
```

---

## 🗃️ Database Schema

| Model            | Description                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User**         | User account with email and password. Stores relationship to tasks and refresh tokens. Key fields: `id`, `email` (unique), `password` (bcrypt hashed), `createdAt`                                                                                                                                                                                                                                                                                       |
| **Task**         | Main task entity with status, priority, category, note, deadline, and recurring settings. Key fields: `id`, `title`, `status` (pending/done), `priority` (low/medium/high), `category`, `note`, `deadline`, `deadlineTime`, `recurringType` (daily/weekly), `recurringDays` (array of day indices 0-6), `recurringLastCompleted`, `order` (for drag-and-drop), `userId` (FK), `createdAt`. Indexed on `userId+status`, `userId+deadline`, `userId+order` |
| **Subtask**      | Nested task within a parent task. Key fields: `id`, `title`, `done` (boolean), `taskId` (FK). Indexed on `taskId`                                                                                                                                                                                                                                                                                                                                        |
| **RefreshToken** | Stores hashed refresh tokens for JWT rotation. Key fields: `id`, `tokenHash` (SHA-256, unique), `userId` (FK), `expiresAt`, `createdAt`. Indexed on `userId` and `expiresAt`                                                                                                                                                                                                                                                                             |

---

## 🔄 System Flow

## 01 · Authentication

```
User → Register → bcrypt hash → Store in DB → Return userId
User → Login → Verify credentials → Generate access + refresh tokens →
       Store refresh token hash in DB → Set HttpOnly cookie → Return access token
Client → Store access token in localStorage → Include in Authorization header
Client → On 401 → Call /auth/refresh with cookie → Get new tokens → Retry request
User → Logout → Delete refresh token from DB → Clear cookie → Clear localStorage
```

**Users can:**

- Register with email and password (min 8 chars, email validation)
- Login with email and password
- Automatically refresh access token when expired
- Logout to invalidate refresh token

**Token Lifecycle:**
| Token Type | Expiration | Storage | Usage |
|------------|-------------|---------|-------|
| Access Token | 15 minutes | localStorage (client) | Authorization: Bearer header |
| Refresh Token | 7 days | HttpOnly cookie (server) | Automatic refresh on 401 |

## 02 · Task Management

```
User → Create task → Validate fields → Store in DB → Invalidate cache → Update UI
User → Filter/sort/search → Query params → Filter in DB → Return paginated results
User → Drag-and-drop reorder → Update order field → Batch update DB → Invalidate cache
User → Toggle status → Update status field → Invalidate summary cache → Update UI
User → Add subtask → Create subtask → Update cache in-place → Update UI
```

**Users can:**

- Create tasks with title, status, priority, category, note, deadline, deadline time, and recurring settings
- Edit any task field inline
- Delete tasks
- Toggle task status (pending/done)
- Reorder tasks via drag-and-drop
- Add, toggle, and delete subtasks
- Filter by status, priority, and category
- Search tasks by title
- Sort by deadline, priority, or creation date
- View task summary (total, pending, done, overdue)
- View available categories from existing tasks

**Status Enum:**
| Value | Description |
|-------|-------------|
| pending | Task not yet completed |
| done | Task completed |

**Priority Enum:**
| Value | Description |
|-------|-------------|
| low | Low priority task |
| medium | Medium priority task (default) |
| high | High priority task |

**Recurring Type Enum:**
| Value | Description |
|-------|-------------|
| daily | Task repeats daily |
| weekly | Task repeats on specified days (0-6, Sunday-Saturday) |

---

## 💾 Caching Strategy

| Tag pattern              | Scope                                       | Revalidated on                                                      |
| ------------------------ | ------------------------------------------- | ------------------------------------------------------------------- |
| `["tasks", queryParams]` | Task list with filters                      | createTask, updateTask, deleteTask, reorderTasks, subtask mutations |
| `["summary"]`            | Task counts (total, pending, done, overdue) | createTask, updateTask, deleteTask, subtask toggle                  |
| `["categories"]`         | Unique category list                        | createTask, updateTask (category change)                            |

**Cache Invalidation Strategy:**

- Subtask mutations update cache in-place without full invalidation
- Reorder only invalidates tasks query (not summary/categories)
- Delete invalidates tasks and summary (not categories)
- Create/update invalidates all queries (tasks, summary, categories)

---

## � Security

- JWT access tokens with 15-minute expiration
- JWT refresh tokens with 7-day expiration, stored as SHA-256 hashes in database
- HttpOnly cookies for refresh token storage (not accessible via JavaScript)
- bcrypt password hashing with configurable salt rounds (default: 10)
- XSS sanitization on all request body fields using xss library
- Rate limiting: 10 requests per 15 minutes for auth routes, 100 requests per 15 minutes for API routes
- CORS with configurable allowed origins
- Helmet middleware for security headers
- Input validation for task fields (title length, status enum, priority enum, date/time format, recurring rules)
- Email validation with regex pattern
- Password minimum length validation (8 characters)
- Automatic cleanup of expired refresh tokens via cron job (daily at 02:00)
- Refresh token rotation on each refresh to prevent token reuse
- Token revocation on logout (delete from database)
- Authorization middleware verifies JWT on all protected routes
- User-scoped queries (userId filtering on all task operations)

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
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
BCRYPT_SALT_ROUNDS=10
AUTH_RATE_LIMIT_MAX=10
API_RATE_LIMIT_MAX=100
ALLOWED_ORIGIN=http://localhost:5173
```

Create a `.env` file in `client/`:

```env
VITE_API_URL=http://localhost:3001/api
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

### Server Tests

```bash
cd server
npm run test
```

Server tests use **Jest** with **Supertest** for API integration testing. Test files are located in `server/__tests__/`:

- `app.test.js` - Express app configuration and middleware tests
- `auth.test.js` - Authentication controller tests
- `tasks.test.js` - Task controller tests
- `routes.test.js` - Route handler tests
- `middleware.test.js` - Middleware tests (auth, rate limiter, sanitize, validate)

Coverage reports are generated in `server/coverage/`.

### Client Tests

```bash
cd client
npm run test          # Run tests once
npm run test:watch    # Run tests in watch mode
npm run test:run      # Run tests without watch
```

Client tests use **Vitest** with **React Testing Library** for component testing. Test files are located in `client/src/__tests__/`.

---

## 👤 Author

**Patsarun Kathinthong**  
Full Stack Developer · PERN Stack  
📧 patsarun2545@gmail.com  
🔗 [github.com/patsarun2545](https://github.com/patsarun2545)
