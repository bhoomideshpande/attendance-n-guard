const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// PostgreSQL connection - Use environment variable or individual params
const pool = new Pool({
  host: process.env.DB_HOST || 'aws-1-ap-south-1.pooler.supabase.com',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres.sgmdpyixfvezdcnqbbmo',
  password: process.env.DB_PASSWORD || 'Sucrose@09',
  ssl: { rejectUnauthorized: false }
});

// Initialize tables
async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        phone TEXT,
        "instituteCode" TEXT,
        role TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        "firstName" TEXT,
        "lastName" TEXT,
        phone TEXT,
        "instituteCode" TEXT,
        batch TEXT,
        photo TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        "studentId" INTEGER REFERENCES students(id) ON DELETE CASCADE,
        date TEXT,
        status TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ PostgreSQL database tables initialized');
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    client.release();
  }
}

// Initialize on startup
initDB();

// Users helpers
async function getUserByEmail(email) {
  try {
    const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return res.rows[0] || null;
  } catch (err) {
    console.error('getUserByEmail error:', err);
    return null;
  }
}

async function getAllUsers() {
  try {
    const res = await pool.query('SELECT id, name, email, role, "instituteCode" FROM users');
    return res.rows;
  } catch (err) {
    console.error('getAllUsers error:', err);
    return [];
  }
}

async function getUserById(id) {
  try {
    const res = await pool.query('SELECT id, name, email, role, "instituteCode" FROM users WHERE id = $1', [id]);
    return res.rows[0] || null;
  } catch (err) {
    console.error('getUserById error:', err);
    return null;
  }
}

async function deleteUser(id) {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
  } catch (err) {
    console.error('deleteUser error:', err);
  }
}

async function createUser({ name, email, password, phone, instituteCode, role = 'user' }) {
  const hashedPassword = bcrypt.hashSync(password, 10);
  const result = await pool.query(
    `INSERT INTO users (name, email, password, phone, "instituteCode", role) 
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [name || '', email, hashedPassword, phone || '', instituteCode || '', role]
  );
  return result.rows[0].id;
}

async function createDefaultAdminIfMissing() {
  const admin = await getUserByEmail('admin@example.com');
  if (!admin) {
    const pwd = bcrypt.hashSync('adminpass', 10);
    await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
      ['Admin', 'admin@example.com', pwd, 'admin']
    );
    console.log('✅ Default admin created: admin@example.com / adminpass');
  }
}

// Students
async function createStudent(data) {
  const result = await pool.query(
    `INSERT INTO students ("firstName", "lastName", phone, "instituteCode", batch, photo)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [
      data.firstName || '',
      data.lastName || '',
      data.phone || '',
      data.instituteCode || '',
      data.batch || '',
      data.photo || null
    ]
  );
  return result.rows[0].id;
}

async function getAllStudents() {
  try {
    const res = await pool.query('SELECT * FROM students ORDER BY id DESC');
    return res.rows;
  } catch (err) {
    console.error('getAllStudents error:', err);
    return [];
  }
}

async function getStudentsByInstitute(instituteCode) {
  try {
    const res = await pool.query('SELECT * FROM students WHERE "instituteCode" = $1 ORDER BY id DESC', [instituteCode]);
    return res.rows;
  } catch (err) {
    console.error('getStudentsByInstitute error:', err);
    return [];
  }
}

async function getStudentById(id) {
  try {
    const res = await pool.query('SELECT * FROM students WHERE id = $1', [id]);
    return res.rows[0] || null;
  } catch (err) {
    console.error('getStudentById error:', err);
    return null;
  }
}

async function updateStudent(id, data) {
  const fields = [];
  const values = [];
  let paramCount = 1;

  if (data.firstName !== undefined) { fields.push(`"firstName" = $${paramCount++}`); values.push(data.firstName); }
  if (data.lastName !== undefined) { fields.push(`"lastName" = $${paramCount++}`); values.push(data.lastName); }
  if (data.phone !== undefined) { fields.push(`phone = $${paramCount++}`); values.push(data.phone); }
  if (data.instituteCode !== undefined) { fields.push(`"instituteCode" = $${paramCount++}`); values.push(data.instituteCode); }
  if (data.batch !== undefined) { fields.push(`batch = $${paramCount++}`); values.push(data.batch); }
  if (data.photo !== undefined) { fields.push(`photo = $${paramCount++}`); values.push(data.photo); }

  if (fields.length === 0) return;

  values.push(id);
  await pool.query(`UPDATE students SET ${fields.join(', ')} WHERE id = $${paramCount}`, values);
}

