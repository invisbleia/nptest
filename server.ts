import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const { Pool, Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const CONFIG_FILE = path.resolve(__dirname, 'db-config.json');

app.use(express.json());

// Persistent Connection Storage Helpers
function loadSavedConfig(): { connectionString?: string; autoConnect?: boolean } | null {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      return data;
    }
  } catch (e) {
    console.error('Error reading db-config.json:', e);
  }
  return null;
}

function saveConfig(connStr: string) {
  try {
    fs.writeFileSync(
      CONFIG_FILE,
      JSON.stringify(
        {
          connectionString: connStr,
          savedAt: new Date().toISOString(),
          autoConnect: true,
        },
        null,
        2
      )
    );
    console.log('✓ Successfully persisted PostgreSQL connection to db-config.json');
  } catch (e) {
    console.error('Error writing db-config.json:', e);
  }
}

function clearSavedConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify({ autoConnect: false }, null, 2));
    }
  } catch (e) {
    console.error('Error clearing db-config.json:', e);
  }
}

// Active Postgres pool state (Strictly REAL database only, ZERO mock fallback)
interface ActiveConnectionInfo {
  isConnected: boolean;
  type: 'coolify_postgres';
  connectionStringMasked?: string;
  host?: string;
  database?: string;
  user?: string;
  port?: number;
  serverVersion?: string;
  connectedAt?: string;
  tableExists?: boolean;
  latencyMs?: number;
  dbSize?: string;
}

let activePool: pg.Pool | null = null;
let activeConnectionInfo: ActiveConnectionInfo = {
  isConnected: false,
  type: 'coolify_postgres',
};

// Helper: Build config from connection string or individual params
function buildPgConfig(input: {
  connectionString?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  ssl?: boolean;
}) {
  const { connectionString, host, port, user, password, database, ssl } = input;
  let sslConfig: boolean | { rejectUnauthorized: boolean } = false;

  if (connectionString) {
    const hasSslParam = connectionString.includes('sslmode=require') || connectionString.includes('ssl=true');
    if (ssl || hasSslParam) {
      sslConfig = { rejectUnauthorized: false };
    }
    return {
      connectionString,
      ssl: sslConfig || undefined,
      connectionTimeoutMillis: 10000,
    };
  }

  if (ssl) {
    sslConfig = { rejectUnauthorized: false };
  }

  return {
    host: host || 'localhost',
    port: port ? Number(port) : 5432,
    user: user || 'postgres',
    password: password || '',
    database: database || 'postgres',
    ssl: sslConfig ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
  };
}

// Mask sensitive password and host/IP in connection string for safe UI display
function maskConnectionString(connStr?: string): string {
  if (!connStr) return '';
  return connStr
    .replace(/(postgres(?:ql)?:\/\/[^:]+:)([^@]+)(@)/i, '$1••••••••$3')
    .replace(/(@)([^:\/]+)/i, '$1••••••••');
}

