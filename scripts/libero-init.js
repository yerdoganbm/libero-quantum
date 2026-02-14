#!/usr/bin/env node
/**
 * npx libero-init
 * Proje kökünde çalıştır: framework tespit eder, .env.example ve entegrasyon dosyası oluşturur.
 */

const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
const pkgPath = path.join(cwd, 'package.json');

let pkg = {};
try {
  pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
} catch (e) {
  console.error('package.json bulunamadı. Proje kökünde çalıştırın.');
  process.exit(1);
}

const deps = { ...pkg.dependencies, ...(pkg.devDependencies || {}) };
let framework = 'vanilla';
if (deps.react) framework = 'react';
else if (deps.vue) framework = 'vue';
else if (deps.svelte) framework = 'svelte';

const appName = pkg.name || 'myapp';

// .env.example
const envExample = `# Libero Neuro-Core (opsiyonel - yoksa dev modda localStorage kuyruğu)
NEURO_APP_NAME=${appName}
NEURO_API_URL=https://api.libero.dev/api
# veya kendi sunucunuz: http://localhost:3001/api
`;
const envPath = path.join(cwd, '.env.example');
if (!fs.existsSync(path.join(cwd, '.env'))) {
  fs.writeFileSync(envPath, envExample);
  console.log('+ .env.example');
}

// neuro-init.js (framework-agnostic init - script tag kullanır)
const initJs = `/**
 * Libero Neuro-Core - tek script ile entegrasyon
 * Bu dosya libero-init tarafından oluşturuldu.
 * index.html'e ekleyin: <script src="https://unpkg.com/libero-quantum/dist/neuro.js" data-app="' + appName + '"></script>
 * veya kendi host'unuzdaki neuro.js
 */
(function(){
  if (typeof window === 'undefined') return;
  var script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/gh/yerdoganbm/libero-quantum@main/dist/neuro.js';
  script.setAttribute('data-app', '${appName}');
  script.setAttribute('data-api', '');
  document.head.appendChild(script);
  script.onload = function() { if (window.Neuro) window.Neuro.ready(); };
})();
`;

// Framework-specific instructions
const instructions = {
  react: `
2 SATIR EKLE (App.jsx veya main.jsx en üstüne):

  import { initNeuroCore } from './neuro-init-react';
  initNeuroCore({ appName: '${appName}' });

neuro-init-react.jsx oluşturuldu - projeye kopyalayın veya aşağıyı kullanın.
`,
  vue: `
2 SATIR EKLE (main.js):

  import { initNeuro } from './neuro-init-vue';
  app.use(initNeuro, { appName: '${appName}' });

Vue için: lib/neuro-core-vue.ts dosyasını projeye kopyalayıp neuro-init-vue.js olarak export edin.
`,
  svelte: `
2 SATIR EKLE (main.js veya App.svelte):

  import { initNeuroCore } from './neuro-init-svelte';
  initNeuroCore({ appName: '${appName}' });

Svelte için: lib/neuro-core-svelte.ts dosyasını projeye kopyalayın.
`,
  vanilla: `
1 SATIR (index.html <head> içine):

  <script src="https://cdn.jsdelivr.net/gh/yerdoganbm/libero-quantum@main/dist/neuro.js" data-app="${appName}"></script>

API key opsiyonel. Kendi sunucunuz: data-api="http://localhost:3001/api"
`
};

// Create React init file (standalone - no package dependency)
const reactInit = `// neuro-init-react.jsx - Libero Neuro-Core (2 satır)
const LIBERO_CDN = 'https://cdn.jsdelivr.net/gh/yerdoganbm/libero-quantum@main/dist/neuro.js';
export function initNeuroCore(config) {
  if (typeof window === 'undefined') return;
  const appName = config?.appName || 'myapp';
  const apiUrl = config?.apiUrl || config?.apiKey || '';
  const script = document.createElement('script');
  script.src = LIBERO_CDN;
  script.setAttribute('data-app', appName);
  if (apiUrl) script.setAttribute('data-api', apiUrl);
  document.head.appendChild(script);
  script.onload = () => window.Neuro && window.Neuro.ready();
}
`;

const reactInitPath = path.join(cwd, 'neuro-init-react.jsx');
if (framework === 'react' && !fs.existsSync(reactInitPath)) {
  fs.writeFileSync(reactInitPath, reactInit);
  console.log('+ neuro-init-react.jsx');
}

console.log('\n🧠 Libero Neuro-Core init tamamlandı.');
console.log('  Framework:', framework);
console.log('  App name:', appName);
console.log(instructions[framework]);
console.log('  Kontrol: Tarayıcı konsolunda Neuro.check() veya Neuro.ready()\n');
