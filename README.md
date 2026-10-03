# Sri Amman Transport - Goods Booking App

A full-stack web application for booking construction materials, bricks, sand, and transport goods with live dispatch tracking, driver management, automated cancellation windows, and admin control panels.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, React Icons, Axios, React Toastify
- **Backend**: Node.js, Express, MongoDB (Mongoose), Socket.io, Cloudinary, JWT Authentication, Nodemailer

## Getting Started

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in your database and environment credentials in .env
npm run dev # or node server.js
```

### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Features
- Real-time stock availability and vehicle allocation
- Driver assignment and live status management
- Strict 24-hour self-cancellation window from booking timestamp
- Admin dashboard for booking reviews, stock updates, and history tracking
- Bilingual support (English / Tamil) and dark/light mode themes
