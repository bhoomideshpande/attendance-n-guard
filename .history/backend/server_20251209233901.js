const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_secret';
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check / root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'NCC Attendance Portal API',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      auth: ['POST /api/auth/register', 'POST /api/auth/login'],
      students: ['GET /api/students', 'POST /api/students', 'GET /api/students/:id', 'PUT /api/students/:id', 'DELETE /api/students/:id'],
      attendance: ['GET /api/attendance', 'POST /api/attendance'],
      reports: ['GET /api/reports/summary']
    }
  });
});

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Helpers
function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing token' });
  const parts = auth.split(' ');
  if (parts.length !== 2) return res.status(401).json({ error: 'Invalid token' });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Auth routes
app.post('/api/auth/register', (req, res) => {
  const { firstName, lastName, email, password, confirmPassword, phone, instituteCode } = req.body;
  
  // Validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  
  // Check if user already exists
  const existingUser = db.getUserByEmail(email);
  if (existingUser) {
    return res.status(409).json({ error: 'User with this email already exists' });
  }
  
  try {
    const name = `${firstName || ''} ${lastName || ''}`.trim();
    const userId = db.createUser({ name, email, password, phone, instituteCode });
    const user = db.getUserByEmail(email);
    const token = generateToken(user);
    res.status(201).json({ 
      message: 'Registration successful',
      token, 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        instituteCode: user.instituteCode || null
      } 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  const user = db.getUserByEmail(email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = bcrypt.compareSync(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = generateToken(user);
  res.json({ 
    token, 
    user: { 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      role: user.role,
      instituteCode: user.instituteCode || null
    } 
  });
});

// Create default admin if missing
db.createDefaultAdminIfMissing();

// Validation helpers
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone) {
  if (!phone) return true; // Optional field
  const phoneRegex = /^[0-9]{10,15}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

function validateDate(dateString) {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

function validateStudentData(data, isUpdate = false) {
  const errors = [];
  
  if (!isUpdate) {
    if (!data.firstName || data.firstName.trim().length < 1) {
      errors.push('First name is required');
    }
    if (!data.lastName || data.lastName.trim().length < 1) {
      errors.push('Last name is required');
    }
  }
  
  if (data.firstName && data.firstName.length > 100) {
    errors.push('First name must be less than 100 characters');
  }
  if (data.lastName && data.lastName.length > 100) {
    errors.push('Last name must be less than 100 characters');
  }
  if (data.phone && !validatePhone(data.phone)) {
    errors.push('Invalid phone number format');
  }
  if (data.email && !validateEmail(data.email)) {
    errors.push('Invalid email format');
  }
  if (data.batch && !/^\d{4}$/.test(data.batch)) {
    errors.push('Batch must be a valid year (e.g., 2025)');
  }
  
  return errors;
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Students CRUD
app.get('/api/students', authMiddleware, (req, res) => {
  try {
    // Get user's institute from the token
    const userEmail = req.user.email;
    const user = db.getUserByEmail(userEmail);
    
    let students;
    // Admin can see all students, staff can only see their institute's students
    if (req.user.role === 'admin') {
      students = db.getAllStudents();
    } else if (user && user.instituteCode) {
      students = db.getStudentsByInstitute(user.instituteCode);
    } else {
      students = db.getAllStudents(); // Fallback if no institute set
    }
    
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

app.get('/api/students/:id', authMiddleware, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid student ID' });
    }
    const s = db.getStudentById(id);
    if (!s) return res.status(404).json({ error: 'Student not found' });
    
    // Staff can only view students from their institute
    if (req.user.role !== 'admin' && s.instituteCode !== req.user.instituteCode) {
      return res.status(403).json({ error: 'Access denied: Student belongs to a different institute' });
    }
    
    res.json(s);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

app.post('/api/students', authMiddleware, upload.single('photo'), (req, res) => {
  try {
    const data = req.body;
    
    // Staff can only create students for their own institute
    if (req.user.role !== 'admin' && req.user.instituteCode) {
      data.instituteCode = req.user.instituteCode; // Override with staff's institute
    }
    
    // Validate input
    const errors = validateStudentData(data);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    if (req.file) data.photo = '/uploads/' + req.file.filename;
    const id = db.createStudent(data);
    res.status(201).json({ id, message: 'Student created successfully' });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

app.put('/api/students/:id', authMiddleware, upload.single('photo'), (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid student ID' });
    }
    
    // Check if student exists
    const existing = db.getStudentById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Staff can only edit students from their institute
    if (req.user.role !== 'admin' && existing.instituteCode !== req.user.instituteCode) {
      return res.status(403).json({ error: 'Access denied: Student belongs to a different institute' });
    }
    
    const data = req.body;
    
    // Staff cannot change a student's institute
    if (req.user.role !== 'admin' && data.instituteCode && data.instituteCode !== req.user.instituteCode) {
      return res.status(403).json({ error: 'Access denied: Cannot transfer student to a different institute' });
    }
    
    // Validate input
    const errors = validateStudentData(data, true);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    if (req.file) data.photo = '/uploads/' + req.file.filename;
    db.updateStudent(id, data);
    res.json({ ok: true, message: 'Student updated successfully' });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

app.delete('/api/students/:id', authMiddleware, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid student ID' });
    }
    
    // Check if student exists
    const existing = db.getStudentById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    db.deleteStudent(id);
    res.json({ ok: true, message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// Attendance
app.post('/api/attendance', authMiddleware, (req, res) => {
  try {
    const { studentId, date, status } = req.body;
    
    // Validation
    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }
    if (!date || !validateDate(date)) {
      return res.status(400).json({ error: 'Valid date is required' });
    }
    if (!status || !['present', 'absent'].includes(status.toLowerCase())) {
      return res.status(400).json({ error: 'Status must be "present" or "absent"' });
    }
    
    // Check if student exists
    const student = db.getStudentById(parseInt(studentId));
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const id = db.recordAttendance({ studentId: parseInt(studentId), date, status: status.toLowerCase() });
    res.json({ id, message: 'Attendance recorded successfully' });
  } catch (error) {
    console.error('Error recording attendance:', error);
    res.status(500).json({ error: 'Failed to record attendance' });
  }
});

app.post('/api/attendance/bulk', authMiddleware, (req, res) => {
  try {
    const { date, records } = req.body;
    
    if (!date || !validateDate(date)) {
      return res.status(400).json({ error: 'Valid date is required' });
    }
    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'Records array is required and must not be empty' });
    }
    
    // Validate each record
    for (const record of records) {
      if (!record.studentId) {
        return res.status(400).json({ error: 'Each record must have a studentId' });
      }
      if (!record.status || !['present', 'absent'].includes(record.status.toLowerCase())) {
        return res.status(400).json({ error: 'Each record must have status "present" or "absent"' });
      }
    }
    
    let count = 0;
    for (const record of records) {
      // Delete existing record for this student on this date, then insert new one
      db.deleteAttendanceForStudentDate(parseInt(record.studentId), date);
      db.recordAttendance({ 
        studentId: parseInt(record.studentId), 
        date, 
        status: record.status.toLowerCase() 
      });
      count++;
    }
    
    res.json({ ok: true, count, message: `Attendance saved for ${count} students` });
  } catch (error) {
    console.error('Error saving bulk attendance:', error);
    res.status(500).json({ error: 'Failed to save attendance' });
  }
});

app.get('/api/attendance', authMiddleware, (req, res) => {
  try {
    const { from, to, date } = req.query;
    const user = req.user;
    // Staff can only see attendance for their institute
    const instituteCode = user.role === 'admin' ? null : user.instituteCode;
    
    if (date) {
      if (!validateDate(date)) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
      const records = db.getAttendanceByDate(date, instituteCode);
      return res.json(records);
    }
    
    if (from && !validateDate(from)) {
      return res.status(400).json({ error: 'Invalid "from" date format' });
    }
    if (to && !validateDate(to)) {
      return res.status(400).json({ error: 'Invalid "to" date format' });
    }
    
    const records = db.getAttendance(from, to, instituteCode);
    res.json(records);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
});

// Reports - simple aggregated report
app.get('/api/reports/summary', authMiddleware, (req, res) => {
  try {
    const user = req.user;
    // Staff can only see reports for their institute
    const instituteCode = user.role === 'admin' ? null : user.instituteCode;
    const report = db.getAttendanceSummary(instituteCode);
    res.json(report);
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Users - for admin
app.get('/api/users', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    const users = db.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log('Server listening on', PORT));
