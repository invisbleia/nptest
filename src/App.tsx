/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Terminal, 
  Wifi, 
  RefreshCw,
  GraduationCap,
  Settings2,
  CheckCircle,
  Clock,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { ConnectionTester, DbStatus } from './components/ConnectionTester';
import { StudentList } from './components/StudentList';
import { StudentModal, Student } from './components/StudentModal';
import { SqlConsole } from './components/SqlConsole';

export default function App() {
  const [activeTab, setActiveTab] = useState<'students' | 'console' | 'connection' | 'terminal_guide'>('students');
  const [dbStatus, setDbStatus] = useState<DbStatus>({
    isConnected: false,
    type: 'coolify_postgres',
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  
  // Student Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isSavingStudent, setIsSavingStudent] = useState(false);

  // Fetch DB Status
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/db/status');
      const data = await res.json();
      setDbStatus(data);
    } catch (e) {
      console.error('Failed to fetch DB status', e);
    }
  };

  // Fetch Students
  const fetchStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const res = await fetch('/api/students');
      const data = await res.json();
      if (data.students) {
        setStudents(data.students);
      }
    } catch (e) {
      console.error('Failed to fetch students', e);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchStudents();
  }, []);

  // Student CRUD actions
  const handleSaveStudent = async (studentData: Student) => {
    setIsSavingStudent(true);
    try {
      if (editingStudent && editingStudent.id) {
        // Update
        const res = await fetch(`/api/students/${editingStudent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(studentData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update student');
      } else {
        // Create
        const res = await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(studentData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to add student');
      }
      await fetchStudents();
      await fetchStatus();
    } finally {
      setIsSavingStudent(false);
    }
  };

  const handleDeleteStudent = async (id: number) => {
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to delete student');
        return;
      }
      await fetchStudents();
      await fetchStatus();
    } catch (e: any) {
      alert('Error deleting: ' + e.message);
    }
  };

  const handleSeedStudents = async () => {
    try {
      const res = await fetch('/api/db/init-tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seedSampleData: true }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchStudents();
        await fetchStatus();
      } else {
        alert(data.error || 'Failed to seed');
      }
    } catch (e: any) {
      alert('Error seeding: ' + e.message);
    }
  };

  const handleInitTables = async (seedSample = true): Promise<boolean> => {
    try {
      const res = await fetch('/api/db/init-tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seedSampleData: seedSample }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchStudents();
        await fetchStatus();
        return true;
      } else {
        alert(data.error || 'Failed to initialize table');
        return false;
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#070b14]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-500 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-[#070b14] rounded-[10px] flex items-center justify-center">
                <Database className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">
                  Coolify PostgreSQL 18 Portal
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  LIVE DB
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Huzkar Labs • Private Coolify Cluster • Persistent Database
              </p>
            </div>
          </div>

          {/* Connection status indicator in navbar */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('connection')}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-semibold bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50 transition shadow-inner"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>postgres@coolify-node</span>
              {dbStatus.latencyMs !== undefined && (
                <span className="text-[10px] font-mono opacity-80 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                  {dbStatus.latencyMs}ms
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('students')}
            className={`inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'students'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Students Directory
          </button>

          <button
            onClick={() => setActiveTab('console')}
            className={`inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'console'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Live SQL Console
          </button>

          <button
            onClick={() => setActiveTab('connection')}
            className={`inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'connection'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Settings2 className="w-4 h-4" />
            Connection &amp; Persistence
          </button>

          <button
            onClick={() => setActiveTab('terminal_guide')}
            className={`inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'terminal_guide'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Coolify Terminal Guide
          </button>
        </div>

        {/* Tab 1: Student Management */}
        {activeTab === 'students' && (
          <StudentList
            students={students}
            isLoading={isLoadingStudents}
            onRefresh={() => {
              fetchStudents();
              fetchStatus();
            }}
            onAddStudent={() => {
              setEditingStudent(null);
              setIsModalOpen(true);
            }}
            onEditStudent={(student) => {
              setEditingStudent(student);
              setIsModalOpen(true);
            }}
            onDeleteStudent={handleDeleteStudent}
            onSeedStudents={handleSeedStudents}
            isConnected={dbStatus.isConnected}
            tableExists={dbStatus.tableExists ?? false}
            onInitTables={async () => {
              await handleInitTables(true);
            }}
            onGoToConnection={() => setActiveTab('connection')}
          />
        )}

        {/* Tab 2: SQL Console */}
        {activeTab === 'console' && (
          <SqlConsole isConnected={dbStatus.isConnected} />
        )}

        {/* Tab 3: Connection & Persistence Settings */}
        {activeTab === 'connection' && (
          <ConnectionTester
            status={dbStatus}
            onRefreshStatus={() => {
              fetchStatus();
              fetchStudents();
            }}
            onInitTables={handleInitTables}
          />
        )}

        {/* Tab 4: Coolify Terminal Guide */}
        {activeTab === 'terminal_guide' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-400" />
                Coolify Web Terminal Par Data Kaise Verify Karein?
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Kyunke Coolify ka default web terminal Linux shell (<code className="text-emerald-400 font-mono">sh</code>) hota hai, isliye wahan direct SQL chalane par <code className="text-rose-300 font-mono">sh: SELECT: not found</code> aata hai.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <h4 className="text-sm font-bold text-white">Step 1: PostgreSQL CLI Mein Enter Karein</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Apne Coolify terminal prompt (<code className="text-emerald-400 font-mono">/ #</code>) par yeh command likh kar Enter dabayein:
                </p>
                <div className="mt-3 bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-emerald-300 text-xs">
                  psql -U postgres -d postgres
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Aapka prompt badal kar <code className="text-indigo-300 font-bold">postgres=#</code> ho jayega.
                </p>
              </div>

              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-500 text-white font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <h4 className="text-sm font-bold text-white">Step 2: Real Data Dekhein</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Ab aap direct SQL commands run kar sakte hain:
                </p>
                <div className="mt-3 bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-indigo-300 text-xs space-y-1">
                  <p>SELECT * FROM students;</p>
                  <p className="text-slate-500">-- Tables dekhne ke liye:</p>
                  <p>\dt</p>
                  <p className="text-slate-500">-- Exit karne ke liye:</p>
                  <p>\q</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/20 text-xs">
              <p className="font-bold text-indigo-200 mb-1">💡 1-Line Shortcut Command (Bina interactive mode mein jaye):</p>
              <code className="bg-slate-900 text-emerald-300 px-2 py-1 rounded font-mono border border-slate-800 block w-fit mt-1">
                psql -U postgres -d postgres -c &quot;SELECT * FROM students;&quot;
              </code>
            </div>
          </div>
        )}
      </main>

      {/* Student Modal (Add or Edit) */}
      <StudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveStudent}
        initialData={editingStudent}
        isSaving={isSavingStudent}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#070b14] py-5 text-center text-xs text-slate-500">
        <p>Coolify PostgreSQL 18.6 • Auto-saved Persistent Connection Benchmark</p>
      </footer>
    </div>
  );
}
