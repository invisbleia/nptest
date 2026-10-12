import React from 'react';
import { 
  CheckCircle2, 
  HelpCircle, 
  Sparkles, 
  Server, 
  AlertTriangle, 
  Layers, 
  ExternalLink,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface Props {
  onSelectOption?: (option: string) => void;
}

export const CoolifyRecommendation: React.FC<Props> = () => {
  const options = [
    {
      id: 'pg18',
      name: 'PostgreSQL 18 Default',
      badge: 'SABSE BEHTAREEN (RECOMMENDED)',
      recommended: true,
      description: 'Standard, latest open-source PostgreSQL. Sabse tez aur modern. Isme koi faltu extra extensions nahi hain jo RAM ya CPU zaya karein.',
      bestFor: 'Student portal, normal web apps, CRUD, accounts, e-commerce, APIs.',
      action: 'Click to select in Coolify',
    },
    {
      id: 'pg17',
      name: 'PostgreSQL 17',
      badge: 'ALTERNATIVE (ROCK SOLID)',
      recommended: false,
      isSolid: true,
      description: 'Super mature & production-tested. Agar aapko 100% time-tested stability chahye toh yeh bhi best hai.',
      bestFor: 'General apps jahan maximum LTS stability chahye.',
    },
    {
      id: 'supabase',
      name: 'Supabase PostgreSQL',
      badge: 'SIRF SUPABASE KE LIYE',
      recommended: false,
      description: 'Yeh poora Supabase backend stack bundle karta hai (lots of extensions, auth, storage hooks). Kafi heavy hota hai VPS resources pe.',
      bestFor: 'Agar aap Supabase client SDK use kar rahe hon.',
    },
    {
      id: 'pgvector',
      name: 'PGVector 18 / 17',
      badge: 'AI / VECTOR SEARCH',
      recommended: false,
      description: 'PostgreSQL with vector embeddings extension (OpenAI / Gemini vector similarity search).',
      bestFor: 'Sirf AI chatbot embeddings ya Semantic Search apps.',
    },
    {
      id: 'postgis',
      name: 'PostGIS',
      badge: 'MAPS & GIS ONLY',
      recommended: false,
      description: 'Geographic and spatial objects extension (lat/long polygon geo-queries).',
      bestFor: 'Maps, Uber-style tracking, GIS spatial boundary applications.',
    },
  ];

  return (
    <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white rounded-2xl p-6 border border-indigo-500/30 shadow-2xl mb-8 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Coolify PostgreSQL Selection Guide
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Abhi Coolify mein kya select karein?
            </h2>
            <p className="text-slate-300 text-sm md:text-base mt-1">
              Aapke screen par jo list aarahi hai, usme se <span className="text-emerald-400 font-semibold underline decoration-emerald-400/50">PostgreSQL 18 Default</span> ya <span className="text-indigo-300 font-semibold">PostgreSQL 17</span> select karein.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-xl shadow-inner text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs text-emerald-400/80 font-mono">Instant Choice</p>
              <p className="font-bold text-white">PostgreSQL 18 Default</p>
            </div>
          </div>
        </div>

        {/* Options grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {options.map((opt) => (
            <div
              key={opt.id}
              className={`rounded-xl p-4 transition-all duration-200 border flex flex-col justify-between ${
                opt.recommended
                  ? 'bg-gradient-to-b from-emerald-950/40 to-slate-900 border-emerald-500/60 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400/30'
                  : opt.isSolid
                  ? 'bg-slate-900/90 border-indigo-500/40 hover:border-indigo-400/70'
                  : 'bg-slate-900/50 border-slate-800 opacity-80 hover:opacity-100 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded tracking-wide ${
                      opt.recommended
                        ? 'bg-emerald-500 text-slate-950'
                        : opt.isSolid
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {opt.badge}
                  </span>
                  {opt.recommended && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                  {opt.name}
                </h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {opt.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-slate-400">
                <span className="text-slate-200 font-semibold">Kab use karein: </span>
                {opt.bestFor}
              </div>
            </div>
          ))}
        </div>

        {/* Essential Coolify Instructions */}
        <div className="mt-6 bg-slate-900/90 border border-amber-500/30 rounded-xl p-4.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-200">
                ⚠️ Coolify mein select karne ke baad yeh 1 cheez LAZMI karni hai:
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Coolify me PostgreSQL create hone ke baad settings me ja kar <strong className="text-white">"Make Publicly Accessible"</strong> ya <strong className="text-white">"Public Port"</strong> (e.g. 5432) zaroor set karein, warna yeh website aapke VPS se connect nahi kar payegi.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300">
              Port: <span className="text-emerald-400 font-bold">5432</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
