import React, { useState, useRef, useEffect } from 'react';
import {
  Code2, Terminal, Shield, Webhook, Play, Copy, Check, Lock,
  Globe, ChevronRight, BookOpen, Zap, AlertTriangle, ArrowRight,
  Key, FileText, CheckCircle, Clock, RefreshCw, Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { apiFetch } from '../services/api.js';

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
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-black tracking-widest ${
      method === 'POST'
        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
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
      className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function CodeBlock({ code, lang = 'bash' }: { code: string; lang?: string }) {
  return (
    <div className="relative bg-[#0D1B2A] rounded-xl border border-[#1E3A5F] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1E3A5F]">
        <span className="text-[11px] font-bold text-[#C9A84C] uppercase tracking-widest">{lang}</span>
        <CopyButton text={code} />
      </div>
      <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed whitespace-pre">{code}</pre>
    </div>
  );
}

function ParamRow({ name, type, required, desc }: { name: string; type: string; required?: boolean; desc: string }) {
  return (
    <tr className="border-b border-slate-100 dark:border-slate-800 last:border-0">
      <td className="py-3 pr-4 align-top">
        <div className="flex items-center gap-2">
          <code className="text-xs font-mono font-bold text-[#0D1B2A] dark:text-[#C9A84C]">{name}</code>
          {required && <span className="text-[10px] text-rose-500 font-bold uppercase">wajib</span>}
        </div>
        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{type}</div>
      </td>
      <td className="py-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</td>
    </tr>
  );
}

function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="text-lg font-black text-[#0D1B2A] dark:text-slate-100 mb-1 flex items-center gap-2 scroll-mt-24"
    >
      {children}
    </h2>
  );
}