// Function to initialize & verify pool connection
async function connectToDatabase(connStr: string): Promise<boolean> {
  try {
    const config = buildPgConfig({ connectionString: connStr });
    const pool = new Pool(config);
    const startTime = Date.now();
    const res = await pool.query('SELECT version(), current_database(), current_user');
    const latencyMs = Date.now() - startTime;

    // Check table existence
    const tableRes = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'students'
      ) as table_exists;
    `);

    let dbSize = 'Unknown';
    try {
      const sizeRes = await pool.query('SELECT pg_size_pretty(pg_database_size(current_database())) as size');
      if (sizeRes.rows[0]?.size) dbSize = sizeRes.rows[0].size;
    } catch (_) {}

    if (activePool) {
      await activePool.end().catch(() => {});
    }

    activePool = pool;
    activeConnectionInfo = {
      isConnected: true,
      type: 'coolify_postgres',
      connectionStringMasked: maskConnectionString(connStr),
      host: '•••••••• (Private Node)',
      serverVersion: res.rows[0].version,
      database: res.rows[0].current_database,
      user: res.rows[0].current_user,
      port: 5432,
      connectedAt: new Date().toISOString(),
      tableExists: Boolean(tableRes.rows[0]?.table_exists),
      latencyMs,
      dbSize,
    };

    console.log(`✓ Auto-connected to Coolify PostgreSQL [${activeConnectionInfo.database}] (${latencyMs}ms)`);
    return true;
  } catch (err: any) {
    console.error('Failed to auto-connect to PostgreSQL:', err.message);
    activePool = null;
    activeConnectionInfo.isConnected = false;
    return false;
  }
}

// On Startup: Auto-load saved configuration so user NEVER has to enter it again!
const initialConfig = loadSavedConfig();
const defaultConnectionString = initialConfig?.connectionString || process.env.DATABASE_URL;

if (defaultConnectionString && initialConfig?.autoConnect !== false) {
  connectToDatabase(defaultConnectionString);
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// 1. Health check & current DB connection status
app.get('/api/db/status', async (req: Request, res: Response) => {
  if (activePool) {
    try {
      const startTime = Date.now();
      const testRes = await activePool.query('SELECT version(), current_database(), current_user');
      const latencyMs = Date.now() - startTime;

      // Check if students table exists in public schema
      const tableRes = await activePool.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'students'
        ) as table_exists;
      `);

      let studentCount = 0;
      const tableExists = Boolean(tableRes.rows[0]?.table_exists);

      if (tableExists) {
        const countRes = await activePool.query('SELECT COUNT(*) FROM students');
        studentCount = Number(countRes.rows[0].count);
      }

      let dbSize = activeConnectionInfo.dbSize || 'Unknown';
      try {
        const sizeRes = await activePool.query('SELECT pg_size_pretty(pg_database_size(current_database())) as size');
        if (sizeRes.rows[0]?.size) dbSize = sizeRes.rows[0].size;
      } catch (_) {}

      activeConnectionInfo.tableExists = tableExists;
      activeConnectionInfo.latencyMs = latencyMs;
      activeConnectionInfo.dbSize = dbSize;

      res.json({
        ...activeConnectionInfo,
        isConnected: true,
        latencyMs,
        tableExists,
        studentCount,
        isAutoSaved: true,
      });
      return;
    } catch (error: any) {
      activePool = null;
      activeConnectionInfo.isConnected = false;
      res.json({
        isConnected: false,
        type: 'coolify_postgres',
        error: error.message,
        studentCount: 0,
      });
      return;
    }
  }

  // Not connected
  const saved = loadSavedConfig();
  res.json({
    ...activeConnectionInfo,
    isConnected: false,
    studentCount: 0,
    hasSavedConfig: Boolean(saved?.connectionString),
    message: 'Database is not connected. Connect your Coolify PostgreSQL to view and store real data.',
  });
});

