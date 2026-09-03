const CACHE='crispday-admin-v10-1';
const APP_SHELL=[
  './install-v10.html',
  './admin-v9.html',
  './order-v9.html',
  './offline-v10.html',
  './app-icon-v10.svg',
  './manifest-admin-v10.webmanifest'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);

  if(url.hostname.endsWith('supabase.co')){
    event.respondWith(fetch(req));
    return;
  }

  if(req.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const fresh=await fetch(req);
        const cache=await caches.open(CACHE);
        cache.put(req,fresh.clone());
        return fresh;
      }catch(_){
        const cached=await caches.match(req);
        return cached || await caches.match('./offline-v10.html');
      }
    })());
    return;
  }

  if(url.origin===self.location.origin){
    event.respondWith((async()=>{
      const cached=await caches.match(req);
      const network=fetch(req).then(async fresh=>{
        const cache=await caches.open(CACHE);
        cache.put(req,fresh.clone());
        return fresh;
      }).catch(()=>null);
      return cached || await network || new Response('',{status:504,statusText:'Offline'});
    })());
  }
});
