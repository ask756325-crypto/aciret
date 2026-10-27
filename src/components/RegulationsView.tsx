import React from 'react';
import { 
  BookOpen, 
  ShieldCheck, 
  AlertTriangle, 
  FileCheck2, 
  MapPin, 
  Phone, 
  Mail, 
  ExternalLink,
  Database,
  Key,
  Server
} from 'lucide-react';

export const RegulationsView: React.FC = () => {
  const regionalOffices = [
    {
      region: 'Northern Regional Office (NRO)',
      city: 'Kanpur / New Delhi',
      jurisdiction: 'Uttar Pradesh, Uttarakhand, Delhi',
      address: 'Govt. Polytechnic Campus, Adjoining Directorate of Technical Education, Vikas Nagar, Kanpur - 208002',
      email: 'nro@aicte-india.org',
      phone: '+91 512 258 5014',
    },
    {
      region: 'Western Regional Office (WRO)',
      city: 'Mumbai',
      jurisdiction: 'Maharashtra, Goa, Daman & Diu',
      address: 'Industrial Assurance Building, 2nd Floor, Veer Nariman Road, Churchgate, Mumbai - 400020',
      email: 'wro@aicte-india.org',
      phone: '+91 22 2285 5412',
    },
    {
      region: 'Southern Regional Office (SRO)',
      city: 'Chennai',
      jurisdiction: 'Tamil Nadu, Puducherry',
      address: 'Shastri Bhavan, 26, Haddows Road, Nungambakkam, Chennai - 600006',
      email: 'sro@aicte-india.org',
      phone: '+91 44 2827 5650',
    },
    {
      region: 'South-Western Regional Office (SWRO)',
      city: 'Bengaluru',
      jurisdiction: 'Karnataka, Kerala, Lakshadweep',
      address: 'Health Centre Building, Bangalore University Campus, Palace Road, Bengaluru - 560009',
      email: 'swro@aicte-india.org',
      phone: '+91 80 2220 5988',
    },
    {
      region: 'Eastern Regional Office (ERO)',
      city: 'Kolkata',
      jurisdiction: 'West Bengal, Bihar, Jharkhand, Odisha, Andaman & Nicobar',
      address: 'LB Block, Sector-III, College of Leather Technology Campus, Salt Lake City, Kolkata - 700098',
      email: 'ero@aicte-india.org',
      phone: '+91 33 2335 7458',
    },
    {
      region: 'South-Central Regional Office (SCRO)',
      city: 'Hyderabad',
      jurisdiction: 'Telangana, Andhra Pradesh',
      address: 'JNTU Masab Tank Campus, Mahaveer Marg, Hyderabad - 500028',
      email: 'scro@aicte-india.org',
      phone: '+91 40 2334 1022',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto my-4 sm:my-6 space-y-6">
      {/* Intro Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 text-blue-900 text-xs font-bold uppercase tracking-wider mb-1">
          <BookOpen className="w-4 h-4" />
          <span>Statutory Framework & Architecture</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          AICTE Grievance Redressal Regulations & Technical Guide
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          All India Council for Technical Education (Redressal of Grievance of Students) Regulations, published in the Gazette of India under Section 23(1) of the AICTE Act, 1987.
        </p>
      </div>

      {/* Statutory Mandates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 font-bold text-sm text-blue-950 mb-2">
            <ShieldCheck className="w-4 h-4 text-blue-800" />
            <span>15-Day Resolution Mandate</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every technical institution must redress student grievances within a statutory timeframe of 15 working days. Failure leads to automated escalation to the Regional Ombudsperson.
          </p>
        </div>

        <div className="p-4 bg-white rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 font-bold text-sm text-blue-950 mb-2">
            <FileCheck2 className="w-4 h-4 text-emerald-700" />
            <span>Certificate Retention Ban</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Strict prohibition on withholding original educational qualification certificates, mark sheets, or school transfer certificates by technical colleges under any fee disputes.
          </p>
        </div>

        <div className="p-4 bg-white rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 font-bold text-sm text-blue-950 mb-2">
            <AlertTriangle className="w-4 h-4 text-rose-700" />
            <span>Zero-Tolerance Anti-Ragging</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Strict adherence to Hon'ble Supreme Court directives. Complaints of physical intimidation or harassment carry immediate FIR obligations and 24-hour interim suspension mandates.
          </p>
        </div>
      </div>

      {/* Hackathon Architecture & Production Readiness Guide */}
      <div className="bg-slate-900 text-slate-100 rounded-lg p-6 shadow-md border border-slate-800">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Server className="w-4 h-4" />
          <span>Hackathon System Architecture & Production Deployment</span>
        </div>
        <h3 className="text-lg font-bold text-white mb-2">
          Full-Stack Setup, Real Database & Authentication Roadmap
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          This application is architected with a decoupled Express REST backend (running in <code className="text-amber-300 bg-slate-800 px-1 py-0.5 rounded">server.ts</code>) and a React TypeScript client, specifically structured for plug-and-play production database and national identity authentication.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-800/80 p-3.5 rounded border border-slate-700">
            <div className="flex items-center gap-2 text-blue-300 font-semibold mb-1.5">
              <Database className="w-4 h-4" />
              <span>Database Migration</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Replace the in-memory store in <code className="text-amber-300">server.ts</code> with PostgreSQL (Drizzle/Prisma) or Firebase Firestore. The JSON schemas in <code className="text-amber-300">src/types.ts</code> match production relational tables.
            </p>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded border border-slate-700">
            <div className="flex items-center gap-2 text-blue-300 font-semibold mb-1.5">
              <Key className="w-4 h-4" />
              <span>Govt SSO / Authentication</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Integrate IndiaStack e-Pramaan / MeriPehchan SSO for citizen authentication, or Google Workspace OAuth for institutional nodal officer verification with RBAC claims.
            </p>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded border border-slate-700">
            <div className="flex items-center gap-2 text-blue-300 font-semibold mb-1.5">
              <Server className="w-4 h-4" />
              <span>Deployment Commands</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Build using <code className="text-amber-300">npm run build</code> and start with <code className="text-amber-300">npm start</code>. Runs on Node 20+ with zero external binary dependencies.
            </p>
          </div>
        </div>
      </div>

      {/* Regional Office Directory */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-200">
          AICTE Regional Bureaus & Grievance Jurisdiction Directory
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {regionalOffices.map((office, idx) => (
            <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>{office.region}</span>
                <span className="text-[11px] font-normal text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {office.city}
                </span>
              </div>
              <div className="text-[11px] text-blue-900 font-medium">
                Jurisdiction: {office.jurisdiction}
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {office.address}
              </p>
              <div className="pt-1.5 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200">
                <span className="flex items-center gap-1 font-mono text-slate-700">
                  <Mail className="w-3 h-3 text-blue-800" /> {office.email}
                </span>
                <span className="flex items-center gap-1 font-mono text-slate-700">
                  <Phone className="w-3 h-3 text-blue-800" /> {office.phone}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
