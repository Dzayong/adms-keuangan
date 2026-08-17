import React, { useState, useRef, useEffect } from 'react';
import {
  Code2, Webhook, Play, Copy, Check, Lock,
  ChevronRight, BookOpen, Zap, AlertTriangle, ArrowRight,
  FileText, CheckCircle, RefreshCw, Info, Menu, X, Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { Card } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';
import { Button } from '../components/ui/Button.js';

type Env = 'production' | 'sandbox';
type Tab = 'curl' | 'axios';
type Section =
  | 'quickstart'
  | 'auth'
  | 'create-payment'
  | 'get-by-id'
  | 'get-by-invoice'
  | 'webhook'
  | 'statuses';

const BASE_URLS: Record<Env, string> = {
  production: 'http://91.98.225.235:3010',
  sandbox: 'http://91.98.225.235:3010',
};

const NAV_ITEMS: { id: Section; label: string; icon: React.ElementType; group: string }[] = [
  { id: 'quickstart', label: 'Quick Start', icon: Zap, group: 'Panduan' },
  { id: 'auth', label: 'Autentikasi', icon: Lock, group: 'Panduan' },
  { id: 'create-payment', label: 'Buat Invoice', icon: FileText, group: 'Payments' },
  { id: 'get-by-id', label: 'Get by ID', icon: BookOpen, group: 'Payments' },
  { id: 'get-by-invoice', label: 'Get by Invoice', icon: Code2, group: 'Payments' },
  { id: 'webhook', label: 'Webhook Callback', icon: Webhook, group: 'Event' },
  { id: 'statuses', label: 'Status Transaksi', icon: CheckCircle, group: 'Referensi' },
];

function MethodBadge({ method }: { method: 'GET' | 'POST' }) {
  const isPost = method === 'POST';
  return (
    <span className={`px-2 py-1 text-[10px] font-black tracking-widest uppercase rounded border ${
      isPost 
        ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' 
        : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
    }`}>
      {method}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/5"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function CodeBlock({ code, lang = 'bash' }: { code: string; lang?: string }) {
  return (
    <div className="relative bg-[#0b1426] rounded-xl border border-slate-800/60 overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/60 bg-[#0d182e]">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lang}</span>
        <CopyButton text={code} />
      </div>
      <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed whitespace-pre scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">{code}</pre>
    </div>
  );
}

function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-3 scroll-mt-24"
    >
      {children}
    </h2>
  );
}

// Split Pane Components
function SectionSplit({ children, id }: { children: React.ReactNode, id: string }) {
  return (
    <section id={id} className="scroll-mt-24 border-b border-slate-200 dark:border-slate-800/60">
      <div className="flex flex-col xl:flex-row">
        {children}
      </div>
    </section>
  );
}

