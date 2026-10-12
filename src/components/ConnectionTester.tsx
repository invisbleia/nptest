import React, { useState } from 'react';
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Wifi, 
  RefreshCw, 
  Copy, 
  TableProperties, 
  ShieldCheck, 
  Server, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  ShieldAlert, 
  X
} from 'lucide-react';

export interface DbStatus {
  isConnected: boolean;
  type: 'coolify_postgres';
  database?: string;
  user?: string;
  host?: string;
  port?: number;
  serverVersion?: string;
  latencyMs?: number;
  tableExists?: boolean;
  studentCount?: number;
  connectionStringMasked?: string;
  isAutoSaved?: boolean;
  dbSize?: string;
  error?: string;
}

interface Props {
  status: DbStatus;
  onRefreshStatus: () => void;
  onInitTables: (seedSample: boolean) => Promise<boolean>;
}

export const ConnectionTester: React.FC<Props> = ({ status, onRefreshStatus, onInitTables }) => {
  const [tab, setTab] = useState<'url' | 'manual'>('url');
  
  // Security Unlock state
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authPasswordInput, setAuthPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Unlocked real credentials (loaded securely via verification endpoint)
  const [unlockedConnectionString, setUnlockedConnectionString] = useState<string | null>(null);
  const [unlockedHost, setUnlockedHost] = useState<string | null>(null);

  // Form states
  const [manualHost, setManualHost] = useState('');
  const [manualPort, setManualPort] = useState('5432');
  const [manualDatabase, setManualDatabase] = useState('postgres');
  const [manualUser, setManualUser] = useState('postgres');
  const [manualPassword, setManualPassword] = useState('');
  const [ssl, setSsl] = useState(false);

  const [isTesting, setIsTesting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Masked string representation
  const maskedUri = 'postgres://postgres:••••••••••••••••@••••••••••••:5432/postgres?sslmode=disable';

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authPasswordInput) return;
    setIsVerifying(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/auth/verify-secret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: authPasswordInput }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setIsUnlocked(true);
        setUnlockedConnectionString(data.rawConnectionString);
        setUnlockedHost(data.rawHost);
        setShowAuthModal(false);
        setAuthPasswordInput('');
      } else {
        setAuthError(data.error || 'Incorrect administrator password. Access denied.');
      }
    } catch (err: any) {
      setAuthError('Verification request failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLockAgain = () => {
    setIsUnlocked(false);
    setUnlockedConnectionString(null);
    setUnlockedHost(null);
  };

  const getPayload = () => {
    if (tab === 'url') {
      return { 
        connectionString: isUnlocked && unlockedConnectionString 
          ? unlockedConnectionString 
          : undefined 
      };
    }
    return {
      host: manualHost.trim() || undefined,
      port: Number(manualPort) || 5432,
      database: manualDatabase.trim() || 'postgres',
      user: manualUser.trim() || 'postgres',
      password: manualPassword || undefined,
      ssl,
    };
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/db/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getPayload()),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || 'Network request failed',
        suggestion: 'Failed to reach backend test runner.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const res = await fetch('/api/db/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getPayload()),
      });
      const data = await res.json();
      if (data.success) {
        onRefreshStatus();
      } else {
        alert('Connection failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Error connecting: ' + err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCreateStudentsTable = async () => {
    setIsMigrating(true);
    try {
      await onInitTables(true);
      onRefreshStatus();
    } finally {
      setIsMigrating(false);
    }
  };

  const copyConnectionString = () => {
    if (!isUnlocked) {
      setShowAuthModal(true);
      return;
    }
    if (unlockedConnectionString) {
      navigator.clipboard.writeText(unlockedConnectionString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Security Privacy Alert & Unlock Banner */}
      <div className={`rounded-2xl p-5 border transition-all duration-300 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        isUnlocked 
          ? 'bg-amber-950/30 border-amber-500/40' 
          : 'bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-950 border-indigo-500/30'
      }`}>
        <div className="flex items-start gap-3.5">
          <div className={`p-3 rounded-xl shrink-0 ${isUnlocked ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
            {isUnlocked ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">
                {isUnlocked ? 'Administrator View Active (Secrets Decrypted)' : 'Infrastructure Secrets are Protected & Masked'}
              </h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                isUnlocked 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                  : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
              }`}>
                {isUnlocked ? 'UNLOCKED' : 'PROTECTED'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {isUnlocked
                ? 'VPS IP, raw connection credentials aur passwords temporarily unmasked hain.'
                : 'VPS IP address, database secret password aur host names privacy ke liye blurred aur masked hain.'}
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {isUnlocked ? (
            <button
              onClick={handleLockAgain}
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl transition border border-slate-700 shadow"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              Lock Secrets
            </button>
          ) : (
            <button
              onClick={() => {
                setAuthError(null);
                setAuthPasswordInput('');
                setShowAuthModal(true);
              }}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg transition"
            >
              <Eye className="w-3.5 h-3.5" />
              Unlock Secrets
            </button>
          )}
        </div>
      </div>

      {/* Main Connection Details Box */}
      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800/80">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-400" />
              Active Database Details
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Live status and table configuration on your Coolify VPS
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!status.tableExists ? (
              <button
                onClick={handleCreateStudentsTable}
                disabled={isMigrating || !status.isConnected}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg transition"
              >
                {isMigrating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TableProperties className="w-3.5 h-3.5" />}
                Create &quot;students&quot; Table in Coolify
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                <CheckCircle className="w-4 h-4" />
                Table &quot;students&quot; Active ({status.studentCount ?? 0} rows)
              </span>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 font-mono text-xs">
          <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase text-slate-400 block mb-1">Status</span>
            <span className={`font-bold flex items-center gap-1.5 ${status.isConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
              <span className={`w-2 h-2 rounded-full ${status.isConnected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              {status.isConnected ? 'CONNECTED' : 'OFFLINE'}
            </span>
          </div>

          <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase text-slate-400 block mb-1">Host Node</span>
            <div className="flex items-center gap-1.5">
              <span className={`font-bold transition-all ${!isUnlocked ? 'filter blur-[4px] select-none text-slate-400 font-mono' : 'text-white font-mono'}`}>
                {isUnlocked && unlockedHost ? unlockedHost : '•••••••••••• (Encrypted)'}
              </span>
              {!isUnlocked && (
                <Lock className="w-3 h-3 text-slate-500 shrink-0" />
              )}
            </div>
          </div>

          <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase text-slate-400 block mb-1">Latency</span>
            <span className="font-bold text-white">
              {status.latencyMs !== undefined ? `${status.latencyMs} ms` : '—'}
            </span>
          </div>

          <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase text-slate-400 block mb-1">Database &amp; Engine</span>
            <span className="font-bold text-indigo-300">postgres (v18.6)</span>
          </div>
        </div>

        {/* Saved Connection URI Display */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              Active Connection String:
              {!isUnlocked && (
                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                  Protected
                </span>
              )}
            </label>
            <button
              onClick={copyConnectionString}
              className="text-xs text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 font-mono transition"
            >
              <Copy className="w-3 h-3" />
              {copied ? 'Copied Real URI!' : isUnlocked ? 'Copy URI' : 'Unlock to Copy'}
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              readOnly
              value={isUnlocked && unlockedConnectionString ? unlockedConnectionString : maskedUri}
              className={`w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono transition-all ${
                isUnlocked
                  ? 'text-emerald-300 focus:outline-none focus:border-indigo-500'
                  : 'text-slate-500 filter blur-[3px] select-none cursor-pointer'
              }`}
              onClick={() => {
                if (!isUnlocked) setShowAuthModal(true);
              }}
            />
            {!isUnlocked && (
              <div 
                onClick={() => setShowAuthModal(true)}
                className="absolute inset-0 flex items-center justify-center bg-slate-950/60 backdrop-blur-[2px] rounded-xl cursor-pointer hover:bg-slate-950/40 transition"
              >
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-slate-900/90 px-3 py-1 rounded-lg border border-slate-700 shadow">
                  <Lock className="w-3 h-3 text-amber-400" />
                  Credentials Blurred • Click to Unlock
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-800/80">
          <button
            onClick={onRefreshStatus}
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs px-4 py-2 rounded-xl transition border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Check Live Ping
          </button>

          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2 rounded-xl transition"
          >
            {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wifi className="w-3.5 h-3.5" />}
            Test Active Pool
          </button>
        </div>

        {/* Test Result Feedback */}
        {testResult && (
          <div
            className={`mt-4 p-4 rounded-xl border text-xs ${
              testResult.success
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-2">
                {testResult.success ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                {testResult.success ? 'Coolify PostgreSQL is Live & Healthy!' : 'Test Failed'}
              </span>
              {testResult.latencyMs && (
                <span className="font-mono text-[11px] bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300">
                  Latency: {testResult.latencyMs}ms
                </span>
              )}
            </div>
            {testResult.error && (
              <p className="mt-2 font-mono text-rose-300">{testResult.error}</p>
            )}
          </div>
        )}
      </div>

      {/* Admin Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-white animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setShowAuthModal(false);
                setAuthError(null);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Administrator Verification Required
                </h3>
                <p className="text-xs text-slate-400">
                  Infrastructure IP, credentials, and connection strings are masked.
                </p>
              </div>
            </div>

            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Enter Administrator Password:
                </label>
                <input
                  type="password"
                  autoFocus
                  required
                  value={authPasswordInput}
                  onChange={(e) => setAuthPasswordInput(e.target.value)}
                  placeholder="Enter administrator password..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAuthModal(false);
                    setAuthError(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifying || !authPasswordInput}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow transition"
                >
                  {isVerifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  Verify &amp; Decrypt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
