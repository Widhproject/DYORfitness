const V='dyor-v2',SHELL=['/','/offline.html','/manifest.webmanifest','/icon-192.png']
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)));self.skipWaiting()})
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))));self.clients.claim()})
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);if(r.method!=='GET'||u.origin!==location.origin)return   // Supabase & font: langsung jaringan
 if(r.mode==='navigate'){e.respondWith(fetch(r).then(res=>{const c=res.clone();caches.open(V).then(x=>x.put('/',c));return res}).catch(()=>caches.match('/').then(x=>x||caches.match('/offline.html'))));return}
 // Berkas statis yang hilang dijawab Netlify dengan halaman HTML (status 200); jangan simpan jawaban itu sebagai gambar/skrip
 e.respondWith(caches.match(r).then(hit=>hit||fetch(r).then(res=>{if(res.ok&&!(res.headers.get('content-type')||'').includes('text/html')){const c=res.clone();caches.open(V).then(x=>x.put(r,c))}return res})))})
