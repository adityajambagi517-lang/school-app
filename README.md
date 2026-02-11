# School Management System

A comprehensive school management application with role-based access control, approval workflows, and three separate portals (Admin, Teacher, Student).

## Tech Stack

- **Backend**: NestJS with TypeScript
- **Frontend**: React with TypeScript + Vite
- **Database**: MongoDB
- **Authentication**: JWT

## Project Structure

```
school-management-system/
├── backend/          # NestJS backend API
└── frontend/         # React frontend application
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
- Copy `.env.example` to `.env`
- Update MongoDB URI and JWT secret

4. Seed the database:
```bash
npm run seed
```

5. Start the development server:
```bash
npm run start:dev
```

The backend will run on `http://localhost:3000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Default Login Credentials

After running the seed script:

- **Admin**: `userId: admin`, `password: password123`
- **Teacher**: `userId: TCH001`, `password: password123`
- **Student**: `userId: STU001`, `password: password123`

## Features

### Authentication
- Single login screen (userId + password only)
- Role detection from backend (not frontend)
- JWT-based authentication
- Auto-redirect to role-specific portal

### Role-Based Access Control
- **Admin**: Full access to all data, approval workflows
- **Teacher**: Access to assigned class only, direct updates for attendance/homework, approval workflow for marks/fees
- **Student**: View own data only, see only published marks

### Approval Workflow (Marks & Fees)
1. **DRAFT**: Teacher creates data
2. **SUBMITTED**: Teacher submits for approval
3. **APPROVED**: Admin approves (teacher can edit)
4. **PUBLISHED**: Admin publishes (visible to students)

## API Endpoints

### Authentication
- `POST /auth/login` - Login
- `GET /auth/me` - Get current user

### Attendance (Direct Update)
- `POST /attendance` - Mark attendance (Teacher/Admin)
- `POST /attendance/bulk` - Bulk mark attendance
- `GET /attendance/class/:classId` - Get class attendance
- `GET /attendance/student/:studentId` - Get student attendance

### Marks (Approval Workflow)
- `POST /markcards` - Create marks draft (Teacher)
- `PATCH /markcards/:id/submit` - Submit for approval (Teacher)
- `PATCH /markcards/edit-request/:id/approve` - Approve marks (Admin)
- `PATCH /markcards/:id/publish` - Publish marks (Admin)
- `GET /markcards/student/:studentId` - Get published marks (Student)
- `GET /markcards/pending-approvals` - Get approval queue (Admin)

## Database Schema

12 MongoDB collections:
- users, students, teachers, classes
- attendance, homework, timetable, events
- markcards, fees, edit_requests
- notifications, audit_logs

## Security Rules

✅ Role comes from database, never from frontend
✅ Teachers can only access their assigned class
✅ Students can only see their own data
✅ Draft/pending marks are hidden from students
✅ All sensitive actions are audited
✅ Backend validates all permissions

## Development Scripts

Backend:
```bash
npm run start:dev    # Start development server
npm run seed         # Seed database with sample data
npm run build        # Build for production
```

Frontend:
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

## Next Steps

1. ✅ Complete remaining API modules (homework, timetable, fees)
2. ✅ Build React frontend components
3. ✅ Implement analytics endpoints
4. ✅ Add comprehensive testing
5. ✅ Deploy to production

## License

ISC