// 2. Test PostgreSQL connection
app.post('/api/db/test', async (req: Request, res: Response) => {
  const { connectionString, host, port, user, password, database, ssl } = req.body;
  const config = buildPgConfig({ connectionString, host, port, user, password, database, ssl });

  const client = new Client(config);
  const startTime = Date.now();

  try {
    await client.connect();
    const versionRes = await client.query('SELECT version(), current_database(), current_user, NOW() as server_time');
    const latencyMs = Date.now() - startTime;

    // Fetch existing public tables
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    // Check if students table exists
    const hasStudentsTable = tablesRes.rows.some((r: any) => r.table_name === 'students');
    let studentCount = 0;

    if (hasStudentsTable) {
      const countRes = await client.query('SELECT COUNT(*) FROM students');
      studentCount = Number(countRes.rows[0].count);
    }

    let dbSize = 'Unknown';
    try {
      const sizeRes = await client.query('SELECT pg_size_pretty(pg_database_size(current_database())) as size');
      if (sizeRes.rows[0]?.size) dbSize = sizeRes.rows[0].size;
    } catch (_) {}

    await client.end();

    res.json({
      success: true,
      latencyMs,
      serverVersion: versionRes.rows[0].version,
      database: versionRes.rows[0].current_database,
      user: versionRes.rows[0].current_user,
      serverTime: versionRes.rows[0].server_time,
      dbSize,
      tables: tablesRes.rows.map((r: any) => r.table_name),
      hasStudentsTable,
      studentCount,
      message: 'Connection successful! Your Coolify PostgreSQL is reachable.',
    });
  } catch (error: any) {
    try {
      await client.end();
    } catch (_) {}

    let suggestion = 'Make sure the VPS IP and credentials are correct.';
    const msg = error.message || '';

    if (msg.includes('ECONNREFUSED')) {
      suggestion = 'Coolify Port is closed. Make sure "Is Publicly Accessible" is enabled with Port 5432.';
    } else if (msg.includes('ETIMEDOUT')) {
      suggestion = 'Connection timed out. Check VPS firewall allows port 5432.';
    } else if (msg.includes('password authentication failed')) {
      suggestion = 'Password or username is incorrect. Check Coolify environment variables.';
    }

    res.status(400).json({
      success: false,
      error: error.message,
      suggestion,
    });
  }
});

// 3. Connect & permanently save connection config
app.post('/api/db/connect', async (req: Request, res: Response) => {
  const { connectionString, host, port, user, password, database, ssl } = req.body;
  let finalUri = connectionString;

  if (!finalUri && host) {
    const p = port ? `:${port}` : ':5432';
    const auth = user ? (password ? `${user}:${password}@` : `${user}@`) : '';
    const db = database || 'postgres';
    const sslParam = ssl ? '?sslmode=require' : '?sslmode=disable';
    finalUri = `postgres://${auth}${host}${p}/${db}${sslParam}`;
  }

  if (!finalUri) {
    return res.status(400).json({ success: false, error: 'Connection string or parameters required' });
  }

  const success = await connectToDatabase(finalUri);

  if (success) {
    // Automatically save so user NEVER has to enter it again!
    saveConfig(finalUri);
    res.json({
      success: true,
      activeConnectionInfo,
      message: 'Successfully connected and saved Coolify PostgreSQL configuration!',
    });
  } else {
    res.status(400).json({
      success: false,
      error: 'Failed to connect to PostgreSQL with provided credentials.',
    });
  }
});

// 4. Disconnect from Coolify PostgreSQL
app.post('/api/db/disconnect', async (req: Request, res: Response) => {
  if (activePool) {
    await activePool.end().catch(() => {});
    activePool = null;
  }
  activeConnectionInfo = {
    isConnected: false,
    type: 'coolify_postgres',
  };
  clearSavedConfig();
  res.json({
    success: true,
    message: 'Disconnected from Coolify PostgreSQL and cleared auto-connect.',
    activeConnectionInfo,
  });
});

// 4.5 Verify administrator password to reveal infrastructure secrets
app.post('/api/auth/verify-secret', (req: Request, res: Response) => {
  const { password } = req.body;
  if (password === 'password') {
    const saved = loadSavedConfig();
    const rawConn = saved?.connectionString || process.env.DATABASE_URL || '';
    return res.json({
      success: true,
      rawConnectionString: rawConn,
      rawHost: '38.87.117.68',
      rawPort: 5432,
    });
  }
  return res.status(401).json({
    success: false,
    error: 'Incorrect administrator password. Access denied.',
  });
});

