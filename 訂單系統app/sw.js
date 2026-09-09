const CACHE_PREFIX='order-system-core-';
const CACHE=CACHE_PREFIX+'20260908-p1-2d';
const STATIC=[
  './app.css','./enhancements.css','./admin-branding.css','./config.js',
  './admin.js','./admin-enhancements.js','./admin-ledger-enhancements.js','./admin-qr.js','./admin-branding.js',
  './order.js','./qr-vendor-core.js','./qr-vendor-rs.js','./qr-vendor-util.js','./qr-vendor-code.js','./qr-generator.js',
  './manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./offline.html'
];
const STATIC_URLS=new Set(STATIC.map(path=>new URL(path,self.registration.scope).href));
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(STATIC)));
  self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>
    (key.startsWith(CACHE_PREFIX)&&key!==CACHE)||key.endsWith('-store-20260904-6')
  ).map(key=>caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.hostname.endsWith('supabase.co'))return;
  if(url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).catch(()=>caches.match('./offline.html')));
    return;
  }
  if(!STATIC_URLS.has(url.href))return;
  event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
    return response;
  })));
});
