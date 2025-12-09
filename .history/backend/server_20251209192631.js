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
      user: { id: user.id, name: user.name, email: user.email, role: user.role } 
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
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// Create default admin if missing
db.createDefaultAdminIfMissing();

// Students CRUD
app.get('/api/students', authMiddleware, (req, res) => {
  const students = db.getAllStudents();
  res.json(students);
});
app.get('/api/students/:id', authMiddleware, (req, res) => {
  const s = db.getStudentById(req.params.id);
  if (!s) return res.status(404).json({ error: 'Not found' });
  res.json(s);
});
app.post('/api/students', authMiddleware, upload.single('photo'), (req, res) => {
  const data = req.body;
  if (req.file) data.photo = '/uploads/' + req.file.filename;
  const id = db.createStudent(data);
  res.status(201).json({ id });
});
app.put('/api/students/:id', authMiddleware, upload.single('photo'), (req, res) => {
  const data = req.body;
  if (req.file) data.photo = '/uploads/' + req.file.filename;
  db.updateStudent(req.params.id, data);
  res.json({ ok: true });
});
app.delete('/api/students/:id', authMiddleware, (req, res) => {
  db.deleteStudent(req.params.id);
  res.json({ ok: true });
});

// Attendance
app.post('/api/attendance', authMiddleware, (req, res) => {
  const { studentId, date, status } = req.body;
  const id = db.recordAttendance({ studentId, date, status });
  res.json({ id });
});
app.get('/api/attendance', authMiddleware, (req, res) => {
  const { from, to } = req.query;
  const records = db.getAttendance(from, to);
  res.json(records);
});

// Reports - simple aggregated report
app.get('/api/reports/summary', authMiddleware, (req, res) => {
  const report = db.getAttendanceSummary();
  res.json(report);
});

// Users - for admin
app.get('/api/users', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const users = db.getAllUsers();
  res.json(users);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log('Server listening on', PORT));