async function deleteStudent(id) {
  await pool.query('DELETE FROM students WHERE id = $1', [id]);
}

// Attendance
async function recordAttendance({ studentId, date, status }) {
  const result = await pool.query(
    'INSERT INTO attendance ("studentId", date, status) VALUES ($1, $2, $3) RETURNING id',
    [studentId, date, status]
  );
  return result.rows[0].id;
}

async function deleteAttendanceForStudentDate(studentId, date) {
  await pool.query('DELETE FROM attendance WHERE "studentId" = $1 AND date = $2', [studentId, date]);
}

async function getAttendanceByDate(date, instituteCode = null) {
  try {
    if (instituteCode) {
      const res = await pool.query(
        `SELECT a.*, s."firstName", s."lastName", s."instituteCode" 
         FROM attendance a JOIN students s ON s.id = a."studentId" 
         WHERE date = $1 AND s."instituteCode" = $2 ORDER BY s."firstName"`,
        [date, instituteCode]
      );
      return res.rows;
    }
    const res = await pool.query(
      `SELECT a.*, s."firstName", s."lastName", s."instituteCode" 
       FROM attendance a JOIN students s ON s.id = a."studentId" 
       WHERE date = $1 ORDER BY s."firstName"`,
      [date]
    );
    return res.rows;
  } catch (err) {
    console.error('getAttendanceByDate error:', err);
    return [];
  }
}

async function getAttendance(from, to, instituteCode = null) {
  try {
    if (instituteCode) {
      if (from && to) {
        const res = await pool.query(
          `SELECT a.*, s."firstName", s."lastName", s."instituteCode" 
           FROM attendance a JOIN students s ON s.id = a."studentId" 
           WHERE date BETWEEN $1 AND $2 AND s."instituteCode" = $3 ORDER BY date DESC`,
          [from, to, instituteCode]
        );
        return res.rows;
      }
      const res = await pool.query(
        `SELECT a.*, s."firstName", s."lastName", s."instituteCode" 
         FROM attendance a JOIN students s ON s.id = a."studentId" 
         WHERE s."instituteCode" = $1 ORDER BY date DESC`,
        [instituteCode]
      );
      return res.rows;
    }
    if (from && to) {
      const res = await pool.query(
        `SELECT a.*, s."firstName", s."lastName", s."instituteCode" 
         FROM attendance a JOIN students s ON s.id = a."studentId" 
         WHERE date BETWEEN $1 AND $2 ORDER BY date DESC`,
        [from, to]
      );
      return res.rows;
    }
    const res = await pool.query(
      `SELECT a.*, s."firstName", s."lastName", s."instituteCode" 
       FROM attendance a JOIN students s ON s.id = a."studentId" ORDER BY date DESC`
    );
    return res.rows;
  } catch (err) {
    console.error('getAttendance error:', err);
    return [];
  }
}

async function getAttendanceSummary(instituteCode = null) {
  try {
    if (instituteCode) {
      const res = await pool.query(
        `SELECT s.id, s."firstName", s."lastName", s."instituteCode",
         COALESCE(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END), 0)::int as present_count,
         COUNT(a.id)::int as total_records
         FROM students s LEFT JOIN attendance a ON a."studentId" = s.id
         WHERE s."instituteCode" = $1
         GROUP BY s.id ORDER BY s.id`,
        [instituteCode]
      );
      return res.rows;
    }
    const res = await pool.query(
      `SELECT s.id, s."firstName", s."lastName", s."instituteCode",
       COALESCE(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END), 0)::int as present_count,
       COUNT(a.id)::int as total_records
       FROM students s LEFT JOIN attendance a ON a."studentId" = s.id
       GROUP BY s.id ORDER BY s.id`
    );
    return res.rows;
  } catch (err) {
    console.error('getAttendanceSummary error:', err);
    return [];
  }
}

module.exports = {
  getUserByEmail, getAllUsers, getUserById, deleteUser, createDefaultAdminIfMissing, createUser,
  createStudent, getAllStudents, getStudentsByInstitute, getStudentById, updateStudent, deleteStudent,
  recordAttendance, deleteAttendanceForStudentDate, getAttendanceByDate, getAttendance, getAttendanceSummary
};
