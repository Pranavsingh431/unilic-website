# Unilic Web Platform

Unilic is a modern academic management platform built for colleges to manage courses, attendance, grading, and student engagement through a clean multi-application architecture.

This repository contains the web applications that power the Unilic platform: a landing site, a student portal, and a faculty portal.

## Overview

Unilic is organized as a multi-app Next.js workspace so each application can be developed, deployed, and scaled independently while sharing a consistent product direction.

- `landing/` - public-facing website and entry point for users
- `student/` - student portal for courses, attendance, grades, and academic activity
- `faculty/` - faculty portal for course management, grading, and attendance workflows

## Live Applications

- Landing Page: [unilic-website-landing.vercel.app](https://unilic-website-landing.vercel.app)
- Student Portal: [unilic-website-student.vercel.app](https://unilic-website-student.vercel.app)
- Faculty Portal: [unilic-website-faculty.vercel.app](https://unilic-website-faculty.vercel.app)

## Tech Stack

- Next.js 14
- React 18
- Supabase
- PostgreSQL
- Vercel
- Tailwind CSS

## Repository Structure

```text
unilic-website/
├── faculty/
├── landing/
├── student/
├── package.json
└── README.md
```

## Architecture

```text
Landing Page
    ├── redirects users to the appropriate portal
    ├── Student Portal
    └── Faculty Portal

Student Portal / Faculty Portal
    └── Supabase
        ├── Authentication
        ├── Database
        └── API layer
```

Key architectural notes:

- Each app is a standalone Next.js project.
- The student and faculty apps rely on Supabase for auth and backend data access.
- The landing app acts as the public entry point and routes users into role-based portals.
- Applications are deployed independently on Vercel.

## Core Features

### Student Portal

- Join courses using course codes
- View attendance records
- Track grades and academic progress
- Access course-related resources

### Faculty Portal

- Create and manage courses
- Track student attendance
- Upload and manage marks
- Use grading and academic workflow tools

### Landing Page

- Present the platform to new users
- Provide role-based entry into student and faculty portals
- Act as the public-facing marketing and onboarding surface

## Environment Variables

Each app requires environment variables to run correctly.

### Shared variables for `student/` and `faculty/`

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### Additional variables for `landing/`

```env
NEXT_PUBLIC_FACULTY_URL=
NEXT_PUBLIC_STUDENT_URL=
```

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm

### Installation

Clone the repository and install dependencies from the project root:

```bash
git clone https://github.com/Pranavsingh431/unilic-website.git
cd unilic-website
npm install
```

Because this repository uses npm workspaces, installing once at the root sets up dependencies for all three applications.

## Running Locally

You can start each app from the repository root using workspace scripts:

```bash
npm run dev:landing
npm run dev:faculty
npm run dev:student
```

Default local ports:

- Landing: `http://localhost:3000`
- Faculty: `http://localhost:3001`
- Student: `http://localhost:3002`

You can also run an app directly from inside its folder:

```bash
cd landing
npm run dev
```

Repeat the same pattern for `faculty/` and `student/`.

## Build Commands

Build each app independently from the root:

```bash
npm run build:landing
npm run build:faculty
npm run build:student
```

## Deployment

Each application is deployed separately on Vercel.

| App | Root Directory |
| --- | --- |
| Landing | `landing` |
| Faculty | `faculty` |
| Student | `student` |

This setup allows each app to have its own deployment pipeline, environment variables, and domain configuration.

## Development Notes

- Environment variables must be configured per app in local development and in Vercel.
- The apps are independent and do not depend on cross-folder runtime imports.
- Supabase authentication and database policies are central to secure access control.
- The current structure is designed to support future scaling across institutions and user roles.

## Future Improvements

- Custom subdomains such as `student.unilic.com` and `faculty.unilic.com`
- Analytics and admin insights
- Expanded role-based permissions
- Performance and UX optimizations

## Author

Pranav Singh  
IIT Ropar

## Contributing

Contributions, feedback, and improvements are welcome. If you are planning a significant change, open an issue first to discuss the scope and approach.

## License

Add a license here if you plan to open-source the project under a specific license.
