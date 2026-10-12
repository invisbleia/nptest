import React, { useState } from 'react';
import { 
  Terminal, 
  Play, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Copy,
  Layers,
  Sparkles,
  Database,
  Trash2,
  TableProperties
} from 'lucide-react';

interface Props {
  isConnected: boolean;
}

interface CommandPreset {
  category: string;
  label: string;
  description: string;
  sql: string;
}

export const SqlConsole: React.FC<Props> = ({ isConnected }) => {
  const [query, setQuery] = useState('SELECT * FROM students ORDER BY id DESC LIMIT 10;');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copiedQuery, setCopiedQuery] = useState(false);

  const commandPresets: CommandPreset[] = [
    {
      category: '1. Schema & Table Creation',
      label: 'Create "students" Table',
      description: 'Creates students table with id, roll_no, email, department, semester, gpa, and status',
      sql: `CREATE TABLE IF NOT EXISTS students (
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
);`,
    },
    {
      category: '2. Insert Real Data',
      label: 'Insert 5 Real Students',
      description: 'Inserts 5 realistic university student records into Coolify PostgreSQL',
      sql: `INSERT INTO students (name, roll_no, email, department, semester, gpa, enrollment_status)
VALUES 
  ('Ali Huzaifa', 'CS-2024-001', 'ali.huzaifa@example.com', 'Computer Science', 4, 3.85, 'Active'),
  ('Sara Khan', 'SE-2024-042', 'sara.khan@example.com', 'Software Engineering', 3, 3.92, 'Active'),
  ('Hamza Ahmed', 'AI-2024-019', 'hamza.a@example.com', 'Artificial Intelligence', 5, 3.45, 'Active'),
  ('Zainab Fatima', 'DS-2023-088', 'zainab.f@example.com', 'Data Science', 6, 3.78, 'Graduated'),
  ('Bilal Tariq', 'EE-2024-112', 'bilal.t@example.com', 'Electrical Engineering', 2, 3.10, 'Active')
ON CONFLICT (roll_no) DO NOTHING;`,
    },
    {
      category: '3. Queries & Analytics',
      label: 'View All Students (Ascending)',
      description: 'Fetches all student records sorted by ID',
      sql: 'SELECT * FROM students ORDER BY id ASC;',
    },
    {
      category: '3. Queries & Analytics',
      label: 'Department Summary & Avg GPA',
      description: 'Counts students per department and calculates average GPA',
      sql: `SELECT 
  department, 
  COUNT(*) AS total_students, 
  ROUND(AVG(gpa), 2) AS avg_gpa,
  MAX(gpa) AS highest_gpa
FROM students 
GROUP BY department 
ORDER BY total_students DESC;`,
    },
    {
      category: '3. Queries & Analytics',
      label: 'Top Performers (GPA >= 3.50)',
      description: 'Lists all students with honors GPA',
      sql: "SELECT roll_no, name, department, gpa, enrollment_status FROM students WHERE gpa >= 3.50 ORDER BY gpa DESC;",
    },
    {
      category: '4. Database Inspection',
      label: 'List All Tables in PostgreSQL',
      description: 'Checks public tables currently present on your Coolify PostgreSQL instance',
      sql: "SELECT table_name, table_type FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;",
    },
    {
      category: '4. Database Inspection',
      label: 'Inspect "students" Table Columns',
      description: 'View column names, data types, nullability, and default values',
      sql: `SELECT column_name, data_type, character_maximum_length, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;`,
    },
    {
      category: '4. Database Inspection',
      label: 'Server Version, DB Name & Disk Size',
      description: 'Checks PostgreSQL engine build, database name, and storage footprint on VPS',
      sql: "SELECT version(), current_database(), current_user, pg_size_pretty(pg_database_size(current_database())) AS database_disk_size, NOW() AS server_time;",
    },
    {
      category: '4. Database Inspection',
      label: 'Active Connections & Queries',
      description: 'See live connection processes running on this PostgreSQL container',
      sql: "SELECT pid, usename, client_addr, state, query FROM pg_stat_activity WHERE datname = current_database();",
    },
  ];

  const handleExecute = async () => {
    if (!query.trim()) return;
    setIsRunning(true);
    setResult(null);

    try {
      const res = await fetch('/api/db/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: query }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setResult({
        success: false,
        error: err.message || 'Execution failed',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const copySql = () => {
    navigator.clipboard.writeText(query);
    setCopiedQuery(true);
    setTimeout(() => setCopiedQuery(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Live Coolify SQL Console
              {isConnected && (
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                  Target: Coolify PostgreSQL 18.6 (Private Node)
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Run raw SQL statements directly on your Coolify database instance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copySql}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition inline-flex items-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" />
            {copiedQuery ? 'Copied!' : 'Copy SQL'}
          </button>
        </div>
      </div>

      {!isConnected && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center gap-2">
          <span className="font-semibold">Note:</span>
          Connect your Coolify PostgreSQL database in the Connection tab first to execute queries on your remote server.
        </div>
      )}

      {/* Preset Query Chips (Clickable) */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          ⚡ Quick Ready-To-Run Command Library (Click any command to load):
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {commandPresets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(p.sql);
              }}
              className="text-left p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-900 transition flex flex-col justify-between group"
            >
              <div>
                <span className="text-[10px] font-mono text-indigo-400 block mb-1">
                  {p.category}
                </span>
                <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition block">
                  {p.label}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 block">
                  {p.description}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Query editor */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-slate-300">
            SQL Query Input:
          </label>
          <span className="text-[11px] text-slate-500 font-mono">
            Direct Wire: client.query()
          </span>
        </div>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={5}
          placeholder="Write SQL query, e.g. SELECT * FROM students;"
          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
        />

        <div className="flex items-center justify-between mt-3">
          <span className="text-[11px] text-slate-500">
            Click any preset above or type custom queries (CREATE, SELECT, INSERT, UPDATE, DELETE).
          </span>
          <button
            onClick={handleExecute}
            disabled={isRunning || !isConnected}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-lg transition"
          >
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Execute SQL on Coolify
          </button>
        </div>
      </div>

      {/* Query Results */}
      {result && (
        <div className="pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2.5">
            <div className="flex items-center gap-2 font-mono">
              {result.success ? (
                <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  Execution Success ({result.rowCount ?? result.rows?.length ?? 0} rows affected/returned)
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1.5 font-bold">
                  <XCircle className="w-4 h-4" />
                  Query Execution Failed
                </span>
              )}
            </div>
            {result.durationMs !== undefined && (
              <span className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <Clock className="w-3 h-3 text-indigo-400" />
                Execution Latency: {result.durationMs}ms
              </span>
            )}
          </div>

          {result.success ? (
            result.rows && result.rows.length > 0 ? (
              <div className="overflow-x-auto max-h-80 rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 sticky top-0">
                    <tr>
                      {Object.keys(result.rows[0]).map((key) => (
                        <th key={key} className="px-3 py-2.5 font-semibold text-indigo-300">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {result.rows.map((row: any, rIdx: number) => (
                      <tr key={rIdx} className="hover:bg-slate-900/60">
                        {Object.values(row).map((val: any, cIdx: number) => (
                          <td key={cIdx} className="px-3 py-2 whitespace-nowrap">
                            {val === null || val === undefined ? (
                              <span className="text-slate-600 italic">null</span>
                            ) : typeof val === 'object' ? (
                              JSON.stringify(val)
                            ) : (
                              String(val)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 text-xs">
                Command <code className="text-emerald-400 font-mono font-bold">&quot;{result.command}&quot;</code> completed successfully on your Coolify PostgreSQL database! 0 rows returned.
              </div>
            )
          ) : (
            <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs font-mono text-rose-300 space-y-1">
              <p className="font-bold">PostgreSQL Error Message:</p>
              <p>{result.error}</p>
              {result.position && <p className="text-[11px] text-rose-400/80">At position: {result.position}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