// 5. Initialize Students Table in Coolify PostgreSQL (Auto-migration + optional seed)
app.post('/api/db/init-tables', async (req: Request, res: Response) => {
  const { seedSampleData } = req.body;

  if (!activePool) {
    return res.status(400).json({
      success: false,
      error: 'No database connected. Please connect your Coolify PostgreSQL database first.',
    });
  }

  try {
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        roll_no VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100),
        department VARCHAR(100) NOT NULL,
        semester INT DEFAULT 1,
        gpa NUMERIC(3, 2) DEFAULT 0.00,
        enrollment_status VARCHAR(20) DEFAULT 'Active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    await activePool.query(createTableSql);

    let seededCount = 0;
    if (seedSampleData) {
      const countRes = await activePool.query('SELECT COUNT(*) FROM students');
      if (Number(countRes.rows[0].count) === 0) {
        const seedSql = `
          INSERT INTO students (name, roll_no, email, department, semester, gpa, enrollment_status)
          VALUES 
            ('Ali Huzaifa', 'CS-2024-001', 'ali.huzaifa@example.com', 'Computer Science', 4, 3.85, 'Active'),
            ('Sara Khan', 'SE-2024-042', 'sara.khan@example.com', 'Software Engineering', 3, 3.92, 'Active'),
            ('Hamza Ahmed', 'AI-2024-019', 'hamza.a@example.com', 'Artificial Intelligence', 5, 3.45, 'Active'),
            ('Zainab Fatima', 'DS-2023-088', 'zainab.f@example.com', 'Data Science', 6, 3.78, 'Graduated'),
            ('Bilal Tariq', 'EE-2024-112', 'bilal.t@example.com', 'Electrical Engineering', 2, 3.10, 'Active')
          ON CONFLICT (roll_no) DO NOTHING;
        `;
        const seedRes = await activePool.query(seedSql);
        seededCount = seedRes.rowCount || 5;
      }
    }

    activeConnectionInfo.tableExists = true;

    res.json({
      success: true,
      message: 'Table "students" created successfully in your Coolify PostgreSQL database!',
      seededCount,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 6. Students CRUD: List / Search (Strictly Real Coolify Database)
app.get('/api/students', async (req: Request, res: Response) => {
  const { search, department, status, sort } = req.query;

  if (!activePool) {
    return res.json({
      source: 'coolify_postgres',
      isConnected: false,
      tableExists: false,
      students: [],
      total: 0,
      message: 'No database connected. Please connect your Coolify PostgreSQL database.',
    });
  }

  try {
    const tableCheck = await activePool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'students'
      ) as table_exists;
    `);

    if (!tableCheck.rows[0]?.table_exists) {
      return res.json({
        source: 'coolify_postgres',
        isConnected: true,
        tableExists: false,
        students: [],
        total: 0,
        message: 'Table "students" does not exist yet. Click "Create Table" to initialize it.',
      });
    }

    let query = 'SELECT * FROM students WHERE 1=1';
    const params: any[] = [];
    let pIdx = 1;

    if (search && typeof search === 'string' && search.trim()) {
      query += ` AND (name ILIKE $${pIdx} OR roll_no ILIKE $${pIdx} OR email ILIKE $${pIdx})`;
      params.push(`%${search.trim()}%`);
      pIdx++;
    }

    if (department && department !== 'ALL') {
      query += ` AND department = $${pIdx}`;
      params.push(department);
      pIdx++;
    }

    if (status && status !== 'ALL') {
      query += ` AND enrollment_status = $${pIdx}`;
      params.push(status);
      pIdx++;
    }

    // Sort order
    if (sort === 'gpa_desc') {
      query += ' ORDER BY gpa DESC, id DESC';
    } else if (sort === 'name_asc') {
      query += ' ORDER BY name ASC';
    } else if (sort === 'roll_asc') {
      query += ' ORDER BY roll_no ASC';
    } else {
      query += ' ORDER BY id DESC';
    }

    const result = await activePool.query(query, params);
    return res.json({
      source: 'coolify_postgres',
      isConnected: true,
      tableExists: true,
      students: result.rows,
      total: result.rowCount,
    });
  } catch (error: any) {
    console.error('Error fetching students from PostgreSQL:', error);
    return res.status(500).json({ error: error.message, source: 'coolify_postgres' });
  }
});

// 7. Students CRUD: Create
app.post('/api/students', async (req: Request, res: Response) => {
  const { name, roll_no, email, department, semester, gpa, enrollment_status } = req.body;

  if (!activePool) {
    return res.status(400).json({
      error: 'Cannot add student: Database is not connected.',
    });
  }

  if (!name || !roll_no || !department) {
    return res.status(400).json({ error: 'Name, Roll Number, and Department are required.' });
  }

  try {
    const sql = `
      INSERT INTO students (name, roll_no, email, department, semester, gpa, enrollment_status, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *;
    `;
    const values = [
      name.trim(),
      roll_no.trim(),
      email ? email.trim() : '',
      department,
      Number(semester) || 1,
      Number(gpa) || 0.0,
      enrollment_status || 'Active',
    ];
    const result = await activePool.query(sql, values);
    return res.status(201).json({
      source: 'coolify_postgres',
      student: result.rows[0],
      message: 'Student record saved directly to Coolify PostgreSQL!',
    });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ error: `Roll Number "${roll_no}" already exists in Coolify PostgreSQL.` });
    }
    return res.status(500).json({ error: error.message });
  }
});

// 8. Students CRUD: Update
app.put('/api/students/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, roll_no, email, department, semester, gpa, enrollment_status } = req.body;

  if (!activePool) {
    return res.status(400).json({ error: 'Cannot update: Database is not connected.' });
  }

  try {
    const sql = `
      UPDATE students
      SET name = $1, roll_no = $2, email = $3, department = $4, semester = $5, gpa = $6, enrollment_status = $7, updated_at = NOW()
      WHERE id = $8
      RETURNING *;
    `;
    const values = [
      name,
      roll_no,
      email,
      department,
      Number(semester),
      Number(gpa),
      enrollment_status,
      Number(id),
    ];
    const result = await activePool.query(sql, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found in PostgreSQL.' });
    }
    return res.json({
      source: 'coolify_postgres',
      student: result.rows[0],
      message: 'Student updated successfully in Coolify PostgreSQL!',
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// 9. Students CRUD: Delete
app.delete('/api/students/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!activePool) {
    return res.status(400).json({ error: 'Cannot delete: Database is not connected.' });
  }

  try {
    const result = await activePool.query('DELETE FROM students WHERE id = $1 RETURNING id', [Number(id)]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found in PostgreSQL.' });
    }
    return res.json({
      source: 'coolify_postgres',
      success: true,
      message: 'Student deleted from Coolify PostgreSQL!',
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// 10. Execute Custom SQL Query (Live Console for testing Coolify DB)
app.post('/api/db/query', async (req: Request, res: Response) => {
  const { sql } = req.body;

  if (!sql || typeof sql !== 'string') {
    return res.status(400).json({ error: 'SQL query text is required.' });
  }

  if (!activePool) {
    return res.status(400).json({
      error: 'Cannot run SQL: No database connected. Please connect your Coolify PostgreSQL database first.',
    });
  }

  const startTime = Date.now();
  try {
    const result = await activePool.query(sql);
    const durationMs = Date.now() - startTime;

    res.json({
      success: true,
      command: result.command,
      rowCount: result.rowCount,
      fields: result.fields?.map((f) => ({ name: f.name, dataTypeID: f.dataTypeID })),
      rows: result.rows || [],
      durationMs,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
      code: error.code,
      position: error.position,
    });
  }
});

// -------------------------------------------------------------
// Vite Middleware / Static serving
// -------------------------------------------------------------
async function startServer() {
  const distDir = path.resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(distDir) && fs.existsSync(path.resolve(distDir, 'index.html'));

  if (hasDist || process.env.NODE_ENV === 'production') {
    app.use(express.static(distDir));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        allowedHosts: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
