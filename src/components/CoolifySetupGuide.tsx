import React from 'react';
import { 
  CheckCircle, 
  Terminal, 
  Globe, 
  Key, 
  ShieldAlert, 
  ArrowRight, 
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';

export const CoolifySetupGuide: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8 space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-2">
          <Layers className="w-3.5 h-3.5" />
          Coolify Panel v4.4.6 Step-by-Step Walkthrough
        </div>
        <h3 className="text-xl font-bold text-white">
          Coolify mein PostgreSQL setup karne aur is website se connect karne ka mukammal tareeqa
        </h3>
        <p className="text-slate-400 text-xs mt-1">
          Follow these 4 simple steps in your Coolify dashboard (Huzkar Labs Panel).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Step 1 */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h4 className="text-sm font-bold text-white">Select Image: PostgreSQL 18 Default</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Aapke samne jo screen hai usme se <strong className="text-emerald-400">&quot;PostgreSQL 18 Default&quot;</strong> (ya agar aap purana chahyein toh <strong>PostgreSQL 17</strong>) par click karein.
            </p>
            <div className="mt-3 bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-400">
              💡 <em>PostGIS</em> ya <em>PGVector</em> sirf tab select karte hain jab Maps ya AI embeddings use karni hon. Normal web apps ke liye Standard image sab se light aur fast hoti hai.
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-indigo-500 text-white font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h4 className="text-sm font-bold text-white">Configure Database & Password</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Coolify auto-generate karta hai user aur password. Note them down:
            </p>
            <ul className="mt-2 space-y-1 text-xs text-slate-400 font-mono">
              <li>• <span className="text-slate-200">POSTGRES_USER</span>: postgres</li>
              <li>• <span className="text-slate-200">POSTGRES_PASSWORD</span>: [Coolify generated secret]</li>
              <li>• <span className="text-slate-200">POSTGRES_DB</span>: postgres</li>
            </ul>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-slate-950 p-5 rounded-xl border border-amber-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center">
                3
              </span>
              <h4 className="text-sm font-bold text-amber-200">
                ⚠️ CRITICAL: Make Publicly Accessible
              </h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Yeh sabse ahem step hai! Kyun ke yeh test website cloud pe chal rahi hai, isko aapke VPS tak pohanchna hai.
            </p>
            <div className="mt-3 bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1.5">
              <p className="text-[11px] text-emerald-400 font-semibold">Coolify Dashboard me:</p>
              <p className="text-[11px]">1. Apne PostgreSQL resource par click karein.</p>
              <p className="text-[11px]">2. <strong className="text-white">&quot;Is Publicly Accessible&quot;</strong> ko check/toggle karein.</p>
              <p className="text-[11px]">3. Public Port me <strong className="text-white">5432</strong> set karein (Save &amp; Restart).</p>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center">
                4
              </span>
              <h4 className="text-sm font-bold text-white">Copy &amp; Test Connection String</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Coolify me ek option hota hai <strong className="text-white">&quot;Public Connection String&quot;</strong>. Use copy karein jo aisi dikhti hai:
            </p>
            <div className="mt-2.5 bg-slate-900 p-2 rounded-lg border border-slate-800 text-[11px] font-mono text-emerald-300 break-all">
              postgres://postgres:password@YOUR_VPS_IP:5432/postgres?sslmode=disable
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Upar diye gaye <strong className="text-indigo-400">Connection Bench</strong> me paste karein aur <strong className="text-emerald-400">⚡ Test Connection</strong> dabayein!
            </p>
          </div>
        </div>
      </div>

      {/* Firewall & Terminal Verification Notice */}
      <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-4 flex items-start gap-3">
        <Terminal className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1.5">
          <p className="font-bold text-indigo-200">
            VPS Terminal Check (Agar &apos;ufw: command not found&apos; aaye toh fikar na karein):
          </p>
          <p className="text-slate-300">
            Aap already <strong>root</strong> user hain aur aapke VPS par UFW install nahi hai, iska matlab OS level par port block nahi hai! Docker khud ports manage karta hai.
          </p>
          <div className="pt-1">
            <p className="text-slate-400">PostgreSQL container aur port check karne ke liye apne terminal par yeh chalayein:</p>
            <code className="inline-block mt-1 bg-slate-900 text-emerald-300 px-2 py-1 rounded font-mono border border-slate-700">
              docker ps | grep -i postgres
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};