function Divider() {
  return <div className="border-t border-slate-100 dark:border-slate-800 my-10" />;
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
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
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
    <div className="min-h-screen">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-[#0D1B2A] border-b border-[#1E3A5F] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Code2 className="w-5 h-5 text-[#C9A84C]" />
          <span className="text-white font-black text-sm tracking-tight">ADMS Developer Portal</span>
          {isMerchant && (
            <span className="text-[10px] font-bold bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/30 px-2 py-0.5 rounded uppercase tracking-widest">
              {user?.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest">Environment</span>
          <div className="flex bg-[#1A2F4A] rounded-lg p-0.5 border border-[#1E3A5F]">
            {(['sandbox', 'production'] as Env[]).map(e => (
              <button
                key={e}
                onClick={() => setEnv(e)}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all capitalize ${
                  env === e
                    ? 'bg-[#C9A84C] text-[#0D1B2A]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {e === 'production' ? 'Production' : 'Sandbox'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Left Sidebar Nav */}
        <aside className="w-56 shrink-0 sticky top-[52px] h-[calc(100vh-52px)] overflow-y-auto bg-[#0D1B2A] border-r border-[#1E3A5F] py-6 hidden lg:block">
          {/* API Key Input */}
          <div className="px-4 mb-6">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">API Key Anda</p>
            <input
              type="text"
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              placeholder="adms_sk_test_..."
              className="w-full bg-[#1A2F4A] border border-[#1E3A5F] text-slate-300 text-[11px] font-mono rounded-lg px-3 py-2 focus:outline-none focus:border-[#C9A84C] placeholder-slate-600 transition-colors"
            />
            <p className="text-[10px] text-slate-600 mt-1">Digunakan untuk "Try It Out"</p>
          </div>

          <nav className="space-y-5 px-3">
            {groups.map(group => (
              <div key={group}>
                <p className="text-[10px] font-black text-[#C9A84C] uppercase tracking-widest mb-1.5 px-3">{group}</p>
                <div className="space-y-0.5">
                  {NAV_ITEMS.filter(i => i.group === group).map(item => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => scrollTo(item.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left ${
                          isActive
                            ? 'bg-[#C9A84C]/15 text-[#C9A84C] border-l-2 border-[#C9A84C]'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="px-4 mt-8 pt-6 border-t border-[#1E3A5F]">
            <div className="bg-[#1A2F4A] rounded-xl p-3 border border-[#1E3A5F]">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Base URL</p>
              <code className="text-[10px] font-mono text-[#C9A84C] break-all">{baseUrl}</code>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 max-w-3xl px-8 py-10 space-y-0">

          {/* Quick Start */}
          <section id="quickstart" className="scroll-mt-24">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-[#C9A84C]" />
              <span className="text-[11px] font-black text-[#C9A84C] uppercase tracking-widest">Panduan</span>
            </div>
            <SectionTitle id="quickstart">Quick Start</SectionTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              ADMS QRIS Internal adalah payment gateway berbasis QRIS DANA untuk seluruh sistem internal organisasi.
              Sistem eksternal mengirim request ke ADMS, mendapatkan link pembayaran, dan menerima notifikasi otomatis saat pembayaran dikonfirmasi.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              {[
                { step: '01', title: 'Dapatkan API Key', desc: 'Hubungi admin ADMS untuk mendaftarkan sistem Anda dan mendapatkan API Key + akun portal.' },
                { step: '02', title: 'Buat Invoice', desc: 'POST ke /api/v1/payments dengan data transaksi. Anda akan mendapat paymentLink untuk customer.' },
                { step: '03', title: 'Terima Webhook', desc: 'Saat admin ADMS verifikasi bayar, ADMS POST ke callbackUrl Anda dengan tanda tangan HMAC.' },
              ].map(s => (
                <div key={s.step} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                  <div className="text-2xl font-black text-[#C9A84C] mb-2">{s.step}</div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">{s.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{s.desc}</div>
                </div>
              ))}
            </div>

            <div className="bg-[#0D1B2A] rounded-xl border border-[#1E3A5F] p-5">
              <p className="text-xs font-bold text-[#C9A84C] mb-3 uppercase tracking-wider">Contoh Alur Lengkap</p>
              <div className="flex flex-col gap-2">
                {[
                  { arrow: false, text: 'Sistem Anda → POST /api/v1/payments', sub: 'Kirim data customer & nominal' },
                  { arrow: true, text: 'ADMS → 201 Created', sub: 'Dapat invoiceNumber + paymentLink' },
                  { arrow: false, text: 'Sistem Anda → redirect customer ke paymentLink', sub: 'Customer scan QR DANA' },
                  { arrow: true, text: 'ADMS → POST ke callbackUrl Anda', sub: 'Setelah admin verifikasi, webhook dikirim' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${item.arrow ? 'bg-emerald-500/20' : 'bg-[#C9A84C]/20'}`}>
                      {item.arrow
                        ? <ArrowRight className="w-3 h-3 text-emerald-400" />
                        : <ChevronRight className="w-3 h-3 text-[#C9A84C]" />
                      }
                    </div>
                    <div>
                      <p className="text-xs font-mono text-slate-200">{item.text}</p>
                      <p className="text-[11px] text-slate-500">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <Divider />

          {/* Authentication */}
          <section id="auth" className="scroll-mt-24">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="w-4 h-4 text-[#C9A84C]" />
              <span className="text-[11px] font-black text-[#C9A84C] uppercase tracking-widest">Panduan</span>
            </div>
            <SectionTitle id="auth">Autentikasi</SectionTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              Semua request ke <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">/api/v1/*</code> memerlukan API Key pada header <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">Authorization</code>.
            </p>
            <CodeBlock lang="http-header" code={`Authorization: Bearer adms_sk_test_YOUR_API_KEY`} />
            <div className="mt-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                <strong>Jaga kerahasiaan API Key.</strong> Jangan expose di frontend/browser. Simpan di environment variable server-side (mis. <code className="font-mono">.env</code>). API Key hanya ditampilkan sekali saat didaftarkan.
              </div>
            </div>
          </section>

          <Divider />

          {/* Create Payment */}
          <section id="create-payment" className="scroll-mt-24">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-[#C9A84C]" />
              <span className="text-[11px] font-black text-[#C9A84C] uppercase tracking-widest">Payments</span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <SectionTitle id="create-payment">Buat Invoice Pembayaran</SectionTitle>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <MethodBadge method="POST" />
              <code className="text-sm font-mono text-slate-600 dark:text-slate-400">/api/v1/payments</code>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              Membuat invoice pembayaran baru. Sistem akan mengembalikan <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs font-mono">invoiceNumber</code> dan <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs font-mono">paymentLink</code> yang bisa diberikan ke customer.
            </p>

            {/* Request Params */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden mb-5">
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Request Body</p>
              </div>
              <table className="w-full px-4">
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[
                    { name: 'amount', type: 'integer', required: true, desc: 'Nominal pembayaran dalam Rupiah (IDR). Minimal 1000.' },
                    { name: 'customerName', type: 'string', required: true, desc: 'Nama lengkap customer yang melakukan pembayaran.' },
                    { name: 'customerPhone', type: 'string', required: false, desc: 'Nomor telepon customer. Contoh: 081234567890.' },
                    { name: 'description', type: 'string', required: true, desc: 'Keterangan pembayaran. Muncul di halaman QR customer.' },
                    { name: 'sourceSystem', type: 'string', required: false, desc: 'Nama sistem pengirim (mis. "SIMAK", "Web Hosting"). Digunakan untuk filter pencatatan.' },
                    { name: 'callbackUrl', type: 'string (URL)', required: false, desc: 'URL endpoint Anda yang akan di-POST ADMS saat pembayaran PAID.' },
                    { name: 'idempotencyKey', type: 'string', required: false, desc: 'Kunci unik untuk mencegah invoice duplikat jika request dikirim ulang.' },
                  ].map(p => (
                    <tr key={p.name} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <td className="py-3 pl-4 pr-4 align-top w-52">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono font-bold text-[#0D1B2A] dark:text-[#C9A84C]">{p.name}</code>
                          {p.required && <span className="text-[10px] text-rose-500 font-black uppercase">wajib</span>}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.type}</div>
                      </td>
                      <td className="py-3 pr-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{p.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Code Example */}
            <div className="flex gap-1 mb-2">
              {(['curl', 'axios'] as Tab[]).map(t => (
                <button key={t} onClick={() => setCodeTab(t)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${codeTab === t ? 'bg-[#C9A84C] text-[#0D1B2A]' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700'}`}>
                  {t === 'curl' ? 'cURL' : 'Axios (JS)'}
                </button>
              ))}
            </div>
            <CodeBlock lang={codeTab === 'curl' ? 'bash' : 'javascript'} code={codeTab === 'curl' ? curlCreate : axiosCreate} />

            {/* Response */}
            <div className="mt-4">
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Contoh Response (201 Created)</p>
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

            {/* Try It Out */}
            <div className="mt-5 border border-[#C9A84C]/30 rounded-xl overflow-hidden">
              <button
                onClick={() => setTryOpen(p => ({ ...p, 'create-payment': !p['create-payment'] }))}
                className="w-full flex items-center justify-between px-4 py-3 bg-[#C9A84C]/10 hover:bg-[#C9A84C]/15 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-[#C9A84C]" />
                  <span className="text-sm font-bold text-[#C9A84C]">Try It Out</span>
                </div>
                <ChevronRight className={`w-4 h-4 text-[#C9A84C] transition-transform ${tryOpen['create-payment'] ? 'rotate-90' : ''}`} />
              </button>
              {tryOpen['create-payment'] && (
                <div className="p-4 border-t border-[#C9A84C]/20 bg-white dark:bg-slate-900 space-y-3">
                  {!apiKeyInput && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex gap-2 text-xs text-amber-700 dark:text-amber-300">
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      Masukkan API Key Anda di sidebar kiri untuk Try It Out
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'amount', label: 'Amount (IDR)', type: 'number' },
                      { key: 'customerName', label: 'Customer Name', type: 'text' },
                      { key: 'customerPhone', label: 'Phone', type: 'text' },
                      { key: 'sourceSystem', label: 'Source System', type: 'text' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">{f.label}</label>
                        <input type={f.type} value={(tryCreateBody as any)[f.key]}
                          onChange={e => setTryCreateBody(p => ({ ...p, [f.key]: e.target.value }))}
                          className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#C9A84C]"
                        />
                      </div>
                    ))}
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                      <input type="text" value={tryCreateBody.description}
                        onChange={e => setTryCreateBody(p => ({ ...p, description: e.target.value }))}
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 focus:outline-none focus:border-[#C9A84C]"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Callback URL (opsional)</label>
                      <input type="url" value={tryCreateBody.callbackUrl}
                        onChange={e => setTryCreateBody(p => ({ ...p, callbackUrl: e.target.value }))}
                        placeholder="https://sistem-anda.com/webhook/adms"
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 focus:outline-none focus:border-[#C9A84C] placeholder-slate-400"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => tryRequest('create-payment', 'POST', '/api/v1/payments', {
                      amount: parseInt(tryCreateBody.amount),
                      customerName: tryCreateBody.customerName,
                      customerPhone: tryCreateBody.customerPhone,
                      description: tryCreateBody.description,
                      sourceSystem: tryCreateBody.sourceSystem || undefined,
                      callbackUrl: tryCreateBody.callbackUrl || undefined,
                    })}
                    disabled={tryLoading['create-payment'] || !apiKeyInput}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0D1B2A] hover:bg-[#1A2F4A] text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {tryLoading['create-payment'] ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    Kirim Request
                  </button>
                  {tryResult['create-payment'] && (
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Response{' '}
                        <span className={`font-black ${tryResult['create-payment'].status >= 200 && tryResult['create-payment'].status < 300 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {tryResult['create-payment'].status}
                        </span>
                      </p>
                      <CodeBlock lang="json" code={JSON.stringify(tryResult['create-payment'].data, null, 2)} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          <Divider />

          {/* Get by ID */}
          <section id="get-by-id" className="scroll-mt-24">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-[#C9A84C]" />
              <span className="text-[11px] font-black text-[#C9A84C] uppercase tracking-widest">Payments</span>
            </div>
            <SectionTitle id="get-by-id">Get Payment by ID</SectionTitle>
            <div className="flex items-center gap-2 mb-4">
              <MethodBadge method="GET" />
              <code className="text-sm font-mono text-slate-600 dark:text-slate-400">/api/v1/payments/:id</code>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Mengambil detail transaksi berdasarkan ID internal ADMS.</p>
            <CodeBlock lang="bash" code={curlGetId} />
            <div className="mt-4">
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Contoh Response (200 OK)</p>
              <CodeBlock lang="json" code={`{
  "success": true,
  "data": {
    "id": 42,
    "invoiceNumber": "INV-20260817-000042",
    "amount": 150000,
    "customerName": "Budi Santoso",
    "status": "PAID",
    "paidAt": "2026-08-17T10:30:00.000Z",
    "sourceSystem": "SIMAK"
  }
}`} />
            </div>
            <div className="mt-5 border border-[#C9A84C]/30 rounded-xl overflow-hidden">
              <button onClick={() => setTryOpen(p => ({ ...p, 'get-by-id': !p['get-by-id'] }))}
                className="w-full flex items-center justify-between px-4 py-3 bg-[#C9A84C]/10 hover:bg-[#C9A84C]/15 transition-colors">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-[#C9A84C]" />
                  <span className="text-sm font-bold text-[#C9A84C]">Try It Out</span>
                </div>
                <ChevronRight className={`w-4 h-4 text-[#C9A84C] transition-transform ${tryOpen['get-by-id'] ? 'rotate-90' : ''}`} />
              </button>
              {tryOpen['get-by-id'] && (
                <div className="p-4 border-t border-[#C9A84C]/20 bg-white dark:bg-slate-900 space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Payment ID</label>
                    <input type="number" value={tryGetId} onChange={e => setTryGetId(e.target.value)}
                      className="w-full max-w-xs border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 focus:outline-none focus:border-[#C9A84C]" />
                  </div>
                  <button onClick={() => tryRequest('get-by-id', 'GET', `/api/v1/payments/${tryGetId}`)}
                    disabled={tryLoading['get-by-id'] || !apiKeyInput}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0D1B2A] hover:bg-[#1A2F4A] text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {tryLoading['get-by-id'] ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    Kirim Request
                  </button>
                  {tryResult['get-by-id'] && (
                    <CodeBlock lang="json" code={JSON.stringify(tryResult['get-by-id'].data, null, 2)} />
                  )}
                </div>
              )}
            </div>
          </section>

          <Divider />

          {/* Get by Invoice */}
          <section id="get-by-invoice" className="scroll-mt-24">
            <div className="flex items-center gap-2 mb-1">
              <Code2 className="w-4 h-4 text-[#C9A84C]" />
              <span className="text-[11px] font-black text-[#C9A84C] uppercase tracking-widest">Payments</span>
            </div>
            <SectionTitle id="get-by-invoice">Get Payment by Invoice Number</SectionTitle>
            <div className="flex items-center gap-2 mb-4">
              <MethodBadge method="GET" />
              <code className="text-sm font-mono text-slate-600 dark:text-slate-400">/api/v1/payments/invoice/:invoiceNumber</code>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              Mengambil detail transaksi berdasarkan nomor invoice. Lebih umum digunakan karena <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs font-mono">invoiceNumber</code> yang Anda simpan saat membuat invoice.
            </p>
            <CodeBlock lang="bash" code={curlGetInvoice} />
            <div className="mt-5 border border-[#C9A84C]/30 rounded-xl overflow-hidden">
              <button onClick={() => setTryOpen(p => ({ ...p, 'get-by-invoice': !p['get-by-invoice'] }))}
                className="w-full flex items-center justify-between px-4 py-3 bg-[#C9A84C]/10 hover:bg-[#C9A84C]/15 transition-colors">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-[#C9A84C]" />
                  <span className="text-sm font-bold text-[#C9A84C]">Try It Out</span>
                </div>
                <ChevronRight className={`w-4 h-4 text-[#C9A84C] transition-transform ${tryOpen['get-by-invoice'] ? 'rotate-90' : ''}`} />
              </button>
              {tryOpen['get-by-invoice'] && (
                <div className="p-4 border-t border-[#C9A84C]/20 bg-white dark:bg-slate-900 space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Invoice Number</label>
                    <input type="text" value={tryGetInvoice} onChange={e => setTryGetInvoice(e.target.value)}
                      className="w-full max-w-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 focus:outline-none focus:border-[#C9A84C]" />
                  </div>
                  <button onClick={() => tryRequest('get-by-invoice', 'GET', `/api/v1/payments/invoice/${tryGetInvoice}`)}
                    disabled={tryLoading['get-by-invoice'] || !apiKeyInput}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0D1B2A] hover:bg-[#1A2F4A] text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {tryLoading['get-by-invoice'] ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    Kirim Request
                  </button>
                  {tryResult['get-by-invoice'] && (
                    <CodeBlock lang="json" code={JSON.stringify(tryResult['get-by-invoice'].data, null, 2)} />
                  )}
                </div>
              )}
            </div>
          </section>

          <Divider />

          {/* Webhook */}
          <section id="webhook" className="scroll-mt-24">
            <div className="flex items-center gap-2 mb-1">
              <Webhook className="w-4 h-4 text-[#C9A84C]" />
              <span className="text-[11px] font-black text-[#C9A84C] uppercase tracking-widest">Event</span>
            </div>
            <SectionTitle id="webhook">Webhook Callback</SectionTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              Saat admin ADMS mengonfirmasi pembayaran, ADMS akan mengirim HTTP POST ke <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs font-mono">callbackUrl</code> yang Anda tentukan saat membuat invoice.
              Request disertai header signature <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs font-mono">X-ADMS-Signature</code> untuk verifikasi keaslian.
            </p>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden mb-5">
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Headers yang Dikirim ADMS</p>
              </div>
              <table className="w-full">
                <tbody>
                  {[
                    { name: 'X-ADMS-Signature', desc: 'HMAC-SHA256 signature. Format: sha256=<hex>. Verifikasi sebelum memproses.' },
                    { name: 'X-ADMS-Event', desc: 'Nama event. Saat ini: payment.paid' },
                    { name: 'Content-Type', desc: 'application/json' },
                    { name: 'User-Agent', desc: 'ADMS-Payment-Gateway/1.0' },
                  ].map(h => (
                    <tr key={h.name} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <td className="py-3 pl-4 pr-4 align-top w-52">
                        <code className="text-xs font-mono font-bold text-[#0D1B2A] dark:text-[#C9A84C]">{h.name}</code>
                      </td>
                      <td className="py-3 pr-4 text-xs text-slate-600 dark:text-slate-400">{h.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Payload Webhook</p>
            <CodeBlock lang="json" code={webhookExample} />

            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mt-5 mb-2">Verifikasi Signature (Node.js)</p>
            <CodeBlock lang="javascript" code={webhookVerify} />

            <div className="mt-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Catatan Pengiriman</p>
              <ul className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                <li className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-[#C9A84C] flex-shrink-0 mt-0.5" /> ADMS mengirim webhook dengan timeout 10 detik</li>
                <li className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-[#C9A84C] flex-shrink-0 mt-0.5" /> Jika gagal, ADMS melakukan 1x retry setelah 3 detik</li>
                <li className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-[#C9A84C] flex-shrink-0 mt-0.5" /> Endpoint Anda harus membalas 2xx dalam 10 detik</li>
                <li className="flex gap-2"><ChevronRight className="w-3.5 h-3.5 text-[#C9A84C] flex-shrink-0 mt-0.5" /> HMAC secret sama dengan JWT_SECRET yang dikonfigurasi admin ADMS</li>
              </ul>
            </div>
          </section>

          <Divider />

          {/* Statuses */}
          <section id="statuses" className="scroll-mt-24 pb-20">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-[#C9A84C]" />
              <span className="text-[11px] font-black text-[#C9A84C] uppercase tracking-widest">Referensi</span>
            </div>
            <SectionTitle id="statuses">Status Transaksi</SectionTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Seluruh kemungkinan nilai field <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs font-mono">status</code> pada response.</p>
            <div className="grid gap-3">
              {[
                { status: 'PENDING', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800', desc: 'Invoice dibuat, menunggu pembayaran dari customer.' },
                { status: 'PAID', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', desc: 'Pembayaran telah dikonfirmasi oleh admin ADMS. Webhook sudah dikirim ke callbackUrl.' },
                { status: 'EXPIRED', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700', desc: 'Invoice melewati batas waktu tanpa pembayaran (default 15 menit).' },
                { status: 'CANCELLED', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800', desc: 'Invoice dibatalkan secara manual oleh admin ADMS.' },
                { status: 'FAILED', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800', desc: 'Pembayaran gagal di proses.' },
              ].map(s => (
                <div key={s.status} className="flex items-start gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                  <span className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-black tracking-widest border flex-shrink-0 ${s.color}`}>{s.status}</span>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-0.5">{s.desc}</p>
                </div>
              ))}
            </div>
          </section>

        </main>
      </div>
    </div>
  );
};
