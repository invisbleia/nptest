import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  GraduationCap, 
  Award, 
  Sparkles, 
  RefreshCw, 
  Database, 
  Building2, 
  Loader2, 
  WifiOff, 
  Download, 
  Terminal, 
  ArrowUpDown,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { Student } from './StudentModal';

interface Props {
  students: Student[];
  isLoading: boolean;
  onRefresh: () => void;
  onAddStudent: () => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (id: number) => Promise<void>;
  onSeedStudents: () => Promise<void>;
  isConnected: boolean;
  tableExists: boolean;
  onInitTables: () => Promise<void>;
  onGoToConnection: () => void;
}

export const StudentList: React.FC<Props> = ({
  students,
  isLoading,
  onRefresh,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onSeedStudents,
  isConnected,
  tableExists,
  onInitTables,
  onGoToConnection,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'id' | 'gpa' | 'name'>('id');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Filter & sort students
  const filteredStudents = students
    .filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.roll_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = deptFilter === 'ALL' || s.department === deptFilter;
      const matchesStatus = statusFilter === 'ALL' || s.enrollment_status === statusFilter;
      return matchesSearch && matchesDept && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'gpa') return Number(b.gpa) - Number(a.gpa);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return (b.id ?? 0) - (a.id ?? 0);
    });

  // Calculate metrics
  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.enrollment_status === 'Active').length;
  const avgGpa = totalStudents > 0
    ? (students.reduce((acc, s) => acc + Number(s.gpa), 0) / totalStudents).toFixed(2)
    : '0.00';
  const gpaPercentage = totalStudents > 0 ? (Number(avgGpa) / 4.0) * 100 : 0;
  const uniqueDepts = new Set(students.map((s) => s.department)).size;

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this student record from your Coolify database?')) {
      setDeletingId(id);
      try {
        await onDeleteStudent(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await onSeedStudents();
    } finally {
      setIsSeeding(false);
    }
  };

  const handleInit = async () => {
    setIsInitializing(true);
    try {
      await onInitTables();
    } finally {
      setIsInitializing(false);
    }
  };

  const exportCsv = () => {
    if (filteredStudents.length === 0) return;
    const headers = ['ID', 'Roll No', 'Name', 'Email', 'Department', 'Semester', 'GPA', 'Status'];
    const rows = filteredStudents.map((s) => [
      s.id,
      s.roll_no,
      `"${s.name}"`,
      s.email,
      `"${s.department}"`,
      s.semester,
      s.gpa,
      s.enrollment_status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `coolify_students_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const departmentsList = [
    'ALL',
    'Computer Science',
    'Software Engineering',
    'Artificial Intelligence',
    'Data Science',
    'Electrical Engineering',
  ];

  // Helper for avatar colors
  const getAvatarBg = (name: string) => {
    const colors = [
      'bg-indigo-600',
      'bg-emerald-600',
      'bg-cyan-600',
      'bg-purple-600',
      'bg-amber-600',
      'bg-rose-600',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return colors[hash % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 shadow-lg flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Enrolled</p>
            <h4 className="text-2xl font-black text-white tracking-tight mt-0.5">{totalStudents}</h4>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 shadow-lg flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Active Students</p>
            <h4 className="text-2xl font-black text-emerald-400 tracking-tight mt-0.5">{activeStudents}</h4>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Average GPA</p>
              <h4 className="text-2xl font-black text-white tracking-tight mt-0.5">{avgGpa} <span className="text-xs text-slate-500 font-normal">/ 4.0</span></h4>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-amber-400 h-full rounded-full transition-all duration-500" style={{ width: `${gpaPercentage}%` }} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 shadow-lg flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Departments</p>
            <h4 className="text-2xl font-black text-white tracking-tight mt-0.5">{uniqueDepts}</h4>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Table Top Controls */}
        <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">Student Directory</h3>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                🟢 Coolify PostgreSQL 18
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live records persisted directly inside your remote database.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={exportCsv}
              disabled={filteredStudents.length === 0}
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl transition border border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>

            <button
              onClick={handleSeed}
              disabled={isSeeding || !isConnected || !tableExists}
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl transition border border-slate-700"
            >
              {isSeeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
              Seed 5 Students
            </button>

            <button
              onClick={onRefresh}
              disabled={isLoading || !isConnected}
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl transition border border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <button
              onClick={onAddStudent}
              disabled={!isConnected || !tableExists}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition"
            >
              <Plus className="w-4 h-4" />
              Add Student
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, roll no, email..."
              className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none"
            >
              {departmentsList.map((d) => (
                <option key={d} value={d}>
                  {d === 'ALL' ? 'All Departments' : d}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Graduated">Graduated</option>
              <option value="Suspended">Suspended</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none"
            >
              <option value="id">Latest First</option>
              <option value="gpa">Highest GPA</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Table or Empty State */}
        {!isConnected ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4">
              <WifiOff className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-bold text-white">Database is Disconnected</h4>
            <p className="text-slate-400 text-sm max-w-md mx-auto mt-1 mb-6">
              Aapka Coolify database filhal offline hai. Real data manage karne ke liye connection activate karein.
            </p>
            <button
              onClick={onGoToConnection}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg transition"
            >
              Go to Connection Bench
            </button>
          </div>
        ) : !tableExists ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
              <Database className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-bold text-white">Coolify PostgreSQL Connected! Table &quot;students&quot; not created yet</h4>
            <p className="text-slate-400 text-sm max-w-md mx-auto mt-1 mb-6">
              Aapka PostgreSQL 18.6 connect ho chuka hai! Ab 1-click mein &quot;students&quot; table create karein aur real sample records insert karein.
            </p>
            <button
              onClick={handleInit}
              disabled={isInitializing}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg transition"
            >
              {isInitializing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              Create &quot;students&quot; Table &amp; Seed Initial Records
            </button>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <p className="text-base text-slate-300 font-semibold mb-1">No Student Records Found</p>
            <p className="text-xs text-slate-500 mb-5">Aapke Coolify PostgreSQL database mein filhal koi student record mojood nahi hai.</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={onAddStudent}
                className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition"
              >
                <Plus className="w-4 h-4" />
                Add First Student
              </button>
              <button
                onClick={handleSeed}
                disabled={isSeeding}
                className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl transition border border-slate-700"
              >
                {isSeeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                Seed 5 Students
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-semibold">
                <tr>
                  <th className="px-4 py-3.5">Roll No</th>
                  <th className="px-4 py-3.5">Student</th>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5 text-center">Semester</th>
                  <th className="px-4 py-3.5 text-center">GPA</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredStudents.map((student) => {
                  const gpaNum = Number(student.gpa);
                  const gpaColor =
                    gpaNum >= 3.5
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                      : gpaNum >= 3.0
                      ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
                      : 'text-amber-400 bg-amber-500/10 border-amber-500/30';

                  const statusBadge =
                    student.enrollment_status === 'Active'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : student.enrollment_status === 'Graduated'
                      ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                      : 'bg-rose-500/15 text-rose-300 border-rose-500/30';

                  const initials = student.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr key={student.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-mono font-bold text-indigo-300">
                        {student.roll_no}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${getAvatarBg(student.name)} text-white font-bold flex items-center justify-center text-xs shrink-0 shadow`}>
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-white">{student.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{student.email || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-300">
                        {student.department}
                      </td>
                      <td className="px-4 py-3 text-center font-mono">
                        Semester {student.semester}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block font-mono font-bold px-2 py-0.5 rounded border text-[11px] ${gpaColor}`}>
                          {Number(student.gpa).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge}`}>
                          {student.enrollment_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEditStudent(student)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title="Edit Student"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => student.id && handleDelete(student.id)}
                            disabled={deletingId === student.id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            title="Delete Student"
                          >
                            {deletingId === student.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info */}
        <div className="px-5 py-3.5 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Showing {filteredStudents.length} of {totalStudents} students</span>
          <span className="font-mono">Storage: Coolify PostgreSQL (Private Node)</span>
        </div>
      </div>

      {/* Terminal Verification Helper Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Terminal className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-white">
              Coolify Terminal Reminder:
            </p>
            <p className="text-slate-400 mt-0.5">
              Coolify container shell (Alpine) mein direct SQL nahi chalta. Pehle <code className="bg-slate-950 text-emerald-400 px-1.5 py-0.5 rounded font-mono border border-slate-800">psql -U postgres -d postgres</code> chalayein, phir <code className="bg-slate-950 text-indigo-300 px-1.5 py-0.5 rounded font-mono border border-slate-800">SELECT * FROM students;</code> run karein.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
