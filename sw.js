/* Service worker: la app abre sin señal (en el parque o en la nacelle). */
const VERSION='commissioning-v2';
const SHELL=['./','index.html','fx.css','fx.js','firebase-config.js','manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>Promise.all(SHELL.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
 const req=e.request;if(req.method!=='GET')return;
 const url=new URL(req.url);
 /* Datos (Firestore, login, clima): directo; Firestore ya maneja su propio modo sin conexión. */
 if(/googleapis\.com|firebaseio|identitytoolkit|securetoken|open-meteo/.test(url.hostname))return;
 if(url.origin===location.origin){
  /* Archivos propios: primero la red (así llegan las actualizaciones); sin señal, la copia guardada. */
  /* Con señal mala la red puede colgarse: si en 4 s no respondió y hay copia, se usa la copia (la red sigue y la actualiza). */
  const net=fetch(req).then(r=>{if(r.ok){const cp=r.clone();caches.open(VERSION).then(c=>c.put(req,cp))}return r});
  const tout=new Promise(res=>setTimeout(()=>res(null),4000));
  e.respondWith(Promise.race([net.catch(()=>null),tout]).then(r=>r||caches.match(req).then(c=>c||net.catch(()=>(req.mode==='navigate'?caches.match('index.html'):Response.error())))));
  return}
 /* Librerías externas (Firebase SDK, QR, Excel): copia guardada primero. */
 if(/gstatic\.com|cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net/.test(url.hostname)){
  e.respondWith(caches.match(req).then(r=>r||fetch(req).then(res=>{if(res.ok||res.type==='opaque'){const cp=res.clone();caches.open(VERSION).then(c=>c.put(req,cp))}return res})))}
});
