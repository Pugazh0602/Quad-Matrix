# MongoDB & Login Setup Guide

## What Was Added

### 1. **Login Page** (`src/pages/Login.tsx`)
- Beautiful login form with email and password fields
- Integrates with authentication context
- Includes error handling and loading states
- Demo credentials displayed for testing

### 2. **MongoDB Database Integration**

#### Backend Models:
- **User Model** (`backend/models/User.js`):
  - Email (unique, required)
  - Password (hashed with bcryptjs)
  - First/Last name
  - Role (user/admin)
  - Last login timestamp

- **Session Model** (`backend/models/Session.js`):
  - User reference
  - Login/logout times
  - IP address & User agent
  - Device type (mobile/tablet/desktop)
  - OS & Browser information
  - Location
  - Session status tracking

#### Backend Controllers:
- **Auth Controller** (`backend/controllers/authController.js`):
  - `register` - User registration with password hashing
  - `login` - User login with JWT token generation
  - `logout` - Session cleanup

- **Session Controller** (`backend/controllers/sessionController.js`):
  - `getSessions` - Fetch all sessions
  - `getSessionById` - Get specific session
  - `createSession` - Create new session
  - `updateSession` - Update session data
  - `deleteSession` - Delete session
  - `getSessionStats` - Get analytics

#### API Routes:
- **Auth Routes** (`backend/routes/auth.js`):
  - `POST /api/auth/register` - Register new user
  - `POST /api/auth/login` - Login user
  - `POST /api/auth/logout` - Logout user

- **Session Routes** (`backend/routes/sessions.js`):
  - `GET /api/sessions` - Get all sessions (auth required)
  - `GET /api/sessions/stats` - Get session statistics (auth required)
  - `GET /api/sessions/:id` - Get session by ID (auth required)
  - `POST /api/sessions` - Create session (auth required)
  - `PUT /api/sessions/:id` - Update session (auth required)
  - `DELETE /api/sessions/:id` - Delete session (auth required)

### 3. **Authentication Context** (`src/contexts/AuthContext.tsx`)
- React Context API for global auth state management
- Automatic token and user data persistence to localStorage
- `useAuth` hook for easy access in components

### 4. **Updated Dependencies**
Added to `package.json`:
- `mongoose` - MongoDB ODM
- `mongodb` - MongoDB driver
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT token management
- `express` - Backend server
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variables
- `axios` - HTTP client
- `nodemon` - Development server auto-reload

### 5. **Environment Configuration**
- `.env` file with MongoDB URI and JWT secret
- Updated `.gitignore` to exclude environment files

### 6. **Updated Routing**
- Added `/login` route to App.tsx
- Added Login link to homepage Index.tsx

## Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB (local or MongoDB Atlas)
- npm or bun package manager

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Setup Environment Variables:**
Create/update `.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/user-activity-tracker
JWT_SECRET=your-secret-key-here-change-in-production
PORT=5000
NODE_ENV=development
```

3. **MongoDB Setup:**
- **Local MongoDB**: Ensure MongoDB is running on `localhost:27017`
- **MongoDB Atlas**: Replace `MONGODB_URI` with your connection string

### Running the Application

**Development Mode (run both frontend and backend):**

Terminal 1 - Frontend:
```bash
npm run dev
```

Terminal 2 - Backend:
```bash
npm run server:dev
```

**Production Build:**
```bash
npm run build
npm run server
```

### Demo Credentials
- Email: `demo@example.com`
- Password: `password123`

## API Usage

### Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGc...",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Get Sessions (Authenticated)
```bash
GET /api/sessions
Authorization: Bearer <token>
```

### Get Session Statistics
```bash
GET /api/sessions/stats
Authorization: Bearer <token>
```

## Project Structure
```
project/
├── backend/
│   ├── controllers/
│   │   ├── authController.js
│   │   └── sessionController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   └── Session.js
│   └── routes/
│       ├── auth.js
│       └── sessions.js
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── pages/
│   │   ├── Login.tsx (NEW)
│   │   ├── Dashboard.tsx
│   │   ├── Index.tsx
│   │   └── NotFound.tsx
│   └── ...
├── server.js (UPDATED)
├── package.json (UPDATED)
├── .env (NEW)
└── ...
```

## Next Steps

1. **Create a registration page** - Use the auth API for user signup
2. **Add protected routes** - Implement route guards for authenticated pages
3. **Add logout functionality** - Clear auth state and navigate to home
4. **Implement session management** - Track active sessions in dashboard
5. **Add security features** - CSRF protection, rate limiting, session timeout
6. **Deploy** - Setup MongoDB Atlas and deploy to production

## Security Notes

⚠️ **Important for Production:**
- Change `JWT_SECRET` in `.env` to a strong random value
- Use environment-specific configurations
- Implement HTTPS
- Add rate limiting to auth endpoints
- Implement CORS properly with allowed origins
- Use MongoDB connection strings with authentication
- Add input validation and sanitization
- Implement password strength requirements

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB service is running
- Check connection string in `.env`
- Verify MongoDB is accessible on the specified port

### Token Expiration
- Tokens expire in 7 days by default
- Implement refresh token logic for extended sessions

### CORS Errors
- Backend must run on different port (5000) than frontend (8080)
- Verify CORS configuration in server.js