function SectionLeft({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full xl:w-[55%] p-6 lg:p-10 xl:pr-12 bg-white dark:bg-[#0f172a] flex xl:justify-end">
      <div className="w-full max-w-[800px]">
        {children}
      </div>
    </div>
  );
}

function SectionRight({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full xl:w-[45%] p-6 lg:p-10 xl:pl-12 bg-slate-50 dark:bg-[#0B1120] xl:border-l border-slate-200 dark:border-slate-800/60 flex xl:justify-start">
      <div className="w-full max-w-[700px]">
        <div className="xl:sticky top-[80px] space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}

export const ApiDocsPage: React.FC = () => {
  const { user } = useAuth();
  const [env, setEnv] = useState<Env>('sandbox');
  const [activeSection, setActiveSection] = useState<Section>('quickstart');
  const [codeTab, setCodeTab] = useState<Tab>('curl');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [tryResult, setTryResult] = useState<Record<string, any>>({});
  const [tryLoading, setTryLoading] = useState<Record<string, boolean>>({});
  const [tryOpen, setTryOpen] = useState<Record<string, boolean>>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const baseUrl = BASE_URLS[env];
  const isMerchant = user?.role === 'MERCHANT';
  const displayKey = apiKeyInput || 'adms_sk_test_YOUR_KEY_HERE';

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id as Section);
          }
        });
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );
    NAV_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: Section) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileMenuOpen(false);
  };

  const tryRequest = async (endpointId: string, method: string, path: string, body?: any) => {
    setTryLoading(p => ({ ...p, [endpointId]: true }));
    setTryResult(p => ({ ...p, [endpointId]: null }));
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKeyInput) headers['Authorization'] = `Bearer ${apiKeyInput}`;
      const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json();
      setTryResult(p => ({ ...p, [endpointId]: { status: res.status, data: json } }));
    } catch (e: any) {
      setTryResult(p => ({ ...p, [endpointId]: { status: 0, data: { error: e.message } } }));
    } finally {
      setTryLoading(p => ({ ...p, [endpointId]: false }));
    }
  };

  // Try It state for create-payment
  const [tryCreateBody, setTryCreateBody] = useState({
    amount: '150000',
    customerName: 'Budi Santoso',
    customerPhone: '081234567890',
    description: 'Pembayaran SPP Juli 2026',
    callbackUrl: '',
    sourceSystem: isMerchant ? (user?.name || '') : 'NAMA_SISTEM',
  });

  const [tryGetId, setTryGetId] = useState('1');
  const [tryGetInvoice, setTryGetInvoice] = useState('INV-20260817-000001');

  const curlCreate = `curl -X POST ${baseUrl}/api/v1/payments \\
  -H "Authorization: Bearer ${displayKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 150000,
    "customerName": "Budi Santoso",
    "customerPhone": "081234567890",
    "description": "Pembayaran SPP Juli 2026",
    "sourceSystem": "SIMAK",
    "callbackUrl": "https://sistem-anda.com/webhook/adms"
  }'`;

  const axiosCreate = `import axios from 'axios';

const response = await axios.post(
  '${baseUrl}/api/v1/payments',
  {
    amount: 150000,
    customerName: 'Budi Santoso',
    customerPhone: '081234567890',
    description: 'Pembayaran SPP Juli 2026',
    sourceSystem: 'SIMAK',
    callbackUrl: 'https://sistem-anda.com/webhook/adms',
  },
  {
    headers: {
      Authorization: \`Bearer ${displayKey}\`,
    },
  }
);`;

  const curlGetId = `curl -X GET ${baseUrl}/api/v1/payments/${tryGetId} \\
  -H "Authorization: Bearer ${displayKey}"`;

  const curlGetInvoice = `curl -X GET "${baseUrl}/api/v1/payments/invoice/${tryGetInvoice}" \\
  -H "Authorization: Bearer ${displayKey}"`;

  const webhookExample = `{
  "event": "payment.paid",
  "invoiceNumber": "INV-20260817-000001",
  "amount": 150000,
  "customerName": "Budi Santoso",
  "customerPhone": "081234567890",
  "description": "Pembayaran SPP Juli 2026",
  "sourceSystem": "SIMAK",
  "paidAt": "2026-08-17T10:30:00.000Z"
}`;

  const webhookVerify = `import crypto from 'crypto';

app.post('/webhook/adms', (req, res) => {
  const signature = req.headers['x-adms-signature'];
  const body = JSON.stringify(req.body);
  const expected = 'sha256=' + crypto
    .createHmac('sha256', process.env.ADMS_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  if (signature !== expected) {
    return res.status(401).send('Unauthorized');
  }

  const { event, invoiceNumber, amount } = req.body;
  if (event === 'payment.paid') {
    // tandai transaksi sebagai lunas di sistem Anda
  }

  res.status(200).send('OK');
});`;

  const groups = [...new Set(NAV_ITEMS.map(i => i.group))];

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-[#0f172a] overflow-hidden selection:bg-indigo-500/30">
      {/* Top Navigation */}
      <header className="z-40 bg-white/70 dark:bg-[#0f172a]/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/60 px-4 lg:px-6 h-14 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button 
            className="p-1.5 -ml-1.5 lg:hidden text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <Code2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <span className="font-black text-slate-900 dark:text-white tracking-tight text-base hidden sm:inline-block">ADMS Developers</span>
          <span className="font-black text-slate-900 dark:text-white tracking-tight text-sm sm:hidden">ADMS API</span>
          {isMerchant && (
            <Badge variant="outline" className="hidden md:inline-flex ml-2">
              {user?.name}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest hidden sm:inline-block">Env:</span>
          <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200 dark:border-slate-800">
            {(['sandbox', 'production'] as Env[]).map(e => (
              <button
                key={e}
                onClick={() => setEnv(e)}
                className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all capitalize ${
                  env === e
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {e === 'production' ? 'Production' : 'Sandbox'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div 
            className="absolute inset-0 z-[45] bg-slate-900/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar Nav */}
        <aside className={`absolute inset-y-0 left-0 z-50 w-64 bg-slate-50 dark:bg-[#0B1120] border-r border-slate-200 dark:border-slate-800/60 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="h-full flex flex-col pt-4 lg:pt-0">
            {/* Mobile close button inside sidebar */}
            <button 
              className="absolute top-3 right-3 p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-5 pt-8 lg:pt-5 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
              {/* API Key Input */}
              <div className="mb-8">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Lock className="w-3 h-3" /> API Key
                </label>
                <input
                  type="text"
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                  placeholder="sk_test_..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-mono rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-slate-400 shadow-sm"
                />
                <p className="text-[10px] text-slate-500 mt-1.5">Untuk interaksi "Try It Out"</p>
              </div>

              <nav className="space-y-6">
                {groups.map(group => (
                  <div key={group}>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-3">{group}</p>
                    <div className="space-y-0.5">
                      {NAV_ITEMS.filter(i => i.group === group).map(item => {
                        const Icon = item.icon;
                        const isActive = activeSection === item.id;
                        return (
                            <a 
                              href={`#${item.id}`} 
                              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                                activeSection === item.id 
                                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/20 shadow-sm' 
                                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                            <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                            {item.label}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>

              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/60">
                <div className="bg-slate-100 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Base URL</p>
                  <code className="text-xs font-mono text-indigo-600 dark:text-indigo-400 break-all">{baseUrl}</code>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full">
            
            {/* Quick Start Section */}
            <SectionSplit id="quickstart">
              <SectionLeft>
                <Badge className="mb-3 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">Panduan</Badge>
                <SectionTitle id="quickstart">Quick Start</SectionTitle>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
                  ADMS QRIS Internal adalah payment gateway berbasis QRIS DANA untuk seluruh sistem internal organisasi.
                  Sistem eksternal mengirim request ke ADMS, mendapatkan link pembayaran, dan menerima notifikasi otomatis saat pembayaran dikonfirmasi.
                </p>

                <div className="grid gap-4">
                  {[
                    { step: '01', title: 'Dapatkan API Key', desc: 'Hubungi admin ADMS untuk mendaftarkan sistem Anda dan mendapatkan API Key + akun portal.' },
                    { step: '02', title: 'Buat Invoice', desc: 'POST ke /api/v1/payments dengan data transaksi. Anda akan mendapat paymentLink untuk customer.' },
                    { step: '03', title: 'Terima Webhook', desc: 'Saat admin ADMS verifikasi bayar, ADMS POST ke callbackUrl Anda dengan tanda tangan HMAC.' },
                  ].map(s => (
                    <div key={s.step} className="group flex gap-5 items-start p-2 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-xl transition-colors">
                      <div className="text-3xl font-black bg-gradient-to-br from-indigo-500 to-purple-500 bg-clip-text text-transparent opacity-80 group-hover:opacity-100 transition-opacity">
                        {s.step}
                      </div>
                      <div className="pt-1">
                        <div className="text-sm font-bold text-slate-900 dark:text-white mb-1">{s.title}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{s.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionLeft>
              <SectionRight>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-indigo-500" />
                    Alur Integrasi Lengkap
                  </p>
                  <div className="flex flex-col gap-4 relative">
                    <div className="absolute left-2.5 top-2 bottom-2 w-px bg-slate-100 dark:bg-slate-800"></div>
                    {[
                      { source: 'Sistem Anda', dest: 'POST /api/v1/payments', sub: 'Kirim data customer & nominal' },
                      { source: 'ADMS API', dest: '201 Created', sub: 'Dapat invoiceNumber + paymentLink', highlight: true },
                      { source: 'Sistem Anda', dest: 'Redirect ke paymentLink', sub: 'Customer scan QR DANA' },
                      { source: 'ADMS Webhook', dest: 'POST ke callbackUrl', sub: 'Pembayaran diverifikasi', highlight: true },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-4 relative z-10">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border-2 bg-white dark:bg-slate-900 ${item.highlight ? 'border-emerald-500' : 'border-indigo-500'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${item.highlight ? 'bg-emerald-500' : 'bg-indigo-500'}`}></div>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {item.source} <span className="text-slate-400 font-normal mx-1">→</span> <span className="font-mono text-indigo-600 dark:text-indigo-400">{item.dest}</span>
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{item.sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </SectionRight>
            </SectionSplit>

            {/* Authentication Section */}
            <SectionSplit id="auth">
              <SectionLeft>
                <SectionTitle id="auth">Autentikasi</SectionTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                  Semua request ke <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md text-xs font-mono text-pink-600 dark:text-pink-400">/api/v1/*</code> memerlukan API Key pada HTTP header <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md text-xs font-mono text-pink-600 dark:text-pink-400">Authorization</code>.
                </p>
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0" />
                  <div className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                    <strong>Jaga kerahasiaan API Key.</strong> Jangan pernah mengeksposnya di sisi frontend/browser. Simpan di environment variable server-side (misalnya <code className="font-mono bg-white/50 dark:bg-black/20 px-1 rounded">.env</code>). API Key hanya ditampilkan sekali saat dibuat.
                  </div>
                </div>
              </SectionLeft>
              <SectionRight>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Format Header HTTP</p>
                <CodeBlock lang="http" code={`Authorization: Bearer ${displayKey}`} />
              </SectionRight>
            </SectionSplit>

            {/* Create Payment Section */}
            <SectionSplit id="create-payment">
              <SectionLeft>
                <div className="flex items-center gap-3 mb-2">
                  <SectionTitle id="create-payment">Buat Invoice Pembayaran</SectionTitle>
                </div>
                <div className="flex items-center gap-3 mb-6">
                  <MethodBadge method="POST" />
                  <code className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">/api/v1/payments</code>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
                  Membuat invoice pembayaran baru. Sistem akan mengembalikan <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs font-mono">invoiceNumber</code> dan <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs font-mono">paymentLink</code> yang siap diberikan ke customer.
                </p>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">Body Parameters</h3>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {[
                      { name: 'amount', type: 'integer', required: true, desc: 'Nominal pembayaran dalam Rupiah (IDR). Minimal 1000.' },
                      { name: 'customerName', type: 'string', required: true, desc: 'Nama lengkap customer.' },
                      { name: 'customerPhone', type: 'string', required: false, desc: 'Nomor telepon customer. Contoh: 081234567890.' },
                      { name: 'description', type: 'string', required: true, desc: 'Keterangan pembayaran. Muncul di halaman QR customer.' },
                      { name: 'sourceSystem', type: 'string', required: false, desc: 'Nama sistem pengirim. Digunakan untuk filter pencatatan.' },
                      { name: 'callbackUrl', type: 'string (URL)', required: false, desc: 'URL endpoint Anda yang akan di-POST ADMS saat pembayaran Lunas.' },
                    ].map(p => (
                      <div key={p.name} className="py-4 flex flex-col sm:flex-row gap-2 sm:gap-6">
                        <div className="w-full sm:w-48 flex-shrink-0">
                          <div className="flex items-center gap-2 mb-1">
                            <code className="text-sm font-mono font-bold text-slate-900 dark:text-white">{p.name}</code>
                            {p.required && <span className="text-[10px] text-rose-500 font-bold uppercase bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded">Required</span>}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">{p.type}</div>
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed flex-1">
                          {p.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </SectionLeft>
              <SectionRight>
                <div className="flex gap-2 mb-3">
                  {(['curl', 'axios'] as Tab[]).map(t => (
                    <button key={t} onClick={() => setCodeTab(t)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                        codeTab === t 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                      }`}>
                      {t === 'curl' ? 'cURL' : 'Node.js (Axios)'}
                    </button>
                  ))}
                </div>
                <CodeBlock lang={codeTab === 'curl' ? 'bash' : 'javascript'} code={codeTab === 'curl' ? curlCreate : axiosCreate} />

                <div className="mt-6">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Response 201 Created
                  </p>
                  <CodeBlock lang="json" code={`{
  "success": true,
  "data": {
    "id": 42,
    "invoiceNumber": "INV-20260817-000042",
    "paymentLink": "${baseUrl}/pay/INV-20260817-000042",
    "amount": 150000,
    "customerName": "Budi Santoso",
    "status": "PENDING",
    "expiredAt": "2026-08-17T11:00:00.000Z"
  }
}`} />
                </div>

                {/* Try It Out Card */}
                <div className="mt-8">
                  <button
                    onClick={() => setTryOpen(p => ({ ...p, 'create-payment': !p['create-payment'] }))}
                    className="group w-full flex items-center justify-between px-5 py-4 bg-white dark:bg-gradient-to-r dark:from-[#151f32] dark:to-[#1a233a] border border-indigo-200 dark:border-indigo-500/30 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-400/80 transition-all shadow-sm hover:shadow-indigo-500/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-100 dark:bg-indigo-500/20 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                        <Play className="w-4 h-4 text-indigo-600 dark:text-indigo-400 fill-current" />
                      </div>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">Interactive: Try It Out</span>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-all duration-300 ${tryOpen['create-payment'] ? 'rotate-90' : ''}`} />
                  </button>
                  
                  {tryOpen['create-payment'] && (
                    <div className="mt-3 p-6 border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] rounded-xl shadow-xl shadow-black/20 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                      {!apiKeyInput && (
                        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-3 flex gap-2 text-xs text-amber-700 dark:text-amber-400 mb-4">
                          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>Anda belum memasukkan API Key di menu navigasi. Request kemungkinan akan gagal dengan <code className="font-mono">401 Unauthorized</code>.</span>
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { key: 'amount', label: 'Amount (IDR)', type: 'number' },
                          { key: 'customerName', label: 'Customer Name', type: 'text' },
                          { key: 'customerPhone', label: 'Phone (opt)', type: 'text' },
                          { key: 'sourceSystem', label: 'Source (opt)', type: 'text' },
                        ].map(f => (
                          <div key={f.key}>
                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{f.label}</label>
                            <input type={f.type} value={(tryCreateBody as any)[f.key]}
                              onChange={e => setTryCreateBody(p => ({ ...p, [f.key]: e.target.value }))}
                              className="w-full border border-slate-200 dark:border-slate-700/60 rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-inner"
                            />
                          </div>
                        ))}
                        <div className="col-span-1 sm:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                          <input type="text" value={tryCreateBody.description}
                            onChange={e => setTryCreateBody(p => ({ ...p, description: e.target.value }))}
                            className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          />
                        </div>
                      </div>
                      <div className="pt-2">
                        <Button
                          onClick={() => tryRequest('create-payment', 'POST', '/api/v1/payments', {
                            amount: parseInt(tryCreateBody.amount),
                            customerName: tryCreateBody.customerName,
                            customerPhone: tryCreateBody.customerPhone,
                            description: tryCreateBody.description,
                            sourceSystem: tryCreateBody.sourceSystem || undefined,
                            callbackUrl: tryCreateBody.callbackUrl || undefined,
                          })}
                          disabled={tryLoading['create-payment']}
                          className="w-full sm:w-auto"
                        >
                          {tryLoading['create-payment'] ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                          Send Request
                        </Button>
                      </div>
                      
                      {tryResult['create-payment'] && (
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Live Response</p>
                            <Badge variant={tryResult['create-payment'].status >= 200 && tryResult['create-payment'].status < 300 ? 'success' : 'danger'}>
                              Status: {tryResult['create-payment'].status}
                            </Badge>
                          </div>
                          <CodeBlock lang="json" code={JSON.stringify(tryResult['create-payment'].data, null, 2)} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </SectionRight>
            </SectionSplit>

            {/* Get by ID Section */}
            <SectionSplit id="get-by-id">
              <SectionLeft>
                <SectionTitle id="get-by-id">Get Payment by ID</SectionTitle>
                <div className="flex items-center gap-3 mb-6">
                  <MethodBadge method="GET" />
                  <code className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">/api/v1/payments/:id</code>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                  Mengambil detail transaksi berdasarkan ID internal ADMS. ID ini dikembalikan saat invoice pertama kali dibuat.
                </p>
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">Path Parameters</h3>
                  <div className="py-2 flex flex-col sm:flex-row gap-2 sm:gap-6">
                    <div className="w-48 flex-shrink-0">
                      <code className="text-sm font-mono font-bold text-slate-900 dark:text-white mb-1 block">id</code>
                      <div className="text-xs text-slate-500 font-mono">integer</div>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">ID numerik dari payment.</div>
                  </div>
                </div>
              </SectionLeft>
              <SectionRight>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">cURL Request</p>
                <CodeBlock lang="bash" code={curlGetId} />
                
                <div className="mt-6">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Response 200 OK
                  </p>
                  <CodeBlock lang="json" code={`{
  "success": true,
  "data": {
    "id": 42,
    "invoiceNumber": "INV-20260817-000042",
    "amount": 150000,
    "status": "PAID",
    "paidAt": "2026-08-17T10:30:00.000Z",
    "sourceSystem": "SIMAK"
  }
}`} />
                </div>

                <div className="mt-8">
                  <button
                    onClick={() => setTryOpen(p => ({ ...p, 'get-by-id': !p['get-by-id'] }))}
                    className="group w-full flex items-center justify-between px-5 py-4 bg-white dark:bg-gradient-to-r dark:from-[#151f32] dark:to-[#1a233a] border border-indigo-200 dark:border-indigo-500/30 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-400/80 transition-all shadow-sm hover:shadow-indigo-500/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-100 dark:bg-indigo-500/20 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                        <Play className="w-4 h-4 text-indigo-600 dark:text-indigo-400 fill-current" />
                      </div>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">Interactive: Try It Out</span>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-all duration-300 ${tryOpen['get-by-id'] ? 'rotate-90' : ''}`} />
                  </button>
                  
                  {tryOpen['get-by-id'] && (
                    <div className="mt-3 p-6 border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] rounded-xl shadow-xl shadow-black/20 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                      {!apiKeyInput && (
                        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-3 flex gap-2 text-xs text-amber-700 dark:text-amber-400 mb-4">
                          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>API Key belum diisi.</span>
                        </div>
                      )}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Payment ID</label>
                        <input type="number" value={tryGetId} onChange={e => setTryGetId(e.target.value)}
                          className="w-full max-w-sm border border-slate-200 dark:border-slate-700/60 rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-inner" />
                      </div>
                      <Button onClick={() => tryRequest('get-by-id', 'GET', `/api/v1/payments/${tryGetId}`)}
                        disabled={tryLoading['get-by-id']} variant="default">
                        {tryLoading['get-by-id'] ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                        Send Request
                      </Button>
                      {tryResult['get-by-id'] && (
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 mt-4">
                          <CodeBlock lang="json" code={JSON.stringify(tryResult['get-by-id'].data, null, 2)} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </SectionRight>
            </SectionSplit>

            {/* Get by Invoice Section */}
            <SectionSplit id="get-by-invoice">
              <SectionLeft>
                <SectionTitle id="get-by-invoice">Get Payment by Invoice</SectionTitle>
                <div className="flex items-center gap-3 mb-6">
                  <MethodBadge method="GET" />
                  <code className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">/api/v1/payments/invoice/:invoiceNumber</code>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                  Mengambil detail transaksi berdasarkan nomor invoice (<code className="font-mono text-pink-600 dark:text-pink-400">invoiceNumber</code>). Ini adalah metode yang disarankan karena Anda umumnya menyimpan nomor invoice di database sistem Anda.
                </p>
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">Path Parameters</h3>
                  <div className="py-2 flex flex-col sm:flex-row gap-2 sm:gap-6">
                    <div className="w-48 flex-shrink-0">
                      <code className="text-sm font-mono font-bold text-slate-900 dark:text-white mb-1 block">invoiceNumber</code>
                      <div className="text-xs text-slate-500 font-mono">string</div>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Nomor invoice ADMS. (Contoh: INV-2026...)</div>
                  </div>
                </div>
              </SectionLeft>
              <SectionRight>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">cURL Request</p>
                <CodeBlock lang="bash" code={curlGetInvoice} />
                
                <div className="mt-8">
                  <button
                    onClick={() => setTryOpen(p => ({ ...p, 'get-by-invoice': !p['get-by-invoice'] }))}
                    className="group w-full flex items-center justify-between px-5 py-4 bg-white dark:bg-gradient-to-r dark:from-[#151f32] dark:to-[#1a233a] border border-indigo-200 dark:border-indigo-500/30 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-400/80 transition-all shadow-sm hover:shadow-indigo-500/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-100 dark:bg-indigo-500/20 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                        <Play className="w-4 h-4 text-indigo-600 dark:text-indigo-400 fill-current" />
                      </div>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">Interactive: Try It Out</span>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-all duration-300 ${tryOpen['get-by-invoice'] ? 'rotate-90' : ''}`} />
                  </button>
                  
                  {tryOpen['get-by-invoice'] && (
                    <div className="mt-3 p-6 border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] rounded-xl shadow-xl shadow-black/20 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                      {!apiKeyInput && (
                        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-3 flex gap-2 text-xs text-amber-700 dark:text-amber-400 mb-4">
                          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>API Key belum diisi.</span>
                        </div>
                      )}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Invoice Number</label>
                        <input type="text" value={tryGetInvoice} onChange={e => setTryGetInvoice(e.target.value)}
                          className="w-full max-w-sm border border-slate-200 dark:border-slate-700/60 rounded-lg px-3 py-2 text-sm bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-inner" />
                      </div>
                      <Button onClick={() => tryRequest('get-by-invoice', 'GET', `/api/v1/payments/invoice/${tryGetInvoice}`)}
                        disabled={tryLoading['get-by-invoice']}>
                        {tryLoading['get-by-invoice'] ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                        Send Request
                      </Button>
                      {tryResult['get-by-invoice'] && (
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 mt-4">
                          <CodeBlock lang="json" code={JSON.stringify(tryResult['get-by-invoice'].data, null, 2)} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </SectionRight>
            </SectionSplit>

            {/* Webhook Section */}
            <SectionSplit id="webhook">
              <SectionLeft>
                <Badge variant="outline" className="mb-3 text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-500/30">Event Delivery</Badge>
                <SectionTitle id="webhook">Webhook Callback</SectionTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                  Saat admin ADMS mengonfirmasi pembayaran, ADMS akan mengirimkan HTTP POST ke URL <code className="font-mono text-pink-600 dark:text-pink-400">callbackUrl</code> yang Anda tentukan saat membuat invoice.
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
                  Selalu verifikasi origin webhook menggunakan header signature <code className="font-mono text-pink-600 dark:text-pink-400">X-ADMS-Signature</code> untuk memastikan request benar-benar berasal dari ADMS dan tidak dimodifikasi.
                </p>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">Headers dari ADMS</h3>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {[
                      { name: 'X-ADMS-Signature', desc: 'HMAC-SHA256 signature. Format: sha256=<hex>. Wajib divalidasi.' },
                      { name: 'X-ADMS-Event', desc: 'Nama event. Saat ini nilainya selalu: payment.paid' },
                      { name: 'Content-Type', desc: 'application/json' },
                    ].map(h => (
                      <div key={h.name} className="py-4 flex flex-col sm:flex-row gap-2 sm:gap-6">
                        <div className="w-full sm:w-48 flex-shrink-0">
                          <code className="text-sm font-mono font-bold text-slate-900 dark:text-white">{h.name}</code>
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed flex-1">
                          {h.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-5">
                  <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Kebijakan Pengiriman (Retries)
                  </h4>
                  <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-400/80">
                    <li className="flex gap-2.5 items-start">
                      <div className="mt-1 bg-blue-200 dark:bg-blue-800 rounded-full w-1.5 h-1.5 flex-shrink-0"></div>
                      <span>ADMS mengirim webhook dengan <strong>timeout 10 detik</strong>.</span>
                    </li>
                    <li className="flex gap-2.5 items-start">
                      <div className="mt-1 bg-blue-200 dark:bg-blue-800 rounded-full w-1.5 h-1.5 flex-shrink-0"></div>
                      <span>Server Anda <strong>wajib merespon dengan status 2xx (mis. 200 OK)</strong> dalam batas waktu tersebut.</span>
                    </li>
                    <li className="flex gap-2.5 items-start">
                      <div className="mt-1 bg-blue-200 dark:bg-blue-800 rounded-full w-1.5 h-1.5 flex-shrink-0"></div>
                      <span>Jika server Anda merespon 4xx/5xx atau terjadi timeout, ADMS akan <strong>mencoba ulang 1 kali</strong> setelah jeda 3 detik.</span>
                    </li>
                  </ul>
                </div>
              </SectionLeft>
              <SectionRight>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Contoh Payload Webhook</p>
                <CodeBlock lang="json" code={webhookExample} />

                <div className="mt-8">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Validasi Signature di Node.js (Express)</p>
                  <CodeBlock lang="javascript" code={webhookVerify} />
                </div>
              </SectionRight>
            </SectionSplit>

            {/* Statuses Section */}
            <SectionSplit id="statuses">
              <SectionLeft>
                <SectionTitle id="statuses">Siklus Status Transaksi</SectionTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                  Setiap invoice memiliki lifecycle state yang direpresentasikan dalam field <code className="font-mono text-pink-600 dark:text-pink-400">status</code>. Berikut adalah daftar status yang mungkin dikembalikan oleh API.
                </p>
              </SectionLeft>
              <SectionRight>
                  <div className="divide-y divide-slate-200 dark:divide-slate-800/60 pb-20">
                    {[
                      { status: 'PENDING', badge: 'warning', desc: 'Invoice berhasil dibuat, menunggu customer melakukan scan QRIS dan transfer.' },
                      { status: 'PAID', badge: 'success', desc: 'Pembayaran telah dikonfirmasi (diverifikasi manual) oleh admin ADMS. Webhook telah dipicu.' },
                      { status: 'EXPIRED', badge: 'secondary', desc: 'Invoice melewati batas waktu yang ditentukan tanpa adanya konfirmasi pembayaran.' },
                      { status: 'CANCELLED', badge: 'danger', desc: 'Invoice dibatalkan secara sepihak oleh admin ADMS (misal: spam atau salah nominal).' },
                    ].map(s => (
                      <div key={s.status} className="py-4 flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-5">
                        <div className="w-28 flex-shrink-0">
                          <Badge variant={s.badge as any} className="font-mono">{s.status}</Badge>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{s.desc}</p>
                      </div>
                    ))}
                  </div>
              </SectionRight>
            </SectionSplit>

          </div>
        </main>
      </div>
    </div>
  );
};
