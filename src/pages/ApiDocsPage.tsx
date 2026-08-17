import React, { useState, useRef, useEffect } from 'react';
import {
  Code2, Shield, Webhook, Play, Copy, Check, Lock,
  Globe, ChevronRight, BookOpen, Zap, AlertTriangle, ArrowRight,
  Key, FileText, CheckCircle, Clock, RefreshCw, Info,
  Terminal, Server, AlertCircle, ExternalLink, Database, UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

type Env = 'production' | 'sandbox';
type Tab = 'curl' | 'laravel' | 'react';
type Section =
  | 'quickstart'
  | 'get-api-key'
  | 'auth'
  | 'create-payment'
  | 'get-by-invoice'
  | 'webhook'
  | 'laravel'
  | 'react-integration'
  | 'statuses'
  | 'errors';

const BASE_URLS: Record<Env, string> = {
  production: 'http://91.98.225.235:3010',
  sandbox: 'http://91.98.225.235:3010',
};

const NAV_ITEMS: { id: Section; label: string; icon: React.ElementType; group: string }[] = [
  { id: 'quickstart',        label: 'Quick Start',       icon: Zap,         group: 'Panduan' },
  { id: 'get-api-key',       label: 'Cara Dapat API Key',icon: Key,         group: 'Panduan' },
  { id: 'auth',              label: 'Autentikasi',        icon: Lock,        group: 'Panduan' },
  { id: 'create-payment',    label: 'Buat Invoice',       icon: FileText,    group: 'API Endpoints' },
  { id: 'get-by-invoice',    label: 'Cek Status',         icon: BookOpen,    group: 'API Endpoints' },
  { id: 'webhook',           label: 'Webhook Callback',   icon: Webhook,     group: 'API Endpoints' },
  { id: 'laravel',           label: 'Integrasi Laravel',  icon: Server,      group: 'Panduan Integrasi' },
  { id: 'react-integration', label: 'Integrasi React/JS', icon: Globe,       group: 'Panduan Integrasi' },
  { id: 'statuses',          label: 'Status Transaksi',   icon: CheckCircle, group: 'Referensi' },
  { id: 'errors',            label: 'Kode Error',         icon: AlertCircle, group: 'Referensi' },
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

function CodeBlock({ code, lang = 'bash', label }: { code: string; lang?: string; label?: string }) {
  const displayLang = label || lang;
  return (
    <div className="relative bg-[#0D1B2A] rounded-xl border border-[#1E3A5F] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1E3A5F]">
        <span className="text-[11px] font-bold text-[#C9A84C] uppercase tracking-widest">{displayLang}</span>
        <CopyButton text={code} />
      </div>
      <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed whitespace-pre">{code}</pre>
    </div>
  );
}

function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-lg font-black text-[#0D1B2A] dark:text-slate-100 mb-1 flex items-center gap-2 scroll-mt-24">
      {children}
    </h2>
  );
}

function Divider() {
  return <div className="border-t border-slate-100 dark:border-slate-800 my-10" />;
}

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { key: Tab; label: string }[] = [
    { key: 'curl', label: 'cURL' },
    { key: 'laravel', label: 'Laravel (PHP)' },
    { key: 'react', label: 'React / JS' },
  ];
  return (
    <div className="flex gap-1 mb-2 flex-wrap">
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)}
          className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
            active === t.key
              ? 'bg-[#C9A84C] text-[#0D1B2A]'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

function InfoBox({ children, variant = 'info' }: { children: React.ReactNode; variant?: 'info' | 'warn' | 'tip' }) {
  const styles = {
    info: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
    warn: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300',
    tip: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300',
  };
  const icons = { info: Info, warn: AlertTriangle, tip: CheckCircle };
  const Icon = icons[variant];
  return (
    <div className={`flex gap-3 border rounded-xl p-4 ${styles[variant]}`}>
      <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <div className="text-xs leading-relaxed">{children}</div>
    </div>
  );
}

