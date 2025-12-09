const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');
const db = new Database(path.join(__dirname, 'data.db'));

// Initialize tables
db.prepare(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT UNIQUE,
  password TEXT,
  phone TEXT,
  instituteCode TEXT,
  role TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firstName TEXT,
  lastName TEXT,
  phone TEXT,
  instituteCode TEXT,
  batch TEXT,
  photo TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  studentId INTEGER,
  date TEXT,
  status TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(studentId) REFERENCES students(id)
)`).run();

// Users helpers
function getUserByEmail(email){ 
  return db.prepare('SELECT * FROM users WHERE email=?').get(email);
}
function getAllUsers(){ return db.prepare('SELECT id,name,email,role FROM users').all(); }

function createUser({ name, email, password, phone, instituteCode, role = 'user' }) {
  const hashedPassword = bcrypt.hashSync(password, 10);
  const stmt = db.prepare(`INSERT INTO users (name, email, password, phone, instituteCode, role) 
    VALUES (@name, @email, @password, @phone, @instituteCode, @role)`);
  const info = stmt.run({
    name: name || '',
    email,
    password: hashedPassword,
    phone: phone || '',
    instituteCode: instituteCode || '',
    role
  });
  return info.lastInsertRowid;
}
function createDefaultAdminIfMissing(){
  const admin = getUserByEmail('admin@example.com');
  if (!admin) {
    const pwd = bcrypt.hashSync('adminpass', 10);
    db.prepare('INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)')
      .run('Admin','admin@example.com',pwd,'admin');
    console.log('Default admin created: admin@example.com / adminpass');
  }
}

// Students
function createStudent(data){
  const stmt = db.prepare(`INSERT INTO students (firstName,lastName,phone,instituteCode,batch,photo)
    VALUES (@firstName,@lastName,@phone,@instituteCode,@batch,@photo)`);
  const info = stmt.run({
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    phone: data.phone || '',
    instituteCode: data.instituteCode || '',
    batch: data.batch || '',
    photo: data.photo || ''
  });
  return info.lastInsertRowid;
}
function getAllStudents(){ return db.prepare('SELECT * FROM students ORDER BY id DESC').all(); }
function getStudentsByInstitute(instituteCode){ 
  return db.prepare('SELECT * FROM students WHERE instituteCode = ? ORDER BY id DESC').all(instituteCode); 
}
function getStudentById(id){ return db.prepare('SELECT * FROM students WHERE id=?').get(id); }
function updateStudent(id, data){
  const stmt = db.prepare(`UPDATE students SET firstName=@firstName,lastName=@lastName,phone=@phone,
    instituteCode=@instituteCode,batch=@batch,photo=@photo WHERE id=@id`);
  stmt.run({
    id, firstName: data.firstName || '', lastName: data.lastName || '', phone: data.phone || '',
    instituteCode: data.instituteCode || '', batch: data.batch || '', photo: data.photo || ''
  });
}
function deleteStudent(id){ db.prepare('DELETE FROM students WHERE id=?').run(id); }

// Attendance
function recordAttendance({studentId, date, status}){
  const info = db.prepare('INSERT INTO attendance (studentId,date,status) VALUES (?,?,?)')
    .run(studentId, date, status);
  return info.lastInsertRowid;
}

function deleteAttendanceForStudentDate(studentId, date) {
  db.prepare('DELETE FROM attendance WHERE studentId = ? AND date = ?').run(studentId, date);
}

function getAttendanceByDate(date, instituteCode = null) {
  if (instituteCode) {
    return db.prepare('SELECT a.*, s.firstName, s.lastName, s.instituteCode FROM attendance a JOIN students s ON s.id=a.studentId WHERE date = ? AND s.instituteCode = ? ORDER BY s.firstName')
      .all(date, instituteCode);
  }
  return db.prepare('SELECT a.*, s.firstName, s.lastName, s.instituteCode FROM attendance a JOIN students s ON s.id=a.studentId WHERE date = ? ORDER BY s.firstName')
    .all(date);
}

function getAttendance(from, to, instituteCode = null){
  if (instituteCode) {
    if (from && to) {
      return db.prepare('SELECT a.*, s.firstName, s.lastName, s.instituteCode FROM attendance a JOIN students s ON s.id=a.studentId WHERE date BETWEEN ? AND ? AND s.instituteCode = ? ORDER BY date DESC')
        .all(from, to, instituteCode);
    }
    return db.prepare('SELECT a.*, s.firstName, s.lastName, s.instituteCode FROM attendance a JOIN students s ON s.id=a.studentId WHERE s.instituteCode = ? ORDER BY date DESC').all(instituteCode);
  }
  if (from && to) {
    return db.prepare('SELECT a.*, s.firstName, s.lastName, s.instituteCode FROM attendance a JOIN students s ON s.id=a.studentId WHERE date BETWEEN ? AND ? ORDER BY date DESC')
      .all(from, to);
  }
  return db.prepare('SELECT a.*, s.firstName, s.lastName, s.instituteCode FROM attendance a JOIN students s ON s.id=a.studentId ORDER BY date DESC').all();
}

function getAttendanceSummary(instituteCode = null){
  if (instituteCode) {
    return db.prepare(`SELECT s.id, s.firstName, s.lastName, s.instituteCode,
      SUM(CASE WHEN a.status='present' THEN 1 ELSE 0 END) as present_count,
      COUNT(a.id) as total_records
      FROM students s LEFT JOIN attendance a ON a.studentId=s.id
      WHERE s.instituteCode = ?
      GROUP BY s.id ORDER BY s.id`).all(instituteCode);
  }
  return db.prepare(`SELECT s.id, s.firstName, s.lastName, s.instituteCode,
    SUM(CASE WHEN a.status='present' THEN 1 ELSE 0 END) as present_count,
    COUNT(a.id) as total_records
    FROM students s LEFT JOIN attendance a ON a.studentId=s.id
    GROUP BY s.id ORDER BY s.id`).all();
}

module.exports = {
  getUserByEmail, getAllUsers, createDefaultAdminIfMissing, createUser,
  createStudent, getAllStudents, getStudentsByInstitute, getStudentById, updateStudent, deleteStudent,
  recordAttendance, deleteAttendanceForStudentDate, getAttendanceByDate, getAttendance, getAttendanceSummary
};
