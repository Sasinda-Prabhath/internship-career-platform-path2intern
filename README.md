# Internship Career Platform (Path2Intern)

A comprehensive platform for managing internships, career opportunities, and recruitment processes.

## Project Structure

This is a monorepo containing:

```
internship-career-platform/
├── apps/
│   ├── backend/     # Node.js/Express API server
│   └── frontend/    # React + Vite web application
```

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (Atlas or local instance)
- npm or yarn

## Getting Started

### Installation

Install dependencies for all workspaces:

```bash
npm run install:all
```

Or install individually:

```bash
# Root dependencies
npm install

# Backend dependencies
cd apps/backend
npm install

# Frontend dependencies
cd apps/frontend
npm install
```

### Environment Configuration

1. **Backend**: Copy `.env.example` to `.env` in `apps/backend/` and configure your environment variables
2. **Frontend**: Copy `.env.example` to `.env` in `apps/frontend/` (if applicable)

### Running the Application

**Development Mode (Both servers):**
```bash
npm run dev
```

**Backend only:**
```bash
npm run dev:backend
```

**Frontend only:**
```bash
npm run dev:frontend
```

### Production

**Backend:**
```bash
npm run start:backend
```

**Frontend:**
```bash
npm run build:frontend
```

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Nodemailer
- Multer (file uploads)

### Frontend
- React 19
- Vite
- React Router
- Axios
- Tailwind CSS

## Features

- Multi-role authentication system
- Job posting and management
- Quiz/Question bank system
- Organization management
- Invite system
- Contact management
- File upload capabilities

## License

ISC