export const ApiDocsPage: React.FC = () => {
  const { user } = useAuth();
  const [env, setEnv] = useState<Env>('production');
  const [activeSection, setActiveSection] = useState<Section>('quickstart');
  const [codeTab, setCodeTab] = useState<Tab>('curl');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [tryResult, setTryResult] = useState<Record<string, any>>({});
  const [tryLoading, setTryLoading] = useState<Record<string, boolean>>({});
  const [tryOpen, setTryOpen] = useState<Record<string, boolean>>({});
  const baseUrl = BASE_URLS[env];
  const displayKey = apiKeyInput || 'adms_sk_live_YOUR_KEY_HERE';

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id as Section); }),
      { rootMargin: '-20% 0px -70% 0px' }
    );
    NAV_ITEMS.forEach(({ id }) => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: Section) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const tryRequest = async (endpointId: string, method: string, path: string, body?: any) => {
    setTryLoading(p => ({ ...p, [endpointId]: true }));
    setTryResult(p => ({ ...p, [endpointId]: null }));
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKeyInput) {
        headers['x-api-key'] = apiKeyInput;
        headers['X-Idempotency-Key'] = `try-it-${endpointId}-${Date.now()}`;
      }
      const res = await fetch(`${baseUrl}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
      const json = await res.json();
      setTryResult(p => ({ ...p, [endpointId]: { status: res.status, data: json } }));
    } catch (e: any) {
      setTryResult(p => ({ ...p, [endpointId]: { status: 0, data: { error: e.message } } }));
    } finally {
      setTryLoading(p => ({ ...p, [endpointId]: false }));
    }
  };

  const [tryCreateBody, setTryCreateBody] = useState({
    amount: '150000',
    customerName: 'Budi Santoso',
    customerPhone: '081234567890',
    description: 'Pembayaran SPP Juli 2026',
    callbackUrl: '',
    sourceSystem: 'NAMA_SISTEM',
  });
  const [tryGetInvoice, setTryGetInvoice] = useState('INV-20260817-000001');

  const groups = [...new Set(NAV_ITEMS.map(i => i.group))];

  // ── Code Examples ──────────────────────────────────────────────
  const curlCreate = `curl -X POST ${baseUrl}/api/v1/payments \\
  -H "x-api-key: ${displayKey}" \\
  -H "X-Idempotency-Key: order-001-$(date +%s)" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 150000,
    "customerName": "Budi Santoso",
    "customerPhone": "081234567890",
    "description": "Pembayaran SPP Juli 2026",
    "sourceSystem": "SIMAK",
    "callbackUrl": "https://sistem-anda.com/webhook/adms"
  }'`;

  const laravelCreate = `// app/Services/AdmsService.php
use Illuminate\\Support\\Facades\\Http;
use Illuminate\\Support\\Str;

class AdmsService
{
    public function createPayment(array $data, string $idempotencyKey): array
    {
        return Http::withHeaders([
                'x-api-key'          => config('services.adms.api_key'),
                'X-Idempotency-Key'  => $idempotencyKey,
            ])
            ->post(config('services.adms.url') . '/api/v1/payments', $data)
            ->throw()
            ->json();
    }
}

// Dalam Controller Anda:
$idempotencyKey = 'order-' . $order->id . '-' . time();

$result = $adms->createPayment([
    'amount'        => $order->total,
    'customerName'  => $order->customer_name,
    'customerPhone' => $order->customer_phone,
    'description'   => 'Pembayaran SPP Juli 2026',
    'sourceSystem'  => 'SIMAK',
    'callbackUrl'   => route('webhook.adms'),
], $idempotencyKey);

// Simpan invoice number, lalu redirect customer
$order->update(['invoice_number' => $result['data']['invoiceNumber']]);
return redirect($result['data']['paymentLink']);`;

  const reactCreate = `// ⚠️ API Key TIDAK boleh ada di React frontend!
// Buat endpoint di backend Anda yang meneruskan ke ADMS.

// --- SERVER SIDE (Express/Node.js) ---
// routes/payment.js
app.post('/api/payment/create', async (req, res) => {
  const idempotencyKey = \`order-\${req.body.orderId || Date.now()}-\${Date.now()}\`;

  const response = await fetch(
    \`\${process.env.ADMS_URL}/api/v1/payments\`,
    {
      method: 'POST',
      headers: {
        'x-api-key':          process.env.ADMS_API_KEY,
        'X-Idempotency-Key':  idempotencyKey,
        'Content-Type':       'application/json',
      },
      body: JSON.stringify({
        ...req.body,
        sourceSystem: 'WEB_UTAMA',
        callbackUrl: \`\${process.env.APP_URL}/webhook/adms\`,
      }),
    }
  );
  const data = await response.json();
  res.json(data);
});

// --- REACT CLIENT ---
async function handleBayar(order) {
  const res = await fetch('/api/payment/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: order.total,
      customerName: user.name,
      customerPhone: user.phone,
      description: \`Tagihan Order #\${order.id}\`,
    }),
  });
  const data = await res.json();
  if (data.success) {
    // Redirect ke halaman QR ADMS
    window.location.href = data.data.paymentLink;
  }
}`;

  const curlGetInvoice = `curl -X GET "${baseUrl}/api/v1/payments/invoice/${tryGetInvoice}" \\
  -H "x-api-key: ${displayKey}"`;

  const laravelGetInvoice = `// Cek status pembayaran berdasarkan invoice number
$result = Http::withHeaders(['x-api-key' => config('services.adms.api_key')])
    ->get(config('services.adms.url') . '/api/v1/payments/invoice/' . $invoiceNumber)
    ->throw()
    ->json();

$status = $result['data']['status']; // 'PENDING' | 'PAID' | 'EXPIRED'

if ($status === 'PAID') {
    // Tandai order sebagai lunas
    $order->update(['status' => 'paid']);
}`;

  const reactGetInvoice = `// Di server Express — proxy ke ADMS dengan x-api-key
app.get('/api/payment/status/:invoiceNumber', async (req, res) => {
  const response = await fetch(
    \`\${process.env.ADMS_URL}/api/v1/payments/invoice/\${req.params.invoiceNumber}\`,
    { headers: { 'x-api-key': process.env.ADMS_API_KEY } }
  );
  res.json(await response.json());
});

// Di React — polling status dari backend Anda sendiri
async function checkStatus(invoiceNumber) {
  const res = await fetch(\`/api/payment/status/\${invoiceNumber}\`);
  return res.json();
}

// React hook dengan polling setiap 5 detik
function usePaymentStatus(invoiceNumber) {
  const [status, setStatus] = React.useState('PENDING');

  React.useEffect(() => {
    const interval = setInterval(async () => {
      const data = await checkStatus(invoiceNumber);
      setStatus(data.status);
      if (data.status !== 'PENDING') clearInterval(interval);
    }, 5000);
    return () => clearInterval(interval);
  }, [invoiceNumber]);

  return status;
}`;

  const webhookPayload = `// Headers yang dikirim ADMS ke callbackUrl Anda:
// X-ADMS-Signature: sha256=<hmac-hex>
// X-ADMS-Event:     payment.paid
// Content-Type:     application/json

// Payload (JSON Body):
{
  "event":         "payment.paid",
  "invoiceNumber": "INV-20260817-000042",
  "amount":        150000,
  "customerName":  "Budi Santoso",
  "customerPhone": "081234567890",
  "description":   "Pembayaran SPP Juli 2026",
  "sourceSystem":  "SIMAK",
  "paidAt":        "2026-08-17T10:30:00.000Z"
}`;

  const webhookLaravel = `// routes/api.php
Route::post('/webhook/adms', [WebhookController::class, 'handle'])
     ->withoutMiddleware(\\App\\Http\\Middleware\\VerifyCsrfToken::class);

// app/Http/Controllers/WebhookController.php
class WebhookController extends Controller
{
    public function handle(Request $request)
    {
        // 1. Verifikasi signature
        $signature = $request->header('X-ADMS-Signature', '');
        $payload   = $request->getContent();
        $secret    = config('services.adms.webhook_secret');
        $expected  = 'sha256=' . hash_hmac('sha256', $payload, $secret);

        if (!hash_equals($expected, $signature)) {
            return response('Unauthorized', 401);
        }

        // 2. Proses event
        $data = $request->json()->all();

        if ($data['event'] === 'payment.paid') {
            Order::where('invoice_number', $data['invoiceNumber'])
                ->update([
                    'status'  => 'paid',
                    'paid_at' => now(),
                ]);
        }

        return response('OK', 200);
    }
}`;

  const webhookReact = `// Webhook handler di server Express/Node.js Anda
const crypto = require('crypto');

app.post('/webhook/adms', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-adms-signature'];
  const payload   = req.body.toString();
  const secret    = process.env.ADMS_WEBHOOK_SECRET;

  // Verifikasi HMAC signature
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  if (!crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  )) {
    return res.status(401).send('Unauthorized');
  }

  const data = JSON.parse(payload);

  if (data.event === 'payment.paid') {
    // Update status order di database Anda
    await Order.update(
      { status: 'paid', paid_at: new Date() },
      { where: { invoice_number: data.invoiceNumber } }
    );
  }

  res.status(200).send('OK');
});`;

  return (
    <div className="min-h-screen -m-4 sm:-m-6 lg:-m-8">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-[#0D1B2A] border-b border-[#1E3A5F] px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Code2 className="w-5 h-5 text-[#C9A84C] flex-shrink-0" />
          <span className="text-white font-black text-sm tracking-tight whitespace-nowrap">ADMS Developer Portal</span>
          <span className="text-[10px] font-bold bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/30 px-2 py-0.5 rounded uppercase tracking-widest hidden sm:inline">
            v1.0
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest hidden sm:block">Env</span>
          <div className="flex bg-[#1A2F4A] rounded-lg p-0.5 border border-[#1E3A5F]">
            {(['production', 'sandbox'] as Env[]).map(e => (
              <button key={e} onClick={() => setEnv(e)}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all capitalize ${
                  env === e ? 'bg-[#C9A84C] text-[#0D1B2A]' : 'text-slate-400 hover:text-white'
                }`}>
                {e === 'production' ? 'Production' : 'Sandbox'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Left Sidebar */}
        <aside className="w-60 shrink-0 sticky top-[52px] h-[calc(100vh-52px)] overflow-y-auto bg-[#0D1B2A] border-r border-[#1E3A5F] py-6 hidden lg:block">
          <div className="px-4 mb-6">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">API Key Anda</p>
            <input
              type="text"
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              placeholder="adms_sk_live_..."
              className="w-full bg-[#1A2F4A] border border-[#1E3A5F] text-slate-300 text-[11px] font-mono rounded-lg px-3 py-2 focus:outline-none focus:border-[#C9A84C] placeholder-slate-600 transition-colors"
            />
            <p className="text-[10px] text-slate-600 mt-1">Untuk fitur "Try It Out"</p>
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
                      <button key={item.id} onClick={() => scrollTo(item.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left ${
                          isActive
                            ? 'bg-[#C9A84C]/15 text-[#C9A84C] border-l-2 border-[#C9A84C]'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}>
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
        <main className="flex-1 max-w-3xl px-6 lg:px-10 py-10 space-y-0">

          {/* ── QUICK START ── */}
          <section id="quickstart" className="scroll-mt-24">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-[#C9A84C]" />
              <span className="text-[11px] font-black text-[#C9A84C] uppercase tracking-widest">Panduan</span>
            </div>
            <SectionTitle id="quickstart">Quick Start</SectionTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              ADMS QRIS adalah payment gateway internal berbasis QRIS DANA untuk seluruh sistem di organisasi.
              Sistem eksternal (Laravel, React, dll.) mengirim request ke ADMS, mendapat link pembayaran untuk customer,
              lalu menerima notifikasi webhook otomatis saat pembayaran dikonfirmasi admin.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              {[
                { step: '01', title: 'Daftar ke Admin', desc: 'Hubungi admin ADMS. Admin buat API Key untuk sistem Anda di menu "Client Apps".' },
                { step: '02', title: 'Buat Invoice', desc: 'POST ke /api/v1/payments. Dapat paymentLink — kirim ke customer untuk scan QRIS.' },
                { step: '03', title: 'Terima Webhook', desc: 'ADMS POST ke callbackUrl Anda saat admin verifikasi bayar. Verifikasi HMAC, update status.' },
              ].map(s => (
                <div key={s.step} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                  <div className="text-2xl font-black text-[#C9A84C] mb-2">{s.step}</div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">{s.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{s.desc}</div>
                </div>
              ))}
            </div>

            <div className="bg-[#0D1B2A] rounded-xl border border-[#1E3A5F] p-5">
              <p className="text-xs font-bold text-[#C9A84C] mb-4 uppercase tracking-wider">Alur Pembayaran Lengkap</p>
              <div className="flex flex-col gap-3">
                {[
                  { from: 'Sistem Anda', label: 'POST /api/v1/payments', sub: 'Kirim amount, nama customer, callbackUrl', arrow: false },
                  { from: 'ADMS',        label: '201 Created → invoiceNumber + paymentLink', sub: 'Simpan invoiceNumber di database Anda', arrow: true },
                  { from: 'Sistem Anda', label: 'Redirect customer ke paymentLink', sub: 'Customer scan QR DANA di halaman ADMS', arrow: false },
                  { from: 'Admin ADMS',  label: 'Verifikasi pembayaran di portal ADMS', sub: 'Cek mutasi QRIS, klik "Verifikasi"', arrow: false },
                  { from: 'ADMS',        label: 'POST ke callbackUrl Anda', sub: 'Webhook dengan signature HMAC-SHA256', arrow: true },
                  { from: 'Sistem Anda', label: 'Verifikasi HMAC → update status order', sub: 'Balas 200 OK untuk konfirmasi terima', arrow: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${item.arrow ? 'bg-emerald-500/20' : 'bg-[#C9A84C]/20'}`}>
                      {item.arrow
                        ? <ArrowRight className="w-3 h-3 text-emerald-400" />
                        : <ChevronRight className="w-3 h-3 text-[#C9A84C]" />
                      }
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{item.from}</p>
                      <p className="text-xs font-mono text-slate-200">{item.label}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <Divider />

          {/* ── CARA DAPAT API KEY ── */}
          <section id="get-api-key" className="scroll-mt-24">
            <div className="flex items-center gap-2 mb-1">
              <Key className="w-4 h-4 text-[#C9A84C]" />
              <span className="text-[11px] font-black text-[#C9A84C] uppercase tracking-widest">Panduan</span>
            </div>
            <SectionTitle id="get-api-key">Cara Mendapatkan API Key</SectionTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              API Key dibuat oleh admin ADMS. Tim IT/developer sistem lain tidak membuat sendiri — cukup minta ke admin,
              lalu gunakan akun bersama untuk memantau transaksi.
            </p>

            <div className="space-y-4 mb-6">
              {[
                {
                  num: '1',
                  title: 'Admin buka menu "Client Apps"',
                  desc: 'Login sebagai ADMIN ke portal ADMS → sidebar kiri → "Client Apps".',
                  icon: UserCheck,
                },
                {
                  num: '2',
                  title: 'Klik "Daftarkan Aplikasi Baru"',
                  desc: 'Isi nama sistem Anda (contoh: "SIMAK", "Web Hosting", "Aplikasi Keuangan"). Klik "Buat Kunci API".',
                  icon: FileText,
                },
                {
                  num: '3',
                  title: 'Salin API Key — hanya muncul sekali',
                  desc: 'API Key yang muncul hanya ditampilkan satu kali. Salin dan simpan di tempat aman, lalu berikan ke tim developer sistem Anda.',
                  icon: Copy,
                },
                {
                  num: '4',
                  title: 'Pantau lewat akun IT bersama',
                  desc: 'Tim developer login ke portal ADMS untuk melihat semua transaksi dan dokumentasi API.',
                  icon: Database,
                },
              ].map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.num} className="flex gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                    <div className="w-8 h-8 rounded-full bg-[#C9A84C]/15 border border-[#C9A84C]/30 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-[#C9A84C]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-0.5">{s.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-[#0D1B2A] rounded-xl border border-[#1E3A5F] p-5">
              <p className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-widest mb-3">Akun Portal Bersama (Tim IT/Developer)</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#1A2F4A] rounded-lg p-3 border border-[#1E3A5F]">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Email</p>
                  <code className="text-sm font-mono text-[#C9A84C] font-bold">it@adms.gateway</code>
                </div>
                <div className="bg-[#1A2F4A] rounded-lg p-3 border border-[#1E3A5F]">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Password</p>
                  <code className="text-sm font-mono text-[#C9A84C] font-bold">adms123!</code>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-3">
                Akun ini hanya untuk monitoring (baca saja). Tidak bisa membuat invoice atau mengubah data.
              </p>
            </div>
          </section>

          <Divider />

          {/* ── AUTENTIKASI ── */}
          <section id="auth" className="scroll-mt-24">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="w-4 h-4 text-[#C9A84C]" />
              <span className="text-[11px] font-black text-[#C9A84C] uppercase tracking-widest">Panduan</span>
            </div>
            <SectionTitle id="auth">Autentikasi</SectionTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              Semua request ke <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">/api/v1/*</code> memerlukan
              dua header wajib: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">x-api-key</code> dan <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">X-Idempotency-Key</code>.
            </p>
            <CodeBlock lang="http headers" code={`x-api-key: adms_sk_live_YOUR_API_KEY\nX-Idempotency-Key: unique-request-id-anda`} />

            <div className="mt-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden mb-4">
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Headers Wajib</p>
              </div>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="py-3 pl-4 pr-4 align-top w-52">
                      <code className="font-mono font-bold text-[#0D1B2A] dark:text-[#C9A84C]">x-api-key</code>
                      <span className="ml-2 text-[10px] text-rose-500 font-black uppercase">wajib</span>
                    </td>
                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">API Key yang didapat dari portal ADMS (Client Apps).</td>
                  </tr>
                  <tr>
                    <td className="py-3 pl-4 pr-4 align-top">
                      <code className="font-mono font-bold text-[#0D1B2A] dark:text-[#C9A84C]">X-Idempotency-Key</code>
                      <span className="ml-2 text-[10px] text-rose-500 font-black uppercase">wajib</span>
                    </td>
                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">String unik per request untuk mencegah duplikat invoice. Gunakan UUID atau gabungan order_id + timestamp.</td>
                  </tr>
                  <tr>
                    <td className="py-3 pl-4 pr-4 align-top">
                      <code className="font-mono font-bold text-[#0D1B2A] dark:text-[#C9A84C]">Content-Type</code>
                    </td>
                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-400"><code className="font-mono">application/json</code> — untuk request dengan body.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <InfoBox variant="warn">
                <strong>Jaga kerahasiaan API Key.</strong> Simpan di environment variable server-side
                (file <code className="font-mono">.env</code>). Jangan taruh di kode frontend/browser.
              </InfoBox>
              <InfoBox variant="tip">
                Jika API Key bocor, admin/IT bisa Revoke dan buat key baru kapan saja tanpa mengganggu sistem lain.
              </InfoBox>
            </div>

            <div className="mt-5">
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Simpan di .env (wajib)</p>
              <CodeBlock lang=".env" code={`# Tambahkan ke file .env sistem Anda
ADMS_URL=${baseUrl}
ADMS_API_KEY=adms_sk_live_xxxxxxxxxxxxxxxxxxxx
ADMS_WEBHOOK_SECRET=sama_dengan_jwt_secret_adms`} />
            </div>
          </section>

          <Divider />

          {/* ── CREATE PAYMENT ── */}
          <section id="create-payment" className="scroll-mt-24">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-[#C9A84C]" />
              <span className="text-[11px] font-black text-[#C9A84C] uppercase tracking-widest">API Endpoints</span>
            </div>
            <SectionTitle id="create-payment">Buat Invoice Pembayaran</SectionTitle>
            <div className="flex items-center gap-2 mb-4">
              <MethodBadge method="POST" />
              <code className="text-sm font-mono text-slate-600 dark:text-slate-400">/api/v1/payments</code>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              Membuat invoice pembayaran baru. Response berisi <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs font-mono">invoiceNumber</code>{' '}
              dan <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs font-mono">paymentLink</code> — kirimkan link ini ke customer untuk scan QR.
            </p>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden mb-5">
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Request Body (JSON)</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-2 text-left font-bold text-slate-500 text-[10px] uppercase tracking-wider w-48">Field</th>
                      <th className="px-4 py-2 text-left font-bold text-slate-500 text-[10px] uppercase tracking-wider">Deskripsi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {[
                      { name: 'amount', type: 'integer', required: true, desc: 'Nominal dalam Rupiah (IDR). Minimal 1.000.' },
                      { name: 'customerName', type: 'string', required: true, desc: 'Nama lengkap customer.' },
                      { name: 'customerPhone', type: 'string', required: false, desc: 'Nomor telepon customer. Contoh: 081234567890.' },
                      { name: 'description', type: 'string', required: true, desc: 'Keterangan tagihan — tampil di halaman QR customer.' },
                      { name: 'sourceSystem', type: 'string', required: false, desc: 'Nama sistem pengirim (mis. "SIMAK"). Untuk filter log.' },
                      { name: 'callbackUrl', type: 'string (URL)', required: false, desc: 'URL endpoint Anda yang akan di-POST saat pembayaran PAID.' },
                      { name: 'idempotencyKey', type: 'string', required: false, desc: 'Key unik untuk cegah duplikat jika request dikirim ulang.' },
                    ].map(p => (
                      <tr key={p.name}>
                        <td className="py-3 px-4 align-top">
                          <div className="flex items-center gap-2">
                            <code className="font-mono font-bold text-[#0D1B2A] dark:text-[#C9A84C]">{p.name}</code>
                            {p.required && <span className="text-[10px] text-rose-500 font-black uppercase">wajib</span>}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.type}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 leading-relaxed">{p.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <TabBar active={codeTab} onChange={setCodeTab} />
            <CodeBlock
              lang={codeTab === 'curl' ? 'bash' : codeTab === 'laravel' ? 'php' : 'javascript'}
              label={codeTab === 'curl' ? 'cURL' : codeTab === 'laravel' ? 'Laravel (PHP)' : 'Node.js + React'}
              code={codeTab === 'curl' ? curlCreate : codeTab === 'laravel' ? laravelCreate : reactCreate}
            />

            <div className="mt-4">
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Response Sukses — 201 Created</p>
              <CodeBlock lang="json" code={`{
  "success": true,
  "data": {
    "id":            42,
    "invoiceNumber": "INV-20260817-000042",
    "paymentLink":   "${baseUrl}/pay/INV-20260817-000042",
    "amount":        150000,
    "customerName":  "Budi Santoso",
    "status":        "PENDING",
    "expiredAt":     "2026-08-17T11:00:00.000Z"
  }
}`} />
            </div>

            {/* Try It Out */}
            <div className="mt-5 border border-[#C9A84C]/30 rounded-xl overflow-hidden">
              <button onClick={() => setTryOpen(p => ({ ...p, 'create-payment': !p['create-payment'] }))}
                className="w-full flex items-center justify-between px-4 py-3 bg-[#C9A84C]/10 hover:bg-[#C9A84C]/15 transition-colors">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-[#C9A84C]" />
                  <span className="text-sm font-bold text-[#C9A84C]">Try It Out</span>
                </div>
                <ChevronRight className={`w-4 h-4 text-[#C9A84C] transition-transform ${tryOpen['create-payment'] ? 'rotate-90' : ''}`} />
              </button>
              {tryOpen['create-payment'] && (
                <div className="p-4 border-t border-[#C9A84C]/20 bg-white dark:bg-slate-900 space-y-3">
                  {!apiKeyInput && (
                    <InfoBox variant="warn">Masukkan API Key Anda di kolom sidebar kiri untuk menggunakan Try It Out.</InfoBox>
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
                          className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#C9A84C]" />
                      </div>
                    ))}
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                      <input type="text" value={tryCreateBody.description}
                        onChange={e => setTryCreateBody(p => ({ ...p, description: e.target.value }))}
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 focus:outline-none focus:border-[#C9A84C]" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Callback URL (opsional)</label>
                      <input type="url" value={tryCreateBody.callbackUrl}
                        onChange={e => setTryCreateBody(p => ({ ...p, callbackUrl: e.target.value }))}
                        placeholder="https://sistem-anda.com/webhook/adms"
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 focus:outline-none focus:border-[#C9A84C] placeholder-slate-400" />
                    </div>
                  </div>
                  <button
                    onClick={() => tryRequest('create-payment', 'POST', '/api/v1/payments', {
                      amount: parseInt(tryCreateBody.amount),
                      customerName: tryCreateBody.customerName,
                      customerPhone: tryCreateBody.customerPhone || undefined,
                      description: tryCreateBody.description,
                      sourceSystem: tryCreateBody.sourceSystem || undefined,
                      callbackUrl: tryCreateBody.callbackUrl || undefined,
                    })}
                    disabled={tryLoading['create-payment'] || !apiKeyInput}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0D1B2A] hover:bg-[#1A2F4A] text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {tryLoading['create-payment'] ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    Kirim Request
                  </button>
                  {tryResult['create-payment'] && (
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase mb-1">
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

          {/* ── GET BY INVOICE ── */}
          <section id="get-by-invoice" className="scroll-mt-24">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-[#C9A84C]" />
              <span className="text-[11px] font-black text-[#C9A84C] uppercase tracking-widest">API Endpoints</span>
            </div>
            <SectionTitle id="get-by-invoice">Cek Status Pembayaran</SectionTitle>
            <div className="flex items-center gap-2 mb-4">
              <MethodBadge method="GET" />
              <code className="text-sm font-mono text-slate-600 dark:text-slate-400">/api/v1/payments/invoice/:invoiceNumber</code>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              Mengambil detail dan status terkini berdasarkan <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs font-mono">invoiceNumber</code>.
              Gunakan ini untuk polling status jika tidak menggunakan webhook.
            </p>

            <TabBar active={codeTab} onChange={setCodeTab} />
            <CodeBlock
              lang={codeTab === 'curl' ? 'bash' : codeTab === 'laravel' ? 'php' : 'javascript'}
              label={codeTab === 'curl' ? 'cURL' : codeTab === 'laravel' ? 'Laravel (PHP)' : 'React / JS'}
              code={codeTab === 'curl' ? curlGetInvoice : codeTab === 'laravel' ? laravelGetInvoice : reactGetInvoice}
            />

            <div className="mt-4">
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Response Sukses — 200 OK</p>
              <CodeBlock lang="json" code={`{
  "success": true,
  "data": {
    "id":            42,
    "invoiceNumber": "INV-20260817-000042",
    "amount":        150000,
    "customerName":  "Budi Santoso",
    "status":        "PAID",
    "paidAt":        "2026-08-17T10:30:00.000Z",
    "sourceSystem":  "SIMAK",
    "expiredAt":     "2026-08-17T11:00:00.000Z"
  }
}`} />
            </div>

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

          {/* ── WEBHOOK ── */}
          <section id="webhook" className="scroll-mt-24">
            <div className="flex items-center gap-2 mb-1">
              <Webhook className="w-4 h-4 text-[#C9A84C]" />
              <span className="text-[11px] font-black text-[#C9A84C] uppercase tracking-widest">API Endpoints</span>
            </div>
            <SectionTitle id="webhook">Webhook Callback</SectionTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              Saat admin ADMS memverifikasi pembayaran, ADMS otomatis mengirim HTTP POST ke{' '}
              <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs font-mono">callbackUrl</code> yang Anda tentukan.
              Setiap request disertai header signature <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs font-mono">X-ADMS-Signature</code>{' '}
              — selalu verifikasi sebelum memproses.
            </p>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden mb-5">
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Headers yang Dikirim ADMS</p>
              </div>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[
                    { name: 'X-ADMS-Signature', desc: 'sha256=<hmac-hex> — verifikasi sebelum proses.' },
                    { name: 'X-ADMS-Event', desc: 'Nama event. Saat ini: payment.paid' },
                    { name: 'Content-Type', desc: 'application/json' },
                    { name: 'User-Agent', desc: 'ADMS-Payment-Gateway/1.0' },
                  ].map(h => (
                    <tr key={h.name}>
                      <td className="py-3 pl-4 pr-4 align-top w-52">
                        <code className="font-mono font-bold text-[#0D1B2A] dark:text-[#C9A84C]">{h.name}</code>
                      </td>
                      <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">{h.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Payload &amp; Cara Verifikasi</p>
            <TabBar active={codeTab} onChange={setCodeTab} />
            <CodeBlock
              lang={codeTab === 'curl' ? 'json' : codeTab === 'laravel' ? 'php' : 'javascript'}
              label={codeTab === 'curl' ? 'Webhook Payload' : codeTab === 'laravel' ? 'Laravel (PHP)' : 'Node.js / Express'}
              code={codeTab === 'curl' ? webhookPayload : codeTab === 'laravel' ? webhookLaravel : webhookReact}
            />

            <div className="mt-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Aturan Pengiriman Webhook</p>
              {[
                'ADMS mengirim webhook dengan timeout 10 detik.',
                'Jika gagal (timeout / non-2xx), ADMS retry 1x setelah 3 detik.',
                'Endpoint Anda wajib membalas HTTP 2xx dalam 10 detik.',
                'ADMS_WEBHOOK_SECRET sama dengan JWT_SECRET yang dikonfigurasi di server ADMS.',
                'Gunakan raw body (bukan parsed JSON) saat menghitung HMAC agar tidak ada perbedaan whitespace.',
              ].map((note, i) => (
                <div key={i} className="flex gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <ChevronRight className="w-3.5 h-3.5 text-[#C9A84C] flex-shrink-0 mt-0.5" />
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </section>

          <Divider />

          {/* ── INTEGRASI LARAVEL ── */}
          <section id="laravel" className="scroll-mt-24">
            <div className="flex items-center gap-2 mb-1">
              <Server className="w-4 h-4 text-[#C9A84C]" />
              <span className="text-[11px] font-black text-[#C9A84C] uppercase tracking-widest">Panduan Integrasi</span>
            </div>
            <SectionTitle id="laravel">Integrasi Laravel (PHP)</SectionTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Panduan lengkap mengintegrasikan ADMS QRIS ke aplikasi Laravel menggunakan HTTP facade bawaan Laravel.
              Tidak perlu install package tambahan.
            </p>

            <div className="space-y-6">
              <div>
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">1. Tambahkan ke .env</p>
                <CodeBlock lang=".env" code={`ADMS_URL=${baseUrl}
ADMS_API_KEY=adms_sk_live_xxxxxxxxxxxxxxxxxxxx
ADMS_WEBHOOK_SECRET=sama_dengan_jwt_secret_adms`} />
              </div>

              <div>
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">2. Daftarkan di config/services.php</p>
                <CodeBlock lang="php" code={`// config/services.php
return [
    // ... services lain
    'adms' => [
        'url'            => env('ADMS_URL', '${baseUrl}'),
        'api_key'        => env('ADMS_API_KEY'),
        'webhook_secret' => env('ADMS_WEBHOOK_SECRET'),
    ],
];`} />
              </div>

              <div>
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">3. Buat Service Class</p>
                <CodeBlock lang="php" code={`<?php
// app/Services/AdmsService.php
namespace App\\Services;

use Illuminate\\Support\\Facades\\Http;

class AdmsService
{
    private string $url;
    private string $key;

    public function __construct()
    {
        $this->url = config('services.adms.url');
        $this->key = config('services.adms.api_key');
    }

    /** Buat invoice pembayaran baru */
    public function createPayment(array $data): array
    {
        return Http::withToken($this->key)
            ->post("{$this->url}/api/v1/payments", $data)
            ->throw()   // lempar exception jika response 4xx/5xx
            ->json();
    }

    /** Cek status pembayaran */
    public function getPayment(string $invoiceNumber): array
    {
        return Http::withToken($this->key)
            ->get("{$this->url}/api/v1/payments/invoice/{$invoiceNumber}")
            ->throw()
            ->json();
    }

    /** Verifikasi HMAC signature dari webhook */
    public function verifyWebhook(string $rawPayload, string $signature): bool
    {
        $secret   = config('services.adms.webhook_secret');
        $expected = 'sha256=' . hash_hmac('sha256', $rawPayload, $secret);
        return hash_equals($expected, $signature);
    }
}`} />
              </div>

              <div>
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">4. Controller — Buat Invoice & Redirect</p>
                <CodeBlock lang="php" code={`<?php
// app/Http/Controllers/PaymentController.php
namespace App\\Http\\Controllers;

use Illuminate\\Http\\Request;
use App\\Services\\AdmsService;
use App\\Models\\Order;

class PaymentController extends Controller
{
    public function createInvoice(Request $request, AdmsService $adms)
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
        ]);

        $order = Order::findOrFail($validated['order_id']);

        $result = $adms->createPayment([
            'amount'        => $order->total,
            'customerName'  => $order->customer_name,
            'customerPhone' => $order->customer_phone,
            'description'   => "Pembayaran Order #{$order->id}",
            'sourceSystem'  => 'SIMAK',               // nama sistem Anda
            'callbackUrl'   => route('webhook.adms'), // URL webhook
        ]);

        if (!$result['success']) {
            return back()->withErrors('Gagal membuat invoice.');
        }

        // Simpan invoice number ke database
        $order->update([
            'invoice_number' => $result['data']['invoiceNumber'],
            'payment_status' => 'pending',
        ]);

        // Redirect customer ke halaman QRIS
        return redirect($result['data']['paymentLink']);
    }
}`} />
              </div>

              <div>
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">5. Webhook Handler</p>
                <CodeBlock lang="php" code={`// routes/api.php — tambahkan route webhook
Route::post('/webhook/adms', [WebhookController::class, 'handle'])
     ->name('webhook.adms')
     ->withoutMiddleware(\\App\\Http\\Middleware\\VerifyCsrfToken::class);

// ─────────────────────────────────────────────────────
// app/Http/Controllers/WebhookController.php
class WebhookController extends Controller
{
    public function handle(Request $request, AdmsService $adms)
    {
        // Verifikasi signature — gunakan RAW body, bukan parsed JSON
        $signature = $request->header('X-ADMS-Signature', '');
        $rawBody   = $request->getContent();

        if (!$adms->verifyWebhook($rawBody, $signature)) {
            \\Log::warning('[ADMS Webhook] Invalid signature', compact('signature'));
            return response('Unauthorized', 401);
        }

        $data  = $request->json()->all();
        $event = $data['event'] ?? '';

        \\Log::info("[ADMS Webhook] {$event}", ['invoice' => $data['invoiceNumber']]);

        if ($event === 'payment.paid') {
            Order::where('invoice_number', $data['invoiceNumber'])
                ->update([
                    'payment_status' => 'paid',
                    'paid_at'        => now(),
                ]);

            // Opsional: kirim notifikasi ke user, update stok, dll.
        }

        return response('OK', 200);
    }
}`} />
              </div>
            </div>

            <div className="mt-4">
              <InfoBox variant="tip">
                Gunakan <code className="font-mono">Http::withToken()</code> dari Laravel — ini otomatis menambahkan
                header <code className="font-mono">Authorization: Bearer ...</code>. Pastikan jalankan{' '}
                <code className="font-mono">php artisan config:cache</code> setelah update <code className="font-mono">.env</code> di production.
              </InfoBox>
            </div>
          </section>

          <Divider />

          {/* ── INTEGRASI REACT/JS ── */}
          <section id="react-integration" className="scroll-mt-24">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-4 h-4 text-[#C9A84C]" />
              <span className="text-[11px] font-black text-[#C9A84C] uppercase tracking-widest">Panduan Integrasi</span>
            </div>
            <SectionTitle id="react-integration">Integrasi React / Next.js</SectionTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Karena API Key harus tersimpan di server, React frontend tidak boleh memanggil ADMS langsung.
              Pola yang benar: buat API route di backend Anda (Express, Next.js API Route, dll.) sebagai perantara.
            </p>

            <InfoBox variant="warn">
              <strong>Jangan simpan API Key di React/Vite environment variable yang di-expose ke browser</strong> (VITE_*).
              Siapapun yang inspect source code bisa mencurinya. Gunakan environment variable di server saja.
            </InfoBox>

            <div className="mt-6 space-y-6">
              <div>
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">1. Backend perantara (Express/Node.js)</p>
                <CodeBlock lang="javascript" code={`// .env (server-side only, jangan commit ke git!)
ADMS_URL=${baseUrl}
ADMS_API_KEY=adms_sk_live_xxxxxxxxxxxxxxxxxxxx
ADMS_WEBHOOK_SECRET=sama_dengan_jwt_secret_adms

// routes/payment.js
const express = require('express');
const router  = express.Router();

// POST /api/payment/create
router.post('/create', async (req, res) => {
  try {
    const response = await fetch(
      \`\${process.env.ADMS_URL}/api/v1/payments\`,
      {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${process.env.ADMS_API_KEY}\`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...req.body,
          sourceSystem: 'WEB_UTAMA',
          callbackUrl:  \`\${process.env.APP_URL}/api/webhook/adms\`,
        }),
      }
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal membuat invoice.' });
  }
});

// GET /api/payment/status/:invoiceNumber
router.get('/status/:invoiceNumber', async (req, res) => {
  const response = await fetch(
    \`\${process.env.ADMS_URL}/api/v1/payments/invoice/\${req.params.invoiceNumber}\`,
    { headers: { 'Authorization': \`Bearer \${process.env.ADMS_API_KEY}\` } }
  );
  res.json(await response.json());
});

module.exports = router;`} />
              </div>

              <div>
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">2. React Hook — Buat Pembayaran</p>
                <CodeBlock lang="jsx" code={`// hooks/useAdmsPayment.js
import { useState } from 'react';

export function useAdmsPayment() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState(null);

  async function createPayment({ amount, customerName, customerPhone, description }) {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, customerName, customerPhone, description }),
      });
      const data = await res.json();

      if (data.success) {
        // Simpan invoiceNumber ke state/localStorage untuk cek status nanti
        localStorage.setItem('lastInvoice', data.data.invoiceNumber);

        // Redirect customer ke halaman QR ADMS
        window.location.href = data.data.paymentLink;
      } else {
        setError(data.message || 'Gagal membuat invoice.');
      }
    } catch {
      setError('Terjadi kesalahan jaringan.');
    } finally {
      setIsLoading(false);
    }
  }

  return { createPayment, isLoading, error };
}`} />
              </div>

              <div>
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">3. Komponen Tombol Bayar</p>
                <CodeBlock lang="jsx" code={`// components/PayButton.jsx
import { useAdmsPayment } from '../hooks/useAdmsPayment';

export function PayButton({ order }) {
  const { createPayment, isLoading, error } = useAdmsPayment();

  return (
    <div>
      {error && (
        <p className="text-red-500 text-sm mb-2">{error}</p>
      )}
      <button
        onClick={() => createPayment({
          amount:        order.total,
          customerName:  order.customerName,
          customerPhone: order.customerPhone,
          description:   \`Tagihan Order #\${order.id}\`,
        })}
        disabled={isLoading}
        className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold disabled:opacity-50"
      >
        {isLoading ? 'Memproses...' : 'Bayar via QRIS'}
      </button>
    </div>
  );
}`} />
              </div>

              <div>
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">4. Polling Status (setelah bayar)</p>
                <CodeBlock lang="jsx" code={`// hooks/usePaymentStatus.js — polling setiap 5 detik
import { useState, useEffect } from 'react';

export function usePaymentStatus(invoiceNumber) {
  const [status, setStatus]       = useState('PENDING');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!invoiceNumber) return;

    const check = async () => {
      const res  = await fetch(\`/api/payment/status/\${invoiceNumber}\`);
      const data = await res.json();
      if (data.success) setStatus(data.data.status);
      setIsLoading(false);
    };

    check();
    const interval = setInterval(() => {
      check().then(() => {
        if (status === 'PAID' || status === 'EXPIRED') {
          clearInterval(interval);
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [invoiceNumber]);

  return { status, isLoading };
}

// Penggunaan di komponen:
function PaymentStatus({ invoiceNumber }) {
  const { status, isLoading } = usePaymentStatus(invoiceNumber);

  if (isLoading) return <p>Memeriksa status...</p>;

  return (
    <div>
      {status === 'PAID'    && <p className="text-green-600">Pembayaran lunas!</p>}
      {status === 'PENDING' && <p className="text-amber-600">Menunggu pembayaran...</p>}
      {status === 'EXPIRED' && <p className="text-gray-500">Invoice kedaluwarsa.</p>}
    </div>
  );
}`} />
              </div>
            </div>
          </section>

          <Divider />

          {/* ── STATUS TRANSAKSI ── */}
          <section id="statuses" className="scroll-mt-24">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-[#C9A84C]" />
              <span className="text-[11px] font-black text-[#C9A84C] uppercase tracking-widest">Referensi</span>
            </div>
            <SectionTitle id="statuses">Status Transaksi</SectionTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              Semua kemungkinan nilai field <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs font-mono">status</code>.
            </p>
            <div className="grid gap-3">
              {[
                { status: 'PENDING',   color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',         icon: Clock,         desc: 'Invoice dibuat, menunggu pembayaran dari customer. Berlaku 15 menit (default).' },
                { status: 'PAID',      color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', icon: CheckCircle,  desc: 'Pembayaran dikonfirmasi admin ADMS. Webhook sudah dikirim ke callbackUrl Anda.' },
                { status: 'EXPIRED',   color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',               icon: Clock,        desc: 'Invoice melewati batas waktu tanpa pembayaran. Buat invoice baru.' },
                { status: 'CANCELLED', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',                  icon: AlertCircle,  desc: 'Dibatalkan manual oleh admin ADMS.' },
                { status: 'FAILED',    color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800',                        icon: AlertCircle,  desc: 'Pembayaran gagal diproses.' },
              ].map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.status} className="flex items-start gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-black tracking-widest border ${s.color}`}>{s.status}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1">{s.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <Divider />

          {/* ── KODE ERROR ── */}
          <section id="errors" className="scroll-mt-24 pb-20">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-[#C9A84C]" />
              <span className="text-[11px] font-black text-[#C9A84C] uppercase tracking-widest">Referensi</span>
            </div>
            <SectionTitle id="errors">Kode Error</SectionTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              Format error response selalu konsisten. Field <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs font-mono">success: false</code>{' '}
              disertai <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs font-mono">message</code>.
            </p>

            <CodeBlock lang="json" code={`// Contoh response error
{
  "success": false,
  "message": "API Key tidak valid atau sudah dicabut."
}`} />

            <div className="mt-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">HTTP Status Code</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {[
                      { code: '200', label: 'OK', desc: 'Request berhasil.' },
                      { code: '201', label: 'Created', desc: 'Invoice baru berhasil dibuat.' },
                      { code: '400', label: 'Bad Request', desc: 'Parameter wajib tidak lengkap atau format salah (mis. amount bukan angka).' },
                      { code: '401', label: 'Unauthorized', desc: 'API Key tidak ada, salah, atau sudah di-revoke. Periksa header Authorization.' },
                      { code: '404', label: 'Not Found', desc: 'Invoice tidak ditemukan. Periksa invoiceNumber atau ID.' },
                      { code: '409', label: 'Conflict', desc: 'Invoice dengan idempotencyKey yang sama sudah ada.' },
                      { code: '429', label: 'Too Many Requests', desc: 'Rate limit terlampaui. Kurangi frekuensi request.' },
                      { code: '500', label: 'Internal Server Error', desc: 'Kesalahan di server ADMS. Coba lagi dalam beberapa detik.' },
                    ].map(e => (
                      <tr key={e.code}>
                        <td className="py-3 pl-4 pr-4 align-top w-24">
                          <span className={`inline-flex px-2 py-0.5 rounded font-mono font-black text-[11px] ${
                            e.code.startsWith('2') ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            e.code.startsWith('4') ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>{e.code}</span>
                        </td>
                        <td className="py-3 pr-4 align-top w-32">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{e.label}</span>
                        </td>
                        <td className="py-3 pr-4 text-slate-500 dark:text-slate-400 leading-relaxed">{e.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
};
