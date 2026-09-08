const CACHE='order-system-store-20260908-tenant-1';
const STATIC=['./','./index.html','./order.html','./app.css','./enhancements.css','./config.js','./admin.js','./admin-enhancements.js','./admin-ledger-enhancements.js','./admin-branding.css','./admin-branding.js','./admin-qr.js','./qr-vendor-core.js','./qr-vendor-rs.js','./qr-vendor-util.js','./qr-vendor-code.js','./qr-generator.js','./order.js','./manifest.webmanifest','./icon.svg','./offline.html'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(STATIC)));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))));self.clients.claim()});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.hostname.endsWith('supabase.co'))return;
  if(url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy))}return response}).catch(()=>caches.match(event.request).then(hit=>hit||caches.match('./offline.html'))));
    return;
  }
  event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy))}return response}).catch(()=>caches.match(event.request)));
});
