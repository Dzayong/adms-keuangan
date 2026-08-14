const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

walk('./src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. Change Primary Yellow to Elegant Indigo
    content = content.replace(/bg-yellow-500/g, 'bg-indigo-600');
    content = content.replace(/hover:bg-yellow-400/g, 'hover:bg-indigo-700');
    content = content.replace(/bg-yellow-50/g, 'bg-indigo-50');
    content = content.replace(/bg-yellow-100/g, 'bg-indigo-100');
    
    content = content.replace(/text-yellow-500/g, 'text-indigo-600');
    content = content.replace(/text-yellow-600/g, 'text-indigo-700');
    content = content.replace(/text-yellow-800/g, 'text-indigo-900');
    content = content.replace(/hover:text-yellow-500/g, 'hover:text-indigo-600');
    
    content = content.replace(/border-yellow-500/g, 'border-indigo-600');
    content = content.replace(/border-yellow-200/g, 'border-indigo-200');
    
    content = content.replace(/focus:border-yellow-500/g, 'focus:border-indigo-600');
    content = content.replace(/focus:ring-yellow-500/g, 'focus:ring-indigo-600');

    // 2. Change Global Background to a cleaner slate-50 (from slate-100)
    // But only in App.tsx or index.css. Wait, bg-slate-100 is used on elements too. 
    // Let's safely do it in App.tsx for the main background.
    if (filePath.endsWith('App.tsx')) {
        content = content.replace(/bg-slate-100/g, 'bg-slate-50');
    }

    // 3. Change Sidebar/Navbar deep dark to Indigo-950 for a premium look
    if (filePath.endsWith('Sidebar.tsx') || filePath.endsWith('Navbar.tsx')) {
        content = content.replace(/bg-slate-900/g, 'bg-slate-950'); 
        // slate-950 is super elegant.
    }

    // 4. Fix text colors on the new Indigo buttons
    content = content.replace(/className=(['"])(.*?)\1/g, (match, quote, classes) => {
      let classArray = classes.split(/\s+/);
      
      if (classArray.includes('bg-indigo-600') || classArray.includes('bg-slate-900')) {
        // Change text-slate-900 or text-slate-800 to text-white
        classArray = classArray.map(c => {
            if (c === 'text-slate-900' || c === 'text-slate-800') return 'text-white';
            return c;
        });
      }
      
      return `className=${quote}${classArray.join(' ')}${quote}`;
    });

    if (original !== content) {
      fs.writeFileSync(filePath, content);
      console.log('Updated:', filePath);
    }
  }
});
