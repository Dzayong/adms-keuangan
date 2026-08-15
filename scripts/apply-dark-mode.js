import fs from 'fs';
import path from 'path';

const dir = 'f:/FOLDER AFIFAH/Antigravity Projects/adms-qris/src/pages';

const replacements = [
  { from: /\bbg-white\b/g, to: 'bg-white dark:bg-slate-950' },
  { from: /\bborder-slate-200\b/g, to: 'border-slate-200 dark:border-slate-800' },
  { from: /\btext-slate-800\b/g, to: 'text-slate-800 dark:text-slate-200' },
  { from: /\btext-slate-900\b/g, to: 'text-slate-900 dark:text-slate-100' },
  { from: /\btext-slate-700\b/g, to: 'text-slate-700 dark:text-slate-300' },
  { from: /\btext-slate-600\b/g, to: 'text-slate-600 dark:text-slate-400' },
  { from: /\btext-slate-500\b/g, to: 'text-slate-500 dark:text-slate-400' },
  { from: /\bborder-slate-100\b/g, to: 'border-slate-100 dark:border-slate-800' },
  { from: /\bbg-slate-50\b/g, to: 'bg-slate-50 dark:bg-slate-900' },
  { from: /\bbg-slate-100\b/g, to: 'bg-slate-100 dark:bg-slate-800' },
  { from: /\bhover:bg-slate-50\b/g, to: 'hover:bg-slate-50 dark:hover:bg-slate-800' },
  { from: /\bhover:bg-slate-100\b/g, to: 'hover:bg-slate-100 dark:hover:bg-slate-800' },
  { from: /\bbg-indigo-50\b/g, to: 'bg-indigo-50 dark:bg-indigo-950/30' },
  { from: /\bbg-emerald-50\b/g, to: 'bg-emerald-50 dark:bg-emerald-950/30' },
  { from: /\bbg-rose-50\b/g, to: 'bg-rose-50 dark:bg-rose-950/30' },
  { from: /\bborder-indigo-200\b/g, to: 'border-indigo-200 dark:border-indigo-900/50' },
  { from: /\bborder-emerald-200\b/g, to: 'border-emerald-200 dark:border-emerald-900/50' },
  { from: /\bborder-rose-200\b/g, to: 'border-rose-200 dark:border-rose-900/50' },
];

function processDir(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Avoid double replacing if script is run twice
      if (content.includes('dark:bg-slate-950') && content.includes('bg-white dark:bg-slate-950')) {
          console.log(`Skipping (already processed): ${file}`);
          continue;
      }

      let modified = content;
      for (const req of replacements) {
        modified = modified.replace(req.from, req.to);
      }
      
      if (modified !== content) {
        fs.writeFileSync(fullPath, modified, 'utf8');
        console.log(`Updated: ${file}`);
      }
    }
  }
}

processDir(dir);

// Also do components/common and components/ui
processDir('f:/FOLDER AFIFAH/Antigravity Projects/adms-qris/src/components/common');
processDir('f:/FOLDER AFIFAH/Antigravity Projects/adms-qris/src/components/ui');
