# Attendance N Guard - Backend

Simple Express.js + SQLite backend for the Attendance N Guard frontend.

Features:
- JWT auth (admin & basic users)
- Student CRUD
- Attendance records
- Photo upload (local `uploads/`)
- SQLite DB using better-sqlite3

Run:
1. npm install
2. npm start

Default admin created:
- email: admin@example.com
- password: adminpass

Adjust `JWT_SECRET` in environment or in `server.js` for production.
